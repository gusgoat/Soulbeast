(() => {
 'use strict';
 const catalog=window.WalkCompanionCatalog||{};
 const assets=new Map();
 const followDistance=90;
 const followResponse=16;
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
   trail=[{x:body.x,y:body.y},{x:leader.x,y:leader.y}];
  }
  function update(dt,leader){
   if(!leader||!Number.isFinite(leader.x)||!Number.isFinite(leader.y))return;
   dt=Math.min(Math.max(dt,0),.05);clock+=dt;
   if(!body||Math.hypot(body.x-leader.x,body.y-leader.y)>1000)reset(leader);
   if(!key)return;
   // Start from the live position so the target advances between recorded points.
   let targetX=leader.x,targetY=leader.y,remaining=followDistance;
   for(let i=trail.length-1;i>=0;i--){
    const point=trail[i],dx=point.x-targetX,dy=point.y-targetY;
    const length=Math.hypot(dx,dy);
    if(length>=remaining){
     const fraction=remaining/length;
     targetX+=dx*fraction;targetY+=dy*fraction;
     if(i>0)trail.splice(0,i);
     break;
    }
    remaining-=length;
    targetX=point.x;targetY=point.y;
   }
   const last=trail[trail.length-1];
   if(Math.hypot(last.x-leader.x,last.y-leader.y)>=8)trail.push({x:leader.x,y:leader.y});

   const blend=1-Math.exp(-dt*followResponse);
   const dx=(targetX-body.x)*blend,dy=(targetY-body.y)*blend;
   body.x+=dx;body.y+=dy;
   if(Math.hypot(dx,dy)>dt*12){
    // Favor the current axis near diagonals so small corrections do not flip the sprite.
    const horizontal=body.direction>=2;
    const xWeight=Math.abs(dx)*(horizontal?1.2:1);
    const yWeight=Math.abs(dy)*(horizontal?1:1.2);
    body.direction=xWeight>yWeight?(dx<0?2:3):(dy<0?1:0);
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
   const bob=Math.sin(clock*3.5)*4*scale;
   ctx.save();ctx.fillStyle='#173a4c30';ctx.beginPath();ctx.ellipse(x,y,15*scale,5*scale,0,0,Math.PI*2);ctx.fill();
   ctx.drawImage(image,col*image.naturalWidth/2,row*image.naturalHeight/2,image.naturalWidth/2,image.naturalHeight/2,x-size/2,y-size-13*scale+bob,size,size);ctx.restore();
  }
  return {sync,update,draw,reset,release(){drop(key,asset);asset=null;key=null;body=null;trail=[];},get body(){return body;},get key(){return key;}};
 }
 window.CompanionFollowers={normalize,first,create,get loadedAssets(){return assets.size;}};
})();
