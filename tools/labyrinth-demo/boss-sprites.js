(function(s){
'use strict';
function worldScale(){
 try {
  const env=JSON.parse(s.sessionStorage.getItem('soulbeast-online-walk-v1')||'null')?.environment;
  return (env||new URLSearchParams(s.location.search).get('world'))==='test'?1.5:1;
 }catch{return 1;}
}
function create(){
 const visualScale=worldScale();
 const model=s.sealerSprites?.createModel?.({beast:true});
 let current=null,request=0;
 const scales={tricephalos:1.4,pentapyros:1.65};
 async function sync(id='wendigo'){
  const revision=++request;
  const floor=s.MineFloors?.all.find(entry=>entry.bossModel===id);
  const image=new Image();
  if(floor?.bossArt)image.src='/Soulbeast/'+floor.bossArt;
  current={id,renderScale:scales[id]||1.5,image};
  await model?.sync(id);
  return revision===request?current:null;
 }
 function effectiveSize(size){return current?Math.min(size,576/current.renderScale):size;}
 function draw(ctx,x,y,size,dir,phase,moving,visual=true){
  if(!current)return;
  const width=effectiveSize(size)*current.renderScale*.5*(visual?visualScale:1);
  if(model?.draw(ctx,x,y,width,dir,moving,false))return;
  const image=current.image;
  if(image.complete&&image.naturalWidth)ctx.drawImage(image,x-width*.5,y-width,width,width);
  else {
   ctx.save();ctx.fillStyle='#ba687f';ctx.beginPath();
   ctx.ellipse(x,y-width*.27,width*.22,width*.27,0,0,2*Math.PI);ctx.fill();ctx.restore();
  }
 }
 function release(){request++;model?.release();current=null;}
 return {sync,draw,effectiveSize,visualScale,release,get current(){return current;}};
}
s.MineBossSprites={create};
})(window);
