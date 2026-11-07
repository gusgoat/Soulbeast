const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2],'utf8').split('const accountCors=')[0].replace(/^import .*\r?\n/gm,'');
const context=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,Date,structuredClone,crypto:crypto.webcrypto,btoa,atob,sha256:v=>crypto.createHash('sha256').update(v).digest()});
vm.runInContext(source,context);
const book=context.createWorkbook({}),utilities=context.createUtilities(v=>crypto.createHash('sha256').update(v).digest(),()=>crypto.randomUUID());
const engine=context.accountEngineFactory(context.createEngine,()=>{},{})(book,utilities);
const code='ISLANDTEST000001',pin='islandtest1',starter=structuredClone(vm.runInContext("accountTemplates['swordsman|mandrake']",context));
starter.P.code=code;starter.P.country='blue';starter.P.gold=35000;
let revision=0;
function send(action,extra={}){
 const result=engine.dispatch({action,code,pin,expectedSaveAt:revision,...extra});
 if(result.ok)revision=result.accountSaveAt;
 return result;
}
function save(data){const result=send('save',{data:JSON.stringify(data)});assert(result.ok,JSON.stringify(result));}
function load(){const result=send('load');assert(result.ok,JSON.stringify(result));return result;}
function depart(country){
 const result=send('island_depart',{country});
 assert(result.ok,JSON.stringify(result));
 return {state:JSON.parse(result.data),outcome:result.outcome};
}
function finishBoss(country){
 let state=JSON.parse(load().data),visit=state.P.islandProgress.visit;
 const visitId=visit.id;
 assert.equal(send('island_boss_reward',{country,visitId}).error,'island_boss_incomplete');
 visit.pending={id:'boss',kind:'boss',lv:60};save(state);
 state=JSON.parse(load().data);visit=state.P.islandProgress.visit;
 visit.cleared.boss=true;visit.last={id:'boss',result:'win'};visit.pending=null;
 state.P.islandAccount.clears[country]=99;save(state);
 const reward=send('island_boss_reward',{country,visitId});
 assert(reward.ok,JSON.stringify(reward));
 const again=send('island_boss_reward',{country,visitId});
 assert(again.ok&&again.already,JSON.stringify(again));
 return {outcome:reward.outcome,state:JSON.parse(reward.data),visitId};
}
save(starter);
assert.equal(send('island_depart',{country:'invalid'}).error,'island_bad_country');
assert.equal(send('island_depart',{country:'green',resumeOnly:true}).error,'island_resume_missing');
assert.equal(JSON.parse(load().data).P.gold,35000);
assert.equal(send('island_depart',{country:'green',expectedSaveAt:revision-1}).error,'save_conflict');
let trip=depart('green');
assert.equal(trip.outcome,'depart');
assert.equal(trip.state.P.gold,25000);
assert.equal(trip.state.P.country,'blue');
const id=trip.state.P.islandProgress.visit.id;
assert(id);
assert.equal(depart('green').outcome,'resume');
assert.equal(JSON.parse(load().data).P.gold,25000);
const forged=JSON.parse(load().data);forged.P.islandProgress.visit.id='fake';forged.P.islandAccount.clears.green=42;save(forged);
assert.equal(JSON.parse(load().data).P.islandProgress.visit.id,id);
assert.equal(send('island_exit',{country:'red',visitId:id}).error,'island_visit_missing');
const couponsBefore=load().coupons;
const first=finishBoss('green');
assert.equal(first.outcome,'first');assert.equal(first.state.P.gold,25000);
assert.equal(load().coupons,couponsBefore+10);
assert.equal(book.tables.CouponCredits.slice(1).filter(r=>r[3]==='island-boss').length,10);
const exit=send('island_exit',{country:'green',visitId:id});
assert(exit.ok,JSON.stringify(exit));
assert.equal(JSON.parse(exit.data).P.islandProgress.visit,undefined);
assert.equal(JSON.parse(exit.data).P.gold,25000);
assert(send('island_exit',{country:'green',visitId:id}).ok);
assert.equal(depart('green').state.P.gold,15000);
const repeat=finishBoss('green');
assert.equal(repeat.outcome,'repeat');assert.equal(repeat.state.P.gold,25000);
assert.equal(repeat.state.P.items.eternalSeal,1);
assert.equal(load().coupons,couponsBefore+10);
const insufficient=JSON.parse(load().data);insufficient.P.gold=9999;save(insufficient);
assert.equal(send('island_depart',{country:'red'}).error,'island_fare');
assert.equal(JSON.parse(load().data).P.islandProgress.visit.id,repeat.visitId);
console.log('PASS online ferry payment, revision and visit ownership, server coupon wallet, repeat reward, and free return');
