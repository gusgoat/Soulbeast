// Catalog construction and derived equipment/skills
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0008-EL


/* ================= ELEMENTS ================= */
const EL=SoulbeastContent.EL();
// @soulbeast-end 0008-EL
// @soulbeast-unit 0009-TC

const TC=SoulbeastContent.TC();
// @soulbeast-end 0009-TC
// @soulbeast-unit 0013-PAS

const PAS=SoulbeastContent.PAS();
// @soulbeast-end 0013-PAS
// @soulbeast-unit 0014-SK


/* ================= SKILLS ================= */
/* t: p physical | m magic | h hybrid | auto | heal | buff | debuff | status | form | revert | rest
   tg (heal/buff): self | ally | team. all: hits every enemy. hits: repeat. rt: random target per hit.
   st:{status:chance} bf:{stat:amount} tn: turns. ls lifesteal, pi pierce, cb crit bonus, gc gold cost ×Lv,
   steal, gold, self (self-damage %), taunt, rev/revAll, cure, pas (temporary passive) */
const SK=SoulbeastContent.SK();
// @soulbeast-end 0014-SK
// @soulbeast-unit 0015-ELN

/* element skill families: [p1, p2, m1, m2, aoe, utility] */
const ELN=SoulbeastContent.ELN();
// @soulbeast-end 0015-ELN
// @soulbeast-unit 0016-PHYS_AOE

const PHYS_AOE=new Set(['normal','fighting','ground','rock','bug','steel','flying','dark']);
// @soulbeast-end 0016-PHYS_AOE
// @soulbeast-unit 0017-ELST

const ELST=SoulbeastContent.ELST();
// @soulbeast-end 0017-ELST
// @soulbeast-unit 0018-UTIL

const UTIL=SoulbeastContent.UTIL();
// @soulbeast-end 0018-UTIL
// @soulbeast-unit 0019-ForInStatement

for(const el in ELN){const N=ELN[el],es=ELST[el],add=(k,o,sc=1)=>{if(es)o.st={[es[0]]:+(es[1]*sc).toFixed(2)};if(el==='grass')o.ls=.25;SK[`${el}_${k}`]=o};
 add('p1',{n:N[0],t:'p',pw:120,el,mp:3});add('p2',{n:N[1],t:'p',pw:175,el,mp:9});
 add('m1',{n:N[2],t:'m',pw:125,el,mp:4});add('m2',{n:N[3],t:'m',pw:180,el,mp:10});
 add('aoe',{n:N[4],t:PHYS_AOE.has(el)?'p':'m',pw:125,el,mp:10,all:1},.6);
 SK[el+'_st']={n:N[5],el,...UTIL[el]}}
// @soulbeast-end 0019-ForInStatement
// @soulbeast-unit 0020-SK-Object


Object.assign(SK,SoulbeastContent.SK_additions_1());
// @soulbeast-end 0020-SK-Object
// @soulbeast-unit 0021-FORMS


/* ================= DRUID FORMS ================= */
const FORMS=SoulbeastContent.FORMS();
// @soulbeast-end 0021-FORMS
// @soulbeast-unit 0022-CLS


/* ================= CLASSES ================= */
const CLS=SoulbeastContent.CLS();
// @soulbeast-end 0022-CLS
// @soulbeast-unit 0024-WT


/* ================= WEAPONS & GEAR ================= */
const WT=SoulbeastContent.WT();
// @soulbeast-end 0024-WT
// @soulbeast-unit 0025-WN

const WN=SoulbeastContent.WN();
// @soulbeast-end 0025-WN
// @soulbeast-unit 0026-WF-WLV

const WF=[4,10,17,27,40,56],WLV=[1,6,13,21,30,40],WPR=[40,300,900,2400,6000,15000],WPW=[0,140,160,135,205,185],WMP=[0,5,7,9,11,14];
// @soulbeast-end 0026-WF-WLV
// @soulbeast-unit 0028-EQ

const EQ={};
// @soulbeast-end 0028-EQ
// @soulbeast-unit 0029-ForInStatement

for(const type in WN)WN[type].forEach(([n,el,skn],t)=>{const id=`wp_${type}${t}`;EQ[id]={n,slot:'weapon',wt:type,t:WT[type].t,lv:WLV[t],price:WPR[t],st:wStats(type,t),el:el||null,tier:t};
 if(t>0){const ws='ws_'+type+t,es=ELST[el];SK[ws]={n:skn,t:WT[type].t,pw:WPW[t],el,mp:WMP[t],...(t===3||t===5?{all:1}:{}),...(es?{st:{[es[0]]:+(es[1]*1.5).toFixed(2)}}:{})};EQ[id].ws=ws}});
// @soulbeast-end 0029-ForInStatement
// @soulbeast-unit 0030-SLOTS

const SLOTS=SoulbeastContent.SLOTS();
// @soulbeast-end 0030-SLOTS
// @soulbeast-unit 0031-SLOTN

const SLOTN=Object.fromEntries(SLOTS);
// @soulbeast-end 0031-SLOTN
// @soulbeast-unit 0032-SLOTBASE

const SLOTBASE=SoulbeastContent.SLOTBASE();
// @soulbeast-end 0032-SLOTBASE
// @soulbeast-unit 0033-TIERS

const TIERS=SoulbeastContent.TIERS();
// @soulbeast-end 0033-TIERS
// @soulbeast-unit 0034-ForInStatement

for(const sl in SLOTBASE)TIERS.forEach(([tn,lv,m,pr],ti)=>{const st={};for(const k in SLOTBASE[sl])st[k]=Math.max(1,Math.round(SLOTBASE[sl][k]*m));EQ[sl+'_'+ti]={n:SLOTN[sl]+tn,slot:sl,lv,price:pr,st,tier:ti}});
// @soulbeast-end 0034-ForInStatement
// @soulbeast-unit 0035-SG

/* special gear: passives and item skills */
const SG=SoulbeastContent.SG();
// @soulbeast-end 0035-SG
// @soulbeast-unit 0036-ForInStatement

for(const k in SG)EQ[k]={...SG[k],special:1};
// @soulbeast-end 0036-ForInStatement
// @soulbeast-unit 0037-CON


const CON=SoulbeastContent.CON();
// @soulbeast-end 0037-CON
// @soulbeast-unit 0040-SP


/* ================= BEASTS (50) ================= */
/* b: [hp,mp,patk,matk,pdef,mdef,acc,eva,spd]; ev: evolution forms [lv,name]; sig: signature skill */
const SP=SoulbeastContent.SP();
// @soulbeast-end 0040-SP
// @soulbeast-unit 0044-NPC

const NPC=SoulbeastContent.NPC();
// @soulbeast-end 0044-NPC
// @soulbeast-unit 0045-NPC-push


NPC.push(
 {n:'มณี พ่อค้าผนึกเร่',lv:8,cls:'merchant',pets:[['nekomata',8]],gold:230},
 {n:'ไพริน ผู้ฟังเสียงป่า',lv:12,cls:'druid',pets:[['kodama',12]],gold:600},
 {n:'เรเวน มือปืนจันทร์แดง',lv:20,cls:'gunner',pets:[['raiju',20]],gold:1800},
 {n:'สุริยัน อัศวินแห่งรุ่งอรุณ',lv:28,cls:'paladin',pets:[['unicorn',28]],gold:3500},
 {n:'อัญชัน นักฆ่าม่านหมอก',lv:35,cls:'assassin',pets:[['nue',35]],gold:7000},
 {n:'ฮายาเตะ เคนเซย์ไร้พ่าย',lv:42,cls:'kensei',pets:[['tengu',42]],gold:13000},
 {n:'อรัญ นายพรานราชันย์',lv:48,cls:'wildlord',pets:[['griffin',48],['thunderbird',48]],gold:24000},
 {n:'อัคนี ผู้บัญชาการปืนศักดิ์สิทธิ์',lv:54,cls:'gunsaint',pets:[['phoenix',54],['ifrit',52]],gold:45000},
 {n:'จันทรา จอมเวทสุริยุปราคา',lv:57,cls:'archmage',pets:[['naga',57],['fenrir',55]],gold:58000},
 {n:'อัครา แชมป์จันทร์แดง',lv:60,cls:'shogun',pets:[['dragon',60],['garuda',60]],gold:80000}
);
// @soulbeast-end 0045-NPC-push
// @soulbeast-unit 0046-PAS-Object


/* ================= v5 ADDITIONS ================= */
Object.assign(PAS,{
 counter:{n:'สวนกลับเงา',d:'25% โจมตีสวนกลับเมื่อโดนโจมตีกายภาพ'},
 echo:{n:'เสียงสะท้อนเวท',d:'20% ใช้สกิลโจมตีซ้ำอีกครั้งฟรี'},
 mpsave:{n:'ประหยัดพลัง',d:'ใช้ MP น้อยลง 30%'},
 toxin:{n:'พิษร้ายแรง',d:'โอกาสทำให้ติดสถานะ ×1.5'},
 laststand:{n:'ฮึดสู้',d:'HP ต่ำกว่า 30% ป้องกันทั้งหมด +50%'},
 firstblood:{n:'จู่โจมก่อน',d:'ตาแรกของการต่อสู้ ความเร็ว ×2'},
 manadrain:{n:'ดูดมานา',d:'ฟื้น MP 8% ของดาเมจที่ทำได้'},
 aoeboost:{n:'ผู้ทำลายล้าง',d:'สกิลหมู่แรง 90% ต่อตัว แทน 75%'},
});
// @soulbeast-end 0046-PAS-Object
// @soulbeast-unit 0047-SK-Object

Object.assign(SK,SoulbeastContent.SK_additions_2());
// @soulbeast-end 0047-SK-Object
// @soulbeast-unit 0048-ADDSK

const ADDSK=SoulbeastContent.ADDSK();
// @soulbeast-end 0048-ADDSK
// @soulbeast-unit 0049-ForInStatement

for(const k in ADDSK){CLS[k].sk.push(...ADDSK[k]);CLS[k].sk.sort((a,b)=>a[0]-b[0])}
// @soulbeast-end 0049-ForInStatement
// @soulbeast-unit 0050-SP-minotaur

SP.minotaur.sk[2]='heavy_stance';
// @soulbeast-end 0050-SP-minotaur
// @soulbeast-unit 0051-SP-golem
SP.golem.sk[1]='heavy_stance';
// @soulbeast-end 0051-SP-golem
// @soulbeast-unit 0052-SP-behemoth
SP.behemoth.sk[3]='heavy_stance';
// @soulbeast-end 0052-SP-behemoth
// @soulbeast-unit 0053-SP-dragon
SP.dragon.sk[2]='focus_p';
// @soulbeast-end 0053-SP-dragon
// @soulbeast-unit 0054-SP-redcap
SP.redcap.sk[2]='focus_p';
// @soulbeast-end 0054-SP-redcap
// @soulbeast-unit 0055-SP-Object

Object.assign(SP,SoulbeastContent.SP_additions_1());
// @soulbeast-end 0055-SP-Object
// @soulbeast-unit 0057-LGLV


/* ---- legendary gear: one per equipment slot per zone ---- */
const LGLV=SoulbeastContent.LGLV();
// @soulbeast-end 0057-LGLV
// @soulbeast-unit 0058-LGW

const LGW=SoulbeastContent.LGW();
// @soulbeast-end 0058-LGW
// @soulbeast-unit 0059-LGA

const LGA=SoulbeastContent.LGA();
// @soulbeast-end 0059-LGA
// @soulbeast-unit 0060-LGA-forEach

LGA.forEach((set,i)=>{const z=i+1;
 for(const sl in set){const [n,pas,sk]=set[sl],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(2,Math.round(SLOTBASE[sl][k]*TIERS[i][2]*1.6));
  EQ[`lg${z}_${sl}`]={n,slot:sl,lv:LGLV[i],price:3000*z,st,pas,...(sk?{sk}:{}),legend:z}}
 const [wn,el,skn,def,pas]=LGW[i];
 for(const type in WT){const st=wStats(type,z);for(const k in st)st[k]=Math.round(st[k]*1.2);const ws=`lgs${z}_${type}`;
  SK[ws]={n:skn,t:WT[type].t,el,mp:10+i*2,...def};EQ[`lg${z}_weapon_${type}`]={n:WT[type].n+wn,slot:'weapon',wt:type,t:WT[type].t,lv:LGLV[i],price:4000*z,st,el,ws,pas,legend:z}}});
// @soulbeast-end 0060-LGA-forEach
// @soulbeast-unit 0061-TIERS-push



/* ================= v6 ADDITIONS ================= */
TIERS.push(['ทมิฬ',40,15,15000]);
// @soulbeast-end 0061-TIERS-push
// @soulbeast-unit 0062-ForInStatement

for(const sl in SLOTBASE){const [tn,lv,m,pr]=TIERS[5],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(1,Math.round(SLOTBASE[sl][k]*m));EQ[sl+'_5']={n:SLOTN[sl]+tn,slot:sl,lv,price:pr,st,tier:5}}
// @soulbeast-end 0062-ForInStatement
// @soulbeast-unit 0063-WF-push

WF.push(74);
// @soulbeast-end 0063-WF-push
// @soulbeast-unit 0064-SP-demonlord

/* final zone */
SP.demonlord=SoulbeastContent.SP_demonlord_1();
// @soulbeast-end 0064-SP-demonlord
// @soulbeast-unit 0065-SK-s_demon

SK.s_demon=SoulbeastContent.SK_s_demon_1();
// @soulbeast-end 0065-SK-s_demon
// @soulbeast-unit 0067-LGLV-push

LGLV.push(44);
// @soulbeast-end 0067-LGLV-push
// @soulbeast-unit 0068-LGW-push

LGW.push(['จอมมาร','dark','ทมิฬาวสาน',{pw:240,all:1,st:{charm:.15}},'lifesteal']);
// @soulbeast-end 0068-LGW-push
// @soulbeast-unit 0069-LGA-push

LGA.push({armor:['เกราะแม่ทัพปีศาจ','laststand'],gloves:['ถุงมือกรงเล็บปีศาจ','deadly'],boots:['รองเท้าเงามรณะ','firstblood'],belt:['เข็มขัดโซ่นรก','sturdy'],bracelet:['กำไลวิญญาณทาส','manadrain'],ring:['แหวนสัญญาปีศาจ','aoeboost'],necklace:['สร้อยหัวใจจอมมาร','rebirth'],crown:['มงกุฎจอมมาร','rainbow','dark_aoe']});
// @soulbeast-end 0069-LGA-push
// @soulbeast-unit 0071-MILE


/* special milestone skills at Lv 10/20/30/40/50/60 for each class line */
const MILE=SoulbeastContent.MILE();
// @soulbeast-end 0071-MILE
// @soulbeast-unit 0072-ForInStatement

for(const b in MILE)for(const lv in MILE[b]){const id=`ms_${b}${lv}`;SK[id]={...MILE[b][lv],mile:1};CLS[b].sk.push([+lv,id])}
// @soulbeast-end 0072-ForInStatement
// @soulbeast-unit 0073-ForInStatement

for(const b in MILE)CLS[b].sk.sort((a,c)=>a[0]-c[0]);
// @soulbeast-end 0073-ForInStatement
// @soulbeast-unit 0081-SK-Object

Object.assign(SK,SoulbeastContent.SK_additions_3());
// @soulbeast-end 0081-SK-Object
// @soulbeast-unit 0082-ForOfStatement

for(const [el,info] of Object.entries(EL)){
 if(!SK[el+'_p1'])SK[el+'_p1']={n:'จู่โจม'+info.n,t:'p',el,pw:110,mp:4};
 if(!SK[el+'_p2'])SK[el+'_p2']={n:'พิฆาต'+info.n,t:'p',el,pw:185,mp:10,cd:1};
 if(!SK[el+'_m1'])SK[el+'_m1']={n:'เวท'+info.n,t:'m',el,pw:115,mp:5};
 if(!SK[el+'_m2'])SK[el+'_m2']={n:'มหาเวท'+info.n,t:'m',el,pw:190,mp:11,cd:1};
 if(['fire','water','flying'].includes(el))SK['enchant_'+el]={n:'ประทับดาบธาตุ'+info.n,t:'buff',tg:'self',enchant:el,tn:3,mp:7,cd:1};
}
// @soulbeast-end 0082-ForOfStatement
// @soulbeast-unit 0083-CLS-gladiator

CLS.gladiator.sk.push([10,'guard_physical'],[14,'guard_magic']);
// @soulbeast-end 0083-CLS-gladiator
// @soulbeast-unit 0084-CLS-swordsman

CLS.swordsman.sk.push(...['fire','water','flying'].map(el=>[8,'enchant_'+el]));
// @soulbeast-end 0084-CLS-swordsman
// @soulbeast-unit 0085-CLS-archer

CLS.archer.sk.push([18,'bow_true']);
// @soulbeast-end 0085-CLS-archer
// @soulbeast-unit 0086-CLS-gunner
CLS.gunner.sk.push([18,'gun_true']);
// @soulbeast-end 0086-CLS-gunner
// @soulbeast-unit 0087-CLS-mage

CLS.mage.sk.push([4,'water_m1'],[7,'ground_m1'],[9,'flying_m1'],[20,'firestorm_dot'],[22,'whirlpool_dot']);
// @soulbeast-end 0087-CLS-mage
// @soulbeast-unit 0088-CLS-merchant

CLS.merchant.sk.push([10,'hire_merc']);
// @soulbeast-end 0088-CLS-merchant
// @soulbeast-unit 0089-CLS-thief
CLS.thief.sk.push([10,'shadow_clone']);
// @soulbeast-end 0089-CLS-thief
// @soulbeast-unit 0090-CLS-summoner
CLS.summoner.sk.push([10,'summon_golem']);
// @soulbeast-end 0090-CLS-summoner
// @soulbeast-unit 0091-ForOfStatement

for(const sk of Object.values(SK)){
 if(['p','m','h','auto'].includes(sk.t)){
  if(sk!==SK.attack&&!sk.el)sk.el='normal';
  if(sk.all){sk.basePower=sk.pw||100;sk.pw=Math.min(sk.pw||100,160);sk.areaScale=.65;}
  if(!sk.cd&&((sk.pw||0)>=300||sk.ct||sk.revAll))sk.cd=3;
  else if(!sk.cd&&((sk.pw||0)>=220||(sk.hits||0)>=4))sk.cd=2;
 }
 if(sk.revAll&&!sk.cd)sk.cd=3;
}
// @soulbeast-end 0091-ForOfStatement
// @soulbeast-unit 0092-NEW_BEASTS

const NEW_BEASTS=SoulbeastContent.NEW_BEASTS();
// @soulbeast-end 0092-NEW_BEASTS
// @soulbeast-unit 0093-NEW_BEASTS-forEach

NEW_BEASTS.forEach(([key,n,el,subject,zone],i)=>{
 const tank=i<10;const boss=i>=10&&i<22;
 SP[key]={n,o:'ตำนานผู้พิทักษ์',t:[el],em:tank?'🛡️':'✦',r:tank?1.8:boss?3.2:1.6,b:tank?[90,35,5,5,22,22,88,3,5]:[52+zone*4,30,11+zone,10+zone,9+zone,9+zone,92,8,10],sk:tank?['guard_taunt',el+'_p1','guard_physical','guard_magic']:[el+'_p1',el+'_m1',el+'_p2',el+'_m2'],pas:tank?'sturdy':'keen',parts:[[n+'แก่นพลัง',30*zone],[n+'เศษวิญญาณ',40*zone]]};
 if(['mist_serpent','crocodile','abyss_emperor'].includes(key))SP[key].sk[2]='constrict_dot';
 const z=ZN[zone-1];if(z){if(boss)z.rare.push(key);else z.sp.push(key)}
});
// @soulbeast-end 0093-NEW_BEASTS-forEach
// @soulbeast-unit 0096-CON-godSeal

CON.godSeal={n:'ผนึกของพระเจ้า',d:'จับอสูรที่จับได้สำเร็จ 100% ต้องกำจัดเจ้าของเดิมก่อน',seal:Infinity,perfect:1,price:0,rareLoot:1};
// @soulbeast-end 0096-CON-godSeal
// @soulbeast-unit 0097-ForOfStatement

for(const cls of Object.keys(CLS))if(!NPC.some(n=>n.cls===cls)){const tier=CLS[cls].p?(CLS[CLS[cls].p].p?2:1):0,lv=tier===0?18:tier===1?32:55;NPC.push({n:'ผู้ท้าชิง '+CLS[cls].n,cls,lv,pets:[[Object.keys(SP)[NPC.length%Object.keys(SP).length],lv]],gold:Math.round(lv*lv*12)})}
// @soulbeast-end 0097-ForOfStatement
// @soulbeast-unit 0141-MIST_RARE_DEFS

/* Mist expansion: additive species/skills; no changes to existing pets or saves. */
const MIST_RARE_DEFS=SoulbeastContent.MIST_RARE_DEFS();
// @soulbeast-end 0141-MIST_RARE_DEFS
// @soulbeast-unit 0142-MIST_LEGEND_DEFS

const MIST_LEGEND_DEFS=SoulbeastContent.MIST_LEGEND_DEFS();
// @soulbeast-end 0142-MIST_LEGEND_DEFS
// @soulbeast-unit 0144-MIST_RARE_DEFS-forEach

MIST_RARE_DEFS.forEach(([key,n,t,ref,zone,pas,part,o])=>{
 SP[key]={n,o,t,em:'✧',r:4.8,rare:1,mistNew:1,mistZone:zone,b:SP[ref].b.slice(),sk:[t[0]+'_p1',t[1]+'_m1',t[0]+'_st',t[0]+'_m2'],pas,sig:'mist_sig_'+key,parts:[['แก่น'+part,400+zone*80],['ผนึกเศษ'+part,500+zone*90]]};
 SK['mist_sig_'+key]=MIST_SIGNATURES[key];
});
// @soulbeast-end 0144-MIST_RARE_DEFS-forEach
// @soulbeast-unit 0145-MIST_LEGEND_DEFS-forEach

MIST_LEGEND_DEFS.forEach(([key,n,t,ref,pas,part,extra])=>{
 SP[key]={n,o:'ตำนานหลังจอมมาร',t,em:'✦',r:7.2,rare:1,legendary:1,mistNew:1,rarePair:ref,b:SP[ref].b.slice(),sk:[t[0]+'_p2',t[1]+'_m2',t[0]+'_st',t[0]+'_aoe'],pas,sig:'mist_sig_'+key,parts:[['แก่นตำนาน'+part,1500],['เศษผนึก'+part,1900]],...extra};
 SK['mist_sig_'+key]=MIST_SIGNATURES[key];
});
// @soulbeast-end 0145-MIST_LEGEND_DEFS-forEach
// @soulbeast-unit 0227-ForOfStatement
for(const job of Object.values(CLS))for(const [lv,id]of job.sk||[])SPELL_UNLOCK[id]=Math.max(lv,SPELL_UNLOCK[id]||0);
// @soulbeast-end 0227-ForOfStatement
// @soulbeast-unit 0267-ForOfStatement

for(const [wt,n,el,pas] of WORLD_WEAPONS){const id='wl_'+wt;WORLD_LEGENDS.push(id);EQ[id]={n,slot:'weapon',wt,t:WT[wt].t,lv:50,price:120000,st:Object.fromEntries(Object.entries(wStats(wt,5)).map(([k,v])=>[k,Math.round(v*1.45)])),el,pas,ws:'ws_'+wt+'5',tier:6,legend:1,worldLegend:1};}
// @soulbeast-end 0267-ForOfStatement
// @soulbeast-unit 0269-ForOfStatement

for(const [slot,n,pas,extraId] of WORLD_ARMOR){const id=extraId||'wl_'+slot;WORLD_LEGENDS.push(id);EQ[id]={n,slot,lv:50,price:100000,st:Object.fromEntries(Object.entries(EQ[slot+'_4'].st).map(([k,v])=>[k,extraId?Math.ceil(Math.max(v,...Object.values(EQ).filter(e=>e.slot===slot&&e.legend&&!e.worldLegend).map(e=>e.st[k]||0))*1.2):Math.round(v*1.4)])),pas,tier:6,legend:1,worldLegend:1,...(extraId?{art:'assets/equipment/eclipse-v2/'+id+'.webp'}:{})};}
// @soulbeast-end 0269-ForOfStatement
// @soulbeast-unit 0270-SK-Object

Object.assign(SK,SoulbeastContent.SK_additions_4());
// @soulbeast-end 0270-SK-Object
// @soulbeast-unit 0566-CON-eternalSeal

CON.eternalSeal={n:'ผนึกนิรันดร์',d:'ผนึกสำเร็จ100%กับอสูรที่จับได้ ไม่ใช้กับบอสที่ผนึกไม่ได้หรือในPVP',price:0,seal:Infinity,rareLoot:true};
// @soulbeast-end 0566-CON-eternalSeal
// @soulbeast-unit 0662-ForOfStatement

for(const id of new Set(ZN.flatMap(zone=>zone.rare||[]))){
 const beast=SP[id];
 if(beast&&!beast.legendary&&!beast.rare){beast.rare=1;RARITY_CORRECTED_IDS.push(id);}
}
// @soulbeast-end 0662-ForOfStatement
// @soulbeast-unit 0730-SP-demonlord


// Balance rules shared by browser and authoritative battle engine.
SP.demonlord.noseal=1;
// @soulbeast-end 0730-SP-demonlord
// @soulbeast-unit 0736-SK-boss_legend_call


SK.boss_legend_call=SoulbeastContent.SK_boss_legend_call_1();
// @soulbeast-end 0736-SK-boss_legend_call
// @soulbeast-unit 1025-ForOfStatement

for(const [id,it]of Object.entries(EQ))if(['armor','crown'].includes(it.slot)){const types=ARMOR_ELEMENTS_V4[id]||(it.craft&&SP[it.craft]?.t)||['normal'];it.defTypes=[...new Set(types.map(k=>k==='steel'&&it.lv<30?'rock':k))].filter(k=>EL[k]);if(!it.defTypes.length)it.defTypes=['normal'];}
// @soulbeast-end 1025-ForOfStatement
// @soulbeast-unit 1029-ForOfStatement

for(const sk of Object.values(SK))if(sk.all&&['p','m','h','auto'].includes(sk.t)){sk.pw=sk.basePower||sk.pw;sk.areaScale=null;}
// @soulbeast-end 1029-ForOfStatement
// @soulbeast-unit 1030-FORMS-moon

// Strong forms retain their role, with a cost for sustained burst and area pressure.
FORMS.moon.m.matk=1.45;
// @soulbeast-end 1030-FORMS-moon
// @soulbeast-unit 1031-FORMS-moon
FORMS.moon.m.mdef=1.3;
// @soulbeast-end 1031-FORMS-moon
// @soulbeast-unit 1032-SK-f_moonbeam
SK.f_moonbeam.mp=24;
// @soulbeast-end 1032-SK-f_moonbeam
// @soulbeast-unit 1033-SK-f_moonbeam
SK.f_moonbeam.cd=2;
// @soulbeast-end 1033-SK-f_moonbeam
// @soulbeast-unit 1034-FORMS-saber

FORMS.saber.m.patk=1.65;
// @soulbeast-end 1034-FORMS-saber
// @soulbeast-unit 1035-FORMS-saber
FORMS.saber.m.crit=1.5;
// @soulbeast-end 1035-FORMS-saber
// @soulbeast-unit 1036-FORMS-gdragon
FORMS.gdragon.m.patk=1.45;
// @soulbeast-end 1036-FORMS-gdragon
// @soulbeast-unit 1037-FORMS-gdragon
FORMS.gdragon.m.matk=1.45;
// @soulbeast-end 1037-FORMS-gdragon
// @soulbeast-unit 1038-SK-gs_infinite

SK.gs_infinite.pw=68;
// @soulbeast-end 1038-SK-gs_infinite
// @soulbeast-unit 1039-SK-ke_thousand
SK.ke_thousand.pw=80;
// @soulbeast-end 1039-SK-ke_thousand
// @soulbeast-unit 1040-SK-sbs_unite
SK.sbs_unite.bf={patk:.3,matk:.3,crit:.3};
// @soulbeast-end 1040-SK-sbs_unite
// @soulbeast-unit 1041-PAS-arcaneMastery

PAS.arcaneMastery={n:'เชี่ยวชาญมหาเวท',d:'สกิลโจมตีเวทแรงขึ้น 15% แม้ธาตุไม่ตรงกับอาวุธ'};
// @soulbeast-end 1041-PAS-arcaneMastery
// @soulbeast-unit 1042-CLS-archmage

CLS.archmage.pas=CLS.archmage.pas.filter(k=>k!=='adapt').concat('arcaneMastery');
// @soulbeast-end 1042-CLS-archmage
// @soulbeast-unit 1045-SK-th_ambush

SK.th_ambush.charge=1.65;
// @soulbeast-end 1045-SK-th_ambush
// @soulbeast-unit 1046-SK-th_ambush
SK.th_ambush.bf.eva=.35;
// @soulbeast-end 1046-SK-th_ambush
// @soulbeast-unit 1056-SK-sbw_doom


SK.sbw_doom.pw=230;
// @soulbeast-end 1056-SK-sbw_doom
// @soulbeast-unit 1057-SK-sbw_doom
SK.sbw_doom.basePower=230;
// @soulbeast-end 1057-SK-sbw_doom
// @soulbeast-unit 1058-SK-sbw_doom
SK.sbw_doom.pi=.3;
// @soulbeast-end 1058-SK-sbw_doom
// @soulbeast-unit 1059-SK-sbw_doom
SK.sbw_doom.mp=20;
// @soulbeast-end 1059-SK-sbw_doom
