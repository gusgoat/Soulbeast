(function(g){'use strict';
const styles={
 green:{rgb:'250,190,92'},
 blue:{rgb:'136,217,255'},
 red:{rgb:'255,140,57'}
};
const directions=['left','right','away','toward'];
const spriteW=136,spriteH=186;
function facing(x,y){return Math.abs(x)>.62?(x<0?'left':'right'):(y<0?'away':'toward');}
function create(data,nav,terrain,excluded=[]){
 const {flatten:F,countryId}=data,{rgb}=styles[countryId]||styles.blue;
 const poles=[];
 const sprites=Object.fromEntries(directions.map(dir=>{
  const image=new Image();
  image.src='/Soulbeast/assets/country-walk/road-lamps-v1/'+countryId+'-'+dir+'.webp';
  return [dir,image];
 }));
 const reduceMotion=g.matchMedia('(prefers-reduced-motion: reduce)');
 // Anchor each post to the shoulder in projected map units. The arm faces the road.
 for(const [i,[ai,bi]] of nav.edges.entries()){
  const a=nav.nodes[ai],b=nav.nodes[bi],dx=b.x-a.x,dy=(b.y-a.y)*F,len=Math.hypot(dx,dy);
  if(len<195)continue;
  const count=Math.max(1,Math.round(len/375));
  for(let j=0;j<count;j++){
   const t=(j+.5)/count,foot={x:a.x+t*dx,y:a.y+t*(b.y-a.y)};
   const nx=-dy/len,ny=dx/len,side=(i+j)%2===0?1:-1;
   let pole=null;
   for(const s of [side,-side]){
    for(const setback of [132,151,172]){
     const x=foot.x+nx*s*setback,y=foot.y+ny*s*setback/F,p={x,y};
     if(!nav.walkable(x,y)||terrain.water.raw(x,y,42)||terrain.water.onBridge(x,y))continue;
     if(nav.nearest(p).distance<119||nav.places.some(o=>nav.distance(o,p)<(o.type==='capital'?340:245)))continue;
     if(excluded.some(o=>nav.distance(o,p)<(o.clearance??(o.w?Math.min(125,o.w*.50):70))))continue;
     if(poles.some(o=>nav.distance(o,p)<225))continue;
     pole={...p,kind:'roadLamp',dir:facing(-nx*s,-ny*s),phase:((i*97+j*31)%89)*.17,
      lightX:x+(foot.x-x)*.60,lightY:y+(foot.y-y)*.60};
     break;
    }
    if(pole)break;
   }
   if(pole)poles.push(pole);
  }
 }

 // Small cached halos let both mobile and desktop reuse the same textures.
 function halo(stops){
  const tile=g.document.createElement('canvas');tile.width=96;tile.height=96;
  const ctx=tile.getContext('2d'),light=ctx.createRadialGradient(48,48,0,48,48,48);
  for(const [r,a] of stops)light.addColorStop(r,'rgba('+rgb+','+a+')');
  ctx.fillStyle=light;ctx.fillRect(0,0,96,96);return tile;
 }
 let ground,bloom,opening;
 const pulse=(o,time)=>reduceMotion.matches?1:.92+.07*Math.sin(time*1.95+o.phase)+.025*Math.sin(time*4.9+o.phase*2);
 function drawGround(c,o,sx,sy,z,time,effects,night=0){
  if(!sprites[o.dir]?.naturalWidth||!effects)return;
  ground??=halo([[0,.72],[.34,.55],[.67,.19],[1,0]]);
  const w=(262+93*night)*z,h=(137+59*night)*z;
  c.save();c.globalAlpha=pulse(o,time)*(.46+.54*night);c.drawImage(ground,sx(o.lightX)-w/2,sy(o.lightY)-h/2,w,h);c.restore();
 }
 function draw(c,o,x,y,z,time,effects,night=0){
  const image=sprites[o.dir];if(!image?.naturalWidth)return;
  const w=spriteW*z,h=spriteH*z;
  c.save();
  c.fillStyle='#10212955';c.beginPath();c.ellipse(x,y-2*z,24*z,7*z,0,0,Math.PI*2);c.fill();
  c.drawImage(image,x-w/2,y-h,w,h);
  if(effects){
   bloom??=halo([[0,.82],[.25,.61],[.55,.25],[1,0]]);
   const [lx,ly]=lens[countryId]?.[o.dir]??[.5,.32];
   const size=((effects===2?91:73)+40*night)*z;
   c.globalAlpha=pulse(o,time)*(.72+.28*night);c.drawImage(bloom,x-w/2+w*lx-size/2,y-h+h*ly-size/2,size,size);
  }
  c.restore();
 }
 function openLight(c,o,sx,sy,z,time){
  if(!sprites[o.dir]?.naturalWidth)return;
  opening??=halo([[0,.88],[.4,.66],[.7,.25],[1,0]]);
  const [lx,ly]=lens[countryId]?.[o.dir]??[.5,.32];
  const x=sx(o.x)+(lx-.5)*spriteW*z,y=sy(o.y)+(ly-1)*spriteH*z;
  c.globalAlpha=pulse(o,time);
  c.drawImage(opening,sx(o.lightX)-182*z,sy(o.lightY)-102*z,364*z,204*z);
  c.drawImage(opening,x-70*z,y-70*z,140*z,140*z);
  c.globalAlpha=1;
 }
 return {poles,draw,drawGround,openLight,bounds:o=>({left:o.x-180,right:o.x+180,top:o.y*F-spriteH-24,bottom:o.y*F+92})};
}
const lens={"green":{"left":[0.221,0.362],"right":[0.783,0.36],"away":[0.386,0.354],"toward":[0.503,0.379]},"blue":{"left":[0.22,0.394],"right":[0.786,0.395],"away":[0.336,0.325],"toward":[0.504,0.39]},"red":{"left":[0.204,0.436],"right":[0.79,0.436],"away":[0.371,0.395],"toward":[0.503,0.431]}};
g.CountryRoadLamps={create};
})(window);
