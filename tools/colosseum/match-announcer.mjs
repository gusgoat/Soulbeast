const streakClips=['killing-spree','rampage','dominating','unstoppable','godlike','legendary','divine-annihilator'];

export function matchAnnouncer(){
 const events=[],stats=new Map();
 let id=0,firstBlood=false,remaining=0;
 function add(clip,at,{player,side,exclude}={}){
  events.push({id:++id,clip,at,player,side,exclude});
  if(events.length>32)events.shift();
 }
 function row(player){
  if(!stats.has(player.id))stats.set(player.id,{streak:0,beasts:0,multi:0,lastKill:-Infinity});
  return stats.get(player.id);
 }
 function start(playerCount){remaining=playerCount;}
 function fall(victim,killer,now,solo){
  const fallen=row(victim);
  if(killer){
   const active=row(killer),revenge=active.killedBy===victim.id;
   active.multi=now-active.lastKill<=20_000?active.multi+1:1;
   active.lastKill=now;
   active.streak++;
   if(revenge)delete active.killedBy;
   if(!firstBlood){firstBlood=true;add('first-blood',now);}
   else{
    const multi=active.multi===3?'triple-kill':active.multi===2?'double-kill':'';
    const clip=fallen.streak>=3?'shutdown':multi||streakClips[active.streak-3]||(!solo&&revenge?'revenge':'enemy-slain');
    add(clip,now,{player:killer.id});
   }
  }
  Object.assign(fallen,{streak:0,beasts:0,multi:0,lastKill:-Infinity,killedBy:killer?.id});
  if(solo){
   add('eliminated',now,{player:victim.id});
   if(--remaining===5)add('five-remain',now,{exclude:victim.id});
  }
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
 return {add,start,fall,beast,capture,forPlayer};
}
