// Render-local actors keep moving while account requests are in flight.
export function localPartyWorld(){
 const enemies=new Map(),effects=new Map();
 let boss=null,personal=null,grantId=null;
 function setPersonal(value){personal=value;}
 function reset(){enemies.clear();effects.clear();boss=null;grantId=null;}
 function receive(world,code,now,serverTime){
  const grant=personal?.grant&&personal.grant.floor===world.floor?personal.grant:null;
  if(grant&&grantId!==grant.id){enemies.clear();effects.clear();grantId=grant.id;}
  const roster=grant?grant.enemies:world.enemies||{};
  for(const [id,raw] of Object.entries(roster)){
   if(grant&&(personal.spent[id]||personal.retired[id])){enemies.delete(id);continue;}
   const e=grant?{...raw,state:'roaming'}:raw;
   if(e.state!=='roaming'){enemies.delete(id);continue;}if(enemies.has(id)&&e.appearance)enemies.get(id).appearance=e.appearance;
   if(!enemies.has(id)&&e.position)enemies.set(id,{...e,id,position:{...e.position},home:{...(e.home||e.position)},index:0});
  }
  if(grant)return;
  for(const t of world.traps||[]){
   const eligible=t.eligible?.includes(code)&&!t.resolved?.includes(code);
   const effect=effects.get(t.id);
   if(!eligible){
    if(effect?.done)effect.resolved=true;
    else effects.set(t.id,{...t,done:true,resolved:true,remaining:0,burst:0});
    continue;
   }
   if(!effect?.armed){
    const delay=Math.max(0,t.explodeAt-serverTime);
    effects.set(t.id,{...effect,...t,deadline:now+delay,remaining:delay/1000,burst:0,armed:true,resolved:false});
   }
  }
 }
 function step(actor,target,speed,dt,nav){
  actor.moving=false;
  const distance=nav.distance(actor.position,target);
  if(distance<1)return;
  const ratio=Math.min(1,speed*dt/distance);
  const p={x:actor.position.x+(target.x-actor.position.x)*ratio,y:actor.position.y+(target.y-actor.position.y)*ratio};
  if(nav.clear(actor.position,p)){
   const dx=p.x-actor.position.x;
   if(Math.abs(dx)>.01)actor.facing=dx<0?-1:1;
   actor.moving=true;actor.phase=(actor.phase||0)+dt*speed/70*9;
   actor.position=p;
  }
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
  boss??={position:{...(world.bossPosition||spawn)},dir:world.bossPosition?((world.bossDir||0)+6)%8:0,moving:false};
  boss.moving=false;
  if(world.doorOpen&&world.boss==='guarding'){
   const target=nav.distance(position,spawn)<850?position:spawn;
   const previous=boss.position;
   step(boss,target,90,dt,nav);
   if(boss.position.x!==previous.x||boss.position.y!==previous.y){
    const dx=boss.position.x-previous.x,dy=boss.position.y-previous.y;
    const flatten=nav.distance({x:0,y:0},{x:0,y:1});
    // Atlas starts facing down, then turns toward screen left.
    boss.dir=(Math.round(-Math.atan2(dx,dy*flatten)/(Math.PI/4))+8)%8;
   }else boss.moving=false;
  }
  for(const effect of effects.values()){
   if(effect.done){effect.burst=Math.max(0,effect.burst-dt);continue;}
   effect.remaining=Math.max(effect.armed?0:.05,(effect.deadline-now)/1000);
   if(effect.armed&&effect.remaining===0){effect.done=true;effect.burst=.8;effect.hitPosition={...position};}
  }
 }
 function trigger(placements,position,nav,now){
  for(const trap of placements){
   if(!effects.has(trap.id)&&nav.distance(position,trap)<=32)
    effects.set(trap.id,{...trap,deadline:now+2000,remaining:2,burst:0,armPosition:{...position},armed:!!personal?.grant});
  }
 }
 function request(){
  for(const effect of effects.values()){
   if(effect.resolved)continue;
   if(!effect.armed)return {action:'trapArm',trap:effect.id,position:effect.armPosition};
   if(effect.done)return personal?.grant?{action:'personalTrap',effect}:{action:'trapResolve',trap:effect.id,position:effect.hitPosition};
  }
 }
 function reconcile(world,code,position,nav,viewport){
  const grant=personal?.grant;if(!grant||grant.floor!==world.floor)return;
  for(const id of Object.keys(personal.spent))enemies.delete(id);
  for(const kind of ['shadow','bandit']){
   const wanted=Math.max(0,(world.kills?.[kind]||0)-(world.contributions?.[code]?.[kind]||0));
   const retired=Object.keys(personal.retired).filter(id=>grant.enemies[id]?.kind===kind).length;
   let count=wanted-retired;if(count<=0)continue;
   const safe=[...enemies.values()].filter(e=>e.kind===kind&&e.id!==personal.active?.run.enemyId&&nav.distance(position,e.position)>1400&&
    (!viewport||Math.abs((e.position.x-viewport.x)*.9)>viewport.width/2+240||Math.abs((e.position.y-viewport.y)*.9*viewport.flatten)>viewport.height/2+240))
    .sort((a,b)=>nav.distance(position,b.position)-nav.distance(position,a.position));
   for(const e of safe){if(count--<=0)break;personal.retire(e.id);enemies.delete(e.id);}
  }
 }
 return {setPersonal,reconcile,reset,receive,update,trigger,request,enemies,effects,get boss(){return boss;}};
}
