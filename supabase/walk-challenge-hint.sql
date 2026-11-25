begin;

-- Walking clients only need to know whether to fetch the full social view.
create or replace function public.sb_walk_has_challenge(p_env text, p_code text)
returns boolean language plpgsql stable security definer set search_path=pg_catalog as $$
declare now_ms bigint := floor(extract(epoch from statement_timestamp()) * 1000);
begin
 if not exists (select 1 from public.sb_player_characters
   where account_id=auth.uid() and game_env=p_env and code=p_code and status='active') then
   raise exception using errcode='42501',message='character_not_owned';
 end if;
 return exists (
   select 1 from public.sb_engine_tables t cross join lateral jsonb_array_elements(t.rows) r
   where t.environment=p_env and t.name='FriendChallenges'
   and ((r->>3='pending' and r->>2=p_code and
         case when r->>5 ~ '^[0-9]{1,15}$' then (r->>5)::bigint end > now_ms)
     or (r->>3='accepted' and p_code in (r->>1,r->>2) and
         case when r->>4 ~ '^[0-9]{1,15}$' then (r->>4)::bigint end > now_ms-600000))
 );
end;
$$;
revoke all on function public.sb_walk_has_challenge(text,text) from public,anon;
grant execute on function public.sb_walk_has_challenge(text,text) to authenticated;
notify pgrst,'reload schema';
commit;
