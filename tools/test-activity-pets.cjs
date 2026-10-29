const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
(async()=>{for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r("render=()=>{};Sound.fx=()=>{};S.zone=null;S.battle=null;S.P.lv=40;S.P.cls='summoner';normalizePack();for(const sp of ['kappa','mandrake','kappa','mandrake'])S.P.pets.push(mkPet(sp,30));S.P.carried=S.P.pets.map(p=>p.uid);S.P.party=[S.P.pets[0].uid];var forest=JSON.stringify(S.P.party);var ids=S.P.carried.slice();WORLD.room=null;PVP.room=null;CAMP.room=null;GUILD_UI.data=null;");
 for(const mode of ['world','pvp','guildAttack','campGuard','campRaid']){
  const cap=r(`ActivityPets.cap('${mode}')`);r(`ActivityPets.ids('${mode}').slice().forEach(id=>ActivityPets.toggle('${mode}',id));ids.slice(0,${cap}).forEach(id=>ActivityPets.toggle('${mode}',id));ActivityPets.toggle('${mode}',ids[${cap}]);`);
  assert.equal(r(`ActivityPets.ids('${mode}').length`),cap);assert(r(`ActivityPets.ids('${mode}').includes(ids[${cap}])`));assert(!r(`ActivityPets.ids('${mode}').includes(ids[0])`));assert.equal(r('JSON.stringify(S.P.party)'),r('forest'));
  const html=r(`ActivityPets.view('${mode}','เลือกอสูร')`);assert(html.includes('Lv 30'));assert(html.includes('cw-pet-grid'));assert(html.includes('aria-pressed="true"'));assert(html.includes('data-a="activityPet"'));
 }
 r("S.P.cls='swordsman';ActivityPets.picks={};ActivityPets.toggle('world',ids[1]);");assert.equal(r("ActivityPets.ids('world').length"),1);assert.equal(r("ActivityPets.ids('world')[0]"),r('ids[1]'));
 assert(r('vWorld()').includes('data-pet-mode="world"'));assert(r('vPvpBase()').includes('data-pet-mode="pvp"'));
 r("GUILD_UI.data={guild:{},war:{used:false,targets:[]},defense:{ready:false,pets:[]}};");assert(r('vGuildWar()').includes('data-pet-mode="guildAttack"'));assert(r('vGuildWar()').includes('data-pet-mode="campGuard"'));
 r("WORLD.busy=true;var held=JSON.stringify(ActivityPets.ids('world'));ActivityPets.toggle('world',ids[2]);");assert.equal(r("JSON.stringify(ActivityPets.ids('world'))"),r('held'));r('WORLD.busy=false');
 r("var payloads=[];wbCall=async(a,p)=>payloads.push({action:a,...p});handlers.wbCreate();");assert.equal(r('JSON.stringify(payloads[0].pets)'),r("JSON.stringify(ActivityPets.ids('world'))"));
 r("GUILD_UI.confirm=null;handlers.guildAttack('opponent');");assert.equal(r('JSON.stringify(GUILD_UI.confirm.extra.pets)'),r("JSON.stringify(ActivityPets.ids('guildAttack'))"));r('GUILD_UI.confirm=null');
 r("campCall=async(a,p)=>payloads.push({action:a,...p});gsSave=async()=>({ok:true});");await r("handlers.campBegin('target')");assert.equal(r("JSON.stringify(payloads.find(p=>p.action==='camp_begin').pets)"),r("JSON.stringify(ActivityPets.ids('campRaid'))"));
 r("withOnline=async(a,f)=>f();pvpSchedule=()=>{};pvpReceive=()=>{};lbPost=async p=>{payloads.push(p);return {ok:true,at:1};};ActivityPets.toggle('pvp',ids[2]);");await r("pvpConnect('create')");assert.equal(r("JSON.stringify(payloads.find(p=>p.action==='pvp_create').pets)"),r("JSON.stringify(ActivityPets.ids('pvp'))"));assert.equal(r('JSON.stringify(S.P.party)'),r('forest'));
 r("S.P.code='DIFFERENTCHAR001';");assert.equal(r("ActivityPets.ids('pvp')[0]"),r('S.P.party[0]'),'Selection resets across characters');
 console.log('PASS '+file+': portrait/Lv choices across five activity teams, replacement at class caps, deselection, busy locks, actual outgoing payloads and unchanged forest party');
}
// Exercise the actual server room creation/join, plus the guild profile builder.
let src=fs.readFileSync('build/accounts/index.ts','utf8').split('const accountTemplates=')[0].replace(/^import .*\r?\n/gm,'').replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');
const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:crypto.webcrypto,btoa,atob,sha256:v=>crypto.createHash('sha256').update(v).digest()});vm.runInContext(src,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),createUtilities(s=>sha256(new TextEncoder().encode(s)),()=>crypto.randomUUID()))',ctx);
const fixture=require('./game-context.cjs')('build/live-index.html'),r=fixture.run;r("S.P.cls='summoner';S.P.lv=40;normalizePack();for(const sp of ['kappa','mandrake','kappa'])S.P.pets.push(mkPet(sp,30));S.P.carried=S.P.pets.map(p=>p.uid);S.P.party=[S.P.pets[0].uid];");const state=JSON.parse(r('JSON.stringify(S)')),ids=state.P.carried;
const call=(code,action,extra={})=>engine.dispatch({action,code,pin:'123456',...extra});for(const code of ['ACTIVITYTEST0001','ACTIVITYTEST0002']){state.P.code=code;assert(call(code,'save',{data:JSON.stringify(state)}).ok);}
const first=call('ACTIVITYTEST0001','pvp_create',{pets:[ids[1],ids[2]]});assert(first.ok,JSON.stringify(first));assert.deepEqual(Array.from(first.room.battle.allies.filter(u=>u.kind==='pet').map(u=>u.uid)),[ids[1],ids[2]]);
const joined=call('ACTIVITYTEST0002','pvp_join',{room:first.room.id,pets:[ids[3]]});assert(joined.ok,JSON.stringify(joined));assert.deepEqual(Array.from(joined.room.battle.enemies.filter(u=>u.kind==='pet').map(u=>u.uid)),[ids[3]]);assert.deepEqual(JSON.parse(call('ACTIVITYTEST0001','load').data).P.party,state.P.party);
ctx.raw=state.P;ctx.selected=[ids[1],ids[3]];assert.deepEqual(Array.from(engine.testRun('guildCombatTeam_(raw,0,selected).team.filter(u=>u.kind===\'pet\').map(u=>u.uid)')),[ids[1],ids[3]]);
for(const bad of [[ids[1],ids[1]],[999999],['1'],ids.concat(999998)]){ctx.bad=bad;assert.throws(()=>engine.testRun('activityPvpTeam_(raw,0,bad)'),/camp pets selection/);}
console.log('PASS server: explicit pets reach real PVP create/join and guild teams; invalid, duplicate, unowned and over-cap selections rejected without changing saved party');
})().catch(e=>{console.error(e);process.exitCode=1});
