import {matchAnnouncer} from './match-announcer.mjs?v=team-warp-1';

const teamTimers=[[120_000,'two-minutes'],[60_000,'one-minute'],[30_000,'thirty-seconds'],[10_000,'running-out']];
const maxDelay=6500;

export function clientAnnouncer(voice){
 const announced=new Set();
 let previous,legacy,legacyBattle,prepareTimer,legacyInitialized=false;
 function reset(){
  clearTimeout(prepareTimer);
  announced.clear();
  previous=legacyBattle=null;
  legacy=matchAnnouncer();
  legacyInitialized=false;
  voice.clear();
 }
 reset();
 function cue(id,clip,valid){
  if(announced.has(id))return;
  announced.add(id);
  voice.play('colosseum-announcer/'+clip,valid);
 }
 function freshEvents(state){
  return (state.events||[]).filter(event=>state.now-event.at<=maxDelay&&!announced.has('log:'+event.id));
 }
 function legacyEvents(state,me){
  const solo=state.mode==='survival';
  if(!legacyInitialized){
   legacyInitialized=true;
   legacy.start(previous?.survivors??state.survivors??state.players.length);
  }
  const player=name=>{
   const matches=state.players.filter(p=>p.name===name);
   return matches.length===1?matches[0]:null;
  };
  const fallen=new Set();
  for(const event of freshEvents(state)){
   announced.add('log:'+event.id);
   if(event.type==='boss'){
    legacy.add(event.text.includes(' สังหาร')?'boss-defeated':'boss-appeared',event.at);
    continue;
   }
   const kill=solo?/^(.+) ชนะ (.+) · \+20 คะแนน$/.exec(event.text):/^(.+) สังหาร (.+) · /.exec(event.text);
   if(kill){
    const winner=player(kill[1]),victim=player(kill[2]);
    if(winner&&victim){legacy.fall(victim,winner,event.at,solo);fallen.add(victim.id);}
    continue;
   }
   if(solo&&event.text.endsWith(' · +10 คะแนน')){
    const winner=state.players.find(p=>event.text.startsWith(p.name+' ชนะ'));
    if(winner)legacy.beast(winner,event.at);
   }
  }
  if(previous)for(const p of state.players){
   if(p.phase==='dead'&&!fallen.has(p.id)&&previous.players.find(old=>old.id===p.id)?.phase!=='dead')legacy.fall(p,null,state.now,solo);
  }
  if(!solo)for(const base of state.bases||[]){
   const old=previous?.bases?.find(b=>b.id===base.id);
   if(!old)continue;
   if(old.side!==base.side){
    if(!base.main)cue('capture:'+base.id+':'+state.now,base.side===me.side?'enemy-tower':'your-tower');
   }else if(base.main&&base.side===me.side&&base.hp<old.hp&&!old.underAttack){
    cue('attack:'+base.id+':'+state.now,'base-under-attack');
   }else if(base.main&&base.side===me.side&&base.underAttack&&!old.underAttack){
    cue('attack:'+base.id+':'+state.now,'base-under-attack');
   }
  }
  return legacy.forPlayer(me,state.now);
 }
 function battle(b){
  if(!previous||previous.announcements||!b)return;
  if(previous.mode==='survival'&&previous.survivors===2&&b.teams?.[1]?.length)cue('final-duel','final-duel');
  if(previous.mode!=='survival'&&!b.boss&&b.finished&&legacyBattle!==b.id&&b.teams?.[0]?.[0]===previous.me&&
   b.enemies?.some(unit=>unit.kind==='beast'&&unit.hp<=0)){
   legacyBattle=b.id;legacy.beast({id:previous.me},previous.now);
  }
 }
 function sync(state){
  if(previous&&state.code!==previous.code)reset();
  const me=state.players.find(p=>p.id===state.me);
  if(!me){previous=state;return;}
  const solo=state.mode==='survival';
  if(state.phase==='match'&&previous?.phase!=='match'){
   const opened=state.events?.some(e=>e.text==='ประตูสนามเปิดแล้ว!'&&state.now-e.at<3500);
   if(opened||previous?.phase==='lobby'){
    cue('match-begin','battle-begin');
    prepareTimer=setTimeout(()=>cue('match-prepare','prepare',()=>previous?.phase==='match'),3000);
   }
  }
  if(state.phase==='match'&&!solo&&Number.isFinite(state.ends)){
   const remaining=state.ends-state.now;
   for(const [at,clip] of teamTimers)if(remaining<=at&&remaining>at-1750){
    cue(clip,clip,()=>previous?.phase==='match');
   }
  }
  if(solo&&state.phase==='match'&&me.phase!=='dead'){
   const at=state.nextEliminationAt;
   if(at-state.now<=10_000&&at>state.now)cue('cut-warning:'+at,'running-out',
    ()=>previous?.phase==='match'&&previous.nextEliminationAt===at);
   const cut=previous?.nextEliminationAt;
   if(cut&&at>cut&&state.now-cut<=1750)cue('cut:'+cut,'times-up');
  }
  const events=state.announcements??legacyEvents(state,me);
  for(const event of events)if(state.now-event.at<=maxDelay)cue('event:'+event.id,event.clip);
  if(state.phase==='finished'&&state.reason!=='error'){
   clearTimeout(prepareTimer);
   if(state.reason==='time')cue('match-time','times-up');
   if(state.winner!==-1&&(!solo||state.winner===me.id)){
    cue('match-result',state.winner===(solo?me.id:me.side)?'victory':'defeat');
   }
  }
  previous=state;
 }
 return {sync,battle,reset};
}
