(function(g){'use strict';
 const F=.64,colors={blue:'#dce7ed',green:'#587741',red:'#92533c'};
 const patterns=new WeakMap(),plans=new WeakMap();
 function inside(x,y,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
 const lands=data=>data.worldMainlands||[data.mainlandPolygon];
 const onLand=(data,x,y)=>lands(data).some(p=>inside(x,y,p));
 function outline(ctx,poly){ctx.moveTo(poly[0].x,poly[0].y*F);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y*F);ctx.closePath();}
 function clipLand(ctx,data){ctx.beginPath();for(const p of lands(data))outline(ctx,p);ctx.clip();}
 function clipOutside(ctx,data){ctx.beginPath();ctx.rect(0,0,data.width,data.height*F);outline(ctx,data.regionPolygon);ctx.clip('evenodd');}
 function pattern(ctx,image){if(!image?.naturalWidth)return null;let cache=patterns.get(ctx);if(!cache){cache=new WeakMap();patterns.set(ctx,cache);}let p=cache.get(image);if(!p){p=ctx.createPattern(image,'repeat');p.setTransform(new DOMMatrix().scale(.45));cache.set(image,p);}return p;}
 function plan(data){
  if(!data.regionLayout)return [];if(plans.has(data))return plans.get(data);
  const coasts=(typeof module!=='undefined'?require('./region-coast.js'):g.RegionCoast).segments(data),result=[];
  const gates=(data.gates||[]);
  const ratio={blue:881/1500,green:.78*1024/1536,red:592/853}[data.countryId]||.6;
  for(let i=0;i<data.regionPolygon.length;i++){
   const a=data.regionPolygon[i],b=data.regionPolygon[(i+1)%data.regionPolygon.length];
   if(coasts.some(e=>e.a===a&&e.b===b))continue;
   const dx=b.x-a.x,dy=(b.y-a.y)*F,len=Math.hypot(dx,dy);if(len<70)continue;
   let nx=-dy/len,ny=dx/len;const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(inside(mid.x+nx*5,mid.y+ny*5/F,data.regionPolygon)){nx=-nx;ny=-ny;}
   for(const row of [1,0]){
    const count=Math.max(1,Math.ceil(len/(row?500:360)));
    for(let j=0;j<count;j++){
     const t=(j+.5)/count,w=(row?980:720)+((i*113+j*67)%170),h=w*ratio;
     const corners=[[-w/2,-h*.94],[w/2,-h*.94],[w/2,h*.06],[-w/2,h*.06]];
     const offset=Math.max(0,-Math.min(...corners.map(([x,y])=>x*nx+y*ny)))+55+row*390;
     const x=a.x+dx*t+nx*offset,y=a.y+(b.y-a.y)*t+ny*offset/F;
     const box={left:x-w/2,right:x+w/2,top:y*F-h*.94,bottom:y*F+h*.06};
     if(box.right<0||box.left>data.width||box.bottom<0||box.top>data.height*F||!onLand(data,x,y)||inside(x,y,data.regionPolygon))continue;
     if(gates.some(g=>{const dx=x-g.x,dy=(y-g.y)*F,ix=g.inward.x,iy=g.inward.y*F,along=-(dx*ix+dy*iy),side=Math.abs(dx*iy-dy*ix);return Math.hypot(dx,dy)<220||(along> -80&&along<850&&side<175);}))continue;
     result.push({x,y,w,h,row,edge:i,...box});
    }
   }
  }
  result.sort((a,b)=>b.row-a.row||a.y-b.y);plans.set(data,result);return result;
 }
 function paintLand(ctx,data,images){
  ctx.save();ctx.globalCompositeOperation='destination-over';ctx.beginPath();for(const p of lands(data))outline(ctx,p);
  ctx.fillStyle=pattern(ctx,images?.snow)||colors[data.countryId];ctx.fill();ctx.restore();
 }
 function paintMountains(ctx,data,images){
  const image=images?.mountain;if(!image?.naturalWidth)return 0;
  ctx.save();clipOutside(ctx,data);clipLand(ctx,data);
  const cropHeight=image.naturalHeight*(data.countryId==='green'?.78:1),ranges=plan(data);
  for(const o of ranges){ctx.globalAlpha=o.row?.68:.96;ctx.drawImage(image,0,0,image.naturalWidth,cropHeight,o.left,o.top,o.w,o.h);}
  ctx.restore();return ranges.length;
 }
 // Continue the same world-aligned ground beyond the existing tile-cache bounds.
 // This uses the current texture; cached mountain images are never redrawn here.
 function paintViewport(ctx,data,images,sx,sy,zoom,width,height){
  if(!data.regionLayout)return;
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.rect(sx(0),sy(0),data.width*zoom,data.height*F*zoom);ctx.clip('evenodd');
  ctx.translate(sx(0),sy(0));ctx.scale(zoom,zoom);clipLand(ctx,data);ctx.fillStyle=pattern(ctx,images?.snow)||colors[data.countryId];
  ctx.fillRect(-sx(0)/zoom,-sy(0)/zoom,width/zoom,height/zoom);ctx.restore();
 }
 const api={plan,lands,onLand,paintLand,paintMountains,paintViewport};g.RegionBackdrop=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
