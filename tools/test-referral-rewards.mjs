import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {PGlite}=require(process.env.SOULBEAST_PGLITE||'@electric-sql/pglite');
const db=new PGlite();
const query=(sql,params=[])=>db.query(sql,params);
const scalar=async(sql,params)=>(await query(sql,params)).rows[0]?.v;
const migration=await readFile(new URL('../supabase/referral-rewards.sql',import.meta.url),'utf8');
const profile=await readFile(new URL('../supabase/walk-profile-sync.sql',import.meta.url),'utf8');
await db.exec(`
 create role anon; create role authenticated; create schema auth; create schema cron;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('app.uid',true),'')::uuid $$;
 create table public.sb_player_characters(account_id uuid,game_env text,code text,name text,status text,level integer,class_id text,walk_gender text,primary key(game_env,code));
 create table public.sb_engine_tables(environment text,name text,rows jsonb,primary key(environment,name));
 create table public.sb_engine_control(environment text primary key,revision bigint,mode text);
 create table public.qa_commits(request text primary key);
 create table cron.job(name text primary key,schedule text,command text);
 create function cron.schedule(text,text,text) returns bigint language sql as $$
  insert into cron.job values($1,$2,$3) on conflict(name) do update set schedule=excluded.schedule,command=excluded.command returning 1::bigint $$;
 insert into public.sb_engine_control values('live',0,'live');
 create function public.sb_engine_commit(p_env text,p_expected bigint,p_request text,p_digest text,p_changes jsonb,p_result jsonb)
 returns jsonb language plpgsql as $$
 begin
  if current_setting('app.conflict',true)='1' then
   perform set_config('app.conflict','0',false);
   return '{"conflict":true}'::jsonb;
  end if;
  update public.sb_engine_control set revision=revision+1 where environment=p_env and revision=p_expected;
  if not found then return '{"conflict":true}'::jsonb; end if;
  insert into public.qa_commits values(p_request);
  insert into public.sb_engine_tables select p_env,key,value from jsonb_each(p_changes)
   on conflict(environment,name) do update set rows=excluded.rows;
  return jsonb_build_object('result',p_result);
 end $$;
`);
await db.exec(profile);
await db.exec(migration);
await db.exec(migration); // Named cron and triggers install idempotently.
const register=async(invite,verified=true)=>{
 const id=randomUUID();
 await query("insert into auth.users values ($1,$2,case when $3::boolean then now() end)",[id,JSON.stringify(invite?{soulbeast_invite:invite}:{}),verified]);
 return id;
};
const character=(id,code,env='live')=>query("insert into public.sb_player_characters values($1,$2,$3,$3,'active',3,'swordsman',null)",[id,env,code]);
const identify=id=>query("select set_config('app.uid',$1,false)",[id]);
const save=async(code,lv,env='live')=>{
 const entry=[code,'','','','','',JSON.stringify({P:{code,lv,cls:'swordsman',gender:'male'}})];
 await query("insert into public.sb_engine_tables values ($1,'Saves',jsonb_build_array($2::jsonb)) on conflict(environment,name) do update set rows=excluded.rows",[env,JSON.stringify(entry)]);
};
const getStatus=code=>scalar("select public.sb_referral_status($1) as v",[code]);
const owner=await register(),other=await register();
await character(owner,'MAIN');
await character(owner,'ALT');
await character(other,'OTHER');
await identify(owner);
await assert.rejects(getStatus('OTHER'),/character_not_owned/);
const invite=(await getStatus('MAIN')).code;
assert.match(invite,/^[0-9A-F]{16}$/);
assert.equal((await getStatus('ALT')).walletName,'MAIN');
assert.equal(await scalar("select public.sb_referral_code_valid($1) as v",[invite.toLowerCase()]),true);
await assert.rejects(register('DEADBEEFDEADBEEF'),/invalid_referral_code/);
await query("update auth.users set raw_user_meta_data=$2 where id=$1",[other,JSON.stringify({soulbeast_invite:invite})]);
assert.equal(await scalar("select count(*)::int as v from public.sb_referral_links"),0);

const friend=await register(invite.toLowerCase());
await character(friend,'FRIEND1');await character(friend,'FRIEND2');await character(friend,'TEST1','test');
await save('FRIEND1',9);await save('TEST1',10,'test');
assert.equal((await getStatus('MAIN')).ready,0);
await save('FRIEND1',10);await save('FRIEND2',11);
assert.equal((await getStatus('MAIN')).ready,1);
assert.equal((await getStatus('MAIN')).coupons,0);
await query("select set_config('app.conflict','1',false)");
await query("select public.sb_referral_process()");
await query("select public.sb_referral_process()");
assert.equal((await getStatus('MAIN')).coupons,10);
const unverified=await register(invite,false);
await character(unverified,'UNVERIFIED');await save('UNVERIFIED',10);
assert.equal((await getStatus('MAIN')).ready,0);

for(let i=0;i<10;i++){
 const id=await register(invite),code='FRIEND'+(i+3);
 await character(id,code);await save(code,10);
}
await query("update public.sb_player_characters set status='deleted' where code='MAIN'");
await query("select public.sb_referral_process()");
await query("select public.sb_referral_process()");
const status=await getStatus('ALT');
assert.equal(status.coupons,100);
assert.equal(status.rewarded,10);
assert.equal(status.ready,0);
const credits=await scalar("select rows as v from public.sb_engine_tables where name='CouponCredits'");
assert.deepEqual(credits[0],['key','code','amount','source','created']);
assert.equal(credits.slice(1).filter(r=>r[1]==='MAIN'&&r[2]===1).length,10);
assert.equal(credits.slice(1).filter(r=>r[1]==='ALT'&&r[2]===1).length,90);
assert.equal(new Set(credits.slice(1).map(r=>r[0])).size,100);
await query("set role anon");
assert.equal(await scalar("select public.sb_referral_code_valid($1) as v",[invite]),true);
await assert.rejects(getStatus('ALT'),/permission denied/);
await assert.rejects(query("select public.sb_referral_award($1)",[owner]),/permission denied/);
await query("reset role");
await db.close();
console.log('PASS referral signup attribution, saved live Lv10, one per verified account, revision retry, capped 100 coupons, wallet ownership, deleted wallet fallback, and RPC permissions');
