import {createEngine,createWorkbook,createUtilities} from './engine.mjs';
import {partyCombatRuntime} from './source/server/accounts/dungeon-party-combat-runtime.mjs';
import {partyBattleSnapshot} from './source/server/accounts/dungeon-party-snapshot.mjs';

export const SOLO_EVENT_LIMIT=512;
const TURN_MS=350;

// Normalize the initial state identically before and after storing it in JSONB.
// This also guarantees that the browser sees only data that can cross JSON.
function normalize(start){
 return JSON.parse(JSON.stringify(start,(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)
  ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,value[key]])):value));
}
function rng(id){
 let seed=2166136261;
 for(const char of id)seed=Math.imul(seed^char.charCodeAt(0),16777619);
 return ()=>{
  let t=seed=(seed+0x6d2b79f5)|0;t=Math.imul(t^t>>>15,t|1);
  t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;
 };
}
const commandKeys=['skill','item','seal','escape','swap','target','friend'];
export function soloChoice(input){
 return [2,...commandKeys.map(k=>input[k]??null)];
}
// Only these events are replayed: load/presentation acknowledgment, a due
// tick, a validated command, and toggling auto. No client stats are applied.
export function simulateSolo(start){
 const {run,code,kind,player,member:vitals,auto}=normalize(start);
 const member={...vitals,code,save:{P:player}};
 const room={members:[member],autoPlayers:{[code]:!!auto},dungeon:{enemies:{[run.enemyId]:{kind}}}};
 const unexpected=()=>{throw Error('unsupported_solo_engine_operation');};
 const engine=createEngine(createWorkbook(),createUtilities(unexpected,unexpected),rng(run.id)).partyCombat;
 let time=run.startedAt;
 const combat=partyCombatRuntime({engine,now:()=>time,turnMs:TURN_MS});
 const ready={presentationVersion:2};
 return {
  run,member,get auto(){return room.autoPlayers[code];},
  view(now=Date.now()){
   const state=partyBattleSnapshot(run);
   if(state.waiting)state.waiting.deadline=now+Math.max(0,state.waiting.deadline-time);
   if(state.presentation)state.presentation.deadline=now+Math.max(0,state.presentation.deadline-time);
   if(state.loading)state.loading.deadline=now+Math.max(0,state.loading.deadline-time);
   state.nextTurnAt=now+Math.max(0,run.nextTurnAt-time);
   return state;
  },
  async apply(event){
   if(!Array.isArray(event)||!event.length)throw Error('invalid_solo_event');
   if(event[0]===0&&event.length===1&&(run.loading||run.presentation)){
    const p=run.presentation;
    await combat.ready(room,run,code,{...ready,turn:p?.turn,sequence:p?.sequence});return;
   }
   if(run.status!=='active'||run.loading||run.presentation)throw Error('invalid_solo_event');
   if(event[0]===1&&event.length===1){
    time=Math.max(time,run.waiting?.deadline??run.nextTurnAt);
    await combat.advance(room,run);return;
   }
   if(event[0]===2&&event.length===8&&run.waiting){
    const data={...ready,actor:run.waiting.actor,turn:run.waiting.turn};
    for(const [i,key] of commandKeys.entries()){
     const val=event[i+1];if(val===null)continue;
     if(key==='swap'?(!Number.isSafeInteger(val)||val<0):key==='escape'?val!==true:typeof val!=='string'||!val.length||val.length>80)throw Error('invalid_solo_event');
     data[key]=val;
    }
    if(commandKeys.slice(0,5).filter(k=>Object.hasOwn(data,k)).length!==1)throw Error('invalid_solo_event');
    await combat.choose(room,run,code,data);return;
   }
   if(event[0]===3&&event.length===2&&typeof event[1]==='boolean'){await combat.setAuto(room,run,code,event[1]);return;}
   throw Error('invalid_solo_event');
  },
 };
}
