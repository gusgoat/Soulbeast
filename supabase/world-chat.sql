begin;

create table if not exists public.sb_world_chat (
 id bigint generated always as identity primary key,
 environment text not null check (environment in ('live','test')),
 created_at timestamptz not null default clock_timestamp(),
 kind text not null check (kind in ('player','solar','camp','war','friend')),
 speaker text not null,
 body text not null,
 recipient text,
 event_key text,
 check ((recipient is null) = (kind in ('player','solar'))),
 unique(environment,event_key)
);
alter table public.sb_world_chat add column if not exists speaker_class text,
 add column if not exists speaker_gender text;
create index if not exists sb_world_chat_public on public.sb_world_chat(environment,id desc) where recipient is null;
create index if not exists sb_world_chat_personal on public.sb_world_chat(environment,recipient,id desc) where recipient is not null;
create index if not exists sb_world_chat_expiry on public.sb_world_chat(created_at);
alter table public.sb_world_chat enable row level security;
revoke all on public.sb_world_chat from public, anon, authenticated;

create table if not exists public.sb_world_chat_cooldown (
 environment text not null,
 account uuid not null references auth.users(id) on delete cascade,
 sent_at timestamptz not null,
 request_id uuid not null,
 primary key(environment,account)
);
create index if not exists sb_world_chat_cooldown_expiry on public.sb_world_chat_cooldown(sent_at);
alter table public.sb_world_chat_cooldown enable row level security;
revoke all on public.sb_world_chat_cooldown from public, anon, authenticated;

create or replace function public.sb_chat_sender(p_env text,p_code text)
returns table(name text,class_id text,gender text) language sql stable security definer set search_path='' as $$
 select c.name,c.class_id,coalesce(to_jsonb(c)->>'walk_gender',to_jsonb(c)->>'gender')
 from public.sb_player_characters c join auth.users u on u.id=c.account_id
 where c.game_env=p_env and c.code=p_code and c.account_id=(select auth.uid())
 and c.status='active' and u.email_confirmed_at is not null and u.deleted_at is null;
$$;
revoke all on function public.sb_chat_sender(text,text) from public, anon, authenticated;

create or replace function public.sb_world_chat_access(p_env text,p_code text)
returns text language sql stable security definer set search_path='' as $$
 select name from public.sb_chat_sender(p_env,p_code);
$$;
revoke all on function public.sb_world_chat_access(text,text) from public, anon, authenticated;

create or replace function public.sb_chat_message(p_body text)
returns text language sql immutable set search_path='' as $$
 select message from (select btrim(regexp_replace(left(p_body,1000),'[[:cntrl:][:space:]]+',' ','g')) message) clean
 where char_length(p_body)<=1000 and char_length(message) between 1 and 240
 and message ~ U&'[^[:space:]\200B\200C\200D\FEFF]';
$$;
revoke all on function public.sb_chat_message(text) from public, anon, authenticated;

create or replace function public.sb_chat_day(p_time timestamptz)
returns timestamptz language sql stable set search_path='' as $$
 select date_trunc('day',p_time,'Asia/Bangkok');
$$;
revoke all on function public.sb_chat_day(timestamptz) from public, anon, authenticated;

create or replace function public.sb_world_chat_feed(p_env text,p_code text,p_full boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare world jsonb; personal jsonb:='[]'; retry_at timestamptz; cutoff timestamptz:=now()-interval '24 hours';
begin
 if public.sb_world_chat_access(p_env,p_code) is null then raise exception 'character_not_owned'; end if;
 select coalesce(jsonb_agg(to_jsonb(m) order by m.id::bigint),'[]') into world from (
  select id::text id,created_at,kind,speaker,body,speaker_class,speaker_gender from public.sb_world_chat
  where environment=p_env and recipient is null and created_at>=cutoff
  order by sb_world_chat.id desc limit case when p_full then 50 else 3 end
 ) m;
 if p_full then
  select coalesce(jsonb_agg(to_jsonb(m) order by m.id::bigint),'[]') into personal from (
   select id::text id,created_at,kind,speaker,body from public.sb_world_chat
   where environment=p_env and recipient=p_code and created_at>=cutoff
   order by sb_world_chat.id desc limit 50
  ) m;
  select sent_at+interval '2 hours' into retry_at from public.sb_world_chat_cooldown
   where environment=p_env and account=(select auth.uid());
 end if;
 return jsonb_build_object('world',world,'personal',personal,'retryAt',retry_at,'serverTime',now());
end $$;
revoke all on function public.sb_world_chat_feed(text,text,boolean) from public, anon;
grant execute on function public.sb_world_chat_feed(text,text,boolean) to authenticated;

create or replace function public.sb_world_chat_send(p_env text,p_code text,p_body text,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); profile record; message text;
 previous public.sb_world_chat_cooldown%rowtype; sent timestamptz;
begin
 select * into profile from public.sb_chat_sender(p_env,p_code);
 if not found then raise exception 'character_not_owned'; end if;
 message:=public.sb_chat_message(p_body);
 if p_request is null or message is null then
  return jsonb_build_object('status','invalid_message');
 end if;
 perform pg_advisory_xact_lock(hashtextextended('sb-world-chat:'||p_env||':'||actor::text,0));
 sent:=clock_timestamp();
 select * into previous from public.sb_world_chat_cooldown where environment=p_env and account=actor;
 if previous.request_id=p_request then
  return jsonb_build_object('status','sent','retryAt',previous.sent_at+interval '2 hours','serverTime',sent);
 end if;
 if previous.sent_at+interval '2 hours'>sent then
  return jsonb_build_object('status','cooldown','retryAt',previous.sent_at+interval '2 hours','serverTime',sent);
 end if;
 insert into public.sb_world_chat(environment,created_at,kind,speaker,body,speaker_class,speaker_gender)
 values(p_env,sent,'player',profile.name,message,profile.class_id,profile.gender);
 insert into public.sb_world_chat_cooldown values(p_env,actor,sent,p_request)
 on conflict(environment,account) do update set sent_at=excluded.sent_at,request_id=excluded.request_id;
 return jsonb_build_object('status','sent','retryAt',sent+interval '2 hours','serverTime',sent);
end $$;
revoke all on function public.sb_world_chat_send(text,text,text,uuid) from public, anon;
grant execute on function public.sb_world_chat_send(text,text,text,uuid) to authenticated;

create or replace function public.sb_world_chat_listener(p_topic text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
  select from auth.users u join public.sb_player_characters c on c.account_id=u.id
  where u.id=(select auth.uid()) and u.email_confirmed_at is not null and u.deleted_at is null
  and c.status='active' and p_topic in ('sb-chat:'||c.game_env||':world','sb-chat:'||c.game_env||':'||u.id::text)
 );
$$;
revoke all on function public.sb_world_chat_listener(text) from public, anon;
grant execute on function public.sb_world_chat_listener(text) to authenticated;

drop policy if exists sb_world_chat_receive on realtime.messages;
create policy sb_world_chat_receive on realtime.messages for select to authenticated
 using (extension='broadcast' and public.sb_world_chat_listener((select realtime.topic())));
drop policy if exists sb_world_chat_restrict_read on realtime.messages;
create policy sb_world_chat_restrict_read on realtime.messages as restrictive for select to authenticated
 using ((coalesce((select realtime.topic()),'') not like 'sb-chat:%' and coalesce(topic,'') not like 'sb-chat:%')
  or (topic=(select realtime.topic()) and public.sb_world_chat_listener((select realtime.topic()))));
drop policy if exists sb_world_chat_signed_in on realtime.messages;
create policy sb_world_chat_signed_in on realtime.messages as restrictive for select to anon
 using (coalesce((select realtime.topic()),'') not like 'sb-chat:%' and coalesce(topic,'') not like 'sb-chat:%');
drop policy if exists sb_world_chat_server_only on realtime.messages;
create policy sb_world_chat_server_only on realtime.messages as restrictive for insert to anon, authenticated
 with check (coalesce(topic,'') not like 'sb-chat:%' and coalesce((select realtime.topic()),'') not like 'sb-chat:%');

create or replace function public.sb_world_chat_notify()
returns trigger language plpgsql security definer set search_path='' as $$
declare owner uuid; room text:='world';
begin
 if new.recipient is not null then
  select account_id into owner from public.sb_player_characters
   where game_env=new.environment and code=new.recipient and status='active';
  if owner is null then return null; end if;
  room:=owner::text;
 end if;
 -- Realtime retains its own events. Keep message content exclusively in the 24-hour table.
 perform realtime.send('{}'::jsonb,'message','sb-chat:'||new.environment||':'||room,true);
 return null;
exception when others then
 raise warning 'World chat broadcast failed (%).',sqlstate;
 return null;
end $$;
revoke all on function public.sb_world_chat_notify() from public, anon, authenticated;
drop trigger if exists sb_world_chat_notify on public.sb_world_chat;
create trigger sb_world_chat_notify after insert on public.sb_world_chat
 for each row execute function public.sb_world_chat_notify();

create table if not exists public.sb_guild_chat (
 id bigint generated always as identity primary key,
 environment text not null check (environment in ('live','test')),
 guild_id text not null,
 account uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 created_at timestamptz not null default clock_timestamp(),
 speaker text not null,
 body text not null,
 unique(environment,account,request_id)
);
alter table public.sb_guild_chat add column if not exists speaker_class text,
 add column if not exists speaker_gender text;
create index if not exists sb_guild_chat_history on public.sb_guild_chat(environment,guild_id,id desc);
create index if not exists sb_guild_chat_sender on public.sb_guild_chat(environment,account,id desc);
create index if not exists sb_guild_chat_expiry on public.sb_guild_chat(created_at);
alter table public.sb_guild_chat enable row level security;
revoke all on public.sb_guild_chat from public, anon, authenticated;

-- Membership comes from the current game state, including both the character's
-- guild pointer and the guild roster. Clients cannot pick a different room.
create or replace function public.sb_guild_chat_room(p_rows jsonb,p_code text)
returns jsonb language sql stable set search_path='' as $$
 with membership as (
  select max(entry->>1)::jsonb->>'guildId' id
  from jsonb_array_elements(p_rows) entry where entry->>0='m:'||p_code
 )
 select guild from membership m cross join lateral (
  select max(entry->>1)::jsonb guild
  from jsonb_array_elements(p_rows) entry where entry->>0='g:'||m.id
 ) room where guild->>'id'=m.id and guild->>'deleted' is distinct from 'true'
 and guild->'members' ? p_code;
$$;
revoke all on function public.sb_guild_chat_room(jsonb,text) from public, anon, authenticated;

create or replace function public.sb_guild_chat_feed(p_env text,p_code text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare room jsonb; history jsonb; retry_at timestamptz; daily_limit int; sent_today int;
 day_start timestamptz:=public.sb_chat_day(now());
begin
 if public.sb_world_chat_access(p_env,p_code) is null then raise exception 'character_not_owned'; end if;
 select public.sb_guild_chat_room(rows,p_code) into room
 from public.sb_engine_tables where environment=p_env and name='GuildState';
 if room is null then return jsonb_build_object('guild',null,'messages','[]'::jsonb,'serverTime',now()); end if;
 select coalesce(jsonb_agg(to_jsonb(m) order by m.id::bigint),'[]') into history from (
  select id::text id,created_at,'player' as kind,speaker,body,speaker_class,speaker_gender from public.sb_guild_chat
  where environment=p_env and guild_id=room->>'id' and created_at>=now()-interval '24 hours'
  order by sb_guild_chat.id desc limit 50
 ) m;
 select created_at+interval '3 seconds' into retry_at from public.sb_guild_chat
 where environment=p_env and account=(select auth.uid()) order by id desc limit 1;
 daily_limit:=case when room->>'leader'=p_code then 20 else 10 end;
 select count(*) into sent_today from public.sb_guild_chat
 where environment=p_env and account=(select auth.uid()) and created_at>=day_start;
 return jsonb_build_object('guild',jsonb_build_object('id',room->>'id','name',room->>'name'),
  'messages',history,'retryAt',retry_at,'serverTime',now(),
  'limit',daily_limit,'left',greatest(0,daily_limit-sent_today),'resetAt',day_start+interval '24 hours');
end $$;
revoke all on function public.sb_guild_chat_feed(text,text) from public, anon;
grant execute on function public.sb_guild_chat_feed(text,text) to authenticated;

create or replace function public.sb_guild_chat_send(p_env text,p_code text,p_guild text,p_body text,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); profile record; message text; room jsonb; sent timestamptz;
 previous public.sb_guild_chat%rowtype; listener uuid; day_start timestamptz; daily_limit int; sent_today int;
begin
 select * into profile from public.sb_chat_sender(p_env,p_code);
 if not found then raise exception 'character_not_owned'; end if;
 message:=public.sb_chat_message(p_body);
 if p_request is null or message is null then return jsonb_build_object('status','invalid_message'); end if;
 perform pg_advisory_xact_lock(hashtextextended('sb-guild-chat:'||p_env||':'||actor::text,0));
 select public.sb_guild_chat_room(rows,p_code) into room from public.sb_engine_tables
 where environment=p_env and name='GuildState' for share;
 if room is null or room->>'id' is distinct from p_guild then
  return jsonb_build_object('status','guild_changed');
 end if;
 sent:=clock_timestamp();
 select * into previous from public.sb_guild_chat where environment=p_env and account=actor and request_id=p_request;
 if found then
  return jsonb_build_object('status',case when previous.guild_id=p_guild and previous.body=message then 'sent' else 'invalid_message' end,
   'retryAt',previous.created_at+interval '3 seconds','serverTime',sent);
 end if;
 day_start:=public.sb_chat_day(sent);
 daily_limit:=case when room->>'leader'=p_code then 20 else 10 end;
 select count(*) into sent_today from public.sb_guild_chat
 where environment=p_env and account=actor and created_at>=day_start;
 if sent_today>=daily_limit then
  return jsonb_build_object('status','daily_limit','left',0,'limit',daily_limit,'resetAt',day_start+interval '24 hours','serverTime',sent);
 end if;
 select * into previous from public.sb_guild_chat where environment=p_env and account=actor order by id desc limit 1;
 if previous.created_at+interval '3 seconds'>sent then
  return jsonb_build_object('status','cooldown','retryAt',previous.created_at+interval '3 seconds','serverTime',sent);
 end if;
 insert into public.sb_guild_chat(environment,guild_id,account,request_id,created_at,speaker,body,speaker_class,speaker_gender)
 values(p_env,p_guild,actor,p_request,sent,profile.name,message,profile.class_id,profile.gender);
 begin
  for listener in
   select distinct c.account_id from public.sb_player_characters c
   where c.game_env=p_env and c.status='active' and room->'members' ? c.code
  loop
   perform realtime.send('{}'::jsonb,'guild-message','sb-chat:'||p_env||':'||listener::text,true);
  end loop;
 exception when others then
  raise warning 'Guild chat broadcast failed (%).',sqlstate;
 end;
 return jsonb_build_object('status','sent','retryAt',sent+interval '3 seconds','serverTime',sent,
  'left',daily_limit-sent_today-1,'limit',daily_limit,'resetAt',day_start+interval '24 hours');
end $$;
revoke all on function public.sb_guild_chat_send(text,text,text,text,uuid) from public, anon;
grant execute on function public.sb_guild_chat_send(text,text,text,text,uuid) to authenticated;

create table if not exists public.sb_friend_chat (
 id bigint generated always as identity primary key,
 environment text not null check (environment in ('live','test')),
 sender text not null,
 recipient text not null check (recipient<>sender),
 account uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 created_at timestamptz not null,
 speaker text not null,
 body text not null,
 unique(environment,account,request_id)
);
alter table public.sb_friend_chat add column if not exists speaker_class text,
 add column if not exists speaker_gender text;
create index if not exists sb_friend_chat_history on public.sb_friend_chat
 (environment,least(sender,recipient),greatest(sender,recipient),id desc);
create index if not exists sb_friend_chat_sender on public.sb_friend_chat(environment,account,created_at desc);
create index if not exists sb_friend_chat_expiry on public.sb_friend_chat(created_at);
alter table public.sb_friend_chat enable row level security;
revoke all on public.sb_friend_chat from public, anon, authenticated;

create or replace function public.sb_chat_friends(p_rows jsonb,p_code text,p_env text)
returns table(id text,code text,name text,owner uuid) language sql stable set search_path='' as $$
 with accepted as (
  select case when entry->>1=p_code then entry->>2 else entry->>1 end as friend
  from jsonb_array_elements(p_rows) entry
  where p_code in (entry->>1,entry->>2) and entry->>1<>entry->>2
  group by 1
  having bool_or(entry->>1=p_code) and bool_or(entry->>2=p_code)
 )
 select md5('sb-chat-friend:'||c.code),c.code,c.name,c.account_id
 from accepted a join public.sb_player_characters c on c.code=a.friend and c.game_env=p_env
 join auth.users u on u.id=c.account_id
 where c.status='active' and u.email_confirmed_at is not null and u.deleted_at is null;
$$;
revoke all on function public.sb_chat_friends(jsonb,text,text) from public, anon, authenticated;

create or replace function public.sb_friend_chat_feed(p_env text,p_code text,p_friend text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare friend_rows jsonb; friends jsonb; target text; history jsonb:='[]'; retry_at timestamptz;
 day_start timestamptz:=public.sb_chat_day(now()); sent_today int;
begin
 if public.sb_world_chat_access(p_env,p_code) is null then raise exception 'character_not_owned'; end if;
 select rows into friend_rows from public.sb_engine_tables where environment=p_env and name='Friends';
 select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name) order by f.name,f.id),'[]'),
  max(f.code) filter(where f.id=p_friend) into friends,target
 from public.sb_chat_friends(friend_rows,p_code,p_env) f;
 if target is not null then
  select coalesce(jsonb_agg(to_jsonb(m) order by m.id::bigint),'[]') into history from (
   select id::text id,created_at,'player' as kind,speaker,body,speaker_class,speaker_gender from public.sb_friend_chat
   where environment=p_env and least(sender,recipient)=least(p_code,target)
    and greatest(sender,recipient)=greatest(p_code,target) and created_at>=now()-interval '24 hours'
   order by sb_friend_chat.id desc limit 50
  ) m;
 end if;
 select max(created_at)+interval '10 seconds',count(*) filter(where created_at>=day_start)
  into retry_at,sent_today from public.sb_friend_chat where environment=p_env and account=(select auth.uid());
 return jsonb_build_object('friends',friends,'available',target is not null,'messages',history,
  'retryAt',retry_at,'serverTime',now(),'limit',20,'left',greatest(0,20-sent_today),
  'resetAt',day_start+interval '24 hours');
end $$;
revoke all on function public.sb_friend_chat_feed(text,text,text) from public, anon;
grant execute on function public.sb_friend_chat_feed(text,text,text) to authenticated;

create or replace function public.sb_friend_chat_send(p_env text,p_code text,p_friend text,p_body text,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); profile record; message text; friend_rows jsonb; target record;
 previous public.sb_friend_chat%rowtype; sent timestamptz; day_start timestamptz; sent_today int;
begin
 select * into profile from public.sb_chat_sender(p_env,p_code);
 if not found then raise exception 'character_not_owned'; end if;
 message:=public.sb_chat_message(p_body);
 if p_request is null or message is null then return jsonb_build_object('status','invalid_message'); end if;
 perform pg_advisory_xact_lock(hashtextextended('sb-friend-chat:'||p_env||':'||actor::text,0));
 select rows into friend_rows from public.sb_engine_tables where environment=p_env and name='Friends' for share;
 select f.code,f.owner into target from public.sb_chat_friends(friend_rows,p_code,p_env) f where f.id=p_friend;
 if not found then return jsonb_build_object('status','friend_changed'); end if;
 sent:=clock_timestamp();
 select * into previous from public.sb_friend_chat where environment=p_env and account=actor and request_id=p_request;
 if found then
  return jsonb_build_object('status',case when previous.sender=p_code and previous.recipient=target.code
   and previous.body=message then 'sent' else 'invalid_message' end,
   'retryAt',previous.created_at+interval '10 seconds','serverTime',sent);
 end if;
 day_start:=public.sb_chat_day(sent);
 select * into previous from public.sb_friend_chat where environment=p_env and account=actor order by created_at desc limit 1;
 select count(*) into sent_today from public.sb_friend_chat where environment=p_env and account=actor and created_at>=day_start;
 if sent_today>=20 then
  return jsonb_build_object('status','daily_limit','left',0,'limit',20,'resetAt',day_start+interval '24 hours','serverTime',sent);
 end if;
 if previous.created_at+interval '10 seconds'>sent then
  return jsonb_build_object('status','cooldown','retryAt',previous.created_at+interval '10 seconds','serverTime',sent);
 end if;
 insert into public.sb_friend_chat(environment,sender,recipient,account,request_id,created_at,speaker,body,speaker_class,speaker_gender)
 values(p_env,p_code,target.code,actor,p_request,sent,profile.name,message,profile.class_id,profile.gender);
 begin
  perform realtime.send('{}'::jsonb,'friend-message','sb-chat:'||p_env||':'||target.owner::text,true);
  if target.owner<>actor then
   perform realtime.send('{}'::jsonb,'friend-message','sb-chat:'||p_env||':'||actor::text,true);
  end if;
 exception when others then
  raise warning 'Friend chat broadcast failed (%).',sqlstate;
 end;
 return jsonb_build_object('status','sent','retryAt',sent+interval '10 seconds','serverTime',sent,
  'left',20-sent_today-1,'limit',20,'resetAt',day_start+interval '24 hours');
end $$;
revoke all on function public.sb_friend_chat_send(text,text,text,text,uuid) from public, anon;
grant execute on function public.sb_friend_chat_send(text,text,text,text,uuid) to authenticated;

-- Project events from the committed game tables, including scheduled war updates.
create or replace function public.sb_world_chat_game_events()
returns trigger language plpgsql security definer set search_path='' as $$
declare prior jsonb; row jsonb; data jsonb; reward jsonb; key text; actor text; target text; who text;
 kind text; message text; event_key text; at_ms text; position bigint;
begin
 prior:=case when tg_op='UPDATE' then old.rows else '[]'::jsonb end;
 for row in
  with previous as (
   select value->>0 key,value from jsonb_array_elements(prior) with ordinality where ordinality>1
  )
  select n.value from jsonb_array_elements(new.rows) with ordinality n
   left join previous p on p.key=n.value->>0
   where n.ordinality>1 and case new.name
    when 'PVPRooms' then p.value is null
    when 'GachaTransactions' then n.value->>3='done' and p.value->>3 is distinct from 'done'
    else (n.value->>0 like 'friend-request:%' or n.value->>0 like 'cw:m:%')
     and n.value is distinct from p.value
   end
 loop
  begin
   key:=row->>0;
   if new.name='GachaTransactions' then
    actor:=row->>1;
    select name into who from public.sb_player_characters where game_env=new.environment and code=actor;
    for reward,position in
     select value,ordinality from jsonb_array_elements((row->>2)::jsonb->'rewards') with ordinality
     where value->>'category'='solarBeast' and value->>'type'='pet' and value->>'key' ~ '^[A-Za-z0-9_]{1,60}$'
    loop
     insert into public.sb_world_chat(environment,kind,speaker,body,event_key)
     values(new.environment,'solar',coalesce(who,'ผู้เล่น'),reward->>'key','solar:'||key||':'||position)
     on conflict do nothing;
    end loop;
    continue;
   end if;
   actor:=null; target:=null; who:=''; at_ms:=null; message:=''; event_key:=key;
   if new.name='PVPRooms' then
    select convert_from(decode(string_agg(substr(value,5),'' order by ordinality),'base64'),'UTF8')::jsonb into data
    from jsonb_array_elements_text(row) with ordinality where ordinality>4 and value like 'PV1:%';
    if data->>'raid' is distinct from 'true' then continue; end if;
    kind:='camp'; target:=data#>>'{players,1,code}'; who:=coalesce(data#>>'{players,0,name}','ผู้เล่น');
    at_ms:=row->>2; event_key:='camp:'||key;
   else
    data:=(row->>1)::jsonb;
    if key like 'friend-request:%' then
     if data->>'status' is distinct from 'pending' then continue; end if;
     kind:='friend'; target:=data->>'to'; actor:=data->>'from'; at_ms:=data->>'created';
     select coalesce(c.name,'ผู้เล่น') into who from public.sb_player_characters c
      where c.game_env=new.environment and c.code=actor;
    else
     kind:='war'; target:=data->>'code'; at_ms:=data->>'diedAt';
     if data->>'deadUntil' is null then continue; end if;
    end if;
    event_key:=key||':'||at_ms;
   end if;
   if at_ms is null or at_ms !~ '^[0-9]{13}$' or at_ms::bigint < extract(epoch from now()-interval '24 hours')*1000 then
    continue;
   end if;
   insert into public.sb_world_chat(environment,created_at,kind,speaker,body,recipient,event_key)
   select new.environment,to_timestamp(at_ms::bigint/1000.0),kind,coalesce(who,'ผู้เล่น'),message,target,event_key
   where exists(select from public.sb_player_characters where game_env=new.environment and code=target and status='active')
   on conflict do nothing;
  exception when data_exception then
   raise warning 'Skipped malformed chat source row in % (%).',new.name,sqlstate;
  end;
 end loop;
 return null;
end $$;
revoke all on function public.sb_world_chat_game_events() from public, anon, authenticated;
drop trigger if exists sb_world_chat_game_events on public.sb_engine_tables;
create trigger sb_world_chat_game_events after insert or update of rows on public.sb_engine_tables
 for each row when (new.name in ('GachaTransactions','GuildState','PVPRooms'))
 execute function public.sb_world_chat_game_events();

select cron.schedule('sb-world-chat-expiry','*/15 * * * *',$job$
 delete from public.sb_world_chat where created_at<now()-interval '24 hours';
 delete from public.sb_world_chat_cooldown where sent_at<now()-interval '24 hours';
 delete from public.sb_guild_chat where created_at<now()-interval '24 hours';
 delete from public.sb_friend_chat where created_at<now()-interval '24 hours';
$job$);

commit;
