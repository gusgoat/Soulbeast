(function(s){
'use strict';
const fieldScale = {
 "wendigo": {sprite: 1.0709, model: 1.0308},
 "cerberus": {sprite: 0.8518, model: 1.3208},
 "western-dragon": {sprite: 0.7643, model: 1.4758},
 "frost-lich": {sprite: 0.8709, model: 1.1094},
 "vampire-queen": {sprite: 0.8764, model: 1.0844},
 "tricephalos": {sprite: 0.9465, model: 1.4399},
 "pentapyros": {sprite: 0.9465, model: 1.4582},
};
function create(){
 const bossScale=1.25;
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
  const scale=fieldScale[current.id];
  const width=visual?size*bossScale*(scale?.sprite??1):effectiveSize(size)*current.renderScale*.5;
  const modelWidth=visual?size*bossScale*(scale?.model??1):width;
  if(model?.draw(ctx,x,y,modelWidth,dir,moving,false))return;
  const image=current.image;
  if(image.complete&&image.naturalWidth)ctx.drawImage(image,x-width*.5,y-width,width,width);
  else {
   ctx.save();ctx.fillStyle='#ba687f';ctx.beginPath();
   ctx.ellipse(x,y-width*.27,width*.22,width*.27,0,0,2*Math.PI);ctx.fill();ctx.restore();
  }
 }
 function release(){request++;model?.release();current=null;}
 return {sync,draw,effectiveSize,bossScale,release,get current(){return current;}};
}
s.MineBossSprites={create};
})(window);
