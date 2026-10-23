// State, constants and shared utilities
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0000-ExpressionStatement

'use strict';
// @soulbeast-end 0000-ExpressionStatement
// @soulbeast-unit 0001-K

/* ================= CORE STATS ================= */
const K=['hp','mp','patk','matk','pdef','mdef','acc','eva','spd','crit'];
// @soulbeast-end 0001-K
// @soulbeast-unit 0003-SH

const SH={hp:'HP',mp:'MP',patk:'ตีกาย',matk:'ตีเวทย์',pdef:'กันกาย',mdef:'กันเวทย์',acc:'แม่นยำ',eva:'หลบ',spd:'เร็ว',crit:'คริ'};
// @soulbeast-end 0003-SH
// @soulbeast-unit 0005-PB-PG

const PB=[60,30,8,8,5,5,90,8,10,5], PG=[6,3,1,1,1,1,1,.8,.6,.1];
// @soulbeast-end 0005-PB-PG
// @soulbeast-unit 0006-MAXLV-FM

const MAXLV=60, FM=[1,1.2,1.4], SKLV=[1,5,11,18], SIGLV=12;
// @soulbeast-end 0006-MAXLV-FM
// @soulbeast-unit 0007-grow

const grow=(k,b)=>({hp:b*.2,mp:b*.12,acc:1.1,eva:.5+b*.03,spd:b*.08,crit:.1})[k] ?? b*.17;
// @soulbeast-end 0007-grow
// @soulbeast-unit 0010-typeMult

const typeMult=(el,types)=>Array.isArray(el)?el.reduce((m,e)=>m*typeMult(e,types),1):!el||!types?1:types.reduce((m,t)=>m*((TC[el]&&TC[el][t])??1),1);
// @soulbeast-end 0010-typeMult
// @soulbeast-unit 0039-SEALS

const SEALS=SoulbeastContent.SEALS();
// @soulbeast-end 0039-SEALS
// @soulbeast-unit 0041-STARTERS

const STARTERS=SoulbeastContent.STARTERS();
// @soulbeast-end 0041-STARTERS
// @soulbeast-unit 0042-MAXPETS

const MAXPETS=80;
// @soulbeast-end 0042-MAXPETS
// @soulbeast-unit 0056-forEach

[['nekomata','amabie'],['kinnaree','salamander'],['cyclops','wendigo'],['bunyip','wyvern'],['roc','rajasi']].forEach((a,i)=>ZN[i].sp.push(...a));
// @soulbeast-end 0056-forEach
// @soulbeast-unit 0066-ZN-push

ZN.push({id:6,n:'ปราสาทจอมมาร',d:'ป้อมปราการทมิฬบนยอดเหว ทุกห้องมีปีศาจเฝ้า จอมมารรออยู่บนบัลลังก์ชั้นบนสุด',lv:[40,50],sp:['cerberus','basilisk','jiangshi','gargoyle','banshee','ifrit','nidhogg','ammit','wendigo'],rare:['fenrir','phoenix'],boss:{sp:'demonlord',lv:60,n:'จอมมารผู้ครองรัตติกาล'},mini:0,final:1});
// @soulbeast-end 0066-ZN-push
// @soulbeast-unit 0070-ExpressionStatement

(()=>{const i=5,z=6,set=LGA[i];
 for(const sl in set){const [n,pas,sk]=set[sl],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(2,Math.round(SLOTBASE[sl][k]*TIERS[i][2]*1.6));EQ[`lg${z}_${sl}`]={n,slot:sl,lv:LGLV[i],price:3000*z,st,pas,...(sk?{sk}:{}),legend:z}}
 const [wn,el,skn,def,pas]=LGW[i];
 for(const type in WT){const st=wStats(type,z);for(const k in st)st[k]=Math.round(st[k]*1.2);const ws=`lgs${z}_${type}`;SK[ws]={n:skn,t:WT[type].t,el,mp:20,...def};EQ[`lg${z}_weapon_${type}`]={n:WT[type].n+wn,slot:'weapon',wt:type,t:WT[type].t,lv:LGLV[i],price:4000*z,st,el,ws,pas,legend:z}}})();
// @soulbeast-end 0070-ExpressionStatement
// @soulbeast-unit 0076-Object-keys

Object.keys(SP).filter(k=>!SP[k].noseal).forEach((k,idx)=>{const s=SP[k],zi=zoneOfSp(k),sl=CSL[idx%9],fn=s.ev?s.ev[s.ev.length-1][1]:s.n,mul=1.35*(s.rare?1.12:1),skl=s.sig||s.sk[3];
 const mats=[[k+'|0',s.rare?2:3+zi],[k+'|1',s.rare?1:2+Math.floor(zi/2)]],gold=Math.round(150*(zi+1)**2*(s.rare?2:1)),lv=[5,11,18,26,35,44][zi];
 CRAFT[k]={sl,mats,gold,lv,zi};
 if(sl==='weapon'){for(const type in WT){const st=wStats(type,Math.min(6,zi+1));for(const x in st)st[x]=Math.round(st[x]*1.1*(s.rare?1.1:1));EQ[`cf_${k}_${type}`]={n:WT[type].n+fn,slot:'weapon',wt:type,t:WT[type].t,lv,price:gold,st,el:s.t[0],ws:skl,pas:s.pas,craft:k}}}
 else{const st={};for(const x in SLOTBASE[sl])st[x]=Math.max(2,Math.round(SLOTBASE[sl][x]*TIERS[zi][2]*mul));EQ[`cf_${k}`]={n:SLOTN[sl]+fn,slot:sl,lv,price:gold,st,pas:s.pas,sk:skl,craft:k}}});
// @soulbeast-end 0076-Object-keys
// @soulbeast-unit 0077-ZN-push


/* ================= v8: training forest ================= */
ZN.push({id:7,n:'ป่าฝึกหัด',d:'ป่าเล็กหลังเมือง อสูรตัวเล็กไม่ดุร้าย เหมาะสำหรับผู้ผนึกมือใหม่ฝึกต่อสู้และเก็บเลเวล',lv:[1,4],sp:['kappa','wisp','mandrake','jackalope','tanuki','pixie','kodama'],rare:['qilin','unicorn'],boss:{sp:'jackalope',lv:5,n:'หัวหน้าฝูงแจ็กคาโลป'},mini:0,train:1});
// @soulbeast-end 0077-ZN-push
// @soulbeast-unit 0094-ZN-lv

ZN[0].lv=[4,9];
// @soulbeast-end 0094-ZN-lv
// @soulbeast-unit 0095-ZN-forEach

ZN.forEach(z=>{const candidates=NEW_BEASTS.filter((x,i)=>i>=10&&i<22&&x[4]===z.id);z.bosses=[z.boss,...candidates.map(x=>({sp:x[0],lv:z.boss.lv,n:x[1]}))];while(z.bosses.length<3){const sp=z.sp[z.bosses.length%z.sp.length];z.bosses.push({sp,lv:z.boss.lv,n:'ราชันย์'+SP[sp].n})}});
// @soulbeast-end 0095-ZN-forEach
// @soulbeast-unit 0098-cooldownOf

/* Per-unit cooldown: cd=1 blocks the next personal turn. */
function cooldownOf(u,id){return Math.max(0,(u.cooldowns||{})[id]||0)}
// @soulbeast-end 0098-cooldownOf
// @soulbeast-unit 0101-effectiveElement

// An enchanted attack keeps its own non-neutral element and adds the sword element.
// Neutral is replaced; repeated elements never stack. Support skills are unaffected.
function effectiveElement(u,sk){
 const base=sk===SK.attack?(u.stab||[])[0]||'normal':sk.el||'normal';
 if(!u.enchant||!['p','m','h','auto'].includes(sk.t))return base;
 const elements=[...new Set([base,u.enchant])].filter(el=>el!=='normal');
 return elements.length>1?elements:elements[0]||base;
}
function attackHasElement(u,sk,el){const value=effectiveElement(u,sk);return Array.isArray(value)?value.includes(el):value===el;}
function attackMultiplier(u,sk,t){return typeMult(effectiveElement(u,sk),t.types)*(attackHasElement(u,sk,'ground')&&hasPas(t,'levitate')?0:1);}
// @soulbeast-end 0101-effectiveElement
// @soulbeast-unit 0103-scoreValue

function scoreValue(e){return Math.round(Math.max(1,e.lv||1)*(['human','player'].includes(e.kind)?15:e.boss?30:e.rare?20:8))}
// @soulbeast-end 0103-scoreValue
// @soulbeast-unit 0105-S-IMG

let S=null, IMG={};
// @soulbeast-end 0105-S-IMG
// @soulbeast-unit 0109-R

const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
// @soulbeast-end 0109-R
// @soulbeast-unit 0110-pick

const pick=a=>a[Math.floor(Math.random()*a.length)];
// @soulbeast-end 0110-pick
// @soulbeast-unit 0111-clamp

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// @soulbeast-end 0111-clamp
// @soulbeast-unit 0112-fmt

const fmt=n=>Math.round(n).toLocaleString(gameLocale());
// @soulbeast-end 0112-fmt
// @soulbeast-unit 0116-rnd

function rnd(s){for(const k in s)s[k]=Math.round(s[k]);return s}
// @soulbeast-end 0116-rnd
// @soulbeast-unit 0117-wsel

function wsel(obj){const t=Object.values(obj).reduce((a,b)=>a+b,0);let r=Math.random()*t;for(const k in obj){r-=obj[k];if(r<0)return k}return Object.keys(obj)[0]}
// @soulbeast-end 0117-wsel
// @soulbeast-unit 0119-tierOf

const tierOf=k=>chain(k).length-1;
// @soulbeast-end 0119-tierOf
// @soulbeast-unit 0120-baseOf

const baseOf=k=>chain(k)[0];
// @soulbeast-end 0120-baseOf
// @soulbeast-unit 0121-childrenOf

const childrenOf=k=>Object.keys(CLS).filter(c=>CLS[c].p===k);
// @soulbeast-end 0121-childrenOf
// @soulbeast-unit 0128-isMerchant

const isMerchant=()=>S.P&&baseOf(S.P.cls)==='merchant';
// @soulbeast-end 0128-isMerchant
// @soulbeast-unit 0133-humanSkills

function humanSkills(cls,lv,eq){const a=['attack',...clsSkills(cls,lv)];for(const sl in eq){const it=EQ[eq[sl]];if(!it)continue;if(it.ws)a.push(it.ws);if(it.sk)a.push(it.sk)}return [...new Set(a)]}
// @soulbeast-end 0133-humanSkills
// @soulbeast-unit 0134-humanPas

function humanPas(cls,eq){const a=[...clsPas(cls)];for(const sl in eq){const it=EQ[eq[sl]];if(it&&it.pas)a.push(it.pas)}return a}
// @soulbeast-end 0134-humanPas
// @soulbeast-unit 0139-sigLearned

const sigLearned=p=>{const s=SP[p.sp];if(!s.sig)return false;return s.rare?p.lv>=SIGLV:s.ev?(p.form||0)>=s.ev.length:false};
// @soulbeast-end 0139-sigLearned
// @soulbeast-unit 0146-mistBaseCalcPet

const mistBaseCalcPet=calcPet;
// @soulbeast-end 0146-mistBaseCalcPet
// @soulbeast-unit 0147-calcPet

calcPet=function(p,wild=1){
 const sp=SP[p.sp];
 if(sp.legendary){const s=calcPet({...p,sp:sp.rarePair,form:0},wild);for(const k of K)s[k]=Math.round(s[k]*1.2);return s;}
 const s=mistBaseCalcPet(p,wild);if(sp.mistNew)for(const k of K)s[k]=Math.round(s[k]*1.2);return s;
};
// @soulbeast-end 0147-calcPet
// @soulbeast-unit 0152-mkPet

function mkPet(sp,lv,form){const p={uid:S.P.uid++,sp,lv,form:form??formFor(sp,lv),exp:0,pts:{},free:(lv-1)*3};const s=calcPet(p);p.hp=s.hp;p.mp=s.mp;return p}
// @soulbeast-end 0152-mkPet
// @soulbeast-unit 0162-originalRecordedCry

const originalRecordedCry=ExtraAudio.cry.bind(ExtraAudio);
// @soulbeast-end 0162-originalRecordedCry
// @soulbeast-unit 0164-originalRecordedSkill

const originalRecordedSkill=ExtraAudio.skill.bind(ExtraAudio);
// @soulbeast-end 0164-originalRecordedSkill
// @soulbeast-unit 0174-BUILTIN_SCENES

const BUILTIN_SCENES=["assets/media/00f53b8f7c9f2ca72cd3aa25.webp","assets/media/460b762d271285c444b0f7fa.webp","assets/media/9f874523f68aaee38228c336.webp","assets/media/7b63623a4da1696d8900ee85.webp","assets/media/2b4acea7597147820ef3dc33.webp","assets/media/f75bd1fb3cf1f171238074c2.webp","assets/media/94a9040dc15df70ec17bce99.webp","assets/media/d6b72b71224bc4f802364d81.webp","assets/media/441f2850a4d085c9a53196cc.webp"];
// @soulbeast-end 0174-BUILTIN_SCENES
// @soulbeast-unit 0179-walkTimer

let walkTimer=null;
// @soulbeast-end 0179-walkTimer
// @soulbeast-unit 0198-sceneArt

function sceneArt(index,title='',small=false){return `<div class="scene ${small?'small':''}"><img class="scene-art" src="${BUILTIN_SCENES[index]}" alt="${esc(title)}">${title?`<div class="scene-caption"><small>ตำนานผนึกอสูร</small><${small?'h3':'h1'}>${esc(title)}</${small?'h3':'h1'}></div>`:''}</div>`}
// @soulbeast-end 0198-sceneArt
// @soulbeast-unit 0209-multTxt

const multTxt=m=>m===1?'':`<span class="eff ${m>1?'up':m===0?'zero':'down'}">×${m===.5?'½':m===.25?'¼':m}</span>`;
// @soulbeast-end 0209-multTxt
// @soulbeast-unit 0213-statLine

function statLine(st){return Object.entries(st).map(([k,v])=>`${SH[k]} +${v}`).join(' · ')}
// @soulbeast-end 0213-statLine
// @soulbeast-unit 0214-itemName

const itemName=it=>it.legend?`<span class="lgn">✦ ${it.n}</span>`:it.n;
// @soulbeast-end 0214-itemName
// @soulbeast-unit 0222-ELSHAPE

const ELSHAPE={ice:'shard',electric:'shard',rock:'shard',steel:'shard',grass:'leaf',bug:'leaf',fairy:'star',psychic:'star',dragon:'star'};
// @soulbeast-end 0222-ELSHAPE
// @soulbeast-unit 0228-skillIntensity

function skillIntensity(id){const sk=SK[id]||{},pw=(sk.basePower||sk.pw||0)*(sk.hits||1),level=Math.max(SPELL_UNLOCK[id]||0,Number((id.match(/^ms_.*?(\d+)$/)||[])[1]||0));let tier=0;
 if(level>=50||pw>=320||(sk.ct&&pw>=220)||['s_demon','wb_storm','s_dragon','s_phoenix','el_omni'].includes(id))tier=3;
 else if(level>=40||pw>=220||sk.revAll||sk.summon||sk.immune||/^s_/.test(id)||/^ws_.*5$/.test(id))tier=2;
 else if(level>=20||pw>=145||sk.tg==='team')tier=1;
 if(['attack','rest','wb_guard'].includes(id))tier=0;return tier;}
// @soulbeast-end 0228-skillIntensity
// @soulbeast-unit 0239-npcEq

function npcEq(cls,lv){const t=WLV.reduce((a,l,i)=>lv>=l?i:a,0),g=TIERS.reduce((a,x,i)=>lv>=x[1]?i:a,0);return {weapon:`wp_${clsWeapon(cls)}${t}`,armor:'armor_'+g,gloves:'gloves_'+g,boots:'boots_'+g}}
// @soulbeast-end 0239-npcEq
// @soulbeast-unit 0244-uById

const uById=id=>allU().find(u=>u.id===id);
// @soulbeast-end 0244-uById
// @soulbeast-unit 0251-newRound

function newRound(){const b=B();b.round++;const sp=u=>eff(u,'spd')*(b.round===1&&hasPas(u,'firstblood')?2:1);
 const ord=allU().filter(u=>u.hp>0).map(u=>[u,sp(u)*(0.97+Math.random()*.06)]).sort((x,y)=>class10OpeningOrder(x[0],y[0],b)||y[1]-x[1]);b.queue=[];
 ord.forEach(([u])=>{b.queue.push(u.id);const opp=foesOf(u).filter(x=>x.hp>0);if(opp.length&&sp(u)>=2*Math.max(...opp.map(sp)))b.queue.push(u.id+'*')});advance()}
// @soulbeast-end 0251-newRound
// @soulbeast-unit 0253-releaseCharge

function releaseCharge(u){const b=B();if(!b||b.over)return;const c=u.charging;u.charging=null;u.pendingStealthChargeCrit=!!c.stealthCrit;const t=c.tid&&uById(c.tid);blog(`${u.name} ปลดปล่อยพลัง!`);act(u,c.id,t&&t.hp>0?t:null,null,true);if(checkEnd()){render();return}battleLater(advance,650);render()}
// @soulbeast-end 0253-releaseCharge
// @soulbeast-unit 0254-checkEnd

function checkEnd(){const b=B();if(b.over)return true;if(b.allies[0].hp<=0){endBattle('lose');return true}if(b.enemies.every(e=>e.hp<=0)){endBattle('win');return true}return false}
// @soulbeast-end 0254-checkEnd
// @soulbeast-unit 0258-advance

function advance(){const b=B();if(!b||b.over)return;if(S.ui.trapNotice){battleLater(advance,150);return}b.fx=[];if(checkEnd()){render();return}
 while(b.queue.length){const q=b.queue.shift(),extra=q.endsWith('*'),u=uById(q.replace('*',''));if(!u||u.hp<=0)continue;
  if(!extra&&turnStart(u)){if(checkEnd()){render();return}continue}
  if(extra&&(u.status.freeze||u.status.sleep))continue;
  b.cur=u.id;b.extra=extra;if(extra)blog(`${u.name} เร็วกว่าเกิน 2 เท่า ได้เคลื่อนไหวอีกครั้ง!`);
  if(u.charging){b.menu='wait';battleLater(()=>releaseCharge(u),550);render();return}if(!(b.enemies[b.target]&&b.enemies[b.target].hp>0))b.target=b.enemies.findIndex(e=>e.hp>0);
  if(u.side==='enemy'||teamAutoUnit(u)){b.menu='wait';battleLater(aiAct,u.side==='enemy'?700:450);render()}else{b.menu='main';render()}
  return}
 newRound()}
// @soulbeast-end 0258-advance
// @soulbeast-unit 0260-addBuffs

function addBuffs(x,sk){if(sk.bf)for(const k in sk.bf)x.buffs.push({st:k,amt:sk.bf[k],tn:(sk.tn||3)+1});if(sk.pas)x.buffs.push({pas:sk.pas,tn:(sk.tn||3)+1})}
// @soulbeast-end 0260-addBuffs
// @soulbeast-unit 0281-enemyGrade

function enemyGrade(u){const b=B();const zone=S.zone&&ZN[S.zone.id-1];let g=zone?(zone.train?1:zone.id):Math.ceil(u.lv/10);return clamp(g+(u.boss?1:0),1,6)}
// @soulbeast-end 0281-enemyGrade
// @soulbeast-unit 0313-wildGroup

function wildGroup(zd,ns){const n=+wsel(ns||{1:45,2:33,3:14,4:8}),hi=zd.lv[1]-(n>=3?2:n===2?1:0);
 return Array.from({length:n},(_,i)=>wildUnit(pick(zd.sp),R(zd.lv[0],Math.max(zd.lv[0],hi)),i))}
// @soulbeast-end 0313-wildGroup
// @soulbeast-unit 0316-pendingImg


/* ================= ACTIONS ================= */
let pendingImg=null;
// @soulbeast-end 0316-pendingImg
// @soulbeast-unit 0321-SHEET_URL

/* ---- leaderboard (shared rows: everyone reads, each player writes only their own) ---- */
/* ---- leaderboard on เซิร์ฟเวอร์ออนไลน์ (ระบบออนไลน์ web app; URL set in index.html) ---- */
const SHEET_URL=String(window.SHEET_URL||'').trim();
// @soulbeast-end 0321-SHEET_URL
// @soulbeast-unit 0324-pid

function pid(){const P=S.P;if(!P.pid){const a=new Uint8Array(12);try{crypto.getRandomValues(a)}catch(e){for(let i=0;i<12;i++)a[i]=Math.floor(Math.random()*256)}P.pid=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');save()}return P.pid}
// @soulbeast-end 0324-pid
// @soulbeast-unit 0333-CODE_AB

const CODE_AB='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// @soulbeast-end 0333-CODE_AB
// @soulbeast-unit 0334-ensureCode

function ensureCode(){const P=S.P;if(!P.code){const a=new Uint8Array(12);try{crypto.getRandomValues(a)}catch(e){for(let i=0;i<12;i++)a[i]=Math.floor(Math.random()*256)}P.code=[...a].map(x=>CODE_AB[x%CODE_AB.length]).join('');save()}return P.code}
// @soulbeast-end 0334-ensureCode
// @soulbeast-unit 0335-fmtCode

const fmtCode=c=>c.replace(/(.{4})(?=.)/g,'$1-');
// @soulbeast-end 0335-fmtCode
// @soulbeast-unit 0342-PENDING

let PENDING=null;
// @soulbeast-end 0342-PENDING
// @soulbeast-unit 0348-healCost

const healCost=()=>Math.max(1,Math.round((5+S.P.lv*4)*WorldTales.hospitalFactor()));
// @soulbeast-end 0348-healCost
// @soulbeast-unit 0356-ExpressionStatement

document.getElementById('saveFile')?.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>askLoadCode(rd.result);rd.readAsText(f)});
// @soulbeast-end 0356-ExpressionStatement
// @soulbeast-unit 0358-starterSel


/* ================= VIEWS ================= */
function starterSel(){const n=clsSum(S.ui.cls||'swordsman');let a=(S.ui.starters||[]).filter(k=>STARTERS.includes(k)).slice(0,n);if(!a.length)a=STARTERS.slice(0,n);return a}
// @soulbeast-end 0358-starterSel
// @soulbeast-unit 0383-statGrid

function statGrid(s,free,act,uid){return `<div class="statgrid">${K.map(k=>`<span>${LBL[k]}</span><span class="num">${s[k]}</span>${free>0?`<button class="btn sm" style="min-height:28px;padding:2px 10px" data-a="${act}" data-v="${uid!=null?uid+':':''}${k}" aria-label="เพิ่ม ${LBL[k]}">+${PER[k]}</button>`:'<span></span>'}`).join('')}</div>`}
// @soulbeast-end 0383-statGrid
// @soulbeast-unit 0384-skillRow

function skillRow(id,on=true,lvTxt){const k=SK[id];return `<div class="row" style="${on?'':'opacity:.45'}"><div class="grow"><b>${k.n}</b> ${skillElementIcon(null,k,id)} <span class="chip" style="color:var(--muted)">${skTag(k)}</span>${k.mile?' <span class="chip" style="color:var(--gold)">สกิลพิเศษ</span>':''}<div class="sub" style="font-size:12px">${skillDesc(id)}</div></div>${lvTxt?`<span class="sub num" style="white-space:nowrap">${lvTxt}</span>`:''}</div>`}
// @soulbeast-end 0384-skillRow
// @soulbeast-unit 0397-TryStatement

try{const c=JSON.parse(localStorage.getItem('sealbeast_camp_v1')||'{}');if(c.endpoint===SHEET_URL){CAMP.roomId=c.room;CAMP.token=c.token||''}}catch(e){}
// @soulbeast-end 0397-TryStatement
// @soulbeast-unit 0398-applyAccount

function applyAccount(a){if(!a||!S.P)return;const P=S.P;P.gold+=(Number(a.delta)||0)-(Number(P.campApplied)||0);P.campApplied=Number(a.delta)||0;P.score=(P.score||0)+(Number(a.scoreDelta)||0)-(Number(P.campScoreApplied)||0);P.campScoreApplied=Number(a.scoreDelta)||0;if(a.name)P.name=a.name;P.renameAt=a.renameAt||0;worldApply(P,a.world);save()}
// @soulbeast-end 0398-applyAccount
// @soulbeast-unit 0402-profilePanel

function profilePanel(){const P=S.P;return `<div class="card stack"><h3>โปรไฟล์ผู้ผนึก</h3>${P.profile?`<img src="${esc(P.profile)}" alt="รูปโปรไฟล์" width="64" height="64" style="border-radius:50%">`:''}<button class="btn" data-a="img" data-v="profile">ใส่รูปโปรไฟล์สำหรับอันดับ</button><label>ชื่อใหม่ <input id="renameName" maxlength="20" value="${esc(P.name)}"></label><button class="btn" data-a="renameCharacter">เปลี่ยนชื่อ (สัปดาห์ละ 1 ครั้ง)</button><small>${P.renameAt?'เปลี่ยนชื่อครั้งถัดไป '+new Date(P.renameAt+7*86400000).toLocaleString(gameLocale()):''}</small></div>`}
// @soulbeast-end 0402-profilePanel
// @soulbeast-unit 0408-packLocked

function packLocked(){return !!(S.zone||S.battle||PVP.room?.status==='active'||CAMP.room?.status==='active'||WORLD.room?.status==='active')}
// @soulbeast-end 0408-packLocked
// @soulbeast-unit 0409-movePet

function movePet(id,carry){normalizePack();const P=S.P,p=petBy(Number(id));if(!p)return false;if(packLocked()){toast('กลับเมืองและจบการต่อสู้ก่อนจัดอสูรกับค่าย');return false}if(carry){if(P.carried.includes(p.uid))return true;if(P.carried.length>=carryLimit()){toast('กระเป๋าเต็ม ฝากอสูรไว้ที่ค่ายก่อน');return false}if(CAMP.pet===p.uid){toast('ตัวนี้กำลังเฝ้าค่าย เปลี่ยนผู้เฝ้าค่ายก่อนนำติดตัว');return false}P.carried.push(p.uid)}else{P.carried=P.carried.filter(x=>x!==p.uid);P.party=P.party.filter(x=>x!==p.uid)}fixParty();save();render();return true}
// @soulbeast-end 0409-movePet
// @soulbeast-unit 0410-toggleActive

function toggleActive(id){normalizePack();const P=S.P,p=petBy(Number(id));if(!p)return;if(S.battle||PVP.room?.status==='active'||CAMP.room?.status==='active'||WORLD.room?.status==='active'){toast('จัดทีมหลังจบการต่อสู้ หรือใช้คำสั่งเรียกอสูรระหว่างสู้');return}if(!P.carried.includes(p.uid)){if(S.zone){toast('อสูรตัวนี้พักที่ค่าย ต้องกลับเมืองก่อน');return}if(!movePet(p.uid,true))return}if(P.party.includes(p.uid))P.party=P.party.filter(x=>x!==p.uid);else{if(P.party.length>=clsSum(P.cls))P.party.shift();P.party.push(p.uid)}save();render()}
// @soulbeast-end 0410-toggleActive
// @soulbeast-unit 0420-AUTO_STAT_BATCH

let AUTO_STAT_BATCH=false;
// @soulbeast-end 0420-AUTO_STAT_BATCH
// @soulbeast-unit 0428-toggleTeamAuto

function toggleTeamAuto(){const b=B();if(!b||b.over||!teamAutoAllowed())return;S.ui.autoTeam=!S.ui.autoTeam;const u=uById(b.cur);if(S.ui.autoTeam&&u&&u.side==='ally'&&b.menu!=='wait'){b.menu='wait';battleLater(aiAct,500)}save();render()}
// @soulbeast-end 0428-toggleTeamAuto
// @soulbeast-unit 0429-potionUseful

function potionUseful(it,o,st){if(!it||!o||!st)return false;if(it.rev)return o.hp<=0;if(it.hp||it.mp)return o.hp>0&&!!((it.hp&&o.hp<st.hp)||(it.mp&&o.mp<st.mp));return true}
// @soulbeast-end 0429-potionUseful
// @soulbeast-unit 0444-setInterval

setInterval(onlineClockTick,250);
// @soulbeast-end 0444-setInterval
// @soulbeast-unit 0481-TryStatement

try{const v=JSON.parse(localStorage.getItem('sealbeast_world_v1')||'{}');if(v.endpoint===SHEET_URL)WORLD.roomId=v.room||'';}catch(e){}
// @soulbeast-end 0481-TryStatement
// @soulbeast-unit 0489-setInterval

setInterval(()=>{if(S?.screen!=='world')return;const el=document.getElementById('wbCountdown');if(el&&WORLD.room?.status==='active')el.textContent='เหลือประมาณ '+Math.max(0,Math.ceil((WORLD.room.deadline-(Date.now()-WORLD.clock))/1000))+' วินาที';},500);
// @soulbeast-end 0489-setInterval
// @soulbeast-unit 0490-migrate


function migrate(){if(S.P){S.P.score=Number(S.P.score)||0;S.P.campApplied=Number(S.P.campApplied)||0;S.P.campScoreApplied=Number(S.P.campScoreApplied)||0}if(!S.P)return;const P=S.P;
 if(!P.cls){P.cls=P.style==='m'?'mage':'swordsman';delete P.style}
 if(!P.eq.weapon||!EQ[P.eq.weapon]){P.eq.weapon=`wp_${clsWeapon(P.cls)}0`}
 for(const sl in P.eq)if(!EQ[P.eq[sl]])delete P.eq[sl];
 const bad=P.owned.filter(id=>!EQ[id]);if(bad.length){P.gold+=bad.length*300;P.owned=P.owned.filter(id=>EQ[id])}
 P.pets=P.pets.filter(p=>SP[p.sp]);P.pets.forEach(p=>{if(p.form==null)p.form=formFor(p.sp,p.lv);p.pts=p.pts||{}});
 if(!P.party){P.party=P.active!=null?[P.active]:[];delete P.active}
 P.legend=P.legend||{};if(P.lv>=MAXLV){P.lv=MAXLV;P.exp=0}fixParty();S.ver=6}
// @soulbeast-end 0490-migrate
// @soulbeast-unit 0495-skillElementOnly

const skillElementOnly=skillElementIcon;
// @soulbeast-end 0495-skillElementOnly
// @soulbeast-unit 0500-LOCAL_REPLAYS

// Render the authenticated, already settled battle locally; no polling per animation frame.
const LOCAL_REPLAYS={};
// @soulbeast-end 0500-LOCAL_REPLAYS
// @soulbeast-unit 0501-localReplay

function localReplay(mode,room){if(!room?.replay?.frames?.length||room.status!=='finished')return;const key=mode+':'+room.id;if(LOCAL_REPLAYS[key])return;LOCAL_REPLAYS[key]=true;const state=mode==='camp'?CAMP:mode==='pvp'?PVP:WORLD,final=JSON.parse(JSON.stringify(room)),frames=room.replay.frames,battle=JSON.parse(JSON.stringify(room.replay.initial));let i=0;state.room={...room,status:'active',battle,replaying:true};function tick(){if(state.room?.id!==room.id)return;const prior=JSON.parse(JSON.stringify(state.room)),f=frames[i++];if(!f){state.room=final;render();return}applyClass10Replay(battle,f);for(const u of f.spawns||[])if(![...battle.allies,...battle.enemies].some(x=>x.id===u.id))(u.side==='ally'?battle.allies:battle.enemies).push(JSON.parse(JSON.stringify(u)));if(f.enemyIds)battle.enemies=battle.enemies.filter(u=>f.enemyIds.includes(u.id));for(const [id,hp,mp,status,taunt] of f.units){const u=[...battle.allies,...battle.enemies].find(u=>u.id===id);if(u)Object.assign(u,{hp,mp,status,taunt});}Object.assign(battle,{cur:f.cur,round:f.round,turns:f.turns,bossTurns:f.bossTurns,damageTotal:f.damageTotal,damageBy:f.damageBy,effects:f.effects,log:f.log});if(S.screen===(mode==='camp'?'camp':mode==='pvp'?'pvp':'world')){render();onlineSkillEffects(prior,state.room,mode);}setTimeout(tick,850);}tick();}
// @soulbeast-end 0501-localReplay
// @soulbeast-unit 0514-BEAST_RARITY_LABELS

const BEAST_RARITY_LABELS=SoulbeastContent.BEAST_RARITY_LABELS();
// @soulbeast-end 0514-BEAST_RARITY_LABELS
// @soulbeast-unit 0516-mistEncounter

function mistEncounter(zd,roll,P=S.P){
 let sp;
 if(!zd.train&&mistLegendsUnlocked(P)&&roll<.003)sp=pick(MIST_LEGEND_DEFS.map(x=>x[0]));
 else if(roll<.33)sp=pick(mistRarePool(zd));else return null;
 const legendary=!!SP[sp].legendary,lv=legendary?R(40,60):zd.lv[1]+R(0,2),e=wildUnit(sp,lv,0);
 e.rare=true;e.legendary=legendary;e.name=(legendary?'✦ ':'★ ')+e.name;return e;
}
// @soulbeast-end 0516-mistEncounter
// @soulbeast-unit 0529-TryStatement

try{const stored=localStorage.getItem(LANGUAGE_KEY);if(Object.hasOwn(LANGUAGE_NAMES,stored))GAME_LANGUAGE=stored;}catch(e){}
// @soulbeast-end 0529-TryStatement
// @soulbeast-unit 0534-gameLocale

function gameLocale(){return GAME_LANGUAGE==='en'?'en-US':GAME_LANGUAGE==='zh-CN'?'zh-CN':'th-TH';}
// @soulbeast-end 0534-gameLocale
// @soulbeast-unit 0551-IfStatement

if(typeof MutationObserver!=='undefined'&&document.body){
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='characterData')applyGameLanguage(record.target.parentElement);
   else for(const node of record.addedNodes)if(node.nodeType===1)applyGameLanguage(node);else if(node.nodeType===3)applyGameLanguage(node.parentElement);
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}
// @soulbeast-end 0551-IfStatement
// @soulbeast-unit 0553-WEAPON_RARITY

const WEAPON_RARITY=SoulbeastContent.WEAPON_RARITY();
// @soulbeast-end 0553-WEAPON_RARITY
// @soulbeast-unit 0620-setInterval

setInterval(()=>{if(!S.P||!SHEET_URL||document.hidden||COMMUNITY.busy||GACHA.busy||ONLINE_UI.count)return;if(COMMUNITY.code&&COMMUNITY.code!==ensureCode()){COMMUNITY.friends=[];COMMUNITY.online=[];COMMUNITY.incoming=null;COMMUNITY.ready=false;}communityCall();if(!S.zone&&!S.battle&&Date.now()-GS.lastAt>120000)gsSave(false);},60000);
// @soulbeast-end 0620-setInterval
// @soulbeast-unit 0634-releaseGo

const releaseGo=go;
// @soulbeast-end 0634-releaseGo
// @soulbeast-unit 0635-go

go=function(screen){ReleaseGacha.stop();releaseGo(screen);};
// @soulbeast-end 0635-go
// @soulbeast-unit 0641-BEAST_FRAME_LABELS

const BEAST_FRAME_LABELS={legend:['ตำนาน · กรอบทอง','Legendary · Gold frame','传说 · 金框'],rare:['หายาก · กรอบม่วง','Rare · Purple frame','稀有 · 紫框'],three:['ทั่วไป 3 ร่าง · กรอบฟ้า','Common, 3 forms · Blue frame','普通，3形态 · 蓝框'],two:['ทั่วไป 2 ร่าง · กรอบเขียว','Common, 2 forms · Green frame','普通，2形态 · 绿框'],one:['ทั่วไป 1 ร่าง · กรอบขาว','Common, 1 form · White frame','普通，1形态 · 白框']};
// @soulbeast-end 0641-BEAST_FRAME_LABELS
// @soulbeast-unit 0651-ornateTeamTab

const ornateTeamTab=handlers.teamtab;
// @soulbeast-end 0651-ornateTeamTab
// @soulbeast-unit 0653-ornateTeam

const ornateTeam=vTeam;
// @soulbeast-end 0653-ornateTeam
// @soulbeast-unit 0654-vTeam

vTeam=function(){if(S.ui.team==='chart')S.ui.team='team';return ornateTeam();};
// @soulbeast-end 0654-vTeam
// @soulbeast-unit 0655-ornateStart-ornateStop

const ornateStart=ReleaseGacha.start,ornateStop=ReleaseGacha.stop;
// @soulbeast-end 0655-ornateStart-ornateStop
// @soulbeast-unit 0661-RARITY_CORRECTED_IDS


/* Zone encounter lists are the source of truth for forest rare species.
   Shared verbatim by browser and Apps Script: no stat/skill/save migration. */
const RARITY_CORRECTED_IDS=[];
// @soulbeast-end 0661-RARITY_CORRECTED_IDS
// @soulbeast-unit 0693-reliabilityLbToggle

const reliabilityLbToggle=handlers.lbtoggle;
// @soulbeast-end 0693-reliabilityLbToggle
// @soulbeast-unit 0699-crystalIcon

const crystalIcon=itemIcon;
// @soulbeast-end 0699-crystalIcon
// @soulbeast-unit 0700-itemIcon
itemIcon=function(id,size=44){const i=['petExp1','petExp2','petExp3'].indexOf(id);return i<0?crystalIcon(id,size):`<span class="growth-crystal" role="img" aria-label="${esc(CON[id].n)}" title="${esc(CON[id].n)}" style="--s:${size}px;--crystal-x:${i*50}%"></span>`;};
// @soulbeast-end 0700-itemIcon
// @soulbeast-unit 0731-demonPetSkillsBase

// The final boss has a signature despite having no evolution tree.
const demonPetSkillsBase=petSkills;
// @soulbeast-end 0731-demonPetSkillsBase
// @soulbeast-unit 0732-petSkills

petSkills=function(p){const skills=demonPetSkillsBase(p);if(p.sp==='demonlord')for(const id of [...SP.demonlord.sk,SP.demonlord.sig,'boss_legend_call'])if(SK[id]&&!skills.includes(id))skills.push(id);return skills;};
// @soulbeast-end 0732-petSkills
// @soulbeast-unit 0808-eclipseRewardCardBase

const eclipseRewardCardBase=gachaRewardCard;
// @soulbeast-end 0808-eclipseRewardCardBase
// @soulbeast-unit 0809-gachaRewardCard
gachaRewardCard=function(r){return eclipseRewardCardBase(r);};
const eclipseEndBattle=endBattle;
endBattle=function(...args){const before=Number(S.P?.cleared||0),out=eclipseEndBattle(...args);if(Number(S.P?.cleared||0)>before)setTimeout(()=>claimDemonVictory(),100);return out;};
// @soulbeast-end 0809-gachaRewardCard
// @soulbeast-unit 0836-playAutoAct

// Every class swaps freely during an allied command turn.
const playAutoAct=aiAct;
// @soulbeast-end 0836-playAutoAct
// @soulbeast-unit 0837-aiAct
aiAct=function(){const b=B(),u=b&&uById(b.cur);if(b&&!b.over&&u?.side==='ally'&&teamAutoUnit(u)&&b.enemies.some(e=>e.hp>e.st.hp*.5)){
 const slot=b.allies.findIndex((a,i)=>i>0&&a.kind==='pet'&&a.hp<=0),reserve=carriedPets().find(p=>p.hp>0&&!b.allies.some(a=>a.uid===p.uid));
 if(slot>0&&reserve){b.atarget=slot;b.menu='main';battleAction('swap:'+reserve.uid);}
 }return playAutoAct();};
// @soulbeast-end 0837-aiAct
// @soulbeast-unit 0839-ForOfStatement

for(const it of Object.values(CON)){if(it.petExp)it.d+=' · ใช้เพิ่มเลเวลได้สูงสุดเท่าผู้เล่น EXP ส่วนเกินไม่สะสม';}
// @soulbeast-end 0839-ForOfStatement
// @soulbeast-unit 0900-optionalProgressEffect


// Presentation must never interrupt experience, loot or battle completion.
function optionalProgressEffect(fn){try{return fn();}catch(error){console.warn('Skipped game presentation effect',error);}}
// @soulbeast-end 0900-optionalProgressEffect
// @soulbeast-unit 0905-ForOfStatement

for(const key of ['sync','cry','skill']){const original=Sound[key];Sound[key]=function(...args){return optionalProgressEffect(()=>original.apply(this,args));};}
// @soulbeast-end 0905-ForOfStatement
// @soulbeast-unit 0938-ForOfStatement

for(const action of ['heal','use','baguse','useitem','petCarry','petStore','dopromote','buy','craft','surrender','dosurrender','dozone']){const original=handlers[action];if(original)handlers[action]=function(...args){if(towerActive())return toast('ใช้ไม่ได้ระหว่างอยู่ในหอคอย');return original(...args);};}
// @soulbeast-end 0938-ForOfStatement
// @soulbeast-unit 1011-SAFE-push
SAFE.push('cleanse');
// @soulbeast-end 1011-SAFE-push
// @soulbeast-unit 1018-ForOfStatement
for(const [theme,ids]of Object.entries(SIGNATURE_EFFECT_THEMES))for(const id of ids.split(' '))SIGNATURE_THEME_BY_ID[id]=theme;
// @soulbeast-end 1018-ForOfStatement
// @soulbeast-unit 1024-ARMOR_ELEMENTS_V4


// Shared by the browser and authoritative API; inventory IDs and saved stats stay intact.
const ARMOR_ELEMENTS_V4={armor_0:['normal'],armor_1:['ground'],armor_2:['water'],armor_3:['dragon'],armor_4:['steel'],armor_5:['dark'],crown_0:['normal'],crown_1:['rock'],crown_2:['ice'],crown_3:['dragon'],crown_4:['psychic'],crown_5:['fairy'],crown_eagle:['flying'],crown_sage:['psychic'],armor_berserk:['fighting'],armor_dragon:['dragon','fire'],crown_pierce:['ground'],armor_saint:['fairy'],lg1_armor:['grass'],lg1_crown:['electric'],lg2_armor:['flying'],lg2_crown:['electric','ghost'],lg3_armor:['ghost'],lg3_crown:['ground','fighting'],lg4_armor:['water','dragon'],lg4_crown:['dragon'],lg5_armor:['ground'],lg5_crown:['psychic','fairy'],lg6_armor:['dark','fighting'],lg6_crown:['dark','psychic'],wl_armor:['steel'],wl_crown:['fairy']};
// @soulbeast-end 1024-ARMOR_ELEMENTS_V4
// @soulbeast-unit 1043-IfStatement

if(!CLS.gladiator.pas.includes('counter'))CLS.gladiator.pas.push('counter');
// @soulbeast-end 1043-IfStatement
// @soulbeast-unit 1044-IfStatement

if(!CLS.gladiator.pas.includes('thorns'))CLS.gladiator.pas.push('thorns');
// @soulbeast-end 1044-IfStatement
// @soulbeast-unit 1053-IfStatement


if(!CLS.druid.pas.includes('thorns'))CLS.druid.pas.push('thorns');
// @soulbeast-end 1053-IfStatement
// @soulbeast-unit 1063-elementTeamView

const elementTeamView=vHero;
// @soulbeast-end 1063-elementTeamView
// @soulbeast-unit 1064-vHero
vHero=function(){return elementTeamView().replace('<h3>อุปกรณ์ที่สวมใส่</h3>','<h3>อุปกรณ์ที่สวมใส่</h3><div class="row wrap"><small>ธาตุตั้งรับจากเกราะ / มงกุฎ</small>'+tChips(equipmentElements(S.P.eq))+'</div>');};
// @soulbeast-end 1064-vHero
