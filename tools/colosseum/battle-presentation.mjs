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
const projectiles={
 fire:'v4/fire-high',water:'v4/water-high',electric:'v4/electric-high',ground:'v4/earth-high',rock:'v4/earth-high',
 flying:'v4/wind-high',grass:'v2/nature',ice:'v5/ice-high',fairy:'v5/holy-high',ghost:'v5/ghost-high',
 dark:'v5/dark-high',poison:'v5/poison-high',psychic:'v5/psychic-high',dragon:'v5/dragon-high',
};
const sprite=file=>assets+'vfx/projectiles/'+file+'.png.webp';
const prefsKey='soulbeast-colosseum-battle-sound';

export function battlePresentation(layer){
 let active=false, playing=false, walking=false, surface=null;
 let enabled=localStorage.getItem(prefsKey)!=='off', context, gain;
 const clips=new Map(), timers=new Set(), loops=new Map();
 const poses=new Map(), preloaded=new Set(), flights=new Set(), heldHp=new Map();
 const music=new Audio(audioUrl('music'));
 music.loop=true;music.volume=.16;music.preload='none';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');

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
   playing=false;timers.forEach(clearTimeout);timers.clear();poses.clear();flights.clear();heldHp.clear();layer.replaceChildren();syncPoses();
   music.currentTime=0;
  }else for(const file of [...Object.values(projectiles),'v2/holy','v2/beam','v3/impact','v3/melee','v3/music','v3/shuriken','v3/crescent'])
   preload(sprite(file));
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
  const face=portrait.getBoundingClientRect(),art=portrait.querySelector('img');
  const bounds=layer.getBoundingClientRect();
  const board=card.closest('.battle-stage').getBoundingClientRect();
  const [ax,ay]=art?.dataset.origin?.split(',').map(Number)||[50,50];
  const y=Math.max(board.top+8,Math.min(board.bottom-8,face.top+face.height/2));
  const sourceY=Math.max(board.top+8,Math.min(board.bottom-8,face.top+face.height*ay/100));
  return {x:face.left+face.width/2-bounds.left,y:y-bounds.top,width:face.width,height:face.height,portrait,card,art,
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
 function impact(event,damage,element,kind,meleeArt){
  const target=anchor(event.id);
  if(!target)return;
  const support=event.k==='heal'||event.k==='buff',debuff=event.k==='debuff';
  const miss=event.k==='miss';
  if(event.k==='hit')showPose(event.id,'hit',380);
  if(!miss)effectImage(kind==='melee'&&!support&&!debuff&&meleeArt?meleeArt:
   sprite(support?'v2/holy':debuff?projectiles[element]||'v2/dark':kind==='melee'?'v3/melee':projectiles[element]||'v3/impact'),target,'battle-fx-impact');
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
 function launch(last,from,to,element){
  if(!from||!to||from.card===to.card||reduced.matches)return 0;
  const start=from.source;
  const dx=to.x-start.x,dy=to.y-start.y,length=Math.hypot(dx,dy);
  const angle=Math.atan2(dy,dx)*180/Math.PI;
  const beam=last.flight==='beam',travel=beam?340:300;
  const file=last.kind==='blade'?'v3/crescent':last.flight==='music'?'v3/music':last.flight==='shuriken'?'v3/shuriken':
   projectiles[element]||(last.kind==='bow'?'v3/crescent':'v2/beam');
  const shot=effectImage(sprite(file),start,beam?'battle-fx-shot battle-fx-beam':'battle-fx-shot',beam?travel+110:travel);
  if(beam){
   shot.style.width=length+'px';
   const transform=`translateY(-50%) rotate(${angle}deg)`;
   shot.animate([{transform,clipPath:'inset(0 100% 0 0)'},{transform,clipPath:'inset(0)',offset:travel/(travel+110)},
    {transform,clipPath:'inset(0)',opacity:0}],{duration:travel+110,fill:'both'});
  }else{
   shot.animate([{transform:`translate(-50%,-50%) rotate(${angle}deg) scale(.65)`},
    {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${angle}deg)`}],
    {duration:travel,fill:'both',easing:'linear'});
  }
  return travel;
 }
 function holdHp(previous,next){
  if(!previous||!next?.last||previous.id!==next.id||previous.last?.n===next.last.n)return;
  const effects=new Set((next.effects||[]).filter(e=>['hit','heal'].includes(e.k)).map(e=>e.id));
  for(const entry of next.fx||[])if(/^[+−-]\d[\d,]*$/.test(entry.t))effects.add(entry.id);
  for(const u of [...previous.allies,...previous.enemies]){
   if(effects.has(u.id))heldHp.set(u.id,{value:u.hp,action:next.last.n});
  }
 }
 function action(last,events,damage,finished,repaint,complete){
  playing=true;
  const finish=delay=>after(()=>{
   for(const [id,hold] of heldHp)if(hold.action===last.n)heldHp.delete(id);
   playing=false;complete();
  },delay);
  const origin=anchor(last.actor);
  if(events.some(event=>event.k==='charge')){
   showPose(last.actor,'windup',550);play('charge');
   if(origin)effectImage(sprite('v2/holy'),origin,'battle-fx-impact');
   finish(600);
   return;
  }
  const {actor,kind}=last, ranged=kind==='bow'||kind==='spell'||kind==='blade';
  const support=kind==='heal'||kind==='buff';
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
  const firstTarget=impacts.find(e=>e.id!==actor);
  const contact=kind==='melee'?meleeFlight(actor,origin,anchor(firstTarget?.id??last.target)):0;
  const data=origin?.art?.dataset;
  const release=kind==='blade'?260:ranged||support?Math.round(240*(Number(data?.windupDuration)||1)):contact;
  if(!contact)showPose(actor,support&&data?.threat?'threat':ranged&&kind!=='blade'||support?'windup':'melee',Math.max(release+120,350));
  after(()=>{
   if((kind==='bow'||kind==='spell')&&data?.power&&origin)
    effectImage(data.power,origin.source,'battle-fx-impact battle-fx-release',380);
   for(const event of events.filter(event=>event.k==='flash')){
    const bounds=layer.getBoundingClientRect();
    effectImage(sprite(projectiles[event.el]||'v3/impact'),{x:bounds.width/2,y:bounds.height/2},'battle-fx-impact battle-fx-flash');
   }
   play(kind==='blade'?'melee':ranged&&audioFiles[last.element]?last.element:kind);
   const arrivals=new Map();
   let end=0;
   for(const event of impacts){
    const element=event.el||last.element;
    const previous=arrivals.get(event.id);
    const delay=previous===undefined?(ranged&&!event.secondary?launch(last,anchor(actor),anchor(event.id),element):0):Math.min(previous+65,720);
    arrivals.set(event.id,delay);
    end=Math.max(end,delay);
    after(()=>{
     if(heldHp.get(event.id)?.action===last.n){heldHp.delete(event.id);repaint();}
     impact(event,event.number,element,kind,data?.meleeEffect);
    },delay);
   }
   finish(end+(finished?740:240));
  },release);
 }
 addEventListener('pointerdown',unlock,{passive:true});
 addEventListener('keydown',unlock);
 document.addEventListener('visibilitychange',syncMusic);
 return {action,setActive,syncPoses,toggle,walk,holdHp,hp:unit=>heldHp.get(unit.id)?.value??unit.hp,
  get busy(){return playing;},get enabled(){return enabled;}};
}
