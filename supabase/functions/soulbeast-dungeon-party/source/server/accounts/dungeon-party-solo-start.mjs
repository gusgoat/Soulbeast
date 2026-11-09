// This payload is private to the owner of the solo encounter. Never broadcast it.
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value?.[k]!==undefined).map(k=>[k,value[k]]));
export function soloStart(room,run,member){
 const p=member.save.P;
 return {run:pick(run,['id','kind','enemyId','participants','status','wallets','nextTurnAt','startedAt','loading','battle']),
  code:member.code,kind:room.dungeon.enemies[run.enemyId].kind,auto:run.initialAuto,
  member:pick(member,['hp','mp','maxHp','maxMp','ailments','exploring']),
  player:{...pick(p,['cls','lv','uid','gold','hp','mp','party','carried','items','caught','ailments']),
   pets:(p.pets||[]).map(pet=>pick(pet,['uid','sp','lv','form','pts','nick','sig','signature','exp','free','hp','mp','ailments']))}};
}
export function applySoloResult(member,simulated){
 Object.assign(member,pick(simulated,['hp','mp','maxHp','maxMp','ailments','exploring']));
 const raw=member.save.P, next=simulated.save.P;
 Object.assign(raw,pick(next,['hp','mp','gold','ailments','items','uid','party','carried','caught']));
 const before=new Map(raw.pets.map(pet=>[pet.uid,pet]));
 raw.pets=next.pets.map(pet=>({...before.get(pet.uid),...pet}));
}
