begin;
do $migration$
declare
 current_definition text := pg_get_functiondef('public.sb_dungeon_party_command(text,text,text,uuid,boolean)'::regprocedure);
 old_guard constant text := 'if p_env is distinct from ''live'' or not exists (';
 new_guard constant text := 'if p_env is null or p_env not in (''live'',''test'') or not exists (';
begin
 if md5(current_definition) <> 'e8f79038ba34642a0297a42685849f50' or strpos(current_definition,old_guard)=0 then
  raise exception 'Dungeon party lobby changed since review';
 end if;
 -- Ownership and every membership lookup continue to use the requested world.
 execute replace(current_definition,old_guard,new_guard);
end $migration$;
commit;
