const assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r('render=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};ExtraAudio.play=()=>{};');
 const reset=(zone=1)=>r(`handlers.newgame();S.ui={};S.P.lv=60;S.P.hp=pStats().hp;S.P.mp=pStats().mp;S.zone={id:${zone},depth:0,log:[]};S.screen='zone';`);
 reset();
 r(`var seed=271,random=Math.random,counts={};Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let n=0;n<1500;n++){
  S.zone={id:1,depth:0,log:[]};let seen=[];for(let depth=0;depth<10;depth++){S.zone.depth=depth;newFork();const doors=(S.zone.fork||[]).filter(d=>ForestStoryRun.routes.includes(d.k));if(doors.length>1)throw Error('Multiple story doors');seen.push(...doors.map(d=>d.k));S=JSON.parse(JSON.stringify(S));}
  if(seen.length>1)throw Error('Multiple stories in one expedition');if(seen.length)counts[seen[0]]=(counts[seen[0]]||0)+1;
 }Math.random=random;`);
 for(const kind of ['secret','specialEvent','riddleReward','riddleHazard','taleEvent','villager'])assert(r(`counts[${JSON.stringify(kind)}]>0`),kind+' participates in shared random draw');
 // Forced competing opportunities are selected once, persist through reload, and cannot reroll.
 reset();r(`Secret.plan(S.zone);ForestSpecial.plan(S.zone);ForestRiddle.plan(S.zone);WorldTales.run();S.zone.secretRun.depth=5;S.zone.specialRun.depth=5;S.zone.riddleRun.reward.depth=5;S.zone.riddleRun.hazard.depth=5;S.zone.taleRun.specialDepth=5;newFork();var selection=JSON.stringify(S.zone.storyRun.selected);S=JSON.parse(JSON.stringify(S));ForestStoryRun.plan();`);
 assert.equal(r('JSON.stringify(S.zone.storyRun.selected)'),r('selection'));
 // A consumed event blocks all other entrance paths, including hidden traps and direct journal follow-ups.
 reset();r(`ForestSpecial.enter();var consumedDepth=S.zone.depth;ForestSpecial.leave(ForestSpecial.session().token);var protectedState=JSON.stringify(S);Secret.enter();WorldTales.encounter();SecretWarp.trigger('dark');`);
 assert.equal(r('JSON.stringify(S)'),r('protectedState'));
 assert.equal(r("FalseBoss.eligible()"),false);
 r(`S.zone.depth=5;S.zone.fork=[{k:'mist',h:true},{k:'beast',h:false}];S.zone.riddleRun={hazard:{id:FOREST_RIDDLES.find(d=>d.zone===1&&d.group==='hazard').id,depth:5,used:false},reward:{used:true}};var hazardBefore=S.zone.depth;chooseFork(0);`);
 assert(!r('S.zone.riddleSession||S.zone.warpGate||S.zone.falseBoss'));
 // A short quest remains one story: its acceptance and completion can happen in this expedition.
 reset(7);r(`WorldTales.run();S.zone.taleSession={id:'training-0',mode:'offer',token:'offer',result:[]};WorldTales.accept('offer');WorldTales.leave(WorldTales.token());`);
 assert(r("S.zone.fork.some(d=>d.k==='taleFollow')"));
 r(`chooseFork(S.zone.fork.findIndex(d=>d.k==='taleFollow'));WorldTales.next(WorldTales.token());WorldTales.choose(WorldTales.token(),1);WorldTales.leave(WorldTales.token());var afterShort=JSON.stringify(S);WorldTales.encounter();ForestSpecial.enter();`);
 assert.equal(r('JSON.stringify(S)'),r('afterShort'));
 assert.equal(r("WorldTales.state().quests['training-0'].status"),'completed');
 // Two pending follow-ups share the same budget, and no progress is lost when one waits.
 reset(1);r(`WorldTales.run();var pending=TALES_DATA.quests.filter(d=>d.kind!=='short').slice(0,2);for(const d of pending)WorldTales.state().quests[d.id]={id:d.id,kind:d.kind,status:'active',run:0,progress:0,targets:[1,1],acceptedAt:0};S.zone.secretRun={offered:true,processedDepth:0};S.zone.specialRun={depth:null};S.zone.riddleRun={reward:{},hazard:{}};S.zone.taleRun.specialDepth=null;var priorRandom=Math.random;Math.random=()=>.9;newFork();Math.random=priorRandom;var selectedFollow=S.zone.storyRun.selected.id;S.zone.depth=1;newFork();chooseFork(S.zone.fork.findIndex(d=>d.k==='taleFollow'));WorldTales.next(WorldTales.token());WorldTales.leave(WorldTales.token());var beforeOther=JSON.stringify(S);WorldTales.encounter('follow');`);
 assert.equal(r('JSON.stringify(S)'),r('beforeOther'));
 assert.equal(r('Object.values(WorldTales.state().quests).filter(q=>q.progress===1).length'),1);
 r(`var held=JSON.stringify(WorldTales.state().quests);S.zone={id:1,depth:0,log:[]};WorldTales.run();`);
 assert.equal(r('JSON.stringify(WorldTales.state().quests)'),r('held'));
 // Existing saved sessions and already-used legacy events keep their shared budget after migration.
 reset();r(`S.zone.specialRun={used:true};S=JSON.parse(JSON.stringify(S));newFork();`);assert.equal(r('S.zone.storyRun.used'),'specialEvent');
 r(`for(let depth=1;depth<10;depth++){S.zone.depth=depth;newFork();if((S.zone.fork||[]).some(d=>ForestStoryRun.routes.includes(d.k)))throw Error('Legacy event budget lost');}`);
 console.log('PASS '+file+': 1500 seeded expeditions, one persisted random story, all categories reachable, reload stable, hidden-entry guards, short-quest completion, competing follow-ups and legacy migration');
}
