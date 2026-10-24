const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),{PGlite}=require('./play-tests/node_modules/@electric-sql/pglite');
(async()=>{
 const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz,deleted_at timestamptz);create table sb_shop_characters(account_id uuid,game_env text,code text,name text,primary key(game_env,code));');
 for(const f of ['001-accounts','002-character-management','003-character-names'])await db.exec(fs.readFileSync('server/accounts/'+f+'.sql','utf8'));
 const owner=crypto.randomUUID(),other=crypto.randomUUID();await db.query('insert into auth.users values($1,now(),null),($2,now(),null)',[owner,other]);
 const code='NAMEFIXTURE00001';await db.query("insert into sb_player_characters(account_id,game_env,code,request_id,digest,engine_pin,name,class_id,status) values($1,'test',$2,$3,'fixture','server-only','Old','mage','active')",[owner,code,crypto.randomUUID()]);
 await db.query("insert into sb_shop_characters values($1,'test',$2,'Old')",[owner,code]);
 const sync=async(id,env,name,at)=>db.query('select sb_player_sync_name($1,$2,$3,$4,$5)',[id,env,code,name,at]);
 await sync(owner,'test','New name',1000);
 assert.equal((await db.query('select name from sb_player_characters')).rows[0].name,'New name');assert.equal((await db.query('select name from sb_shop_characters')).rows[0].name,'New name');
 await sync(owner,'test','Delayed old name',0);assert.equal((await db.query('select name from sb_player_characters')).rows[0].name,'New name','Old load cannot undo a newer rename');
 await assert.rejects(()=>sync(other,'test','Intruder',2000),/character_not_owned/);await assert.rejects(()=>sync(owner,'live','Wrong environment',2000),/character_not_owned/);await assert.rejects(()=>sync(owner,'test','',2000),/bad_character_name/);
 const acl=(await db.query("select has_function_privilege('anon','sb_player_sync_name(uuid,text,text,text,bigint)','execute') a,has_function_privilege('authenticated','sb_player_sync_name(uuid,text,text,text,bigint)','execute') b")).rows[0];assert.equal(acl.a,false);assert.equal(acl.b,false);
 await db.exec("update sb_player_characters set status='deleted'");await assert.rejects(()=>sync(owner,'test','Retired',3000),/character_not_owned/);
 await db.close();console.log('PASS character names: player/shop registry sync, delayed response guard, ownership/environment/retirement checks and service-only permissions');
})().catch(e=>{console.error(e);process.exitCode=1;});
