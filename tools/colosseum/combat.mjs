import '../../content/beast-names.js';
import '../hemant-walk-demo/war-engine.generated.js?v=siege-scoring-1';
import rareArt from './rare-art.mjs';
const core=globalThis.SoulbeastColosseumEngine();
const ACT_MS=12_000, SHOW_MS=850;
const BOT_ACT_MS=500;
const BASE_AURA_STATS=['patk','matk','pdef','mdef'];
const units=b=>[...b.allies,...b.enemies];
const find=(b,id)=>units(b).find(u=>u.id===id);
const enemies=(b,u)=>units(b).filter(t=>t.side!==u.side&&t.hp>0);
const allies=(b,u)=>units(b).filter(t=>t.side===u.side&&t.hp>0);
const activeSkill=(u,id)=>{
 const sk=core.skill(id);
 return !!sk&&u.skills.includes(id)&&!sk.gc&&!sk.rev&&!sk.revAll&&!core.cooldown(u,id)&&core.cost(u,sk)<=u.mp;
};
const bladeWaves=new Set(['gl_quake','ms_gladiator20','wl_split','ms_swordsman60','ms_swordsman30','ke_thousand','ms_merchant30','ws_mace3','bs_hammer','ms_godhammer','te_judge','sb_thunder','ws_axe3','s_cyclops','ground_m2','fairy_m2','sw_charge','ws_sword5','pa_hammer']);
function actionVisual(u,id,skill){
 if(['heal','buff'].includes(skill.t))return {kind:skill.t};
 if(['rest','form','revert','summon'].includes(skill.t)||skill.summon)return {kind:'buff'};
 const name=id+' '+skill.n;
 if(bladeWaves.has(id)||/คลื่น.*(?:ดาบ|ขวาน|ค้อน)|(?:ดาบ|ขวาน|ค้อน).*คลื่น|blade.*wave|sword.*wave|crescent/.test(name))return {kind:'blade'};
 if(/^(?:ar_|ra_|sn_|wd_|ws_bow|ms_archer|bow_)/.test(id)||(id==='attack'&&u.cls==='archer'))return {kind:'bow'};
 if(/breath|beam|lance|ne_soul|wk_curse|sm_bind|en_mind|ga_transmute|(?:steel|normal|grass|fire|dragon)_m2/.test(id))return {kind:'spell',flight:'beam'};
 if(/music|song|sound|note|melody|sonic|เพลง|ดนตรี|เสียง|โน้ต|โน๊ต/.test(name))return {kind:'spell',flight:'music'};
 if(/shuriken|ดาวกระจาย/.test(name))return {kind:'spell',flight:'shuriken'};
 const ranged=['m','status','debuff'].includes(skill.t)||(skill.t==='auto'&&u.atkType==='m');
 return {kind:ranged?'spell':'melee'};
}
export const rareSpecies=core.rareBeasts().filter(id=>Object.hasOwn(rareArt,id));
export const careerInfo=cls=>core.career(cls);
export function botCareer(cls,level,variant){
 const base=careerInfo(cls)?.base||'swordsman';
 if(level<=25)return base;
 const branches=core.childrenOf(base);
 if(!branches.length)return base;
 const branch=branches[variant%branches.length];
 if(level<=40)return branch;
 const final=core.childrenOf(branch);
 return final[variant%Math.max(1,final.length)]||branch;
}
const botClasses=core.baseCareers();
const botBeasts=core.botBeasts();
const sample=(list,random)=>list[Math.floor(random()*list.length)];
export function botLoadout(name,lv,others,random){
 const baseUsed=new Set(others.map(p=>p.baseCls));
 const unusedClasses=botClasses.filter(cls=>!baseUsed.has(cls));
 const base=sample(unusedClasses.length?unusedClasses:botClasses,random);
 const cls=botCareer(base,lv,Math.floor(random()*144)),gender=random()<.5?'male':'female';
 const usedBeasts=new Set(others.flatMap(p=>p.bot.loadout.pets.map(pet=>pet.sp)));
 const pool=botBeasts.filter(sp=>!usedBeasts.has(sp));
 const pets=[];
 for(let i=0;i<core.petLimit(cls);i++){
  const options=(pool.length?pool:botBeasts).filter(sp=>!pets.some(pet=>pet.sp===sp));
  const sp=sample(options.length?options:botBeasts.filter(id=>!pets.some(pet=>pet.sp===id)),random);
  pets.push({uid:i+1,sp,lv,pts:{hp:lv-1,spd:lv-1}});
 }
 const party=pets.map(pet=>pet.uid);
 const pts={hp:lv-1,patk:lv-1,matk:lv-1,spd:lv-1};
 return {name,lv,cls,gender,eq:core.botEquipment(cls,lv,random),pts,pets,party,carried:party.slice()};
}
export function bossUnit(p){
 const u=core.shadow(p.sp,p.lv,0);
 const boosts={hp:3,mp:3,pdef:2,mdef:2,patk:2,matk:2,spd:1.25};
 for(const [stat,multiplier] of Object.entries(boosts))u.st[stat]=Math.round(u.st[stat]*multiplier);
 u.hp=Math.max(0,Math.min(u.st.hp,p.hp??u.st.hp));
 u.mp=Math.max(0,Math.min(u.st.mp,p.mp??u.st.mp));
 u.skills=u.skills.filter(id=>!core.skill(id)?.summon);
 return u;
}
export function demoProfile(p,seat){
 const profile=p.character||p.bot?.loadout;
 if(profile){
  const {team}=core.profile(structuredClone(profile),seat);
  if(['male','female'].includes(profile.gender))team[0].gender=profile.gender;
  return team;
 }
 const sp=careerInfo(p.cls)?.base==='summoner'?['kappa','griffin']:['kappa'];
 return core.profile({name:p.name,lv:p.lv,cls:p.cls,eq:core.gear(p.cls,p.lv),pts:{},pets:sp.map((s,i)=>({uid:i+1,sp:s,lv:p.lv,pts:{}})),party:sp.map((_,i)=>i+1)},seat).team;
}
function syncBaseAura(b){
 if(!b.baseAuraOwners.size)return;
 for(const u of units(b)){
  const active=b.baseAuraOwners.get(b.roster[u.owner])||0,previous=u.baseAura||0;
  if(active===previous)continue;
  const factor=(100+active)/(100+previous);
  for(const stat of BASE_AURA_STATS)u.st[stat]*=factor;
  u.baseAura=active;
 }
}
export function makeCombat(id,teams,shadow,now,auraOwners=new Map(),teamSiege=false){
 const roster=teams.flat();
 const b={id,kind:shadow?'hunt':'pvp',round:0,turns:0,turn:0,cur:null,queue:[],deadline:0,
  teams:teams.map(t=>t.map(p=>p.id)),roster:roster.map(p=>p.id),botOwners:roster.map(p=>Boolean(p.bot)),beastId:shadow?.id,
  allies:[],enemies:[],log:[],fx:[],effects:[],fallen:[],finished:false,releasedAt:0,autoOwners:new Set(),autoVersion:0,
  baseAuraOwners:auraOwners,colosseumFalls:new Map(),
  colosseumHuntBonus:new Set(teamSiege&&shadow?roster.flatMap((p,index)=>p.baseCls==='swordsman'?[index]:[]):[]),
  colosseumPvpCareers:teamSiege&&!shadow?roster.map(p=>p.baseCls):null};
 for(const [side,team] of teams.entries()) for(const p of team){
  const list=side?b.enemies:b.allies;
  for(const u of demoProfile(p,roster.indexOf(p))){
   u.side=side?'enemy':'ally';
   u.sealer=p.id;
   if(u.kind==='player'){
    if(Number.isFinite(p.hp))u.hp=Math.max(1,Math.min(u.hp,p.hp));
    if(Number.isFinite(p.mp))u.mp=Math.max(0,Math.min(u.mp,p.mp));
    Object.assign(u.status,p.ailments);
   }else if(u.kind==='pet'){
    const vitals=p.petVitals?.get(u.uid);
    if(vitals){u.hp=Math.min(u.st.hp,vitals.hp);u.mp=Math.min(u.st.mp,vitals.mp);}
   }
   list.push(u);
  }
 }
 if(shadow){const u=shadow.boss?bossUnit(shadow):core.shadow(shadow.sp,shadow.lv,0);u.owner=-1;u.name=shadow.label;b.enemies.push(u);b.boss=!!shadow.boss;}
 syncBaseAura(b);
 for(const p of roster)if(auraOwners.has(p.id))b.log.push(`◆ ${p.name} · ออร่าฐาน โจมตีและป้องกัน +${auraOwners.get(p.id)}%`);
 core.bind(b);next(b,now);return b;
}
function checkEnd(b,now){
 for(const hero of units(b).filter(u=>u.kind==='player'&&u.hp<=0&&!b.fallen.includes(u.sealer))){
  b.fallen.push(hero.sealer);
  for(const u of units(b).filter(x=>x.owner===hero.owner&&x!==hero))u.hp=0;
 }
 const alive=t=>t.some(u=>u.hp>0&&['player','beast'].includes(u.kind));
 if(!alive(b.allies)||!alive(b.enemies)||b.turns>=100){
  b.finished=true;b.cur=null;b.deadline=0;b.releasedAt=now+1500;
  b.log.push(!alive(b.allies)&&!alive(b.enemies)?'ทั้งสองฝั่งล้มลง':!alive(b.allies)?'ฝั่งขวาชนะ':!alive(b.enemies)?'ฝั่งซ้ายชนะ':'ครบจำนวนเทิร์น การต่อสู้จบลง');
  return true;
 }
 return false;
}
export function settleCombat(b,now){
 if(b.finished||checkEnd(b,now))return;
 if(find(b,b.cur)?.hp<=0){
  core.bind(b);
  next(b,now);
 }
}
function openTurn(b,u,now){
 b.turn++;b.openAt=now+SHOW_MS;
 b.deadline=b.openAt+(u.owner===-1?300:b.botOwners[u.owner]?BOT_ACT_MS:ACT_MS);
}
function next(b,now){
 for(let guard=0;guard<50;guard++){
  if(checkEnd(b,now))return;
  if(!b.queue.length){
   b.round++;
   b.queue=units(b).filter(u=>u.hp>0).sort((a,c)=>core.speed(c)-core.speed(a)||a.id.localeCompare(c.id)).map(u=>u.id);
  }
  const u=find(b,b.queue.shift());if(!u||u.hp<=0)continue;
  if(core.turnStart(u)){b.turns++;continue;}
  b.cur=u.id;openTurn(b,u,now);
  return;
 }
 b.turns=100;checkEnd(b,now);
}
export function setCombatAuto(b,player,enabled){
 if(b.finished||typeof enabled!=='boolean'||!b.roster.includes(player)||b.autoOwners.has(player)===enabled)return;
 if(enabled)b.autoOwners.add(player);
 else b.autoOwners.delete(player);
 b.autoVersion++;
}
function actionDeadline(b,u){
 return b.autoOwners.has(b.roster[u?.owner])?b.openAt+BOT_ACT_MS:b.deadline;
}
export function combatAction(b,player,command,now){
 if(b.finished||b.autoOwners.has(player)||command.turn!==b.turn||now<b.openAt||now>=b.deadline)return false;
 core.bind(b);
 const u=find(b,b.cur), target=find(b,command.target);
 if(!u||b.roster[u.owner]!==player||!activeSkill(u,command.skill)||(command.target!=null&&!target))return false;
 return perform(b,u,command.skill,target,now,true);
}
function perform(b,u,id,target,now,active=false){
 const charged=u.charging;
 if(charged){id=charged.id;target=find(b,charged.tid);u.charging=null;u.pendingStealthChargeCrit=!!charged.stealthCrit;}
 const sk=core.skill(id);if(!sk)return false;
 const support=['heal','buff'].includes(sk.t);
 const list=support?allies(b,u):enemies(b,u);
 if(target&&!list.includes(target)&&!charged)return false;
 const aim=list.includes(target)?target:list[0];
 const friend=sk.tg==='self'?u:support?aim:u;
 const before=b.onContribution&&active?new Map(units(b).map(target=>[target.id,{hp:target.hp,buffs:target.buffs.length,statuses:Object.keys(target.status).length}])):null;
 b.effects=[];b.fx=[];
 if(!core.act(u,id,support?enemies(b,u)[0]:aim,friend,!!charged))return false;
 if(before&&units(b).some(target=>{
  const previous=before.get(target.id);
  if(!previous)return false;
  if(target.side!==u.side)return target.hp<previous.hp||Object.keys(target.status).length>previous.statuses;
  return target.owner!==u.owner&&(target.hp>previous.hp||target.buffs.length>previous.buffs);
 }))b.onContribution(b.roster[u.owner]);
 syncBaseAura(b);
 b.last={actor:u.id,target:aim?.id,skill:sk.n,skillId:id,...actionVisual(u,id,sk),element:sk.el,n:(b.last?.n||0)+1};
 if(!core.takeFreeForm(u)){b.turns++;next(b,now);}
 else if(!checkEnd(b,now))openTurn(b,u,now);
 b.log=b.log.slice(-18);
 return true;
}
export function advanceCombat(b,now){
 if(b.finished||now<b.openAt)return;
 core.bind(b);
 const u=find(b,b.cur);if(!u)return;
 if(!u.charging&&now<actionDeadline(b,u))return;
 const move=core.auto(u);
 const sk=core.skill(move.id);
 const target=['heal','buff'].includes(sk?.t)?move.friend:move.target;
 const active=b.autoOwners.has(b.roster[u.owner]);
 if(u.charging&&perform(b,u,u.charging.id,undefined,now,active))return;
 if(activeSkill(u,move.id)&&perform(b,u,move.id,target,now,active))return;
 if(perform(b,u,'attack',enemies(b,u)[0],now,active))return;
 b.turns++;next(b,now);
}
export function combatView(b,player){
 core.bind(b);
 const cur=find(b,b.cur);
 const auto=b.autoOwners.has(player);
 const commands=!auto&&cur&&b.roster[cur.owner]===player&&!cur.charging?[...new Set(cur.skills)].filter(id=>activeSkill(cur,id)).map(id=>{
  const sk=core.skill(id), support=['heal','buff'].includes(sk.t);
  return {id,name:sk.n,mp:core.cost(cur,sk),
   targets:(sk.tg==='self'?[cur]:support?allies(b,cur):enemies(b,cur)).map(u=>u.id)};
 }):[];
 const show=u=>({id:u.id,owner:u.owner,name:u.name,kind:u.kind,cls:u.cls,baseCls:careerInfo(u.cls)?.base,sp:u.sp,lv:u.lv,hp:u.hp,mp:u.mp,maxHp:u.st.hp,maxMp:u.st.mp,
  gender:u.gender,evo:u.evo,types:u.types,statuses:Object.keys(u.status||{}),baseAura:u.baseAura});
 return {id:b.id,teams:b.teams,roster:b.roster,allies:b.allies.map(show),enemies:b.enemies.map(show),commands,boss:b.boss,
  round:b.round,turn:b.turn,cur:b.cur,deadline:actionDeadline(b,cur),openAt:b.openAt,finished:b.finished,last:b.last,auto,
  fx:b.fx,effects:b.effects,log:b.log.slice(-5)};
}
