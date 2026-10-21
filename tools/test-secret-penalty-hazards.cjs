const assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
const g=require('./game-context.cjs')(file),r=g.run;
r('render=()=>{};Sound.fx=()=>{};');
const setup=()=>r("handlers.newgame();S.ui={};S.screen='zone';var d=SECRET_DATA.locations.find(x=>!x.tutorial);S.zone={id:d.zone,depth:5,log:[],secretSession:{id:d.id,event:'puzzle',revision:0,puzzleAttempts:0}};Secret.record(d.id);S.P.hp=pStats().hp;var beforeGold=S.P.gold,beforeExp=S.P.exp;");
setup();assert(r('Secret.view().includes("50% ของ HP เต็ม")'));r('var oldToken=Secret.token();Secret.puzzle(oldToken,(d.correct+1)%d.answers.length);');assert.equal(r('S.P.hp'),r('pStats().hp-Math.ceil(pStats().hp*.5)'));assert.equal(r('Secret.session().puzzleAttempts'),1);
const hp=r('S.P.hp');r('Secret.puzzle(oldToken,(d.correct+1)%d.answers.length)');assert.equal(r('S.P.hp'),hp,'stale answer cannot deal damage twice');
r('Secret.puzzle(Secret.token(),(d.correct+1)%d.answers.length)');assert.equal(r('S.screen'),'hospital');assert.equal(r('S.zone'),null);assert.equal(r('Secret.canDiscover(d)'),true);assert.equal(r('S.P.gold'),r('beforeGold'));assert.equal(r('S.P.exp'),r('beforeExp'));assert(r('vHospital().includes("สถานที่นี้ยังมีโอกาสค้นพบใหม่ได้")'));
r('S=JSON.parse(JSON.stringify(S));');assert(r('Secret.canDiscover(d)'),'retry eligibility survives reload');
setup();r('var hpBefore=S.P.hp;Secret.puzzle(Secret.token(),d.correct);');assert.equal(r('S.P.hp'),r('hpBefore'));assert.notEqual(r('Secret.session().event'),'puzzle');
setup();r('S.P.hp=1;Secret.puzzle(Secret.token(),(d.correct+1)%d.answers.length)');assert.equal(r('S.screen'),'hospital');
for(const door of [{k:'beast',h:false},{k:'beast',h:true},{k:'mist',h:false}]){
r("handlers.newgame();S.ui={};S.screen='zone';var hazard=FOREST_RIDDLES.find(x=>x.zone===1&&x.group==='hazard');S.zone={id:1,depth:4,log:[],fork:[],riddleRun:{reward:{depth:null,offered:false,used:false},hazard:{id:hazard.id,depth:5,offered:false,used:false}}};");
g.ctx.door=door;r('S.zone.fork=[door];chooseFork(0)');assert.equal(r('!!ForestRiddle.session()'),door.h||door.k==='mist');if(door.h||door.k==='mist'){assert(r('S.zone.riddleRun.hazard.used'));const depth=r('S.zone.depth');r('chooseFork(0)');assert.equal(r('S.zone.depth'),depth);}
}
r("handlers.newgame();S.ui={};S.screen='zone';S.zone={id:1,depth:4,log:[]};newFork();");assert(!r('S.zone.fork.some(x=>x.k==="riddleHazard")'),'hazards never shown as normal routes');
console.log('PASS '+file+': warning, maxHP damage, death/hospital/retry/reload, correct answer, duplicate guard, dark/mist forced hazard and no visible hazard routes');
}
