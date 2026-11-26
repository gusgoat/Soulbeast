(function(scope){'use strict';
const F=.64,project=([x,y])=>({x:Math.round((x-.14)*17000+350),y:Math.round((y-.075)*17000/F+350)});
// Manually traced normalized locations from the snowy country in the canonical war-map artwork.
const source={art:'assets/ui/country-war-map-v1.png.webp',rivers:[{id:'winter-river',name:'ธารเหมันต์',width:104,points:[[.371,.193],[.382,.205],[.377,.221],[.390,.233],[.416,.246],[.430,.259],[.424,.275],[.411,.283],[.403,.294],[.377,.309],[.352,.306],[.326,.304],[.300,.290],[.280,.283],[.257,.271],[.242,.251]]}],lakes:[{id:'capital-lake',name:'ทะเลสาบเหมันต์',points:[[.246,.222],[.264,.228],[.280,.236],[.302,.238],[.307,.250],[.295,.262],[.275,.264],[.260,.255],[.246,.246],[.237,.236]]},{id:'east-lake',name:'บึงธารแก้ว',points:[[.370,.305],[.388,.303],[.404,.310],[.402,.323],[.386,.330],[.367,.324],[.361,.314]]}]};
const dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*F);
function nearest(p,a,b){const dx=b.x-a.x,dy=(b.y-a.y)*F,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*F*dy)/(dx*dx+dy*dy||1)));return {x:a.x+dx*t,y:a.y+(b.y-a.y)*t,t}}
function inside(p,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit}return hit}
function smooth(points,closed=false){for(let pass=0;pass<2;pass++){const next=closed?[]:[points[0]];for(let i=0;i<points.length-(closed?0:1);i++){const a=points[i],b=points[(i+1)%points.length];next.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75})}if(!closed)next.push(points.at(-1));points=next}return points}
function create(data,nav){
 const coast=typeof module!=='undefined'?require('./region-coast.js'):scope.RegionCoast,seaSampleAt=(x,y)=>coast.seaSample(data,x,y);
 const settings=data.waterways||source,projectPoint=data.projection?([x,y])=>({x:Math.round((x-data.projection.x)*data.projection.scale+data.projection.pad),y:Math.round((y-data.projection.y)*data.projection.scale/F+data.projection.pad)}):project;
 const rivers=settings.rivers.map(r=>({...r,points:smooth(r.points.map(projectPoint))})),lakes=settings.lakes.map(l=>({...l,points:smooth(l.points.map(projectPoint),true)})),bridges=[];
 function raw(x,y,margin=0){const p={x,y};return lakes.some(l=>inside(p,l.points)||margin>0&&l.points.some((a,i)=>dist(p,nearest(p,a,l.points[(i+1)%l.points.length]))<margin))||rivers.some(r=>r.points.slice(1).some((b,i)=>dist(p,nearest(p,r.points[i],b))<r.width/2+margin))}
 // Shared crossings are perpendicular to the local river, away from lake mouths.
 for(const r of rivers){
 const distances=[0];for(let i=1;i<r.points.length;i++)distances.push(distances[i-1]+dist(r.points[i-1],r.points[i]));
 const length=distances.at(-1),indices=Array.from({length:Math.max(0,r.points.length-4)},(_,i)=>i+2);
 if(data.regionLayout)indices.sort((a,b)=>Math.abs(distances[a]-length/2)-Math.abs(distances[b]-length/2));
 for(const i of indices){
  if(data.regionLayout&&(distances[i]<length*.3||distances[i]>length*.7||bridges.some(b=>b.riverId===r.id)))continue;
  const p=r.points[i],prev=r.points[i-1],next=r.points[i+1],len=dist(prev,next),nx=-(next.y-prev.y)*F/len,ny=(next.x-prev.x)/len;
  if(bridges.some(b=>dist(b,p)<650)||lakes.some(l=>inside(p,l.points)||l.points.some((a,j)=>dist(p,nearest(p,a,l.points[(j+1)%l.points.length]))<220)))continue;
  const a={x:p.x+nx*160,y:p.y+ny*160/F},b={x:p.x-nx*160,y:p.y-ny*160/F};
  if(raw(a.x,a.y,45)||raw(b.x,b.y,45))continue;
  bridges.push({id:'bridge-'+bridges.length,a,b,x:p.x,y:p.y,width:146,length:320,crossingAngle:90,riverId:r.id,riverFraction:distances[i]/length,regionArt:data.regionLayout?'region-'+data.regionId:null});
 }
 }
 function onBridge(x,y){const p={x,y};return bridges.some(b=>dist(p,nearest(p,b.a,b.b))<=b.width/2-16)}
 const bridgeRails=bridges.flatMap(b=>{const length=dist(b.a,b.b),nx=-(b.b.y-b.a.y)*F/length,ny=(b.b.x-b.a.x)/length;return [-1,1].map(side=>{const offset=(b.width/2-16)*side;return {bridgeId:b.id,a:{x:b.a.x+nx*offset,y:b.a.y+ny*offset/F},b:{x:b.b.x+nx*offset,y:b.b.y+ny*offset/F}};});});
 function bridgeRailHit(x,y){const p={x,y};return bridgeRails.some(rail=>dist(p,nearest(p,rail.a,rail.b))<12);}
 for(const lake of lakes)lake.center=lake.points.reduce((a,p)=>({x:a.x+p.x/lake.points.length,y:a.y+p.y/lake.points.length}),{x:0,y:0});
 function lakeDepth(lake,p){
  const c=lake.center,dx=p.x-c.x,dy=(p.y-c.y)*F,length=Math.hypot(dx,dy);if(length<.01)return 1;
  const ux=dx/length,uy=dy/length;let radius=Infinity;
  for(let i=0;i<lake.points.length;i++){const a=lake.points[i],b=lake.points[(i+1)%lake.points.length],ax=a.x-c.x,ay=(a.y-c.y)*F,ex=b.x-a.x,ey=(b.y-a.y)*F,den=ux*ey-uy*ex;if(Math.abs(den)<1e-9)continue;const t=(ax*ey-ay*ex)/den,u=(ax*uy-ay*ux)/den;if(t>0&&u>=0&&u<=1)radius=Math.min(radius,t);}
  return Number.isFinite(radius)?Math.max(0,Math.min(1,1-length/radius)):0;
 }
 function sampleAt(x,y,ignoreBridge=false){
  if(!ignoreBridge&&onBridge(x,y))return null;const p={x,y};let result=null,riverDepth=0;
  for(const river of rivers){let closest=Infinity;for(let i=1;i<river.points.length;i++)closest=Math.min(closest,dist(p,nearest(p,river.points[i-1],river.points[i])));if(closest<river.width/2){const depth=1-closest/(river.width/2);riverDepth=Math.max(riverDepth,depth);if(!result||depth>result.depth)result={id:river.id,type:'river',body:river,depth};}}
  for(const lake of lakes)if(inside(p,lake.points)){result={id:lake.id,type:'lake',body:lake,depth:Math.max(lakeDepth(lake,p),riverDepth)};break;}
  if(!result)result=seaSampleAt(x,y);
  if(result){const d=result.depth;result.depth=d*d*(3-2*d);}return result;
 }
 // Dry approaches lead onto the deck. A player already wading stays below it.
 function bridgeCoordinates(b,p){const dx=(b.b.x-b.a.x)/b.length,dy=(b.b.y-b.a.y)*F/b.length,x=p.x-b.x,y=(p.y-b.y)*F;return {along:x*dx+y*dy,across:-x*dy+y*dx};}
 function underBridge(p){if(p.bridgeDeck||!sampleAt(p.x,p.y,true))return null;return bridges.find(b=>{const q=bridgeCoordinates(b,p);return Math.abs(q.along)<=b.length/2+12&&Math.abs(q.across)<=b.width/2+30;})||null;}
 function playerStep(from,to){
  const deck=bridges.find(b=>b.id===from.bridgeDeck);
  if(deck){
   const q=bridgeCoordinates(deck,to);
   if(Math.abs(q.across)>deck.width/2-28)return {allowed:false,bridgeDeck:deck.id};
   if(Math.abs(q.along)<=deck.length/2)return {allowed:true,bridgeDeck:deck.id};
   return {allowed:!sampleAt(to.x,to.y,true),bridgeDeck:null};
  }
  for(const b of bridges){
   const q=bridgeCoordinates(b,to),half=b.length/2,lane=b.width/2-28;
   if(Math.abs(q.along)>half||Math.abs(q.across)>lane)continue;
   const a=bridgeCoordinates(b,from);
   const insideApproach=Math.abs(a.across)<=lane&&Math.abs(a.along)-Math.abs(q.along)>.001;
   if(Math.abs(q.along)<half-24&&!insideApproach)continue;
   // The dry part of the ramp is an area; a diagonal approach or a resumed
   // walk can already be inside the end line before reaching the river.
   if(!sampleAt(from.x,from.y,true))return {allowed:true,bridgeDeck:b.id};
  }
  return {allowed:true,bridgeDeck:null};
 }

 function pointAt(river,fraction){const distances=[0];for(let i=1;i<river.points.length;i++)distances.push(distances.at(-1)+dist(river.points[i-1],river.points[i]));const target=Math.max(0,Math.min(1,fraction))*distances.at(-1);let i=distances.findIndex(d=>d>=target);if(i<=0)return {...river.points[0]};const a=river.points[i-1],b=river.points[i],f=(target-distances[i-1])/(distances[i]-distances[i-1]||1);return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};}
 const depthAt=(x,y)=>sampleAt(x,y)?.depth||0;
 const accessPoints=[];
 function addAccess(bank,wet,bodyId){if(data.regionPolygon&&!inside(bank,data.regionPolygon))return;accessPoints.push({...bank,waterX:wet.x,waterY:wet.y,bodyId});}
 if(data.waterTraversal==='wade'){
  for(const r of rivers)for(const f of [.18,.82]){const p=pointAt(r,f),a=pointAt(r,f-.015),b=pointAt(r,f+.015),len=dist(a,b)||1,nx=-(b.y-a.y)*F/len,ny=(b.x-a.x)/len;for(const side of [-1,1])addAccess({x:p.x+nx*(r.width/2+70)*side,y:p.y+ny*(r.width/2+70)*side/F},{x:p.x+nx*(r.width/2-35)*side,y:p.y+ny*(r.width/2-35)*side/F},r.id);}
  for(const l of lakes)for(let i=0;i<4;i++){const p=l.points[Math.floor(i*l.points.length/4)],len=dist(l.center,p)||1,nx=(p.x-l.center.x)/len,ny=(p.y-l.center.y)*F/len;addAccess({x:p.x+nx*70,y:p.y+ny*70/F},{x:p.x-nx*35,y:p.y-ny*35/F},l.id);}
 }
 function hit(x,y){return raw(x,y,14)&&!onBridge(x,y)}
 function path(ctx,points,close=false){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y*F):ctx.moveTo(p.x,p.y*F));if(close)ctx.closePath()}
 function lakeFill(g,l){const xs=l.points.map(p=>p.x),ys=l.points.map(p=>p.y*F),fill=g.createLinearGradient(Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys));fill.addColorStop(0,'#6bb8ca');fill.addColorStop(.35,'#377e9b');fill.addColorStop(.65,'#255b78');fill.addColorStop(1,'#71bfd1');return fill}
 function drawLayeredBanks(g,pattern){
  // Translucent banks leave the underlying terrain and paving visible.
  const bankColors={
   blue:['#a7c5d510','#a7c5d523','#abc8d73b','#d7ebf260','#e5f3f58c'],
   green:['#51483012','#64563a24','#63543738','#534a3450','#3f4f4380'],
   red:['#392a2716','#4930292a','#56382f45','#70463a62','#82584984']
  };
  const shallowColors={
   blue:['#9bbdce44','#c5e5ef56','#9ed2e344'],
   green:['#52564155','#60644856','#536b5444'],
   red:['#5c403960','#82594563','#61604748']
  };
  const colors=bankColors[data.countryId]||bankColors.blue;
  const shallows=shallowColors[data.countryId]||shallowColors.blue;
  for(const [index,width] of [70,55,41,28,16].entries()){
   const color=colors[index];
   g.strokeStyle=color;
   for(const lake of lakes){path(g,lake.points,true);g.lineWidth=width;g.stroke();}
   for(const river of rivers){path(g,river.points);g.lineWidth=river.width+width;g.stroke();}
  }
  for(const lake of lakes){
   path(g,lake.points,true);
   g.fillStyle=pattern||lakeFill(g,lake);
   g.fill();
   const xs=lake.points.map(p=>p.x),ys=lake.points.map(p=>p.y*F),rx=(Math.max(...xs)-Math.min(...xs))/2,ry=(Math.max(...ys)-Math.min(...ys))/2;
   g.save();g.translate(lake.center.x,lake.center.y*F);g.scale(rx,ry);const depthFill=g.createRadialGradient(0,0,0,0,0,1);depthFill.addColorStop(0,'#123e59');depthFill.addColorStop(.5,'#2d7b97');depthFill.addColorStop(1,'#8bc9d1');g.restore();g.globalAlpha=.56;g.fillStyle=depthFill;g.fill();g.globalAlpha=1;
   for(const [index,width] of [17,10,5].entries()){
    g.strokeStyle=shallows[index];g.lineWidth=width;g.stroke();
   }
  }
  for(const river of rivers){
   path(g,river.points);
   g.fillStyle=g.strokeStyle=pattern||'#347b9e';
   for(const [trim,alpha] of [[-7,.23],[0,.5],[7,.72],[14,1]]){
    g.globalAlpha=alpha;g.lineWidth=Math.max(1,river.width-trim);g.stroke();
   }
   g.globalAlpha=1;g.strokeStyle='#174b6548';g.lineWidth=river.width*.45;g.stroke();
  }
  g.globalAlpha=1;
 }
 function drawGround(g,texture){
  g.save();
  g.lineJoin=g.lineCap='round';
  let pattern;
  if(texture){
   pattern=g.createPattern(texture,'repeat');
   pattern.setTransform(new DOMMatrix().scale(.38));
  }
  drawLayeredBanks(g,pattern);
  g.restore();
 }
 function drawDeck(g,images={},hasModel=()=>false,include=()=>true){g.save();for(const [i,b] of bridges.entries()){if(hasModel(b)||!include(b))continue;const angle=Math.atan2((b.b.y-b.a.y)*F,b.b.x-b.a.x);g.save();g.translate(b.a.x,b.a.y*F);g.rotate(angle);g.fillStyle='#263c4b55';g.fillRect(-9,-b.width/2+10,b.length+18,b.width);const art=images['bridge'+i]?.naturalWidth?images['bridge'+i]:images['bridge'+i%3];if(art?.naturalWidth){if(Math.cos(angle)<0){g.translate(b.length,0);g.rotate(Math.PI);}g.drawImage(art,-12,-b.width/2,b.length+24,b.width);g.restore();continue;}g.fillStyle='#706557';g.fillRect(-12,-b.width/2,b.length+24,b.width);g.fillStyle='#a9916c';g.fillRect(0,-b.width/2+8,b.length,b.width-16);for(let x=0;x<b.length;x+=19){g.fillStyle=(Math.floor(x/19)%2)?'#bca582':'#aa9271';g.fillRect(x,-b.width/2+10,17,b.width-20);g.fillStyle=data.countryId&&data.countryId!=='blue'?'#c1a176':'#e8f3f5';g.fillRect(x,-b.width/2+9,17,7)}g.fillStyle=data.countryId&&data.countryId!=='blue'?'#bca27b':'#ecf8ff';g.fillRect(-13,-b.width/2,22,b.width);g.fillRect(b.length-9,-b.width/2,22,b.width);g.restore()}g.restore()}
 // Cache current distances and shoreline polygons, rather than rebuilding world geometry per frame.
 const currents=rivers.map(r=>{let length=0;const segments=r.points.slice(1).map((b,i)=>{const a=r.points[i],len=dist(a,b),start=length;length+=len;return {a,b,len,start}});const banks=[-1,1].map(side=>r.points.map((p,i)=>{const a=r.points[Math.max(0,i-1)],b=r.points[Math.min(r.points.length-1,i+1)],len=dist(a,b);return {x:p.x-(b.y-a.y)*F/len*(r.width/2-5)*side,y:p.y+(b.x-a.x)/len*(r.width/2-5)*side/F}}));return {...r,segments,length,outline:[...banks[0],...banks[1].reverse()]}});
 let flowPattern=null,flowTexture=null;
 function drawFlow(c,sx,sy,z,time,texture,viewport,compact=false,hasModel=()=>false){
  // The overview uses the cached terrain; detail animation is only needed close up.
  if(z<.15)return;
  const night=viewport?.nightEffects===true;
    const pixelRatio=c.getTransform?.()?.a||1,vw=viewport?.width||c.canvas.width/pixelRatio,vh=viewport?.height||c.canvas.height/pixelRatio;
    const intersects=points=>{let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(const p of points){left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y)}return sx(right)>-40&&sx(left)<vw+40&&sy(bottom)>-40&&sy(top)<vh+40};
    const visibleCurrents=currents.filter(r=>intersects(r.outline)),visibleLakes=lakes.filter(l=>intersects(l.points));
    if(!visibleCurrents.length&&!visibleLakes.length)return;
  c.save();c.lineCap='round';
  const outline=new Path2D();
  for(const points of [...visibleCurrents.map(r=>r.outline),...visibleLakes.map(l=>l.points)]){
   let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a.x*b.y-b.x*a.y}
   const ordered=area<0?[...points].reverse():points;
   ordered.forEach((p,i)=>i?outline.lineTo(sx(p.x),sy(p.y)):outline.moveTo(sx(p.x),sy(p.y)));outline.closePath();
  }
  c.clip(outline);
  // Leave bridge decks completely untouched, including their rails and snowy ends.
  const openings=new Path2D();openings.rect(0,0,c.canvas.width,c.canvas.height);
  for(const b of bridges){if(hasModel(b))continue;const dx=(b.b.x-b.a.x)/b.length,dy=(b.b.y-b.a.y)*F/b.length,w=b.width/2+10;
   const points=[[-20,-w],[b.length+20,-w],[b.length+20,w],[-20,w]].map(([u,v])=>({x:b.a.x+dx*u-dy*v,y:b.a.y+(dy*u+dx*v)/F}));
   points.forEach((p,i)=>i?openings.lineTo(sx(p.x),sy(p.y)):openings.moveTo(sx(p.x),sy(p.y)));openings.closePath();
  }c.clip(openings,'evenodd');
  if(texture){
   if(texture!==flowTexture){flowTexture=texture;flowPattern=c.createPattern(texture,'repeat')}
   c.save();c.translate(sx(0),sy(0));c.scale(z,z);
   // Two differently paced layers keep the surface from looking like a sliding photograph.
   for(const layer of (compact||night?[{scale:.38,x:-11,y:8,alpha:.29}]:[{scale:.38,x:-11,y:8,alpha:.36},{scale:.52,x:-5,y:13,alpha:.14}])){
    flowPattern.setTransform(new DOMMatrix().translate(time*layer.x,time*layer.y).scale(layer.scale));
    c.globalAlpha=layer.alpha;c.fillStyle=flowPattern;c.fillRect(-sx(0)/z,-sy(0)/z,vw/z,vh/z);
   }c.restore();
  }
  for(const r of visibleCurrents){
   const count=Math.ceil(r.length/(night?(compact?172:128):(compact?86:32)));
   for(let i=0;i<count;i++){
    const travel=(i*(night?(compact?179.4:150.92):(compact?89.7:37.73))+time*(25+i%5*2))%r.length,seg=r.segments.find(s=>travel<=s.start+s.len)||r.segments.at(-1),t=(travel-seg.start)/seg.len;
    const dx=(seg.b.x-seg.a.x)/seg.len,dy=(seg.b.y-seg.a.y)*F/seg.len,offset=Math.sin(i*12.9898)*r.width*.37;
    const x=seg.a.x+(seg.b.x-seg.a.x)*t-dy*offset,y=seg.a.y+(seg.b.y-seg.a.y)*t+dx*offset/F;
    const X=sx(x),Y=sy(y);if(X<-30||Y<-30||X>vw+30||Y>vh+30)continue;
    const pulse=.5+.5*Math.sin(time*1.5+i*2.4),len=7+i%4*3;
    c.strokeStyle=`rgba(195,235,240,${.11+pulse*.25})`;c.lineWidth=(.7+pulse*.65)*z;
    c.beginPath();c.moveTo(X-dx*len*z,Y-dy*len*z);c.quadraticCurveTo(X-dy*3*z,Y+dx*3*z,X+dx*len*z,Y+dy*len*z);c.stroke();
   }
  }
  for(let j=0;j<visibleLakes.length;j++){const l=visibleLakes[j],center=l.points.reduce((a,p)=>({x:a.x+p.x/l.points.length,y:a.y+p.y/l.points.length}),{x:0,y:0});
   const rings=night?(compact?2:3):(compact?5:9);
   for(let i=0;i<rings;i++){const phase=(time*.15+i/rings)%1,x=center.x+Math.sin(i*7.4)*160,y=center.y+Math.cos(i*5.9)*150;c.beginPath();c.ellipse(sx(x),sy(y),(12+phase*38)*z,(4+phase*13)*z,.15,0,Math.PI*2);c.strokeStyle=`rgba(194,230,235,${Math.sin(phase*Math.PI)*.14})`;c.lineWidth=z;c.stroke()}
  }c.restore();
 }
 const rails=[];for(const b of bridges){const dx=(b.b.x-b.a.x)/b.length,dy=(b.b.y-b.a.y)*F/b.length,nx=-dy*b.width/2,ny=dx*b.width/2,count=Math.ceil(b.length/80);for(const side of [-1,1])for(let i=0;i<count;i++){const a={x:b.a.x+(b.b.x-b.a.x)*i/count+nx*side,y:b.a.y+(b.b.y-b.a.y)*i/count+ny*side/F},end={x:b.a.x+(b.b.x-b.a.x)*(i+1)/count+nx*side,y:b.a.y+(b.b.y-b.a.y)*(i+1)/count+ny*side/F};rails.push({kind:'bridgeRail',crossing:b,x:(a.x+end.x)/2,y:(a.y+end.y)/2,a,b:end})}}
 function drawRail(c,o,sx,sy,z){const x=sx(o.a.x),y=sy(o.a.y),X=sx(o.b.x),Y=sy(o.b.y);c.save();c.lineCap='round';c.strokeStyle=data.countryId==='red'?'#522b24':data.countryId==='green'?'#53412e':'#647d92';c.lineWidth=5*z;c.beginPath();c.moveTo(x,y-22*z);c.lineTo(X,Y-22*z);c.stroke();c.strokeStyle=data.countryId==='red'?'#b47142':data.countryId==='green'?'#ae9366':'#f1fbff';c.lineWidth=3*z;c.beginPath();c.moveTo(x,y-25*z);c.lineTo(X,Y-25*z);c.stroke();for(const [a,b]of [[x,y],[X,Y]]){c.fillStyle='#635e56';c.fillRect(a-3*z,b-34*z,6*z,36*z);c.fillStyle=data.countryId==='red'?'#ce9453':data.countryId==='green'?'#b19a66':'#f0faff';c.fillRect(a-5*z,b-37*z,10*z,5*z)}c.restore()}
 return {playerStep,underBridge,bridgeCoordinates,source:settings,rivers,lakes,bridges,bridgeRails,bridgeRailHit,rails,accessPoints,raw,onBridge,hit,sampleAt,seaSampleAt,depthAt,pointAt,drawGround,drawDeck,drawFlow,drawRail};
}
const api={source,project,create};scope.hemantWaterways=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
