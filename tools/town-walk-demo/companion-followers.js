(() => {
 'use strict';
 const catalog=window.WalkCompanionCatalog||{};
 const assets=new Map();
 function normalize(value){
  if(!value||typeof value.sp!=='string'||!Number.isInteger(value.form)||value.form<0||value.form>2)return null;
  return catalog[value.sp+':'+value.form]?{sp:value.sp,form:value.form}:null;
 }
 function first(player){
  if(!Array.isArray(player?.party)||!Array.isArray(player?.pets))return null;
  for(const uid of player.party){
   const pet=player.pets.find(p=>String(p.uid)===String(uid));
   if(pet)return normalize({sp:pet.sp,form:Number(pet.form)||0});
  }
  return null;
 }
 function acquire(key){
  let asset=assets.get(key);
  if(!asset){
   const image=new Image();
   asset={image,refs:0,ready:false};assets.set(key,asset);
   image.onload=()=>{asset.ready=true;};
   image.onerror=()=>{asset.failed=true;asset.retryAt=performance.now()+10000;};
   image.src='/Soulbeast/assets/companions/'+catalog[key].file;
  }
  asset.refs++;return asset;
 }
 function drop(key,asset){
  if(asset&&--asset.refs===0){assets.delete(key);asset.image.onload=asset.image.onerror=null;asset.image.src='';}
 }
 function create(){
  let key=null,asset=null,body=null,trail=[],clock=0;
  function sync(value){
   const v=normalize(value),next=v?v.sp+':'+v.form:null;
   if(next===key)return;
   drop(key,asset);asset=null;key=next;
  }
  function reset(leader){
   body={x:leader.x-65,y:leader.y+65,direction:0};
   trail=[{x:leader.x,y:leader.y}];
  }
  function update(dt,leader){
   if(!leader||!Number.isFinite(leader.x)||!Number.isFinite(leader.y))return;
   dt=Math.min(Math.max(dt,0),.05);clock+=dt;
   if(!body||Math.hypot(body.x-leader.x,body.y-leader.y)>1000)reset(leader);
   if(!key)return;
   const last=trail[trail.length-1];
   if(Math.hypot(last.x-leader.x,last.y-leader.y)>10)trail.push({x:leader.x,y:leader.y});
   // Bound route history even when a remote player is far away or teleports.
   if(trail.length>160)trail.splice(0,trail.length-160);
   let remaining=0,stop=trail.length-1;
   for(let i=trail.length-1;i>0;i--){
    remaining+=Math.hypot(trail[i].x-trail[i-1].x,trail[i].y-trail[i-1].y);stop=i-1;
    if(remaining>=90)break;
   }
   let budget=dt*Math.min(560,230+Math.hypot(body.x-leader.x,body.y-leader.y));
   while(budget>0&&trail.length){
    const target=trail[0],dx=target.x-body.x,dy=target.y-body.y,distance=Math.hypot(dx,dy);
    if(trail.length===1&&distance<=90)break;
    const available=trail.length===1?distance-90:distance;
    if(available<.5){if(stop<=0)break;trail.shift();stop--;continue;}
    const step=Math.min(available,budget);
    body.x+=dx/distance*step;body.y+=dy/distance*step;budget-=step;
    body.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?1:0);
    if(step>=available&&stop<=0)break;
   }
  }
  function draw(ctx,sx,sy,scale){
   if(!key||!body)return;
   const x=sx(body.x),y=sy(body.y),size=128*scale;
   const canvasWidth=ctx.canvas.clientWidth||ctx.canvas.width,canvasHeight=ctx.canvas.clientHeight||ctx.canvas.height;
   if(x+size<0||x-size>canvasWidth||y+size<0||y-size>canvasHeight)return;
   asset??=acquire(key);
   if(asset.failed&&performance.now()>=asset.retryAt){asset.failed=false;asset.image.src='/Soulbeast/assets/companions/'+catalog[key].file;}
   if(!asset.ready)return;
   const image=asset.image,col=body.direction%2,row=Math.floor(body.direction/2);
   const bob=Math.sin(clock*3.5)*5*scale;
   ctx.save();ctx.fillStyle='#173a4c30';ctx.beginPath();ctx.ellipse(x,y,15*scale,5*scale,0,0,Math.PI*2);ctx.fill();
   ctx.drawImage(image,col*image.naturalWidth/2,row*image.naturalHeight/2,image.naturalWidth/2,image.naturalHeight/2,x-size/2,y-size-13*scale+bob,size,size);ctx.restore();
  }
  return {sync,update,draw,reset,release(){drop(key,asset);asset=null;key=null;body=null;trail=[];},get body(){return body;},get key(){return key;}};
 }
 window.CompanionFollowers={normalize,first,create,get loadedAssets(){return assets.size;}};
})();
