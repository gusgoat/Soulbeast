// Shared contract. Combat results must be settled by the server, never a broadcast.
export function partyRules(size) {
 if (!Number.isInteger(size) || size < 2 || size > 4) throw Error('party_size');
 return Object.freeze({size, shadows:size*5, bandits:size, bossMultiplier:1+Math.max(0,size-2)*.3});
}
export function createFloor(size,floor=1) {
 if (!Number.isInteger(floor)||floor<1||floor>7) throw Error('bad_floor');
 return {floor,rules:partyRules(size),kills:{shadow:0,bandit:0},enemies:Object.fromEntries(
  ['shadow','bandit'].flatMap(kind=>Array.from({length:kind==='shadow'?50:5},(_,i)=>
   [kind+':'+i,{kind,state:'roaming',battle:null}]))),doorOpen:false,boss:'guarding',bossBattle:null};
}
export function doorReady(floor) {
 return floor.kills.shadow>=floor.rules.shadows&&floor.kills.bandit>=floor.rules.bandits;
}
export function openBossDoor(floor) {
 if(!doorReady(floor))throw Error('floor_quota_incomplete');
 floor.doorOpen=true;
}
// Called under the room transaction lock, with server-generated battle identifiers.
export function claimEnemy(floor,enemyId,actor,battleId) {
 if(floor.boss==='fighting')throw Error('boss_battle_active');
 const enemy=floor.enemies[enemyId];
 if(!enemy||enemy.state!=='roaming')throw Error('enemy_unavailable');
 if(Object.values(floor.enemies).some(e=>e.state==='fighting'&&e.actor===actor))throw Error('already_fighting');
 Object.assign(enemy,{state:'fighting',actor,battle:battleId});
 return enemy;
}
export function settleEnemy(floor,enemyId,battleId,result) {
 if(!['win','lose','abandoned'].includes(result))throw Error('bad_result');
 const enemy=floor.enemies[enemyId];
 if(!enemy||enemy.battle!==battleId||enemy.state!=='fighting')return false;
 enemy.state=result==='win'?'defeated':'roaming';
 if(result==='win')floor.kills[enemy.kind]++;
 enemy.actor=null;enemy.battle=null;
 return true;
}
export function beginBoss(floor,battleId) {
 if(!floor.doorOpen||!doorReady(floor))throw Error('boss_door_closed');
 if(floor.boss!=='guarding')throw Error('boss_unavailable');
 // Boss contact interrupts all solo battles. Their old settlement tokens become invalid.
 // No kill/reward is granted for an interrupted fight.
 for(const enemy of Object.values(floor.enemies))if(enemy.state==='fighting') {
  enemy.state='roaming';enemy.actor=null;enemy.battle=null;
 }
 floor.boss='fighting';floor.bossBattle=battleId;
}
export function settleBoss(floor,battleId,result) {
 if(!['win','lose','abandoned'].includes(result))throw Error('bad_result');
 if(floor.boss!=='fighting'||floor.bossBattle!==battleId)return false;
 floor.boss=result==='win'?'defeated':'guarding';floor.bossBattle=null;return true;
}
export function nextFloor(floor) {
 if(floor.boss!=='defeated')throw Error('boss_not_defeated');
 return floor.floor===7?null:createFloor(floor.rules.size,floor.floor+1);
}
export function scaleBossTeam(units,size) {
 const multiplier=partyRules(size).bossMultiplier;
 return units.map(unit=>{
  const copy=structuredClone(unit);
  if(copy.dungeonPartyScaled)throw Error('already_scaled');
  // Apply after the normal dungeon aura, equally to boss and all helpers.
  for(const key of ['hp','mp','patk','matk','pdef','mdef','spd'])
   if(Number.isFinite(copy.st?.[key]))copy.st[key]=Math.round(copy.st[key]*multiplier);
  copy.hp=copy.st.hp;copy.mp=copy.st.mp;copy.dungeonPartyScaled=true;
  return copy;
 });
}
