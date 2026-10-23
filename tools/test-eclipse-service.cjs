// Exact bundled account handler + actual game engine, mocked database/auth transports.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
let authenticated=true,verified=true,account='11111111-1111-4111-8111-111111111111',tables={},revision=0;const rows=[],receipts=new Map();
const db={auth:{getUser:async()=>({data:{user:authenticated?{id:account,email:'qa@example.invalid',email_confirmed_at:verified?'2026-10-22':null}:null},error:!authenticated})},rpc:async(name,args)=>{
 if(name==='sb_player_account_command'){
  const {p_action:a,p_account:id,p_env:env,p_data:d}=args;
  if(a==='list')return {data:rows.filter(c=>c.account_id===id&&c.env===env)};
  if(a==='reserve'){let c=rows.find(c=>c.account_id===id&&c.env===env&&c.request_id===d.request_id);if(c){if(c.digest!==d.digest)return {error:{message:'request_payload_changed'}};return {data:c};}c={...d,account_id:id,env,name:d.draft.P.name,class_id:d.draft.P.cls,level:3,status:'creating'};rows.push(c);return {data:c};}
  const c=rows.find(c=>c.account_id===id&&c.env===env&&c.code===d.code);if(!c)return {error:{message:'character_not_owned'}};
  if(a==='activate'){c.status='active';c.draft=null;}return {data:c};
 }
 if(name==='sb_engine_snapshot')return {data:{mode:args.p_env,revision,tables:structuredClone(tables),receipt:receipts.get(args.p_request)}};
 if(name==='sb_engine_commit'){Object.assign(tables,structuredClone(args.p_changes));revision++;receipts.set(args.p_request,{digest:args.p_digest,result:args.p_result});return {data:{result:args.p_result}};}
 if(['sb_record_activity','sb_engine_auth_failure'].includes(name))return {data:{}};
 throw Error('Unexpected RPC '+name);
}};
const source=fs.readFileSync('build/accounts/index.ts','utf8').replace(/^import .*\r?\n/gm,'').replace('export default {','this.handler={');
const ctx=vm.createContext({console,Headers,Response,Request,TextEncoder,TextDecoder,Uint8Array,Date,structuredClone,crypto:crypto.webcrypto,btoa,atob,sha256:v=>crypto.createHash('sha256').update(v).digest(),withSupabase:(_,f)=>req=>f(req,{supabaseAdmin:db})});vm.runInContext(source,ctx);
const call=(body,auth=true)=>ctx.handler.fetch(new Request('https://example.invalid/accounts',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer fixture-user-jwt'}:{})},body:JSON.stringify(body)}));
(async()=>{
 const request_id=crypto.randomUUID(),data={P:{name:'Eclipse QA',cls:'mage',gender:'female',pets:[{sp:'wisp'}]}};
 let v=await (await call({action:'account_create',request_id,data})).json();assert(v.ok,JSON.stringify(v));const code=v.character.code;
 let load=await (await call({action:'load',code})).json();assert(load.ok);
 for(const [roll,category]of [[.1,'seal'],[.35,'legendGear'],[.45,'coupon'],[.6,'rare'],[.9,'growth']]){
  const state=JSON.parse(load.data),clear=Number(state.P.cleared||0)+1;state.P.cleared=clear;state.P.rewardRulesVersion=2;
  vm.runInContext('Math.random=()=>'+roll,ctx);
  const packet={action:'save',code,data:JSON.stringify(state),expectedSaveAt:load.accountSaveAt||load.at,_sbRequest:crypto.randomUUID()};
  v=await (await call(packet)).json();assert(v.ok,JSON.stringify(v));assert.equal(v.bossRewards.length,1);assert.equal(v.bossRewards[0].category,category);assert.equal(v.bossRewards[0].clear,clear);
  const retry=await (await call(packet)).json();assert.deepEqual(retry.bossRewards,v.bossRewards,'A lost response must recover the exact reward');
  const fresh=await (await call({action:'load',code})).json();assert(fresh.ok);const p=JSON.parse(fresh.data).P;assert.equal(p.demonRewardRevision,clear);assert.equal(p.demonRewardHistory.length,clear);
  if(category==='seal')assert.equal(p.items.godSeal,(state.P.items.godSeal||0)+1);
  if(category==='growth')assert.equal(p.items.petExp3,(state.P.items.petExp3||0)+5);
  if(category==='legendGear')assert.equal(p.owned.length,state.P.owned.length+1);
  if(category==='rare')assert.equal(p.pets.length,state.P.pets.length+1);
  const stale=await (await call({...packet,_sbRequest:crypto.randomUUID(),expectedSaveAt:fresh.accountSaveAt||fresh.at})).json();assert.equal(stale.error,'save_conflict','A save missing the reward revision cannot erase awarded inventory');
  load=fresh;
 }
 // Seed a committed historical counter in the mock database, then exercise the real handler.
 await call({action:'gacha_status',code});
 const coupon=tables.Coupons.find(r=>r[0]===code);coupon[2]=100;coupon[3]=99;coupon[4]=9;coupon[5]=99;
 tables.GachaTransactions.push(['history-pity-fixture',code,JSON.stringify({revision:0,count:99,totalDraws:99,gachaPityVersion:2,legendPity:99,rewards:[]}),'done']);
 vm.runInContext('Math.random=()=>.4',ctx);
 const draw={action:'gacha_draw',code,count:1,gachaRulesVersion:2,request:crypto.randomUUID(),_sbRequest:crypto.randomUUID()};
 v=await (await call(draw)).json();assert(v.ok,JSON.stringify(v));assert.equal(v.rewards.length,1);assert.equal(v.rewards[0].category,'eclipseGear');assert.equal(v.legendPity,0);assert.equal(v.rarePity,0);assert.equal(v.totalDraws,100);const afterCoupons=v.coupons;
 const retry=await (await call(draw)).json();assert.deepEqual(retry.rewards,v.rewards);assert.equal(retry.coupons,afterCoupons,'Retry cannot spend a second coupon');
 v=await (await call({...draw,request:crypto.randomUUID(),_sbRequest:crypto.randomUUID(),gachaRulesVersion:1})).json();assert.equal(v.error,'gacha update required');
 load=await (await call({action:'load',code})).json();
 const state=JSON.parse(load.data);state.P.cleared++;delete state.P.rewardRulesVersion;
 v=await (await call({action:'save',code,data:JSON.stringify(state),expectedSaveAt:load.accountSaveAt||load.at,_sbRequest:crypto.randomUUID()})).json();assert.equal(v.error,'game update required');
 console.log('PASS exact account service: all five Demon Lord outcomes, 100-pull shared guarantee, one reward, counter reset, coupon/reward replay, stale receipt and old-client gates');
})().catch(e=>{console.error(e);process.exitCode=1;});

