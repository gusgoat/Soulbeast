const W=require('./hemant-walk-demo/waterways.js'),G=require('./hemant-walk-demo/region-gate-geometry.js');
const F=.64;
function inside(x,y,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function fit(data){
 const water=W.create(data,{nodes:[],edges:[]}),sites=[...data.cities,...data.villages,...data.forests,...data.regionPlaces,...data.gates].map(p=>{
  if(p.type==='border')return {...G.bounds(p),id:p.id};
  const w=({capital:490,city:375,village:235,forest:310,colosseum:390,islandPort:190,dungeon:420,junction:160})[p.type]||310,h=({capital:650,city:570,village:200,forest:310,colosseum:260,islandPort:190,dungeon:420,junction:100})[p.type]||310;
  return {left:p.x-w/2,right:p.x+w/2,top:p.y*F-h*.94,bottom:p.y*F+h*.06,id:p.id};
 });
 const features=[...water.rivers.map(r=>({points:r.points,margin:r.width/2+95})),...water.lakes.map(l=>({points:l.points,margin:95}))].map(f=>({...f,left:Math.min(...f.points.map(p=>p.x))-f.margin,right:Math.max(...f.points.map(p=>p.x))+f.margin,top:Math.min(...f.points.map(p=>p.y*F))-f.margin,bottom:Math.max(...f.points.map(p=>p.y*F))+f.margin}));
 const shore=[];for(const r of water.rivers)for(let i=0;i<r.points.length;i++){const p=r.points[i],a=r.points[Math.max(0,i-1)],b=r.points[Math.min(r.points.length-1,i+1)],len=Math.hypot(b.x-a.x,(b.y-a.y)*F)||1,nx=-(b.y-a.y)*F/len,ny=(b.x-a.x)/len;for(const side of [-1,0,1])shore.push({x:p.x+nx*(r.width/2+35)*side,y:p.y+ny*(r.width/2+35)*side/F});}
 for(const l of water.lakes)for(const p of l.points)for(const [x,y]of [[0,0],[55,0],[-55,0],[0,55],[0,-55]])shore.push({x:p.x+x,y:p.y+y/F});
 function valid(dx,dy){
  if(shore.some(p=>!inside(p.x+dx,p.y+dy/F,data.regionPolygon)))return false;
  for(const site of sites){if(!features.some(f=>overlaps(site,{left:f.left+dx,right:f.right+dx,top:f.top+dy,bottom:f.bottom+dy})))continue;
   for(let x=site.left;x<=site.right;x+=30)for(let y=site.top;y<=site.bottom;y+=30)if(water.raw(x-dx,(y-dy)/F,95))return false;
  }
  for(const b of water.bridges){const box={left:b.x+dx-260,right:b.x+dx+260,top:b.y*F+dy-230,bottom:b.y*F+dy+230};if(sites.some(s=>s.id!=='region-junction-'+data.regionId&&overlaps(box,s)))return false;}
  return true;
 }
 const shifts=[];for(let y=-1400;y<=1400;y+=40)for(let x=-1400;x<=1400;x+=40)shifts.push({x,y,score:x*x+y*y});shifts.sort((a,b)=>a.score-b.score);
 const shift=shifts.find(p=>valid(p.x,p.y));if(!shift)throw Error('No safe enlarged water layout in '+data.countryId+'-'+data.regionId);
 for(const f of [...data.waterways.rivers,...data.waterways.lakes])for(const p of f.points){p[0]+=shift.x;p[1]+=shift.y;}
 data.waterLayoutOffset={x:shift.x,y:shift.y};return shift;
}
module.exports={fit};
