import '../../tools/town-walk-demo/beast-habitats.js';
import '../../tools/town-walk-demo/living-species.js';
import '../../tools/labyrinth-demo/progression.js';
import '../../tools/labyrinth-demo/floors.js';
import '../../tools/town-walk-demo/game-clock.js';
import '../../tools/labyrinth-demo/encounter-rules.js';
// These are normal dungeon values. Party scaling is applied once by the service.
export function partyEnemyAdapter({engine,random=Math.random,now=Date.now}){
 function prepare(room,enemy){
  const floor=globalThis.MineFloors.get(room.floor),all=engine.catalog();
  const catalog=enemy.kind==='shadow'?{...all,species:Object.fromEntries(Object.entries(all.species).filter(([id,s])=>globalThis.LivingReadySpecies.has(id)&&globalThis.BeastHabitats.allowed(id,s,{habitat:'land'})))}:all;
  const plan=enemy.encounterPlan||(enemy.encounterPlan=globalThis.DungeonEncounterRules.plan(null,enemy.kind,catalog,floor,random,now())),first=plan.units[0];
  if(first.type==='human'){first.gender||=random()<.5?'female':'male';enemy.appearance={cls:first.cls,gender:first.gender,lv:first.lv};}
  else enemy.appearance={sp:first.sp,lv:first.lv,form:all.species[first.sp].ev?.filter(e=>first.lv>=e[0]).length||0};
  return plan;
 }
 return {
  prepareEnemyAppearances(room){if(!room.dungeon?.enemies||room.floor<1||room.floor>7)return;for(const enemy of Object.values(room.dungeon.enemies)){if(enemy.kind==='shadow'&&!enemy.encounterPlan||enemy.kind==='bandit'&&enemy.state==='roaming'&&(!enemy.encounterPlan||!enemy.appearance))prepare(room,enemy);}},
  soloEnemies(room,enemy){
   const floor=globalThis.MineFloors.get(room.floor);
   const plan=prepare(room,enemy);
   return plan.units.map((spec,i)=>{
    if(spec.type==='human'){const unit=engine.human(spec.cls,spec.lv,'e'+i);if(spec.gender)unit.gender=spec.gender;return unit;}
    const unit=engine.beast(spec.sp,spec.lv,'e'+i);
    if(enemy.kind==='shadow'){
     for(const k of ['patk','matk'])unit.st[k]=Math.round(unit.st[k]*1.25);
     for(const k of ['hp','pdef','mdef'])unit.st[k]=Math.round(unit.st[k]*1.5);
     unit.hp=unit.st.hp;unit.dungeonShadow=true;
    }
    if(spec.type==='pet'){unit.kind='npcpet';unit.name+='ของโจร';}
    return spec.nightAura?globalThis.SoulBeastClock.applyNightAura(unit):unit;
   });
  },
  bossTeam(number){
   if(!Number.isInteger(number)||number<1||number>7)throw Error('bad_floor');
   const f=globalThis.MineFloors.get(number);
   const boss=engine.beast(f.boss,f.bossLevel,'boss',f.bossForm);
   for(const k of ['patk','matk'])boss.st[k]=Math.round(boss.st[k]*1.8);
   for(const k of ['hp','pdef','mdef'])boss.st[k]=Math.round(boss.st[k]*2.2);
   boss.st.spd=Math.round(boss.st.spd*1.25);boss.hp=boss.st.hp;boss.mp=boss.st.mp;
   Object.assign(boss,{name:globalThis.SoulbeastBeastNames?.display(f.boss,f.bossName,f.bossForm||0)??f.bossName,boss:true,dungeonBoss:true,bossAura:true,bossAuraVersion:'dungeon-v1'});
   return [boss,...Array.from({length:3},(_,i)=>Object.assign(engine.beast(f.helper,f.helperLevel,'helper'+i,f.helperForm),{
    name:globalThis.SoulbeastBeastNames?.display(f.helper,f.helperName,f.helperForm||0)??f.helperName,bossHelper:true,dungeonMinion:true
   }))];
  }
 };
}
