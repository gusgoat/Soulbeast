const streakClips=['killing-spree','rampage','dominating','unstoppable','godlike','legendary','divine-annihilator'];
export const killCallouts={
 'double-kill':'Double Kill!','triple-kill':'Triple Kill!','shutdown':'Shutdown!','revenge':'Revenge!',
 'killing-spree':'Killing Spree!','rampage':'Rampage!','dominating':'Dominating','unstoppable':'Unstoppable',
 'godlike':'Godlike!','legendary':'Legendary','divine-annihilator':'Divine Annihilator!!!',
};

export function matchAnnouncer(){
 const events=[],stats=new Map();
 let id=0,firstBlood=false,remaining=0;
 function add(clip,at,{player,side,exclude,name}={}){
  events.push({id:++id,clip,at,player,side,exclude,name});
  if(events.length>32)events.shift();
 }
 function row(player){
  if(!stats.has(player.id))stats.set(player.id,{streak:0,beasts:0,multi:0,lastKill:-Infinity});
  return stats.get(player.id);
 }
 function start(playerCount){remaining=playerCount;}
 function bonuses(victim,killer,solo){
  const fallen=row(victim);
  const shutdown=killer&&fallen.streak>=3?Math.min(7,fallen.streak-2)*5:0;
  return {shutdown,revenge:!solo&&Boolean(killer)&&row(killer).killedBy===victim.id};
 }
 function resetStreak(player){
  Object.assign(row(player),{streak:0,beasts:0,multi:0,lastKill:-Infinity});
 }
 function fall(victim,killer,now,solo,{shutdown,revenge}=bonuses(victim,killer,solo)){
  const fallen=row(victim);
  if(killer){
   const active=row(killer);
   active.multi=now-active.lastKill<=20_000?active.multi+1:1;
   active.lastKill=now;
   active.streak++;
   if(revenge&&killer.phase!=='dead')delete active.killedBy;
   const multi=active.multi===3?'triple-kill':active.multi===2?'double-kill':'';
   const title=streakClips[active.streak-3];
   const first=!firstBlood;
   if(first){firstBlood=true;add('first-blood',now);}
   else if(solo){
    const clip=shutdown?'shutdown':multi||title||'enemy-slain';
    add(clip,now,{player:killer.id});
   }
   if(!solo){
    const callouts=[multi,title,shutdown?'shutdown':'',revenge?'revenge':''].filter(Boolean);
    for(const clip of callouts)add(clip,now,{name:killer.name});
    if(!callouts.length&&!first)add('enemy-slain',now,{player:killer.id});
   }
  }
  resetStreak(victim);
  fallen.killedBy=killer?.id;
  if(solo){
   add('eliminated',now,{player:victim.id});
   if(--remaining===5)add('five-remain',now,{exclude:victim.id});
  }
 }
 function title(player){
  return killCallouts[streakClips[Math.min(9,row(player).streak)-3]];
 }
 function beast(player,now){
  const active=row(player);
  if(++active.beasts!==5)return false;
  add('beast-slayer',now);
  return true;
 }
 function capture(base,attacker,now){
  if(base.main)return;
  add('enemy-tower',now,{side:attacker.side});
  add('your-tower',now,{side:base.side});
 }
 function forPlayer(player,now){
  return events.filter(event=>now-event.at<=6500&&event.exclude!==player.id&&
   (event.player===undefined||event.player===player.id)&&(event.side===undefined||event.side===player.side));
 }
 return {add,start,fall,title,bonuses,resetStreak,beast,capture,forPlayer};
}
