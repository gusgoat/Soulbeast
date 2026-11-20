-- Expand only country-scene validators; preserve ownership, same-scene joins, grants and all saves.
begin;
CREATE OR REPLACE FUNCTION public.sb_walk_test_channel(p_topic text, p_publish boolean)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
 select exists (
  select 1 from public.sb_walk_presence sender
  join public.sb_walk_presence viewer on viewer.game_env=sender.game_env and viewer.scene=sender.scene
  join public.sb_player_characters v on v.game_env=viewer.game_env and v.code=viewer.code
  join public.sb_player_characters s on s.game_env=sender.game_env and s.code=sender.code
  join auth.users u on u.id=v.account_id
  where sender.game_env='test' and sender.scene ~ '^country:(blue|green|red)(:[NWES])?$'
  and p_topic='sb-walk:test:'||sender.scene||':'||sender.public_id::text
  and v.account_id=auth.uid() and v.status='active' and s.status='active'
  and u.email_confirmed_at is not null and u.deleted_at is null
  and viewer.last_seen>statement_timestamp()-interval '8 seconds'
  and sender.last_seen>statement_timestamp()-interval '8 seconds'
  and (not p_publish or viewer.code=sender.code)
 )
$function$
;
CREATE OR REPLACE FUNCTION public.sb_walk_heartbeat(p_env text, p_code text, p_scene text, p_x double precision, p_y double precision, p_direction smallint, p_moving boolean, p_running boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare actor public.sb_player_characters%rowtype; tick timestamptz := statement_timestamp(); peers jsonb;
begin
 select * into actor from public.sb_player_characters where account_id=auth.uid() and game_env=p_env and code=p_code and status='active';
 if not found or not exists (select from auth.users where id=auth.uid() and email_confirmed_at is not null and deleted_at is null) then raise exception 'character_not_owned' using errcode='42501'; end if;
 if p_scene is null or p_scene !~ '^(town:(blue|green|red)-(capital|city-[1-4]|village-([1-9]|1[0-6]))|country:(blue|green|red)(:[NWES])?|dungeon:[0-9a-f-]{36}:[1-7])$' or p_x is null or p_y is null or not (p_x between 0 and 50000 and p_y between 0 and 50000) or p_direction is null or p_direction not between 0 and 7 or p_moving is null or p_running is null then raise exception 'bad_position' using errcode='22023'; end if;
 if p_scene like 'dungeon:%' and not exists (select from public.sb_dungeon_invites where id::text=split_part(p_scene,':',2) and game_env=p_env and p_code in (host,guest) and state='accepted' and expires_at>tick) then raise exception 'party_not_owned' using errcode='42501'; end if;
 insert into public.sb_walk_presence(game_env,code,scene,x,y,direction,moving,running,last_seen) values(p_env,p_code,p_scene,p_x,p_y,p_direction,p_moving,p_running,tick)
 on conflict(game_env,code) do update set scene=excluded.scene,x=excluded.x,y=excluded.y,direction=excluded.direction,moving=excluded.moving,running=excluded.running,last_seen=excluded.last_seen where public.sb_walk_presence.last_seen < tick - interval '350 milliseconds';
 select coalesce(jsonb_agg(to_jsonb(nearby)),'[]'::jsonb) into peers from (select p.public_id as id,c.name,p.appearance->'entitlements' as entitlements,p.appearance->>'walkFusion' as "walkFusion",p.appearance->>'country' as country,c.class_id as cls,c.level as lv,coalesce(case when c.draft->'P'->>'gender' in ('male','female') then c.draft->'P'->>'gender' end,c.walk_gender) as gender,p.x,p.y,p.direction as dir,p.moving,p.running from public.sb_walk_presence p join public.sb_player_characters c on c.game_env=p.game_env and c.code=p.code where p.game_env=p_env and p.scene=p_scene and c.status='active' and p.code<>p_code and p.last_seen>tick-interval '8 seconds' order by (p.x-p_x)^2+(p.y-p_y)^2 limit 40) nearby;
 return peers;
end $function$
;
CREATE OR REPLACE FUNCTION public.sb_walk_live_channel(p_topic text, p_publish boolean)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
 select exists (
  select 1 from public.sb_walk_presence sender
  join public.sb_walk_presence viewer on viewer.game_env=sender.game_env and viewer.scene=sender.scene
  join public.sb_player_characters v on v.game_env=viewer.game_env and v.code=viewer.code
  join public.sb_player_characters s on s.game_env=sender.game_env and s.code=sender.code
  join auth.users u on u.id=v.account_id
  where sender.game_env='live' and sender.scene ~ '^(country:(blue|green|red)(:[NWES])?|town:(blue|green|red)-(capital|city-[1-4]|village-([1-9]|1[0-6])))$'
  and p_topic='sb-walk:live:'||sender.scene||':'||sender.public_id::text
  and v.account_id=auth.uid() and v.status='active' and s.status='active'
  and u.email_confirmed_at is not null and u.deleted_at is null
  and viewer.last_seen>statement_timestamp()-interval '8 seconds'
  and sender.last_seen>statement_timestamp()-interval '8 seconds'
  and (not p_publish or viewer.code=sender.code)
 )
$function$
;
CREATE OR REPLACE FUNCTION public.sb_colosseum_walk_ratings(p_code text, p_scene text, p_peer_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare own_score integer; peer_scores jsonb := '{}'::jsonb; room uuid;
begin
  if (p_scene is not null and p_scene !~ '^(country:(blue|green|red)(:[NWES])?|town:(blue|green|red)-(capital|city-[1-4]|village-([1-9]|1[0-6]))|dungeon:[0-9a-f-]{36}:[1-7])$') or coalesce(cardinality(p_peer_ids),0)>40 then
    raise exception 'Invalid walk scene' using errcode='22023';
  end if;
  select coalesce(r.score,0) into own_score from public.sb_player_characters c left join public.sb_colosseum_ratings r on r.code=c.code where c.game_env='live' and c.code=p_code and c.status='active' and c.account_id=auth.uid();
  if not found then raise exception 'Character not owned' using errcode='42501'; end if;
  if p_scene like 'dungeon:%' then
    room := split_part(p_scene,':',2)::uuid;
    select coalesce(jsonb_object_agg(m.code,coalesce(r.score,0)),'{}'::jsonb) into peer_scores
      from public.sb_dungeon_party_members m join public.sb_dungeon_party_rooms lobby on lobby.id=m.room_id and lobby.game_env=m.game_env
      join public.sb_player_characters c on c.game_env=m.game_env and c.code=m.code and c.status='active' left join public.sb_colosseum_ratings r on r.code=m.code
      where m.game_env='live' and m.room_id=room and lobby.expires_at>statement_timestamp()
      and exists (select from public.sb_dungeon_party_members caller where caller.game_env=m.game_env and caller.room_id=m.room_id and caller.code=p_code);
  elsif p_scene is not null and coalesce(cardinality(p_peer_ids),0)>0 then
    select coalesce(jsonb_object_agg(p.public_id::text,coalesce(r.score,0)),'{}'::jsonb) into peer_scores
      from public.sb_walk_presence p join public.sb_player_characters c on c.game_env=p.game_env and c.code=p.code and c.status='active' left join public.sb_colosseum_ratings r on r.code=p.code
      where p.game_env='live' and p.scene=p_scene and p.public_id=any(p_peer_ids) and p.last_seen>statement_timestamp()-interval '8 seconds'
      and exists (select from public.sb_walk_presence caller where caller.game_env=p.game_env and caller.code=p_code and caller.scene=p_scene and caller.last_seen>statement_timestamp()-interval '8 seconds');
  end if;
  return jsonb_build_object('own',own_score,'peers',peer_scores);
end
$function$
;
commit;
