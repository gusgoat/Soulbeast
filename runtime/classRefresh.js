// Requested class balance follow-up.
// @soulbeast-unit 1085-classRefresh
// Requested follow-up balance: free druid forms, desperation, stronger clones, stealth criticals.
PAS.class10_desperation={n:'พลังฮึดสู้ · Lv10',d:'ดาเมจโจมตีเพิ่ม 1% ต่อ HP สูงสุดที่เสียไปทุก 1% สูงสุดเกือบ 100% เมื่อใกล้หมดสติ'};
CLS.gladiator.pas.push('class10_desperation');
const classRefreshUnit=unit;unit=function(o){const u=classRefreshUnit(o);if(u.lv<10)u.pas=u.pas.filter(k=>k!=='class10_desperation');return u;};
const classRefreshFactor=classCombatFactor;classCombatFactor=function(u,t,sk){const f=classRefreshFactor(u,t,sk);return class10Damaging(sk)&&hasPas(u,'class10_desperation')&&u.st?.hp>0&&Number.isFinite(u.hp)?f*(1+Math.max(0,Math.min(1,1-u.hp/u.st.hp))):f;};
// PVP Lv60 career balance: same coefficients for every gear set and opponent.
const PVP_CAREER_BALANCE={"templar":{"out":1.55,"incoming":0.9,"pet":1.55},"eternal":1.4,"warlord":{"out":1.5,"incoming":0.85,"pet":1.5},"bloodwar":{"out":1.75,"incoming":0.85,"pet":1.75},"sniper":{"out":1.08,"incoming":0.78,"pet":1.08},"maestro":{"out":1.22,"incoming":0.78,"pet":1.22},"bounty":1.15,"archdruid":0.78,"beastking":{"out":0.82,"incoming":0.9,"pet":0.82},"soulsage":{"out":0.93,"incoming":0.95,"pet":0.93},"sealmaster":{"out":1.05,"pet":0.83,"incoming":0.9},"wildgod":0.88,"ronin":1.15,"cannoneer":1.1,"demolisher":1.15,"spiritlord":{"out":0.97,"incoming":0.95,"pet":0.97},"dirge":1.17,"packlord":1.08,"masterthief":1.08,"ninja":1.05};
function pvpCareerOutgoing(u){if(!isBalancedPvp())return 1;const hero=u.kind==='pet'?sideOf(u).find(x=>x.kind==='player'&&x.owner===u.owner):u;const a=PVP_CAREER_BALANCE[hero?.cls];return typeof a==='number'?a:(u.kind==='pet'?a?.pet:a?.out)||1;}
function pvpCareerIncoming(t){return isBalancedPvp()&&t.kind==='player'?(PVP_CAREER_BALANCE[t.cls]?.incoming||1):1;}
const careerBalancedAttack=classCombatFactor;classCombatFactor=function(u,t,sk){return careerBalancedAttack(u,t,sk)*pvpCareerOutgoing(u);};
const careerBalancedDefense=pvpDamageFactor;pvpDamageFactor=function(u,t){return careerBalancedDefense(u,t)*pvpCareerIncoming(t);};

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
const classRefreshDesc=skillDesc;skillDesc=function(id){const s=SK[id];return classRefreshDesc(id)+(s?.t==='form'?' · สายดรูอิดแปลงร่างครั้งแรกไม่เสียเทิร์น (ยังใช้ MP)':'')+(id==='shadow_clone'?' · HP 25% และค่าสถานะอื่น 80% ของร่างจริง':'');};
// Follow-up balance: one-battle archer veil, healing parry, reflect AI, free hire.
SK.class10_parry.cd=2;
PAS.class10_parry.d='ป้องกันท่าโจมตี 1 ท่า รวมทุกฮิต และฟื้น HP เท่าดาเมจที่ป้องกันได้ ไม่เกิน HP สูงสุด อยู่ 3 เทิร์น คูลดาวน์ 2 เทิร์น';
PAS.class10_stealth.d='Lv10: ล่องหนแบบพาสซีฟ ลดดาเมจท่าโจมตีเดี่ยวแรก 50% รวมทุกฮิต 1 ครั้งต่อการต่อสู้ ไม่กันท่าหมู่ ไม่เพิ่มคริติคอล และยังรับสถานะตามปกติ';
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
 if(c?.absorbing?.has(key)||c?.archerHalfGuardTargets?.has(key))return false;
 const parry=t.buffs.some(x=>x.pas==='class10_parry'&&x.tn>0);
 if(parry&&damaging){t.buffs=t.buffs.filter(x=>x.pas!=='class10_parry');if(c)(c.absorbing??=new Set()).add(key);return false;}
 const veil=damaging&&!sk.all&&t.archerVeil>0,barrier=damaging&&t.class10Barrier>0;
 if(veil){t.archerVeil=0;if(c)(c.archerHalfGuardTargets??=new Set()).add(key);blog(t.name+' ใช้ล่องหน ลดดาเมจ '+sk.n+' 50%');vfx('buff',t.id);return false;}
 if(!parry&&!barrier)return false;
 if(parry)t.buffs=t.buffs.filter(x=>x.pas!=='class10_parry');else t.class10Barrier=0;
 c?.blocked.add(key);blog(t.name+' ใช้ '+(parry?'ตั้งสมาธิปัดป้อง':'บาเรียเวทย์')+' ป้องกัน '+sk.n);vfx('buff',t.id);return true;
};
function classDefenseDamageFactor(u,t){return class10AttackContexts.at(-1)?.archerHalfGuardTargets?.has(t.id+'|'+u.id)? .5:1;}
function classDefenseAbsorb(u,sk,t,d){if(!class10AttackContexts.at(-1)?.absorbing?.has(t.id+'|'+u.id))return false;const restored=heal(t,d);blog(t.name+' ปัดป้อง '+d+' ดาเมจ และฟื้น HP '+restored);vfx('heal',t.id);return true;}
const defenseFollowupAct=act;act=function(u,id,...args){if(id==='class10_stealth')return false;return defenseFollowupAct(u,id,...args);};
const defenseFollowupReplayApply=applyClass10Replay;applyClass10Replay=function(b,f){defenseFollowupReplayApply(b,f);for(const [id,count]of f.archerVeils||[]){const u=[...b.allies,...b.enemies].find(x=>x.id===id);if(u)u.archerVeil=count;}};

const defenseFollowupEffects=battleSpecialEffects;battleSpecialEffects=function(u){const out=defenseFollowupEffects(u);if(u.archerVeil>0)out.push('<span class="battle-effect-icon special-effect good" data-effect="class10_stealth" title="ล่องหน · ลดดาเมจท่าเดี่ยวแรก 50% ได้อีก 1 ครั้ง"><span class="battle-special-image" style="background-position:40% 66.6667%"></span></span>');return out;};
const defenseFollowupCareer=careerPanel;careerPanel=function(cls){return defenseFollowupCareer(cls)+(baseOf(cls)==='archer'?'<p class="sub">Lv10: ล่องหนแบบพาสซีฟ ลดดาเมจท่าเดี่ยวแรก 50% รวมทุกฮิต 1 ครั้งต่อการต่อสู้ ยังรับสถานะตามปกติ</p>':'');};
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


// Summoner line: one companion in exchange for a second life, inherited by every promotion.
PAS.summoner_soul_exchange={n:'สัญญาแลกวิญญาณ',d:'เมื่อหมดสติ ฟื้น HP 30% ได้ 1 ครั้งต่อการต่อสู้ แลกกับคู่หูที่ยังมีชีวิต 1 ตัว (เลือก HP ปัจจุบันน้อยสุด) ไม่นับตัวอัญเชิญชั่วคราว; พาสซีฟฟื้นคืนชีพเดิมทำงานก่อน'};
CLS.summoner.pas.push('summoner_soul_exchange');

// Boss defenses and small-group area specialization, shared by every battle mode.
PAS.archer_boss_evasion={n:'ล่องหนล่าบอส · Lv55',d:'สุ่มหลบแยก 30% ต่อฮิตโจมตีจากบอส รวมท่าหมู่ ไม่ใช่บวกค่าหลบ 30 จุด และไม่ใช้สิทธิ์ลดดาเมจท่าเดี่ยวเดิม'};
PAS.mage_elemental_barrier={n:'บาเรียธาตุ · Lv50',d:'ลดดาเมจโจมตีจากบอส50% สำหรับ3ฮิตแรกที่ผ่านการหลบและการป้องกันเดิม ต่อการต่อสู้ ไม่นับพิษหรือความเสียหายต่อเนื่อง'};
PAS.small_group_area={n:'ถล่มเป้าหมายจำกัด',d:'สกิลโจมตีหมู่แรงขึ้น50%เมื่อเริ่มใช้ท่าแล้วศัตรูมีชีวิตไม่เกิน2ตัว'};
function bossCareerPassives(cls,lv){const a=[];if(!cls)return a;const base=baseOf(cls);if(base==='archer'&&lv>=55)a.push('archer_boss_evasion');if(base==='mage'&&lv>=50)a.push('mage_elemental_barrier');if(['stormcaller','demolisher'].includes(cls))a.push('small_group_area');return a;}
const bossCareerHumanPas=humanPas;humanPas=function(cls,eq,lv=S?.P?.lv||0){return [...new Set([...bossCareerHumanPas(cls,eq,lv),...bossCareerPassives(cls,lv)])];};
const bossCareerUnit=unit;unit=function(o){const u=bossCareerUnit(o);if(['player','human'].includes(u.kind)&&!u.temporary){u.pas=[...new Set([...u.pas,...bossCareerPassives(u.cls,u.lv)])];if(u.elementalBarrierHits==null)u.elementalBarrierHits=u.cls&&baseOf(u.cls)==='mage'&&u.lv>=50?3:0;}return u;};
const bossCareerHits=[],bossCareerActions=[];
const bossCareerHit=hitOne;hitOne=function(u,sk,t,...args){bossCareerHits.push({u,t,barrier:false});try{return bossCareerHit(u,sk,t,...args);}finally{bossCareerHits.pop();}};
const bossCareerBlock=class10BlockHit;class10BlockHit=function(u,sk,t,damaging){
 const hero=['player','human'].includes(t.kind)&&!t.temporary;
 if(damaging&&u.boss&&hero&&t.cls&&baseOf(t.cls)==='archer'&&t.lv>=55&&Math.random()<.3){blog(t.name+' ล่องหนหลบการโจมตีบอส');vfx('miss',t.id);return true;}
 const blocked=bossCareerBlock(u,sk,t,damaging);if(blocked)return true;
 const c=bossCareerHits.at(-1);
 if(damaging&&u.boss&&hero&&t.cls&&baseOf(t.cls)==='mage'&&t.lv>=50&&t.elementalBarrierHits>0&&c?.u===u&&c?.t===t){c.barrier=true;t.elementalBarrierHits=Math.min(3,t.elementalBarrierHits)-1;blog(t.name+' บาเรียธาตุลดดาเมจ50% เหลือ '+t.elementalBarrierHits+' ฮิต');}
 return false;
};
const bossCareerDefense=classDefenseDamageFactor;classDefenseDamageFactor=function(u,t){const c=bossCareerHits.at(-1);return bossCareerDefense(u,t)*(c?.u===u&&c?.t===t&&c.barrier? .5:1);};
const bossCareerAct=act;act=function(u,id,...args){bossCareerActions.push({u,count:foesOf(u).filter(x=>x.hp>0).length});try{return bossCareerAct(u,id,...args);}finally{bossCareerActions.pop();}};
function smallGroupAreaFactor(u,sk){if(!['player','human'].includes(u.kind)||u.temporary||!['stormcaller','demolisher'].includes(u.cls)||!sk.all||!class10Damaging(sk))return 1;const c=bossCareerActions.at(-1),n=c?.u===u?c.count:foesOf(u).filter(x=>x.hp>0).length;return n>0&&n<=2?1.5:1;}
const bossCareerFactor=classCombatFactor;classCombatFactor=function(u,t,sk){return bossCareerFactor(u,t,sk)*smallGroupAreaFactor(u,sk);};
const bossCareerReplayApply=applyClass10Replay;applyClass10Replay=function(b,f){bossCareerReplayApply(b,f);for(const [id,hits]of f.elementalBarrierHits||[]){const u=[...b.allies,...b.enemies].find(x=>x.id===id);if(u)u.elementalBarrierHits=hits;}};
const bossCareerEffects=battleSpecialEffects;battleSpecialEffects=function(u){const a=bossCareerEffects(u);if(u.elementalBarrierHits>0)a.push('<span class="battle-effect-icon good barrier-counter" title="บาเรียธาตุ ลดดาเมจบอส50% เหลือ '+u.elementalBarrierHits+' ฮิต" aria-label="บาเรียธาตุ เหลือ '+u.elementalBarrierHits+' ฮิต"><span aria-hidden="true">🛡</span><b>'+u.elementalBarrierHits+'</b></span>');return a;};


// Opening gunner evasion: expires after two landed attack hits or first own action.
PAS.gunner_ambush55={n:'ซุ่มยิง · Lv55',d:'หลบฮิตโจมตีแน่นอน 2 ครั้งแรก หมดผลเมื่อจบการกระทำครั้งแรก ใช้ครั้งเดียวต่อการต่อสู้'};
const ambushHumanPas=humanPas;humanPas=function(cls,eq,lv=S?.P?.lv||0){const a=ambushHumanPas(cls,eq,lv);return cls&&baseOf(cls)==='gunner'&&lv>=55?[...new Set([...a,'gunner_ambush55'])]:a;};
const ambushUnit=unit;unit=function(o){const u=ambushUnit(o);if(u.ambushHits==null)u.ambushHits=['player','human'].includes(u.kind)&&!u.temporary&&u.cls&&baseOf(u.cls)==='gunner'&&u.lv>=55?2:0;return u;};
const ambushBlock=class10BlockHit;class10BlockHit=function(u,sk,t,damaging){if(damaging&&t.ambushHits>0){t.ambushHits--;blog(t.name+' ซุ่มยิงหลบการโจมตี เหลือ '+t.ambushHits+' ครั้ง');vfx('miss',t.id);return true;}return ambushBlock(u,sk,t,damaging);};
const ambushEnd=endUnitTurn;endUnitTurn=function(u){if(u)u.ambushHits=0;return ambushEnd(u);};


// Presentation-only descriptions, kept beside the current combat rules.
CAREER_GUIDE.druid.con='การแปลงร่างยังใช้ MP ครั้งแรกไม่เสียเทิร์น ร่างแปลงทุกแบบใช้สกิลร่างคนได้ แต่ต้องบริหาร MP และคูลดาวน์';
CAREER_GUIDE.feral.con='ต้องลงทุนกายภาพให้ตรงร่าง และบริหาร MP; แปลงร่างครั้งแรกไม่เสียเทิร์น';
CAREER_GUIDE.wildgod.con='ต้องบริหาร MP และคูลดาวน์ ร่างมังกรยังใช้สกิลร่างคนได้ทุกท่า';
const latestCareerPanel=careerPanel;careerPanel=function(cls){
 const base=baseOf(cls),ids=[];const notes=[];
 if(base==='archer')ids.push('archer_boss_evasion');
 if(base==='mage')ids.push('mage_elemental_barrier');
 if(base==='gunner'){humanPas(cls,{},60);ids.push('gunnerBossBounty','gunner_ambush55');}
 if(base==='summoner')ids.push('summoner_soul_exchange');
 if(['stormcaller','demolisher'].includes(cls))ids.push('small_group_area');
 if(base==='druid')notes.push('ร่างแปลงทุกร่างใช้สกิลร่างคนได้ทุกท่า แปลงร่างครั้งแรกต่อการต่อสู้ไม่เสียเทิร์น แต่ยังใช้ MP');
 if(['druid','summoner'].includes(base))notes.push('สกิลฟื้น HP: เล่นคนเดียว ×0.70; PVP จู่โจมค่าย สงครามกิลด์ หอคอย และบอสโลก ×1.00 ไม่ใช่ตัวคูณของการดูดเลือดหรือฟื้นต่อเนื่อง');
 if(base==='thief')notes.push('ร่างเงา: HP 25% และค่าสถานะอื่น 80% ของร่างจริง');
 if(['sealmaster','spiritlord'].includes(cls))notes.push('เฉพาะ PVP เมื่อยังมีคู่หูมีชีวิต: รับดาเมจ ×0.60; คู่หูฝ่ายตรงข้ามโจมตีผู้ผนึกมีตัวคูณ ×0.70 อีกชั้น ก่อนตัวปรับอาชีพ PVP');
 if(SOLO_DEMON_CAREER_DAMAGE[cls])notes.push('เฉพาะศึกจอมมารโหมดคนเดียว: ดาเมจผู้ผนึก ×'+SOLO_DEMON_CAREER_DAMAGE[cls]+' ไม่เพิ่มดาเมจคู่หู');
 const a=PVP_CAREER_BALANCE[cls];if(a){const out=typeof a==='number'?a:a.out||1,pet=typeof a==='number'?a:a.pet||1,inc=typeof a==='number'?1:a.incoming||1;notes.push('ตัวปรับสมดุลเฉพาะ PVP: ดาเมจผู้ผนึก ×'+out+' / คู่หู ×'+pet+' / ดาเมจที่ผู้ผนึกได้รับ ×'+inc+' คูณร่วมกับกติกาอื่น');}
 return latestCareerPanel(cls)+(ids.length?'<div class="card stack"><b>ความสามารถเพิ่มเติมตามเลเวล</b>'+ids.map(id=>'<div><b>'+esc(PAS[id].n)+'</b><p class="sub">'+esc(PAS[id].d)+'</p></div>').join('')+'</div>':'')+notes.map(t=>'<p class="sub">'+esc(t)+'</p>').join('');
};
const latestClassTree=vClassTree;vClassTree=function(){return latestClassTree()+'<details class="card"><summary>กติกาคู่หูและการฟื้นฟูที่ใช้ร่วมกันทุกอาชีพ</summary><p>คู่หูที่ยังมีชีวิตเกิน 1 ตัว: พลังโจมตีกายภาพและเวทของคู่หูทุกตัวลด 15% ต่อตัวที่เกิน (2 ตัวเหลือ 85%, 3 ตัวเหลือ 70%)</p><p>คู่หูโจมตีบอส: ดาเมจ ×0.70; เฉพาะ PVP คู่หูโจมตีผู้ผนึก: ×0.70 และมีการแบ่งพลังฝูงเพิ่มเติม</p><p>สกิลฟื้น HP ของอสูร: ×0.70 ทุกอาชีพ พาสซีฟเพิ่มฮีลและผลเฉพาะการต่อสู้ยังคูณร่วมกัน</p><p>คริติคอลใส่บอส: ดาเมจของฮิตคริติคอล ×0.75 หลังคำนวณคริ</p></details>';};
const latestSkillDescription=skillDesc;skillDesc=function(id){const sk=SK[id];return latestSkillDescription(id)+(id==='class10_parry'?' · '+PAS.class10_parry.d:'')+(sk?.t==='heal'?' · สายดรูอิด/อัญเชิญ: ฮีลเล่นคนเดียว ×0.70 โหมดอื่น ×1.00; อสูรฮีล ×0.70'+(sk.rev||sk.revAll?' · การชุบชีวิตใช้ HP '+sk.pw+'% โดยไม่บวกพลังเวทหรือคูณฮีล':''):'');};

// @soulbeast-end 1085-classRefresh


