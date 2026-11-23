(function(scope){'use strict';
const F=.64,PLAYER_RADIUS=14;
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes}return yes}
function segmentDistance(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-dx*t,y-a.y-dy*t)}
function create(data,nav){
 const waterAPI=typeof module!=='undefined'?require('./waterways.js'):scope.hemantWaterways,water=waterAPI.create(data,nav);
 const mountains=(data.mountains||[[600,600,1100],[3550,500,1000],[4600,350,1100],[5900,2800,900],[550,2250,950],[600,5700,1100],[2000,6500,950],[6000,6500,950],[3450,3450,780],[3700,5200,720]].map(([x,y,w])=>({x,y,w}))).map(o=>({...o,kind:'mountain'})).filter(o=>nav.nearest(o).distance>o.w*.65&&nav.places.every(s=>nav.distance(o,s)>o.w*.65));
 // Overlapping ranges form a continuous enclosure, with the outer slopes beyond the map.
 const border=[];
 for(let x=-200;x<=data.width+400;x+=660)border.push({x,y:580+Math.sin(x*.004)*28,w:1000,kind:'mountain',border:true});
 for(let x=-200;x<=data.width+400;x+=600)border.push({x,y:data.height+480+Math.sin(x*.004)*20,w:900,kind:'mountain',border:true});
 for(let y=750;y<=data.height+450;y+=400){border.push({x:85+Math.sin(y*.003)*20,y,w:800,kind:'mountain',border:true});border.push({x:data.width-85+Math.cos(y*.003)*20,y,w:800,kind:'mountain',border:true})}
 // Leave a real opening in the mountain range around each border gateway.
 mountains.push(...border.filter(o=>!(data.gates||[]).some(g=>nav.distance(o,g)<o.w*.8)));
 if(data.regionPolygon){
  border.length=0;
  for(let i=mountains.length-1;i>=0;i--)if(mountains[i].border||water.raw(mountains[i].x,mountains[i].y,180))mountains.splice(i,1);
  // Fill genuine off-road ridges, including the narrow eastern region. These use
  // the same mountain prop and collision outline as the original country map.
  const candidates=[];
  for(let y=1100;y<data.height-500;y+=170)for(let x=700;x<data.width-400;x+=170){
   const w=500,p={x,y},score=nav.nearest(p).distance;
   if(score<w*.67||!insideEnclosure(x,y)||!insideEnclosure(x-w*.46,y-w*.45/F)||!insideEnclosure(x+w*.46,y-w*.45/F)||!insideEnclosure(x,y-w*.58/F)||water.raw(x,y,340)||nav.places.some(s=>nav.distance(s,p)<w*.85))continue;
   candidates.push({x,y,w,kind:'mountain',score});
  }
  candidates.sort((a,b)=>b.score-a.score);
  for(const p of candidates){if(mountains.length>=6)break;if(mountains.every(m=>nav.distance(m,p)>630))mountains.push(p);}
  if(!mountains.length){
   const edges=data.regionPolygon.map((a,i)=>({a,b:data.regionPolygon[(i+1)%data.regionPolygon.length]})).sort((u,v)=>nav.distance(v.a,v.b)-nav.distance(u.a,u.b));
   for(const {a,b}of edges){
    const length=nav.distance(a,b),dx=(b.x-a.x)/length,dy=(b.y-a.y)*F/length;let nx=-dy,ny=dx;
    if(insideEnclosure((a.x+b.x)/2+nx*5,(a.y+b.y)/2+ny*5/F)){nx=-nx;ny=-ny;}
    const w=650,h=w*881/1500,corners=[[-w/2,-h*.94],[w/2,-h*.94],[w/2,h*.06],[-w/2,h*.06]],offset=Math.max(0,-Math.min(...corners.map(([x,y])=>x*nx+y*ny)))+12;
    for(const t of [.5,.25,.75]){const p={x:a.x+(b.x-a.x)*t+nx*offset,y:a.y+(b.y-a.y)*t+ny*offset/F,w,kind:'mountain',backdrop:true};
     if(corners.some(([x,y])=>insideEnclosure(p.x+x,p.y+y/F)))continue;
     const box={left:p.x-w/2,right:p.x+w/2,top:p.y*F-h*.94,bottom:p.y*F+h*.06};
     if(nav.places.some(s=>{if(s.type==='junction')return false;const sw=({capital:490,city:375,village:235,forest:310,border:540,islandPort:190,colosseum:390,dungeon:420})[s.type]||310,sh=({capital:650,city:570,village:200,forest:310,border:500,islandPort:190,colosseum:260,dungeon:420})[s.type]||310;return box.left<s.x+sw/2+50&&box.right>s.x-sw/2-50&&box.top<s.y*F+sh*.12+50&&box.bottom>s.y*F-sh*.94-50;}))continue;
     mountains.push(p);break;
    }
    if(mountains.length)break;
   }
  }
 }
 function insideEnclosure(x,y){if(data.regionPolygon)return inside(x,y,data.regionPolygon);const west=410+Math.sin(y*.003)*28,east=data.width-410+Math.cos(y*.003)*28,north=635+Math.sin(x*.004)*28,south=data.height-260+Math.sin(x*.004)*20;return x>west&&x<east&&y>north&&y<south}
 // Rock outlines follow the visible mountain sprite; transparent mist is not solid.
 const outline=[[.03,.78],[.13,.42],[.26,.17],[.38,.38],[.53,.035],[.66,.35],[.8,.23],[.94,.62],[.98,.83],[.81,.96],[.48,.99],[.16,.94]];
 const rocks=mountains.map(o=>{const h=o.w*881/1500;return {kind:'mountain',points:outline.map(([x,y])=>({x:o.x+(x-.5)*o.w,y:o.y*F+(y-.94)*h}))}});
 let seed=205;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const coast=typeof module!=='undefined'?require('./region-coast.js'):scope.RegionCoast;
 const trees=[];for(let i=0;i<Math.round(850*data.width*data.height/(6200*6900)*(data.treeDensity??1));i++){const [minWidth,maxWidth]=data.treeWidth||[110,175],o={x:180+rand()*(data.width-360),y:200+rand()*(data.height-400),w:minWidth+rand()*(maxWidth-minWidth)};if(data.countryId==='red'&&o.x/data.width>.28&&o.y/data.height<.7&&Math.sin(o.x*.001)+Math.cos(o.y*.0013)<.35)continue;if(water.accessPoints?.some(p=>nav.distance(p,o)<145)||!insideEnclosure(o.x,o.y)||water.raw(o.x,o.y,Math.max(55,o.w*.27))||water.bridges.some(b=>nav.distance(o,b.a)+nav.distance(o,b.b)<b.length+200)||nav.nearest(o).distance<Math.max(165,o.w*.65)||nav.places.some(s=>nav.distance(o,s)<360)||rocks.some(r=>inside(o.x,o.y*F,r.points)))continue;if(data.regionLayout&&coast.isBeach(data,o.x,o.y,o.w*.25))o.beachPalm=true;trees.push(o)}
 const shrubInterval={green:4,blue:5,red:5}[data.countryId];
 if(shrubInterval)for(const tree of trees){
  if(tree.beachPalm)continue;
  const signature=(Math.imul(Math.round(tree.x),73)^Math.imul(Math.round(tree.y),193))>>>0;
  if(signature%shrubInterval!==0)continue;
  tree.shrub=1+(signature>>>6)%4;
  tree.w=data.regionLayout?tree.w*.44:tree.w*.73;
 }
 const trunks=trees.map(o=>({kind:'tree',x:o.x,y:o.y*F,rx:o.w*.12+PLAYER_RADIUS,ry:o.w*.07+PLAYER_RADIUS,...(o.shrub?{shrub:true,slowY:o.y*F-o.w*.18,slowRx:o.w*.4+PLAYER_RADIUS,slowRy:o.w*.24+PLAYER_RADIUS}:{})}));
 const buckets=new Map(),CELL=256;
 for(const o of [...rocks,...trunks]){const box=o.points?{left:Math.min(...o.points.map(p=>p.x))-PLAYER_RADIUS,right:Math.max(...o.points.map(p=>p.x))+PLAYER_RADIUS,top:Math.min(...o.points.map(p=>p.y))-PLAYER_RADIUS,bottom:Math.max(...o.points.map(p=>p.y))+PLAYER_RADIUS}:{left:o.x-(o.slowRx||o.rx),right:o.x+(o.slowRx||o.rx),top:o.shrub?Math.min(o.y-o.ry,o.slowY-o.slowRy):o.y-o.ry,bottom:o.shrub?Math.max(o.y+o.ry,o.slowY+o.slowRy):o.y+o.ry};for(let x=Math.floor(box.left/CELL);x<=Math.floor(box.right/CELL);x++)for(let y=Math.floor(box.top/CELL);y<=Math.floor(box.bottom/CELL);y++){const key=x+','+y;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o)}}
 function hit(x,y,allowWater=false,allowShrubs=false){if(!insideEnclosure(x,y)&&!(allowWater&&water.seaSampleAt(x,y)))return 'mountain';if(!allowWater&&water.hit(x,y))return 'water';const py=y*F,list=buckets.get(Math.floor(x/CELL)+','+Math.floor(py/CELL))||[];for(const o of list){if(allowShrubs&&o.shrub)continue;if(o.kind==='tree'||o.kind==='scenery'){if(((x-o.x)/o.rx)**2+((py-o.y)/o.ry)**2<1)return o.kind}else if(inside(x,py,o.points)||o.points.some((a,i)=>segmentDistance(x,py,a,o.points[(i+1)%o.points.length])<PLAYER_RADIUS))return o.kind}return null}
 // Use the foliage footprint rather than the trunk, sharing the scenery spatial index.
 function shrubSpeedFactor(x,y){const py=y*F,list=buckets.get(Math.floor(x/CELL)+','+Math.floor(py/CELL))||[];return list.some(o=>o.shrub&&((x-o.x)/o.slowRx)**2+((py-o.slowY)/o.slowRy)**2<1)?.5:1;}
 function removeCollision(entries){
  if(!entries.size)return;
  for(const [key,items] of buckets){
   if(!items.some(item=>entries.has(item)))continue;
   const remaining=items.filter(item=>!entries.has(item));
   if(remaining.length)buckets.set(key,remaining);
   else buckets.delete(key);
  }
 }
 function removeTrees(exclude){
  const removed=new Set();
  for(let i=trees.length-1;i>=0;i--){
   if(!exclude(trees[i]))continue;
   trees.splice(i,1);
   removed.add(trunks.splice(i,1)[0]);
  }
  removeCollision(removed);
 }
 function addScenery(props){
  const entries=new Set();
  for(const p of props){
   const o={kind:'scenery',x:p.x,y:p.y*F,rx:Math.min(26,p.w*.18)+PLAYER_RADIUS,ry:Math.min(18,p.w*.1)+PLAYER_RADIUS};
   entries.add(o);
   for(let x=Math.floor((o.x-o.rx)/CELL);x<=Math.floor((o.x+o.rx)/CELL);x++)for(let y=Math.floor((o.y-o.ry)/CELL);y<=Math.floor((o.y+o.ry)/CELL);y++){
    const key=x+','+y;
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(o);
   }
  }
  return ()=>removeCollision(entries);
 }
 return {shrubSpeedFactor,addScenery,removeTrees,trees,mountains,rocks,trunks,border,water,insideEnclosure,hit,playerBlocked:(x,y)=>!!hit(x,y,data.waterTraversal==='wade',true),blocked:(x,y)=>!!hit(x,y)};
}
const api={create,inside,PLAYER_RADIUS};scope.hemantTerrain=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
