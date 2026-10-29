-- Run inside one transaction, after creating pg_temp.sb_promote_selection
-- (code text primary key, expected_name text, expected_class text, expected_account uuid).
-- SET LOCAL soulbeast.promotion_batch to a unique reviewed release label.
-- Never overwrites live characters or copies shared guild/kingdom/battle state.
create table if not exists public.sb_character_promotion_backups (
 batch text primary key, created_at timestamptz not null default now(), payload jsonb not null
);
alter table public.sb_character_promotion_backups enable row level security;
revoke all on public.sb_character_promotion_backups from public,anon,authenticated;
grant all on public.sb_character_promotion_backups to service_role;

do $promotion$
#variable_conflict use_column
declare batch_id text:=current_setting('soulbeast.promotion_batch'); source_count integer;
 item record; v_table record; r jsonb; incoming jsonb; target jsonb; existing jsonb; keep boolean; parsed jsonb;
 source_row jsonb; state jsonb; pid text; wallet jsonb; pending bigint; cursor_end integer;
begin
 if batch_id is null or length(batch_id)<8 or exists(select 1 from sb_character_promotion_backups where batch=batch_id) then raise exception 'promotion_batch_exists_or_invalid'; end if;
 select count(*) into source_count from pg_temp.sb_promote_selection;
 if source_count not between 1 and 20 then raise exception 'invalid_selection';end if;
 perform 1 from sb_engine_control where environment in ('test','live') order by environment for update;
 if (select count(*) from sb_engine_control where environment in ('test','live') and mode=environment)<>2 then raise exception 'world_not_ready';end if;
 if exists(select 1 from sb_player_characters c join pg_temp.sb_promote_selection s using(code) where c.game_env='live') then raise exception 'live_character_conflict';end if;
 if (select count(*) from sb_player_characters c join pg_temp.sb_promote_selection s using(code) where c.game_env='test' and c.status='active' and c.account_id=s.expected_account)<>source_count then raise exception 'source_owner_or_status_mismatch';end if;
 if exists(select 1 from sb_engine_tables t cross join lateral jsonb_array_elements(t.rows)r join pg_temp.sb_promote_selection s on r->>0=s.code where t.environment='live' and t.name='Saves') then raise exception 'live_save_conflict';end if;
 create temp table sb_promote_states(code text primary key, state jsonb not null, save_row jsonb not null) on commit drop;
 for item in select * from pg_temp.sb_promote_selection loop
  select r into source_row from sb_engine_tables t cross join lateral jsonb_array_elements(t.rows)r where t.environment='test' and t.name='Saves' and r->>0=item.code;
  if source_row is null then raise exception 'source_save_missing';end if;
  if source_row->>6 like 'SB64:%' then
   select convert_from(decode(string_agg(substring(x.v#>>'{}' from 6),'' order by x.i),'base64'),'UTF8')::jsonb into state from jsonb_array_elements(source_row) with ordinality x(v,i) where i>=7;
  else
   select string_agg(x.v#>>'{}','' order by x.i)::jsonb into state from jsonb_array_elements(source_row) with ordinality x(v,i) where i>=7;
  end if;
  if state->'P'->>'code'<>item.code or state->'P'->>'name'<>item.expected_name or state->'P'->>'cls'<>item.expected_class then raise exception 'source_identity_mismatch';end if;
  if state->'battle' is not null and state->'battle'<>'null'::jsonb then raise exception 'finish_local_battle_first';end if;
  pid:=state->'P'->>'pid';
  if exists(select 1 from sb_engine_tables t cross join lateral jsonb_array_elements(t.rows)r where t.environment='live' and ((t.name='Leaderboard' and r->>0=pid) or (t.name='PlayerDirectory' and r->>0 in (select r2->>0 from sb_engine_tables t2 cross join lateral jsonb_array_elements(t2.rows)r2 where t2.environment='test' and t2.name='PlayerDirectory' and r2->>1=item.code)))) then raise exception 'live_public_identity_conflict';end if;
  insert into sb_promote_states values(item.code,state,source_row);
 end loop;
 -- A participant may not enter a second world while an online fight is unresolved.
 for v_table in select * from sb_engine_tables where environment='test' and name in ('PVPRooms','WorldRooms') loop
  for r in select value from jsonb_array_elements(v_table.rows) with ordinality x(value,i) where i>1 loop
   if r->>1 in ('active','lobby') and coalesce((r->>3)::numeric,0)>extract(epoch from now())*1000 then
    select convert_from(decode(string_agg(regexp_replace(x.v#>>'{}','^(PV1:|WB1:)',''),'' order by x.i),'base64'),'UTF8')::jsonb into parsed from jsonb_array_elements(r) with ordinality x(v,i) where i>=5;
    if exists(select 1 from jsonb_array_elements(parsed->'players')p join pg_temp.sb_promote_selection s on p->>'code'=s.code) then raise exception 'finish_online_battle_first';end if;
   end if;
  end loop;
 end loop;
 insert into sb_character_promotion_backups(batch,payload) values(batch_id,jsonb_build_object(
  'selection',(select jsonb_agg(to_jsonb(s)) from pg_temp.sb_promote_selection s),
  'engineTables',(select jsonb_agg(to_jsonb(t)) from sb_engine_tables t where environment in ('test','live')),
  'control',(select jsonb_agg(to_jsonb(c)) from sb_engine_control c where environment in ('test','live')),
  'registry',(select jsonb_agg(to_jsonb(c)) from sb_player_characters c join pg_temp.sb_promote_selection s using(code)),
  'shop',(select jsonb_agg(to_jsonb(c)) from sb_shop_characters c join pg_temp.sb_promote_selection s using(code))
 ));
 -- Copy character-owned progression only; preserve each destination table's other rows.
 for v_table in select * from sb_engine_tables where environment='test' and name in ('Saves','Coupons','CouponCredits','GachaTransactions','WorldEntries','WorldRewards','Camps','PlayerDirectory','Leaderboard','GuildState') loop
  incoming:='[]'::jsonb;
  for r in select value from jsonb_array_elements(v_table.rows) with ordinality x(value,i) where i>1 loop
   keep:=false;
   if v_table.name in ('Saves','Coupons','Camps') then keep:=exists(select 1 from sb_promote_states where code=r->>0);
   elsif v_table.name in ('CouponCredits','GachaTransactions','WorldEntries','WorldRewards','PlayerDirectory') then keep:=exists(select 1 from sb_promote_states where code=r->>1);
   elsif v_table.name='Leaderboard' then keep:=exists(select 1 from sb_promote_states where state->'P'->>'pid'=r->>0);
   elsif v_table.name='GuildState' then keep:=exists(select 1 from sb_promote_states where r->>0 in ('m:'||code,'tw:'||code) or starts_with(r->>0,'cw:mail:'||code||':'));
   end if;
   if keep then
    if v_table.name='Camps' then r:=jsonb_set(r,'{1}',to_jsonb(((r->>1)::jsonb-'active')::text));end if;
    if v_table.name='GuildState' and starts_with(r->>0,'m:') then r:=jsonb_set(r,'{1}',to_jsonb(((r->>1)::jsonb||jsonb_build_object('guildId','','joinedAt',0,'guildContribution',0))::text));end if;
    incoming:=incoming||jsonb_build_array(r);
   end if;
  end loop;
  if jsonb_array_length(incoming)>0 then
   select rows into target from sb_engine_tables where environment='live' and name=v_table.name;
   target:=coalesce(target,jsonb_build_array(v_table.rows->0));
   if exists(select 1 from jsonb_array_elements(incoming)i join lateral jsonb_array_elements(target)x on i->>0=x->>0) then raise exception 'destination_row_key_conflict: %',v_table.name;end if;
   insert into sb_engine_tables(environment,name,rows) values('live',v_table.name,target||incoming) on conflict(environment,name) do update set rows=excluded.rows;
  end if;
 end loop;
 -- Existing credit cursors refer to source-table positions. Settle only unprocessed
 -- source credits, then point at the final destination tail to prevent double grants.
 select jsonb_array_length(rows)-1 into cursor_end from sb_engine_tables where environment='live' and name='CouponCredits';
 select rows into target from sb_engine_tables where environment='live' and name='Coupons';
 for item in select * from sb_promote_states loop
  select r into wallet from jsonb_array_elements(target)r where r->>0=item.code;
  if wallet is null then raise exception 'source_wallet_missing';end if;
  select coalesce(sum((r->>2)::bigint),0) into pending from sb_engine_tables t cross join lateral jsonb_array_elements(t.rows) with ordinality x(r,i) where t.environment='test' and t.name='CouponCredits' and r->>1=item.code and i>(wallet->>10)::integer+1;
  wallet:=jsonb_set(jsonb_set(wallet,'{2}',to_jsonb((wallet->>2)::bigint+pending)),'{10}',to_jsonb(coalesce(cursor_end,0)));
  select jsonb_agg(case when r->>0=item.code then wallet else r end order by i) into target from jsonb_array_elements(target) with ordinality x(r,i);
 end loop;
 update sb_engine_tables set rows=target where environment='live' and name='Coupons';
 insert into sb_player_characters select (jsonb_populate_record(null::sb_player_characters,to_jsonb(c)||jsonb_build_object('game_env','live','name',s.state->'P'->>'name','class_id',s.state->'P'->>'cls','level',(s.state->'P'->>'lv')::integer))).* from sb_player_characters c join sb_promote_states s using(code) where c.game_env='test';
 insert into sb_shop_characters(account_id,game_env,code,name) select c.account_id,'live',c.code,s.state->'P'->>'name' from sb_player_characters c join sb_promote_states s using(code) where c.game_env='test';
 update sb_engine_control set revision=revision+1 where environment='live';
 if (select count(*) from sb_player_characters c join sb_promote_states s using(code) where c.game_env='live' and c.status='active')<>source_count then raise exception 'promotion_verification_failed';end if;
 if exists(select 1 from sb_promote_states s join sb_engine_tables t on t.environment='live' and t.name='Saves' where not exists(select 1 from jsonb_array_elements(t.rows)r where r=s.save_row)) then raise exception 'save_copy_mismatch';end if;
end $promotion$;
