// Presentation choreography only: deterministic, no combat state, RNG or turn delays.
// @soulbeast-unit 1094-battleEffects
const BattleEffects={
 paintedTextures:typeof Image==='undefined'?null:Object.fromEntries(['lightning','fire','storm','beam','ice','dark','holy','nature'].map(key=>{const image=new Image();image.src='assets/vfx/projectiles/v2/'+key+'.png';return [key,image];})),
 recipes:{"solar_pentadrake_s1":{"mode":"melee","motif":"dragon","color":"#ff6b32","accent":"#ffeaaa","focus":"fang","particle":"flame","layout":"cross","count":3,"shots":1,"finale":false,"beat":57},"solar_pentadrake_s2":{"mode":"beam","motif":"dragon","color":"#ff6b32","accent":"#ffeaaa","focus":"flame","particle":"star","layout":"spiral","count":5,"shots":1,"finale":false,"beat":66},"solar_pentadrake_s3":{"mode":"melee","motif":"dragon","color":"#ff6b32","accent":"#ffeaaa","focus":"wing","particle":"petal","layout":"fan","count":5,"shots":1,"finale":false,"beat":75},"solar_pentadrake_s4":{"mode":"support","motif":"dragon","color":"#ff6b32","accent":"#ffeaaa","focus":"shield","particle":"flame","layout":"crown","count":5,"shots":1,"finale":false,"beat":84},"solar_pentadrake_s5":{"mode":"projectile","motif":"dragon","color":"#ff6b32","accent":"#ffeaaa","focus":"flame","particle":"fang","layout":"fan","count":5,"shots":5,"finale":false,"beat":93},"solar_pentadrake_s6":{"mode":"field","motif":"dragon","color":"#ff6b32","accent":"#ffeaaa","focus":"eclipse","particle":"comet","layout":"crown","count":5,"shots":1,"finale":true,"beat":102},"solar_mortivar_s1":{"mode":"projectile","motif":"lich","color":"#a97aff","accent":"#9fffa1","focus":"soul","particle":"star","layout":"spiral","count":3,"shots":1,"finale":false,"beat":57},"solar_mortivar_s2":{"mode":"beam","motif":"lich","color":"#a97aff","accent":"#9fffa1","focus":"eye","particle":"soul","layout":"cross","count":4,"shots":1,"finale":false,"beat":66},"solar_mortivar_s3":{"mode":"field","motif":"lich","color":"#a97aff","accent":"#9fffa1","focus":"web","particle":"soul","layout":"spiral","count":5,"shots":1,"finale":false,"beat":75},"solar_mortivar_s4":{"mode":"support","motif":"lich","color":"#a97aff","accent":"#9fffa1","focus":"seal","particle":"chain","layout":"orbit","count":4,"shots":1,"finale":false,"beat":84},"solar_mortivar_s5":{"mode":"projectile","motif":"lich","color":"#a97aff","accent":"#9fffa1","focus":"vine","particle":"comet","layout":"cross","count":5,"shots":1,"finale":false,"beat":93},"solar_mortivar_s6":{"mode":"field","motif":"lich","color":"#a97aff","accent":"#9fffa1","focus":"eclipse","particle":"soul","layout":"crown","count":6,"shots":1,"finale":true,"beat":102},"solar_aureolith_s1":{"mode":"melee","motif":"bastion","color":"#ffd675","accent":"#9fefff","focus":"crack","particle":"bolt","layout":"cross","count":3,"shots":1,"finale":false,"beat":57},"solar_aureolith_s2":{"mode":"support","motif":"bastion","color":"#ffd675","accent":"#9fefff","focus":"shield","particle":"arrow","layout":"inward","count":4,"shots":1,"finale":false,"beat":66},"solar_aureolith_s3":{"mode":"beam","motif":"bastion","color":"#ffd675","accent":"#9fefff","focus":"chain","particle":"bolt","layout":"cross","count":3,"shots":1,"finale":false,"beat":75},"solar_aureolith_s4":{"mode":"support","motif":"bastion","color":"#ffd675","accent":"#9fefff","focus":"shield","particle":"seal","layout":"fan","count":4,"shots":1,"finale":false,"beat":84},"solar_aureolith_s5":{"mode":"support","motif":"bastion","color":"#ffd675","accent":"#9fefff","focus":"halo","particle":"crack","layout":"inward","count":5,"shots":1,"finale":false,"beat":93},"solar_aureolith_s6":{"mode":"support","motif":"bastion","color":"#ffd675","accent":"#9fefff","focus":"shield","particle":"bolt","layout":"crown","count":6,"shots":1,"finale":true,"beat":102},"solar_heliotheon_s1":{"mode":"melee","motif":"deity","color":"#ffe98b","accent":"#ffffff","focus":"arrow","particle":"star","layout":"cross","count":3,"shots":1,"finale":false,"beat":57},"solar_heliotheon_s2":{"mode":"beam","motif":"deity","color":"#ffe98b","accent":"#ffffff","focus":"bolt","particle":"halo","layout":"crown","count":3,"shots":1,"finale":false,"beat":66},"solar_heliotheon_s3":{"mode":"support","motif":"deity","color":"#ffe98b","accent":"#ffffff","focus":"wing","particle":"star","layout":"fan","count":5,"shots":1,"finale":false,"beat":75},"solar_heliotheon_s4":{"mode":"melee","motif":"deity","color":"#ffe98b","accent":"#ffffff","focus":"cut","particle":"comet","layout":"cross","count":4,"shots":1,"finale":false,"beat":84},"solar_heliotheon_s5":{"mode":"support","motif":"deity","color":"#ffe98b","accent":"#ffffff","focus":"halo","particle":"petal","layout":"spiral","count":5,"shots":1,"finale":false,"beat":93},"solar_heliotheon_s6":{"mode":"field","motif":"deity","color":"#ffe98b","accent":"#ffffff","focus":"seal","particle":"wing","layout":"crown","count":6,"shots":1,"finale":true,"beat":102},"solar_ferroth_s1":{"mode":"melee","motif":"demon","color":"#e74e79","accent":"#c5abed","focus":"cut","particle":"crack","layout":"cross","count":3,"shots":1,"finale":false,"beat":57},"solar_ferroth_s2":{"mode":"projectile","motif":"demon","color":"#e74e79","accent":"#c5abed","focus":"eclipse","particle":"soul","layout":"spiral","count":4,"shots":1,"finale":false,"beat":66},"solar_ferroth_s3":{"mode":"support","motif":"demon","color":"#e74e79","accent":"#c5abed","focus":"shield","particle":"chain","layout":"inward","count":5,"shots":1,"finale":false,"beat":75},"solar_ferroth_s4":{"mode":"melee","motif":"demon","color":"#e74e79","accent":"#c5abed","focus":"wing","particle":"cut","layout":"fan","count":5,"shots":1,"finale":false,"beat":84},"solar_ferroth_s5":{"mode":"beam","motif":"demon","color":"#e74e79","accent":"#c5abed","focus":"chain","particle":"star","layout":"inward","count":5,"shots":1,"finale":false,"beat":93},"solar_ferroth_s6":{"mode":"field","motif":"demon","color":"#e74e79","accent":"#c5abed","focus":"eclipse","particle":"cut","layout":"cross","count":6,"shots":1,"finale":true,"beat":102},"solar_cryostag_s1":{"mode":"projectile","motif":"antlers","color":"#b4f4dc","accent":"#d7eeff","focus":"vine","particle":"petal","layout":"fan","count":4,"shots":3,"finale":false,"beat":57},"solar_cryostag_s2":{"mode":"projectile","motif":"antlers","color":"#b4f4dc","accent":"#d7eeff","focus":"arrow","particle":"comet","layout":"cross","count":3,"shots":1,"finale":false,"beat":66},"solar_cryostag_s3":{"mode":"support","motif":"antlers","color":"#b4f4dc","accent":"#d7eeff","focus":"halo","particle":"petal","layout":"spiral","count":5,"shots":1,"finale":false,"beat":75},"solar_cryostag_s4":{"mode":"support","motif":"antlers","color":"#b4f4dc","accent":"#d7eeff","focus":"vine","particle":"shield","layout":"crown","count":4,"shots":1,"finale":false,"beat":84},"solar_cryostag_s5":{"mode":"melee","motif":"antlers","color":"#b4f4dc","accent":"#d7eeff","focus":"crack","particle":"comet","layout":"fan","count":5,"shots":1,"finale":false,"beat":93},"solar_cryostag_s6":{"mode":"support","motif":"antlers","color":"#b4f4dc","accent":"#d7eeff","focus":"wing","particle":"soul","layout":"inward","count":6,"shots":1,"finale":true,"beat":102},"solar_raijaku_s1":{"mode":"projectile","motif":"feather","color":"#89edff","accent":"#e4a2ff","focus":"arrow","particle":"bolt","layout":"cross","count":3,"shots":1,"finale":false,"beat":57},"solar_raijaku_s2":{"mode":"melee","motif":"feather","color":"#89edff","accent":"#e4a2ff","focus":"wing","particle":"petal","layout":"fan","count":5,"shots":1,"finale":false,"beat":66},"solar_raijaku_s3":{"mode":"support","motif":"feather","color":"#89edff","accent":"#e4a2ff","focus":"orbit","particle":"eye","layout":"fan","count":6,"shots":1,"finale":false,"beat":75},"solar_raijaku_s4":{"mode":"projectile","motif":"feather","color":"#89edff","accent":"#e4a2ff","focus":"eye","particle":"bolt","layout":"fan","count":2,"shots":2,"finale":false,"beat":84},"solar_raijaku_s5":{"mode":"beam","motif":"feather","color":"#89edff","accent":"#e4a2ff","focus":"orbit","particle":"wing","layout":"spiral","count":5,"shots":1,"finale":false,"beat":93},"solar_raijaku_s6":{"mode":"field","motif":"feather","color":"#89edff","accent":"#e4a2ff","focus":"wing","particle":"bolt","layout":"fan","count":7,"shots":1,"finale":true,"beat":102},"solar_thalassyr_s1":{"mode":"melee","motif":"serpent","color":"#57d5ff","accent":"#c3ffed","focus":"fang","particle":"wave","layout":"cross","count":3,"shots":1,"finale":false,"beat":57},"solar_thalassyr_s2":{"mode":"beam","motif":"serpent","color":"#57d5ff","accent":"#c3ffed","focus":"seal","particle":"wave","layout":"spiral","count":4,"shots":1,"finale":false,"beat":66},"solar_thalassyr_s3":{"mode":"support","motif":"serpent","color":"#57d5ff","accent":"#c3ffed","focus":"halo","particle":"wave","layout":"inward","count":5,"shots":1,"finale":false,"beat":75},"solar_thalassyr_s4":{"mode":"field","motif":"serpent","color":"#57d5ff","accent":"#c3ffed","focus":"wave","particle":"vine","layout":"orbit","count":5,"shots":1,"finale":false,"beat":84},"solar_thalassyr_s5":{"mode":"beam","motif":"serpent","color":"#57d5ff","accent":"#c3ffed","focus":"cut","particle":"petal","layout":"cross","count":5,"shots":1,"finale":false,"beat":93},"solar_thalassyr_s6":{"mode":"field","motif":"serpent","color":"#57d5ff","accent":"#c3ffed","focus":"orbit","particle":"wave","layout":"spiral","count":7,"shots":1,"finale":true,"beat":102}},
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
  const effect=this.recipes[id];if(effect)mode=effect.mode;
  const painted=this.projectileArt(id,sk,{family,mode,legend,effect});
  return {effect,id,mode,theme,painted,projectile:family||({fire:'flame',ice:'ice',water:'wave',electric:'bolt',grass:'leaf',rock:'rock',ground:'rock',ghost:'soul',dark:'soul',poison:'venom'}[sk.el])||'orb',color:effect?.color||palette[2],accent:effect?.accent||palette[3],seed,variant:seed%7,hits:Math.min(5,Math.max(1,sk.hits||1)),area:!!sk.all,signature:!!SIGNATURE_ART[id]||!!legend,legend:legend?{id:legend[0],shapes:legend.slice(1),species}:null};
 },
 // Skill strength changes presentation only. Beginner skills keep their original small projectiles.
 projectileArt(id,sk,{family,mode,legend,effect}){
  if(id==='attack'||mode==='support'||mode==='melee')return null;
  if(!this.skillLevels){this.skillLevels=new Map();for(const c of Object.values(CLS))for(const [level,key]of c.sk||[])this.skillLevels.set(key,Math.max(this.skillLevels.get(key)||0,level));}
  const level=this.skillLevels.get(id)||0,power=Number(sk.pw||0)*Math.sqrt(Math.min(3,sk.hits||1));
  const tier=Math.min(4,Math.max(effect?.finale?4:legend||effect?3:0,level>=50?3:level>=35?2:level>=15?1:0,power>=250?3:power>=190?2:power>=155?1:0,sk.mp>=20?2:sk.mp>=10?1:0));
  if(!tier)return null;
  const name=id+' '+(sk.n||''),el=sk.el;let asset='beam',kind='bolt',tint='none';
  if(/meteor|อุกกาบาต|เมเทออร์/.test(name)){asset='fire';kind='bolt';}
  else if(/beam|ray|laser|cannon|railgun|ลำแสง|แสงพิฆาต|ปืนใหญ่|ปืนราง/.test(name)){asset=el==='dark'||el==='ghost'?'dark':'beam';kind='beam';}
  else if(/breath|พ่น|ลมหายใจ/.test(name)){asset=el==='ice'?'ice':el==='water'?'beam':'fire';kind='beam';}
  else if(/storm|tornado|tempest|cyclone|blizzard|พายุ|วายุ/.test(name)){asset='storm';kind='vortex';tint=el==='fire'?'sepia(.8) saturate(4) hue-rotate(330deg)':el==='grass'?'hue-rotate(285deg)':el==='dark'?'hue-rotate(65deg) saturate(2)':'none';}
  else if(el==='electric'||/lightning|thunder|สายฟ้า|อสนี/.test(name)){asset='lightning';kind='beam';}
  else if(family==='arrow'||family==='bullet'){asset='holy';kind='bolt';tint=el==='dark'?'hue-rotate(225deg)':el==='ice'||el==='water'?'hue-rotate(145deg)':'none';}
  else if(el==='fire'){asset='fire';kind=/flame|ไฟ|เพลิง/.test(name)&&tier>=2?'beam':'bolt';}
  else if(el==='ice'){asset='ice';}
  else if(el==='dark'||el==='ghost'||el==='poison'){asset='dark';kind=tier>=2?'beam':'bolt';tint=el==='poison'?'hue-rotate(165deg)':'none';}
  else if(el==='grass'){asset='nature';kind=tier>=2?'beam':'bolt';}
  else if(el==='fairy'){asset='beam';kind=tier>=2?'beam':'bolt';tint='hue-rotate(190deg)';}
  else if(el==='rock'||el==='ground'){asset='fire';tint='saturate(.65)';}
  else {asset='beam';kind=tier>=2?'beam':'bolt';}
  return {asset,kind,tier,scale:1+tier*.35,tint,path:'assets/vfx/projectiles/v2/'+asset+'.png'};
 },
 paintedTravel(L,from,to,p){
  const art=p.painted,dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy),beam=art.kind==='beam',vortex=art.kind==='vortex';
  const arena=from.node.closest?.('.battle-vitals,.online-combat-board,.demo-arena,.projectile-demo-board'),rect=arena?.getBoundingClientRect();
  const box=rect&&rect.width>0?rect:{left:Math.max(0,Math.min(from.x,to.x)-100),top:Math.max(0,Math.min(from.y,to.y)-100),width:Math.abs(dx)+200,height:Math.abs(dy)+200};
  const shell=document.createElement('div');shell.className='battle-fx-owned painted-projectile-clip';shell.setAttribute('aria-hidden','true');Object.assign(shell.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
  const node=document.createElement('div');node.className='vx battle-fx-owned battle-painted-flight '+(beam?'battle-skill-beam':'battle-projectile')+' painted-'+art.kind;node.dataset.skill=p.id;node.dataset.tier=String(art.tier);node.dataset.asset=art.asset;node.dataset.source=this.currentSource||'';node.dataset.target=this.currentTarget||'';
  const breadth=Math.min(vortex?148:beam?115:145,Math.max(vortex?54:beam?34:42,(from.size||44)*(vortex?1.2:beam?.5:.9))*art.scale);
  Object.assign(node.style,{left:from.x-box.left+'px',top:from.y-box.top+'px',width:(beam?distance:breadth*(vortex?1:1.6))+'px',height:(vortex?breadth*1.35:beam?Math.min(breadth,distance*.5):breadth*.66)+'px'});
  node.style.setProperty('--c',p.color);node.style.setProperty('--a',p.accent);node.style.setProperty('--angle',Math.atan2(dy,dx)*180/Math.PI+'deg');
  const image=document.createElement('img');image.src=art.path;image.alt='';image.draggable=false;image.style.filter=art.tint;node.appendChild(image);shell.appendChild(node);L.appendChild(shell);
  const duration=beam?680:560,arrival=beam?190:duration,screen=S.screen;let animation,done=false;
  const cleanup=()=>{if(done)return;done=true;animation?.cancel();shell.remove();this.live.delete(cleanup);};cleanup.stale=()=>S.screen!==screen||!from.node.isConnected||!to.node.isConnected;this.live.add(cleanup);
  const transform=(x,y)=>'translate(calc(-50% + '+x+'px),calc(-50% + '+y+'px))'+(vortex?'':' rotate(var(--angle))');
  const frames=beam?[{transform:'translateY(-50%) rotate(var(--angle)) scaleX(0)',opacity:0,offset:0},{transform:'translateY(-50%) rotate(var(--angle)) scaleX(1)',opacity:1,offset:190/duration},{opacity:1,offset:.77},{opacity:0,offset:1}]:[{transform:transform(0,0),opacity:0,offset:0},{opacity:1,offset:.08},{opacity:1,offset:.88},{transform:transform(dx,dy),opacity:0,offset:1}];
  if(node.animate){animation=node.animate(frames,{duration,easing:'linear',fill:'both'});animation.onfinish=cleanup;}else node.style.transform=transform(dx,dy);
  this.later(cleanup,duration+80);return arrival;
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
 later(fn,ms,epoch=this.epoch){const id=setTimeout(()=>{this.timers.delete(id);if(epoch===this.epoch)fn();},BattleSpeed.ms(ms));this.timers.add(id);return id;},
 clear(){this.epoch++;for(const t of this.timers)clearTimeout(t);this.timers.clear();for(const f of [...this.live])f();this.live.clear();document.getElementById('vfx')?.querySelectorAll('.battle-fx-owned').forEach(n=>n.remove());},
 watch(){if(this.observer||typeof MutationObserver==='undefined')return;this.observer=new MutationObserver(()=>{if(this.screen!==S.screen){this.clear();return;}for(const f of [...this.live])if(f.stale?.())f();});this.observer.observe(document.getElementById('app'),{childList:true,subtree:true});},
 spawn(L,shape,x,y,p,vars={}){const n=vSpawn(L,'battle-fx-owned sig-fx sig-'+shape,[x,y],p.color,null,{'--a':p.accent,'--size':Math.min(window.innerWidth<620?112:170,92+(p.signature?35:0))+'px','--theta':p.seed%180+'deg','--dx':'0px','--dy':'-25px','--duration':'720ms','--life-ms':820,'--wait':'0ms',...vars});if(n){n.dataset.skill=p.id;n.dataset.theme=p.theme;n.setAttribute('aria-hidden','true');}return n;},
 travel(L,from,to,p,melee=false){
  if(!from||!to)return 0;if(Math.hypot(to.x-from.x,to.y-from.y)<4)return 0;
  if(!melee&&p.painted){if(p.effect?.shots>1&&!p.echo)for(let i=1;i<p.effect.shots;i++)this.later(()=>{if(from.node.isConnected&&to.node.isConnected)this.travel(L,{...from,x:from.x+(i-(p.effect.shots-1)/2)*12,y:from.y-10},to,{...p,echo:true});},i*58);return this.paintedTravel(L,from,to,p);}
  const dx=to.x-from.x,dy=to.y-from.y,duration=melee?680:p.mode==='beam'?350:400;
  const node=document.createElement('div');node.className='vx battle-fx-owned '+(melee?'battle-portrait-flight':p.mode==='beam'?'battle-skill-beam':'battle-projectile projectile-'+p.projectile);node.dataset.skill=p.id;node.dataset.source=this.currentSource||'';node.dataset.target=this.currentTarget||'';node.setAttribute('aria-hidden','true');
  Object.assign(node.style,{left:from.x+'px',top:from.y+'px'});node.style.setProperty('--c',p.color);node.style.setProperty('--a',p.accent);node.style.setProperty('--angle',Math.atan2(dy,dx)*180/Math.PI+'deg');node.style.setProperty('--distance',Math.hypot(dx,dy)+'px');
  if(p.effect&&!melee){node.className+=' eclipse-flight eclipse-flight-'+p.effect.motif;node.dataset.recipe=p.id;if(p.mode!=='beam')node.className+=' eclipse-motif-'+p.effect.motif;}
  if(p.effect?.shots>1&&!p.echo&&!melee){for(let i=1;i<p.effect.shots;i++)this.later(()=>{if(from.node.isConnected&&to.node.isConnected)this.travel(L,{...from,x:from.x+(i-(p.effect.shots-1)/2)*12,y:from.y-10},to,{...p,echo:true});},i*58);}
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
 eclipseCast(L,to,p){
  const r=p.effect;if(!r)return;
  this.spawn(L,'eclipse-'+r.motif,to.x,to.y,p,{'--size':r.finale?'110px':'72px','--duration':'680ms'});
  this.spawn(L,'orbit',to.x,to.y,p,{'--size':r.finale?'125px':'70px','--duration':'620ms'});
  if(r.motif==='dragon'&&(r.shots===5||r.finale))for(let i=0;i<5;i++){const a=(-150+i*30)*Math.PI/180;this.spawn(L,'eclipse-dragon',to.x+Math.cos(a)*48,to.y+Math.sin(a)*48,p,{'--size':'32px','--wait':i*45+'ms','--duration':'740ms','--life-ms':1000});}
 },
 eclipseImpact(L,e,to,p,repeat=0){
  const r=p.effect,x=to.x,y=to.y;if(!r)return;
  const size=r.finale?148:100;
  if(!repeat){
   const crest=this.spawn(L,'eclipse-'+r.motif,x,y,p,{'--size':size+'px','--duration':'950ms','--life-ms':1100});if(crest)crest.dataset.recipe=p.id;
   this.spawn(L,r.focus,x,y,p,{'--size':(size*.85)+'px','--wait':'90ms','--duration':'850ms','--life-ms':1100});
   if(r.finale){const emblem=vSpawn(L,'battle-fx-owned battle-skill-emblem eclipse-skill-emblem',[x,y],p.color,null,{'--life-ms':1050,'--a':p.accent});if(emblem){emblem.innerHTML=skillPicture(this.actor(e.source),SK[p.id]||{},p.id);emblem.setAttribute('aria-hidden','true');emblem.dataset.skill=p.id;}}
   this.spawn(L,r.finale?'eclipse':'shock',x,y,p,{'--size':(size+15)+'px','--wait':'180ms','--duration':'850ms','--life-ms':1200});
  }
  const count=repeat?2:Math.min(r.count,window.innerWidth<620?6:8);
  for(let i=0;i<count;i++){
   const angle=r.layout==='fan'?(-150+i*120/Math.max(1,count-1)):r.layout==='crown'?(-180+i*180/Math.max(1,count-1)):r.layout==='cross'?45+i*90:i*360/count+repeat*35;
   const a=angle*Math.PI/180,rad=r.layout==='inward'?58:r.layout==='spiral'?16+i*5:32;
   this.spawn(L,r.particle,x+Math.cos(a)*rad,y+Math.sin(a)*rad,p,{'--size':(r.finale?66:44)+'px','--theta':angle+'deg','--wait':i*r.beat+'ms','--duration':'700ms','--life-ms':1500,'--dx':Math.cos(a)*(r.layout==='inward'?-rad:55)+'px','--dy':Math.sin(a)*(r.layout==='inward'?-rad:55)+'px'});
  }
  if(r.finale&&!repeat){this.spawn(L,'halo',x,y+28,p,{'--size':'170px','--wait':'270ms','--duration':'950ms','--life-ms':1400});}
 },
 impact(L,e,to,p){
  if(p.effect){this.eclipseImpact(L,e,to,p);return;}
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
    if(e.k==='cast'||e.k==='charge'){if(p.effect){vSpawn(L,'vx-cast',null,p.color,e.n||SK[e.skill]?.n);this.eclipseCast(L,to,p);return;}vSpawn(L,'vx-cast',null,p.color,e.n||SK[e.skill]?.n);spellBurst(L,{...e,k:'cast'},to.x,to.y);this.spawn(L,'seal',to.x,to.y,p,{'--size':'62px'});if(['support','field'].includes(p.mode))this.impact(L,e,to,p);return;}
    if(!['hit','miss','heal','buff','debuff'].includes(e.k))return;
    const key=e.group+':'+e.source+':'+e.id+':'+e.skill,index=seen.get(key)||0,repeat=index>0;seen.set(key,index+1);
    this.currentSource=e.source;this.currentTarget=e.id;let arrival=0;
    if(!repeat&&from&&e.source!==e.id){if(p.mode==='melee'){const move=e.group+':'+e.source;if(!moved.has(move)){moved.add(move);arrival=this.travel(L,from,to,p,true);}}else if(['projectile','beam'].includes(p.mode))arrival=this.travel(L,from,to,p);else if(e.k==='heal'||e.k==='buff')arrival=this.travel(L,from,to,{...p,mode:'projectile',projectile:'orb'});}
    if(!repeat&&p.mode==='melee'&&from&&e.source!==e.id&&!arrival)arrival=330;
    if(repeat)arrival=380+Math.min(index,5)*65;
    this.later(()=>{if(S.screen!==screen||!to.node.isConnected)return;if(e.k==='miss'){this.spawn(L,'target',to.x,to.y,{...p,color:'#9a97ab'});return;}if(!repeat)this.impact(L,e,to,p);else if(p.effect)this.eclipseImpact(L,e,to,p,index);else this.spawn(L,'cut',to.x,to.y,p,{'--size':'45px'});},arrival,epoch);
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
