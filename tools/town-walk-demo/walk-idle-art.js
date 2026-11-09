(function(g){
 'use strict';
 const frameEnds=[.65,1.02,1.48,1.84];
 const atlasRoot='/Soulbeast/assets/ui/npc-idle-v2/';
 const atlases=new Map(),motions=new WeakMap();
 const reducedMotion=g.matchMedia('(prefers-reduced-motion: reduce)');

 function makeCanvas(width,height){
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  return canvas;
 }

 function motionFor(image,source){
  let crops=motions.get(image);
  if(!crops){crops=new Map();motions.set(image,crops);}
  const index=source?Math.floor(source.y/source.height)*4+Math.floor(source.x/source.width):-1;
  if(crops.has(index))return crops.get(index);
  const url=image.src;
  const service=index>=0&&index<8&&url.endsWith('/town-walk-preview/npcs-v2.png.webp');
  const person=url.match(/\/world-quests\/npcs\/(blue|green|red)-(\d{2})-v1\.png\.webp$/);
  const id=Number(person?.[2]);
  const name=service?'service-'+(index<4?'top':'bottom'):
   id>=22&&id<=24?person[1]+'-road':
   id>=1&&id<=21?person[1]+'-town-'+Math.floor((id-1)/6):null;
  const row=service?index%4:id>=22?id-22:(id-1)%6;
  let motion=null;
  if(name){
   if(!atlases.has(name)){
    const atlas=new Image();
    atlas.src=atlasRoot+name+'.webp';
    atlases.set(name,atlas);
   }
   motion={atlas:atlases.get(name),row};
  }
  crops.set(index,motion);
  return motion;
 }

 function drawNpc(ctx,image,source,x,y,width,height,time,phase=0){
  if(!image.naturalWidth)return;
  const motion=time!=null&&!reducedMotion.matches?motionFor(image,source):null;
  if(motion?.atlas.naturalWidth){
   const {atlas,row}=motion,cell=atlas.naturalWidth/4;
   if((row+1)*cell<=atlas.naturalHeight){
    const elapsed=((time+phase)%frameEnds[3]+frameEnds[3])%frameEnds[3];
    const frame=frameEnds.findIndex(end=>elapsed<end);
    ctx.drawImage(atlas,frame*cell,row*cell,cell,cell,x+(width-height)/2,y,height,height);
    return;
   }
  }
  source??={x:0,y:0,width:image.naturalWidth,height:image.naturalHeight};
  ctx.drawImage(image,source.x,source.y,source.width,source.height,x,y,width,height);
 }

 const flagCache=new WeakMap();
 const flagFrameDuration=.16;

 function makeFlagFrames(image){
  const width=120,height=80,padding=10;
  return Array.from({length:4},(_,index)=>{
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
