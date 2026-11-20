const geometry=require('./hemant-walk-demo/region-gate-geometry.js');
const F=.64,SCALE=12;
function inside([x,y],poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function overlap(a,b,c,d){const dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;if(!len)return null;const cross=p=>Math.abs(dx*(p[1]-a[1])-dy*(p[0]-a[0]));if(cross(c)>1e-5||cross(d)>1e-5)return null;const t=p=>((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len,lo=Math.max(0,Math.min(t(c),t(d))),hi=Math.min(1,Math.max(t(c),t(d)));if(hi-lo<1e-5)return null;return [[a[0]+dx*lo,a[1]+dy*lo],[a[0]+dx*hi,a[1]+dy*hi]];}
function shared(poly,other){const out=[];for(let i=0;i<poly.length;i++)for(let j=0;j<other.length;j++){const edge=overlap(poly[i],poly[(i+1)%poly.length],other[j],other[(j+1)%other.length]);if(edge)out.push(edge);}return out;}
function placeBox(p){const w=({capital:490,city:375,village:235,forest:310,colosseum:390,islandPort:190,dungeon:420})[p.type]||310;
 const ratios={capital:578/459,city:[0,573/383,561/375,485/464,530/500][p.art]||1.5,village:[1008/1500,990/1474,904/1487][p.art]||.68,forest:1.25,colosseum:1,islandPort:1};
 const h=Math.max(w*(ratios[p.type]||1),({capital:650,city:570,village:200,forest:310,colosseum:260,islandPort:190,dungeon:420})[p.type]||310);
 return {left:p.world_position[0]*SCALE-w/2,right:p.world_position[0]*SCALE+w/2,top:p.world_position[1]*SCALE-h*.94,bottom:p.world_position[1]*SCALE+h*.06};}
function intersects(a,b,margin=55){return a.left<b.right+margin&&a.right>b.left-margin&&a.top<b.bottom+margin&&a.bottom>b.top-margin;}
function choose(gate,region,other,places,valid){
 const edges=shared(region.polygon,other.polygon),original=gate.position||gate.world_position,candidates=[];
 for(const [a,b]of edges){const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<1)continue;
  let normal=[-dy/length,dx/length];const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(!inside([mid[0]+normal[0],mid[1]+normal[1]],region.polygon))normal=normal.map(v=>-v);
  const steps=Math.max(4,Math.ceil(length));
  // Keep the doorway beside the border; only turn the landing inward at corners.
  const center=region.polygon.reduce((s,p)=>[s[0]+p[0]/region.polygon.length,s[1]+p[1]/region.polygon.length],[0,0]);
  for(let i=1;i<steps;i++){const t=i/steps,point=[a[0]+dx*t,a[1]+dy*t],toward=[center[0]-point[0],center[1]-point[1]],len=Math.hypot(...toward),directions=[normal,toward.map(v=>v/len)];
  for(const direction of directions)for(const inset of [25,50,90,130,170])for(const gateWidth of (region.id.startsWith('B')?[540,440,360]:region.id==='GW'?[360,320]:[440,360,320])){const position=[point[0]+normal[0]*inset/SCALE,point[1]+normal[1]*inset/SCALE],landing=[position[0]+direction[0]*180/SCALE,position[1]+direction[1]*180/SCALE];
   if(!inside(position,region.polygon)||!inside(landing,region.polygon)||!inside([position[0]+direction[0]*360/SCALE,position[1]+direction[1]*360/SCALE],region.polygon))continue;
   const gateBasis=geometry.basis([dx,dy]),box=geometry.bounds({x:position[0]*SCALE,y:position[1]*SCALE/F,gateBasis,gateWidth,countryId:gate.countryId});
   if(places.some(p=>intersects(box,placeBox(p),15)))continue;
   if(valid&&!valid(position,direction,{gateBasis,gateWidth}))continue;
   candidates.push({position,inward:{x:direction[0],y:direction[1]/F},gateBasis,gateWidth,borderPosition:point,borderInset:inset,score:(540-gateWidth)*1000000+inset*10000+Math.hypot(point[0]-original[0],point[1]-original[1])});
  }
  }
 }
 candidates.sort((a,b)=>a.score-b.score);if(!candidates.length)throw Error('No clear gate position '+gate.id+' in '+region.id);return candidates[0];
}
module.exports={choose,placeBox,intersects,shared};
