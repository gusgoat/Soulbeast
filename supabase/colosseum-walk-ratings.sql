begin;

-- Resolve only the caller and players in a shared walk scene or party.
create or replace function public.sb_colosseum_walk_ratings(p_code text,p_scene text,p_peer_ids uuid[])
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  own_score integer;
  peer_scores jsonb := '{}'::jsonb;
  room uuid;
begin
  if (p_scene is not null and p_scene !~ '^(country:(blue|green|red)|town:(blue|green|red)-(capital|city-[1-4]|village-([1-9]|1[0-6]))|dungeon:[0-9a-f-]{36}:[1-7])$')
     or coalesce(cardinality(p_peer_ids),0)>40 then
    raise exception 'Invalid walk scene' using errcode='22023';
  end if;
  select coalesce(r.score,0) into own_score
    from public.sb_player_characters c left join public.sb_colosseum_ratings r on r.code=c.code
    where c.game_env='live' and c.code=p_code and c.status='active' and c.account_id=auth.uid();
  if not found then
    raise exception 'Character not owned' using errcode='42501';
  end if;
  if p_scene like 'dungeon:%' then
    room := split_part(p_scene,':',2)::uuid;
    select coalesce(jsonb_object_agg(m.code,coalesce(r.score,0)),'{}'::jsonb) into peer_scores
      from public.sb_dungeon_party_members m
      join public.sb_dungeon_party_rooms lobby on lobby.id=m.room_id and lobby.game_env=m.game_env
      join public.sb_player_characters c on c.game_env=m.game_env and c.code=m.code and c.status='active'
      left join public.sb_colosseum_ratings r on r.code=m.code
      where m.game_env='live' and m.room_id=room and lobby.expires_at>statement_timestamp()
      and exists (select from public.sb_dungeon_party_members caller
        where caller.game_env=m.game_env and caller.room_id=m.room_id and caller.code=p_code);
  elsif p_scene is not null and coalesce(cardinality(p_peer_ids),0)>0 then
    select coalesce(jsonb_object_agg(p.public_id::text,coalesce(r.score,0)),'{}'::jsonb) into peer_scores
      from public.sb_walk_presence p
      join public.sb_player_characters c on c.game_env=p.game_env and c.code=p.code and c.status='active'
      left join public.sb_colosseum_ratings r on r.code=p.code
      where p.game_env='live' and p.scene=p_scene and p.public_id=any(p_peer_ids)
        and p.last_seen>statement_timestamp()-interval '8 seconds'
        and exists (select from public.sb_walk_presence caller
          where caller.game_env=p.game_env and caller.code=p_code and caller.scene=p_scene
            and caller.last_seen>statement_timestamp()-interval '8 seconds');
  end if;
  return jsonb_build_object('own',own_score,'peers',peer_scores);
end
$$;
revoke all on function public.sb_colosseum_walk_ratings(text,text,uuid[]) from public, anon, authenticated;
grant execute on function public.sb_colosseum_walk_ratings(text,text,uuid[]) to authenticated;
notify pgrst,'reload schema';
commit;
