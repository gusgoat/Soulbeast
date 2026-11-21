import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {partyAudio} from './labyrinth-demo/online-party-audio.mjs';
import {siegeAudio} from './colosseum/siege-audio.mjs';

// Repeated animation frames and server snapshots must not replay a burst.
const heard=[],party=partyAudio(()=>({tick(){},boss(){},trap:t=>heard.push(t),dispose(){}}));
const floor={floor:1,theme:'snow'},map={river:[]};
const frame={position:{x:0,y:0},ready:true,world:{},traps:[]};
party.setFloor(floor,map);
for(const type of ['blast','poison','fire','electric','ice'])frame.traps.push({id:type,type,done:true,burst:.8});
party.tick(.016,frame);party.tick(.016,frame);
assert.deepEqual(heard,['blast','poison','fire','electric','ice']);
party.setFloor(floor,map);party.tick(.016,{...frame,blocked:true});party.tick(.016,frame);
assert.equal(heard.length,5);
party.setFloor(floor,map);party.tick(.016,frame);assert.equal(heard.length,10);
const calls=[],arena=siegeAudio(k=>calls.push(k),()=> 'male');
const state={now:1000,bases:[],baseEffects:[],traps:[{id:'a',type:'blast',burstUntil:1800}]};
for(const mode of ['team','survival']){
 arena.reset();arena.sync({...state,mode},null,{phase:'walk'});arena.sync({...state,mode},null,{phase:'walk'});
}
assert.deepEqual(calls,['trap-blast','trap-blast']);
arena.reset();arena.sync(state,null,null);arena.sync(state,{},{});assert.equal(calls.length,2);
arena.reset();arena.sync({...state,now:1500},{});assert.equal(calls.length,2);
arena.reset();arena.sync({...state,traps:[{id:'x',type:'ice',burstUntil:1800}]},{});assert.equal(calls.at(-1),'trap-other');

// Exercise the actual walking mixer with a shared context and controlled preferences.
const events={},sources=[],requests=[];let prefs={enabled:true,volume:.5,effectsVolume:1};
const node=()=>({connect(){},disconnect(){},gain:{value:0,setTargetAtTime(){}},frequency:{value:0,setTargetAtTime(){}}});
const context={state:'running',sampleRate:10,currentTime:0,destination:{},createBuffer:()=>({getChannelData:()=>new Float32Array(40)}),createBiquadFilter:node,createGain:node,
 createBufferSource(){const s={...node(),start(){s.started=true},stop(){s.stopped=true}};sources.push(s);return s},
 decodeAudioData(b,resolve){resolve({name:new TextDecoder().decode(b)})},resume:async()=>{},suspend:async()=>{},close:async()=>{throw Error('shared context must stay open')}};
const document={hidden:false,documentElement:{dataset:{}},body:{append(){}},addEventListener:(k,f)=>events[k]=f,removeEventListener(){},createElement:()=>({style:{},setAttribute(){},remove(){}})};
const scope={walkAudioCatalog:{steps:{},music:{},traps:{blast:'blast',other:'other'}},AudioContext:function(){throw Error('must reuse bridge')},SoulbeastAudioBridge:{getContext:()=>context,owns:c=>c===context},addEventListener(){},removeEventListener(){}};
vm.runInNewContext(fs.readFileSync(new URL('./town-walk-demo/walk-audio.js',import.meta.url),'utf8'),{window:scope,document,localStorage:{getItem:()=>JSON.stringify(prefs)},Date,Math,fetch:async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new TextEncoder().encode(url).buffer}}});
const mixer=scope.WalkAudio.create({kind:'dungeon'});events.pointerdown({type:'pointerdown'});
await mixer.trap('blast');await mixer.trap('ice');
const shots=()=>sources.filter(s=>s.buffer?.name);
assert.deepEqual(shots().map(s=>s.buffer.name),['blast','other']);assert.equal(requests.length,2);
mixer.tick(.3,{position:{x:0,y:0},blocked:true});assert.equal(shots()[0].stopped,undefined);
prefs.enabled=false;mixer.tick(.3,{position:{x:0,y:0}});assert.ok(shots().every(s=>s.stopped));
await mixer.trap('blast');assert.equal(shots().length,2);
prefs.enabled=true;prefs.effectsVolume=0;await mixer.trap('blast');assert.equal(shots().length,2);
prefs.effectsVolume=1;document.hidden=true;await mixer.trap('blast');assert.equal(shots().length,2);
document.hidden=false;mixer.dispose();await mixer.trap('blast');assert.equal(shots().length,2);
console.log('PASS trap sound routing, deduplication, reset, mute, hidden, shared context and feedback ring-out');
