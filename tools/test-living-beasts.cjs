const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),L=require('./town-walk-demo/living-beasts.js'),H=require('./town-walk-demo/beast-habitats.js'),G=require('./hemant-walk-demo/beast-groups.js'),Clock=require('./town-walk-demo/game-clock.js');
const order=[7,1,2,3,4,5,6,8],clears={},rare=new Set(L.data.zones.flatMap(z=>z.rare)),rows=[];let rolls=0;
assert.equal(L.data.models.length,177);assert.equal(new Set(L.data.models.map(m=>m.sp+':'+m.form)).size,177);
for(const m of L.data.models){assert.equal(L.model(m.sp,m.form).id,m.id);assert.equal(m.cycle,3);assert.equal(m.frames,16);assert.equal(m.directions,8);assert.equal(m.anchors.length,8);assert(m.anchors.flat().every(Number.isFinite));}
for(const id of ['wisp','wisp_ghostfire','wisp_death_lantern'])assert.equal(L.data.models.find(m=>m.id===id).revision,'full-blue-fire-v2');assert.equal(L.data.models.find(m=>m.id==='storm_drake').revision,'extended-air-slither-v2');
for(let stage=0;stage<order.length;stage++){
 const frontier=order[stage],unlocked=order.slice(0,stage+1),forestPool=new Set(L.data.zones.filter(z=>unlocked.includes(z.id)).flatMap(z=>z.sp));
 for(const country of ['blue','green','red'])for(const habitat of ['land','water','beach'])for(const hour of [0,12]){
  const at=Clock.realTimeForHour?Clock.realTimeForHour(hour):Date.UTC(2026,10,20)+hour*600000,options={country,habitat,player:{lv:55,forestClears:{...clears}},at},possible=L.canPlan(options);if(!possible){rows.push({frontier,country,habitat,available:false});continue;}
  for(let i=0;i<120;i++){rolls++;const a={x:i,y:50};L.ensure(a,{...options,seed:i+831});assert(a.encounterPlan.units.length>=1&&a.encounterPlan.units.length<=4);assert.equal(a.beastSpecies,a.encounterPlan.units[0].sp);assert.equal(a.beastForm,L.formFor(a.beastSpecies,a.encounterPlan.units[0].lv));
   for(const u of a.encounterPlan.units){const s=L.data.species[u.sp];assert(forestPool.has(u.sp),'Only unlocked forest pools including uncleared frontier');assert(!rare.has(u.sp)&&!s.rare&&!s.legendary&&!s.solar,'Countries contain only ordinary beasts');assert(G.groups.common.includes(u.sp)||G.groups[country].includes(u.sp),'Country native cannot occur abroad');assert(H.allowed(u.sp,s,options),'Species matches land/water/sand');}
   const first=a.beastModelId,plan=a.encounterPlan;L.ensure(a,{...options,seed:999});assert.equal(a.beastModelId,first);assert.equal(a.encounterPlan,plan,'A rendered group must not reroll');
  }
  rows.push({frontier,country,habitat,available:true});
 }
 clears[frontier]=1;
}
for(const sp of ['mermaid','aurora_whale','kraken']){assert(!H.allowed(sp,L.data.species[sp],{habitat:'land'}));assert(H.allowed(sp,L.data.species[sp],{habitat:'water',waterType:'sea'}));assert(!H.allowed(sp,L.data.species[sp],{habitat:'water',waterType:'river'}));}
for(const sp of ['moon_tortoise','abyss_turtle','cosmic_tortoise'])assert.equal(H.kind(sp,L.data.species[sp]),'water');assert.equal(H.kind('coral_crab',L.data.species.coral_crab),'beach');
console.log('PASS 177 model/form mappings, latest revisions, 3-second/8x16 metadata and '+rolls+' country progression/habitat/time rolls with one visible lead per 1-4 member group');
if(process.env.LIVING_AUDIT_OUTPUT)fs.writeFileSync(process.env.LIVING_AUDIT_OUTPUT,JSON.stringify({passed:true,models:177,rolls,rules:rows},null,2));
