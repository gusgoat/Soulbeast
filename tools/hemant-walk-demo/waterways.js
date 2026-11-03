(function(scope){'use strict';
const F=.64,project=([x,y])=>({x:Math.round((x-.14)*17000+350),y:Math.round((y-.075)*17000/F+350)});
// Manually traced normalized locations from the snowy country in the canonical war-map artwork.
const source={art:'assets/ui/country-war-map-v1.png.webp',rivers:[{id:'winter-river',name:'ธารเหมันต์',width:104,points:[[.371,.193],[.382,.205],[.377,.221],[.390,.233],[.416,.246],[.430,.259],[.424,.275],[.411,.283],[.403,.294],[.377,.309],[.352,.306],[.326,.304],[.300,.290],[.280,.283],[.257,.271],[.242,.251]]}],lakes:[{id:'capital-lake',name:'ทะเลสาบเหมันต์',points:[[.246,.222],[.264,.228],[.280,.236],[.302,.238],[.307,.250],[.295,.262],[.275,.264],[.260,.255],[.246,.246],[.237,.236]]},{id:'east-lake',name:'บึงธารแก้ว',points:[[.370,.305],[.388,.303],[.404,.310],[.402,.323],[.386,.330],[.367,.324],[.361,.314]]}]};
const dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*F);
function nearest(p,a,b){const dx=b.x-a.x,dy=(b.y-a.y)*F,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*F*dy)/(dx*dx+dy*dy||1)));return {x:a.x+dx*t,y:a.y+(b.y-a.y)*t,t}}
function inside(p,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit}return hit}
function smooth(points,closed=false){for(let pass=0;pass<2;pass++){const next=closed?[]:[points[0]];for(let i=0;i<points.length-(closed?0:1);i++){const a=points[i],b=points[(i+1)%points.length];next.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75})}if(!closed)next.push(points.at(-1));points=next}return points}
function create(data,nav){
 const settings=data.waterways||source,projectPoint=data.projection?([x,y])=>({x:Math.round((x-data.projection.x)*data.projection.scale+data.projection.pad),y:Math.round((y-data.projection.y)*data.projection.scale/F+data.projection.pad)}):project;
 const rivers=settings.rivers.map(r=>({...r,points:smooth(r.points.map(projectPoint))})),lakes=settings.lakes.map(l=>({...l,points:smooth(l.points.map(projectPoint),true)})),bridges=[];
 function raw(x,y,margin=0){const p={x,y};return lakes.some(l=>inside(p,l.points)||margin>0&&l.points.some((a,i)=>dist(p,nearest(p,a,l.points[(i+1)%l.points.length]))<margin))||rivers.some(r=>r.points.slice(1).some((b,i)=>dist(p,nearest(p,r.points[i],b))<r.width/2+margin))}
 // Shared crossings are perpendicular to the local river, away from lake mouths.
 for(const r of rivers)for(let i=2;i<r.points.length-2;i++){
  const p=r.points[i],prev=r.points[i-1],next=r.points[i+1],len=dist(prev,next),nx=-(next.y-prev.y)*F/len,ny=(next.x-prev.x)/len;
  if(bridges.some(b=>dist(b,p)<650)||lakes.some(l=>inside(p,l.points)||l.points.some((a,j)=>dist(p,nearest(p,a,l.points[(j+1)%l.points.length]))<220)))continue;
  const a={x:p.x+nx*160,y:p.y+ny*160/F},b={x:p.x-nx*160,y:p.y-ny*160/F};
  if(raw(a.x,a.y,45)||raw(b.x,b.y,45))continue;
  bridges.push({id:'bridge-'+bridges.length,a,b,x:p.x,y:p.y,width:146,length:320,crossingAngle:90});
 }
 function onBridge(x,y){const p={x,y};return bridges.some(b=>dist(p,nearest(p,b.a,b.b))<=b.width/2-16)}
 function hit(x,y){return raw(x,y,14)&&!onBridge(x,y)}
 function path(ctx,points,close=false){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y*F):ctx.moveTo(p.x,p.y*F));if(close)ctx.closePath()}
 function lakeFill(g,l){const xs=l.points.map(p=>p.x),ys=l.points.map(p=>p.y*F),fill=g.createLinearGradient(Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys));fill.addColorStop(0,'#6bb8ca');fill.addColorStop(.35,'#377e9b');fill.addColorStop(.65,'#255b78');fill.addColorStop(1,'#71bfd1');return fill}
 function drawGround(g,texture){g.save();g.lineJoin=g.lineCap='round';const winter=!data.countryId||data.countryId==='blue';let pattern;if(texture){pattern=g.createPattern(texture,'repeat');pattern.setTransform(new DOMMatrix().scale(.38))}for(const l of lakes){path(g,l.points,true);g.strokeStyle=winter?'#bbd7e6':data.countryId==='red'?'#9c7154':'#527f58';g.lineWidth=45;g.stroke();g.strokeStyle=winter?'#eefaff':'#c2b18a';g.lineWidth=24;g.stroke();g.fillStyle=pattern||lakeFill(g,l);g.fill();path(g,l.points,true);g.strokeStyle='#83c8db88';g.lineWidth=9;g.stroke()}for(const r of rivers){for(const [extra,color]of [[43,winter?'#bed7e5':data.countryId==='red'?'#a77251':'#507d54'],[25,winter?'#f2fbff':'#c2b18a'],[8,'#73bfd3'],[0,pattern||'#347b9e']]){path(g,r.points);g.strokeStyle=color;g.lineWidth=r.width+extra;g.stroke()}}g.restore()}
 function drawDeck(g){g.save();for(const b of bridges){const angle=Math.atan2((b.b.y-b.a.y)*F,b.b.x-b.a.x);g.save();g.translate(b.a.x,b.a.y*F);g.rotate(angle);g.fillStyle='#263c4b55';g.fillRect(-9,-b.width/2+10,b.length+18,b.width);g.fillStyle='#706557';g.fillRect(-12,-b.width/2,b.length+24,b.width);g.fillStyle='#a9916c';g.fillRect(0,-b.width/2+8,b.length,b.width-16);for(let x=0;x<b.length;x+=19){g.fillStyle=(Math.floor(x/19)%2)?'#bca582':'#aa9271';g.fillRect(x,-b.width/2+10,17,b.width-20);g.fillStyle=data.countryId&&data.countryId!=='blue'?'#c1a176':'#e8f3f5';g.fillRect(x,-b.width/2+9,17,7)}g.fillStyle=data.countryId&&data.countryId!=='blue'?'#bca27b':'#ecf8ff';g.fillRect(-13,-b.width/2,22,b.width);g.fillRect(b.length-9,-b.width/2,22,b.width);g.restore()}g.restore()}
 // Cache current distances and shoreline polygons, rather than rebuilding world geometry per frame.
 const currents=rivers.map(r=>{let length=0;const segments=r.points.slice(1).map((b,i)=>{const a=r.points[i],len=dist(a,b),start=length;length+=len;return {a,b,len,start}});const banks=[-1,1].map(side=>r.points.map((p,i)=>{const a=r.points[Math.max(0,i-1)],b=r.points[Math.min(r.points.length-1,i+1)],len=dist(a,b);return {x:p.x-(b.y-a.y)*F/len*(r.width/2-5)*side,y:p.y+(b.x-a.x)/len*(r.width/2-5)*side/F}}));return {...r,segments,length,outline:[...banks[0],...banks[1].reverse()]}});
 let flowPattern=null,flowTexture=null;
 function drawFlow(c,sx,sy,z,time,texture,viewport){
  // The overview uses the cached terrain; detail animation is only needed close up.
  if(z<.15)return;
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
  for(const b of bridges){const dx=(b.b.x-b.a.x)/b.length,dy=(b.b.y-b.a.y)*F/b.length,w=b.width/2+10;
   const points=[[-20,-w],[b.length+20,-w],[b.length+20,w],[-20,w]].map(([u,v])=>({x:b.a.x+dx*u-dy*v,y:b.a.y+(dy*u+dx*v)/F}));
   points.forEach((p,i)=>i?openings.lineTo(sx(p.x),sy(p.y)):openings.moveTo(sx(p.x),sy(p.y)));openings.closePath();
  }c.clip(openings,'evenodd');
  if(texture){
   if(texture!==flowTexture){flowTexture=texture;flowPattern=c.createPattern(texture,'repeat')}
   c.save();c.translate(sx(0),sy(0));c.scale(z,z);
   // Two differently paced layers keep the surface from looking like a sliding photograph.
   for(const layer of [{scale:.38,x:-11,y:8,alpha:.36},{scale:.52,x:-5,y:13,alpha:.14}]){
    flowPattern.setTransform(new DOMMatrix().translate(time*layer.x,time*layer.y).scale(layer.scale));
    c.globalAlpha=layer.alpha;c.fillStyle=flowPattern;c.fillRect(-sx(0)/z,-sy(0)/z,vw/z,vh/z);
   }c.restore();
  }
  for(const r of visibleCurrents){
   const count=Math.ceil(r.length/32);
   for(let i=0;i<count;i++){
    const travel=(i*37.73+time*(25+i%5*2))%r.length,seg=r.segments.find(s=>travel<=s.start+s.len)||r.segments.at(-1),t=(travel-seg.start)/seg.len;
    const dx=(seg.b.x-seg.a.x)/seg.len,dy=(seg.b.y-seg.a.y)*F/seg.len,offset=Math.sin(i*12.9898)*r.width*.37;
    const x=seg.a.x+(seg.b.x-seg.a.x)*t-dy*offset,y=seg.a.y+(seg.b.y-seg.a.y)*t+dx*offset/F;
    const X=sx(x),Y=sy(y);if(X<-30||Y<-30||X>vw+30||Y>vh+30)continue;
    const pulse=.5+.5*Math.sin(time*1.5+i*2.4),len=7+i%4*3;
    c.strokeStyle=`rgba(195,235,240,${.11+pulse*.25})`;c.lineWidth=(.7+pulse*.65)*z;
    c.beginPath();c.moveTo(X-dx*len*z,Y-dy*len*z);c.quadraticCurveTo(X-dy*3*z,Y+dx*3*z,X+dx*len*z,Y+dy*len*z);c.stroke();
   }
  }
  for(let j=0;j<visibleLakes.length;j++){const l=visibleLakes[j],center=l.points.reduce((a,p)=>({x:a.x+p.x/l.points.length,y:a.y+p.y/l.points.length}),{x:0,y:0});
   for(let i=0;i<9;i++){const phase=(time*.15+i/9)%1,x=center.x+Math.sin(i*7.4)*160,y=center.y+Math.cos(i*5.9)*150;c.beginPath();c.ellipse(sx(x),sy(y),(12+phase*38)*z,(4+phase*13)*z,.15,0,Math.PI*2);c.strokeStyle=`rgba(194,230,235,${Math.sin(phase*Math.PI)*.14})`;c.lineWidth=z;c.stroke()}
  }c.restore();
 }
 const rails=[];for(const b of bridges){const dx=(b.b.x-b.a.x)/b.length,dy=(b.b.y-b.a.y)*F/b.length,nx=-dy*b.width/2,ny=dx*b.width/2,count=Math.ceil(b.length/80);for(const side of [-1,1])for(let i=0;i<count;i++){const a={x:b.a.x+(b.b.x-b.a.x)*i/count+nx*side,y:b.a.y+(b.b.y-b.a.y)*i/count+ny*side/F},end={x:b.a.x+(b.b.x-b.a.x)*(i+1)/count+nx*side,y:b.a.y+(b.b.y-b.a.y)*(i+1)/count+ny*side/F};rails.push({kind:'bridgeRail',x:(a.x+end.x)/2,y:(a.y+end.y)/2,a,b:end})}}
 function drawRail(c,o,sx,sy,z){const x=sx(o.a.x),y=sy(o.a.y),X=sx(o.b.x),Y=sy(o.b.y);c.save();c.lineCap='round';c.strokeStyle='#6c665d';c.lineWidth=5*z;c.beginPath();c.moveTo(x,y-22*z);c.lineTo(X,Y-22*z);c.stroke();c.strokeStyle=data.countryId&&data.countryId!=='blue'?'#baa37c':'#f1fbff';c.lineWidth=3*z;c.beginPath();c.moveTo(x,y-25*z);c.lineTo(X,Y-25*z);c.stroke();for(const [a,b]of [[x,y],[X,Y]]){c.fillStyle='#635e56';c.fillRect(a-3*z,b-34*z,6*z,36*z);c.fillStyle=data.countryId&&data.countryId!=='blue'?'#c0aa82':'#f0faff';c.fillRect(a-5*z,b-37*z,10*z,5*z)}c.restore()}
 return {source:settings,rivers,lakes,bridges,rails,raw,onBridge,hit,drawGround,drawDeck,drawFlow,drawRail};
}
const api={source,project,create};scope.hemantWaterways=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
