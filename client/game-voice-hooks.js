(function(){
 const script=document.currentScript;
 const url=new URL('./game-system-voices.mjs?v=1',script.src);
 import(url.href).then(({systemVoice,bossVoice})=>{
  const battleCues=new WeakMap();
  let worldRoomId,worldCues=new Set(),gachaReceipt,timerId,timerWarning=false,timerExpired=false;
  let liftedWorldStatus=false,lastZoneMax=S.P?.zoneMax,lastTowerBest=S.P?.towerBest??0;
  window.SoulbeastGameVoiceMix={
   enabled:()=>Sound.enabled,
   volume:()=>Sound.volume*Sound.effectsVolume,
   duck(on){
    if(!Sound.ctx||!Sound.musicBus)return;
    Sound.musicBus.gain.setTargetAtTime(Sound.musicVolume*(on?.42:1),Sound.ctx.currentTime,.045);
   },
  };
  const once=(cues,key,callback)=>{if(!cues.has(key)){cues.add(key);callback();}};
  const battleKeys=b=>{
   if(!battleCues.has(b))battleCues.set(b,new Set());
   return battleCues.get(b);
  };
  const demon=b=>['boss','warpBoss'].includes(b?.kind)&&b.enemies?.find(u=>u.sp==='demonlord'&&!u.immortalWorld);
  function battleVoice(){
   const battle=B();
   if(S.screen!=='battle'||!battle)return;
   const key=battleKeys(battle),lord=demon(battle),valid=()=>S.screen==='battle'&&B()===battle;
   if(lord){
    if(!battle.over&&battle.round<=1)once(key,'kneel',()=>bossVoice('kneel',valid));
    if(!battle.over&&battle.noFlee&&battle.round<=1)once(key,'fate',()=>bossVoice('fate',valid));
    if(!battle.over&&lord.reborn&&lord.hp>0)once(key,'enough',()=>bossVoice('enough',valid));
    if(battle.over?.res==='win')once(key,'win',()=>{
     bossVoice('defeated',valid);
     systemVoice('boss-defeated',valid);
    });
   }
   if(battle.over?.res==='lose'&&battle.over.lines?.some(line=>line.includes('ชาวบ้านช่วยพากลับมาที่โรงพยาบาล'))){
    once(key,'fallen',()=>systemVoice('fallen',valid));
   }
   if(lastZoneMax!=null&&S.P?.zoneMax>lastZoneMax&&!lord&&battle.over?.res==='win'){
    once(key,'zone-unlocked',()=>systemVoice('congratulations',valid));
   }
   if(battle.towerRun&&battle.over?.res==='win'&&S.P?.towerBest>lastTowerBest){
    once(key,'tower-record',()=>systemVoice('congratulations',valid));
   }
  }
  function worldVoice(){
   if(S.screen!=='world')return;
   const room=WORLD.room;
   if(!room&&WORLD.used!=null&&Number(WORLD.used)<3&&!WORLD.busy&&!WORLD.error&&!liftedWorldStatus){
    liftedWorldStatus=true;systemVoice('world-appeared',()=>S.screen==='world'&&!WORLD.room);
   }
   if(!room?.battle)return;
   if(room.id!==worldRoomId){worldRoomId=room.id;worldCues=new Set();}
   const b=room.battle,turn=b.bossTurns||0;
   const valid=()=>S.screen==='world'&&WORLD.room?.id===room.id;
   if(room.status==='active'){
    if(turn<=1)once(worldCues,'challenge',()=>bossVoice('challenge',valid));
    if(turn>=6)once(worldCues,'enough',()=>bossVoice('enough',valid));
    const spell=b.effects?.find(effect=>effect.k==='cast'&&effect.skill===SP.demonlord.sig&&
     b.enemies?.some(unit=>unit.id===effect.uid&&(unit.immortalWorld||unit.id==='worldboss')));
    if(spell&&turn!==6)once(worldCues,'crush',()=>bossVoice('crush',valid));
   }
   const defeated=b.enemies?.some(unit=>unit.id==='worldboss'&&!unit.immortalWorld&&unit.hp<=0);
   if(room.status==='finished'&&defeated)once(worldCues,'win',()=>{
    bossVoice('return',valid);
    systemVoice('boss-defeated',valid);
   });
  }
  const priorRender=render;
  render=function(...args){
   const out=priorRender.apply(this,args);
   window.SoulbeastGameVoice?.refresh();
   battleVoice();worldVoice();
   lastZoneMax=S.P?.zoneMax;
   lastTowerBest=S.P?.towerBest??0;
   return out;
  };
  const priorAct=act;
  act=function(unit,id,...args){
   const b=B();
   const out=priorAct.call(this,unit,id,...args);
   if(out&&demon(b)===unit&&id===SP.demonlord.sig){
    once(battleKeys(b),'crush',()=>bossVoice('crush',()=>B()===b));
   }
   return out;
  };
  const priorEvolution=showEvolutionNotice;
  showEvolutionNotice=function(...args){
   const aboutToShow=!EvolutionNotice.playing&&EvolutionNotice.queue.length>0;
   const out=priorEvolution.apply(this,args);
   if(aboutToShow)systemVoice('evolution',()=>EvolutionNotice.playing);
   return out;
  };
  const priorReveal=gachaRevealSound;
  gachaRevealSound=function(rewards){
   const out=priorReveal.call(this,rewards);
   if(gachaReceipt!==GACHA.rewards&&rewards.some(reward=>reward.category==='eclipseGear'||reward.category==='legendBeast')){
    gachaReceipt=GACHA.rewards;
    systemVoice('congratulations',()=>S.screen==='gacha'&&GACHA.rewards===gachaReceipt);
   }
   return out;
  };
  const priorSecretEnter=Secret.enter;
  Secret.enter=function(...args){
   const before=S.zone?.secretSession;
   const known=new Set(Object.keys(S.P?.secrets?.locations||{}));
   const out=priorSecretEnter.apply(this,args);
   const location=S.zone?.secretSession;
   if(!before&&location&&!known.has(location.id))systemVoice('hidden-area',()=>S.screen==='zone'&&S.zone?.secretSession===location);
   return out;
  };
  const priorTaleAccept=WorldTales.accept;
  WorldTales.accept=function(token){
   const id=this.session()?.id,previous=this.state().quests[id];
   const out=priorTaleAccept.call(this,token),quest=this.state().quests[id];
   if(quest&&quest!==previous&&quest.status==='active')systemVoice('quest-accepted');
   return out;
  };
  const priorTaleResolve=WorldTales.resolve;
  WorldTales.resolve=function(...args){
   const pending=this.session()?.pending,id=pending?.id;
   const wasComplete=this.state().quests[id]?.status==='completed';
   const out=priorTaleResolve.apply(this,args);
   if(pending?.kind==='quest'&&!wasComplete&&this.state().quests[id]?.status==='completed')systemVoice('quest-completed');
   return out;
  };
  const priorClock=onlineClockTick;
  onlineClockTick=function(...args){
   const r=PVP.room;
   if(S.screen==='pvp'&&r?.status==='active'&&!r.replaying&&document.getElementById('pvpTurnTimer')){
    const b=r.battle,actor=[...b.allies,...b.enemies].find(u=>u.id===b.cur);
    if(actor?.owner===r.me&&!r.players[r.me]?.auto){
     const id=r.id+':'+b.cur+':'+r.deadline,seconds=onlineSeconds('pvp');
     if(id!==timerId){timerId=id;timerWarning=timerExpired=false;}
     if(seconds>0&&seconds<=5&&!timerWarning){
      timerWarning=true;
      systemVoice('running-out',()=>S.screen==='pvp'&&timerId===id&&PVP.room?.status==='active'&&onlineSeconds('pvp')>0);
     }
     if(seconds===0&&!timerExpired){timerExpired=true;systemVoice('times-up');}
    }
   }
   return priorClock.apply(this,args);
  };
  const priorMute=Sound.mute;
  Sound.mute=function(...args){window.SoulbeastGameVoice?.clear();return priorMute.apply(this,args);};
 }).catch(error=>console.warn('Game voices could not start',error));
})();
