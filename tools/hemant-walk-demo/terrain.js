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
 function insideEnclosure(x,y){const west=410+Math.sin(y*.003)*28,east=data.width-410+Math.cos(y*.003)*28,north=635+Math.sin(x*.004)*28,south=data.height-260+Math.sin(x*.004)*20;return x>west&&x<east&&y>north&&y<south}
 // Rock outlines follow the visible mountain sprite; transparent mist is not solid.
 const outline=[[.03,.78],[.13,.42],[.26,.17],[.38,.38],[.53,.035],[.66,.35],[.8,.23],[.94,.62],[.98,.83],[.81,.96],[.48,.99],[.16,.94]];
 const rocks=mountains.map(o=>{const h=o.w*881/1500;return {kind:'mountain',points:outline.map(([x,y])=>({x:o.x+(x-.5)*o.w,y:o.y*F+(y-.94)*h}))}});
 let seed=205;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const trees=[];for(let i=0;i<Math.round(850*data.width*data.height/(6200*6900));i++){const o={x:180+rand()*(data.width-360),y:200+rand()*(data.height-400),w:110+rand()*65};if(data.countryId==='red'&&o.x/data.width>.28&&o.y/data.height<.7&&Math.sin(o.x*.001)+Math.cos(o.y*.0013)<.35)continue;if(!insideEnclosure(o.x,o.y)||water.raw(o.x,o.y,55)||water.bridges.some(b=>nav.distance(o,b.a)+nav.distance(o,b.b)<b.length+200)||nav.nearest(o).distance<165||nav.places.some(s=>nav.distance(o,s)<360)||rocks.some(r=>inside(o.x,o.y*F,r.points)))continue;trees.push(o)}
 const trunks=trees.map(o=>({kind:'tree',x:o.x,y:o.y*F,rx:o.w*.12+PLAYER_RADIUS,ry:o.w*.07+PLAYER_RADIUS}));
 const buckets=new Map(),CELL=256;
 for(const o of [...rocks,...trunks]){const box=o.points?{left:Math.min(...o.points.map(p=>p.x))-PLAYER_RADIUS,right:Math.max(...o.points.map(p=>p.x))+PLAYER_RADIUS,top:Math.min(...o.points.map(p=>p.y))-PLAYER_RADIUS,bottom:Math.max(...o.points.map(p=>p.y))+PLAYER_RADIUS}:{left:o.x-o.rx,right:o.x+o.rx,top:o.y-o.ry,bottom:o.y+o.ry};for(let x=Math.floor(box.left/CELL);x<=Math.floor(box.right/CELL);x++)for(let y=Math.floor(box.top/CELL);y<=Math.floor(box.bottom/CELL);y++){const key=x+','+y;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o)}}
 function hit(x,y){if(!insideEnclosure(x,y))return 'mountain';if(water.hit(x,y))return 'water';const py=y*F,list=buckets.get(Math.floor(x/CELL)+','+Math.floor(py/CELL))||[];for(const o of list){if(o.kind==='tree'){if(((x-o.x)/o.rx)**2+((py-o.y)/o.ry)**2<1)return o.kind}else if(inside(x,py,o.points)||o.points.some((a,i)=>segmentDistance(x,py,a,o.points[(i+1)%o.points.length])<PLAYER_RADIUS))return o.kind}return null}
 return {trees,mountains,rocks,trunks,border,water,insideEnclosure,hit,blocked:(x,y)=>!!hit(x,y)};
}
const api={create,inside,PLAYER_RADIUS};scope.hemantTerrain=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
