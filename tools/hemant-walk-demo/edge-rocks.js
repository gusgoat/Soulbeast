(function(scope){
 'use strict';
 const ART_ROOT='/Soulbeast/assets/country-walk/edge-rocks-v1/';
 const SHAPES=8;
 // Rounded rock sprite extents relative to the anchor, as fractions of draw width.
 const ROCK_BOUNDS=[
  [.22,.28,.08],[.25,.34,.12],[.25,.35,.08],[.34,.35,.09],
  [.29,.37,.13],[.38,.32,.11],[.22,.37,.08],[.33,.39,.16]
 ];

 function assetFiles(country){
  const version=country==='red'?'basalt-1':'rounded-1';
  return Object.fromEntries(Array.from({length:SHAPES},(_,i)=>[
   'edgeRock'+(i+1),ART_ROOT+country+'-rock-'+(i+1)+'.webp?v='+version
  ]));
 }

 function create(data,nav,terrain,obstacles){
  const {flatten,width,height}=data,{water}=terrain;
  let seed=69631+({blue:1,green:2,red:3}[data.countryId]??0);
  function random(){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   return seed/4294967296;
  }
  const props=[],spacing=new Map(),cell=90;
  function overlapsBase(point,w,variant){
   const [halfWidth,back,front]=ROCK_BOUNDS[variant];
   const y=point.y*flatten;
   return obstacles.some(base=>{
    if(Math.abs(base.x-point.x)>=base.halfWidth+w*halfWidth+4)return false;
    const baseY=base.y*flatten;
    return y-w*back<baseY+base.front+4&&y+w*front>baseY-base.back-4;
   });
  }
  function place(point,edge,w,variant){
   if(water.accessPoints?.some(p=>nav.distance(p,point)<125))return false;
   if(point.x<0||point.x>width||point.y<0||point.y>height)return false;
   const blocker=terrain.hit(point.x,point.y);
   if(blocker==='mountain'||blocker==='tree'||blocker==='scenery'||overlapsBase(point,w,variant))return false;
   const column=Math.floor(point.x/cell),row=Math.floor(point.y*flatten/cell);
   for(let x=column-1;x<=column+1;x++)for(let y=row-1;y<=row+1;y++){
    const nearby=spacing.get(x+','+y);
    // Slightly overlap neighboring silhouettes to cover the visible terrain seam.
    if(nearby?.some(rock=>nav.distance(point,rock)<(w+rock.w)*.10))return false;
   }
   const rock={...point,kind:'edgeRock',edge,w,art:'edgeRock'+(variant+1)};
   const key=column+','+row;
   if(!spacing.has(key))spacing.set(key,[]);
   spacing.get(key).push(rock);
   props.push(rock);
   return true;
  }

  // Work in projected ground units so east–west and north–south have equal spacing.
  function sample(points,closed,step,visit){
   let remaining=step*(.18+random()*.34);
   const count=closed?points.length:points.length-1;
   for(let i=0;i<count;i++){
    const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dy=(b.y-a.y)*flatten;
    const length=Math.hypot(dx,dy);
    if(length<.01)continue;
    const ux=dx/length,uy=dy/length;
    while(remaining<length){
     const x=a.x+ux*remaining,y=a.y+uy*remaining/flatten;
     visit(offset=>({x:x-uy*offset,y:y+ux*offset/flatten}));
     remaining+=step*(.88+random()*.24);
    }
    remaining-=length;
   }
  }

  const riverBanks=[];
  function shore(offsetPoint,offset,edge){
   const width=88+random()*42,variant=Math.floor(random()*SHAPES);
   // Keep the stones on the bank even where the road runs close to the water.
   for(const inset of [0,8,15,-8]){
    const point=offsetPoint(offset-Math.sign(offset)*inset);
    if(water.raw(point.x,point.y)||!water.raw(point.x,point.y,44))continue;
    if(place(point,edge,inset?width*.78:width,variant))return;
   }
  }
  function riverBank(offsetPoint,offset){
   riverBanks.push({offsetPoint,offset});
   shore(offsetPoint,offset,'river');
  }
  for(const river of water.rivers){
   sample(river.points,false,20,offsetPoint=>{
    for(const side of [-1,1]){
     riverBank(offsetPoint,side*(river.width/2+12+random()*9));
    }
   });
   for(const [end,neighbor] of [[river.points[0],river.points[1]],[river.points.at(-1),river.points.at(-2)]]){
    const direction=Math.atan2((end.y-neighbor.y)*flatten,end.x-neighbor.x);
    const radius=river.width/2+15,steps=Math.ceil(Math.PI*radius/25);
    for(let i=0;i<steps;i++){
     const angle=direction+Math.PI*((i+.5)/steps-.5);
     riverBank(distance=>({x:end.x+distance*Math.cos(angle),y:end.y+distance*Math.sin(angle)/flatten}),radius);
    }
   }
   const radius=river.width/2+12;
   // Offset straight segments leave wedges at outside bends. Sample that outer arc.
   for(let i=1;i<river.points.length-1;i++){
    const a=river.points[i-1],b=river.points[i],c=river.points[i+1];
    const into=Math.atan2((b.y-a.y)*flatten,b.x-a.x);
    const out=Math.atan2((c.y-b.y)*flatten,c.x-b.x);
    const turn=Math.atan2(Math.sin(out-into),Math.cos(out-into));
    const steps=Math.ceil(Math.abs(turn)*radius/18);
    if(Math.abs(turn)*radius<11)continue;
    for(let j=0;j<steps;j++){
     const angle=into-Math.sign(turn)*Math.PI/2+turn*(j+.5)/steps;
     riverBanks.push({
      offsetPoint:distance=>({x:b.x+Math.cos(angle)*distance,y:b.y+Math.sin(angle)*distance/flatten}),
      offset:radius
     });
    }
   }
  }
  for(const lake of water.lakes){
   sample(lake.points,true,24,offsetPoint=>{
    const distance=15+random()*10;
    shore(offsetPoint,distance,'lake');
    shore(offsetPoint,-distance,'lake');
   });
  }
  // Fill remaining seams with smaller stones where a large boulder would overlap a prop.
  for(const {offsetPoint,offset} of riverBanks){
   const target=offsetPoint(offset);
   if(!water.raw(target.x,target.y,27)||props.some(rock=>nav.distance(rock,target)<rock.w*.19))continue;
   const variant=Math.floor(random()*SHAPES);
   for(const inset of [7,13,18,2,-6]){
    const point=offsetPoint(offset-Math.sign(offset)*inset);
    if(water.raw(point.x,point.y)||!water.raw(point.x,point.y,30))continue;
    if(place(point,'river',55,variant))break;
   }
  }
  return props;
 }

 const api={assetFiles,create};
 scope.CountryEdgeRocks=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
