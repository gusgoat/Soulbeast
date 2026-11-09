(function(g){'use strict';
// Coordinates are fractions of the full source image, including its transparent margins.
const forestLandmarks={
 1:[[.56,.31,.51,.57,.039],[.51,.72,.83,.76,.044]],
 2:[[.67,.22,.65,.37,.032],[.23,.49,.20,.69,.030],[.81,.58,.86,.76,.028]],
 5:[[.24,.59,.22,.86,.050],[.81,.54,.80,.77,.038],[.54,.36,.52,.51,.041]],
 7:[[.40,.25,.40,.36,.026],[.64,.30,.61,.42,.024],[.81,.37,.84,.51,.019]],
 8:[[.50,.71,.52,.92,.033]],
};
const forestPictures={
 1:[[.58,.60,.53,.73,.057],[.44,.74,.42,.95,.061],[.44,.91,.13,.98,.043]],
 2:[[.79,.58,.78,.88,.039],[.90,.63,.94,.91,.033]],
 5:[[.29,.63,.27,.94,.033],[.67,.67,.67,.94,.028]],
};
const mountain=[
 [.04,.73,.27,.83,.019],[.25,.85,.55,.95,.019],
 [.53,.94,.74,.86,.019],[.76,.84,.96,.67,.020],
];
const harbor=[
 [.17,.64,.34,.81,.032],[.36,.91,.65,.95,.032],[.71,.89,.89,.66,.031],
];

function place(site){
 if(site.id==='blue-city-3')return harbor;
 return site.type==='forest'?forestLandmarks[site.zoneId]:null;
}
function draw(ctx,lines,x,y,width,height,time,compact=false){
 if(!lines||width<=0||height<=0)return;
 ctx.save();
 ctx.lineCap='round';
 for(const [ax,ay,bx,by,extent] of lines){
  const dx=(bx-ax)*width,dy=(by-ay)*height,length=Math.hypot(dx,dy);
  if(!length)continue;
  const nx=-dy/length,ny=dx/length;
  const count=compact?4:8;
  const spread=extent*Math.min(width,height);
  for(let i=0;i<count;i++){
   const progress=(time*(.43+(i%3)*.09)+i/count)%1;
   const cross=Math.sin(i*8.89)*spread;
   const px=x+ax*width+dx*progress+nx*cross;
   const py=y+ay*height+dy*progress+ny*cross;
   const tail=Math.min(length*progress,Math.max(2,length*(.06+(i%3)*.025)));
   const fade=Math.sin(progress*Math.PI);
   ctx.beginPath();
   ctx.moveTo(px-dx/length*tail,py-dy/length*tail);
   ctx.quadraticCurveTo(px-nx*spread*.13,py-ny*spread*.13,px,py);
   ctx.strokeStyle=`rgba(200,245,255,${fade*(.19+(i%3)*.07)})`;
   ctx.lineWidth=Math.max(.65,spread*.13);
   ctx.stroke();
  }
 }
 ctx.restore();
}
function sources(site,lines,width,height){
 return (lines||[]).map(([ax,ay,bx,by,extent])=>({
  points:[
   {x:site.x+(ax-.5)*width,y:site.y+(ay-.94)*height/.64},
   {x:site.x+(bx-.5)*width,y:site.y+(by-.94)*height/.64},
  ],
  width:extent*2*width,
 }));
}
function picture(image,lines){
 if(!lines)return null;
 const canvas=document.createElement('canvas');
 canvas.className='forest-water-effect';
 canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d'),reduced=g.matchMedia('(prefers-reduced-motion: reduce)');
 const level=g.WalkGraphics?.read()??4;
 let frame=0,last=0,visible=false;
 function paint(now){
  if(!canvas.isConnected)return;
  frame=requestAnimationFrame(paint);
  if(now-last<32||!visible||document.hidden||reduced.matches||!image.naturalWidth)return;
  last=now;
  const width=canvas.clientWidth,height=canvas.clientHeight,scale=Math.min(g.devicePixelRatio||1,2);
  if(!width||!height)return;
  const pixelsWide=Math.round(width*scale),pixelsHigh=Math.round(height*scale);
  if(canvas.width!==pixelsWide||canvas.height!==pixelsHigh){canvas.width=pixelsWide;canvas.height=pixelsHigh;}
  ctx.setTransform(scale,0,0,scale,0,0);
  ctx.clearRect(0,0,width,height);
  const fit=Math.max(width/image.naturalWidth,height/image.naturalHeight);
  const artWidth=image.naturalWidth*fit,artHeight=image.naturalHeight*fit;
  draw(ctx,lines,(width-artWidth)/2,(height-artHeight)/2,artWidth,artHeight,now/1000,level<4||width<420);
 }
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});
 observer.observe(canvas);
 if(level>1)frame=requestAnimationFrame(paint);
 return {canvas,isVisible:()=>visible&&image.naturalWidth>0,stop:()=>{observer.disconnect();cancelAnimationFrame(frame);}};
}
g.LandmarkWater={place,draw,sources,picture,mountain,forestPictures};
})(window);
