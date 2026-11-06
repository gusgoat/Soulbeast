import {settleEnemy,settleBoss} from '../../tools/labyrinth-demo/online-party-rules.mjs';
// evacuate must save the normal respawn and delete the room membership in the
// SAME transaction. It must also remove the sealer and pets from active combat.
export async function evacuateDeadMembers(room,evacuate){
 const dead=room.members.filter(p=>p.hp<=0);
 if(dead.length&&!evacuate)throw Error('respawn_adapter_required');
 for(const member of dead)await departPartyMember(room,member,'death',await evacuate(room,member));
 return dead.map(p=>p.code);
}

export async function departPartyMember(room,member,reason,destination){
  for(const battle of Object.values(room.battles||{})){
   if(!['active','finished'].includes(battle.status)||battle.settled||!battle.participants.includes(member.code))continue;
   battle.participants=battle.participants.filter(code=>code!==member.code);
   // Keep defeated units for the final replay, but never let their pets or
   // queued extra turns continue fighting after the owner has left the room.
   const units=battle.battle?.allies||[];
   const removed=new Set(units.filter(u=>u.ownerCode===member.code).map(u=>u.id));
   for(const unit of units)if(removed.has(unit.id))unit.hp=0;
   if(battle.battle){
    if(battle.waiting?.ownerCode===member.code){delete battle.waiting;delete battle.battle.partyPending;}
    battle.battle.queue=(battle.battle.queue||[]).filter(id=>!removed.has(String(id).replace(/\*$/,'')));
    if(removed.has(battle.battle.partyFreeTurn))delete battle.battle.partyFreeTurn;
   }
   if(!battle.participants.length&&battle.status==='active'){
    battle.status='interrupted';
    if(battle.kind==='boss')settleBoss(room.dungeon,battle.id,'abandoned');
    else settleEnemy(room.dungeon,battle.enemyId,battle.id,'abandoned');
   }
  }
  room.departures??={};room.departures[member.code]={reason,destination};
  room.members=room.members.filter(p=>p.code!==member.code);
  if(room.battleTransition)room.battleTransition.participants=room.battleTransition.participants.filter(code=>code!==member.code);
 if(member.code===room.host)room.host=room.members[0]?.code||null;
 if(!room.members.length)room.state='closed';
}
