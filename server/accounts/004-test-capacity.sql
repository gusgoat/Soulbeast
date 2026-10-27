-- Optional service-managed capacity; ordinary accounts retain five slots.
begin;
create table if not exists public.sb_player_capacity_overrides(account_id uuid primary key references auth.users(id),slot_limit integer not null check(slot_limit between 6 and 100),reason text not null);
alter table public.sb_player_capacity_overrides enable row level security;
revoke all on public.sb_player_capacity_overrides from public,anon,authenticated;
create or replace function public.sb_player_account_command(p_action text,p_account uuid,p_env text,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.sb_player_characters%rowtype; slot_limit integer;
begin
 if p_env not in ('live','test') or not exists(select 1 from auth.users where id=p_account and deleted_at is null and email_confirmed_at is not null) then raise exception 'verified_account_required';end if;
 select coalesce((select o.slot_limit from public.sb_player_capacity_overrides o where o.account_id=p_account),5) into slot_limit;
 -- One account has five slots across environments; reservations and retirement share the lock.
 perform pg_advisory_xact_lock(hashtextextended('sb-player:'||p_account::text,0));
 if p_action='capacity' then
  return jsonb_build_object('used',(select count(*) from public.sb_player_characters where account_id=p_account and status<>'deleted'),'limit',slot_limit);
 elsif p_action='list' then
  return coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.sb_player_characters x where x.account_id=p_account and x.game_env=p_env and x.status<>'deleted'),'[]'::jsonb);
 elsif p_action='reserve' then
  select * into c from public.sb_player_characters where account_id=p_account and game_env=p_env and request_id=(p_data->>'request_id')::uuid;
  if found then
   if c.status='deleted' then raise exception 'character_deleted';end if;
   if c.digest<>p_data->>'digest' then raise exception 'request_payload_changed';end if;
   return to_jsonb(c);
  end if;
  if (select count(*) from public.sb_player_characters where account_id=p_account and status<>'deleted')>=slot_limit then raise exception 'character_limit';end if;
  insert into public.sb_player_characters(account_id,game_env,code,request_id,digest,engine_pin,name,class_id,draft)
   values(p_account,p_env,p_data->>'code',(p_data->>'request_id')::uuid,p_data->>'digest',p_data->>'engine_pin',left(p_data->'draft'->'P'->>'name',20),p_data->'draft'->'P'->>'cls',p_data->'draft') returning * into c;
  return to_jsonb(c);
 end if;
 select * into c from public.sb_player_characters where game_env=p_env and code=p_data->>'code' and account_id=p_account;
 if not found then raise exception 'character_not_owned';end if;
 if p_action='get' then return to_jsonb(c);
 elsif p_action='delete' then
  update public.sb_player_characters set status='deleted',deleted_at=coalesce(deleted_at,now()),draft=null where game_env=p_env and code=c.code and account_id=p_account;
  return jsonb_build_object('ok',true,'code',c.code,'deleted',true);
 elsif p_action='activate' then
  if c.status='deleted' then raise exception 'character_deleted';end if;
  update public.sb_player_characters set status='active',draft=null where game_env=p_env and code=c.code;
  insert into public.sb_shop_characters(account_id,game_env,code,name) values(p_account,p_env,c.code,c.name)
   on conflict(game_env,code) do update set name=excluded.name where sb_shop_characters.account_id=excluded.account_id;
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'bad_account_action';
end $$;
revoke all on function public.sb_player_account_command(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.sb_player_account_command(text,uuid,text,jsonb) to service_role;
commit;
