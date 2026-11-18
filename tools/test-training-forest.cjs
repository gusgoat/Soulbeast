const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const catalog = read('tools/town-walk-demo/training-forest-scenes.js');
const bridge = read('tools/town-walk-demo/forest-walk.js');
const menu = read('tools/town-walk-demo/menu.html');
const c = {URL, structuredClone, Math: Object.create(Math), document: {currentScript: {src:'http://local/Soulbeast/tools/town-walk-demo/forest-walk.js'},querySelector:()=>null,getElementById:()=>null},
  S:{zone:null,screen:'zone',ui:{}}, ZDEPTH:10, SAFE:['spring','revival','village','hospital','exit'],TRAPS:[0,1,2,3,4,5],
  ZN:Array.from({length:7},(_,i)=>({train:i===6})),EV:{},WorldTales:{block:()=>false},save(){},render(){},zlog(){},newFork(){},pick:xs=>xs[4]};
vm.createContext(c);
vm.runInContext(catalog+'\n'+bridge.replace('return {mount, finishBattle, presentSearch};','return {mount, finishBattle, presentSearch, next, encounter, view, nextDestination};'), c);
const run = code => vm.runInContext(code,c);
// All configured stories have distinct IDs and visual profiles, without RNG reads.
c.Math.random=()=>{throw Error('Scenery consumed encounter RNG');};
assert.equal(run('TrainingForestScenes.ids.length'),14);
for(const id of run('TrainingForestScenes.ids')) {
  c.testID=id;
  assert(run('TrainingForestScenes.describe(testID).title.length > 0'));
}
assert.equal(run('TrainingForestScenes.describe("after:quest:training-3").id'),'after-training');
// The selected riddle's identity survives until contact; no entry/reward is run on selection.
c.Math.random=()=>.8;
run('S.zone={id:7,depth:3,fork:[{k:"riddleReward"},{k:"beast"}],riddleRun:{reward:{id:"training-bells"}},walk:{map:"entrance",phase:"cleared"}}; ForestWalk.next(S.zone,S.zone.walk,"left")');
assert.equal(c.S.zone.walk.scene.id,'training-bells');
assert.equal(c.S.zone.depth,3);
assert(!c.S.zone.riddleSession);
run('ForestWalk.next(S.zone,S.zone.walk,"right")');
assert.equal(c.S.zone.depth,3); // Can't bypass a story while its scene is pending.
run('S.zone.walk.position=[1.05,-15.8]');
let calls=0;
c.chooseFork=()=>{calls++;c.S.zone.depth++;c.S.zone.riddleSession={id:'training-bells'};};
run('ForestWalk.encounter(S.zone,S.zone.walk)');
assert.equal(calls,1);
assert.equal(c.S.zone.walk.showStory,true);
run('ForestWalk.encounter(S.zone,S.zone.walk)');
assert.equal(calls,1); // Repeated contact never re-enters/rewards the story.
delete c.S.zone.riddleSession;
const sameWalk=c.S.zone.walk;
run('S.zone.fork=[{k:"spring"},{k:"village"}];ForestWalk.view(()=>"legacy")');
assert.equal(c.S.zone.walk,sameWalk);
assert.equal(c.S.zone.walk.map,'training');
assert.equal(c.S.zone.walk.scene.id,'training-bells');
assert.deepEqual(Array.from(c.S.zone.walk.position),[1.05,-15.8]);
assert.equal(c.S.zone.walk.phase,'cleared');
assert.equal(c.S.zone.walk.showStory,false);
run('ForestWalk.encounter(S.zone,S.zone.walk)');
assert.equal(calls,1,'completed place restarted its event');
// A story interrupting a normal mist map must restore that map, even after serialization.
c.chooseFork=()=>{c.S.zone.depth++;c.S.zone.riddleSession={id:'training-poison'};};
run('S.zone={id:7,depth:3,walk:{map:"mist",phase:"pending",position:[2,-13],fork:[{k:"mist"}],side:0}};ForestWalk.encounter(S.zone,S.zone.walk);S.zone=JSON.parse(JSON.stringify(S.zone));delete S.zone.riddleSession;S.zone.fork=[{k:"spring"}];ForestWalk.view(()=>"legacy")');
assert.equal(c.S.zone.walk.map,'mist');
assert.equal(c.S.zone.walk.scene,undefined);
assert.deepEqual(Array.from(c.S.zone.walk.position),[2,-13]);
// A resumed native session can be approached after loading; save the contact position, not its spawn.
run('S.zone={id:7,depth:4,riddleSession:{id:"training-bells"},walk:{map:"training",phase:"pending",scene:TrainingForestScenes.describe("training-bells"),position:[1.05,-43]}};ForestWalk.view(()=>"legacy");S.zone.walk.position=[1.05,-15];ForestWalk.encounter(S.zone,S.zone.walk)');
assert.deepEqual(Array.from(c.S.zone.walk.menuOrigin.position),[1.05,-15]);
run('delete S.zone.riddleSession;S.zone.fork=[{k:"spring"}];ForestWalk.view(()=>"legacy")');
assert.deepEqual(Array.from(c.S.zone.walk.position),[1.05,-15]);
c.chooseFork=()=>{};
run('S.zone.walk={map:"training",phase:"pending",fork:[{k:"secret"}],side:0};ForestWalk.encounter(S.zone,S.zone.walk)');
assert.equal(c.S.zone.walk.phase,'pending');
assert.equal(c.S.zone.walk.showStory,false); // A stale native plan cannot freeze walking.
// A rolled trap is saved once and the no-trap result is also explicit.
for (const roll of [.1,.8]) {
  c.Math.random=()=>roll;
  run('S.zone={id:7,depth:1,fork:[{k:"beast"},{k:"spring"}],walk:{map:"entrance",phase:"cleared"}};ForestWalk.next(S.zone,S.zone.walk,"left")');
  assert.equal(c.S.zone.walk.trapIndex,roll<.14?4:-1);
}
// Original trap damage, MP costs, notice and logging remain identical for all six traps.
const oldMenu = execFileSync('git',['show','27826b96348a8228169bf5586781efc705abc2b0:tools/town-walk-demo/menu.html'],{cwd:root,maxBuffer:20*1024*1024,encoding:'utf8'});
function extract(src,name,end){const start=src.indexOf('function '+name+'(');assert(start>=0);return src.slice(start,src.indexOf(end,start));}
const trapDefs = menu.match(/TRAPS:\(\)=>\((\[[\s\S]*?\])\),/)[1];
const defs = vm.runInNewContext('('+trapDefs+')');
for(let index=0;index<6;index++) {
  function result(source,planned) {
    const p={hp:100,mp:100},pet={hp:100,mp:100};
    const host={TRAPS:defs,S:{P:p,ui:{}},pick:xs=>{assert(!planned,'Planned trap was randomly selected again');return xs[index];},pStats:()=>({hp:100,mp:100}),party:()=>[pet],calcPet:()=>({hp:100,mp:100}),WorldTales:{modifier:()=>.25},index};
    vm.createContext(host);vm.runInContext(extract(source,'trap','\nconst ZT='),host);
    vm.runInContext(source.match(/const detailTrap=trap;trap=function[^\r\n]+/)[0],host);
    const message=vm.runInContext(planned?'trap(TRAPS[index])':'trap()',host);
    return JSON.stringify({p,pet,notice:host.S.ui.trapNotice,message});
  }
  assert.equal(result(menu,true),result(oldMenu,false));
}
// Boss contact opens the original challenge, without incrementing depth or fighting twice.
run('S.zone={id:7,depth:10,walk:{map:"boss",phase:"pending"}};ForestWalk.encounter(S.zone,S.zone.walk)');
assert.equal(c.S.zone.depth,10);assert(c.S.zone.walk.showStory);assert.equal(calls,1);
// Ready routes are read directly, and hidden routes keep their original unknown label.
c.EV={spring:{n:'ลำธารใส'},village:{n:'หมู่บ้านกลางป่า'},bush:{n:'พุ่มไม้รก'}};
c.Math.random=()=>{throw Error('Rerolled an existing fork');};
run('S.P={generated:0};S.zone={id:7,depth:1,fork:[{k:"spring",h:false},{k:"village",h:false}],walk:{map:"entrance",phase:"cleared"}}');
assert.equal(run('ForestWalk.nextDestination(S.zone,S.zone.walk,"left")'),'ลำธารใส');
assert.equal(run('ForestWalk.nextDestination(S.zone,S.zone.walk,"right")'),'หมู่บ้านกลางป่า');
run('S.zone.fork[1].h=true');
assert.equal(run('ForestWalk.nextDestination(S.zone,S.zone.walk,"right")'),'ทางมืด · ยังไม่ทราบสถานที่');
// Future routes use the original generator on a copy, then replay its same rolls at the exit.
let generations=0,draws=0,saves=0;
c.save=()=>saves++;
c.zlog=t=>c.S.zone.log.push(t);
c.Math.random=()=>{draws++;return .2;};
c.newFork=()=>{generations++;c.S.P.generated++;c.S.zone.plannedDepth=c.S.zone.depth;c.S.zone.fork=[{k:c.Math.random()<.5?'spring':'village',h:false},{k:c.Math.random()<.5?'village':'spring',h:false}];c.save();};
run('S.P={generated:0};S.zone={id:7,depth:2,log:[],ev:{type:"village"},fork:null,walk:{map:"bush",phase:"pending",position:[-14,15],fork:[{k:"bush"}],side:0}}');
const originalPlayer=c.S.P;
assert.equal(run('ForestWalk.nextDestination(S.zone,S.zone.walk,"left")'),'ลำธารใส');
run('S.zone.walk.position=[14,15]');
assert.equal(run('ForestWalk.nextDestination(S.zone,S.zone.walk,"right")'),'หมู่บ้านกลางป่า');
assert.equal(generations,1);assert.equal(draws,2);assert.equal(saves,0);
assert.equal(c.S.P,originalPlayer);assert.equal(c.S.P.generated,0);
assert.equal(c.S.zone.depth,2);assert.equal(c.S.zone.fork,null);assert.equal(c.S.zone.ev.type,'village');
assert.equal(c.S.zone.log.length,0);
run('ForestWalk.next(S.zone,S.zone.walk,"left")');
assert.equal(generations,2);assert.equal(draws,2,'exit drew a new destination instead of its preview');
assert.equal(c.S.P.generated,1);assert.equal(c.S.zone.depth,3);assert.equal(c.S.zone.plannedDepth,3);
assert.equal(c.S.zone.walk.map,'spring');assert.equal(saves,2);
console.log('PASS training scenes: 14 profiles, pending/contact guards, native event dispatch, saved trap rolls, all six original trap effects, boss depth');
console.log('PASS left/right destination names: existing forks, hidden paths, immutable preview, stable side switching, original generator and matching exit rolls');
