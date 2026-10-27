const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const g=require('./game-context.cjs')('build/live-index.html'),r=g.run;
for(const a of require('../content/humanoid-death-audio.json').files){const b=fs.readFileSync(a.path);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256);assert(b.length>1000);}
r(`render=()=>{};Sound.fx=()=>{};Sound.skill=()=>{};S.P.cls='archmage';S.P.lv=60;S.P.hp=pStats().hp;S.P.mp=pStats().mp;S.screen='battle';const caster=playerUnit(),target=wildUnit('kappa',10,0);S.battle={kind:'wild',allies:[caster],enemies:[target],effects:[],fx:[],log:[],round:1};MotionTimeline.active=()=>false;VQ.length=0;act(caster,'ms_mage60',target);`);
assert.equal(r('caster.charging.id'),'ms_mage60');assert(r("VQ.some(e=>e.k==='charge'&&e.skill==='ms_mage60')"));
r(`var clock=1000000,jobs=[],events=[];Date.now=()=>clock;render=()=>events.push({event:'render',at:clock});MotionTimeline.active=()=>true;CharacterMotion.sync=()=>{};CharacterMotion.reduced=()=>false;CharacterMotion.schedule=(fn,ms)=>jobs.push({fn,at:clock+BattleSpeed.ms(ms)});CharacterMotion.phase=(id,phase)=>events.push({event:phase,id,at:clock});MotionTimeline.sound=()=>events.push({event:'release-sound',at:clock});Sound.playDeath=u=>events.push({event:'death',id:u.id,at:clock});BattleEffects.anchor=id=>({node:{},x:0,y:0,size:40});BattleEffects.travel=()=>{events.push({event:'projectile',at:clock});return 360;};BattleEffects.impact=()=>{};vSpawn=()=>{};var runJobs=()=>{let safety=0;while(jobs.length){if(safety++>100)throw Error('Unbounded presentation');jobs.sort((a,b)=>a.at-b.at);const job=jobs.shift();clock=job.at;job.fn();}};`);
const layer={appendChild(){}};g.ctx.document.getElementById=id=>id==='vfx'?layer:null;g.ctx.document.createElement=()=>({style:{},remove(){}});
r('VQ.length=0;VQ.push({k:"charge",id:caster.id,source:caster.id,skill:"ms_mage60"});MotionTimeline.flush();runJobs();');
assert(r("events.some(e=>e.event==='windup')"));assert(!r("events.some(e=>['power','projectile','release-sound','melee'].includes(e.event))"),'Preparation must not release anything');
for(const speed of [1,2]){
 r(`BattleSpeed.value=${speed};events=[];jobs=[];MotionTimeline.until=0;MotionTimeline.dead.clear();MotionTimeline.held.clear();target.hp=0;MotionTimeline.held.set(String(target.id),{hp:20,mp:target.mp});MotionTimeline.depth=1;Sound.death(target);MotionTimeline.depth=0;`);
 assert.equal(r("events.filter(e=>e.event==='death').length"),0,'No early death during calculation');
 const before=r('JSON.stringify(S)');r('VQ.push({k:"cast",id:caster.id,source:caster.id,skill:"ms_mage60"},{k:"hit",id:target.id,source:caster.id,skill:"ms_mage60"});var releasedAt=clock;MotionTimeline.flush();runJobs();');
 assert.equal(r("events.filter(e=>e.event==='death').length"),1);assert(r("events.find(e=>e.event==='death').at>events.find(e=>e.event==='projectile').at"));assert.equal(r("events.find(e=>e.event==='death').at-events.find(e=>e.event==='projectile').at"),360/speed);
 assert.equal(r('JSON.stringify(S)'),before,'Presentation must not mutate damage, battle or saves');r('MotionTimeline.death(target)');assert.equal(r("events.filter(e=>e.event==='death').length"),1,'Exactly once per defeat');
}
// Voice routing uses gender and independent rotation, without gameplay randomness.
const audio=require('fs').readFileSync('runtime/deathAudio.js','utf8');r(audio);r("var calls=[];ExtraAudio.play=key=>calls.push(key);Sound.cry=sp=>calls.push('beast:'+sp);Math.random=()=>{throw Error('Audio must not use gameplay RNG')};Sound.playDeath({kind:'player',gender:'female'});Sound.playDeath({kind:'human',gender:'male'});Sound.playDeath({kind:'beast',sp:'wisp'});");
assert.deepEqual(JSON.parse(r('JSON.stringify(calls)')),['humanoidDeathFemale','humanoidDeathMale','beast:wisp']);
assert.equal(r('ExtraAudio.groups.humanoidDeathFemale.length'),4);assert.equal(r('ExtraAudio.groups.humanoidDeathMale.length'),4);
console.log('PASS charge-only preparation, true release, death exactly at HP arrival at x1/x2, no duplicate death, unchanged combat/save state, eight original recordings and gender/beast routing');
