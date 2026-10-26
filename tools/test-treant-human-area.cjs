const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function suite(r,label){
 r("render=()=>{};toast=()=>{};Math.random=()=>.5;S={P:{lv:60},battle:{kind:'boss',meta:8,allies:[],enemies:[],effects:[],fx:[],log:[],round:1}};globalThis.testStats={hp:100000,mp:1000,patk:100,matk:100,pdef:100,mdef:100,spd:100,acc:100,crit:0,eva:0};globalThis.attacker=unit({id:'boss',kind:'beast',side:'enemy',sp:'golem',boss:true,lv:60,st:{...testStats},hp:100000,mp:1000,pas:[],skills:[],atkType:'p'});globalThis.makeHero=(cls,lv)=>unit({id:'hero',kind:'player',side:'ally',cls,lv,st:{...testStats},hp:100000,mp:1000,pas:humanPas(cls,{},lv),skills:[],atkType:'p'});globalThis.hero=makeHero('archmage',50);hero.class10Barrier=0;B().allies=[hero];B().enemies=[attacker];globalThis.shot={t:'p',pw:100,acc:100};globalThis.damage=()=>{const h=hero.hp;hitOne(attacker,shot,hero,1);return h-hero.hp;};");
for(const cls of ['wildgod','packlord','archdruid','stormcaller'])for(const lv of [20,39,60]){
r("hero=makeHero('"+cls+"',"+lv+");hero.skills=humanSkills(hero.cls,hero.lv,{});B().allies=[hero];globalThis.originalSkills=hero.skills.slice();actBase(hero,'dr_treant',attacker,hero,true)");
assert(r("originalSkills.every(id=>hero.skills.includes(id))"));
assert(r("hero.skills.every(id=>FORMS.treant.sk.includes(id)||id==='revert'||originalSkills.includes(id))"));
r("actBase(hero,'revert',attacker,hero,true)");assert(r("JSON.stringify(hero.skills)===JSON.stringify(originalSkills)"));
r("actBase(hero,'dr_bear',attacker,hero,true)");assert(r("originalSkills.every(id=>hero.skills.includes(id))&&FORMS.bear.sk.every(id=>hero.skills.includes(id))"));
}
r("hero=makeHero('stormcaller',60);hero.skills=humanSkills(hero.cls,hero.lv,{});B().allies=[hero];actBase(hero,'dr_treant',attacker,hero,true)");assert(r("hero.skills.includes('sc_tempest')"));const hp=r('attacker.hp');r("actBase(hero,'sc_tempest',attacker,hero,true)");assert(r('attacker.hp')<hp);
console.log('PASS '+label+': all unlocked human skills retained in treant and bear, revert restores skills, tempest deals damage');
}
const g=require('./game-context.cjs')(process.argv[2]||'build/live-index.html');suite(g.run,'client');let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'').replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});vm.runInContext(source,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',ctx);suite(engine.testRun,'server');
