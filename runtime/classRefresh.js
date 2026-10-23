// Requested class balance follow-up.
// @soulbeast-unit 1085-classRefresh
// Requested follow-up balance: free druid forms, desperation, stronger clones, stealth criticals.
PAS.class10_desperation={n:'พลังฮึดสู้ · Lv10',d:'ดาเมจโจมตีเพิ่ม 1% ต่อ HP สูงสุดที่เสียไปทุก 1% สูงสุดเกือบ 100% เมื่อใกล้หมดสติ'};
CLS.gladiator.pas.push('class10_desperation');
const classRefreshUnit=unit;unit=function(o){const u=classRefreshUnit(o);if(u.lv<10)u.pas=u.pas.filter(k=>k!=='class10_desperation');return u;};
const classRefreshFactor=classCombatFactor;classCombatFactor=function(u,t,sk){const f=classRefreshFactor(u,t,sk);return class10Damaging(sk)&&hasPas(u,'class10_desperation')&&u.st?.hp>0&&Number.isFinite(u.hp)?f*(1+Math.max(0,Math.min(1,1-u.hp/u.st.hp))):f;};
const classRefreshActions=[];
function classRefreshStealthCrit(u){const context=classRefreshActions.at(-1);return !!(context?.id===u.id&&context.crit)||!!(u.cls&&baseOf(u.cls)==='archer'&&class10Invisible(u));}
function takeFreeForm(u){if(!u?.freeFormPending)return false;u.freeFormPending=false;return true;}
const classRefreshAct=act;act=function(u,id,target,friend,free){
 const sk=SK[id],druid=!!(u.cls&&baseOf(u.cls)==='druid'),freeForm=(druid&&sk?.t==='form'&&!u.form&&!u.freeFormUsed&&!cooldownOf(u,id)&&costOf(u,sk)<=u.mp)||freeMerchantHire(u,id);
 const fromStealth=!!(class10Damaging(sk)&&u.cls&&baseOf(u.cls)==='archer'&&class10Invisible(u));
 const charged=!!(free&&u.pendingStealthChargeCrit);delete u.pendingStealthChargeCrit;
 u.freeFormPending=freeForm;classRefreshActions.push({id:u.id,crit:fromStealth||charged});
 try{const ok=classRefreshAct(u,id,target,friend,free);if(ok&&freeForm)u.freeFormUsed=true;else if(!ok)u.freeFormPending=false;
  if(ok&&fromStealth&&sk.ct&&!free&&u.charging)u.charging.stealthCrit=true;return ok;
 }finally{classRefreshActions.pop();}
};
const classRefreshHit=hitOne;hitOne=function(u,sk,t,...args){
 const direct=class10Damaging(sk)&&u.cls&&baseOf(u.cls)==='archer'&&class10Invisible(u);
 if(direct)classRefreshActions.push({id:u.id,crit:true});
 try{return classRefreshHit(u,sk,t,...args);}finally{if(direct)classRefreshActions.pop();}
};
PAS.class10_stealth.d='ไม่เป็นเป้าท่าเดี่ยว 3 เทิร์น โดนท่าหมู่ได้ โจมตีแรกจากล่องหนรับประกันคริติคอลทุกฮิตเมื่อโจมตีโดน แล้วล่องหนหาย ใช้บัฟและยาได้';

const classRefreshAfter=after;after=function(){const b=B(),u=b&&uById(b.cur);if(takeFreeForm(u)){b.menu='main';render();if(teamAutoUnit(u)){b.menu='wait';battleLater(aiAct,150);}return;}return classRefreshAfter();};
const classRefreshDesc=skillDesc;skillDesc=function(id){const s=SK[id];return classRefreshDesc(id)+(s?.t==='form'?' · สายดรูอิดแปลงร่างไม่เสียเทิร์น (ยังใช้ MP)':'')+(id==='shadow_clone'?' · HP 50% และค่าสถานะอื่น 80% ของร่างจริง':'');};
// Follow-up balance: one-battle archer veil, healing parry, reflect AI, free hire.
SK.class10_parry.cd=2;
PAS.class10_parry.d='ป้องกันท่าโจมตี 1 ท่า รวมทุกฮิต และฟื้น HP เท่าดาเมจที่ป้องกันได้ ไม่เกิน HP สูงสุด อยู่ 3 เทิร์น คูลดาวน์ 3 เทิร์น';
PAS.class10_stealth.d='Lv10: ล่องหนแบบพาสซีฟ ป้องกันท่าโจมตีเดี่ยว 1 ท่าต่อการต่อสู้ ไม่กันท่าหมู่ ไม่เพิ่มคริติคอล';
CLS.archer.sk=CLS.archer.sk.filter(([,id])=>id!=='class10_stealth');
CLS.archer.pas.push('class10_stealth');
delete SK.class10_stealth;
class10Invisible=function(){return false;};
classRefreshStealthCrit=function(){return false;};
const defenseFollowupUnit=unit;unit=function(o){const u=defenseFollowupUnit(o);u.skills=(u.skills||[]).filter(id=>id!=='class10_stealth');u.buffs=u.buffs.filter(x=>x.pas!=='class10_stealth');
 if(u.lv<10)u.pas=u.pas.filter(id=>id!=='class10_stealth');
 if(!u.classDefenseInitialized){u.classDefenseInitialized=true;if(u.lv>=10&&!u.temporary&&hasPas(u,'class10_stealth'))u.archerVeil=1;}return u;};
function freeMerchantHire(u,id){return id==='hire_merc'&&u.cls&&baseOf(u.cls)==='merchant'&&!u.freeFormUsed&&u.skills.includes(id)&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp;}
function chooseAutoReflect(u){
 if(!u||u.hp<=0||u.temporary||!u.cls||baseOf(u.cls)!=='gladiator'||hasPas(u,'thorns2'))return null;
 if(!u.skills.includes('ms_gladiator10')||cooldownOf(u,'ms_gladiator10')||costOf(u,SK.ms_gladiator10)>u.mp)return null;
 if(u.hp/u.st.hp<.4&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 const enemies=foesOf(u).filter(x=>x.hp>0);return enemies.some(x=>x.skills.some(id=>{const sk=SK[id];return sk&&(['p','h'].includes(sk.t)||sk.t==='auto'&&x.atkType!=='m');}))?'ms_gladiator10':null;
}
const defenseFollowupAuto=class10AutoDefense;class10AutoDefense=function(u){return chooseAutoReflect(u)||defenseFollowupAuto(u);};
// A consumed parry remains in this action's context so each blocked hit heals its actual rolled damage.
class10BlockHit=function(u,sk,t,damaging){
 const c=class10AttackContexts.at(-1),key=t.id+'|'+u.id;
 if(c?.blocked.has(key))return true;
 if(c?.absorbing?.has(key))return false;
 const parry=t.buffs.some(x=>x.pas==='class10_parry'&&x.tn>0);
 if(parry&&damaging){t.buffs=t.buffs.filter(x=>x.pas!=='class10_parry');if(c)(c.absorbing??=new Set()).add(key);return false;}
 const veil=damaging&&!sk.all&&t.archerVeil>0,barrier=damaging&&t.class10Barrier>0;
 if(!parry&&!veil&&!barrier)return false;
 if(parry)t.buffs=t.buffs.filter(x=>x.pas!=='class10_parry');else if(veil)t.archerVeil=0;else t.class10Barrier=0;
 c?.blocked.add(key);blog(t.name+' ใช้ '+(parry?'ตั้งสมาธิปัดป้อง':veil?'ล่องหน':'บาเรียเวทย์')+' ป้องกัน '+sk.n);vfx('buff',t.id);return true;
};
function classDefenseAbsorb(u,sk,t,d){if(!class10AttackContexts.at(-1)?.absorbing?.has(t.id+'|'+u.id))return false;const restored=heal(t,d);blog(t.name+' ปัดป้อง '+d+' ดาเมจ และฟื้น HP '+restored);vfx('heal',t.id);return true;}
const defenseFollowupAct=act;act=function(u,id,...args){if(id==='class10_stealth')return false;return defenseFollowupAct(u,id,...args);};
const defenseFollowupReplayApply=applyClass10Replay;applyClass10Replay=function(b,f){defenseFollowupReplayApply(b,f);for(const [id,count]of f.archerVeils||[]){const u=[...b.allies,...b.enemies].find(x=>x.id===id);if(u)u.archerVeil=count;}};

const defenseFollowupEffects=battleSpecialEffects;battleSpecialEffects=function(u){const out=defenseFollowupEffects(u);if(u.archerVeil>0)out.push('<span class="battle-effect-icon special-effect good" data-effect="class10_stealth" title="ล่องหน · กันท่าโจมตีเดี่ยวได้อีก 1 ท่า"><span class="battle-special-image" style="background-position:40% 66.6667%"></span></span>');return out;};
const defenseFollowupCareer=careerPanel;careerPanel=function(cls){return defenseFollowupCareer(cls)+(baseOf(cls)==='archer'?'<p class="sub">Lv10: ล่องหนแบบพาสซีฟ กันท่าโจมตีเดี่ยว 1 ท่าต่อการต่อสู้ ไม่เพิ่มคริติคอล</p>':'');};
const defenseFollowupDesc=skillDesc;skillDesc=function(id){return defenseFollowupDesc(id)+(id==='hire_merc'?' · สายพ่อค้าเรียกทหารรับจ้างไม่เสียเทิร์น ยังใช้ MP และเงินตามเดิม':'');};

// Requested revision: free parry, reflective shield without defense-stat buffs.
delete SK.ms_gladiator10.bf;
SK.ms_gladiator10.pas='reflect50';
PAS.reflect50={n:'โล่สะท้อน',d:'ลดความเสียหายจากท่าโจมตี 20% และสะท้อนความเสียหายที่ได้รับ 50% ทั้งกายภาพ เวท และผสม ไม่บวกซ้อนผิวหนาม'};
PAS.class10_parry.d+=' · ใช้แล้วสั่งการต่อได้ทันที ไม่เสียเทิร์น ยังใช้ MP';
const parryReflectFree=freeMerchantHire;freeMerchantHire=function(u,id){return id==='class10_parry'&&u.skills.includes(id)&&!u.freeFormUsed&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp||parryReflectFree(u,id);};
chooseAutoReflect=function(u){
 if(!u||u.hp<=0||u.temporary||!u.cls||baseOf(u.cls)!=='gladiator'||hasPas(u,'reflect50'))return null;
 if(!u.skills.includes('ms_gladiator10')||cooldownOf(u,'ms_gladiator10')||costOf(u,SK.ms_gladiator10)>u.mp)return null;
 if(u.hp/u.st.hp<.4&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 return foesOf(u).some(x=>x.hp>0&&x.skills.some(id=>class10Damaging(SK[id])))?'ms_gladiator10':null;
};
function reflectShieldDamage(u,t,d){if(!hasPas(t,'reflect50')||u.hp<=0)return;const n=Math.max(1,Math.round(d*.5));blog(u.name+' โดนโล่สะท้อน '+n);if(isWorldBattle()&&u.immortalWorld)B().wbDamageOwner=t.owner;hurt(u,n);}

BATTLE_SPECIAL_ICONS.reflect50=[9,'good'];
const parryReflectDesc=skillDesc;skillDesc=function(id){return parryReflectDesc(id)+(id==='ms_gladiator10'?' · '+PAS.reflect50.d:'');};

// Counter stance, shadow interception and mercenary level revision.
delete SK.gl_counter.bf;
SK.gl_counter.pas='counter50';SK.gl_counter.tn=3;
PAS.counter50={n:'ท่าสวนกลับ',d:'ลดดาเมจท่าโจมตี 50% และสะท้อนดาเมจที่ได้รับ 50% ทั้งกายภาพ เวท และผสม นาน 3 เทิร์น ใช้แทนโล่สะท้อน ไม่ซ้อนผิวหนาม'};
PAS.thorns.d='สะท้อนดาเมจกายภาพและผสม 25% ไม่บวกซ้อนท่าสวนกลับหรือโล่สะท้อน';
PAS.shadow_guard={n:'เงารับเคราะห์',d:'Lv10: เมื่อร่างจริงถูกใช้ท่าเดี่ยวใส่ มีโอกาส 50% ให้ร่างเงาของตัวเองที่ยังมีชีวิตรับท่านั้นแทน ไม่รับท่าหมู่'};
CLS.thief.pas.push('shadow_guard');
const counterShadowUnit=unit;unit=function(o){const u=counterShadowUnit(o);if(u.lv<10)u.pas=u.pas.filter(k=>k!=='shadow_guard');return u;};
const counterShadowAct=act;act=function(u,id,...args){const ok=counterShadowAct(u,id,...args);if(ok&&(id==='gl_counter'||id==='ms_gladiator10'))u.buffs=u.buffs.filter(x=>x.pas!==(id==='gl_counter'?'reflect50':'counter50'));return ok;};
reflectShieldDamage=function(u,t,d){if(!(hasPas(t,'counter50')||hasPas(t,'reflect50'))||u.hp<=0)return;const n=Math.max(1,Math.round(d*.5));blog(u.name+' โดนสะท้อน '+n);if(isWorldBattle()&&u.immortalWorld)B().wbDamageOwner=t.owner;hurt(u,n);};
chooseAutoReflect=function(u){
 if(!u||u.hp<=0||u.temporary||!u.cls||baseOf(u.cls)!=='gladiator'||hasPas(u,'counter50')||hasPas(u,'reflect50'))return null;
 if(u.hp/u.st.hp<.4&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 if(!foesOf(u).some(x=>x.hp>0&&x.skills.some(id=>class10Damaging(SK[id]))))return null;
 return ['gl_counter','ms_gladiator10'].find(id=>u.skills.includes(id)&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp)||null;
};
const counterShadowHit=hitOne;hitOne=function(u,sk,t,...args){
 const own=!class10AttackContexts.length;if(own)class10AttackContexts.push({blocked:new Set()});
 try{if(t&&!t.temporary&&hasPas(t,'shadow_guard')&&!sk.all&&class10Offensive(sk)&&foesOf(u).includes(t)){
   const c=class10AttackContexts.at(-1),key=u.id+'|'+t.id;c.shadowTargets??=new Map();
   if(!c.shadowTargets.has(key)){const clones=sideOf(t).filter(x=>x.hp>0&&x.temporary&&x.shadowOwner===t.id);c.shadowTargets.set(key,clones.length&&Math.random()<.5?clones[0].id:null);}
   const clone=sideOf(t).find(x=>x.id===c.shadowTargets.get(key)&&x.hp>0);if(clone){blog(clone.name+' รับการโจมตีแทน '+t.name);t=clone;}
  }return counterShadowHit(u,sk,t,...args);
 }finally{if(own)class10AttackContexts.pop();}
};

BATTLE_SPECIAL_ICONS.counter50=[9,'good'];
const counterShadowDesc=skillDesc;skillDesc=function(id){return counterShadowDesc(id)+(id==='gl_counter'?' · '+PAS.counter50.d:'');};
const counterShadowCareer=careerPanel;careerPanel=function(cls){return counterShadowCareer(cls)+(baseOf(cls)==='thief'?'<p class="sub">Lv10: เงารับเคราะห์ โอกาส 50% ให้ร่างเงาที่ยังมีชีวิตรับท่าเดี่ยวแทนร่างจริง</p>':'');};

// World participants retain their granted guard action after a druid transformation.
const worldFormGuardAct=act;act=function(u,id,...args){const ok=worldFormGuardAct(u,id,...args);if(ok&&SK[id]?.t==='form'&&isWorldBattle()&&!u.skills.includes('wb_guard'))u.skills.push('wb_guard');return ok;};

const CLASS_ABILITY_ART={class10_parry:'parry',class10_barrier:'barrier',class10_range:'range',class10_stealth:'stealth',class10_desperation:'desperation',shadow_guard:'shadow-guard',reflect50:'reflect-shield',ms_gladiator10:'reflect-shield',counter50:'counter',gl_counter:'counter',shadow_clone:'shadow-clone',hire_merc:'mercenary',summon_golem:'golem'};
function classAbilityImage(id,size=30){const key=CLASS_ABILITY_ART[id];if(!key)return '';return '<img class="class-ability-image" src="assets/skills/class-abilities-v1/'+key+'.webp" alt="'+esc(SK[id]?.n||PAS[id]?.n||id)+'" width="'+size+'" height="'+size+'" loading="lazy" decoding="async">';}
const classAbilityBasePicture=skillPicture;skillPicture=function(u,sk,id){const picture=classAbilityBasePicture(u,sk,id);return CLASS_ABILITY_ART[id]?picture.replace('skill-painted','skill-painted class-ability-picture').replace('role="img"','data-class-ability="'+esc(id)+'" role="img"'):picture;};
const classAbilityCareerPanel=careerPanel;careerPanel=function(cls){const ids=[...new Set(chain(cls).flatMap(c=>[...(CLS[c].pas||[]),...(CLS[c].sk||[]).map(x=>x[1])]))].filter(id=>CLASS_ABILITY_ART[id]);return classAbilityCareerPanel(cls)+(ids.length?'<details class="class-ability-guide"><summary>สกิลและความสามารถเฉพาะอาชีพ</summary>'+ids.map(id=>SK[id]?skillRow(id,true):'<div class="row">'+classAbilityImage(id,44)+'<div class="grow"><b>'+esc(PAS[id].n)+'</b><div class="sub">'+esc(PAS[id].d)+'</div></div></div>').join('')+'</details>':'');};

// @soulbeast-end 1085-classRefresh

