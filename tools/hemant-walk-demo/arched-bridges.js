(function(scope){
 'use strict';
 // Orthographic framing and deck profile also used by build-arched-bridges.py.
 const FRAME_WIDTH=520,FRAME_HEIGHT=460,DECK_RISE=42;
 const deckHeight=u=>DECK_RISE*Math.max(0,1-u*u)**1.1;

 // Projected corners of the end planks in the shipped 520 x 460 regional renders,
 // mapped to the same 320 x 146 deck used by navigation, roads and the fallback art.
 const regionalProjection={
  'blue-N':[0.73971,-0.03227,-0.09463,1.23202],
  'blue-W':[0.97052,0.07452,0.12278,1.02924],
  'blue-E':[0.84585,0.09617,0.18781,1.14162],
  'blue-S':[0.98615,0.05998,0.08550,1.01324],
  'green-N':[0.75003,0.01475,0.03168,1.21338],
  'green-W':[0.75028,0.01516,0.03269,1.21320],
  'green-E':[0.80113,0.04666,0.13214,1.14336],
  'green-S':[0.75003,0.01475,0.03168,1.21338],
  'red-W':[0.96692,-0.03303,-0.03421,1.03078],
  'red-N':[0.73873,0.03412,0.03386,1.22538],
  'red-E':[0.96682,-0.03336,-0.03509,1.03092],
  'red-S':[0.96692,-0.03303,-0.03421,1.03078]
 };
 function alignArt(image,matrix){
  if(!matrix)return image;
  const layer=document.createElement('canvas');
  layer.width=FRAME_WIDTH;layer.height=FRAME_HEIGHT;
  const ctx=layer.getContext('2d');
  ctx.setTransform(...matrix,FRAME_WIDTH/2,FRAME_HEIGHT/2);
  ctx.drawImage(image,-FRAME_WIDTH/2,-FRAME_HEIGHT/2);
  return layer;
 }

 function shadowFaces(dx,dy,length,width,flatten){
  const faces=[],raise=Math.sqrt(1-flatten*flatten);
  function plank(from,to,near,far,bottom,top){
   const corner=(x,y,z)=>[x*dx-y*dy,x*dy+y*dx,(deckHeight(2*x/length)+z)*raise];
   const vertices=[corner(from,near,bottom),corner(to,near,bottom),corner(to,far,bottom),corner(from,far,bottom),
    corner(from,near,top),corner(to,near,top),corner(to,far,top),corner(from,far,top)];
   for(const side of [[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])faces.push(side.map(i=>vertices[i]));
  }
  // Follow the same deck curve and side profiles as the Blender renders.
  const panels=10,step=length/panels,railOffset=width/2-7;
  for(let i=0;i<panels;i++){
   const start=-length/2+i*step,end=start+step;
   plank(start,end,-width/2,width/2,-8,0);
   for(const side of [-1,1]){
    const y=side*railOffset;
    plank(start,end,y-6,y+6,32,40);
   }
  }
  for(let i=0;i<=panels*2;i++){
   const x=-length/2+i*step/2,post=i%2?2.5:5;
   for(const side of [-1,1]){
    const y=side*railOffset;
    plank(x-post,x+post,y-post,y+post,0,i%2?39:45);
   }
  }
  return faces;
 }

 function create(country,crossings,flatten){
  const root='/Soulbeast/assets/country-walk/arched-bridges-v1/';
  const bridges=crossings.map(crossing=>{
   const {id,a,b,length,width}=crossing;
   const dx=(b.x-a.x)/length,dy=(b.y-a.y)*flatten/length;
   const deck=new Image(),rail=new Image();
   const projection=crossing.regionArt&&regionalProjection[country+'-'+crossing.regionArt.slice('region-'.length)];
   const art={};
   const ready=Promise.all([load(deck,'deck'),load(rail,'rail')]).then(()=>{
    if(!deck.naturalWidth||!rail.naturalWidth)return;
    art.deck=alignArt(deck,projection);art.rail=alignArt(rail,projection);
   });
   // The near rail must cover actors along the whole bridge, including steep crossings.
   const nearY=Math.max(a.y,b.y)+Math.abs(dx)*width/2/flatten;
   return {crossing,dx,dy,art,riseScale:projection?.[3]||1,ready,nearY,shadow:shadowFaces(dx,dy,length,width,flatten)};

   function load(image,part){
    return new Promise(resolve=>{
     image.onload=image.onerror=resolve;
     const asset=crossing.regionArt?'/Soulbeast/assets/country-walk/region-bridges-v5/'+country+'-'+crossing.regionArt+'-'+part+'.png?v=midriver-1':root+country+'-'+id+'-'+part+'.webp'+(country==='red'?'?v=timber-1':'');image.crossOrigin='anonymous';image.src=window.CountryRegionMedia?.url(asset)||asset;
    });
   }
  });
  const ready=Promise.all(bridges.map(bridge=>bridge.ready));
  const hasArt=bridge=>Boolean(bridge.art.rail);
  const modeled=new Map(bridges.map(bridge=>[bridge.crossing,bridge]));
  const hasModel=crossing=>hasArt(modeled.get(crossing));

  function height(x,y){
   for(const bridge of bridges){
    const {crossing,dx,dy}=bridge;
    const offsetX=x-crossing.x,offsetY=(y-crossing.y)*flatten;
    if(Math.abs(offsetX)>185||Math.abs(offsetY)>185||!hasArt(bridge))continue;
    const along=offsetX*dx+offsetY*dy;
    const across=-offsetX*dy+offsetY*dx;
    if(Math.abs(across)<=crossing.width/2&&Math.abs(along)<crossing.length/2){
     const u=along/(crossing.length/2);
     return deckHeight(u)*Math.sqrt(1-flatten*flatten)*bridge.riseScale;
    }
   }
   return 0;
  }

  function castShadows(shadows,sx,sy,zoom,width,height){
   let visible=false;
   for(const bridge of bridges){
    const x=sx(bridge.crossing.x),y=sy(bridge.crossing.y),padding=FRAME_WIDTH*zoom/2;
    if(!hasArt(bridge)||x+padding<0||x-padding>width||y+padding<0||y-padding>height)continue;
    shadows.castGeometry(x,y,bridge.shadow,zoom);
    visible=true;
   }
   return visible;
  }

  function drawDecks(ctx,sx,sy,zoom,width,height,overview,opacity=()=>1,underY=0){
   const rails=[];
   for(const bridge of bridges){
    if(!hasArt(bridge))continue;
    const {crossing,art:{deck,rail},nearY}=bridge;
    const left=sx(crossing.x)-FRAME_WIDTH*zoom/2,top=sy(crossing.y)-FRAME_HEIGHT*zoom/2;
    const w=FRAME_WIDTH*zoom,h=FRAME_HEIGHT*zoom;
    if(left+w<0||left>width||top+h<0||top>height)continue;
    const alpha=overview?1:opacity(crossing);
    if(alpha<1)rails.push({kind:'archedBridgeRail',x:crossing.x,y:Math.max(nearY,underY)+.1,rail:deck,left,top,w,h,alpha});
    else ctx.drawImage(deck,left,top,w,h);
    if(overview)ctx.drawImage(rail,left,top,w,h);
    else rails.push({kind:'archedBridgeRail',x:crossing.x,y:alpha<1?Math.max(nearY,underY)+.2:nearY,rail,left,top,w,h,alpha});
   }
   return rails;
  }

  return {ready,hasModel,height,drawDecks,castShadows};
 }
 scope.CountryArchedBridges={create};
})(window);
