begin;

-- Decode either the legacy JSON or chunked Base64 save format, then expose only
-- the fields used by the local dungeon combat engine.
create or replace function public.sb_dungeon_helper_loadout(saved jsonb)
returns jsonb language plpgsql immutable set search_path=pg_catalog,public as $$
declare
 payload text;
 p jsonb;
begin
 select string_agg(case when saved->>6 like 'SB64:%' then substr(value,6) else value end,
                   '' order by part)
 into payload from jsonb_array_elements_text(saved) with ordinality x(value,part)
 where part>6;
 if saved->>6 like 'SB64:%' then
  payload:=convert_from(decode(payload,'base64'),'UTF8');
 end if;
 p:=payload::jsonb->'P';
 if p->>'code' is distinct from saved->>0 or coalesce(p->>'lv','') !~ '^[0-9]{1,4}$'
    or jsonb_typeof(p->'eq') is distinct from 'object' then return null; end if;
 return jsonb_build_object(
  'name',p->'name','cls',p->'cls','gender',p->'gender','lv',(p->>'lv')::int,'country',p->'country',
  'pts',coalesce(p->'pts','{}'::jsonb),'eq',p->'eq','hp',p->'hp','mp',p->'mp','worldPower',p->'worldPower',
  'party',coalesce(p->'party','[]'::jsonb),
  'pets',coalesce((
   select jsonb_agg(jsonb_build_object('uid',pet->'uid','sp',pet->'sp','lv',pet->'lv',
          'form',pet->'form','pts',coalesce(pet->'pts','{}'::jsonb),'hp',pet->'hp','mp',pet->'mp'))
   from jsonb_array_elements(coalesce(p->'pets','[]'::jsonb)) pet
   where (p->'party') @> jsonb_build_array(pet->'uid')
  ),'[]'::jsonb)
 );
exception when data_exception then return null;
end $$;
revoke all on function public.sb_dungeon_helper_loadout(jsonb) from public,anon,authenticated;

create or replace function public.sb_dungeon_solo_friends(p_env text,p_code text)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare
 recent_ms numeric := extract(epoch from statement_timestamp()-interval '5 minutes')*1000;
begin
 if not exists (
  select from public.sb_player_characters c join auth.users u on u.id=c.account_id
  where c.game_env=p_env and c.code=p_code and c.status='active' and c.account_id=auth.uid()
    and u.email_confirmed_at is not null and u.deleted_at is null
 ) then raise exception 'character_not_owned' using errcode='42501'; end if;

 return (
  with friends as materialized (
   -- An accepted request creates a row in both directions. Older one-sided
   -- entries never grant access to another character's combat loadout.
   select case when entry->>1=p_code then entry->>2 else entry->>1 end as code
   from public.sb_engine_tables t cross join lateral jsonb_array_elements(t.rows) entry
   where t.environment=p_env and t.name='Friends' and p_code in (entry->>1,entry->>2)
     and entry->>1<>entry->>2
   group by 1
   having bool_or(entry->>1=p_code) and bool_or(entry->>2=p_code)
  ), directory as materialized (
   select entry->>0 as id, entry->>1 as code
   from public.sb_engine_tables t cross join lateral jsonb_array_elements(t.rows) entry
   join friends f on f.code=entry->>1
   join public.sb_player_characters c on c.game_env=p_env and c.code=f.code and c.status='active'
   left join public.sb_walk_presence w on w.game_env=p_env and w.code=f.code
   where t.environment=p_env and t.name='PlayerDirectory'
     and (w.last_seen>statement_timestamp()-interval '15 seconds'
          or case when entry->>6 ~ '^[0-9]{1,16}$' then (entry->>6)::numeric>recent_ms else false end)
     and not exists (
      select from public.sb_engine_tables coupons cross join lateral jsonb_array_elements(coupons.rows) coupon
      where coupons.environment=p_env and coupons.name='Coupons' and coupon->>0=f.code
        and lower(coupon->>7) in ('true','1','yes','banned')
     )
  ), loadouts as materialized (
   select d.id, public.sb_dungeon_helper_loadout(saved) as player,coalesce(r.score,0) as rating
   from public.sb_engine_tables t cross join lateral jsonb_array_elements(t.rows) saved
   join directory d on d.code=saved->>0
   left join public.sb_colosseum_ratings r on p_env='live' and r.code=d.code
   where t.environment=p_env and t.name='Saves'
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'player',player||jsonb_build_object('colosseumRating',rating))
         order by player->>'name',id),'[]'::jsonb)
  from loadouts where player is not null
 );
end $$;
revoke all on function public.sb_dungeon_solo_friends(text,text) from public,anon;
grant execute on function public.sb_dungeon_solo_friends(text,text) to authenticated;
commit;
