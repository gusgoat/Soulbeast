-- Additive: no test billing table, game environment, balance, or account is migrated.
begin;
create table if not exists public.sb_pay_settings (
 id boolean primary key default true check(id), game_env text not null check(game_env in ('test','live')),
 stripe_enabled boolean not null default false, play_enabled boolean not null default false
);
insert into public.sb_pay_settings(id,game_env) values(true,'test') on conflict do nothing;
create table if not exists public.sb_pay_packs (
 id text primary key, coupons integer not null check(coupons between 1 and 10000),
 amount_satang integer not null check(amount_satang>0), promotion boolean not null,
 product_id text unique not null, stripe_price_id text unique, active boolean not null default true
);
insert into public.sb_pay_packs(id,coupons,amount_satang,promotion,product_id) values
/* PRODUCTION_PACK_VALUES */
on conflict do nothing;
create table if not exists public.sb_pay_accounts (
 account_id uuid primary key references auth.users(id), debt integer not null default 0 check(debt>=0),
 updated_at timestamptz not null default now()
);
create table if not exists public.sb_pay_orders (
 id uuid primary key default gen_random_uuid(),account_id uuid not null references auth.users(id),request_id uuid not null,
 provider text not null check(provider in ('stripe','google_play')),game_env text not null check(game_env in ('test','live')),
 code text not null,pack_id text not null references public.sb_pay_packs(id),coupons integer not null check(coupons>0),
 amount_satang integer not null,product_id text not null,stripe_price_id text,promotion boolean not null,
 account_hash text not null check(account_hash ~ '^[a-f0-9]{64}$'),
 status text not null default 'reserved' check(status in ('reserved','open','pending','credited','refunded','disputed','expired')),
 session_id text unique,checkout_url text,payment_intent text unique,provider_order text,
 token_hash text unique,purchase_token text,settled boolean not null default false,consumed boolean not null default false,voided boolean not null default false,
 entitlement integer not null default 0 check(entitlement>=0 and entitlement<=coupons),
 financial_revision bigint not null default 0,last_checked_at timestamptz,created_at timestamptz not null default now(),
 unique(account_id,request_id),unique(provider,provider_order),
 foreign key(game_env,code) references public.sb_player_characters(game_env,code)
);
create unique index if not exists sb_pay_promotion_once on public.sb_pay_orders(account_id,pack_id) where promotion and status<>'expired';
create table if not exists public.sb_pay_deletion_requests (id uuid primary key default gen_random_uuid(),account_id uuid unique not null references auth.users(id),requested_at timestamptz not null default now(),status text not null default 'requested' check(status in ('requested','completed')));
create table if not exists public.sb_pay_ledger (
 id bigint generated always as identity primary key,order_id uuid not null references public.sb_pay_orders(id),
 financial_revision bigint not null,entitlement integer not null,delta integer not null,
 before_balance integer not null,after_balance integer not null,debt_before integer not null,debt_after integer not null,
 created_at timestamptz not null default now(),unique(order_id,financial_revision)
);
create index if not exists sb_pay_reconcile_queue on public.sb_pay_orders(last_checked_at nulls first) where status<>'expired';
create or replace function public.sb_pay_command(p_action text,p_account uuid default null,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.sb_pay_orders%rowtype;p public.sb_pay_packs%rowtype;cfg public.sb_pay_settings%rowtype;
 debt_now integer;target integer;change integer;expected_balance integer;next_debt integer;committed jsonb;rev bigint;
begin
 select * into cfg from public.sb_pay_settings where id;
 if p_action='settings' then return to_jsonb(cfg)||jsonb_build_object('stripe_prices_ready',(select count(*)=8 from public.sb_pay_packs where active and stripe_price_id ~ '^price_'));end if;
 -- Worker actions are callable only by service_role; no token/secret reaches browser RPCs.
 if p_action='queue' then return coalesce((select jsonb_agg(to_jsonb(x)) from
  (select * from public.sb_pay_orders where status<>'expired' and
   (status in ('reserved','open','pending') or (provider='google_play' and not consumed) or last_checked_at is null or last_checked_at<now()-interval '6 hours')
   order by last_checked_at nulls first,created_at limit 40)x),'[]'::jsonb);end if;
 if p_action='locate' then
  select * into o from public.sb_pay_orders where
   (p_data->>'order_id' is not null and id::text=p_data->>'order_id') or
   (p_data->>'session_id' is not null and session_id=p_data->>'session_id') or
   (p_data->>'payment_intent' is not null and payment_intent=p_data->>'payment_intent') or
   (p_data->>'token_hash' is not null and token_hash=p_data->>'token_hash') limit 1;
  return case when found then to_jsonb(o) else null end;
 end if;
 if p_account is null then raise exception 'verified_account_required';end if;
 perform pg_advisory_xact_lock(hashtextextended('sb-pay-production:'||p_account::text,0));
 insert into public.sb_pay_accounts(account_id) values(p_account) on conflict do nothing;
 select debt into debt_now from public.sb_pay_accounts where account_id=p_account for update;
 if p_action='request_delete' then
  if not exists(select 1 from auth.users where id=p_account and email_confirmed_at is not null and deleted_at is null) or p_data->>'confirmed'<>'true' then raise exception 'deletion_confirmation_required';end if;
  insert into public.sb_pay_deletion_requests(account_id) values(p_account) on conflict(account_id) do nothing;
  return jsonb_build_object('requested',true,'request_id',(select id from public.sb_pay_deletion_requests where account_id=p_account));
 end if;
 if p_action='status' then return jsonb_build_object('debt',debt_now,
  'characters',coalesce((select jsonb_agg(jsonb_build_object('code',code,'name',name,'game_env',game_env)) from public.sb_player_characters where account_id=p_account and status='active' and game_env=cfg.game_env),'[]'::jsonb),
  'orders',coalesce((select jsonb_agg(to_jsonb(x)-'purchase_token'-'token_hash'-'account_hash') from
   (select * from public.sb_pay_orders where account_id=p_account order by created_at desc limit 100)x),'[]'::jsonb));end if;
 if p_action='reserve' then
  if not exists(select 1 from auth.users where id=p_account and email_confirmed_at is not null and deleted_at is null) then raise exception 'verified_account_required';end if;
  if debt_now>0 then raise exception 'billing_review_required';end if;
  if not ((p_data->>'provider'='stripe' and cfg.stripe_enabled) or (p_data->>'provider'='google_play' and cfg.play_enabled)) then raise exception 'purchases_disabled';end if;
  perform pg_advisory_xact_lock(hashtextextended('sb-player:'||p_account::text,0));
  if not exists(select 1 from public.sb_player_characters where account_id=p_account and game_env=cfg.game_env and code=p_data->>'code' and status='active') then raise exception 'character_not_owned';end if;
  select * into p from public.sb_pay_packs where id=p_data->>'pack_id' and active;if not found then raise exception 'unknown_pack';end if;
  if p_data->>'provider'='stripe' and coalesce(p.stripe_price_id,'') !~ '^price_' then raise exception 'stripe_price_not_configured';end if;
  select * into o from public.sb_pay_orders where account_id=p_account and request_id=(p_data->>'request_id')::uuid;
  if found then
   if o.code<>p_data->>'code' or o.pack_id<>p.id or o.provider<>p_data->>'provider' then raise exception 'request_changed';end if;
   return to_jsonb(o);
  end if;
  if p.promotion then
   select * into o from public.sb_pay_orders where account_id=p_account and pack_id=p.id and promotion and status<>'expired';
   if found then
    if o.provider=p_data->>'provider' and o.code=p_data->>'code' and not o.settled then return to_jsonb(o);end if;
    raise exception 'promotion_unavailable';
   end if;
  end if;
  if (select count(*) from public.sb_pay_orders where account_id=p_account and created_at>now()-interval '1 hour')>=20 then raise exception 'order_rate_limit';end if;
  insert into public.sb_pay_orders(account_id,request_id,provider,game_env,code,pack_id,coupons,amount_satang,product_id,stripe_price_id,promotion,account_hash)
  values(p_account,(p_data->>'request_id')::uuid,p_data->>'provider',cfg.game_env,p_data->>'code',p.id,p.coupons,p.amount_satang,p.product_id,p.stripe_price_id,p.promotion,p_data->>'account_hash') returning * into o;
  return to_jsonb(o);
 end if;
 select * into o from public.sb_pay_orders where id=(p_data->>'order_id')::uuid and account_id=p_account for update;
 if not found then raise exception 'order_not_found';end if;
 if p_action='get' then return to_jsonb(o);
 elsif p_action='bind_stripe' then
  if o.provider<>'stripe' or p_data->>'session_id' !~ '^cs_live_' or p_data->>'checkout_url' !~ '^https://checkout[.]stripe[.]com/' then raise exception 'invalid_purchase_binding';end if;
  if o.session_id is not null and o.session_id<>p_data->>'session_id' then raise exception 'session_changed';end if;
  update public.sb_pay_orders set session_id=p_data->>'session_id',checkout_url=p_data->>'checkout_url',status=case when settled then status else 'open' end where id=o.id returning * into o;
 elsif p_action='bind_play' then
  if o.provider<>'google_play' or p_data->>'token_hash' !~ '^[a-f0-9]{64}$' or length(p_data->>'purchase_token') not between 1 and 4096 then raise exception 'invalid_purchase_binding';end if;
  if o.token_hash is not null and o.token_hash<>p_data->>'token_hash' then raise exception 'purchase_token_changed';end if;
  update public.sb_pay_orders set token_hash=p_data->>'token_hash',purchase_token=p_data->>'purchase_token' where id=o.id returning * into o;
 elsif p_action='settle' then
  -- Caller supplies provider-verified financial state; RPC is never granted to clients.
  if o.provider='stripe' and (o.session_id is null or p_data->>'payment_intent' !~ '^pi_') then raise exception 'invalid_purchase_binding';end if;
  if o.provider='google_play' and (o.token_hash is null or p_data->>'provider_order' !~ '^GPA[.]') then raise exception 'invalid_purchase_binding';end if;
  if o.provider_order is not null and o.provider_order is distinct from p_data->>'provider_order' then raise exception 'purchase_order_changed';end if;
  if o.payment_intent is not null and o.payment_intent is distinct from p_data->>'payment_intent' then raise exception 'purchase_order_changed';end if;
  if (p_data->>'financial_revision')::bigint<>o.financial_revision or (p_data->>'debt_before')::integer<>debt_now then return '{"conflict":true}'::jsonb;end if;
  target:=(p_data->>'entitlement')::integer;
  if target not between 0 and o.coupons or p_data->>'status' not in ('credited','refunded','disputed') then raise exception 'invalid_entitlement';end if;
  change:=target-o.entitlement;
  if change<>0 then
   if (p_data->>'before')::integer<0 or (p_data->>'before')::integer>1000000000 then raise exception 'invalid_coupon_balance';end if;
   if change>=0 then next_debt:=greatest(0,debt_now-change);expected_balance:=(p_data->>'before')::integer+greatest(0,change-debt_now);
   else next_debt:=debt_now+greatest(0,-change-(p_data->>'before')::integer);expected_balance:=greatest(0,(p_data->>'before')::integer+change);end if;
   if (p_data->>'after')::integer<>expected_balance or expected_balance>1000000000 or jsonb_typeof(p_data->'changes'->'Coupons')<>'array' or (select count(*) from jsonb_object_keys(p_data->'changes'))<>1 then raise exception 'invalid_coupon_changes';end if;
   rev:=o.financial_revision+1;
   committed:=public.sb_engine_commit(p_env:=o.game_env,p_expected:=(p_data->>'expected')::bigint,p_request:='pay-prod-'||o.id::text||'-'||rev,p_digest:=md5(p_data::text),p_changes:=p_data->'changes',p_result:=jsonb_build_object('ok',true,'orderId',o.id));
   if coalesce((committed->>'conflict')::boolean,false) then return '{"conflict":true}'::jsonb;end if;
   if committed ? 'error' or not(committed ? 'result') then raise exception 'engine_commit_failed';end if;
   insert into public.sb_pay_ledger(order_id,financial_revision,entitlement,delta,before_balance,after_balance,debt_before,debt_after)
    values(o.id,rev,target,change,(p_data->>'before')::integer,expected_balance,debt_now,next_debt);
   update public.sb_pay_accounts set debt=next_debt,updated_at=now() where account_id=p_account;
  end if;
  update public.sb_pay_orders set settled=true,entitlement=target,status=p_data->>'status',provider_order=p_data->>'provider_order',payment_intent=p_data->>'payment_intent',financial_revision=financial_revision+1,last_checked_at=now() where id=o.id returning * into o;
 elsif p_action='expire' then
  if not o.settled then update public.sb_pay_orders set status='expired',last_checked_at=now() where id=o.id returning * into o;end if;
 elsif p_action='voided' then update public.sb_pay_orders set voided=true where id=o.id returning * into o;
 elsif p_action='pending' then
  update public.sb_pay_orders set status=case when settled then status else 'pending' end,last_checked_at=now() where id=o.id returning * into o;
 elsif p_action='consumed' then
  if not o.settled or o.provider<>'google_play' then raise exception 'grant_required';end if;
  update public.sb_pay_orders set consumed=true,last_checked_at=now() where id=o.id returning * into o;
 elsif p_action='checked' then update public.sb_pay_orders set last_checked_at=now() where id=o.id returning * into o;
 else raise exception 'bad_billing_action';end if;
 return to_jsonb(o);
end $$;
revoke all on function public.sb_pay_command(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.sb_pay_command(text,uuid,jsonb) to service_role;
do $$declare t text;begin
 foreach t in array array['sb_pay_settings','sb_pay_packs','sb_pay_accounts','sb_pay_orders','sb_pay_ledger','sb_pay_deletion_requests'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.sb_pay_ledger_id_seq to service_role;
-- Keep a recipient available while an actual payment may still complete.
create or replace function public.sb_pay_character_guard() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.status='deleted' and old.status<>'deleted' then
  perform pg_advisory_xact_lock(hashtextextended('sb-player:'||old.account_id::text,0));
  if exists(select 1 from public.sb_pay_orders where account_id=old.account_id and code=old.code and game_env=old.game_env and status in ('reserved','open','pending')) then raise exception 'payment_pending';end if;
 end if;return new;
end $$;
revoke all on function public.sb_pay_character_guard() from public,anon,authenticated;
create or replace trigger sb_pay_character_guard before update of status on public.sb_player_characters for each row execute function public.sb_pay_character_guard();
commit;
