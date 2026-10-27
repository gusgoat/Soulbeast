const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const g=require('./game-context.cjs')('build/live-index.html'),run=g.run;
const rank=e=>e.worldLegend?3:e.legend?2:e.craft?1:0;
const eq=JSON.parse(run('JSON.stringify(EQ)'));
assert.equal(Object.keys(eq).length,382);
for(const [id,e]of Object.entries(eq)){
 for(const [lowerId,lower]of Object.entries(eq)){
  if(lower.special||e.slot!==lower.slot||e.slot==='weapon'&&e.wt!==lower.wt||lower.lv>e.lv||rank(lower)>=rank(e))continue;
  for(const key of Object.keys(e.st||{}))if(lower.st?.[key]>0)assert(e.st[key]>lower.st[key],id+' must exceed '+lowerId+' '+key);
 }
}
// The standard and legendary progression remains monotonic within each equipment family.
for(const [id,e]of Object.entries(eq))for(const [oldId,old]of Object.entries(eq))if(!e.special&&!old.special&&e.lv>old.lv&&rank(e)===rank(old)&&e.slot===old.slot&&(e.slot!=='weapon'||e.wt===old.wt))for(const key of Object.keys(e.st||{}))if(old.st?.[key]>0)assert(e.st[key]>=old.st[key],id+' progression below '+oldId+' '+key);
const snapshot=run('JSON.stringify(EQ)'),save=run('JSON.stringify(S.P)');run('Math.random=()=>{throw Error("No random balance")};applyEquipmentBalance(EQ);');assert.equal(run('JSON.stringify(EQ)'),snapshot,'Balance must be idempotent');assert.equal(run('JSON.stringify(S.P)'),save);
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'').replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});vm.runInContext(source,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',ctx);assert.deepEqual(JSON.parse(engine.testRun('JSON.stringify(EQ)')),eq,'Authoritative equipment must match client');for(const id of new Set(Object.values(eq).map(e=>e.ws||e.sk).filter(Boolean)))assert.deepEqual(JSON.parse(engine.testRun('JSON.stringify(SK['+JSON.stringify(id)+'])')),JSON.parse(run('JSON.stringify(SK['+JSON.stringify(id)+'])')),'Equipment skill parity '+id);
console.log('PASS 382 stable equipment IDs, role/level rarity floors, within-tier level progression, idempotence, save/RNG isolation and full server equipment/skill parity');
