const assert=require('assert/strict'),fs=require('fs');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run,json=s=>JSON.parse(r('JSON.stringify('+s+')'));
 const ids=json('Object.keys(SK)');
 const saved=r('JSON.stringify(S)');r('Math.random=()=>{throw Error("VFX must not consume combat RNG")};');
 for(const id of ids){const p=json('BattleEffects.profile('+JSON.stringify(id)+')');assert(['melee','projectile','beam','field','support'].includes(p.mode),id);assert(Number.isFinite(p.seed));assert(p.color&&p.accent);assert.deepEqual(p,json('BattleEffects.profile('+JSON.stringify(id)+')'));}
 assert.equal(r('JSON.stringify(S)'),saved);
 for(const id of ids.filter(id=>/^(ms_archer|ms_gunner|ar_|gn_|ws_bow|ws_gun|bow_|gun_)/.test(id)&&r('!["buff","heal"].includes(SK['+JSON.stringify(id)+'].t)')))assert.equal(r('BattleEffects.profile('+JSON.stringify(id)+').mode'),'projectile',id);
 assert.equal(r('BattleEffects.profile("sw_bash").mode'),'melee');assert.equal(r('BattleEffects.profile("nj_shuriken").projectile'),'shuriken');assert.equal(r('BattleEffects.profile("f_dragonbreath").mode'),'beam');
 assert.equal(r('BattleEffects.profile("attack",{cls:"archer"}).projectile'),'arrow');
 const legends=json('Object.entries(SP).filter(([id,s])=>s.legendary).map(([id,s])=>BattleEffects.profile(s.sig,{sp:id}).legend.id)');assert.equal(legends.length,16);assert.equal(new Set(legends).size,16);
 const recipes=JSON.parse(fs.readFileSync('content/eclipse-skill-effects.json','utf8'));
 assert.deepEqual(json('BattleEffects.recipes'),recipes,'authored recipes must match shipped runtime');assert.equal(Object.keys(recipes).length,48);
 assert.equal(new Set(Object.values(recipes).map(x=>JSON.stringify(x))).size,48,'every Eclipse skill has a distinct choreography');
 const stateBeforeEffects=r('JSON.stringify(S)');
 r('globalThis.eclipseRecorded=[];globalThis.eclipseOriginalVSpawn=vSpawn;vSpawn=()=>({dataset:{},setAttribute(){}});globalThis.eclipseOriginalSpawn=BattleEffects.spawn;BattleEffects.spawn=function(L,shape,x,y,p,vars){eclipseRecorded.push({shape,x,y,skill:p.id,vars});return {dataset:{}};};');
 for(const [id,recipe]of Object.entries(recipes)){
  assert(r('!!SK['+JSON.stringify(id)+']'),id);const p=json('BattleEffects.profile('+JSON.stringify(id)+')');assert.equal(p.mode,recipe.mode);assert.equal(p.color,recipe.color);
  r('eclipseRecorded.length=0;BattleEffects.eclipseCast({}, {x:40,y:300},BattleEffects.profile('+JSON.stringify(id)+'));BattleEffects.eclipseImpact({}, {k:"hit"}, {x:280,y:80},BattleEffects.profile('+JSON.stringify(id)+'));');
  const records=json('eclipseRecorded');assert(records.some(x=>x.shape==='eclipse-'+recipe.motif&&x.x===40),'caster crest '+id);assert(records.some(x=>x.shape===recipe.focus&&x.x===280),'target focus '+id);assert(records.length<=20,'bounded particles '+id);
  r('eclipseRecorded.length=0;BattleEffects.eclipseImpact({}, {k:"hit"}, {x:280,y:80},BattleEffects.profile('+JSON.stringify(id)+'),1);');assert.equal(json('eclipseRecorded').length,2,'repeated hit has its own particles '+id);
 }
 r('BattleEffects.spawn=eclipseOriginalSpawn;vSpawn=eclipseOriginalVSpawn;');assert.equal(r('JSON.stringify(S)'),stateBeforeEffects);
 assert.equal(recipes.solar_pentadrake_s5.shots,5);assert.equal(recipes.solar_raijaku_s4.shots,2);assert.equal(recipes.solar_aureolith_s2.layout,'inward');assert.equal(recipes.solar_cryostag_s6.mode,'support');
 const events=json('BattleEffects.enrich([{k:"cast",id:"A",skill:"sw_bash"},{k:"hit",id:"B",skill:"sw_bash"},{k:"hit",id:"A",skill:"attack"},{k:"cast",id:"C",skill:"mg_fire"},{k:"hit",id:"D",skill:"mg_fire"}],"X")');assert.deepEqual(events.map(e=>e.source),[undefined,'A','B',undefined,'C']);
 assert.deepEqual(json('BattleEffects.enrich([{k:"cast",id:"A",skill:"sw_twin"},{k:"hit",id:"B",skill:"sw_twin"},{k:"hit",id:"A",skill:"attack"},{k:"hit",id:"B",skill:"sw_twin"}]).filter(e=>e.k==="hit").map(e=>e.source)'),['A','B','A']);
 r('VQ.length=0;VFX_CONTEXT.push({source:"actor",skill:"mg_fire"});S.battle={};vfx("hit","target");VFX_CONTEXT.pop();');assert.deepEqual(json('VQ[0]'),{k:'hit',id:'target',source:'actor',skill:'mg_fire'});
 // Exercise actual DOM animation creation with deterministic geometry and cleanup.
 const nodes=[],animations=[];function node(){return {className:'',dataset:{},style:{opacity:'.8',setProperty(k,v){this[k]=v;}},isConnected:true,querySelectorAll(){return[];},removeAttribute(){},setAttribute(){},cloneNode(){return node();},appendChild(){},remove(){this.removed=true;},animate(frames,options){const a={frames,options,cancel(){this.cancelled=true;}};animations.push(a);return a;}};}
 g.ctx.document.createElement=()=>{const n=node();nodes.push(n);return n;};g.ctx.fxLayer={appendChild(){}};g.ctx.fxFrom={node:node(),x:40,y:300,size:44};g.ctx.fxTo={node:node(),x:280,y:80,size:44};
 assert.equal(r('BattleEffects.travel(fxLayer,fxFrom,fxTo,BattleEffects.profile("sw_bash"),true)'),326);
 assert.equal(g.ctx.fxFrom.node.style.opacity,'.15');assert(animations[0].frames[2].transform.includes('240px'));assert(animations[0].frames[2].transform.includes('-220px'));assert(animations[0].frames.at(-1).transform.includes('0px'));
 animations[0].onfinish();assert.equal(g.ctx.fxFrom.node.style.opacity,'.8');assert(nodes[0].removed);assert.equal(r('BattleEffects.live.size'),0);
 r('BattleEffects.travel(fxLayer,fxFrom,fxTo,BattleEffects.profile("mg_fire"))');assert(nodes[1].className.includes('projectile'));r('BattleEffects.clear()');assert(nodes[1].removed);
 for(const id of ids)r('BattleEffects.impact(fxLayer,{k:"hit",skill:'+JSON.stringify(id)+'},fxTo,BattleEffects.profile('+JSON.stringify(id)+'))');
 // Compare decorated and undecorated combat with the same RNG stream and units.
 const state=json('S');const exercise=`S=${JSON.stringify(state)};Math.random=()=>.42;render=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};Sound.skill=()=>{};ExtraAudio.play=()=>{};const a=humanUnit('A','swordsman',30,0),b=wildUnit('kodama',30,0);a.id='A';a.side='ally';b.id='B';b.side='enemy';S.battle={allies:[a],enemies:[b],fx:[],log:[],cur:'A',round:1,queue:[],used:[]};VQ.length=0;`;
 r(exercise);r('act(a,"sw_bash",b,a,true)');const decorated=r('JSON.stringify(S.battle)');assert(json('VQ').some(e=>e.k==='hit'&&e.source==='A'&&e.id==='B'));
 const other=require('./game-context.cjs')(file);other.run(exercise);other.run('act=battleEffectsAct;hitOne=battleEffectsHit;act(a,"sw_bash",b,a,true)');assert.equal(decorated,other.run('JSON.stringify(S.battle)'),'Visual decorators must not change combat results');
 console.log('PASS '+file+': '+ids.length+' skill profiles, 16 distinct legendary themes, 48 unique Eclipse choreographies, advanced ranged skills, source/counter attribution, portrait round trip, cancellation, no RNG/state or combat changes');
}
