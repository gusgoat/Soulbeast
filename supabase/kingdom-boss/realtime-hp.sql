begin;

create or replace function public.sb_kingdom_boss_hp_listener(p_topic text)
returns boolean language sql stable security definer set search_path = '' as $$
 select p_topic ~ '^sb-kb-hp:(live|test):[0-9]+$' and exists (
  select from auth.users where id=(select auth.uid()) and email_confirmed_at is not null and deleted_at is null
 );
$$;
revoke all on function public.sb_kingdom_boss_hp_listener(text) from public, anon;
grant execute on function public.sb_kingdom_boss_hp_listener(text) to authenticated;

drop policy if exists sb_kingdom_boss_hp_receive on realtime.messages;
create policy sb_kingdom_boss_hp_receive on realtime.messages for select to authenticated
 using (extension='broadcast' and public.sb_kingdom_boss_hp_listener((select realtime.topic())));

drop policy if exists sb_kingdom_boss_hp_server_only on realtime.messages;
create policy sb_kingdom_boss_hp_server_only on realtime.messages as restrictive for insert to anon, authenticated
 with check (coalesce(topic,'') not like 'sb-kb-hp:%' and coalesce((select realtime.topic()),'') not like 'sb-kb-hp:%');

create or replace function public.sb_kingdom_boss_hp_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_boss jsonb; previous_boss jsonb;
begin
 select (entry->>1)::jsonb into current_boss from jsonb_array_elements(new.rows) entry
  where entry->>0='kb:public' limit 1;
 if current_boss is null or current_boss->>'id' !~ '^[0-9]+$' then return new; end if;
 if tg_op='UPDATE' then
  select (entry->>1)::jsonb into previous_boss from jsonb_array_elements(old.rows) entry
   where entry->>0='kb:public' limit 1;
 end if;
 if previous_boss->'id' is not distinct from current_boss->'id'
  and previous_boss->'hp' is not distinct from current_boss->'hp'
  and previous_boss->'maxHP' is not distinct from current_boss->'maxHP'
  and previous_boss->'status' is not distinct from current_boss->'status' then return new; end if;
 perform realtime.send(jsonb_build_object(
  'id',current_boss->'id','hp',current_boss->'hp','maxHP',current_boss->'maxHP',
  'rev',current_boss->'rev','status',current_boss->'status'
 ),'hp','sb-kb-hp:'||new.environment||':'||(current_boss->>'id'),true);
 return new;
exception when others then
 -- Battle commits and the status API continue even if broadcast is unavailable.
 return new;
end;
$$;
revoke all on function public.sb_kingdom_boss_hp_notify() from public, anon, authenticated;
drop trigger if exists sb_kingdom_boss_hp_notify on public.sb_engine_tables;
create trigger sb_kingdom_boss_hp_notify after insert or update of rows on public.sb_engine_tables
 for each row when (new.name='GuildState') execute function public.sb_kingdom_boss_hp_notify();

commit;
