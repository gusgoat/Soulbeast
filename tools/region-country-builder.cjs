const gates=require('./region-gate-placement.cjs'),geometry=require('./hemant-walk-demo/region-gate-geometry.js'),waterAPI=require('./hemant-walk-demo/waterways.js');
const F=.64,SCALE=12,PAD=650,TOP=900;
const blueWater={
 N:{river:[[578,88],[576,99],[574,111],[572,124],[567,135]],lake:[[553,134],[564,129],[576,135],[574,146],[562,151],[550,145]]},
 W:{river:[[345,199],[353,209],[360,222],[370,234],[379,245]],lake:[[370,245],[382,239],[396,244],[400,255],[390,263],[374,260]]},
 E:{river:[[625,188],[620,204],[624,221],[633,235],[634,248]],lake:[[627,246],[640,241],[651,247],[652,260],[641,267],[629,261]]},
 S:{river:[[365,410],[367,424],[379,438],[390,452],[399,466]],lake:[[392,465],[404,458],[417,467],[414,481],[400,487],[389,477]]}
};
const blueRanges={N:[[425,116,720],[500,90,800],[610,76,820]],W:[[298,279,700],[330,327,650],[446,312,640]],E:[[648,185,620],[584,290,660],[648,317,650]],S:[[310,446,650],[344,520,700],[502,416,640]]};
function coastalEdges(id,plan){const country=plan.countries[id],foreign=Object.entries(plan.countries).filter(([key])=>key!==id).flatMap(([,c])=>c.mainland_outline.map((p,i)=>[p,c.mainland_outline[(i+1)%c.mainland_outline.length]]));return country.mainland_outline.map((p,i)=>[p,country.mainland_outline[(i+1)%country.mainland_outline.length]]).filter(([a,b])=>{const m=[(a[0]+b[0])/2,(a[1]+b[1])/2];return !foreign.some(([c,d])=>{const dx=d[0]-c[0],dy=d[1]-c[1],t=((m[0]-c[0])*dx+(m[1]-c[1])*dy)/(dx*dx+dy*dy);return t>=-.001&&t<=1.001&&Math.hypot(m[0]-c[0]-dx*t,m[1]-c[1]-dy*t)<.01;});});}
function normalize(p,id){return p.id==='seven-floor-dungeon'?{...p,type:'dungeon',art:'dungeon',country:id,levels:[1,60],description:'มหาวงกตดันเจี้ยน 7 ชั้น · ใช้ทางเข้าดันเจี้ยนเดิม'}:p;}
function build(id,plan){
 const country=plan.countries[id],names=Object.fromEntries(country.regions.map(r=>[r.code,r.name])),coast=coastalEdges(id,plan),regions={};
 const allPlaces=country.places.map(p=>normalize(p,id));
 for(const r of country.regions){
  const xs=r.polygon.map(p=>p[0]),ys=r.polygon.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),project=([x,y])=>({x:PAD+(x-left)*SCALE,y:TOP+(y-top)*SCALE/F});
  const localPlaces=allPlaces.filter(p=>p.region===r.code),places=localPlaces.map(p=>({...p,...project(p.world_position),kind:undefined})),hub=project(country.routing_hubs[r.code]);
  const portals=[];
  function addPortal(g,regional,targetCountry,targetRegion,other){
   const pose=gates.choose({...g,countryId:id},r,other,localPlaces),code=g.code;
   const nearest=(c,reg,point)=>plan.countries[c].places.filter(p=>p.type==='village'&&p.region===reg).sort((a,b)=>Math.hypot(a.world_position[0]-point[0],a.world_position[1]-point[1])-Math.hypot(b.world_position[0]-point[0],b.world_position[1]-point[1]))[0]?.id;
   portals.push({...project(pose.position),...pose,position:undefined,countryId:id,id:g.id,type:'border',regional,targetCountry,targetRegion,code,
    localId:regional?undefined:nearest(id,r.code,g.world_position),targetId:regional?undefined:nearest(targetCountry,targetRegion,g.world_position),
    name:regional?'ประตูสู่'+names[targetRegion]:code+' · '+plan.countries[targetCountry].name,
    description:regional?'เดินผ่านประตูเพื่อเดินทางไป'+names[targetRegion]:'ชายแดน'+country.name+' ↔ '+plan.countries[targetCountry].name});
  }
  for(const g of country.internal_gates.filter(g=>g.regions.includes(r.code))){const target=g.regions.find(v=>v!==r.code);addPortal(g,true,id,target,country.regions.find(v=>v.code===target));}
  for(const g of plan.international_gates){const index=g.countries.indexOf(id);if(index<0||g.regions[index]!==r.code)continue;const target=g.countries[1-index],reg=g.regions[1-index];addPortal(g,false,target,reg,plan.countries[target].regions.find(v=>v.code===reg));}
  const anchor=places.find(p=>p.type==='capital')||places.find(p=>p.type==='city'),junction={id:'region-junction-'+(id==='blue'?'':id+'-')+r.code,type:'junction',name:'ทางแยก'+r.name,...hub};
  const extra=[...places.filter(p=>!['capital','city','village','forest'].includes(p.type)),junction],local=[...places,...portals,junction];
  const base={countryId:id,country:country.name,regionLayout:'v5',waterTraversal:'wade',riverWidthScale:2,lakeAreaScale:4,regionId:r.code,regionName:r.name,
   width:Math.ceil((Math.max(...xs)-left)*SCALE+PAD*2),height:Math.ceil((Math.max(...ys)-top)*SCALE/F+TOP+650),flatten:F,
   regionPolygon:r.polygon.map(project),mainlandPolygon:country.mainland_outline.map(project),worldMainlands:Object.values(plan.countries).map(c=>c.mainland_outline.map(project)),worldCoastline:Object.keys(plan.countries).flatMap(key=>coastalEdges(key,plan)).map(edge=>edge.map(project)),coastline:coast.map(edge=>edge.map(project)),regionOrigin:{left,top,scale:SCALE,pad:PAD,topPad:TOP},
   cities:places.filter(p=>p.type==='capital'||p.type==='city'),villages:places.filter(p=>p.type==='village'),forests:places.filter(p=>p.type==='forest'),regionPlaces:extra,
   gates:portals,roads:[],spawn:{...hub},entryId:anchor.id,treeWidth:[115,160],treeDensity:2.2,projection:{x:0,y:0,scale:1,pad:0},waterways:{rivers:[],lakes:[]},mountains:[]};
  const gateBoxes=portals.map(p=>{const b=geometry.bounds(p),tx=left*SCALE-PAD,ty=top*SCALE-TOP*F;return {left:b.left+tx-50,right:b.right+tx+50,top:b.top+ty-50,bottom:b.bottom+ty+50};});
  const hydro=id==='blue'?blueWater[r.code]:(r.waterways||require('./region-hydrology.cjs').choose(r,localPlaces,gateBoxes)),waterPoints=points=>points.map(p=>{const q=project(p);return [q.x,q.y*F];});
  base.waterways.rivers=[{id:'v5-river-'+r.code,name:'ลำน้ำ'+r.name,width:200,points:waterPoints(hydro.river)}];
  base.waterways.lakes=[{id:'v5-lake-'+r.code,name:'ทะเลสาบ'+r.name,points:waterPoints(hydro.lake.map(p=>{const o=hydro.river.at(-1);return [o[0]+(p[0]-o[0])*2,o[1]+(p[1]-o[1])*2];}))}];
  require('./region-wide-water-fit.cjs').fit(base);
  const water=waterAPI.create(base,{nodes:[],edges:[]});if(!water.bridges.length)throw Error('No middle river crossing '+id+' '+r.code);
  function dryPose(position,normal,style){const p=project(position);if(water.raw(p.x,p.y,120)||water.raw(p.x+normal[0]*180,p.y+normal[1]*180/F,40))return false;if(id==='blue')return true;const basis=geometry.basis([-normal[1],normal[0]]),box=geometry.bounds({...p,gateBasis:style?.gateBasis||basis,countryId:id,gateWidth:style?.gateWidth||(id==='blue'?540:r.id==='GW'?360:440)});for(let x=box.left;x<=box.right;x+=80)for(let y=box.top;y<=box.bottom;y+=80)if(water.raw(x,y/F,50))return false;return true;}
  const settled=[];
  for(const gate of portals){
   const safePose=(position,normal,style)=>{if(!dryPose(position,normal,style))return false;const p=project(position),box=geometry.bounds({...p,countryId:id,gateBasis:style?.gateBasis||geometry.basis([-normal[1],normal[0]]),gateWidth:style?.gateWidth||(r.id==='GW'?360:440)});return !settled.some(other=>{if(gates.intersects(box,geometry.bounds(other),40))return true;for(let n=0;n<=180;n+=20)if(Math.hypot(p.x+normal[0]*n-other.x,(p.y-other.y)*F+normal[1]*n)<150)return true;return false;});};
   const normalized=[gate.inward.x,gate.inward.y*F],position=[(gate.x-PAD)/SCALE+left,(gate.y-TOP)*F/SCALE+top];if(safePose(position,normalized,gate)){settled.push(gate);continue;}const original=gate.regional?country.internal_gates.find(g=>g.id===gate.id):plan.international_gates.find(g=>g.id===gate.id),other=gate.regional?country.regions.find(v=>v.code===gate.targetRegion):plan.countries[gate.targetCountry].regions.find(v=>v.code===gate.targetRegion);const pose=gates.choose({...original,countryId:id},r,other,localPlaces,safePose);Object.assign(gate,project(pose.position),pose,{position:undefined});settled.push(gate);}
  base.roads=local.filter(p=>p!==junction).map(p=>({a:junction.id,b:p.id,via:p.type==='border'?[[p.x+p.inward.x*360,p.y+p.inward.y*360]]:[]}));
  if(id!=='blue')for(const b of water.bridges){const a={...b.a,id:'bridge-'+id+'-'+r.code+'-a',type:'junction',name:'ทางขึ้นสะพาน'},c={...b.b,id:'bridge-'+id+'-'+r.code+'-b',type:'junction',name:'ทางลงสะพาน'};extra.push(a,c);base.roads.push({a:junction.id,b:a.id,via:[]},{a:a.id,b:c.id,via:[]});}
  base.mountains=id==='blue'?blueRanges[r.code].map(([x,y,w])=>({...project([x,y]),w})):[];
  // The busy western green region needs a little more walking room between its
  // eight border villages and two cities. Its atlas polygon and all war IDs stay
  // fixed; this local projection remains below the existing blue south cache size.
  if(id==='green'&&r.code==='W'){
   const factor=14/12,points=new Set([...base.cities,...base.villages,...base.forests,...base.regionPlaces,...base.gates,...base.regionPolygon,...base.mainlandPolygon,...base.worldMainlands.flat(),...base.worldCoastline.flat(),...base.coastline.flat(),...base.mountains,base.spawn]);
   for(const p of points){p.x*=factor;p.y*=factor;}
   for(const road of base.roads)for(const p of road.via){p[0]*=factor;p[1]*=factor;}
   for(const feature of [...base.waterways.rivers,...base.waterways.lakes])for(const p of feature.points){p[0]*=factor;p[1]*=factor;}
   base.width=Math.ceil(base.width*factor);base.height=Math.ceil(base.height*factor);base.regionOrigin={...base.regionOrigin,scale:SCALE*factor,pad:PAD*factor,topPad:TOP*factor};
  }
  const offsets=require('../content/country-region-place-offsets.json')[id]?.[r.code]||{};
  base.placeAdjustments=[];
  for(const p of base.villages){const offset=offsets[p.id];if(!offset)continue;p.x+=offset.x;p.y+=offset.projectedY/F;const o=base.regionOrigin;p.world_position=[(p.x-o.pad)/o.scale+o.left,(p.y-o.topPad)*F/o.scale+o.top];p.position=[...p.world_position];base.placeAdjustments.push({id:p.id,...offset});}
  regions[r.code]=base;
 }
 return {countryId:id,name:country.name,islands:country.islands,regions};
}
module.exports={build};
