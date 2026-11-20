(function(g){'use strict';
 const F=.64,BEACH_SCALE=2,BEACH_WIDTH=240,SEA='#24596f',contextCache=new WeakMap();
 function inside(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 function segments(data){
  if(!data.regionLayout)return [];
  const {regionPolygon:polygon,mainlandPolygon:mainland}=data,result=[];
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
   const coastal=(data.coastline||[]).some(([c,d])=>{const dx=d.x-c.x,dy=d.y-c.y,t=((mid.x-c.x)*dx+(mid.y-c.y)*dy)/(dx*dx+dy*dy);return t>=-.001&&t<=1.001&&Math.hypot(mid.x-c.x-dx*t,(mid.y-c.y-dy*t)*F)<2;});
   if(!coastal)continue;
   const dx=b.x-a.x,dy=(b.y-a.y)*F,length=Math.hypot(dx,dy);if(length<1)continue;
   let nx=-dy/length,ny=dx/length;
   if(inside(mid.x+nx*5,mid.y+ny*5/F,mainland)){nx=-nx;ny=-ny;}
   const count=Math.max(2,Math.ceil(length/55)),samples=Array.from({length:count+1},(_,j)=>({x:a.x+dx*j/count,y:a.y+(b.y-a.y)*j/count,u:length*j/count}));
   result.push({a,b,nx,ny,length,samples});
  }
  return result;
 }
 function contextSegments(data){
  if(!data.worldCoastline)return segments(data);if(contextCache.has(data))return contextCache.get(data);
  const result=data.worldCoastline.map(([a,b])=>{const dx=b.x-a.x,dy=(b.y-a.y)*F,length=Math.hypot(dx,dy);let nx=-dy/length,ny=dx/length;
   const x=(a.x+b.x)/2,y=(a.y+b.y)/2;if((data.worldMainlands||[data.mainlandPolygon]).some(p=>inside(x+nx*5,y+ny*5/F,p))){nx=-nx;ny=-ny;}
   const count=Math.max(2,Math.ceil(length/55));return {a,b,nx,ny,length,samples:Array.from({length:count+1},(_,j)=>({x:a.x+dx*j/count,y:a.y+(b.y-a.y)*j/count,u:length*j/count}))};});
  contextCache.set(data,result);return result;
 }
 function shoreDistance(data,x,y){let best=Infinity;for(const e of contextSegments(data)){const dx=e.b.x-e.a.x,dy=(e.b.y-e.a.y)*F,t=Math.max(0,Math.min(1,((x-e.a.x)*dx+(y-e.a.y)*F*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-e.a.x-dx*t,(y-e.a.y)*F-dy*t));}return best;}
 function isBeach(data,x,y,margin=0){return !!data.regionLayout&&shoreDistance(data,x,y)<=BEACH_WIDTH+margin;}
 const SEA_WADE_DISTANCE=180,seaEdges=new WeakMap();
 function seaSample(data,x,y){
  if(data.waterTraversal!=='wade'||!data.regionLayout||(data.worldMainlands||[data.mainlandPolygon]).some(p=>inside(x,y,p)))return null;
  if(!seaEdges.has(data))seaEdges.set(data,segments(data));
  let best=null;
  for(const e of seaEdges.get(data)){
   const dx=e.b.x-e.a.x,dy=(e.b.y-e.a.y)*F,len2=dx*dx+dy*dy,t=((x-e.a.x)*dx+(y-e.a.y)*F*dy)/len2;
   if(t<0||t>1)continue;const point={x:e.a.x+dx*t,y:e.a.y+(e.b.y-e.a.y)*t},distance=Math.hypot(x-point.x,(y-point.y)*F),offshore=(x-point.x)*e.nx+(y-point.y)*F*e.ny;
   if(offshore<0||distance>SEA_WADE_DISTANCE||best&&distance>=best.distance)continue;
   // Continue adjoining political borders out to sea, so a beach cannot bypass a gate.
   const mid={x:(e.a.x+e.b.x)/2,y:(e.a.y+e.b.y)/2};let permitted=true;
   for(let i=0;i<data.regionPolygon.length;i++){
    const a=data.regionPolygon[i],b=data.regionPolygon[(i+1)%data.regionPolygon.length],same=(p,q)=>Math.hypot(p.x-q.x,(p.y-q.y)*F)<1;
    if(![a,b].some(p=>same(p,e.a)||same(p,e.b))||same(a,e.a)&&same(b,e.b)||same(a,e.b)&&same(b,e.a))continue;
    const isCoast=seaEdges.get(data).some(c=>same(a,c.a)&&same(b,c.b)||same(a,c.b)&&same(b,c.a));if(isCoast)continue;
    const cross=p=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);if(cross(mid)*cross({x,y})<-.01){permitted=false;break;}
   }
   if(permitted)best={id:'sea-'+data.countryId+'-'+data.regionId,type:'sea',depth:distance/SEA_WADE_DISTANCE,distance,shore:point};
  }
  return best;
 }
 function shorePath(ctx,edges){ctx.beginPath();for(const {a,b}of edges){ctx.moveTo(a.x,a.y*F);ctx.lineTo(b.x,b.y*F);}}
 function landClip(ctx,data){ctx.beginPath();for(const poly of data.worldMainlands||[data.mainlandPolygon]){poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y*F):ctx.moveTo(p.x,p.y*F));ctx.closePath();}ctx.clip();}
 function outsidePath(data,sx,sy,width,height){const p=new Path2D();p.rect(0,0,width,height);for(const poly of data.worldMainlands||[data.mainlandPolygon]){poly.forEach((v,i)=>i?p.lineTo(sx(v.x),sy(v.y)):p.moveTo(sx(v.x),sy(v.y)));p.closePath();}return p;}
 function oceanBands(ctx,edges,sx,sy,zoom,steps){
  const colors=[[0,[133,210,210]],[.13,[72,169,189]],[.4,[44,128,156]],[1,[36,89,111]]];
  ctx.lineCap=ctx.lineJoin='round';ctx.beginPath();for(const e of edges){ctx.moveTo(sx(e.a.x),sy(e.a.y));ctx.lineTo(sx(e.b.x),sy(e.b.y));}
  for(let i=steps;i>=1;i--){const t=i/steps,k=colors.findIndex(c=>c[0]>=t),a=colors[Math.max(0,k-1)],b=colors[k],f=(t-a[0])/(b[0]-a[0]||1);ctx.strokeStyle='rgb('+a[1].map((v,j)=>Math.round(v+(b[1][j]-v)*f)).join(',')+')';ctx.lineWidth=1700*t*zoom;ctx.stroke();}
 }
 function paintOcean(ctx,data){
  const edges=contextSegments(data);if(!edges.length)return;
  ctx.save();ctx.clip(outsidePath(data,x=>x,y=>y*F,data.width,data.height*F),'evenodd');ctx.lineCap='round';
  oceanBands(ctx,edges,x=>x,y=>y*F,1,64);
  ctx.restore();
 }
 function paintBeach(ctx,data){
  const edges=contextSegments(data);ctx.save();landClip(ctx,data);ctx.lineCap=ctx.lineJoin='round';shorePath(ctx,edges);
  ctx.strokeStyle={blue:'#eadbb6',green:'#e7c995',red:'#d5ad7c'}[data.countryId]||'#ead7a4';
  for(const [radius,alpha]of [[240,.015],[225,.025],[210,.035],[195,.05],[180,.08],[165,.12],[150,.18],[135,.26],[120,.36],[105,.45],[90,.50]]){ctx.lineWidth=radius*2;ctx.globalAlpha=alpha;ctx.stroke();}
  ctx.strokeStyle='#c0b79b';ctx.globalAlpha=.20;ctx.lineWidth=42;ctx.stroke();
  ctx.restore();
 }
 function create(data){
  const edges=contextSegments(data);
  function paintExtension(ctx,sx,sy,zoom,width,height){
   if(!data.regionLayout||!edges.length)return 0;const left=sx(0),top=sy(0),right=sx(data.width),bottom=sy(data.height);
   if(left<=0&&top<=0&&right>=width&&bottom>=height)return 0;
   const visible=edges.filter(e=>Math.max(sx(e.a.x),sx(e.b.x))+850*zoom>0&&Math.min(sx(e.a.x),sx(e.b.x))-850*zoom<width&&Math.max(sy(e.a.y),sy(e.b.y))+850*zoom>0&&Math.min(sy(e.a.y),sy(e.b.y))-850*zoom<height);if(!visible.length)return 0;
   ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.rect(left,top,right-left,bottom-top);ctx.clip('evenodd');ctx.clip(outsidePath(data,sx,sy,width,height),'evenodd');oceanBands(ctx,visible,sx,sy,zoom,32);ctx.restore();return 32;
  }
  function draw(ctx,sx,sy,zoom,time,viewport){
   if(!edges.length||viewport.overview||!viewport.effects||zoom<.15)return 0;
   const visible=edges.filter(e=>{const x1=sx(e.a.x),x2=sx(e.b.x),y1=sy(e.a.y),y2=sy(e.b.y),pad=800*zoom;return Math.max(x1,x2)+pad>0&&Math.min(x1,x2)-pad<viewport.width&&Math.max(y1,y2)+pad>0&&Math.min(y1,y2)-pad<viewport.height;});
   if(!visible.length)return 0;
   ctx.save();ctx.clip(outsidePath(data,sx,sy,viewport.width,viewport.height),'evenodd');ctx.lineCap=ctx.lineJoin='round';
   let fronts=0;
   for(const [edgeIndex,e]of visible.entries()){
    for(let front=0;front<2;front++){
     const phase=(time*.16+front*.5)%1,offshore=18+(1-phase)*170,alpha=Math.sin(Math.PI*phase)*.72;
     ctx.beginPath();for(const [i,p]of e.samples.entries()){const ripple=Math.sin(p.u*.029-time*1.6+edgeIndex)*6,offset=offshore+ripple,x=sx(p.x+e.nx*offset),y=sy(p.y+e.ny*offset/F);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
     ctx.strokeStyle='rgba(225,254,255,'+alpha*.35+')';ctx.lineWidth=12*zoom;ctx.stroke();ctx.strokeStyle='rgba(245,255,255,'+alpha+')';ctx.lineWidth=2.8*zoom;ctx.stroke();fronts++;
    }
    if(viewport.effects>1){ctx.strokeStyle='#b8eff02b';ctx.lineWidth=1.3*zoom;for(let row=0;row<3;row++){ctx.beginPath();for(const [i,p]of e.samples.entries()){const offset=270+row*150+Math.sin(p.u*.017+time*.8+row)*13,x=sx(p.x+e.nx*offset),y=sy(p.y+e.ny*offset/F);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}}
   }
   ctx.restore();return fronts;
  }
  return {active:edges.length>0,edges,draw,paintExtension};
 }
 const api={BEACH_SCALE,BEACH_WIDTH,SEA,SEA_WADE_DISTANCE,seaSample,segments,contextSegments,shoreDistance,isBeach,paintOcean,paintBeach,create};g.RegionCoast=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
