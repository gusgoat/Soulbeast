const assert=require('assert/strict'),fs=require('fs');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r('render=()=>{};Sound.fx=()=>{};var rateRandom=Math.random;');
 // Exact boundaries, one roll per run, persistence after save/load, all forests.
 for(const zone of [7,1,2,3,4,5,6])for(const roll of [.099999,.10,.149999,.15]){
  r(`handlers.newgame();S.ui={};S.zone={id:${zone},depth:0,log:[]};Math.random=()=>${roll};ForestSpecial.plan(S.zone);WorldTales.run();Math.random=rateRandom;`);
  assert.equal(r('S.zone.specialRun.depth!==null'),roll<.10);
  assert.equal(r('S.zone.taleRun.specialDepth!==null'),roll<.10);
  r("var planned=JSON.stringify(S.zone);S=JSON.parse(JSON.stringify(S));Math.random=()=>{throw Error('Run plan rerolled')};ForestSpecial.plan(S.zone);WorldTales.run();Math.random=rateRandom;");
  assert.equal(r('JSON.stringify(S.zone)'),r('planned'));
 }
 // Every trap uses its own image and retains the original HP/MP losses.
 for(let i=0;i<6;i++){
  r(`handlers.newgame();S.ui={};S.P.lv=30;S.P.hp=pStats().hp;S.P.mp=pStats().mp;S.zone={id:1,depth:2,log:[]};S.screen='zone';var maxHP=S.P.hp,maxMP=S.P.mp,petBefore=party().map(p=>({hp:p.hp,mp:p.mp}));Math.random=()=>(${i}+.01)/6;var notice=trap();Math.random=rateRandom;`);
  assert.equal(r('S.ui.trapNotice.index'),i);
  assert.equal(r('S.ui.trapNotice.message'),r('notice'));
  assert.equal(r('S.P.hp'),r(`Math.max(1,maxHP-Math.round(maxHP*TRAPS[${i}].p))`));
  assert.equal(r('S.P.mp'),r(`TRAPS[${i}].mp?Math.max(0,maxMP-Math.round(maxMP*TRAPS[${i}].mp)):maxMP`));
  const ids=['quicksand','leeches','fire-wall','spike-pit','rockfall','living-vines'];
  assert(fs.statSync('assets/ui/traps/'+ids[i]+'.webp').size>10000);
  r('S=JSON.parse(JSON.stringify(S));var damagedHP=S.P.hp,damagedMP=S.P.mp;handlers.trapNoticeClose();handlers.trapNoticeClose();');
  assert.equal(r('S.ui.trapNotice'),undefined);assert.equal(r('S.P.hp'),r('damagedHP'));assert.equal(r('S.P.mp'),r('damagedMP'));
 }
 // A real battle started after a trap cannot move while its illustration is open.
 r("handlers.newgame();S.ui={};S.P.lv=30;S.P.hp=pStats().hp;S.P.mp=pStats().mp;S.zone={id:1,depth:2,log:[]};trap();startBattle([wildUnit(ZN[0].sp[0],1,0)],'wild',1);var queueBefore=JSON.stringify(B().queue),hpBefore=JSON.stringify(allU().map(u=>u.hp)),timer=[];setTimeout=fn=>{timer.push(fn);return 1;};advance();");
 assert.equal(r('B().cur'),null);assert.equal(r('JSON.stringify(B().queue)'),r('queueBefore'));
 assert.equal(r('JSON.stringify(allU().map(u=>u.hp))'),r('hpBefore'));
 r('var called=0;battleLater(()=>called++,1);timer.shift()();');assert.equal(r('called'),0);
 r('handlers.trapNoticeClose();for(let i=0;i<timer.length+1&&called===0;i++){var cb=timer.shift();if(cb)cb();}');assert.equal(r('called'),1);
 // Presentation is escaped and only acknowledges damage, never applies it again.
 const ui=fs.readFileSync('runtime/ui.js','utf8');assert(ui.includes('esc(S.ui.trapNotice.message)'));assert(ui.includes('aria-labelledby="trapTitle"'));
 console.log('PASS '+file+': 10% event plans, cached/reloaded plans, six trap assets/damage, battle pause and idempotent acknowledgement');
}
