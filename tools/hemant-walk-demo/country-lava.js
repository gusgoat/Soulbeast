(function(g){'use strict';
const TAU=Math.PI*2;

function create(data,nav,terrain){
 const pools=[],cracks=[],flatten=data.flatten;
 if(data.countryId==='red'){
  let seed=9143;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const open=(point,margin)=>{
   if(!terrain.insideEnclosure(point.x,point.y))return false;
   const roadDistance=nav.nearest(point).distance;
   return roadDistance>margin+110&&roadDistance<480&&!terrain.water.raw(point.x,point.y,margin+120)&&
    nav.places.every(place=>nav.distance(place,point)>margin+300);
  };
  for(let band=0;band<6;band++){
   for(let i=0;i<100;i++){
    const point={x:(.09+random()*.82)*data.width,y:(band+.16+random()*.68)*data.height/6};
    const radius=74+random()*54;
    if(!open(point,radius)||pools.some(pool=>nav.distance(pool,point)<530))continue;
    pools.push({...point,radius,angle:random()*TAU,seed:random()*10});
    if(pools.length>=2*(band+1))break;
   }
  }
  for(let i=0;i<170&&cracks.length<26;i++){
   const point={x:(.08+random()*.84)*data.width,y:(.08+random()*.84)*data.height};
   const length=95+random()*100;
   if(open(point,length/2)&&pools.every(pool=>nav.distance(pool,point)>pool.radius+length/2))
    cracks.push({...point,length,angle:random()*TAU,seed:random()*10});
  }
 }

 function drawGround(ctx){
  for(const pool of pools){
   const {x,y,radius,angle,seed}=pool;
   ctx.save();ctx.translate(x,y*flatten);ctx.scale(1,flatten);ctx.rotate(angle);
   ctx.beginPath();
   for(let i=0;i<18;i++){
    const a=i*TAU/18,r=radius*(.83+.14*Math.sin(3*a+seed)+.07*Math.cos(5*a));
    const px=Math.cos(a)*r,py=Math.sin(a)*r*.72;
    if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
   }
   ctx.closePath();ctx.lineJoin='round';ctx.strokeStyle='#302220';ctx.lineWidth=24;ctx.stroke();
   const glow=ctx.createRadialGradient(-radius*.22,0,6,0,0,radius);
   glow.addColorStop(0,'#fff1a0');glow.addColorStop(.29,'#ffb333');
   glow.addColorStop(.73,'#e74913');glow.addColorStop(1,'#6b241a');
   ctx.fillStyle=glow;ctx.fill();ctx.strokeStyle='#a84424';ctx.lineWidth=5;ctx.stroke();
   ctx.restore();
  }
  for(const crack of cracks){
   const {x,y,length,angle,seed}=crack;
   ctx.save();ctx.translate(x,y*flatten);ctx.scale(1,flatten);ctx.rotate(angle);
   ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
   for(let i=0;i<=7;i++){
    const px=(i/7-.5)*length,py=i===0||i===7?0:Math.sin(i*2.7+seed)*15;
    if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
    if(i===2||i===5){ctx.lineTo(px+12,py+(i===2?-26:30));ctx.moveTo(px,py);}
   }
   ctx.strokeStyle='#3a241e';ctx.lineWidth=13;ctx.stroke();
   ctx.strokeStyle='#ac4825';ctx.lineWidth=5;ctx.stroke();
   ctx.strokeStyle='#ee7b36';ctx.lineWidth=1.8;ctx.stroke();ctx.restore();
  }
 }

 function heat(ctx,x,y,scale,time,seed,compact,width,height){
  if(x< -100||x>width+100||y< -40||y>height+145)return;
  ctx.save();
  const count=compact?3:6;
  for(let i=0;i<count;i++){
   const cycle=(time*.48+i/count+seed)%1;
   const px=x+Math.sin(time*1.7+i+seed)*scale*(.1+cycle*.35);
   const py=y-cycle*scale*1.5;
   const radius=scale*(.22+.34*cycle);
   const glow=ctx.createRadialGradient(px,py,0,px,py,radius);
   glow.addColorStop(0,'#ffd3a25a');glow.addColorStop(1,'#ffac6200');
   ctx.globalAlpha=Math.sin(cycle*Math.PI)*.65;
   ctx.fillStyle=glow;ctx.fillRect(px-radius,py-radius,radius*2,radius*2);
   if(i%2===0){
    ctx.strokeStyle='#ffd09a';
    ctx.lineWidth=Math.max(1,scale*.022);
    ctx.globalAlpha=Math.sin(cycle*Math.PI)*.22;
    ctx.beginPath();ctx.moveTo(px,py+scale*.31);
    ctx.quadraticCurveTo(px-scale*.16,py+scale*.17,px+scale*.08,py);
    ctx.stroke();
    ctx.globalAlpha=(1-cycle)*.85;
    ctx.fillStyle='#ffb85d';ctx.beginPath();ctx.arc(px,py,Math.max(1,scale*.028),0,TAU);ctx.fill();
   }
  }
  ctx.restore();
 }

 function drawPoolHeat(ctx,sx,sy,zoom,time,compact,width,height){
  for(const pool of pools)heat(ctx,sx(pool.x),sy(pool.y),pool.radius*zoom*.72,time,pool.seed,compact,width,height);
 }
 function drawVolcanoHeat(ctx,x,y,width,height,time,compact,viewWidth,viewHeight){
  for(const [u,v,size] of [[.54,.15,.07],[.31,.48,.045],[.70,.66,.045]]){
   heat(ctx,x+(u-.5)*width,y+(v-.94)*height,width*size,time,u*4,compact,viewWidth,viewHeight);
  }
 }
 return {pools,cracks,drawGround,drawPoolHeat,drawVolcanoHeat};
}
const api={create};g.CountryLava=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
