const assert=require('assert/strict');
(async()=>{for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file,{tutorial:true}),r=g.run;
 r('render=()=>{Tutorial.update()};Sound.fx=()=>{};Sound.cry=()=>{};');
 const fresh=()=>r('handlers.newgame();S.ui={};');
 assert.equal(r('Tutorial.state().active'),'stats');
 r('handlers.autoStatsAll()');assert(r('Tutorial.state().done.stats'));assert.equal(r('Tutorial.free()'),0);
 r("handlers.go('wild')");assert.equal(r('Tutorial.state().active'),'training');
 r("handlers.forestPick('7')");assert(r('Tutorial.definition().selector.includes("zone")'));
 r("handlers.dozone('7');S.ui.cinema=null;S.screen='zone';Tutorial.update()");assert.equal(r('Tutorial.state().active'),'fork');assert.equal(r('Tutorial.definition().selector'),'[data-a="fork"]');
 r("var firstDepth=S.zone.depth;handlers.fork('1')");assert(r('Tutorial.state().done.fork'));assert(r('S.zone.depth>firstDepth'));
 // Intro pauses the offline battle and releases it once both visual pages are acknowledged.
 fresh();r("Tutorial.state().done.stats=true;S.zone={id:7,depth:1,log:[]};startBattle([wildUnit(ZN[6].sp[0],3,0)],'wild',7);");
 assert.equal(r('Tutorial.state().active'),'battleIntro');assert(r('Tutorial.pending&&Tutorial.hold()'));assert(r('vBattle().length>0'),'Battle view renders before the first actor is assigned');const hp=r('S.P.hp');
 r('Tutorial.next()');assert.equal(r('Tutorial.state().active'),'elements');assert.equal(r('S.P.hp'),hp);
 r('Tutorial.next()');assert.equal(r('Tutorial.state().active'),'skills');assert(!r('Tutorial.hold()'));
 r("Tutorial.state().active='captureIntro';Tutorial.pending=null;B().cur='P';B().menu='main';var releaseCalls=0,normalBattleLater=battleLater;battleLater=()=>releaseCalls++;Tutorial.next();battleLater=normalBattleLater;");assert.equal(r('releaseCalls'),0,'Closing a manual-turn hint cannot add a second continuation');
 r('S.battle=null;S.zone=null;S=JSON.parse(JSON.stringify(S));S.screen="town";Tutorial.update()');assert(r('Tutorial.state().done.battle'));assert(r('Tutorial.state().done.elements'));
 // Allocating newly earned points must not restart the first-forest lesson or
 // replace another pending milestone. The old bug persisted active=forest.
 fresh();r("Tutorial.state().done={stats:true,forest:true,training:true,fork:true};Tutorial.state().active=null;S.P.lv=4;S.P.free=5;S.P.pets.forEach(p=>p.free=0);handlers.autoStatsAll();");
 assert.equal(r('Tutorial.state().active'),null);assert(r('Tutorial.state().done.forest'));
 r("S.P.lv=5;S.P.free=5;Tutorial.state().active='shop';handlers.autoStatsAll();");assert.equal(r('Tutorial.state().active'),'shop');
 r("S=JSON.parse(JSON.stringify(S));Tutorial.state().active='forest';Tutorial.update();");assert.equal(r('Tutorial.state().active'),null,'Repair a completed forest lesson left active in an existing save');
 fresh();r("handlers.autoStatsAll();handlers.go('wild');handlers.forestPick('7');handlers.dozone('7');S.ui.cinema=null;S.zone.depth=1;Tutorial.update();S.zone=null;S.screen='town';S.P.lv=4;S.P.free=5;handlers.autoStatsAll();");assert.equal(r('Tutorial.state().active'),null,'Real first-forest flow remains completed after leveling and reallocating');
 fresh();r("Tutorial.state().active='tower';Tutorial.state().done.stats=true;S.P.lv=8;S.P.free=5;handlers.autoStatsAll();");assert.equal(r('Tutorial.state().active'),'tower','Uncompleted forest lesson cannot replace an unrelated milestone');
 fresh();r("Tutorial.state().done.stats=true;Tutorial.state().active=null;S.P.lv=4;S.P.free=5;handlers.autoStatsAll();");assert.equal(r('Tutorial.state().active'),null,'Stats lesson already acknowledged cannot restart the forest prompt');
 fresh();r("Tutorial.state().done={stats:true,battle:true,skills:true,captureIntro:true};Tutorial.state().active=null;S.zone={id:7,depth:2,log:[]};startBattle([wildUnit(ZN[6].sp[0],3,0)],'wild',7);B().cur='P';B().menu='main';B().enemies[0].hp=Math.floor(B().enemies[0].st.hp*.45);Tutorial.update();");assert.equal(r('Tutorial.state().active'),'capture');
 r("handlers.bt('menu:seal');var sealsBefore=S.P.items.seal1,normalRandom=Math.random;Math.random=()=>.999;handlers.bt('seal:seal1');Math.random=normalRandom;");assert.equal(r('S.P.items.seal1'),r('sealsBefore-1'));assert(r('Tutorial.state().done.capture'),'A real sealing attempt completes the lesson, without changing success probability');
 // A legacy character is left alone; online combat is excluded even for an enrolled one.
 r('delete S.P.tutorial;Tutorial.update()');assert.equal(r('Tutorial.state()'),null);
 fresh();r("PVP.room={status:'active'};S.zone={id:7,depth:1,log:[]};startBattle([wildUnit(ZN[6].sp[0],3,0)],'wild',7);");assert(!r('Tutorial.hold()'));r('PVP.room=null');
 // Milestones start at the specified city-return thresholds, in a stable queue.
 const milestone=(lv,done={})=>{fresh();g.ctx.milestoneDone=done;r(`Tutorial.state().done={stats:true,forest:true,training:true,fork:true,...milestoneDone};Tutorial.state().active=null;S.P.lv=${lv};Tutorial.update();`);return r('Tutorial.state().active');};
 assert.equal(milestone(7),null);assert.equal(milestone(8),'tower');
 assert.equal(milestone(10,{tower:true}),null);assert.equal(milestone(11,{tower:true}),'raid');
 assert.equal(milestone(20,{tower:true,raid:true}),null);assert.equal(milestone(21,{tower:true,raid:true}),'guild');
 assert.equal(milestone(26,{tower:true,raid:true,guild:true}),'promotion');
 assert.equal(milestone(26,{tower:true,raid:true,guild:true,promotion:true}),'world');
 assert.equal(milestone(30,{tower:true,raid:true,guild:true,promotion:true,world:true}),'guildwar');
 fresh();r("S.P.lv=11;Tutorial.state().active=null;Tutorial.state().done={stats:true,tower:true};CAMP.room={status:'active'};Tutorial.update();");assert.equal(r('Tutorial.state().active'),null);r("Tutorial.state().active='raid';");assert(!r('Tutorial.openRaid()'),'An existing online raid must finish before practice can open');r('CAMP.room=null');
 fresh();r('Tutorial.state().active=null;Tutorial.state().done.stats=true;S.P.lv=30;S.zone={id:1,depth:2,log:[]};S.screen="zone";Tutorial.update()');assert.equal(r('Tutorial.state().active'),null,'No milestone interrupts forest travel');
 fresh();r("Tutorial.state().done.battle=true;Tutorial.state().active=null;S.zone={id:7,depth:10,log:[]};startBattle([wildUnit(ZN[6].boss.sp||ZN[6].sp[0],3,0)],'boss',7);B().enemies.forEach(e=>e.hp=0);endBattle('win');");assert(r('Tutorial.state().firstBoss'));
 r('S.battle=null;S.zone=null;S.ui={};S.screen="town";Tutorial.state().active=null;Tutorial.update()');assert.equal(r('Tutorial.state().active'),'hospital');
 // Registration failure cannot unlock practice; confirmed registration uses carried pets only.
 milestone(11,{tower:true});r("Tutorial.openRaid();var authCalls=[];gsSave=async()=>{};campCall=async(a,x)=>{authCalls.push({a,x});return {ok:false}};Tutorial.state().raidPicks=[carriedPets()[0].uid];");
 await r('Tutorial.defenseSave()');assert.equal(r('Tutorial.state().active'),'raidDefense');assert(!r('Tutorial.state().defenseRegistered'));assert(r('Tutorial.state().raidError.length>0'));
 r('campCall=async(a,x)=>{authCalls.push({a,x});return {ok:true}};');await r('Tutorial.defenseSave()');
 assert.equal(r('Tutorial.state().active'),'raidPractice');assert(r('Tutorial.state().defenseRegistered'));assert.equal(r('authCalls[1].a'),'camp_register');
 r('var goldBefore=S.P.gold,usedBefore=CAMP.used,hpBefore=S.P.hp,mpBefore=S.P.mp,petBefore=JSON.stringify(S.P.pets);Tutorial.strike();');assert.equal(r('S.P.gold'),r('goldBefore'));
 r('Tutorial.strike();Tutorial.strike();');assert.equal(r('S.P.gold'),r('goldBefore+200'));assert.equal(r('CAMP.used'),r('usedBefore'));assert.equal(r('S.battle'),null);assert.equal(r('S.P.hp'),r('hpBefore'));assert.equal(r('S.P.mp'),r('mpBefore'));assert.equal(r('JSON.stringify(S.P.pets)'),r('petBefore'));
 r('S=JSON.parse(JSON.stringify(S));Tutorial.strike();handlers.tutorialRaidDone();Tutorial.strike();');assert.equal(r('S.P.gold'),r('goldBefore+200'));assert(r('Tutorial.state().done.raid'));
 assert.equal(r('authCalls.filter(c=>c.a==="camp_begin").length'),0);
 // Storage failure rolls back both money and claim; retry grants exactly one reward.
 r("Tutorial.state().active='raidPractice';Tutorial.state().raidClaimed=false;Tutorial.state().defenseRegistered=true;Tutorial.state().raidStage=1;var rollbackGold=S.P.gold;");
 const originalStore=g.ctx.localStorage.setItem;g.ctx.localStorage.setItem=()=>{throw Error('quota')};r('Tutorial.strike()');assert.equal(r('S.P.gold'),r('rollbackGold'));assert(!r('Tutorial.state().raidClaimed'));g.ctx.localStorage.setItem=originalStore;
 r('Tutorial.strike();Tutorial.strike()');assert.equal(r('S.P.gold'),r('rollbackGold+200'));
 // Tutorial flags survive the same cloud payload as the rest of the character.
 assert(r('JSON.parse(gsData()).P.tutorial.raidClaimed'));assert(r('JSON.parse(gsData()).P.tutorial.done.stats'));
 console.log('PASS '+file+': first-time flags, visual flow, pause/resume, city milestones, online exclusions, confirmed defense, guaranteed practice, exactly-once200 and quota rollback');
}})().catch(e=>{console.error(e);process.exitCode=1});
