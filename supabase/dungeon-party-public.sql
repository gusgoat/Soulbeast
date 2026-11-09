begin;

alter table public.sb_dungeon_party_rooms
 add column if not exists is_public boolean not null default false;

create index if not exists sb_dungeon_party_public_waiting_idx
 on public.sb_dungeon_party_rooms(game_env,created_at)
 where is_public and state='waiting';

create or replace function public.sb_dungeon_party_public(
 p_env text, p_code text, p_action text, p_room uuid default null
) returns jsonb
language plpgsql security definer set search_path=pg_catalog
as $$
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
$$;

revoke all on function public.sb_dungeon_party_public(text,text,text,uuid) from public,anon;
grant execute on function public.sb_dungeon_party_public(text,text,text,uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
