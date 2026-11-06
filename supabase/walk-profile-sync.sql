begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create or replace function public.sb_saved_walk_profile(r jsonb) returns jsonb
language plpgsql immutable set search_path=pg_catalog,public as $$
declare payload text; p jsonb;
begin
 if jsonb_typeof(r)<>'array' or jsonb_array_length(r)<7 then return null;end if;
 select string_agg(case when r->>6 like 'SB64:%' then substr(value,6) else value end,'' order by part) into payload from jsonb_array_elements_text(r) with ordinality x(value,part) where part>6;
 if r->>6 like 'SB64:%' then payload:=convert_from(decode(payload,'base64'),'UTF8');end if;
 p:=payload::jsonb->'P';
 if p->>'code' is distinct from r->>0 or coalesce(p->>'cls','')!~'^[a-z][a-z0-9_]{0,39}$' or coalesce(p->>'lv','')!~'^[0-9]{1,4}$' or (p->>'lv')::int not between 1 and 1000 then return null;end if;
 return jsonb_build_object('cls',p->>'cls','lv',(p->>'lv')::int,'gender',case when p->>'gender' in ('male','female') then p->>'gender' end);
exception when data_exception then return null;
end $$;
revoke all on function public.sb_saved_walk_profile(jsonb) from public,anon,authenticated;
create or replace function public.sb_sync_saved_walk_profile() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare saved jsonb; profile jsonb; previous jsonb;
begin
 if new.name<>'Saves' then return null;end if;
 if tg_op='UPDATE' then select coalesce(jsonb_object_agg(o->>0,o) filter(where o->>0 is not null),'{}'::jsonb) into previous from jsonb_array_elements(old.rows) o;else previous:='{}'::jsonb;end if;
 for saved in select n from jsonb_array_elements(new.rows) n where previous->(n->>0) is distinct from n
 loop
  profile:=public.sb_saved_walk_profile(saved);if profile is null then continue;end if;
  update public.sb_player_characters c set class_id=profile->>'cls',level=(profile->>'lv')::int,walk_gender=coalesce(profile->>'gender',c.walk_gender)
   where c.game_env=new.environment and c.code=saved->>0 and c.status='active'
   and (c.class_id is distinct from profile->>'cls' or c.level is distinct from (profile->>'lv')::int or c.walk_gender is distinct from coalesce(profile->>'gender',c.walk_gender));
 end loop;return null;
end $$;
revoke all on function public.sb_sync_saved_walk_profile() from public,anon,authenticated;
drop trigger if exists sb_saved_walk_profile_sync on public.sb_engine_tables;
create trigger sb_saved_walk_profile_sync after insert or update of rows on public.sb_engine_tables for each row when (new.name='Saves') execute function public.sb_sync_saved_walk_profile();
with profiles as materialized (
 select t.environment,saved->>0 code,public.sb_saved_walk_profile(saved) profile from public.sb_engine_tables t cross join lateral jsonb_array_elements(t.rows) saved where t.name='Saves'
), repaired as (
 update public.sb_player_characters c set class_id=p.profile->>'cls',level=(p.profile->>'lv')::int,walk_gender=coalesce(p.profile->>'gender',c.walk_gender)
 from profiles p where p.profile is not null and c.game_env=p.environment and c.code=p.code and c.status='active'
 and (c.class_id is distinct from p.profile->>'cls' or c.level is distinct from (p.profile->>'lv')::int or c.walk_gender is distinct from coalesce(p.profile->>'gender',c.walk_gender)) returning 1
) select count(*) as repaired_profiles from repaired;
commit;
