const assert=require('assert/strict');
const g=require('./game-context.cjs')('build/staging-index.html'),r=g.run;
r('render=()=>{};save=()=>{};toast=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};S.P.forestClears={};S.P.zoneMax=8;');
assert.deepEqual(JSON.parse(r('JSON.stringify(FOREST_ORDER.filter(forestUnlocked))')),[7]);
for(const id of [7,1,2,3,4,5,6]){r('S.P.forestClears['+id+']=1');assert(r('forestUnlocked(forestNext('+id+'))'));}
r('S.P.forestClears={};S.P.cleared=0;S.zone=null;handlers.dozone("2")');assert.equal(r('S.zone'),null);
r('S.P.zoneMax=1;S.zone={id:7,depth:10,log:[]};S.screen="zone";startBattle([wildUnit("jackalope",3,0)],"boss",7);B().enemies.forEach(u=>u.hp=0);endBattle("win");');
assert.equal(r('S.P.zoneMax'),1);assert(r('forestUnlocked(1)'));assert(!r('forestUnlocked(2)'));
const queue=[];g.ctx.setTimeout=(fn,ms)=>{queue.push(ms);return queue.length;};
r('BattleSpeed.value=2;CharacterMotion.schedule(()=>{},1000)');assert.equal(queue.at(-1),500);
r('BattleEffects.later(()=>{},800)');assert.equal(queue.at(-1),400);
r('CharacterMotion.phase("P","hit",1500)');assert.equal(queue.at(-1),750);
r('S.screen="bag";S.battle=null');assert(r('itemIcon("pot",24).includes("24px")'));assert(!r('itemIcon("pot",24).includes("72px")'));
r('MotionTimeline.until=Date.now()+1000;handlers.battleSpeed()');assert.equal(r('BattleSpeed.value'),2);assert.equal(r('BattleSpeed.pending'),1);
console.log('PASS training-first sequence, stale zoneMax cannot unlock, direct-entry guard, training reward unlock, half timers, deferred speed switching, compact potion icons');
