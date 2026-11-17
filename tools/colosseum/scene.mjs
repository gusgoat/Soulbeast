import '../town-walk-demo/sealer-sprite-catalog.js?v=world-walk16-20261117';
import '../town-walk-demo/sealer-sprites.js?v=world-3d-qa-1';
import {shieldFor,shieldUrl} from './ranking.mjs?v=shields-2';
const assets = new URL('../../assets/',import.meta.url).pathname;
import {BASES, BASE_RECALL_MS, BASE_REPAIR_RANGE, CELL, COLORS, FLAT, TEAM_ARENA, WARP_PADS, WARP_PAD_RANGE, baseDamageStage, capitalSpawn, distance} from './arena.mjs?v=team-bot-tactics-1';
import {inSight,SIGHT_RANGE} from './sight.mjs?v=colosseum-ranges';
import {SURVIVAL_ARENA} from './survival-arena.mjs';
import rareArt from './rare-art.mjs';
import maleSiegeArt from './siege-male-catalog.mjs?v=1';
import femaleSiegeArt from './siege-female-catalog.mjs?v=1';
import pvpCardArt from './pvp-card-art.mjs?v=battle-parity-1';
import {createArenaTraps,drawArenaTraps} from './arena-traps.mjs';
import {drawInfantry} from './infantry-art.mjs?v=team-bot-tactics-1';
const TILE=CELL*FLAT;
const WALL_HEIGHT=54;
const WALK_SECTOR=Math.PI/4;

export function updateWalkPose(pose,p,now){
 const x=p.x,y=p.y*FLAT;
 const dx=p.walkDX??x-pose.x,dy=p.walkDY??y-pose.y;
 const distance=Math.hypot(dx,dy);
 const elapsed=Math.max(1,now-pose.at);
 const samePositionStream=pose.warp===p.warp;
 const walking=(p.phase??'walk')==='walk';
 if(!samePositionStream||now>=pose.movingUntil)pose.vx=pose.vy=0;
 if(samePositionStream&&walking&&distance>.18&&distance<80){
  // Smooth the observed velocity and keep a small margin between direction sectors.
  const rate=1-Math.exp(-elapsed/(p.walkDX===undefined?68:35));
  pose.vx+=(dx/elapsed-pose.vx)*rate;
  pose.vy+=(dy/elapsed-pose.vy)*rate;
  const heading=-Math.atan2(pose.vx,pose.vy);
  const difference=heading-pose.dir*WALK_SECTOR;
  const turn=Math.abs(Math.atan2(Math.sin(difference),Math.cos(difference)));
  if(turn>WALK_SECTOR*.64)pose.dir=(Math.round(heading/WALK_SECTOR)+8)%8;
  pose.spriteDir=globalThis.sealerSprites.heading(pose.vx,pose.vy);
  pose.phase+=distance/15;
  pose.movingUntil=now+105;
 }else if(!samePositionStream||!walking){
  pose.movingUntil=0;
 }
 Object.assign(pose,{x,y,warp:p.warp,at:now});
}
const img=url=>Object.assign(new Image(),{src:url});
const shieldImages=new Map();
const ready=i=>i?.complete&&i.naturalWidth>0;
const shieldEffects={
 diamond:{color:'#79dfff',glow:.42,period:2800},
 guardian:{color:'#58f0a1',glow:.55,period:3200},
 legend:{color:'#b583ff',glow:.64,period:2700},
 eclipse:{color:'#ff6a28',glow:.82,period:2050},
};
const shieldGlows=new Map();
const reducedShieldMotion=matchMedia('(prefers-reduced-motion: reduce)');

function shieldGlow(id,color){
 if(!shieldGlows.has(id)){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=40;
  const ctx=canvas.getContext('2d');
  const glow=ctx.createRadialGradient(20,20,2,20,20,20);
  glow.addColorStop(0,color);
  glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow;
  ctx.fillRect(0,0,40,40);
  shieldGlows.set(id,canvas);
 }
 return shieldGlows.get(id);
}

function shieldSpark(ctx,x,y,r){
 ctx.beginPath();
 ctx.moveTo(x-r,y);
 ctx.lineTo(x,y-r*.25);
 ctx.lineTo(x+r*.25,y-r);
 ctx.lineTo(x+r*.35,y-r*.15);
 ctx.lineTo(x+r,y);
 ctx.lineTo(x+r*.3,y+r*.25);
 ctx.lineTo(x,y+r);
 ctx.lineTo(x-r*.25,y+r*.25);
 ctx.closePath();
 ctx.fill();
}

function drawRankShield(ctx,badge,id,x,y,now){
 const effect=shieldEffects[id];
 if(!effect||reducedShieldMotion.matches){
  ctx.drawImage(badge,x,y,22,22);
  return;
 }
 const phase=(now%effect.period)/effect.period;
 const angle=phase*2*Math.PI;
 const pulse=.5+.5*Math.cos(angle);
 const alpha=ctx.globalAlpha;
 ctx.save();
 ctx.globalAlpha=alpha*effect.glow*(.24+.76*pulse);
 const glowSize=24+pulse*(id==='eclipse'?9:5);
 ctx.drawImage(shieldGlow(id,effect.color),x+11-glowSize/2,y+11-glowSize/2,glowSize,glowSize);
 ctx.globalAlpha=alpha;
 ctx.drawImage(badge,x,y,22,22);
 ctx.fillStyle=id==='diamond'?'#eaffff':'#fff0af';
 if(id==='eclipse'){
  ctx.globalAlpha=alpha*(.50+.40*pulse);
  for(const offset of [0,Math.PI]){
   shieldSpark(ctx,x+11+Math.cos(angle+offset)*9.5,y+11+Math.sin(angle+offset)*8.5,1.15+pulse*.45);
  }
 }else if(id==='legend'){
  ctx.globalAlpha=alpha*pulse**3;
  shieldSpark(ctx,x+4,y+7+pulse*3,1.7);
  shieldSpark(ctx,x+18,y+7+pulse*3,1.7);
 }else if(id==='diamond'){
  ctx.globalAlpha=alpha*Math.sin(Math.PI*phase)**8;
  shieldSpark(ctx,x+5+12*phase,y+5+4*phase,2.6);
 }
 ctx.restore();
}

const catalog=globalThis.sealerSpriteCatalog;
const siteAsset=path=>path?.replace(/^\/Soulbeast\/assets\//,assets);
export const sealerGender=u=>['male','female'].includes(u.gender)?u.gender:u.cls==='swordsman'?'male':'female';
export const portrait=u=>u.sp
 ? rareArt[u.sp]?.portrait?.replace(/^\/assets\//,assets)??assets+'companions/'+u.sp+'.webp'
 : siteAsset(catalog[u.cls]?.[sealerGender(u)]?.portrait);
const atlases=new Map(), beastArt=new Map(), rareAtlases=new Map();
function getAtlas(player){
 const gender=sealerGender(player);
 const key=`${player.cls}-${gender}`;
 if(!atlases.has(key)){
  const entry=catalog[player.cls]?.[gender];
  if(!entry?.ready)return null;
  atlases.set(key,{entry});
 }
 return atlases.get(key);
}
const hash=(x,y)=>Math.abs((Math.imul(x,733)^Math.imul(y,1499))%997)/997;
const treasure=img(assets+'country-walk/temperate-chest.png.webp');
const grassArt=img('./art/tall-hedge-v2.webp');
const wallArt=img('./art/maze-wall-v1.webp');
const baseArt=['ice','fire'].map(theme=>({
 main:img(`./art/${theme}-castle-main-v1.webp`),
 small:img(`./art/${theme}-castle-small-v1.webp`),
 damaged:Object.fromEntries(['small','medium','large'].map(tier=>[tier,
  [75,50,25].map(hp=>img(`./art/${theme}-castle-${tier}-hp-${hp}.webp`))])),
}));
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const flagArt=['sapphire','ruby'].map(team=>img(`./art/capture-flag-${team}-v1.webp`));
const warpPadArt=['sapphire','ruby'].map(team=>img(`./art/warp-pad-${team}-v1.webp`));
const siegeArt=Object.fromEntries(['archer','magic','gunner','melee','hammer','tower','collapse']
 .map(kind=>[kind,img(`./art/siege-${kind}.webp`)]));
const siegePoses=new Map();
const siegeCatalogs={male:maleSiegeArt,female:femaleSiegeArt};
const siegeSheets=new Map();
const siegeDirection=(dx,dy)=>(Math.round(-Math.atan2(dx,dy)/WALK_SECTOR)+8)%8;

function siegeSheet(player){
 const gender=sealerGender(player);
 const catalog=siegeCatalogs[gender];
 if(!Object.hasOwn(catalog,player.cls))return null;
 const key=`${gender}/${player.cls}`;
 if(!siegeSheets.has(key)){
  const image=img(new URL(`./art/siege-${gender}-v1/${player.cls}.webp`,import.meta.url).href);
  siegeSheets.set(key,{image,...catalog[player.cls]});
 }
 return siegeSheets.get(key);
}
// Weapon positions in the release pose, clockwise from facing down.
const weaponTips={
 archer:{
  female:[[.67,.37],[.25,.32],[.36,.29],[.29,.29],[.39,.27],[.82,.37],[.80,.38],[.76,.39]],
  male:[[.65,.40],[.24,.30],[.35,.31],[.34,.30],[.36,.31],[.80,.34],[.78,.39],[.73,.39]],
 },
 gunner:{
  female:[[.53,.18],[.24,.23],[.23,.20],[.28,.17],[.57,.16],[.74,.19],[.76,.23],[.67,.25]],
  male:[[.38,.25],[.21,.19],[.29,.14],[.45,.12],[.76,.14],[.81,.17],[.70,.23],[.59,.20]],
 },
 magic:{
  female:[[.29,.21],[.33,.18],[.41,.18],[.56,.15],[.70,.17],[.70,.19],[.59,.20],[.41,.17]],
  male:[[.28,.22],[.28,.17],[.44,.19],[.56,.16],[.71,.18],[.74,.19],[.59,.20],[.44,.19]],
 },
 melee:[[.38,.54],[.18,.62],[.05,.55],[.18,.43],[.56,.47],[.85,.47],[.95,.55],[.84,.60]],
 hammer:[[.39,.44],[.24,.53],[.24,.50],[.43,.40],[.61,.44],[.77,.49],[.76,.52],[.62,.46]],
};
const lashTips=[[.69,.54],[.25,.63],[.27,.63],[.27,.49],[.31,.49],[.77,.65],[.80,.66],[.76,.53]];
function tipOnSprite(sheet,row,frame,tip){
 if(!ready(sheet?.image))return tip;
 sheet.tips??=new Map();
 const key=[row,...tip].join('/');
 if(sheet.tips.has(key))return sheet.tips.get(key);
 const {cell,image}=sheet;
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=cell;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(image,frame*cell,row*cell,cell,cell,0,0,cell,cell);
 const {data}=ctx.getImageData(0,0,cell,cell);
 const tx=Math.round(tip[0]*cell),ty=Math.round(tip[1]*cell);
 const radius=Math.ceil(cell*.12);
 let closest=radius*radius,point=tip;
 for(let y=Math.max(0,ty-radius);y<Math.min(cell,ty+radius+1);y++){
  for(let x=Math.max(0,tx-radius);x<Math.min(cell,tx+radius+1);x++){
   const distance=(x-tx)**2+(y-ty)**2;
   if(distance<closest&&data[(y*cell+x)*4+3]>96){
    closest=distance;point=[x/cell,y/cell];
   }
  }
 }
 sheet.tips.set(key,point);
 return point;
}
function siegeRelease(player,kind,base){
 const gender=sealerGender(player);
 const sheet=siegeSheet(player);
 const row=siegeDirection(base.x-player.x,(base.y-player.y)*FLAT);
 const size=145*(getAtlas(player)?.entry.renderScale||1);
 const tips=kind==='magic'&&player.cls==='summoner'&&gender==='female'?lashTips:
  (weaponTips[kind]?.[gender]??weaponTips[kind]??weaponTips.melee);
 const frames=sheet?.frames??4;
 const frame=Math.floor(frames/2);
 const [x,y]=tipOnSprite(sheet,row,frame,tips[row]);
 return {x:player.x+(x-.5)*size,y:player.y*FLAT+(y-(sheet?.feet[row]??.9))*size,at:frame/frames};
}
const damageSources=[[.46,.29],[.24,.55],[.72,.47],[.38,.68],[.62,.57],[.82,.65]];
const damageFire=img('./art/siege-fire.webp'),damageSmoke=img('./art/siege-smoke.webp');
const pavingArt=img('./art/arena-paving-v1.webp');
const crowdArt=img('./art/arena-crowd-v1.webp');
const columnArt=img('./art/arena-column-v1.webp');
const ruinsArt=img('./art/arena-ruins-v1.webp');
const countryArt=[
 {tree:img(assets+'hemant-walk-preview/pine-v2.png.webp'),rock:img(assets+'dungeon-later-v1/snow-rock-v2.webp')},
 {tree:img(assets+'country-walk/red/tree.png.webp'),rock:img(assets+'dungeon-later-v1/lava-rock-v2.webp')},
];
const terrainLayouts=new WeakMap();
function terrainLayout(arena){
 if(terrainLayouts.has(arena))return terrainLayouts.get(arena);
 // Keep the curved seating outside the existing collision grid, including the corner corridors.
 const x=CELL-118,y=TILE-83,width=arena.width-2*x,height=arena.height*FLAT-2*y;
 const rx=365,ry=234;
 const outline=inset=>{
  const path=new Path2D();
  path.roundRect(x+inset,y+inset,width-2*inset,height-2*inset,{x:rx-inset,y:ry-inset});
  return path;
 };
 const floor=outline(0),outer=outline(-116),ring=new Path2D(outer);
 ring.addPath(floor);
 const seats=[];
 const stamp=(px,py,angle)=>seats.push({x:px,y:py,angle});
 const edge=(x1,y1,x2,y2,angle)=>{
  const count=Math.ceil(Math.hypot(x2-x1,y2-y1)/115);
  for(let i=0;i<count;i++){
   const t=(i+.5)/count;
   stamp(x1+(x2-x1)*t,y1+(y2-y1)*t,angle);
  }
 };
 const margin=58;
 edge(x+rx,y-margin,x+width-rx,y-margin,0);
 edge(x+rx,y+height+margin,x+width-rx,y+height+margin,0);
 edge(x-margin,y+ry,x-margin,y+height-ry,Math.PI/2);
 edge(x+width+margin,y+ry,x+width+margin,y+height-ry,Math.PI/2);
 for(const [cx,cy,start] of [
  [x+rx,y+ry,Math.PI],[x+width-rx,y+ry,Math.PI*1.5],
  [x+width-rx,y+height-ry,0],[x+rx,y+height-ry,Math.PI/2],
 ])for(let i=0;i<6;i++){
  const a=start+(i+.5)*Math.PI/12;
  const dx=Math.cos(a),dy=Math.sin(a);
  let angle=Math.atan2((ry+margin)*dx,-(rx+margin)*dy);
  if(Math.abs(angle)>Math.PI/2)angle-=Math.sign(angle)*Math.PI;
  stamp(cx+(rx+margin)*dx,cy+(ry+margin)*dy,angle);
 }
 const layout={floor,outer,ring,seats,mapRim:outline(-45),innerRim:outline(14),walls:new Map()};
 terrainLayouts.set(arena,layout);
 return layout;
}

function wallShape(arena,x,y){
 const {walls}=terrainLayout(arena),id=y*arena.cols+x;
 if(walls.has(id))return walls.get(id);
 const {maze,cols,rows}=arena;
 const points=[[0,0],[CELL+1,0],[CELL+1,TILE+1],[0,TILE+1]];
 const normals=[[0,1],[-1,0],[0,-1],[1,0]];
 const exposed=[
  y===1||maze[y-1][x],x===cols-2||maze[y][x+1],
  y===rows-2||maze[y+1][x],x===1||maze[y][x-1],
 ];
 const curve=new Path2D(),ledges=new Path2D(),front=new Path2D();
 const inset=points.map((_,i)=>exposed[i]&&exposed[(i+3)%4]?19+hash(x*5+i,y)*13:0);
 const toward=(from,to,length)=>{
  const dx=to[0]-from[0],dy=to[1]-from[1],t=length/Math.hypot(dx,dy);
  return [from[0]+dx*t,from[1]+dy*t];
 };
 for(let i=0;i<4;i++){
  const next=(i+1)%4,a=points[i],b=points[next];
  const start=toward(a,b,inset[i]),end=toward(b,a,inset[next]);
  const [nx,ny]=normals[i],dent=exposed[i]?7+hash(x+11*i,y+7)*13:0;
  const mid=[(start[0]+end[0])/2+nx*dent,(start[1]+end[1])/2+ny*dent];
  const after=toward(b,points[(i+2)%4],inset[next]);
  if(i===0)curve.moveTo(...start);
  curve.quadraticCurveTo(...mid,...end);
  if(inset[next])curve.quadraticCurveTo(...b,...after);
  if(exposed[i]){
   ledges.moveTo(...start);
   ledges.quadraticCurveTo(...mid,...end);
   if(inset[next])ledges.quadraticCurveTo(...b,...after);
  }
  if(i===2&&exposed[i]){
   // Use the same curve for the stone cap and the foot of the wall.
   const before=toward(a,points[1],inset[i]);
   front.moveTo(...before);
   if(inset[i])front.quadraticCurveTo(...a,...start);
   front.quadraticCurveTo(...mid,...end);
   if(inset[next])front.quadraticCurveTo(...b,...after);
   front.lineTo(after[0],after[1]-WALL_HEIGHT);
   if(inset[next])front.quadraticCurveTo(b[0],b[1]-WALL_HEIGHT,end[0],end[1]-WALL_HEIGHT);
   front.quadraticCurveTo(mid[0],mid[1]-WALL_HEIGHT,start[0],start[1]-WALL_HEIGHT);
   if(inset[i])front.quadraticCurveTo(a[0],a[1]-WALL_HEIGHT,before[0],before[1]-WALL_HEIGHT);
   front.closePath();
  }
 }
 curve.closePath();
 const shape={curve,ledges,front};
 walls.set(id,shape);
 return shape;
}

function stonePattern(ctx){
 // Mirror the unframed center of the source art so neighboring walls share one surface.
 const texture=document.createElement('canvas');
 const size=180;
 texture.width=texture.height=size*2;
 const stone=texture.getContext('2d');
 for(const x of [0,1])for(const y of [0,1]){
  stone.setTransform(1-2*x,0,0,1-2*y,2*x*size,2*y*size);
  stone.drawImage(wallArt,wallArt.naturalWidth*.16,wallArt.naturalHeight*.16,
   wallArt.naturalWidth*.68,wallArt.naturalHeight*.44,0,0,size,size);
 }
 return ctx.createPattern(texture,'repeat');
}

const miniatures=new Map();
function mapBackground(arena){
 if(miniatures.has(arena))return miniatures.get(arena);
 const {cols,rows,maze,bushAt}=arena;
 const c=document.createElement('canvas');miniatures.set(arena,c);
 c.width=cols*8;c.height=rows*6;
 const m=c.getContext('2d');
 const {floor,mapRim}=terrainLayout(arena);
 m.fillStyle='#11121b';m.fillRect(0,0,c.width,c.height);
 m.save();
 m.scale(8/CELL,6/TILE);
 m.fillStyle='#8b7056';m.fill(mapRim);
 m.fillStyle='#28232a';m.fill(floor);
 m.restore();
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(maze[y][x]){
  const bush=bushAt({x:(x+.5)*CELL,y:(y+.5)*CELL})!==null;
  m.fillStyle=bush?'#496c57':arena===SURVIVAL_ARENA?'#827965':x===Math.floor(cols/2)?'#a28b69':x<cols/2?'#4b626f':'#705856';
  m.fillRect(x*8,y*6,8,6);
 }
 return c;
}
export function drawMap(canvas,state,players,me,zoom=1){
 const solo=state.mode==='survival',arena=solo?SURVIVAL_ARENA:TEAM_ARENA;
 const bg=mapBackground(arena), w=bg.width*zoom,h=bg.height*zoom;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const m=canvas.getContext('2d');
 m.drawImage(bg,0,0,w,h);
 const mapX=x=>x/arena.width*w, mapY=y=>y/arena.height*h;
 const zone=state.zone;
 if(zone?.step){
  m.fillStyle='#4ba55392';m.beginPath();m.rect(0,0,w,h);
  if(zone.remaining)m.rect(mapX(zone.min),mapY(zone.min),mapX(zone.max-zone.min),mapY(zone.max-zone.min));
  m.fill('evenodd');
  if(zone.remaining){m.strokeStyle='#b4f081';m.lineWidth=zoom;m.strokeRect(mapX(zone.min),mapY(zone.min),mapX(zone.max-zone.min),mapY(zone.max-zone.min));}
 }
 const bases=(state.bases??BASES).filter(b=>b.hp!==0);
 for(const flag of state.bases??[]){
  if(flag.flagSide==null)continue;
  m.save();m.translate(mapX(flag.x),mapY(flag.y));
  m.strokeStyle='#fff0bd';m.fillStyle=COLORS[flag.flagSide];m.lineWidth=zoom;
  m.beginPath();m.moveTo(-3*zoom,4*zoom);m.lineTo(-3*zoom,-4*zoom);
  m.lineTo(5*zoom,-3*zoom);m.lineTo(-3*zoom,zoom);m.fill();m.stroke();m.restore();
 }
 const side=state.players.find(p=>p.id===state.me)?.side;
 for(const base of bases)for(const id of base.links||[]){
  const target=bases.find(b=>b.id===id);
  if(!target)continue;
  m.strokeStyle=target.side===base.side?COLORS[base.side]+'99':'#fff0bd99';
  m.lineWidth=zoom;m.beginPath();m.moveTo(mapX(base.x),mapY(base.y));m.lineTo(mapX(target.x),mapY(target.y));m.stroke();
 }
 for(const b of bases){
  m.save();m.translate(mapX(b.x),mapY(b.y));if(b.main)m.rotate(Math.PI/4);
  const r=(b.main?4.4:b.tier==='medium'?4:3)*zoom;
  m.fillStyle=COLORS[b.side];m.strokeStyle='#17131c';m.lineWidth=1.4*zoom;
  m.fillRect(-r,-r,r*2,r*2);m.strokeRect(-r,-r,r*2,r*2);m.restore();
  if(b.underAttack&&b.side===side){
   m.strokeStyle='#ffcf65';m.lineWidth=1.5*zoom;
   m.beginPath();m.arc(mapX(b.x),mapY(b.y),(r/zoom+3)*zoom,0,2*Math.PI);m.stroke();
   m.fillStyle='#fff2b3';m.font=`bold ${10*zoom}px sans-serif`;m.textAlign='center';
   m.fillText('!',mapX(b.x)+8*zoom,mapY(b.y)-4*zoom);
  }
 }
 const rendered=new Map(players.map(p=>[p.id,p]));
 const focus=state.spectating||state.me;
 if(state.mapUnits)for(const unit of state.mapUnits){
  const pos=unit.id===focus?me:unit;
  const r=(unit.kind==='boss'?5:unit.kind==='infantry'?3:3.5)*zoom;
  m.save();
  m.translate(mapX(pos.x),mapY(pos.y));
  m.lineWidth=1.4*zoom;
  m.strokeStyle='#10151d';
  m.fillStyle=unit.id===focus?'#fff2a4':unit.kind==='boss'?'#ffda72':
   unit.kind==='shadow'?'#d6a6ff':COLORS[unit.side];
  m.beginPath();
  if(unit.kind==='infantry'){
   m.moveTo(0,-r);m.lineTo(r,r);m.lineTo(-r,r);m.closePath();
  }else if(unit.kind==='boss'){
   m.moveTo(0,-r);m.lineTo(r*.28,-r*.28);m.lineTo(r,0);m.lineTo(r*.28,r*.28);
   m.lineTo(0,r);m.lineTo(-r*.28,r*.28);m.lineTo(-r,0);m.lineTo(-r*.28,-r*.28);m.closePath();
  }else m.arc(0,0,r,0,2*Math.PI);
  if(unit.kind==='shadow'){
   m.stroke();m.strokeStyle=m.fillStyle;m.lineWidth=zoom;m.stroke();
  }else {m.stroke();m.fill();}
  m.restore();
 }
 if(!state.mapUnits)for(const p of state.players)if((solo?p.id===focus:p.side===side)&&p.connected&&p.phase!=='dead'){
  const pos=p.id===focus?me:(rendered.get(p.id)??{x:p.mapX??p.x,y:p.mapY??p.y});
  if(!Number.isFinite(pos?.x)||!Number.isFinite(pos?.y))continue;
  m.fillStyle=p.id===focus?'#fff2a4':'#d5f5ff';
  m.strokeStyle='#10151d';m.lineWidth=1.6*zoom;
  m.beginPath();m.arc(mapX(pos.x),mapY(pos.y),(p.id===state.me?3.9:3.0)*zoom,0,2*Math.PI);m.stroke();m.fill();
 }
 if(!solo&&!state.spectating&&me?.phase==='dead'){
  const p=BASES.find(b=>b.side===side&&b.main);
  m.strokeStyle='#fff2a4';m.lineWidth=1.5*zoom;m.beginPath();m.arc(mapX(p.x),mapY(p.y),7*zoom,0,Math.PI*2);m.stroke();
 }
}
export class Scene{
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.camera=null;this.anim=new Map();this.siegeOrigins=new Map();this.traps=createArenaTraps();this.arena=TEAM_ARENA;}
 render(me,entities,now,chests=[],bases=BASES,traps=[],serverTime=0,zone=null,pan=null,baseEffects=[],warpArrivals=[]){
  const canvas=this.canvas,c=this.c,w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h||!me)return;
  const dpr=Math.min(2,devicePixelRatio||1), normalZoom=Math.min(1.3,Math.max(.84,w/590))*1.08;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
   canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  }
  const {width,obstacles}=this.arena;
  const edgeLook=Math.min(74,Math.max(0,(w-285)*.42))*Math.max(0,1-Math.max(0,Math.min(me.x,width-me.x)-430)/390);
  const home=this.arena===TEAM_ARENA&&(me.side===0||me.side===1)?capitalSpawn(me.side):null;
  const framing=home?Math.max(0,Math.min(1,(300-distance(me,home))/110)):0;
  const fieldX=me.x+(me.x<width/2?-edgeLook:edgeLook);
  const courtyardX=home?home.x+(me.side?-102:102):fieldX;
  const lookX=fieldX+(courtyardX-fieldX)*framing+(pan?.x||0);
  const lookY=(me.y+(home?home.y-me.y:0)*framing)*FLAT-146*framing+(pan?.y||0);
  const homeZoom=Math.min(normalZoom,.94,w/610,h/555);
  const targetZoom=normalZoom+(homeZoom-normalZoom)*framing;
  if(!this.camera||this.camera.warp!==me.warp)this.camera={x:lookX,y:lookY,zoom:targetZoom,warp:me.warp};
  const cam=this.camera;
  cam.x+=(lookX-cam.x)*.18;cam.y+=(lookY-cam.y)*.18;
  cam.zoom+=(targetZoom-cam.zoom)*.18;
  const zoom=cam.zoom;
  const left=cam.x-w/2/zoom, top=cam.y-h/2/zoom, right=left+w/zoom, bottom=top+h/zoom;
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#241f26';c.fillRect(0,0,w,h);
  c.setTransform(dpr*zoom,0,0,dpr*zoom,-left*dpr*zoom,-top*dpr*zoom);
  const walls=this.drawTerrain(left,top,right,bottom);
  const castles=bases.filter(b=>b.hp!==0&&inSight(me,b)&&b.x>left-125&&b.x<right+125&&b.y*FLAT>top-60&&b.y*FLAT<bottom+240);
  for(const pad of WARP_PADS){
   if(!bases.some(b=>b.main&&b.side===pad.side&&b.hp!==0)||pad.side!==me.side&&!inSight(me,pad))continue;
   const art=warpPadArt[pad.side];
   if(ready(art)){
    const width=2*WARP_PAD_RANGE,height=width*art.naturalHeight/art.naturalWidth;
    c.drawImage(art,pad.x-width/2,pad.y*FLAT-height*.45,width,height);
   }
  }
  const flags=bases.filter(b=>b.flagSide!=null&&inSight(me,b));
  const repairs=new Set();
  for(const b of castles){
   if(b.side!==me.side||b.hp>=b.maxHp)continue;
   const active=entities.some(p=>p.repairingBase===b.id&&distance(p,b)<=BASE_REPAIR_RANGE);
   if(active)repairs.add(b.id);
   this.repairRing(b,active);
  }
  for(const box of chests)if(inSight(me,box)&&box.x>left-55&&box.x<right+55&&box.y*FLAT>top-55&&box.y*FLAT<bottom+55)this.chest(box,now);
  drawArenaTraps(this.traps,c,traps.filter(trap=>inSight(me,trap)),serverTime,FLAT);
  const seen=entities.filter(p=>p.id===me.id||inSight(me,p));
  const attacks=new Map(baseEffects.filter(e=>weaponTips[e.kind]&&e.until>serverTime)
   .map(e=>[e.playerId,e]));
  const baseById=new Map([...bases,...seen.filter(e=>e.infantry)].map(target=>[target.id,target]));
  const alive=new Set(seen.map(p=>p.id));
  for(const [id,pose] of this.anim)if(!alive.has(id)){pose.model?.release();this.anim.delete(id);}
  const props=obstacles.filter(p=>inSight(me,p)&&p.x>=left-75&&p.x<=right+75&&p.y*FLAT>=top-80&&p.y*FLAT<=bottom+100);
  for(const e of [...walls,...castles,...flags,...seen,...props].sort((a,b)=>a.y-b.y)){
   if(e.wall){
    this.wall(e.col,e.row,e.wall);
    continue;
   }
   if(e.flagSide!=null){this.captureFlag(e,now);continue;}
   if(e.main!==undefined){
    this.base(e,now);
    if(repairs.has(e.id))this.repairSparks(e,now);
    continue;
   }
   if(e.x<left-160||e.x>right+160||e.y*FLAT<top-180||e.y*FLAT>bottom+100)continue;
   if(e.infantry)drawInfantry(c,e,COLORS[e.side]);
   else if(e.radius)this.drawProp(e);
   else{
    if(e.recallEndsAt)this.recallCircle(e,serverTime);
    this.actor(e,now,e.id===me.id,attacks.get(e.id),baseById,serverTime);
   }
   if(e.healUntil>serverTime)this.healSparks(e,serverTime);
  }
  this.drawBaseEffects(baseEffects,bases,seen,serverTime);
  for(const base of castles)this.drawBaseStatus(base);
  for(const arrival of warpArrivals)if(arrival.recallEndsAt>serverTime)this.recallCircle(arrival,serverTime,true);
  this.sightMask(me,left,top,right,bottom);
  if(zone?.step)this.fog(zone,left,top,right,bottom,now);
 }
 captureFlag(base,now){
  const image=flagArt[base.flagSide];
  if(!ready(image))return;
  const c=this.c,width=82,height=width*image.naturalHeight/image.naturalWidth;
  const [anchorX,anchorY]=base.flagSide===0?[.316,.95]:[.285,.88];
  const x=base.x-width*anchorX,y=base.y*FLAT-height*anchorY;
  if(reducedMotion.matches){c.drawImage(image,x,y,width,height);return;}
  // The pole is stationary. Only the cloth to its right moves.
  const strips=24,step=image.naturalWidth/strips,drawStep=width/strips;
  for(let i=0;i<strips;i++){
   const loose=Math.max(0,(i/strips-.40)/.60);
   const offset=Math.sin(now/145-i*.65+base.x*.01)*loose*3.5;
   c.drawImage(image,i*step,0,step,image.naturalHeight,x+i*drawStep,y+offset,drawStep+.16,height);
  }
 }
 drawTerrain(left,top,right,bottom){
  const c=this.c,{cols,rows,width,height}=this.arena;
  const {floor,outer,ring,seats,innerRim}=terrainLayout(this.arena);
  const nearEdge=left<CELL+24||right>width-CELL-24||top<TILE+24||bottom>height*FLAT-TILE-24;
  if(nearEdge){
   c.fillStyle='#504038';c.fill(outer);
   if(ready(crowdArt)){
    c.save();
    c.clip(ring,'evenodd');
    for(const seat of seats){
     if(seat.x<left-112||seat.x>right+112||seat.y<top-112||seat.y>bottom+112)continue;
     c.save();
     c.translate(seat.x,seat.y);c.rotate(seat.angle);
     c.drawImage(crowdArt,-66,-69,132,138);
     c.restore();
    }
    c.restore();
   }
  }
  c.save();
  if(nearEdge)c.clip(floor);
  if(!this.paving&&ready(pavingArt)){
   this.paving=c.createPattern(pavingArt,'repeat');
   this.paving?.setTransform(new DOMMatrix().scale(.68,.5));
  }
  const spanX=right-left,spanY=bottom-top;
  c.fillStyle=this.paving||'#9b815c';c.fillRect(left,top,spanX,spanY);
  const wash=c.createLinearGradient(0,0,width,0);
  const survival=this.arena===SURVIVAL_ARENA;
  wash.addColorStop(0,survival?'#33293946':'#25476263');
  wash.addColorStop(.5,'#65442537');
  wash.addColorStop(1,survival?'#33293946':'#77382659');
  c.fillStyle=wash;c.fillRect(left,top,spanX,spanY);
  c.restore();
  if(nearEdge){
   c.save();c.clip(floor);
   c.strokeStyle='#38292070';c.lineWidth=100;c.stroke(floor);
   c.strokeStyle='#38292065';c.lineWidth=56;c.stroke(floor);
   c.restore();
   c.strokeStyle='#332720';c.lineWidth=22;c.stroke(floor);
   c.strokeStyle='#ad8b62';c.lineWidth=8;c.stroke(floor);
   c.strokeStyle='#675340';c.lineWidth=5;c.stroke(innerRim);
  }
  const x0=Math.max(1,Math.floor(left/CELL)-1),x1=Math.min(cols-1,Math.ceil(right/CELL)+1);
  const y0=Math.max(1,Math.floor(top/TILE)-1),y1=Math.min(rows-1,Math.ceil((bottom+WALL_HEIGHT)/TILE)+1);
  const walls=[];
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   if(this.arena.maze[y][x]){
    this.tile(x,y);
    continue;
   }
   const wall=wallShape(this.arena,x,y);
   c.save();c.translate(x*CELL+3,y*TILE+6);
   c.lineJoin='round';c.lineCap='round';
   c.strokeStyle='#281b1945';c.lineWidth=22;c.stroke(wall.ledges);
   c.strokeStyle='#281b196d';c.lineWidth=11;c.stroke(wall.ledges);
   c.restore();
   walls.push({col:x,row:y,y:(y+1)*CELL,wall});
  }
  return walls;
 }
 sightMask(me,left,top,right,bottom){
  const c=this.c,x=me.x,y=me.y*FLAT,r=SIGHT_RANGE;
  const dx=Math.max(Math.abs(x-left),Math.abs(x-right)),dy=Math.max(Math.abs(y-top),Math.abs(y-bottom));
  if(dx*dx+dy*dy<=r*r)return;
  c.save();
  c.beginPath();c.rect(left,top,right-left,bottom-top);
  c.moveTo(x+r,y);c.arc(x,y,r,0,Math.PI*2);
  c.fillStyle='#121b305e';c.fill('evenodd');
  c.restore();
 }
 fog(zone,left,top,right,bottom,now){
  const c=this.c,{min,max,remaining}=zone;
  c.save();c.beginPath();c.rect(left,top,right-left,bottom-top);
  if(remaining)c.rect(min,min*FLAT,max-min,(max-min)*FLAT);
  c.clip('evenodd');
  c.fillStyle='#388c4587';c.fillRect(left,top,right-left,bottom-top);
  for(let i=0;i<9;i++){
   const x=left+(right-left)*(i+.5)/9+90*Math.sin(now/2600+i*2.1);
   const y=top+(bottom-top)*hash(i,21)+48*Math.sin(now/1800+i*1.3);
   const cloud=c.createRadialGradient(x,y,6,x,y,130);
   cloud.addColorStop(0,'#a5ee7265');cloud.addColorStop(1,'#80d06b00');
   c.fillStyle=cloud;c.fillRect(x-130,y-130,260,260);
  }
  c.restore();
  if(!remaining)return;
  c.strokeStyle='#a8e876c0';c.lineWidth=3;
  c.strokeRect(min,min*FLAT,max-min,(max-min)*FLAT);
 }
 tile(x,y){
  const {bushAt}=this.arena;
  const c=this.c,px=x*CELL,py=y*TILE;
  if(x===15&&(this.arena===TEAM_ARENA||y===15)){
   c.strokeStyle='#e0b66499';c.lineWidth=2;
   c.beginPath();c.arc(px+CELL/2,py+TILE/2,32,0,Math.PI*2);c.stroke();
   c.strokeRect(px+CELL/2-21,py+TILE/2-21,42,42);
  }
  if(bushAt({x:px+1,y:y*CELL+1})!==null)this.bush(px,py,x,y);
 }
 wall(x,y,{curve,ledges,front}){
  const c=this.c,px=x*CELL,py=y*TILE;
  c.save();c.translate(px,py);
  c.save();c.clip(front);
  const faceTop=TILE-WALL_HEIGHT-18,faceHeight=WALL_HEIGHT+20;
  c.fillStyle='#554438';c.fillRect(0,faceTop,CELL+1,faceHeight);
  if(ready(wallArt)){
   c.drawImage(wallArt,0,wallArt.naturalHeight*.71,wallArt.naturalWidth,wallArt.naturalHeight*.29,
    0,faceTop,CELL+1,faceHeight);
  }
  const shade=c.createLinearGradient(0,faceTop,0,TILE);
  shade.addColorStop(0,'#37261920');shade.addColorStop(.65,'#2e211c24');shade.addColorStop(1,'#1d1617a6');
  c.fillStyle=shade;c.fillRect(0,faceTop,CELL+1,faceHeight);
  c.restore();
  c.translate(0,-WALL_HEIGHT);
  c.lineJoin='round';c.lineCap='round';
  c.clip(curve);
  if(!this.stone&&ready(wallArt))this.stone=stonePattern(c);
  c.translate(-px,-py);
  c.fillStyle=this.stone||'#54463d';c.fillRect(px,py,CELL+1,TILE+1);
  c.translate(px,py);
  c.strokeStyle='#3c2d26';c.lineWidth=24;c.stroke(ledges);
  c.strokeStyle='#ba9970';c.lineWidth=10;c.stroke(ledges);
  c.strokeStyle='#dbc398';c.lineWidth=3;c.stroke(ledges);
  c.restore();
  this.decorateWall(x,y,px,py-WALL_HEIGHT);
 }
 decorateWall(x,y,px,py){
  const roll=hash(x+43,y+29);
  const region=countryArt[x<Math.floor(this.arena.cols/2)?0:1];
  const art=roll<.18?region.tree:roll<.32?region.rock:roll<.42?columnArt:roll<.55?ruinsArt:null;
  if(!ready(art))return;
  const height=art===columnArt||art===region.tree?100:62;
  const width=Math.min(132,height*art.naturalWidth/art.naturalHeight);
  this.c.drawImage(art,px+CELL/2-width/2,py+TILE*.68-height,width,height);
 }
 drawProp(prop){
  const art={...countryArt[prop.side],column:columnArt,ruins:ruinsArt}[prop.kind];
  if(!ready(art))return;
  const height=prop.kind==='tree'||prop.kind==='column'?88:50;
  const width=Math.min(78,height*art.naturalWidth/art.naturalHeight);
  const y=prop.y*FLAT;
  const c=this.c;
  c.fillStyle='#20170c66';c.beginPath();c.ellipse(prop.x,y,prop.radius,prop.radius*.65,0,0,2*Math.PI);c.fill();
  c.drawImage(art,prop.x-width/2,y-height+5,width,height);
 }
 bush(px,py,x,y){
  const c=this.c;
  if(ready(grassArt)){
   c.fillStyle='#30412a75';c.beginPath();c.ellipse(px+CELL/2,py+TILE*.65,CELL*.48,TILE*.31,0,0,2*Math.PI);c.fill();
   c.save();
   if(x%2){c.translate(px*2+CELL,0);c.scale(-1,1);}
   c.drawImage(grassArt,px-4,py-19,CELL+8,TILE+33);
   c.restore();
   return;
  }
  c.fillStyle='#204932a8';c.fillRect(px,py,CELL,TILE);
  for(let i=0;i<25;i++){
   const a=hash(x*17+i,y),b=hash(x+i*29,y*9+i);
   const rx=px+12+a*(CELL-24),ry=py+11+b*(TILE-22);
   c.fillStyle=a>.65?'#588349':a>.34?'#3c663e':'#244a35';
   c.beginPath();c.ellipse(rx,ry,13+a*15,6+a*9,a*3,0,2*Math.PI);c.fill();
   c.strokeStyle='#96b66477';c.lineWidth=1;
   c.beginPath();c.moveTo(rx-7,ry+2);c.lineTo(rx+9,ry-4);c.stroke();
  }
 }
 chest(box,now){
  const c=this.c,x=box.x,y=box.y*FLAT;
  const glow=c.createRadialGradient(x,y,2,x,y,52);glow.addColorStop(0,'#ffc96f88');glow.addColorStop(1,'#ffb25500');
  c.fillStyle=glow;c.fillRect(x-52,y-52,104,104);
  if(ready(treasure))c.drawImage(treasure,x-39,y-43,78,52);
  else{c.fillStyle='#8a4d24';c.fillRect(x-24,y-24,48,30);c.strokeStyle='#f2be6c';c.strokeRect(x-24,y-24,48,30);}
  this.label('หีบสมบัติ',x,y+21+Math.sin(now/450),'#ffdc90');
 }
 flame(x,y,now){
  const c=this.c,r=12+2*Math.sin(now/85);
  const light=c.createRadialGradient(x,y,2,x,y,38);
  light.addColorStop(0,'#ffaa5388');light.addColorStop(1,'#ffaa5300');c.fillStyle=light;c.fillRect(x-38,y-38,76,76);
  c.fillStyle='#ffb756';c.beginPath();c.ellipse(x,y-4,5,r,0,0,Math.PI*2);c.fill();
  c.fillStyle='#ffe7a9';c.beginPath();c.ellipse(x,y,2.5,6,0,0,Math.PI*2);c.fill();
 }
 healSparks(player,now){
  const c=this.c,progress=Math.max(0,1-(player.healUntil-now)/850);
  c.save();
  c.strokeStyle='#a8ffc5';c.shadowColor='#69eea7';c.shadowBlur=8;c.lineWidth=2;
  for(let i=0;i<5;i++){
   const x=player.x+Math.sin(i*2.4)*27,y=player.y*FLAT-18-progress*49+Math.cos(i*2.4)*18;
   const size=4+(i%2)*2;
   c.globalAlpha=Math.sin(progress*Math.PI);
   c.beginPath();c.moveTo(x-size,y);c.lineTo(x+size,y);c.moveTo(x,y-size);c.lineTo(x,y+size);c.stroke();
  }
  c.restore();
 }
 recallCircle(player,now,arrival=false){
  const c=this.c;
  const progress=Math.max(0,Math.min(1,1-(player.recallEndsAt-now)/BASE_RECALL_MS));
  const turn=progress*Math.PI*2;
  c.save();
  c.translate(player.x,player.y*FLAT);
  c.scale(1,.59);
  c.shadowBlur=12;
  c.shadowColor='#77dfff';
  c.lineWidth=2;
  c.strokeStyle=arrival?'#fff1bd':'#87e6ff';
  c.fillStyle=arrival?'#f9c56559':'#4baee942';
  c.beginPath();c.arc(0,0,37,0,2*Math.PI);c.fill();c.stroke();
  c.rotate(turn);
  for(let i=0;i<2;i++){
   c.beginPath();
   for(let j=0;j<3;j++){
    const angle=(i*Math.PI)+j*2*Math.PI/3;
    const x=Math.cos(angle)*30,y=Math.sin(angle)*30;
    if(j===0)c.moveTo(x,y);else c.lineTo(x,y);
   }
   c.closePath();c.stroke();
  }
  c.rotate(-turn);
  c.strokeStyle='#fff1bd';c.lineWidth=4;
  c.beginPath();c.arc(0,0,42,-Math.PI/2,turn-Math.PI/2);c.stroke();
  c.restore();
  if(arrival)this.label('กำลังวาร์ปลง',player.x,player.y*FLAT-32,'#fff1bd');
 }
 repairRing(b,active){
  const c=this.c,x=b.x,y=b.y*FLAT;
  c.save();
  c.beginPath();c.arc(x,y,BASE_REPAIR_RANGE,0,Math.PI*2);
  c.strokeStyle='#101b20d9';c.lineWidth=7;c.stroke();
  c.fillStyle=active?'#61f1ac26':'#61f1ac12';c.fill();
  c.strokeStyle=active?'#a6ffcd':'#a7dfc4';c.lineWidth=3;
  if(!active)c.setLineDash([11,7]);
  c.stroke();c.restore();
 }
 repairSparks(b,now){
  const c=this.c,x=b.x,y=b.y*FLAT;
  c.save();c.strokeStyle='#d3ffe3';c.lineWidth=2;
  for(let i=0;i<7;i++){
   const age=(now/1100+i/7)%1,theta=i*2.39996;
   const px=x+Math.cos(theta)*(50+age*22),py=y-10+Math.sin(theta)*22-age*58;
   c.globalAlpha=Math.sin(age*Math.PI)*.94;
   c.beginPath();c.moveTo(px-4,py);c.lineTo(px+4,py);c.moveTo(px,py-4);c.lineTo(px,py+4);c.stroke();
  }
  c.restore();
 }
 baseHealth(b,x,y,color){
  if(!b.maxHp)return;
  const c=this.c,w=b.main?90:72;
  c.fillStyle='#160e15';c.fillRect(x-w/2,y,w,7);
  c.fillStyle=color;c.fillRect(x-w/2+1,y+1,(w-2)*(b.hp??b.maxHp)/b.maxHp,5);
  c.strokeStyle='#d6b786';c.lineWidth=1;c.strokeRect(x-w/2,y,w,7);
 }
 drawBaseDamage(x,y,width,height,level,now){
  const c=this.c;
  for(let i=0;i<(level+1)*2;i++){
   const [u,v]=damageSources[i],px=x+(u-.5)*width,py=y-height*(1-v);
   const rise=(now/1700+i*.37)%1;
   const smokeSize=(30+rise*31+level*7)*width/150;
   const flameSize=(25+level*7+Math.sin(now/70+i)*4)*width/150;
   c.save();
   if(ready(damageSmoke)){
    c.globalAlpha=Math.sin(Math.PI*rise)*(.35+level*.12);
    c.drawImage(damageSmoke,px-smokeSize*.5+rise*12,py-smokeSize-rise*60,smokeSize,smokeSize);
   }
   c.globalAlpha=.9;
   if(ready(damageFire))c.drawImage(damageFire,px-flameSize*.5,py-flameSize,flameSize,flameSize);
   else this.flame(px,py-9,now+i*93);
   c.restore();
  }
 }
 drawBaseEffects(effects,bases,entities,now){
  const c=this.c;
  for(const [id,origin] of this.siegeOrigins)if(now>=origin.until)this.siegeOrigins.delete(id);
  const colors={archer:'#ff963d',gunner:'#ffcb72',magic:'#aa90ff',melee:'#ffe1a3'};
  for(const e of effects){
   if(e.kind==='tower-fall'||e.kind==='respawn'||e.kind==='infantry-slash')continue;
   const base=bases.find(b=>b.id===e.baseId)||
    (e.targetInfantry&&(entities.find(unit=>unit.id===e.baseId)||e.targetInfantry));
   const player=entities.find(p=>p.id===e.playerId);
   if(!base||now>=e.until)continue;
   let t=Math.max(0,(now-e.at)/(e.until-e.at));
   const art=siegeArt[e.kind];
   if(e.kind==='collapse'){
    const size=(base.main?268:194)*(.55+t*.65);
    c.save();c.globalAlpha=Math.sin(Math.PI*Math.min(.99,t*1.25+.08));
    if(ready(art)){
     const height=size*art.naturalHeight/art.naturalWidth;
     c.drawImage(art,base.x-size/2,base.y*FLAT-height*.82,size,height);
    }
    else{
     c.fillStyle='#ff9f42';
     c.beginPath();c.arc(base.x,base.y*FLAT-38,size*.23,0,2*Math.PI);c.fill();
    }
    c.restore();
    continue;
   }
   if(!player)continue;
   const tower=e.kind==='tower',bx=base.x,by=base.y*FLAT-34;
   const release=tower?null:this.siegeOrigins.get(e.id)??siegeRelease(player,e.kind,base);
   if(release){
    if(t<release.at)continue;
    release.until=e.until;
    this.siegeOrigins.set(e.id,release);
    t=(t-release.at)/(1-release.at);
   }
   const px=tower?player.x:release.x,py=tower?player.y*FLAT-40:release.y;
   const x=tower?bx:px,y=tower?by:py,tx=tower?px:bx,ty=tower?py:by;
   const dx=tx-x,dy=ty-y,angle=Math.atan2(dy,dx);
   const melee=e.kind==='melee'||e.kind==='hammer';
   const travel=melee?t*Math.min(1,24/Math.max(1,Math.hypot(dx,dy))):t;
   c.save();
   c.translate(x+dx*travel,y+dy*travel);c.rotate(angle);
   c.strokeStyle=colors[e.kind]??COLORS[e.side];c.fillStyle=c.strokeStyle;
   c.shadowColor=c.strokeStyle;c.shadowBlur=11;c.lineWidth=tower?5:3;c.lineCap='round';
   if(ready(art)){
    const width=melee?108:tower?122:e.kind==='gunner'?78:91;
    const height=width*art.naturalHeight/art.naturalWidth;
    if(melee)c.globalAlpha=1-t*.82;
    c.drawImage(art,-width*(melee?.46:.72),-height/2,width,height);
   }else if(e.kind==='melee'||e.kind==='hammer'){
    c.globalAlpha=1-t;
    c.beginPath();c.ellipse(0,0,21,31,0,-1.25,1.25);c.stroke();
   }else if(e.kind==='gunner'){
    c.beginPath();c.arc(0,0,7,0,2*Math.PI);c.fill();
    c.globalAlpha=.55;c.beginPath();c.moveTo(-20,0);c.lineTo(-7,0);c.stroke();
   }else{
    c.beginPath();c.moveTo(-Math.min(tower?65:22,Math.hypot(dx,dy)*t),0);c.lineTo(0,0);c.stroke();
    if(e.kind==='archer'){
     c.beginPath();c.moveTo(-7,-4);c.lineTo(1,0);c.lineTo(-7,4);c.stroke();
    }else{
     c.fillStyle='#fff3dc';c.beginPath();c.arc(0,0,tower?3:4,0,2*Math.PI);c.fill();
    }
   }
   c.restore();
  }
 }
 baseAppearance(b){
  const art=baseArt[b.side];
  const damage=baseDamageStage(b);
  const worn=art.damaged[b.tier]?.[damage];
  const castle=ready(worn)?worn:art[b.main?'main':'small'];
  return {castle,damage};
 }
 drawBaseStatus(b){
  const {castle}=this.baseAppearance(b);
  const width=b.main?225:b.tier==='medium'?177:136;
  const height=ready(castle)?width*castle.naturalHeight/castle.naturalWidth:75;
  const x=b.x,y=b.y*FLAT-height,color=COLORS[b.side];
  this.baseHealth(b,x,y-15,color);
  this.label(`${b.label} · ${b.hp??b.maxHp}/${b.maxHp} HP`,x,y-20,color);
 }
 base(b,now){
  const c=this.c,x=b.x,y=b.y*FLAT,color=COLORS[b.side],r=b.main?74:b.tier==='medium'?59:47;
  const {castle,damage}=this.baseAppearance(b);
  if(ready(castle)){
   const width=b.main?225:b.tier==='medium'?177:136, height=width*castle.naturalHeight/castle.naturalWidth;
   // Use the base's ground point for both the sprite and its contact shadow.
   c.save();c.translate(x,y-width*.035);c.scale(width*.49,width*.11);
   const shadow=c.createRadialGradient(0,0,0,0,0,1);
   shadow.addColorStop(0,'#100b09a6');
   shadow.addColorStop(.58,'#100b0961');
   shadow.addColorStop(1,'#100b0900');
   c.fillStyle=shadow;c.fillRect(-1,-1,2,2);
   c.restore();
   c.drawImage(castle,x-width/2,y-height,width,height);
   if(damage>=0)this.drawBaseDamage(x,y,width,height,damage,now);
   return;
  }
  c.fillStyle='#221c25c7';c.strokeStyle=color;c.lineWidth=2;
  c.beginPath();c.ellipse(x,y,r,r*.63,0,0,2*Math.PI);c.fill();c.stroke();
  c.strokeStyle='#d5b57a';c.beginPath();c.ellipse(x,y,r-7,(r-7)*.63,0,0,2*Math.PI);c.stroke();
  for(const d of [-1,1])this.flame(x+d*(r-7),y-13,now+100*d);
  c.fillStyle='#a08568';c.fillRect(x-3,y-72,6,65);
  c.fillStyle=color;c.beginPath();c.moveTo(x-25,y-70);c.lineTo(x+25,y-70);c.lineTo(x+25,y-36);c.lineTo(x,y-23);c.lineTo(x-25,y-36);c.fill();
  c.fillStyle='#17202b';c.font='bold 20px sans-serif';c.textAlign='center';c.fillText(b.main?'◆':'✦',x,y-43);
 }
 label(text,x,y,color,rating=null,now=0){
  const c=this.c;
  c.textAlign='center';c.font='bold 15px system-ui,sans-serif';
  const shield=shieldFor(rating);
  if(shield&&!shieldImages.has(shield.id))shieldImages.set(shield.id,img(shieldUrl(shield)));
  const badge=shield&&shieldImages.get(shield.id);
  const shieldSpace=shield?30:0,w=c.measureText(text).width+12+shieldSpace;
  const left=x-w/2;
  c.fillStyle='#15101de6';c.fillRect(left,y-16,w,21);
  if(ready(badge))drawRankShield(c,badge,shield.id,left+5,y-17,now);
  c.fillStyle=color;c.fillText(text,x+shieldSpace/2,y);
 }
 actor(p,now,isMe,attack,bases,serverTime){
  const c=this.c,x=p.x,y=p.y*FLAT,color=p.sp?(p.boss?'#ffc479':p.rare?'#eed079':'#bd9af3'):
   this.arena===SURVIVAL_ARENA?(isMe?'#f1d680':'#ff827a'):COLORS[p.side];
  const prev=this.anim.get(p.id)??{x,y,dir:0,phase:0,movingUntil:0,warp:p.warp,at:now,vx:0,vy:0};
  updateWalkPose(prev,p,now);
  this.anim.set(p.id,prev);
  if(globalThis.sealerSprites.use3d){
   prev.model??=globalThis.sealerSprites.createModel({beast:!!p.sp,primary:isMe});
   prev.model.sync(p.sp||p.cls+'-'+sealerGender(p));
  }
  const heading=prev.spriteDir??prev.dir;
  const moving=prev.movingUntil>now;
  c.save();if(!p.sp&&this.arena.bushAt(p)!==null)c.globalAlpha=.5;
  c.strokeStyle=color;c.fillStyle=p.boss?'#5d2150ad':'#100c1877';c.lineWidth=p.boss?3:isMe?3:1.5;
  c.beginPath();c.ellipse(x,y,p.boss?55:25,p.boss?25:12,0,0,2*Math.PI);c.fill();c.stroke();
  if(p.sp){
   if(this.arena===TEAM_ARENA&&p.rare&&!p.boss){
    c.save();
    c.translate(x,y-6);c.scale(1,.57);
    const aura=c.createRadialGradient(0,0,12,0,0,42);
    const pulse=reducedMotion.matches?1:.90+.10*Math.sin(now/240);
    aura.addColorStop(0,'#2a155e00');
    aura.addColorStop(.76,`rgba(139,89,233,${.5*pulse})`);
    aura.addColorStop(1,'#7242d500');
    c.fillStyle=aura;c.fillRect(-42,-42,84,84);c.restore();
   }
   const spec=rareArt[p.sp];
   const rendered=prev.model?.draw(c,x,y,p.boss?142:89,heading,moving,false);
   if(!rendered&&spec){
    if(!rareAtlases.has(p.sp))rareAtlases.set(p.sp,img(assets+'rare-beast-walk-20261103/'+p.sp+'-walk-v1.webp'));
    const a=rareAtlases.get(p.sp),size=p.boss?142:89;
    const col=moving?Math.floor(now/1000/spec.cycle*spec.frames)%spec.frames:0;
    const [ax,ay]=spec.anchors?.[prev.dir]??spec.anchor??[.5,.9];
    if(ready(a))c.drawImage(a,col*spec.cell,prev.dir*spec.cell,spec.cell,spec.cell,x-size*ax,y-size*ay,size,size);
   }else if(!rendered){
    if(!beastArt.has(p.sp))beastArt.set(p.sp,img(portrait(p)));
    const a=beastArt.get(p.sp),size=61, lift=Math.sin(now/135+prev.phase)*3;
    if(ready(a))c.drawImage(a,x-size/2,y-size+lift,size,size);
   }
   this.label(`${p.boss?'♛ ':''}${p.label} · Lv ${p.lv}`,x,y-(p.boss?127:65),color);
   if(p.boss){
    c.fillStyle='#231525';c.fillRect(x-44,y-119,88,9);
    c.fillStyle='#e07e4e';c.fillRect(x-43,y-118,86*Math.max(0,p.hp/p.maxHp),7);
    c.strokeStyle='#ffca79';c.lineWidth=1;c.strokeRect(x-44,y-119,88,9);
   }
  }else{
   const atlas=getAtlas(p);
   const pose=moving?(p.walkRunning===false?'walk':'run'):'idle';
   const entry=atlas?.entry;
   const [ax,ay]=entry?.anchor||[.5,.962],size=145*(entry?.renderScale||1);
   const target=attack&&bases.get(attack.baseId);
   const attackSheet=target&&siegeSheet(p);
   const directional=ready(attackSheet?.image);
   const action=target&&!directional&&pvpCardArt[`${p.cls}-${sealerGender(p)}`];
   const progress=attack?Math.max(0,(serverTime-attack.at)/(attack.until-attack.at)):0;
   const close=attack?.kind==='melee'||attack?.kind==='hammer';
   const posePath=action&&(progress<.25?action.windup:close?action.melee:action.power);
   if(posePath&&!siegePoses.has(posePath))siegePoses.set(posePath,img(posePath.replace(/^\/assets\//,assets)));
   const strike=siegePoses.get(posePath);
   if(directional){
    const {image,cell,frames,feet}=attackSheet;
    const dx=target.x-p.x,dy=(target.y-p.y)*FLAT;
    const row=dx||dy?siegeDirection(dx,dy):prev.dir;
    const frame=Math.min(frames-1,Math.floor(progress*frames));
    globalThis.sealerSprites.drawColoredFrame(c,image,frame*cell,row*cell,cell,cell,x-size*.5,y-size*feet[row],size,size);
   }else if(ready(strike)){
    const reach=Math.sin(Math.PI*Math.min(1,progress))*(close?14:5);
    const direction=Math.sign(target.x-x)||1;
    const height=size*.87,width=height*strike.naturalWidth/strike.naturalHeight;
    c.save();c.translate(x+direction*reach,y);c.scale(direction,1);
    globalThis.sealerSprites.drawColoredFrame(c,strike,0,0,strike.naturalWidth,strike.naturalHeight,-width/2,-height,width,height);
    c.restore();
   }else if(atlas&&!prev.model?.draw(c,x,y,145,heading,moving,pose==='run')){
    const run=pose==='run'&&entry.run;
    const runSheet=run?(atlas.run??=globalThis.sealerSprites.movementImage(siteAsset(run))):null;
    const running=ready(runSheet);
    const sheet=running?runSheet:pose==='idle'?(atlas.idle??=img(siteAsset(entry.idle))):(atlas.walk??=img(siteAsset(entry.walk)));
    if(ready(sheet)){
     const layout=moving?(running?(entry.runLayout||entry.walkLayout):entry.walkLayout):entry.idleLayout;
     const cols=layout?.columns??(moving?((running?entry.runFrames:entry.walkFrames)||entry.walkFrames||8):4);
     const rows=layout?.rows??(moving?8:2);
     const rate=(running?entry.runPhaseScale:entry.phaseScale)??entry.phaseScale??1;
     const col=moving?Math.floor(prev.phase*rate*cols/8)%cols:prev.dir%cols;
     if(moving){
      const dir=prev.spriteDir??prev.dir,extra=entry.intercardinal;
      const alternate=running?'run':'walk',atlasKey=alternate+'Between';
      const between=extra?.[alternate]&&!Number.isInteger(dir)&&(atlas[atlasKey]??=globalThis.sealerSprites.movementImage(siteAsset(extra[alternate])));
      globalThis.sealerSprites.drawMovement(c,x,y,145,dir,col,cols,sheet,[ax,ay],entry.renderScale||1,
       ready(between)?between:null,extra);
     }else{
      const width=sheet.naturalWidth/cols,height=sheet.naturalHeight/rows;
      globalThis.sealerSprites.drawColoredFrame(c,sheet,col*width,Math.floor(prev.dir/cols)*height,
       width,height,x-size*ax,y-size*ay,size,size);
     }
    }
   }
   if(!directional&&!ready(strike)&&!prev.model?.ready&&!ready(atlas?.[pose])){c.fillStyle=color;c.fillRect(x-12,y-55,24,49);}
   const spriteTop=y-(atlas?size*ay:55);
   this.label(`${p.name}${p.phase==='battle'?' ⚔':''}`,x,spriteTop-16,isMe?'#fff2af':color,p.rating??0,now);
   if(p.phase==='walk'&&Number.isFinite(p.hp)&&p.maxHp>0){
    const width=64,height=7,barY=spriteTop-9;
    const ratio=Math.max(0,Math.min(1,p.hp/p.maxHp));
    c.fillStyle='#17121e';c.fillRect(x-width/2,barY,width,height);
    c.fillStyle=ratio<=.25?'#ff7474':ratio<=.5?'#ffc55e':'#75e3a2';
    c.fillRect(x-width/2+1,barY+1,(width-2)*ratio,height-2);
   }
   if(this.arena!==SURVIVAL_ARENA&&Number.isFinite(p.points))this.label([p.streakTitle,p.points].filter(value=>value!=null).join(' · '),x,spriteTop-39,'#ffe19a');
  }
  c.restore();
 }
}
