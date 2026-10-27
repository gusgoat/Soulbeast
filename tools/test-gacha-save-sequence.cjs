// Exercise the browser draw/save path against the actual engine and account conflict guard.
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
(async()=>{
 const {accountEngineFactory}=await import('../server/accounts/token-owner.mjs');
 const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 const ctx=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,Date,structuredClone,crypto:crypto.webcrypto,btoa,atob,sha256:v=>crypto.createHash('sha256').update(v).digest()});
 vm.runInContext(fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,''),ctx);
 let tables={},revision=0;const receipts=new Map();
 const rpc=async(name,a)=>{
  if(name==='sb_engine_snapshot')return {data:{mode:'test',revision,tables:structuredClone(tables),receipt:receipts.get(a.p_request)}};
  if(name==='sb_engine_commit'){assert.equal(a.p_expected,revision);Object.assign(tables,structuredClone(a.p_changes));revision++;receipts.set(a.p_request,{digest:a.p_digest,result:a.p_result});return {data:{result:a.p_result}};}
  if(['sb_record_activity','sb_engine_auth_failure'].includes(name))return {data:{}};
  throw Error('Unexpected RPC '+name);
 };
 const execute=p=>ctx.createGameService({rpc,engineFactory:accountEngineFactory(ctx.createEngine,hash,{request:p})})(p,'test');
 const g=require('./game-context.cjs')('build/live-index.html',{sheetURL:'https://fixture.invalid/accounts'});
 const store=new Map();g.ctx.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 g.app.querySelector=()=>null;g.app.querySelectorAll=()=>[];g.ctx.window.SOULBEAST_ACCOUNTS=true;
 g.run(fs.readFileSync('runtime/accounts.js','utf8'));
 g.run("render=()=>{};toast=()=>{};ReleaseGacha.start=()=>{};ReleaseGacha.stop=()=>{};ReleaseGacha.finish=async()=>{};S.P.code='SEQUENCECHECK001';S.battle=null;S.zone=null;GS.busy=0;ACCOUNT_GAME.user={id:'fixture-owner'};ACCOUNT_GAME.code=S.P.code;ACCOUNT_GAME.mode='playing';");
 const code=g.run('S.P.code'),pin='fixture-pin';
 let v=await execute({action:'save',code,pin,data:g.run('gsData()')});assert(v.ok,JSON.stringify(v));
 v=await execute({action:'load',code,pin});assert(v.ok);g.ctx.initial=v;g.run('S=JSON.parse(initial.data);S.P.gsAt=initial.accountSaveAt;');
 const wallet=tables.Coupons.find(r=>r[0]===code);wallet[2]=300;
 let loseResponse=false;const saves=[];
 g.ctx.accountTransport=async(action,p)=>{
  if(action==='save')saves.push(p.expectedSaveAt);
  const r=await execute({...p,pin});
  if(action==='gacha_draw'&&r.ok&&loseResponse){loseResponse=false;throw Error('simulated lost response');}
  if(!r.ok)throw Object.assign(Error(r.error),{code:r.error});return r;
 };
 g.run('ACCOUNT_GAME.client={game:(action,p)=>accountTransport(action,p)};');
 let spent=0;
 for(let round=0;round<12;round++){
  const count=round%2?10:1;if(round===4)loseResponse=true;
  await g.run('gachaCall('+count+')');
  if(round===4){assert(g.run('!!gachaReadPending()'),'Lost response keeps the original request');await g.run('gachaCall()');}
  assert.equal(g.run('GACHA.error'),'','Round '+(round+1)+' must not conflict');spent+=count;
  assert.equal(g.run('GACHA.coupons'),300-spent);assert.equal(g.run('GACHA.totalDraws'),spent);
  const latest=new Date(tables.Saves.find(r=>r[0]===code)[5]).getTime();
  assert.equal(g.run('S.P.gsAt'),latest,'Applying rewards must keep the authoritative save timestamp');
  const cached=[...store].find(([key])=>key.includes(':fixture-owner:'));
  assert.equal(JSON.parse(cached[1]).P.gsAt,latest,'Reloading this browser must retain the same save version');
  assert.equal(g.run('gachaReadPending()'),null);
 }
 assert.equal(saves.length,12,'Retrying a committed draw must not save or charge again');
 const stamp=g.run('S.P.gsAt');g.run('communityApplyData(gsData())');assert.equal(g.run('S.P.gsAt'),stamp,'Responses without account metadata keep the current timestamp');
 const snapshot=await execute({action:'load',code,pin});
 const advanced=await execute({action:'save',code,pin,data:snapshot.data,expectedSaveAt:snapshot.accountSaveAt,_sbRequest:crypto.randomUUID()});assert(advanced.ok);
 const stale=await g.run('sheetRequest({body:JSON.stringify({action:"save",data:gsData()})})');
 assert.equal(stale.error,'save_conflict','A genuinely stale device must still be rejected');
 assert.equal(g.run('ACCOUNT_GAME.saveConflict'),true);
 console.log('PASS 12 consecutive mixed draws, authoritative save timestamp after rewards, lost-response exact retry, coupon/reward consistency, and genuine cross-device save conflict protection');
})().catch(e=>{console.error(e);process.exitCode=1;});
