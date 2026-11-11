begin;
set local lock_timeout='5s';

-- Uses the live save projection (supabase/walk-profile-sync.sql).
do $$
begin
 if not exists(select 1 from pg_trigger where tgrelid='public.sb_engine_tables'::regclass
  and tgname='sb_saved_walk_profile_sync' and tgenabled<>'D') then
  raise exception 'Install walk-profile-sync.sql before referral-rewards.sql';
 end if;
end $$;

create table if not exists public.sb_referral_inviters (
 account_id uuid primary key references auth.users(id) on delete cascade,
 code text unique not null default upper(left(replace(gen_random_uuid()::text,'-',''),16))
   check(code ~ '^[0-9A-F]{16}$'),
 wallet_code text not null
);
create table if not exists public.sb_referral_links (
 referred_account uuid primary key,
 inviter_account uuid not null references public.sb_referral_inviters(account_id) on delete cascade,
 receipt_id uuid unique not null default gen_random_uuid(),
 qualified_at timestamptz,
 rewarded_at timestamptz,
 reward_wallet_code text,
 check(referred_account<>inviter_account),
 check((rewarded_at is null)=(reward_wallet_code is null)),
 check(rewarded_at is null or qualified_at is not null)
);
create index if not exists sb_referral_links_inviter on public.sb_referral_links(inviter_account);
create index if not exists sb_referral_pending on public.sb_referral_links(qualified_at,inviter_account)
 where qualified_at is not null and rewarded_at is null;
alter table public.sb_referral_inviters enable row level security;
alter table public.sb_referral_links enable row level security;
revoke all on public.sb_referral_inviters,public.sb_referral_links from public,anon,authenticated;

create or replace function public.sb_referral_code_valid(p_code text) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(length(p_code)=16 and exists(
  select 1 from public.sb_referral_inviters where code=upper(p_code)),false)
$$;
revoke all on function public.sb_referral_code_valid(text) from public,anon,authenticated;
grant execute on function public.sb_referral_code_valid(text) to anon,authenticated;

-- Only the original Auth signup can attach an inviter. Editing user metadata
-- after signup cannot change, add, or remove an attribution.
create or replace function public.sb_referral_signup() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
declare invite text:=upper(trim(coalesce(new.raw_user_meta_data->>'soulbeast_invite','')));
        owner_id uuid;
begin
 if invite='' then return new; end if;
 if invite ~ '^[0-9A-F]{16}$' then
  select account_id into owner_id from public.sb_referral_inviters where code=invite;
 end if;
 if owner_id is null or owner_id=new.id then raise exception 'invalid_referral_code'; end if;
 insert into public.sb_referral_links(referred_account,inviter_account) values(new.id,owner_id);
 return new;
end $$;
revoke all on function public.sb_referral_signup() from public,anon,authenticated;
drop trigger if exists sb_referral_signup on auth.users;
create trigger sb_referral_signup after insert on auth.users for each row execute function public.sb_referral_signup();

-- This is only a small queue write on the first qualifying saved level.
-- Wallet writes are deliberately outside the character save transaction.
create or replace function public.sb_referral_note_level() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.game_env<>'live' or new.status<>'active' or coalesce(new.level,0)<10 then return null; end if;
 if tg_op='UPDATE' then
  if old.status='active' and old.level>=10 then return null; end if;
 end if;
 update public.sb_referral_links l set qualified_at=statement_timestamp()
 where l.referred_account=new.account_id and l.qualified_at is null
 and exists(select 1 from auth.users u where u.id=new.account_id and u.email_confirmed_at is not null);
 return null;
end $$;
revoke all on function public.sb_referral_note_level() from public,anon,authenticated;
drop trigger if exists sb_referral_note_level on public.sb_player_characters;
create trigger sb_referral_note_level after insert or update of level,status on public.sb_player_characters
 for each row when (new.game_env='live' and new.status='active' and new.level>=10) execute function public.sb_referral_note_level();

create or replace function public.sb_referral_award(p_account uuid) returns integer
language plpgsql security definer set search_path=pg_catalog,public as $$
declare preferred text; wallet text; credits jsonb; additions jsonb; result jsonb;
        rev bigint; paid integer; ids uuid[]; request text; attempt integer;
begin
 select wallet_code into preferred from public.sb_referral_inviters where account_id=p_account for update;
 if not found then return 0; end if;
 select count(*)::integer into paid from public.sb_referral_links where inviter_account=p_account and rewarded_at is not null;
 if paid>=10 then return 0; end if;
 select array_agg(receipt_id order by qualified_at,receipt_id) into ids from (
  select receipt_id,qualified_at from public.sb_referral_links
  where inviter_account=p_account and qualified_at is not null and rewarded_at is null
  order by qualified_at,receipt_id limit 10-paid
 ) eligible;
 if ids is null then return 0; end if;
 select c.code into wallet from public.sb_player_characters c
 where c.account_id=p_account and c.game_env='live' and c.status='active'
 order by (c.code=preferred) desc,c.code limit 1;
 if wallet is null then return 0; end if;
 request:='referral-'||ids[1]::text;
 -- CouponCredits uses an append-only cursor; the game consumes at most one
 -- coupon per entry. Ten unit entries make one atomic referral reward.
 select jsonb_agg(jsonb_build_array('referral-'||x.id||'-'||n,wallet,1,'referral',
  (extract(epoch from statement_timestamp())*1000)::bigint) order by x.pos,n)
 into additions from unnest(ids) with ordinality x(id,pos) cross join generate_series(1,10) n;
 for attempt in 1..3 loop
  select c.revision,coalesce(t.rows,'[["key","code","amount","source","created"]]'::jsonb) into rev,credits
  from public.sb_engine_control c left join public.sb_engine_tables t on t.environment=c.environment and t.name='CouponCredits'
  where c.environment='live' and c.mode='live';
  if not found then return 0; end if;
  if credits='[]'::jsonb then credits:='[["key","code","amount","source","created"]]'::jsonb; end if;
  result:=public.sb_engine_commit(p_env:='live',p_expected:=rev,p_request:=request,
   p_digest:=encode(sha256(convert_to(request||':'||wallet||':'||array_to_string(ids,','),'UTF8')),'hex'),
   p_changes:=jsonb_build_object('CouponCredits',credits||additions),
   p_result:=jsonb_build_object('ok',true,'referralCount',cardinality(ids)));
  if coalesce((result->>'conflict')::boolean,false) then continue; end if;
  if result->'result'->>'ok' is distinct from 'true' then raise exception 'referral_credit_failed'; end if;
  update public.sb_referral_links set rewarded_at=clock_timestamp(),reward_wallet_code=wallet where receipt_id=any(ids);
  update public.sb_referral_inviters set wallet_code=wallet where account_id=p_account and wallet_code<>wallet;
  return cardinality(ids);
 end loop;
 return 0;
end $$;
revoke all on function public.sb_referral_award(uuid) from public,anon,authenticated;

create or replace function public.sb_referral_status(p_character text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=auth.uid(); inviter public.sb_referral_inviters%rowtype;
        wallet_name text; paid integer; waiting integer; ready integer;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null)
  then raise exception 'verified_account_required'; end if;
 if not exists(select 1 from public.sb_player_characters where account_id=uid and game_env='live' and code=p_character and status='active')
  then raise exception 'character_not_owned'; end if;
 insert into public.sb_referral_inviters(account_id,wallet_code) values(uid,p_character) on conflict(account_id) do nothing;
 -- A deleted wallet is replaced only by an active character on this same account.
 update public.sb_referral_inviters i set wallet_code=p_character where i.account_id=uid
 and not exists(select 1 from public.sb_player_characters c where c.account_id=uid and c.game_env='live' and c.code=i.wallet_code and c.status='active');
 select * into inviter from public.sb_referral_inviters where account_id=uid;
 select name into wallet_name from public.sb_player_characters where game_env='live' and code=inviter.wallet_code and account_id=uid;
 select count(*) filter(where rewarded_at is not null),count(*) filter(where qualified_at is null),
        count(*) filter(where qualified_at is not null and rewarded_at is null)
 into paid,waiting,ready from public.sb_referral_links where inviter_account=uid;
 return jsonb_build_object('code',inviter.code,'rewarded',paid,'waiting',waiting,'ready',case when paid<10 then least(ready,10-paid) else 0 end,
  'coupons',paid*10,'cap',10,'walletName',wallet_name);
end $$;
revoke all on function public.sb_referral_status(text) from public,anon,authenticated;
grant execute on function public.sb_referral_status(text) to authenticated;

create or replace function public.sb_referral_process() returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare candidate uuid;
begin
 -- One account per transaction keeps the engine revision lock short.
 select l.inviter_account into candidate from public.sb_referral_links l
 where l.qualified_at is not null and l.rewarded_at is null
 and (select count(*) from public.sb_referral_links paid where paid.inviter_account=l.inviter_account and paid.rewarded_at is not null)<10
 and exists(select 1 from public.sb_player_characters c where c.account_id=l.inviter_account and c.game_env='live' and c.status='active')
 order by l.qualified_at,l.receipt_id limit 1;
 if candidate is not null then perform public.sb_referral_award(candidate); end if;
end $$;
revoke all on function public.sb_referral_process() from public,anon,authenticated;

-- Supabase Cron/pg_cron must be enabled on the database; a missing scheduler
-- aborts installation instead of leaving a UI with no payout worker.
select cron.schedule('sb-referral-rewards','* * * * *','select public.sb_referral_process();');
commit;
