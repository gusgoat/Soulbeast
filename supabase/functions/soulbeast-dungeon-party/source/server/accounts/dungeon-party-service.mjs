import {ensurePersonal,finishPersonal,rebasePersonal} from './dungeon-party-personal.mjs';
import {acceptLocalPosition,localEnemyContact,armLocalTrap,resolveLocalTrap} from './dungeon-party-local.mjs';
import {createFloor,claimEnemy,settleEnemy,openBossDoor,beginBoss,settleBoss,nextFloor,scaleBossTeam,doorReady} from '../../tools/labyrinth-demo/online-party-rules.mjs';
import {departPartyMember,evacuateDeadMembers} from './dungeon-party-death.mjs';
import {createPartyTraps,advancePartyTraps,visiblePartyTraps} from './dungeon-party-traps.mjs';
import {partySnapshot,partyBattleSnapshot} from './dungeon-party-snapshot.mjs';
import {initializePartyWorld,advancePartyWorld,advancePartyBoss} from './dungeon-party-world.mjs';
import {movePartyMember} from './dungeon-party-movement.mjs';
import {soloStart,applySoloResult} from './dungeon-party-solo-start.mjs';
import {simulateSolo,SOLO_EVENT_LIMIT} from '../../../solo-combat.mjs';
const snapshotActions=new Set(['claim','bossContact','battleCommand','battleAuto','battleReady','tick','soloFinish','trapArm','trapResolve']);

// Storage and combat are server adapters. The transaction must atomically persist
// battle state, member vitals, progression and reward receipts.
export function dungeonPartyService({transaction,combat,now=()=>Date.now(),uuid=()=>crypto.randomUUID()}) {
 const snapshot=(...args)=>{combat.prepareEnemyAppearances?.(args[0]);return partySnapshot(...args);};
 return async function command(actor,roomId,action,data={}) {
  return transaction(roomId,async room=>{
   if(action==='personalFinish')return finishPersonal(room,actor,data,{combat,now,snapshot});
   // An ejected player's reconnect must still deliver their persisted respawn.
   // The gateway must authenticate ownership of actor before this service call.
   if(['status','pulse','leave'].includes(action)&&room.departures?.[actor])return snapshot(room,actor,now());
   if(['status','pulse','leave'].includes(action)&&room.completed&&room.members.some(p=>p.code===actor))return snapshot(room,actor,now());
   if(room.state!=='active'||!room.members.some(p=>p.code===actor))throw Error('party_not_member');
   room.dungeon??=createFloor(room.startedSize,1);
   if(action==='leave'){
    const member=room.members.find(p=>p.code===actor);
    const player=member.save?.P;
    if(!player||!['blue','green','red'].includes(player.country))throw Error('server_save_required');
    const city=player.country+'-capital';
    await departPartyMember(room,member,'left',{city});
    room.revision=(room.revision||0)+1;
    return snapshot(room,actor,now());
   }
   const floor=room.dungeon;
   const me=room.members.find(p=>p.code===actor);
   if(!floor.banditRoster8){const placements=await combat.enemyPlacements(floor.floor);for(let i=0;i<8;i++){const id='bandit:'+i;if(!floor.enemies[id]&&placements[id]){const p=placements[id];floor.enemies[id]={kind:'bandit',state:'roaming',battle:null,position:{x:p.x,y:p.y},home:{x:p.x,y:p.y},patrol:p.patrol};}}floor.banditRoster8=true;room.revision=(room.revision||0)+1;}

   if(data.requestId!==undefined&&(!/^[a-zA-Z0-9-]{1,128}$/.test(data.requestId)||typeof data.requestId!=='string'))throw Error('bad_request_id');
   const fingerprint=action==='soloFinish'?'':JSON.stringify(Object.fromEntries(Object.keys(data).filter(k=>k!=='requestId').sort().map(k=>[k,data[k]])));
   const receipt=data.requestId&&Object.hasOwn(room.receipts||{},data.requestId)&&room.receipts[data.requestId];
   if(receipt){if(receipt.actor!==actor||receipt.action!==action||receipt.fingerprint!==fingerprint)throw Error('request_mismatch');return snapshotActions.has(action)?{...receipt.result,snapshot:snapshot(room,actor,now(),true)}:receipt.result;}
   if(data.localExploration===true&&!room.localExploration){
    room.localExploration=true;room.revision=(room.revision||0)+1;
   }
   if(room.localExploration){
    if(floor.worldTick===undefined)initializePartyWorld(floor,await combat.enemyPlacements(floor.floor));
    floor.traps??=createPartyTraps(await combat.trapPlacements(floor.floor));
    if(data.position&&me.exploring)acceptLocalPosition(room,me,data,await combat.navigation(room));
   }
   if(room.personal?.[actor]?.actionsVersion===3&&(['chest','heal'].includes(action)||action==='inventory'&&data.op))throw Error('personal_action_required');
   if(room.personal?.[actor]?.suspended&&(['chest','heal'].includes(action)||action==='inventory'&&data.op))throw Error('already_fighting');
   if(data.personalVersion===2)await ensurePersonal(room,me,combat,uuid,now,data.personalActions);
   async function finishBattle(battle){
    if(battle.presentation)return;
    await evacuateDeadMembers(room,combat.evacuate);
    if(battle.status==='finished'&&!battle.settled){
     const changed=battle.kind==='boss'?settleBoss(floor,battle.id,battle.result):settleEnemy(floor,battle.enemyId,battle.id,battle.result);
     if(changed){if(battle.kind!=='boss'&&battle.result==='win'){floor.contributions??={};const own=floor.contributions[battle.participants[0]]??={shadow:0,bandit:0};own[floor.enemies[battle.enemyId].kind]++;}await combat.settle(room,battle);battle.settled=true;if(doorReady(floor))floor.doorOpen=true;
      if(battle.kind==='boss')for(const member of room.members)if(room.personal?.[member.code]?.actionsVersion===3){rebasePersonal(room,member);room.personal[member.code].suspended=false;room.personal[member.code].bossDefeated=floor.boss==='defeated';}
     }
    }
   }
   async function startSharedBoss(){
     const id=uuid();
     const interrupted=Object.values(floor.enemies).filter(e=>e.state==='fighting').map(e=>e.battle);
     beginBoss(floor,id);
     for(const oldId of interrupted){const old=room.battles[oldId];
      if(old?.status==='active'){await combat.interrupt(room,old);old.status='interrupted';}
     }
     // Build from each member's current server vitals, after interrupt processing.
     const enemies=scaleBossTeam(await combat.bossTeam(floor.floor),room.startedSize);
     room.battles??={};room.battles[id]=await combat.createBoss(room,enemies,id);
     for(const member of room.members)if(room.battles[id].participants.includes(member.code))member.lastBattleId=id;
     // Persistent transition lets a member returning from an iframe or a lost
     // socket switch battles too. Never depend solely on a broadcast arriving.
     room.battleTransition={revision:(room.revision||0)+1,battle:id,
      interrupted,participants:room.members.map(member=>member.code),floor:floor.floor};

     delete room.personalGather;return {battle:id,interrupted};
   }
   async function advanceFloor(){const next=nextFloor(floor);if(next){room.dungeon=next;room.floor=next.floor;room.battles={};room.battleTransition=null;await combat.arrive(room);}else{room.state='closed';room.completed=true;}delete room.personalGather;return {floor:room.floor,completed:!next};}
   async function startGatherIfReady(){const g=room.personalGather;if(!g||(g.kind==='nextFloor'?floor.boss!=='defeated':floor.boss!=='guarding'))return null;const required=room.members.filter(m=>m.hp>0&&room.personal?.[m.code]?.floor===room.floor);if(required.every(m=>g.ready[m.code]))return g.kind==='nextFloor'?advanceFloor():startSharedBoss();return null;}
   let result;
   if(room.personalGather&&action==='status'){const started=await startGatherIfReady();if(started)room.revision=(room.revision||0)+1;}
   switch(action){
    case 'personalBossReady':{
     const p=room.personal?.[actor],g=room.personalGather;if(!p||!g||me.hp<=0||g.floor!==room.floor||data.gather!==g.id||data.grant!==p.id||data.afterSeq!==p.seq)throw Error('personal_sequence');
     p.suspended=true;g.ready[actor]=true;result=await startGatherIfReady()||{gathering:true};break;
    }
    case 'status':return snapshot(room,actor,now(),data.soloStart!==false,data.personalVersion===2);
    case 'inventory':{
     if(!me.exploring||me.hp<=0||Object.values(room.battles||{}).some(b=>b.status==='active'&&b.participants.includes(actor)))throw Error('already_fighting');
     const inventory=await combat.inventory(room,me,data);if(!data.op)return inventory;result={changed:true};break;
    }
    case 'trapArm':{
     if(!room.localExploration)throw Error('bad_party_action');
     armLocalTrap(room,me,data.trap,now(),await combat.navigation(room));result={armed:true};break;
    }
    case 'trapResolve':{
     if(!room.localExploration)throw Error('bad_party_action');
     const outcome=resolveLocalTrap(room,me,data.trap,now(),await combat.navigation(room));
     await evacuateDeadMembers(room,combat.evacuate);result={resolved:true,...outcome};break;
    }
    case 'chest':result=await combat.chest(room,me,data.chest);break;
    case 'heal':{
     if(!me.exploring||me.hp<=0)throw Error('already_fighting');
     result=await combat.heal(room,me);break;
    }
    case 'move':{
     if(!combat.navigation||!combat.movementSpeed)throw Error('movement_adapter_required');
     result=movePartyMember(room,me,data,now(),await combat.navigation(room),await combat.movementSpeed(room,me));break;
    }
    case 'pulse':
    case 'worldTick':{
     // One authenticated transaction advances the whole room, including AFK
     // members' due turns, and returns the caller's private view.
     if(action==='pulse'){
      if(!room.localExploration&&data.movement&&me.exploring&&!Object.values(room.battles||{}).some(b=>b.status==='active'&&b.participants.includes(actor)))
       movePartyMember(room,me,data.movement,now(),await combat.navigation(room),await combat.movementSpeed(room,me));
      for(const battle of Object.values(room.battles||{}))if(!battle.localCombatVersion&&(battle.status==='active'||battle.presentation)){
       await combat.advance(room,battle);await finishBattle(battle);
      }
     }
     if(room.localExploration){
      for(const trap of floor.traps)if(trap.state==='armed'&&now()>=trap.explodeAt)trap.state='spent';
      result={};break;
     }
     if(!combat.trapPlacements)throw Error('trap_adapter_required');
     if(!combat.enemyPlacements||!combat.navigation)throw Error('world_adapter_required');
     if(floor.worldTick===undefined)initializePartyWorld(floor,await combat.enemyPlacements(floor.floor));
     const nav=await combat.navigation(room);
     advancePartyWorld(floor,room.members,now(),nav);
     if(combat.bossMovement)advancePartyBoss(floor,room.members,now(),nav,await combat.bossMovement(room));
     floor.traps??=createPartyTraps(await combat.trapPlacements(floor.floor));
     const events=advancePartyTraps(floor.traps,room.members,now(),nav.distance);
     const departed=await evacuateDeadMembers(room,combat.evacuate);
     result={events,traps:visiblePartyTraps(floor.traps),departed};break;
    }
    case 'claim':{
     if(me.hp<=0)throw Error('player_defeated');
     // The movement server checks physical contact, not a client-supplied position.
     if(!(room.localExploration?localEnemyContact(room,me,data.enemy,data.enemyPosition,await combat.navigation(room)):combat.contact(room,actor,data.enemy)))throw Error('enemy_out_of_reach');
     const id=uuid(),enemy=claimEnemy(floor,data.enemy,actor,id);
     room.battles??={};room.battles[id]=await combat.createSolo(room,me,enemy,id);me.lastBattleId=id;
     if(data.localCombatVersion===1){const run=room.battles[id];run.localCombatVersion=1;run.initialAuto=!!room.autoPlayers?.[actor];}
     result={battle:id};break;
    }
    case 'openDoor':
     if(!combat.atDoor(room,actor))throw Error('door_out_of_reach');
     openBossDoor(floor);result={opened:true};break;
    case 'bossContact':{
     if(me.hp<=0||!(room.localExploration?await combat.localBossContact(room,me,data.enemyPosition):combat.contact(room,actor,'boss')))throw Error('boss_out_of_reach');
     // Two members may touch the same boss in the same network frame.
     // The room transaction serializes both requests into one shared battle.
     if(floor.boss==='fighting'){
      const active=Object.values(room.battles||{}).find(b=>b.kind==='boss'&&b.status==='active');
      if(!active)throw Error('boss_battle_missing');
      result={battle:active.id,interrupted:[],joined:true};break;
     }
     if(room.members.some(m=>room.personal?.[m.code]?.floor===room.floor)){room.personalGather??={id:uuid(),floor:room.floor,ready:{}};result={gathering:true};break;}
     result=await startSharedBoss();break;
    }
    case 'soloFinish':{
     const run=room.battles?.[data.battle];
     if(!run?.localCombatVersion||run.participants[0]!==actor||run.status==='interrupted')throw Error('battle_not_member');
     if(run.status==='finished'){result={battle:run.id};break;}
     if(!Array.isArray(data.events)||!data.events.length||data.events.length>SOLO_EVENT_LIMIT)throw Error('invalid_solo_result');
     let sim;
     try{sim=simulateSolo(soloStart(room,run,me));for(const event of data.events)await sim.apply(event);}
     catch{throw Error('invalid_solo_result');}
     const resume=sim.run.status==='active'&&data.events.length>=SOLO_EVENT_LIMIT-16&&!sim.run.presentation&&!sim.run.loading;
     if((!resume&&(sim.run.status!=='finished'||sim.run.presentation||sim.run.result!==data.result))||sim.member.hp!==data.hp||sim.member.mp!==data.mp)throw Error('invalid_solo_result');
     applySoloResult(me,sim.member);
     room.autoPlayers??={};room.autoPlayers[actor]=sim.auto;
     Object.assign(run,sim.run);
     if(resume){
      delete run.localCombatVersion;delete run.loading;delete run.presentation;
      run.nextTurnAt=now()+350;if(run.waiting)run.waiting.deadline=now()+12000;
     }else{delete run.presentation;delete run.waiting;delete run.loading;run.finishedAt=now();await finishBattle(run);}
     result={battle:run.id};break;
    }
    case 'battleReady':
    case 'battleCommand':
    case 'battleAuto':
    case 'tick':{
     const battle=room.battles?.[data.battle];
     if(!battle||!battle.participants.includes(actor)||battle.localCombatVersion&&battle.status==='active')throw Error('battle_not_member');
     if(battle.status!=='active'&&!(battle.presentation&&['battleReady','tick'].includes(action))){result={battle:partyBattleSnapshot(battle)};break;}
     // Multiple viewers can request the same due turn. Don't write or broadcast
     // another revision when one viewer has already advanced it.
     if(action==='tick'&&battle.status==='active'&&!battle.loading&&!battle.presentation&&now()<(battle.waiting?.deadline??battle.nextTurnAt))
      return {snapshot:snapshot(room,actor,now())};
     // Advance only turns due by server time; manual turns retain their deadline.
     if(action==='battleReady')await combat.ready(room,battle,actor,data);
     else if(action==='battleCommand')await combat.choose(room,battle,actor,data);
     else if(action==='battleAuto')await combat.setAuto(room,battle,actor,data.enabled);
     else await combat.advance(room,battle);
     await finishBattle(battle);
     result={battle:partyBattleSnapshot(battle)};break;
    }
    case 'nextFloor':{
     if(floor.boss!=='defeated')throw Error('boss_not_defeated');
     if(!combat.atStairs(room,actor))throw Error('stairs_out_of_reach');
     // Progress is team-wide; no member can farm the next floor in a separate instance.
     if(room.members.some(m=>room.personal?.[m.code]?.actionsVersion===3)){room.personalGather??={id:uuid(),kind:'nextFloor',floor:room.floor,ready:{}};result={gathering:true};break;}
     result=await advanceFloor();break;
    }
    default:throw Error('bad_party_action');
   }
   if(['chest','heal'].includes(action)||action==='inventory'&&data.op)rebasePersonal(room,me);
   if(data.requestId&&action!=='soloFinish'){room.receipts??={};room.receipts[data.requestId]={actor,action,fingerprint,result:structuredClone(result)};}
   room.revision=(room.revision||0)+1;
   if(action==='pulse')return snapshot(room,actor,now());
   // Return the same allowlisted view already sent over realtime in this committed reply.
   if(action==='personalBossReady'||['chest','heal','inventory'].includes(action))return {...result,snapshot:snapshot(room,actor,now(),false,!!room.personal?.[actor])};
   if(snapshotActions.has(action))return {...result,snapshot:snapshot(room,actor,now(),action==='claim',!!(room.personal?.[actor]?.actionsVersion===3&&room.battles?.[data.battle]?.status==='finished'))};
   return result;
  });
 };
}
