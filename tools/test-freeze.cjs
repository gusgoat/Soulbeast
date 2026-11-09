const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const engines=['tools/town-walk-demo/menu.html','game-app.95c532bf5f401ce2.js','tools/town-walk-demo/social-engine.generated.js','tools/hemant-walk-demo/war-engine.generated.js','supabase/functions/soulbeast-dungeon-party/engine.mjs'];
function fn(src,name){const at=src.indexOf('function '+name+'(');assert(at>=0,name);const end=src.indexOf('\nfunction ',at+1);return src.slice(at,end).trim()}
let checks=0;
for(const file of [...engines,'game-data-elements.cbf3d313854fe0f5.js']){
 const src=read(file),data=file.startsWith('game-app.')?read('game-data-elements.cbf3d313854fe0f5.js'):src;
 const definition=data.match(/freeze:\{n:'แช่แข็ง'[^\n]+/)[0].replace(/,$/,'');
 const c={R:(lo,hi)=>{assert.equal(lo,3);assert.equal(hi,5);return c.roll}};vm.createContext(c);
 vm.runInContext('var STS={'+definition+'};',c);
 for(const roll of [3,4,5]){c.roll=roll;assert.equal(vm.runInContext('STS.freeze.d()',c),roll);checks++}
 assert.match(vm.runInContext('STS.freeze.info',c),/3–5/);
 assert.match(vm.runInContext('STS.freeze.info',c),/50%/);
 if(!engines.includes(file))continue;
 Object.assign(c,{S:{battle:{kind:'normal'}},hasPas:()=>false,isWorldBattle:()=>false,isBalancedPvp:()=>false,blog(){},fxAdd(){},heal(){},hurt(){},PERSISTENT_AILMENTS:['poison','burn','freeze'],persistentBattleUnit:u=>u.side==='ally'&&['player','pet'].includes(u.kind),IMM:{freeze:['ice']},PAS:{},ExtraAudio:{play(){}},Math:Object.create(Math)});
 c.Math.random=()=>0;
 vm.runInContext(fn(src,'turnStartBase')+'\n'+fn(src,'applyStatus'),c);
 for(const kind of ['player','pet','enemy'])for(const mode of ['normal','pvp','world','camp','guildwar','dungeonParty'])for(const duration of [3,4,5]){
  c.S.battle.kind=mode;c.roll=duration;
  const u={name:kind,kind,side:kind==='enemy'?'enemy':'ally',status:{},buffs:[],st:{hp:100,mp:100},hp:100,mp:100,pas:[],types:['normal']};
  c.applyStatus(u,'freeze',1);assert.equal(u.status.freeze,duration,file);
  c.applyStatus(u,'freeze',1);assert.equal(u.status.freeze,duration,'reapplication must not refresh');
  for(let turn=0;turn<duration;turn++)assert.equal(c.turnStartBase(u),true,file+' frozen turn '+turn);
  assert.equal(u.status.freeze,undefined);assert.equal(c.turnStartBase(u),false,'next normal turn can act');checks++;
 }
 for(const kind of ['player','pet','enemy']){
  // Execute the real damage-path thaw guard, with both hit elements.
  const thaw=src.match(/if\(t.status.freeze&&attackHasElement\(u,sk,'fire'\)[^\n]+/)[0];
  assert(!thaw.includes('persistentBattleUnit'));
  Object.assign(c,{u:{},t:{name:kind,kind,side:kind==='enemy'?'enemy':'ally',status:{freeze:5}},sk:{el:'water'},attackHasElement:(u,sk,el)=>sk.el===el});
  vm.runInContext(thaw,c);assert.equal(c.t.status.freeze,5);
  c.sk.el='fire';vm.runInContext(thaw,c);assert.equal(c.t.status.freeze,undefined);checks++;
 }
 const immune={hp:100,name:'ice',status:{},types:['ice'],pas:[]};c.applyStatus(immune,'freeze',1);assert(!immune.status.freeze);
 if(src.includes('function storedAilments(')){
  vm.runInContext(src.split('\n').find(line=>line.startsWith('function storedAilments(')),c);
  assert.equal(c.storedAilments({ailments:{freeze:1,poison:1}}).freeze,1);
  assert.equal(c.storedAilments({ailments:{freeze:1,poison:1}}).poison,2);
  assert(!/Math\.max\(2,(?:old|human|u)\.status\[k\]/.test(src),'save/swap must preserve last freeze turn');
  assert(src.includes("k==='freeze'?'นับเมื่อถึงเทิร์นปกติ"));checks++;
 }
 assert(src.includes("if(s.freeze&&(k==='pdef'||k==='mdef'))v*=1.5"));
 console.log('PASS '+file);
}
console.log(`PASS ${checks} freeze scenarios: random 3–5 turns, full-duration skips, player/pet/enemy, six battle modes, fire thaw, immunity, remaining-turn saves and descriptions`);
