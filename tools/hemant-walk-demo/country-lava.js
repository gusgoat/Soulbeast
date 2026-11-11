(function(g){'use strict';
const TAU=Math.PI*2;
const artRoot='/Soulbeast/assets/country-walk/red/lava-terrain-v1/';
const art=Object.freeze({
 lavaPool1:artRoot+'pool-1.webp',lavaPool2:artRoot+'pool-2.webp',
 lavaPool3:artRoot+'pool-3.webp',lavaPool4:artRoot+'pool-4.webp',lavaFissure:artRoot+'fissure.webp'
});
const vents=[
 [[-.20,.10],[.19,.07]],
 [[0,.13]],
 [[-.23,.07],[.16,.22]],
 [[-.25,.14],[.24,-.15]]
];
const volcanoVents=[[.54,.15,.11],[.31,.48,.06],[.70,.66,.06]];

function create(data,nav,terrain){
 const pools=[],cracks=[],flatten=data.flatten;
 if(data.countryId==='red'){
  let seed=9143;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  function open(point,margin,roadLimit){
   if(!terrain.insideEnclosure(point.x,point.y)||terrain.blocked(point.x,point.y))return false;
   const roadDistance=nav.nearest(point).distance;
   return roadDistance>margin+100&&roadDistance<roadLimit&&!terrain.water.raw(point.x,point.y,margin+120)&&
    nav.places.every(place=>nav.distance(place,point)>margin+300);
  }
  function addPool(point,radius,volcano=null){
   const spacing=volcano?225:530;
   if(!open(point,radius,volcano?720:480)||pools.some(pool=>nav.distance(pool,point)<spacing))return false;
   const variant=pools.length%vents.length;
   pools.push({...point,radius,variant,flip:random()<.5,seed:random()*10,volcano});
   return true;
  }
  // Give each volcano a cluster, then scatter a few pools along the rest of the map.
  for(const mountain of terrain.mountains.filter(m=>!m.border)){
   let placed=0;
   const start=random()*TAU;
   for(let i=0;i<42&&placed<6;i++){
    const angle=start+i*2.39996;
    const distance=mountain.w*(.42+random()*.43);
    const point={x:mountain.x+Math.cos(angle)*distance,y:mountain.y+Math.sin(angle)*distance/flatten};
    if(addPool(point,62+random()*36,mountain))placed++;
   }
  }
  for(let band=0;band<6;band++){
   let placed=0;
   for(let i=0;i<100&&placed<2;i++){
    const point={x:(.09+random()*.82)*data.width,y:(band+.16+random()*.68)*data.height/6};
    if(addPool(point,74+random()*54))placed++;
   }
  }
  for(let i=0;i<220&&cracks.length<26;i++){
   const point={x:(.08+random()*.84)*data.width,y:(.08+random()*.84)*data.height};
   const length=145+random()*105;
   if(open(point,length/2,480)&&pools.every(pool=>nav.distance(pool,point)>pool.radius+length/2)&&
    cracks.every(crack=>nav.distance(crack,point)>150)){
    cracks.push({...point,length,flip:random()<.5,seed:random()*10});
   }
  }
 }

 const poolImage=(pool,images)=>images['lavaPool'+(pool.variant+1)];
 function drawDecal(ctx,point,image,width){
  if(!image?.naturalWidth)return;
  const height=width*image.naturalHeight/image.naturalWidth;
  ctx.save();ctx.translate(point.x,point.y*flatten);if(point.flip)ctx.scale(-1,1);
  ctx.drawImage(image,-width/2,-height/2,width,height);
  ctx.restore();
 }
 function drawGround(ctx,images){
  for(const crack of cracks)drawDecal(ctx,crack,images.lavaFissure,crack.length);
  for(const pool of pools)drawDecal(ctx,pool,poolImage(pool,images),pool.radius*2.15);
 }

 let haze;
 function shimmer(ctx,x,y,scale,time,seed,width,height){
  const left=x-scale*.63,top=y-scale*1.62,w=scale*1.26,h=scale*1.66;
  if(scale<12||left<0||top<0||left+w>width||top+h>height||!g.document)return;
  if(!haze){
   haze=g.document.createElement('canvas');
   haze.width=64;haze.height=80;
  }
  const buffer=haze.getContext('2d');
  const {a,d}=ctx.getTransform();
  buffer.clearRect(0,0,haze.width,haze.height);
  buffer.drawImage(ctx.canvas,left*a,top*d,w*a,h*d,0,0,haze.width,haze.height);
  ctx.save();
  for(let i=0;i<10;i++){
   const v=(i+.5)/10,fade=Math.sin(v*Math.PI);
   const inset=(1-fade)*22;
   const offset=Math.sin(time*5-v*16+seed)*Math.min(2.5,scale*.06)*fade;
   ctx.globalAlpha=.35*fade;
   ctx.drawImage(haze,inset,i*8,64-2*inset,8,
    left+inset*w/64+offset,top+i*h/10,(64-2*inset)*w/64,h/10+.3);
  }
  ctx.restore();
 }
 function heat(ctx,x,y,scale,time,seed,compact,width,height){
  if(x< -100||x>width+100||y< -40||y>height+145)return;
  if(!compact)shimmer(ctx,x,y,scale,time,seed,width,height);
  ctx.save();
  const count=compact?2:4;
  for(let i=0;i<count;i++){
   const cycle=(time*.42+i/count+seed)%1;
   const px=x+Math.sin(time*1.6+i+seed)*scale*(.08+cycle*.28);
   const py=y-cycle*scale*1.58;
   const radius=scale*(.18+.38*cycle);
   const glow=ctx.createRadialGradient(px,py,0,px,py,radius);
   glow.addColorStop(0,'#ffcf9b66');glow.addColorStop(1,'#fcb88400');
   ctx.globalAlpha=Math.sin(cycle*Math.PI)*.64;
   ctx.fillStyle=glow;ctx.fillRect(px-radius,py-radius,radius*2,radius*2);
   if(i%2===0){
    ctx.globalAlpha=(1-cycle)*.7;
    ctx.fillStyle='#ffc271';ctx.beginPath();ctx.arc(px,py,Math.max(.75,scale*.022),0,TAU);ctx.fill();
   }
  }
  ctx.restore();
 }

 function drawGroundHeat(ctx,sx,sy,zoom,time,compact,width,height,images){
  for(const pool of pools){
   const im=poolImage(pool,images);
   if(!im?.naturalWidth)continue;
   const w=pool.radius*2.15*zoom,h=w*im.naturalHeight/im.naturalWidth;
   const points=vents[pool.variant];
   for(let i=0;i<(compact?1:points.length);i++){
    const [x,y]=points[i];
    heat(ctx,sx(pool.x)+x*w*(pool.flip?-1:1),sy(pool.y)+y*h,w*.27,time,pool.seed+i,compact,width,height);
   }
  }
  for(const crack of cracks){
   heat(ctx,sx(crack.x),sy(crack.y),crack.length*zoom*.22,time,crack.seed,compact,width,height);
  }
 }
 function drawVolcanoHeat(ctx,x,y,width,height,time,compact,viewWidth,viewHeight){
  for(let i=0;i<(compact?2:volcanoVents.length);i++){
   const [u,v,size]=volcanoVents[i];
   heat(ctx,x+(u-.5)*width,y+(v-.94)*height,width*size,time,u*4,compact,viewWidth,viewHeight);
  }
 }
 // Use the same pool art, projection and vent positions as the heat layer.
 const lights=[];
 function nightLights(scenery,sx,sy,z,w,h,images,effects){
  lights.length=0;
  if(data.countryId!=='red')return lights;
  function add(x,y,rx,ry,seed,power){
   if(x+rx>0&&x-rx<w&&y+ry>0&&y-ry<h)lights.push({x,y,rx,ry,seed,power});
  }
  for(const pool of pools){
   const image=poolImage(pool,images);
   if(!image?.naturalWidth)continue;
   const width=pool.radius*2.15*z,height=width*image.naturalHeight/image.naturalWidth;
   add(sx(pool.x),sy(pool.y)+.10*height,width*1.45,height*1.65,pool.seed,.92);
  }
  for(const crack of cracks){
   if(!images.lavaFissure?.naturalWidth)break;
   const width=crack.length*z;
   add(sx(crack.x),sy(crack.y),width*.8,width*.27,crack.seed,.48);
  }
  for(const o of scenery){
   if(o.kind!=='mountain'||o.border||!images.mountain?.naturalWidth)continue;
   const width=o.w*z,height=width*images.mountain.naturalHeight/images.mountain.naturalWidth;
   const x=sx(o.x),y=sy(o.y);
   for(let i=0;i<(effects===2?volcanoVents.length:2);i++){
    const [u,v,size]=volcanoVents[i],radius=width*size;
    add(x+(u-.5)*width,y+(v-.94)*height,radius*2.8,radius*1.95,o.x*.002+i,.87);
   }
  }
  return lights;
 }
 return {pools,cracks,drawGround,drawGroundHeat,drawVolcanoHeat,nightLights};
}
const api={art,create};g.CountryLava=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
