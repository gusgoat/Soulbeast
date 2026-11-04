import {partyBattleTransition} from './online-party-battle-transition.mjs';
import {remotePartyMotion} from './online-party-view.mjs';

// Renderer bridge: authoritative snapshots control gameplay; WebSocket motion
// updates only animate the visual positions of members still in this room.
export function partyScene({code,roomId,view,clock=()=>performance.now()}){
 const motion=remotePartyMotion(),battle=partyBattleTransition({code,
  stopSolo:options=>view.stopSolo(options),enterBoss:options=>view.enterBoss(options)});
 let revision=-1,snapshot=null,serverOffset=0,departed=false,closed=false,roster=new Set(),queue=Promise.resolve();
 async function receiveState(next){
  if(closed||departed||next?.id!==roomId||!Number.isSafeInteger(next.revision)||next.revision<revision)return;
  if(!Number.isFinite(next.serverTime))return;
  serverOffset=next.serverTime-clock();
  if(next.departure){
   departed=true;battle.reset();motion.clear();roster.clear();
   await view.stopSolo({award:false,interrupted:[]});
   await view.respawn(next.departure.destination);return;
  }
  if(next.revision===revision)return;
  if(!Array.isArray(next.members)||!next.members.some(m=>m.code===code))return;
  const first=!snapshot,floorChanged=snapshot&&snapshot.floor!==next.floor;
  if(floorChanged){battle.reset();motion.clear();}
  const nextRoster=new Set(next.members.map(m=>m.code));
  for(const old of roster)if(!nextRoster.has(old))motion.remove(old);
  if(first||floorChanged)await view.loadFloor(next.floor);
  if(closed)return;
  roster=nextRoster;revision=next.revision;snapshot=structuredClone(next);
  view.vitals(next.members);
  view.roster?.(next.members);
  view.world(next.dungeon);
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
   const time=clock(),serverNow=time+serverOffset;
   for(const member of snapshot.members){if(member.code===code)continue;
    const position=motion.position(member.code,time)||member.position;
    if(position)view.peer(member,position);
   }
   // Each client draws the same deadline, not an independent two-second timer.
   view.traps((snapshot.dungeon?.traps||[]).map(t=>({...t,
    remaining:Math.max(0,(t.explodeAt-serverNow)/1000),
    burst:t.explodeAt<=serverNow?Math.max(0,1-(serverNow-t.explodeAt)/800):0})));
  },
  beginSolo:id=>battle.beginSolo(id),isCurrent:ticket=>battle.isCurrent(ticket),
  close(){closed=true;battle.reset();motion.clear();roster.clear();}
 };
}
