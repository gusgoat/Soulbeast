-- Additive sandbox schema. No game save, Coupons, engine RPC or auth setting is modified.
begin;
create table if not exists public.sb_shop_characters (
 account_id uuid not null references auth.users(id), game_env text not null check(game_env in ('live','test')),
 code text not null check(code ~ '^[A-Z0-9]{12,16}$'), name text not null,
 created_at timestamptz not null default now(), primary key(game_env,code)
);
create table if not exists public.sb_shop_test_packs (
 id text primary key, coupons integer not null check(coupons>0), amount_satang integer not null check(amount_satang>0),
 promotion boolean not null, price_id text unique not null
);
insert into public.sb_shop_test_packs(id,coupons,amount_satang,promotion,price_id) values
/* PAYMENT_PACK_VALUES */
on conflict(id) do nothing;
create table if not exists public.sb_shop_test_orders (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references auth.users(id), request_id uuid not null,
 pack_id text not null references public.sb_shop_test_packs(id), game_env text not null, code text not null,
 coupons integer not null check(coupons>0), amount_satang integer not null check(amount_satang>0), price_id text not null, promotion boolean not null,
 status text not null default 'creating' check(status in ('creating','open','credited','expired')),
 session_id text unique, checkout_url text, payment_intent text unique,
 created_at timestamptz not null default now(), credited_at timestamptz, unique(account_id,request_id),
 foreign key(game_env,code) references public.sb_shop_characters(game_env,code)
);
create unique index if not exists sb_shop_test_one_promotion on public.sb_shop_test_orders(account_id,pack_id) where promotion and status <> 'expired';
create table if not exists public.sb_shop_test_credits (
 order_id uuid primary key references public.sb_shop_test_orders(id), account_id uuid not null references auth.users(id),
 game_env text not null, code text not null, coupons integer not null check(coupons>0),
 session_id text unique not null, payment_intent text unique not null, created_at timestamptz not null default now()
);
alter table public.sb_shop_characters enable row level security;
alter table public.sb_shop_test_packs enable row level security;
alter table public.sb_shop_test_orders enable row level security;
alter table public.sb_shop_test_credits enable row level security;
revoke all on public.sb_shop_characters,public.sb_shop_test_packs,public.sb_shop_test_orders,public.sb_shop_test_credits from public,anon,authenticated;
grant all on public.sb_shop_characters,public.sb_shop_test_packs,public.sb_shop_test_orders,public.sb_shop_test_credits to service_role;

create or replace function public.sb_shop_test_command(p_action text,p_account uuid,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.sb_shop_test_orders%rowtype; p public.sb_shop_test_packs%rowtype; owner_id uuid;
begin
 if not exists(select 1 from auth.users where id=p_account and email_confirmed_at is not null and deleted_at is null) then raise exception 'verified_account_required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('sb-shop-test:'||p_account::text,0));
 if p_action='status' then
  return jsonb_build_object('characters',coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at) from public.sb_shop_characters c where c.account_id=p_account),'[]'::jsonb),
   'orders',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.sb_shop_test_orders where account_id=p_account order by created_at desc limit 50)x),'[]'::jsonb),
   'balances',coalesce((select jsonb_agg(to_jsonb(x)) from (select game_env,code,sum(coupons)::integer coupons from public.sb_shop_test_credits where account_id=p_account group by game_env,code)x),'[]'::jsonb),
   'promotions',coalesce((select jsonb_agg(jsonb_build_object('pack_id',pack_id,'status',status)) from public.sb_shop_test_orders where account_id=p_account and promotion and status<>'expired'),'[]'::jsonb));
 elsif p_action='link' then
  -- Edge Function must verify the existing save PIN before this service-only command.
  insert into public.sb_shop_characters(account_id,game_env,code,name) values(p_account,p_data->>'game_env',p_data->>'code',left(p_data->>'name',100)) on conflict(game_env,code) do nothing;
  select account_id into owner_id from public.sb_shop_characters where game_env=p_data->>'game_env' and code=p_data->>'code';
  if owner_id is distinct from p_account then raise exception 'character_already_linked'; end if;
  return jsonb_build_object('linked',true);
 elsif p_action='reserve' then
  select * into p from public.sb_shop_test_packs where id=p_data->>'pack_id';
  if not found then raise exception 'unknown_pack'; end if;
  if not exists(select 1 from public.sb_shop_characters where account_id=p_account and game_env=p_data->>'game_env' and code=p_data->>'code') then raise exception 'character_not_linked'; end if;
  select * into o from public.sb_shop_test_orders where account_id=p_account and request_id=(p_data->>'request_id')::uuid;
  if found then
   if o.pack_id<>p.id or o.game_env<>p_data->>'game_env' or o.code<>p_data->>'code' then raise exception 'request_changed'; end if;
   return to_jsonb(o);
  end if;
  if p.promotion then
   select * into o from public.sb_shop_test_orders where account_id=p_account and pack_id=p.id and status<>'expired';
   if found then return to_jsonb(o); end if;
  end if;
  if (select count(*) from public.sb_shop_test_orders where account_id=p_account and created_at>now()-interval '1 hour')>=20 then raise exception 'order_rate_limit'; end if;
  insert into public.sb_shop_test_orders(account_id,request_id,pack_id,game_env,code,coupons,amount_satang,price_id,promotion)
   values(p_account,(p_data->>'request_id')::uuid,p.id,p_data->>'game_env',p_data->>'code',p.coupons,p.amount_satang,p.price_id,p.promotion) returning * into o;
  return to_jsonb(o);
 end if;
 select * into o from public.sb_shop_test_orders where id=(p_data->>'order_id')::uuid and account_id=p_account for update;
 if not found then raise exception 'order_not_found'; end if;
 if p_action='get' then return to_jsonb(o);
 elsif p_action='bind' then
  if o.session_id is not null and o.session_id<>p_data->>'session_id' then raise exception 'session_changed'; end if;
  if p_data->>'session_id' !~ '^cs_test_' or p_data->>'checkout_url' !~ '^https://checkout\.stripe\.com/' then raise exception 'bad_session'; end if;
  if o.status='creating' then update public.sb_shop_test_orders set session_id=p_data->>'session_id',checkout_url=p_data->>'checkout_url',status='open' where id=o.id returning * into o; end if;
  return to_jsonb(o);
 elsif p_action='expire' then
  if o.status='credited' then return to_jsonb(o); end if;
  if o.session_id is null or o.session_id<>p_data->>'session_id' then raise exception 'session_mismatch'; end if;
  update public.sb_shop_test_orders set status='expired',checkout_url=null where id=o.id returning * into o;
  return to_jsonb(o);
 elsif p_action='credit' then
  if o.session_id is null or o.session_id<>p_data->>'session_id' or o.amount_satang<>(p_data->>'amount_satang')::integer or o.price_id<>p_data->>'price_id' or p_data->>'payment_intent' !~ '^pi_' then raise exception 'payment_mismatch'; end if;
  if o.status='credited' then
   if o.payment_intent<>p_data->>'payment_intent' then raise exception 'payment_changed'; end if;
   return to_jsonb(o);
  end if;
  if o.status<>'open' then raise exception 'order_not_open'; end if;
  insert into public.sb_shop_test_credits(order_id,account_id,game_env,code,coupons,session_id,payment_intent)
   values(o.id,o.account_id,o.game_env,o.code,o.coupons,o.session_id,p_data->>'payment_intent');
  update public.sb_shop_test_orders set status='credited',payment_intent=p_data->>'payment_intent',credited_at=now(),checkout_url=null where id=o.id returning * into o;
  return to_jsonb(o);
 end if;
 raise exception 'bad_shop_action';
end;
$$;
revoke all on function public.sb_shop_test_command(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.sb_shop_test_command(text,uuid,jsonb) to service_role;
commit;
