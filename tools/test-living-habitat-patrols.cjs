const assert=require('node:assert/strict'),fs=require('node:fs'),L=require('./town-walk-demo/living-beasts.js'),H=require('./town-walk-demo/beast-habitats.js'),I=require('./island-demo/island-rules.js'),P=require('./island-demo/patrols.js'),M=require('./hemant-walk-demo/country-regions-data.js').countries,N=require('./hemant-walk-demo/navigation.js'),T=require('./hemant-walk-demo/terrain.js'),W=require('./hemant-walk-demo/water-beasts.js');require('./hemant-walk-demo/beast-groups.js');
const player={lv:55,forestClears:{7:1,1:1,2:1,3:1,4:1,5:1,6:1}},rows=[];
for(const[country,c]of Object.entries(M))for(const[region,d]of Object.entries(c.regions)){
 const nav=N.create(d),terrain=T.create(d,nav);nav.setTerrain(terrain);const base={country,player,habitat:'water'},water=W.create(d,nav,terrain,{enabled:L.canPlan(base),river:L.canPlan({...base,waterType:'river'}),sea:L.canPlan({...base,waterType:'sea'})});
 for(const a of water.actors){L.ensure(a,{...base,waterType:a.bodyType});assert(['river','sea'].includes(a.bodyType));assert(a.encounterPlan.units.every(u=>H.allowed(u.sp,L.data.species[u.sp],{habitat:'water',waterType:a.bodyType})));}
 for(let i=0;i<1200;i++){water.update(.1);for(const a of water.actors){const sample=terrain.water.sampleAt(a.x,a.y,true);assert.equal(sample?.id,a.bodyId,'Aquatic actor cannot leave its own water body');assert(['river','sea'].includes(sample.type));}}
 rows.push({scene:'country',country,region,water:water.actors.map(a=>({species:a.beastSpecies,body:a.bodyType}))});
 const beachOptions={country,player,habitat:'beach'};if(L.canPlan(beachOptions)){const R=require('./hemant-walk-demo/roamers.js'),C=require('./hemant-walk-demo/region-coast.js'),group=R.createRegional(d,nav),p=H.beachPoint(d,nav,terrain,group.allowed);if(p){const a=group.actors.at(-1);Object.assign(a,p,{home:{...p},goal:null});L.ensure(a,beachOptions);a.habitatAllowed=(x,y)=>C.isBeach(d,x,y,-80)&&nav.walkable(x,y);for(let i=0;i<1200;i++){group.update(.1);assert(a.habitatAllowed(a.x,a.y),'Crabs remain within the sandy beach core');}rows.at(-1).beachCrab=a.beastSpecies;}}
}
for(const country of ['blue','green','red']){
 const map=I.map(country),patrol=P.create({...map,actors:[...map.actors,{...map.boss,id:'boss',kind:'boss',lv:60}]},I.islands[country].seed);L.assign(patrol.actors.filter(a=>a.kind==='shadow'),{scene:'island',country,player});H.islandActors(patrol.actors,map,country,player);
 for(let i=0;i<1200;i++){patrol.update(.1,map.spawn,()=>true);for(const a of patrol.actors.filter(a=>a.habitatAllowed))assert(a.habitatAllowed(a.x,a.y),'Island aquatic/crab actor cannot leave its habitat');}
 const actors=patrol.actors.filter(a=>a.kind==='shadow');assert.equal(actors.length,20);for(const a of actors)assert(a.encounterPlan.units.every(u=>H.allowed(u.sp,L.data.species[u.sp],{habitat:a.beastHabitat,waterType:a.beastHabitat==='water'?'sea':undefined})));
 rows.push({scene:'island',country,water:actors.filter(a=>a.beastHabitat==='water').length,beach:actors.filter(a=>a.beastHabitat==='beach').length});
}
console.log('PASS river/sea-only aquatic patrols, beach-only island crabs and unchanged group counts across all regions/islands through 120 seconds');
if(process.env.LIVING_HABITAT_OUTPUT)fs.writeFileSync(process.env.LIVING_HABITAT_OUTPUT,JSON.stringify({passed:true,scenes:rows},null,2));
