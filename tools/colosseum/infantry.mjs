import {BASES, FLAT, RADIUS, TEAM_ARENA, TEAM_SPEED, cellCenter, distance, walkSpeed, canRaidBase} from './arena.mjs?v=team-minimap-1';

export const INFANTRY_WAVE_MS=30_000;
const AGGRO=300, LEASH=600, STRIKE_RANGE=75, STRIKE_MS=1000;
const START_HP=40, HP_STEP=5, HP_INTERVAL_MS=120_000;
const LANES=[[1,3],[1,4],[2,5],[2,6],[8,7]];
const teams=[0,1];
const neighbors=[[-1,0],[1,0],[0,-1],[0,1]];
const active=(p,now)=>p.connected&&p.phase==='walk'&&p.hp>0&&now>=p.safeUntil;

function cellPath(arena,from,to,allowed=()=>true){
 const start=arena.indexAt(from),goal=arena.indexAt(to);
 const point=index=>cellCenter(index%arena.cols,Math.floor(index/arena.cols));
 const previous=new Map([[start,null]]),queue=[start];
 for(let i=0;i<queue.length&&!previous.has(goal);i++){
  const key=queue[i],x=key%arena.cols,y=Math.floor(key/arena.cols);
  for(const [dx,dy] of neighbors){
   const next=(y+dy)*arena.cols+x+dx;
   if(!arena.maze[y+dy]?.[x+dx]||previous.has(next))continue;
   const step=point(next);
   if(!allowed(step)||!arena.clearPath(point(key),step,RADIUS))continue;
   previous.set(next,key);queue.push(next);
  }
 }
 if(!previous.has(goal))return null;
 const path=[];
 for(let key=goal;key!==null;key=previous.get(key))path.push(point(key));
 return path.reverse();
}

const sapphireRoutes=LANES.map(([medium,small],lane)=>{
 const sides=[[0,0],[0,medium],[0,small],[1,small],[1,medium],[1,0]];
 const bases=sides.map(([team,i])=>BASES.find(b=>b.id===`${team}-${i}`));
 const capitalApproach=new Set();
 return bases.slice(1).flatMap((base,i)=>{
  // On the upper outer lane, leave the allied medium fort through its north path.
  const allowed=lane===0&&i===1?point=>!capitalApproach.has(TEAM_ARENA.indexAt(point)):undefined;
  const path=cellPath(TEAM_ARENA,bases[i],base,allowed);
  if(!path)throw Error(`No infantry lane from ${bases[i].id} to ${base.id}`);
  if(lane===0&&i===0)for(const point of path.slice(0,-1))capitalApproach.add(TEAM_ARENA.indexAt(point));
  return path.slice(1).map(point=>({...point,baseId:base.side===1?base.id:null}));
 });
});
const routes=[sapphireRoutes,sapphireRoutes.map(path=>path.map(({x,y,baseId})=>({
 x:TEAM_ARENA.width-x,y,baseId:baseId&&`0-${baseId.slice(2)}`
})))];

export function spawnInfantry(room,wave){
 const maxHp=START_HP+Math.floor(wave*INFANTRY_WAVE_MS/HP_INTERVAL_MS)*HP_STEP;
 for(const side of teams){
  const base=room.bases.find(b=>b.main&&b.side===side);
  if(base.hp<=0)continue;
  routes[side].forEach((path,lane)=>{
   const offset=[-48,-24,0,36,62][lane]/FLAT;
   const spawn={x:base.x,y:base.y+offset};
   const join=offset?[{x:base.x,y:base.y},...path]:path;
   room.infantry.push({id:`infantry-${wave}-${side}-${lane}`,infantry:true,side,...spawn,
    hp:maxHp,maxHp,path:join,waypoint:0,dir:side?2:6,pose:'walk',frame:0,stride:0});
  });
 }
}

const nearest=(unit,targets)=>targets.reduce((best,target)=>
 !best||distance(unit,target)<distance(unit,best)?target:best,null);
const heading=(a,b)=>(Math.round(Math.atan2(a.x-b.x,(b.y-a.y)*FLAT)/(Math.PI/4))+8)%8;
const pointCopy=({x,y})=>({x,y});

function axisPath(arena,from,to,allowed){
 for(const corner of [{x:to.x,y:from.y},{x:from.x,y:to.y}]){
  if(allowed(corner)&&arena.clearPath(from,corner,RADIUS)&&arena.clearPath(corner,to,RADIUS))return [corner,to];
 }
 return null;
}

function move(unit,dest,dt,arena){
 const dx=dest.x-unit.x,dy=(dest.y-unit.y)*FLAT;
 if(!dx&&!dy)return true;
 const horizontal=dx!==0;
 const remaining=Math.abs(horizontal?dx:dy);
 const step=Math.min(remaining,walkSpeed(arena,unit)*.8*dt);
 const x=horizontal?(step===remaining?dest.x:unit.x+Math.sign(dx)*step):unit.x;
 const y=horizontal?unit.y:(step===remaining?dest.y:unit.y+Math.sign(dy)*step/FLAT);
 if(!arena.fits(x,y))return false;
 if(step>0){
  unit.dir=horizontal?(dx<0?2:6):(dy<0?4:0);
  unit.stride+=step;
  unit.frame=Math.floor(unit.stride/(TEAM_SPEED*.8*.68/4))%4;
  unit.x=x;unit.y=y;
 }
 return unit.x===dest.x&&unit.y===dest.y;
}

function navigate(unit,goal,dt,arena,allowed){
 const direct=axisPath(arena,unit,goal,allowed);
 if(direct){
  delete unit.nav;
  const next=direct.find(p=>distance(unit,p)>0);
  return !next||move(unit,next,dt,arena)&&distance(unit,goal)===0;
 }
 if(distance(unit.nav?.goal??unit,goal)>45||!unit.nav){
  const cells=cellPath(arena,unit,goal,allowed);
  if(!cells)return null;
  const first=axisPath(arena,unit,cells[0],allowed);
  if(!first)return null;
  unit.nav={goal:pointCopy(goal),points:[...first,...cells.slice(1)]};
 }
 const path=unit.nav.points;
 while(path.length&&distance(unit,path[0])===0)path.shift();
 if(!path.length){delete unit.nav;return null;}
 if(move(unit,path[0],dt,arena))path.shift();
 return false;
}

function findTarget(room,unit,players,now){
 const {arena}=room;
 const anchor=unit.anchor??unit;
 const nearby=target=>!(unit.unreachable?.id===target.id&&now<unit.unreachable.until)&&distance(anchor,target)<=LEASH&&(
  distance(unit,target)<=AGGRO||unit.target===target);
 const soldier=nearest(unit,room.infantry.filter(other=>other.side!==unit.side&&other.hp>0&&nearby(other)&&
  arena.canSeeOpponent(unit,other)));
 if(soldier)return soldier;
 const base=room.bases.find(b=>b.id===unit.path[unit.waypoint]?.baseId);
 if(base&&nearby(base)&&canRaidBase(unit.side,base,room.bases))return base;
 return nearest(unit,players.filter(p=>p.side!==unit.side&&active(p,now)&&nearby(p)&&arena.canSeeOpponent(unit,p)));
}

export function stepInfantry(room,now,dt){
 const {arena}=room,players=room.players.filter(p=>active(p,now)),strikes=[];
 for(const unit of room.infantry){
  if(!unit.hp)continue;
  unit.pose='walk';unit.frame=0;
  const cleared=unit.target;
  if(unit.anchor&&cleared?.tier&&cleared.hp===0&&unit.path[unit.waypoint]?.baseId===cleared.id){
   // The fort is the next route checkpoint. Resume there instead of retracing
   // the approach from the point where the soldier first noticed it.
   while(unit.path[unit.waypoint+1]?.baseId===cleared.id)unit.waypoint++;
   unit.anchor=pointCopy(cleared);
   unit.returning=true;
   delete unit.nav;
  }
  const target=!unit.returning&&findTarget(room,unit,players,now);
  if(!target){
   delete unit.target;delete unit.nextHitAt;
   if(unit.anchor){
    unit.returning=true;
    if(navigate(unit,unit.anchor,dt,arena,point=>distance(unit.anchor,point)<=LEASH)){
     delete unit.anchor;delete unit.nav;unit.returning=false;
    }
    continue;
   }
   const point=unit.path[unit.waypoint];
   if(point&&move(unit,point,dt,arena)){
    // Wait at a live assigned fort until it is destroyed or its links are opened.
    const base=room.bases.find(b=>b.id===point.baseId&&b.hp>0);
    const next=unit.path[unit.waypoint+1];
    if(!base||next?.baseId===point.baseId)unit.waypoint++;
   }
   continue;
  }
  unit.anchor??=pointCopy(unit);
  if(unit.target!==target){unit.target=target;delete unit.nav;delete unit.nextHitAt;}
  if(distance(unit,target)>STRIKE_RANGE||!arena.clearPath(unit,target)){
   delete unit.nextHitAt;
   const allowed=point=>distance(unit.anchor,point)<=LEASH;
   if(navigate(unit,target,dt,arena,allowed)===null){
    unit.unreachable={id:target.id,until:now+2000};
    delete unit.nav;
   }
   continue;
  }
  unit.dir=heading(unit,target);
  unit.pose='slash';
  unit.nextHitAt??=now+STRIKE_MS;
  unit.frame=Number(now>=unit.nextHitAt-STRIKE_MS*.5);
  if(now>=unit.nextHitAt){
   unit.nextHitAt+=STRIKE_MS;
   strikes.push({unit,target});
  }
 }
 for(const {unit,target} of strikes){
  if(room.phase!=='match')break;
  if(target.hp<=0)continue;
  if(target.tier){
   if(canRaidBase(unit.side,target,room.bases))room.hitBase(target,unit,1,now);
  }else if(target.infantry){
   target.hp=Math.max(0,target.hp-1);
   room.baseEffect('infantry-slash',target,unit,now,300);
  }
  else if(active(target,now))room.hitWalker(target,1,now);
 }
}
