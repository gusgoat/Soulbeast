(function(scope){
 'use strict';
 const ROOT='/Soulbeast/assets/country-walk/details-blender-v1/';
 const FLOWER_WIDTHS=[50,45,56,55];
 const supports=country=>['green','blue','red'].includes(country);
 function plantFiles(country='green'){
  const prefix=country==='green'?'':country+'-';
  return Object.fromEntries(['wildflower','shrub'].flatMap(kind=>
   FLOWER_WIDTHS.map((_,i)=>[kind+(i+1),ROOT+prefix+kind+'-'+(i+1)+'.webp'+
    (country==='red'&&kind==='shrub'?'?v=desert-1':'')])));
 }
 const assetFiles=country=>supports(country)?{...plantFiles(country),directionSign:ROOT+'direction-sign.webp'}:{};

 function flowerPatches(grass,flatten,random,distance,allowed,density,patchSpacing){
  const patches=[],flowers=[];
  for(const anchor of grass){
   if(random()>density||patches.some(patch=>distance(anchor,patch)<patchSpacing))continue;
   const variant=Math.floor(random()*FLOWER_WIDTHS.length);
   const angle=random()*Math.PI*2,count=2+Math.floor(random()*3);
   const startCount=flowers.length;
   for(let i=0;i<count;i++){
    const direction=angle+i*2.399,radius=32+random()*26;
    const point={x:anchor.x+Math.cos(direction)*radius,y:anchor.y+Math.sin(direction)*radius/flatten};
    if(!allowed(point,FLOWER_WIDTHS[variant])||
     grass.some(clump=>distance(point,clump)<19)||
     flowers.some(flower=>distance(point,flower)<25))continue;
    const w=FLOWER_WIDTHS[variant]*(.80+random()*.40);
    flowers.push({...point,kind:'wildflower',art:'wildflower'+(variant+1),w});
   }
   if(flowers.length>startCount)patches.push(anchor);
  }
  return flowers;
 }

 function create(data,nav,terrain,grass,obstacles){
  if(!supports(data.countryId))return [];
  const random=scope.LivingEnvironment.rng(317826);
  const {flatten}=data,{water}=terrain,signs=[];
  const clear=(point,space)=>nav.walkable(point.x,point.y)&&!water.raw(point.x,point.y,space)&&
   !obstacles.some(o=>Math.abs(point.x-o.x)<o.halfWidth+22&&
    (point.y-o.y)*flatten>-o.back-12&&(point.y-o.y)*flatten<o.front+13);

  const junctions=nav.nodes.filter(node=>node.links.length>=3);
  // Some roads cross visually without sharing a navigation node.
  const edges=nav.edges.map(([a,b])=>[nav.nodes[a],nav.nodes[b]]);
  for(let i=0;i<edges.length;i++){
   const [a,b]=edges[i],dx=b.x-a.x,dy=b.y-a.y;
   for(let j=i+1;j<edges.length;j++){
    const [c,d]=edges[j],ux=d.x-c.x,uy=d.y-c.y;
    const determinant=dx*uy-dy*ux;
    if(Math.abs(determinant)<1)continue;
    const cx=c.x-a.x,cy=c.y-a.y,t=(cx*uy-cy*ux)/determinant,u=(cx*dy-cy*dx)/determinant;
    if(t>.04&&t<.96&&u>.04&&u<.96)junctions.push({x:a.x+t*dx,y:a.y+t*dy});
   }
  }
  for(const junction of junctions){
   if(signs.some(sign=>nav.distance(sign,junction)<345))continue;
   const start=random()*Math.PI*2;
   placement:for(const radius of [151,186,227,270]){
    for(let i=0;i<24;i++){
     const angle=start+Math.PI*2*i/24;
     const point={x:junction.x+Math.cos(angle)*radius,y:junction.y+Math.sin(angle)*radius/flatten};
     const shoulder=nav.nearest(point).distance;
     if(shoulder<118||shoulder>185||!clear(point,90)||
      signs.some(sign=>nav.distance(sign,point)<310)||
      grass.some(clump=>nav.distance(point,clump)<15))continue;
     signs.push({...point,kind:'directionSign',art:'directionSign',w:76});
     break placement;
    }
   }
  }

  const flowers=flowerPatches(grass,flatten,random,nav.distance,point=>clear(point,76)&&
   nav.nearest(point).distance>=148&&
   !nav.places.some(place=>nav.distance(point,place)<220)&&
   !signs.some(sign=>nav.distance(point,sign)<39),({green:.29,blue:.20,red:.17})[data.countryId],136);
  return [...signs,...flowers];
 }
 function settlement(layout,grass,flatten,seed,onLawn,country='green'){
  const random=scope.LivingEnvironment.rng(seed),shrubs=[];
  const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*flatten);
  const clear=(point,width)=>onLawn(point.x,point.y)&&
   !scope.CountryGrassClumps.onPaving(layout,point.x,point.y,flatten,width*.38);
  for(const anchor of grass){
   if(random()>.30)continue;
   const w=67+random()*28,start=random()*Math.PI*2;
   for(let i=0;i<4;i++){
    const angle=start+i*Math.PI/2,offset=37+random()*36;
    const point={x:anchor.x+Math.cos(angle)*offset,y:anchor.y+Math.sin(angle)*offset/flatten};
    if(!clear(point,w)||shrubs.some(shrub=>distance(shrub,point)<105)||
     grass.some(clump=>distance(clump,point)<25))continue;
    shrubs.push({...point,kind:'shrub',art:'shrub'+(1+shrubs.length%4),w});
    break;
   }
  }
  const flowers=flowerPatches(grass,flatten,random,distance,(point,width)=>clear(point,width)&&
   !shrubs.some(shrub=>distance(shrub,point)<24),({green:.54,blue:.36,red:.30})[country],96);
  return [...shrubs,...flowers];
 }
 scope.CountryMeadowDetails={assetFiles,plantFiles,create,settlement};
})(window);
