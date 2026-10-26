// Stats, classes, leveling and evolution
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0004-PER

const PER={hp:8,mp:5,patk:1.5,matk:1.5,pdef:1.5,mdef:1.5,acc:2,eva:1.5,spd:1,crit:.5};
// @soulbeast-end 0004-PER
// @soulbeast-unit 0023-BASES

const BASES=Object.keys(CLS).filter(k=>!CLS[k].p);
// @soulbeast-end 0023-BASES
// @soulbeast-unit 0027-wStats

function wStats(type,t){const f=WF[t],o=({sword:{patk:f,acc:t*2},axe:{patk:f*1.1,pdef:t*3},bow:{patk:f*.95,acc:t*3,crit:t},staff:{matk:f,mp:t*8},mace:{patk:f,hp:t*15},gun:{patk:f,acc:t*3,crit:t},dagger:{patk:f*.85,crit:t*1.5,spd:t},whip:{matk:f*.85,mp:t*8,spd:t}})[type];
 const s={};for(const k in o){const v=Math.round(o[k]);if(v)s[k]=v}return s}
// @soulbeast-end 0027-wStats
// @soulbeast-unit 0078-JOB_FOCUS



/* Expansion data: additive IDs keep all existing saves and arena indices valid. */
const JOB_FOCUS=SoulbeastContent.JOB_FOCUS();
// @soulbeast-end 0078-JOB_FOCUS
// @soulbeast-unit 0079-focusFor

function focusFor(cls){const own=CLS[cls].focus;if(own)return own;const keys=Object.keys(CLS[cls].m).filter(k=>!['hp','mp','eva'].includes(k)).sort((a,b)=>(CLS[cls].m[b]||1)-(CLS[cls].m[a]||1));return tierOf(cls)>0&&keys.length>=2?keys.slice(0,2):JOB_FOCUS[baseOf(cls)]}
// @soulbeast-end 0079-focusFor
// @soulbeast-unit 0080-focusBonus

function focusBonus(cls,k){return focusFor(cls).includes(k)?[.10,.20,.30][Math.min(2,tierOf(cls))]:0}
// @soulbeast-end 0080-focusBonus
// @soulbeast-unit 0114-need

const need=l=>Math.floor(18*Math.pow(l,1.6)*(1+Math.max(0,l-20)*.03));
// @soulbeast-end 0114-need
// @soulbeast-unit 0115-expFor

const expFor=l=>Math.floor(8*Math.pow(l,1.35)+6);
// @soulbeast-end 0115-expFor
// @soulbeast-unit 0122-clsMult

const clsMult=(k,s)=>chain(k).reduce((m,c)=>m*(CLS[c].m[s]||1),1);
// @soulbeast-end 0122-clsMult
// @soulbeast-unit 0123-clsSkills

const clsSkills=(k,lv)=>chain(k).flatMap(c=>CLS[c].sk.filter(([l])=>lv>=l).map(x=>x[1]));
// @soulbeast-end 0123-clsSkills
// @soulbeast-unit 0124-clsSkillsAt

const clsSkillsAt=(k,lv)=>chain(k).flatMap(c=>CLS[c].sk.filter(([l])=>lv===l).map(x=>x[1]));
// @soulbeast-end 0124-clsSkillsAt
// @soulbeast-unit 0125-clsPas

const clsPas=k=>chain(k).flatMap(c=>CLS[c].pas);
// @soulbeast-end 0125-clsPas
// @soulbeast-unit 0126-clsSum

const clsSum=k=>Math.max(1,...chain(k).map(c=>CLS[c].sum||1));
// @soulbeast-end 0126-clsSum
// @soulbeast-unit 0127-clsWeapon

const clsWeapon=k=>CLS[baseOf(k)].w;
// @soulbeast-end 0127-clsWeapon
// @soulbeast-unit 0131-canPromote

function canPromote(P){const t=tierOf(P.cls);return (t===0&&P.lv>=25)||(t===1&&P.lv>=40)}
// @soulbeast-end 0131-canPromote
// @soulbeast-unit 0132-humanStats


/* ---- humans ---- */
function humanStats(cls,lv,pts,eq){const s={};K.forEach((k,i)=>s[k]=(PB[i]+PG[i]*(lv-1))*clsMult(cls,k)+((pts&&pts[k])||0)*PER[k]*(1+focusBonus(cls,k)));
 for(const sl in eq){const it=EQ[eq[sl]];if(it)for(const k in it.st)s[k]+=Math.round(it.st[k]*(it.slot==='weapon'&&it.wt!==clsWeapon(cls)?.8:1))}return rnd(s)}
// @soulbeast-end 0132-humanStats
// @soulbeast-unit 0135-pStats

const pStats=()=>WorldTales.adjustStats(worldPowerStats(S.P,humanStats(S.P.cls,S.P.lv,S.P.pts,S.P.eq)));
// @soulbeast-end 0135-pStats
// @soulbeast-unit 0153-gainExp


function gainExp(o,amt,isP){const lines=[];o.exp+=amt;
 while(o.lv<MAXLV&&o.exp>=need(o.lv)){const before=isP?pStats():calcPet(o);o.exp-=need(o.lv);o.lv++;ExtraAudio.play('level');o.free=(o.free||0)+(isP?5:3);
  if(!isP){const nf=formFor(o.sp,o.lv);if(nf>(o.form||0)){markFormSeen(o.sp,o.form||0);o.form=nf;markFormSeen(o.sp,nf);lines.push(`✦ ${SP[o.sp].n} พัฒนาร่างเป็น ${formName(o.sp,nf)}!`);if(nf===SP[o.sp].ev.length&&SP[o.sp].sig)lines.push(`${formName(o.sp,nf)} เรียนรู้สกิลเฉพาะตัว ${SK[SP[o.sp].sig].n}`)}}
  const after=isP?pStats():calcPet(o);o.hp+=after.hp-before.hp;o.mp+=after.mp-before.mp;
  lines.push(`${isP?o.name:petName(o)} เลเวลอัปเป็น Lv ${o.lv}!`);
  if(isP){clsSkillsAt(o.cls,o.lv).forEach(id=>lines.push(`เรียนรู้สกิล ${SK[id].n}`));if(canPromote(o)&&(o.lv===25||o.lv===40))lines.push('★ เลื่อนอาชีพได้แล้ว! ไปที่หน้าตัวละคร')}
  else{const i=(SP[o.sp].skillLevels||SKLV).indexOf(o.lv);if(i>0&&SP[o.sp].sk[i])lines.push(`${petName(o)} เรียนรู้ ${SK[SP[o.sp].sk[i]].n}`);if(SP[o.sp].rare&&o.lv===(SP[o.sp].signatureLevel||SIGLV))lines.push(`${petName(o)} เรียนรู้สกิลเฉพาะตัว ${SK[SP[o.sp].sig].n}`)}}
 if(o.lv>=MAXLV)o.exp=0;
 return lines}
// @soulbeast-end 0153-gainExp
// @soulbeast-unit 0154-loseExp

function loseExp(o,frac){const l=Math.floor(need(o.lv)*frac),lost=Math.min(o.exp,l);o.exp-=lost;return lost}
// @soulbeast-end 0154-loseExp
// @soulbeast-unit 0301-BANDCLS

const BANDCLS=SoulbeastContent.BANDCLS();
// @soulbeast-end 0301-BANDCLS
// @soulbeast-unit 0362-careerLines

function careerLines(cls){const g=careerGuide(cls);return `<span class="career-good"><b>ข้อดี</b> ${esc(g.pro)}</span><span class="career-caution"><b>ข้อเสีย / ควรระวัง</b> ${esc(g.con)}</span>`;}
// @soulbeast-end 0362-careerLines
// @soulbeast-unit 0363-careerPanel

function careerPanel(cls){return `<div class="career-guide">${careerLines(cls)}</div>`;}
// @soulbeast-end 0363-careerPanel
// @soulbeast-unit 0368-vClassTree

function vClassTree(){const cur=chain(S.P.cls);return `<div class="stack"><div class="card"><h3>แนะนำสายอาชีพ</h3><p class="sub">อ่านทั้งข้อดีและข้อควรระวัง แล้วเลือกแนวที่เข้ากับทีมของคุณ · สาขาที่เลื่อนแล้วจะเปลี่ยนย้อนกลับไม่ได้ · ข้อมูลนี้อธิบายรูปแบบการเล่น ไม่ใช่อันดับความเก่งใน PVP</p></div><div class="tree career-tree">${BASES.map(b=>`<section class="card stack ${cur[0]===b?'career-path-current':''}"><div class="row">${portrait('cls:'+b,52)}<div><h3>${CLS[b].n}</h3><span class="sub">อาชีพเริ่มต้น · ${WT[CLS[b].w].n}</span></div></div>${careerPanel(b)}${childrenOf(b).map(c=>`<details class="career-branch" ${cur.includes(c)?'open':''}><summary>${portrait('cls:'+c,40)}<span><b>Lv 25 · ${CLS[c].n}</b><small>${CLS[c].d}</small></span></summary>${careerPanel(c)}<div class="career-final-grid">${childrenOf(c).map(g=>`<div class="career-final ${cur.includes(g)?'career-path-current':''}"><div class="row">${portrait('cls:'+g,42)}<b>Lv 40 · ${CLS[g].n}</b></div><p class="sub">${CLS[g].d}</p>${careerPanel(g)}</div>`).join('')}</div></details>`).join('')}</section>`).join('')}</div></div>`;}
// @soulbeast-end 0368-vClassTree
// @soulbeast-unit 0418-statsLocked

function statsLocked(){return !!(S.battle&&!S.battle.over||PVP.room?.status==='active'||CAMP.room?.status==='active'||WORLD.room?.status==='active')}
// @soulbeast-end 0418-statsLocked
// @soulbeast-unit 0419-allocationPlan

function allocationPlan(p=null){if(!p){const focus=focusFor(S.P.cls),primary=WT[clsWeapon(S.P.cls)].t==='m'?'matk':'patk',weights={hp:3,[primary]:4};for(const k of focus)weights[k]=Math.max(weights[k]||0,k==='mp'||k==='acc'?1:k==='crit'?2:3);return {name:'สาย'+CLS[S.P.cls].n,weights}}const sp=SP[p.sp],hasTaunt=sp.sk.some(id=>SK[id]?.taunt),healer=sp.sk.filter(id=>SK[id]?.t==='heal').length;let name,weights;if(hasTaunt){name='ผู้พิทักษ์';weights={pdef:4,mdef:4,hp:3}}else if(healer&&sp.b[3]>=sp.b[2]){name='สนับสนุนเวท';weights={matk:4,mp:3,hp:2,mdef:1}}else if(sp.b[3]>sp.b[2]*1.2){name='โจมตีเวท';weights={matk:5,mp:2,hp:2,spd:1}}else if(sp.b[2]>sp.b[3]*1.2){name='โจมตีกายภาพ';weights={patk:5,hp:2,spd:2,acc:1}}else{name='โจมตีผสม';weights={patk:3,matk:3,hp:2,spd:1,mp:1}}return {name,weights}}
// @soulbeast-end 0419-allocationPlan
// @soulbeast-unit 0421-autoStats

function autoStats(uid){if(statsLocked()){toast('อัปสถานะอัตโนมัติได้หลังจบการต่อสู้');return}const isHero=uid==='P',o=isHero?S.P:petBy(Number(uid));if(!o)return;const free=Math.max(0,Math.floor(Number(o.free)||0));if(!free)return;const used=Object.values(o.pts||{}).reduce((n,v)=>n+(Number(v)||0),0),budget=Math.max(0,(o.lv-1)*(isHero?5:3)-used),spend=Math.min(free,budget);if(!spend){toast('ไม่มีแต้มที่ใช้ได้ตามระดับเลเวล');return}const before=isHero?pStats():calcPet(o),hp=o.hp,mp=o.mp,plan=allocationPlan(isHero?null:o);o.pts=o.pts||{};const keys=Object.keys(plan.weights);for(let i=0;i<spend;i++){const k=keys.reduce((best,k)=>plan.weights[k]/((o.pts[k]||0)+1)>plan.weights[best]/((o.pts[best]||0)+1)?k:best,keys[0]);o.pts[k]=(o.pts[k]||0)+1}o.free-=spend;const after=isHero?pStats():calcPet(o);o.hp=hp>0?Math.min(after.hp,hp+after.hp-before.hp):0;o.mp=Math.min(after.mp,Math.max(0,mp+after.mp-before.mp));if(AUTO_STAT_BATCH)return;save();render();toast('จัดสรร '+spend+' แต้มให้ '+(isHero?o.name:petName(o))+' ตาม'+plan.name+' แล้ว')}
// @soulbeast-end 0421-autoStats
// @soulbeast-unit 0422-autoStatPanel

function autoStatPanel(p=null){const o=p||S.P,plan=allocationPlan(p);return `<div class="auto-stat-panel"><div><b>อัปสถานะอัตโนมัติ · ${esc(plan.name)}</b><small>${Object.keys(plan.weights).map(k=>LBL[k]).join(' / ')} · ใช้เฉพาะแต้มที่เหลือ ไม่ล้างแต้มเดิม</small></div><button class="btn pri" data-a="autoStats" data-v="${p?p.uid:'P'}" ${o.free>0&&!statsLocked()?'':'disabled'}>จัดสรร ${Math.max(0,o.free||0)} แต้ม</button></div>`}
// @soulbeast-end 0422-autoStatPanel
// @soulbeast-unit 0423-weaponRecommendation

function weaponRecommendation(){if(!S.P)return null;const P=S.P,old=EQ[P.eq.weapon],wt=clsWeapon(P.cls),magic=WT[wt]?.t==='m',primary=magic?'matk':'patk',weights={hp:.04,mp:.025,patk:magic?.2:3,matk:magic?3:.2,pdef:.16,mdef:.16,acc:.28,eva:.15,spd:.6,crit:1.2};const score=it=>Object.entries(it.st||{}).reduce((n,[k,v])=>n+v*(weights[k]||0),0);const current=score(old||{});return [...new Set(P.owned)].filter(id=>{const it=EQ[id];return it?.slot==='weapon'&&it.wt===wt&&it.lv<=P.lv&&id!==P.eq.weapon&&(it.st?.[primary]||0)>=(old?.st?.[primary]||0)}).map(id=>({id,it:EQ[id],gain:score(EQ[id])-current})).filter(x=>x.gain>.01).sort((a,b)=>b.gain-a.gain)[0]||null}
// @soulbeast-end 0423-weaponRecommendation
// @soulbeast-unit 0424-advicePanel

function advicePanel(){const P=S.P,pending=P.pets.filter(p=>(p.free||0)>0),weapon=weaponRecommendation();if(!pending.length&&!weapon)return '';return `<aside class="card stack adventure-advice"><div class="row"><h3 class="grow">✦ คำแนะนำการเตรียมตัว</h3></div>${pending.length?`<div class="row wrap"><div class="grow"><b>อสูร ${pending.length} ตัวมีแต้มที่ยังไม่ใช้</b><small class="sub">${pending.reduce((n,p)=>n+p.free,0)} แต้มรวม · รวมอสูรที่พักค่าย</small></div><button class="btn sm" data-a="pendingPets">ดูอสูรที่มีแต้ม</button></div>`:''}${weapon?`<div class="row wrap"><div class="grow"><b>มีอาวุธที่ค่าสถานะน่าใช้กว่า: ${esc(weapon.it.n)}</b><small class="sub">เทียบกับอาวุธที่สวม ใช้ได้กับอาชีพและเลเวลปัจจุบัน · ไม่รวมความได้เปรียบของธาตุและสกิลพิเศษ</small></div><button class="btn sm" data-a="recommendedWeapon">เปรียบเทียบอาวุธ</button></div>`:''}</aside>`}
// @soulbeast-end 0424-advicePanel
// @soulbeast-unit 0449-autoStatsAll

function autoStatsAll(){if(statsLocked()){toast('จบการต่อสู้ก่อนอัปสถานะ');return}const ids=['P',...S.P.pets.map(p=>p.uid)];AUTO_STAT_BATCH=true;try{for(const id of ids)autoStats(id)}finally{AUTO_STAT_BATCH=false}save();render();toast('จัดสรรแต้มตัวละครและอสูรทุกตัวแล้ว')}
// @soulbeast-end 0449-autoStatsAll
// @soulbeast-unit 0450-allStatsButton

function allStatsButton(){const n=(S.P.free||0)+S.P.pets.reduce((n,p)=>n+(p.free||0),0);return `<button class="btn pri" data-a="autoStatsAll" ${!n||statsLocked()?'disabled':''}>✦ อัปสถานะอัตโนมัติทั้งทีม · ${n} แต้ม</button>`}
// @soulbeast-end 0450-allStatsButton
// @soulbeast-unit 0724-focusForestChoices

function focusForestChoices(){
 const fork=S.screen==='zone'&&!S.battle&&!S.zone?.ev?S.zone?.fork:null;
 if(!fork){forestForkShown=null;return;}
 if(forestForkShown===fork)return;
 forestForkShown=fork;
 const target=document.querySelector('[data-a="fork"]')?.closest?.('.grid2');
 target?.scrollIntoView?.({block:'start',behavior:'instant'});
}
// @soulbeast-end 0724-focusForestChoices
// @soulbeast-unit 0725-forestFocusRender

const forestFocusRender=render;
// @soulbeast-end 0725-forestFocusRender
// @soulbeast-unit 0726-render

render=function(){forestFocusRender();focusForestChoices();};
// @soulbeast-end 0726-render
// @soulbeast-unit 0727-forestFocusContinue

const forestFocusContinue=handlers.cont;
// @soulbeast-end 0727-forestFocusContinue
// @soulbeast-unit 0729-focusForestChoicesAfterContinue

function focusForestChoicesAfterContinue(){
 // The original continue handler resets scroll after rendering.
 forestForkShown=null;focusForestChoices();
}
// @soulbeast-end 0729-focusForestChoicesAfterContinue
// @soulbeast-unit 0746-balanceAllocation

const balanceAllocation=allocationPlan;
// @soulbeast-end 0746-balanceAllocation
// @soulbeast-unit 0747-allocationPlan

allocationPlan=function(p=null){const plan=balanceAllocation(p),primary=p?(SP[p.sp].b[3]>SP[p.sp].b[2]?'matk':'patk'):(WT[clsWeapon(S.P.cls)].t==='m'?'matk':'patk');plan.primary=primary;plan.weights.hp=Math.max(3,plan.weights.hp||0);plan.weights[primary]=Math.max(3,plan.weights[primary]||0);return plan;};
// @soulbeast-end 0747-allocationPlan
// @soulbeast-unit 0748-autoStats

autoStats=function(uid){if(statsLocked())return toast('อัปสถานะได้หลังจบการต่อสู้');const hero=uid==='P',o=hero?S.P:petBy(Number(uid));if(!o)return;const used=Object.values(o.pts||{}).reduce((n,v)=>n+(Number(v)||0),0),n=Math.min(Math.max(0,Math.floor(Number(o.free)||0)),Math.max(0,(o.lv-1)*(hero?5:3)-used));if(!n)return;const before=hero?pStats():calcPet(o),hp=o.hp,mp=o.mp,plan=allocationPlan(hero?null:o),keys=Object.keys(plan.weights);o.pts=o.pts||{};for(let i=0;i<n;i++){const k=i===0?plan.primary:i===1?'hp':keys.reduce((a,k)=>plan.weights[k]/((o.pts[k]||0)+1)>plan.weights[a]/((o.pts[a]||0)+1)?k:a,keys[0]);o.pts[k]=(o.pts[k]||0)+1;}o.free-=n;const after=hero?pStats():calcPet(o);o.hp=hp>0?Math.min(after.hp,hp+after.hp-before.hp):0;o.mp=Math.min(after.mp,Math.max(0,mp+after.mp-before.mp));if(AUTO_STAT_BATCH)return;save();render();toast('จัดสรร '+n+' แต้มตาม'+plan.name+' แล้ว');};
// @soulbeast-end 0748-autoStats
// @soulbeast-unit 0749-EvolutionNotice

const EvolutionNotice={queue:[],playing:false};
// @soulbeast-end 0749-EvolutionNotice
// @soulbeast-unit 0750-balanceGainExp

const balanceGainExp=gainExp;
// @soulbeast-end 0750-balanceGainExp
// @soulbeast-unit 0751-gainExp

gainExp=function(o,amount,hero){const old=o.form||0,lines=balanceGainExp(o,amount,hero);if(!hero&&(o.form||0)>old){for(let f=old+1;f<=o.form;f++)EvolutionNotice.queue.push({sp:o.sp,from:f-1,to:f});setTimeout(showEvolutionNotice,0);}return lines;};
// @soulbeast-end 0751-gainExp
// @soulbeast-unit 0752-showEvolutionNotice

function showEvolutionNotice(){if(EvolutionNotice.playing||!EvolutionNotice.queue.length)return;EvolutionNotice.playing=true;const e=EvolutionNotice.queue.shift(),overlay=document.createElement('div');overlay.className='evolution-notice';overlay.setAttribute('role','status');overlay.innerHTML='<div class="evolution-panel"><div class="evolution-rays"></div><h2>อสูรพัฒนาร่าง!</h2><div class="evolution-portraits">'+portrait(e.sp,100,{form:e.from})+'<span>✦</span>'+portrait(e.sp,150,{form:e.to})+'</div><h3>'+esc(formName(e.sp,e.to))+'</h3><p>'+esc(formName(e.sp,e.from))+' พัฒนาร่างแล้ว</p></div>';document.body.appendChild(overlay);ExtraAudio.play('evolution');setTimeout(()=>{overlay.remove();EvolutionNotice.playing=false;showEvolutionNotice();},3000);}
// @soulbeast-end 0752-showEvolutionNotice
// @soulbeast-unit 0820-HeroLevelNotice

const HeroLevelNotice={queue:[],playing:false};
// @soulbeast-end 0820-HeroLevelNotice
// @soulbeast-unit 0821-showHeroLevelNotice

function showHeroLevelNotice(){if(HeroLevelNotice.playing||!HeroLevelNotice.queue.length)return;if(EvolutionNotice.playing){setTimeout(showHeroLevelNotice,300);return;}HeroLevelNotice.playing=true;const n=HeroLevelNotice.queue.shift(),el=document.createElement('div');el.className='hero-level-notice';el.setAttribute('role','status');el.innerHTML='<div><small>✦ LEVEL UP ✦</small><h2>'+esc(n.name)+'</h2><strong>Lv '+n.from+' → Lv '+n.to+'</strong></div>';document.body.appendChild(el);setTimeout(()=>{el.remove();HeroLevelNotice.playing=false;showHeroLevelNotice();},1800);}
// @soulbeast-end 0821-showHeroLevelNotice
// @soulbeast-unit 0822-notifyHeroLevels

function notifyHeroLevels(o,from){for(let lv=from;lv<o.lv;lv++)HeroLevelNotice.queue.push({name:o.name,from:lv,to:lv+1});setTimeout(showHeroLevelNotice,0);}
// @soulbeast-end 0822-notifyHeroLevels
// @soulbeast-unit 0823-playEvolutionNotice

const playEvolutionNotice=showEvolutionNotice;
// @soulbeast-end 0823-playEvolutionNotice
// @soulbeast-unit 0824-showEvolutionNotice
showEvolutionNotice=function(){if(HeroLevelNotice.playing||HeroLevelNotice.queue.length){setTimeout(showEvolutionNotice,300);return;}return playEvolutionNotice();};
// @soulbeast-end 0824-showEvolutionNotice
// @soulbeast-unit 0825-playGainExp

const playGainExp=gainExp;
// @soulbeast-end 0825-playGainExp
// @soulbeast-unit 0826-gainExp
gainExp=function(o,amount,isP){const from=o.lv,result=playGainExp(o,amount,isP);if(isP)notifyHeroLevels(o,from);return result;};
// @soulbeast-end 0826-gainExp
// @soulbeast-unit 0838-growthCrystalExp


// Crystal experience stops exactly at the owner's level, without banking overflow.
function growthCrystalExp(p,amount){const cap=Math.min(MAXLV,Math.max(1,Math.floor(S.P.lv)));if(p.lv>=cap)return 0;let remaining=-(Math.max(0,Number(p.exp)||0));for(let lv=p.lv;lv<cap;lv++)remaining+=need(lv);return Math.max(0,Math.min(amount,remaining));}
// @soulbeast-end 0838-growthCrystalExp
// @soulbeast-unit 0906-progressionHeroNotice

const progressionHeroNotice=showHeroLevelNotice;
// @soulbeast-end 0906-progressionHeroNotice
// @soulbeast-unit 0907-showHeroLevelNotice

showHeroLevelNotice=function(){try{return progressionHeroNotice();}catch(error){HeroLevelNotice.playing=false;HeroLevelNotice.queue.length=0;document.querySelectorAll('.hero-level-notice').forEach(el=>el.remove());console.warn('Skipped hero level animation',error);}};
// @soulbeast-end 0907-showHeroLevelNotice
// @soulbeast-unit 0908-progressionEvolutionNotice

const progressionEvolutionNotice=showEvolutionNotice;
// @soulbeast-end 0908-progressionEvolutionNotice
// @soulbeast-unit 0909-showEvolutionNotice

showEvolutionNotice=function(){try{return progressionEvolutionNotice();}catch(error){EvolutionNotice.playing=false;EvolutionNotice.queue.length=0;document.querySelectorAll('.evolution-notice').forEach(el=>el.remove());console.warn('Skipped evolution animation',error);}};
// @soulbeast-end 0909-showEvolutionNotice
// @soulbeast-unit 1047-classCombatFactor

// Solo Demon Lord encounter: support underperforming final careers without changing PVP or other stages.
const SOLO_DEMON_CAREER_DAMAGE={"shogun":1.75,"dirge":1.3,"archmage":1.6,"elementalist":1.95};
function soloDemonCareerFactor(u){return B()?.kind==='boss'&&Number(B().meta)===6&&u.kind==='player'&&!u.temporary?(SOLO_DEMON_CAREER_DAMAGE[u.cls]||1):1;}
function gunnerBossBountyFactor(u,t){return u.kind==='player'&&!u.temporary&&u.cls&&baseOf(u.cls)==='gunner'&&u.lv>=55&&t?.boss?1.6:1;}
function classCombatFactor(u,t,sk){const type=sk.t==='auto'?u.atkType:sk.t;let f=t.boss&&['pet','npcpet'].includes(u.kind)?.7:1;if(isBalancedPvp()&&u.kind==='pet'){const n=Math.max(1,sideOf(u).filter(x=>x.kind==='pet'&&x.owner===u.owner&&x.hp>0).length);const hero=sideOf(u).find(x=>x.kind==='player'&&x.owner===u.owner),growth=hero?.cls&&baseOf(hero.cls)==='summoner'?.35:.15;f*=(1+growth*(n-1))/n;if(t.kind==='player')f*=.7;}if(u.cls&&baseOf(u.cls)==='thief'&&['p','h'].includes(type)){if(t.cls){const victim=baseOf(t.cls);if(['mage','gunner','archer'].includes(victim))f*=isBalancedPvp()?1.15:1.25;else if(['gladiator','druid'].includes(victim))f*=isBalancedPvp()?.7:.4;}}
if(u.cls&&t.cls&&baseOf(t.cls)==='gladiator'&&['mage','archer'].includes(baseOf(u.cls)))f*=isBalancedPvp()?1.2:1.35;
if(isBalancedPvp()){if(u.cls==='packlord')f*=.75;if(t.cls==='packlord')f*=1.25;}
if(isBalancedPvp()&&u.cls&&baseOf(u.cls)==='mage'&&type==='m')f*=1.15;
if(u.cls==='gunsaint'&&type==='p')f*=.95;if(hasPas(u,'arcaneMastery')&&type==='m')f*=1.15;return f*soloDemonCareerFactor(u)*gunnerBossBountyFactor(u,t);}
// @soulbeast-end 1047-classCombatFactor
// @soulbeast-unit 1068-balanceCareerPanel

const balanceCareerPanel=careerPanel;
// @soulbeast-end 1068-balanceCareerPanel
// @soulbeast-unit 1069-careerPanel
careerPanel=function(cls){const base=baseOf(cls),note=base==='thief'?'ลอบสังหาร: โจมตีกายภาพใส่นักเวทย์ มือปืน และนักธนูแรงขึ้น 25% แต่ใส่กลาดิเอเตอร์และดรูอิดเบาลง 60% (PVP: แรงขึ้น 15% และเบาลง 30% ตามลำดับ)':base==='gladiator'?'ตั้งรับสวนกลับ: สะท้อนกายภาพ 15% และมีโอกาสสวน 25% โจมตีโจรมีความแม่นยำขั้นต่ำ 80% แต่รับมือเวทและการยิงของนักธนูได้ยากขึ้น':base==='druid'?'ผิวพงไพร: สะท้อนกายภาพ 15% โจรไม่สามารถคริติคอลใส่ได้ และมีความแม่นยำขั้นต่ำ 80% เวลาโจมตีโจร':base==='mage'||base==='archer'?'เจาะแนวหน้า: โจมตีผู้สืบสายกลาดิเอเตอร์แรงขึ้น 35% (PVP 20%) นักธนูเจาะเกราะกลาดิเอเตอร์เพิ่ม 30% แต่ต้องระวังการลอบสังหารของโจร':'';return balanceCareerPanel(cls)+(cls==='packlord'?'<p class="sub">PVP: แบ่งพลังนำฝูง ดาเมจผู้ผนึก 75% และรับดาเมจ 125% เพื่อแลกกับความคล่องตัวและอสูรสองตัว</p>':'')+(note?'<p class="sub">'+note+'</p>':'');};
// @soulbeast-end 1069-careerPanel
// @soulbeast-unit 1072-progressionRewardExp


// Reward-only scaling: fixed-value crystals and previously earned EXP stay intact.
function progressionRewardExp(o,amount){const rate=o.lv>=40?.85*.85:o.lv>=25?.85:1;return Math.max(0,Math.round(amount*rate));}
// @soulbeast-end 1072-progressionRewardExp
