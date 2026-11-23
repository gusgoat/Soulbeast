function personalGrant(record){if(!record)return;return {version:2,...pick(record,['id','code','floor','issuedAt','enemies','traps','seq','state','spent','stateRevision','suspended','actionsVersion','chests','spring','bossDefeated'])};}
import {soloStart} from './dungeon-party-solo-start.mjs';
import {visiblePartyTraps} from './dungeon-party-traps.mjs';
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value?.[k]!==undefined).map(k=>[k,structuredClone(value[k])]));
export function partyBattleSnapshot(run){
 if(!run)return null;
 const b=run.battle;
 return {...pick(run,['id','kind','enemyId','participants','status','result','settled','nextTurnAt','finishedAt','waiting','rewards','loading','presentation','effectSequence','effectActor','effectSkill','localCombatVersion']),
  battle:b?{...pick(b,['round','turns','cur','queue']),
   allies:(b.allies||[]).map(publicUnit),enemies:(b.enemies||[]).map(publicUnit),
   log:(b.log||[]).slice(-20),effects:(b.effects||[]).slice(-32)}:null};
}
function publicUnit(u){return pick(u,['id','ownerCode','side','kind','name','cls','gender','sp','evo','img','lv','hp','mp','st','types','stab','form','status','buffs','pas','charging','charge','immune','enchant','dots','summonLife','taunt','boss','bossHelper','nightAura','temporary','captured','class10Barrier','archerVeil','elementalBarrierHits']);}
// Explicit allowlist: room storage also contains saves, credentials and receipts.
// Never serialize that storage object directly to a player or broadcast channel.
export function partySnapshot(room,code,serverTime,includeSolo=false,includePersonal=false){
 const departure=room.departures?.[code];
 if(departure)return {id:room.id,revision:room.revision||0,serverTime,departure:structuredClone(departure)};
 if(!room.members.some(m=>m.code===code))throw Error('party_not_member');
 const floor=room.dungeon;
 const member=room.members.find(m=>m.code===code);
 const mine=Object.values(room.battles||{}).filter(b=>b.participants?.includes(code));
 const recent=mine.find(b=>b.id===member.lastBattleId&&b.status==='finished');
 const run=mine.find(b=>b.status==='active')||recent||mine.filter(b=>b.status==='finished').sort((a,b)=>
  (b.finishedAt??b.startedAt??0)-(a.finishedAt??a.startedAt??0)||(b.startedAt??0)-(a.startedAt??0))[0];
 return {
  ...(includePersonal?{personal:personalGrant(room.personal?.[code])}:{}),personalMode:!!room.personal?.[code],bossGather:room.personalGather?{id:room.personalGather.id,floor:room.personalGather.floor,ready:Object.keys(room.personalGather.ready),kind:room.personalGather.kind||'boss'}:null,
  ...pick(room,['id','host','state','floor','startedSize','completed','localExploration']),revision:room.revision||0,serverTime,
  members:room.members.map(m=>pick(m,['code','name','cls','level','gender','avatar','country','hp','mp','maxHp','maxMp','online','position','exploring','ailments'])),
  dungeon:floor?{floor:floor.floor,rules:structuredClone(floor.rules),kills:structuredClone(floor.kills),
   contributions:structuredClone(floor.contributions||{}),doorOpen:floor.doorOpen,boss:floor.boss,bossBattle:floor.bossBattle,
   bossPosition:floor.bossPosition?structuredClone(floor.bossPosition):null,bossDir:floor.bossDir||0,bossMoving:!!floor.bossMoving,
   enemies:Object.fromEntries(Object.entries(floor.enemies).map(([id,e])=>[id,pick(e,['kind','state','position','home','patrol','dir','moving','actor','appearance'])])),
   traps:visiblePartyTraps(floor.traps||[])}:null,
  battleTransition:room.battleTransition?structuredClone(room.battleTransition):null,
  chestClaims:structuredClone({...member.save?.P?.labyrinthBossChests,...(room.personal?.[code]?.actionsVersion===3?room.personal[code].state.chests:Object.assign({},...Object.values(room.chestClaims||{})))}),
  hasActiveBattles:Object.values(room.battles||{}).some(b=>b.status==='active'),
  autoPlayers:structuredClone(room.autoPlayers||{}),
  movementSeq:room.members.find(m=>m.code===code)?.movement?.seq||0,
  savePending:!!member.pendingSaveDigest,
  battle:partyBattleSnapshot(run),
  ...(includeSolo&&run?.localCombatVersion===1&&run.status==='active'?{soloStart:soloStart(room,run,member)}:{})
 };
}
