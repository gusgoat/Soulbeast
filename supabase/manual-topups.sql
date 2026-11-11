begin;

create table public.sb_manual_topups (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id),
  game_env text not null check (game_env = 'live'),
  code text not null,
  pack_id text not null references public.sb_pay_packs(id),
  promotion boolean not null,
  coupons integer not null check (coupons > 0),
  amount_satang integer not null check (amount_satang > 0),
  status text not null default 'awaiting_slip' check (status in ('awaiting_slip','pending','credited','rejected','cancelled')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  bank_reference text unique,
  rejection_reason text,
  foreign key (game_env,code) references public.sb_player_characters(game_env,code)
);
create unique index sb_manual_topup_promo_once on public.sb_manual_topups (game_env, code, pack_id)
  where promotion and status in ('awaiting_slip','pending','credited');
create index on public.sb_manual_topups (account_id, created_at desc);
create index on public.sb_manual_topups (submitted_at) where status = 'pending';

create table public.sb_manual_topup_slips (
  order_id uuid primary key references public.sb_manual_topups(id),
  mime text not null check (mime in ('image/png','image/jpeg')),
  content bytea not null check (octet_length(content) between 12 and 2097152)
);

alter table public.sb_manual_topups enable row level security;
alter table public.sb_manual_topup_slips enable row level security;
revoke all on public.sb_manual_topups, public.sb_manual_topup_slips from public, anon, authenticated;

create function public.sb_manual_topup(p_action text, p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  uid uuid := auth.uid();
  topup public.sb_manual_topups%rowtype;
  pack public.sb_pay_packs%rowtype;
  slip bytea;
  mime_type text;
begin
  if uid is null or not exists (select 1 from auth.users where id=uid and email_confirmed_at is not null and deleted_at is null) then
    raise exception 'verified_account_required';
  end if;
  if p_action = 'list' then
    return jsonb_build_object('enabled', exists(select 1 from public.sb_engine_control where environment='live' and mode='live'), 'characters', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'name', name) order by name, code) from public.sb_player_characters where account_id=uid and game_env='live' and status='active'), '[]'::jsonb),
      'debt', coalesce((select debt from public.sb_pay_accounts where account_id=uid), 0),
      'orders', coalesce((select jsonb_agg(to_jsonb(o) order by created_at desc) from
      (select id, code, pack_id, promotion, coupons, amount_satang, status, created_at, rejection_reason
       from public.sb_manual_topups where account_id=uid order by created_at desc limit 50) o), '[]'::jsonb),
      'blocked_promotions', coalesce((select jsonb_agg(to_jsonb(promo)) from (
        select code, pack_id from public.sb_manual_topups where account_id=uid and promotion and status in ('pending','credited')
        union
        select code, pack_id from public.sb_pay_orders where account_id=uid and game_env='live' and promotion and status<>'expired'
      ) promo), '[]'::jsonb));
  end if;
  if p_action = 'reserve' then
    if not exists (select 1 from public.sb_engine_control where environment='live' and mode='live') then raise exception 'manual_topup_unavailable'; end if;
    perform pg_advisory_xact_lock(hashtextextended('sb-manual-topup:' || uid::text, 0));
    if exists (select 1 from public.sb_pay_accounts where account_id=uid and debt>0) then raise exception 'billing_review_required'; end if;
    if not exists (select 1 from public.sb_player_characters where account_id=uid and code=p_data->>'code' and game_env='live' and status='active') then
      raise exception 'character_not_owned';
    end if;
    select * into pack from public.sb_pay_packs where id=p_data->>'pack_id' and active;
    if not found then raise exception 'unknown_pack'; end if;
    if pack.promotion then
      perform pg_advisory_xact_lock(hashtextextended('sb-topup-promo:live:' || (p_data->>'code') || ':' || pack.id,0));
      if exists (select 1 from public.sb_pay_orders where game_env='live' and code=p_data->>'code' and pack_id=pack.id and promotion and status<>'expired') or
         exists (select 1 from public.sb_manual_topups where game_env='live' and code=p_data->>'code' and pack_id=pack.id and promotion and status in ('pending','credited')) then
        raise exception 'promotion_unavailable';
      end if;
    end if;
    select * into topup from public.sb_manual_topups where account_id=uid and code=p_data->>'code' and pack_id=pack.id and status='awaiting_slip' order by created_at desc limit 1;
    if not found then
      if (select count(*) from public.sb_manual_topups where account_id=uid and created_at > now() - interval '1 hour') >= 10 then raise exception 'order_rate_limit'; end if;
      insert into public.sb_manual_topups(account_id, game_env, code, pack_id, promotion, coupons, amount_satang)
      values(uid, 'live', p_data->>'code', pack.id, pack.promotion, pack.coupons, pack.amount_satang) returning * into topup;
    end if;
  elsif p_action = 'cancel' then
    update public.sb_manual_topups set status='cancelled'
      where id=(p_data->>'order_id')::uuid and account_id=uid and status='awaiting_slip' returning * into topup;
    if not found then raise exception 'order_not_pending'; end if;
  elsif p_action = 'submit' then
    perform pg_advisory_xact_lock(hashtextextended('sb-manual-topup:' || uid::text, 0));
    select * into topup from public.sb_manual_topups where id=(p_data->>'order_id')::uuid and account_id=uid for update;
    if not found then raise exception 'order_not_found'; end if;
    if topup.status <> 'awaiting_slip' then
      return jsonb_build_object('id', topup.id, 'status', topup.status);
    end if;
    if (select count(*) from public.sb_manual_topups where account_id=uid and status='pending') >= 5 then raise exception 'too_many_pending_topups'; end if;
    mime_type := p_data->>'mime';
    if coalesce(length(p_data->>'content'),0) not between 16 and 2796204 then raise exception 'invalid_slip'; end if;
    slip := decode(p_data->>'content','base64');
    if not coalesce((mime_type='image/jpeg' and substr(slip,1,3)=decode('ffd8ff','hex')) or
      (mime_type='image/png' and substr(slip,1,8)=decode('89504e470d0a1a0a','hex')), false) then raise exception 'invalid_slip'; end if;
    insert into public.sb_manual_topup_slips(order_id,mime,content) values(topup.id,mime_type,slip);
    update public.sb_manual_topups set status='pending', submitted_at=now() where id=topup.id returning * into topup;
  else
    raise exception 'bad_manual_topup_action';
  end if;
  return to_jsonb(topup) - 'account_id' - 'reviewed_by' - 'bank_reference';
end $$;

create function public.sb_manual_topup_admin(p_action text, p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  topup public.sb_manual_topups%rowtype;
  ref text;
  credit jsonb;
  admin_identity jsonb;
  reason text;
begin
  if auth.uid() is null then raise exception 'admin_access_denied'; end if;
  admin_identity := public.sb_mobile_admin('identity', '{}'::jsonb);
  if nullif(admin_identity->>'email','') is null then raise exception 'admin_access_denied'; end if;
  if p_action = 'list' then
    return jsonb_build_object('pending_count', (select count(*) from public.sb_manual_topups where status='pending'),
      'orders', coalesce((select jsonb_agg(to_jsonb(o)) from (
        (select id, code, pack_id, promotion, coupons, amount_satang, status, submitted_at, reviewed_at, bank_reference, rejection_reason
         from public.sb_manual_topups where status='pending' order by submitted_at limit 50)
        union all
        (select id, code, pack_id, promotion, coupons, amount_satang, status, submitted_at, reviewed_at, bank_reference, rejection_reason
         from public.sb_manual_topups where status in ('credited','rejected') order by reviewed_at desc limit 20)
      ) o), '[]'::jsonb));
  end if;
  select * into topup from public.sb_manual_topups where id=(p_data->>'order_id')::uuid for update;
  if not found then raise exception 'order_not_found'; end if;
  if p_action = 'slip' then
    return (select jsonb_build_object('mime', mime, 'content', encode(content,'base64')) from public.sb_manual_topup_slips where order_id=topup.id);
  elsif p_action = 'approve' then
    if topup.status = 'credited' then return jsonb_build_object('status','credited'); end if;
    if topup.status <> 'pending' then raise exception 'order_not_pending'; end if;
    if (p_data->>'amount_satang')::integer is distinct from topup.amount_satang then raise exception 'amount_mismatch'; end if;
    ref := upper(regexp_replace(coalesce(p_data->>'bank_reference',''),'[^a-zA-Z0-9]','','g'));
    if length(ref) not between 6 and 80 then raise exception 'bank_reference_required'; end if;
    perform pg_advisory_xact_lock(hashtextextended('sb-manual-bank-ref:' || ref,0));
    if exists(select 1 from public.sb_manual_topups where bank_reference=ref) then raise exception 'bank_reference_used'; end if;
    if not exists (select 1 from public.sb_engine_control where environment='live' and mode='live') then raise exception 'manual_topup_unavailable'; end if;
    if not exists (select 1 from public.sb_player_characters where account_id=topup.account_id and code=topup.code and game_env='live' and status='active') then raise exception 'character_not_owned'; end if;
    if exists (select 1 from public.sb_pay_accounts where account_id=topup.account_id and debt>0) then raise exception 'billing_review_required'; end if;
    credit := public.sb_mobile_admin('coupons',jsonb_build_object('code',topup.code,'delta',topup.coupons,'request',topup.id));
    if (credit->>'delta')::integer is distinct from topup.coupons or
       (credit->>'after')::bigint - (credit->>'before')::bigint is distinct from topup.coupons::bigint then
      raise exception 'coupon_credit_failed';
    end if;
    update public.sb_manual_topups set status='credited', bank_reference=ref, reviewed_at=now(), reviewed_by=auth.uid() where id=topup.id;
    return jsonb_build_object('status','credited');
  elsif p_action = 'reject' then
    if topup.status = 'rejected' then return jsonb_build_object('status','rejected'); end if;
    if topup.status <> 'pending' then raise exception 'order_not_pending'; end if;
    reason := trim(coalesce(p_data->>'reason',''));
    if length(reason) not between 1 and 240 then raise exception 'rejection_reason_required'; end if;
    update public.sb_manual_topups set status='rejected', rejection_reason=reason, reviewed_at=now(), reviewed_by=auth.uid() where id=topup.id;
    return jsonb_build_object('status','rejected');
  end if;
  raise exception 'bad_manual_topup_action';
end $$;

-- Keep existing store reservations from reopening a QR promotion for the same character.
create function public.sb_guard_qr_promotion() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.promotion and new.game_env='live' then
    perform pg_advisory_xact_lock(hashtextextended('sb-topup-promo:live:' || new.code || ':' || new.pack_id,0));
    if exists (select 1 from public.sb_manual_topups where game_env='live' and code=new.code and pack_id=new.pack_id and promotion and status in ('awaiting_slip','pending','credited')) then
      raise exception 'promotion_unavailable';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.sb_guard_qr_promotion() from public, anon, authenticated;
create trigger sb_guard_qr_promotion before insert on public.sb_pay_orders
for each row execute function public.sb_guard_qr_promotion();

revoke all on function public.sb_manual_topup(text,jsonb), public.sb_manual_topup_admin(text,jsonb) from public, anon, authenticated;
grant execute on function public.sb_manual_topup(text,jsonb), public.sb_manual_topup_admin(text,jsonb) to authenticated;
commit;
