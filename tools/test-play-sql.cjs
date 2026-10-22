// Real PostgreSQL/WASM transactions, with a small engine-CAS fixture. No network or production database.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),{PGlite}=require('./play-tests/node_modules/@electric-sql/pglite');
require('child_process').execFileSync(process.execPath,['tools/build-play.cjs']);
(async()=>{
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz,deleted_at timestamptz);
 create table public.sb_player_characters(account_id uuid,game_env text,code text,status text,primary key(game_env,code));
 create table public.sb_shop_test_orders(id uuid default gen_random_uuid(),account_id uuid,pack_id text,status text,promotion boolean);
 create table public.engine_fixture(revision bigint,balance integer);insert into public.engine_fixture values(1,7);
 create function public.sb_engine_commit(p_env text,p_expected bigint,p_request text,p_digest text,p_changes jsonb,p_result jsonb) returns jsonb language plpgsql as $$
 begin if p_env<>'test' then raise exception 'live forbidden';end if;
 if p_expected<>(select revision from public.engine_fixture) then return '{"conflict":true}'::jsonb;end if;
 update public.engine_fixture set revision=revision+1,balance=(p_changes->'Coupons'->1->>2)::integer;return jsonb_build_object('result',p_result);end;$$;`);
 await db.exec(fs.readFileSync('build/play/003-play-test.sql','utf8'));
 const owner=crypto.randomUUID(),other=crypto.randomUUID();await db.query('insert into auth.users values($1,now(),null),($2,now(),null)',[owner,other]);
 await db.query("insert into sb_player_characters values($1,'test','CHARACTER001','active'),($1,'test','CHARACTER002','active'),($2,'test','CHARACTER003','active')",[owner,other]);
 const call=async(a,id,d)=>{const r=await db.query('select sb_play_test_command($1,$2,$3::jsonb) v',[a,id,JSON.stringify(d)]);return r.rows[0].v;};
 const draft=(pack='normal-5',provider='google_play',code='CHARACTER001')=>({request_id:crypto.randomUUID(),pack_id:pack,provider,code,account_hash:'a'.repeat(64)});
 const first=await call('reserve',owner,draft());assert.equal(first.coupons,5);await assert.rejects(()=>call('get',other,{order_id:first.id}),/order_not_found/);
 const data={order_id:first.id,token_hash:'b'.repeat(64),provider_order:'GPA.1',expected:0,before:7,after:12,changes:{Coupons:[['code','name','coupons'],['CHARACTER001','QA',12]]}};
 assert((await call('grant',owner,data)).conflict);assert.equal((await db.query('select balance from engine_fixture')).rows[0].balance,7);
 const grant=await call('grant',owner,{...data,expected:1});assert.equal(grant.order.status,'granted');await call('grant',owner,{...data,expected:1});
 assert.equal((await db.query('select balance from engine_fixture')).rows[0].balance,12);assert.equal((await db.query('select count(*) n from sb_billing_grants')).rows[0].n,1);
 const second=await call('reserve',owner,draft());await assert.rejects(()=>call('grant',owner,{...data,order_id:second.id,expected:2,before:12,after:17,changes:{Coupons:[[],['CHARACTER001','QA',17]]}}),/duplicate key/);
 assert.equal((await db.query('select balance from engine_fixture')).rows[0].balance,12,'A failed token uniqueness check rolls back the engine credit too');
 const promo=await call('reserve',owner,draft('first-10'));await assert.rejects(()=>call('reserve',owner,draft('first-10','stripe','CHARACTER002')),/promotion_unavailable/);
 await assert.rejects(()=>db.query("insert into sb_shop_test_orders(account_id,pack_id,status,promotion) values($1,'first-10','open',true)",[owner]),/promotion_unavailable/);
 await db.query("insert into sb_shop_test_orders(account_id,pack_id,status,promotion) values($1,'first-50','open',true)",[owner]);await assert.rejects(()=>call('reserve',owner,draft('first-50')),/promotion_unavailable/);
 await assert.rejects(()=>call('reserve',other,draft('normal-5','google_play','CHARACTER001')),/character_not_owned/);
 await db.exec('set role anon');await assert.rejects(()=>db.query('select * from sb_billing_orders'),/permission denied/);await assert.rejects(()=>call('status',owner,{}),/permission denied/);await db.exec('reset role');
 assert.equal((await db.query("select count(*) n from pg_class where relname in ('sb_billing_orders','sb_billing_grants','sb_billing_packs') and relrowsecurity")).rows[0].n,3);
 await db.close();console.log('PASS PostgreSQL: migration, engine CAS + grant atomicity, rollback on duplicate token, once-only replay, ownership/RLS/service-only RPC, shared Play/Stripe promo reservations both directions');
})().catch(e=>{console.error(e);process.exitCode=1;});
