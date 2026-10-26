// @soulbeast-unit 1102-motionTimeline
// Presentation queue. Authoritative HP, damage, RNG and saves are never delayed or changed.
const MotionTimeline={
 until:0,depth:0,previous:new Map(),held:new Map(),away:new Set(),sounding:false,
 active(){return typeof document!=='undefined'&&!!document.querySelector?.('.battle-motion');},
 busy(){return this.active()&&(Date.now()<this.until||VQ.length>0);},
 snapshot(b=BattleEffects.battle()){return new Map([...(b?.allies||[]),...(b?.enemies||[])].map(u=>[String(u.id),{hp:u.hp,mp:u.mp}]));},
 hold(before,b=BattleEffects.battle()){for(const u of [...(b?.allies||[]),...(b?.enemies||[])]){const p=before.get(String(u.id));if(p&&(p.hp!==u.hp||p.mp!==u.mp)&&!this.held.has(String(u.id)))this.held.set(String(u.id),p);}},
 shown(html,u){html=html.replace(/<span class="fx [^"]*">[+-][\d,]+(?: MP)?<\/span>/g,'');const p=this.held.get(String(u.id));if(!p)return html;html=html.replace(bar(u.hp,u.st.hp),bar(p.hp,u.st.hp)).replace(bar(u.mp,u.st.mp,'mp'),bar(p.mp,u.st.mp,'mp'));
  for(const format of [String,fmt]){html=html.replace('HP '+format(u.hp)+'/','HP '+format(p.hp)+'/').replace('MP '+format(u.mp)+'/','MP '+format(p.mp)+'/');}
  if(p.hp>0)html=html.replace('down ','');return html.replace(/<span class="fx [^"]*">[\s\S]*?<\/span>/g,'');
 },
 arrive(id){const p=this.held.get(String(id)),u=BattleEffects.actor(id);this.held.delete(String(id));if(p&&u?.st){render();const a=BattleEffects.anchor(id),delta=u.hp-p.hp;if(a&&delta){const n=document.createElement('span');n.className='motion-damage-number';n.textContent=(delta>0?'+':'')+fmt(delta);n.style.cssText='left:'+a.x+'px;top:'+a.y+'px;color:'+(delta>0?'#9ff0b2':'#ffb0a0');document.getElementById('vfx')?.appendChild(n);CharacterMotion.schedule(()=>n.remove(),1200);}}},
 sound(skill,actor,critical=false){this.sounding=true;try{if(critical)timelineExtraSkill.call(ExtraAudio,skill,actor,true);else timelineSkill.call(Sound,skill,actor);}finally{this.sounding=false;}},
 flush(){
  CharacterMotion.sync();if(!VQ.length)return;const events=BattleEffects.enrich(VQ.splice(0).slice(-64)),L=document.getElementById('vfx');if(!L)return;
  if(CharacterMotion.reduced()){this.held.clear();this.until=0;render();return;}
  const groups=new Map();for(const e of events){const key=e.group+':'+(e.source||e.id);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
  let offset=Math.max(0,this.until-Date.now())*BattleSpeed.rate();
  for(const list of groups.values()){
   const cast=list.find(e=>e.k==='cast'||e.k==='charge'),first=list[0],source=cast?.id||first.source,skill=cast?.skill||first.skill||'attack',actor=BattleEffects.actor(source),a=CharacterMotion.resolve(actor),mode=CharacterMotion.mode(skill,actor),targets=list.filter(e=>['hit','miss','heal','buff','debuff'].includes(e.k));
   const windup=a?(mode==='ranged'?(a.windupDuration||1)*1000:mode==='support'?(a.assets.threat?1800:(a.windupDuration||1)*1000):0):0;
   // Reserve through projectile arrival, all multi-hit impacts and the target's recovery pose.
   const span=mode==='melee'?2400:windup+2600+targets.length*65;
   CharacterMotion.schedule(()=>{
    if(cast)vSpawn(L,'vx-cast',null,cast.c||'#d9b35b',cast.n||SK[skill]?.n);
    if(a&&mode==='support')CharacterMotion.phase(source,a.assets.threat?'threat':'windup',windup);
    if(a&&mode==='ranged')CharacterMotion.phase(source,'windup',windup);
    let contact=0;if(mode==='melee'){const t=targets.find(e=>e.id!==source);contact=t?CharacterMotion.melee(source,t.id):0;if(!contact)CharacterMotion.phase(source,'melee',900);}
    CharacterMotion.schedule(()=>{
     this.sound(skill,actor,list.some(e=>e.crit));
     if(a&&mode==='ranged')CharacterMotion.phase(source,'power',(a.powerDuration||.75)*1000);
     const seen=new Map(),arrivals=new Map();
     for(const e of targets){const n=seen.get(e.id)||0;seen.set(e.id,n+1);const from=BattleEffects.anchor(source),to=BattleEffects.anchor(e.id),p=BattleEffects.profile(skill,actor);if(!to)continue;
      if(!arrivals.has(e.id)){let delay=mode==='melee'?contact:0;if(mode!=='melee'&&from&&e.id!==source)delay=BattleEffects.travel(L,CharacterMotion.emission(from),to,{...p,mode:p.mode==='beam'?'beam':'projectile'});arrivals.set(e.id,delay);}
      CharacterMotion.schedule(()=>{this.arrive(e.id);const current=BattleEffects.anchor(e.id);if(!current)return;if(CharacterMotion.landed(e))CharacterMotion.phase(e.id,'hit',1500);if(e.k==='miss')BattleEffects.spawn(L,'target',current.x,current.y,{...p,color:'#9a97ab'});else BattleEffects.impact(L,e,current,p);},arrivals.get(e.id)+n*65);
     }
     // MP cost and self buffs appear at release, not during windup.
     if(!targets.some(e=>e.id===source))this.arrive(source);
    },windup);
   },offset);
   offset+=span;
  }
  this.until=Date.now()+BattleSpeed.ms(offset);
  CharacterMotion.schedule(()=>{if(Date.now()+20<this.until)return;this.held.clear();this.until=0;render();},offset);
 }
};
const timelineSkill=Sound.skill,timelineExtraSkill=ExtraAudio.skill;
Sound.skill=function(...args){if(!MotionTimeline.sounding&&MotionTimeline.active()&&(MotionTimeline.depth||VQ.length))return;return timelineSkill.apply(this,args);};
ExtraAudio.skill=function(...args){if(!MotionTimeline.sounding&&MotionTimeline.active()&&(MotionTimeline.depth||VQ.length))return true;return timelineExtraSkill.apply(this,args);};
const timelineAct=act;
act=function(...args){const live=MotionTimeline.active(),before=live?MotionTimeline.snapshot():null;MotionTimeline.depth++;try{return timelineAct(...args);}finally{MotionTimeline.depth--;if(live)MotionTimeline.hold(before);}};
const timelineCard=statusBattleCard;
statusBattleCard=function(html,u){return timelineCard(MotionTimeline.shown(html,u),u);};
const timelineLater=battleLater;
battleLater=function(fn,ms){return timelineLater(function wait(){if(MotionTimeline.busy()){timelineLater(wait,50);return;}fn();},ms);};
const timelineEnd=checkEnd;
checkEnd=function(...args){if(MotionTimeline.busy())return false;return timelineEnd(...args);};
const timelineReset=CharacterMotion.reset;
CharacterMotion.reset=function(){timelineReset.call(this);MotionTimeline.until=0;MotionTimeline.held.clear();MotionTimeline.away.clear();};
const timelineSync=CharacterMotion.sync;
CharacterMotion.sync=function(){timelineSync.call(this);for(const [n]of this.instances)n.classList.toggle('motion-away',MotionTimeline.away.has(n.dataset.motionUnit));};
CharacterMotion.flush=function(){MotionTimeline.flush();};

const timelineRender=render;
render=function(...args){const r=compactRoom(),key=r?S.screen+':'+r.id:null;if(key&&MotionTimeline.roomKey===key)MotionTimeline.hold(MotionTimeline.previous,r.battle);MotionTimeline.roomKey=key;MotionTimeline.previous=MotionTimeline.snapshot(r?.battle);return timelineRender(...args);};
const timelineReceive=pvpReceive;
pvpReceive=function(result){if(MotionTimeline.busy()){CharacterMotion.schedule(()=>pvpReceive(result),80);return;}if(PVP.room?.id===result.room?.id&&PVP.room.rev>result.room.rev)return;return timelineReceive(result);};
if(typeof document.addEventListener==='function')document.addEventListener('click',e=>{const button=e.target.closest?.('[data-a]');if(!button||!MotionTimeline.busy())return;const a=button.dataset.a,v=button.dataset.v||'';if(a==='pvpMove'||a==='campMove'||a==='wbMove'||a==='bt'&&!/^(target|ally|menu):/.test(v)){e.preventDefault();e.stopImmediatePropagation();}},true);
// @soulbeast-end 1102-motionTimeline
