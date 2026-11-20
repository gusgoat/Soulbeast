const assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('./hemant-walk-demo/country-regions-data.js').countries,N=require('./hemant-walk-demo/navigation.js'),T=require('./hemant-walk-demo/terrain.js'),I=require('./hemant-walk-demo/water-interaction.js'),B=require('./hemant-walk-demo/water-beasts.js'),E=require('./hemant-walk-demo/encounters.js');
const baseline=process.env.WATER_BASELINE?require(require('node:path').resolve(process.env.WATER_BASELINE)).countries:null,rows=[];
function area(points){return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2);}
for(const[country,c]of Object.entries(M))for(const[region,d]of Object.entries(c.regions)){
 const n=N.create(d),t=T.create(d,n);n.setTerrain(t);const w=t.water,b=B.create(d,n,t),lake=w.lakes[0];
 assert.equal(d.waterTraversal,'wade');assert.equal(w.rivers[0].width,200);
 if(baseline){const old=baseline[country].regions[region];assert(Math.abs(area(d.waterways.lakes[0].points)/area(old.waterways.lakes[0].points)-4)<1e-7);assert.equal(d.waterways.rivers[0].width/old.waterways.rivers[0].width,2);for(const key of ['cities','villages','forests','regionPlaces'])assert.deepEqual(d[key].filter(p=>!p.id.startsWith('bridge-')&&!d.placeAdjustments?.some(a=>a.id===p.id)),old[key].filter(p=>!p.id.startsWith('bridge-')&&!d.placeAdjustments?.some(a=>a.id===p.id)),country+region+' original places');}
 assert(n.playerWalkable(lake.center.x,lake.center.y));assert(!n.walkable(lake.center.x,lake.center.y));assert(w.depthAt(lake.center.x,lake.center.y)>.98);assert.equal(I.speedFactor(w.sampleAt(lake.center.x,lake.center.y)),.5);assert.equal(I.speedFactor(null),1);
 const bankDepths=lake.points.map(edge=>w.depthAt(edge.x*.95+lake.center.x*.05,edge.y*.95+lake.center.y*.05));assert(Math.min(...bankDepths)<.3,'Lake banks shallower than center');
 for(const bridge of w.bridges){assert.equal(w.sampleAt(bridge.x,bridge.y),null);assert.equal(I.speedFactor(w.sampleAt(bridge.x,bridge.y)),1);}
 const entries=w.accessPoints.filter(p=>n.playerClear(p,{x:p.waterX,y:p.waterY}));assert(entries.length>=2,country+region+' bank openings');
 const settlement=n.places.find(p=>['village','city','capital'].includes(p.type));assert(n.playerRoute(lake.center,settlement.id).length,'Can navigate out of lake to settlement');
 assert.equal(b.actors.length,2);for(let i=0;i<1200;i++){b.update(.1);for(const a of b.actors)assert.equal(w.sampleAt(a.x,a.y,true)?.id,a.bodyId,'Aquatic patrol remains in its own habitat');}
 for(const a of b.actors){assert(!b.eligible(a,w.bridges[0]));const body=a.bodyType==='lake'?lake:w.rivers[0],target=(a.bodyType==='lake'?[body.center]:body.points).find(p=>b.eligible(a,p)&&a.navigation.walkable(p.x,p.y));assert(target,'Deep encounter point');Object.assign(a,target,{home:{...target}});const threat=E.create(n,[{kind:'water',actors:[a],nav:b.nav}],{canChase:(e,p)=>b.eligible(e.actor,p)});assert.equal(threat.update(4,target)?.kind,'water');}
 rows.push({country,region,riverWidth:w.rivers[0].width,lakeAreaScale:4,entryGaps:entries.length,waterBeasts:b.actors.length,centerDepth:w.depthAt(lake.center.x,lake.center.y),waterSpeed:.5});
}
console.log('PASS expanded water geometry, preserved places, depth, half speed, bridge safety, accessible banks and aquatic patrol/encounters across 12 regions');console.table(rows);
if(process.env.WATER_AUDIT_OUTPUT)fs.writeFileSync(process.env.WATER_AUDIT_OUTPUT,JSON.stringify({passed:true,regions:rows},null,2));
