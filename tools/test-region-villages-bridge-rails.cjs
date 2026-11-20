const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('./hemant-walk-demo/country-regions-data.js').countries,N=require('./hemant-walk-demo/navigation.js'),T=require('./hemant-walk-demo/terrain.js'),G=require('./hemant-walk-demo/region-gate-geometry.js');
const baseline=process.env.VILLAGE_BASELINE?require(path.resolve(process.env.VILLAGE_BASELINE)).countries:null,rows=[];
for(const[country,c]of Object.entries(M))for(const[region,d]of Object.entries(c.regions)){
 const n=N.create(d),t=T.create(d,n);n.setTerrain(t);let minimum=Infinity;
 for(let i=0;i<d.villages.length;i++)for(const q of d.villages.slice(i+1)){const distance=n.distance(d.villages[i],q);minimum=Math.min(minimum,distance);assert(distance>=450,country+region+' crowded villages');}
 if(baseline){const old=baseline[country].regions[region];for(const key of ['cities','forests','gates','waterways','regionPolygon'])assert.deepEqual(d[key],old[key],key+' preserved');assert.deepEqual(d.villages.map(p=>p.id),old.villages.map(p=>p.id));for(const village of d.villages){const before=old.villages.find(p=>p.id===village.id);if(village.id!=='green-village-8')assert.deepEqual(village,before,'Unchanged village');else{assert(n.distance(before,village)>600);assert(!t.water.raw(village.x,village.y,210));const box={left:village.x-117.5,right:village.x+117.5,top:village.y*.64-200,bottom:village.y*.64+15};for(const gate of d.gates){const b=G.bounds(gate);assert(!(box.left<b.right+80&&box.right>b.left-80&&box.top<b.bottom+80&&box.bottom>b.top-80),'Village remains clear of gate artwork');}assert(n.route(n.spawnAt(d.cities[0]),village.id).length,'Moved village reachable');}}}
 for(const bridge of t.water.bridges){
  const length=n.distance(bridge.a,bridge.b),ux=(bridge.b.x-bridge.a.x)/length,uy=(bridge.b.y-bridge.a.y)*.64/length,nx=-uy,ny=ux;
  const at=(along,side)=>({x:bridge.a.x+ux*along+nx*side,y:bridge.a.y+(uy*along+ny*side)/.64});
  assert(n.playerClear(bridge.a,bridge.b),country+region+' bridge end-to-end');
  for(const side of [-1,1])for(const along of [35,length/2,length-35]){const inside=at(along,0),outside=at(along,side*105);assert(!n.playerClear(inside,outside),'Cannot exit bridge sideways');assert(!n.playerClear(outside,inside),'Cannot enter bridge sideways');}
  for(const end of [0,length]){const inner=at(end===0?25:length-25,0),outer=at(end===0?-25:length+25,0);assert(n.playerClear(inner,outer),'Road entrance stays open');}
 }
 rows.push({country,region,minVillageDistance:Math.round(minimum),bridgeRailSides:t.water.bridgeRails.length});
}
const moved=M.green.regions.W.villages.filter(p=>['green-village-8','green-village-9'].includes(p.id));
console.log('PASS village spacing and bridge end-only entrances in all 12 regions');console.table(rows);
if(process.env.VILLAGE_AUDIT_OUTPUT)fs.writeFileSync(process.env.VILLAGE_AUDIT_OUTPUT,JSON.stringify({passed:true,regions:rows,movedPairDistance:N.distance(...moved)},null,2));
