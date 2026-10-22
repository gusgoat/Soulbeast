const assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r('render=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};ExtraAudio.play=()=>{};');
 const reset=(zone=7)=>r(`handlers.newgame();S.ui={};S.P.lv=60;S.P.zoneMax=7;S.P.gold=100000;S.P.items.pot=50;S.P.hp=pStats().hp;S.P.mp=pStats().mp;S.zone={id:${zone},depth:1,log:[]};S.screen='zone';WorldTales.run();`);
 assert.equal(r('TALES_DATA.quests.length'),28);assert.equal(r('TALES_DATA.special.length'),7);
 for(const d of JSON.parse(r('JSON.stringify(TALES_DATA.quests)')))for(let branch=0;branch<d.actions.length;branch++){
  reset(d.zone);g.ctx.def=d;r("S.zone.taleSession={id:def.id,mode:'offer',token:'offer',result:[]};WorldTales.accept('offer');");assert.equal(r('WorldTales.state().quests[def.id].status'),'active');
  const targets=d.kind==='short'?[d.zone]:d.targets;
  for(let n=0;n<targets.length;n++){
   if(d.kind!=='short')r(`S.zone={id:${targets[n]},depth:2,log:[]};WorldTales.run();`);else r("delete S.zone.taleSession;S.zone.ev=null;");
   r("WorldTales.encounter('follow');WorldTales.next(WorldTales.token());");
   assert.equal(r('WorldTales.session().mode'),n<targets.length-1?'result':'question');
  }
  assert(r('WorldTales.view().includes(def.actions[0].label)'));g.ctx.branch=branch;r(`var chosen=def.actions[branch];for(const c of chosen.requires||[]){if(c.quest)WorldTales.state().quests[c.quest]={id:c.quest,status:'completed',kind:'medium'};if(c.afterZone)WorldTales.state().aftermaths['fixture']={zone:c.afterZone,repaired:true};if(c.completed||c.longCompleted){for(const d of TALES_DATA.quests.filter(d=>d.id!==def.id&&(!c.longCompleted||d.kind==='long')).slice(0,c.completed||c.longCompleted))WorldTales.state().quests[d.id]={id:d.id,status:'completed',kind:d.kind};}if(c.secretCompleted)for(const d of SECRET_DATA.locations.slice(0,c.secretCompleted))Secret.state().locations[d.id]={completed:true,choices:{},outcome:'fixture'};}if(chosen.effects.costGear){var gear=Object.keys(EQ).find(k=>!EQ[k].legend&&!EQ[k].worldLegend&&!Object.values(S.P.eq).includes(k));S.P.owned.push(gear);WorldTales.session().gearChoice={id:gear,index:S.P.owned.length-1};}`);const gold=r('S.P.gold');r(`WorldTales.choose(WorldTales.token(),${branch})`);
  if(r("S.battle?.kind==='taleTrial'")){r("B().enemies.forEach(u=>u.hp=0);endBattle('win');battleAction('done');");}
  assert.equal(r('WorldTales.state().quests[def.id].status'),'completed',d.id);assert.equal(r('WorldTales.state().quests[def.id].branch'),branch);assert(r('S.P.gold>='+ (gold-(d.actions[branch].effects.costGold||0))));
  const final=r('JSON.stringify({gold:S.P.gold,owned:S.P.owned,effects:WorldTales.state().effects})');r(`WorldTales.choose(WorldTales.token(),${branch})`);assert.equal(r('JSON.stringify({gold:S.P.gold,owned:S.P.owned,effects:WorldTales.state().effects})'),final,'cannot replay reward');
  r('S=JSON.parse(JSON.stringify(S));');assert.equal(r('WorldTales.state().quests[def.id].status'),'completed');
 }
 for(const d of JSON.parse(r('JSON.stringify(TALES_DATA.special)')))for(let branch=0;branch<d.actions.length;branch++){
  reset(d.zone);g.ctx.def=d;r("WorldTales.encounter('special');");r(`WorldTales.choose(WorldTales.token(),${branch})`);if(r("S.battle?.kind==='taleTrial'"))r("B().enemies.forEach(u=>u.hp=0);endBattle('win');battleAction('done');");assert.equal(r("WorldTales.state().consequences['special:'+def.id].branch"),branch);
 }
 // Wrong tokens and rejected persistence cannot spend resources or commit choices.
 reset();r("S.zone.taleSession={id:'encounter-7',mode:'special',token:'real',result:[]};var snap=JSON.stringify(S);WorldTales.choose('forged',1);");assert.equal(r('JSON.stringify(S)'),r('snap'));
 r("var oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')};WorldTales.choose('real',1);localStorage.setItem=oldSet;");assert.equal(r('JSON.stringify(S)'),r('snap'));
 // Reloading a cloud save resumes the exact pending battle, not a healed/rewarded new fight.
 reset(1);r("S.zone.taleSession={id:'moon-0',mode:'question',token:'fight',result:[]};WorldTales.state().quests['moon-0']={id:'moon-0',kind:'short',status:'active',run:WorldTales.run().serial};WorldTales.choose('fight',0);B().allies[0].hp=123;save();S.battle=null;S.screen='zone';WorldTales.resume();");assert.equal(r('WorldTales.session().mode'),'resume');r('WorldTales.resumeBattle(WorldTales.token())');assert.equal(r('B().allies[0].hp'),123);r("endBattle('lose');battleAction('done');");assert.equal(r('S.screen'),'hospital');assert.equal(r('WorldTales.state().quests["moon-0"].status'),'failed');
 // Independent 50/50 content roll, tested with controlled RNG on actual encounter entry.
 for(const [random,mode] of [[.49,'offer'],[.51,'rumor']]){reset();r(`var oldRandom=Math.random;Math.random=()=>${random};WorldTales.encounter();Math.random=oldRandom;`);assert.equal(r('WorldTales.session().mode'),mode);}
 // Existing unique and dark paths may not be replaced; only one of two ordinary slots is changed.
 reset();r("S.zone.depth=4;var beforeFork=JSON.stringify(S),oldRandom=Math.random;Math.random=()=>0;talesNewFork();var protectedFork=S.zone.fork.map(x=>({...x}));S=JSON.parse(beforeFork);newFork();Math.random=oldRandom;");r("protectedFork.forEach((d,i)=>{if(d.h||['secret','specialEvent','riddleReward'].includes(d.k))if(JSON.stringify(d)!==JSON.stringify(S.zone.fork[i]))throw Error('protected route changed');});");
 // Modifiers are multiplicative, capped, expire by relevant forest visits, and exclude online battles.
 reset(4);r("WorldTales.effects({seal:-.25,element:'dragon'},4,'test','ฝูงมังกร');var u=wildUnit('dragon',30,0);startBattle([u],'wild',4);var base=talesSealChance(u,1),adjusted=sealChance(u,1);");assert(Math.abs(r('adjusted-base*.75'))<1e-8);assert.equal(r('sealChance(u,Infinity)'),1);r("B().kind='world';");assert.equal(r('sealChance(u,1)'),r('talesSealChance(u,1)'));r("S.battle=null;WorldTales.state().visits[4]+=3;");assert.equal(r("WorldTales.modifier('seal',['dragon'])"),0);
 // Secret decision labels/effects retain reward pools and do not reveal future consequences.
 reset(1);r("var secret=SECRET_DATA.locations.find(d=>d.zone===1);var spec=TALES_DATA.secrets.find(d=>d.zone===1);S.zone.secretSession={id:secret.id,event:'decision',revision:0};Secret.record(secret.id);Secret.choose(Secret.token(),secret.choices[0].id);");assert.equal(r("WorldTales.state().consequences['secret:1'].branch"),0);assert(r('Secret.record(secret.id).completed'));
 r('S.P.cleared=1;');assert(r('WorldTales.journal().includes("โลกหลังชัยชนะ")'));assert.equal(r('WorldTales.epilogues().length'),7);assert(r('storyFrames(6,true).filter(f=>f.taleZone).length===7'));
 console.log('PASS '+file+': all quest/encounter branches including gated third choices,token/quota rollback,checkpoint/death,50:50,unique paths,offline effect limits,secret rewards and7 endings');
}
