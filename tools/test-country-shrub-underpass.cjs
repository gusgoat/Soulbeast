const assert=require('node:assert/strict');
const M=require('./hemant-walk-demo/country-regions-data.js').countries;
const N=require('./hemant-walk-demo/navigation.js'),T=require('./hemant-walk-demo/terrain.js'),I=require('./hemant-walk-demo/water-interaction.js');
const rows=[];
for(const[country,c]of Object.entries(M))for(const[region,d]of Object.entries(c.regions)){
 const n=N.create(d),t=T.create(d,n);n.setTerrain(t);
 const shrubs=t.trees.filter(o=>o.shrub),trees=t.trees.filter(o=>!o.shrub);
 assert(shrubs.length,country+region+' has shrubs');
 for(const s of shrubs){assert.equal(t.shrubSpeedFactor(s.x,s.y),.5);}
 for(const s of trees)assert(t.playerBlocked(s.x,s.y),'Tree trunks stay solid');
 assert.equal(t.shrubSpeedFactor(-1000,-1000),1);const before=shrubs.map(s=>t.playerBlocked(s.x,s.y));assert(before.some(blocked=>!blocked),'Some shrubs have no overlapping solid tree');
 for(const b of t.water.bridges){
  const dx=(b.b.x-b.a.x)/b.length,dy=(b.b.y-b.a.y)*.64/b.length;
  const at=(along,across)=>({x:b.x+dx*along-dy*across,y:b.y+(dy*along+dx*across)/.64});
  // Walk the real river under the entire width of the crossing, in both directions.
  for(const sign of [-1,1]){
   const p={...at(0,sign*120),bridgeDeck:null};assert(I.state(d,t.water,p),'Approach is in river');
   for(let across=116;across>=-120;across-=4){assert(n.playerMove(p,at(0,sign*across)),'Can pass below bridge rail');assert.equal(p.bridgeDeck,null);assert(I.state(d,t.water,p),'Underpass remains water');assert.equal(I.speedFactor(I.state(d,t.water,p)),.5);}
  }
  const center={...at(0,0),bridgeDeck:null};assert.equal(t.water.underBridge(center)?.id,b.id);
  assert(!t.water.underBridge({...center,bridgeDeck:b.id}));
  // Mount and leave only through the dry end approaches, never through a side rail.
  for(const sign of [-1,1]){
   const p={...at(sign*(b.length/2+24),0),bridgeDeck:null};assert(!I.state(d,t.water,p));
   for(let along=b.length/2+20;along>=-b.length/2-24;along-=4){assert(n.playerMove(p,at(sign*along,0)),'Dry end approach stays usable');if(Math.abs(along)<b.length/2){assert.equal(p.bridgeDeck,b.id);assert.equal(I.state(d,t.water,p),null);}}
   assert.equal(p.bridgeDeck,null,'Leaving onto land resets the layer');
  }
  // Approach diagonally from either shoulder, crossing the old end line outside
  // the rail before turning onto the planks while the bank is still dry.
  for(const end of [-1,1])for(const shoulder of [-1,1]){
   const p={...at(end*(b.length/2+8),shoulder*52),bridgeDeck:null};
   function move(along,across){
    const next=at(end*along,shoulder*across);
    assert(n.playerMove(p,{x:next.x,y:p.y}));
    assert(n.playerMove(p,{x:p.x,y:next.y}));
    assert(!I.state(d,t.water,p),country+region+' dropped off the deck at '+along+','+across);
   }
   for(let along=b.length/2+4;along>=b.length/2-4;along-=4)move(along,52);
   for(let across=50;across>=30;across-=4)move(b.length/2-4-(52-across)/5,across);
   assert.equal(p.bridgeDeck,b.id);
   for(let along=b.length/2-20;along>=-b.length/2-12;along-=4)move(along,30);
   assert.equal(p.bridgeDeck,null);
  }
  const deck={...at(0,0),bridgeDeck:b.id};assert(!n.playerClear(deck,at(0,120)),'Cannot leave deck sideways');
  const wet={...at(0,120),bridgeDeck:null};assert(n.playerMove(wet,at(0,0)));assert.equal(wet.bridgeDeck,null,'Side approach never mounts deck');
 }
 // Removed plants must disappear from both collision and speed lookup.
 t.removeTrees(o=>!!o.shrub);for(const [i,s] of shrubs.entries()){assert.equal(t.shrubSpeedFactor(s.x,s.y),1);assert.equal(t.playerBlocked(s.x,s.y),before[i],'Shrub removal does not remove a solid blocker');}
 rows.push({country,region,shrubs:shrubs.length,trees:trees.length,bridges:t.water.bridges.length});
}
console.log('PASS shrubs, solid trees, river underpasses and land-only bridge access in all 12 country regions');console.table(rows);
