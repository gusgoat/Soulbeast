(function(g){'use strict';
const TAU=2*Math.PI;
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const moonlight={red:'182,198,255',blue:'168,217,255',green:'182,223,255'};
const curtainColors=['93,255,194','91,210,255','176,130,255'];

function create(data,isWater){
 const {countryId,flatten}=data;
 const reduced=g.matchMedia('(prefers-reduced-motion: reduce)');
 const tiles={};
 function halo(key,rgb,stops){
  if(tiles[key])return tiles[key];
  const tile=g.document.createElement('canvas');tile.width=tile.height=96;
  const c=tile.getContext('2d'),paint=c.createRadialGradient(48,48,0,48,48,48);
  for(const [p,a] of stops)paint.addColorStop(p,'rgba('+rgb+','+a+')');
  c.fillStyle=paint;c.fillRect(0,0,96,96);
  return tiles[key]=tile;
 }
 const stamp=(c,tile,x,y,rx,ry)=>c.drawImage(tile,x-rx,y-ry,rx*2,ry*2);
 function openMoon(c,w,h,night){
  c.save();c.globalAlpha=.28*night;
  stamp(c,halo('moonMask','255,255,255',[[0,1],[.34,.68],[1,0]]),w*.24,h*.23,w*.81,h*.65);
  c.restore();
 }
 function drawMoon(c,w,h,night){
  const rgb=moonlight[countryId];
  c.save();c.globalCompositeOperation='screen';c.globalAlpha=night;
  // The country camera looks down at the terrain; cast light from above the screen.
  stamp(c,halo('moonAir',rgb,[[0,.26],[.22,.18],[.56,.07],[1,0]]),w*.23,h*.10,w*.84,h*.69);
  c.translate(w*.22,h*.18);c.rotate(-.57);
  stamp(c,halo('moonBeam',rgb,[[0,.18],[.24,.10],[.62,.045],[1,0]]),0,0,w*.24,h*.60);
  c.restore();
 }
 let aurora,auroraCtx,lastAurora='';
 function curtain(band){
  const key='curtain'+band;
  if(tiles[key])return tiles[key];
  const tile=g.document.createElement('canvas');tile.width=2;tile.height=64;
  const c=tile.getContext('2d'),paint=c.createLinearGradient(0,0,0,64);
  for(const [p,a] of [[0,0],[.26,.09],[.6,.38],[.78,.83],[.86,.66],[1,0]]){
   paint.addColorStop(p,'rgba('+curtainColors[band]+','+a+')');
  }
  c.fillStyle=paint;c.fillRect(0,0,2,64);
  return tiles[key]=tile;
 }
 function drawAurora(c,w,h,time,night,effects){
  if(!aurora){
   aurora=g.document.createElement('canvas');aurora.width=192;aurora.height=144;
   auroraCtx=aurora.getContext('2d');
  }
  // Redraw the soft curtains at 15 Hz in a tiny buffer, then blend as one layer.
  const tick=Math.floor(time*15),key=[tick,w,h,effects].join(':');
  const top=Math.max(77,h*.12),depth=clamp(h*.34,170,310);
  if(lastAurora!==key){
   lastAurora=key;
   const a=auroraCtx,aw=aurora.width,ah=aurora.height,step=effects===2?1:2;
   a.clearRect(0,0,aw,ah);
   for(let band=effects===2?2:1;band>=0;band--){
    const ribbon=curtain(band),t=tick/15;
    for(let x=0;x<aw;x+=step){
     const u=x/aw,p=u*TAU;
     const base=ah*(.56+band*.105+.125*Math.sin(p+band*.85+t*.25)+.06*Math.sin(p*1.8-t*.23+band));
     const height=ah*(.51+.10*Math.sin(p*1.6+band+t*.13));
     const folds=.82+.12*Math.sin(p*13+band+t*.4)+.06*Math.sin(p*27-t*.29);
     a.globalAlpha=(band===0?.77:.52)*folds*(.49+.51*Math.sin(Math.PI*u));
     a.drawImage(ribbon,x,base-height,step,height);
    }
   }
  }
  c.save();c.globalCompositeOperation='screen';c.globalAlpha=night;
  c.drawImage(aurora,0,top,w,depth);c.restore();
 }
 function hash(x,y){
  let v=Math.imul(x,374761393)^Math.imul(y,668265263);
  v=Math.imul(v^(v>>>13),1274126177);
  return ((v^(v>>>16))>>>0)/4294967296;
 }
 const dryCells=new Map();
 function drawFireflies(c,view,time,night,effects){
  const {w,h,sx,sy,cam,zoom}=view,step=effects===2?128:163,stepY=step/flatten;
  const startX=Math.max(0,Math.floor((cam.x-w/(2*zoom))/step)-1);
  const startY=Math.max(0,Math.floor((cam.y-h*.57/(zoom*flatten))/stepY)-1);
  const endX=Math.min(Math.floor(data.width/step),Math.ceil((cam.x+w/(2*zoom))/step)+1);
  const endY=Math.min(Math.floor(data.height/stepY),Math.ceil((cam.y+h*.43/(zoom*flatten))/stepY)+1);
  const glow=halo('firefly','204,255,105',[[0,.86],[.28,.36],[.65,.11],[1,0]]);
  c.save();c.globalCompositeOperation='screen';
  for(let ix=startX;ix<=endX;ix++)for(let iy=startY;iy<=endY;iy++){
   const seed=hash(ix,iy);
   if(seed<.22)continue;
   const wx=(ix+hash(iy+113,ix)*.86)*step,wy=(iy+seed*.87)*stepY;
   const phase=seed*TAU,drift=time*(.48+seed*.42);
   const x=sx(wx)+Math.cos(drift+phase)*12;
   const y=sy(wy)-12+Math.sin(drift*.78+phase)*8;
   if(x<-18||x>w+18||y<-18||y>h+18)continue;
   const key=(step*1024+iy)*1024+ix;
   if(!dryCells.has(key))dryCells.set(key,!isWater(wx,wy));
   if(!dryCells.get(key))continue;
   const pulse=.18+.82*Math.pow(.5+.5*Math.sin(time*(1.1+seed*.95)+phase*3),2);
   c.globalAlpha=night*pulse;
   const r=(7+4*seed)*(effects===2?1.16:1);
   stamp(c,glow,x,y,r,r);
   c.fillStyle='#edffb7';c.beginPath();c.arc(x,y,1+seed*.62,0,TAU);c.fill();
  }
  c.restore();
 }
 function paintLava(c,sources,night,time,mask){
  if(!sources.length)return;
  const warm=mask?halo('lavaMask','255,255,255',[[0,.98],[.25,.88],[.55,.45],[1,0]])
   :halo('lavaLight','255,82,23',[[0,.65],[.21,.46],[.51,.20],[1,0]]);
  const bright=mask?null:halo('lavaCore','255,177,64',[[0,.76],[.28,.42],[.67,.10],[1,0]]);
  c.save();
  if(!mask)c.globalCompositeOperation='screen';
  for(const {x,y,rx,ry,seed,power} of sources){
   const pulse=.90+.07*Math.sin(time*2.5+seed)+.03*Math.sin(time*5.2+seed*2);
   c.globalAlpha=pulse*power*(mask?.94:(.64+.36*night)*night);
   stamp(c,warm,x,y,rx,ry);
   if(bright)stamp(c,bright,x,y,rx*.46,ry*.51);
  }
  c.restore();
 }
 function open(c,w,h,night,time,sources){
  openMoon(c,w,h,night);
  paintLava(c,sources,night,reduced.matches?0:time,true);
 }
 function draw(c,view,night,time,effects,sources){
  if(night<=.005||!effects)return;
  if(reduced.matches)time=0;
  const {w,h}=view;
  if(countryId==='blue')drawAurora(c,w,h,time,night,effects);
  drawMoon(c,w,h,night);
  if(countryId==='green')drawFireflies(c,view,time,night,effects);
  if(countryId==='red')paintLava(c,sources,night,time,false);
 }
 return {open,draw};
}
g.CountryNight={create};
})(window);
