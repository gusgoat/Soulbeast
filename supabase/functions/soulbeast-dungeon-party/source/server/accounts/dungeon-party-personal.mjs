import {createHash} from 'node:crypto';
import {personalState,applyPersonalState,replayPersonal,personalTrap,personalAction} from '../../../personal-combat.mjs';
import {evacuateDeadMembers} from './dungeon-party-death.mjs';

export async function ensurePersonal(room,member,combat,uuid,now,actionsVersion=0){
 if(Object.values(room.battles||{}).some(b=>b.status==='active'&&b.participants?.includes(member.code)))return;
 room.personal??={};let p=room.personal[member.code];
 if(p?.floor!==room.floor){
  if(p){room.personalArchive??={};room.personalArchive[p.id]={code:p.code,receipts:p.receipts};}
  const placements=await combat.enemyPlacements(room.floor),own={floor:room.floor,dungeon:{enemies:{}}};
  for(const [id,point]of Object.entries(placements))own.dungeon.enemies[id]={kind:id.startsWith('bandit:')?'bandit':'shadow',state:'roaming',position:{x:point.x,y:point.y},home:{x:point.x,y:point.y},patrol:point.patrol};
  combat.prepareEnemyAppearances(own);
  const enemies=Object.fromEntries(Object.entries(own.dungeon.enemies).map(([id,e])=>[id,{kind:e.kind,position:e.position,home:e.home,patrol:e.patrol,appearance:e.appearance,plan:e.encounterPlan}]));
  // The inventory adapter normalizes the same equipment/team defaults as battles.
  await combat.inventory(room,member,{});
  p=room.personal[member.code]={id:uuid(),code:member.code,floor:room.floor,issuedAt:now(),enemies,traps:await combat.trapPlacements(room.floor),seq:0,state:personalState(member.save.P,member),spent:{},receipts:{},stateRevision:0};
  room.revision=(room.revision||0)+1;
 }else if(p.suspended&&(room.dungeon.boss==='guarding'||p.actionsVersion===3&&room.dungeon.boss==='defeated')&&!room.personalGather){rebasePersonal(room,member);p.suspended=false;p.bossDefeated=room.dungeon.boss==='defeated';}
 if(actionsVersion===3&&p.actionsVersion!==3){
  const map=await combat.map(room.floor);p.actionsVersion=3;p.spring={x:map.mini.x,y:map.mini.y};
  p.chests=Object.fromEntries(map.chests.map(c=>[c.id,{x:c.x,y:c.y,big:!!c.big,reward:combat.planChest(room.floor,c)}]));
  p.state.chests??=structuredClone(room.chestClaims?.[member.code]||{});p.state.player.labyrinthBossChests??=structuredClone(member.save.P.labyrinthBossChests||{});
  for(const legacy of Object.values(member.save.P.labyrinth||{}))for(const [id,reward]of Object.entries(legacy.opened||{}))if(id.endsWith('-grand'))p.state.player.labyrinthBossChests[id]??=reward;
  p.bossDefeated=room.dungeon.boss==='defeated';room.revision=(room.revision||0)+1;
 }
 return p;
}
export function rebasePersonal(room,member){const p=room.personal?.[member.code];if(p&&p.floor===room.floor){p.state=personalState(member.save.P,member,p.state.traps,p.state.chests);p.stateRevision++;room.revision=(room.revision||0)+1;}}
const fingerprint=data=>createHash('sha256').update(JSON.stringify({grant:data.grant,seq:data.seq,kind:data.kind,enemy:data.enemy,events:data.events,result:data.result,auto:!!data.auto,trap:data.trap,arm:data.arm,position:data.position,op:data.op,data:data.data,chest:data.chest})).digest('hex');
export async function finishPersonal(room,actor,data,{combat,now,snapshot}){
 const p=room.personal?.[actor],archive=room.personalArchive?.[data.grant],digest=fingerprint(data);
 const previous=(p?.id===data.grant?p:archive)?.receipts?.[data.seq];
 if(previous){if((archive&&archive.code!==actor)||previous.digest!==digest)throw Error('personal_receipt_mismatch');return {personalAck:{grant:data.grant,seq:data.seq,result:previous.result},snapshot:snapshot(room,actor,now(),false,true)};}
 const member=room.members.find(m=>m.code===actor);
 if(!member||room.state!=='active')throw Error('party_not_member');
 if(!p||p.id!==data.grant||p.floor!==room.floor||data.floor!==room.floor)throw Error('personal_wrong_floor');
 if(p.suspended||room.dungeon.boss==='fighting')throw Error('personal_suspended');
 if(!Number.isSafeInteger(data.seq)||data.seq!==p.seq+1)throw Error('personal_sequence');
 let next,result;
 if(data.kind==='battle'){
  if(p.bossDefeated)throw Error('personal_suspended');
  if(!p.enemies[data.enemy]||p.spent[data.enemy])throw Error('personal_enemy_unavailable');
  next=await replayPersonal(p,p.state,data);result=next.run.result;
  if(result==='win'){
   p.spent[data.enemy]=true;const kind=p.enemies[data.enemy].kind;
   room.dungeon.kills[kind]++;
   if(room.dungeon.kills.shadow>=room.dungeon.rules.shadows&&room.dungeon.kills.bandit>=room.dungeon.rules.bandits)room.dungeon.doorOpen=true;
   room.dungeon.contributions??={};const own=room.dungeon.contributions[actor]??={shadow:0,bandit:0};own[kind]++;
  }
  room.autoPlayers??={};room.autoPlayers[actor]=next.auto;
 }else if(data.kind==='trap'){
  const nav=await combat.navigation(room);if(!nav.walkable(data.position?.x,data.position?.y))throw Error('invalid_personal_trap');
  next=personalTrap(p,p.state,data);result=next.hit?'trap-hit':'trap-avoided';
 }else if(['inventory','heal','chest'].includes(data.kind)){
  if(data.kind!=='inventory'){
   const nav=await combat.navigation(room),target=data.kind==='heal'?p.spring:p.chests?.[data.chest];
   if(!target||!nav.walkable(data.position?.x,data.position?.y)||!nav.clear(data.position,target))throw Error('invalid_personal_action');
  }
  next=personalAction(p,p.state,data);result=data.kind;
 }else throw Error('invalid_personal_result');
 p.state=next.state;p.seq=data.seq;applyPersonalState(member,p.state);
 p.receipts[data.seq]={digest,result};
 room.revision=(room.revision||0)+1;
 await evacuateDeadMembers(room,combat.evacuate);
 return {personalAck:{grant:p.id,seq:p.seq,result},snapshot:snapshot(room,actor,now(),false,true)};
}
