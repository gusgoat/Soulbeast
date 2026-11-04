// Render-local actors keep moving while account requests are in flight.
export function localPartyWorld(){
 const enemies=new Map(),effects=new Map();
 let boss=null;
 function reset(){enemies.clear();effects.clear();boss=null;}
 function receive(world,code,now){
  for(const [id,e] of Object.entries(world.enemies||{})){
   if(e.state!=='roaming'){enemies.delete(id);continue;}
   if(!enemies.has(id)&&e.position)enemies.set(id,{...e,position:{...e.position},home:{...(e.home||e.position)},index:0});
  }
  for(const t of world.traps||[]){
   let effect=effects.get(t.id);
   if(!effect){
    if(t.eligible?.includes(code)&&!t.resolved?.includes(code)){
     effect={...t,deadline:now+2000,remaining:2,burst:0,armed:true};effects.set(t.id,effect);
    }else effects.set(t.id,{...t,done:true,resolved:true,remaining:0,burst:0});
   }else if(t.state!=='hidden')effect.armed=true;
   if(effect&&(!t.eligible?.includes(code)||t.resolved?.includes(code)))effect.resolved=true;
  }
 }
 function step(actor,target,speed,dt,nav){
  const distance=nav.distance(actor.position,target);
  if(distance<1)return;
  const ratio=Math.min(1,speed*dt/distance);
  const p={x:actor.position.x+(target.x-actor.position.x)*ratio,y:actor.position.y+(target.y-actor.position.y)*ratio};
  if(nav.clear(actor.position,p))actor.position=p;
 }
 function update(dt,position,nav,world,spawn,now){
  for(const actor of enemies.values()){
   if(nav.distance(actor.position,position)>1400)continue;
   const chase=nav.distance(actor.position,position)<220&&nav.distance(actor.home,position)<850&&nav.clear(actor.position,position);
   const patrol=actor.patrol?.length?actor.patrol:[actor.home];
   let target=chase?position:patrol[actor.index%patrol.length];
   if(!chase&&nav.distance(actor.position,target)<5){actor.index++;target=patrol[actor.index%patrol.length];}
   step(actor,target,chase?160:65,dt,nav);
  }
  boss??={position:{...(world.bossPosition||spawn)}};
  if(world.doorOpen&&world.boss==='guarding'){
   const target=nav.distance(position,spawn)<850?position:spawn;
   step(boss,target,90,dt,nav);
  }
  for(const effect of effects.values()){
   if(effect.done){effect.burst=Math.max(0,effect.burst-dt);continue;}
   effect.remaining=Math.max(0,(effect.deadline-now)/1000);
   if(effect.remaining===0){effect.done=true;effect.burst=.8;effect.hitPosition={...position};}
  }
 }
 function trigger(placements,position,nav,now){
  for(const trap of placements){
   if(!effects.has(trap.id)&&nav.distance(position,trap)<=32)
    effects.set(trap.id,{...trap,deadline:now+2000,remaining:2,burst:0,armPosition:{...position}});
  }
 }
 function request(){
  for(const effect of effects.values()){
   if(effect.resolved)continue;
   if(!effect.armed)return {action:'trapArm',trap:effect.id,position:effect.armPosition};
   if(effect.done)return {action:'trapResolve',trap:effect.id,position:effect.hitPosition};
  }
 }
 return {reset,receive,update,trigger,request,enemies,effects,get boss(){return boss?.position;}};
}
