const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function suite(run,label){
 // This suite isolates the existing pet and summoner defense rules from the separately tested career coefficients.
 run(`const defenseTestAttack=classCombatFactor,defenseTestDefense=pvpDamageFactor;classCombatFactor=function(u,t,sk){return defenseTestAttack(u,t,sk)/pvpCareerOutgoing(u)};pvpDamageFactor=function(u,t){return defenseTestDefense(u,t)/pvpCareerIncoming(t)};`);
 run(`globalThis.defenseFixture=function(cls,count,kind='player',mode='pvp'){
  const unit=(id,side,owner,kind,cls)=>({id,side,owner,kind,cls,hp:100,st:{hp:100},pas:[],buffs:[]});
  const defender=unit('hero','ally',0,'player',cls),pets=Array.from({length:count},(_,i)=>unit('pet'+i,'ally',0,'pet'));
  const attackerHero=unit('enemyHero','enemy',1,'player','swordsman'),attacker=kind==='pet'?unit('enemyPet','enemy',1,'pet'):attackerHero;
  S={P:{gold:0},battle:{kind:mode,allies:[defender,...pets],enemies:kind==='pet'?[attackerHero,attacker]:[attackerHero]}};
  return {defender,pets,attacker,attackerHero};
 }`);
 function factors(cls,count,kind,mode='pvp',dead=false){return JSON.parse(run(`JSON.stringify((()=>{const f=defenseFixture(${JSON.stringify(cls)},${count},${JSON.stringify(kind)},${JSON.stringify(mode)});if(${dead})f.pets.forEach(p=>p.hp=0);return {defense:pvpDamageFactor(f.attacker,f.defender),attack:classCombatFactor(f.attacker,f.defender,{t:'p'})}})())`));}
 for(const cls of ['sealmaster','spiritlord']){
  assert.deepEqual(factors(cls,1,'player'),{defense:.6,attack:1},label+' human attacker');
  const f=factors(cls,2,'pet');assert.equal(f.defense,.6);assert.equal(f.attack,.7);assert(Math.abs(f.defense*f.attack-.42)<1e-12,label+' combined42%');
  assert.deepEqual(factors(cls,0,'pet'),{defense:1,attack:.7},label+' no pets');
  assert.deepEqual(factors(cls,2,'player','pvp',true),{defense:1,attack:1},label+' dead pets do not grant reduction');
  assert.deepEqual(factors(cls,2,'pet','boss'),{defense:1,attack:1},label+' PVE preserved');
 }
 assert.deepEqual(factors('mage',1,'player'),{defense:1,attack:1});
 assert.deepEqual(factors('mage',1,'pet'),{defense:1,attack:.7},label+' general pet-to-player rule70%');
 assert.deepEqual(factors('beastking',3,'player'),{defense:1,attack:1},label+' other summoners do not gain60%');
 assert.equal(run(`(()=>{const f=defenseFixture('sealmaster',2,'pet');return classCombatFactor(f.attacker,f.pets[0],{t:'p'})})()`),1,label+' pet-to-pet preserved');

 // All owners use70% against players; summoner team redistribution is retained.
 for(const cls of ['summoner','tamer','soullink','beastking','soulsage','sealmaster','spiritlord','wildlord','mage'])for(const count of [1,2,3]){
  const actual=run(`(()=>{const f=defenseFixture('mage',0,'pet');f.attackerHero.cls=${JSON.stringify(cls)};for(let i=1;i<${count};i++)B().enemies.push({...f.attacker,id:'extra'+i});return classCombatFactor(f.attacker,f.defender,{t:'p'});})()`);
  const sum=['summoner','tamer','soullink','beastking','soulsage','sealmaster','spiritlord'].includes(cls),growth=sum?.35:.15;
  const expected=(1+growth*(count-1))/count*.7;
  assert(Math.abs(actual-expected)<1e-12,label+' owner '+cls+' / '+count+' pets');
 }
 for(const cls of ['sealmaster','spiritlord']){
  for(const mode of ['wild','boss','world','raid','camp','guildwar','npc','tower'])assert.equal(run(`(()=>{const f=defenseFixture('mage',0,'pet',${JSON.stringify(mode)});f.attackerHero.cls=${JSON.stringify(cls)};return classCombatFactor(f.attacker,f.defender,{t:'m'});})()`),1,label+' PVE '+mode);
  assert.equal(run(`(()=>{const f=defenseFixture('mage',1,'pet');f.attackerHero.cls=${JSON.stringify(cls)};return classCombatFactor(f.attacker,f.pets[0],{t:'p'});})()`),1,label+' offensive pet-to-pet unchanged');
  assert.equal(run(`(()=>{const f=defenseFixture('mage',0,'pet');f.attackerHero.cls=${JSON.stringify(cls)};f.attacker.owner=9;return classCombatFactor(f.attacker,f.defender,{t:'p'});})()`),.7,label+' unrelated owner cannot inherit exception');
  assert.equal(run(`(()=>{const f=defenseFixture('mage',0,'player');f.attackerHero.cls=${JSON.stringify(cls)};return classCombatFactor(f.attackerHero,f.defender,{t:'m'});})()`),1,label+' hero damage unchanged');
  assert.equal(run(`(()=>{const f=defenseFixture(${JSON.stringify(cls)},1,'pet');f.attackerHero.cls=${JSON.stringify(cls)};return pvpDamageFactor(f.attacker,f.defender)*classCombatFactor(f.attacker,f.defender,{t:'p'});})()`),.42,label+' pet attack.7 times target defense.6');
 }
 assert.equal(run(`typeof PAS.summoner_guard`),'undefined');
 assert.equal(run(`Object.keys(CLS).some(c=>chain(c).some(k=>(CLS[k].pas||[]).includes('summoner_guard')))`),false,label+' guard removed from all tiers');
 console.log('PASS '+label+': summoner guard removed; two classes damage60% with living pets; all owners pet-to-player70%; team scaling/ownership/hero damage/PVE/defense rules preserved.');
}
for(const file of ['runtime/classRefresh.js','server/accounts/engine.ts'])assert(!fs.readFileSync(file,'utf8').includes('summonerGuardHit'),'interception wrapper removed');
const game=require('./game-context.cjs')('build/live-index.html');suite(game.run,'client');
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'');source=source.replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');
const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});vm.runInContext(source,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',ctx);suite(engine.testRun,'authoritative server');
