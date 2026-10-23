// Exact bundled account handler + actual game engine, mocked database/auth transports.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
let authenticated=true,verified=true,account='11111111-1111-4111-8111-111111111111',tables={},revision=0;const rows=[],receipts=new Map();
const db={auth:{getUser:async()=>({data:{user:authenticated?{id:account,email:'qa@example.invalid',email_confirmed_at:verified?'2026-10-22':null}:null},error:!authenticated})},rpc:async(name,args)=>{
 if(name==='sb_player_account_command'){
  const {p_action:a,p_account:id,p_env:env,p_data:d}=args;
  if(a==='capacity')return {data:{used:rows.filter(c=>c.account_id===id&&c.status!=='deleted').length,limit:5}};
  if(a==='list')return {data:rows.filter(c=>c.account_id===id&&c.env===env&&c.status!=='deleted')};
  if(a==='reserve'){let c=rows.find(c=>c.account_id===id&&c.env===env&&c.request_id===d.request_id);if(c){if(c.digest!==d.digest)return {error:{message:'request_payload_changed'}};return {data:c};}c={...d,account_id:id,env,name:d.draft.P.name,class_id:d.draft.P.cls,level:3,status:'creating'};rows.push(c);return {data:c};}
  const c=rows.find(c=>c.account_id===id&&c.env===env&&c.code===d.code);if(!c)return {error:{message:'character_not_owned'}};
  if(a==='delete'){c.status='deleted';return {data:{ok:true,deleted:true}};}
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
 let r=await call({action:'account_list'},false);assert.equal(r.status,401);assert.equal(rows.length,0);
 authenticated=false;r=await call({action:'account_list'});assert.equal(r.status,401);authenticated=true;
 verified=false;r=await call({action:'account_list'});assert.equal(r.status,403);verified=true;
 const request_id=crypto.randomUUID(),data={P:{name:'ผู้ผนึกใหม่',cls:'mage',gender:'female',lv:60,gold:999999,pets:[{sp:'wisp'}]}};
 r=await call({action:'account_create',request_id,data});let v=await r.json();assert.equal(r.status,200,JSON.stringify(v));assert(v.ok,JSON.stringify(v));const code=v.character.code;assert(!JSON.stringify(v).includes('engine_pin'));
 const saves=tables.Saves.length;r=await call({action:'account_create',request_id,data});assert.equal((await r.json()).character.code,code);assert.equal(tables.Saves.length,saves);
 r=await call({action:'load',code});v=await r.json();assert(v.ok,JSON.stringify(v));const p=JSON.parse(v.data).P;assert.equal(p.gold,150);assert.equal(p.lv,3);assert.equal(p.gender,'female');assert.equal(p.pets[0].sp,'wisp');assert.equal(p.cpin,undefined);
 const oldAt=v.at,updated=JSON.parse(v.data);updated.P.gold=155;
 const saveRequest={action:'save',code,data:JSON.stringify(updated),name:updated.P.name,lv:updated.P.lv,expectedSaveAt:oldAt,_sbRequest:crypto.randomUUID()};
 r=await call(saveRequest);v=await r.json();assert(v.ok,JSON.stringify(v));assert(v.accountSaveAt>oldAt);const freshAt=v.accountSaveAt;
 r=await call(saveRequest);v=await r.json();assert(v.ok);assert.equal(v.accountSaveAt,freshAt,'Lost-response retry returns the committed receipt');
 r=await call({...saveRequest,_sbRequest:crypto.randomUUID()});v=await r.json();assert.equal(v.error,'save_conflict','A stale device must never overwrite a newer save');
 r=await call({...saveRequest,expectedSaveAt:undefined,_sbRequest:crypto.randomUUID()});v=await r.json();assert.equal(v.error,'save_conflict','Version omission is not a bypass');
 r=await call({action:'load',code});v=await r.json();assert.equal(JSON.parse(v.data).P.gold,155);assert.equal(v.accountSaveAt,freshAt);
 v=await (await call({action:'account_delete',code})).json();assert.equal(v.error,'delete_confirmation_required');
 v=await (await call({action:'account_delete',code,confirm:true})).json();assert(v.ok,JSON.stringify(v));assert(v.deleted);
 v=await (await call({action:'load',code})).json();assert.equal(v.error,'character_deleted');
 v=await (await call({action:'account_delete',code,confirm:true})).json();assert(v.ok,'Retirement retry remains safe');
 account='22222222-2222-4222-8222-222222222222';r=await call({action:'load',code});assert.equal(r.status,403);assert.equal((await r.json()).error,'character_not_owned');
 r=await call({action:'account_list'});assert.equal((await r.json()).characters.length,0);
 const templates=vm.runInContext('accountTemplates',ctx);let combinations=0;
 for(const t of Object.values(templates)){
  account=crypto.randomUUID();const request_id=crypto.randomUUID();r=await call({action:'account_create',request_id,data:t});v=await r.json();assert(v.ok,JSON.stringify(v));
  r=await call({action:'load',code:v.character.code});v=await r.json();const p=JSON.parse(v.data).P;
  assert.equal(p.cls,t.P.cls);assert.equal(p.lv,3);assert.deepEqual(p.pets.map(x=>x.sp),JSON.parse(JSON.stringify(t.P.pets.map(x=>x.sp))));assert.equal(p.tutorial.v,1);assert.equal(p.tutorial.active,'stats');combinations++;
 }
 assert(combinations>=27);
 console.log('PASS all '+combinations+' base-class/starter combinations preserve first-time tutorial and canonical starting inventory');
 console.log('PASS exact account handler: verified-user gate, actual engine save/load, canonical level/gold/starter, idempotent creation, no browser PIN and cross-account denial (mock database/auth)');
})().catch(e=>{console.error(e);process.exitCode=1;});
