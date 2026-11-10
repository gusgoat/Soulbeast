begin;

create table if not exists public.sb_colosseum_rank_events (
  match_id uuid not null,
  code text not null,
  account_id uuid not null,
  occurred_at timestamptz not null,
  delta integer not null,
  violation text check (violation in ('abandon','inactive')),
  daily_count integer,
  monthly_count integer,
  blocked_until timestamptz,
  permanent boolean not null default false,
  read_at timestamptz,
  primary key (match_id,code)
);
create index if not exists sb_colosseum_rank_events_account_at
  on public.sb_colosseum_rank_events(account_id,occurred_at desc) where violation is not null;
create table if not exists public.sb_colosseum_rank_restrictions (
  account_id uuid primary key,
  blocked_until timestamptz,
  permanent boolean not null default false
);
alter table public.sb_colosseum_rank_events enable row level security;
alter table public.sb_colosseum_rank_restrictions enable row level security;
revoke all on public.sb_colosseum_rank_events, public.sb_colosseum_rank_restrictions from public, anon, authenticated;

create or replace function public.sb_colosseum_rank_status(p_code text,p_secret text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.sb_colosseum_rank_config
    where singleton and length(p_secret)=64 and secret_sha256=sha256(convert_to(p_secret,'UTF8'))
  ) then
    raise exception 'Colosseum writer authentication failed' using errcode='42501';
  end if;
  return (
    select jsonb_build_object('account',c.account_id,'rating',coalesce(r.score,0),
      'blockedUntil',s.blocked_until,'permanent',coalesce(s.permanent,false))
    from public.sb_player_characters c
    left join public.sb_colosseum_ratings r on r.code=c.code
    left join public.sb_colosseum_rank_restrictions s on s.account_id=c.account_id
    where c.game_env='live' and c.status='active' and c.code=p_code
  );
end
$$;

create or replace function public.sb_colosseum_apply_ranked(p_match uuid,p_results jsonb,p_secret text)
returns table(code text,score integer)
language plpgsql security definer set search_path = ''
as $$
declare
  result record;
  event_time timestamptz;
  day_start timestamptz;
  month_start timestamptz;
  day_total integer;
  month_total integer;
  new_block timestamptz;
  saved_block timestamptz;
  saved_permanent boolean;
begin
  if not exists (
    select 1 from public.sb_colosseum_rank_config
    where singleton and length(p_secret)=64 and secret_sha256=sha256(convert_to(p_secret,'UTF8'))
  ) then
    raise exception 'Colosseum writer authentication failed' using errcode='42501';
  end if;
  if p_match is null or p_results is null or jsonb_typeof(p_results)<>'array' then
    raise exception 'Invalid Colosseum result';
  end if;
  if jsonb_array_length(p_results) not between 1 and 10 or exists (
    select 1 from jsonb_to_recordset(p_results) as x(code text,name text,delta integer,violation text)
    where x.code is null or length(x.code) not between 1 and 80
      or x.name is null or length(x.name) not between 1 and 20
      or x.delta is null or x.delta not between -2 and 3
      or (x.violation is not null and x.violation not in ('abandon','inactive'))
      or (x.delta=-2) is distinct from coalesce(x.violation='abandon',false)
      or (x.violation='inactive' and x.delta not in (-1,0))
  ) then
    raise exception 'Invalid Colosseum result';
  end if;
  for result in
    select x.*, c.account_id
    from jsonb_to_recordset(p_results) as x(code text,name text,delta integer,violation text,at bigint)
    join public.sb_player_characters c on c.code=x.code and c.game_env='live' and c.status='active'
    order by c.account_id,x.code
  loop
    perform pg_advisory_xact_lock(hashtextextended(result.account_id::text,0));
    event_time:=least(now(),coalesce(to_timestamp(result.at/1000.0),now()));
    insert into public.sb_colosseum_rank_events(match_id,code,account_id,occurred_at,delta,violation)
      values (p_match,result.code,result.account_id,event_time,result.delta,result.violation)
      on conflict on constraint sb_colosseum_rank_events_pkey do nothing;
    if not found then continue; end if;
    if result.delta<>0 then
      insert into public.sb_colosseum_ratings as r (code,display_name,score)
        values(result.code,result.name,result.delta)
        on conflict on constraint sb_colosseum_ratings_pkey do update
        set score=r.score+excluded.score,display_name=excluded.display_name;
    end if;
    if result.violation is null then continue; end if;

    day_start:=date_trunc('day',event_time at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok';
    month_start:=date_trunc('month',event_time at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok';
    select count(*) filter (where e.occurred_at>=day_start and e.occurred_at<day_start+interval '24 hours'),count(*)
      into day_total,month_total
      from public.sb_colosseum_rank_events e
      where e.account_id=result.account_id and e.violation is not null
        and e.occurred_at>=month_start
        and e.occurred_at<((date_trunc('month',event_time at time zone 'Asia/Bangkok')+interval '1 month') at time zone 'Asia/Bangkok');
    new_block:=case day_total
      when 1 then event_time+interval '5 minutes'
      when 2 then event_time+interval '1 hour'
      when 3 then event_time+interval '6 hours'
      else day_start+interval '24 hours'
    end;
    insert into public.sb_colosseum_rank_restrictions as r(account_id,blocked_until,permanent)
      values(result.account_id,new_block,month_total>=10)
      on conflict on constraint sb_colosseum_rank_restrictions_pkey do update
      set blocked_until=greatest(r.blocked_until,excluded.blocked_until),permanent=r.permanent or excluded.permanent
      returning r.blocked_until,r.permanent into saved_block,saved_permanent;
    update public.sb_colosseum_rank_events e
      set daily_count=day_total,monthly_count=month_total,blocked_until=saved_block,permanent=saved_permanent
      where e.match_id=p_match and e.code=result.code;
  end loop;
  return query
    select distinct x.code,coalesce(r.score,0)
    from jsonb_to_recordset(p_results) as x(code text)
    join public.sb_colosseum_rank_events e on e.match_id=p_match and e.code=x.code
    left join public.sb_colosseum_ratings r on r.code=x.code;
end
$$;

create or replace function public.sb_colosseum_rank_mail(p_read uuid default null)
returns table(id uuid,at timestamptz,violation text,delta integer,daily_count integer,
  monthly_count integer,blocked_until timestamptz,permanent boolean,read boolean)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_read is not null then
    update public.sb_colosseum_rank_events e set read_at=coalesce(e.read_at,now())
      where e.match_id=p_read and e.account_id=auth.uid() and e.violation is not null;
  end if;
  return query select e.match_id,e.occurred_at,e.violation,e.delta,e.daily_count,e.monthly_count,
    e.blocked_until,e.permanent,e.read_at is not null
    from public.sb_colosseum_rank_events e
    where e.account_id=auth.uid() and e.violation is not null
    order by e.occurred_at desc limit 100;
end
$$;

revoke all on function public.sb_colosseum_rank_status(text,text),
 public.sb_colosseum_apply_ranked(uuid,jsonb,text),public.sb_colosseum_rank_mail(uuid) from public, anon, authenticated;
grant execute on function public.sb_colosseum_rank_status(text,text),
 public.sb_colosseum_apply_ranked(uuid,jsonb,text) to anon, authenticated;
grant execute on function public.sb_colosseum_rank_mail(uuid) to authenticated;


commit;
