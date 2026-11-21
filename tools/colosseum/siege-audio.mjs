const impactClips={
 archer:'ranged-impact',gunner:'ranged-impact',magic:'magic-impact',
 hammer:'heavy-melee-impact',melee:'heavy-melee-impact',
};
const cannonClasses=new Set(['artillery','cannoneer','demolisher']);
function infantryWeapon(effect,attacker){
 if(effect.kind==='infantry-slash')return 'melee';
 if(effect.kind==='gunner')return cannonClasses.has(attacker?.cls)?'cannon':'gun';
 if(effect.kind==='archer')return 'bow';
 if(effect.kind==='hammer')return 'mace';
 const career=attacker?.baseCls||attacker?.cls;
 if(effect.kind==='magic')return career==='summoner'?'whip':'spell';
 return career==='gladiator'?'axe':career==='thief'?'dagger':'melee';
}
const maxEffectAge=280;

export function siegeAudio(play,sealerGender){
 const seen=new Map(),baseStages=new Map(),lastWeaponAt=new Map(),soundedTraps=new Set();
 function reset(){soundedTraps.clear();seen.clear();baseStages.clear();lastWeaponAt.clear();}
 function sync(state,viewer,trapViewer=viewer){
  for(const [id,until] of seen)if(until<=state.now)seen.delete(id);
  for(const base of state.bases??[]){
   const damage=baseDamageStage(base),previous=baseStages.get(base.id);
   baseStages.set(base.id,{side:base.side,damage});
   if(viewer&&base.hp>0&&previous?.side===base.side&&damage>previous.damage&&inSight(viewer,base))play('damage-start');
  }
  for(const trap of state.traps??[]){
   if(!trap.burstUntil||soundedTraps.has(trap.id))continue;
   soundedTraps.add(trap.id);
   if(trapViewer&&trap.burstUntil>state.now&&trap.burstUntil-state.now>=400)play(trap.type==='blast'?'trap-blast':'trap-other');
  }
  for(const effect of state.baseEffects??[]){
   if(seen.has(effect.id))continue;
   seen.set(effect.id,effect.until);
   if(effect.kind==='tower-fall'){
    if(state.now-effect.at>600||(!viewer&&effect.playerId!==state.me))continue;
    const victim=state.players.find(player=>player.id===effect.playerId);
    if(victim)play(`fall-${sealerGender(victim)}-${1+Math.floor(Math.random()*4)}`);
    continue;
   }
   const impact=impactClips[effect.kind];
   if(!viewer||state.now-effect.at>maxEffectAge)continue;
   if(effect.kind==='respawn'){play('respawn');continue;}
   if(effect.kind==='tower'){play('tower');continue;}
   if(effect.kind==='collapse'){play('collapse');continue;}
   const attacker=state.players.find(player=>player.id===effect.playerId);
   if(effect.targetInfantry&&(impact||effect.kind==='infantry-slash')){
    const key='weapon-'+infantryWeapon(effect,attacker);
    if(state.now-(lastWeaponAt.get(key)??-Infinity)>=140){
     lastWeaponAt.set(key,state.now);play(key);
    }
    continue;
   }
   if(!impact)continue;
   const dagger=effect.kind==='melee'&&(attacker?.baseCls||attacker?.cls)==='thief';
   play(dagger?'dagger-impact':impact);
  }
 }
 return {sync,reset};
}
import {baseDamageStage} from './arena.mjs?v=base-damage-stage-1';
import {inSight} from './sight.mjs?v=colosseum-ranges';
