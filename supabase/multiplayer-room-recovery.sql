begin;
create or replace function public.sb_walk_recover_rooms(p_env text, p_code text)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare rooms jsonb; item record; state jsonb; player jsonb; kind text;
begin
 if not exists(select 1 from public.sb_player_characters
   where account_id=auth.uid() and game_env=p_env and code=p_code and status='active') then
   raise exception using errcode='42501',message='character_not_owned';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('kind','dungeon','id',r.id,'state',r.state)), '[]'::jsonb)
 into rooms from public.sb_dungeon_party_rooms r join public.sb_dungeon_party_members m on m.room_id=r.id
 where r.game_env=p_env and m.code=p_code and r.state in ('waiting','active') and r.expires_at>statement_timestamp();
 for item in select t.name, e.row from public.sb_engine_tables t
   cross join lateral jsonb_array_elements(t.rows) e(row)
   where t.environment=p_env and t.name in ('WorldRooms','PVPRooms')
     and e.row->>1 in ('waiting','starting','lobby','active')
 loop
   if (item.name='PVPRooms' or item.row->>1='lobby') and
       (item.row->>3)::numeric <= extract(epoch from statement_timestamp())*1000 then continue; end if;
   select convert_from(decode(string_agg(regexp_replace(v,'^(PV1|WB1):',''),'' order by n),'base64'),'UTF8')::jsonb
     into state from jsonb_array_elements_text(item.row) with ordinality parts(v,n) where n>=5;
   select p into player from jsonb_array_elements(state->'players') p where p->>'code'=p_code limit 1;
   if player is null or coalesce((player->>'forfeit')::boolean,false) then continue; end if;
   kind:=case when item.name='WorldRooms' then 'world' when state->>'raid'='true' then 'camp' else 'pvp' end;
   if kind='camp' and state->'players'->0->>'code'<>p_code then continue; end if;
   rooms:=rooms||jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('kind',kind,'id',state->>'id','state',state->>'status',
     'token',case when kind='camp' then state->>'campToken' end)));
 end loop;
 -- The kingdom boss stores a shared event. Only its current, personal fight is recoverable.
 select (entry->>1)::jsonb into state from public.sb_engine_tables t
 cross join lateral jsonb_array_elements(t.rows) entry
 where t.environment=p_env and t.name='GuildState' and entry->>0=(
   select (pointer->>1)::jsonb->>'id' from jsonb_array_elements(t.rows) pointer where pointer->>0='kb:current' limit 1
 ) limit 1;
 if state->>'status'='active' and (state->>'end')::numeric>extract(epoch from statement_timestamp())*1000 then
   player:=state->'fights'->(state->'players'->p_code->>'fight');
   if player->>'status'='active' then
     rooms:=rooms||jsonb_build_array(jsonb_build_object('kind','kingdom','state','active','id',player->>'id',
       'round',state->>'start','country',state->>'country','duel',player->>'kind'='pvp'));
   end if;
 end if;
 return rooms;
end $$;
revoke all on function public.sb_walk_recover_rooms(text,text) from public,anon;
grant execute on function public.sb_walk_recover_rooms(text,text) to authenticated;
notify pgrst,'reload schema';
commit;
