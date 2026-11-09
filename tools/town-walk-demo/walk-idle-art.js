(function(g){
 'use strict';
 const poses=[-1,-.3,.88,.34];
 const frameDuration=.38;
 const cache=new WeakMap();

 function makeCanvas(width,height){
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  return canvas;
 }

 function makeFrames(image,source){
  const scale=Math.min(1,256/Math.max(source.width,source.height));
  const width=Math.max(1,Math.round(source.width*scale));
  const height=Math.max(1,Math.round(source.height*scale));
  const padding=Math.ceil(height*.026)+2;
  const base=makeCanvas(width,height);
  const ctx=base.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(image,source.x,source.y,source.width,source.height,0,0,width,height);
  const pixels=ctx.getImageData(0,0,width,height).data;
  let top=height,bottom=-1;
  for(let y=0;y<height;y++){
   for(let x=0;x<width;x++){
    if(pixels[(y*width+x)*4+3]<32)continue;
    top=Math.min(top,y);
    bottom=y;
    break;
   }
  }
  const bodyHeight=Math.max(1,bottom-top);
  const frames=poses.map(pose=>{
   const canvas=makeCanvas(width+padding*2,height);
   const frame=canvas.getContext('2d');
   for(let y=0;y<height;y+=2){
    const band=Math.min(2,height-y);
    const position=Math.max(0,(y-top)/bodyHeight);
    // Bend the head and shoulders while keeping the lower body on the ground.
    const lean=Math.max(0,1-position/.49)**2;
    const shoulders=Math.max(0,1-Math.abs(position-.3)/.22)**2;
    const offset=pose*height*.017*lean;
    const stretch=pose*width*.025*shoulders;
    frame.drawImage(base,0,y,width,band,padding+offset-stretch/2,y,width+stretch,band);
   }
   return canvas;
  });
  return {frames,padding:padding/width};
 }

 function drawNpc(ctx,image,source,x,y,width,height,time,phase){
  if(!image.naturalWidth)return;
  source??={x:0,y:0,width:image.naturalWidth,height:image.naturalHeight};
  if(time===null){
   ctx.drawImage(image,source.x,source.y,source.width,source.height,x,y,width,height);
   return;
  }
  let crops=cache.get(image);
  if(!crops){crops=new Map();cache.set(image,crops);}
  const key=`${source.x},${source.y},${source.width},${source.height}`;
  if(!crops.has(key))crops.set(key,makeFrames(image,source));
  const {frames,padding}=crops.get(key);
  const frame=Math.floor((time+phase)/frameDuration)%frames.length;
  const bleed=width*padding;
  ctx.drawImage(frames[frame],x-bleed,y,width+bleed*2,height);
 }

 const flagCache=new WeakMap();
 const flagFrameDuration=.16;

 function makeFlagFrames(image){
  const width=120,height=80,padding=10;
  return poses.map((_,index)=>{
   const canvas=makeCanvas(width,height+2*padding),frame=canvas.getContext('2d');
   for(let x=0;x<width;x+=2){
    const position=x/width;
    // The wave starts at the free end. The strip touching the pole stays fixed.
    const wave=Math.sin(position*5.4-index*Math.PI/2);
    const lift=position*wave*padding*.75;
    frame.drawImage(image,x/width*image.naturalWidth,0,2/width*image.naturalWidth,image.naturalHeight,x,padding+lift,2,height);
   }
   return {canvas,padding:padding/height};
  });
 }

 function drawFlag(ctx,image,x,y,width,height,time,phase){
  if(!image.naturalWidth)return;
  if(time===null){
   ctx.drawImage(image,x,y,width,height);
   return;
  }
  if(!flagCache.has(image))flagCache.set(image,makeFlagFrames(image));
  const frames=flagCache.get(image);
  const frame=frames[Math.floor((time+phase)/flagFrameDuration)%frames.length];
  const bleed=height*frame.padding;
  ctx.drawImage(frame.canvas,x,y-bleed,width,height+2*bleed);
 }

 g.WalkIdleArt={drawNpc,drawFlag};
})(window);
