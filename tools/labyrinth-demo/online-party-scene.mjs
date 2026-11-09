import {partyBattleTransition} from './online-party-battle-transition.mjs';
import {remotePartyMotion} from './online-party-view.mjs?v=smooth-peers-1';

// Renderer bridge: authoritative snapshots control gameplay; WebSocket motion
// updates only animate the visual positions of members still in this room.
export function partyScene({code,roomId,view,clock=()=>performance.now()}){
 const motion=remotePartyMotion(),battle=partyBattleTransition({code,
  stopSolo:options=>view.stopSolo(options),enterBoss:options=>view.enterBoss(options)});
 const trapDeadlines=new Map();
 let revision=-1,snapshot=null,departed=false,closed=false,roster=new Set(),queue=Promise.resolve();
 async function receiveState(next){
  if(closed||departed||next?.id!==roomId||!Number.isSafeInteger(next.revision)||next.revision<revision)return;
  if(!Number.isFinite(next.serverTime))return;
  if(next.departure){
   departed=true;battle.reset();motion.clear();roster.clear();
   await view.stopSolo({award:false,interrupted:[]});
   await view.respawn(next.departure.destination,next.departure.reason);return;
  }
  if(next.revision===revision)return;
  if(!Array.isArray(next.members)||!next.members.some(m=>m.code===code))return;
  const first=!snapshot,floorChanged=snapshot&&snapshot.floor!==next.floor;
  if(floorChanged){battle.reset();motion.clear();trapDeadlines.clear();}
  const nextRoster=new Set(next.members.map(m=>m.code));
  for(const old of roster)if(!nextRoster.has(old))motion.remove(old);
  if(first||floorChanged)await view.loadFloor(next.floor);
  if(closed)return;
  roster=nextRoster;revision=next.revision;snapshot=structuredClone(next);
  const receivedAt=clock();
  for(const trap of next.dungeon?.traps||[]){
   if(!trapDeadlines.has(trap.id))trapDeadlines.set(trap.id,receivedAt+trap.explodeAt-next.serverTime);
  }
  view.vitals(next.members);
  view.roster?.(next.members);
  view.world(next.dungeon,next.serverTime);
  if(next.state==='closed'){closed=true;battle.reset();await view.complete();return;}
  await battle.apply(next.battleTransition);
  await view.battle?.(next.battle);
 }
 return {
  receiveState(next){queue=queue.catch(()=>{}).then(()=>receiveState(next));return queue;},
  receiveMotion(sender,packet){
   if(closed||departed||sender===code||!roster.has(sender)||packet?.floor!==snapshot?.floor)return;
   motion.receive(sender,packet,clock());
  },
  frame(){
   if(!snapshot||closed||departed)return;
   const time=clock();
   for(const member of snapshot.members){if(member.code===code)continue;
    const position=motion.position(member.code,time)||member.position;
    if(position)view.peer(member,position);
   }
   // Anchor the visual timer once; packet jitter cannot restart the effect.
   if(!snapshot.localExploration)view.traps((snapshot.dungeon?.traps||[]).map(t=>{
    const elapsed=time-trapDeadlines.get(t.id);
    return {...t,remaining:Math.max(0,-elapsed/1000),burst:elapsed>=0?Math.max(0,1-elapsed/800):0};
   }));
  },
  beginSolo:id=>battle.beginSolo(id),isCurrent:ticket=>battle.isCurrent(ticket),
  close(){closed=true;battle.reset();motion.clear();roster.clear();}
 };
}
