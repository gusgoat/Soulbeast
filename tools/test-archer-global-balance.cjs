const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function suite(run,label){
 run(`Sound.fx=()=>{};Sound.cry=()=>{};if(typeof ExtraAudio!=='undefined'){ExtraAudio.play=()=>{};ExtraAudio.skill=()=>{};}Math.random=()=>.5;
 globalThis.archerBalanceSetup=function(kind,veil=1){
  S.P=S.P||{};S.P.lv=60;S.P.cls='swordsman';const a=playerUnit();S.P.cls='wildlord';const t=playerUnit();
  for(const [u,id,side,owner]of [[a,'a','ally',0],[t,'t','enemy',1]]){Object.assign(u,{id,side,owner,hp:100000,mp:100000,pas:[],buffs:[],status:{},types:[],stab:[],taunt:0,form:null,archerVeil:0,class10Barrier:0});Object.assign(u.st,{hp:100000,mp:100000,patk:1000,matk:1000,pdef:100,mdef:100,crit:0,acc:100,eva:0});}
  t.archerVeil=veil;S.battle={kind,allies:[a],enemies:[t],queue:[],cur:a.id,round:1,turns:0,log:[],fx:[],effects:[]};
  SK.audit_archer_multi={n:'ทดสอบสามฮิต',t:'p',pw:100,acc:100,hits:3,st:{poison:1}};
  SK.audit_archer_area={n:'ทดสอบหมู่',t:'m',pw:100,acc:100,all:1};
  SK.audit_archer_status={n:'ทดสอบสถานะ',t:'status',acc:100,st:{para:1}};
  return {a,t};
 };
 `);
 const get=s=>JSON.parse(run('JSON.stringify((()=>{'+s+'})())'));
 for(const mode of ['pvp','wild','boss','world','raid','camp','guildwar','npc','tower']){
  const result=get(`const x=archerBalanceSetup('${mode}',0);act(x.a,'audit_archer_multi',x.t,x.a);const full=100000-x.t.hp;const y=archerBalanceSetup('${mode}',1);act(y.a,'audit_archer_multi',y.t,y.a);const half=100000-y.t.hp,poison=!!y.t.status.poison,remaining=y.t.archerVeil;const before=y.t.hp;act(y.a,'audit_archer_multi',y.t,y.a);return {full,half,second:before-y.t.hp,poison,remaining,contexts:class10AttackContexts.length};`);
  assert(result.full>0,label);assert(Math.abs(result.half-result.full*.5)<=3,label+' '+mode+' all hits half');assert.equal(result.second,result.full,label+' only once');assert(result.poison,label+' status still applies');assert.equal(result.remaining,0);assert.equal(result.contexts,0);
  const area=get(`const x=archerBalanceSetup('${mode}',1);act(x.a,'audit_archer_area',x.t,x.a);const damage=100000-x.t.hp,remaining=x.t.archerVeil;const y=archerBalanceSetup('${mode}',0);act(y.a,'audit_archer_area',y.t,y.a);return {damage,full:100000-y.t.hp,remaining};`);
  assert.equal(area.damage,area.full,label+' '+mode+' AoE unaffected');assert.equal(area.remaining,1);
  const state=get(`const x=archerBalanceSetup('${mode}',1);act(x.a,'audit_archer_status',x.t,x.a);return {remaining:x.t.archerVeil,para:!!x.t.status.para};`);assert.equal(state.remaining,1);assert(state.para);
  for(const id of ['ms_archer40','ms_archer50']){const r=get(`const x=archerBalanceSetup('${mode}',0),s=pvpSkill('${id}');act(x.a,'${id}',x.t,x.a);const cd=cooldownOf(x.a,'${id}');beginUnitTurn(x.a);const next=cooldownOf(x.a,'${id}');return {pw:s.pw,hits:s.hits||1,para:s.st?.para||0,cd,next,mp:s.mp};`);assert.equal(r.cd,3);assert.equal(r.next,2);if(id==='ms_archer40')assert.deepEqual([r.pw,r.para,r.mp],[220,.2,16]);else assert.deepEqual([r.pw,r.hits,r.mp],[70,4,20]);}
 }
 const parry=get(`const x=archerBalanceSetup('pvp',1);x.t.buffs=[{pas:'class10_parry',tn:3}];act(x.a,'audit_archer_multi',x.t,x.a);return {hp:x.t.hp,veil:x.t.archerVeil,poison:!!x.t.status.poison};`);assert.equal(parry.hp,100000);assert.equal(parry.veil,1);
 const barrier=get(`const x=archerBalanceSetup('pvp',0);x.t.class10Barrier=1;act(x.a,'audit_archer_multi',x.t,x.a);return {hp:x.t.hp,barrier:x.t.class10Barrier};`);assert.equal(barrier.hp,100000);assert.equal(barrier.barrier,0);
 const direct=get(`const x=archerBalanceSetup('pvp',1);hurt(x.t,100);return {hp:x.t.hp,veil:x.t.archerVeil};`);assert.equal(direct.hp,99900);assert.equal(direct.veil,1);
 assert.equal(run('clsSum("wildlord")'),2);assert.equal(run('typeof PAS.summoner_guard'),'undefined');
 console.log('PASS '+label+': global archer skills220/para20/cd3 and70x4/cd3; first single skill all hits50% once; statuses/AoE/second attack/parry/barrier/direct damage preserved across9 modes; two pets retained.');
}
const game=require('./game-context.cjs')('build/live-index.html');suite(game.run,'client');
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'');source=source.replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');
const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});vm.runInContext(source,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',ctx);engine.testRun('S={P:'+game.run('JSON.stringify(S.P)')+'}');suite(engine.testRun,'authoritative server');
