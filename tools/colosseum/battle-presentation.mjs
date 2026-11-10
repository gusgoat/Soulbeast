import {battleEffects} from './battle-effects.generated.mjs?v=projectile-2';

const assets = new URL('../../assets/',import.meta.url).pathname;
// Reuse the sounds and painted projectiles from the game's PvP presentation.
const audioFiles={
 music:'ae90e5697f1bc67924075c93', charge:'8656c08c0c6d000fa76ebf35',
 melee:'3641c4e4dd26d6c72a93b678', bow:'6e5c59331550998865640e60', spell:'81dbfea983f07ed9d78a7cbb',
 heal:'ba0966b26d7a39b612d426f1', buff:'ef008aa2274f6ef5eea8a19d',
 fire:'2987725a76ac26d72cae8fe1', water:'1ddb745bb9bcf745daade49d', ice:'9eda521ae5a1036adfa74c99',
 electric:'ced8f5121a6dcfb9cda8797d', dark:'fc94ebb80b513a5d4f19b661', rock:'adcd8ecf4c7736c73fe79ddb',
};
const walkingFiles={
 walk:'audio/20261020/0ec63238028507b2de14e0af.mp3',
 stone:'audio/forest-journey/stone.mp3',leaves:'audio/forest-journey/leaves.mp3',
};
const audioUrl=key=>assets+(walkingFiles[key]||'media/'+audioFiles[key]+'.mp3');
const prefsKey='soulbeast-colosseum-battle-sound';

export function battlePresentation(layer){
 let active=false, playing=false, walking=false, surface=null;
 let enabled=localStorage.getItem(prefsKey)!=='off', context, gain;
 const clips=new Map(), timers=new Set(), loops=new Map();
 const poses=new Map(), preloaded=new Set(), flights=new Set(), heldHp=new Map();
 const music=new Audio(audioUrl('music'));
 music.loop=true;music.volume=.16;music.preload='none';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const effectsHost=document.createElement('div');
 effectsHost.style.cssText='position:absolute;inset:0;pointer-events:none';
 const shadow=effectsHost.attachShadow({mode:'open'});
 const stylesheet=document.createElement('link');
 stylesheet.rel='stylesheet';
 stylesheet.href=new URL('../../game-styles.afa6a43765a67ae5.css',import.meta.url).href;
 const effectLayer=document.createElement('div');
 effectLayer.id='vfx';
 effectLayer.style.position='absolute';
 shadow.append(stylesheet,effectLayer);
 layer.append(effectsHost);
 const effects=battleEffects(effectLayer,after);

 function clip(key){
  if(!clips.has(key)){
   clips.set(key,fetch(audioUrl(key)).then(response=>{
    if(!response.ok)throw Error('Battle audio unavailable');
    return response.arrayBuffer();
   }).then(bytes=>context.decodeAudioData(bytes)).catch(()=>null));
  }
  return clips.get(key);
 }
 function loop(key,shouldPlay,level){
  const prior=loops.get(key);
  if(!shouldPlay){loops.delete(key);prior?.source?.stop();return;}
  if(prior)return;
  const track={};
  loops.set(key,track);
  void clip(key).then(buffer=>{
   if(loops.get(key)!==track)return;
   if(!buffer){loops.delete(key);return;}
   const source=context.createBufferSource(),volume=context.createGain();
   volume.gain.value=level;source.buffer=buffer;source.loop=true;
   source.connect(volume);volume.connect(gain);
   source.onended=()=>{source.disconnect();volume.disconnect();};
   track.source=source;source.start();
  });
 }
 function syncMusic(){
  const audible=enabled&&!document.hidden&&context?.state==='running';
  if(active&&audible)music.play().catch(()=>{});
  else music.pause();
  const explore=audible&&walking&&!active;
  loop('walk',explore,.62);
  loop('stone',explore&&surface==='stone',.78);
  loop('leaves',explore&&surface==='leaves',.78);
 }
 function walk(value,steps=null){
  if(walking===value&&surface===steps)return;
  walking=value;surface=steps;syncMusic();
 }
 function unlock(){
  if(!enabled)return;
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  if(!context){
   context=new Context();
   gain=context.createGain();gain.gain.value=.38;gain.connect(context.destination);
   for(const key of ['melee','bow','spell','heal','buff','charge','walk','stone','leaves'])void clip(key);
  }
  if(context.state==='running')syncMusic();
  else context.resume().then(syncMusic).catch(()=>{});
 }
 function play(key){
  if(!active||!enabled||document.hidden||context?.state!=='running')return;
  const requestedAt=context.currentTime;
  void clip(key).then(buffer=>{
   if(!buffer||!active||!enabled||document.hidden||context.currentTime-requestedAt>.45)return;
   const source=context.createBufferSource();source.buffer=buffer;
   source.connect(gain);source.start();
  });
 }
 function after(callback,delay){
  const timer=setTimeout(()=>{timers.delete(timer);if(active)callback();},delay);
  timers.add(timer);
 }
 function setActive(value){
  if(active===value)return;
  active=value;
  if(!active){
   playing=false;timers.forEach(clearTimeout);timers.clear();poses.clear();flights.clear();heldHp.clear();effects.clear();
   for(const node of [...layer.children])if(node!==effectsHost)node.remove();
   syncPoses();
   music.currentTime=0;
  }
  syncMusic();
 }
 function toggle(){
  enabled=!enabled;localStorage.setItem(prefsKey,enabled?'on':'off');
  if(gain)gain.gain.value=enabled?.38:0;
  if(enabled)unlock();
  syncMusic();
 }
 function anchor(id){
  const card=Array.from(document.querySelectorAll('#battle [data-unit-id]')).find(node=>node.dataset.unitId===id);
  if(!card)return null;
  const portrait=card.querySelector('.battle-face');
  if(!portrait)return null;
  const face=portrait.getBoundingClientRect(),art=portrait.querySelector('img');
  const bounds=layer.getBoundingClientRect();
  const board=card.closest('.battle-stage').getBoundingClientRect();
  const [originX,originY]=art?.dataset.origin?.split(',').map(Number)||[];
  const ax=Number.isFinite(originX)?originX:50,ay=Number.isFinite(originY)?originY:50;
  const y=Math.max(board.top+8,Math.min(board.bottom-8,face.top+face.height/2));
  const sourceY=Math.max(board.top+8,Math.min(board.bottom-8,face.top+face.height*ay/100));
  return {x:face.left+face.width/2-bounds.left,y:y-bounds.top,width:face.width,height:face.height,portrait,card,art,
   node:portrait,size:Math.min(72,Math.max(28,Math.min(face.width,face.height))),
   board:{left:board.left-bounds.left,top:board.top-bounds.top,width:board.width,height:board.height},
   source:{x:face.left+face.width*ax/100-bounds.left,y:sourceY-bounds.top}};
 }
 function preload(url){
  if(!url||preloaded.has(url))return;
  preloaded.add(url);new Image().src=url;
 }
 function syncPoses(){
  for(const face of document.querySelectorAll('#battle .battle-face')){
   const id=face.closest('[data-unit-id]').dataset.unitId;
   face.toggleAttribute('data-away',flights.has(id));
   const art=face.querySelector('img[data-pvp-idle]');
   if(!art)continue;
   const phase=poses.get(id)?.phase||'idle';
   if(art.dataset[phase]&&art.dataset.pose!==phase){
    art.dataset.pose=phase;
    art.src=art.dataset[phase];
   }
   for(const key of ['melee','windup','power','hit','threat','meleeEffect'])preload(art.dataset[key]);
  }
 }
 function showPose(id,phase,duration){
  const state={phase};
  poses.set(id,state);syncPoses();
  after(()=>{
   if(poses.get(id)!==state)return;
   poses.delete(id);syncPoses();
  },duration);
 }
 function effectImage(file,position,className,duration=640){
  const img=document.createElement('img');img.alt='';img.src=file;
  img.className=className;img.style.left=position.x+'px';img.style.top=position.y+'px';
  layer.append(img);after(()=>img.remove(),duration);
  return img;
 }
 function impact(event,damage,profile,actor,meleeArt){
  const target=anchor(event.id);
  if(!target)return;
  const support=event.k==='heal'||event.k==='buff';
  const miss=event.k==='miss';
  if(event.k==='hit')showPose(event.id,'hit',380);
  effects.impact(profile,event,target,actor);
  if(event.k==='hit'&&profile.id==='attack'&&meleeArt)effectImage(meleeArt,target,'battle-fx-impact');
  if(event.k==='hit'&&!reduced.matches)target.card.animate(
   [{translate:'0px'},{translate:'4px'},{translate:'-3px'},{translate:'0px'}],{duration:220});
  if(!damage&&!miss)return;
  const label=document.createElement('span');
  label.className='battle-fx-number';label.dataset.tone=event.crit?'critical':support?'heal':miss?'miss':'hit';
  label.textContent=(event.crit?'คริติคอล ':'')+(damage?.t||(miss?'หลบได้':''));
  label.style.left=target.x+'px';label.style.top=target.y+'px';
  layer.append(label);after(()=>label.remove(),740);
 }
 // Match the PvP contact motion: move the portrait to the target's edge, strike, then retreat.
 function meleeFlight(actor,from,to){
  const art=from?.art;
  if(!art||!to||from.card===to.card||reduced.matches)return 0;
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
  const gap=(Math.min(from.width,from.height)+Math.min(to.width,to.height))/2;
  if(length<=gap)return 0;
  const x=dx*(1-gap/length),y=dy*(1-gap/length);
  const copy=art.cloneNode();
  copy.className='battle-fx-melee';copy.removeAttribute('data-pvp-idle');copy.setAttribute('aria-hidden','true');
  Object.assign(copy.style,{left:from.x+'px',top:from.y+'px',width:from.width+'px',height:from.height+'px'});
  if(art.dataset.melee){copy.src=art.dataset.idle;after(()=>{copy.src=art.dataset.melee;},300);}
  const pose=(x,y)=>`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
  flights.add(actor);syncPoses();layer.append(copy);
  copy.animate([{transform:pose(0,0)},{transform:pose(x,y),offset:300/680},
   {transform:pose(x,y),offset:390/680},{transform:pose(0,0)}],{duration:680,fill:'both'});
  after(()=>{copy.remove();flights.delete(actor);syncPoses();},680);
  return 300;
 }
 function holdHp(previous,next){
  if(!previous||!next?.last||previous.id!==next.id||previous.last?.n===next.last.n)return;
  const effects=new Set((next.effects||[]).filter(e=>['hit','heal'].includes(e.k)).map(e=>e.id));
  for(const entry of next.fx||[])if(/^[+−-]\d[\d,]*$/.test(entry.t))effects.add(entry.id);
  for(const u of [...previous.allies,...previous.enemies]){
   if(effects.has(u.id))heldHp.set(u.id,{value:u.hp,action:next.last.n});
  }
 }
 function action(last,actor,events,damage,finished,repaint,complete){
  playing=true;
  const finish=delay=>after(()=>{
   for(const [id,hold] of heldHp)if(hold.action===last.n)heldHp.delete(id);
   playing=false;complete();
  },delay);
  const origin=anchor(last.actor);
  const skillId=last.skillId||events.find(e=>e.k==='cast'||e.k==='charge')?.skill||
   events.find(e=>e.skill)?.skill||effects.skillByName(last.skill);
  const profile=effects.profile(skillId,actor);
  effects.prepareProjectile(profile);
  const motion=effects.motion(skillId,profile);
  if(events.some(event=>event.k==='charge')){
   showPose(last.actor,'windup',550);play('charge');
   effects.cast(profile,origin);
   finish(600);
   return;
  }
  const ranged=motion==='ranged'||motion==='blade',support=motion==='support';
  const hits=events.filter(event=>['hit','miss','heal','buff','debuff'].includes(event.k));
  const unmatched=damage.slice();
  const numberKind=entry=>/^[−-]\d/.test(entry.t)?'hit':/^\+\d[\d,]*$/.test(entry.t)?'heal':
   entry.c==='muted'?'miss':entry.t==='↓'?'debuff':'buff';
  const impacts=hits.map(event=>{
   const match=unmatched.findIndex(entry=>entry.id===event.id&&numberKind(entry)===event.k);
   return {...event,number:match<0?null:unmatched.splice(match,1)[0]};
  });
  for(const entry of unmatched){
   const k=numberKind(entry);
   if(k==='hit'||k==='heal')impacts.push({id:entry.id,k,number:entry,secondary:true});
  }
  const firstTarget=impacts.find(e=>e.id!==last.actor);
  const contact=motion==='melee'?meleeFlight(last.actor,origin,anchor(firstTarget?.id??last.target)):0;
  const data=origin?.art?.dataset;
  const windup=Math.round((Number(data?.windupDuration)||.36)*1000);
  const release=reduced.matches?0:motion==='blade'?300:ranged||support?windup:contact;
  if(!contact)showPose(last.actor,support&&data?.threat?'threat':motion==='ranged'||support?'windup':'melee',Math.max(release,350));
  effects.cast(profile,origin);
  after(()=>{
   if(motion==='ranged'&&data?.power&&origin)
    effectImage(data.power,origin.source,'battle-fx-impact battle-fx-release',380);
   const sound=motion==='blade'||motion==='melee'?'melee':support?(last.kind==='heal'?'heal':'buff'):
    last.kind==='bow'?'bow':audioFiles[last.element]?last.element:'spell';
   play(sound);
   const arrivals=new Map();
   let end=0;
   for(const event of impacts){
    const previous=arrivals.get(event.id);
    const from=anchor(last.actor),to=anchor(event.id);
    const travel=previous===undefined&&!event.secondary&&!reduced.matches&&motion!=='melee'&&from&&to&&last.actor!==event.id;
    const delay=previous!==undefined?previous+65:travel?effects.travel(profile,{...from,...from.source},to,last.actor,event.id):0;
    arrivals.set(event.id,delay);
    end=Math.max(end,delay);
    after(()=>{
     if(heldHp.get(event.id)?.action===last.n){heldHp.delete(event.id);repaint();}
     impact(event,event.number,profile,actor,data?.meleeEffect);
    },delay);
   }
   finish(end+(finished?940:300));
  },release);
 }
 addEventListener('pointerdown',unlock,{passive:true});
 addEventListener('keydown',unlock);
 document.addEventListener('visibilitychange',syncMusic);
 return {action,setActive,syncPoses,toggle,walk,holdHp,hp:unit=>heldHp.get(unit.id)?.value??unit.hp,
  get busy(){return playing;},get enabled(){return enabled;}};
}
