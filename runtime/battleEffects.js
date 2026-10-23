// Presentation choreography only: deterministic, no combat state, RNG or turn delays.
// @soulbeast-unit 1094-battleEffects
const BattleEffects={
 epoch:0,live:new Set(),timers:new Set(),observer:null,
 legends:{
  primordial_ouroboros:['ouroboros','eclipse','orbit'],dawn_valkyrie:['valkyrie','wing','halo'],astral_dragon:['astral-dragon','wing','comet'],cosmic_tortoise:['cosmic-bastion','shield','seal'],solar_sovereign:['solar-crown','eclipse','flame'],infinite_sea_serpent:['sea-serpent','wave','vine'],void_phoenix:['void-phoenix','wing','soul'],eclipse_wolf:['eclipse-wolf','fang','eclipse'],
  legend2_aegis_dragon:['aegis-dragon','shield','wing'],legend2_tricephalos:['three-headed','fang','flame'],legend2_aurorion:['aurora-dragon','wing','bolt'],legend2_abyssarch:['abyss-sovereign','chain','eclipse'],legend2_selestia:['eclipse-goddess','wing','halo'],legend2_aerelion:['elven-archmage','seal','orbit'],legend2_myriapod:['world-centipede','fang','vine'],legend2_yggwarden:['world-tree','vine','halo']
 },
 profile(id,actor={}){
  const sk=SK[id]||{},look=skillLook(id),palette=spellLook(id),seed=Array.from(id||'attack').reduce((v,c)=>(v*31+c.charCodeAt(0))%65521,0);
  const support=['buff','heal','rest','revert','form','summon'].includes(sk.t)||sk.summon;
  let family=/^(?:ar_|ra_|sn_|wd_|ws_bow|ms_archer|bow_)/.test(id)?'arrow':/^(?:gn_|mk_|gs_|bh_|mc_cannon|cn_|dm_|ws_gun|ms_gunner|gun_)/.test(id)?'bullet':/shuriken/.test(id)?'shuriken':/^(?:at_|al_acid|me_potion|me_coinbomb|ms_merchant50)/.test(id)?'flask':null;
  if(id==='attack'&&actor.cls&&CLS[actor.cls])family={archer:'arrow',gunner:'bullet'}[baseOf(actor.cls)]||family;
  let mode=support?'support':family?'projectile':['p','h'].includes(sk.t)?'melee':['m','status','debuff'].includes(sk.t)?'projectile':'support';
  if(id==='attack')mode=actor.atkType==='m'||['archer','gunner'].includes(actor.cls&&CLS[actor.cls]?baseOf(actor.cls):'')?'projectile':'melee';
  if(/breath|beam|lance|ne_soul|wk_curse|sm_bind|en_mind|ga_transmute|steel_m2|normal_m2|grass_m2|fire_m2|dragon_m2/.test(id)&&!support)mode='beam';
  if(/(?:quake|meteor|blizzard|firestorm|thunderstorm|tempest|f_roots|dr_thorn|gv_storm|_aoe)$/.test(id)&&!['p','h'].includes(sk.t))mode='field';
  let theme=SIGNATURE_THEME_BY_ID[id]||({arrow:'volley',bullet:'volley',shadow:'slash',blade:'slash',claw:'fang',shield:'ward',roots:'vines',music:'music',coins:'coin'}[look[0]])||({water:'tide',ice:'meteor',electric:'thunder',fire:'blast',grass:'vines',ground:'meteor',rock:'meteor',dragon:'nova',ghost:'curse',dark:'eclipse',fairy:'heal',poison:'venom'}[sk.el])||'nova';
  if(sk.t==='heal'||sk.t==='rest')theme=sk.rev||sk.revAll?'phoenix':'heal';
  else if(sk.t==='form'||sk.t==='revert')theme='transform';
  else if(sk.summon||sk.t==='summon')theme='summon';
  else if(sk.taunt)theme='fury';
  else if(sk.enchant)theme='slash';
  else if(id==='class10_parry'||sk.immune)theme='ward';
  else if(support&&!['music','coin','vines'].includes(theme))theme='ward';
  if(id==='normal_m1')theme='music';
  const species=Object.keys(this.legends).find(k=>id==='mist_sig_'+k||id.startsWith(k+'_s'))||actor.sp,legend=this.legends[species];
  return {id,mode,theme,projectile:family||({fire:'flame',ice:'ice',water:'wave',electric:'bolt',grass:'leaf',rock:'rock',ground:'rock',ghost:'soul',dark:'soul',poison:'venom'}[sk.el])||'orb',color:palette[2],accent:palette[3],seed,variant:seed%7,hits:Math.min(5,Math.max(1,sk.hits||1)),area:!!sk.all,signature:!!SIGNATURE_ART[id]||!!legend,legend:legend?{id:legend[0],shapes:legend.slice(1),species}:null};
 },
 // Old online/replay packets carry cast origins; new local packets carry exact source IDs.
 enrich(events,fallback){
  let source=fallback,skill=null,lastHit=null,group=0;
  return events.map(raw=>{const e={...raw};if(e.k==='cast'||e.k==='charge'){source=e.source||e.id;skill=e.skill||skill;group++;}
   if(!e.source&&['hit','miss','heal','buff','debuff'].includes(e.k)){
    if(e.skill==='attack'&&lastHit?.source===e.id)e.source=lastHit.id;
    else e.source=source;
   }
   if(!e.skill&&['hit','miss','heal','buff','debuff','charge'].includes(e.k))e.skill=skill||'attack';
   if(e.k==='hit'&&lastHit?.group===group&&lastHit.source!==e.source)group++;
   e.group=group;if(e.k==='hit')lastHit=e;return e;
  });
 },
 battle(){return compactRoom()?.battle||S.battle;},
 actor(id){const b=this.battle();return b&&[...(b.allies||[]),...(b.enemies||[])].find(u=>u.id===id)||{};},
 anchor(id){
  if(id==null)return null;
  const app=document.getElementById('app'),safe=String(id).replace(/[^\w-]/g,''),card=app?.querySelector('[data-u="'+safe+'"]');
  const face=card?.matches?.('.pt')?card:card?.querySelector('.pt')||card?.querySelector('.battle-face')||card;
  const r=face?.getBoundingClientRect();if(!r||r.width<=0||r.height<=0)return null;
  return {node:face,x:r.left+r.width/2,y:r.top+r.height/2,size:Math.min(72,Math.max(28,Math.min(r.width,r.height)))};
 },
 later(fn,ms,epoch=this.epoch){const id=setTimeout(()=>{this.timers.delete(id);if(epoch===this.epoch)fn();},ms);this.timers.add(id);return id;},
 clear(){this.epoch++;for(const t of this.timers)clearTimeout(t);this.timers.clear();for(const f of [...this.live])f();this.live.clear();document.getElementById('vfx')?.querySelectorAll('.battle-fx-owned').forEach(n=>n.remove());},
 watch(){if(this.observer||typeof MutationObserver==='undefined')return;this.observer=new MutationObserver(()=>{if(this.screen!==S.screen){this.clear();return;}for(const f of [...this.live])if(f.stale?.())f();});this.observer.observe(document.getElementById('app'),{childList:true,subtree:true});},
 spawn(L,shape,x,y,p,vars={}){const n=vSpawn(L,'battle-fx-owned sig-fx sig-'+shape,[x,y],p.color,null,{'--a':p.accent,'--size':Math.min(window.innerWidth<620?112:170,92+(p.signature?35:0))+'px','--theta':p.seed%180+'deg','--dx':'0px','--dy':'-25px','--duration':'720ms','--life-ms':820,'--wait':'0ms',...vars});if(n){n.dataset.skill=p.id;n.dataset.theme=p.theme;n.setAttribute('aria-hidden','true');}return n;},
 travel(L,from,to,p,melee=false){
  if(!from||!to)return 0;if(Math.hypot(to.x-from.x,to.y-from.y)<4)return 0;
  const dx=to.x-from.x,dy=to.y-from.y,duration=melee?680:p.mode==='beam'?350:400;
  const node=document.createElement('div');node.className='vx battle-fx-owned '+(melee?'battle-portrait-flight':p.mode==='beam'?'battle-skill-beam':'battle-projectile projectile-'+p.projectile);node.dataset.skill=p.id;node.dataset.source=this.currentSource||'';node.dataset.target=this.currentTarget||'';node.setAttribute('aria-hidden','true');
  Object.assign(node.style,{left:from.x+'px',top:from.y+'px'});node.style.setProperty('--c',p.color);node.style.setProperty('--a',p.accent);node.style.setProperty('--angle',Math.atan2(dy,dx)*180/Math.PI+'deg');node.style.setProperty('--distance',Math.hypot(dx,dy)+'px');
  const previous=from.node.style.opacity;
  if(melee){node.style.width=from.size+'px';node.style.height=from.size+'px';const copy=from.node.cloneNode(true);for(const el of [copy,...copy.querySelectorAll('*')]){el.removeAttribute('id');el.removeAttribute('data-u');el.removeAttribute('data-a');el.removeAttribute('data-v');el.removeAttribute('tabindex');}node.appendChild(copy);from.node.style.opacity='.15';}
  L.appendChild(node);const screen=S.screen;let done=false,animation;
  const cleanup=()=>{if(done)return;done=true;animation?.cancel();if(melee)from.node.style.opacity=previous;node.remove();this.live.delete(cleanup);};cleanup.stale=()=>S.screen!==screen||!from.node.isConnected||!to.node.isConnected;this.live.add(cleanup);
  const transform=(x,y,scale=1)=>'translate(calc(-50% + '+x+'px),calc(-50% + '+y+'px)) scale('+scale+')';
  const frames=melee?[{transform:transform(0,0),opacity:1,offset:0},{transform:transform(-dx*.06,-dy*.06,1.08),offset:.13},{transform:transform(dx,dy,1.14),offset:.48},{transform:transform(dx,dy,1.08),offset:.58},{transform:transform(0,0),opacity:1,offset:1}]:p.mode==='beam'?[{opacity:0,transform:'translateY(-50%) rotate(var(--angle)) scaleX(0)'},{opacity:1,transform:'translateY(-50%) rotate(var(--angle)) scaleX(1)',offset:.35},{opacity:0,transform:'translateY(-50%) rotate(var(--angle)) scaleX(1)'}]:[{transform:transform(0,0)+' rotate(var(--angle))',opacity:0},{opacity:1,offset:.12},{transform:transform(dx,dy)+' rotate(var(--angle))',opacity:1,offset:.92},{transform:transform(dx,dy)+' rotate(var(--angle))',opacity:0}];
  if(node.animate){animation=node.animate(frames,{duration,easing:melee?'cubic-bezier(.3,0,.3,1)':'linear',fill:'both'});animation.onfinish=cleanup;}
  else{node.style.transform=transform(dx,dy);}
  this.later(cleanup,duration+100);return melee?Math.round(duration*.48):p.mode==='beam'?110:Math.round(duration*.92);
 },
 impact(L,e,to,p){
  if(e.k==='heal')p={...p,color:'#a8f4bc',accent:'#fff5c7'};
  const x=to.x,y=to.y,theme=e.k==='heal'?(SK[p.id]?.rev||SK[p.id]?.revAll?'phoenix':'heal'):e.k==='buff'&&!['buff','heal','form','summon','rest','revert'].includes(SK[p.id]?.t)?'ward':p.theme;
  if(!p.legend&&!['attack','rest'].includes(p.id))spellBurst(L,e,x,y);
  const main={slash:'cut',volley:'target',fang:'fang',ward:'shield',heal:'halo',phoenix:'wing',vines:'vine',thunder:'bolt',tide:'wave',meteor:'comet',curse:'eye',eclipse:'eclipse',music:'note',coin:'coin',fury:'shock',venom:'soul',transform:'wing',blast:'flame',nova:'seal'}[theme]||'seal';
  this.spawn(L,main,x,y,p);this.spawn(L,'shock',x,y,p,{'--size':p.signature?'125px':'75px','--wait':'60ms'});
  const count=window.innerWidth<620?3:5;for(let i=0;i<count;i++){const a=(p.seed%360+i*360/count)*Math.PI/180;this.spawn(L,main,x+Math.cos(a)*18,y+Math.sin(a)*18,p,{'--size':(p.signature?58:38)+'px','--wait':i*55+'ms','--theta':i*72+p.seed%60+'deg','--dx':Math.cos(a)*55+'px','--dy':Math.sin(a)*40+'px'});}
  if(p.legend){for(const [i,shape]of p.legend.shapes.entries())this.spawn(L,shape,x+(i?20:-20),y,p,{'--size':'145px','--wait':i*120+'ms'});if(p.legend.id==='three-headed')for(let i=0;i<3;i++)this.spawn(L,'fang',x+(i-1)*35,y-22,{...p,color:['#ff9867','#98eaff','#ffe18a'][i]},{'--wait':i*100+'ms'});}
  if(theme==='summon'||theme==='transform'){this.spawn(L,'orbit',x,y,p,{'--size':'130px'});this.spawn(L,'wing',x,y,p,{'--size':'120px'});}
  if(p.signature){const emblem=vSpawn(L,'battle-fx-owned battle-skill-emblem',[x,y-20],p.color,null,{'--life-ms':850});if(emblem){emblem.innerHTML=skillPicture(this.actor(e.source),SK[p.id]||{},p.id);emblem.setAttribute('aria-hidden','true');emblem.dataset.signature=p.legend?.id||p.id;}}
 },
 flush(){
  if(!VQ.length)return;const events=this.enrich(VQ.splice(0).slice(-64)),L=document.getElementById('vfx');if(!L)return;
  this.clear();this.screen=S.screen;this.watch();const epoch=this.epoch,screen=S.screen,reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduced){const e=events.find(e=>e.k==='cast');if(e)vSpawn(L,'vx-cast',null,e.c||'#d9b35b',e.n);return;}
  const seen=new Map(),moved=new Set();let time=0,lastGroup=-1;
  for(const e of events){
   if(e.group!==lastGroup){if(lastGroup>=0)time+=740;lastGroup=e.group;}
   const at=time;this.later(()=>{
    if(S.screen!==screen)return;const to=this.anchor(e.id),from=this.anchor(e.source),p=this.profile(e.skill||'attack',this.actor(e.source||e.id));if(!to)return;
    if(e.k==='cast'||e.k==='charge'){vSpawn(L,'vx-cast',null,p.color,e.n||SK[e.skill]?.n);spellBurst(L,{...e,k:'cast'},to.x,to.y);this.spawn(L,'seal',to.x,to.y,p,{'--size':'62px'});if(['support','field'].includes(p.mode))this.impact(L,e,to,p);return;}
    if(!['hit','miss','heal','buff','debuff'].includes(e.k))return;
    const key=e.group+':'+e.source+':'+e.id+':'+e.skill,index=seen.get(key)||0,repeat=index>0;seen.set(key,index+1);
    this.currentSource=e.source;this.currentTarget=e.id;let arrival=0;
    if(!repeat&&from&&e.source!==e.id){if(p.mode==='melee'){const move=e.group+':'+e.source;if(!moved.has(move)){moved.add(move);arrival=this.travel(L,from,to,p,true);}}else if(['projectile','beam'].includes(p.mode))arrival=this.travel(L,from,to,p);else if(e.k==='heal'||e.k==='buff')arrival=this.travel(L,from,to,{...p,mode:'projectile',projectile:'orb'});}
    if(!repeat&&p.mode==='melee'&&from&&e.source!==e.id&&!arrival)arrival=330;
    if(repeat)arrival=380+Math.min(index,5)*65;
    this.later(()=>{if(S.screen!==screen||!to.node.isConnected)return;if(e.k==='miss'){this.spawn(L,'target',to.x,to.y,{...p,color:'#9a97ab'});return;}if(!repeat)this.impact(L,e,to,p);else this.spawn(L,'cut',to.x,to.y,p,{'--size':'45px'});},arrival,epoch);
   },at,epoch);
   if(e.k==='cast')time+=180;
  }
 }
};
const battleEffectsAct=act,battleEffectsHit=hitOne;
act=function(u,id,...args){VFX_CONTEXT.push({source:u.id,skill:id});try{const ok=battleEffectsAct(u,id,...args);if(ok&&id==='rest')vfx('buff',u.id,{skill:id});return ok;}finally{VFX_CONTEXT.pop();}};
hitOne=function(u,sk,t,...args){VFX_CONTEXT.push({source:u.id,skill:VSKID.get(sk)||sk._pvpId||VFX_CONTEXT.at(-1)?.skill||'attack'});try{return battleEffectsHit(u,sk,t,...args);}finally{VFX_CONTEXT.pop();}};
flushVfx=function(){BattleEffects.flush();};
// @soulbeast-end 1094-battleEffects
