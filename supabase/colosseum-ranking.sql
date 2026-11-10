begin;

create table if not exists public.sb_colosseum_rank_config (
  singleton boolean primary key default true check (singleton),
  secret_sha256 bytea not null check (octet_length(secret_sha256)=32)
);
create table if not exists public.sb_colosseum_rank_receipts (
  match_id uuid primary key,
  created_at timestamptz not null default now()
);
create table if not exists public.sb_colosseum_ratings (
  code text primary key,
  display_name text not null,
  score integer not null default 0
);
alter table public.sb_colosseum_rank_config enable row level security;
alter table public.sb_colosseum_rank_receipts enable row level security;
alter table public.sb_colosseum_ratings enable row level security;
revoke all on public.sb_colosseum_rank_config, public.sb_colosseum_rank_receipts,
  public.sb_colosseum_ratings from public, anon, authenticated;

create or replace function public.sb_colosseum_rating(p_code text)
returns integer
language sql stable security definer set search_path = ''
as $$
  select coalesce((select r.score from public.sb_colosseum_ratings r where r.code=p_code),0)
$$;

create or replace function public.sb_colosseum_leaderboard(p_limit integer default 100)
returns table(rank bigint, name text, score integer)
language sql stable security definer set search_path = ''
as $$
  select rank() over (order by r.score desc), r.display_name, r.score
  from public.sb_colosseum_ratings r
  where exists (
    select 1 from public.sb_player_characters c
    where c.code=r.code and c.game_env='live' and c.status='active'
  )
  order by r.score desc, r.display_name, r.code
  limit greatest(1,least(coalesce(p_limit,100),100))
$$;

create or replace function public.sb_colosseum_commit_rank(p_match uuid, p_results jsonb, p_secret text)
returns table(code text, score integer)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_secret is null or length(p_secret)<>64 or not exists (
    select 1 from public.sb_colosseum_rank_config
    where singleton and secret_sha256=sha256(convert_to(p_secret,'UTF8'))
  ) then
    raise exception 'Colosseum writer authentication failed' using errcode='42501';
  end if;
  if p_match is null or p_results is null or jsonb_typeof(p_results)<>'array' then
    raise exception 'Invalid Colosseum result';
  end if;
  if jsonb_array_length(p_results) not between 1 and 10 or exists (
    select 1 from jsonb_to_recordset(p_results) as x(code text,name text,delta integer)
    where x.code is null or length(x.code) not between 1 and 80
      or x.name is null or length(x.name) not between 1 and 20
      or x.delta is null or x.delta not in (-1,1,2,3)
  ) then
    raise exception 'Invalid Colosseum result';
  end if;

  insert into public.sb_colosseum_rank_receipts values (p_match,now())
    on conflict do nothing;
  if found then
    insert into public.sb_colosseum_ratings as r (code,display_name,score)
    select x.code,x.name,x.delta
    from jsonb_to_recordset(p_results) as x(code text,name text,delta integer)
    where exists (
      select 1 from public.sb_player_characters c
      where c.code=x.code and c.game_env='live' and c.status='active'
    )
    order by x.code
    on conflict on constraint sb_colosseum_ratings_pkey do update
      set score=r.score+excluded.score, display_name=excluded.display_name;
  end if;
  return query select r.code,r.score
  from public.sb_colosseum_ratings r
  where exists (select 1 from jsonb_to_recordset(p_results) as x(code text) where x.code=r.code);
end
$$;

revoke all on function public.sb_colosseum_rating(text),
  public.sb_colosseum_leaderboard(integer),
  public.sb_colosseum_commit_rank(uuid,jsonb,text) from public;
grant execute on function public.sb_colosseum_rating(text),
  public.sb_colosseum_leaderboard(integer),
  public.sb_colosseum_commit_rank(uuid,jsonb,text) to anon, authenticated;
commit;
