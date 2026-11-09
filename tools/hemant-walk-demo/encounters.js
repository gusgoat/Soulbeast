(function(scope){'use strict';
const SHADOW_BODY=100,AGGRO=SHADOW_BODY*4,SHADOW_AGGRO=AGGRO*.75,CONTACT=36,CHASE_SPEED_SCALE=.68425;
const pursuit=typeof module!=='undefined'?require('./pursuit.js'):scope.WorldPursuit;
function create(nav,groups,options={}){
 let grace=3,locked=false;
 const chaseDurationMs=options.chaseDurationMs??Infinity;
 const now=options.now??(()=>performance.now());
 const entries=groups.flatMap(group=>group.actors.map(actor=>({actor,kind:group.kind})));
 function update(dt,player,effects={}){
  if(locked)return null;
  grace=Math.max(0,grace-dt);
  const time=now();
  for(const entry of entries){
   const a=entry.actor,shadow=entry.kind==='shadow';
   const aggro=shadow?SHADOW_AGGRO:AGGRO,speed=(entry.kind==='bandit'?330:320)*CHASE_SPEED_SCALE;
   if(entry.waitForClear&&nav.distance(a,player)>aggro)entry.waitForClear=false;
   if(a.returning){
    if(a.cooldown>0)a.cooldown=Math.max(0,a.cooldown-dt);
    if(pursuit.returnHome(nav,a,dt,speed))a.phase+=dt*18*CHASE_SPEED_SCALE;
    continue;
   }
   if(a.cooldown>0){a.cooldown=Math.max(0,a.cooldown-dt);continue;}
   const distance=nav.distance(a,player);
   if(shadow&&effects.repellent){
    if(a.chasing)pursuit.beginReturn(a);
    if(grace===0&&distance<=CONTACT){locked=true;return entry;}
    continue;
   }
   if(!a.chasing&&!entry.waitForClear&&grace===0&&distance<=aggro&&(!options.lineOfSight||options.lineOfSight(a,player))){
    a.chasing=true;a.path=[];a.repath=0;a.wait=0;
    entry.chaseUntil=time+chaseDurationMs;
   }
   if(!a.chasing)continue;
   if(distance>pursuit.limit(options.leashDistance)){
    pursuit.beginReturn(a);
    if(pursuit.returnHome(nav,a,dt,speed))a.phase+=dt*18*CHASE_SPEED_SCALE;
    continue;
   }
   if(time>=entry.chaseUntil){
    // Require a fresh approach instead of restarting the chase on the next frame.
    entry.waitForClear=true;
    pursuit.beginReturn(a);
    continue;
   }
   if(distance<=CONTACT){locked=true;return entry;}
   a.repath-=dt;
   if(a.repath<=0){a.path=nav.pathBetween(a,player);a.repath=.6;}
   while(a.path?.length&&nav.distance(a,a.path[0])<6)a.path.shift();
   a.moving=false;
   const target=a.path?.[0];
   if(target){
    const dx=target.x-a.x,dy=(target.y-a.y)*.64,len=Math.hypot(dx,dy);
    if(!len)continue;
    const step=Math.min(speed*dt,len);
    const x=a.x+dx/len*step,y=a.y+dy/len*step/.64;
    if(nav.walkable(x,a.y))a.x=x;
    if(nav.walkable(a.x,y))a.y=y;
    a.moving=true;a.phase+=dt*18*CHASE_SPEED_SCALE;
    if(Math.abs(dx)>2)a.facing=dx<0?-1:1;
    if(nav.distance(a,player)<=CONTACT){locked=true;return entry;}
   }
  }
  return null;
 }
 function resolve(entry,result){for(const e of entries){e.actor.chasing=false;e.actor.goal=null;e.actor.path=null;e.actor.moving=false;e.actor.wait=2}const a=entry.actor;if(result==='win'){Object.assign(a,a.home);a.cooldown=60}else if(result==='flee'){Object.assign(a,a.home);a.cooldown=15}grace=4;locked=false}
 return {update,resolve,entries};
}
const api={create,AGGRO,SHADOW_AGGRO,CONTACT,SHADOW_BODY};scope.hemantEncounters=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
