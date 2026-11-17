'use strict';

const floorUrl='https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/dungeon-mooncrystal-v1.json';
const title=document.querySelector('#floorTitle');
const status=document.querySelector('#floorStatus');
const canvas=document.querySelector('#floorMap');
const context=canvas.getContext('2d');
const directions={ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowUp:[0,-1],ArrowRight:[1,0]};

function parseFloor({version,name,grid}){
 if(version!==1||typeof name!=='string'||!name.trim()||name.length>80||!Array.isArray(grid)||grid.length<3||grid.length>30)
  throw new Error('ข้อมูลชั้นไม่ถูกต้อง');
 const rows=grid.length,cols=grid[0]?.length,cell=56,flatten=.8;
 if(cols<3||cols>32||!grid.every(row=>typeof row==='string'&&row.length===cols&&/^[#.SKE]+$/.test(row)))
  throw new Error('ผังดันเจี้ยนไม่ถูกต้อง');
 const center=(x,y)=>({x:(x+.5)*cell,y:(y+.5)*cell});
 const places=new Map();
 const tiles=grid.map((row,y)=>Array.from(row,(tile,x)=>{
  if((x===0||y===0||x===cols-1||y===rows-1)&&tile!=='#')throw new Error('ขอบผังต้องเป็นกำแพง');
  if('SKE'.includes(tile)){
   if(places.has(tile))throw new Error('ตำแหน่งสำคัญซ้ำกัน');
   places.set(tile,center(x,y));
  }
  return tile==='#'?0:1;
 }));
 if(places.size!==3)throw new Error('ผังขาดตำแหน่งเริ่ม ผลึก หรือทางออก');
 const data={cols,rows,cell,flatten,width:cols*cell,height:rows*cell,grid:tiles,center,rooms:[],river:[]};
 const nav=MineLabyrinth.navigation(data);
 const spawn=places.get('S'),crystal=places.get('K'),exit=places.get('E');
 if(!nav.pathBetween(spawn,crystal).length||!nav.pathBetween(crystal,exit).length)
  throw new Error('ทางเดินไปผลึกหรือทางออกขาด');
 return {name,data,nav,spawn,crystal,exit};
}

function loadArt(name){
 return new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>resolve(image);
  image.onerror=()=>reject(new Error('โหลดภาพฉากไม่ได้'));
  image.src='/Soulbeast/assets/dungeon-mine-v1/'+name+'.webp';
 });
}

async function start(){
 const response=await fetch(floorUrl,{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('โหลดข้อมูลจาก Supabase ไม่สำเร็จ ('+response.status+')');
 const {name,data,nav,spawn,crystal,exit}=parseFloor(await response.json());
 const [floor,water,stairs,ore]=await Promise.all(['floor','water','stairs','ore-cyan'].map(loadArt));
 const ground=DungeonGround.paint(data,'mine',{floor,water});
 const sealer=sealerSprites.create();
 await sealer.sync({cls:'archdruid',gender:'female'});
 const {cell,flatten}=data;
 let player={...spawn},path=[],direction=0,phase=0,hasCrystal=false,completed=false,last=performance.now();
 canvas.width=data.width;
 canvas.height=Math.ceil(data.height*flatten);
 title.textContent=name;
 status.textContent='แตะทางเดินหรือกดลูกศรเพื่อเก็บผลึก แล้วไปทางออก';
 canvas.hidden=false;

 function moveTo(destination){
  if(!completed&&nav.walkable(destination.x,destination.y))path=nav.pathBetween(player,destination);
 }
 canvas.addEventListener('pointerdown',event=>{
  const bounds=canvas.getBoundingClientRect();
  const x=Math.floor((event.clientX-bounds.left)/bounds.width*data.cols);
  const y=Math.floor((event.clientY-bounds.top)/bounds.height*data.rows);
  moveTo(data.center(x,y));
 });
 addEventListener('keydown',event=>{
  const shift=directions[event.key];
  if(!shift||completed)return;
  event.preventDefault();
  const x=Math.floor(player.x/cell),y=Math.floor(player.y/cell);
  const next=data.center(x+shift[0],y+shift[1]);
  if(nav.walkable(next.x,next.y))moveTo(next);
 });

 function prop(image,position){
  const size=cell*.78;
  context.drawImage(image,position.x-size/2,position.y*flatten-size/2,size,size);
 }
 function animate(now){
  const seconds=Math.min(.05,(now-last)/1000);
  last=now;
  if(path.length){
   const target=path[0],dx=target.x-player.x,dy=target.y-player.y,distance=Math.hypot(dx,dy);
   if(distance<=seconds*220){player={...target};path.shift()}
   else {
    direction=sealerSprites.heading(dx,dy);
    player.x+=dx/distance*seconds*220;
    player.y+=dy/distance*seconds*220;
   }
   phase+=seconds*10;
  }
  if(!hasCrystal&&nav.distance(player,crystal)<cell*.32){
   hasCrystal=true;
   status.textContent='เก็บผลึกจันทร์แล้ว ไปที่ทางออกได้เลย';
  }
  if(nav.distance(player,exit)<cell*.32){
   if(hasCrystal){completed=true;path=[];status.textContent='ผ่านดันเจี้ยนทดลองแล้ว'}
   else status.textContent='ประตูยังปิดอยู่ เก็บผลึกจันทร์ก่อน';
  }
  context.drawImage(ground,0,0,canvas.width,canvas.height);
  prop(stairs,exit);
  if(!hasCrystal)prop(ore,crystal);
  sealer.draw(context,player.x,player.y*flatten+10,cell*1.05,direction,phase,path.length>0,false,now);
  if(!completed)requestAnimationFrame(animate);
 }
 requestAnimationFrame(animate);
}

start().catch(error=>{
 title.textContent='เปิดดันเจี้ยนทดลองไม่ได้';
 status.textContent=error.message;
});
