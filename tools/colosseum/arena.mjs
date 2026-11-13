export const COLS=31, ROWS=43, CELL=180, FLAT=.64;
export const WIDTH=COLS*CELL, HEIGHT=ROWS*CELL;
export const SPEED=246, RADIUS=21, CONTACT=50, ASSIST=400, RAID_RANGE=122;
export const BEAST_SPEED_SCALE=.8;
export const TEAM_SPEED=200, BASE_FIRE_RANGE=300, BASE_FIRE_MS=2000, BASE_BOLT_MS=280;
export const BASE_FIRE_STREAK_MS=5000, BASE_FIRE_STREAK_BONUS=.1, BASE_FIRE_MAX_MULTIPLIER=1.5;
export const BASE_ATTACK_MS=1000, BASE_ATTACK_HP=4;
export const TEAM_START_SCORE=500;
export const BASE_AURA_RANGE=600;
export const BASE_RECALL_MS=5000;
export const BASE_REPAIR_RANGE=150, BASE_REPAIR_MS=500, BASE_REPAIR_SCORE_MS=2000, BASE_ATTACK_SCORE_MS=1000;
export const MATCH_MS=12*60_000, RESPAWN_MS=30_000;
export const BOSS_INTERVAL=2*60_000, BOSS_POINTS=60, CHEST_COUNT=10;
export const BEAST_POINTS=20;
export const TEAMS=['ไพลิน','ทับทิม'], COLORS=['#6ac9ff','#ff827a'];
export const cellCenter=(x,y)=>({x:(x+.5)*CELL,y:(y+.5)*CELL});
export const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*FLAT);
export const cellKey=(x,y)=>y*COLS+x;
export const indexAt=({x,y})=>cellKey(Math.floor(x/CELL),Math.floor(y/CELL));

// Generate one connected half, add loops, then mirror it. All seven center
// gates and all bases open onto the same walkable network.
export function buildMaze(){
 const grid=Array.from({length:ROWS},()=>Array(COLS).fill(false));
 let seed=0x8122026;
 const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/2**32*n);};
 const stack=[[1,21]];grid[21][1]=true;
 while(stack.length){
  const [x,y]=stack.at(-1), next=[[x+2,y],[x-2,y],[x,y+2],[x,y-2]].filter(([a,b])=>a>=1&&a<=13&&b>=1&&b<ROWS-1&&!grid[b][a]);
  if(!next.length){stack.pop();continue;}
  const [a,b]=next[random(next.length)];
  grid[b][a]=grid[(y+b)/2][(x+a)/2]=true;stack.push([a,b]);
 }
 for(const y of [5,13,21,29,37]) for(let x=1;x<=13;x++)grid[y][x]=true;
 for(const x of [3,9,13])for(let y=3;y<=39;y++)grid[y][x]=true;
 for(const y of [21,9,33]) for(let j=y-1;j<=y+1;j++)for(let x=1;x<=3;x++)grid[j][x]=true;
 for(let y=0;y<ROWS;y++)for(let x=0;x<15;x++)grid[y][COLS-1-x]=grid[y][x];
 for(const y of [5,9,15,21,27,33,37]){
  grid[y][14]=grid[y][16]=true;
  if(y===21)grid[y][15]=true;
  else for(let x=14;x<=16;x++)grid[y+1][x]=true;
 }
 // Side corridors link alternating crossings and create junctions and loops.
 for(const [start,end] of [[6,9],[16,20],[28,33],[34,37]]){
  for(let y=start;y<=end;y++)grid[y][14]=grid[y][16]=true;
 }
 return grid;
}
export const maze=buildMaze();
const hedgeSites=[
 [6,13,2],[11,5,2],[8,29,2],[4,37,2],[8,5,2],[3,5,2],[3,13,2],[6,21,2],[4,29,2],[9,37,2],
 [3,3,1],[9,8,1],[13,11,1],[3,16,1],[9,18,1],[13,24,1],[9,26,1],[3,31,1],[13,34,1],[3,39,1],
];
export const BUSHES=[0,1].flatMap(side=>hedgeSites.map(([x,y,w],i)=>({
 id:`${side}-${i}`,x:side?COLS-w-x:x,y,w
})));
function findBush(p,bushes){
 const x=Math.floor(p.x/CELL),y=Math.floor(p.y/CELL);
 return bushes.find(b=>y===b.y&&x>=b.x&&x<b.x+b.w)?.id??null;
}
const baseSites=[
 [2,21,'large',300,30,[1,2]], [5,13,'medium',200,20,[3,4]], [6,29,'medium',200,20,[5,6]],
 [6,5,'small',100,10,[]], [10,13,'small',100,10,[]], [10,29,'small',100,10,[]], [6,37,'small',100,10,[]],
 [10,21,'small',100,10,[],'ฐานเล็กแนวกลาง'],
 [5,21,'medium',200,20,[4,5,7],'ฐานกลางแนวกลาง'],
];
export const BASES=TEAMS.flatMap((team,side)=>baseSites.map(([x,y,tier,maxHp,aura,children,label],i)=>({
 id:`${side}-${i}`,side,tier,maxHp,aura,main:tier==='large',points:tier==='large'?3:tier==='medium'?2:1,
 label:label??(tier==='large'?'ฐานใหญ่':tier==='medium'?`ฐานกลาง ${i}`:`ฐานเล็ก ${i-2}`),
 links:children.map(child=>`${side}-${child}`),...cellCenter(side?COLS-1-x:x,y)
})));
export const canRaidBase=(side,base,bases)=>base.side!==side&&base.hp>0&&
 (!base.links?.length||base.links.some(id=>bases.some(link=>link.id===id&&link.side===side&&link.hp>0)));
export const mainBase=side=>BASES.find(b=>b.main&&b.side===side);
export const spawns=side=>[[-48,-52],[-48,52],[0,0],[48,-52],[48,52]].map(([dx,dy])=>({x:mainBase(side).x+(side?-dx:dx),y:mainBase(side).y+dy}));
const propSites=maze.flatMap((row,y)=>row.slice(2,14).flatMap((open,i)=>{
 const x=i+2;
 const center=cellCenter(x,y);
 if(!open||(x<4&&Math.abs(y-21)<3)||findBush(center,BUSHES)!==null||BASES.some(base=>distance(center,base)<120))return [];
 return [{x,y,original:(x*11+y*7)%4===0,order:Math.imul(cellKey(x,y),0x9e3779b1)>>>0}];
}));
const originalPropCount=propSites.filter(p=>p.original).length;
// Offset props from both centerlines so the same route works for players, bots and bosses.
export const OBSTACLES=propSites.sort((a,b)=>Number(b.original)-Number(a.original)||a.order-b.order)
 .slice(0,originalPropCount*3).flatMap(({x,y})=>[0,1].map(side=>{
  const center=cellCenter(side?COLS-1-x:x,y);
  return {x:center.x+(side?-1:1)*(y%2?-56:56),y:center.y+(x%2?-64:64),
   side,kind:['tree','rock','column','ruins'][(x+y*3+(x>>2))%4],radius:16};
 }));
export function createArena(grid,bushes,obstacles){
 const rows=grid.length,cols=grid[0].length;
 const cellKey=(x,y)=>y*cols+x;
 const indexAt=({x,y})=>cellKey(Math.floor(x/CELL),Math.floor(y/CELL));
 const bushAt=p=>findBush(p,bushes);
 const terrain={maze:grid,bushAt};
 const canSeeOpponent=(observer,subject)=>{
  const patch=bushAt(subject);
  return patch===null||bushAt(observer)===patch;
 };
 const obstaclesByCell=new Map(obstacles.map(prop=>[indexAt(prop),prop]));
 function hitsProp(x,y,r){
 const cellX=Math.floor(x/CELL),cellY=Math.floor(y/CELL);
 for(let row=cellY-1;row<=cellY+1;row++)for(let col=cellX-1;col<=cellX+1;col++){
  const prop=obstaclesByCell.get(cellKey(col,row));
  if(prop&&Math.hypot(x-prop.x,(y-prop.y)*FLAT)<r+prop.radius)return true;
 }
 return false;
}
const passable=(x,y)=>grid[Math.floor(y/CELL)]?.[Math.floor(x/CELL)]===true;
function fits(x,y,r=RADIUS){
 return [[-r,-r],[-r,r],[r,-r],[r,r]].every(([dx,dy])=>passable(x+dx,y+dy/FLAT))&&!hitsProp(x,y,r);
}
function clearPath(a,b,r=0){
 const count=Math.max(1,Math.ceil(distance(a,b)/20));
 for(let i=0;i<=count;i++){
  const x=a.x+(b.x-a.x)*i/count,y=a.y+(b.y-a.y)*i/count;
  if(r>0?!fits(x,y,r):!passable(x,y)||hitsProp(x,y,0))return false;
 }
 return true;
}
function move(p,dx,dy,dt,speed=SPEED,allow=()=>true){
 const len=Math.max(1,Math.hypot(dx,dy)), x=p.x+dx/len*dt*speed,y=p.y+dy/len*dt*speed/FLAT;
 if(fits(x,y)&&allow(x,y)){p.x=x;p.y=y;return;}
 if(fits(x,p.y)&&allow(x,p.y))p.x=x;
 if(fits(p.x,y)&&allow(p.x,y))p.y=y;
}
function movePlayer(p,dx,dy,dt,allow){
 move(p,dx,dy,dt,walkSpeed(terrain,p),allow);
}
function nextCell(from,to,canCross=()=>true){
 if(from===to)return to;
 const prev=new Int16Array(cols*rows).fill(-1);prev[from]=from;
 const q=[from];
 for(let i=0;i<q.length;i++){
  const at=q[i], x=at%cols,y=Math.floor(at/cols);
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(!grid[ny]?.[nx])continue;
   const k=cellKey(nx,ny);if(prev[k]!==-1||!canCross(x,y,nx,ny))continue;prev[k]=at;
   if(k===to){let n=k;while(prev[n]!==from)n=prev[n];return n;}
   q.push(k);
  }
 }
 return from;
}
 const chestInReach=(p,chest)=>distance(p,chest)<=RAID_RANGE&&clearPath(p,chest);
 return {cols,rows,width:cols*CELL,height:rows*CELL,maze:grid,obstacles,bushAt,canSeeOpponent,passable,fits,clearPath,move,movePlayer,indexAt,nextCell,chestInReach};
}
export const TEAM_ARENA=createArena(maze,BUSHES,OBSTACLES);
export const {bushAt,canSeeOpponent,passable,fits,clearPath,move,movePlayer,nextCell}=TEAM_ARENA;
export function siegeProfile(p){
 const cls=p.baseCls||p.cls;
 if(cls==='gunner'||cls==='archer')return {range:300,effect:cls};
 if(cls==='mage'||cls==='summoner'||cls==='druid')return {range:150,effect:'magic'};
 return {range:75,effect:cls==='merchant'?'hammer':'melee'};
}
export const RAID_TARGET=(p,b)=>p.side!==b.side&&distance(p,b)<=siegeProfile(p).range&&clearPath(p,b);
export const HEAL_TARGET=(p,b)=>p.side===b.side&&b.hp>0&&distance(p,b)<=BASE_REPAIR_RANGE;
export const REPAIR_TARGET=(p,b)=>(p.baseCls||p.cls)==='merchant'&&HEAL_TARGET(p,b)&&b.hp<b.maxHp;
export function walkSpeed(arena,p){
 const speed=arena.maze===maze?TEAM_SPEED*((p.baseCls||p.cls)==='thief'?1.2:1):SPEED;
 return arena.bushAt(p)===null?speed:speed/2;
}
export const CHEST_TARGET=TEAM_ARENA.chestInReach;
export const CLASSES={swordsman:'นักดาบ',archer:'นักธนู',mage:'นักเวทย์',summoner:'นักอัญเชิญ'};
