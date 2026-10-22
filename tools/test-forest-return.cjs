const assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r('render=()=>{};toast=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};');
 for(const hp of [1,30,79,80,81,100])for(const route of ['exit','boss']){
  r("handlers.newgame();S.zone={id:7,depth:10,log:[]};S.screen='zone';for(S.P.lv=3;pStats().hp%5&&S.P.lv<60;S.P.lv++);S.P.hp=Math.max(1,Math.floor(pStats().hp*"+hp+"/100));");
  assert.equal(r('pStats().hp%5'),0,'Fixture supports exact 80% with integer HP');
  const before=r('JSON.stringify({hp:S.P.hp,mp:S.P.mp,gold:S.P.gold,pets:S.P.pets})');
  if(route==='boss')r("S.battle={kind:'boss',over:{res:'win'}};battleAction('done');");
  else r('handlers.exitzone()');
  assert.equal(r('S.screen'),hp<80?'hospital':'town',route+' HP '+hp);
  assert.equal(r('S.zone'),null);assert.equal(r('S.battle'),null);
  assert.equal(r('JSON.stringify({hp:S.P.hp,mp:S.P.mp,gold:S.P.gold,pets:S.P.pets})'),before,'Opening hospital never heals or charges');
  r("go('town')");assert.equal(r('S.screen'),'town','Can freely leave the hospital without being redirected again');
 }
 r("S.P.hp=pStats().hp;S.P.pets.forEach(p=>p.hp=1);S.zone={id:7,depth:2,log:[]};handlers.exitzone()");assert.equal(r('S.screen'),'town','Threshold uses sealer HP');
 r("S.zone={id:7,depth:2,log:[]};startBattle([wildUnit(ZN[6].sp[0],3,0)],'wild',7);B().over={res:'win'};battleAction('done')");assert.equal(r('S.screen'),'zone','Ordinary forest wins continue exploring');
 r("B();S.battle={kind:'boss',over:{res:'lose'}};battleAction('done')");assert.equal(r('S.screen'),'hospital','Defeat still goes to hospital');
 const t=require('./game-context.cjs')(file,{tutorial:true});t.run("render=()=>{Tutorial.update()};Tutorial.state().active=null;Tutorial.state().firstBoss=true;S.zone=null;S.battle=null;S.screen='hospital';Tutorial.update()");assert.equal(t.run('Tutorial.state().active'),'heal','First boss lesson follows automatic hospital entry');
 console.log('PASS '+file+': forest exit/boss return below80%, exact80%, no healing/charge, normal navigation, forest continuation, defeat and hospital tutorial');
}
