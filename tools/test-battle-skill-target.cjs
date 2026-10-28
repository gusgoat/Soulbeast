const assert=require('node:assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
const {run:r}=require('./game-context.cjs')(file);
r(`render=()=>{};S.screen='battle';S.ui.autoPet=false;S.ui.autoTeam=false;S.P.lv=60;S.P.cls='summoner';S.P.hp=pStats().hp;S.P.mp=pStats().mp;startBattle([wildUnit('dragon',55,0),wildUnit('kappa',55,1)],'npc',1);S.battle.cur='P';S.battle.menu='skill';const targetActor=uById('P');targetActor.mp=999;VQ.length=0;const chosenMp=targetActor.mp,chosenQueue=JSON.stringify(S.battle.queue),chosenLog=S.battle.log.length;`);
r("battleAction('sk:su_weaken')");assert.equal(r('BattleSkillTarget.current().side'),'enemy');assert.equal(r('targetActor.mp'),999);assert.equal(r('VQ.length'),0);assert.equal(r('S.battle.log.length===chosenLog'),true);assert.equal(r('JSON.stringify(S.battle.queue)===chosenQueue'),true);
r("battleAction('ally:0')");assert(r('BattleSkillTarget.current()'));assert.equal(r('targetActor.mp'),999);
r("battleAction('target:1')");assert.equal(r('BattleSkillTarget.pending'),null);assert.equal(r('S.battle.target'),1);assert(r('targetActor.mp<chosenMp'));assert.equal(r('S.battle.menu'),'wait');
// Cancel and stale turns do not spend MP or dispatch anything.
r("S.battle.menu='main';battleAction('sk:attack');handlers.battleTargetCancel()");assert.equal(r('BattleSkillTarget.pending'),null);
r("S.battle.menu='main';battleAction('sk:attack');S.battle.round++;BattleSkillTarget.current()");assert.equal(r('BattleSkillTarget.pending'),null);
// Friendly single-target, resurrection eligibility, forced taunt and area/self/random exclusions.
r("const friend=wildUnit('unicorn',40,2);friend.id='friend';friend.side='ally';friend.kind='pet';S.battle.allies.push(friend);S.battle.menu='main';battleAction('sk:su_mend')");assert.equal(r('BattleSkillTarget.current().side'),'ally');assert.equal(r("BattleSkillTarget.valid(S.battle.enemies[0],'enemy')"),false);r('handlers.battleTargetCancel()');
assert.equal(r("BattleSkillTarget.side(SK.su_ward)"),'');assert.equal(r("BattleSkillTarget.side(SK.rest)"),'');assert.equal(r("BattleSkillTarget.side({t:'p',all:true})"),'');assert.equal(r("BattleSkillTarget.side({t:'p',rt:true})"),'');assert.equal(r("BattleSkillTarget.side({t:'buff',tg:'self'})"),'');
r("S.battle.menu='main';battleAction('sk:attack');S.battle.enemies[0].taunt=2");assert.equal(r("BattleSkillTarget.valid(S.battle.enemies[1],'enemy')"),false);assert.equal(r("BattleSkillTarget.valid(S.battle.enemies[0],'enemy')"),true);r('S.battle.enemies[0].hp=0');assert.equal(r("BattleSkillTarget.valid(S.battle.enemies[0],'enemy')"),false);r('handlers.battleTargetCancel()');
r(`const targetRequests=[];pvpRequest=p=>targetRequests.push(p);pvpSessionSave=()=>{};S.battle=null;S.screen='pvp';const pvpActor=playerUnit();pvpActor.owner=0;pvpActor.id='p0';pvpActor.mp=999;const pvpEnemy=wildUnit('kappa',40,0);pvpEnemy.owner=1;pvpEnemy.id='p1';const pvpEnemy2=wildUnit('dragon',40,1);pvpEnemy2.id='p2';pvpEnemy2.owner=1;PVP.room={id:'fixture',rev:2,status:'active',me:0,battle:{allies:[pvpActor],enemies:[pvpEnemy,pvpEnemy2],cur:'p0',round:1,queue:[]}};PVP.pending=null;PVP.busy=false;handlers.pvpMove('attack');`);
assert.equal(r('targetRequests.length'),0,'PVP must not submit before target');assert(r('BattleSkillTarget.current()'));r("handlers.pvpTarget('p1')");assert.equal(r('targetRequests.length'),1);assert.equal(r('targetRequests[0].target'),'p1');assert.equal(r('targetRequests[0].skill'),'attack');
r("PVP.pending=null;handlers.pvpMove('attack');PVP.room.rev++;BattleSkillTarget.current()");assert.equal(r('BattleSkillTarget.pending'),null,'PVP revision changes invalidate choice');assert.equal(r('targetRequests.length'),1);
// One valid target (including forced taunt or only the caster) commits immediately.
r(`S.screen='battle';PVP.pending=null;startBattle([wildUnit('kappa',40,0)],'npc',1);S.battle.cur='P';S.battle.menu='main';S.battle.allies=[playerUnit()];S.battle.allies[0].mp=999;VQ.length=0;battleAction('sk:su_weaken');`);
assert.equal(r('BattleSkillTarget.pending'),null);assert.equal(r('S.battle.menu'),'wait');assert(r('uById("P").mp<999'));
r(`S.battle.menu='skill';uById('P').mp=999;battleAction('sk:su_mend');`);assert.equal(r('BattleSkillTarget.pending'),null);assert.equal(r('S.battle.menu'),'wait');assert(r('uById("P").mp<999'));
r(`S.battle=null;S.screen='pvp';PVP.pending=null;PVP.room.battle.enemies=[pvpEnemy];PVP.room.battle.cur='p0';PVP.room.rev++;handlers.pvpMove('attack');`);assert.equal(r('targetRequests.length'),2,'sole PVP target submits exactly once');assert.equal(r('BattleSkillTarget.pending'),null);
console.log('PASS '+file+': skill first, target second; no early effects/MP/turn/RPC, ally/taunt/dead guards, cancel, stale turns, unchanged PVP request contract');
}
