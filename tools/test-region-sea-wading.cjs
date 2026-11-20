const assert=require('node:assert/strict'),fs=require('node:fs'),M=require('./hemant-walk-demo/country-regions-data.js').countries,C=require('./hemant-walk-demo/region-coast.js'),N=require('./hemant-walk-demo/navigation.js'),T=require('./hemant-walk-demo/terrain.js'),I=require('./hemant-walk-demo/water-interaction.js');
const rows=[];
for(const[country,c]of Object.entries(M))for(const[region,d]of Object.entries(c.regions)){
 const n=N.create(d),t=T.create(d,n);n.setTerrain(t);const edges=C.segments(d);let tested=0,accessible=0,entrances=0;
 for(const e of edges)for(const f of [.25,.5,.75]){
  const at=off=>({x:e.a.x+(e.b.x-e.a.x)*f+e.nx*off,y:e.a.y+(e.b.y-e.a.y)*f+e.ny*off/.64}),near=at(20),middle=at(85),deep=at(160),beyond=at(200),samples=[near,middle,deep].map(p=>t.water.sampleAt(p.x,p.y));
  if(samples.some(s=>s?.type!=='sea'))continue;tested++;assert(samples[0].depth<samples[1].depth&&samples[1].depth<samples[2].depth);assert(samples[2].depth>.9);assert.equal(I.speedFactor(samples[0]),.5);assert(!C.seaSample(d,beyond.x,beyond.y));assert(!n.playerWalkable(beyond.x,beyond.y),'Deep sea is blocked');assert(!n.walkable(middle.x,middle.y),'Land foes stay on land');if(n.playerWalkable(middle.x,middle.y))accessible++;
  const bank=at(-40);if(n.playerClear(bank,near))entrances++;
 }
 if(edges.length){assert(tested>0,country+region+' sea band');assert(accessible>0,country+region+' accessible sea');assert(entrances>0,country+region+' reachable from beach');}
 // No extension of a non-coastal border may become a sea shortcut.
 for(const other of Object.values(c.regions).filter(p=>p!==d))for(const p of other.villages){const a=other.regionOrigin,b=d.regionOrigin,wx=(p.x-a.pad)/a.scale+a.left,wy=(p.y-a.topPad)*.64/a.scale+a.top;assert(!C.seaSample(d,(wx-b.left)*b.scale+b.pad,(wy-b.top)*b.scale/.64+b.topPad));}
 rows.push({country,region,coastEdges:edges.length,tested,accessible,entrances,maxOffshore:C.SEA_WADE_DISTANCE});
}
console.log('PASS shallow sea depth, limited offshore reach, beach access and land-only actors across all coastal regions');console.table(rows);
if(process.env.SEA_AUDIT_OUTPUT)fs.writeFileSync(process.env.SEA_AUDIT_OUTPUT,JSON.stringify({passed:true,regions:rows},null,2));
