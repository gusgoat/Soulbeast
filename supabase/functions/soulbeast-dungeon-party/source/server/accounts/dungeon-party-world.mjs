// Server-only simulation. navigation supplies the same floor collision/path data
// as the renderer; clients cannot choose enemy positions or claim a hit remotely.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function move(enemy,target,amount,navigation){
 const path=navigation.pathBetween(enemy.position,target);
 const next=path.find(p=>distance(p,enemy.position)>1);
 if(!next)return false;
 const length=(navigation.distance||distance)(enemy.position,next),fraction=Math.min(1,amount/length);
 const point={x:enemy.position.x+(next.x-enemy.position.x)*fraction,y:enemy.position.y+(next.y-enemy.position.y)*fraction};
 if(!navigation.clear(enemy.position,point))return false;
 enemy.dir=(Math.round(Math.atan2(point.y-enemy.position.y,point.x-enemy.position.x)/(Math.PI/4))+8)%8;
 enemy.position=point;return true;
}

// Boss patrol is authoritative too: all peers receive the same position/heading.
export function advancePartyBoss(floor,members,now,navigation,{spawn,speed=90,leash=900}){
 if(!floor.bossPosition){floor.bossPosition={...spawn};floor.bossHome={...spawn};floor.bossTick=now;}
 const dt=Math.min(.25,Math.max(0,(now-floor.bossTick)/1000));floor.bossTick=now;floor.bossMoving=false;
 if(!dt||!floor.doorOpen||floor.boss!=='guarding')return;
 const metric=navigation.distance||distance;
 const eligible=members.filter(m=>m.hp>0&&m.exploring===true&&m.position);
 let target=eligible.find(m=>m.code===floor.bossTarget);
 if(target&&(metric(floor.bossPosition,target.position)>leash||metric(floor.bossPosition,floor.bossHome)>leash)){
  floor.bossReturning=true;floor.bossTarget=null;target=null;
 }
 if(!target&&!floor.bossReturning){
  target=eligible.filter(m=>metric(floor.bossHome,m.position)<=leash)
   .sort((a,b)=>metric(floor.bossPosition,a.position)-metric(floor.bossPosition,b.position)||a.code.localeCompare(b.code))[0];
  floor.bossTarget=target?.code||null;
 }
 if(!target&&!floor.bossReturning&&metric(floor.bossPosition,floor.bossHome)>5)floor.bossReturning=true;
 const destination=floor.bossReturning?floor.bossHome:target?.position;if(!destination)return;
 const body={position:floor.bossPosition,dir:floor.bossDir||0};
 floor.bossMoving=move(body,destination,speed*dt,navigation);
 floor.bossPosition=body.position;floor.bossDir=body.dir;
 if(floor.bossReturning&&metric(body.position,floor.bossHome)<5)floor.bossReturning=false;
}
export function initializePartyWorld(floor,placements){
 for(const [id,enemy] of Object.entries(floor.enemies)){
  const p=placements[id];
  if(!p||![p.x,p.y].every(Number.isFinite))throw Error('missing_enemy_spawn');
  enemy.position={x:p.x,y:p.y};enemy.home={...enemy.position};
  enemy.patrol=(p.patrol||[p]).map(v=>({x:v.x,y:v.y}));enemy.patrolIndex=0;
  if(!enemy.patrol.length||enemy.patrol.some(v=>![v.x,v.y].every(Number.isFinite)))throw Error('invalid_enemy_patrol');
  enemy.mode='patrol';enemy.moving=false;
 }
 floor.worldTick=null;
}
export function advancePartyWorld(floor,members,now,navigation,{walkSpeed=65,chaseSpeed=160,aggroRadius=200,leash=900}={}){
 const previous=floor.worldTick;floor.worldTick=now;
 const dt=previous===null||previous===undefined?0:Math.min(.25,Math.max(0,(now-previous)/1000));
 if(!dt)return;
 const walkers=members.filter(m=>m.hp>0&&m.exploring===true&&m.position);
 for(const enemy of Object.values(floor.enemies)){
  enemy.moving=false;
  if(enemy.state!=='roaming'||!enemy.position)continue;
  let target=walkers.find(m=>m.code===enemy.target);
  if(enemy.mode==='chase'&&(!target||distance(enemy.position,target.position)>leash||distance(enemy.position,enemy.home)>leash)){
   enemy.mode='return';enemy.target=null;target=null;
  }
  if(enemy.mode==='return'){
   enemy.moving=move(enemy,enemy.home,chaseSpeed*dt,navigation);
   if(distance(enemy.position,enemy.home)<5)enemy.mode='patrol';
   continue;
  }
  if(enemy.mode!=='chase'){
   target=walkers.filter(m=>distance(enemy.position,m.position)<=aggroRadius&&navigation.clear(enemy.position,m.position))
    .sort((a,b)=>distance(enemy.position,a.position)-distance(enemy.position,b.position)||a.code.localeCompare(b.code))[0];
   if(target){enemy.mode='chase';enemy.target=target.code;}
  }
  if(enemy.mode==='chase'&&target)enemy.moving=move(enemy,target.position,chaseSpeed*dt,navigation);
  else{
   const destination=enemy.patrol[enemy.patrolIndex];
   if(distance(enemy.position,destination)<5)enemy.patrolIndex=(enemy.patrolIndex+1)%enemy.patrol.length;
   enemy.moving=move(enemy,enemy.patrol[enemy.patrolIndex],walkSpeed*dt,navigation);
  }
 }
}
