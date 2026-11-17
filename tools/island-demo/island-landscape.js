(function(scope){'use strict';
const root='/Soulbeast/assets/ui/world-polish-20261103/';
function create(data,country,flatten,random,distance,coastProps,port,beachWidth){
 const {nodes,lane,spawn,center,safeRadius}=data,props=[];
 const artFiles={road0:CountryPathArt.assetFiles(country).road0,
  ...CountryGrassClumps.assetFiles(country),...CountryMeadowDetails.assetFiles(country),
  ...CountryEdgeRocks.assetFiles(country),
  ruin:root+country+'-ruin.png.webp',statue:root+country+'-statue.png.webp',
  ...(country==='red'?CountryLava.art:{})};
 const layout={
  roads:nodes.slice(1).map((b,i)=>({a:nodes[i],b,width:lane*2})),
  plazas:[{...center,rx:225,ry:215},{...spawn,rx:safeRadius,ry:safeRadius*.76},
   ...data.sites.map(o=>({...o,rx:153,ry:122}))]
 };
 function nearest(point){
  let minimum=Infinity;
  for(const {a,b} of layout.roads){
   const dx=b.x-a.x,dy=(b.y-a.y)*flatten,x=point.x-a.x,y=(point.y-a.y)*flatten;
   const ratio=Math.max(0,Math.min(1,(x*dx+y*dy)/(dx*dx+dy*dy)));
   minimum=Math.min(minimum,Math.hypot(x-ratio*dx,y-ratio*dy));
  }
  return {distance:minimum};
 }
 function dry(x,y,margin=0){
  return [[0,0],[-margin,0],[margin,0],[0,-margin],[0,margin]].every(([dx,dy])=>data.isLand(x+dx,y+dy/flatten));
 }
 const features=[port,spawn,center,...data.sites,data.chest];
 const lava=CountryLava.create({countryId:country,width:data.width,height:data.height,flatten},
  {nearest,distance,places:features},{
   insideEnclosure:data.isLand,blocked:(x,y)=>data.walkable(x,y),mountains:[],
   water:{raw:(x,y,margin)=>!dry(x,y,margin)}
  });
 const clearance=(point,margin)=>props.every(o=>distance(o,point)>=margin+o.size*.25);
 function place(point,art,size,variant,extra={}){
  const margin=size*.28;
  if(!dry(point.x,point.y,margin+beachWidth)||data.walkable(point.x,point.y)||
   nearest(point).distance<lane+margin*.65||
   features.some(o=>distance(o,point)<(o===spawn?260:142)+margin)||
   coastProps.some(o=>distance(o,point)<(o.size+size)*.40)||
   !clearance(point,margin)||
   lava.crowdsPool({...point,w:size},size*.85)||
   lava.cracks.some(o=>Math.abs(o.x-point.x)<o.length*.56+margin&&
    Math.abs((o.y-point.y)*flatten)<o.length*.34+margin))return false;
  props.push({...point,art,size,variant,...extra});
  return true;
 }
 for(const [i,point] of data.barriers.entries()){
  const rock=point.art==='rock';
  const variant=rock?1+i%8:LivingEnvironment.treeVariant(country,point,!dry(point.x,point.y,180));
  if(i%5===1)place(point,'shrub',point.size*.66,1+i%4);
  else if(i%3!==1)place(point,point.art,point.size*(rock?.7:1),variant);
 }
 for(let i=0;i<720&&props.length<320;i++){
  const point={x:random()*data.width,y:random()*data.height};
  const choice=i%7,art=choice<3?'tree':choice<5?'shrub':choice===5?'rock':'statue';
  if(art==='statue'&&nearest(point).distance>450)continue;
  const variant=art==='tree'?LivingEnvironment.treeVariant(country,point,!dry(point.x,point.y,180)):
   1+Math.floor(random()*(art==='rock'?8:4));
  place(point,art,(art==='tree'?105:art==='statue'?111:61)+random()*46,variant);
 }
 for(let i=3;i<nodes.length-3;i+=3){
  const a=nodes[i-1],b=nodes[i+1],span=distance(a,b);
  const dx=(b.x-a.x)/span,dy=(b.y-a.y)*flatten/span;
  const origin=nodes[i];
  for(const side of [-1,1]){
   const offset=side*(lane+24+random()*103);
   const anchor={x:origin.x-dy*offset,y:origin.y+dx*offset/flatten};
   for(let j=0;j<4;j++){
    const point={x:anchor.x+(random()-.5)*123,y:anchor.y+(random()-.5)*100/flatten};
    const flower=j===3;
    const size=(flower?39:35)+random()*20;
    const variant=1+Math.floor(random()*(flower?4:6));
    const key=(flower?'wildflower':'grassClump')+variant;
    place(point,flower?'wildflower':'grass',size,variant,{key,w:size});
   }
  }
 }
 for(let i=12;i<nodes.length-5;i+=23){
  const a=nodes[i-1],b=nodes[i+1],span=distance(a,b),point=nodes[i];
  const dx=(b.x-a.x)/span,dy=(b.y-a.y)*flatten/span;
  for(const side of [1,-1]){
   const offset=side*(lane+46),position={x:point.x-dy*offset,y:point.y+dx*offset/flatten};
   if(place(position,'directionSign',76,1,{key:'directionSign'}))break;
  }
 }
 const lampEdges=nodes.flatMap((_,i)=>i%4===0&&i+4<nodes.length?[[i,i+4]]:[]);
 const lamps=CountryRoadLamps.create({countryId:country,flatten,lane},
  {nodes,edges:lampEdges,nearest,distance,places:features,walkable:data.isLand},
  {water:{raw:(x,y,margin)=>!dry(x,y,margin),onBridge:()=>false}},
  [...props,...coastProps.map(o=>({...o,clearance:o.art==='palm'?90:o.size*.4})),
   ...lava.pools.map(o=>({...o,clearance:o.radius+64}))]);
 return {artFiles,layout,props,lamps,lava};
}
scope.IslandLandscape={create};
})(window);
