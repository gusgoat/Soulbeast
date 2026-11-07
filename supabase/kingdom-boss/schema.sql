begin;

create table if not exists public.sb_kingdom_boss_config (
 environment text primary key check (environment in ('live','test')),
 enabled boolean not null default false,
 testing boolean not null default true
);
alter table public.sb_kingdom_boss_config enable row level security;
revoke all on public.sb_kingdom_boss_config from public, anon, authenticated;
grant select, update on public.sb_kingdom_boss_config to service_role;
insert into public.sb_kingdom_boss_config(environment) values ('live'), ('test') on conflict do nothing;

create or replace function public.sb_kingdom_boss_feed(p_env text)
returns jsonb language sql stable set search_path = '' as $$
 select jsonb_build_object('enabled',cfg.enabled,'testing',cfg.testing,'serverTime',floor(extract(epoch from statement_timestamp())*1000),
  'event',case when cfg.enabled then (
   select (r->>1)::jsonb from public.sb_engine_tables t cross join lateral jsonb_array_elements(t.rows) r
    where t.environment=p_env and t.name='GuildState' and r->>0='kb:public' limit 1
  ) end)
 from public.sb_kingdom_boss_config cfg where cfg.environment=p_env;
$$;

-- Reuse the existing commit/receipt transaction. Combat never sends the other
-- player saves, leaderboards, gacha history or unrelated tables to the edge.
create or replace function public.sb_kingdom_boss_snapshot(p_env text,p_request text,p_code text)
returns jsonb language sql stable set search_path = '' as $$
 with guild as materialized (
  select rows from public.sb_engine_tables where environment=p_env and name='GuildState'
 ), round as materialized (
  select (r->>1)::jsonb data from guild cross join lateral jsonb_array_elements(guild.rows) r
   where r->>0=(select (x->>1)::jsonb->>'id' from guild cross join lateral jsonb_array_elements(guild.rows) x where x->>0='kb:current' limit 1) limit 1
 ), codes as (
  select p_code as code where p_code<>''
  union select p.key from round cross join lateral jsonb_each(round.data->'players') p
   where (p.value->>'seen')::numeric >= extract(epoch from statement_timestamp())*1000-4000
 )
 select jsonb_build_object('mode',c.mode,'revision',c.revision,
  'auth_locked',exists(select 1 from public.sb_engine_auth_failures f where f.environment=p_env and f.code=p_code and f.attempts>=8 and f.reset_at>now()),
  'receipt',(select jsonb_build_object('digest',r.digest,'result',r.result) from public.sb_engine_receipts r where r.environment=p_env and r.request_id=p_request),
  'tables',coalesce((select jsonb_object_agg(t.name,case when t.name in ('Saves','Coupons') then (
   select coalesce(jsonb_agg(e.r order by e.n),'[]'::jsonb) from jsonb_array_elements(t.rows) with ordinality e(r,n)
    where e.n=1 or e.r->>0 in (select code from codes)
  ) else t.rows end) from public.sb_engine_tables t where t.environment=p_env and t.name in ('GuildState','Saves','Coupons')),'{}'::jsonb))
 from public.sb_engine_control c where c.environment=p_env;
$$;

revoke all on function public.sb_kingdom_boss_feed(text) from public, anon, authenticated;
revoke all on function public.sb_kingdom_boss_snapshot(text,text,text) from public, anon, authenticated;
grant execute on function public.sb_kingdom_boss_feed(text) to service_role;
grant execute on function public.sb_kingdom_boss_snapshot(text,text,text) to service_role;

commit;
