const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const g=require('./game-context.cjs')('build/staging-index.html');
function rules(run,label){
 for(const [el,target]of [['normal','ghost'],['fighting','ghost'],['electric','ground'],['poison','steel'],['ground','flying'],['psychic','dark'],['ghost','normal'],['dragon','fairy']])assert.equal(run(`typeMult('${el}',['${target}'])`),.25,label+' elemental resistance');
 assert.equal(run("attackMultiplier({},{t:'p',el:'ground'},{types:['normal'],pas:['levitate'],buffs:[]})"),.25);
 run("S=S||{P:{pets:[]}};S.battle={kind:'wild',allies:[],enemies:[],queue:[],log:[],fx:[]};globalThis.caster=unit({id:'P',name:'นีโคร',kind:'player',cls:'necro',lv:60,side:'ally',st:{hp:100,mp:100},hp:100,mp:100});globalThis.corpse=wildUnit('kappa',20,1);corpse.hp=0;corpse.side='enemy';B().allies=[caster];B().enemies=[corpse];");
 assert(run("CLS.necro.sk.some(([lv,id])=>lv===45&&id==='ne_spirit')"));
 assert(run("addTemporary(caster,SK.ne_spirit)"));
 assert.equal(run('B().allies.length'),2);assert.equal(run('corpse.hp'),0);assert.equal(run('corpse.spiritClaimed'),true);
 assert.equal(run('B().allies[1].side'),'ally');assert.equal(run('B().allies[1].sp'),'kappa');assert.equal(run('B().allies[1].hp'),run('Math.round(corpse.st.hp*.5)'));assert.equal(run('B().allies[1].temporary'),true);
 assert.equal(run('addTemporary(caster,SK.ne_spirit)'),false,'Cannot use the same corpse twice');
 run('corpse.spiritClaimed=false;corpse.hp=1');assert.equal(run('addTemporary(caster,SK.ne_spirit)'),false);
 run('corpse.hp=0;corpse.boss=true');assert.equal(run('addTemporary(caster,SK.ne_spirit)'),false);run('corpse.boss=false;corpse.temporary=true');assert.equal(run('addTemporary(caster,SK.ne_spirit)'),false);
 run('corpse.temporary=false;B().allies.push({...caster,id:"a"},{...caster,id:"b"})');assert.equal(run('addTemporary(caster,SK.ne_spirit)'),false,'Full team has no room');
 console.log('PASS '+label+': former elemental immunity, necromancer unlock, side conversion, stats, single-use corpses, living/boss/summoned exclusions and team capacity');
}
rules(g.run,'client');
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'').replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');const context=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});vm.runInContext(source,context);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',context);rules(engine.testRun,'server');
// Exercise surrender through the authoritative dispatch branch, including a rest checkpoint and retry.
engine.testRun("globalThis.surrenderWrites=0;globalThis.surrenderRecovery=0;globalThis.testTower={id:'run1',active:true,restPending:5,cleared:5,best:5,floor:6};pvpSaveAuth_=()=>({code:'CODE',P:{}});communityAllowed_=()=>{};towerRecord_=()=>testTower;communityCoupon_=()=>({coupons:10});towerRecover_=()=>surrenderRecovery++;guildWrite_=()=>surrenderWrites++;");
assert.equal(engine.testRun("towerDispatch_({action:'tower_surrender',run:'run1'}).run.outcome"),'surrender');
assert.equal(engine.testRun('testTower.active'),false);assert.equal(engine.testRun('testTower.restPending'),0);assert.equal(engine.testRun('testTower.best'),5);
engine.testRun("towerDispatch_({action:'tower_surrender',run:'run1'})");assert.equal(engine.testRun('surrenderRecovery'),1);assert.equal(engine.testRun('surrenderWrites'),1);
const run=g.run;
for(const [id,count]of [['ms_archer10',3],['gn_rapid',3],['ar_rain',5],['ke_thousand',5]])assert.equal(run(`BattleEffects.profile('${id}').hits`),count,id);
for(const [id,asset]of [['nj_shuriken','shuriken'],['normal_m1','music'],['di_requiem','music'],['am_meteor','meteor'],['sw_charge','crescent']])assert.equal(run(`BattleEffects.profile('${id}').painted.asset`),asset,id);
const animations=[];function n(){return {style:{setProperty(){}},dataset:{},isConnected:true,closest:()=>({getBoundingClientRect:()=>({left:0,top:0,width:320,height:400})}),appendChild(){},setAttribute(){},remove(){},animate(frames,options){const a={frames,options,cancel(){}};animations.push(a);return a;}};}
g.ctx.document.createElement=n;g.ctx.from={x:50,y:300,size:40,node:n()};g.ctx.to={x:200,y:70,size:40,node:n()};g.ctx.L=n();
for(const id of ['ne_soul','wk_curse','grass_m2']){run(`BattleEffects.travel(L,from,to,BattleEffects.profile('${id}'))`);const a=animations.at(-1);assert.equal(new Set(a.frames.map(f=>f.transform)).size,1,'Beam orientation must remain fixed');assert.equal(a.frames[0].clipPath,'inset(0 100% 0 0)');assert.equal(a.frames[1].clipPath,'inset(0 0% 0 0)');}
console.log('PASS fixed-orientation progressive beams, generated asset routing, 3/5-shot limits and idempotent tower surrender from a rest checkpoint');
