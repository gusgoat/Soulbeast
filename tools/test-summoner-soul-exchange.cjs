const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function suite(run,label){
 run(`Sound.fx=()=>{};Sound.cry=()=>{};Math.random=()=>.5;
 globalThis.soulFixture=function(cls='summoner',mode='pvp',owner=0){
  const make=(id,kind,side,owner,cls,hp=1000)=>unit({id,name:id,kind,side,owner,cls,lv:60,hp,mp:77,st:{hp:1000,mp:100,patk:100,matk:100,pdef:100,mdef:100,spd:100,acc:100,eva:0,crit:0},skills:['attack'],pas:cls?humanPas(cls,{}):[],atkType:'p',types:[],stab:[]});
  const hero=make('hero','player','ally',owner,cls),a=make('petA','pet','ally',owner,null,800),b=make('petB','pet','ally',owner,null,200),enemy=make('enemy','player','enemy',1,'swordsman');
  S={P:{gold:10000,pets:[],items:{}},battle:{kind:mode,allies:[hero,a,b],enemies:[enemy],cur:'enemy',queue:[],round:1,turns:0,log:[],fx:[],effects:[],menu:'main'}};
  return {hero,a,b,enemy,make};
 }`);
 const get=s=>JSON.parse(run('JSON.stringify((()=>{'+s+'})())'));
 const jobs=JSON.parse(run(`JSON.stringify(Object.keys(CLS).filter(c=>baseOf(c)==='summoner'))`));assert.equal(jobs.length,7);
 for(const cls of jobs)for(const mode of ['pvp','wild','boss','world','raid','camp','guildwar','npc','tower']){
  const x=get(`const f=soulFixture(${JSON.stringify(cls)},${JSON.stringify(mode)});hurt(f.hero,999999);const first={hp:f.hero.hp,mp:f.hero.mp,a:f.a.hp,b:f.b.hp,used:f.hero.summonerSoulRevived};hurt(f.hero,999999);return {first,lastHP:f.hero.hp,lastA:f.a.hp,passive:hasPas(f.hero,'summoner_soul_exchange')};`);
  assert.deepEqual(x,{first:{hp:300,mp:77,a:800,b:0,used:true},lastHP:0,lastA:800,passive:true},label+' '+cls+' '+mode);
 }
 assert.deepEqual(get(`const f=soulFixture();hurt(f.hero,20);return {hp:f.hero.hp,a:f.a.hp,b:f.b.hp,used:!!f.hero.summonerSoulRevived};`),{hp:980,a:800,b:200,used:false});
 for(const condition of ['f.a.hp=f.b.hp=0','f.a.temporary=f.b.temporary=true','f.a.kind=f.b.kind="summon"','f.a.owner=f.b.owner=9','f.a.kind=f.b.kind="beast"'])assert.deepEqual(get(`const f=soulFixture();${condition};hurt(f.hero,99999);return {hp:f.hero.hp,used:!!f.hero.summonerSoulRevived};`),{hp:0,used:false},label+' ineligible '+condition);
 assert.deepEqual(get(`const f=soulFixture('mage');hurt(f.hero,99999);return {hp:f.hero.hp,b:f.b.hp};`),{hp:0,b:200});
 assert.deepEqual(get(`const f=soulFixture();f.hero.temporary=true;f.hero.kind='summon';hurt(f.hero,99999);return {hp:f.hero.hp,b:f.b.hp};`),{hp:0,b:200});
 assert.deepEqual(get(`const f=soulFixture('summoner','world',2);const foreign=f.make('foreign','pet','ally',3,null,1);B().allies.push(foreign);hurt(f.hero,99999);return {hp:f.hero.hp,own:f.b.hp,foreign:foreign.hp};`),{hp:300,own:0,foreign:1});
 assert.deepEqual(get(`const f=soulFixture('spiritlord','npc');f.hero.side='enemy';f.hero.kind='human';f.a.side=f.b.side='enemy';f.a.kind=f.b.kind='npcpet';B().enemies=[f.hero,f.a,f.b];B().allies=[f.enemy];hurt(f.hero,99999);return {hp:f.hero.hp,b:f.b.hp};`),{hp:300,b:0});
 assert.deepEqual(get(`const f=soulFixture();f.a.hp=f.b.hp=1;f.a.pas=['rebirth'];hurt(f.hero,99999);return {hp:f.hero.hp,a:f.a.hp,b:f.b.hp};`),{hp:300,a:0,b:1},label+' ties follow formation, sacrifice bypasses pet rebirth');
 assert.deepEqual(get(`const f=soulFixture();f.hero.pas.push('rebirth');hurt(f.hero,99999);const first={hp:f.hero.hp,b:f.b.hp};hurt(f.hero,99999);const second={hp:f.hero.hp,b:f.b.hp};hurt(f.hero,99999);return {first,second,final:f.hero.hp};`),{first:{hp:400,b:200},second:{hp:300,b:0},final:0},label+' original rebirth retained, new ability has own single charge');
 assert.deepEqual(get(`const f=soulFixture();f.hero.hp=1;f.hero.st.hp=1;hurt(f.hero,10);return {hp:f.hero.hp,b:f.b.hp};`),{hp:1,b:0});
 assert.deepEqual(get(`const f=soulFixture();f.hero.dots=[{n:'test',el:'normal',rate:1,turns:1}];endUnitTurn(f.hero);return {hp:f.hero.hp,b:f.b.hp};`),{hp:300,b:0},label+' damage over time');
 assert.deepEqual(get(`const f=soulFixture();f.enemy.st.patk=100000;SK.soul_test_multi={n:'test',t:'p',pw:100,hits:2,acc:100};act(f.enemy,'soul_test_multi',f.hero,f.enemy);return {hp:f.hero.hp,a:f.a.hp,b:f.b.hp,used:f.hero.summonerSoulRevived};`),{hp:0,a:800,b:0,used:true},label+' actual multi-hit can defeat revived hero, never sacrifices twice');
 assert.deepEqual(get(`const f=soulFixture();f.b.pas=['rebirth'];hurt(f.hero,99999);hurt(f.b,99999);return {hp:f.hero.hp,b:f.b.hp};`),{hp:300,b:0},label+' sacrificed phoenix cannot auto-revive as a damage side effect');
 assert.deepEqual(get(`const f=soulFixture();hurt(f.hero,99999);S=JSON.parse(JSON.stringify(S));hurt(B().allies[0],99999);return {hp:B().allies[0].hp,a:B().allies[1].hp};`),{hp:0,a:800},label+' single charge persists through saved online battle snapshots');
 assert.deepEqual(get(`let f=soulFixture();hurt(f.hero,99999);f=soulFixture();hurt(f.hero,99999);return {hp:f.hero.hp,b:f.b.hp};`),{hp:300,b:0},label+' fresh battle resets');
 console.log('PASS '+label+': all7 summoner classes across9 modes; HP30%, once, lowest-HP owned permanent companion; invalid/dead/foreign/temporary pets, NPCs, DoT, real multihit, old rebirth, and new-battle reset.');
}
const game=require('./game-context.cjs')('build/live-index.html');suite(game.run,'client');
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'').replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');
const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});vm.runInContext(source,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',ctx);suite(engine.testRun,'authoritative server');
