(function(g){'use strict';
const I=typeof module==='undefined'?g.IslandRules:require('./island-rules.js');
const pursuit=typeof module==='undefined'?g.WorldPursuit:require('../hemant-walk-demo/pursuit.js');
const {SHADOW_AGGRO:aggroDistance}=typeof module==='undefined'?g.hemantEncounters:require('../hemant-walk-demo/encounters.js');
const contactDistance=54,leash=480,chaseSpeed=242;
const walkFrameDistance=70/9,runFrameDistance=chaseSpeed/13;
function create(map,seed){
 const random=I.seeded(seed);
 const walkable=(x,y)=>map.walkable(x,y)&&!map.isSafe({x,y});
 const nav={distance:I.distance,walkable};
 function clear(from,to){
  const steps=Math.max(1,Math.ceil(I.distance(from,to)/14));
  for(let i=1;i<=steps;i++){
   if(!walkable(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps))return false;
  }
  return true;
 }
 const actors=map.actors.map(a=>({
  ...a,home:{x:a.x,y:a.y},speed:49+random()*25,phase:random()*8,facing:1,dir:0,
  mode:'patrol',moving:false,goal:null,wait:random()*.8,
 }));
 function patrolGoal(a){
  for(let i=0;i<12;i++){
   const angle=random()*2*Math.PI,radius=45+random()*125;
   const target={x:a.home.x+Math.cos(angle)*radius,y:a.home.y+Math.sin(angle)*radius/I.F};
   if(I.distance(a,target)>38&&clear(a.home,target)&&clear(a,target))return target;
  }
  return null;
 }
 function move(a,target,dt,speed){
  if(!target)return;
  const from={x:a.x,y:a.y};
  if(!pursuit.step(nav,a,target,dt,speed))return;
  const frameDistance=speed===chaseSpeed?runFrameDistance:walkFrameDistance;
  a.phase+=I.distance(from,a)/frameDistance;
 }
 function update(dt,player,available){
  const safe=map.isSafe(player);
  let contact=null;
  for(const a of actors){
   a.moving=false;
   const ready=available(a);
   const near=I.distance(a,player);
   if(a.mode!=='return'){
    // Keep a clear route back to the patrol area and never cut across the spiral.
    const canChase=ready&&!safe&&near<=(a.mode==='chase'?leash:aggroDistance)
     &&I.distance(a.home,player)<=leash&&clear(a,player)&&clear(a.home,player);
    if(canChase)a.mode='chase';
    else if(a.mode==='chase'){a.mode='return';a.goal=null;}
   }
   if(a.mode==='chase'){
    move(a,player,dt,chaseSpeed);
    if(I.distance(a,player)<=contactDistance)contact??=a;
   }else if(a.mode==='return'){
    move(a,a.home,dt,chaseSpeed);
    if(I.distance(a,a.home)<1){a.mode='patrol';a.wait=.65;}
   }else if(ready&&a.kind!=='boss'){
    a.wait=Math.max(0,a.wait-dt);
    if(a.wait)continue;
    a.goal??=patrolGoal(a);
    move(a,a.goal,dt,a.speed);
    if(!a.moving||I.distance(a,a.goal)<1){a.goal=null;a.wait=.45+random()*1.2;}
   }
  }
  return contact;
 }
 return {actors,update};
}
const api={create};g.IslandPatrols=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
