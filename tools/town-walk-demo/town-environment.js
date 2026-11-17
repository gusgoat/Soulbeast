(()=>{'use strict';
const files={cart:'decor-cart-v2.png.webp',bush:'decor-bush-v2.png.webp',clock:'decor-clock-v2.png.webp',well:'decor-well-v2.png.webp',notice:'decor-notice-v2.png.webp',pond:'decor-pond-v2.png.webp',wallh:'wall-h-v1.png.webp',wallv:'wall-v-v1.png.webp',lamp:'lamp-v1.png.webp',grass:'grass-v1.png.webp',paving:'paving-v1.png.webp',tree1:'tree-variant1-v1.png.webp',tree2:'tree-variant2-v1.png.webp',tree3:'tree-variant3-v1.png.webp',southgate:'south-gate-structure-v1.png.webp'};
if(window.townTheme.id==='red')files.grass='/Soulbeast/assets/country-walk/red/ground.png.webp';
const images={};for(const [id,file]of Object.entries(files)){const im=new Image();im.src=file.startsWith('/')?file:window.townTheme.asset(file);images[id]=im}
for(const [id,file] of Object.entries({snow:'snow-v1.png.webp',pine:'pine-v2.png.webp'})){const im=new Image();im.src='/Soulbeast/assets/hemant-walk-preview/'+file;images[id]=im}
const lamps=[{x:810,y:965},{x:1130,y:965},{x:810,y:1185},{x:1130,y:1185},{x:370,y:1080},{x:1530,y:1080},{x:780,y:1640},{x:1160,y:1640},{x:1810,y:965},{x:2130,y:1185},{x:1870,y:1640}];
function pavingLayout(sites,village){
 const roads=[],plazas=[];
 const road=(x,y,X,Y,width)=>roads.push({a:{x,y},b:{x:X,y:Y},width});
 if(village){
  road(800,490,800,1490,80);road(470,865,1120,825,72);
  for(const site of sites)road(site.x,site.y+65,800,site.y+65,60);
  plazas.push({x:800,y:950,rx:140,ry:75});
 }else{
  road(970,510,970,1870,115);road(40,1030,2410,1030,110);
  road(470,700,1510,700,85);road(490,700,490,1540,85);road(1440,560,1440,1430,85);
  road(490,1450,2150,1450,80);road(1770,700,2150,700,85);road(1960,700,1960,1690,85);
  road(490,1260,260,1260,48);road(970,1385,1130,1385,60);
  for(const {id,x,y} of sites){
   if(['west','east','exit'].includes(id))continue;
   const entrance=y+65;
   road(x,entrance,id==='shop'?970:id==='hospital'?1440:x,
    id==='shop'||id==='hospital'?entrance:Math.round(entrance/350)*350,60);
  }
  road(970,1755,970,1850,158);
  plazas.push({x:970,y:1040,rx:185,ry:120},{x:285,y:760,rx:73,ry:46.7},
   {x:755,y:1530,rx:55,ry:35.2});
 }
 return {roads,plazas};
}
function makeGround(g,sites,size,F,width=size,landscaping){
 if(landscaping){
  const village=window.townTheme.profile?.village;
  const winter=landscaping.country==='blue';
  const lawn=g.createPattern(winter?images.snow:images.grass,'repeat');
  lawn.setTransform(new DOMMatrix().scale(.45));
  g.fillStyle=lawn;g.fillRect(0,0,width,size*F);
  LivingEnvironment.patches(g,width,size,landscaping.country,landscaping.seed,village?18:28);
  CountryPathArt.paintSettlement(g,landscaping.layout,F,landscaping.art,landscaping.country);
  if(!village)window.townDecor.drawPond(g,F);
  return;
 }
 if(window.townTheme.profile?.village){window.villageLayout.makeGround(g,sites,size,F,width,images);return}
 const lawn=g.createPattern(window.townTheme.winter?images.snow:images.grass,'repeat');lawn.setTransform(new DOMMatrix().scale(.27));const stone=g.createPattern(images.paving,'repeat');stone.setTransform(new DOMMatrix().scale(.25));
 g.fillStyle=lawn;g.fillRect(0,0,width,size*F);window.LivingEnvironment?.patches(g,width,size,window.townTheme.id,window.LivingEnvironment.hash(window.townTheme.profile?.id||'capital'),28);g.lineCap='round';g.lineJoin='round';
 function road(a,b,width){for(const [extra,color]of [[12,'#92937e'],[0,stone]]){g.lineWidth=width+extra;g.strokeStyle=color;g.beginPath();g.moveTo(a[0],a[1]*F);g.lineTo(b[0],b[1]*F);g.stroke()}}
 road([970,510],[970,1870],115);road([40,1030],[2410,1030],110);road([470,700],[1510,700],85);road([490,700],[490,1540],85);road([1440,560],[1440,1430],85);road([490,1450],[1440,1450],80);
 road([1770,700],[2150,700],85);road([1960,700],[1960,1690],85);road([1440,1450],[2150,1450],80);
 for(const s of sites)if(!['west','east','exit'].includes(s.id))road([s.x,s.y+65],[s.id==='shop'?970:s.id==='hospital'?1440:s.x,s.id==='shop'||s.id==='hospital'?s.y+65:Math.round((s.y+65)/350)*350],60);
 g.fillStyle='#92937e';g.beginPath();g.ellipse(970,1040*F,185,120,0,0,7);g.fill();g.fillStyle=stone;g.beginPath();g.ellipse(970,1040*F,177,112,0,0,7);g.fill();
 // The south gateway threshold belongs to the ground layer, always below actors.
 g.fillStyle=stone;g.fillRect(885,1730*F,170,140*F);window.townDecor.ground(g,F,stone);
 if(window.townTheme.winter){g.fillStyle='#c4e3f035';g.fillRect(0,0,width,size*F);}else if(window.townTheme.id==='red'){g.save();g.globalCompositeOperation='color';g.fillStyle='#9b503e';g.fillRect(0,0,width,size*F);g.restore();}
}
function drawLamp(c,x,y,z,time,shadows){const h=180*z,w=h*images.lamp.width/images.lamp.height;(shadows?.sprite(c,x,y)??c).drawImage(images.lamp,x-w*.45,y-h*.97,w,h);c.save();c.globalCompositeOperation='screen';const glow=c.createRadialGradient(x+27*z,y-91*z,0,x+27*z,y-91*z,25*z);glow.addColorStop(0,'rgba(255,213,124,'+(.11+Math.sin(time*3)*.015)+')');glow.addColorStop(1,'rgba(255,213,124,0)');c.fillStyle=glow;c.fillRect(x,y-120*z,55*z,55*z);c.restore()}
function drawSouthGate(c,x,y,z,shadows){const w=390*z,h=w*images.southgate.height/images.southgate.width;(shadows?.sprite(c,x,y)??c).drawImage(images.southgate,x-w/2,y-h*.9,w,h)}
let warmGlow,lightOpening;
function lightTile(rgb){
 const tile=document.createElement('canvas');tile.width=tile.height=96;
 const ctx=tile.getContext('2d'),gradient=ctx.createRadialGradient(48,48,0,48,48,48);
 for(const [stop,alpha] of [[0,.94],[.27,.73],[.62,.29],[1,0]]){
  gradient.addColorStop(stop,'rgba('+rgb+','+alpha+')');
 }
 ctx.fillStyle=gradient;ctx.fillRect(0,0,96,96);
 return tile;
}
function glowOnGround(c,x,y,z,night){
 warmGlow??=lightTile('255,188,86');
 c.save();
 c.globalCompositeOperation='screen';
 c.globalAlpha=night*.36;
 c.drawImage(warmGlow,x-105*z,y-55*z,260*z,123*z);
 c.restore();
}
function openNightLamp(c,x,y,z){
 lightOpening??=lightTile('255,255,255');
 c.drawImage(lightOpening,x-126*z,y-66*z,302*z,148*z);
 c.drawImage(lightOpening,x-31*z,y-151*z,116*z,118*z);
}
function glowAtBulb(c,x,y,z,night){
 warmGlow??=lightTile('255,188,86');
 c.save();
 c.globalCompositeOperation='screen';
 c.globalAlpha=night*.30;
 c.drawImage(warmGlow,x-17*z,y-133*z,88*z,84*z);
 c.restore();
}
window.townEnvironment={images,lamps,pavingLayout,makeGround,drawLamp,drawSouthGate,glowOnGround,openNightLamp,glowAtBulb};
})();
