// Uses the extracted current account engine; it never rolls rewards or writes
// saves. The transaction adapter must persist member.save and settle rewards.
export function partyCombatRuntime({engine,soloEnemies,now=()=>Date.now(),turnMs=600,manual=true}) {
 if (!Number.isFinite(turnMs)||turnMs<100) throw Error('invalid_turn_interval');
 function start(room,members,enemies,id,kind,enemyId) {
  const wallets={};
  const allies=members.flatMap((m,i)=>{
   if(!m.save?.P)throw Error('server_save_required');
   const raw=structuredClone(m.save.P);
   Object.assign(raw,{hp:m.hp,mp:m.mp,ailments:m.ailments||{}});
   const built=engine.team(raw,m.code,i);wallets[m.code]=built.gold;m.exploring=false;
   return built.team;
  });
  return {id,kind,enemyId,participants:members.map(m=>m.code),status:'active',wallets,
   nextTurnAt:now()+turnMs,startedAt:now(),loading:{pending:members.map(m=>m.code),deadline:now()+90000},
   battle:{kind:'dungeonParty',allies,enemies:structuredClone(enemies),round:0,turns:0,queue:[],cur:null,log:[],fx:[],effects:[]}};
 }
 function sync(room,run) {
  const units=[...run.battle.allies,...(run.battle.retiredUnits||[])];
  for(const member of room.members.filter(m=>run.participants.includes(m.code))) {
   const hero=units.find(u=>u.kind==='player'&&u.ownerCode===member.code);
   if(!hero)throw Error('party_hero_missing');
   Object.assign(member,{hp:hero.hp,mp:hero.mp,maxHp:hero.st.hp,maxMp:hero.st.mp,ailments:structuredClone(hero.status)});
   const p=member.save.P;
   Object.assign(p,{hp:hero.hp,mp:hero.mp,ailments:structuredClone(hero.status),gold:run.wallets[member.code]});
   for(const pet of p.pets||[]) {
    const unit=units.find(u=>u.ownerCode===member.code&&u.kind==='pet'&&u.uid===pet.uid);
    if(unit)Object.assign(pet,{hp:unit.hp,mp:unit.mp,ailments:structuredClone(unit.status)});
   }
  }
 }
 function controls(room,run){return {allowCapture:run.kind==='solo'&&room.dungeon.enemies[run.enemyId]?.kind==='shadow',allowEscape:run.kind==='solo',players:Object.fromEntries(room.members.map(m=>[m.code,m.save.P])),manualOwners:manual?room.members.filter(m=>!room.autoPlayers?.[m.code]).map(m=>m.code):[],inventories:Object.fromEntries(room.members.map(m=>[m.code,m.save.P.items||{}]))};}
 function present(room,run,step,time,remaining){
  if(!run.battle.effects?.length)return;
  run.effectSequence=(run.effectSequence??run.battle.turns)+1;
  run.effectActor=step.actor||run.battle.cur;
  run.effectSkill=step.skill;
  run.presentation={
   turn:run.battle.turns,sequence:run.effectSequence,remaining,deadline:time+20000,
   pending:run.participants.filter(code=>room.members.some(m=>m.code===code)&&!run.presentationExpired?.includes(code)&&
    (remaining===undefined||run.presentationClients?.includes(code))),
  };
 }
 function finishStep(room,run,step,time){
  sync(room,run);
  present(room,run,step,time,step.waiting?12000:undefined);
  if(step.waiting){run.waiting={...step.waiting,deadline:time+12000};return;}
  delete run.waiting;run.nextTurnAt=time+turnMs;
  if(step.result){run.status='finished';run.result=step.result;run.finishedAt=time;}
  if(run.status==='finished')for(const m of room.members)if(run.participants.includes(m.code))m.exploring=m.hp>0;
 }
 function releasePresentation(room,run,time){
  const p=run.presentation;
  if(!p)return false;
  p.pending=p.pending.filter(code=>room.members.some(m=>m.code===code));
  if(p.pending.length&&time<p.deadline)return true;
  if(p.pending.length)run.presentationExpired=[...new Set([...(run.presentationExpired||[]),...p.pending])];
  delete run.presentation;
  if(!run.waiting||p.remaining===undefined)return false;
  run.waiting.deadline=time+p.remaining;
  if(room.autoPlayers?.[run.waiting.ownerCode])finishStep(room,run,engine.step(run.battle,run.wallets,controls(room,run)),time);
  return true;
 }
 function beginWhenReady(room,run){
  if(!run.loading)return true;
  run.loading.pending=run.loading.pending.filter(code=>room.members.some(m=>m.code===code&&m.hp>0));
  if(run.loading.pending.length&&now()<run.loading.deadline)return false;
  for(const code of run.loading.pending){room.autoPlayers??={};room.autoPlayers[code]=true;}
  delete run.loading;run.nextTurnAt=now()+turnMs;delete run.waiting;return true;
 }
 return {
  async ready(room,run,actor,data={}){
   if(data.presentationVersion===2&&run.participants.includes(actor)&&!run.presentationClients?.includes(actor)){
    (run.presentationClients??=[]).push(actor);
   }
   const p=run.presentation;
   if(p&&data.turn===p.turn&&(data.sequence===p.sequence||data.sequence===undefined&&p.remaining===undefined)){
    p.pending=p.pending.filter(code=>code!==actor);
    run.presentationExpired=run.presentationExpired?.filter(code=>code!==actor);
    if(!p.pending.length)releasePresentation(room,run,now());
   }
   if(run.loading){run.loading.pending=run.loading.pending.filter(code=>code!==actor);beginWhenReady(room,run);}
  },
  async choose(room,run,actor,data){
   if(!beginWhenReady(room,run)||run.status!=='active'||!run.waiting||run.waiting.ownerCode!==actor)throw Error('not_your_turn');
   if(run.presentation)throw Error('battle_presenting');
   if(now()>=run.waiting.deadline){
    room.autoPlayers??={};room.autoPlayers[actor]=true;
    finishStep(room,run,engine.step(run.battle,run.wallets,controls(room,run)),now());
    return {timedOut:true};
   }
   if(data.swap!==undefined){
    if(data.actor!==run.waiting.actor||data.turn!==run.waiting.turn)throw Error('stale_turn');
    const member=room.members.find(m=>m.code===actor),deadline=run.waiting.deadline;
    sync(room,run);
    const summoned=engine.summon(run.battle,member.save.P,actor,data.swap,data.friend);
    const pending=engine.step(run.battle,run.wallets,controls(room,run));
    if(!pending.waiting)throw Error('invalid_summon');
    run.waiting={...pending.waiting,deadline};
    sync(room,run);
    if(data.presentationVersion===2){
     if(!run.presentationClients?.includes(actor))(run.presentationClients??=[]).push(actor);
     run.battle.effects=[{k:'buff',id:summoned.summoned,source:summoned.actor,skill:'summon:party'}];
     present(room,run,{actor:summoned.actor,skill:'summon:party'},now(),Math.max(0,deadline-now()));
    }
    return {accepted:true};
   }
   const step=engine.step(run.battle,run.wallets,{...controls(room,run),command:{...data,ownerCode:actor}});
   finishStep(room,run,step,now());return {accepted:true};
  },
  async setAuto(room,run,actor,enabled){
   if(typeof enabled!=='boolean')throw Error('invalid_auto_mode');
   room.autoPlayers??={};room.autoPlayers[actor]=enabled;
   // Disabling auto never grants a fresh 12 seconds to an existing turn.
   if(!beginWhenReady(room,run))return;
   if(enabled&&!run.presentation&&run.waiting?.ownerCode===actor)finishStep(room,run,engine.step(run.battle,run.wallets,controls(room,run)),now());
  },
  async createSolo(room,member,enemy,id) {
   const enemyId=Object.keys(room.dungeon.enemies).find(key=>room.dungeon.enemies[key]===enemy);
   return start(room,[member],await soloEnemies(room,enemy),id,'solo',enemyId);
  },
  async createBoss(room,enemies,id){return start(room,room.members.filter(m=>m.hp>0),enemies,id,'boss');},
  async advance(room,run) {
   const time=now();
   if(releasePresentation(room,run,time)||run.status!=='active'||!beginWhenReady(room,run))return;
   if(run.waiting){
    if(time<run.waiting.deadline)return;
    room.autoPlayers??={};room.autoPlayers[run.waiting.ownerCode]=true;
    finishStep(room,run,engine.step(run.battle,run.wallets,controls(room,run)),time);return;
   }
   // One room tick can catch up at most one turn. Repeated HTTP requests at
   // the same timestamp cannot speed the fight up.
   for(let turns=0;turns<1&&run.status==='active'&&run.nextTurnAt<=time;turns++) {
    const step=engine.step(run.battle,run.wallets,controls(room,run));
    finishStep(room,run,step,time);if(run.waiting)break;
   }
   if(run.status==='finished')for(const m of room.members)if(run.participants.includes(m.code))m.exploring=m.hp>0;
  },
  async interrupt(room,run){sync(room,run);run.status='interrupted';for(const m of room.members)if(run.participants.includes(m.code))m.exploring=m.hp>0;},
 };
}
