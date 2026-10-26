const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function suite(run,label){
 const classes=['gunner','marksman','machinist','gunsaint','bounty','cannoneer','demolisher'].filter(c=>run('!!CLS['+JSON.stringify(c)+']'));
 const all=JSON.parse(run("JSON.stringify(Object.keys(CLS).filter(c=>baseOf(c)==='gunner'))"));
 for(const cls of all)for(const lv of [54,55,60])for(const mode of ['boss','world','wild','pvp','tower','raid','camp','guildwar'])for(const boss of [false,true]){
 const got=run(`(()=>{S={P:{lv:1},battle:{kind:'${mode}',meta:6,allies:[],enemies:[]}};const u={cls:'${cls}',lv:${lv},kind:'player',pas:[],buffs:[]},t={boss:${boss},pas:[],buffs:[]};return [gunnerBossBountyFactor(u,t),soloDemonCareerFactor(u),humanPas(u.cls,{},u.lv).includes('gunnerBossBounty'),classCombatFactor(u,t,{t:'m'})/classCombatFactor({...u,lv:54},t,{t:'m'})]})()`);
 const expected=lv>=55&&boss?1.6:1;assert.equal(got[0],expected);assert.equal(got[1],1);assert.equal(got[2],lv>=55);assert.equal(got[3],expected);
 }
 for(const kind of ['pet','npcpet','summon','human'])assert.equal(run(`gunnerBossBountyFactor({kind:'${kind}',cls:'gunsaint',lv:60},{boss:true})`),1);
 assert.equal(run("gunnerBossBountyFactor({kind:'player',cls:'gunsaint',lv:60,temporary:true},{boss:true})"),1);
 assert.equal(run("gunnerBossBountyFactor({kind:'player',cls:'archmage',lv:60},{boss:true})"),1);
 assert.equal(run("humanPas('gunsaint',{},54).includes('gunnerBossBounty')"),false);
 assert.equal(run("humanPas('gunsaint',{},55).filter(x=>x==='gunnerBossBounty').length"),1);
 assert.equal(run("PAS.gunnerBossBounty.n"),'ล่าค่าหัว');
 assert.equal(run("(()=>{S.battle.kind='boss';S.battle.meta=6;return soloDemonCareerFactor({kind:'player',cls:'archmage'})})()"),1.6);
 console.log('PASS '+label+': all '+all.length+' gunner careers, Lv54/55/60, 8 battle modes, boss/nonboss, no Demon stacking, UI passive unlock, companions excluded');
}
const g=require('./game-context.cjs')(process.argv[2]||'build/live-index.html');suite(g.run,'client');
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'').replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});vm.runInContext(source,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',ctx);suite(engine.testRun,'server');
