// @soulbeast-unit 1099-characterMotion
// Visual state lives here, never on combat units or in the account/save model.
const CharacterMotion={
 actors:new Map(MOTION_ACTORS.map(a=>[a.id,a])),instances:new Map(),states:new Map(),timers:new Set(),flights:new Set(),observer:null,context:null,
 resolve(u){
  if(u.form)return MOTION_ACTORS.find(a=>a.kind==='transform'&&a.id===u.form);
  const cls=u.cls||(u.img?.startsWith('npc:')?u.img.slice(4):null);
  if(cls){const own=u.id==='P'||(u.kind==='player'&&u.owner!=null&&u.owner===compactRoom()?.me),gender=['male','female'].includes(u.gender)?u.gender:own&&['male','female'].includes(S.P?.gender)?S.P.gender:(FEMALE_CLASS_ART.has(cls)?'female':'male');return MOTION_ACTORS.find(a=>a.kind==='player'&&a.cls===cls&&a.gender===gender);}
  return MOTION_ACTORS.find(a=>!a.kind&&(a.species||a.id)===(u.sp||u.img)&&(a.form||0)===(u.evo||0));
 },
 attrs(a){const s=a.source,m=a.meleeSource;return `data-motion-actor="${a.id}" data-melee-mode="${a.meleeMode||'swipe'}" data-motion-melee-anchor-x="${m.x}" data-motion-melee-anchor-y="${m.y}" data-motion-anchor-x="${s.anchor.x}" data-motion-anchor-y="${s.anchor.y}" data-motion-anchor-pose="windup" data-art-fit="${a.artFit||'contain'}" data-motion-phase="idle" data-idle-mode="${a.idleMode}" data-power-projection="${s.projection||'side'}"`;},
 styles(a){const s=a.source,m=a.meleeSource;return `--um-melee-origin-x:${(m.effect?.x??50)/100};--um-melee-origin-y:${(m.effect?.y??50)/100};--um-melee-w:${m.width||130}%;--um-melee-h:${m.height||130}%;--um-melee:url('${a.assets.meleeEffect}');--um-power-origin-x:${(s.effectOriginX??50)/100};--um-power-origin-y:${(s.effectOriginY??50)/100};--um-power:url('${a.assets.power}');--um-scene:url('${a.scene}');--um-x:${s.x}%;--um-y:${s.y}%;--um-w:${s.width}%;--um-h:${s.height}%;--um-angle:${s.angle}deg;--um-power-duration:${a.powerDuration||.75}s;--um-windup-duration:${a.windupDuration||1}s;--um-texture-scale:${100/(1-(s.cropLeft||0)/100)}%;`;},
 layers(a){return '<span class="um-aura" aria-hidden="true"></span><span class="um-body"><span class="um-window">'+['idle','hit','windup','melee',...(a.assets.threat?['threat']:[])].map(p=>`<img class="um-art" data-pose="${p}" src="${a.assets[p]}" alt="" decoding="async">`).join('')+'</span><span class="um-power" aria-hidden="true"></span><span class="um-melee-effect" aria-hidden="true"></span></span>'+(a.identity.particles?'<span class="um-embers" aria-hidden="true">'+Array.from({length:8},(_,i)=>`<i style="--i:${i};--um-particle-color:${a.identity.colors[i%a.identity.colors.length]}"></i>`).join('')+'</span>':'');},
 decorate(html,u){
  const a=this.resolve(u);if(!a)return html;
  const art=/<img class="(?:atlas-face|legendary-beast-portrait)"[^>]*>|<span class="mist-beast-art"[^>]*><\/span>/;
  if(!art.test(html))return html;
  return html.replace(art,this.layers(a)).replace(/<button\b([^>]*)>/,(_,tag)=>'<button '+this.attrs(a)+' data-motion-unit="'+esc(u.id)+'" '+tag.replace('class="','class="motion-unit battle-motion ').replace(/style="/,'style="'+this.styles(a))+(tag.includes('style="')?'':' style="'+this.styles(a)+'"')+'>');
 },
 reduced(){return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;},
 schedule(fn,ms){const context=this.context,id=setTimeout(()=>{this.timers.delete(id);if(this.context===context)fn();},BattleSpeed.ms(ms));this.timers.add(id);return id;},
 reset(){for(const t of this.timers)clearTimeout(t);this.timers.clear();for(const f of [...this.flights])f();this.states.clear();},
 sync(){
  const b=BattleEffects.battle(),room=compactRoom(),context=b?(S.screen+':'+(room?.id||b.kind)+':'+(b.meta||'')):null;if(this.context!==context){this.reset();this.context=context;}
  const app=document.getElementById('app');if(!app?.querySelectorAll)return;
  for(const [node,inst]of this.instances)if(!node.isConnected){inst.destroy();this.instances.delete(node);}
  for(const node of app.querySelectorAll('.battle-motion'))if(!this.instances.has(node)){
   const inst=new window.SoulbeastUnitMotion(node);this.instances.set(node,inst);
   const st=this.states.get(node.dataset.motionUnit);if(st&&st.until>Date.now()){inst.set(st.phase);node.style.setProperty('--um-elapsed',-((Date.now()-st.start)*BattleSpeed.rate())+'ms');}
  }
 },
 phase(id,phase,duration){
  if(this.reduced())return;const st={phase,start:Date.now(),until:Date.now()+BattleSpeed.ms(duration)};this.states.set(String(id),st);
  for(const [node,inst]of this.instances)if(node.dataset.motionUnit===String(id)){node.style.setProperty('--um-elapsed','0ms');inst.set(phase);}
  this.schedule(()=>{if(this.states.get(String(id))!==st)return;this.states.delete(String(id));for(const [n,i]of this.instances)if(n.dataset.motionUnit===String(id)){n.style.setProperty('--um-elapsed','0ms');i.set('idle');}},duration);
 },
 mode(skill,u){const sk=SK[skill]||{};if(['buff','heal','rest','revert','form','summon','debuff','status'].includes(sk.t)||sk.summon)return 'support';if(skill==='attack')return 'melee';return BattleEffects.profile(skill,u).mode==='melee'?'melee':'ranged';},
 landed(e){return e.k==='hit'&&e.motionLanded!==false&&!e.miss&&!e.blocked&&!e.immune;},
 emission(from){const card=from?.node.closest?.('.battle-motion'),body=card?.querySelector('.um-body');if(!body)return from;const r=body.getBoundingClientRect(),css=getComputedStyle(card);return {...from,x:r.left+r.width*parseFloat(css.getPropertyValue('--um-x'))/100,y:r.top+r.height*parseFloat(css.getPropertyValue('--um-y'))/100};},
 contact(from,to){
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2,bx=b.left+b.width/2,by=b.top+b.height/2;
  const d=Math.hypot(bx-ax,by-ay)||1,space=Math.max(a.width,a.height)/2+Math.max(b.width,b.height)/2+3,travel=Math.max(0,d-space);
  return {x:(bx-ax)/d*travel,y:(by-ay)/d*travel,width:a.width,height:a.height,left:a.left,top:a.top};
 },
 melee(source,target){
  const from=BattleEffects.anchor(source),to=BattleEffects.anchor(target);if(!from||!to||source===target)return 0;
  const card=from.node.closest('.battle-motion');if(!card)return 0;
  const arena=card.closest('.battle-vitals,.online-combat-board')||card.parentElement,box=arena.getBoundingClientRect(),p=this.contact(from.node,to.node),copy=card.cloneNode(true);
  for(const n of [copy,...copy.querySelectorAll('*')])for(const key of ['id','data-u','data-a','data-v','data-motion-unit','tabindex'])n.removeAttribute(key);
  const face=copy.querySelector('.pt');if(!face)return 0;
  const shell=document.createElement('div');shell.className='motion-contact-layer';shell.setAttribute('aria-hidden','true');
  Object.assign(shell.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
  copy.className='motion-unit motion-flight';copy.replaceChildren(face);Object.assign(copy.style,{left:p.left-box.left+'px',top:p.top-box.top+'px',width:p.width+'px',height:p.height+'px'});shell.appendChild(copy);document.body.appendChild(shell);
  const inst=new window.SoulbeastUnitMotion(copy),previous=from.node.style.opacity;from.node.style.opacity='0';MotionTimeline.away.add(String(source));card.classList.add('motion-away');let anim,done=false;
  const clean=()=>{if(done)return;done=true;anim?.cancel();inst.destroy();shell.remove();if(from.node.isConnected)from.node.style.opacity=previous;this.flights.delete(clean);MotionTimeline.away.delete(String(source));for(const [n]of this.instances)if(n.dataset.motionUnit===String(source))n.classList.remove('motion-away');};this.flights.add(clean);
  inst.set('melee');inst.pause(true);
  anim=copy.animate?.([{transform:'translate(0,0)'},{transform:`translate(${p.x}px,${p.y}px)`}],{duration:300,easing:'linear',fill:'forwards'});
  this.schedule(()=>{inst.pause(false);inst.set('melee');},300);
  this.schedule(()=>{anim?.cancel();anim=copy.animate?.([{transform:`translate(${p.x}px,${p.y}px)`},{transform:'translate(0,0)'}],{duration:300,easing:'linear',fill:'forwards'});},1200);
  this.schedule(clean,1510);return 300;
 },
 flush(){
  this.sync();if(!VQ.length)return;const events=BattleEffects.enrich(VQ.splice(0).slice(-64)),L=document.getElementById('vfx');if(!L)return;
  if(this.reduced()){const e=events.find(e=>e.k==='cast');if(e)vSpawn(L,'vx-cast',null,e.c||'#d9b35b',e.n);return;}
  const groups=new Map();for(const e of events){const key=e.group+':'+(e.source||e.id);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
  let offset=0;for(const list of groups.values()){
   const cast=list.find(e=>e.k==='cast'||e.k==='charge'),first=list[0],source=cast?.id||first.source,skill=cast?.skill||first.skill||'attack',actor=BattleEffects.actor(source),a=this.resolve(actor),mode=this.mode(skill,actor);
   this.schedule(()=>{
    if(cast)vSpawn(L,'vx-cast',null,cast.c||'#d9b35b',cast.n||SK[skill]?.n);
    const targets=list.filter(e=>['hit','miss','heal','buff','debuff'].includes(e.k));let release=0,arrival=0;
    if(a&&mode==='support'){const threat=!!a.assets.threat;this.phase(source,threat?'threat':'windup',threat?1800:(a.windupDuration||1)*1000);release=200;}
    else if(a&&mode==='ranged'){release=(a.windupDuration||1)*1000;this.phase(source,'windup',release);this.schedule(()=>this.phase(source,'power',(a.powerDuration||.75)*1000),release);}
    else if(a&&mode==='melee'){const target=targets.find(e=>e.id!==source);arrival=target?this.melee(source,target.id):0;if(!arrival)this.phase(source,'melee',900);}
    const seen=new Map();for(const e of targets){const n=seen.get(e.id)||0;seen.set(e.id,n+1);
     this.schedule(()=>{
      const to=BattleEffects.anchor(e.id),from=BattleEffects.anchor(source),p=BattleEffects.profile(skill,actor);if(!to)return;
      let flight=0;if(mode==='ranged'&&from&&e.id!==source&&!n)flight=BattleEffects.travel(L,this.emission(from),to,p.mode==='melee'?{...p,mode:'projectile'}:p);
      this.schedule(()=>{const current=BattleEffects.anchor(e.id);if(!current)return;if(this.landed(e))this.phase(e.id,'hit',1500);if(e.k==='miss')BattleEffects.spawn(L,'target',current.x,current.y,{...p,color:'#9a97ab'});else BattleEffects.impact(L,e,current,p);},flight+n*65);
     },release+arrival);
    }
   },offset);offset+=180;
  }
 },
 start(){if(this.observer||typeof MutationObserver==='undefined')return;const app=document.getElementById('app');if(!app)return;this.observer=new MutationObserver(()=>this.sync());this.observer.observe(app,{childList:true,subtree:true});this.sync();}
};
const motionStatusCard=statusBattleCard;
statusBattleCard=function(html,u){return CharacterMotion.decorate(motionStatusCard(html,u),u);};
flushVfx=function(){CharacterMotion.start();CharacterMotion.flush();};
const motionRender=render;
render=function(...args){const result=motionRender(...args);CharacterMotion.start();return result;};
// Only annotate visual packets; fully absorbed hits must not play a hurt pose.
const motionHitOne=hitOne;
hitOne=function(u,sk,t,...args){const before=t.hp,start=VQ.length,result=motionHitOne(u,sk,t,...args);for(let i=start;i<VQ.length;i++)if(VQ[i].k==='hit'&&VQ[i].id===t.id)VQ[i].motionLanded=t.hp<before;return result;};
// Auras wrap the current item renderer, so all latest equipment artwork is retained.
const motionItemIcon=itemIcon;
itemIcon=function(id,size=44){const html=motionItemIcon(id,size),it=EQ[id];if(!html||!it?.slot||(!it.worldLegend&&!it.legend))return html;const eclipse=!!it.worldLegend;return html.replace('class="item-art ','class="item-art equipment-motion equipment-motion-'+(eclipse?'eclipse':'legendary')+' ').replace('</span>','<span class="equipment-aura" aria-hidden="true"></span>'+(eclipse?'<span class="equipment-motes" aria-hidden="true">'+Array.from({length:6},(_,i)=>'<i style="--mote:'+i+'"></i>').join('')+'</span>':'')+'</span>');};
// @soulbeast-end 1099-characterMotion
