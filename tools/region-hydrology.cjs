/* Find a clear catchment without putting a river, lake, or bridge under landmarks. */
const placement=require('./region-gate-placement.cjs');
const SCALE=12,F=.64;
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function distance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);}
function choose(region,places,reserved=[]){
 const poly=region.polygon,xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]),boxes=[...places.map(placement.placeBox),...reserved],candidates=[];
 const river=[[-4,-32],[0,-23],[4,-14],[-1,-4],[2,7],[0,15]],lake=[[-14,24],[-10,16],[1,14],[12,18],[15,27],[6,35],[-8,34]];
 for(let y=Math.min(...ys)+20;y<Math.max(...ys)-20;y+=7)for(let x=Math.min(...xs)+20;x<Math.max(...xs)-20;x+=7){
  if(!inside([x,y],poly))continue;
  for(const scale of [1,.82,.68])for(const angle of [0,Math.PI/4,-Math.PI/4,Math.PI/2]){
   const c=Math.cos(angle),s=Math.sin(angle),transform=([u,v])=>[x+(u*c-v*s)*scale,y+(u*s+v*c)*scale],r=river.map(transform),l=lake.map(transform);
   if([...r,...l].some(p=>!inside(p,poly)||Math.min(...poly.map((a,i)=>distance(p,a,poly[(i+1)%poly.length])))<9))continue;
   const bounds={left:Math.min(...r.concat(l).map(p=>p[0]))*SCALE-80,right:Math.max(...r.concat(l).map(p=>p[0]))*SCALE+80,top:Math.min(...r.concat(l).map(p=>p[1]))*SCALE-80,bottom:Math.max(...r.concat(l).map(p=>p[1]))*SCALE+80};
   const center=transform([0,-8]),bridge={left:center[0]*SCALE-290,right:center[0]*SCALE+290,top:center[1]*SCALE-250,bottom:center[1]*SCALE+250};
   if(boxes.some(b=>placement.intersects(bounds,b,65)||placement.intersects(bridge,b,65)))continue;
   const clearance=Math.min(...poly.map((a,i)=>distance([x,y],a,poly[(i+1)%poly.length])));
   const away=Math.min(...places.map(p=>Math.hypot(x-p.world_position[0],y-p.world_position[1])));
   candidates.push({river:r,lake:l,score:clearance*.65+away*.35+scale*100,center:[x,y]});
  }
 }
 candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('No clear catchment for '+region.id);return candidates[0];
}
module.exports={choose};
