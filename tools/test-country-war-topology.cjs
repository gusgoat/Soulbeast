const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const {countryWarTopology}=await import('../server/country-war/topology.mjs'),data=JSON.parse(fs.readFileSync('content/country-war-map-v1.json','utf8')),map=countryWarTopology(data);
 const state={locations:{},members:{a:{code:'a',name:'ผู้ผนึกทดสอบ',country:'blue',location:'blue-capital'},b:{code:'b',name:'ชื่อฝ่ายตรงข้ามห้ามเผยแพร่',country:'red',location:'red-village-1'},c:{code:'c',name:'สมาชิกอีกประเทศ',country:'green',location:'green-capital'}}};
 const view=map.view(state,{country:'blue'});assert.equal(view.locations.length,37);assert.equal(view.locations.filter(x=>x.owner==='blue').length,21);assert.equal(view.locations.filter(x=>x.owner!=='blue').length,16);assert(!view.locations.some(x=>x.id==='green-capital'));assert(!JSON.stringify(view).includes('ห้ามเผยแพร่'));assert.deepEqual(view.locations.find(x=>x.id==='blue-capital').members,[{code:'a',name:'ผู้ผนึกทดสอบ'}]);assert.equal(view.locations.find(x=>x.id==='red-village-1').count,1);assert(!('members' in view.locations.find(x=>x.id==='red-village-1')));
 assert(map.adjacent('blue-capital','blue-city-1'));assert(!map.adjacent('blue-capital','red-capital'));assert(!map.canCapture('blue-capital'));assert(map.canCapture('blue-city-1'));assert.equal(map.capacity('blue-capital'),null);
 for(let i=0;i<4;i++)state.members['v'+i]={country:'blue',location:'blue-village-1'};assert(!map.hasRoom(state,'blue-village-1'));assert(map.hasRoom(state,'blue-capital',10000));assert(!map.hasRoom(state,'missing'));
 for(let i=0;i<16;i++)state.members['t'+i]={country:'blue',location:'blue-city-1'};assert(!map.hasRoom(state,'blue-city-1'));
 const pools=map.weeklyPools(state);for(const p of Object.values(pools))assert.deepEqual(p,{gold:5600,couponEighths:32,villages:16,cities:4});
 state.locations['red-village-1']={owner:'blue'};const changed=map.weeklyPools(state);assert.equal(changed.blue.gold,5700);assert.equal(changed.red.gold,5500);assert.equal(changed.blue.couponEighths,33);assert.equal(changed.red.couponEighths,31);
 state.locations['red-capital']={owner:'blue'};assert.equal(map.view(state,{country:'red'}).locations.find(x=>x.id==='red-capital').owner,'red');
 const invalid=structuredClone(data);invalid.nodes.find(x=>x.type==='village').capacity=5;assert.throws(()=>countryWarTopology(invalid),/invalid_country_war_village/);
 console.log('PASS country-war map, capacities, immutable capitals, adjacency, owned roster visibility, hidden enemy identities/interior bases, exact weekly reward pools and capture accounting.');
})().catch(e=>{console.error(e);process.exitCode=1});
