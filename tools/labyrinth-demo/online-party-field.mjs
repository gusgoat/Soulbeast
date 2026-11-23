// The map owns commands, rewards and reconnects. The field only presents its snapshots.
import '../../content/beast-names.js';
import {partySkills} from './party-skill-display.mjs';
const support=skill=>['heal','buff','rest'].includes(skill?.t);

export function dungeonView(packet,floor,speed,locked){
 const {run,code,auto,clockOffset}=packet,b=run.battle,w=run.waiting;
 const units=[...b.allies.map(u=>({...u,side:'ally'})),...b.enemies.map(u=>({...u,side:'enemy'}))]
  .map(u=>({...u,name:globalThis.SoulbeastBeastNames?.display(u.sp,u.name,u.evo||0)??u.name,maxHp:u.st.hp,maxMp:u.st.mp}));
 const skills=(w?.choices||[]).map(c=>{
  const s=partySkills[c.id]||{};
  return {...s,id:c.id,n:c.name,t:c.type||s.t,rev:c.revive||s.rev,element:s.el,cost:c.mp,cooldown:c.cooldown,available:!c.disabled};
 });
 const ended=run.status!=='active'&&!run.presentation,r=run.rewards?.[code],lines=[];
 if(r){
  lines.push('ได้รับ '+(r.gold||0)+' เหรียญ','ได้รับ EXP '+(r.xp||0));
  for(const [part,count] of Object.entries(r.parts||{}))lines.push(part+' ×'+count);
  for(const level of r.levelUps||[])lines.push(level.name+' · Lv '+level.from+' → '+level.to);
 }
 return {battle:run.id,revision:w?.turn??b.turns??0,turn:b.round||1,current:w?.actor||b.cur,
  clockKey:[run.id,w?.turn,w?.actor,w?.deadline].join('/'),
  seconds:Math.max(0,Math.ceil(((w?.deadline||0)-Date.now()-(clockOffset||0))/1000)),
  context:{mode:'dungeon-party',online:true,stage:'dungeon-'+floor,autoHospital:false,returnLabel:'กลับดันเจี้ยน'},
  auto:!!auto,autoAllowed:!ended,autoPet:false,petAutoAllowed:false,speed,
  waiting:locked||run.status!=='active'||!!run.loading||!!run.presentation||!w||w.ownerCode!==code,
  units,skills,queue:b.queue||[],items:w?.items||[],seals:w?.seals||[],captureTargets:w?.captureTargets||[],
  summons:w?.summons||[],canEscape:!!w?.canEscape,log:b.log||[],
  over:ended?{res:run.result,title:run.result==='win'?'ชนะการต่อสู้':run.result==='lose'?'พ่ายแพ้':'สิ้นสุดการต่อสู้',lines}:null};
}

export function partyField({frame,floor,receive,fallback}){
 const channel=crypto.randomUUID(),post=(type,data)=>frame.contentWindow.postMessage({type,channel,...data},location.origin);
 let packet,view,visible=false,speed=1,lastSequence=null,animating=null,acked=null,locked=null,lastRequest=0,timer,ackTimer,stamp;
 const emit=(type,extra)=>receive({type:'party-battle-'+type,battle:packet?.run.id,...extra});
 function watch(ms){clearTimeout(timer);timer=setTimeout(()=>fallback(visible?'action timed out':'field timed out'),ms);}
 function acknowledge(){
  const p=packet?.run.presentation;
  if(!visible||!p||animating!==null||acked===p.sequence&&acked!=null)return;
  if(Array.isArray(p.pending)&&!p.pending.includes(packet.code))return;
  acked=p.sequence??p.turn;emit('presented',{turn:p.turn,sequence:p.sequence});
  // Acknowledgements can be lost while offline. The server checks both turn and sequence.
  clearTimeout(ackTimer);ackTimer=setTimeout(()=>{if(packet?.run.presentation?.turn===p.turn){acked=null;acknowledge();}},2200);
 }
 function publish(){if(view)post('ordinary-state',{view});}
 function show(next){
  const run=next.run,b=run.battle;if(!b)return;
  if(packet?.run.id!==run.id){
   clearTimeout(ackTimer);visible=false;locked=null;stamp=null;view=null;animating=null;lastSequence=null;acked=null;watch(30000);
  }
  const before=view;
  if(locked&&(locked.turn!==run.waiting?.turn||locked.actor!==run.waiting?.actor))locked=null;
  packet=next;view=dungeonView(next,floor,speed,!!locked);
  const seq=run.effectSequence??run.presentation?.sequence;
  if(visible&&before&&Number.isSafeInteger(seq)&&seq!==lastSequence&&b.effects?.length){
   lastSequence=seq;animating=seq;watch(18000);
   const actor=run.effectActor||b.cur,skill=run.effectSkill||'attack',s=partySkills[skill],
    caster=before.units.find(u=>u.id===actor),friendly=support(s)||skill.startsWith('item:');
   const targets=view.units.filter(u=>friendly?u.side===caster?.side:u.side!==caster?.side);
   const target=targets.find(u=>b.effects.some(e=>e.id===u.id)&&before.units.find(old=>old.id===u.id)?.hp!==u.hp)
    ||targets.find(u=>b.effects.some(e=>e.id===u.id))||targets[0];
   post('ordinary-action',{sequence:seq,before,view,action:{actor,skill,name:s?.n||skill,target:target?.id,friend:target?.id,
    support:friendly,all:!!(s?.all||s?.tg==='team'),range:s?.range||(['m','h'].includes(s?.t)?'ranged':'melee'),events:b.effects}});
  }else{
   if(!visible)lastSequence=seq;
   const key=JSON.stringify([run.id,run.status,run.result,run.rewards,b.turns,run.effectSequence,b.cur,run.waiting,run.presentation?.sequence,!!run.loading,next.auto,!!locked,speed,view.units.map(u=>[u.id,u.hp,u.mp,u.status,u.buffs,u.pas,u.taunt,u.charging,u.charge,u.immune,u.enchant,u.dots,u.form,u.summonLife,u.class10Barrier,u.archerVeil,u.elementalBarrierHits])]);
   if(stamp!==key){stamp=key;publish();}
   acknowledge();
  }
 }
 function message(m){
  if(m?.type==='ordinary-ready'){clearTimeout(timer);emit('ready');return;}
  if(m?.type==='ordinary-render-error'&&(!m.channel||m.channel===channel)){fallback('renderer error');return;}
  if(!packet||m?.channel!==channel||m.battle!==view.battle)return;
  if(m.type==='ordinary-field-ready'){clearTimeout(timer);visible=true;emit('visible');acknowledge();return;}
  if(m.type==='ordinary-presented'&&m.sequence===animating){clearTimeout(timer);animating=null;acknowledge();return;}
  if(m.type!=='ordinary-command'||!Number.isSafeInteger(m.request)||m.request<=lastRequest||m.revision!==view.revision)return;
  lastRequest=m.request;
  if(m.command==='speed'){speed=m.speed===2?2:1;show(packet);return;}
  if(m.command==='done'&&view.over){emit('done');return;}
  if(m.command==='auto'&&!view.over){emit('auto',{enabled:!packet.auto});return;}
  const w=packet.run.waiting;
  if(view.waiting||packet.auto||!visible||!w||w.ownerCode!==packet.code)return;
  let data;
  if(m.command==='skill'){
   const c=w.choices.find(c=>c.id===m.id&&!c.disabled);if(!c)return;
   const selected=[m.friend,m.target].find(id=>c.targets?.includes(id));
   if(c.targets?.length&&!selected&&c.targets.length!==1){post('ordinary-notice',{message:'เลือกเป้าหมายที่สกิลนี้ใช้ได้'});return;}
   const id=selected??c.targets?.[0],ally=view.units.some(u=>u.id===id&&u.side==='ally');
   data={skill:c.id,target:ally?m.target:id??m.target,friend:ally?id:m.friend};
  }else if(m.command==='item'&&w.items?.some(x=>x.id===m.id))data={item:m.id,friend:m.friend};
  else if(m.command==='seal'&&w.seals?.some(x=>x.id===m.id)&&w.captureTargets?.includes(m.target))data={seal:m.id,target:m.target};
  else if(m.command==='swap'&&w.summons?.some(x=>String(x.uid)===m.id)){
   const pet=view.units.find(u=>u.kind==='pet'&&u.id===m.friend&&u.ownerCode===packet.code);
   data={swap:w.summons.find(x=>String(x.uid)===m.id).uid,friend:pet?.id};
  }else if(m.command==='flee'&&w.canEscape)data={escape:true};else return;
  locked={request:m.request,turn:w.turn,actor:w.actor};show(packet);
  emit('command',{...data,...locked});
 }
 return {show,message,setFloor(next){floor=next;},waitForRenderer(){watch(30000);},start(){frame.dataset.loadingOwner='field';frame.src='../../battle-ui-v1/test-effects.html?connected=ordinary&ui=colosseum-v3&entry=dungeon';},
  stop(){clearTimeout(timer);clearTimeout(ackTimer);},
  replied(request,ok){if(request===locked?.request&&!ok){locked=null;show(packet);post('ordinary-notice',{message:'คำสั่งยังไม่สำเร็จ กรุณาลองอีกครั้ง'});}}};
}
