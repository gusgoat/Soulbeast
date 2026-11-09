import {CELL, cellCenter, createArena} from './arena.mjs';

const SIZE=31, EDGE=SIZE-1, SPAN=SIZE*CELL;
export const FOG_INTERVAL=30_000, FOG_STAGES=10, SURVIVAL_CHEST_COUNT=15;
const SPAWN_LANES=[3,15,27];
function hash(x,y){
 let n=Math.imul(x+1,0x9e3779b1)^Math.imul(y+1,0x85ebca6b);
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return (n^(n>>>16))>>>0;
}
function orbit(x,y,edge=EDGE){
 const seen=new Map();
 for(const [a,b] of [[x,y],[y,x]])for(const i of [a,edge-a])for(const j of [b,edge-b])seen.set(i+','+j,[i,j]);
 return [...seen.values()];
}
const edgeSpawn=(x,y)=>(([1,EDGE-1].includes(y)&&SPAWN_LANES.includes(x))||
 ([1,EDGE-1].includes(x)&&SPAWN_LANES.includes(y)));
const corner=(x,y)=>(x===1||x===EDGE-1)&&(y===1||y===EDGE-1);
const depth=(x,y)=>Math.min(x,y,EDGE-x,EDGE-y);
function safeStage(depth){
 const side=(SPAN-2*(depth+.5)*CELL)/(SPAN-2*CELL);
 return Math.floor((1-side**2)*FOG_STAGES);
}
function buildSurvivalMaze(){
 const grid=Array.from({length:SIZE},()=>Array(SIZE).fill(false));
 const key=(x,y)=>y*SIZE+x;
 const parent=Array.from({length:SIZE*SIZE},(_,i)=>i);
 function root(n){
  while(parent[n]!==n){parent[n]=parent[parent[n]];n=parent[n];}
  return n;
 }
 const gates=[];
 for(let y=1;y<EDGE;y+=2)for(let x=1;x<EDGE;x+=2){
  if(corner(x,y))continue;
  grid[y][x]=true;
  for(const [dx,dy] of [[1,0],[0,1]]){
   const a=x+dx,b=y+dy;
   if(x+2*dx>=EDGE||y+2*dy>=EDGE||corner(x+2*dx,y+2*dy))continue;
   // The edge alcoves only open towards the interior.
   if(((dx&&(y===1||y===EDGE-1))||(dy&&(x===1||x===EDGE-1)))&&
     (edgeSpawn(x,y)||edgeSpawn(x+2*dx,y+2*dy)))continue;
   const group=orbit(a,b);
   if(key(a,b)!==Math.min(...group.map(([i,j])=>key(i,j))))continue;
   gates.push({group,stage:safeStage(Math.min(depth(x,y),depth(x+2*dx,y+2*dy))),order:hash(a,b)});
  }
 }
 // Connect inner corridors first so later fog rings retain connected paths.
 gates.sort((a,b)=>b.stage-a.stage||a.order-b.order);
 for(const {group,order} of gates){
  const edges=group.map(([x,y])=>{
   const dx=Number(x%2===0),dy=1-dx;
   return {x,y,a:key(x-dx,y-dy),b:key(x+dx,y+dy)};
  });
  if(order%7!==0&&edges.every(e=>root(e.a)===root(e.b)))continue;
  for(const {x,y,a,b} of edges){grid[y][x]=true;parent[root(a)]=root(b);}
 }
 return grid;
}
const grid=buildSurvivalMaze(),bushes=[],props=[],spawns=[],decorationSites=[];
for(let y=1;y<EDGE;y++)for(let x=1;x<EDGE;x++){
 if(!grid[y][x])continue;
 if(edgeSpawn(x,y)){
  // The other two central alcoves keep the maze symmetric and stay empty.
  if(x!==15)spawns.push(cellCenter(x,y));
  continue;
 }
 const group=orbit(x,y),canonical=group.reduce((min,p)=>p[1]*SIZE+p[0]<min[1]*SIZE+min[0]?p:min);
 if(x!==canonical[0]||y!==canonical[1]||group.length!==8||y===1)continue;
 decorationSites.push({x,y,group,roll:hash(x,y)});
}
decorationSites.sort((a,b)=>a.roll-b.roll).forEach(({x,y,group,roll},i)=>{
 if(i<5){
  for(const [i,j] of group)bushes.push({x:i,y:j,w:1,id:`fog-${i}-${j}`});
 }else if(roll%10<4){
  const center=cellCenter(x,y),kind=['tree','rock','column','ruins'][Math.floor(roll/13)%4];
  for(const [a,b] of orbit(center.x+64,center.y-64,SPAN))props.push({x:a,y:b,kind,side:Math.floor(roll/31)%2,radius:16});
 }
});
export const SURVIVAL_ARENA=createArena(grid,bushes,props);
export const SURVIVAL_SPAWNS=spawns;
export const SURVIVAL_SITES=grid.flatMap((row,y)=>row.flatMap((open,x)=>{
 const p=cellCenter(x,y);
 return open&&SURVIVAL_ARENA.bushAt(p)===null&&spawns.every(s=>Math.hypot(p.x-s.x,p.y-s.y)>2*CELL)?[p]:[];
}));

export function fogZone(start,now){
 const step=Math.min(FOG_STAGES,Math.max(0,Math.floor((now-start)/FOG_INTERVAL)));
 const remaining=(FOG_STAGES-step)/FOG_STAGES;
 const min=CELL+(SPAN-2*CELL)*(1-Math.sqrt(remaining))/2;
 return {step,min,max:SPAN-min,remaining,nextAt:step<FOG_STAGES?start+(step+1)*FOG_INTERVAL:null};
}
export const insideFogSafe=(zone,x,y)=>!zone||(zone.remaining>0&&x>=zone.min&&x<=zone.max&&y>=zone.min&&y<=zone.max);
export function walkInArena(arena,zone,p,dx,dy,dt){
 const confined=zone&&insideFogSafe(zone,p.x,p.y);
 arena.movePlayer(p,dx,dy,dt,confined?(x,y)=>insideFogSafe(zone,x,y):undefined);
}
