import '../../tools/labyrinth-demo/progression.js';
import '../../tools/labyrinth-demo/floors.js';
import '../../tools/town-walk-demo/game-clock.js';
import '../../tools/labyrinth-demo/encounter-rules.js';
// These are normal dungeon values. Party scaling is applied once by the service.
export function partyEnemyAdapter({engine,random=Math.random,now=Date.now}){
 return {
  soloEnemies(room,enemy){
   const floor=globalThis.MineFloors.get(room.floor);
   const plan=globalThis.DungeonEncounterRules.plan(null,enemy.kind,engine.catalog(),floor,random,now());
   return plan.units.map((spec,i)=>{
    if(spec.type==='human')return engine.human(spec.cls,spec.lv,'e'+i);
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
