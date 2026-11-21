begin;
do $preflight$ begin
if md5(pg_get_functiondef('public.sb_dungeon_party_command(text,text,text,uuid,boolean)'::regprocedure))<>'e6f4b6d21beb47fc27384a265c6ad13e' then raise exception 'Party function changed since review: sb_dungeon_party_command';end if;
if md5(pg_get_functiondef('public.sb_dungeon_party_public(text,text,text,uuid)'::regprocedure))<>'24e2f50e65b297be0223a256d32bc200' then raise exception 'Party function changed since review: sb_dungeon_party_public';end if;
end $preflight$;
create or replace function public.sb_dungeon_party_class_family(p_class text) returns text language sql immutable strict parallel safe set search_path=pg_catalog as $family$
 select ('{"swordsman":"swordsman","samurai":"swordsman","kensei":"swordsman","shogun":"swordsman","spellblade":"swordsman","sbsummon":"swordsman","sbwar":"swordsman","gladiator":"gladiator","paladin":"gladiator","templar":"gladiator","eternal":"gladiator","berserker":"gladiator","warlord":"gladiator","bloodwar":"gladiator","archer":"archer","ranger":"archer","sniper":"archer","wildlord":"archer","bard":"archer","maestro":"archer","dirge":"archer","mage":"mage","sage":"mage","archmage":"mage","elementalist":"mage","warlock":"mage","necro":"mage","enchanter":"mage","merchant":"merchant","blacksmith":"merchant","mastersmith":"merchant","mechanic":"merchant","alchemist":"merchant","biochem":"merchant","goldalch":"merchant","gunner":"gunner","marksman":"gunner","gunsaint":"gunner","bounty":"gunner","artillery":"gunner","cannoneer":"gunner","demolisher":"gunner","druid":"druid","feral":"druid","wildgod":"druid","packlord":"druid","grove":"druid","archdruid":"druid","stormcaller":"druid","thief":"thief","rogue":"thief","masterthief":"thief","trickster":"thief","assassin":"thief","ninja":"thief","ronin":"thief","summoner":"summoner","tamer":"summoner","beastking":"summoner","sealmaster":"summoner","soullink":"summoner","soulsage":"summoner","spiritlord":"summoner"}'::jsonb)->>p_class;
$family$;
revoke all on function public.sb_dungeon_party_class_family(text) from public,anon,authenticated;
create or replace function public.sb_dungeon_party_assert_classes(p_env text,p_room uuid,p_entrant text default null) returns void language plpgsql set search_path=pg_catalog as $guard$
declare total integer; known integer; distinct_families integer; incoming text;
begin
 perform 1 from public.sb_player_characters c where c.game_env=p_env and (c.code=p_entrant or exists(select 1 from public.sb_dungeon_party_members m where m.room_id=p_room and m.game_env=p_env and m.code=c.code)) order by c.code for share of c;
 select count(*),count(public.sb_dungeon_party_class_family(c.class_id)),count(distinct public.sb_dungeon_party_class_family(c.class_id)) into total,known,distinct_families from public.sb_dungeon_party_members m join public.sb_player_characters c on c.game_env=m.game_env and c.code=m.code where m.room_id=p_room and m.game_env=p_env;
 if known<>total then raise exception 'party_class_unknown'; end if;
 if total<>distinct_families then raise exception 'party_duplicate_class_family'; end if;
 if p_entrant is not null then
  select public.sb_dungeon_party_class_family(c.class_id) into incoming from public.sb_player_characters c where c.game_env=p_env and c.code=p_entrant;
  if incoming is null then raise exception 'party_class_unknown'; end if;
  if exists(select 1 from public.sb_dungeon_party_members m join public.sb_player_characters c on c.game_env=m.game_env and c.code=m.code where m.room_id=p_room and m.game_env=p_env and m.code<>p_entrant and public.sb_dungeon_party_class_family(c.class_id)=incoming) then raise exception 'party_duplicate_class_family'; end if;
 end if;
end $guard$;
revoke all on function public.sb_dungeon_party_assert_classes(text,uuid,text) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.sb_dungeon_party_command(p_env text, p_code text, p_action text, p_room uuid DEFAULT NULL::uuid, p_ready boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 r public.sb_dungeon_party_rooms%rowtype;
 n integer;
 tick timestamptz := statement_timestamp();
begin
 if p_env is distinct from 'live' or not exists (
  select from public.sb_player_characters c join auth.users u on u.id=c.account_id
  where c.game_env=p_env and c.code=p_code and c.account_id=auth.uid()
   and c.status='active' and u.email_confirmed_at is not null and u.deleted_at is null
 ) then raise exception 'character_not_owned' using errcode='42501'; end if;
 -- Serializes membership and start so simultaneous joins cannot create a fifth slot.
 perform pg_advisory_xact_lock(hashtextextended('sb-party-room:'||p_env,0));
 delete from public.sb_dungeon_party_members m using public.sb_dungeon_party_rooms x
  where m.room_id=x.id and x.game_env=p_env and (x.state='closed' or x.expires_at<=tick);
 if p_action='create' then
  if exists(select from public.sb_dungeon_party_members where game_env=p_env and code=p_code)
   then raise exception 'party_already_active'; end if;
  insert into public.sb_dungeon_party_rooms(game_env,host) values(p_env,p_code) returning * into r;
  insert into public.sb_dungeon_party_members(room_id,game_env,code) values(r.id,p_env,p_code);
 else
  if p_action='status' and p_room is null then
   select m.room_id into p_room from public.sb_dungeon_party_members m
    where m.game_env=p_env and m.code=p_code;
   if not found then return jsonb_build_object('left',true); end if;
  end if;
  select * into r from public.sb_dungeon_party_rooms where id=p_room and game_env=p_env
   and state<>'closed' and expires_at>tick for update;
  if not found then raise exception 'party_unavailable'; end if;
  if p_action='join' then
   if r.state<>'waiting' then raise exception 'party_started'; end if;
   if exists(select from public.sb_dungeon_party_members where room_id=r.id and code=p_code) then null;
   else
    if exists(select from public.sb_dungeon_party_members where game_env=p_env and code=p_code)
     then raise exception 'party_already_active'; end if;
    if exists(select from public.sb_dungeon_party_members m join public.sb_player_characters c
      on c.code=m.code and c.game_env=m.game_env where m.room_id=r.id and c.account_id=auth.uid())
     then raise exception 'one_character_per_account'; end if;
    select count(*) into n from public.sb_dungeon_party_members where room_id=r.id;
    if n>=4 then raise exception 'party_full'; end if;
    perform public.sb_dungeon_party_assert_classes(p_env,r.id,p_code);
    insert into public.sb_dungeon_party_members(room_id,game_env,code) values(r.id,p_env,p_code);
    update public.sb_dungeon_party_members set ready=false where room_id=r.id;
   end if;
  else
   if not exists(select from public.sb_dungeon_party_members where room_id=r.id and code=p_code)
    then raise exception 'party_not_member' using errcode='42501'; end if;
   if p_action='ready' then
    if r.state<>'waiting' or p_ready is null then raise exception 'party_not_waiting'; end if;
    update public.sb_dungeon_party_members set ready=p_ready where room_id=r.id and code=p_code;
   elsif p_action='start' then
    if r.host<>p_code then raise exception 'party_host_only' using errcode='42501'; end if;
    if r.state='waiting' then
     select count(*) into n from public.sb_dungeon_party_members where room_id=r.id;
     if n<2 or n>4 then raise exception 'party_size'; end if;
     if exists(select from public.sb_dungeon_party_members where room_id=r.id and
       (not ready or last_seen<tick-interval '30 seconds')) then raise exception 'party_not_ready'; end if;
     perform public.sb_dungeon_party_assert_classes(p_env,r.id,null);
     update public.sb_dungeon_party_rooms set state='active',started_size=n where id=r.id;
    end if;
   elsif p_action='leave' then
    -- An active run retains its roster and scaling; disconnection is not a new run.
    if r.state='active' then raise exception 'party_run_active'; end if;
    delete from public.sb_dungeon_party_members where room_id=r.id and code=p_code;
    update public.sb_dungeon_party_members set ready=false where room_id=r.id;
    if r.host=p_code then
     update public.sb_dungeon_party_rooms set state='closed' where id=r.id;
     delete from public.sb_dungeon_party_members where room_id=r.id;
    end if;
    return jsonb_build_object('left',true);
   elsif p_action<>'status' then raise exception 'bad_party_action'; end if;
  end if;
 end if;
 update public.sb_dungeon_party_members set last_seen=tick where room_id=r.id and code=p_code;
 if p_action<>'status' then update public.sb_dungeon_party_rooms set revision=revision+1 where id=r.id; end if;
 select * into r from public.sb_dungeon_party_rooms where id=r.id;
 return jsonb_build_object('id',r.id,'joinCode',r.join_code,'host',r.host,'state',r.state,'floor',r.floor,
  'startedSize',r.started_size,'revision',r.revision,'expiresAt',r.expires_at,
  'members',(select jsonb_agg(jsonb_build_object('code',m.code,'name',c.name,'cls',c.class_id,
   'level',c.level,'ready',m.ready,'online',m.last_seen>=tick-interval '30 seconds') order by m.joined_at,m.code)
   from public.sb_dungeon_party_members m join public.sb_player_characters c on c.code=m.code and c.game_env=m.game_env where m.room_id=r.id));
end $function$
;
CREATE OR REPLACE FUNCTION public.sb_dungeon_party_public(p_env text, p_code text, p_action text, p_room uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare
 result jsonb;
 target uuid;
 tick timestamptz := statement_timestamp();
begin
 if p_action is null or p_action not in ('status','create','join') then
  raise exception 'bad_party_action';
 end if;

 -- The existing command verifies character ownership and takes the lobby
 -- transaction lock, shared with private joins, ready, and start.
 result := public.sb_dungeon_party_command(
  p_env,p_code,'status',case when p_action='status' then p_room end,null
 );
 target := (result->>'id')::uuid;

 if target is null and p_action='create' then
  result := public.sb_dungeon_party_command(p_env,p_code,'create',null,null);
  target := (result->>'id')::uuid;
  update public.sb_dungeon_party_rooms set is_public=true where id=target;
 elsif target is null and p_action='join' then
  select r.id into target
  from public.sb_dungeon_party_rooms r
  cross join lateral (
   select count(*) as size, bool_and(m.last_seen>=tick-interval '30 seconds') as online
   from public.sb_dungeon_party_members m where m.room_id=r.id
  ) seats
  where r.game_env=p_env and r.is_public and r.state='waiting' and r.expires_at>tick
    and seats.online and seats.size between 1 and 3
    and not exists (
     select 1 from public.sb_dungeon_party_members m
     join public.sb_player_characters c on c.game_env=m.game_env and c.code=m.code
     where m.room_id=r.id and c.account_id=auth.uid()
    )
    and not exists(select 1 from public.sb_dungeon_party_members m join public.sb_player_characters existing on existing.game_env=m.game_env and existing.code=m.code join public.sb_player_characters entrant on entrant.game_env=p_env and entrant.code=p_code where m.room_id=r.id and public.sb_dungeon_party_class_family(existing.class_id)=public.sb_dungeon_party_class_family(entrant.class_id))
    and seats.size=(select count(distinct public.sb_dungeon_party_class_family(c.class_id)) from public.sb_dungeon_party_members m join public.sb_player_characters c on c.game_env=m.game_env and c.code=m.code where m.room_id=r.id)
  order by seats.size desc,r.created_at,r.id
  limit 1;
  if target is null then raise exception 'public_room_unavailable'; end if;
  result := public.sb_dungeon_party_command(p_env,p_code,'join',target,null);
 end if;

 if target is null then return result; end if;
 return result || jsonb_build_object('isPublic',(
  select r.is_public from public.sb_dungeon_party_rooms r where r.id=target
 ));
end
$function$
;
notify pgrst, 'reload schema';
commit;
