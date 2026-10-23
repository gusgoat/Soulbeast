const fs=require('fs'),assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const {run:r}=require('./game-context.cjs')(file);r('render=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};');
 for(const cls of JSON.parse(r('JSON.stringify(Object.keys(CLS))'))){
  const t=JSON.parse(r(`JSON.stringify(UnitFrames.resolve({kind:'player',cls:'${cls}',types:['water']}))`));
  assert(fs.existsSync('assets/ui/unit-frames/'+t.key+'.svg'),cls);
  assert(t.key!=='water','Armor element must not replace profession identity');
 }
 assert.equal(r("UnitFrames.resolve({cls:'ninja'}).key"),'shuriken');
 assert.equal(r("UnitFrames.resolve({cls:'archdruid'}).key"),'grove');
 assert.equal(r("UnitFrames.resolve({cls:'spiritlord'}).key"),'summon');
 assert.equal(r("UnitFrames.resolve({cls:'archmage'}).key"),'arcane');
 assert.equal(r("UnitFrames.resolve({sp:'naga'}).key"),'dragon');
 assert.equal(r("UnitFrames.resolve({sp:'naga'}).secondary"),'water');
 for(const u of [{sp:'demonlord'},{id:'worldboss',cls:'mage'},{immortalWorld:true,cls:'swordsman'}])assert.equal(r(`UnitFrames.resolve(${JSON.stringify(u)}).key`),'bone');
 for(const type of JSON.parse(r('JSON.stringify(Object.keys(EL))')))assert(fs.existsSync('assets/ui/unit-frames/'+type+'.svg'));
 r(`var frameSample='<button class="battle-vital selected" style="color:red" data-a="bt" data-v="target:1" disabled><span class="battle-face" data-u="e1">PORTRAIT</span><div class="battle-meter"><b>NAME Lv 60</b><small>HP 1000000/1000000</small><small>MP 1000000/1000000</small></div></button>';var frameUnit=wildUnit('naga',60,1);frameUnit.types=['water','dragon'];frameUnit.status={poison:2,burn:2};var frameBefore=JSON.stringify(frameUnit);var framed=statusBattleCard(frameSample,frameUnit);`);
 const html=r('framed');assert(html.includes('data-unit-frame="dragon"'));assert(html.includes('data-unit-secondary="water"'));assert(html.includes('data-status="poison burn"'));assert(html.includes('multi-battle-status'));assert(html.includes('battle-portrait-elements'));assert(html.includes('battle-effect-strip'));
 for(const text of ['NAME Lv 60','HP 1000000/1000000','MP 1000000/1000000','data-a="bt"','data-v="target:1"','disabled','color:red','PORTRAIT'])assert(html.includes(text),text);
 assert.equal((html.match(/unit-frame-corner/g)||[]).length,4);assert.equal((html.match(/style="/g)||[]).length>=1,true);assert.equal(r('JSON.stringify(frameUnit)'),r('frameBefore'));assert.equal(r('UnitFrames.decorate(framed,frameUnit)'),html,'Repeated wrapping must not duplicate ornaments');
 assert(r('vHero()').includes('data-unit-frame="sword"'));
 assert(r('bagVitals()').includes('data-unit-frame="sword"'));
 assert(r('vPet(S.P.pets[0])').includes('data-unit-frame='));
 assert(r("vRoster('')").includes('pet-tile unit-frame'));
 assert.equal(r("UnitFrames.resolve({sp:'not-real',types:['not-real']}).key"),'normal');
 console.log('PASS '+file+': all 63 professions, 18 elements, dual-element dragons, boss bone priority; statuses/selection/disabled/actions/portrait/HP/MP preserved; hero/bag/roster/details and no save mutation');
}
