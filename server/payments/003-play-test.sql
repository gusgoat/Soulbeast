-- Prepared migration. TEST environment only; does not enable checkout or change the live game.
begin;
create table if not exists public.sb_billing_packs (
 id text primary key, product_id text unique not null, coupons integer not null check(coupons between 1 and 10000), promotion boolean not null
);
insert into public.sb_billing_packs values
/* PLAY_PACK_VALUES */
on conflict(id) do nothing;
create table if not exists public.sb_billing_orders (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references auth.users(id), request_id uuid not null,
 provider text not null check(provider in ('google_play','stripe')), game_env text not null default 'test' check(game_env='test'),
 code text not null, pack_id text not null references public.sb_billing_packs(id), product_id text not null,
 package_name text not null check(package_name='com.soulbeastgame.app'), account_hash text not null check(account_hash ~ '^[a-f0-9]{64}$'),
 coupons integer not null check(coupons between 1 and 10000), promotion boolean not null,
 status text not null default 'reserved' check(status in ('reserved','granted','consumed')), token_hash text unique,
 provider_order text, created_at timestamptz not null default now(), credited_at timestamptz,
 unique(account_id,request_id), unique(provider,provider_order), foreign key(game_env,code) references public.sb_player_characters(game_env,code)
);
-- Shared reservation/entitlement for a future verified Stripe adapter too. No expiry releases a paid/pending promotion.
create unique index if not exists sb_billing_promo_once on public.sb_billing_orders(account_id,pack_id) where promotion;
create table if not exists public.sb_billing_grants (
 order_id uuid primary key references public.sb_billing_orders(id), token_hash text unique not null,
 coupons integer not null check(coupons>0), before_balance integer not null, after_balance integer not null,
 created_at timestamptz not null default now(), check(after_balance=before_balance+coupons)
);
alter table public.sb_billing_packs enable row level security;
alter table public.sb_billing_orders enable row level security;
alter table public.sb_billing_grants enable row level security;
revoke all on public.sb_billing_packs,public.sb_billing_orders,public.sb_billing_grants from public,anon,authenticated;
grant all on public.sb_billing_packs,public.sb_billing_orders,public.sb_billing_grants to service_role;
create or replace function public.sb_play_test_command(p_action text,p_account uuid,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.sb_billing_orders%rowtype; p public.sb_billing_packs%rowtype; committed jsonb;
begin
 if not exists(select 1 from auth.users where id=p_account and email_confirmed_at is not null and deleted_at is null) then raise exception 'verified_account_required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('sb-billing-test:'||p_account::text,0));
 if p_action='status' then
  return jsonb_build_object('orders',coalesce((select jsonb_agg(jsonb_build_object('id',id,'code',code,'pack',pack_id,'productId',product_id,'status',status) order by created_at desc) from (select * from public.sb_billing_orders where account_id=p_account order by created_at desc limit 100)x),'[]'::jsonb),
   'promotions',coalesce((select jsonb_agg(pack_id) from public.sb_billing_orders where account_id=p_account and promotion),'[]'::jsonb));
 elsif p_action='reserve' then
  if p_data->>'provider' not in ('google_play','stripe') then raise exception 'wrong_payment_provider'; end if;
  if not exists(select 1 from public.sb_player_characters where account_id=p_account and game_env='test' and code=p_data->>'code' and status='active') then raise exception 'character_not_owned'; end if;
  select * into p from public.sb_billing_packs where id=p_data->>'pack_id'; if not found then raise exception 'unknown_pack'; end if;
  select * into o from public.sb_billing_orders where account_id=p_account and request_id=(p_data->>'request_id')::uuid;
  if found then
   if o.code<>p_data->>'code' or o.pack_id<>p.id or o.provider<>p_data->>'provider' then raise exception 'request_changed'; end if;
   return to_jsonb(o);
  end if;
  if p.promotion then
   select * into o from public.sb_billing_orders where account_id=p_account and pack_id=p.id;
   if found then
    if o.status='reserved' and o.code=p_data->>'code' and o.provider=p_data->>'provider' then return to_jsonb(o); end if;
    raise exception 'promotion_unavailable';
   end if;
   -- Existing Stripe Sandbox is simulation-only; retain its spent promo when preparing shared test fulfillment.
   if exists(select 1 from public.sb_shop_test_orders where account_id=p_account and pack_id=p.id and status<>'expired') then raise exception 'promotion_unavailable'; end if;
  end if;
  if (select count(*) from public.sb_billing_orders where account_id=p_account and created_at>now()-interval '1 hour')>=20 then raise exception 'order_rate_limit'; end if;
  insert into public.sb_billing_orders(account_id,request_id,provider,code,pack_id,product_id,package_name,account_hash,coupons,promotion)
   values(p_account,(p_data->>'request_id')::uuid,p_data->>'provider',p_data->>'code',p.id,p.product_id,'com.soulbeastgame.app',p_data->>'account_hash',p.coupons,p.promotion) returning * into o;
  return to_jsonb(o);
 end if;
 select * into o from public.sb_billing_orders where id=(p_data->>'order_id')::uuid and account_id=p_account for update;
 if not found then raise exception 'order_not_found'; end if;
 if p_action='get' then return to_jsonb(o);
 elsif p_action='grant' then
  if o.provider<>'google_play' or p_data->>'token_hash' !~ '^[a-f0-9]{64}$' or coalesce(p_data->>'provider_order','')='' then raise exception 'invalid_purchase_binding'; end if;
  if o.status<>'reserved' then
   if o.token_hash is distinct from p_data->>'token_hash' or o.provider_order is distinct from p_data->>'provider_order' then raise exception 'purchase_token_changed'; end if;
   return jsonb_build_object('order',to_jsonb(o));
  end if;
  if (p_data->>'after')::integer<>(p_data->>'before')::integer+o.coupons or (p_data->>'before')::integer<0 or (p_data->>'after')::integer>1000000000 then raise exception 'invalid_coupon_balance'; end if;
  if jsonb_typeof(p_data->'changes'->'Coupons')<>'array' or (select count(*) from jsonb_object_keys(p_data->'changes'))<>1 then raise exception 'invalid_coupon_changes'; end if;
  -- Engine revision CAS protects against simultaneous draws/saves. Commit + grant ledger share this SQL transaction.
  committed:=public.sb_engine_commit(p_env:='test',p_expected:=(p_data->>'expected')::bigint,p_request:='play-credit-'||o.id::text,p_digest:=p_data->>'token_hash',p_changes:=p_data->'changes',p_result:=jsonb_build_object('ok',true,'orderId',o.id));
  if coalesce((committed->>'conflict')::boolean,false) then return jsonb_build_object('conflict',true); end if;
  if committed ? 'error' or not (committed ? 'result') then raise exception 'engine_commit_failed'; end if;
  insert into public.sb_billing_grants(order_id,token_hash,coupons,before_balance,after_balance) values(o.id,p_data->>'token_hash',o.coupons,(p_data->>'before')::integer,(p_data->>'after')::integer);
  update public.sb_billing_orders set status='granted',token_hash=p_data->>'token_hash',provider_order=p_data->>'provider_order',credited_at=now() where id=o.id returning * into o;
  return jsonb_build_object('order',to_jsonb(o));
 elsif p_action='consumed' then
  if o.status='reserved' or o.token_hash is distinct from p_data->>'token_hash' then raise exception 'grant_required'; end if;
  update public.sb_billing_orders set status='consumed' where id=o.id returning * into o;return to_jsonb(o);
 end if;
 raise exception 'bad_billing_action';
end;
$$;
revoke all on function public.sb_play_test_command(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.sb_play_test_command(text,uuid,jsonb) to service_role;
-- Both paths use the same account lock, including Stripe orders created by the existing sandbox RPC.
create or replace function public.sb_billing_stripe_promo_guard() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.promotion then
  perform pg_advisory_xact_lock(hashtextextended('sb-billing-test:'||new.account_id::text,0));
  if exists(select 1 from public.sb_billing_orders where account_id=new.account_id and pack_id=new.pack_id and promotion) then raise exception 'promotion_unavailable'; end if;
 end if;
 return new;
end;
$$;
revoke all on function public.sb_billing_stripe_promo_guard() from public,anon,authenticated;
create or replace trigger sb_billing_stripe_promotion before insert on public.sb_shop_test_orders for each row execute function public.sb_billing_stripe_promo_guard();
commit;
