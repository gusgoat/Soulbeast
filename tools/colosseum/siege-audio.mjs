const impactClips={
 archer:'ranged-impact',gunner:'ranged-impact',magic:'magic-impact',
 hammer:'heavy-melee-impact',melee:'heavy-melee-impact',
};
const maxEffectAge=280;

export function siegeAudio(play,sealerGender){
 const seen=new Map(),baseStages=new Map();
 function reset(){seen.clear();baseStages.clear();}
 function sync(state,viewer){
  for(const [id,until] of seen)if(until<=state.now)seen.delete(id);
  for(const base of state.bases??[]){
   const damage=baseDamageStage(base),previous=baseStages.get(base.id);
   baseStages.set(base.id,{side:base.side,damage});
   if(viewer&&base.hp>0&&previous?.side===base.side&&damage>previous.damage&&inSight(viewer,base))play('damage-start');
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
   if(!impact)continue;
   const attacker=state.players.find(player=>player.id===effect.playerId);
   const dagger=effect.kind==='melee'&&(attacker?.baseCls||attacker?.cls)==='thief';
   play(dagger?'dagger-impact':impact);
  }
 }
 return {sync,reset};
}
import {baseDamageStage} from './arena.mjs?v=base-damage-stage-1';
import {inSight} from './sight.mjs?v=colosseum-ranges';
