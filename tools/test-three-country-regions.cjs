const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const generated=require('./hemant-walk-demo/country-regions-data.js'),plan=require('../content/country-regions-v5-plan.json');
const N=require('./hemant-walk-demo/navigation.js'),T=require('./hemant-walk-demo/terrain.js'),R=require('./hemant-walk-demo/roamers.js'),C=require('./hemant-walk-demo/region-coast.js'),A=require('./hemant-walk-demo/country-regions.js'),G=require('./hemant-walk-demo/region-gate-geometry.js'),L=require('./hemant-walk-demo/road-lamp-placement.js');
const B=require('./hemant-walk-demo/bandits.js'),Chest=require('./hemant-walk-demo/treasures.js');
const stats=[],scenes=new Map(),international=new Map();
const width=p=>({capital:490,city:375,village:235,forest:310,colosseum:390,islandPort:190,dungeon:420})[p.type]||310;
const height=p=>({capital:650,city:570,village:200,forest:310,colosseum:260,islandPort:190,dungeon:420})[p.type]||310;
const box=p=>({left:p.x-width(p)/2,right:p.x+width(p)/2,top:p.y*.64-height(p)*.94,bottom:p.y*.64+height(p)*.06});
const overlap=(a,b,margin=0)=>a.left<b.right+margin&&a.right>b.left-margin&&a.top<b.bottom+margin&&a.bottom>b.top-margin;
for(const [id,c]of Object.entries(generated.countries)){
 const places=[],localGates=new Map();assert.deepEqual(Object.keys(c.regions).sort(),['E','N','S','W']);
 for(const [code,d]of Object.entries(c.regions)){
  const nav=N.create(d),terrain=T.create(d,nav);nav.setTerrain(terrain);const key=id+'-'+code;scenes.set(key,{d,nav,terrain});
  assert(terrain.mountains.length>0,key+' mountains');assert(terrain.trees.length>0,key+' trees');
  const actual=[...d.cities,...d.villages,...d.forests,...d.regionPlaces.filter(p=>p.type!=='junction')];places.push(...actual);
  for(const name of plan.countries[id].regions.find(r=>r.code===code).important_places)assert(actual.some(p=>p.name===name&&!['city','capital','village'].includes(p.type)),key+' missing landmark '+name);
  for(const p of nav.places)assert(nav.walkable(p.x,p.y),key+' blocked '+p.id);
  for(const [a,b]of nav.edges)assert(nav.clear(nav.nodes[a],nav.nodes[b]),key+' blocked road');
  const spawn=nav.spawnAt(d.cities[0]);assert(nav.walkable(spawn.x,spawn.y),key+' spawn');
  for(const p of nav.places)assert(nav.route(spawn,p.id).length,key+' unreachable '+p.id);
  for(const p of actual.filter(p=>['forest','colosseum','dungeon'].includes(p.type))){const b=box(p);for(let x=b.left;x<=b.right;x+=25)for(let y=b.top;y<=b.bottom;y+=25)assert(!terrain.water.raw(x,y/.64,60),key+' landmark image overlaps freshwater '+p.id);for(const bridge of terrain.water.bridges)assert(!overlap(b,{left:bridge.x-260,right:bridge.x+260,top:bridge.y*.64-230,bottom:bridge.y*.64+230}),key+' landmark image overlaps bridge '+p.id);}
  assert.equal(terrain.water.rivers.length,1,key+' river');assert.equal(terrain.water.lakes.length,1,key+' lake');assert(terrain.water.bridges.length,key+' bridge');
  for(const b of terrain.water.bridges){assert(b.riverFraction>=.3&&b.riverFraction<=.7,key+' middle crossing');assert(nav.clear(b.a,b.b),key+' bridge access');if(process.argv.includes('--assets'))for(const part of ['deck','rail'])assert(fs.existsSync(path.join(__dirname,'../assets/country-walk/region-bridges-v5',id+'-'+b.regionArt+'-'+part+'.png')),key+' bridge render');}
  const bandits=B.create(d,nav,terrain),treasures=Chest.create(nav,bandits.actors,{getItem:()=>null},{},Math.random,id);
  assert.equal(treasures.chests.length,bandits.actors.length,key+' bandit chests');
  for(const chest of treasures.chests){assert(nav.clear(chest.owner.home,chest),key+' chest reachable from guard');assert(nav.clear(chest.owner.home,nav.nearest(chest.owner.home).foot),key+' guard reachable from road');}
  const roam=R.createRegional(d,nav);assert.equal(roam.actors.length,10,key+' shadows');
  function safe(){for(const a of roam.actors){assert(nav.walkable(a.x,a.y));assert(nav.nearest(a).distance>=210-1e-6,key+' road shadow');for(const p of [...d.cities,...d.villages])assert(nav.distance(a,p)>=(p.type==='capital'?1400:p.type==='city'?700:500),key+' shadow near settlement');}}
  safe();for(let step=0;step<1200;step++){roam.update(.1);if(step%30===0)safe();}safe();
  for(const gate of d.gates){const b=G.bounds(gate);for(const p of actual)assert(!overlap(b,box(p),10),key+' gate art overlaps '+p.id+':'+gate.id);const arrival=A.arrival(gate);assert(nav.walkable(arrival.x,arrival.y)&&nav.clear(arrival,gate),key+' gate arrival '+gate.id);const store=gate.regional?localGates:international;if(!store.has(gate.id))store.set(gate.id,[]);store.get(gate.id).push({country:id,region:code,gate});}
  for(const gate of d.gates)for(const other of d.gates.filter(p=>p!==gate)){
   if(id!=='blue')assert(!overlap(G.bounds(gate),G.bounds(other),40),key+' gate images overlap '+gate.id+'/'+other.id);
   for(let n=0;n<=180;n+=10){const p={x:gate.x+gate.inward.x*n,y:gate.y+gate.inward.y*n};assert(nav.distance(p,other)>100,key+' gate approach activates neighboring gate '+gate.id+'/'+other.id);}
  }
  const lamps=L.create(d,nav,terrain,[...terrain.trees,...roam.actors]);assert(lamps.length>=3,key+' lamps');for(const p of lamps){assert(nav.walkable(p.x,p.y));assert(!terrain.water.raw(p.x,p.y,42),key+' flooded lamp');assert(!terrain.water.onBridge(p.x,p.y),key+' lamp on deck');}
  const miniature=A.minimapView(d,spawn);assert.equal(miniature.zoom,2);
  if(process.argv.includes('--assets'))for(const file of Object.values(G.assetFiles(id)))assert(fs.existsSync(path.join(__dirname,'..',file.split('?')[0].replace('/Soulbeast/',''))),key+' directional gate asset');
  stats.push({country:id,region:code,places:actual.length,shadows:10,mountains:terrain.mountains.length,lamps:lamps.length,bridgeLamps:lamps.filter(p=>p.bridgeId).length,groundMP:Math.round(d.width*d.height*.64/4/1e5)/10});
 }
 assert.equal(places.filter(p=>p.type==='capital').length,1,id+' capital');assert.equal(places.filter(p=>p.type==='city').length,4,id+' cities');const villages=places.filter(p=>p.type==='village');assert.equal(villages.length,16,id+' villages');for(const neighbor of Object.keys(plan.countries).filter(k=>k!==id))assert.equal(villages.filter(p=>p.neighbor_country===neighbor).length,8,id+' villages facing '+neighbor);
 assert.deepEqual(places.map(p=>p.id).sort(),plan.countries[id].places.map(p=>p.id).sort(),id+' original places exactly once');assert.equal(localGates.size,5,id+' internal gate pairs');for(const pair of localGates.values()){assert.equal(pair.length,2);assert.equal(pair[0].gate.targetRegion,pair[1].region);assert.equal(pair[1].gate.targetRegion,pair[0].region);}
}
assert.equal(international.size,8);for(const [id,pair]of international){assert.equal(pair.length,2,id+' reciprocal border');for(const [a,b]of [[pair[0],pair[1]],[pair[1],pair[0]]]){assert.equal(a.gate.targetCountry,b.country);assert.equal(a.gate.targetRegion,b.region);const target=new URL(A.travelURL(a.gate,'?country='+a.country+'&layout=regions-v5&packlord3d=1'),'http://local');assert.equal(target.searchParams.get('layout'),'regions-v5');assert.equal(target.searchParams.get('country'),b.country);assert.equal(target.searchParams.get('region'),b.region);assert.equal(target.searchParams.get('arrival'),id);}}
console.log('PASS 12 complete regions, preserved places and 8+8 villages, all roads and arrivals, 15 regional + 8 international gate pairs, 120 off-road shadows, landmark/bridge clearance and dry lamp placement');console.table(stats);
if(process.env.REGION_AUDIT_OUTPUT)fs.writeFileSync(process.env.REGION_AUDIT_OUTPUT,JSON.stringify({passed:true,regions:stats,internalGatePairs:15,internationalGatePairs:8,shadowBeasts:120},null,2));
