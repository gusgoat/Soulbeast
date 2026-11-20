const assert=require('node:assert/strict');
const map=require('./hemant-walk-demo/country-regions-data.js'),navigation=require('./hemant-walk-demo/navigation.js'),terrain=require('./hemant-walk-demo/terrain.js'),api=require('./hemant-walk-demo/country-regions.js');
const plan=require('../content/country-regions-v5-plan.json');
const gateGeometry=require('./hemant-walk-demo/region-gate-geometry.js'),gatePlacement=require('./region-gate-placement.cjs');
const regions=map.regions,all=[],gates=new Map(),stats=[];
assert.deepEqual(Object.keys(regions).sort(),['E','N','S','W']);
for(const [id,data]of Object.entries(regions)){
 const nav=navigation.create(data),land=terrain.create(data,nav);nav.setTerrain(land);
 const coast=require('./hemant-walk-demo/region-coast.js'),coastEdges=coast.segments(data);assert.equal(coast.BEACH_SCALE,2);assert.equal(coastEdges.length>0,id!=='E','Beaches must stay on actual coast, not the eastern foreign border');
 for(const e of coastEdges){const x=(e.a.x+e.b.x)/2+e.nx*50,y=(e.a.y+e.b.y)/2+e.ny*50/data.flatten;assert(!api.inside(x,y,data.mainlandPolygon),id+' waves point inland');const o=data.regionOrigin,wx=(x-o.pad)/o.scale+o.left,wy=(y-o.topPad)*data.flatten/o.scale+o.top;for(const other of ['green','red'])assert(!api.inside(wx,wy,plan.countries[other].mainland_outline.map(([x,y])=>({x,y}))),id+' sea overlaps a neighboring country');}
 const mini=api.minimapView(data,{x:data.width/2,y:data.height/2});assert.equal(mini.zoom,2);assert.deepEqual(mini.point(data.width/2,data.height/2),{x:90,y:90});assert.equal(mini.size,90);for(const p of [{x:0,y:0},{x:data.width,y:data.height}]){const view=api.minimapView(data,p);assert(view.left>=0&&view.top>=0&&view.left+view.size<=180&&view.top+view.size<=180);}
 all.push(...data.cities,...data.villages,...data.forests,...data.regionPlaces.filter(p=>p.type!=='junction'));
 assert(land.mountains.length>=1,id+' needs mountains');assert(land.trees.filter(p=>!p.shrub).every(p=>p.w>=115&&p.w<=160));
 assert.equal(land.water.lakes.length,1);assert.equal(land.water.rivers.length,1);assert(land.water.bridges.length>0);
 for(const p of nav.places)assert(nav.walkable(p.x,p.y),id+' blocked destination '+p.id);
 for(const [a,b]of nav.edges)assert(nav.clear(nav.nodes[a],nav.nodes[b]),id+' blocked road');
 for(const b of land.water.bridges){assert(nav.clear(b.a,b.b),id+' bridge deck blocked');assert(land.water.onBridge(b.x,b.y));assert(b.riverFraction>=.3&&b.riverFraction<=.7,id+' bridge must cross the middle reach');const river=land.water.rivers.find(r=>r.id===b.riverId),i=river.points.findIndex(p=>p.x===b.x&&p.y===b.y),a=river.points[i-1],c=river.points[i+1],dx=c.x-a.x,dy=(c.y-a.y)*data.flatten,ux=b.b.x-b.a.x,uy=(b.b.y-b.a.y)*data.flatten;assert(Math.abs((dx*ux+dy*uy)/(Math.hypot(dx,dy)*Math.hypot(ux,uy)))<1e-9,id+' bridge must be perpendicular to the river');}
 const spawn=nav.spawnAt(data.cities[0]);assert(nav.walkable(spawn.x,spawn.y));
 const roamers=require('./hemant-walk-demo/roamers.js').createRegional(data,nav);assert.equal(roamers.actors.length,10,id+' shadow count');
 function safeShadows(){for(const a of roamers.actors){assert(nav.walkable(a.x,a.y),id+' shadow obstacle');assert(nav.nearest(a).distance>=210-1e-6,id+' shadow on road');for(const town of [...data.cities,...data.villages])assert(nav.distance(a,town)>=(town.type==='capital'?1400:town.type==='city'?700:500),id+' shadow near '+town.id);}}
 safeShadows();for(let step=0;step<1200;step++){roamers.update(.1);if(step%20===0)safeShadows();}safeShadows();assert.equal(roamers.actors.length,10);
 for(const [placeId,width,height,anchor]of [['forest-2',310,310,.94],['blue-colosseum',390,260,.97]]){const site=nav.places.find(p=>p.id===placeId);if(!site)continue;const box={left:site.x-width/2,right:site.x+width/2,top:site.y*data.flatten-height*anchor,bottom:site.y*data.flatten+height*(1-anchor)};for(let x=box.left;x<=box.right;x+=20)for(let y=box.top;y<=box.bottom;y+=20)assert(!land.water.raw(x,y/data.flatten,70),id+' landmark art touches shoreline: '+placeId);for(const b of land.water.bridges)assert(!(box.left<b.x+260&&box.right>b.x-260&&box.top<b.y*data.flatten+230&&box.bottom>b.y*data.flatten-230),id+' landmark art overlaps bridge '+placeId);}
 for(const p of nav.places)assert(nav.route(spawn,p.id).length,id+' unreachable '+p.id);
 for(const gate of data.gates){
  const box=gateGeometry.bounds(gate),o=data.regionOrigin,tx=o.pad-o.left*o.scale,ty=o.topPad*data.flatten-o.top*o.scale;
  for(const p of [...data.cities,...data.villages,...data.forests,...data.regionPlaces.filter(p=>p.type!=='junction')]){const b=gatePlacement.placeBox(p),local={left:b.left+tx,right:b.right+tx,top:b.top+ty,bottom:b.bottom+ty};assert(!gatePlacement.intersects(box,local,15),id+' gate art overlaps '+p.id+': '+gate.id);}
  const arrival=api.arrival(gate);assert(nav.walkable(arrival.x,arrival.y),id+' blocked arrival '+gate.id);assert(nav.clear(arrival,gate),id+' blocked gate approach '+gate.id);
  if(gate.regional){if(!gates.has(gate.id))gates.set(gate.id,[]);gates.get(gate.id).push([id,gate]);const q=new URL(api.travelURL(gate,'?country=blue&layout=regions-v5&packlord3d=1'),'http://local');assert.equal(q.searchParams.get('region'),gate.targetRegion);assert.equal(q.searchParams.get('arrival'),gate.id);}
 }
 stats.push({region:id,width:data.width,height:data.height,groundPixels:Math.floor(data.width/2)*Math.floor(data.height*.64/2),trees:land.trees.length,mountains:land.mountains.length,bridges:land.water.bridges.length,places:nav.places.length});
}
assert.equal(gates.size,5);for(const [id,pair]of gates){assert.equal(pair.length,2,id+' reciprocal');assert.equal(pair[0][1].targetRegion,pair[1][0]);assert.equal(pair[1][1].targetRegion,pair[0][0]);}
assert.equal(all.filter(p=>p.type==='capital').length,1);assert.equal(all.filter(p=>p.type==='city').length,4);assert.equal(all.filter(p=>p.type==='village').length,16);
assert.deepEqual(all.map(p=>p.id).sort(),plan.countries.blue.places.map(p=>p.id).sort(),'Every original place appears exactly once');
const villages=all.filter(p=>p.type==='village');assert.equal(villages.filter(p=>p.neighbor_country==='green').length,8);assert.equal(villages.filter(p=>p.neighbor_country==='red').length,8);
assert.equal(Object.values(regions).flatMap(p=>p.gates).filter(p=>!p.regional).length,5);
console.log('PASS four regions, every destination and road, water/bridge crossings, reciprocal gates, arrivals, 8+8 villages and retained place IDs');console.table(stats);
