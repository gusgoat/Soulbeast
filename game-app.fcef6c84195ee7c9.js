
'use strict';
/* ================= CORE STATS ================= */
const K=['hp','mp','patk','matk','pdef','mdef','acc','eva','spd','crit'];
const LBL={hp:'พลังชีวิต (HP)',mp:'พลังเวทย์ (MP)',patk:'โจมตีกายภาพ',matk:'โจมตีเวทย์',pdef:'ป้องกันกายภาพ',mdef:'ป้องกันเวทย์',acc:'ความแม่นยำ',eva:'การหลบหลีก',spd:'ความเร็ว',crit:'โอกาสคริติคอล %'};
const SH={hp:'HP',mp:'MP',patk:'ตีกาย',matk:'ตีเวทย์',pdef:'กันกาย',mdef:'กันเวทย์',acc:'แม่นยำ',eva:'หลบ',spd:'เร็ว',crit:'คริ'};
const PER={hp:8,mp:5,patk:1.5,matk:1.5,pdef:1.5,mdef:1.5,acc:2,eva:1.5,spd:1,crit:.5};
const PB=[60,30,8,8,5,5,90,8,10,5], PG=[6,3,1,1,1,1,1,.8,.6,.1];
const MAXLV=60, FM=[1,1.2,1.4], SKLV=[1,5,11,18], SIGLV=12;
const grow=(k,b)=>({hp:b*.2,mp:b*.12,acc:1.1,eva:.5+b*.03,spd:b*.08,crit:.1})[k] ?? b*.17;

/* ================= ELEMENTS ================= */
const EL=SoulbeastContent.EL();
const TC=SoulbeastContent.TC();
const typeMult=(el,types)=>!el||!types?1:types.reduce((m,t)=>m*((TC[el]&&TC[el][t])??1),1);

/* ================= STATUSES & PASSIVES ================= */
const STS=SoulbeastContent.STS();
const IMM=SoulbeastContent.IMM();
const PAS=SoulbeastContent.PAS();

/* ================= SKILLS ================= */
/* t: p physical | m magic | h hybrid | auto | heal | buff | debuff | status | form | revert | rest
   tg (heal/buff): self | ally | team. all: hits every enemy. hits: repeat. rt: random target per hit.
   st:{status:chance} bf:{stat:amount} tn: turns. ls lifesteal, pi pierce, cb crit bonus, gc gold cost ×Lv,
   steal, gold, self (self-damage %), taunt, rev/revAll, cure, pas (temporary passive) */
const SK=SoulbeastContent.SK();
/* element skill families: [p1, p2, m1, m2, aoe, utility] */
const ELN=SoulbeastContent.ELN();
const PHYS_AOE=new Set(['normal','fighting','ground','rock','bug','steel','flying','dark']);
const ELST=SoulbeastContent.ELST();
const UTIL=SoulbeastContent.UTIL();
for(const el in ELN){const N=ELN[el],es=ELST[el],add=(k,o,sc=1)=>{if(es)o.st={[es[0]]:+(es[1]*sc).toFixed(2)};if(el==='grass')o.ls=.25;SK[`${el}_${k}`]=o};
 add('p1',{n:N[0],t:'p',pw:120,el,mp:3});add('p2',{n:N[1],t:'p',pw:175,el,mp:9});
 add('m1',{n:N[2],t:'m',pw:125,el,mp:4});add('m2',{n:N[3],t:'m',pw:180,el,mp:10});
 add('aoe',{n:N[4],t:PHYS_AOE.has(el)?'p':'m',pw:125,el,mp:10,all:1},.6);
 SK[el+'_st']={n:N[5],el,...UTIL[el]}}

Object.assign(SK,SoulbeastContent.SK_additions_1());

/* ================= DRUID FORMS ================= */
const FORMS=SoulbeastContent.FORMS();

/* ================= CLASSES ================= */
const CLS=SoulbeastContent.CLS();
const BASES=Object.keys(CLS).filter(k=>!CLS[k].p);

/* ================= WEAPONS & GEAR ================= */
const WT=SoulbeastContent.WT();
const WN=SoulbeastContent.WN();
const WF=[4,10,17,27,40,56],WLV=[1,6,13,21,30,40],WPR=[40,300,900,2400,6000,15000],WPW=[0,140,160,135,205,185],WMP=[0,5,7,9,11,14];
function wStats(type,t){const f=WF[t],o=({sword:{patk:f,acc:t*2},axe:{patk:f*1.1,pdef:t*3},bow:{patk:f*.95,acc:t*3,crit:t},staff:{matk:f,mp:t*8},mace:{patk:f,hp:t*15},gun:{patk:f,acc:t*3,crit:t},dagger:{patk:f*.85,crit:t*1.5,spd:t},whip:{matk:f*.85,mp:t*8,spd:t}})[type];
 const s={};for(const k in o){const v=Math.round(o[k]);if(v)s[k]=v}return s}
const EQ={};
for(const type in WN)WN[type].forEach(([n,el,skn],t)=>{const id=`wp_${type}${t}`;EQ[id]={n,slot:'weapon',wt:type,t:WT[type].t,lv:WLV[t],price:WPR[t],st:wStats(type,t),el:el||null,tier:t};
 if(t>0){const ws='ws_'+type+t,es=ELST[el];SK[ws]={n:skn,t:WT[type].t,pw:WPW[t],el,mp:WMP[t],...(t===3||t===5?{all:1}:{}),...(es?{st:{[es[0]]:+(es[1]*1.5).toFixed(2)}}:{})};EQ[id].ws=ws}});
const SLOTS=SoulbeastContent.SLOTS();
const SLOTN=Object.fromEntries(SLOTS);
const SLOTBASE=SoulbeastContent.SLOTBASE();
const TIERS=SoulbeastContent.TIERS();
for(const sl in SLOTBASE)TIERS.forEach(([tn,lv,m,pr],ti)=>{const st={};for(const k in SLOTBASE[sl])st[k]=Math.max(1,Math.round(SLOTBASE[sl][k]*m));EQ[sl+'_'+ti]={n:SLOTN[sl]+tn,slot:sl,lv,price:pr,st,tier:ti}});
/* special gear: passives and item skills */
const SG=SoulbeastContent.SG();
for(const k in SG)EQ[k]={...SG[k],special:1};

const CON=SoulbeastContent.CON();
const CURES=SoulbeastContent.CURES();
const SEALS=SoulbeastContent.SEALS();

/* ================= BEASTS (50) ================= */
/* b: [hp,mp,patk,matk,pdef,mdef,acc,eva,spd]; ev: evolution forms [lv,name]; sig: signature skill */
const SP=SoulbeastContent.SP();
const STARTERS=SoulbeastContent.STARTERS();
const MAXPETS=80;

const ZN=SoulbeastContent.ZN();
const NPC=SoulbeastContent.NPC();

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
Object.assign(SK,SoulbeastContent.SK_additions_2());
const ADDSK=SoulbeastContent.ADDSK();
for(const k in ADDSK){CLS[k].sk.push(...ADDSK[k]);CLS[k].sk.sort((a,b)=>a[0]-b[0])}
SP.minotaur.sk[2]='heavy_stance';SP.golem.sk[1]='heavy_stance';SP.behemoth.sk[3]='heavy_stance';SP.dragon.sk[2]='focus_p';SP.redcap.sk[2]='focus_p';
Object.assign(SP,SoulbeastContent.SP_additions_1());
[['nekomata','amabie'],['kinnaree','salamander'],['cyclops','wendigo'],['bunyip','wyvern'],['roc','rajasi']].forEach((a,i)=>ZN[i].sp.push(...a));

/* ---- legendary gear: one per equipment slot per zone ---- */
const LGLV=SoulbeastContent.LGLV();
const LGW=SoulbeastContent.LGW();
const LGA=SoulbeastContent.LGA();
LGA.forEach((set,i)=>{const z=i+1;
 for(const sl in set){const [n,pas,sk]=set[sl],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(2,Math.round(SLOTBASE[sl][k]*TIERS[i][2]*1.6));
  EQ[`lg${z}_${sl}`]={n,slot:sl,lv:LGLV[i],price:3000*z,st,pas,...(sk?{sk}:{}),legend:z}}
 const [wn,el,skn,def,pas]=LGW[i];
 for(const type in WT){const st=wStats(type,z);for(const k in st)st[k]=Math.round(st[k]*1.2);const ws=`lgs${z}_${type}`;
  SK[ws]={n:skn,t:WT[type].t,el,mp:10+i*2,...def};EQ[`lg${z}_weapon_${type}`]={n:WT[type].n+wn,slot:'weapon',wt:type,t:WT[type].t,lv:LGLV[i],price:4000*z,st,el,ws,pas,legend:z}}});


/* ================= v6 ADDITIONS ================= */
TIERS.push(['ทมิฬ',40,15,15000]);
for(const sl in SLOTBASE){const [tn,lv,m,pr]=TIERS[5],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(1,Math.round(SLOTBASE[sl][k]*m));EQ[sl+'_5']={n:SLOTN[sl]+tn,slot:sl,lv,price:pr,st,tier:5}}
WF.push(74);
/* final zone */
SP.demonlord=SoulbeastContent.SP_demonlord_1();
SK.s_demon=SoulbeastContent.SK_s_demon_1();
ZN.push({id:6,n:'ปราสาทจอมมาร',d:'ป้อมปราการทมิฬบนยอดเหว ทุกห้องมีปีศาจเฝ้า จอมมารรออยู่บนบัลลังก์ชั้นบนสุด',lv:[40,50],sp:['cerberus','basilisk','jiangshi','gargoyle','banshee','ifrit','nidhogg','ammit','wendigo'],rare:['fenrir','phoenix'],boss:{sp:'demonlord',lv:60,n:'จอมมารผู้ครองรัตติกาล'},mini:0,final:1});
LGLV.push(44);
LGW.push(['จอมมาร','dark','ทมิฬาวสาน',{pw:240,all:1,st:{charm:.15}},'lifesteal']);
LGA.push({armor:['เกราะแม่ทัพปีศาจ','laststand'],gloves:['ถุงมือกรงเล็บปีศาจ','deadly'],boots:['รองเท้าเงามรณะ','firstblood'],belt:['เข็มขัดโซ่นรก','sturdy'],bracelet:['กำไลวิญญาณทาส','manadrain'],ring:['แหวนสัญญาปีศาจ','aoeboost'],necklace:['สร้อยหัวใจจอมมาร','rebirth'],crown:['มงกุฎจอมมาร','rainbow','dark_aoe']});
(()=>{const i=5,z=6,set=LGA[i];
 for(const sl in set){const [n,pas,sk]=set[sl],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(2,Math.round(SLOTBASE[sl][k]*TIERS[i][2]*1.6));EQ[`lg${z}_${sl}`]={n,slot:sl,lv:LGLV[i],price:3000*z,st,pas,...(sk?{sk}:{}),legend:z}}
 const [wn,el,skn,def,pas]=LGW[i];
 for(const type in WT){const st=wStats(type,z);for(const k in st)st[k]=Math.round(st[k]*1.2);const ws=`lgs${z}_${type}`;SK[ws]={n:skn,t:WT[type].t,el,mp:20,...def};EQ[`lg${z}_weapon_${type}`]={n:WT[type].n+wn,slot:'weapon',wt:type,t:WT[type].t,lv:LGLV[i],price:4000*z,st,el,ws,pas,legend:z}}})();

/* special milestone skills at Lv 10/20/30/40/50/60 for each class line */
const MILE=SoulbeastContent.MILE();
for(const b in MILE)for(const lv in MILE[b]){const id=`ms_${b}${lv}`;SK[id]={...MILE[b][lv],mile:1};CLS[b].sk.push([+lv,id])}
for(const b in MILE)CLS[b].sk.sort((a,c)=>a[0]-c[0]);

/* crafting: one recipe per beast, built from its materials */
const CRAFT={},CSL=['weapon','armor','gloves','boots','belt','bracelet','ring','necklace','crown'];
const zoneOfSp=k=>{let i=ZN.findIndex(z=>z.sp.includes(k));if(i<0)i=ZN.findIndex(z=>z.rare.includes(k));return Math.max(0,i)};
Object.keys(SP).filter(k=>!SP[k].noseal).forEach((k,idx)=>{const s=SP[k],zi=zoneOfSp(k),sl=CSL[idx%9],fn=s.ev?s.ev[s.ev.length-1][1]:s.n,mul=1.35*(s.rare?1.12:1),skl=s.sig||s.sk[3];
 const mats=[[k+'|0',s.rare?2:3+zi],[k+'|1',s.rare?1:2+Math.floor(zi/2)]],gold=Math.round(150*(zi+1)**2*(s.rare?2:1)),lv=[5,11,18,26,35,44][zi];
 CRAFT[k]={sl,mats,gold,lv,zi};
 if(sl==='weapon'){for(const type in WT){const st=wStats(type,Math.min(6,zi+1));for(const x in st)st[x]=Math.round(st[x]*1.1*(s.rare?1.1:1));EQ[`cf_${k}_${type}`]={n:WT[type].n+fn,slot:'weapon',wt:type,t:WT[type].t,lv,price:gold,st,el:s.t[0],ws:skl,pas:s.pas,craft:k}}}
 else{const st={};for(const x in SLOTBASE[sl])st[x]=Math.max(2,Math.round(SLOTBASE[sl][x]*TIERS[zi][2]*mul));EQ[`cf_${k}`]={n:SLOTN[sl]+fn,slot:sl,lv,price:gold,st,pas:s.pas,sk:skl,craft:k}}});

/* ================= v8: training forest ================= */
ZN.push({id:7,n:'ป่าฝึกหัด',d:'ป่าเล็กหลังเมือง อสูรตัวเล็กไม่ดุร้าย เหมาะสำหรับผู้ผนึกมือใหม่ฝึกต่อสู้และเก็บเลเวล',lv:[1,4],sp:['kappa','wisp','mandrake','jackalope','tanuki','pixie','kodama'],rare:['qilin','unicorn'],boss:{sp:'jackalope',lv:5,n:'หัวหน้าฝูงแจ็กคาโลป'},mini:0,train:1});


/* Expansion data: additive IDs keep all existing saves and arena indices valid. */
const JOB_FOCUS=SoulbeastContent.JOB_FOCUS();
function focusFor(cls){const own=CLS[cls].focus;if(own)return own;const keys=Object.keys(CLS[cls].m).filter(k=>!['hp','mp','eva'].includes(k)).sort((a,b)=>(CLS[cls].m[b]||1)-(CLS[cls].m[a]||1));return tierOf(cls)>0&&keys.length>=2?keys.slice(0,2):JOB_FOCUS[baseOf(cls)]}
function focusBonus(cls,k){return focusFor(cls).includes(k)?[.10,.20,.30][Math.min(2,tierOf(cls))]:0}
Object.assign(SK,SoulbeastContent.SK_additions_3());
for(const [el,info] of Object.entries(EL)){
 if(!SK[el+'_p1'])SK[el+'_p1']={n:'จู่โจม'+info.n,t:'p',el,pw:110,mp:4};
 if(!SK[el+'_p2'])SK[el+'_p2']={n:'พิฆาต'+info.n,t:'p',el,pw:185,mp:10,cd:1};
 if(!SK[el+'_m1'])SK[el+'_m1']={n:'เวท'+info.n,t:'m',el,pw:115,mp:5};
 if(!SK[el+'_m2'])SK[el+'_m2']={n:'มหาเวท'+info.n,t:'m',el,pw:190,mp:11,cd:1};
 SK['enchant_'+el]={n:'ประทับดาบธาตุ'+info.n,t:'buff',tg:'self',enchant:el,tn:3,mp:7,cd:1};
}
CLS.gladiator.sk.push([10,'guard_physical'],[14,'guard_magic']);
CLS.swordsman.sk.push(...Object.keys(EL).map(el=>[8,'enchant_'+el]));
CLS.archer.sk.push([18,'bow_true']);CLS.gunner.sk.push([18,'gun_true']);
CLS.mage.sk.push([4,'water_m1'],[7,'ground_m1'],[9,'flying_m1'],[20,'firestorm_dot'],[22,'whirlpool_dot']);
CLS.merchant.sk.push([10,'hire_merc']);CLS.thief.sk.push([10,'shadow_clone']);CLS.summoner.sk.push([10,'summon_golem']);
for(const sk of Object.values(SK)){
 if(['p','m','h','auto'].includes(sk.t)){
  if(sk!==SK.attack&&!sk.el)sk.el='normal';
  if(sk.all){sk.basePower=sk.pw||100;sk.pw=Math.min(sk.pw||100,160);sk.areaScale=.65;}
  if(!sk.cd&&((sk.pw||0)>=300||sk.ct||sk.revAll))sk.cd=3;
  else if(!sk.cd&&((sk.pw||0)>=220||(sk.hits||0)>=4))sk.cd=2;
 }
 if(sk.revAll&&!sk.cd)sk.cd=3;
}
const NEW_BEASTS=SoulbeastContent.NEW_BEASTS();
NEW_BEASTS.forEach(([key,n,el,subject,zone],i)=>{
 const tank=i<10;const boss=i>=10&&i<22;
 SP[key]={n,o:'ตำนานผู้พิทักษ์',t:[el],em:tank?'🛡️':'✦',r:tank?1.8:boss?3.2:1.6,b:tank?[90,35,5,5,22,22,88,3,5]:[52+zone*4,30,11+zone,10+zone,9+zone,9+zone,92,8,10],sk:tank?['guard_taunt',el+'_p1','guard_physical','guard_magic']:[el+'_p1',el+'_m1',el+'_p2',el+'_m2'],pas:tank?'sturdy':'keen',parts:[[n+'แก่นพลัง',30*zone],[n+'เศษวิญญาณ',40*zone]]};
 if(['mist_serpent','crocodile','abyss_emperor'].includes(key))SP[key].sk[2]='constrict_dot';
 const z=ZN[zone-1];if(z){if(boss)z.rare.push(key);else z.sp.push(key)}
});
ZN[0].lv=[4,9];
ZN.forEach(z=>{const candidates=NEW_BEASTS.filter((x,i)=>i>=10&&i<22&&x[4]===z.id);z.bosses=[z.boss,...candidates.map(x=>({sp:x[0],lv:z.boss.lv,n:x[1]}))];while(z.bosses.length<3){const sp=z.sp[z.bosses.length%z.sp.length];z.bosses.push({sp,lv:z.boss.lv,n:'ราชันย์'+SP[sp].n})}});
CON.godSeal={n:'ผนึกของพระเจ้า',d:'จับอสูรที่จับได้สำเร็จ 100% ต้องกำจัดเจ้าของเดิมก่อน',seal:Infinity,perfect:1,price:0,rareLoot:1};
for(const cls of Object.keys(CLS))if(!NPC.some(n=>n.cls===cls)){const tier=CLS[cls].p?(CLS[CLS[cls].p].p?2:1):0,lv=tier===0?18:tier===1?32:55;NPC.push({n:'ผู้ท้าชิง '+CLS[cls].n,cls,lv,pets:[[Object.keys(SP)[NPC.length%Object.keys(SP).length],lv]],gold:Math.round(lv*lv*12)})}
/* Per-unit cooldown: cd=1 blocks the next personal turn. */
function cooldownOf(u,id){return Math.max(0,(u.cooldowns||{})[id]||0)}
function endUnitTurn(u){if(!u||u.hp<=0)return;for(const d of (u.dots||[])){const m=typeMult(d.el,u.types);if(m>0)hurt(u,Math.max(1,Math.round(u.st.hp*d.rate*m)));d.turns--;blog(u.name+' ได้รับผล '+d.n)}u.dots=(u.dots||[]).filter(d=>d.turns>0);}
function beginUnitTurn(u){u.cooldowns=u.cooldowns||{};for(const k in u.cooldowns)u.cooldowns[k]=Math.max(0,u.cooldowns[k]-1);if(u.enchantTurns>0&&!--u.enchantTurns)delete u.enchant;if(u.immuneTurns>0&&!--u.immuneTurns)delete u.immune;if(u.summonLife!=null&&!--u.summonLife){u.hp=0;blog(u.name+' หมดเวลาอัญเชิญ');return true}return false}
function effectiveElement(u,sk){if(sk===SK.attack)return u.enchant||(u.stab||[])[0]||null;return sk.el||'normal'}
function addTemporary(u,sk){const list=sideOf(u);if(list.filter(x=>x.temporary&&x.hp>0).length>=2)return false;let n;
 if(sk.summon==='clone'){n=JSON.parse(JSON.stringify(u));n.st=Object.fromEntries(Object.entries(u.st).map(([k,v])=>[k,Math.max(1,Math.round(v*.5))]));n.hp=n.st.hp;n.mp=n.st.mp;n.skills=n.skills.slice();n.name='ร่างแยก '+u.name;}
 else if(sk.summon==='golem'){n=wildUnit('bastion_golem',u.lv,0);n.name='โกเลมอัญเชิญ';n.taunt=3;n.skills=['attack','guard_taunt'];}
 else{const P=u.kind==='player'||u.owner!=null?S.P:u;if(!Number.isFinite(P.gold))P.gold=u.lv*30;const cost=Math.floor(Math.max(0,P.gold)*.10);if(cost<1)return false;P.gold-=cost;const jobs=Object.keys(CLS).filter(c=>baseOf(c)!=='merchant'&&tierOf(c)<=Math.max(0,tierOf(u.cls)-1));const lv=Math.max(1,Math.floor(u.lv*.75));const eligible=jobs.filter(c=>tierOf(c)===0||lv>=(tierOf(c)===1?25:40));n=humanUnit('ทหารรับจ้าง',pick(eligible),lv,0);n.skills=n.skills.filter(id=>!SK[id].summon);}
 n.id=u.id+'_summon_'+(B().summonSerial=(B().summonSerial||0)+1);n.side=u.side;n.owner=u.owner;n.kind='summon';n.temporary=true;n.summonLife=sk.life+1;n.cooldowns={};n.buffs=[];n.status={};n.dots=[];n.immune=null;n.enchant=null;list.push(n);B().queue.push(n.id);return true;
}
function scoreValue(e){return Math.round(Math.max(1,e.lv||1)*(['human','player'].includes(e.kind)?15:e.boss?30:e.rare?20:8))}


/* ================= STATE & HELPERS ================= */
const SAVE='sealbeast_save_v1', SAVEIMG='sealbeast_img_v1';
let S=null, IMG={};
function load(){try{const t=localStorage.getItem(SAVE);if(t)S=JSON.parse(t)}catch(e){}try{const t=localStorage.getItem(SAVEIMG);if(t)IMG=JSON.parse(t)||{}}catch(e){}if(!S)S={screen:'start',ui:{}}}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(S))}catch(e){}}
function saveImg(){try{localStorage.setItem(SAVEIMG,JSON.stringify(IMG))}catch(e){toast('พื้นที่เก็บรูปเต็ม ลองใช้รูปขนาดเล็กลง')}}
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=n=>Math.round(n).toLocaleString(gameLocale());
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const need=l=>Math.floor(18*Math.pow(l,1.6)*(1+Math.max(0,l-20)*.03));
const expFor=l=>Math.floor(8*Math.pow(l,1.35)+6);
function rnd(s){for(const k in s)s[k]=Math.round(s[k]);return s}
function wsel(obj){const t=Object.values(obj).reduce((a,b)=>a+b,0);let r=Math.random()*t;for(const k in obj){r-=obj[k];if(r<0)return k}return Object.keys(obj)[0]}

/* ---- classes ---- */
function chain(k){const a=[];while(k){a.unshift(k);k=CLS[k].p}return a}
const tierOf=k=>chain(k).length-1;
const baseOf=k=>chain(k)[0];
const childrenOf=k=>Object.keys(CLS).filter(c=>CLS[c].p===k);
const clsMult=(k,s)=>chain(k).reduce((m,c)=>m*(CLS[c].m[s]||1),1);
const clsSkills=(k,lv)=>chain(k).flatMap(c=>CLS[c].sk.filter(([l])=>lv>=l).map(x=>x[1]));
const clsSkillsAt=(k,lv)=>chain(k).flatMap(c=>CLS[c].sk.filter(([l])=>lv===l).map(x=>x[1]));
const clsPas=k=>chain(k).flatMap(c=>CLS[c].pas);
const clsSum=k=>Math.max(1,...chain(k).map(c=>CLS[c].sum||1));
const clsWeapon=k=>CLS[baseOf(k)].w;
const isMerchant=()=>S.P&&baseOf(S.P.cls)==='merchant';
const priceOf=it=>Math.round(it.price*(isMerchant()?.85:1));
const partPrice=v=>Math.round(v*(isMerchant()?1.2:1));
function canPromote(P){const t=tierOf(P.cls);return (t===0&&P.lv>=25)||(t===1&&P.lv>=40)}

/* ---- humans ---- */
function humanStats(cls,lv,pts,eq){const s={};K.forEach((k,i)=>s[k]=(PB[i]+PG[i]*(lv-1))*clsMult(cls,k)+((pts&&pts[k])||0)*PER[k]*(1+focusBonus(cls,k)));
 for(const sl in eq){const it=EQ[eq[sl]];if(it)for(const k in it.st)s[k]+=Math.round(it.st[k]*(it.slot==='weapon'&&it.wt!==clsWeapon(cls)?.8:1))}return rnd(s)}
function humanSkills(cls,lv,eq){const a=['attack',...clsSkills(cls,lv)];for(const sl in eq){const it=EQ[eq[sl]];if(!it)continue;if(it.ws)a.push(it.ws);if(it.sk)a.push(it.sk)}return [...new Set(a)]}
function humanPas(cls,eq){const a=[...clsPas(cls)];for(const sl in eq){const it=EQ[eq[sl]];if(it&&it.pas)a.push(it.pas)}return a}
const pStats=()=>worldPowerStats(S.P,humanStats(S.P.cls,S.P.lv,S.P.pts,S.P.eq));

/* ---- beasts ---- */
function formFor(k,lv){const e=SP[k].ev||[];let f=0;e.forEach((x,i)=>{if(lv>=x[0])f=i+1});return f}
const formName=(k,f)=>f?SP[k].ev[f-1][1]:SP[k].n;
const petName=p=>formName(p.sp,p.form||0);
const sigLearned=p=>{const s=SP[p.sp];if(!s.sig)return false;return s.rare?p.lv>=SIGLV:s.ev?(p.form||0)>=s.ev.length:false};
function calcPet(p,wild=1){const sp=SP[p.sp],fm=FM[p.form||0],s={};
 K.forEach((k,i)=>{const b=i<9?sp.b[i]:5,f=(k==='acc'||k==='crit'||k==='eva')?1:fm;s[k]=(b+grow(k,b)*(p.lv-1)*wild)*f+((p.pts&&p.pts[k])||0)*PER[k]});return rnd(s)}
/* Mist expansion: additive species/skills; no changes to existing pets or saves. */
const MIST_RARE_DEFS=SoulbeastContent.MIST_RARE_DEFS();
const MIST_LEGEND_DEFS=SoulbeastContent.MIST_LEGEND_DEFS();
const MIST_SIGNATURES=SoulbeastContent.MIST_SIGNATURES();
MIST_RARE_DEFS.forEach(([key,n,t,ref,zone,pas,part,o])=>{
 SP[key]={n,o,t,em:'✧',r:4.8,rare:1,mistNew:1,mistZone:zone,b:SP[ref].b.slice(),sk:[t[0]+'_p1',t[1]+'_m1',t[0]+'_st',t[0]+'_m2'],pas,sig:'mist_sig_'+key,parts:[['แก่น'+part,400+zone*80],['ผนึกเศษ'+part,500+zone*90]]};
 SK['mist_sig_'+key]=MIST_SIGNATURES[key];
});
MIST_LEGEND_DEFS.forEach(([key,n,t,ref,pas,part])=>{
 SP[key]={n,o:'ตำนานหลังจอมมาร',t,em:'✦',r:7.2,rare:1,legendary:1,mistNew:1,rarePair:ref,b:SP[ref].b.slice(),sk:[t[0]+'_p2',t[1]+'_m2',t[0]+'_st',t[0]+'_aoe'],pas,sig:'mist_sig_'+key,parts:[['แก่นตำนาน'+part,1500],['เศษผนึก'+part,1900]]};
 SK['mist_sig_'+key]=MIST_SIGNATURES[key];
});
const mistBaseCalcPet=calcPet;
calcPet=function(p,wild=1){
 const sp=SP[p.sp];
 if(sp.legendary){const s=calcPet({...p,sp:sp.rarePair,form:0},wild);for(const k of K)s[k]=Math.round(s[k]*1.2);return s;}
 const s=mistBaseCalcPet(p,wild);if(sp.mistNew)for(const k of K)s[k]=Math.round(s[k]*1.2);return s;
};

function petSkills(p){const s=SP[p.sp],a=['attack',...s.sk.filter((_,i)=>p.lv>=SKLV[i])];if(sigLearned(p))a.push(s.sig);return a}
const petBy=uid=>S.P.pets.find(p=>p.uid===uid);
const party=()=>S.P.party.map(petBy).filter(Boolean);
function fixParty(){normalizePack()}
function mkPet(sp,lv,form){const p={uid:S.P.uid++,sp,lv,form:form??formFor(sp,lv),exp:0,pts:{},free:(lv-1)*3};const s=calcPet(p);p.hp=s.hp;p.mp=s.mp;return p}

function gainExp(o,amt,isP){const lines=[];o.exp+=amt;
 while(o.lv<MAXLV&&o.exp>=need(o.lv)){const before=isP?pStats():calcPet(o);o.exp-=need(o.lv);o.lv++;ExtraAudio.play('level');o.free=(o.free||0)+(isP?5:3);
  if(!isP){const nf=formFor(o.sp,o.lv);if(nf>(o.form||0)){markFormSeen(o.sp,o.form||0);o.form=nf;markFormSeen(o.sp,nf);lines.push(`✦ ${SP[o.sp].n} พัฒนาร่างเป็น ${formName(o.sp,nf)}!`);if(nf===SP[o.sp].ev.length&&SP[o.sp].sig)lines.push(`${formName(o.sp,nf)} เรียนรู้สกิลเฉพาะตัว ${SK[SP[o.sp].sig].n}`)}}
  const after=isP?pStats():calcPet(o);o.hp+=after.hp-before.hp;o.mp+=after.mp-before.mp;
  lines.push(`${isP?o.name:petName(o)} เลเวลอัปเป็น Lv ${o.lv}!`);
  if(isP){clsSkillsAt(o.cls,o.lv).forEach(id=>lines.push(`เรียนรู้สกิล ${SK[id].n}`));if(canPromote(o)&&(o.lv===25||o.lv===40))lines.push('★ เลื่อนอาชีพได้แล้ว! ไปที่หน้าตัวละคร')}
  else{const i=SKLV.indexOf(o.lv);if(i>0&&SP[o.sp].sk[i])lines.push(`${petName(o)} เรียนรู้ ${SK[SP[o.sp].sk[i]].n}`);if(SP[o.sp].rare&&o.lv===SIGLV)lines.push(`${petName(o)} เรียนรู้สกิลเฉพาะตัว ${SK[SP[o.sp].sig].n}`)}}
 if(o.lv>=MAXLV)o.exp=0;
 return lines}
function loseExp(o,frac){const l=Math.floor(need(o.lv)*frac),lost=Math.min(o.exp,l);o.exp-=lost;return lost}

/* ================= PORTRAITS & TEXT ================= */
/* Procedural audio: preferences are separate from game saves. */

// Uploaded music is embedded so the game also works when opened as a local file.
const MUSIC_ASSETS=SoulbeastContent.MUSIC_ASSETS();
const Music={tracks:{},current:'',serial:0,
 track(key){if(this.tracks[key])return this.tracks[key];const audio=new Audio(MUSIC_ASSETS[key]);audio.preload='none';audio.loop=key!=='step';const source=Sound.ctx.createMediaElementSource(audio),gain=Sound.ctx.createGain();gain.gain.value=0;source.connect(gain);gain.connect(audioBus(audioTrackKind(key)));return this.tracks[key]={audio,gain}},
 play(key,level){try{const t=this.track(key);t.gain.gain.cancelScheduledValues(Sound.ctx.currentTime);t.gain.gain.setValueAtTime(0,Sound.ctx.currentTime);t.gain.gain.linearRampToValueAtTime(level,Sound.ctx.currentTime+.6);const p=t.audio.play();if(p)p.catch(()=>{});return t}catch(e){return null}},
 sync(){if(!Sound.enabled||document.hidden||Sound.ctx?.state!=='running'){this.stop();return}const battle=S.screen==='battle'&&S.battle||S.screen==='pvp'&&PVP.room?.status==='active'||S.screen==='camp'&&CAMP.room?.status==='active';const key=!S.P||S.screen==='start'?'intro':battle?'tense':S.zone?(['spring','revival','cleanse'].includes(S.zone.ev?.type)?'water':'forest'):'town';const scene=key+':'+(isBossDoorScene()?'boss-door':'')+':'+S.screen+':'+(S.zone?.ev?.type||'')+':'+(S.battle?.over?.res||'');if(this.current===key&&this.scene===scene)return;this.scene=scene;if(this.current){const old=this.tracks[this.playing||this.current];if(old){old.audio.pause();old.audio.currentTime=0}}this.current=key;let selected=key;if(key==='tense')selected=ExtraAudio.choose('battleMusic')||key;else if(key==='town'&&S.screen==='hospital')selected=ExtraAudio.choose('peaceMusic')||key;else if(key==='town'&&S.screen==='story')selected=ExtraAudio.choose('pianoMusic')||key;else if(key==='forest'&&isBossDoorScene())selected=ExtraAudio.choose('hauntMusic')||'tense';else if(key==='forest'&&['mist','ruins'].includes(S.zone?.ev?.type))selected=ExtraAudio.choose('hauntMusic')||key;if(S.battle?.over?.res==='lose')selected=ExtraAudio.choose('sadMusic')||selected;this.playing=selected;this.play(selected,.38)},
 step(){if(!Sound.enabled||document.hidden)return;Sound.run(()=>{const t=this.track('step');t.audio.pause();t.audio.currentTime=0;this.play('step',.65)})},
 stop(){this.current='';for(const t of Object.values(this.tracks)){t.audio.pause();t.audio.currentTime=0}}
};


const ExtraAudio={groups:{"peaceMusic": ["a0"], "charge": ["a1"], "grand": ["a2", "a38"], "fairy": ["a3", "a27"], "water": ["a4"], "psychicStrong": ["a5"], "psychic": ["a6"], "fireStrong": ["a7"], "boss": ["a8", "a11"], "roar": ["a9", "a10", "a21", "a79", "a80", "a81"], "hauntMusic": ["a12"], "sadMusic": ["a13"], "gun": ["a14"], "windStrong": ["a15", "a34"], "electricStrong": ["a16", "a22"], "battleMusic": ["a17"], "wind": ["a18"], "ghost": ["a19"], "sea": ["a20"], "quest": ["a23", "a96"], "healTeam": ["a24"], "pianoMusic": ["a25"], "ground": ["a26"], "waterStrong": ["a28"], "iceStrong": ["a29"], "ice": ["a30"], "dark": ["a31"], "darkStrong": ["a32", "a33"], "warp": ["a35"], "rockStrong": ["a36"], "rock": ["a37"], "heal": ["a39"], "fire": ["a40"], "tiger": ["a41"], "bird": ["a42", "a48", "a77", "a87", "a92"], "electric": ["a43", "a44"], "level": ["a45"], "axe": ["a46"], "axeStrong": ["a47", "a49", "a53"], "dagger": ["a50", "a57", "a58", "a62", "a69", "a75"], "maceStrong": ["a51"], "mace": ["a52"], "bowTeam": ["a54"], "bowStrong": ["a55"], "seal": ["a56"], "equip": ["a59"], "forge": ["a60"], "coin": ["a61", "a71", "a72", "a73"], "win": ["a63"], "evolution": ["a64"], "drink": ["a65"], "bow": ["a66"], "miss": ["a67", "a68"], "buy": ["a70"], "warn": ["a74"], "whip": ["a76"], "sword": ["a78"], "shield": ["a82"], "poison": ["a83"], "status": ["a84"], "lose": ["a85", "a94"], "insect": ["a86"], "cat": ["a88"], "small": ["a89", "a93"], "frog": ["a90"], "elephant": ["a91"], "error": ["a95"]},counts:{},active:[],last:{},warningTimer:null,warned:'',
 choose(g){const list=this.groups[g]||this.groups.grand;if(!list?.length)return '';const i=this.counts[g]||0;this.counts[g]=i+1;return list[i%list.length]},
 play(g,delay=0){if(!Sound.enabled||document.hidden)return;const now=Date.now();if(now-(this.last[g]||0)<140)return;this.last[g]=now;const key=this.choose(g);if(!key)return;Sound.run(()=>{try{const t=Music.track(key);t.audio.loop=false;t.audio.pause();t.audio.currentTime=0;this.active=this.active.filter(x=>x!==t&&!x.audio.ended);while(this.active.length>=6)this.active.shift().audio.pause();this.active.push(t);Music.play(key,.55)}catch(e){}})},
 skill(id,u,strong=false){const sk=SK[id];if(!sk)return false;if(sk.t==='heal'||sk.cure){this.play(sk.tg==='team'?'healTeam':'heal');return true}if(sk.t==='form'||sk.t==='revert'){this.play('warp');return true}if(sk.t==='rest'){this.play('heal');return true}if(sk.t==='buff'){this.play(sk.bf&&(sk.bf.pdef||sk.bf.mdef)?'shield':'fairy');return true}const high=strong||(sk.pw||0)>=160||sk.ct;const magic=sk.t==='m'||sk.t==='auto'&&u?.atkType==='m';if(magic){const el=sk.el||'psychic',map={fire:'fire',water:'water',ice:'ice',electric:'electric',psychic:'psychic',dark:'dark',ghost:'dark',rock:'rock',ground:'ground',flying:'wind',fairy:'fairy',dragon:'fire'};let g=map[el]||'grand';if(high&&this.groups[g+'Strong'])g+='Strong';this.play(g);return true}const wt=u?.cls?clsWeapon(u.cls):u?.form==='hawk'?'bow':'sword';let g=wt;if(wt==='bow'&&sk.all)g='bowTeam';if(high&&this.groups[wt+'Strong'])g=wt+'Strong';if(!this.groups[g])g=high?'grand':'roar';this.play(g);return true},
 cry(sp,death){if(!SP[sp])return false;const types=SP[sp].t;let g=sp==='demonlord'?'boss':sp==='erawan'?'elephant':['nekomata','baihu','rajasi'].includes(sp)?'tiger':['tanuki','jackalope'].includes(sp)?'small':['kappa','amabie'].includes(sp)?'frog':sp==='scarab'?'insect':types.includes('ghost')?'ghost':sp==='kraken'?'sea':['garuda','roc','harpy','tengu','thunderbird','kinnaree','phoenix','griffin'].includes(sp)?'bird':sp==='kitsune'?'cat':'roar';this.play(death?'lose':g);return true},
 stop(){clearTimeout(this.warningTimer);for(const t of this.active)t.audio.pause();this.active=[]},
 syncWarning(){clearTimeout(this.warningTimer);const room=PVP.room;if(!Sound.enabled||document.hidden||S.screen!=='pvp'||room?.status!=='active')return;const stamp=room.id+':'+room.rev;if(this.warned===stamp)return;const wait=room.deadline-room.serverTime-(Date.now()-(PVP.audioAt||Date.now()))-5000;this.warningTimer=setTimeout(()=>{if(PVP.room?.rev===room.rev&&S.screen==='pvp'){this.warned=stamp;this.play('warn')}},Math.max(0,wait))}
};
Object.assign(MUSIC_ASSETS,SoulbeastContent.MUSIC_ASSETS_additions_1());


// New recordings: explicit species identity and weapon-specific gun sounds.
Object.assign(MUSIC_ASSETS,SoulbeastContent.MUSIC_ASSETS_additions_2());Object.assign(ExtraAudio.groups,{"voice_vampire": ["newvoice0", "newvoice1", "newvoice10", "newvoice11"], "voice_treant": ["newvoice2"], "voice_demon": ["newvoice3"], "voice_rockfall": ["newvoice4"], "voice_phoenix": ["newvoice5"], "voice_gorilla": ["newvoice6"], "voice_lion": ["newvoice7"], "voice_dog": ["newvoice8", "newvoice25"], "voice_zombie": ["newvoice9"], "voice_meow": ["newvoice12"], "voice_croc": ["newvoice13"], "voice_horse": ["newvoice14"], "voice_imp": ["newvoice15"], "voice_witch": ["newvoice16"], "voice_eagle": ["newvoice17"], "voice_crow": ["newvoice18"], "voice_goblin": ["newvoice19"], "voice_kodama": ["newvoice20"], "voice_mermaid": ["newvoice21"], "voice_mandrake": ["newvoice22"], "voice_bear": ["newvoice23"], "voice_wolf": ["newvoice24"], "voice_fox": ["newvoice26"], "voice_gunRapid": ["newvoice27"], "voice_gunBlast": ["newvoice28"], "voice_gunCannon": ["newvoice29"], "voice_gunCrit": ["newvoice30"], "voice_gunSingle": ["newvoice31"]});
const SPECIES_VOICE=SoulbeastContent.SPECIES_VOICE();
const originalRecordedCry=ExtraAudio.cry.bind(ExtraAudio);
ExtraAudio.cry=function(sp,death){const voice=SPECIES_VOICE[sp];if(!voice)return originalRecordedCry(sp,death);this.play('voice_'+voice);return true};
const originalRecordedSkill=ExtraAudio.skill.bind(ExtraAudio);
ExtraAudio.skill=function(id,u,strong=false){const sk=SK[id];if(!sk)return false;if(sk.t==='form'&&sk.form==='wolf'){this.play('voice_wolf');return true}if(sk.t==='form'&&sk.form==='bear'){this.play('voice_bear');return true}if(u?.cls&&clsWeapon(u.cls)==='gun'&&['auto','p','h'].includes(sk.t)){this.play(strong?'voice_gunCrit':sk.ct?'voice_gunCannon':sk.all?'voice_gunBlast':sk.hits>=3?'voice_gunRapid':'voice_gunSingle');return true}if(sk.el==='ground'&&(sk.all||strong)){this.play('voice_rockfall');return true}return originalRecordedSkill(id,u,strong)};

const Sound={ctx:null,master:null,noise:null,enabled:false,volume:.35,voices:new Set(),pending:[],amb:null,ambType:'',unlocking:null,
 load(){try{const p=JSON.parse(localStorage.getItem('sealbeast_audio_v1')||'{}');this.enabled=p.enabled===true;if(Number.isFinite(p.volume))this.volume=Math.max(0,Math.min(1,p.volume))}catch(e){}},
 save(){try{localStorage.setItem('sealbeast_audio_v1',JSON.stringify({enabled:this.enabled,volume:this.volume}))}catch(e){}},
 async unlock(){if(!this.enabled)return false;try{if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C){this.enabled=false;this.save();return false}this.ctx=new C();this.master=this.ctx.createGain();const comp=this.ctx.createDynamicsCompressor();this.master.gain.value=this.volume;comp.threshold.value=-18;comp.ratio.value=8;this.master.connect(comp);comp.connect(this.ctx.destination);const rate=this.ctx.sampleRate;this.noise=this.ctx.createBuffer(1,rate*2,rate);const data=this.noise.getChannelData(0);let seed=9173;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296*2-1)}}
  if(this.ctx.state!=='running'){if(!this.unlocking)this.unlocking=this.ctx.resume().finally(()=>{this.unlocking=null});await this.unlocking}
  if(this.enabled&&this.ctx.state==='running'){const jobs=this.pending.splice(0);jobs.forEach(f=>f());this.sync();return true}return false}catch(e){this.pending=[];return false}},
 run(job){if(!this.enabled||document.hidden)return;if(this.ctx?.state==='running'){try{job()}catch(e){}}else if(this.pending.length<8)this.pending.push(job)},
 tone(freq,end,duration=.15,level=.07,type='sine',delay=0){if(!this.ctx||this.voices.size>=24)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(level,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audioBus('effects'));this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect()};o.start(t);o.stop(t+duration+.02)},
 hiss(duration=.2,level=.05,frequency=1000,delay=0,kind='bandpass'){if(!this.ctx||this.voices.size>=24)return;const t=this.ctx.currentTime+delay,s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=this.noise;f.type=kind;f.frequency.value=frequency;f.Q.value=.8;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(level,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(g);g.connect(audioBus('effects'));this.voices.add(s);s.onended=()=>{this.voices.delete(s);s.disconnect();f.disconnect();g.disconnect()};s.start(t);s.stop(t+duration+.02)},
 fx(kind,delay=0){const mapped={charge:'charge',shield:'shield',revive:'healTeam',blessing:'heal',win:'win',lose:'lose',coins:'coin',chest:'coin',shot:'gun',blade:'sword',arrow:'bow',water:'water',ice:'ice',storm:'electricStrong',flame:'fire',spirit:'dark',eclipse:'darkStrong',quake:'ground',music:'quest'}[kind];if(mapped){ExtraAudio.play(mapped,delay);return}this.run(()=>{const tone=(a,b,d=.2,v=.07,w='sine',off=0)=>this.tone(a,b,d,v,w,delay+off),noise=(d,v,f,off=0,ty='bandpass')=>this.hiss(d,v,f,delay+off,ty);
  if(kind==='click')tone(780,520,.065,.035);
  else if(kind==='step'){noise(.09,.06,180,0,'lowpass');noise(.09,.05,220,.17,'lowpass')}
  else if(kind==='blade'||kind==='claw'||kind==='shadow'){noise(.16,.09,2500);tone(650,110,.12,.055,'sawtooth');if(kind==='shadow')tone(180,70,.25,.04)}
  else if(kind==='shot'){noise(.09,.10,1100);tone(100,35,.12,.075,'triangle')}
  else if(kind==='arrow'||kind==='wing'){noise(.28,.07,1600);tone(850,220,.18,.04,'triangle')}
  else if(kind==='water'){noise(.55,.055,650);for(let i=0;i<4;i++)tone(380+i*90,650+i*75,.10,.035,'sine',i*.085)}
  else if(kind==='ice'){for(let i=0;i<4;i++)tone(1200+i*260,800+i*200,.22,.035,'sine',i*.035)}
  else if(kind==='storm'){noise(.16,.09,3500);tone(85,35,.35,.07,'sawtooth');tone(1400,500,.09,.03,'square',.07)}
  else if(kind==='flame'||kind==='dragon'||kind==='phoenix'){noise(.45,.085,400,0,'lowpass');tone(kind==='dragon'?90:160,50,.4,.065,'sawtooth')}
  else if(kind==='quake'){tone(80,28,.4,.085,'triangle');noise(.35,.07,180,0,'lowpass')}
  else if(kind==='shield'){tone(240,180,.2,.06,'triangle');tone(1200,900,.3,.035,'sine',.02)}
  else if(kind==='spirit'||kind==='eclipse'){tone(170,55,.5,.06,'sawtooth');tone(520,180,.45,.04);noise(.4,.04,450)}
  else if(kind==='roots'){noise(.4,.07,900);tone(210,340,.3,.035,'triangle')}
  else if(kind==='mist'){noise(.65,.055,700);tone(330,280,.6,.02)}
  else if(kind==='blessing'||kind==='revive'||kind==='rune'||kind==='charge'){for(let i=0;i<4;i++)tone([392,494,587,784][i],[392,494,587,784][i]*1.01,.35,.045,'sine',i*.075)}
  else if(kind==='music'||kind==='coins'||kind==='chest'||kind==='win'){for(let i=0;i<3;i++)tone([523,659,784][i],[523,659,784][i],.22,.05,'triangle',i*.1)}
  else if(kind==='lose'){tone(300,100,.5,.055,'triangle');tone(220,65,.55,.04,'sine',.12)}
 })},
 skill(id,u){if(ExtraAudio.skill(id,u))return;if(id==='rest'){this.fx('blessing');return}if(id==='attack'){if(u?.kind==='player'||u?.kind==='human'){const wt=u.cls?clsWeapon(u.cls):'sword';this.fx(wt==='gun'?'shot':wt==='bow'?'arrow':['sword','axe','dagger','mace'].includes(wt)?'blade':'rune')}else this.fx('claw');return}this.fx(skillLook(id)[0])},
 cry(sp,death=false,delay=0){if(ExtraAudio.cry(sp,death))return;if(!sp||!SP[sp])return;this.run(()=>{let hash=0;for(const ch of sp)hash=(hash*31+ch.charCodeAt(0))>>>0;const el=SP[sp].t[0],bird=['pixie','kinnaree','garuda','griffin','thunderbird','roc','harpy','tengu'].includes(sp),deep=['dragon','naga','hydra','demonlord','behemoth','golem','nidhogg','jormungandr','kraken'].includes(sp),ghost=['ghost','psychic','fairy'].includes(el);const base=(bird?650:deep?65:ghost?350:130)+(hash%90);this.tone(base,base*(death?.42:1.35),death?.5:.32,deep?.085:.055,bird||ghost?'sine':'sawtooth',delay);if(!death)this.tone(base*1.1,base*.85,.22,.04,bird?'sine':'triangle',delay+.22);if(!bird)this.hiss(death?.35:.45,.05,deep?220:ghost?900:550,delay,'lowpass')})},
 stopAmb(){if(this.amb){try{this.amb.source.stop()}catch(e){}this.amb.source.disconnect();this.amb.filter.disconnect();this.amb.gain.disconnect();this.amb=null}this.ambType=''},
 sync(){this.stopAmb();Music.sync();ExtraAudio.syncWarning()},
 mute(){ExtraAudio.stop();Music.stop();this.pending=[];this.stopAmb();for(const s of this.voices){try{s.stop()}catch(e){}}},
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.03);this.save()}
};Sound.load();
function soundPanel(){return `<div class="card stack"><div class="row"><h3 class="grow">เสียงเกม</h3><button class="btn sm" data-a="soundtoggle" aria-pressed="${Sound.enabled}">${Sound.enabled?'🔊 เปิดอยู่':'🔇 กดเพื่อเปิดเสียง'}</button></div><label class="row"><span>ระดับเสียง</span><input id="soundVolume" type="range" min="0" max="100" value="${Math.round(Sound.volume*100)}" style="flex:1;min-width:0" aria-label="ระดับเสียงเกม"><output id="soundPercent">${Math.round(Sound.volume*100)}%</output></label><small class="sub">เพลงและเสียงบรรยากาศจากไฟล์ที่คุณส่งมา พร้อมเสียงสกิลและอสูร ปรับเสียงเบาก่อนเริ่มเล่น</small></div>`}

const ART_BEASTS=SoulbeastContent.ART_BEASTS();
const ART_HEROES=SoulbeastContent.ART_HEROES();
const ART_FORMS=SoulbeastContent.ART_FORMS();
const STORY=SoulbeastContent.STORY();
const BUILTIN_ART=SoulbeastContent.BUILTIN_ART();
const BUILTIN_SCENES=["assets/media/00f53b8f7c9f2ca72cd3aa25.webp","assets/media/460b762d271285c444b0f7fa.webp","assets/media/9f874523f68aaee38228c336.webp","assets/media/7b63623a4da1696d8900ee85.webp","assets/media/2b4acea7597147820ef3dc33.webp","assets/media/f75bd1fb3cf1f171238074c2.webp","assets/media/94a9040dc15df70ec17bce99.webp","assets/media/d6b72b71224bc4f802364d81.webp","assets/media/441f2850a4d085c9a53196cc.webp"];
const ROUTE_ART={"beast":"assets/media/83f8e34215dc144f80ff1dd8.webp","bush":"assets/media/9c7b0a15d74efd07abea14ac.webp","mist":"assets/media/bc8a0bd07fad8c6eecf0f0c3.webp","ruins":"assets/media/1768142eb41df7b938b1bfd3.webp","bandit":"assets/media/e60e7f0018468fcc9c450cfe.webp","spring":"assets/media/4c73e62af3bd4cb07fa6ca26.webp","shrine":"assets/media/75cca477ae23c877efa99972.webp","village":"assets/media/52bbcf608e04ac5bac4af240.webp","hospital":"assets/media/bd4e0d837f6c05bd9277216a.webp","stranger":"assets/media/4f8b56bb78be03fd4f3c8986.webp","exit":"assets/media/44ba8d9d1e0fb7a84eb36026.webp","unknown":"assets/media/14b261b589bdaf5ed68b649f.webp","chest":"assets/media/00d6dd41329e230760ded92f.webp","trap":"assets/media/8cc3c50f4f7fc8d6dd9cf8c5.webp","walk":"assets/media/cb6c87986123235089e46935.webp","boss":"assets/media/a8972bf26e3633408aab2c28.webp"};
const ITEM_ART={"pot":"assets/media/63c335a73a6a590349a6e6d2.webp","pot2":"assets/media/b86a27ef43252429632bbe57.webp","pot3":"assets/media/b374b749ccb44d0c129b511b.webp","eth":"assets/media/9286c860a849d4d31422a415.webp","eth2":"assets/media/1d68952be456ccc7c5469e1a.webp","rev":"assets/media/28087063529d52b7849048fd.webp","antidote":"assets/media/c3e5a945ec149b0772e06626.webp","burnheal":"assets/media/ef38a1b90c7a0e4af23c9307.webp","thaw":"assets/media/a4293868d890934ee2d749fa.webp","relax":"assets/media/1644cc9a053bf060fa8a7eea.webp","calm":"assets/media/c5588155d4a8e48cfe54b1e1.webp","allcure":"assets/media/2d10790c7af5fbe5e6076e5a.webp","seal1":"assets/media/f1a44ab79c10c68d59fcaa05.webp","seal2":"assets/media/b55b5fa4ec97564da9cd3a5e.webp","seal3":"assets/media/07d709da9d8e22abe5ce05e5.webp","seal4":"assets/media/922cbed1f4ed7682f3b8f46e.webp","seal5":"assets/media/c2647667a4b22f3777ca4303.webp","sword":"assets/media/655fb42212df8f03df3d3ebf.webp","axe":"assets/media/826d0e1462f41334d388073a.webp","bow":"assets/media/652855bf5747aa4574c60931.webp","staff":"assets/media/0d0666f6699d65079f3f4a10.webp","mace":"assets/media/52f4b8d4d172268c351f64a9.webp","gun":"assets/media/19111cacdff328d4d8381562.webp","druid":"assets/media/943170abbb24803600c780ab.webp","dagger":"assets/media/a78b0f5d6512e8726686c3d0.webp","orb":"assets/media/727b4530c22de0e9373d825e.webp","armor":"assets/media/acd6f34b8d73a01789e87c5a.webp","gloves":"assets/media/fce62c39ef78958db59f57f6.webp","boots":"assets/media/9866229d833f95918f8a5195.webp","belt":"assets/media/08e2a9cf05083a6c43d627d6.webp","bracelet":"assets/media/24014e6e58de20bcb23593ec.webp","ring":"assets/media/3c399208357a644db019879c.webp","necklace":"assets/media/2516222f9de92639623108ba.webp","crown":"assets/media/33ba9556f8b80c2feede1d24.webp","chest":"assets/media/37b22ac5cdb395aa00137a62.webp","goldchest":"assets/media/ec0ed7fe7d97319e75020783.webp","whip":"assets/media/9b6b12415ecc15c9ecc6c0a9.webp"};
function itemIcon(id,size=44){const it=EQ[id]||CON[id],part=String(id).split('|');let art=ITEM_ART[id],tone='#66728e',badge='';
 if(it?.slot){art=ITEM_ART[it.slot==='weapon'?it.wt:it.slot];tone=it.legend?'#d9b35b':it.el&&EL[it.el]?EL[it.el].c:'#99b2c9';badge=it.legend?'✦':it.lv>1?'L'+it.lv:''}
 if(it?.rareLoot){tone='#c9f5df';badge='✦'}
 if(!art&&part.length===2){art=BUILTIN_ART[part[0]];badge='◆';tone='#acbfce'}
 if(!art)return '';return `<span class="item-art ${it?.legend?'legendary':''}" style="--item-size:${size}px;--item-color:${tone}"><img src="${art}" alt="">${badge?`<small>${badge}</small>`:''}</span>`}
function routePicture(type,hidden=false,banner=false){const k=hidden?'unknown':ROUTE_ART[type]?type:'walk';return `<img class="${banner?'route-banner':'route-picture'}" src="${ROUTE_ART[k]}" alt="${hidden?'ทางมืดที่ยังไม่รู้ว่ามีอะไร':EV[type]?.n||'เส้นทางในพงไพร'}">`}
let walkTimer=null;
function playWalk(type,side){Music.step();Sound.fx(type==='bush'?'roots':type==='mist'||type==='stranger'?'mist':(type==='spring'||type==='cleanse')?'water':type==='revival'||type==='shrine'||type==='hospital'?'revive':type==='ruins'?'rune':'',.15);if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const L=document.getElementById('travelFx'),app=document.getElementById('app');if(!L||!app)return;
 clearTimeout(walkTimer);L.replaceChildren();app.classList.remove('walk-bob','walk-side');void app.offsetWidth;app.classList.add(['beast','bandit'].includes(type)?'walk-side':'walk-bob');
 const add=(cls,i,txt='',color='')=>{const d=document.createElement('span');d.className=cls;d.textContent=txt;d.style.setProperty('--x',(16+(i*19)%70)+'%');d.style.setProperty('--y',(22+(i*13)%53)+'%');d.style.setProperty('--dx',(side?90:-90)+'px');if(color)d.style.setProperty('--c',color);L.appendChild(d)};
 if(type==='bush')for(let i=0;i<9;i++)add('trail-leaf',i);
 else if(type==='mist'||type==='stranger')for(let i=0;i<3;i++)add('trail-fog',i);
 else if(type==='spring'||type==='revival'||type==='cleanse')for(let i=0;i<3;i++)add('trail-water',i);
 else if(type==='shrine'||type==='ruins'||type==='exit')for(let i=0;i<7;i++)add('trail-spark',i,'✧');
 else if(type==='hospital')for(let i=0;i<5;i++)add('trail-spark',i,'✚','#a0edba');
 else if(type==='beast')for(let i=0;i<3;i++)add('trail-spark',i,'🐾','#dec8a1');
 else if(type==='bandit')for(let i=0;i<5;i++)add('trail-spark',i,'✧','#e69d63');
 walkTimer=setTimeout(()=>{L.replaceChildren();app.classList.remove('walk-bob','walk-side')},1050)}

ROUTE_ART.revival='assets/media/36e5c41c2ec0b1c8f2c4702d.webp';
ITEM_ART.revivePotion='assets/media/4ef37cbbfc655c01d2044bed.webp';
Object.assign(BUILTIN_ART,SoulbeastContent.BUILTIN_ART_additions_1());
BUILTIN_ART['naga:1']='assets/media/4e3504b508f596794327e780.webp';
/* PVP client: server snapshots are kept outside the RPG state. */
const PVP={room:null,token:'',code:'',busy:false,error:'',timer:null,pending:null,target:'',friend:''};
function pvpSessionSave(){try{localStorage.setItem('sealbeast_pvp_v1',JSON.stringify({endpoint:String(window.SHEET_URL||'').trim(),room:PVP.room?.id||'',token:PVP.token,code:PVP.code,pending:PVP.pending}))}catch(e){}}
function pvpSessionLoad(){try{const p=JSON.parse(localStorage.getItem('sealbeast_pvp_v1')||'{}');if(p.endpoint===String(window.SHEET_URL||'').trim()&&p.token&&p.room){PVP.token=p.token;PVP.code=p.code;PVP.restore=p.room;PVP.pending=p.pending||null}}catch(e){}}
pvpSessionLoad();
function pvpError(message){return ({'bad action':'ต้องอัปเดต ระบบต่อสู้ แล้ว Deploy เวอร์ชันใหม่ก่อนใช้ PVP',pin:'PIN ของเซฟไม่ตรงกับ เซิร์ฟเวอร์ออนไลน์',notfound:'ไม่พบเซฟบน ระบบออนไลน์ โปรดบันทึกเซฟก่อน','room not found':'ไม่พบห้องนี้','room expired':'ห้องหมดอายุ','room full':'ห้องมีผู้เล่นครบแล้ว','same player':'ใช้ตัวละครเดียวกันสู้กันไม่ได้','already in room':'ตัวละครนี้อยู่ในห้องอื่น กดเชื่อมต่อห้องเดิม','no active room':'ไม่มีห้องที่ยังเปิดอยู่',unauthorized:'สิทธิ์ห้องหมดอายุหรือเปิดจากอีกเครื่อง กดเชื่อมต่อห้องเดิม','bad points':'แต้มสถานะในเซฟเกินเกณฑ์ PVP','bad class':'อาชีพไม่ตรงกับระดับเลเวล','bad equipment':'อุปกรณ์ในเซฟไม่ตรงกับระดับหรือช่อง','bad weapon':'อาวุธไม่ตรงกับอาชีพ','not your turn':'ยังไม่ถึงเทิร์นของคุณ','stale turn':'เทิร์นเปลี่ยนแล้ว กำลังตรวจข้อมูลใหม่','items not allowed':'PVP ห้ามใช้ยาและไอเท็มรักษา','illegal skill':'สกิลนี้ใช้ไม่ได้','not enough mp':'MP ไม่พอ','not enough gold':'เหรียญเฉพาะแมตช์ไม่พอ','not lobby':'ห้องเริ่มหรือปิดไปแล้ว กดรีเฟรช','not active':'การประลองจบแล้ว','stake changed':'เดิมพันมีการเปลี่ยน โปรดตรวจของอีกฝ่ายแล้วกดยืนยันใหม่','stake unavailable':'ของเดิมพันไม่พอหรือไม่อยู่ในเซฟออนไลน์','stake pet must rest':'อสูรต้องพักค่ายและไม่เฝ้าค่าย จึงใช้เดิมพันได้','stake history full':'เปลี่ยนเดิมพันครบจำนวนที่รองรับแล้ว'})[message]||'เชื่อมต่อ PVP ไม่สำเร็จ: '+String(message||'โปรดลองอีกครั้ง')}
function pvpSchedule(){clearTimeout(PVP.timer);if(PVP.room?.replaying)return;if(S.screen==='pvp'&&PVP.token&&!document.hidden&&(!PVP.room||['waiting','lobby','active'].includes(PVP.room.status)))PVP.timer=setTimeout(()=>pvpRequest({action:'pvp_poll'},true),PVP.room?.status==='active'?2500:8000)}
function pvpReceive(result){PVP.balanceVersion=result.balanceVersion||0;applyAccount(result.account);const prior=PVP.room;PVP.room=result.room;PVP.clock=Date.now()-PVP.room.serverTime;observeUnits([...PVP.room.battle.allies,...PVP.room.battle.enemies]);PVP.audioAt=Date.now();if(result.token)PVP.token=result.token;PVP.restore=PVP.room.id;if(PVP.pending&&(PVP.room.rev>PVP.pending.rev||PVP.room.status==='finished'))PVP.pending=null;pvpSessionSave();
 if(S.screen==='pvp'){render();if(prior&&PVP.room.rev>prior.rev){const b=PVP.room.battle,units=[...b.allies,...b.enemies],oldUnits=[...prior.battle.allies,...prior.battle.enemies];for(const u of units){const old=oldUnits.find(x=>x.id===u.id);if(old&&old.hp>0&&u.hp<=0)Sound.cry(u.sp,true)}if(PVP.room.status==='active'&&b.effects?.length){VQ.push(...b.effects);const critical=b.effects.find(e=>e.k==='hit'&&e.crit);const cast=b.effects.find(e=>e.k==='cast');if(critical)ExtraAudio.skill(critical.skill,units.find(x=>x.id===PVP.room.last?.actor),true);else if(cast)Sound.skill(cast.skill,units.find(x=>x.id===cast.id));else if(b.effects.some(e=>e.k==='charge'))Sound.fx('charge');else if(PVP.room.last?.skill==='defend')Sound.fx('shield');else{const hit=b.effects.find(e=>e.k==='hit');if(hit)Sound.skill(hit.skill,units.find(x=>x.id===PVP.room.last?.actor))}(window.requestAnimationFrame||setTimeout)(flushVfx)}if(PVP.room.status==='finished'&&prior.status!=='finished'){if(b.effects?.length){VQ.push(...b.effects);(window.requestAnimationFrame||setTimeout)(flushVfx);}Sound.fx(PVP.room.winner===PVP.room.me?'win':'lose')}}}}
async function pvpRequest(packet,silent=false){if(PVP.busy||PVP.room?.replaying)return;PVP.busy=true;if(!silent){PVP.error='';render()}try{const body={room:PVP.room?.id||PVP.restore,token:PVP.token,...packet};const r=await lbPost(body);if(!r.ok){if(packet.action==='pvp_move'){PVP.pending=null;pvpSessionSave()}throw new Error(r.error)}if(!r.room||r.pvpVersion!==1)throw new Error('bad action');PVP.error='';pvpReceive(r)}catch(e){PVP.error=pvpError(e.message);if(!silent)toast(PVP.error)}finally{PVP.busy=false;if(S.screen==='pvp')render();pvpSchedule()}}
async function pvpConnect(mode){if(PVP.busy||!S.P)return;if(S.zone||S.battle){toast('กลับเมืองก่อนเข้า PVP');return}const room=String(document.getElementById('pvpRoomCode')?.value||'').trim().toUpperCase();if(mode==='join'&&!/^[A-F0-9]{8}$/.test(room)){toast('รหัสห้องต้องมี 8 ตัว');return}
 PVP.busy=true;PVP.error='';render();try{const code=ensureCode(),P=S.P;const saved=await lbPost({action:'save',code,pin:P.cpin||'',data:gsData(),name:P.name,clsName:CLS[P.cls].n,lv:P.lv});if(!saved.ok)throw new Error(saved.error);P.gsAt=saved.at;GS.lastJson=gsData();GS.lastAt=Date.now();save();const r=await lbPost({action:'pvp_'+mode,code,pin:P.cpin||'',room});if(!r.ok)throw new Error(r.error);PVP.code=code;PVP.pending=null;pvpReceive(r)}catch(e){PVP.error=pvpError(e.message);toast(PVP.error)}finally{PVP.busy=false;if(S.screen==='pvp')render();pvpSchedule()}}
function pvpCard(u,own,me){const chosen=own?PVP.friend===u.id:PVP.target===u.id;return `<button class="ucard ${own?'ally':'foe'} ${chosen?(own?'at':'tg'):''} ${u.hp<=0?'down':''}" data-u="${u.id}" data-a="${own?'pvpFriend':'pvpTarget'}" data-v="${u.id}" ${!own&&u.hp<=0?'disabled':''}>${portrait(u.kind==='player'?(u.form?u.img:u.owner===me?'player':'cls:'+u.cls):u.img,46,{form:u.evo||0})}<div class="grow"><span class="nm" ${u.kind==='player'?'data-user-content':''}>${esc(u.name)}</span><span class="sub num">Lv ${u.lv}${u.hp<=0?' · หมดสติ':''}</span>${bar(u.hp,u.st.hp)}<span class="meta num">HP ${u.hp}/${u.st.hp} · MP ${u.mp}/${u.st.mp}</span><span class="meta">${Object.keys(u.status).map(k=>STS[k]?STS[k].n:'').filter(Boolean).join(' · ')}</span></div></button>`}
function vPvpBase(){const r=PVP.room;let content;
 if(!r){content=`<div class="card stack"><h3>ประลองด้วยตัวละครเซฟเดิม</h3><p class="sub" style="margin:0">ใช้เลเวล อาชีพ อุปกรณ์ แต้ม และทีมอสูรที่จัดไว้ ระบบบันทึกเซฟก่อนสร้างหรือเข้าห้อง เริ่ม PVP ด้วย HP/MP เต็มเฉพาะแมตช์ ผลแพ้ชนะไม่หัก EXP เหรียญ หรือ HP ในเกมหลัก</p><div class="row wrap"><button class="btn pri" data-a="pvpCreate" ${PVP.busy?'disabled':''}>สร้างห้อง</button><button class="btn" data-a="pvpResume" ${PVP.busy?'disabled':''}>เชื่อมต่อห้องเดิม</button></div><input id="pvpRoomCode" type="text" maxlength="8" autocomplete="off" placeholder="รหัสห้อง 8 ตัว"><button class="btn seal" data-a="pvpJoin" ${PVP.busy?'disabled':''}>เข้าห้องด้วยรหัส</button></div>`}
 else{const b=r.battle,all=[...b.allies,...b.enemies],own=all.filter(u=>u.owner===r.me),foes=all.filter(u=>u.owner!==r.me),actor=all.find(u=>u.id===b.cur),mine=r.status==='active'&&actor?.owner===r.me;
 if(!own.some(u=>u.id===PVP.friend))PVP.friend=own[0]?.id||'';if(!foes.some(u=>u.id===PVP.target&&u.hp>0))PVP.target=foes.find(u=>u.hp>0)?.id||'';
 let panel='';if(r.status==='waiting')panel='<p class="sub">รออีกฝ่ายเข้าห้อง ส่งรหัสห้องให้เพื่อน</p>';
 if(r.status==='lobby')panel=`<div class="card stack"><h3>ยืนยันทีมและเดิมพันก่อนเริ่ม</h3>${wagerPanel(r)}<p class="sub" style="margin:0">ทีมล็อกจากเซฟตอนเข้าห้อง ห้ามใช้ยาและไอเท็มรักษาทุกชนิด สกิลรักษายังใช้ได้ · ไม่จับอสูรหรือขโมยของจริง · เลือกคำสั่งใน 30 วินาที หมดเวลาจะเปิดออโต้ · ครบ 30 เทิร์นไม่มีผู้ชนะถือว่าเสมอ</p><div>${r.players.map(p=>`<span data-user-content>${esc(p.name)}</span> · Lv ${p.lv} · ${p.ready?'ยืนยันแล้ว':'ยังไม่ยืนยัน'}`).join('<br>')}</div><button class="btn pri" data-a="pvpReady" ${PVP.busy||PVP.stakeBusy||r.players[r.me].ready?'disabled':''}>ยืนยันทีมพร้อมสู้</button></div>`;
 if(r.status==='active'){const seconds=Math.max(0,Math.ceil((r.deadline-r.serverTime)/1000));panel=`<div class="panel">${foldCard('เดิมพันที่ตกลงไว้',wagerPanel(r))}${onlineAutoButton('pvp')}<b>${mine?'ตาของคุณ: ':'รออีกฝ่าย: '}${esc(actor?.name||'')}</b><div class="sub">เหรียญจำลองในแมตช์ ${fmt(r.gold)} · เทิร์นที่จบ ${b.turns||0}/30 · รอบ ${b.round} · เลือกคำสั่งใน 30 วินาที หมดเวลาจะเปิดออโต้</div>${mine&&!r.replaying?`<p class="sub" style="margin:0">แตะศัตรูเลือกเป้าหมาย และแตะฝ่ายเราเพื่อเลือกเป้าหมายรักษา/บัฟ</p><div class="acts">${[...new Set([...actor.skills,'rest','defend'])].map(id=>{const sk=pvpSkill(id,true),mp=sk?costOf(actor,sk):0;return `<button class="btn" data-a="pvpMove" data-v="${id}" ${PVP.busy||PVP.pending||mp>actor.mp||cooldownOf(actor,id)>0?'disabled':''}>${skillElementIcon(actor,sk,id)}<span class="skill-name">${esc(sk?.n||'ตั้งรับ')}</span><small>${cooldownOf(actor,id)?'รอ '+cooldownOf(actor,id)+' เทิร์น':mp?'MP '+mp:id==='defend'?'ป้องกัน +50%':''}${sk?.gc?' · เหรียญ '+sk.gc*actor.lv:''}${sk?.cd?' · คูลดาวน์ '+sk.cd:''}</small></button>`}).join('')}</div>`:''}</div>`}
 if(r.status==='finished')panel=`<div class="card stack"><h2>${r.winner===-1?'เสมอ / ห้องปิด':r.winner===r.me?'คุณชนะ':'คุณแพ้'}</h2><p>${esc(r.reason)}</p>${wagerPanel(r)}<p class="sub">ผลเดิมพันบันทึกบนเซิร์ฟเวอร์แล้ว</p><button class="btn pri" data-a="pvpClear">กลับหน้าสร้างห้อง</button></div>`;
 content=`<div class="card row wrap"><div class="grow"><span class="sub">รหัสห้อง</span><h2 class="num">${r.id}</h2></div><button class="btn sm" data-a="pvpCopy">คัดลอก</button><button class="btn sm" data-a="pvpResume" ${PVP.busy?'disabled':''}>เชื่อมต่อใหม่</button><button class="btn sm" data-a="pvpPoll" ${PVP.busy?'disabled':''}>รีเฟรช</button></div><h3>ฝ่ายคุณ</h3><div class="lst">${own.map(u=>pvpCard(u,true,r.me)).join('')}</div>${foes.length?`<h3>ฝ่ายตรงข้าม</h3><div class="lst">${foes.map(u=>pvpCard(u,false,r.me)).join('')}</div>`:''}${panel}<div class="log">${b.log.map(line=>`<p>${esc(line)}</p>`).join('')}</div>${PVP.pending?'<div class="card stack"><p class="sub">ยังไม่ทราบผลคำสั่งล่าสุด ตรวจสถานะหรือส่งคำสั่งเดิมซ้ำได้โดยไม่คิดเป็นเทิร์นใหม่</p><button class="btn" data-a="pvpRetry">ส่งคำสั่งเดิมอีกครั้ง</button></div>':''}${['waiting','lobby','active'].includes(r.status)?'<button class="btn danger" data-a="pvpLeave">ออกจากห้อง / ยอมแพ้</button>':''}`}
 return `<div class="stack"><div class="row"><h2 class="grow">PVP · ผู้ผนึกดวลกัน</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><p class="sub" style="margin:0">ตรวจคำสั่งระหว่างสู้ประมาณทุก 2.5 วินาทีเมื่อเปิดหน้านี้ ไม่ควรปิดหน้าขณะเป็นตาของคุณ · กติกาสมดุลใหม่: คริสูงสุด 65% · โบนัสความเร็วท้ายรอบคู่ · อสูรยั่วยุตั้งรับเปิดเกม · รวมทุกตัว 30 เทิร์น</p>${r&&PVP.balanceVersion!==4?'<div class="card" style="color:var(--bad)">เซิร์ฟเวอร์ยังใช้กติกาเดิม ต้องอัปเดตระบบก่อนเริ่มห้องใหม่</div>':''}${PVP.error?`<div class="card" style="color:var(--bad)">${esc(PVP.error)}</div>`:''}${content}</div>`}

Object.assign(BUILTIN_ART,SoulbeastContent.BUILTIN_ART_additions_2());
function atlasFace(key,form=0){if(SP[key]?.mistNew)return mistPortrait(key);
 let artKey=key;
 if(key==='player'||key?.startsWith('cls:')||key?.startsWith('npc:')){const cls=key==='player'?(S.P?.cls||S.ui.cls||'swordsman'):key.slice(4);artKey=BUILTIN_ART['cls:'+cls]?'cls:'+cls:'cls:'+baseOf(cls)}
 const src=BUILTIN_ART[form>0?key+':'+form:artKey]||BUILTIN_ART[artKey];return src?`<img class="atlas-face" src="${src}" alt="">`:''}
function sceneArt(index,title='',small=false){return `<div class="scene ${small?'small':''}"><img class="scene-art" src="${BUILTIN_SCENES[index]}" alt="${esc(title)}">${title?`<div class="scene-caption"><small>ตำนานผนึกอสูร</small><${small?'h3':'h1'}>${esc(title)}</${small?'h3':'h1'}></div>`:''}</div>`}
function zoneArt(id,small=false){return sceneArt(id===7?8:id+1,ZN[id-1].n,small)}
function storyContent(i,after=false){const c=STORY[i];return `<div class="stack"><p class="story-lead">${esc(c.lead)}</p><p>${esc(after&&c.after?c.after:c.text)}</p>${!after?`<blockquote>${esc(c.quote)}<div class="sub">— ${esc(c.speaker)}</div></blockquote>`:''}</div>`}
function storyCard(i,after=false){const c=STORY[i];return `<div class="card stack story-card"><details ${after?'open':''}><summary>${after?'บทส่งท้าย · ':''}${esc(c.title)}</summary>${storyContent(i,after)}</details></div>`}
function currentStory(){const P=S.P;if(P?.cleared)return storyCard(6,true);return storyCard(Math.min(6,Math.max(1,P?.zoneMax||1)))}
function vStory(){const P=S.P,max=P?Math.min(6,Math.max(1,P.zoneMax||1)):0;
 return `<div class="stack"><div class="row"><h2 class="grow">บันทึกแห่งพันผนึก</h2><button class="btn sm" data-a="storyback">กลับเกม</button></div>${sceneArt(0,'คำสาบานแห่งพันผนึก')}
 <p class="sub" style="margin:0">เรื่องราวของคุณกับอสูรคู่หู เปิดอ่านบทใหม่เมื่อปลดล็อกดินแดน</p>
 ${STORY.map((c,i)=>i<=max?`<div class="card stack story-card"><h3>${esc(c.title)}</h3>${i?zoneArt(i,true):''}${storyContent(i)}${i&&((i<6&&P?.zoneMax>i)||(i===6&&P?.cleared))?`<details><summary>อ่านบทส่งท้ายของด่าน</summary>${storyContent(i,true)}</details>`:''}</div>`:`<div class="card story-lock">${esc(c.title)} · ปลดล็อกเมื่อไปถึง${ZN[i-1].n}</div>`).join('')}</div>`}

function portrait(key,size,opts={}){
 let em='?',ec='#d9b35b',img=IMG[key+':'+(opts.form||0)]||IMG[key];
 if(key==='player'){em=CLS[baseOf(S.P.cls)].em}
 else if(key&&key.startsWith('npc:')){em=CLS[baseOf(key.slice(4))].em;ec='#b8a27a'}
 else if(key&&key.startsWith('form:')){const f=FORMS[key.slice(5)];em=f.em;ec=EL[f.t[0]].c;img=null}
 else if(key&&key.startsWith('cls:')){em=CLS[baseOf(key.slice(4))].em}
 else if(SP[key]){em=SP[key].em;ec=EL[SP[key].t[0]].c}
 return `<div class="pt ${opts.unk?'unk':''}" style="--s:${size}px;--ec:${ec}">${img?`<img src="${img}" alt="">`:(atlasFace(key,opts.form||0)||em)}</div>`}
const elChip=e=>elementIcon(e);
const tChips=ts=>(ts||[]).map(elChip).join('');
const pasChip=k=>k&&PAS[k]?`<span class="chip pas" title="${esc(PAS[k].d)}">${PAS[k].n}</span>`:'';
const bar=(v,m,cls='')=>`<div class="bar ${cls} ${!cls&&v/m<.3?'low':''}"><i style="width:${clamp(m?v/m*100:0,0,100)}%"></i></div>`;
const multTxt=m=>m===1?'':`<span class="eff ${m>1?'up':m===0?'zero':'down'}">×${m===.5?'½':m===.25?'¼':m}</span>`;
function skTagBase(s){if(s.ct)return s.all?'2 ตา หมู่':'2 ตา';if(['heal','buff'].includes(s.t))return s.tg==='team'?'ทั้งทีม':s.tg==='ally'?'เลือกฝ่ายเรา':'ตัวเอง';if(s.t==='form')return 'แปลงร่าง';if(s.all)return 'หมู่';if(s.hits)return `${s.hits} ครั้ง`;return 'เดี่ยว'}
function skTag(s){return (s.t==='p'?'กายภาพ · ':s.t==='m'?'เวท · ':s.t==='h'?'ผสม · ':s.t==='auto'?'ตามอาวุธ · ':s.summon?'อัญเชิญ · ':'')+skTagBase(s)}
function skillDesc(id){const s=SK[id],a=[];if(s.el)a.push(elementIcon(s.el));if(s.cd)a.push('คูลดาวน์ '+s.cd+' เทิร์น');if(s.trueD)a.push('ทะลุพลังป้องกัน');if(s.immune)a.push('ป้องกัน'+(s.immune==='p'?'กายภาพ':'เวท')+' 100% จนจบเทิร์นถัดไป');if(s.summon)a.push('เรียกผู้ช่วย '+s.life+' เทิร์น'+(s.pctGold?' จ่ายเงิน 10% คลาสก่อนหน้า/เลเวล 75%':''));if(s.dot)a.push('จบเทิร์นเสีย HP '+Math.round(s.dot.rate*100)+'% นาน '+s.dot.turns+' เทิร์น');if(s.enchant)a.push('เปลี่ยนธาตุการโจมตีปกติ 3 เทิร์น');
 if(['p','m','h','auto'].includes(s.t))a.push(`${s.t==='p'?'กายภาพ':s.t==='m'?'เวทย์':s.t==='h'?'ผสม':'ตามอาวุธ'} พลัง ${s.pw}${s.hits?` × ${s.hits} ครั้ง${s.rt?' สุ่มเป้า':''}`:''}`);
 if(s.t==='heal')a.push(`ฟื้น HP ${s.pw}%${s.rev||s.revAll?' ชุบชีวิตได้':''}${s.cure?' ล้างสถานะ':''}`);
 if(s.t==='form')a.push(`เปลี่ยนเป็น${FORMS[s.form].n} ได้สกิลชุดใหม่`);
 if(s.bf){const pos=Object.entries(s.bf).filter(([,v])=>v>0),neg=Object.entries(s.bf).filter(([,v])=>v<0);
  if(pos.length)a.push(`เพิ่ม ${pos.map(([k,v])=>`${SH[k]} ${Math.round(v*100)}%`).join(' ')}`);
  if(neg.length)a.push(`${['buff','heal'].includes(s.t)?'ลดของตัวเอง':'ลดของเป้า'} ${neg.map(([k,v])=>`${SH[k]} ${Math.round(-v*100)}%`).join(' ')}`);
  if(s.tn)a.push(`${s.tn} ตา`)}
 if(s.st)a.push(Object.entries(s.st).map(([k,v])=>`${STS[k].n} ${Math.round(v*100)}%`).join(' '));
 if(s.ct)a.push('ตาแรกรวบรวมพลัง ตาถัดไปปล่อยท่าอัตโนมัติ');if(s.charge)a.push(`การโจมตีครั้งถัดไปแรง ×${s.charge}${s.tg==='team'?' ทั้งทีม':''}`);
 if(s.pas)a.push(`ได้ผล${PAS[s.pas].n}`);if(s.taunt)a.push('ยั่วยุ 3 เทิร์น: บังคับเป้าท่าเดี่ยว ไม่กันท่าหมู่');if(s.ls)a.push(`ดูดเลือด ${s.ls*100}%`);if(s.pi)a.push(`เมินเกราะ ${s.pi*100}%`);if(s.cb)a.push(`คริ +${s.cb}%`);
 if(s.acc>=100)a.push('ไม่พลาด');if(s.steal)a.push('ขโมยของ');if(s.gold)a.push('ได้เงิน');if(s.self)a.push(`เสีย HP ตัวเอง ${s.self*100}%`);if(s.ls&&s.t==='heal')a.push('');
 if(s.gc)a.push(`จ่าย ${s.gc}×Lv เหรียญ`);if(s.mp)a.push(`${s.mp} MP`);return a.filter(Boolean).join(' · ')}
function statLine(st){return Object.entries(st).map(([k,v])=>`${SH[k]} +${v}`).join(' · ')}
const itemName=it=>it.legend?`<span class="lgn">✦ ${it.n}</span>`:it.n;
function itemExtra(it){return `${it.pas?' · '+PAS[it.pas].n:''}${it.ws?' · สกิล '+SK[it.ws].n:''}${it.sk?' · สกิล '+SK[it.sk].n:''}`}

/* ================= BATTLE ENGINE ================= */
const B=()=>S.battle;
/* ---- skill visual effects (queued during battle logic, played after each render) ---- */
const VQ=[],vfx=(k,id,o={})=>{if(S.battle)VQ.push({k,id,...o})};
const VSKID=new Map(Object.entries(SK).map(([id,sk])=>[sk,id]));
const SIGNATURE_VFX={
 s_demon:['eclipse','✦','#b783ff'],s_phoenix:['phoenix','✧','#ffb347'],s_garuda:['wing','羽','#ffd976'],s_naga:['water','≈','#5fe4d5'],s_dragon:['dragon','龍','#fa9850'],s_nidhogg:['eclipse','✦','#9875dd'],
 s_kappa:['water','◉','#74d4ed'],s_wisp:['spirit','✧','#7cb9ff'],s_mandrake:['roots','❧','#a5db7e'],s_raiju:['storm','ϟ','#ffe987'],s_pixie:['blessing','✧','#f8aad6'],s_kodama:['roots','❧','#9ad19f'],s_kitsune:['fox','✧','#ff906b'],s_tengu:['wing','羽','#dcc0ff'],s_griffin:['claw','✦','#e8c48a'],s_sphinx:['rune','◇','#edd38a'],s_golem:['quake','▰','#c5cecf'],s_scarab:['rune','☀','#ffd573'],s_qilin:['blessing','✧','#ffe1ac'],s_unicorn:['blessing','✧','#eec9ff'],s_pegasus:['wing','ϟ','#aed9ff'],s_erawan:['quake','◉','#ffe4ac'],s_baihu:['claw','爪','#e8f5ff'],s_fenrir:['claw','爪','#9ee0ff'],s_kraken:['water','≈','#967be9'],s_jiangshi:['rune','符','#efd373'],s_neko:['claw','爪','#b0a0ef'],s_kinnaree:['wing','羽','#ffd29e'],s_cyclops:['storm','ϟ','#dab48b'],s_rajasi:['claw','爪','#ffd067']};
function skillLook(id){const sk=SK[id]||{};if(SIGNATURE_VFX[id])return SIGNATURE_VFX[id];
 if(/^(bd_|ma_|di_)/.test(id))return ['music','♪','#dcb2ff'];
 if(/^(me_|mt_)/.test(id))return ['coins','◈','#ffe29a'];
 if(/^(gn_|mk_|gs_|bh_|at_|cn_|dm_)/.test(id))return ['shot','✦','#ffcd7c'];
 if(/^(ar_|ra_|sn_|wd_)/.test(id))return ['arrow','➤','#b9e196'];
 if(/^(gl_|pa_|te_|et_)/.test(id))return ['shield','◇','#ffe4a5'];
 if(/^(th_|ro_|as_|nj_|rn_)/.test(id))return ['shadow','✦','#b7a0ef'];
 if(/^(sw_|sa_|ke_|sh_|sb)/.test(id))return ['blade','✦','#d9e9ff'];
 if(sk.t==='form'||/^(dr_|fe_|gv_|sc_|f_)/.test(id))return ['roots','❧','#9dde9d'];
 if(sk.rev||sk.revAll||sk.t==='heal')return ['blessing','✚','#aff1bf'];
 if(/^(su_|sl_|ss_|sp_)/.test(id))return ['rune','◇','#8ce5dc'];
 if(sk.el==='electric')return ['storm','ϟ','#ffe883'];if(sk.el==='ice')return ['ice','❄','#b7f6ff'];
 if(sk.el==='fire')return ['flame','✧','#ffad68'];if(sk.el==='water')return ['water','≈','#91d7ff'];
 if(sk.el==='grass')return ['roots','❧','#a4dd8c'];if(sk.el==='dragon')return ['dragon','龍','#bcb0ff'];
 if(sk.el==='dark'||sk.el==='ghost')return ['spirit','✧','#b9a0ef'];if(sk.el==='ground'||sk.el==='rock')return ['quake','▰','#e5c99d'];
 return ['rune','◇',sk.el&&EL[sk.el]?EL[sk.el].c:'#dfc789']}
function skillVisualLegacy(L,e,x,y){if(!e.skill||e.skill==='attack'||e.skill==='rest')return;
 const [kind,glyph,c]=skillLook(e.skill),cast=e.k==='cast',n=cast?4:7;
 // Deterministic geometry avoids consuming battle random numbers.
 const spawn=(cls,px=x,py=y,text=null,vars={})=>{if(L.childElementCount<180)vSpawn(L,cls,[px,py],c,text,vars)};
 if(cast){spawn('vx-sigil',x,y,glyph);return}
 if(kind==='blade'||kind==='shadow'||kind==='claw'){for(let i=0;i<3;i++)spawn('vx-blade',x+(i-1)*9,y+(i-1)*9,null,{'--angle':(kind==='claw'?60:kind==='shadow'?-65:-30)+i*20+'deg'});return}
 if(kind==='shield'){spawn('vx-shield');spawn('vx-ring');return}
 if(kind==='water'||kind==='eclipse'||kind==='spirit'||kind==='fox'){spawn('vx-vortex');spawn('vx-sigil',x,y,glyph)}
 if(kind==='quake'){spawn('vx-crack',x,y+15);spawn('vx-ring')}
 if(kind==='shot'||kind==='arrow'){for(let i=0;i<3;i++)spawn('vx-lance',x-90,y-25+i*20,null,{'--angle':'0deg','--length':'110px'});return}
 if(kind==='dragon'||kind==='phoenix'||kind==='wing'){spawn('vx-sigil',x,y,glyph);for(let side of [-1,1])spawn('vx-blade',x+side*32,y-8,null,{'--angle':side*40+'deg'})}
 if(kind==='rune'||kind==='blessing'||kind==='roots')spawn('vx-sigil',x,y,glyph);
 for(let i=0;i<n;i++){const angle=i*Math.PI*2/n,dx=Math.cos(angle)*60,dy=Math.sin(angle)*48-(kind==='blessing'||kind==='phoenix'||kind==='music'?45:0);
 spawn('vx-glyph',x+Math.cos(angle)*10,y+Math.sin(angle)*10,kind==='ice'?'❄':kind==='storm'?'ϟ':kind==='music'?(i%2?'♫':'♪'):kind==='coins'?'◈':kind==='roots'?'❧':glyph,{'--dx':dx+'px','--dy':dy+'px','--rot':(i%2?-25:25)+'deg','--glyph-size':kind==='storm'?'38px':'24px'})}}
const ELSHAPE={ice:'shard',electric:'shard',rock:'shard',steel:'shard',grass:'leaf',bug:'leaf',fairy:'star',psychic:'star',dragon:'star'};
function vSpawn(L,cls,pos,c,txt,vars={}){if(!L||L.childElementCount>=(window.innerWidth<620?150:240))return;const d=document.createElement('div');d.className='vx '+cls;d.style.setProperty('--c',c);if(pos){d.style.left=pos[0]+'px';d.style.top=pos[1]+'px';}for(const k in vars)d.style.setProperty(k,String(vars[k]));if(txt)d.textContent=txt;L.appendChild(d);const life=Math.min(3400,Math.max(400,Number(vars['--life-ms'])||1100))+(parseFloat(vars['--wait'])||0);setTimeout(()=>d.remove(),life+60);return d;}
function vParts(L,x,y,c,shape,n,dist,up){for(let i=0;i<n;i++){const a=i*2.399963,r=dist*(.5+(i%7)*.1);vSpawn(L,'vx-p '+shape,[x,y],c,null,{'--dx':Math.cos(a)*r+'px','--dy':(Math.sin(a)*r+up*28)+'px','--rot':i*53+'deg'});}}
function skillVisual(L,e,x,y){spellBurst(L,e,x,y);}
/* Spell spectacle: CSS animation only, never consumes combat randomness. */
const SPELL_UNLOCK={};for(const job of Object.values(CLS))for(const [lv,id]of job.sk||[])SPELL_UNLOCK[id]=Math.max(lv,SPELL_UNLOCK[id]||0);
function skillIntensity(id){const sk=SK[id]||{},pw=(sk.basePower||sk.pw||0)*(sk.hits||1),level=Math.max(SPELL_UNLOCK[id]||0,Number((id.match(/^ms_.*?(\d+)$/)||[])[1]||0));let tier=0;
 if(level>=50||pw>=320||(sk.ct&&pw>=220)||['s_demon','wb_storm','s_dragon','s_phoenix','el_omni'].includes(id))tier=3;
 else if(level>=40||pw>=220||sk.revAll||sk.summon||sk.immune||/^s_/.test(id)||/^ws_.*5$/.test(id))tier=2;
 else if(level>=20||pw>=145||sk.tg==='team')tier=1;
 if(['attack','rest','wb_guard'].includes(id))tier=0;return tier;}
const SPELL_PALETTE={fire:['inferno','✦','#ff8848','#ffe5a2'],electric:['thunder','ϟ','#8ddfff','#fff0ab'],ice:['glacier','❄','#9deaff','#e8fcff'],water:['tidal','≈','#4ecce8','#d0f7ff'],flying:['cyclone','✧','#99efcf','#e7ffed'],grass:['bloom','❧','#9ddd77','#e6ffac'],ground:['tectonic','◆','#e8b56b','#ffefd0'],rock:['tectonic','◆','#d5bc99','#fff2ce'],steel:['stellar','✦','#b7dcf7','#ffffff'],dark:['void','✧','#b291ff','#efc8ff'],ghost:['void','◈','#8cb5ff','#e4d8ff'],psychic:['astral','◇','#ec9bff','#fff1fb'],dragon:['nova','✦','#d4a5ff','#fff1b8'],fairy:['sanctuary','✧','#ffe5a8','#fffef5'],poison:['venom','✧','#bc8df1','#d9ffab'],bug:['bloom','❧','#cee577','#f6ffd2']};
function spellLook(id){const sk=SK[id]||{},legacy=skillLook(id);if(sk.t==='heal'||sk.revAll||sk.rev)return ['sanctuary','✚','#b0ffd7','#fff5c7'];if(sk.immune)return ['aegis','◇','#b9e6ff','#fff3c1'];if(sk.summon||sk.t==='form')return ['astral','◇','#c2a5ff','#f6e8ff'];return SPELL_PALETTE[sk.el]||[legacy[0],legacy[1],legacy[2],'#fff1c4'];}
function spellBurst(L,e,x,y){if(!e.skill||['attack','rest'].includes(e.skill))return;const sk=SK[e.skill]||{},tier=skillIntensity(e.skill),[kind,glyph,c,accent]=spellLook(e.skill),magic=sk.t==='m'||['heal','buff','form'].includes(sk.t)||sk.summon||!!sk.ct,cast=e.k==='cast',mobile=window.innerWidth<620,scale=mobile?.78:1,size=(86+tier*54)*scale;
 const life=cast?1100:1400+tier*220,spawn=(cls,px=x,py=y,txt=null,vars={})=>vSpawn(L,cls,[px,py],c,txt,{'--a':accent,'--size':size+'px','--life-ms':life,'--dur':life+'ms',...vars});
 if(cast){
  if(tier===0){spawn('vx-sigil',x,y,glyph);return;}
  spawn('sp-circle sp-casting',x,y,null,{'--size':size*.86+'px'});spawn('sp-rune',x,y,glyph,{'--size':size*.65+'px'});
  if(magic){spawn('sp-orbit',x,y,null,{'--size':size*1.05+'px'});for(let i=0;i<(mobile?4:6);i++){const a=i*2.399963;spawn('sp-mote',x+Math.cos(a)*size*.5,y+Math.sin(a)*size*.28,null,{'--dx':-Math.cos(a)*size*.5+'px','--dy':-Math.sin(a)*size*.28+'px','--wait':i*45+'ms'});}}
  return;
 }
 if(tier===0){skillVisualLegacy(L,e,x,y);spawn('sp-ring');return;}
 spawn('phase-bloom');if(tier>=2)spawn('phase-cross');
 spawn('sp-impact');spawn('sp-ring',x,y,null,{'--wait':'90ms'});if(tier>=2)spawn('sp-circle');
 if(!magic){
  const blades=Math.min(5,2+tier);for(let i=0;i<blades;i++)spawn('sp-cut',x+(i-1)*12,y+(i-1)*5,null,{'--angle':(-65+i*31)+'deg','--wait':i*55+'ms'});
  if(tier>=2)spawn('sp-star');
 }else if(kind==='inferno'){
  for(let i=0;i<2+tier;i++)spawn('sp-meteor',x+(i-(1+tier)/2)*size*.3,y-size*.25,null,{'--wait':i*95+'ms','--angle':(28+i*8)+'deg'});
  spawn('sp-fireball');spawn('sp-plume',x,y+size*.12);if(tier>=2)spawn('sp-shock');
 }else if(kind==='thunder'){
  for(let i=0;i<2+tier;i++)spawn('sp-bolt',x+(i-(1+tier)/2)*size*.22,y-size*.22,null,{'--wait':i*85+'ms','--angle':(i%2?-12:12)+'deg'});
  spawn('sp-star');spawn('sp-shock');
 }else if(kind==='glacier'){
  for(let i=0;i<3+tier;i++)spawn('sp-ice',x+(i-(2+tier)/2)*size*.23,y+size*.12,null,{'--wait':i*65+'ms','--angle':((i-(2+tier)/2)*11)+'deg'});
  spawn('sp-snow',x,y,'❄');
 }else if(kind==='tidal'||kind==='cyclone'){
  for(let i=0;i<3;i++)spawn('sp-wave',x,y+(i-1)*size*.15,null,{'--wait':i*110+'ms','--angle':(i*35)+'deg'});
  spawn('sp-column');if(tier>=2)spawn('sp-orbit');
 }else if(kind==='void'){
  spawn('sp-horizon');spawn('sp-accretion');spawn('sp-orbit',x,y,null,{'--size':size*1.25+'px'});spawn('sp-rune',x,y,glyph);if(tier===3)spawn('sp-ray');
 }else if(kind==='sanctuary'||kind==='aegis'){
  spawn('sp-halo');spawn('sp-column');spawn('sp-rune',x,y,glyph);for(let i=0;i<3;i++)spawn('sp-wave',x,y+size*(.35-i*.25),null,{'--wait':i*90+'ms'});
 }else if(kind==='tectonic'){
  for(let i=0;i<3+tier;i++)spawn('sp-stone',x+(i-(2+tier)/2)*size*.23,y+size*.15,null,{'--wait':i*70+'ms','--angle':(i%2?-18:18)+'deg'});spawn('sp-crater');
 }else if(kind==='bloom'||kind==='venom'){
  spawn('sp-halo');for(let i=0;i<3+tier;i++)spawn('sp-vine',x+(i-(2+tier)/2)*size*.24,y+size*.18,null,{'--wait':i*65+'ms','--angle':(i%2?20:-20)+'deg'});
 }else{
  spawn('sp-nova');spawn('sp-ray');spawn('sp-orbit');spawn('sp-rune',x,y,glyph);if(tier>=2)spawn('sp-star');
 }
 const n=Math.round((8+tier*5)*(mobile?.6:1));for(let i=0;i<n;i++){const a=i*2.399963,r=size*(.38+(i%5)*.085);spawn('sp-spark',x,y,kind==='glacier'&&i%3===0?'✧':null,{'--dx':Math.cos(a)*r+'px','--dy':Math.sin(a)*r*.8+'px','--wait':(i%4)*35+'ms','--angle':i*47+'deg'});}
}
function spellScene(L,e){if(skillIntensity(e.skill)!==3)return;const [kind,,c]=spellLook(e.skill);vSpawn(L,'sp-scene',null,c,null,{'--life-ms':1800,'--dur':'1800ms'});if((SK[e.skill]||{}).t==='m')vSpawn(L,'sp-skyseal',[window.innerWidth*.5,Math.min(window.innerHeight*.35,240)],c,'✧',{'--size':Math.min(window.innerWidth*.72,380)+'px','--life-ms':1900,'--dur':'1900ms'});}
function onlineSkillEffects(before,after,screen){if(!before||!after||S.screen!==screen||!after.battle)return;if(after.rev<=before.rev&&(after.battle.turns||0)<=(before.battle?.turns||0))return;const fx=after.battle.effects||[];if(!fx.length)return;VQ.push(...fx.slice(-64));(window.requestAnimationFrame||setTimeout)(flushVfx);}
function flushVfx(){if(!VQ.length)return;const q=VQ.splice(0).slice(-64),L=document.getElementById('vfx'),app=document.getElementById('app');if(!L||!app||!app.querySelector)return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(reduced){q.filter(e=>e.k==='cast').slice(0,1).forEach(e=>vSpawn(L,'vx-cast',null,e.c||'#d9b35b',e.n));return;}
 const screen=S.screen,seen=new Set(),cinema=new Set();let delay=0,activeSkill=null;for(const item of q){const e={...item};if(e.k==='cast')activeSkill=e.skill;if(e.k==='charge'&&!e.skill){const b=S.screen==='world'?WORLD.room?.battle:S.screen==='pvp'?PVP.room?.battle:S.screen==='camp'?CAMP.room?.battle:S.battle;e.skill=b&&[...b.allies,...b.enemies].find(u=>u.id===e.id)?.charging?.id;}if(!e.skill&&['heal','buff','charge','debuff'].includes(e.k))e.skill=activeSkill;
  const key=e.k==='hit'?e.id+':'+e.skill:e.k+':'+e.id+':'+e.skill,repeat=seen.has(key);seen.add(key);const tier=skillIntensity(e.skill||''),c=e.c||(e.el&&EL[e.el]?EL[e.el].c:'#e6d5ad');
  const play=()=>{if(S.screen!==screen)return;try{
   const el=e.id&&app.querySelector('[data-u="'+String(e.id).replace(/[^\w-]/g,'')+'"]'),r=el?.getBoundingClientRect(),x=r?r.left+r.width/2:window.innerWidth*.5,y=r?r.top+r.height/2:window.innerHeight*.4;
   if(e.k==='cast'){if(!repeat){vSpawn(L,'vx-cast',null,c,e.n);spellBurst(L,e,x,y);}return;}
   if(e.k==='flash')return; // The elemental impact carries the light; avoid repeated full-screen flashes.
   if(!r)return;
   if(['hit','heal','buff'].includes(e.k)){
    if(!repeat){if(tier===3&&!cinema.has(e.skill)){cinema.add(e.skill);spellScene(L,e);}if(e.skill&&!['attack','rest'].includes(e.skill))spellBurst(L,e,x,y);else vSpawn(L,e.k==='hit'?'vx-burst':e.k==='heal'?'vx-ring':'vx-aura',[x,y],c);}
    else {vSpawn(L,'sp-minihit',[x,y],c,null,{'--life-ms':650});}
    if(e.k==='hit'&&!repeat&&tier>=2&&el.classList){el.classList.remove('sp-struck');void el.offsetWidth;el.classList.add('sp-struck');setTimeout(()=>el.classList.remove('sp-struck'),700);}
    if(e.k==='hit'&&e.phys)vSpawn(L,'vx-slash',[x,y],c,null,{'--r':repeat?'28deg':'-35deg'});
    if(e.k==='heal')vParts(L,x,y,'#b8ffce','star',5,45,-1);
   }else if(e.k==='charge'){vSpawn(L,'vx-charge',[x,y],c);spellBurst(L,{...e,k:'cast'},x,y);}
   else if(e.k==='debuff'){if(!signatureEffectBurst(L,e,x,y))vSpawn(L,'sp-orbit',[x,y],c,null,{'--size':'90px','--life-ms':1000,'--dur':'1000ms'});}
   else if(e.k==='miss')vSpawn(L,'vx-ring',[x,y],'#9a97ab');
  }catch(err){}};
  setTimeout(play,Math.min(delay,1000));if(e.k==='hit')delay+=repeat?42:110;else if(e.k==='cast')delay+=tier>=2?240:90;
 }
}

function unit(o){return {buffs:[],status:{},pas:[],stab:[],types:[],taunt:0,...o}}
function playerUnit(){const P=S.P,s=pStats(),w=EQ[P.eq.weapon];
 return unit({id:'P',side:'ally',kind:'player',name:P.name,lv:P.lv,st:s,hp:Math.min(P.hp,s.hp),mp:Math.min(P.mp,s.mp),skills:humanSkills(P.cls,P.lv,P.eq),pas:humanPas(P.cls,P.eq),stab:w&&w.el?[w.el]:[],atkType:w?w.t:'p',img:'player',cls:P.cls})}
function petUnit(p){const s=calcPet(p);return unit({id:'pet'+p.uid,uid:p.uid,side:'ally',kind:'pet',sp:p.sp,evo:p.form||0,name:petName(p),types:SP[p.sp].t.slice(),stab:SP[p.sp].t,lv:p.lv,st:s,hp:Math.min(p.hp,s.hp),mp:Math.min(p.mp,s.mp),skills:petSkills(p),pas:[SP[p.sp].pas],atkType:s.patk>=s.matk?'p':'m',img:p.sp})}
function wildUnit(sp,lv,i,boss){const t={sp,lv,form:formFor(sp,lv),pts:{}},s=calcPet(t,1.1);
 if(boss){s.hp=Math.round(s.hp*2);['patk','matk','pdef','mdef'].forEach(k=>s[k]=Math.round(s[k]*1.15))}
 return unit({id:'e'+i,side:'enemy',kind:'beast',sp,evo:t.form,name:boss||petName(t),types:SP[sp].t.slice(),stab:SP[sp].t,lv,st:s,hp:s.hp,mp:s.mp,skills:petSkills(t),pas:[SP[sp].pas],atkType:s.patk>=s.matk?'p':'m',boss:!!boss,r:SP[sp].r*(boss?2.5:1),img:sp})}
function npcEq(cls,lv){const t=WLV.reduce((a,l,i)=>lv>=l?i:a,0),g=TIERS.reduce((a,x,i)=>lv>=x[1]?i:a,0);return {weapon:`wp_${clsWeapon(cls)}${t}`,armor:'armor_'+g,gloves:'gloves_'+g,boots:'boots_'+g}}
function humanUnit(name,cls,lv,i){const eq=npcEq(cls,lv),focus=clsMult(cls,'patk')>=clsMult(cls,'matk')?'patk':'matk',pts={},n=5*(lv-1);
 Object.entries({[focus]:.35,hp:.25,pdef:.1,mdef:.1,spd:.1,acc:.1}).forEach(([k,v])=>pts[k]=n*v);
 const s=humanStats(cls,lv,pts,eq);s.hp=Math.round(s.hp*1.3);const w=EQ[eq.weapon];
 return unit({id:'e'+i,side:'enemy',kind:'human',name,cls,lv,st:s,hp:s.hp,mp:s.mp,skills:humanSkills(cls,lv,eq).filter(k=>!['form','revert'].includes(SK[k].t)&&!SK[k].gc),pas:humanPas(cls,eq),stab:w&&w.el?[w.el]:[],atkType:w.t,img:'npc:'+cls})}

function startBattle(enemies,kind,meta,pre){VQ.length=0;
 const P=S.P,allies=[playerUnit()],used=[];
 party().filter(p=>p.hp>0).slice(0,clsSum(P.cls)).forEach(p=>{allies.push(petUnit(p));used.push(p.uid)});
 enemies.forEach(e=>{if(e.sp)markFormSeen(e.sp,e.evo||0)});
 if(kind!=='npc')enemies.filter(e=>e.sp).slice(0,3).forEach((e,i)=>Sound.cry(e.sp,false,i*.18));
 S.battle={v:4,kind,meta,enemies,allies,round:0,queue:[],cur:null,log:[],target:0,atarget:allies.length>1&&baseOf(P.cls)==='summoner'?1:0,menu:'wait',over:null,used,fx:[]};
 S.screen='battle';if(pre)blog(pre);
 blog(kind==='npc'?`${enemies[0].name} ท้าประลองกับคุณ!`:kind==='traveler'?`นักเดินทางถอดผ้าคลุมออก... ${enemies[0].name} Lv ${enemies[0].lv} พุ่งเข้าโจมตี!`:kind==='bandit'?`${enemies[0].name} ตะโกนว่า "ทิ้งเงินไว้แล้วไปซะ!"`:kind==='boss'?`${enemies[0].name} ปรากฏตัว! บรรยากาศหนักอึ้ง`:enemies[0].rare?`★ ${enemies[0].name} ปรากฏตัวจากหมอก! อสูรหายาก`:enemies.length>1?`ฝูงอสูร ${enemies.length} ตัวพุ่งเข้าใส่!`:`${enemies[0].name} Lv ${enemies[0].lv} โผล่ออกมา!`);
 allU().forEach(u=>{if(hasPas(u,'intimidate')&&u.hp>0){foesOf(u).forEach(f=>f.buffs.push({st:'patk',amt:-.2,tn:4}));blog(`${u.name} ข่มขวัญ! ฝ่ายตรงข้ามโจมตีกายภาพลดลง`)}});
 newRound()}
function blog(t){const b=B();b.log.push(t);if(b.log.length>60)b.log.shift()}
const allU=()=>[...B().allies,...B().enemies];
const uById=id=>allU().find(u=>u.id===id);
const sideOf=u=>u.side==='ally'?B().allies:B().enemies;
const foesOf=u=>u.side==='ally'?B().enemies:B().allies;
const hasPas=(u,k)=>u.pas.includes(k)||u.buffs.some(b=>b.pas===k);
function eff(u,k){const a=u.buffs.reduce((s,b)=>b.st===k?s+b.amt:s,0);let v=u.st[k]*(1+Math.max(-.6,a));
 if(u.form){const f=FORMS[u.form].m[k];if(f)v*=f}
 const s=u.status;if(s.freeze&&(k==='pdef'||k==='mdef'))v*=1.5;if(k==='spd'){if(s.chill)v*=.6;if(s.static)v*=.7}if(k==='acc'&&s.static)v*=.9;
 if(k==='spd'&&hasPas(u,'swift'))v*=1.2;if(k==='eva'&&hasPas(u,'elusive'))v*=1.25;if(k==='acc'&&hasPas(u,'eagle'))v*=1.15;if(k==='crit'&&hasPas(u,'keen'))v+=10;
 if((k==='patk'||k==='matk')&&hasPas(u,'rage')&&u.hp<u.st.hp/2)v*=1.3;
 if((k==='pdef'||k==='mdef')&&hasPas(u,'laststand')&&u.hp<u.st.hp*.3)v*=1.5;
 if(isWorldBattle()&&u.immortalWorld&&['patk','matk'].includes(k))v*=Math.pow(1.05,Math.max(0,(B().bossTurns||1)-1));return Math.max(k==='crit'?0:1,pvpOffense(u,k,v))}
const hitChance=(u,t,sk)=>clamp(eff(u,'acc')-eff(t,'eva')+15+((sk&&sk.acc)||0),minimumHitChance(u,t),100);
function fxAdd(u,t,c){B().fx.push({id:u.id,t,c})}
function newRound(){const b=B();b.round++;const sp=u=>eff(u,'spd')*(b.round===1&&hasPas(u,'firstblood')?2:1);
 const ord=allU().filter(u=>u.hp>0).map(u=>[u,sp(u)*(0.97+Math.random()*.06)]).sort((x,y)=>y[1]-x[1]);b.queue=[];
 ord.forEach(([u])=>{b.queue.push(u.id);const opp=foesOf(u).filter(x=>x.hp>0);if(opp.length&&sp(u)>=2*Math.max(...opp.map(sp)))b.queue.push(u.id+'*')});advance()}
const costOf=(u,sk)=>sk.mp?Math.round(sk.mp*(hasPas(u,'mpsave')?.7:1)):0;
function releaseCharge(u){const b=B();if(!b||b.over)return;const c=u.charging;u.charging=null;const t=c.tid&&uById(c.tid);blog(`${u.name} ปลดปล่อยพลัง!`);act(u,c.id,t&&t.hp>0?t:null,null,true);if(checkEnd()){render();return}battleLater(advance,650);render()}
function checkEnd(){const b=B();if(b.over)return true;if(b.allies[0].hp<=0){endBattle('lose');return true}if(b.enemies.every(e=>e.hp<=0)){endBattle('win');return true}return false}
function hurt(u,d,c='bad'){if(isWorldBattle()&&u.immortalWorld){const b=B(),damage=Math.max(0,Math.min(1e12,Math.round(Number(d)||0)));b.damageTotal=(b.damageTotal||0)+damage;const owner=b.wbDamageOwner;if(Number.isInteger(owner)&&owner>=0)b.damageBy[owner]=(b.damageBy[owner]||0)+damage;u.hp=u.st.hp;fxAdd(u,'-'+damage,c);return;}const wasAlive=u.hp>0;u.hp=Math.max(0,u.hp-d);fxAdd(u,'-'+d,c);
 if(u.hp<=0){if(hasPas(u,'rebirth')&&!u.reborn){u.reborn=1;u.hp=Math.round(u.st.hp*.4);u.status=retainedBattleAilments(u);blog(`${u.name} ลุกขึ้นจากเถ้าถ่าน! ฟื้นคืนชีพ`);fxAdd(u,'คืนชีพ','good')}else{blog(`${u.name} ล้มลง`);if(wasAlive)Sound.cry(u.sp,true)}}}
function heal(u,a){const v=Math.min(u.st.hp-u.hp,Math.round(a));if(v>0){u.hp+=v;fxAdd(u,'+'+v,'good')}return v}
function turnStartBase(u){const s=u.status;
 u.buffs.forEach(x=>x.tn--);u.buffs=u.buffs.filter(x=>x.tn>0);if(u.taunt>0&&!isWorldBattle())u.taunt--;
 if(hasPas(u,'regen')&&u.hp<u.st.hp)heal(u,u.st.hp*(isBalancedPvp()?.035:.06));
 if(hasPas(u,'mpregen'))u.mp=Math.min(u.st.mp,u.mp+Math.round(u.st.mp*.08));
 for(const k of ['burn','poison'])if(s[k]){const d=Math.max(1,Math.round(u.st.hp*(k==='burn'?.06:.08)));blog(`${u.name} ${k==='burn'?'โดนไฟเผา':'โดนพิษกัดกร่อน'} เสีย ${d} HP`);hurt(u,d);if(u.hp<=0)return true}
 if(s.freeze){if(persistentBattleUnit(u))s.freeze=Math.max(2,s.freeze);s.freeze--;if(s.freeze<=0){delete s.freeze;blog(`น้ำแข็งที่ห่อหุ้ม ${u.name} ละลายแล้ว`)}else{blog(`${u.name} ถูกแช่แข็ง ขยับไม่ได้`);return true}}
 if(s.sleep){s.sleep--;if(s.sleep<=0){delete s.sleep;blog(`${u.name} ตื่นขึ้นแล้ว`)}else{blog(`${u.name} หลับปุ๋ย...`);fxAdd(u,'Zzz','muted');return true}}
 let skip=null;
 if(s.para&&Math.random()<.25)skip=`${u.name} เป็นอัมพาต ขยับตัวไม่ได้`;
 else if(s.love&&Math.random()<.45)skip=`${u.name} หลงรักจนเหม่อลอย ไม่ยอมโจมตี`;
 else if(s.confuse&&Math.random()<.35){const d=Math.max(1,Math.round(u.st.hp*.06));skip=`${u.name} มึนงง ทำร้ายตัวเอง ${d} HP`;hurt(u,d)}
 for(const k of ['burn','poison','chill','static','love','confuse','charm','para'])if(s[k]){if(persistentBattleUnit(u)&&PERSISTENT_AILMENTS.includes(k))continue;s[k]--;if(s[k]<=0){delete s[k];blog(`${u.name} หายจากอาการ${STS[k].n}`)}}
 if(skip){blog(skip);return true}return false}
function advance(){const b=B();if(!b||b.over)return;b.fx=[];if(checkEnd()){render();return}
 while(b.queue.length){const q=b.queue.shift(),extra=q.endsWith('*'),u=uById(q.replace('*',''));if(!u||u.hp<=0)continue;
  if(!extra&&turnStart(u)){if(checkEnd()){render();return}continue}
  if(extra&&(u.status.freeze||u.status.sleep))continue;
  b.cur=u.id;b.extra=extra;if(extra)blog(`${u.name} เร็วกว่าเกิน 2 เท่า ได้เคลื่อนไหวอีกครั้ง!`);
  if(u.charging){b.menu='wait';battleLater(()=>releaseCharge(u),550);render();return}if(!(b.enemies[b.target]&&b.enemies[b.target].hp>0))b.target=b.enemies.findIndex(e=>e.hp>0);
  if(u.side==='enemy'||teamAutoUnit(u)){b.menu='wait';battleLater(aiAct,u.side==='enemy'?700:450);render()}else{b.menu='main';render()}
  return}
 newRound()}
function applyStatus(t,k,ch){if(t.hp<=0||t.status[k])return;if(IMM[k]&&t.types.some(x=>IMM[k].includes(x)))return;
 if(t.pas.some(p=>PAS[p]&&PAS[p].imm&&PAS[p].imm.includes(k)))return;
 if((k==='freeze'||k==='sleep')&&(t.status.freeze||t.status.sleep))return;
 if(Math.random()<ch){t.status[k]=STS[k].d();ExtraAudio.play(k==='poison'?'poison':'status');blog(`${t.name} ${STS[k].n}!`);fxAdd(t,STS[k].n,'mp')}}
function addBuffs(x,sk){if(sk.bf)for(const k in sk.bf)x.buffs.push({st:k,amt:sk.bf[k],tn:(sk.tn||3)+1});if(sk.pas)x.buffs.push({pas:sk.pas,tn:(sk.tn||3)+1})}
function steal(u,t){const P=S.P;if(u.side==='ally'){if(Math.random()<.6){const g=R(t.lv*3,t.lv*6);P.gold+=g;ExtraAudio.play('coin');blog(`ขโมยได้ ${g} เหรียญ`)}else{const k=pick(['pot','eth','seal1','antidote',t.lv>12?'pot2':'pot',t.lv>12?'seal2':'seal1']);P.items[k]=(P.items[k]||0)+1;blog(`ขโมยได้ ${CON[k].n}`)}}
 else if(t.kind==='player'){const g=Math.min(P.gold,u.lv*4);P.gold-=g;if(g)blog(`${u.name} ขโมยเงินคุณไป ${g} เหรียญ!`)}}
function actBase(u,id,tgt,atgt,free){const sk=pvpSkill(id),b=B(),cost=costOf(u,sk);
 if(!free){if(cost&&u.mp<cost){blog(`MP ไม่พอสำหรับ ${sk.n}`);return false}
  if(sk.gc&&u.kind==='player'){const c=sk.gc*u.lv;if(S.P.gold<c){blog('เงินไม่พอ');return false}S.P.gold-=c;blog(`จ่าย ${fmt(c)} เหรียญ`)}
  u.mp-=cost;
  if(sk.ct){u.charging={id,tid:tgt?tgt.id:null};blog(`${u.name} รวบรวมพลังเตรียมใช้ ${sk.n}!`);fxAdd(u,'ชาร์จ','mp');vfx('charge',u.id);Sound.fx('charge');return true}}
 Sound.skill(id,u);
 if(id!=='attack'&&id!=='rest')vfx('cast',u.id,{skill:id,n:sk.n,el:sk.el,c:sk.t==='heal'?'#7fd08a':!sk.el?'#d9b35b':null});
 const mates=sideOf(u);
 if(sk.t==='rest'){const m=Math.round(u.st.mp*.3);u.mp=Math.min(u.st.mp,u.mp+m);blog(`${u.name} ตั้งสมาธิ ฟื้น MP ${m}`);fxAdd(u,'+'+m+' MP','mp');return true}
 if(sk.t==='form'){const f=FORMS[sk.form];if(!u.baseSkills)u.baseSkills=u.skills;u.form=sk.form;u.types=u.defenseTypes?u.defenseTypes.slice():f.t.slice();u.skills=[...f.sk,'revert'];u.img='form:'+sk.form;blog(`${u.name} แปลงเป็น${f.n}!`);fxAdd(u,f.n,'good');return true}
 if(sk.t==='revert'){u.form=null;u.types=u.defenseTypes?u.defenseTypes.slice():[];u.skills=u.baseSkills||u.skills;u.img=u.kind==='player'?'player':u.img;blog(`${u.name} คืนร่างมนุษย์`);return true}
 if(sk.t==='heal'||sk.t==='buff'){
  let list=sk.tg==='team'?mates.filter(x=>x.hp>0||((sk.revAll)&&x.kind!=='player')):sk.tg==='self'?[u]:[atgt&&(atgt.hp>0||sk.rev)&&mates.includes(atgt)?atgt:u];
  const hm=hasPas(u,'healer')?1.3:1;
  list.forEach(x=>{if(sk.t==='heal'){if(x.hp<=0){if(sk.rev||sk.revAll){x.hp=Math.round(x.st.hp*sk.pw/100);x.status=retainedBattleAilments(x);blog(`${x.name} ฟื้นคืนชีพ!`);fxAdd(x,'คืนชีพ','good')}return}
   heal(x,(x.st.hp*sk.pw/100+eff(u,'matk')*.5)*hm);if(sk.cure)x.status=retainedBattleAilments(x);vfx('heal',x.id)}
   if(sk.t==='buff')vfx('buff',x.id,{c:sk.charge?'#6f9cf0':'#d9b35b'});
   addBuffs(x,sk);if(sk.charge){x.charge=sk.charge;fxAdd(x,'×'+sk.charge,'mp')}});
  if(sk.taunt)u.taunt=sk.taunt;
  blog(`${u.name} ใช้ ${sk.n}${sk.tg==='team'?' ให้ทั้งทีม':list[0]!==u?` ให้ ${list[0].name}`:''}`);return true}
 let side=foesOf(u);
 if(u.status.charm&&Math.random()<.45){side=mates;tgt=pick(mates.filter(x=>x.hp>0));blog(`${u.name} ถูกมนต์สะกด หันไปโจมตี ${tgt.name}!`)}
 const alive=side.filter(x=>x.hp>0);if(!alive.length)return true;
 if(!tgt||tgt.hp<=0||!side.includes(tgt))tgt=alive[0];
 blog(`${u.name} ใช้ ${sk.n}${sk.all?'':sk.rt?'':` ใส่ ${tgt.name}`}`);
 if(sk.all&&['p','m','h'].includes(sk.t))vfx('flash',null,{el:sk.el});
 if(sk.all)alive.forEach(t=>u.hp>0&&hitOne(u,sk,t,areaDamageScale(sk,alive.length),alive.length));
 else{for(let i=0;i<(sk.hits||1);i++){const al=side.filter(x=>x.hp>0);if(!al.length||u.hp<=0)break;const t=sk.rt?pick(al):tgt.hp>0?tgt:al[0];hitOne(u,sk,t,1)}
  if(hasPas(u,'multihit')&&['p','m','h','auto'].includes(sk.t)&&Math.random()<.3&&tgt.hp>0){blog(`${u.name} โจมตีซ้ำด้วยเศียรอื่น!`);hitOne(u,sk,tgt,.5)}}
 if(sk.self&&u.hp>0)hurt(u,Math.round(u.st.hp*sk.self));
 const dmgSk=['p','m','h','auto'].includes(sk.t);if(dmgSk&&u.charge)u.charge=0;
 if(!free&&dmgSk&&sk.t!=='auto'&&u.hp>0&&hasPas(u,'echo')&&Math.random()<.2&&foesOf(u).some(x=>x.hp>0)){blog(`เสียงสะท้อนเวท! ${u.name} ใช้ ${sk.n} ซ้ำ`);act(u,id,tgt&&tgt.hp>0?tgt:null,atgt,true)}
 return true}

function turnStart(u){if(beginUnitTurn(u))return true;const skip=turnStartBase(u);if(skip)endUnitTurn(u);return skip}
function act(u,id,tgt,atgt,free){const sk=pvpSkill(id);if(!sk)return false;if(!free&&cooldownOf(u,id)>0){blog(sk.n+' กำลังคูลดาวน์');return false}if(!free&&costOf(u,sk)>u.mp)return false;
 if(!sk.all&&!sk.rt&&['p','m','h','auto','status','debuff'].includes(sk.t)){const forced=foesOf(u).find(x=>x.hp>0&&x.taunt>0);if(forced)tgt=forced}
 let ok;const outer=!B().acting;B().acting=(B().acting||0)+1;
 try{if(sk.summon){ok=addTemporary(u,sk);if(ok){u.mp-=costOf(u,sk);blog(u.name+' ใช้ '+sk.n);Sound.fx('charge');vfx('buff',u.id)}}else{ok=actBase(u,id,tgt,atgt,free);if(ok&&sk.immune){u.immune=sk.immune;u.immuneTurns=2}if(ok&&sk.enchant){u.enchant=sk.enchant;u.enchantTurns=4}}}
 finally{B().acting--}
 if(ok&&!free&&sk.cd){u.cooldowns=u.cooldowns||{};u.cooldowns[id]=sk.cd===1?2:sk.cd}if(ok&&outer)endUnitTurn(u);return ok}

// PVP balance v3: transient battle rules only; persistent saves are unchanged.
/* World event shared rules — additive save fields, no changes to original skill tables. */
const WORLD_LEGENDS=[];
const WORLD_WEAPONS=SoulbeastContent.WORLD_WEAPONS();
for(const [wt,n,el,pas] of WORLD_WEAPONS){const id='wl_'+wt;WORLD_LEGENDS.push(id);EQ[id]={n,slot:'weapon',wt,t:WT[wt].t,lv:50,price:120000,st:Object.fromEntries(Object.entries(wStats(wt,5)).map(([k,v])=>[k,Math.round(v*1.45)])),el,pas,ws:'ws_'+wt+'5',tier:6,legend:1,worldLegend:1};}
const WORLD_ARMOR=SoulbeastContent.WORLD_ARMOR();
for(const [slot,n,pas] of WORLD_ARMOR){const id='wl_'+slot;WORLD_LEGENDS.push(id);EQ[id]={n,slot,lv:50,price:100000,st:Object.fromEntries(Object.entries(EQ[slot+'_4'].st).map(([k,v])=>[k,Math.round(v*1.4)])),pas,tier:6,legend:1,worldLegend:1};}
Object.assign(SK,SoulbeastContent.SK_additions_4());
function isWorldBattle(){return !!(S&&S.battle&&S.battle.kind==='world')}
function worldPowerStats(P,s){const b=Math.min(20,Math.floor(Math.max(0,Number(P.worldPower)||0)/20));s.hp+=b*10;s.patk+=b;s.matk+=b;return s;}
function worldApply(P,a){if(!a)return;const prev=P.worldApplied||{},delta=k=>(Number(a[k])||0)-(Number(prev[k])||0);P.gold=(Number(P.gold)||0)+delta('gold');P.score=(Number(P.score)||0)+delta('score');
 let xp=Math.max(0,delta('xp'));P.exp=(Number(P.exp)||0)+xp;while(P.lv<MAXLV&&P.exp>=need(P.lv)){P.exp-=need(P.lv);P.lv++;P.free=(P.free||0)+5;}if(P.lv>=MAXLV)P.exp=0;
 P.worldPower=Number(a.power)||0;P.items=P.items||{};P.owned=P.owned||[];
 for(const [id,n] of Object.entries(a.loot||{})){const add=Math.max(0,n-Number((prev.loot||{})[id]||0));if(EQ[id]&&EQ[id].worldLegend){for(let i=0;i<add;i++)P.owned.push(id);if(add){P.legend=P.legend||{};P.legend[id]=1;}}else if(CON[id])P.items[id]=(P.items[id]||0)+add;}
 P.worldApplied=JSON.parse(JSON.stringify(a));
}
function worldReward(score,roll,choice){const tier=score>=2000?4:score>=1000?3:score>=500?2:score>=250?1:0,chance=[0,.05,.15,.35,1][tier],loot={};if(score>=25)loot.eth=1;if(score>=100)loot.revivePotion=1;if(score>=250)loot.eth=3;if(roll<chance)loot[WORLD_LEGENDS[Math.min(15,Math.floor(choice*16))]]=1;return {gold:score*20,score,xp:score*25,power:Math.floor(score/10),loot,tier,chance};}

function pvpOffense(u,k,v){
 if(!isBalancedPvp()||!['patk','matk'].includes(k))return v;
 if(u.kind==='player'){
  if(['gladiator','paladin'].includes(u.cls))v+=(u.st.pdef+u.st.mdef)*.25;
  if(u.cls==='paladin')v=Math.max(v,u.st[k==='patk'?'matk':'patk']*.9);
  if(u.cls==='sage'&&k==='matk')v*=1.25;
  if((u.cls==='gunner'||u.cls==='marksman')&&k==='patk')v*=1.15;
  if(u.cls==='wildgod'&&u.form)v*=1.05;
  // Retain a bounded benefit for legacy critical/speed allocations without moving saved points.
  if(baseOf(u.cls)==='thief'){const legacy=Math.min(1,Math.max(0,u.st.spd/Math.max(u.st.patk,u.st.matk)-.8));v*=1+legacy*(Math.min(.25,Math.max(0,u.st.crit-65)*.004)+.15);}
 }else if(u.kind==='pet'){
  const hero=sideOf(u).find(x=>x.kind==='player');if(hero&&['sealmaster','spiritlord'].includes(hero.cls))v*=1.25;
 }
 return v;
}
function pvpDamageFactor(u,t){if(!isBalancedPvp())return 1;let f=1;
 if(u.kind==='player'&&baseOf(u.cls)==='gladiator'&&!['gladiator','paladin'].includes(u.cls))f*=1.2;
 if(t.kind==='player'&&['sealmaster','spiritlord'].includes(t.cls)&&sideOf(t).some(x=>x.kind==='pet'&&x.hp>0))f*=.8;
 if(t.kind==='player'&&t.cls==='wildgod')f*=.85;
 return f;
}

function isBalancedPvp(){return !!(S&&S.battle&&S.battle.kind==='pvp')}
function pvpSkill(id,inPvp=isBalancedPvp(),mode=null){const sk=SK[id];if(sk&&(mode==='world'||isWorldBattle()))return sk.taunt?{...sk,taunt:1,cd:Math.max(3,sk.cd||0),_pvpId:id}:sk;if(!sk||!inPvp)return sk;let changes=null;
 const tune={ms_thief20:{pw:180,cb:10,cd:3},ms_thief40:{pw:35,cd:3},as_sonic:{pw:50,cd:3},rn_wander:{pw:230,cb:15,cd:3},nj_clone:{bf:{eva:.7,spd:.2}}};
 if(tune[id])changes=tune[id];
 if(id==='dr_leaf'||id==='ms_druid10')changes={cd:2};
 if(sk.all&&sk.t==='m')changes={...changes,pw:sk.basePower||sk.pw,areaScale:.65};
 return changes?{...sk,...changes,_pvpId:id}:sk;
}

function hitOne(u,sk,t,scale,areaCount=0){
 const dmgT=['p','m','h','auto'].includes(sk.t);
 const attackEl=effectiveElement(u,sk);const m=typeMult(attackEl,t.types)*(sk.el==='ground'&&hasPas(t,'levitate')?0:1);
 if(m===0){blog(`ไม่มีผลต่อ ${t.name}`);fxAdd(t,'×0','muted');ExtraAudio.play('miss');vfx('miss',t.id);return}
 if(!sk.acc||sk.acc<100)if(Math.random()*100>hitChance(u,t,sk)){blog(`${t.name} หลบได้`);fxAdd(t,'พลาด','muted');ExtraAudio.play('miss');vfx('miss',t.id);return}
 const tx=hasPas(u,'toxin')?1.5:1;
 if(!dmgT){vfx('debuff',t.id,{el:sk.el,c:sk.el?null:'#a07ad8'});addBuffs(t,{bf:sk.bf,tn:sk.tn});if(sk.bf)fxAdd(t,'↓','bad');if(sk.st)for(const k in sk.st)applyStatus(t,k,sk.st[k]*tx);return}
 const type=sk.t==='auto'?u.atkType:sk.t;if((type==='p'&&t.immune==='p')||(type==='m'&&t.immune==='m')){blog(t.name+' ป้องกันสมบูรณ์');vfx('buff',t.id);return}if(type==='h'&&t.immune)scale*=.5;let atk,def;
 if(type==='h'){atk=(eff(u,'patk')+eff(u,'matk'))/2;def=(eff(t,'pdef')+eff(t,'mdef'))/2}else{atk=eff(u,type==='p'?'patk':'matk');def=eff(t,type==='p'?'pdef':'mdef')}
 if(sk.trueD)def=0;def*=1-Math.min(.8,(sk.pi||0)+(hasPas(u,'pierce')?.25:0)+frontlinePierce(u,t));
 const stab=sk.el&&(hasPas(u,'omni')||u.stab.includes(sk.el)||u.types.includes(sk.el)||u.form&&FORMS[u.form].t.includes(sk.el))?(hasPas(u,'adapt')?1.5:1.25):1;
 let d=1.4*atk*(sk.pw/100)*atk/(atk+def)*m*stab*scale*(u.charge||1)*(.9+Math.random()*.2);
 d*=pvpDamageFactor(u,t)*classCombatFactor(u,t,sk);
 if(hasPas(t,'thick')&&(sk.el==='fire'||sk.el==='ice'))d*=.5;
 if(sideOf(t).some(x=>x.hp>0&&hasPas(x,'guardian')))d*=.9;
 const crit=!hasPas(t,'nocrit')&&!rogueCritBlocked(u,t)&&Math.random()*100<(isBalancedPvp()?Math.min(65,eff(u,'crit')+(sk.cb||0)):eff(u,'crit')+(sk.cb||0));if(crit)d*=hasPas(u,'deadly')?(isBalancedPvp()?1.7:2):1.5; if(crit)ExtraAudio.skill(VSKID.get(sk),u,true);
 d=Math.max(1,Math.round(d));
 if(hasPas(t,'sturdy')&&t.hp===t.st.hp&&d>=t.hp&&t.hp>1){d=t.hp-1;blog(`${t.name} อึดทนไว้ได้!`)}
 blog(`→ ${t.name} ${d} ดาเมจ${crit?' คริติคอล!':''}${m>1?' ได้ผลดีมาก':m<1?' ไม่ค่อยได้ผล':''}`);
 vfx('hit',t.id,{skill:VSKID.get(sk)||sk._pvpId,el:sk.el,phys:type!=='m',crit});
 if(isWorldBattle()&&t.immortalWorld)B().wbDamageOwner=u.owner;hurt(t,d);if(sk.dot&&t.hp>0){t.dots=t.dots||[];t.dots=t.dots.filter(x=>x.n!==sk.dot.n);t.dots.push({...sk.dot,rate:sk.dot.rate*(sk.all?areaTotalBudget(areaCount)/Math.max(1,areaCount):1)})}
 const ls=(sk.ls||0)+(hasPas(u,'lifesteal')?.15:0);if(ls&&u.hp>0)heal(u,d*ls);
 if(hasPas(u,'manadrain'))u.mp=Math.min(u.st.mp,u.mp+Math.round(d*.08));
 if(sk.steal)steal(u,t);
 if(sk.gold&&u.kind==='player'){const g=u.lv*8;S.P.gold+=g;ExtraAudio.play('coin');blog(`ได้ ${g} เหรียญ`)}
 if((type==='p'||type==='h')&&u.hp>0){const tf=hasPas(t,'thorns2')?.4:hasPas(t,'thorns')?.15:0;if(tf){const r=Math.max(1,Math.round(d*tf));blog(`${u.name} โดนสะท้อน ${r}`);if(isWorldBattle()&&u.immortalWorld)B().wbDamageOwner=t.owner;hurt(u,r)}
  if(hasPas(t,'flameBody')&&Math.random()<.25)applyStatus(u,'burn',1);if(hasPas(t,'staticbody')&&Math.random()<.25)applyStatus(u,'para',1);
  const pt=hasPas(u,'poisonTouch2')?.5:hasPas(u,'poisonTouch')?.25:0;if(pt)applyStatus(t,'poison',pt*tx);
  if(t.hp>0&&u.hp>0&&hasPas(t,'counter')&&!t._ctr&&Math.random()<.25){t._ctr=1;blog(`${t.name} สวนกลับ!`);hitOne(t,SK.attack,u,1);t._ctr=0}}
 if(t.hp<=0)return;
 if(t.status.sleep){delete t.status.sleep;blog(`${t.name} สะดุ้งตื่น!`)}
 if(t.status.freeze&&sk.el==='fire'&&!persistentBattleUnit(t)){delete t.status.freeze;blog(`ไฟละลายน้ำแข็งของ ${t.name}`)}
 if(sk.bf)addBuffs(t,{bf:sk.bf,tn:sk.tn});
 if(sk.st)for(const k in sk.st)applyStatus(t,k,sk.st[k]*(sk.all?areaTotalBudget(areaCount)/Math.max(1,areaCount):scale<1?.7:1)*tx)}
/* simple AI for enemies and auto pets */
function aiChooseLegacy(u){const b=B(),mates=sideOf(u).filter(x=>x.hp>0),foes=foesOf(u).filter(x=>x.hp>0);
 const ok=u.skills.filter(id=>{const s=SK[id];return !cooldownOf(u,id)&&costOf(u,s)<=u.mp&&!['form','revert','rest'].includes(s.t)&&!(s.gc&&u.kind==='player')&&!(s.charge&&u.charge)});
 const T=t=>ok.filter(id=>SK[id].t===t);
 let tgt=foes.find(x=>x.taunt>0);
 if(!tgt){if(u.side==='enemy'){const w={};foes.forEach((f,i)=>w[i]=f.kind==='player'?(foes.length>1?40:100):60/(foes.length-1||1));tgt=foes[+wsel(w)]}
  else tgt=foes.slice().sort((a,c)=>a.hp/a.st.hp-c.hp/c.st.hp)[0]}
 const hurtM=mates.slice().sort((a,c)=>a.hp/a.st.hp-c.hp/c.st.hp)[0];
 if(hurtM.hp/hurtM.st.hp<.4&&T('heal').length&&Math.random()<.7){const h=T('heal');return [h.find(id=>SK[id].tg==='team')||h[0],tgt,hurtM]}
 if(T('buff').length&&!u.buffs.some(x=>x.amt>0)&&Math.random()<.22)return [pick(T('buff')),tgt,pick(mates)];
 const sts=ok.filter(id=>['status','debuff'].includes(SK[id].t));
 if(sts.length&&!Object.keys(tgt.status).length&&Math.random()<.22)return [pick(sts),tgt];
 const dmg=ok.filter(id=>['p','m','h','auto'].includes(SK[id].t));
 const score=id=>combatSkillScore(u,id,tgt,foes);
 const best=dmg.slice().sort((a,c)=>score(c)-score(a));
 return [Math.random()<.7?best[0]:pick(dmg),tgt]}
function enemyGrade(u){const b=B();const zone=S.zone&&ZN[S.zone.id-1];let g=zone?(zone.train?1:zone.id):Math.ceil(u.lv/10);return clamp(g+(u.boss?1:0),1,6)}
// Shared by local autoplay and the authoritative online battle engine.
function chooseAutoForm(u){
 if(u.form||u.hp<=0)return null;
 const foes=foesOf(u).filter(x=>x.hp>0);if(!foes.length)return null;
 if(u.hp/u.st.hp<.35&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 const forms=u.skills.filter(id=>SK[id]?.t==='form'&&FORMS[SK[id].form]&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp);
 const score=id=>{const f=FORMS[SK[id].form],m=f.m;let best=0;for(const key of f.sk){const sk=SK[key];if(!sk||!['p','m','h','auto'].includes(sk.t))continue;const ty=sk.t==='auto'?u.atkType:sk.t,pa=u.st.patk*(m.patk||1),ma=u.st.matk*(m.matk||1),atk=ty==='m'?ma:ty==='h'?(pa+ma)/2:pa;best=Math.max(best,...foes.map(t=>atk*(sk.pw||100)/100*typeMult(sk.el,t.types)*(sk.all?Math.min(1.5,foes.length):1)));}return best+(u.st.pdef*(m.pdef||1)+u.st.mdef*(m.mdef||1))*(u.hp/u.st.hp<.5?.6:.15);};
 return forms.sort((a,b)=>score(b)-score(a))[0]||null;
}

function aiChoose(u){const form=chooseAutoForm(u);if(form)return [form,foesOf(u).find(x=>x.hp>0),u];if(u.side!=='enemy')return aiChooseLegacy(u);
 const grade=enemyGrade(u),mates=sideOf(u).filter(x=>x.hp>0),dead=sideOf(u).filter(x=>x.hp<=0&&x.kind!=='player'),foes=foesOf(u).filter(x=>x.hp>0);
 if(!foes.length)return ['attack',null];
 const taunt=foes.filter(x=>x.taunt>0),targets=taunt.length?taunt:foes;
 const legal=u.skills.filter(id=>{const s=SK[id];return s&&!cooldownOf(u,id)&&costOf(u,s)<=u.mp&&!['form','revert','rest'].includes(s.t)&&!(s.charge&&u.charge)});
 const options=[];
 const add=(id,t,a,score)=>{if(score>0)options.push({id,t,a,score})};
 for(const id of [...new Set(['attack',...legal])]){const s=SK[id];if(s.summon){if(mates.filter(x=>x.temporary).length<2)add(id,targets[0],null,Math.max(u.st.patk,u.st.matk)*1.4);continue}
  if(s.t==='heal'){const pool=s.tg==='self'?[u]:mates;const wounded=pool.filter(x=>x.hp<x.st.hp).sort((a,b)=>a.hp/a.st.hp-b.hp/b.st.hp);
   if((s.rev||s.revAll)&&dead.length&&s.tg!=='self')add(id,targets[0],dead[0],dead[0].st.hp*.9);
   if(wounded.length){const list=s.tg==='team'?wounded:[wounded[0]];let value=list.reduce((n,x)=>n+Math.min(x.st.hp-x.hp,x.st.hp*(s.pw||0)/100+u.st.matk*.5),0);if(wounded[0].hp/wounded[0].st.hp<.35)value*=1.7;add(id,targets[0],wounded[0],value)}continue}
  if(s.t==='buff'){const pool=s.tg==='self'?[u]:mates,eligible=pool.filter(x=>!x.buffs.some(b=>b.amt>0)&&(s.charge?!x.charge:true));if(eligible.length)add(id,targets[0],pick(eligible),Math.max(u.st.patk,u.st.matk)*(.45+grade*.06)*(s.tg==='team'?mates.length:1));continue}
  for(const t of targets){const ty=s.t==='auto'?u.atkType:s.t;
   if(['p','m','h'].includes(ty)){const atk=ty==='m'?u.st.matk:ty==='h'?(u.st.patk+u.st.matk)/2:u.st.patk;
    const scoreTarget=f=>{const mult=typeMult(s.el,f.types),def=ty==='m'?f.st.mdef:ty==='h'?(f.st.pdef+f.st.mdef)/2:f.st.pdef;return Math.min(f.hp,atk*(s.pw||100)/100*(s.hits||1)*mult/(1+def/50)*(s.el&&u.stab.includes(s.el)?1.25:1))};
    let value=s.all?foes.reduce((n,f)=>n+scoreTarget(f)*areaDamageScale(s,foes.length),0):s.rt?foes.reduce((n,f)=>n+scoreTarget(f),0)/foes.length:scoreTarget(t);
    if(!s.all&&!s.rt&&t.hp/t.st.hp<.3)value*=1.2;if(s.ct)value*=.65;add(id,t,null,value);continue}
   if(s.t==='status'||s.t==='debuff'){const useful=Object.keys(s.st||{}).some(k=>!t.status[k]&&!(IMM[k]&&t.types.some(e=>IMM[k].includes(e))))||Object.keys(s.bf||{}).some(k=>!t.buffs.some(b=>b.st===k&&b.amt<0));if(useful)add(id,t,null,Math.max(u.st.patk,u.st.matk)*(.35+grade*.08))}
  }
 }
 if(grade>=4&&u.st.mp>0&&u.mp/u.st.mp<.2&&u.skills.some(id=>SK[id]&&costOf(u,SK[id])>u.mp))add('rest',targets[0],null,Math.max(u.st.patk,u.st.matk)*.65);
 if(!options.length)return ['attack',targets[0]];
 // Early encounters choose diverse valid skills; later encounters favor effective tactics.
 const smart=[0,.10,.25,.45,.65,.80,.90][grade];let chosen;
 if(Math.random()<smart){const ranked=options.sort((a,b)=>b.score-a.score),top=ranked.filter(x=>x.score>=ranked[0].score*.8);chosen=pick(top)}
 else{const ids=[...new Set(options.map(x=>x.id))],id=pick(ids);chosen=pick(options.filter(x=>x.id===id))}
 if(u.aiLast===chosen.id&&u.aiRepeat>=2&&options.some(x=>x.id!==chosen.id&&x.score>=chosen.score*.2))chosen=pick(options.filter(x=>x.id!==chosen.id&&x.score>=chosen.score*.2));
 u.aiRepeat=u.aiLast===chosen.id?(u.aiRepeat||0)+1:1;u.aiLast=chosen.id;
 return [chosen.id,chosen.t,chosen.a]}
function battleLater(fn,ms){const battle=S.battle;const run=()=>{if(S.battle!==battle||!battle)return;if(S.ui.confirm?.act==='dosurrender'){setTimeout(run,150);return}fn()};setTimeout(run,ms)}
function aiAct(){const b=B();if(!b||b.over)return;const u=uById(b.cur);if(!u||u.hp<=0){advance();return}
 if(u.side==='ally'&&!teamAutoUnit(u)){b.menu='main';render();return}const [id,t,a]=aiChoose(u);if(!act(u,id,t,a))act(u,'attack',t);if(checkEnd()){render();return}battleLater(advance,600);render()}
function after(){const b=B();if(!b)return;if(checkEnd()){render();return}b.menu='wait';battleLater(advance,450);render()}
function curTarget(){const b=B();let t=b.enemies[b.target];if(!t||t.hp<=0){b.target=b.enemies.findIndex(e=>e.hp>0);t=b.enemies[b.target]}return t}
const curAlly=()=>B().allies[B().atarget]||B().allies[0];
const sealable=e=>!e?.bossHelper&&!(SP[e?.sp]?.legendary&&!mistLegendsUnlocked())&&e&&e.hp>0&&B()?.kind!=='pvp'&&B()?.kind!=='raid'&&!(e.sp&&SP[e.sp].noseal)&&(e.kind==='beast'||(e.kind==='npcpet'&&B()&&['bandit','traveler','npc'].includes(B().kind)&&!B().enemies.some(x=>x.kind==='human'&&x.hp>0)));
function sealChance(e,pow){if(!sealable(e))return 0;
 if(pow===Infinity)return 1;const lf=clamp(1+(S.P.lv-e.lv)*.03,.6,1.3);let c=pow*(1-.85*e.hp/e.st.hp)*(.55/e.r)*lf;const s=e.status;
 if(s.sleep||s.freeze||s.para)c*=1.5;else if(Object.keys(s).length)c*=1.15;if(hasPas(B().allies[0],'sealer'))c*=1.5;return clamp(c,.01,.97)}
function syncBack(){const b=B(),P=S.P,pu=b.allies[0];P.hp=pu.hp;P.mp=pu.mp;b.allies.slice(1).forEach(u=>{const p=petBy(u.uid);if(p){p.hp=u.hp;p.mp=u.mp}})}
// Only sealed reserves in the carried bag are exposed to NPC theft.
function banditStealablePets(P=S.P,b=B()){
 normalizePack(P);
 const protectedIds=new Set([...(P.party||[]),...(b?.used||[]),...(b?.allies||[]).filter(u=>u.kind==='pet').map(u=>u.uid)]);
 const carried=new Set(P.carried);
 return P.pets.filter(p=>carried.has(p.uid)&&!protectedIds.has(p.uid));
}
function endBattle(res){const b=B();if(b.over)return;syncBack();const P=S.P,lines=[];const earned=b.enemies.filter(e=>e.hp<=0&&!e.temporary).reduce((n,e)=>n+scoreValue(e),0);if(earned){P.score=(P.score||0)+earned;lines.push('คะแนนสะสม +'+earned)}
 if(res==='win'){let exp=0,gold=0;
  b.enemies.filter(e=>!e.temporary).forEach(e=>{let x=expFor(e.lv)*(e.boss?3:e.rare?2:1)*(e.kind==='human'?1.5:1);if(e.captured)x*=.5;exp+=x;
   if(e.kind==='human'&&b.kind==='traveler')x*=2;
   if(e.kind==='human'&&b.kind==='bandit'){const g=e.lv*20+R(0,e.lv*10);gold+=g;lines.push(`ยึดถุงเงินโจรได้ ${fmt(g)} เหรียญ`)}
   if(e.kind!=='human'&&!e.captured&&e.sp){gold+=e.lv*4+R(0,e.lv*3);const n=e.boss||e.rare?2:Math.random()<.6?1:0;
    for(let i=0;i<n;i++){const pi=e.boss||e.rare?i:(Math.random()<.7?0:1),key=e.sp+'|'+pi;P.parts[key]=(P.parts[key]||0)+1;lines.push(`ได้ ${SP[e.sp].parts[pi][0]}`)}}});
  exp=Math.round(exp);
  if(b.kind==='npc'){const n=NPC[b.meta],first=!P.arena[b.meta];const g=first?n.gold:Math.round(n.gold*.3);gold+=g;P.arena[b.meta]=(P.arena[b.meta]||0)+1;lines.unshift(`เงินรางวัลประลอง ${fmt(g)} เหรียญ${first?' (ชนะครั้งแรก)':''}`)}
  if(b.kind==='traveler')lines.push(...travelerLoot(b.enemies[0]));
  if(b.kind==='boss'&&b.enemies.some(e=>e.sp==='demonlord')&&Math.random()<.12){const pool=WORLD_LEGENDS.filter(id=>!P.owned.includes(id)&&!Object.values(P.eq).includes(id)),id=pick(pool.length?pool:WORLD_LEGENDS);P.owned.push(id);P.legend=P.legend||{};P.legend[id]=1;lines.push('✦ ตำนานสุริยคราส: '+EQ[id].n);}
  if(b.kind==='boss'&&ZN[b.meta-1].final&&b.enemies.some(e=>e.sp==='demonlord')){if(!P.cleared){gold+=20000;lines.push('🏆 ปราบจอมมารสำเร็จเป็นครั้งแรก! รางวัลพิเศษ 20,000 เหรียญ')}else lines.push('🏆 ปราบจอมมารได้อีกครั้ง!');P.cleared=(P.cleared||0)+1}
  if(b.kind==='boss'){const z=b.meta;if(P.zoneMax<=z&&z<ZN.length){P.zoneMax=z+1;lines.push(`ปลดล็อกพื้นที่ใหม่: ${ZN[z].n}`)}gold+=ZN[z-1].boss.lv*25}
  const lucky=b.allies[0].pas.filter(k=>k==='lucky').length;if(lucky)gold=Math.round(gold*(1+.25*lucky));
  P.gold+=gold;lines.unshift(`ได้ EXP ${fmt(progressionRewardExp(P,exp))} · ${fmt(gold)} เหรียญ`);
  lines.push(...gainExp(P,progressionRewardExp(P,exp),true));b.used.forEach(uid=>{const p=petBy(uid);if(p)lines.push(...gainExp(p,progressionRewardExp(p,exp),false))});
  if(b.kind==='boss'&&S.zone&&ZN[S.zone.id-1].final){P.items.godSeal=(P.items.godSeal||0)+1;lines.push('ได้รับ ผนึกของพระเจ้า ×1')}Sound.fx('win');b.over={res,title:'ชัยชนะ',lines}}
 else if(res==='lose'){const band=b.kind==='bandit'||b.kind==='traveler';
  const lost=Math.max(0,Math.floor(P.gold*(band?.25:.1)));P.gold-=lost;const xl=loseExp(P,band?.15:.08);
  P.hp=Math.max(1,Math.round(pStats().hp*.3));
  lines.push(b.kind==='traveler'?`${b.enemies[0].name} เอาชนะคุณ แล้วชิงข้าวของไป`:band?'โจรป่ารุมซ้อมจนหมดสติ แล้วปล้นข้าวของไป':'คุณหมดสติ ชาวบ้านช่วยพากลับมาที่โรงพยาบาล',`เสียเงิน ${fmt(lost)} เหรียญ · เสีย EXP ${fmt(xl)} (เลเวลไม่ลด)`);
  b.used.forEach(uid=>{const p=petBy(uid);if(p)loseExp(p,band?.15:.08)});
  if(band){const reserves=banditStealablePets(P,b);if(reserves.length&&Math.random()<.4){const v=pick(reserves);P.pets=P.pets.filter(p=>p.uid!==v.uid);P.carried=P.carried.filter(id=>id!==v.uid);fixParty();lines.push(`โจรขโมยผนึกสำรอง ${petName(v)} Lv ${v.lv} จากกระเป๋าไป 1 ตัว!`)}}
  if(band){const ks=Object.keys(P.items).filter(k=>P.items[k]>0);if(ks.length){const k=pick(ks),n=Math.ceil(P.items[k]/2);P.items[k]-=n;lines.push(`ถูกยึด ${CON[k].n} ${n} ชิ้น`)}}
  Sound.fx('lose');b.over={res,title:'พ่ายแพ้',lines};S.zone=null}
 else b.over={res,title:'หนีสำเร็จ',lines:['คุณถอยออกจากการต่อสู้อย่างปลอดภัย']};
 b.menu='end';save()}

function battleAction(v){const b=B();if(!b)return;const [k,a,c]=v.split(':');
 if(k==='target'){const i=+a;if(b.enemies[i]&&b.enemies[i].hp>0){b.target=i;render()}return}
 if(k==='ally'){b.atarget=+a;render();return}
 if(k==='auto'){S.ui.autoPet=!S.ui.autoPet;const u=uById(b.cur);render();if(S.ui.autoPet&&u&&u.kind==='pet'&&b.menu!=='wait'&&b.menu!=='end'){b.menu='wait';battleLater(aiAct,300)}return}
 if(k==='done'){const res=b.over.res,kind=b.kind;S.battle=null;
  if(res==='lose'){S.zone=null;S.screen='hospital'}
  else if(kind==='npc')S.screen='arena';
  else if(kind==='boss'&&res==='win'){S.zone=null;S.screen='town';toast('ชนะบอสแล้ว! กลับสู่นครพันผนึกอย่างผู้ชนะ')}
  else{S.screen='zone';if(S.zone){if(S.zone.after){S.zone.ev=S.zone.after;S.zone.after=null;S.zone.fork=null}else newFork()}}
  save();render();return}
 if(b.menu==='wait'||b.menu==='end')return;const u=uById(b.cur);if(!u)return;
 if(k==='menu'){b.menu=a;render();return}
 if(k==='sk'){const sk=SK[a];if(costOf(u,sk)>u.mp){toast('MP ไม่พอ');return}if(sk.gc&&S.P.gold<sk.gc*u.lv){toast('เงินไม่พอ');return}if(!act(u,a,curTarget(),curAlly()))return;after();return}
 if(k==='item'){const it=CON[a];if(!it||it.petExp||!(S.P.items[a]>0))return;const tgt=curAlly();if(!potionUseful(it,tgt,tgt.st)){toast('พลังเต็มแล้ว ใช้ยานี้ไม่จำเป็น');return}
  if(it.rev){if(tgt.hp>0||tgt.kind==='player'){toast('เลือกอสูรที่หมดสติก่อน (แตะการ์ดฝ่ายเรา)');return}Sound.fx('revive');tgt.hp=Math.round(tgt.st.hp*it.rev);tgt.status=retainedBattleAilments(tgt);blog(`${tgt.name} ฟื้นคืนสติ`)}
  else if(tgt.hp<=0){toast('เป้าหมายหมดสติ ใช้ธูปเรียกวิญญาณก่อน');return}
  else if(it.cure){const has=it.cure.filter(x=>tgt.status[x]);if(!has.length){toast(`${tgt.name} ไม่มีสถานะที่ยานี้รักษาได้`);return}has.forEach(x=>delete tgt.status[x]);blog(`ใช้ ${it.n} กับ ${tgt.name} หายจาก${has.map(x=>STS[x].n).join(' ')}`);fxAdd(tgt,'หาย','good')}
  else{if(it.hp)heal(tgt,it.hp);if(it.mp){tgt.mp=Math.min(tgt.st.mp,tgt.mp+it.mp);fxAdd(tgt,'+'+it.mp+' MP','mp')}blog(`ใช้ ${it.n} กับ ${tgt.name}`)}
  ExtraAudio.play(it.cure?'heal':'drink');vfx('heal',tgt.id);S.P.items[a]--;after();return}
 if(k==='seal'){const it=CON[a],t=curTarget();if(!(S.P.items[a]>0)||!t)return;if(!sealable(t)){toast('ผนึกเป้าหมายนี้ไม่ได้');return}if(S.P.pets.length>=MAXPETS){toast('ผนึกเต็มแล้ว ปล่อยอสูรบางตัวก่อน');return}
  S.P.items[a]--;ExtraAudio.play('seal');vfx('buff',t.id,{c:'#6dcfc1'});const ch=sealChance(t,it.seal);blog(`คุณขว้าง${it.n}ใส่ ${t.name}...`);
  if(Math.random()<ch){const p=mkPet(t.sp,t.lv,t.evo);const s=calcPet(p);p.hp=Math.max(1,Math.round(s.hp*t.hp/t.st.hp));p.mp=s.mp;S.P.pets.push(p);if(S.P.carried.length<carryLimit())S.P.carried.push(p.uid);else blog(petName(p)+' ถูกส่งไปพักที่ค่าย กระเป๋าเต็มแล้ว');S.P.caught[t.sp]=1;
   if(S.P.carried.includes(p.uid)&&S.P.party.length<clsSum(S.P.cls))S.P.party.push(p.uid);
   ExtraAudio.play('quest');t.captured=true;t.hp=0;fxAdd(t,'ผนึก!','good');blog(`สำเร็จ! ${petName(p)} ถูกผนึกแล้ว`)}
  else{ExtraAudio.play('miss');fxAdd(t,'หลุด','muted');blog(`ผนึกแตก! ${t.name} ดิ้นหลุดออกมา`)}
  after();return}
 if(k==='swap'){if(b.over||u.side!=='ally'||u.hp<=0)return;const p=petBy(+a);if(!p||p.hp<=0||!S.P.carried.includes(p.uid)||b.allies.some(x=>x.uid===p.uid))return;const n=clsSum(S.P.cls),pets=b.allies.slice(1);let slot;
  const sel=b.allies[b.atarget];
  if(sel&&sel.kind==='pet')slot=b.allies.indexOf(sel);else if(pets.length<n)slot=b.allies.length;else slot=1;
  const old=b.allies[slot];if(old){const op=petBy(old.uid);if(op){op.hp=old.hp;op.mp=old.mp}b.queue=b.queue.map(x=>x.replace('*','')===old.id?x.replace(old.id,'pet'+p.uid):x)}
  b.allies[slot]=petUnit(p);if(!b.used.includes(p.uid))b.used.push(p.uid);
  S.P.party=b.allies.slice(1).map(x=>x.uid);blog(`เรียก ${petName(p)} ออกจากผนึก!`);b.menu='main';render();return}
 if(k==='flee'){if(!['wild','bandit','traveler'].includes(b.kind)){toast('หนีไม่ได้ในการต่อสู้นี้');return}const es=b.enemies.filter(e=>e.hp>0);const avg=es.reduce((s,e)=>s+eff(e,'spd'),0)/es.length;
  if(Math.random()<clamp(.5+(eff(u,'spd')-avg)*.03,.2,.92)){endBattle('flee');render()}else{blog('หนีไม่สำเร็จ!');after()}return}
}

/* ================= FOREST ================= */
const ZDEPTH=10;
const EV=SoulbeastContent.EV();
const SAFE=SoulbeastContent.SAFE();
const TRAPS=SoulbeastContent.TRAPS();
const CHESTS=SoulbeastContent.CHESTS();
const CHESTW=SoulbeastContent.CHESTW();
const BANDITS=SoulbeastContent.BANDITS();
const BANDCLS=SoulbeastContent.BANDCLS();
function newFork(){const z=S.zone,zd=ZN[z.id-1];z.ev=null;if(z.depth>=ZDEPTH){z.fork=null;return}
 const VH=['village','hospital'],clash=(a,k)=>k===a||(VH.includes(a)&&VH.includes(k));
 const keys=Object.keys(EV).filter(k=>k!=='beast'&&k!=='secret'&&k!=='specialEvent'&&(k!=='exit'||(z.depth>=3&&z.depth<ZDEPTH-1))&&!(zd.train&&['bandit','stranger'].includes(k)));
 const w=ks=>wsel(Object.fromEntries(ks.map(k=>[k,EV[k].w])));let a,c;
 if(z.depth===ZDEPTH-1){a=pick(['spring','revival','cleanse','hospital','village']);c=Math.random()<.5?'beast':w(keys.filter(k=>!clash(a,k)&&k!=='exit'))}
 else{a=Math.random()<.5?'beast':w(keys);c=w(keys.filter(k=>!clash(a,k)))}
 const hid=Math.random()<.18?R(0,1):-1;
 z.fork=(Math.random()<.5?[a,c]:[c,a]).map((k,i)=>({k,h:i===hid&&!SAFE.includes(k)}))}
function zlog(t){const zl=S.zone.log;zl.push(t);if(zl.length>12)zl.shift()}
function trap(){const t=pick(TRAPS),P=S.P,s=pStats();
 P.hp=Math.max(1,P.hp-Math.round(s.hp*t.p));if(t.mp)P.mp=Math.max(0,P.mp-Math.round(s.mp*t.mp));
 party().forEach(p=>{if(p.hp>0){const q=calcPet(p);p.hp=Math.max(1,p.hp-Math.round(q.hp*t.p));if(t.mp)p.mp=Math.max(0,p.mp-Math.round(q.mp*t.mp))}});
 return `กับดัก${t.n}! ${t.d} ทั้งทีมเสีย HP ${Math.round(t.p*100)}%${t.mp?` และ MP ${Math.round(t.mp*100)}%`:''}`}
const ZT=id=>ZN[id-1].train?0:id-1;
function gearDrop(tier,special){if(special){const zl=ZN[S.zone.id-1].lv[1]+6;const ks=Object.keys(SG).filter(k=>SG[k].lv<=zl);return pick(ks)}return pick(Object.keys(SLOTBASE))+'_'+clamp(tier,0,5)}
function openChest(c){Sound.fx('chest');const z=ZN[S.zone.id-1],P=S.P,out=[],tier=ZT(z.id),add=(id,n=1)=>{P.items[id]=(P.items[id]||0)+n;out.push(`${CON[id].n}${n>1?' ×'+n:''}`)};
 const chestType=c;
 const gold=g=>{P.gold+=g;out.push(`${fmt(g)} เหรียญ`)},gear=id=>{P.owned.push(id);out.push((EQ[id].legend?'✦ ':'')+EQ[id].n+(EQ[id].pas?` (${PAS[EQ[id].pas].n})`:''))},lg=ch=>{if(Math.random()<ch){const id=legendDrop(z.id);if(id)gear(id)}};
 const base=R(6,14)*z.lv[0]+R(5,20),pot=['pot','pot','pot2','pot2','pot3','pot3'][tier];
 if(c==='wood'){gold(base);add(pot,R(1,2));if(Math.random()<.4)add(tier>=3?'eth2':'eth')}
 if(c==='jade'){for(let i=0;i<3;i++)add(pick(CURES));add(pot);if(Math.random()<.35)add('allcure')}
 if(c==='azure'){add(SEALS[Math.min(4,tier)],R(2,3));if(Math.random()<.3&&tier<4)add(SEALS[tier+1])}
 if(c==='amethyst'){gear(gearDrop(tier+(Math.random()<.2?1:0),Math.random()<.35));if(Math.random()<.15)gear(`wp_${clsWeapon(P.cls)}${Math.min(5,tier+2)}`)}
 if(c==='legend'){const id=legendDrop(z.id);if(id){gear(id);gold(base*2)}else{out.push('ของในตำนานของแผนที่นี้ถูกพบครบแล้ว');c='gold'}}
 if(c==='gold'){lg(.12);gold(base*4);gear(gearDrop(tier+1,Math.random()<.6));add(SEALS[Math.min(4,tier+1)]);add(pot,2);add('allcure')}
 if(c==='blood'){lg(.18);out.push(trap().split('!')[0]+'จากคำสาป');gold(base*3);gear(gearDrop(tier+1,true));gear(gearDrop(tier,false));add(SEALS[Math.min(4,tier+1)],2);add('rev')}
 if(Math.random()<({wood:.01,jade:.02,azure:.02,amethyst:.03,gold:.06,legend:.08,blood:.08}[chestType]||0))add('revivePotion');
 return out}
function legendDrop(z){const P=S.P;if(ZN[z-1].train)return null;P.legend=P.legend||{};const left=SLOTS.map(x=>x[0]).filter(sl=>!P.legend[z+'_'+sl]);if(!left.length)return null;
 const sl=pick(left);P.legend[z+'_'+sl]=1;return sl==='weapon'?`lg${z}_weapon_${clsWeapon(P.cls)}`:`lg${z}_${sl}`}
const SUF=SoulbeastContent.SUF();
function travelerUnits(zd){const P=S.P,lv=clamp(P.lv+R(-5,2),zd.lv[0],zd.boss.lv),tier=lv>=40?2:lv>=25?1:0;
 const cls=pick(Object.keys(CLS).filter(k=>tierOf(k)===tier)),h=humanUnit(CLS[cls].n+pick(SUF),cls,lv,0);
 ['hp','patk','matk','pdef','mdef','spd'].forEach(k=>h.st[k]=Math.round(h.st[k]*1.1));h.hp=h.st.hp;h.mp=h.st.mp;
 const np=clamp(+wsel({1:55,2:35,3:10})+(clsSum(cls)>1?1:0),1,3),es=[h];
 for(let i=0;i<np;i++){const u=wildUnit(pick(Math.random()<.12?zd.rare:zd.sp),Math.max(1,lv-R(0,3)),i+1);u.name=`${u.name}ของ${CLS[cls].n}`;u.kind='npcpet';es.push(u)}return es}
function travelerLoot(h){const P=S.P,z=S.zone?S.zone.id:Math.min(5,Math.ceil(h.lv/9)),out=[],tier=ZT(z),g=h.lv*40+R(0,h.lv*20);P.gold+=g;out.push(`ค่าหัวนักเดินทาง ${fmt(g)} เหรียญ`);
 const give=id=>{P.owned.push(id);out.push('ได้ '+(EQ[id].legend?'✦ ':'')+EQ[id].n)};
 let id=Math.random()<.3?legendDrop(z):null;if(id)give(id);
 give(Math.random()<.5?pick(Object.keys(SG).filter(k=>SG[k].lv<=h.lv+6)):pick(Object.keys(SLOTBASE))+'_'+clamp(tier+1,0,4));
 const it=[SEALS[Math.min(4,tier+1)],['pot','pot2','pot2','pot3','pot3','pot3'][tier],'allcure'];it.forEach(k=>{P.items[k]=(P.items[k]||0)+1});out.push('ได้ '+it.map(k=>CON[k].n).join(', '));return out}
const chestEv=(src,msg)=>({type:'chest',chest:wsel(CHESTW[src]),msg,opened:false});
function wildGroup(zd,ns){const n=+wsel(ns||{1:45,2:33,3:14,4:8}),hi=zd.lv[1]-(n>=3?2:n===2?1:0);
 return Array.from({length:n},(_,i)=>wildUnit(pick(zd.sp),R(zd.lv[0],Math.max(zd.lv[0],hi)),i))}
function banditGroup(zd){const lv=R(zd.lv[0]+1,zd.lv[1]),tier=lv>=40?2:lv>=25?1:0,cls=pick(BANDCLS[tier]);
 const es=[humanUnit(pick(BANDITS),cls,lv,0)],np=+wsel(zd.id>=3?{1:40,2:40,3:20}:{1:70,2:30});
 for(let i=0;i<np;i++){const sp=pick(zd.sp),u=wildUnit(sp,Math.max(1,lv-R(0,2)),i+1);u.name=`${u.name}ของโจร`;u.kind='npcpet';es.push(u)}return es}
function chooseFork(i){const z=S.zone,zd=ZN[z.id-1],P=S.P,door=z.fork[i],type=door.k;z.fork=null;z.depth++;
 zlog(`ก้าวที่ ${z.depth}: เลือกทาง${i?'ขวา':'ซ้าย'}${door.h?'ซึ่งมืดมิด':''} — ${EV[type].n}`);
 let pre='';if(!SAFE.includes(type)&&Math.random()<.14){pre=trap();zlog(pre)}
 const fight=(es,kind='wild',aft=null)=>{z.ev=null;z.after=aft;startBattle(es,kind,z.id,pre||null);save();render()};
 const show=ev=>{if(pre)ev.msg=`<span style="color:var(--bad)">${pre}</span><br>${ev.msg}`;z.ev=ev};
 if(type==='beast')return fight(wildGroup(zd,zd.train?{1:65,2:30,3:5}:undefined));
 if(type==='bush'){const r=Math.random();if(r<.5)return fight(wildGroup(zd,{1:60,2:30,3:10}));
  if(r<.88)show(chestEv('bush','ในพุ่มไม้มีหีบซ่อนอยู่'));else{P.items.pot=(P.items.pot||0)+1;show({type,msg:'เจอสมุนไพรป่า ทำเป็นยาฟื้นพลังได้ 1 ขวด'})}}
 if(type==='mist'){const r=Math.random();
  const mistBeast=mistEncounter(zd,r);if(mistBeast)return fight([mistBeast]);
  if(r<.58)show(chestEv('mist','หมอกจางลงเผยให้เห็นหีบสมบัติโบราณ'));
  else if(r<.82)return fight(wildGroup(zd,zd.train?{2:1}:{2:35,3:40,4:25}));
  else show({type,msg:'หลงวนอยู่ในหมอกจนเหนื่อย ไม่เจออะไรเลย'})}
 if(type==='ruins'){if(Math.random()<.35){const e=wildUnit(pick(zd.sp),zd.lv[1]+1,0);e.name='ผู้เฝ้า'+e.name;return fight([e],'wild',chestEv('ruins','ผู้เฝ้าล้มลง เผยให้เห็นหีบที่มันปกป้องไว้'))}
  show(chestEv('ruins','ในห้องลับของวิหารมีหีบสมบัติวางอยู่'))}
 if(type==='bandit')return fight(banditGroup(zd),'bandit');
 if(type==='revival'){const down=carriedPets().filter(p=>p.hp<=0);let healed='';if(!down.length){const candidates=[{o:P,s:pStats(),name:P.name},...carriedPets().map(p=>({o:p,s:calcPet(p),name:petName(p)}))].filter(x=>x.o.hp>0&&x.o.hp<x.s.hp).sort((a,b)=>a.o.hp/a.s.hp-b.o.hp/b.s.hp);const target=candidates[0];if(target){const before=target.o.hp;target.o.hp=Math.min(target.s.hp,target.o.hp+Math.round(target.s.hp*.5));healed=esc(target.name)+' ฟื้น HP '+(target.o.hp-before)+' (สูงสุด 50% ของ HP เต็ม)';}}
  down.forEach(p=>{const s=calcPet(p);p.hp=s.hp;p.mp=Math.round(s.mp*.5)});
  show({type,msg:down.length?`แสงจากบ่อปลุก ${down.map(p=>esc(petName(p))).join(' และ ')} ให้ฟื้นคืนสติ ทุกตัวฟื้น HP เต็มและ MP ครึ่งหนึ่ง`:(healed||'ไม่มีผู้หมดสติ ทุกคน HP เต็มแล้ว')})}
 if(type==='spring'){const s=pStats();P.hp=Math.min(s.hp,P.hp+Math.round(s.hp*.35));P.mp=Math.min(s.mp,P.mp+Math.round(s.mp*.35));
  carriedPets().forEach(p=>{if(p.hp>0){const q=calcPet(p);p.hp=Math.min(q.hp,p.hp+Math.round(q.hp*.35));p.mp=Math.min(q.mp,p.mp+Math.round(q.mp*.35))}});show({type,msg:'น้ำในลำธารเย็นสดชื่น ทุกคนฟื้น HP และ MP 35%'})}
 if(type==='shrine'){const r=Math.random();
  if(r<.45){const raw=expFor(zd.lv[1])*2,x=progressionRewardExp(P,raw),l=gainExp(P,x,true);party().forEach(p=>l.push(...gainExp(p,progressionRewardExp(p,raw),false)));show({type,msg:`เทพประทานพร ได้ EXP ${fmt(x)}${l.length?'<br>'+l.join('<br>'):''}`})}
  else if(r<.75){const id=SEALS[Math.min(4,ZT(z.id))];P.items[id]=(P.items[id]||0)+2;show({type,msg:`บนแท่นบูชามี${CON[id].n} 2 ใบ คุณเก็บมาอย่างนอบน้อม`})}
  else{const s=pStats();P.mp=s.mp;carriedPets().forEach(p=>{if(p.hp>0)p.mp=calcPet(p).mp});show({type,msg:'แสงศักดิ์สิทธิ์โอบล้อม MP ของทุกคนเต็ม'})}}
 if(type==='village')show({type,msg:'ชาวบ้านต้อนรับนักเดินทาง ร้านค้าเปิดให้ซื้อสินค้า ราคาแพงกว่าในเมืองนิดหน่อย'});
 if(type==='hospital')show({type,msg:'หมอยาประจำป่ายินดีรักษาให้ ถ้ามีค่าตอบแทน',healed:false});
 if(type==='stranger'){const r=Math.random();
  if(r<.6)return fight(travelerUnits(zd),'traveler');
  if(r<.8)show({type,msg:pick(['ชาวบ้านเก็บสมุนไพรเปิดผ้าคลุมทักทาย แล้วเดินจากไป','นักแสวงบุญขอทางผ่าน แล้วหายไปในหมอก','พ่อค้าเร่ที่หลงทางถามทางไปเมือง คุณชี้ทางให้','นักบวชชราพยักหน้าให้เงียบ ๆ แล้วเดินสวนไป'])});
  else{const out=[];if(Math.random()<.15){const id=legendDrop(zd.id);if(id){P.owned.push(id);out.push('✦ '+EQ[id].n)}}
   if(!out.length){const ks=[SEALS[Math.min(4,ZT(z.id))],['pot','pot2','pot2','pot3','pot3','pot3'][ZT(z.id)],pick(CURES),'eth'];ks.slice(0,R(2,4)).forEach(k=>{P.items[k]=(P.items[k]||0)+1;out.push(CON[k].n)})}
   show({type,msg:`นักเดินทางผู้ใจดีมอบของให้: ${out.join(', ')}`})}}
 if(type==='exit')show({type,msg:'แสงแดดลอดผ่านต้นไม้ เห็นกำแพงเมืองอยู่ไกล ๆ จะกลับเมืองตอนนี้ หรือเดินลึกเข้าไปต่อ?'});
 if(z.ev)zlog(z.ev.msg.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,100));save();render()}

/* ================= ACTIONS ================= */
let pendingImg=null;
const CLOUD={st:'init',info:null,busy:0};
async function cloudInit(){try{const c=window.claude;if(!c||!c.use){CLOUD.st='off';return}
 const [db,user]=await Promise.all([c.use('db'),c.use('user')]);if(!db||!user){CLOUD.st='off';render();return}
 const id=await user.id();if(!id){CLOUD.st='off';render();return}
 CLOUD.db=db;CLOUD.uid=id;CLOUD.ref=db.doc('data/users/'+id+'/save');CLOUD.st='ready';const s=await CLOUD.ref.get();CLOUD.info=s.exists?s.data():null;render()}catch(e){CLOUD.st='off';render()}}
async function cloudSave(){if(CLOUD.st!=='ready'||!S.P||CLOUD.busy)return;if(S.battle){toast('บันทึกระหว่างต่อสู้ไม่ได้');return}
 CLOUD.busy=1;render();const d={json:JSON.stringify({...S,battle:null,ui:{}}),at:Date.now(),name:S.P.name,lv:S.P.lv,cls:S.P.cls};
 try{await CLOUD.ref.set(d);CLOUD.info=d;toast('บันทึกขึ้นคลาวด์แล้ว');lbSubmit(true)}catch(e){toast(e&&e.code==='invalid_argument'?'บัญชีนี้ยังไม่มีสิทธิ์บันทึกในเกมนี้ ให้เจ้าของแชร์แบบผู้ร่วมใช้งาน (Contributor)':e&&e.code==='quota_exceeded'?'พื้นที่คลาวด์เต็ม':'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง')}
 CLOUD.busy=0;render()}
async function cloudLoad(){if(CLOUD.st!=='ready'||CLOUD.busy)return;CLOUD.busy=1;render();
 try{const s=await CLOUD.ref.get();if(!s.exists){toast('ยังไม่มีเซฟบนคลาวด์')}else{const d=s.data();S=JSON.parse(d.json);S.ui={};S.battle=null;S.screen=S.zone?'zone':'town';migrate();save();CLOUD.info=d;toast('โหลดเซฟจากคลาวด์แล้ว')}}catch(e){toast('โหลดไม่สำเร็จ ลองใหม่อีกครั้ง')}
 CLOUD.busy=0;render()}
/* ---- leaderboard (shared rows: everyone reads, each player writes only their own) ---- */
/* ---- leaderboard on เซิร์ฟเวอร์ออนไลน์ (ระบบออนไลน์ web app; URL set in index.html) ---- */
const SHEET_URL=String(window.SHEET_URL||'').trim();
const LB={rows:null,busy:0,lastKey:'',lastAt:0,err:''};
const LBTAB={score:{n:'คะแนนสะสม',v:r=>fmt(r.score||0)+' คะแนน',k:r=>r.score||0},lv:{n:'เลเวล',v:r=>`Lv ${r.level}`,k:r=>r.level*1e9+(r.exp||0)},
 zone:{n:'ด่านไกลสุด',v:r=>r.clears?`ปราบจอมมาร ${r.clears} ครั้ง`:(r.zoneName||`ด่าน ${r.zone}`),k:r=>(r.clears||0)*1e6+(r.zone||0)*1e3+r.level},
 caught:{n:'จับอสูร',v:r=>`${r.caught} ชนิด`,k:r=>r.caught*1e4+r.seen},
 seen:{n:'ค้นพบอสูร',v:r=>`${r.seen} ชนิด`,k:r=>r.seen*1e4+r.caught},
 legend:{n:'ของในตำนาน',v:r=>`${r.legend} ชิ้น`,k:r=>r.legend*1e3+r.level}};
function pid(){const P=S.P;if(!P.pid){const a=new Uint8Array(12);try{crypto.getRandomValues(a)}catch(e){for(let i=0;i<12;i++)a[i]=Math.floor(Math.random()*256)}P.pid=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');save()}return P.pid}
function lbEntry(){const P=S.P,zm=clamp(P.zoneMax,1,6),seen=Object.keys(P.seen).filter(k=>SP[k]&&!SP[k].noseal).length;
 return {score:S.P.score||0,profile:S.P.profile||'',id:pid(),name:String(P.name).slice(0,20),cls:P.cls,clsName:CLS[P.cls].n,lv:P.lv,exp:P.exp,zone:zm,zoneName:ZN[zm-1].n,seen,caught:Object.keys(P.caught).filter(k=>SP[k]).length,legend:Object.keys(P.legend||{}).length,clear:P.cleared||0}}
async function sheetRequest(options){const c=new AbortController(),timer=setTimeout(()=>c.abort(),25000);try{const r=await fetch(SHEET_URL, {...options,signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!j||typeof j.ok!=='boolean')throw new Error('Invalid response');return j}finally{clearTimeout(timer)}}
async function lbPost(body){return sheetRequest({method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)})}
async function lbSubmit(force){if(!SHEET_URL||!S.P||S.P.lbOff)return;
 if(LB.pending){await LB.pending;if(!force)return;if(!S.P||S.P.lbOff)return}
 const e=lbEntry(),key=JSON.stringify(e);
 if(key===LB.lastKey||(!force&&Date.now()-LB.lastAt<60000))return;
 LB.lastAt=Date.now();
 LB.pending=(async()=>{try{const r=await lbPost(e);if(!r.ok)throw new Error('submit failed');LB.lastKey=key}catch(err){LB.lastKey=''}})();
 try{await LB.pending}finally{LB.pending=null}}
async function lbLoad(){if(!SHEET_URL)return;LB.busy=1;LB.err='';render();await lbSubmit(true);
 try{const r=await fetch(SHEET_URL+(SHEET_URL.includes('?')?'&':'?')+'t='+Date.now());const j=await r.json();if(!r.ok||!j||j.ok!==true||!Array.isArray(j.rows))throw new Error('Invalid leaderboard');LB.rows=j.rows}
 catch(e){LB.err=window.claude?'กระดานคะแนนเชื่อมกับ เซิร์ฟเวอร์ออนไลน์ ใช้ได้ในเวอร์ชัน GitHub':'โหลดกระดานคะแนนไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต แล้วกดรีเฟรช';LB.rows=LB.rows||[]}LB.busy=0;render()}
function vLeader(){const tab=S.ui.lb||'score',T=LBTAB[tab];
 const head=`<div class="row"><h2 class="grow">หอเกียรติยศ</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>`;
 if(!SHEET_URL)return `<div class="stack">${head}<div class="card"><p class="sub" style="margin:0">ยังไม่ได้เชื่อมกระดานคะแนนกับ เซิร์ฟเวอร์ออนไลน์ ใส่ลิงก์ ระบบออนไลน์ ในบรรทัด SHEET_URL ของไฟล์ index.html</p></div></div>`;
 const me=pid().slice(-6),ranked=(LB.rows||[]).filter(r=>typeof r.level==='number').sort((a,b)=>T.k(b)-T.k(a)).map((r,i)=>({...r,displayRank:i+1})),rows=ranked.filter((r,i)=>i<20||r.pid===me);
 return `<div class="stack">${head}<p class="sub" style="margin:0">20 อันดับแรกและอันดับของคุณ · บันทึกลง เซิร์ฟเวอร์ออนไลน์ อัตโนมัติเมื่อกลับเข้าเมือง (ไม่เกินนาทีละครั้ง)</p>
 <div class="tabs">${Object.entries(LBTAB).map(([k,t])=>`<button class="${tab===k?'on':''}" data-a="lbtab" data-v="${k}">${t.n}</button>`).join('')}</div>
 ${LB.err?`<p class="sub" style="margin:0;color:var(--bad)">${LB.err}</p>`:''}
 ${LB.rows===null||LB.busy&&!rows.length?'<p class="sub">กำลังโหลดอันดับ...</p>':rows.length?`<div class="lst">${rows.map((r,i)=>`<div class="item lbrow ${r.pid===me?'me':''}"><span class="lbn num">${r.displayRank<=3?['🥇','🥈','🥉'][r.displayRank-1]:r.displayRank}</span>${r.profile?`<img src="${esc(r.profile)}" alt="รูปโปรไฟล์" width="38" height="38" style="border-radius:50%">`:portrait('cls:'+(CLS[r.cls]?r.cls:'swordsman'),34)}<div class="grow"><b>${esc(r.name||'ผู้ผนึก')}${r.pid===me?' <span class="badge">คุณ</span>':''}</b><small>${esc(r.clsName||'')} · Lv ${r.level} · ค้นพบ ${r.seen} · จับ ${r.caught}${r.clears?' · 🏆':''}</small></div><b class="num" style="color:var(--gold);text-align:right">${esc(T.v(r))}</b></div>`).join('')}</div>`:'<p class="sub">ยังไม่มีใครอยู่ในกระดาน</p>'}
 <div class="row wrap" style="gap:8px"><button class="btn sm" data-a="lbload" ${LB.busy?'disabled':''}>${LB.busy?'กำลังโหลด...':'รีเฟรช'}</button>${S.P.lbOff?'<button class="btn sm pri" data-a="lbtoggle">แสดงชื่อของฉันในกระดาน</button>':'<button class="btn sm" data-a="lbtoggle">ซ่อนชื่อของฉันจากกระดาน</button>'}</div></div>`}
/* ---- game saves on เซิร์ฟเวอร์ออนไลน์: player code + optional PIN ---- */
const GS={busy:0,lastJson:'',lastAt:0};
function sheetError(r){return ({pin:'PIN ไม่ถูกต้องหรือไม่ตรงกับเซฟบน ระบบออนไลน์',notfound:'ไม่พบรหัสผู้เล่นนี้','bad id':'โปรดอัปเดต ระบบออนไลน์ เป็นเวอร์ชันใหม่','bad code':'รหัสผู้เล่นไม่ถูกต้อง','too big':'ข้อมูลเซฟใหญ่เกินพื้นที่ที่รองรับ','bad data':'ข้อมูลเซฟไม่ถูกต้อง','bad pin':'PIN ต้องเป็นตัวเลขหรือตัวอักษร 4–12 ตัว',busy:'เซิร์ฟเวอร์กำลังทำงาน โปรดลองอีกครั้ง'})[r&&r.error]||'ดำเนินการไม่สำเร็จ โปรดตรวจการเชื่อมต่อและการ Deploy';}
const CODE_AB='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function ensureCode(){const P=S.P;if(!P.code){const a=new Uint8Array(12);try{crypto.getRandomValues(a)}catch(e){for(let i=0;i<12;i++)a[i]=Math.floor(Math.random()*256)}P.code=[...a].map(x=>CODE_AB[x%CODE_AB.length]).join('');save()}return P.code}
const fmtCode=c=>c.replace(/(.{4})(?=.)/g,'$1-');
const gsData=()=>{const P={...S.P};delete P.cpin;delete P.gsAt;return JSON.stringify({...S,P,battle:null,ui:{}})};
async function gsSave(manual,newPin){if(!SHEET_URL||!S.P||S.battle||GS.busy||S.ui.confirm)return;const P=S.P;ensureCode();const data=gsData();
 if(!manual&&(data===GS.lastJson||Date.now()-GS.lastAt<120000))return;
 GS.busy=1;GS.lastAt=Date.now();if(manual)render();
 try{const body={action:'save',code:ensureCode(),pin:P.cpin||'',data,name:P.name,clsName:CLS[P.cls].n,lv:P.lv};if(newPin!=null)body.newPin=newPin;
  const r=await lbPost(body);
  if(r&&r.ok){applyAccount(r.account);GS.lastJson=gsData();P.gsAt=r.at;if(newPin!=null){P.cpin=newPin;const el=document.getElementById('gsnewpin');if(el)el.value=''}save();if(manual)toast(newPin!=null?(newPin?'ตั้ง PIN แล้ว':'ลบ PIN แล้ว'):'บันทึกลง เซิร์ฟเวอร์ออนไลน์ แล้ว')}
  else if(manual)toast(sheetError(r))}
 catch(e){if(manual)toast('บันทึกไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต')}
 GS.busy=0;render()}
async function gsLoad(code,pin){if(GS.busy)return;code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<12||code.length>16){toast('รหัสผู้เล่นไม่ถูกต้อง');return}
 GS.busy=1;render();
 try{const r=await lbPost({action:'load',code,pin:pin||''});
  if(r&&r.ok){const d=JSON.parse(r.data);if(!d.P)throw 0;d.P.code=code;d.P.cpin=pin||'';d.P.gsAt=r.at;PENDING=d;S.ui.confirm={msg:`โหลดเซฟของ <span data-user-content>${esc(d.P.name)}</span> Lv ${d.P.lv} จาก เซิร์ฟเวอร์ออนไลน์? ความคืบหน้าในเครื่องนี้จะถูกแทนที่`,act:'doloadcode'}}
  else toast(sheetError(r))}
 catch(e){toast('โหลดไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต')}
 GS.busy=0;render()}
function vระบบออนไลน์Save(startOnly){if(!SHEET_URL)return '';const P=S.P;
 const loadForm=`<div class="row wrap" style="gap:6px"><input type="text" id="gscode" autocomplete="off" placeholder="รหัสผู้เล่น เช่น ABCD-EFGH-JKLM" style="flex:2;min-width:160px"><input type="password" id="gspin" autocomplete="off" placeholder="PIN (ถ้ามี)" style="flex:1;min-width:100px"></div><button class="btn sm" data-a="gsload" ${GS.busy?'disabled':''}>โหลดเซฟจาก เซิร์ฟเวอร์ออนไลน์</button>`;
 if(startOnly)return `<div class="card stack" style="gap:8px"><h3>มีรหัสผู้เล่นอยู่แล้ว?</h3><p class="sub" style="margin:0">ใส่รหัสผู้เล่นเพื่อเล่นต่อจากเครื่องอื่น</p>${loadForm}</div>`;
 return `<div class="card stack" style="gap:8px"><h3>เซฟบน เซิร์ฟเวอร์ออนไลน์</h3><p class="sub" style="margin:0">บันทึกอัตโนมัติเมื่อกลับเข้าเมือง ใช้รหัสผู้เล่นนี้โหลดเกมในเครื่องอื่น อย่าบอกรหัสและ PIN กับคนอื่น</p>
 <div class="row wrap" style="gap:8px"><span class="sub">รหัสผู้เล่น</span><b class="num" style="font-size:17px;letter-spacing:.06em;color:var(--gold)">${fmtCode(ensureCode())}</b><button class="btn sm" data-a="copycode">คัดลอก</button></div>
 <div class="sub">${P.gsAt?`บันทึกล่าสุด ${new Date(P.gsAt).toLocaleString(gameLocale(),{dateStyle:'medium',timeStyle:'short'})}`:'ยังไม่เคยบันทึกขึ้น เซิร์ฟเวอร์ออนไลน์'} · ${P.cpin?'ตั้ง PIN แล้ว':'ยังไม่ได้ตั้ง PIN'}</div>
 <div class="row wrap" style="gap:8px"><button class="btn sm pri" data-a="gssave" ${GS.busy?'disabled':''}>${GS.busy?'กำลังบันทึก...':'บันทึกตอนนี้'}</button><input type="password" id="gsnewpin" autocomplete="new-password" maxlength="12" placeholder="PIN ใหม่ 4–12 ตัว" style="width:150px"><button class="btn sm" data-a="gssetpin" ${GS.busy?'disabled':''}>${P.cpin?'เปลี่ยน PIN':'ตั้ง PIN'}</button></div>
 <details><summary class="sub" style="cursor:pointer">โหลดเซฟของรหัสอื่น</summary><div class="stack" style="gap:6px;margin-top:6px">${loadForm}</div></details></div>`}
/* ---- save backup: code / file (works anywhere, including GitHub) ---- */
const encSave=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))),decSave=t=>JSON.parse(decodeURIComponent(escape(atob(t))));
const saveCode=()=>'SB1.'+encSave({...S,battle:null,ui:{}});
let PENDING=null;
function askLoadCode(t){t=String(t||'').trim().replace(/^SB1\./,'').replace(/\s+/g,'');if(!t){toast('วางรหัสเซฟก่อน');return}
 try{const d=decSave(t);if(!d||!d.P)throw 0;PENDING=d}catch(e){toast('รหัสเซฟไม่ถูกต้อง');return}
 S.ui.confirm={msg:`โหลดเซฟของ <span data-user-content>${esc(PENDING.P.name)}</span> Lv ${PENDING.P.lv}? ความคืบหน้าปัจจุบันในเครื่องนี้จะถูกแทนที่`,act:'doloadcode'};render()}
function vBackup(startOnly){const show=S.ui.showCode;
 return `<div class="card stack" style="gap:8px"><h3>สำรองและย้ายเซฟ</h3><p class="sub" style="margin:0">เซฟเก็บในเบราว์เซอร์ของเครื่องนี้ ใช้รหัสเซฟหรือไฟล์เซฟเพื่อย้ายไปเล่นเครื่องอื่น หรือเก็บสำรองกันหาย (รูปที่ใส่เองไม่รวมในเซฟ)</p>
 ${startOnly?'':`<div class="row wrap" style="gap:8px"><button class="btn sm pri" data-a="copysave">คัดลอกรหัสเซฟ</button>${window.claude?'':'<button class="btn sm" data-a="dlsave">ดาวน์โหลดไฟล์เซฟ</button>'}</div>`}
 ${show&&!startOnly?`<textarea id="codeout" readonly rows="3" style="width:100%;font-size:11px">${saveCode()}</textarea>`:''}
 <textarea id="savein" rows="2" placeholder="วางรหัสเซฟที่นี่" style="width:100%;font-size:12px"></textarea>
 <div class="row wrap" style="gap:8px"><button class="btn sm" data-a="loadcode">โหลดจากรหัสเซฟ</button><button class="btn sm" data-a="pickfile">โหลดจากไฟล์เซฟ</button></div></div>`}
function vCloud(){const i=CLOUD.info,has=S.P;
 if(CLOUD.st==='init')return `<div class="card"><span class="sub">กำลังเชื่อมต่อเซฟบนคลาวด์...</span></div>`;
 if(CLOUD.st==='off')return `<div class="card stack" style="gap:4px"><h3>เซฟบนคลาวด์</h3><p class="sub" style="margin:0">ใช้ได้เมื่อล็อกอิน Claude ตอนนี้เกมเซฟไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น</p></div>`;
 return `<div class="card stack" style="gap:8px"><h3>เซฟบนคลาวด์</h3><p class="sub" style="margin:0">ผูกกับบัญชี Claude ของคุณ เปิดเกมจากเครื่องไหนก็โหลดต่อได้ รูปที่ใส่เองไม่ถูกบันทึกขึ้นคลาวด์</p>
 <div class="sub">${i?`เซฟล่าสุด: <b style="color:var(--fg)"><span data-user-content>${esc(i.name)}</span> · ${CLS[i.cls]?CLS[i.cls].n:''} Lv ${i.lv}</b> · ${new Date(i.at).toLocaleString(gameLocale(),{dateStyle:'medium',timeStyle:'short'})}`:'ยังไม่มีเซฟบนคลาวด์'}</div>
 <div class="row wrap" style="gap:8px">${has?`<button class="btn sm pri" data-a="cloudsave" ${CLOUD.busy?'disabled':''}>${CLOUD.busy?'กำลังบันทึก...':'บันทึกขึ้นคลาวด์'}</button>`:''}${i?`<button class="btn sm" data-a="cloudload" ${CLOUD.busy?'disabled':''}>โหลดจากคลาวด์</button>`:''}</div></div>`}
function toast(t){if(/ไม่พอ|ไม่ได้|ไม่สำเร็จ|ผิด|ไม่ตรง|หมดอายุ/.test(t))ExtraAudio.play('error');else if(/สำเร็จ/.test(t))ExtraAudio.play('quest');const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2500)}
function go(s){if(WORLD?.room?.status==='active'&&!['world','town','hero','team','bag','settings'].includes(s)){toast('จบบอสโลกหรือถอนตัวก่อนเริ่มโหมดอื่น');return;}if(s==='world'){S.screen='world';render();wbCall(WORLD.roomId?'wb_poll':'wb_status');return;}if(S.zone&&['town','shop','hospital','arena','forge','leader','pvp','camp','world'].includes(s)){toast('ออกจากป่าไม่ได้ จนกว่าจะชนะบอส เจอทางออก หรือพ่ายแพ้');return}if(S.zone&&s==='wild')s='zone';
 S.screen=s;clearTimeout(PVP.timer);if(s==='pvp'){if(PVP.code&&S.P&&PVP.code!==ensureCode()){PVP.room=null;PVP.token='';PVP.restore='';PVP.pending=null;pvpSessionSave()}if(PVP.token)pvpSchedule()}S.ui.petView=null;save();render();if(s==='leader')lbLoad();document.querySelector('main')?.scrollTo(0,0)}
const healCost=()=>5+S.P.lv*4;
function allFull(){const P=S.P,s=pStats();return P.hp>=s.hp&&P.mp>=s.mp&&(S.zone?carriedPets():P.pets).every(p=>{const q=calcPet(p);return p.hp>=q.hp&&p.mp>=q.mp})}
function fullHeal(){const P=S.P,s=pStats();P.hp=s.hp;P.mp=s.mp;(S.zone?carriedPets():P.pets).forEach(p=>{const q=calcPet(p);p.hp=q.hp;p.mp=q.mp})}
function surrenderForest(){if(!S.zone){S.ui.confirm=null;render();return}
 const P=S.P;let message;
 if(S.battle&&!S.battle.over){endBattle('lose');message=S.battle.over.lines.join(' · ')}
 else{const lost=Math.max(0,Math.floor(P.gold*.1));P.gold-=lost;const xp=loseExp(P,.08);party().forEach(p=>loseExp(p,.08));P.hp=Math.max(1,Math.round(pStats().hp*.3));message=`ยอมแพ้กลับเมือง เสีย ${fmt(lost)} เหรียญ และ EXP ${fmt(xp)} (เลเวลไม่ลด)`}
 S.zone=null;S.battle=null;VQ.length=0;S.ui.confirm=null;S.screen='hospital';save();render();toast(message)}
const handlers={
 pvpCreate:()=>pvpConnect('create'),pvpJoin:()=>pvpConnect('join'),pvpResume:()=>pvpConnect('resume'),pvpReady:()=>pvpRequest({action:'pvp_ready',wagerRev:PVP.room?.wagers?.rev||0}),pvpPoll:()=>pvpRequest({action:'pvp_poll'}),
 pvpTarget:id=>{PVP.target=id;render()},pvpFriend:id=>{PVP.friend=id;render()},
 pvpMove:id=>{if(PVP.busy||PVP.pending||!PVP.room)return;const request=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,'0')).join('');PVP.pending={action:'pvp_move',rev:PVP.room.rev,request,skill:id,target:PVP.target,friend:PVP.friend};pvpSessionSave();pvpRequest(PVP.pending)},
 pvpRetry:()=>{if(PVP.pending)pvpRequest(PVP.pending)},
 pvpCopy:()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(PVP.room.id).then(()=>toast('คัดลอกรหัสห้องแล้ว'),()=>toast('รหัสห้อง: '+PVP.room.id));else toast('รหัสห้อง: '+PVP.room.id)},
 pvpLeave:()=>{S.ui.confirm={msg:'ออกจากห้อง? ถ้าเริ่มประลองแล้วถือว่ายอมแพ้ แต่ไม่หักข้อมูลเกมหลัก',act:'pvpDoLeave'};render()},pvpDoLeave:()=>{S.ui.confirm=null;pvpRequest({action:'pvp_leave'})},
 pvpClear:()=>{clearTimeout(PVP.timer);PVP.room=null;PVP.token='';PVP.restore='';PVP.pending=null;PVP.error='';pvpSessionSave();render()},

 soundtoggle:async()=>{Sound.enabled=!Sound.enabled;Sound.save();if(!Sound.enabled)Sound.mute();else{const ready=await Sound.unlock();if(ready)Sound.fx('blessing');else toast('เบราว์เซอร์ยังไม่พร้อมเล่นเสียง ลองกดเปิดเสียงอีกครั้ง')}render()},
 go:v=>go(v),
 surrender:()=>{if(!S.zone)return;const band=S.battle&&['bandit','traveler'].includes(S.battle.kind);S.ui.confirm={msg:band?'ยอมตายและกลับเมือง? ใช้บทลงโทษแพ้โจร: เสียเหรียญ 25% เสีย EXP 15% ตามเกณฑ์เดิม และอาจถูกขโมยอสูรหรือไอเท็ม':'ยอมตายและกลับเมือง? เสียเหรียญ 10% ของที่มี และ EXP 8% ของค่าที่ต้องใช้ขึ้นเลเวล (ไม่เกิน EXP ที่มี ไม่ลดเลเวล) คุณกับอสูรในทีมรับโทษ EXP และคุณฟื้น HP 30% ที่โรงพยาบาล',act:'dosurrender'};render()},
 dosurrender:()=>surrenderForest(),
 story:()=>{S.ui.storyReturn=S.screen;S.screen='story';render();document.querySelector('main')?.scrollTo(0,0)},
 storyback:()=>{S.screen=S.ui.storyReturn||(S.P?(S.zone?'zone':'town'):'start');delete S.ui.storyReturn;render()},
 clspick:v=>{S.ui.cls=v;render()},starterpick:v=>{const n=clsSum(S.ui.cls||'swordsman');let a=starterSel().filter(k=>k!==v);if(a.length===starterSel().length){a.push(v);if(a.length>n)a.shift()}if(!a.length)a=[v];S.ui.starters=a;render()},
 craft:v=>{const P=S.P,c=CRAFT[v];if(!canCraft(v)){toast('วัตถุดิบหรือเงินไม่พอ');return}c.mats.forEach(([k,n])=>{P.parts[k]-=n;if(!P.parts[k])delete P.parts[k]});P.gold-=c.gold;ExtraAudio.play('forge');const id=craftId(v);P.owned.push(id);save();render();toast(`หลอม ${EQ[id].n} สำเร็จ!`)},
 forgetab:v=>{S.ui.forge=+v;render()},
 newgame:()=>{const name=(document.getElementById('nm').value||'').trim()||'ผู้ผนึก',cls=S.ui.cls||'swordsman',sts=starterSel();
  S={ver:6,screen:'town',ui:{},zone:null,battle:null,P:{name:name.slice(0,20),cls,lv:3,exp:0,gold:150,pts:{},free:10,eq:{weapon:`wp_${CLS[cls].w}0`},owned:[],items:{pot:5,seal1:5,eth:2,antidote:1,calm:1},parts:{},pets:[],party:[],legend:{},zoneMax:1,arena:{},seen:{},caught:{},uid:1}};
  const s=pStats();S.P.hp=s.hp;S.P.mp=s.mp;sts.forEach(st=>{const p=mkPet(st,3);S.P.pets.push(p);S.P.party.push(p.uid);S.P.seen[st]=1;S.P.caught[st]=1});save();render();toast(`${sts.map(k=>SP[k].n).join(' และ ')} เข้ามาอยู่ในผนึกของคุณ`)},
 shoptab:v=>{if(v==='wpall'){S.ui.allw=!S.ui.allw;v='wp'}S.ui.shop=v;render()},tier:v=>{S.ui.tier=+v;render()},teamtab:v=>{S.ui.team=v;S.ui.petView=null;render()},herotab:v=>{S.ui.hero=v;render()},
 buy:v=>{const P=S.P,it=EQ[v]||CON[v];if(!it||it.rareLoot||it.worldLegend)return;const pr=priceOf(it);if(P.gold<pr){toast('เหรียญไม่พอ');return}if(it.lv&&P.lv<it.lv&&!EQ[v]){toast(`ต้องเลเวล ${it.lv}`);return}
  P.gold-=pr;ExtraAudio.play('buy');if(EQ[v])P.owned.push(v);else P.items[v]=(P.items[v]||0)+1;save();render();toast(`ซื้อ ${it.n} แล้ว`)},
 sellpart:v=>{const [key,all]=v.split('~'),P=S.P,[sp,i]=key.split('|'),pr=partPrice(SP[sp].parts[+i][1]),n=all?P.parts[key]:1;if(!(P.parts[key]>0))return;
  P.parts[key]-=n;P.gold+=pr*n;if(!P.parts[key])delete P.parts[key];save();render();toast(`ขายได้ ${fmt(pr*n)} เหรียญ`)},
 sellgear:v=>{const P=S.P,i=P.owned.indexOf(v);if(i<0)return;P.owned.splice(i,1);const g=Math.floor(EQ[v].price/2);P.gold+=g;save();render();toast(`ขายได้ ${fmt(g)} เหรียญ`)},
 equip:v=>{const P=S.P,it=EQ[v],i=P.owned.indexOf(v);if(i<0||!it)return;if(P.eq[it.slot]===v){toast('สวมรุ่นนี้อยู่แล้ว ชิ้นในกระเป๋าเป็นชิ้นสำรอง');return;}if(P.lv<it.lv){toast(`ต้องเลเวล ${it.lv}`);return}
  
  P.owned.splice(i,1);if(P.eq[it.slot])P.owned.push(P.eq[it.slot]);P.eq[it.slot]=v;ExtraAudio.play('equip');const s=pStats();P.hp=Math.min(P.hp,s.hp);P.mp=Math.min(P.mp,s.mp);save();render()},
 unequip:v=>{const P=S.P;if(v==='weapon'){toast('ต้องมีอาวุธติดตัวเสมอ');return}if(P.eq[v]){P.owned.push(P.eq[v]);delete P.eq[v]}const s=pStats();P.hp=Math.min(P.hp,s.hp);P.mp=Math.min(P.mp,s.mp);save();render()},
 pt:v=>{const P=S.P;if(P.free<=0)return;P.pts[v]=(P.pts[v]||0)+1;P.free--;if(v==='hp')P.hp+=PER.hp;if(v==='mp')P.mp+=PER.mp;save();render()},
 ppt:v=>{const [uid,k]=v.split(':'),p=petBy(+uid);if(!p||p.free<=0)return;p.pts[k]=(p.pts[k]||0)+1;p.free--;if(k==='hp')p.hp+=PER.hp;if(k==='mp')p.mp+=PER.mp;save();render()},
 promote:v=>{const c=CLS[v];S.ui.confirm={msg:`เลื่อนอาชีพเป็น "${c.n}"? ${c.d} — เลือกแล้วเปลี่ยนกลับไม่ได้`,act:'dopromote',v};render()},
 dopromote:v=>{const P=S.P;if(CLS[v].p!==P.cls||!canPromote(P))return;P.cls=v;S.ui.confirm=null;fixParty();const s=pStats();P.hp=s.hp;P.mp=s.mp;save();render();toast(`เลื่อนอาชีพเป็น ${CLS[v].n} แล้ว!`)},
 heal:()=>{if(allFull()){toast('ทุกคนพลังเต็มอยู่แล้ว ไม่ต้องรักษา');return}const P=S.P,c=healCost();P.gold-=c;fullHeal();save();render();toast(P.gold<0?`รักษาเรียบร้อย ติดหนี้วิหาร ${fmt(-P.gold)} เหรียญ`:`รักษาเรียบร้อย จ่าย ${fmt(c)} เหรียญ`)},
 arena:v=>{if(S.zone)return;const n=NPC[+v];if(S.P.hp<=0){toast('ต้องรักษาตัวก่อน');return}
  const es=[humanUnit(n.n,n.cls,n.lv,0)];n.pets.forEach(([sp,lv],i)=>{const u=wildUnit(sp,lv,i+1);u.name=`${u.name}ของ${n.n.split(' ')[0]}`;u.kind='npcpet';es.push(u)});startBattle(es,'npc',+v);save();render()},
 zone:v=>{if(S.P.hp<=0){toast('ต้องรักษาตัวก่อน');return}S.ui.confirm={msg:`เข้า${ZN[+v-1].n}? เข้าไปแล้วจะกลับเมืองไม่ได้ จนกว่าจะชนะบอส เจอทางออก หรือพ่ายแพ้ เตรียมยาและผนึกให้พร้อม`,act:'dozone',v};render()},
 dozone:v=>{S.ui.confirm=null;S.zone={id:+v,depth:0,log:[`เข้าสู่${ZN[+v-1].n}`],fork:null,ev:null,boss:forestBossFor(ZN[+v-1])};newFork();go('zone')},
 fork:v=>{const door=S.zone?.fork?.[+v];if(!door)return;const type=door.k;chooseFork(+v);playWalk(type,+v)},
 cont:()=>{newFork();save();render();document.querySelector('main')?.scrollTo(0,0)},
 openchest:()=>{const ev=S.zone.ev;if(!ev||ev.opened)return;const out=openChest(ev.chest);ev.opened=true;ev.got=out;zlog(`เปิด${CHESTS[ev.chest].n} ได้ ${out.join(', ')}`.slice(0,120));save();render()},
 exitzone:()=>{S.zone=null;S.screen='town';save();render();toast('ออกจากป่ากลับสู่นครพันผนึกได้อย่างปลอดภัย')},
 boss:()=>{const base=ZN[S.zone.id-1],z={...base,boss:forestPassed(base)?(S.zone.boss||base.boss):base.boss};zlog(`เผชิญหน้ากับ${z.boss.n}!`);const es=[wildUnit(z.boss.sp,z.boss.lv,0,z.boss.n)];
  if(z.final){const d=es[0];['hp','patk','matk','pdef','mdef'].forEach(k=>d.st[k]=Math.round(d.st[k]*(k==='hp'?1.4:1.08)));if(z.boss.sp==='demonlord')for(const k of ['patk','matk'])d.st[k]=Math.round(d.st[k]*.85);d.hp=d.st.hp;d.skills.push(SP[z.boss.sp].sig);
   Object.keys(CLS).filter(k=>tierOf(k)===2).sort(()=>Math.random()-.5).slice(0,2).forEach((c,i)=>{const h=humanUnit('แม่ทัพปีศาจ'+CLS[c].n,c,50,i+1);es.push(h)})}
  for(let i=0;i<z.mini;i++){const u=wildUnit(pick(z.sp),z.lv[1]-1,i+1);u.name='สมุน'+u.name;es.push(u)}startBattle(es,'boss',z.id);save();render()},
 vbuy:v=>{const P=S.P,it=CON[v];if(!it||it.rareLoot)return;const pr=Math.round(priceOf(it)*1.25);if(P.gold<pr){toast('เหรียญไม่พอ');return}if(it.lv&&P.lv<it.lv){toast(`ต้องเลเวล ${it.lv}`);return}P.gold-=pr;ExtraAudio.play('buy');P.items[v]=(P.items[v]||0)+1;save();render();toast(`ซื้อ ${it.n} แล้ว`)},
 vsell:v=>toast('หมู่บ้านกลางป่าไม่มีบริการรับซื้อของ'),
 zheal:()=>{if(allFull()){toast('ทุกคนพลังเต็มอยู่แล้ว ไม่ต้องรักษา');return}const P=S.P,c=Math.round(healCost()*1.5);P.gold-=c;fullHeal();S.zone.ev.healed=true;save();render();toast(`รักษาเรียบร้อย จ่าย ${fmt(c)} เหรียญ`)},
 bt:v=>battleAction(v),
 partytoggle:v=>{const P=S.P,u=+v,n=clsSum(P.cls);if(P.party.includes(u)){if(P.party.length<=1){toast('ต้องมีอสูรในทีมอย่างน้อย 1 ตัว');return}P.party=P.party.filter(x=>x!==u)}
  else{if(P.party.length>=n){P.party.shift()}P.party.push(u)}save();render()},
 petview:v=>{S.ui.petView=v===''?null:+v;render();document.querySelector('main')?.scrollTo(0,0)},
 release:v=>{S.ui.confirm={msg:`ปล่อย ${petName(petBy(+v))} คืนสู่ป่า? การกระทำนี้ย้อนกลับไม่ได้`,act:'dorelease',v};render()},
 dorelease:v=>{const P=S.P;if(P.pets.length<=1){toast('ต้องมีอสูรอย่างน้อย 1 ตัว');S.ui.confirm=null;render();return}P.pets=P.pets.filter(p=>p.uid!==+v);fixParty();S.ui.confirm=null;S.ui.petView=null;save();render()},
 cancel:()=>{S.ui.confirm=null;render()},
 cloudsave:()=>cloudSave(),
 lbtab:v=>{S.ui.lb=v;render()},lbload:()=>lbLoad(),
 lbtoggle:async()=>{const P=S.P;P.lbOff=!P.lbOff;save();if(P.lbOff){const me=pid().slice(-6);LB.rows=(LB.rows||[]).filter(r=>r.pid!==me);LB.lastKey='';toast('ซ่อนชื่อของคุณจากกระดานแล้ว');render();if(SHEET_URL){try{if(LB.pending)await LB.pending;const r=await lbPost({action:'delete',id:pid()});if(!r.ok)throw new Error('delete failed')}catch(e){toast('ซ่อนในเครื่องแล้ว แต่ลบบน ระบบออนไลน์ ไม่สำเร็จ โปรดแสดงชื่อแล้วลองซ่อนอีกครั้ง')}}}else{toast('แสดงชื่อของคุณในกระดานแล้ว');lbLoad()}},
 gssave:()=>gsSave(true),
 gssetpin:()=>{const v=(document.getElementById('gsnewpin')?.value||'').trim();if(!/^[0-9A-Za-z]{4,12}$/.test(v)){toast('PIN ต้องเป็นตัวเลขหรือตัวอักษร 4–12 ตัว');return}gsSave(true,v)},
 gsload:()=>gsLoad(document.getElementById('gscode')?.value,document.getElementById('gspin')?.value),
 copycode:()=>{const c=fmtCode(ensureCode());try{navigator.clipboard.writeText(c).then(()=>toast('คัดลอกรหัสผู้เล่นแล้ว'),()=>toast('รหัสผู้เล่น: '+c))}catch(e){toast('รหัสผู้เล่น: '+c)}},
 copysave:()=>{const c=saveCode();const ok=()=>toast('คัดลอกรหัสเซฟแล้ว นำไปวางในเครื่องอื่นได้');try{navigator.clipboard.writeText(c).then(ok,()=>{S.ui.showCode=1;render();toast('คัดลอกอัตโนมัติไม่ได้ กดค้างที่กล่องรหัสเพื่อคัดลอก')})}catch(e){S.ui.showCode=1;render()}},
 dlsave:()=>{try{const b=new Blob([saveCode()],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`sealbeast-${S.P.name}-Lv${S.P.lv}.txt`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){S.ui.showCode=1;render();toast('ดาวน์โหลดไม่ได้ ใช้การคัดลอกรหัสเซฟแทน')}},
 loadcode:()=>askLoadCode(document.getElementById('savein')?.value),
 pickfile:()=>{const el=document.getElementById('saveFile');el.value='';el.click()},
 doloadcode:()=>{if(!PENDING)return;S=PENDING;PENDING=null;GS.lastJson='';GS.lastAt=0;LB.lastKey='';LB.lastAt=0;S.ui={};S.battle=null;S.screen=S.zone?'zone':'town';migrate();save();render();toast('โหลดเซฟแล้ว')},
 cloudload:()=>{if(!S.P){cloudLoad();return}S.ui.confirm={msg:'โหลดเซฟจากคลาวด์? ความคืบหน้าในเครื่องนี้ที่ยังไม่ได้บันทึกขึ้นคลาวด์จะถูกแทนที่',act:'docloudload'};render()},
 docloudload:()=>{S.ui.confirm=null;cloudLoad()},
 use:v=>{const [id,who]=v.split(':'),P=S.P,it=CON[id];if(!(P.items[id]>0))return;
  if(who==='P'){const s=pStats();if(it.hp)P.hp=Math.min(s.hp,P.hp+it.hp);if(it.mp)P.mp=Math.min(s.mp,P.mp+it.mp)}
  else{const p=petBy(+who);if(!p)return;if(!S.P.carried?.includes(p.uid)){toast('อสูรตัวนี้พักที่ค่าย นำติดตัวก่อนใช้ยา');return}const s=calcPet(p);if(it.rev){if(p.hp>0){toast('อสูรตัวนี้ยังไม่หมดสติ');return}Sound.fx('revive');p.hp=Math.round(s.hp*it.rev)}else{if(p.hp<=0){toast('ต้องใช้ธูปเรียกวิญญาณก่อน');return}if(it.hp)p.hp=Math.min(s.hp,p.hp+it.hp);if(it.mp)p.mp=Math.min(s.mp,p.mp+it.mp)}}
  P.items[id]--;ExtraAudio.play(it.cure?'heal':'drink');save();render();toast(`ใช้ ${it.n} แล้ว`)},
 img:v=>{pendingImg=v;const el=document.getElementById('imgIn');el.value='';el.click()},
 delimg:v=>{delete IMG[v];saveImg();render()},
 reset:()=>{S.ui.confirm={msg:'เริ่มเกมใหม่? ข้อมูลตัวละครและอสูรทั้งหมดจะหายไป (รูปที่ใส่ไว้ยังอยู่)',act:'doreset'};render()},
 doreset:()=>{S={screen:'start',ui:{}};save();render()},
};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;if(t.dataset.a!=='soundtoggle'){Sound.unlock();if(!['fork','bt'].includes(t.dataset.a))Sound.fx('click')}const f=handlers[t.dataset.a];if(f)f(t.dataset.v??'')});
document.addEventListener('input',e=>{if(e.target.id==='soundVolume'){Sound.setVolume(Number(e.target.value)/100);const o=document.getElementById('soundPercent');if(o)o.textContent=Math.round(Sound.volume*100)+'%'}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(PVP.timer);Sound.mute();if(Sound.ctx)Sound.ctx.suspend().catch(()=>{})}else{if(Sound.enabled)Sound.unlock();pvpSchedule()}});
document.getElementById('saveFile')?.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>askLoadCode(rd.result);rd.readAsText(f)});
document.getElementById('imgIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f||!pendingImg)return;const key=pendingImg;const rd=new FileReader();
 rd.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),z=key==='profile'?80:256;c.width=c.height=z;const g=c.getContext('2d'),m=Math.min(im.width,im.height);
  g.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,z,z);let u=c.toDataURL('image/webp',.85);if(!u.startsWith('data:image/webp'))u=c.toDataURL('image/png');if(key==='profile'){S.P.profile=u;save()}else{IMG[key]=u;saveImg()}render();toast('ใส่รูปแล้ว')};im.src=rd.result};rd.readAsDataURL(f)});

/* ================= VIEWS ================= */
function starterSel(){const n=clsSum(S.ui.cls||'swordsman');let a=(S.ui.starters||[]).filter(k=>STARTERS.includes(k)).slice(0,n);if(!a.length)a=STARTERS.slice(0,n);return a}
const TOWN_ART=SoulbeastContent.TOWN_ART();
const CAREER_GUIDE=SoulbeastContent.CAREER_GUIDE();
function careerGuide(cls){return CAREER_GUIDE[cls]||CAREER_GUIDE[baseOf(cls)]||{pro:'เลือกอุปกรณ์และทีมให้เหมาะกับสายอาชีพ',con:'ควรตรวจทักษะและค่าสถานะก่อนเลื่อนขั้น'};}
function careerLines(cls){const g=careerGuide(cls);return `<span class="career-good"><b>ข้อดี</b> ${esc(g.pro)}</span><span class="career-caution"><b>ข้อเสีย / ควรระวัง</b> ${esc(g.con)}</span>`;}
function careerPanel(cls){return `<div class="career-guide">${careerLines(cls)}</div>`;}
function townTile(action,value,art,title,description,tag='',opt={}){return `<button type="button" class="town-tile ${opt.hero?'town-forest':''} ${opt.feature?'town-feature':''} ${opt.className||''}" data-a="${action}" data-v="${value}" ${opt.disabled?'disabled':''}><img src="${art}" alt="" decoding="async" ${opt.hero?'fetchpriority="high"':'loading="lazy"'}>${tag?`<span class="town-tag">${tag}</span>`:''}<span class="town-tile-copy"><strong>${title}</strong><small>${description}</small><span class="town-tile-cta">${opt.cta||'เข้าร่วมกิจกรรม'} <span aria-hidden="true">→</span></span></span></button>`;}
function townNavArt(key){const p=party()[0],src=key==='town'?BUILTIN_SCENES[1]:key==='wild'?latestForestArt():key==='hero'?(IMG.player||BUILTIN_ART['cls:'+S.P.cls]||BUILTIN_ART['cls:'+baseOf(S.P.cls)]):key==='team'?(BUILTIN_ART[p?.sp]||BUILTIN_ART.kappa):(ITEM_ART.chest||ITEM_ART.pot);return `<img class="town-nav-art" src="${src}" alt="" decoding="async">`;}
function activityBackdrop(key,label){return `<div class="activity-backdrop"><img src="${TOWN_ART[key]}" alt="${label}" decoding="async"><span>${label}</span></div>`;}
function vTown(){const P=S.P,s=pStats();return `<div class="stack town-home"><div class="town-welcome"><span class="town-eyebrow">นครพันผนึก · จุดเริ่มต้นการผจญภัย</span><h2>วันนี้จะออกผจญภัยที่ไหน?</h2><p>เริ่มที่ป่าเพื่อเก็บเลเวล ค้นพบอสูร และหาอุปกรณ์ใหม่</p></div>
 ${townTile('go','wild',latestForestArt(),'เข้าป่า · เริ่มผจญภัย','เลือกพื้นที่ แล้วออกสำรวจทางแยก ต่อสู้ และผนึกอสูรคู่ใจ','เริ่มเล่นที่นี่',{hero:true,cta:'เลือกป่าที่จะออกสำรวจ'})}
 <div class="town-first-steps" aria-label="วิธีเริ่มเล่น"><span><b>1</b> เตรียมยาและผนึก</span><span><b>2</b> เลือกป่าและทางเดิน</span><span><b>3</b> ต่อสู้ · ผนึก · เก็บเลเวล</span><small>ออกจากป่าเมื่อชนะบอส พบทางออก หรือพ่ายแพ้</small></div>
 ${allStatsButton()}<details class="card town-ready"><summary>ตรวจความพร้อมของทีม <span>HP ${P.hp}/${s.hp}${P.free>0?' · มีแต้มตัวละครรออัป':''}${P.pets.some(p=>p.free>0)?' · อสูรมีแต้มรออัป':''}</span></summary><div class="stack">${miniStatus()}${advicePanel()}${canPromote(P)?'<button class="btn pri" data-a="go" data-v="hero">เลื่อนอาชีพได้แล้ว · ดูสายอาชีพ</button>':''}${P.free>0?'<button class="btn" data-a="go" data-v="hero">อัปสถานะตัวละคร</button>':''}</div></details>
 <div class="town-section-title"><h3>กิจกรรมท้าทาย</h3><span>รวมทีม · วางแผน · ลุ้นรางวัล</span></div><div class="town-event-grid">
 ${townTile('go','world',"assets/media/1620b9ca7d9052245fe7d7a1.webp",'บอสโลก · อาซารอธ','รวมทีม 1–4 คน วัดดาเมจและลุ้นอุปกรณ์ตำนาน','สัปดาห์ละ 3 ครั้ง · ทุกเลเวลลองได้ · แนะนำความพร้อม Lv 25+',{feature:true,className:'town-world',cta:'สร้างหรือเข้าร่วมปาร์ตี้'})}
 ${townTile('camp','',TOWN_ART.camp,'จู่โจมค่าย','เลือกค่ายคู่ต่อสู้ จัดอสูรคู่ใจ แล้วบุกชิงรางวัล',P.lv<10?'ปลดล็อก Lv 10':'วันละ 3 ครั้ง',{feature:true,className:'town-camp',disabled:P.lv<10,cta:P.lv<10?'เก็บเลเวลถึง 10 เพื่อเข้าร่วม':'เลือกค่ายที่ต้องการจู่โจม'})}
 </div><div class="town-section-title"><h3>เตรียมตัวและทดสอบฝีมือ</h3><span>ทุกการเดินทางเริ่มจากความพร้อม</span></div><div class="town-place-grid">
 ${townTile('go','shop',TOWN_ART.shop,'ตลาดช่างตีเหล็ก','ซื้ออาวุธ เกราะ ยา และผนึก · ขายชิ้นส่วน','ซื้อขายอุปกรณ์',{cta:'เข้าไปเลือกซื้อ'})}
 ${townTile('go','hospital',TOWN_ART.hospital,'โรงพยาบาลวิหารขาว','ฟื้น HP / MP และช่วยอสูรที่หมดสติ','พักฟื้นก่อนออกป่า',{cta:'เข้ารับการรักษา'})}
 ${townTile('go','arena',TOWN_ART.arena,'หอคอยประลองยุทธ','ท้าดวลผู้ผนึกทุกสายอาชีพและรับเงินรางวัล','ฝึกฝีมือกับคู่ประลอง',{cta:'เลือกคู่ประลอง'})}
 ${townTile('go','forge',TOWN_ART.shop,'โรงหลอมเทพอสูร','เปลี่ยนชิ้นส่วนอสูรเป็นอาวุธและอุปกรณ์พิเศษ','หลอมอุปกรณ์',{className:'town-forge',cta:'ดูสูตรและวัตถุดิบ'})}
 ${townTile('go','pvp','assets/media/d22b62fc32b6345a4255bd69.webp','PVP · ผู้ผนึกดวลกัน','สร้างห้องหรือเข้าด้วยรหัส ท้าดวลผู้เล่นจริง','ดวลกับเพื่อน',{className:'town-pvp',cta:'สร้างหรือเข้าห้อง'})}
 ${townTile('go','leader',BUILTIN_SCENES[1],'หอเกียรติยศ','ติดตามคะแนนสะสมและอันดับเหล่าผู้ผนึก','กระดานคะแนน',{cta:'ดูอันดับผู้ผนึก'})}
 ${townTile('story','',BUILTIN_SCENES[0],'บันทึกแห่งพันผนึก','อ่านเรื่องราวและบทที่ปลดล็อกจากการผจญภัย','เรื่องราวของโลก',{className:'town-story',cta:'เปิดบันทึก'})}
 </div>${currentStory()}</div>`;}
function vClassTree(){const cur=chain(S.P.cls);return `<div class="stack"><div class="card"><h3>แนะนำสายอาชีพ</h3><p class="sub">อ่านทั้งข้อดีและข้อควรระวัง แล้วเลือกแนวที่เข้ากับทีมของคุณ · สาขาที่เลื่อนแล้วจะเปลี่ยนย้อนกลับไม่ได้ · ข้อมูลนี้อธิบายรูปแบบการเล่น ไม่ใช่อันดับความเก่งใน PVP</p></div><div class="tree career-tree">${BASES.map(b=>`<section class="card stack ${cur[0]===b?'career-path-current':''}"><div class="row">${portrait('cls:'+b,52)}<div><h3>${CLS[b].n}</h3><span class="sub">อาชีพเริ่มต้น · ${WT[CLS[b].w].n}</span></div></div>${careerPanel(b)}${childrenOf(b).map(c=>`<details class="career-branch" ${cur.includes(c)?'open':''}><summary>${portrait('cls:'+c,40)}<span><b>Lv 25 · ${CLS[c].n}</b><small>${CLS[c].d}</small></span></summary>${careerPanel(c)}<div class="career-final-grid">${childrenOf(c).map(g=>`<div class="career-final ${cur.includes(g)?'career-path-current':''}"><div class="row">${portrait('cls:'+g,42)}<b>Lv 40 · ${CLS[g].n}</b></div><p class="sub">${CLS[g].d}</p>${careerPanel(g)}</div>`).join('')}</div></details>`).join('')}</section>`).join('')}</div></div>`;}
function vShop(){return activityBackdrop('shop','ตลาดช่างตีเหล็ก · เตรียมอุปกรณ์ก่อนออกผจญภัย')+vShopBase();}
function vHospital(){return activityBackdrop('hospital','วิหารขาว · พักฟื้นพลังของคุณและอสูร')+vHospitalBase();}
function vArena(){return activityBackdrop('arena','หอคอยประลองยุทธ · เวทีพิสูจน์ฝีมือ')+vArenaBase();}
function vForge(){return activityBackdrop('shop','โรงหลอมเทพอสูร · หลอมพลังจากการผจญภัย')+vForgeBase();}
function vCamp(){return (CAMP.room?.status==='active'?'':activityBackdrop('camp','ค่ายผู้ผนึก · วางแผนก่อนจู่โจม'))+vCampBase();}
function vPvp(){return (PVP.room?.status==='active'?'':activityBackdrop('pvp','PVP · ประลองกับผู้ผนึกคนอื่น'))+vPvpBase();}

function vStart(){const cl=S.ui.cls||'swordsman',sel=starterSel(),c=CLS[cl];return `<div class="stack">
 ${sceneArt(0,'ตำนานผนึกอสูร')}<p class="sub" style="margin:0">ห้าดินแดน หนึ่งปราสาท และคำสาบานที่ผูกคุณกับอสูรคู่หู</p>${storyCard(0)}<button class="btn seal" data-a="story">อ่านบันทึกแห่งพันผนึก</button>
 <div class="card stack"><h3>ชื่อผู้ผนึก</h3><input type="text" id="nm" maxlength="20" placeholder="เช่น ภูผา" value=""></div>
 <div class="card stack"><h3>เลือกอาชีพที่เหมาะกับคุณ</h3><p class="sub">อ่านข้อดีและข้อควรระวัง แล้วแตะอาชีพที่ต้องการ · ทุกสายมีแนวทางเล่นต่างกัน</p><div class="grid3 class-selection-grid">${BASES.map(k=>`<button class="pick ${cl===k?'on':''}" data-a="clspick" data-v="${k}">${portrait('cls:'+k,58)}<b>${CLS[k].n}</b><small>${WT[CLS[k].w].n}</small><span>${careerLines(k)}</span></button>`).join('')}</div>
  <div class="card" style="background:var(--panel2)"><b>${c.n}</b> <span class="sub">· ${c.d}</span><div class="lines" style="margin:6px 0 0;font-size:13px">${careerPanel(cl)}
  <div class="sub">เลื่อนขั้น Lv 25: ${childrenOf(cl).map(x=>CLS[x].n).join(' / ')} · Lv 40: ${childrenOf(cl).flatMap(childrenOf).map(x=>CLS[x].n).join(' / ')}</div></div></div></div>
 <div class="card stack"><h3>${clsSum(cl)>1?'อสูรคู่หูเริ่มต้น เลือกได้ 2 ตัว':'อสูรคู่หูตัวแรก'}</h3><div class="grid3">${STARTERS.map(k=>`<button class="pick ${sel.includes(k)?'on':''}" data-a="starterpick" data-v="${k}">${portrait(k,48)}<b>${SP[k].n}</b><small>${SP[k].o}</small><span class="row wrap" style="gap:3px;justify-content:center">${tChips(SP[k].t)}</span></button>`).join('')}</div></div>
 <button class="btn pri full" data-a="newgame">เริ่มการเดินทาง</button>${soundPanel()}${CLOUD.info?vCloud():''}${vระบบออนไลน์Save(true)}${vBackup(true)}</div>`}
function miniStatus(){const P=S.P,s=pStats();return `<div class="card mini">
 <div class="row">${portrait('player',36)}<div class="grow"><div class="row"><b class="grow"><span data-user-content>${esc(P.name)}</span></b><span class="num sub">${P.hp}/${s.hp}</span></div>${bar(P.hp,s.hp)}</div></div>
 ${party().map(p=>{const q=calcPet(p);return `<div class="row">${portrait(p.sp,30,{form:p.form||0})}<div class="grow"><div class="row"><span class="grow" style="font-size:13px">${petName(p)}</span><span class="num sub">${p.hp<=0?'หมดสติ':p.hp+'/'+q.hp}</span></div>${bar(Math.max(0,p.hp),q.hp)}</div></div>`}).join('')}</div>`}
function vShopBase(){const P=S.P,tab=S.ui.shop||'wp',tier=S.ui.tier??0,mw=clsWeapon(P.cls);
 const row=(id,it,extra='')=>{const lock=it.lv&&P.lv<it.lv,pr=priceOf(it);return `<div class="item">${itemIcon(id)}<div class="grow"><b>${it.n}</b>${it.el?' '+elChip(it.el):''}<small>${it.st?compareGear(it):it.d}${it.st?itemExtra(it):''}${it.lv>1?` · ต้องการ Lv ${it.lv}`:''}${extra}</small></div>
  <button class="btn sm ${lock?'':'pri'}" data-a="buy" data-v="${id}" ${P.gold<pr?'disabled':''}><span class="num">${fmt(pr)}</span></button></div>`};
 let body='';
 if(tab==='wp')body=Object.entries(EQ).filter(([,w])=>w.slot==='weapon'&&!w.worldLegend&&(w.wt===mw||S.ui.allw)).map(([id,w])=>row(id,w,w.wt!==mw?` · ${WT[w.wt].n} (อาชีพอื่น)`:'')).join('')+`<button class="btn sm" data-a="shoptab" data-v="wpall">${S.ui.allw?`แสดงเฉพาะ${WT[mw].n}`:'ดูอาวุธของอาชีพอื่น'}</button>`;
 if(tab==='gear')body=`<div class="tabs">${TIERS.map((t,i)=>`<button class="${tier===i?'on':''}" data-a="tier" data-v="${i}">${t[0]} · Lv ${t[1]}</button>`).join('')}</div>`+Object.entries(EQ).filter(([,g])=>!g.worldLegend&&!g.special&&g.slot!=='weapon'&&g.tier===tier).map(([id,g])=>row(id,g)).join('');
 if(tab==='sp')body=`<p class="sub" style="margin:0">อุปกรณ์ที่มีความสามารถพิเศษหรือสกิลติดมา หาได้จากหีบอเมทิสต์และหีบทองคำด้วย</p>`+Object.entries(SG).map(([id,g])=>row(id,EQ[id],` · ${SLOTN[g.slot]}`)).join('');
 if(tab==='con')body=Object.entries(CON).filter(([,c])=>!c.rareLoot).sort(compareShopItems).map(([id,c])=>row(id,c,` · มีอยู่ ${P.items[id]||0}`)).join('');
 if(tab==='sell'){const parts=Object.entries(P.parts).filter(([,n])=>n>0);
  body=`<h3>ชิ้นส่วนอสูร${isMerchant()?' <span class="chip" style="color:var(--gold)">พ่อค้า +20%</span>':''}</h3>`+(parts.length?parts.map(([key,n])=>{const [sp,i]=key.split('|'),pt=SP[sp].parts[+i];return `<div class="item">${itemIcon(key,36)}<div class="grow"><b>${pt[0]}</b><small>×${n} · ชิ้นละ ${fmt(partPrice(pt[1]))} เหรียญ</small></div><button class="btn sm" data-a="sellpart" data-v="${key}">ขาย 1</button><button class="btn sm pri" data-a="sellpart" data-v="${key}~all">ขายหมด</button></div>`}).join(''):`<p class="sub">ยังไม่มีชิ้นส่วน ล้มอสูรในป่าแล้วจะได้ชิ้นส่วนมาขาย</p>`)
   +`<h3>อุปกรณ์ในกระเป๋า</h3>`+(P.owned.length?P.owned.map(id=>`<div class="item">${itemIcon(id)}<div class="grow"><b>${itemName(EQ[id])}</b><small>${statLine(EQ[id].st)}${itemExtra(EQ[id])}</small></div><button class="btn sm" data-a="sellgear" data-v="${id}">ขาย <span class="num">${fmt(EQ[id].price/2)}</span></button></div>`).join(''):`<p class="sub">ไม่มีอุปกรณ์ที่ไม่ได้สวมใส่</p>`)}
 return `<div class="stack"><div class="row"><h2 class="grow">ตลาดช่างตีเหล็ก</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>
 ${isMerchant()?'<p class="sub" style="margin:0">ส่วนลดพ่อค้า 15% คิดในราคาแล้ว</p>':''}
 <div class="tabs">${[['wp','อาวุธ'],['gear','ชุดเกราะ'],['sp','ของพิเศษ'],['con','ยาและผนึก'],['sell','รับซื้อ']].map(([k,n])=>`<button class="${tab===k?'on':''}" data-a="shoptab" data-v="${k}">${n}</button>`).join('')}</div>
 <div class="lst">${body}</div></div>`}
function vHospitalBase(){const P=S.P,s=pStats();return `<div class="stack"><div class="row"><h2 class="grow">โรงพยาบาลวิหารขาว</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>
 <p class="sub">หมอประจำวิหารรักษาทั้งผู้ผนึกและอสูรทุกตัวในผนึก รวมถึงตัวที่หมดสติ</p>
 ${allFull()?'<button class="btn full" disabled>ทุกคนพลังเต็มอยู่แล้ว</button>':`<button class="btn pri full" data-a="heal">รักษาทั้งหมด · <span class="num">${fmt(healCost())}</span> เหรียญ</button>`}${P.gold<healCost()?`<p class="sub" style="margin:0">เงินไม่พอ วิหารให้ติดหนี้ได้ เงินจะติดลบจนกว่าจะหามาใช้คืน (ระหว่างติดหนี้ซื้อของไม่ได้)</p>`:''}
 <div class="lst"><div class="item">${portrait('player',40)}<div class="grow"><b><span data-user-content>${esc(P.name)}</span></b>${bar(P.hp,s.hp)}<small class="num">HP ${P.hp}/${s.hp} · MP ${P.mp}/${s.mp}</small></div></div>
 ${P.pets.map(p=>{const q=calcPet(p);return `<div class="item">${portrait(p.sp,40)}<div class="grow"><b>${petName(p)} <span class="sub num">Lv ${p.lv}</span></b>${bar(Math.max(0,p.hp),q.hp)}<small class="num">${p.hp<=0?'หมดสติ':`HP ${p.hp}/${q.hp}`}</small></div></div>`}).join('')}</div>
 </div>`}
function vArenaBase(){const P=S.P;return `<div class="stack"><div class="row"><h2 class="grow">หอคอยประลองยุทธ</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>
 <p class="sub">ผู้ผนึก ${NPC.length} คน ครบทุกอาชีพ ตั้งแต่ Lv 3–60 พร้อมอสูร ชนะครั้งแรกได้รางวัลเต็ม ครั้งต่อไปได้ 30%</p>${miniStatus()}
 <div class="lst">${NPC.map((n,i)=>({n,i})).sort((a,b)=>a.n.lv-b.n.lv).map(({n,i})=>{const w=P.arena[i];return `<div class="item">${portrait('npc:'+n.cls,44)}<div class="grow"><b>${n.n}</b><small>Lv ${n.lv} · ${CLS[n.cls].n} · อสูร ${n.pets.map(([s,l])=>`${formName(s,formFor(s,l))} Lv ${l}`).join(', ')}<br>รางวัล <span class="num">${fmt(w?n.gold*.3:n.gold)}</span> เหรียญ${w?` · ชนะแล้ว ${w} ครั้ง`:''}</small></div><button class="btn sm ${P.lv+3>=n.lv?'pri':''}" data-a="arena" data-v="${i}">ท้าประลอง</button></div>`}).join('')}</div></div>`}

function vZone(){const zs=S.zone,z={...ZN[zs.id-1],boss:zs.boss||ZN[zs.id-1].boss},P=S.P;let main='';
 if(zs.ev){const ev=zs.ev,e=EV[ev.type]||{n:'หีบสมบัติ',g:'寶'};let extra='',contLbl='เดินลึกเข้าไปต่อ';
  if(ev.type==='chest'){const c=CHESTS[ev.chest];
   extra=`<div class="chest ${ev.opened?'open':''}" style="--cc:${c.c}"></div><div style="text-align:center"><b style="color:${c.c}">${c.n}</b><div class="sub">${c.d}</div></div>
   ${ev.opened?`<div class="card" style="background:var(--panel2)"><b>ได้รับ</b><div class="lines" style="margin:4px 0 0">${ev.got.map(x=>`<div>${x}</div>`).join('')}</div></div>`:`<button class="btn pri full" data-a="openchest">เปิดหีบ</button>`}`;
   if(!ev.opened)contLbl='เดินผ่านไป ไม่เปิด'}
  if(ev.type==='village'){const parts=Object.entries(P.parts).filter(([,n])=>n>0);
   extra=`<div class="lst">${Object.entries(CON).filter(([,c])=>!c.rareLoot).sort(compareShopItems).map(([id,c])=>{const pr=Math.round(priceOf(c)*1.25),lock=c.lv&&P.lv<c.lv;return `<div class="item">${itemIcon(id)}<div class="grow"><b>${c.n}</b><small>${c.d} · มีอยู่ ${P.items[id]||0}${c.lv>1?` · ต้องการ Lv ${c.lv}`:''}</small></div><button class="btn sm ${lock?'':'pri'}" data-a="vbuy" data-v="${id}" ${P.gold<pr||lock?'disabled':''}><span class="num">${fmt(pr)}</span></button></div>`}).join('')}</div>
   `;}
  if(ev.type==='hospital')extra=ev.healed?'<p class="sub" style="margin:0">ทุกคนหายดีแล้ว</p>':allFull()?'<button class="btn full" disabled>ทุกคนพลังเต็มอยู่แล้ว</button>':`<button class="btn pri full" data-a="zheal">รักษาทั้งทีม · <span class="num">${fmt(Math.round(healCost()*1.5))}</span> เหรียญ</button>`;
  if(ev.type==='exit')extra=`<button class="btn pri full" data-a="exitzone">กลับเมือง</button>`;
  main=`<div class="card stack">${routePicture(ev.type,false,true)}<div class="row"><span class="door-g">${e.g}</span><div class="grow"><h3>${e.n}</h3></div></div><p style="margin:0">${ev.msg}</p>${extra}</div>
  <button class="btn ${ev.type==='chest'&&!ev.opened?'':'pri'} full" data-a="cont" style="min-height:50px">${contLbl}</button>`}
 else if(!zs.fork){main=`<div class="card stack" style="border-color:var(--bad)"><img class="boss-gate-art" src="assets/ui/boss-gates/gate-${z.id}.webp" alt="ประตูห้องบอส ${z.n}" width="480" height="320"><div class="row"><span class="door-g" style="color:var(--bad)">王</span><div class="grow"><h3>รังของ${z.boss.n}</h3><div class="sub">บอส Lv ${z.boss.lv} · ${tChips(SP[z.boss.sp].t)}${z.mini?` · มีสมุน ${z.mini} ตัว`:''} · หนีไม่ได้</div><small class="sub">ออร่าบอส: HP เพิ่มจากฐานบอส 15% · โจมตี +20% · ป้องกัน/MP +15% · เร็ว +10% · ผนึกแล้วออร่าหาย</small></div></div>
  <p class="sub" style="margin:0">ทางสิ้นสุดตรงนี้ ชนะบอสเพื่อกลับเมืองและปลดล็อกพื้นที่ถัดไป ถ้าต้องการใช้ยา เปิดกระเป๋าก่อนได้</p>
  <div class="row"><button class="btn" data-a="go" data-v="bag">กระเป๋า</button><button class="btn danger grow" data-a="boss">เข้าสู้บอส</button></div></div>`}
 else main=`<p class="sub" style="margin:0">ทางแยกข้างหน้า เลือกทางที่จะเดินต่อ</p><div class="grid2">${zs.fork.map((d,i)=>{const e=d.h?{g:'?',n:'ทางมืด',d:'มืดจนมองไม่เห็นว่ามีอะไรรออยู่'}:EV[d.k];return `<button class="door ${d.h?'hid':''}" data-a="fork" data-v="${i}">${routePicture(d.k,d.h)}<span class="sub">ทาง${i?'ขวา':'ซ้าย'}</span><span class="door-g">${e.g}</span><b>${e.n}</b><small>${e.d}</small></button>`}).join('')}</div>`;
 return `<div class="stack">${zoneArt(z.id)}${z.train?'<div class="card story-card"><p>ก่อนออกเดินทาง ธาราเทพแนะนำให้ฝึกในป่าเล็กหลังเมือง เรียนรู้จังหวะต่อสู้และดูแลคู่หูของคุณ</p></div>':storyCard(z.id)}<button class="btn sm seal" data-a="story">อ่านบันทึกการเดินทาง</button><div><h2>${z.n}</h2><span class="sub">อสูร Lv ${z.lv[0]}–${z.lv[1]} · ออกได้เมื่อชนะบอส เจอทางออก หรือพ่ายแพ้</span></div>
 <div class="card stack" style="gap:6px"><div class="row"><span class="grow sub">ความลึก</span><span class="num">${Math.min(zs.depth,ZDEPTH)}/${ZDEPTH}</span></div><div class="steps">${Array.from({length:ZDEPTH+1},(_,i)=>`<i class="${i<zs.depth?'done':i===zs.depth?'now':''} ${i===ZDEPTH?'boss':''}"></i>`).join('')}</div></div>
 ${miniStatus()}${main}<div class="log">${zs.log.map(l=>`<p>${l}</p>`).join('')}</div></div>`}
function ucard(u,i){const b=B(),fx=b.fx.filter(f=>f.id===u.id).map(f=>`<span class="fx ${f.c}">${f.t}</span>`).join(''),foe=u.side==='enemy';
 const sts=Object.keys(u.status).map(k=>`<span class="chip stchip" style="color:${STS[k].c}">${STS[k].n}</span>`).join('');
 const bs={};u.buffs.forEach(x=>{if(x.st)bs[x.st]=(bs[x.st]||0)+x.amt});
 const bf=Object.entries(bs).filter(([,v])=>v).map(([k,v])=>`<span class="chip stchip" style="color:var(--${v>0?'good':'bad'})">${SH[k]}${v>0?'↑':'↓'}</span>`).join('')+(u.taunt>0?'<span class="chip stchip" style="color:var(--gold)">ยั่วยุ</span>':'')+(u.charging?'<span class="chip stchip" style="color:var(--mp)">กำลังชาร์จ</span>':'')+(u.charge>1?`<span class="chip stchip" style="color:var(--mp)">พลัง×${u.charge}</span>`:'')+(u.form?`<span class="chip stchip" style="color:var(--seal)">${FORMS[u.form].n}</span>`:'');
 const sel=foe?(i===b.target&&u.hp>0&&!b.over?'tg':''):(i===b.atarget&&!b.over&&b.allies.length>1?'at':'');
 return `<button data-u="${u.id}" class="ucard ${foe?'foe':'ally'} ${sel} ${b.cur===u.id&&!b.over?'turn':''} ${u.hp<=0?'down':''}" data-a="bt" data-v="${foe?'target':'ally'}:${i}">
 ${portrait(u.img,foe?44:38,{form:u.evo||0})}<div class="grow"><span class="nm" ${u.kind==='player'?'data-user-content':''}>${esc(u.name)}</span><span class="meta"><span class="num">Lv ${u.lv}</span>${tChips(u.types)}${u.captured?'<span class="chip" style="color:var(--seal)">ถูกผนึก</span>':''}</span>
 ${(u.dots||[]).map(d=>`<small>${esc(d.n)} ${d.turns} เทิร์น</small>`).join('')}${u.taunt?`<small>ยั่วยุ ${u.taunt} เทิร์น</small>`:''}${u.immune?`<small>กัน${u.immune==='p'?'กายภาพ':'เวท'} 100%</small>`:''}${sts||bf?`<span class="meta">${sts}${bf}</span>`:''}
 ${bar(u.hp,u.st.hp)}<span class="meta num">HP ${u.hp}/${u.st.hp}${foe?' · '+scoreValue(u)+' คะแนน':` · MP ${u.mp}`} </span>${foe?'':bar(u.mp,u.st.mp,'mp')}</div>${fx}</button>`}
function vBattle(){const b=B(),u=uById(b.cur),P=S.P;
 const order=b.over?'':`<div class="order"><span class="grow">ลำดับตา: ${[b.cur,...b.queue].map(q=>[uById(q.replace('*','')),q.endsWith('*')]).filter(([x])=>x&&x.hp>0).slice(0,9).map(([x,e],i)=>`<span class="${i===0?'now':''}"><span ${x.kind==='player'?'data-user-content':''}>${esc(x.name.replace('★ ','').split(' ')[0])}</span>${e?' ×2':''}</span>`).join('')}</span>${b.allies.length>1?`<button class="btn sm" style="min-height:26px;padding:2px 8px;font-size:11px" data-a="bt" data-v="auto:1">อสูรออโต้ ${S.ui.autoPet?'เปิด':'ปิด'}</button>`:''}</div>`;
 let panel='';
 if(b.over){panel=(b.over.res==='win'&&b.kind==='boss'&&!ZN[b.meta-1].train?storyCard(b.meta,true):'')+`<div class="panel res"><h2 style="${b.over.res==='lose'?'color:var(--bad)':''}">${b.over.title}</h2><div class="lines">${b.over.lines.map(l=>`<div>${l}</div>`).join('')}</div><button class="btn pri full" data-a="bt" data-v="done">ไปต่อ</button></div>`}
 else if(b.menu==='wait'||!u||u.side==='enemy'){panel=`<div class="panel"><p class="sub" style="margin:0;text-align:center">${u?`${esc(u.name)} กำลังเคลื่อนไหว...`:'...'}</p></div>`}
 else{const t=curTarget(),al=curAlly(),head=`<div class="row wrap" style="gap:4px 10px"><b class="grow">ตาของ ${esc(u.name)}</b><span class="sub">เป้า: ${t?esc(t.name):'-'}${t?` · โดน ${Math.round(hitChance(u,t))}%`:''}${b.allies.length>1?` · ฝ่ายเรา: ${esc(al.name)}`:''}</span></div>`,back=`<button class="btn" data-a="bt" data-v="menu:main">ย้อนกลับ</button>`;
  const skBtn=id=>{const s=SK[id],off=['p','m','h','auto','status','debuff'].includes(s.t),m=off&&t&&!s.all?typeMult(effectiveElement(u,s),t.types):1,stab=s.el&&(u.stab.includes(s.el)||u.types.includes(s.el));
   const c=costOf(u,s),cd=cooldownOf(u,id),dis=cd>0||(c&&u.mp<c)||(s.gc&&P.gold<s.gc*u.lv);
   return `<button class="btn ${['heal','buff','form'].includes(s.t)?'seal':''}" data-a="bt" data-v="sk:${id}" ${dis?'disabled':''}>${skillElementIcon(u,s,id)}<span class="skill-name">${s.n}</span><small>${cd?'รอ '+cd+' เทิร์น · ':''}${c?c+' MP':'—'}${s.gc?' · '+fmt(s.gc*u.lv)+'฿':''} · ${skTag(s)}${stab?'★':''} ${multTxt(m)}</small></button>`};
  if(u.kind==='pet'||u.kind==='summon')panel=`<div class="panel">${head}<div class="acts">${u.skills.map(skBtn).join('')}${skBtn('rest')}</div><p class="sub" style="margin:0">แตะการ์ดศัตรูเพื่อเลือกเป้า · ×2 ได้ผลดี ×½ ไม่ค่อยได้ผล · ★ ธาตุเดียวกับผู้ใช้ +25%</p></div>`;
  else if(b.menu==='skill')panel=`<div class="panel">${head}<div class="acts">${u.skills.filter(s=>s!=='attack').map(skBtn).join('')}${skBtn('rest')}${back}</div><p class="sub" style="margin:0">สกิล "เลือกฝ่ายเรา" ใช้กับการ์ดฝ่ายเราที่เลือกไว้ (แตะเพื่อเปลี่ยน)</p></div>`;
  else if(b.menu==='item'){const its=Object.keys(CON).filter(k=>!CON[k].seal&&!CON[k].petExp&&P.items[k]>0);
   panel=`<div class="panel">${head}<p class="sub" style="margin:0">ใช้กับ: <b>${esc(al.name)}</b> — แตะการ์ดฝ่ายเราเพื่อเปลี่ยน</p><div class="lst">${its.length?its.map(k=>`<div class="item">${itemIcon(k)}<div class="grow"><b>${CON[k].n} ×${P.items[k]}</b><small>${CON[k].d}</small></div><button class="btn sm" data-a="bt" data-v="item:${k}" ${potionUseful(CON[k],al,al.st)?'':'disabled'}>ใช้</button></div>`).join(''):'<p class="sub">ไม่มียาในกระเป๋า</p>'}</div>${back}</div>`}
  else if(b.menu==='seal'){const its=Object.keys(CON).filter(k=>CON[k].seal&&P.items[k]>0);panel=`<div class="panel">${head}<p class="sub" style="margin:0">HP เป้าหมายยิ่งน้อยยิ่งผนึกง่าย ถ้าเป้าหมายหลับ แช่แข็ง หรืออัมพาต ผนึกง่ายขึ้นอีก 50%</p><div class="lst">${its.length?its.map(k=>`<div class="item">${itemIcon(k)}<div class="grow"><b>${CON[k].n} ×${P.items[k]}</b><small>โอกาสสำเร็จประมาณ <span class="num">${Math.round(sealChance(t,CON[k].seal)*100)}%</span></small></div><button class="btn sm seal" data-a="bt" data-v="seal:${k}" ${sealable(t)?'':'disabled'}>ขว้าง</button></div>`).join(''):'<p class="sub">ไม่มีผนึกเหลือ</p>'}</div>${back}</div>`}
  else if(b.menu==='swap'){const inF=b.allies.slice(1).map(x=>x.uid),ps=carriedPets().filter(p=>!inF.includes(p.uid)&&p.hp>0);
   panel=`<div class="panel">${head}<p class="sub" style="margin:0">${b.allies.length-1<clsSum(P.cls)?'มีช่องว่าง อสูรที่เลือกจะลงสนามเพิ่ม':`จะสลับกับ ${b.allies[b.atarget]&&b.allies[b.atarget].kind==='pet'?esc(b.allies[b.atarget].name):esc(b.allies[1]?b.allies[1].name:'-')} (แตะการ์ดอสูรฝ่ายเราเพื่อเลือก)`}</p><div class="lst">${ps.length?ps.map(p=>{const q=calcPet(p);return `<div class="item">${portrait(p.sp,36)}<div class="grow"><b>${petName(p)} <span class="num sub">Lv ${p.lv}</span></b><span class="row wrap" style="gap:3px">${tChips(SP[p.sp].t)}</span>${bar(p.hp,q.hp)}</div><button class="btn sm pri" data-a="bt" data-v="swap:${p.uid}">เรียก</button></div>`}).join(''):'<p class="sub">ไม่มีอสูรตัวอื่นที่พร้อมสู้</p>'}</div>${back}</div>`}
  else{const canSeal=b.enemies.some(sealable),canFlee=['wild','bandit','traveler'].includes(b.kind);
   panel=`<div class="panel">${head}<div class="acts">${skBtn('attack')}<button class="btn" data-a="bt" data-v="menu:skill">สกิล<small>${u.skills.length-1} ท่า</small></button><button class="btn" data-a="bt" data-v="menu:item">ไอเทม<small>ยา · แก้สถานะ</small></button>
   <button class="btn seal" data-a="bt" data-v="menu:seal" ${canSeal?'':'disabled'}>ผนึก<small>จับอสูร</small></button><button class="btn" data-a="bt" data-v="menu:swap">เรียกอสูร<small>ไม่เสียเทิร์น</small></button><button class="btn" data-a="bt" data-v="flee" ${canFlee?'':'disabled'}>หนี<small>${canFlee?'ลุ้นความเร็ว':'หนีไม่ได้'}</small></button></div></div>`}}
 return `<div class="field battle-enhanced"><div class="battle-toolbar"><b>⚔ เทิร์น ${b.round}</b>${!b.over&&teamAutoAllowed()?`<button class="btn sm ${S.ui.autoTeam?'pri':''}" data-a="teamAuto" aria-pressed="${!!S.ui.autoTeam}">ออโต้ทั้งทีม ${S.ui.autoTeam?'เปิด':'ปิด'}</button>`:''}<small>ออโต้เลือกสกิล · ไม่ใช้ยา/ผนึก · กดปิดเพื่อควบคุมเอง</small></div>${order}<div class="side" style="--n:${Math.min(2,b.enemies.length)}">${b.enemies.map((e,i)=>ucard(e,i)).join('')}</div>
 <div class="log" id="blog">${b.log.slice(-14).map(l=>`<p>${l}</p>`).join('')}</div>
 <div class="side" style="--n:${Math.min(2,b.allies.length)}">${b.allies.map((a,i)=>ucard(a,i)).join('')}</div>${panel}</div>`}
function statGrid(s,free,act,uid){return `<div class="statgrid">${K.map(k=>`<span>${LBL[k]}</span><span class="num">${s[k]}</span>${free>0?`<button class="btn sm" style="min-height:28px;padding:2px 10px" data-a="${act}" data-v="${uid!=null?uid+':':''}${k}" aria-label="เพิ่ม ${LBL[k]}">+${PER[k]}</button>`:'<span></span>'}`).join('')}</div>`}
function skillRow(id,on=true,lvTxt){const k=SK[id];return `<div class="row" style="${on?'':'opacity:.45'}"><div class="grow"><b>${k.n}</b> ${skillElementIcon(null,k,id)} <span class="chip" style="color:var(--muted)">${skTag(k)}</span>${k.mile?' <span class="chip" style="color:var(--gold)">สกิลพิเศษ</span>':''}<div class="sub" style="font-size:12px">${skillDesc(id)}</div></div>${lvTxt?`<span class="sub num" style="white-space:nowrap">${lvTxt}</span>`:''}</div>`}
function vLegendBase(){const P=S.P,L=P.legend||{},n=Object.keys(L).length;return `<div class="card stack"><div class="row"><h3 class="grow">ของในตำนาน</h3><span class="num sub">${n}/${ZN.filter(z=>!z.train).length*SLOTS.length+16}</span></div>
 <p class="sub" style="margin:0">แต่ละแผนที่มีของในตำนานครบทุกช่องสวมใส่ ช่องละ 1 ชิ้น หาได้จากหีบโบราณแห่งตำนาน หีบทองคำ หีบโลหิต และนักเดินทางปริศนาเท่านั้น</p>
 ${ZN.filter(z=>!z.train).map(z=>`<div><b style="font-size:13px">${z.n}</b> <span class="sub">${SLOTS.filter(([sl])=>L[z.id+'_'+sl]).length}/${SLOTS.length}</span><div class="sub" style="font-size:12px;line-height:1.7">${SLOTS.map(([sl,nm])=>{const it=EQ[sl==='weapon'?`lg${z.id}_weapon_${clsWeapon(P.cls)}`:`lg${z.id}_${sl}`];return L[z.id+'_'+sl]?`<span class="lgn">${it.n}</span> <span>(${PAS[it.pas].n}${it.sk?' · '+SK[it.sk].n:''}${it.ws?' · '+SK[it.ws].n:''})</span>`:`<span>${nm}: ???</span>`}).join('<br>')}</div></div>`).join('')}</div>`}
const craftId=k=>CRAFT[k].sl==='weapon'?`cf_${k}_${clsWeapon(S.P.cls)}`:`cf_${k}`;
const canCraft=k=>{const c=CRAFT[k],P=S.P;return P.gold>=c.gold&&c.mats.every(([m,n])=>(P.parts[m]||0)>=n)};
function vForgeBase(){const P=S.P,zi=S.ui.forge??0,z=ZN[zi],ks=[...z.sp,...z.rare].filter(k=>CRAFT[k]&&CRAFT[k].zi===zi);
 return `<div class="stack"><div class="row"><h2 class="grow">โรงหลอมเทพอสูร</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>
 <p class="sub" style="margin:0">ใช้ชิ้นส่วนอสูรหลอมอุปกรณ์ที่ได้ความสามารถติดตัวและสกิลของอสูรตัวนั้น พลังใกล้เคียงของในตำนาน หลอมซ้ำได้ อาวุธจะออกเป็นอาวุธประเภทของอาชีพคุณ</p>
 <div class="tabs">${ZN.filter(x=>!x.final&&!x.train).map((x,i)=>`<button class="${zi===i?'on':''}" data-a="forgetab" data-v="${i}">${x.n}</button>`).join('')}</div>
 <div class="lst">${ks.map(k=>{const c=CRAFT[k],s=SP[k];if(!P.seen[k])return `<div class="item">${portrait(k,40,{unk:1})}<div class="grow"><b>???</b><small>พบอสูรตัวนี้ก่อนเพื่อดูสูตร</small></div></div>`;
  const it=EQ[craftId(k)],ok=canCraft(k);
  return `<div class="item" style="align-items:flex-start">${WEAPON_ART[craftId(k)]?itemIcon(craftId(k),52):portrait(k,40)}<div class="grow"><b>${it.n}</b>${WEAPON_ART[craftId(k)]?` <span class="weapon-rarity-label weapon-label-crafted" translate="no">${weaponRarityLabel(it)}</span>`:''} <span class="sub">${SLOTN[it.slot]}</span> ${elChip(it.el)}<small>${statLine(it.st)} · ต้องการ Lv ${it.lv}<br>ความสามารถ: <b>${PAS[it.pas].n}</b> — ${PAS[it.pas].d}<br>สกิล: <b>${SK[it.ws||it.sk].n}</b> — ${skillDesc(it.ws||it.sk)}<br>
  วัตถุดิบ: ${c.mats.map(([m,n])=>{const [sp,i]=m.split('|'),have=P.parts[m]||0;return `<span style="color:var(--${have>=n?'good':'bad'})">${SP[sp].parts[+i][0]} ${have}/${n}</span>`}).join(' · ')} · <span style="color:var(--${P.gold>=c.gold?'good':'bad'})">${fmt(c.gold)} เหรียญ</span></small></div>
  <button class="btn sm ${ok?'pri':''}" data-a="craft" data-v="${k}" ${ok?'':'disabled'}>หลอม</button></div>`}).join('')}</div></div>`}
function vHero(){const P=S.P,s=pStats(),tab=S.ui.hero||'stat',w=EQ[P.eq.weapon],ch=chain(P.cls);
 const tabs=`<div class="tabs">${[['stat','สถานะ'],['skill','สกิล'],['gear','อุปกรณ์']].map(([k,n])=>`<button class="${tab===k?'on':''}" data-a="herotab" data-v="${k}">${n}</button>`).join('')}</div>`;
 const head=`<div class="card row">${portrait('player',68)}<div class="grow"><h2><span data-user-content>${esc(P.name)}</span></h2><div class="sub">${ch.map(c=>CLS[c].n).join(' → ')} · โบนัสแต้ม ${focusFor(P.cls).map(k=>LBL[k]).join(" / ")} +${Math.round(focusBonus(P.cls,focusFor(P.cls)[0])*100)}% · <span class="num">Lv ${P.lv}</span></div>${bar(P.lv>=MAXLV?1:P.exp,P.lv>=MAXLV?1:need(P.lv),'xp')}<div class="sub num">${P.lv>=MAXLV?'เลเวลสูงสุด':`EXP ${fmt(P.exp)}/${fmt(need(P.lv))}`}${P.cleared?' · 🏆 ผู้ปราบจอมมาร':''} · อสูรออกสู้ได้ ${clsSum(P.cls)} ตัว</div>
  <div class="row wrap" style="gap:6px;margin-top:6px"><button class="btn sm" data-a="img" data-v="player">ใส่รูปตัวละคร</button>${IMG.player?'<button class="btn sm" data-a="delimg" data-v="player">ลบรูป</button>':''}</div></div></div>`;
 const promo=canPromote(P)?`<div class="card stack" style="border-color:var(--gold)"><h3>เลื่อนอาชีพได้แล้ว!</h3>${childrenOf(P.cls).map(c=>`<div class="item">${portrait('cls:'+c,40)}<div class="grow"><b>${CLS[c].n}</b><small>${CLS[c].d}<br>${careerLines(c)}<br>สกิล: ${CLS[c].sk.map(([l,k])=>`${SK[k].n} (Lv ${l})`).join(', ')}${CLS[c].pas.length?' · ความสามารถ: '+CLS[c].pas.map(k=>PAS[k].n).join(', '):''}${CLS[c].sum?` · อสูรออกสู้ ${CLS[c].sum} ตัว`:''}</small></div><button class="btn sm pri" data-a="promote" data-v="${c}">เลือก</button></div>`).join('')}</div>`:'';
 let body='';
 if(tab==='stat')body=`<div class="card stack"><div class="row"><h3 class="grow">ค่าสถานะ</h3>${P.free>0?`<span class="badge">แต้มเหลือ ${P.free}</span>`:''}</div>
  <div class="row"><span class="grow sub">HP / MP ปัจจุบัน</span><span class="num">${P.hp}/${s.hp} · ${P.mp}/${s.mp}</span></div>
  ${autoStatPanel()}${statGrid(s,P.free,'pt')}<p class="sub" style="margin:0">เลเวลอัปได้ 5 แต้ม ค่าสถานะรวมอาชีพและอุปกรณ์แล้ว · ความแม่นยำหักลบการหลบหลีกของเป้าหมาย = โอกาสโจมตีโดน</p></div>
  <div class="card stack"><h3>ความสามารถติดตัว</h3><div class="row wrap" style="gap:6px">${humanPas(P.cls,P.eq).map(k=>`<span class="chip pas">${PAS[k].n}</span>`).join('')||'<span class="sub">ไม่มี</span>'}</div>${[...new Set(humanPas(P.cls,P.eq))].map(k=>`<div class="sub" style="font-size:12px"><b>${PAS[k].n}</b> — ${PAS[k].d}</div>`).join('')}</div>`;
 if(tab==='skill'){const learn=ch.flatMap(c=>CLS[c].sk.map(([l,k])=>[l,k,c]));
  body=`<div class="card stack"><h3>สกิลอาชีพ (เรียนตามเลเวล)</h3>${learn.map(([l,k,c])=>skillRow(k,P.lv>=l,`${CLS[c].n} Lv ${l}`)).join('')}</div>
  <div class="card stack"><h3>สกิลจากอุปกรณ์</h3>${Object.values(P.eq).map(id=>EQ[id]).filter(it=>it&&(it.ws||it.sk)).map(it=>[it.ws,it.sk].filter(Boolean).map(k=>skillRow(k,true,it.n)).join('')).join('')||'<p class="sub" style="margin:0">อาวุธระดับ 1 ขึ้นไปและเครื่องประดับพิเศษบางชิ้นมีสกิลติดมา</p>'}</div>
  ${baseOf(P.cls)==='druid'?`<div class="card stack"><h3>ร่างแปลง</h3>${Object.entries(FORMS).map(([k,f])=>`<div><b>${f.em} ${f.n}</b> ${tChips(f.t)}<div class="sub" style="font-size:12px">${Object.entries(f.m).map(([x,v])=>`${SH[x]} ×${v}`).join(' ')} · สกิล ${f.sk.map(x=>SK[x].n).join(', ')}</div></div>`).join('')}</div>`:''}`}
 if(tab==='gear')body=`<div class="card stack"><h3>อุปกรณ์ที่สวมใส่</h3><div class="lst">${SLOTS.map(([sl,n])=>{const it=EQ[P.eq[sl]];return `<div class="row">${it?itemIcon(P.eq[sl],38):''}<span class="sub" style="width:58px;flex:none">${n}</span><div class="grow">${it?`<b>${itemName(it)}</b> ${elChip(it.el)}<div class="sub" style="font-size:12px">${statLine(it.st)}${itemExtra(it)}</div>`:'<span class="sub">ว่าง</span>'}</div>${it&&sl!=='weapon'?`<button class="btn sm" data-a="unequip" data-v="${sl}">ถอด</button>`:''}</div>`}).join('')}</div></div>
 <div class="card stack"><h3>อุปกรณ์ในกระเป๋า</h3>${P.owned.length?`<div class="lst">${P.owned.map(id=>{const it=EQ[id],same=P.eq[it.slot]===id,bad=same||it.lv>P.lv;return `<div class="row">${itemIcon(id)}<div class="grow"><b>${itemName(it)}</b> <span class="sub">${SLOTN[it.slot]}${it.wt?' · '+WT[it.wt].n:''}${it.slot==='weapon'&&it.wt!==clsWeapon(P.cls)?' · ข้ามอาชีพ: ค่าสถานะอาวุธ 80%':''}${same?' · ชิ้นสำรอง รุ่นเดียวกับที่สวม':''}</span><div class="sub" style="font-size:12px">${compareGear(it)}${elementItemExtra(it)}${it.lv>P.lv?` · ต้องการ Lv ${it.lv}`:''}</div></div><button class="btn sm pri" data-a="equip" data-v="${id}" ${bad?'disabled':''}>${same?'สวมรุ่นนี้อยู่':'สวม'}</button></div>`}).join('')}</div>`:'<p class="sub" style="margin:0">ซื้ออุปกรณ์ได้ที่ตลาด หรือเปิดหีบสมบัติในป่า</p>'}</div>`;
 if(tab==='gear')body+=vLegend();
 if(tab==='tree')body=vClassTree();
 return `<div class="stack">${head}<details class="card career-current"><summary>ข้อดีและข้อควรระวัง · ${CLS[P.cls].n}</summary>${careerPanel(P.cls)}</details>${tabs}${advicePanel()}${promo}${body}</div>`}
function vPet(p){const s=calcPet(p),sp=SP[p.sp],inP=S.P.party.includes(p.uid);return `<div class="stack"><button class="btn sm" data-a="petview" data-v="" style="align-self:flex-start">← กลับรายการ</button>
 <div class="card row">${portrait(p.sp,80,{form:p.form||0})}<div class="grow"><h2>${petName(p)}</h2><div class="sub">ตำนาน${sp.o} · <span class="num">Lv ${p.lv}</span>${inP?' <span class="badge">ในทีม</span>':''}${sp.rare?' <span class="chip" style="color:var(--gold)">หายาก</span>':''}</div><div class="row wrap" style="gap:4px;margin:4px 0">${tChips(sp.t)}${pasChip(sp.pas)}</div>${bar(p.exp,need(p.lv),'xp')}<div class="sub num">EXP ${fmt(p.exp)}/${fmt(need(p.lv))}</div></div></div>
 <div class="card stack" style="gap:4px"><h3>ความสามารถติดตัว</h3><div class="sub"><b>${PAS[sp.pas].n}</b> — ${PAS[sp.pas].d}</div></div>
 ${sp.ev?`<div class="card stack" style="gap:4px"><h3>สายพัฒนาร่าง</h3><div class="row wrap" style="gap:12px">${[[0,SP[p.sp].n],...sp.ev.map((e,i)=>[i+1,e[1]])].map(([form,name])=>`<div style="display:flex;flex-direction:column;align-items:center;gap:5px;max-width:100px">${portrait(p.sp,64,{form})}<small class="sub">${esc(name)}</small></div>`).join('')}</div><div class="sub">${[sp.n,...sp.ev.map(e=>e[1])].map((n,i)=>`<span style="${(p.form||0)===i?'color:var(--gold);font-weight:600':''}">${n}${i?` (Lv ${sp.ev[i-1][0]})`:''}</span>`).join(' → ')}</div><div class="sub" style="font-size:12px">พลังรวมจัดตามลำดับร่างและความหายาก โดยรักษาจุดเด่นแต่ละสาย ร่างสุดท้ายได้สกิลเฉพาะตัว</div></div>`:''}
 <div class="card stack"><div class="row"><h3 class="grow">ค่าสถานะ</h3>${p.free>0?`<span class="badge">แต้มเหลือ ${p.free}</span>`:''}</div>
  <div class="row"><span class="grow sub">HP ปัจจุบัน</span><span class="num">${p.hp<=0?'หมดสติ':p.hp+'/'+s.hp}</span></div>${autoStatPanel(p)}${statGrid(s,p.free,'ppt',p.uid)}<p class="sub" style="margin:0">อสูรไม่มีเครื่องสวมใส่ เติบโตด้วยเลเวล ร่างพัฒนา และแต้มสถานะ (เลเวลละ 3 แต้ม)</p></div>
 <div class="card stack"><h3>สกิล</h3>${sp.sk.map((id,i)=>skillRow(id,p.lv>=SKLV[i],p.lv>=SKLV[i]?'':'Lv '+SKLV[i])).join('')}${sp.sig?skillRow(sp.sig,sigLearned(p),sigLearned(p)?'เฉพาะตัว':sp.rare?'Lv '+SIGLV:'ร่างสุดท้าย'):''}</div>
 <div class="row wrap" style="gap:8px"><button class="btn" data-a="${S.P.carried.includes(p.uid)?'petStore':'petCarry'}" data-v="${p.uid}" ${packLocked()?'disabled':''}>${S.P.carried.includes(p.uid)?'พักที่ค่าย':'นำติดตัว'}</button><button class="btn ${inP?'':'pri'}" data-a="partytoggle" data-v="${p.uid}">${inP?'เอาออกจากทีม':'เพิ่มเข้าทีม'}</button><button class="btn" data-a="img" data-v="${p.sp}:${p.form||0}">ใส่รูปร่างนี้</button><button class="btn danger" data-a="release" data-v="${p.uid}">ปล่อยคืนป่า</button></div></div>`}
function vChart(){const ks=Object.keys(EL);return `<p class="sub" style="margin:0">ผลของธาตุท่าโจมตีต่อธาตุของเป้าหมาย อสูร 2 ธาตุคูณผลเข้าด้วยกัน ท่าที่ธาตุตรงกับผู้ใช้แรงขึ้น 25% (ผู้ผนึกได้โบนัสจากธาตุอาวุธ)</p>
 <div class="tchart">${ks.map(a=>{const row=TC[a]||{},g=ks.filter(d=>row[d]===2),h=ks.filter(d=>row[d]===.5),z=ks.filter(d=>row[d]===0);
  return `<div class="item">${elChip(a)}<div class="grow" style="font-size:13px;display:flex;flex-direction:column;gap:3px">
  ${g.length?`<div><span class="eff up">×2</span> ${g.map(elChip).join(' ')}</div>`:''}${h.length?`<div><span class="eff down">×½</span> ${h.map(elChip).join(' ')}</div>`:''}${z.length?`<div><span class="eff zero">×0</span> ${z.map(elChip).join(' ')}</div>`:''}</div></div>`}).join('')}</div>
 <h3>สถานะผิดปกติ</h3><div class="lst">${Object.entries(STS).map(([k,s])=>`<div class="item"><span class="chip" style="color:${s.c}">${s.n}</span><div class="grow" style="font-size:13px">${s.info}${IMM[k]?`<div class="sub" style="font-size:12px">ธาตุ${IMM[k].map(elementIcon).join('')}ไม่ติดสถานะนี้</div>`:''}</div></div>`).join('')}</div>`}
function vTeam(){const P=S.P,tab=S.ui.team||'team';if(S.ui.petView!=null){const p=petBy(S.ui.petView);if(p)return vPet(p)}
 const tabs=`<div class="tabs"><button class="${tab==='team'?'on':''}" data-a="teamtab" data-v="team">จัดทีมและค่าย ${P.pets.length}</button></div>`;
 if(tab==='chart')return `<div class="stack"><h2>ตารางธาตุ</h2>${tabs}${vChart()}</div>`;
  if(tab==='dex')return fullBestiary(tabs);
 return vRoster(tabs)}
function bagVitals(){const P=S.P,s=pStats();const row=(name,hp,mp,st)=>`<div class="card stack"><b>${esc(name)}</b><small>HP ${hp}/${st.hp}</small>${bar(hp,st.hp)}<small>MP ${mp}/${st.mp}</small>${bar(mp,st.mp,'mp')}</div>`;return `<div class="bag-vitals">`+row(P.name,P.hp,P.mp,s)+carriedPets().map(p=>row(petName(p),p.hp,p.mp,calcPet(p))).join('')+'</div>'}
function compareGear(it){const old=EQ[S.P.eq[it.slot]],bonus=x=>Object.fromEntries(Object.entries(x?.st||{}).map(([k,v])=>[k,Math.round(v*(x.slot==='weapon'&&x.wt!==clsWeapon(S.P.cls)?.8:1))])),ns=bonus(it),os=bonus(old);const keys=[...new Set([...Object.keys(it.st||{}),...Object.keys(old?.st||{})])];return keys.map(k=>{const delta=(ns[k]||0)-(os[k]||0);return `<span style="color:${delta>0?'var(--good)':delta<0?'var(--bad)':'#eee'}">${SH[k]} ${ns[k]||0} (${delta>0?'+':''}${delta})</span>`}).join(' · ')}
function vBag(){const P=S.P,its=Object.keys(CON).filter(k=>P.items[k]>0),parts=Object.entries(P.parts).filter(([,n])=>n>0),pp=party();
 return `<div class="stack"><h2>กระเป๋าเดินทาง</h2>${rosterSummary()}${bagVitals()}<div class="card stack"><h3>ยา ยาแก้สถานะ และผนึก</h3>${its.length?`<div class="lst">${its.map(k=>{const c=CON[k];return `<div class="bag-consumable">${itemIcon(k)}<div class="grow bag-item-copy"><b>${c.n} ×${P.items[k]}</b><div class="sub" style="font-size:12px">${c.d}</div></div>${(c.hp||c.mp)?'<span class="sub">ใช้จากกรอบตัวละครด้านบน</span>':c.seal?'<span class="sub">ใช้ในการต่อสู้</span>':`<div class="row wrap bag-item-targets" style="gap:4px">${c.rev||c.petExp?'':`<button class="btn sm" data-a="use" data-v="${k}:P" ${bagPotionDisabled(k,'P')?'disabled aria-disabled="true"':''}>ตัวเอง</button>`}${(c.rev?carriedPets().filter(p=>p.hp<=0):carriedPets()).map(p=>`<button class="btn sm" data-a="use" data-v="${k}:${p.uid}" ${bagPotionDisabled(k,p.uid)?'disabled aria-disabled="true"':''}>${petName(p).slice(0,8)}</button>`).join('')}</div>`}</div>`}).join('')}</div>`:'<p class="sub">ว่างเปล่า</p>'}</div>
 <div class="card stack"><h3>ชิ้นส่วนอสูร</h3>${parts.length?`<div class="lst">${parts.map(([key,n])=>{const [sp,i]=key.split('|');return `<div class="row">${itemIcon(key,32)}<span class="grow">${SP[sp].parts[+i][0]}</span><span class="num">×${n}</span></div>`}).join('')}</div>${S.zone?'':'<button class="btn sm" data-a="go" data-v="shop">ไปขายที่ตลาด</button>'}`:'<p class="sub" style="margin:0">ล้มอสูรในป่าเพื่อเก็บชิ้นส่วนไปขาย</p>'}</div></div>`}

const CAMP={rows:[],used:0,pet:null,busy:false,error:'',room:null,token:'',target:'',friend:'',request:''};
try{const c=JSON.parse(localStorage.getItem('sealbeast_camp_v1')||'{}');if(c.endpoint===SHEET_URL){CAMP.roomId=c.room;CAMP.token=c.token||''}}catch(e){}
function applyAccount(a){if(!a||!S.P)return;const P=S.P;P.gold+=(Number(a.delta)||0)-(Number(P.campApplied)||0);P.campApplied=Number(a.delta)||0;P.score=(P.score||0)+(Number(a.scoreDelta)||0)-(Number(P.campScoreApplied)||0);P.campScoreApplied=Number(a.scoreDelta)||0;if(a.name)P.name=a.name;P.renameAt=a.renameAt||0;worldApply(P,a.world);save()}
async function campCall(action,extra={}){if(CAMP.busy||CAMP.room?.replaying)return;const prior=CAMP.room;CAMP.busy=true;CAMP.error='';render();try{const res=await lbPost({action,code:ensureCode(),pin:S.P.cpin||'',room:CAMP.room?.id||CAMP.roomId,token:CAMP.token,...extra});if(!res.ok)throw Error(res.error);applyAccount(res.account);if(res.camps){CAMP.rows=res.camps;CAMP.used=res.used;CAMP.pet=res.pet;CAMP.pets=res.pets||[];CAMP.guardPicks=null}if(res.room){CAMP.room=res.room;onlineSkillEffects(prior,res.room,'camp');observeUnits([...res.room.battle.allies,...res.room.battle.enemies]);CAMP.roomId=res.room.id;CAMP.token=res.token||CAMP.token;CAMP.request='';localStorage.setItem('sealbeast_camp_v1',JSON.stringify({endpoint:SHEET_URL,room:CAMP.roomId,token:CAMP.token}));if(res.room.status==='finished')Sound.fx(res.room.winner===0?'win':'lose')}if(action==='camp_profile')toast('เปลี่ยนชื่อแล้ว');return res}catch(e){CAMP.error=({'defense required':'ต้องลงทะเบียนอสูรเฝ้าค่ายก่อนจู่โจม','camp daily limit':'ใช้สิทธิจู่โจมครบ 3 ครั้งของวันนี้แล้ว','camp level 10':'ปลดล็อกค่ายที่เลเวล 10','rename weekly':'เปลี่ยนชื่อได้สัปดาห์ละ 1 ครั้ง','choose one pet':'เลือกอสูร 1 ตัวก่อน','pet at camp':'เลือกอสูรที่พกติดตัวสำหรับจู่โจม','pet travelling':'ฝากอสูรไว้ที่ค่ายก่อนตั้งให้เฝ้าค่าย','stale turn':'เทิร์นเปลี่ยนแล้ว กดตรวจข้อมูลใหม่','bad action':'โปรดอัปเดตระบบเซิร์ฟเวอร์เป็นรุ่นใหม่ก่อน'})[e.message]||'ดำเนินการไม่สำเร็จ: '+e.message;toast(CAMP.error)}finally{CAMP.busy=false;render()}}
async function enterCamp(){if(S.P.lv<10){toast('ปลดล็อกค่ายที่เลเวล 10');return}go('camp');await gsSave(true);await campCall('camp_list');if(CAMP.roomId)await campCall('camp_poll')}
function vCampBase(){const P=S.P;let body='';if(CAMP.room&&CAMP.room.status==='active'){const r=CAMP.room,b=r.battle,all=[...b.allies,...b.enemies],u=all.find(x=>x.id===b.cur);const card=(x,friend)=>`<button class="card" data-a="${friend?'campFriend':'campTarget'}" data-v="${x.id}" ${x.hp<=0?'disabled':''}>${portrait(x.img,48,{form:x.evo||0})}<b>${esc(x.name)}</b><small>HP ${x.hp}/${x.st.hp} · MP ${x.mp}/${x.st.mp}</small>${bar(x.hp,x.st.hp)}${x.taunt?'<small>ยั่วยุ '+x.taunt+' เทิร์น</small>':''}</button>`;body=`<div class="row wrap">${b.enemies.map(x=>card(x,false)).join('')}</div><div class="log">${b.log.slice(-12).map(t=>`<p>${esc(t)}</p>`).join('')}</div><div class="row wrap">${b.allies.map(x=>card(x,true)).join('')}</div><p>ตาของ ${esc(u?.name||'')} · ต่อสู้อัตโนมัติ</p><div class="acts"></div><span class="sub">กำลังแสดงการต่อสู้อัตโนมัติ · ผลและรางวัลบันทึกแล้ว</span>`}
 else{const result=CAMP.room?.status==='finished'?`<div class="card"><b>${CAMP.room.winner===0?'จู่โจมสำเร็จ':CAMP.room.winner===-1?'เสมอ':'จู่โจมล้มเหลว'}</b><p>${esc(CAMP.room.reason||'')} · เงินปัจจุบัน ${fmt(P.gold)}</p><button class="btn" data-a="campClear">ปิดผลการต่อสู้</button></div>`:'';body=result+`<p>จัดผู้ผนึกพร้อมอสูรเฝ้าค่าย นักอัญเชิญใช้ได้สูงสุด 3 ตัว: ตัวหลักที่เลือก และเสริมอัตโนมัติจากอสูรที่พักค่าย ระบบควบคุมเมื่อคุณไม่ออนไลน์</p><label>ผู้เฝ้าค่าย (เลือกจากอสูรที่พักค่าย)</label><select id="campPet">${storedPets().map(p=>`<option value="${p.uid}" ${CAMP.pet===p.uid?'selected':''}>${esc(petName(p))} Lv ${p.lv}</option>`).join('')}</select><button class="btn" data-a="campRegister">ตั้งอสูรเฝ้าค่าย</button><label>อสูรสำหรับจู่โจม (เลือกจากที่พก)</label><select id="campAttackPet">${carriedPets().map(p=>`<option value="${p.uid}">${esc(petName(p))} Lv ${p.lv}</option>`).join('')}</select><p>ผู้จู่โจมใช้อสูรตัวหลักที่เลือก นักอัญเชิญเสริมจากอสูรที่พกได้สูงสุด 3 ตัว ห้ามสลับ ห้ามไอเท็ม ห้ามผนึก · สิทธิ์วันนี้ ${CAMP.used}/3 (เริ่มวันใหม่เวลาไทย)</p><p>ฝ่ายแพ้เสียเงินปัจจุบัน 20% ให้ฝ่ายชนะ ระบบคำนวณผลและบันทึกรางวัลก่อนแสดงการต่อสู้ เจ้าของค่ายไม่ต้องออนไลน์</p><div class="lst">${CAMP.rows.map(c=>`<div class="item"><div class="grow"><b>${esc(CLS[c.cls]?.n||c.cls)}</b><small>Lv ${c.level} · เงิน ${fmt(c.gold)} เหรียญ</small></div><button class="btn" data-a="campBegin" data-v="${c.id}" ${CAMP.busy||CAMP.used>=3?'disabled':''}>จู่โจม</button></div>`).join('')||'<p>ยังไม่มีค่ายให้เลือก กดตรวจข้อมูลใหม่</p>'}</div>`}
 return `<div class="stack"><div class="row"><h2 class="grow">จู่โจมค่าย</h2><button class="btn" data-a="go" data-v="town">กลับเมือง</button></div>${CAMP.error?`<p style="color:var(--bad)">${esc(CAMP.error)}</p>`:''}<button class="btn" data-a="campRefresh" ${CAMP.busy?'disabled':''}>ตรวจข้อมูลใหม่</button>${body}</div>`}
function profilePanel(){const P=S.P;return `<div class="card stack"><h3>โปรไฟล์ผู้ผนึก</h3>${P.profile?`<img src="${esc(P.profile)}" alt="รูปโปรไฟล์" width="64" height="64" style="border-radius:50%">`:''}<button class="btn" data-a="img" data-v="profile">ใส่รูปโปรไฟล์สำหรับอันดับ</button><label>ชื่อใหม่ <input id="renameName" maxlength="20" value="${esc(P.name)}"></label><button class="btn" data-a="renameCharacter">เปลี่ยนชื่อ (สัปดาห์ละ 1 ครั้ง)</button><small>${P.renameAt?'เปลี่ยนชื่อครั้งถัดไป '+new Date(P.renameAt+7*86400000).toLocaleString(gameLocale()):''}</small></div>`}
Object.assign(handlers,{
 camp:enterCamp,campRefresh:()=>campCall(CAMP.roomId?'camp_poll':'camp_list'),campRegister:async()=>{const pet=Number(document.getElementById('campPet')?.value);await gsSave(true);await campCall('camp_register',{pet});await campCall('camp_list')},
 campBegin:async target=>{const pet=Number(document.getElementById('campAttackPet')?.value);await gsSave(true);if(!CAMP.request)CAMP.request=crypto.randomUUID().replace(/-/g,'');await campCall('camp_begin',{target,pet,request:CAMP.request})},
 campTarget:id=>{CAMP.target=id;render()},campFriend:id=>{CAMP.friend=id;render()},
 campMove:id=>{if(!CAMP.request)CAMP.request=crypto.randomUUID().replace(/-/g,'');const r=CAMP.room;return campCall('camp_move',{skill:id,target:CAMP.target||r.battle.enemies.find(x=>x.hp>0)?.id,friend:CAMP.friend||r.battle.cur,rev:r.rev,request:CAMP.request})},
 campLeave:()=>{S.ui.confirm={msg:'ยอมแพ้และเสียเงินปัจจุบัน 20% ให้เจ้าของค่าย?',act:'campDoLeave'};render()},campDoLeave:()=>{S.ui.confirm=null;campCall('camp_leave')},
 campClear:()=>{CAMP.room=null;CAMP.roomId='';CAMP.token='';localStorage.removeItem('sealbeast_camp_v1');campCall('camp_list')},
 renameCharacter:async()=>{const name=document.getElementById('renameName')?.value?.trim();if(!name)return;await gsSave(true);await campCall('camp_profile',{name})}
});

/* Carrying is a subset of owned pets; camp storage never deletes a pet. */
const carryLimit=(P=S.P)=>baseOf(P.cls)==='summoner'?8:5;
function normalizePack(P=S.P){if(!P)return;const pets=Array.isArray(P.pets)?P.pets:[],valid=new Set(pets.map(p=>p.uid)),cap=carryLimit(P);const legacy=!Array.isArray(P.carried);const active=(Array.isArray(P.party)?P.party:[]).filter(id=>valid.has(id));const inBattle=S?.P===P?(S.battle?.allies||[]).filter(u=>u.kind==='pet').map(u=>u.uid):[];const list=legacy?[...inBattle,...active,...pets.map(p=>p.uid)]:[...active.filter(id=>P.carried.includes(id)),...P.carried];P.carried=[...new Set(list.filter(id=>valid.has(id)))].slice(0,cap);P.party=[...new Set(active.filter(id=>P.carried.includes(id)))].slice(0,clsSum(P.cls));P.packVersion=1;}
function carriedPets(){normalizePack();return S.P.carried.map(petBy).filter(Boolean)}
function storedPets(){normalizePack();return S.P.pets.filter(p=>!S.P.carried.includes(p.uid))}
function packLocked(){return !!(S.zone||S.battle||PVP.room?.status==='active'||CAMP.room?.status==='active'||WORLD.room?.status==='active')}
function movePet(id,carry){normalizePack();const P=S.P,p=petBy(Number(id));if(!p)return false;if(packLocked()){toast('กลับเมืองและจบการต่อสู้ก่อนจัดอสูรกับค่าย');return false}if(carry){if(P.carried.includes(p.uid))return true;if(P.carried.length>=carryLimit()){toast('กระเป๋าเต็ม ฝากอสูรไว้ที่ค่ายก่อน');return false}if(CAMP.pet===p.uid){toast('ตัวนี้กำลังเฝ้าค่าย เปลี่ยนผู้เฝ้าค่ายก่อนนำติดตัว');return false}P.carried.push(p.uid)}else{P.carried=P.carried.filter(x=>x!==p.uid);P.party=P.party.filter(x=>x!==p.uid)}fixParty();save();render();return true}
function toggleActive(id){normalizePack();const P=S.P,p=petBy(Number(id));if(!p)return;if(S.battle||PVP.room?.status==='active'||CAMP.room?.status==='active'||WORLD.room?.status==='active'){toast('จัดทีมหลังจบการต่อสู้ หรือใช้คำสั่งเรียกอสูรระหว่างสู้');return}if(!P.carried.includes(p.uid)){if(S.zone){toast('อสูรตัวนี้พักที่ค่าย ต้องกลับเมืองก่อน');return}if(!movePet(p.uid,true))return}if(P.party.includes(p.uid))P.party=P.party.filter(x=>x!==p.uid);else{if(P.party.length>=clsSum(P.cls))P.party.shift();P.party.push(p.uid)}save();render()}
function rosterSummary(){normalizePack();const P=S.P,cap=carryLimit(),slots=Array.from({length:cap},(_,i)=>{const p=petBy(P.carried[i]),active=p&&P.party.includes(p.uid);return `<div class="pack-slot ${p?active?'active':'':'empty'}" ${p?`title="${esc(petName(p))}"`:''}>${p?portrait(p.sp,38,{form:p.form||0}):'✧'}${active?'<em>◆</em>':''}</div>`}).join('');return `<section class="card roster-banner"><div><div class="eyebrow">THE SUMMONER'S RETINUE</div><div class="roster-title">ขบวนอสูรคู่พันธสัญญา</div><p class="roster-help" style="margin:6px 0 0">${S.zone?'อยู่ในป่า · เรียกสลับได้เฉพาะอสูรที่พกมา':'จัดทีมและฝากอสูรพักที่ค่ายก่อนออกเดินทาง'}</p><div class="roster-count"><span>พก ${P.carried.length}/${cap}</span><span>ออกสู้ ${P.party.length}/${clsSum(P.cls)}</span><span>ค่าย ${storedPets().length}</span></div></div><div class="pack-slots ${cap===8?'eight':''}">${slots}</div></section>`}
function vRoster(tabs){const P=S.P;normalizePack();const filter=S.ui.packFilter||'carried';const categories=[['carried','ติดตัว '+P.carried.length],['active','ออกสู้ '+P.party.length],['reserve','สำรอง '+(P.carried.length-P.party.length)],['camp','พักที่ค่าย '+storedPets().length],['pending','รออัปแต้ม '+P.pets.filter(p=>p.free>0).length]];const list=filter==='pending'?P.pets.filter(p=>p.free>0):filter==='camp'?storedPets():filter==='active'?carriedPets().filter(p=>P.party.includes(p.uid)):filter==='reserve'?carriedPets().filter(p=>!P.party.includes(p.uid)):carriedPets();return `<div class="stack"><div class="row"><h2 class="grow">สำนักพันธสัญญา</h2><span class="sub">ทั้งหมด ${P.pets.length}/${MAXPETS}</span></div>${tabs}${rosterSummary()}${advicePanel()}<div class="tabs">${categories.map(([id,n])=>`<button data-a="packFilter" data-v="${id}" class="${filter===id?'on':''}">${n}</button>`).join('')}</div><p class="roster-help" style="margin:0">${filter==='camp'?'อสูรพักค่ายไม่ใช้พื้นที่กระเป๋า และเรียกจากป่าไม่ได้':'จำนวนพกรวมทีมออกสู้และตัวสำรอง ◆ คือทีมออกสู้ สามารถเปลี่ยนทีมจากอสูรที่พกได้'}${carryLimit()===8?' · สายนักอัญเชิญพกได้ 8 ตัว':''}</p><div class="pet-management">${list.map(p=>{const st=calcPet(p),carried=P.carried.includes(p.uid),active=P.party.includes(p.uid),location=active?'active':carried?'reserve':'camp';return `<article class="card pet-tile" data-location="${location}"><button class="pet-open" data-a="petview" data-v="${p.uid}">${portrait(p.sp,58,{form:p.form||0})}<span class="grow"><b>${esc(petName(p))}</b><small class="sub">Lv ${p.lv} · ${tChips(SP[p.sp].t)}</small></span></button><div class="row wrap"><span class="pet-location">${active?'◆ ทีมออกสู้':carried?'✧ พกสำรอง':'⌂ พักที่ค่าย'}</span>${p.free?`<span class="chip">แต้ม +${p.free}</span>`:''}</div>${carried?`<small class="num">HP ${p.hp}/${st.hp} · MP ${p.mp}/${st.mp}</small>${bar(p.hp,st.hp)}${bar(p.mp,st.mp,'mp')}`:''}<div class="pet-actions">${p.free>0?`<button class="btn sm" data-a="autoStats" data-v="${p.uid}" ${statsLocked()?'disabled':''}>อัปอัตโนมัติ +${p.free}</button>`:''}${carried?`<button class="btn sm ${active?'':'pri'}" data-a="partytoggle" data-v="${p.uid}" ${S.battle?'disabled':''}>${active?'เป็นสำรอง':'ออกสู้'}</button><button class="btn sm" data-a="petStore" data-v="${p.uid}" ${packLocked()?'disabled':''}>พักที่ค่าย</button>`:`<button class="btn sm pri" data-a="petCarry" data-v="${p.uid}" ${packLocked()||P.carried.length>=carryLimit()?'disabled':''}>นำติดตัว</button>`}</div></article>`}).join('')||'<p class="empty-roster">ยังไม่มีอสูรในกลุ่มนี้</p>'}</div></div>`}
Object.assign(handlers,{partytoggle:toggleActive,petCarry:id=>movePet(id,true),petStore:id=>movePet(id,false),packFilter:id=>{S.ui.packFilter=id;render()}});

/* Discovery is per species AND form. Existing saves have no historical form log. */
function markFormSeen(sp,form=0){if(!S.P||!SP[sp])return;const P=S.P,max=(SP[sp].ev||[]).length,f=Math.max(0,Math.min(max,Math.floor(form)||0));P.seen=P.seen||{};P.seen[sp]=1;P.seenForms=P.seenForms||{};const a=Array.isArray(P.seenForms[sp])?P.seenForms[sp]:[];if(!a.includes(f))a.push(f);P.seenForms[sp]=a.sort((x,y)=>x-y)}
function initDiscovery(){const P=S.P;if(!P)return;if(!P.seenForms||typeof P.seenForms!=='object'||Array.isArray(P.seenForms))P.seenForms={};if(!P.discoveryVersion){for(const sp of Object.keys(P.seen||{}))if(P.seen[sp])markFormSeen(sp,0);P.discoveryVersion=1}for(const p of P.pets||[])markFormSeen(p.sp,p.form||0)}
function observeUnits(units){for(const u of units||[])if(u.sp)markFormSeen(u.sp,u.evo||0)}
function dexForms(sp){const known=S.P.seenForms?.[sp]||[],forms=[{f:0,n:SP[sp].n},...(SP[sp].ev||[]).map((e,i)=>({f:i+1,n:e[1]}))];return `<div class="dex-forms">${forms.map(({f,n})=>`<div class="dex-form">${portrait(sp,64,{form:f})}<b>${esc(n)}</b><small>${f?'ร่างพัฒนา '+f:'ร่างพื้นฐาน'} · ${known.includes(f)?'เคยพบ':'ยังไม่เคยพบ'}</small></div>`).join('')}</div>`}
function statsLocked(){return !!(S.battle&&!S.battle.over||PVP.room?.status==='active'||CAMP.room?.status==='active'||WORLD.room?.status==='active')}
function allocationPlan(p=null){if(!p){const focus=focusFor(S.P.cls),primary=WT[clsWeapon(S.P.cls)].t==='m'?'matk':'patk',weights={hp:3,[primary]:4};for(const k of focus)weights[k]=Math.max(weights[k]||0,k==='mp'||k==='acc'?1:k==='crit'?2:3);return {name:'สาย'+CLS[S.P.cls].n,weights}}const sp=SP[p.sp],hasTaunt=sp.sk.some(id=>SK[id]?.taunt),healer=sp.sk.filter(id=>SK[id]?.t==='heal').length;let name,weights;if(hasTaunt){name='ผู้พิทักษ์';weights={pdef:4,mdef:4,hp:3}}else if(healer&&sp.b[3]>=sp.b[2]){name='สนับสนุนเวท';weights={matk:4,mp:3,hp:2,mdef:1}}else if(sp.b[3]>sp.b[2]*1.2){name='โจมตีเวท';weights={matk:5,mp:2,hp:2,spd:1}}else if(sp.b[2]>sp.b[3]*1.2){name='โจมตีกายภาพ';weights={patk:5,hp:2,spd:2,acc:1}}else{name='โจมตีผสม';weights={patk:3,matk:3,hp:2,spd:1,mp:1}}return {name,weights}}
let AUTO_STAT_BATCH=false;
function autoStats(uid){if(statsLocked()){toast('อัปสถานะอัตโนมัติได้หลังจบการต่อสู้');return}const isHero=uid==='P',o=isHero?S.P:petBy(Number(uid));if(!o)return;const free=Math.max(0,Math.floor(Number(o.free)||0));if(!free)return;const used=Object.values(o.pts||{}).reduce((n,v)=>n+(Number(v)||0),0),budget=Math.max(0,(o.lv-1)*(isHero?5:3)-used),spend=Math.min(free,budget);if(!spend){toast('ไม่มีแต้มที่ใช้ได้ตามระดับเลเวล');return}const before=isHero?pStats():calcPet(o),hp=o.hp,mp=o.mp,plan=allocationPlan(isHero?null:o);o.pts=o.pts||{};const keys=Object.keys(plan.weights);for(let i=0;i<spend;i++){const k=keys.reduce((best,k)=>plan.weights[k]/((o.pts[k]||0)+1)>plan.weights[best]/((o.pts[best]||0)+1)?k:best,keys[0]);o.pts[k]=(o.pts[k]||0)+1}o.free-=spend;const after=isHero?pStats():calcPet(o);o.hp=hp>0?Math.min(after.hp,hp+after.hp-before.hp):0;o.mp=Math.min(after.mp,Math.max(0,mp+after.mp-before.mp));if(AUTO_STAT_BATCH)return;save();render();toast('จัดสรร '+spend+' แต้มให้ '+(isHero?o.name:petName(o))+' ตาม'+plan.name+' แล้ว')}
function autoStatPanel(p=null){const o=p||S.P,plan=allocationPlan(p);return `<div class="auto-stat-panel"><div><b>อัปสถานะอัตโนมัติ · ${esc(plan.name)}</b><small>${Object.keys(plan.weights).map(k=>LBL[k]).join(' / ')} · ใช้เฉพาะแต้มที่เหลือ ไม่ล้างแต้มเดิม</small></div><button class="btn pri" data-a="autoStats" data-v="${p?p.uid:'P'}" ${o.free>0&&!statsLocked()?'':'disabled'}>จัดสรร ${Math.max(0,o.free||0)} แต้ม</button></div>`}
function weaponRecommendation(){if(!S.P)return null;const P=S.P,old=EQ[P.eq.weapon],wt=clsWeapon(P.cls),magic=WT[wt]?.t==='m',primary=magic?'matk':'patk',weights={hp:.04,mp:.025,patk:magic?.2:3,matk:magic?3:.2,pdef:.16,mdef:.16,acc:.28,eva:.15,spd:.6,crit:1.2};const score=it=>Object.entries(it.st||{}).reduce((n,[k,v])=>n+v*(weights[k]||0),0);const current=score(old||{});return [...new Set(P.owned)].filter(id=>{const it=EQ[id];return it?.slot==='weapon'&&it.wt===wt&&it.lv<=P.lv&&id!==P.eq.weapon&&(it.st?.[primary]||0)>=(old?.st?.[primary]||0)}).map(id=>({id,it:EQ[id],gain:score(EQ[id])-current})).filter(x=>x.gain>.01).sort((a,b)=>b.gain-a.gain)[0]||null}
function advicePanel(){const P=S.P,pending=P.pets.filter(p=>(p.free||0)>0),weapon=weaponRecommendation();if(!pending.length&&!weapon)return '';return `<aside class="card stack adventure-advice"><div class="row"><h3 class="grow">✦ คำแนะนำการเตรียมตัว</h3></div>${pending.length?`<div class="row wrap"><div class="grow"><b>อสูร ${pending.length} ตัวมีแต้มที่ยังไม่ใช้</b><small class="sub">${pending.reduce((n,p)=>n+p.free,0)} แต้มรวม · รวมอสูรที่พักค่าย</small></div><button class="btn sm" data-a="pendingPets">ดูอสูรที่มีแต้ม</button></div>`:''}${weapon?`<div class="row wrap"><div class="grow"><b>มีอาวุธที่ค่าสถานะน่าใช้กว่า: ${esc(weapon.it.n)}</b><small class="sub">เทียบกับอาวุธที่สวม ใช้ได้กับอาชีพและเลเวลปัจจุบัน · ไม่รวมความได้เปรียบของธาตุและสกิลพิเศษ</small></div><button class="btn sm" data-a="recommendedWeapon">เปรียบเทียบอาวุธ</button></div>`:''}</aside>`}
Object.assign(handlers,{autoStats:uid=>autoStats(uid),pendingPets:()=>{S.ui.team='team';S.ui.packFilter='pending';go('team')},recommendedWeapon:()=>{S.ui.hero='gear';go('hero')}});


function teamAutoAllowed(){return !!B()&&!['pvp','raid','world'].includes(B().kind)}
function teamAutoUnit(u){return !!u&&u.side==='ally'&&((teamAutoAllowed()&&S.ui.autoTeam)||(u.kind==='pet'&&S.ui.autoPet)||(u.kind==='summon'&&u.name.startsWith('ทหาร')))}
function toggleTeamAuto(){const b=B();if(!b||b.over||!teamAutoAllowed())return;S.ui.autoTeam=!S.ui.autoTeam;const u=uById(b.cur);if(S.ui.autoTeam&&u&&u.side==='ally'&&b.menu!=='wait'){b.menu='wait';battleLater(aiAct,500)}save();render()}
function potionUseful(it,o,st){if(!it||!o||!st)return false;if(it.rev)return o.hp<=0;if(it.hp||it.mp)return o.hp>0&&!!((it.hp&&o.hp<st.hp)||(it.mp&&o.mp<st.mp));return true}
function bagPotionDisabled(id,who){if(CON[id]?.petExp){const p=who==='P'?null:petBy(Number(who));return !p||p.lv>=Math.min(MAXLV,S.P.lv)||p.hp<=0||statsLocked()}const o=who==='P'?S.P:petBy(Number(who));return !potionUseful(CON[id],o,who==='P'?pStats():o&&calcPet(o))}
function beastLocations(k){return ZN.flatMap(z=>{const tags=[];if(z.sp.includes(k))tags.push('ทั่วไป Lv '+z.lv.join('–'));if(z.rare.includes(k))tags.push('หายาก Lv '+z.lv.join('–'));if((z.bosses||[z.boss]).some(b=>b.sp===k))tags.push('บอส Lv '+z.boss.lv);return tags.length?[z.n+' · '+tags.join(' / ')]:[]})}
function fullBestiary(tabs){const P=S.P,ks=Object.keys(SP);return `<div class="stack"><h2>สมุดอสูร · ${ks.length} ตัว</h2>${tabs}<p class="sub">ดูข้อมูลและร่างพัฒนาได้ทุกตัว · ประวัติพบและจับยังนับจากการเล่นจริง<br>คะแนนสังหาร/จับ = เลเวล × 8 (ทั่วไป), ×20 (ตัวหายาก), ×30 (บอส) · คะแนนขึ้นกับเลเวลและประเภทที่พบจริง</p><div class="dex">${ks.map(k=>{const q=SP[k],loc=beastLocations(k);return `<article class="card stack"><b>${esc(q.n)}</b>${dexForms(k)}<div>${tChips(q.t)} <span class="chip">${q.noseal?'บอสพิเศษ · ผนึกไม่ได้':q.rare?'หายาก':'ทั่วไป'}</span></div><small>${esc(q.o||'')} · ${esc(PAS[q.pas]?.n||'')}</small><small>คะแนนต่อเลเวล: ${q.rare?20:8} · เมื่อเป็นบอส: 30</small><small>พบที่: ${loc.length?loc.map(esc).join('<br>'):'ไม่พบในตารางป่าโดยตรง'}</small><small>${P.caught[k]?'จับแล้ว':P.seen[k]?'เคยพบ':'ยังไม่เคยพบ'}</small><details><summary>สกิล</summary>${q.sk.map(id=>skillRow(id)).join('')}</details><button class="btn sm" data-a="img" data-v="${k}">ใส่รูป</button></article>`}).join('')}</div></div>`}
Object.assign(handlers,{teamAuto:toggleTeamAuto});
const safeBagUse=handlers.use;
handlers.use=v=>{const [id,who]=v.split(':'),it=CON[id];if(!it||!S.P?.items[id])return;if(it.seal||it.cure)return;if(who==='P'&&it.rev)return;if(bagPotionDisabled(id,who)){toast('พลังเต็มแล้ว หรือเป้าหมายยังใช้ยานี้ไม่ได้');return}safeBagUse(v)};


function onlineRoom(mode){return mode==='pvp'?PVP.room:WORLD.room}
function onlineSeconds(mode){const r=onlineRoom(mode);return !r?0:Math.max(0,Math.ceil((r.deadline-(Date.now()-(mode==='pvp'?(PVP.clock||0):WORLD.clock)))/1000))}
function onlineAutoButton(mode){if(onlineRoom(mode)?.replaying)return '<span class="chip">กำลังแสดงการต่อสู้ในเครื่อง</span>';if(mode==='world')return '<span class="chip">ต่อสู้อัตโนมัติเท่านั้น</span>';const r=onlineRoom(mode);if(!r||!['lobby','active'].includes(r.status))return '';const auto=!!r.players[r.me]?.auto,busy=mode==='pvp'?PVP.busy:WORLD.busy;return `<button class="btn ${auto?'pri':''}" data-a="onlineAuto" data-v="${mode}" aria-pressed="${auto}" ${busy?'disabled':''}>⚙ สู้ออโต้ ${auto?'เปิด':'ปิด'} · ตัวละครและอสูร</button>`}
function onlineClockMarkup(){return '<aside id="turnClockPopup" class="turn-clock-popup" hidden role="status" aria-live="polite"><span class="clock-face" aria-hidden="true">◷</span><div><b>ใกล้หมดเวลา!</b><small id="turnClockText"></small></div></aside>'}
let ONLINE_WARNED='';
function onlineClockTick(){const hiddenClock=document.getElementById('turnClockPopup');if(hiddenClock)hiddenClock.hidden=true;return; const mode=S.screen==='pvp'?'pvp':S.screen==='world'?'world':null,r=mode&&onlineRoom(mode),popup=document.getElementById('turnClockPopup');if(!mode||!r||r.status!=='active'||document.hidden){if(popup)popup.hidden=true;return}const secs=onlineSeconds(mode),counter=document.getElementById(mode==='pvp'?'pvpCountdown':'wbCountdown');if(counter)counter.textContent='เหลือ '+secs+' วินาที';const units=[...r.battle.allies,...r.battle.enemies],actor=units.find(u=>u.id===r.battle.cur),mine=actor?.owner===r.me,near=mine&&secs<=5;
 if(popup)popup.hidden=!near;const label=document.getElementById('turnClockText');if(near&&label)label.textContent=secs?'เหลือ '+secs+' วินาที · หมดเวลาระบบเลือกท่าให้':'หมดเวลา · ระบบกำลังเลือกท่าให้';
 const key=mode+':'+r.id+':'+r.battle.cur+':'+r.deadline;if(near&&secs>0&&ONLINE_WARNED!==key){ONLINE_WARNED=key;if(Sound.enabled)ExtraAudio.play('warn');}}
ExtraAudio.syncWarning=()=>{};
Object.assign(handlers,{onlineAuto:mode=>{const r=onlineRoom(mode);if(!r)return;const enabled=!r.players[r.me]?.auto;if(mode==='pvp')pvpRequest({action:'pvp_auto',enabled});else wbCall('wb_auto',{enabled});}});
setInterval(onlineClockTick,250);

function stakeApply(P,events){P.stakeApplied=Array.isArray(P.stakeApplied)?P.stakeApplied:[];P.items=P.items||{};P.owned=P.owned||[];P.pets=P.pets||[];for(const e of events||[]){if(P.stakeApplied.includes(e.id))continue;const a=e.asset;if(a.type==='gold')P.gold=(Number(P.gold)||0)+e.sign*a.qty;else if(a.type==='item')P.items[a.key]=Math.max(0,(P.items[a.key]||0)+e.sign*a.qty);else if(a.type==='gear'){if(e.sign<0){const i=P.owned.indexOf(a.key);if(i>=0)P.owned.splice(i,1)}else P.owned.push(a.key)}else if(a.type==='pet'){if(e.sign<0){P.pets=P.pets.filter(p=>p.uid!==a.pet.uid);P.party=(P.party||[]).filter(id=>id!==a.pet.uid);P.carried=(P.carried||[]).filter(id=>id!==a.pet.uid)}else{const pet=JSON.parse(JSON.stringify(a.pet));if(P.pets.some(p=>p.uid===pet.uid))pet.uid=Number(''+Date.now().toString().slice(-10)+'9');P.pets.push(pet);P.seen=P.seen||{};P.caught=P.caught||{};P.seen[pet.sp]=1;P.caught[pet.sp]=1;}}P.stakeApplied.push(e.id)}return P;}
const ELEMENT_SHAPES=SoulbeastContent.ELEMENT_SHAPES();
function elementIcon(e){if(!EL[e])return '';return `<span class="element-icon" style="--element:${EL[e].c}" title="${esc(EL[e].n)}" role="img" aria-label="ธาตุ${esc(EL[e].n)}"><svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${ELEMENT_SHAPES[e]}</svg></span>`}
function skillElementIcon(u,sk,id){if(!sk)return '';if(id==='attack'||sk===SK.attack)return elementIcon(u?.enchant||(u?.stab||[])[0]||null);return elementIcon(sk.el||(['p','m','h','auto','status','debuff'].includes(sk.t)?'normal':null))}
function autoStatsAll(){if(statsLocked()){toast('จบการต่อสู้ก่อนอัปสถานะ');return}const ids=['P',...S.P.pets.map(p=>p.uid)];AUTO_STAT_BATCH=true;try{for(const id of ids)autoStats(id)}finally{AUTO_STAT_BATCH=false}save();render();toast('จัดสรรแต้มตัวละครและอสูรทุกตัวแล้ว')}
function allStatsButton(){const n=(S.P.free||0)+S.P.pets.reduce((n,p)=>n+(p.free||0),0);return `<button class="btn pri" data-a="autoStatsAll" ${!n||statsLocked()?'disabled':''}>✦ อัปสถานะอัตโนมัติทั้งทีม · ${n} แต้ม</button>`}
function foldCard(title,body){return `<details class="card compact-info"><summary>${title}</summary><div class="stack">${body}</div></details>`}
function vSettings(){const P=S.P;return `<div class="stack"><div class="row"><h2 class="grow">⚙ ตั้งค่า</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="card row">${portrait('player',64)}<div><h3><span data-user-content>${esc(P.name)}</span></h3><small>${esc(CLS[P.cls].n)} · Lv ${P.lv} · EXP ${fmt(P.exp)}</small></div></div><div class="achievement-grid">${[['✦','คะแนน',fmt(P.score||0)],['◈','ชนิดอสูรที่จับ',Object.keys(P.caught||{}).filter(k=>P.caught[k]).length],['⌕','ค้นพบ',Object.keys(P.seen||{}).filter(k=>P.seen[k]).length],['♛','ปราบจอมมาร',P.cleared||0],['◇','ตำนาน',Object.keys(P.legend||{}).length],['⚑','ป่าที่ปลดล็อก',P.zoneMax||1]].map(([g,n,v])=>`<div class="card"><b>${g} ${v}</b><small>${n}</small></div>`).join('')}</div>${profilePanel()}${soundPanel()}${foldCard('บันทึกและโหลดเซฟออนไลน์',vระบบออนไลน์Save())}${foldCard('สำรอง / นำเข้าเซฟ',vBackup())}${CLOUD.st==='off'?'':foldCard('เซฟคลาวด์',vCloud())}${foldCard('จัดการตัวละคร','<button class="btn danger" data-a="reset">เริ่มเกมใหม่</button>')}</div>`}
function vWild(){const chosen=ZN.find(z=>z.id===Number(S.ui.forestChoice));return `<div class="stack"><div class="row"><h2 class="grow">เลือกจุดหมาย</h2>${chosen?'<button class="btn sm" data-a="forestPick" data-v="">ดูป่าทั้งหมด</button>':''}</div>${chosen?forestDetail(chosen):`<div class="forest-gallery">${[...ZN.filter(z=>z.train),...ZN.filter(z=>!z.train)].map(z=>{const open=z.train||S.P.zoneMax>=z.id;return `<button class="forest-portrait ${open?'':'sealed'}" data-a="forestPick" data-v="${z.id}" aria-label="${esc(z.n)}${open?'':' ยังไม่ปลดล็อก'}"><span class="forest-picture"><img src="${BUILTIN_SCENES[z.id===7?8:z.id+1]}" alt=""><span aria-hidden="true">${open?'✧':'🔒'}</span></span><strong class="forest-name">${esc(z.n)}</strong></button>`}).join('')}</div>`}</div>`}
function forestDetail(z){const open=z.train||S.P.zoneMax>=z.id;return `<div class="card stack forest-detail">${zoneArt(z.id)}<h2>${esc(z.n)}</h2><p>${esc(z.d)}</p><small>อสูร Lv ${z.lv.join('–')} · บอส Lv ${z.boss.lv}</small><div class="row wrap">${z.sp.map(k=>`<span title="${esc(SP[k].n)}">${portrait(k,42)}</span>`).join('')}</div><div class="row wrap"><small>หายาก</small>${z.rare.map(k=>portrait(k,42)).join('')}</div>${open?`<button class="btn pri full" data-a="zone" data-v="${z.id}">เข้าสู่${esc(z.n)}</button>`:'<p>ชนะบอสในดินแดนก่อนหน้าเพื่อปลดล็อก</p>'}</div>`}
function storyFramesOriginal(chapter,after=false){if(chapter===7)return [{art:8,title:'ก้าวแรกของผู้ผนึก',text:'หลังประตูเมือง ป่าเล็กกำลังรอคุณและสหาย เรียนรู้ที่จะเชื่อใจกันก่อนออกสู่โลกกว้าง',music:'peaceMusic'},{art:8,title:'สัญญาใต้ร่มไม้',text:'พกยาและผนึกให้พร้อม เลือกทางเดินอย่างระมัดระวัง แล้วกลับมาพร้อมอสูรคู่หู',music:'forest'}];const c=STORY[chapter]||STORY[0],art=chapter?chapter+1:0;if(after)return [{art,title:'แสงหลังการต่อสู้',text:c.after||'ทางข้างหน้าเปิดออก คุณและสหายพร้อมออกเดินทางอีกครั้ง',music:'pianoMusic'},{art:chapter<6?chapter+2:1,title:chapter===6?'คำสัญญาที่กลับคืน':'เส้นทางถัดไป',text:chapter===6?'กลับสู่นครพันผนึกพร้อมสหาย การเดินทางยังไม่สิ้นสุด':STORY[Math.min(6,chapter+1)].lead,music:'peaceMusic'}];if(chapter===0)return [{art:0,title:'คืนที่ดวงจันทร์แตกร้าว',text:c.lead,music:'hauntMusic'},{art:1,title:'นครพันผนึก',text:'มนุษย์และอสูรเคยอยู่ร่วมกัน จนจอมมารปลุกหัวใจรัตติกาลและพรากเสียงของโลกไป',music:'pianoMusic'},{art:2,title:'ผนึกแรก',text:'ธาราเทพมอบผนึกให้คุณ «ผนึกที่แท้จริงไม่ได้เกิดจากการบังคับ แต่เกิดจากความไว้ใจ»',music:'peaceMusic'},{art:7,title:'คำสาบานแห่งสหาย',text:'เดินทางผ่านห้าดินแดนไปยังปราสาทจอมมาร จงกลับมาพร้อมสหาย มิใช่เพียงชัยชนะ',music:'intro'}];const words=c.text.split(' '),half=Math.max(1,Math.ceil(words.length/2));return [{art,title:c.title,text:c.lead,music:'forest'},{art,title:c.speaker,text:words.slice(0,half).join(' '),music:chapter>=5?'hauntMusic':'forest'},{art,title:'คำสาบานระหว่างทาง',text:words.slice(half).join(' ')||c.quote,music:chapter>=5?'tense':'pianoMusic'}]}
const CINEMA_ART=SoulbeastContent.CINEMA_ART();
function storyFrames(chapter,after=false){const isAfter=!!after&&chapter>0;const frames=chapter===7&&isAfter?[{art:8,title:'คำสัญญาแรกสำเร็จแล้ว',text:'คุณและอสูรคู่หูผ่านการฝึกใต้ร่มไม้ เส้นทางสู่ป่าแสงจันทร์รออยู่ กลับไปเตรียมตัวแล้วออกเดินทางด้วยกัน',music:'peaceMusic'}]:storyFramesOriginal(chapter,isAfter);return frames.map((f,i)=>({...f,sceneKey:chapter+'-'+(isAfter?'after':'before')+'-'+i}));}

function cinemaView(intro=false){const q=intro?{chapter:0,index:S.ui.introFrame||0,after:false}:S.ui.cinema,frames=storyFrames(q.chapter,q.after),i=Math.min(q.index||0,frames.length-1),f=frames[i];return `<section class="cinema"><img class="cinema-art" src="${CINEMA_ART[f.sceneKey]}" alt="${esc(f.title)}"><div class="cinema-shade"></div><div class="cinema-top"><small>ตำนานผนึกอสูร · ${i+1}/${frames.length}</small><button class="btn sm" data-a="cinemaEnd" data-v="${intro?'intro':''}">ข้ามฉาก</button></div><div class="cinema-caption"><small>✦ ${q.after?'บทส่งท้าย':'คำสาบานแห่งพันผนึก'}</small><h1>${esc(f.title)}</h1><p>${esc(f.text)}</p><div class="cinema-controls"><button class="btn" data-a="cinemaPrev" data-v="${intro?'intro':''}" ${i?'':'disabled'}>ย้อนฉาก</button><button class="btn pri" data-a="cinemaNext" data-v="${intro?'intro':''}">${i===frames.length-1?(intro?'เลือกผู้ผนึก':'ออกเดินทางต่อ'):'ฉากถัดไป →'}</button><button class="btn sm" data-a="soundtoggle" aria-label="เปิดปิดเสียง">${Sound.enabled?'🔊':'🔇'}</button></div></div></section>${intro?'<button class="btn full" data-a="introLoad">มีเซฟอยู่แล้ว / โหลดเซฟ</button>':''}`}
function openCinema(chapter,after=false,back=S.screen){S.ui.cinema={chapter,index:0,after,back};S.screen='story';render()}
function endCinema(intro){if(intro){S.ui.introSeen=true;S.ui.introFrame=0;S.screen='start'}else{const q=S.ui.cinema;delete S.ui.cinema;S.screen=q?.back||(S.P?'town':'start')}save();render()}
const startFull=vStart,storyFull=vStory,heroFull=vHero,legendFull=vLegend,endBattleFull=endBattle;
vStart=function(){return !S.ui.introSeen?cinemaView(true):startFull()};
vStory=function(){if(S.ui.cinema)return cinemaView();const max=S.P?Math.min(6,S.P.zoneMax||1):0;return `<div class="stack"><div class="row"><h2 class="grow">บันทึกแห่งพันผนึก</h2><button class="btn" data-a="storyback">กลับเกม</button></div><div class="forest-gallery">${STORY.map((c,i)=>i<=max?`<button class="story-cover" data-a="chapterPlay" data-v="${i}"><img src="${CINEMA_ART[i+'-before-0']}" alt=""><span>${esc(c.title)}</span></button>`:'').join('')}</div></div>`};
vHero=function(){let html=heroFull();const titles=['ความสามารถติดตัว','สกิลอาชีพ (เรียนตามเลเวล)','สกิลจากอุปกรณ์'];for(const title of titles){const needle='<div class="card stack"><h3>'+title+'</h3>',a=html.indexOf(needle);if(a<0)continue;let pos=a+needle.length,depth=1;const rx=/<\/?div\b[^>]*>/g;rx.lastIndex=pos;let m;while((m=rx.exec(html))&&depth){depth+=m[0].startsWith('</')?-1:1;if(!depth){html=html.slice(0,a)+foldCard(title,html.slice(pos,m.index))+html.slice(rx.lastIndex);break}}}return html};
vLegend=function(){return foldCard('ของในตำนาน / ตำนานสุริยคราส',legendFull())};
endBattle=function(res){const b=B(),trigger=b&&!b.over&&res==='win'&&b.kind==='boss';endBattleFull(res);if(trigger)openCinema(b.meta,true,'battle')};
const zoneEnterFull=handlers.dozone;handlers.dozone=v=>{zoneEnterFull(v);if(S.zone&&Number(S.zone.id)===Number(v)){S.P.lastForestId=Number(v);save()}if(Number(v)!==7)openCinema(Number(v),false,'zone');else{S.ui.cinema={chapter:7,index:0,after:false,back:'zone',training:true};S.screen='story';render()}};
const musicSceneFull=Music.sync;Music.sync=function(){const q=S.ui.cinema||(!S.P&&!S.ui.introSeen?{chapter:0,index:S.ui.introFrame||0}:null);if(!q)return musicSceneFull.call(this);if(!Sound.enabled||document.hidden||Sound.ctx?.state!=='running'){this.stop();return}const f=storyFrames(q.chapter,q.after)[q.index||0],key=f?.music||'intro',selected=ExtraAudio.groups[key]?.[0]||key;if(this.current==='cinema:'+key)return;this.stop();this.current='cinema:'+key;this.playing=selected;this.play(selected,.32)};
Object.assign(handlers,{autoStatsAll,forestPick:v=>{S.ui.forestChoice=v?Number(v):null;render()},chapterPlay:v=>openCinema(Number(v),false,'story'),cinemaPrev:v=>{if(v==='intro')S.ui.introFrame=Math.max(0,(S.ui.introFrame||0)-1);else S.ui.cinema.index=Math.max(0,S.ui.cinema.index-1);render()},cinemaNext:v=>{const q=v==='intro'?{chapter:0,index:S.ui.introFrame||0}:S.ui.cinema;if(q.index>=storyFrames(q.chapter,q.after).length-1){endCinema(v==='intro');return}if(v==='intro')S.ui.introFrame=q.index+1;else q.index++;render()},cinemaEnd:v=>endCinema(v==='intro'),introLoad:()=>{S.ui.introSeen=true;render()}});

storyCard=function(i,after=false){const c=STORY[i];return `<button class="story-cover story-teaser" data-a="storyScene" data-v="${i}:${after?'after':''}"><img src="${CINEMA_ART[i+'-'+(after&&i>0?'after':'before')+'-0']}" alt=""><span>${after?'บทส่งท้าย · ':''}${esc(c.title)} <small>ชมฉากเรื่องราว →</small></span></button>`};
handlers.storyScene=v=>{const [i,a]=v.split(':');openCinema(Number(i),a==='after',S.screen)};

function wagerPanel(r){const v=r.wagers||{rev:0,offers:[null,null]},mine=v.offers[r.me],other=v.offers[1-r.me],busy=PVP.busy||PVP.stakeBusy;return `<div class="card stack wager-panel"><h3>◈ ของเดิมพัน · เลือกไม่เดิมพันได้</h3><div class="wager-pair">${[r.me,1-r.me].map(i=>`<div><small>${i===r.me?'ของคุณ':'ของอีกฝ่าย'}</small><b>${esc(v.offers[i]?.label||'ไม่เดิมพัน')}</b>${v.offers[i]?.pet?portrait(v.offers[i].pet.sp,54,{form:v.offers[i].pet.form}):v.offers[i]?.type==='gear'||v.offers[i]?.type==='item'?itemIcon(v.offers[i].key,42):''}</div>`).join('')}</div>${r.status==='lobby'?`<label>เลือกของของคุณ<select id="wagerPick"><option value="none:">ไม่เดิมพัน</option><option value="gold:">เงิน</option>${Object.entries(S.P.items||{}).filter(([id,n])=>CON[id]&&n>0).map(([id,n])=>`<option value="item:${id}">${esc(CON[id].n)} · มี ${n}</option>`).join('')}${[...new Set(S.P.owned)].filter(id=>EQ[id]).map(id=>`<option value="gear:${id}">${esc(EQ[id].n)}</option>`).join('')}${storedPets().map(p=>`<option value="pet:${p.uid}">${esc(petName(p))} Lv ${p.lv}</option>`).join('')}</select></label><label>จำนวน (เงินหรือไอเท็ม)<input id="wagerQty" type="number" min="1" step="1" value="1"></label><button class="btn seal" data-a="wagerOffer" ${busy?'disabled':''}>ฝาก / เปลี่ยนของเดิมพัน</button><small>ของที่ฝากจะถูกพักไว้จนจบแมตช์ การเปลี่ยนเดิมพันยกเลิกการยืนยันของทั้งคู่ · อสูรต้องพักค่ายและไม่ได้เฝ้าค่าย</small>`:''}${r.status==='finished'?`<small>${r.winner===-1?'เสมอหรือยกเลิก · คืนของให้เจ้าของ':'ผู้ชนะได้รับของเดิมพันทั้งสองฝั่งแล้ว'} · รับของได้จากเซฟออนไลน์เมื่อเชื่อมต่อ</small>`:'<small>ผู้แพ้เสียของที่ฝากให้ผู้ชนะ · เสมอคืนของ · ออกจากห้องระหว่างสู้ถือว่ายอมแพ้</small>'}</div>`}
const accountBeforeStakes=applyAccount;applyAccount=function(a){if(a?.stakes&&S.P)stakeApply(S.P,a.stakes);accountBeforeStakes(a)};
Object.assign(handlers,{wagerOffer:async()=>{const r=PVP.room;if(!r||r.status!=='lobby'||PVP.busy||PVP.stakeBusy||GS.busy)return;const value=document.getElementById('wagerPick')?.value||'none:',[type,key]=value.split(':'),qty=Number(document.getElementById('wagerQty')?.value||1);PVP.stakeBusy=true;render();try{await gsSave(true);await pvpRequest({action:'pvp_wager',type,key,qty,wagerRev:r.wagers?.rev||0,request:crypto.randomUUID()});}finally{PVP.stakeBusy=false;render();}}});

function render(){
 if(S.P){normalizePack();initDiscovery()}const app=document.getElementById('app');if(S.screen!=='start'&&S.screen!=='story'&&!S.P)S.screen='start';
 if(S.screen==='battle'&&!S.battle)S.screen=S.zone?'zone':'town';
 if(S.screen==='zone'&&!S.zone)S.screen='wild';
 if(S.screen==='wild'&&S.zone)S.screen='zone';
 const V={statusbook:vStatusBook,guild:vGuild,guildwar:vGuildWar,elements:vGuideElements,guide:vGuide,bestiary:vGuideBestiary,classes:vGuideClasses,weaponbook:vWeaponBook,gacha:vGacha,friends:vFriends,settings:vSettings,world:vWorld,camp:vCamp,pvp:vPvp,story:vStory,leader:vLeader,forge:vForge,start:vStart,town:vTown,shop:vShop,hospital:vHospital,arena:vArena,wild:vWild,zone:vZone,battle:vBattle,hero:vHero,team:vTeam,bag:vBag}[S.screen]||vTown;
 const P=S.P,inB=S.screen==='battle',start=S.screen==='start'||!S.P;
 const priorMain=app.querySelector('main'),keepScroll=app.dataset.screen===S.screen,mainScroll=keepScroll&&priorMain?priorMain.scrollTop:0;
 const navOn=k=>({town:['statusbook','guild','guildwar','town','shop','hospital','arena','forge','leader','pvp','camp','weaponbook','gacha','friends','guide','bestiary','classes','elements'],wild:['wild','zone'],hero:['hero'],team:['team'],bag:['bag']})[k].includes(S.screen);
 const KEEP=['guildName','guildSearch','guildFlag','guildRename','wagerPick','wagerQty','renameName','wbRoomCode','nm','savein','gscode','gspin','gsnewpin','pvpRoomCode','campPet','campAttackPet','weaponBookType'],kept={};KEEP.forEach(id=>{const el=document.getElementById(id);if(el&&el.value)kept[id]=el.value});
 const wbChecked=[...document.querySelectorAll('input[name="wbPet"]:checked')].map(e=>e.value);app.innerHTML=(start?'':`<header class="top">${portrait('player',34)}<div class="who"><b><span data-user-content>${esc(P.name)}</span> <span class="sub" style="font-weight:400">${CLS[P.cls].n}</span></b><small class="num">Lv ${P.lv} · ${S.zone?ZN[S.zone.id-1].n+' · ก้าว '+S.zone.depth:'นครพันผนึก'}</small></div><span class="coin" style="${P.gold<0?'color:var(--bad)':''}">${P.gold<0?'หนี้ ':''}${fmt(P.gold)} <small style="font-family:var(--f-body);font-weight:400">เหรียญ</small></span><button class="btn sm friend-top" data-a="go" data-v="friends" aria-label="เพื่อนและผู้เล่นออนไลน์" translate="no">♟ ${ct('เพื่อน','Friends','好友')} <small>${COMMUNITY.ready?COMMUNITY.online.length:'—'}</small></button><button class="btn sm settings-button" data-a="go" data-v="settings" aria-label="ตั้งค่า">⚙</button><button class="btn sm" data-a="soundtoggle" title="เปิด–ปิดเสียง" aria-label="เปิด–ปิดเสียงเกม" aria-pressed="${Sound.enabled}">${Sound.enabled?'🔊':'🔇'}</button></header><div class="brand-seam"><img src="assets/ui/soulbeast-logo-v2.webp" alt="SOULBEAST" width="368" height="124"></div>`)
  +`<main>${V()}${S.zone&&(!S.battle||!S.battle.over)?'<button class="btn danger full" style="margin-top:14px" data-a="surrender">ยอมแพ้ [ยอมตาย] · กลับเมืองพร้อมรับบทลงโทษ</button>':''}</main>`
  +(start||inB?'':`<nav class="bottom">${[['town','เมือง','城'],['hero','ตัวละคร','我'],['wild','ป่า','林'],['team','อสูร','封'],['bag','กระเป๋า','包']].map(([k,n,g])=>`<button class="${navOn(k)?'on':''} ${S.zone&&k==='town'?'lock':''} ${k==='wild'?'nav-wild':''}" data-a="go" data-v="${k}">${townNavArt(k)}${n}${k==='hero'&&canPromote(P)?' •':''}</button>`).join('')}</nav>`)
  +(S.ui.confirm?`<div class="overlay"><div class="card stack"><p style="margin:0">${S.ui.confirm.msg}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="cancel">ยกเลิก</button><button class="btn danger" data-a="${S.ui.confirm.act}" data-v="${S.ui.confirm.v??''}">ยืนยัน</button></div></div></div>`:'');
 for(const id in kept){const el=document.getElementById(id);if(el)el.value=kept[id]}
 if(keepScroll&&S.screen==='world')document.querySelectorAll('input[name="wbPet"]').forEach(e=>e.checked=wbChecked.includes(e.value));app.insertAdjacentHTML?.('beforeend',onlineClockMarkup());app.dataset.screen=S.screen;const nextMain=app.querySelector('main');if(nextMain)nextMain.scrollTop=mainScroll;
 const lg=document.getElementById('blog');if(lg)lg.scrollTop=lg.scrollHeight;
 if(inB&&VQ.length)(window.requestAnimationFrame||setTimeout)(flushVfx);
 Sound.sync();onlineClockTick();
 if(!inB)save();
 if(S.screen==='town'&&S.P&&SHEET_URL){lbSubmit();gsSave(false)}}

/* ================= BOOT & MIGRATION ================= */
function vLegend(){return vLegendBase()+`<div class="card stack"><h3>ตำนานสุริยคราส</h3><p>ได้จากบอสโลกคะแนนสูง หรือสุ่มจากจอมมารปกติเท่านั้น</p>${WORLD_LEGENDS.map(id=>`<small>${S.P.legend?.[id]?'✦':'◇'} ${EQ[id].n}</small>`).join('')}</div>`;}
const WORLD={room:null,roomId:'',busy:false,error:'',used:null,friend:'',timer:0,pending:null,clock:0};
try{const v=JSON.parse(localStorage.getItem('sealbeast_world_v1')||'{}');if(v.endpoint===SHEET_URL)WORLD.roomId=v.room||'';}catch(e){}
function wbClientSchedule(){clearTimeout(WORLD.timer);if(S.screen==='world'&&!document.hidden&&WORLD.roomId&&(!WORLD.room||['lobby','starting','active'].includes(WORLD.room.status)))WORLD.timer=setTimeout(()=>wbCall('wb_poll'),8000);}
async function wbCall(action,extra={}){if(WORLD.busy||!S.P||WORLD.room?.replaying)return;const prior=WORLD.room;WORLD.busy=true;WORLD.error='';if(action!=='wb_poll')render();try{
 if(['wb_create','wb_join'].includes(action)){if(S.zone||S.battle||PVP.room?.status==='active'||CAMP.room?.status==='active'||WORLD.room?.status==='active')throw Error('finish other battle');const res=await lbPost({action:'save',code:ensureCode(),pin:S.P.cpin||'',data:gsData()});if(!res.ok)throw Error(res.error);applyAccount(res.account);}
 const res=await lbPost({action,code:ensureCode(),pin:S.P.cpin||'',room:WORLD.room?.id||WORLD.roomId,...extra});if(!res.ok)throw Error(res.error);
 if(res.worldAccount){worldApply(S.P,res.worldAccount);save();}if(res.used!=null)WORLD.used=res.used;
 if(res.left){WORLD.room=null;WORLD.roomId='';}else if(res.room){WORLD.room=res.room;onlineSkillEffects(prior,res.room,'world');WORLD.roomId=res.room.id;WORLD.clock=Date.now()-res.room.serverTime;if(WORLD.pending&&(res.room.rev>WORLD.pending.rev||res.room.status==='finished'))WORLD.pending=null;}
 localStorage.setItem('sealbeast_world_v1',JSON.stringify({endpoint:SHEET_URL,room:WORLD.roomId}));return res;
 }catch(e){WORLD.error=({'bad action':'โปรดอัปเดตระบบออนไลน์ก่อนเล่นบอสโลก','world pets':'เลือกอสูร 1 ตัว หรือสูงสุด 3 ตัวสำหรับสายนักอัญเชิญ','world weekly limit':'ใช้สิทธิ์ครบ 3 ครั้งในสัปดาห์นี้แล้ว','world ready':'ต้องมี 1–4 คน และทุกคนกดยืนยันพร้อม','pet at camp':'เลือกอสูรที่พกติดตัวเท่านั้น','finish other battle':'จบการต่อสู้อื่นและออกจากป่าก่อน','not your turn':'ยังไม่ถึงตาของคุณ','illegal skill':'ท่านี้ใช้ไม่ได้ หรือกำลังคูลดาวน์','not lobby':'ห้องเริ่มแล้วหรือปิดไปแล้ว','room full':'ห้องมีผู้เล่นครบ 4 คนแล้ว','pin':'PIN ไม่ตรงกับเซฟออนไลน์','unauthorized':'คุณไม่ได้อยู่ในห้องนี้','room not found':'ไม่พบห้องบอสโลก'})[e.message]||'เชื่อมต่อไม่สำเร็จ: '+e.message;
 }finally{WORLD.busy=false;render();wbClientSchedule();}}
function worldPetSelection(){return [...document.querySelectorAll('input[name="wbPet"]:checked')].map(e=>Number(e.value));}
function worldCard(u,me){const mine=u.owner===me,selected=WORLD.friend===u.id;return `<button data-u="${u.id}" class="ucard ally ${selected?'at':''} ${u.hp<=0?'down':''}" data-a="wbFriend" data-v="${u.id}">${portrait(u.img==='player'?'cls:'+u.cls:u.img,44,{form:u.evo||0})}<div class="grow"><b ${u.kind==='player'?'data-user-content':''}>${esc(u.name)}</b><small class="sub">${mine?'ของคุณ':'ของเพื่อน'} · Lv ${u.lv}</small>${bar(u.hp,u.st.hp)}<small>HP ${fmt(u.hp)}/${fmt(u.st.hp)} · MP ${fmt(u.mp)}/${fmt(u.st.mp)}</small>${bar(u.mp,u.st.mp,'mp')}</div></button>`;}
function vWorld(){const r=WORLD.room,P=S.P;let body='';const rules=`<details class="card"><summary>กติกาและรางวัลบอสโลก</summary><p>ปาร์ตี้ 1–4 คน · ตัวละครและอสูรคนละ 1 ตัว สายนักอัญเชิญใช้อสูรได้สูงสุด 3 ตัว · เริ่มด้วย HP/MP เต็มเฉพาะแมตช์ · จบเมื่อทุกหน่วยฝ่ายเราหมดสติ</p><p>ต่อสู้อัตโนมัติทั้งผู้ผนึกและอสูร · ห้ามไอเท็ม ผนึก และเรียกกำลังเสริมชั่วคราว · ท่าทั้งทีมมีผลกับเพื่อนทุกคน · ยั่วยุมีผลต่อการโจมตีบอสครั้งเดียว คูลดาวน์อย่างน้อย 3 ตาของผู้ใช้</p><p>บอสอมตะ · สุ่มท่าเดี่ยว 75% / หมู่ 25% · ล้างสถานะและผลลดพลังทุกตาบอส · พลังโจมตีเพิ่มทบต้น 5% ทุกตาบอส เริ่มเพิ่มจากตาที่สอง</p><p>คะแนนต่อคน = ดาเมจรวม ÷ จำนวนคนตอนเริ่ม ÷ 25 ปัดลง · แบ่งเท่ากันแม้หมดสติก่อน ผู้ถอนตัวไม่ได้รางวัล · ใช้สิทธิ์ตอนเริ่มต่อสู้ 3 ครั้ง/สัปดาห์ รีเซ็ตวันจันทร์ 00:00 เวลาไทย</p><p>ทุก 10 คะแนนได้พลังพิชิต 1 แต้ม; ทุก 20 พลังเพิ่ม HP 10 / โจมตีกายภาพและเวท 1 สูงสุด 20 ขั้น · ได้ EXP และเหรียญตามคะแนน</p><p>โอกาสได้ตำนาน 1 ชิ้น: 500 คะแนน 5% · 1,000 คะแนน 15% · 2,000 คะแนน 35% · 4,000 คะแนนรับแน่นอน (อุปกรณ์ตำนานต้องมีผู้เล่น Lv 45 ขึ้นไปอย่างน้อย 3 คน) · จอมมารในโหมดปกติมีโอกาสดรอป 12% ของชุดเดียวกัน</p></details>`;
 if(!r){const cap=baseOf(P.cls)==='summoner'?3:1;body=`<div class="card stack"><h3>จัดทีมของคุณ · อสูรสูงสุด ${cap} ตัว</h3><p class="sub">ทุกเลเวลเข้าลองได้ · แนะนำความพร้อมประมาณ Lv 25 · รางวัลไอเท็มขั้นต่ำเริ่ม 25 คะแนน · เลือกอสูรที่พกติดตัว ไม่เปลี่ยนทีมป่าของคุณ</p>${carriedPets().map(p=>`<label class="row"><input type="checkbox" name="wbPet" value="${p.uid}" ${P.party.includes(p.uid)?'checked':''}>${esc(petName(p))} · Lv ${p.lv}</label>`).join('')}<button class="btn pri" data-a="wbCreate" ${WORLD.busy?'disabled':''}>สร้างปาร์ตี้</button><input id="wbRoomCode" maxlength="8" placeholder="รหัสห้อง 8 ตัว"><button class="btn" data-a="wbJoin" ${WORLD.busy?'disabled':''}>เข้าปาร์ตี้</button><button class="btn" data-a="wbStatus" ${WORLD.busy?'disabled':''}>ตรวจสิทธิ์ / กลับห้องเดิม / รับรางวัลค้าง</button></div>`;}
 else if(r.status==='lobby'||r.status==='starting'){body=`<div class="card stack"><h3>ห้อง ${r.id} · ${r.players.length}/4 คน</h3><p class="sub">ส่งรหัสห้องให้เพื่อน แล้วทุกคนกดยืนยันพร้อม</p>${r.players.map((p,i)=>`<div>${i===r.host?'♛ ':''}<span data-user-content>${esc(p.name)}</span> · ${CLS[p.cls].n} Lv ${p.lv} · ${p.ready?'พร้อม':'รอยืนยัน'}</div>`).join('')}<button class="btn pri" data-a="wbReady" ${WORLD.busy||r.players[r.me].ready?'disabled':''}>ยืนยันพร้อม</button>${r.me===r.host?`<button class="btn seal" data-a="wbStart" ${WORLD.busy||r.players.length<1||r.players.some(p=>!p.ready)?'disabled':''}>เริ่มท้าทาย · ใช้สิทธิ์คนละ 1 ครั้ง</button>`:''}<button class="btn danger" data-a="wbLeave">ออกจากปาร์ตี้</button></div>`;}
 else if(r.battle){const b=r.battle,actor=b.allies.find(u=>u.id===b.cur),mine=r.status==='active'&&actor?.owner===r.me;const friends=b.allies.filter(u=>u.hp>0);if(!friends.some(u=>u.id===WORLD.friend))WORLD.friend=friends[0]?.id||'';
 body=`<div data-u="worldboss" class="card stack" style="border-color:#c7854d;background:radial-gradient(ellipse at top,#51243d,transparent 80%)"><div class="row">${portrait('demonlord',94)}<div><h3>อาซารอธ · จักรพรรดิสุริยคราส</h3><b>HP ∞ · บอสอมตะ</b><p>ตาบอส ${b.bossTurns||0} · พลังโจมตี ×${Math.pow(1.05,Math.max(0,(b.bossTurns||1)-1)).toFixed(2)}</p></div></div><h2>ดาเมจรวม ${fmt(b.damageTotal||0)}</h2><p>คะแนนต่อคนขณะนี้ ${fmt(Math.floor((b.damageTotal||0)/r.players.length/25))} · ห้อง ${r.id}</p>${r.players.map((p,i)=>`<small><span data-user-content>${esc(p.name)}</span> · ดาเมจ ${fmt(b.damageBy?.[i]||0)}${p.forfeit?' · ถอนตัว':''}</small>`).join('')}</div><div class="lst">${b.allies.map(u=>worldCard(u,r.me)).join('')}</div>`;
 if(r.status==='active')body+=`<div class="card stack">${onlineAutoButton('world')}<b>${mine?'ตาของคุณ':'รอ'}: ${esc(actor?.name||'ระบบกำลังประมวลผล')}</b><span>ต่อสู้อัตโนมัติ</span><small>ระบบเลือกท่าและเป้าหมายให้ทั้งทีม</small>${WORLD.pending?'<button class="btn" data-a="wbRetry">ตรวจ / ส่งคำสั่งเดิมซ้ำ</button>':''}<span class="sub">ผลและรางวัลบันทึกแล้ว · กำลังแสดงการต่อสู้อัตโนมัติ</span></div>`;
 if(r.status==='finished'){const v=r.reward;body+=`<div class="card stack"><h2>จบการท้าทาย · ทุกหน่วยหมดสติ</h2><b>คะแนนส่วนแบ่ง ${fmt(r.sharedScore)}</b><p>${v?`ได้รับ ${fmt(v.gold)} เหรียญ · EXP ${fmt(v.xp)} · พลัง ${fmt(v.power)} · คะแนน ${fmt(v.score)}`:''}</p>${Object.entries(v?.loot||{}).map(([id,n])=>`<p>✦ ${esc(EQ[id]?.n||CON[id]?.n||id)} ×${n}</p>`).join('')}<p class="sub">รางวัลเข้าตัวละครแล้ว เซฟเกมหลักไม่ถูกหัก HP/MP</p><button class="btn pri" data-a="wbClear">กลับหน้าปาร์ตี้</button></div>`;}
 body+=`<div class="log">${b.log.slice(-30).map(s=>`<p>${esc(s)}</p>`).join('')}</div>`;}
 else body='<div class="card">ห้องปิดแล้ว <button class="btn" data-a="wbClear">กลับ</button></div>';
 return `<div class="stack"><div class="row"><h2 class="grow">บอสโลก · สุริยคราสนิรันดร์</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><p>สิทธิ์สัปดาห์นี้ ${WORLD.used==null?'กดตรวจสิทธิ์':WORLD.used+'/3'} · พลังพิชิต ${fmt(P.worldPower||0)}</p>${WORLD.error?`<div class="card" style="color:var(--bad)">${esc(WORLD.error)}</div>`:''}${body}${rules}<details class="card"><summary>ตำนานสุริยคราส 16 ชิ้น</summary>${WORLD_LEGENDS.map(id=>`<p>${P.owned.includes(id)||Object.values(P.eq).includes(id)?'✓':'◇'} ${EQ[id].n} · Lv ${EQ[id].lv} · ${SLOTN[EQ[id].slot]} · ${PAS[EQ[id].pas]?.n||''}</p>`).join('')}</details></div>`;}
Object.assign(handlers,{wbCreate:()=>wbCall('wb_create',{pets:worldPetSelection()}),wbJoin:()=>wbCall('wb_join',{room:(document.getElementById('wbRoomCode')?.value||'').trim().toUpperCase(),pets:worldPetSelection()}),wbStatus:()=>wbCall('wb_status'),wbReady:()=>wbCall('wb_ready'),wbStart:()=>wbCall('wb_start'),wbLeave:()=>wbCall('wb_leave'),wbFriend:id=>{WORLD.friend=id;render();},wbMove:id=>{if(!WORLD.room||WORLD.pending)return;WORLD.pending={skill:id,friend:WORLD.friend,rev:WORLD.room.rev,request:crypto.randomUUID()};wbCall('wb_move',WORLD.pending);},wbRetry:()=>WORLD.pending?wbCall('wb_move',WORLD.pending):wbCall('wb_poll'),wbClear:()=>{WORLD.room=null;WORLD.roomId='';WORLD.pending=null;localStorage.removeItem('sealbeast_world_v1');render();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(WORLD.timer);else wbClientSchedule();});
setInterval(()=>{if(S?.screen!=='world')return;const el=document.getElementById('wbCountdown');if(el&&WORLD.room?.status==='active')el.textContent='เหลือประมาณ '+Math.max(0,Math.ceil((WORLD.room.deadline-(Date.now()-WORLD.clock))/1000))+' วินาที';},500);

function migrate(){if(S.P){S.P.score=Number(S.P.score)||0;S.P.campApplied=Number(S.P.campApplied)||0;S.P.campScoreApplied=Number(S.P.campScoreApplied)||0}if(!S.P)return;const P=S.P;
 if(!P.cls){P.cls=P.style==='m'?'mage':'swordsman';delete P.style}
 if(!P.eq.weapon||!EQ[P.eq.weapon]){P.eq.weapon=`wp_${clsWeapon(P.cls)}0`}
 for(const sl in P.eq)if(!EQ[P.eq[sl]])delete P.eq[sl];
 const bad=P.owned.filter(id=>!EQ[id]);if(bad.length){P.gold+=bad.length*300;P.owned=P.owned.filter(id=>EQ[id])}
 P.pets=P.pets.filter(p=>SP[p.sp]);P.pets.forEach(p=>{if(p.form==null)p.form=formFor(p.sp,p.lv);p.pts=p.pts||{}});
 if(!P.party){P.party=P.active!=null?[P.active]:[];delete P.active}
 P.legend=P.legend||{};if(P.lv>=MAXLV){P.lv=MAXLV;P.exp=0}fixParty();S.ver=6}
function boot(data){if(data&&data.S){S=data.S;try{const t=localStorage.getItem(SAVEIMG);if(t)IMG=JSON.parse(t)||{}}catch(e){}}else load();
 S.ui=S.ui||{};S.ui.confirm=null;migrate();
 if(S.battle&&S.battle.v!==4){S.battle=null;S.screen=S.zone?'zone':'town'}
 if(S.zone&&(S.zone.depth==null||(S.zone.fork&&typeof S.zone.fork[0]==='string'))){S.zone.depth=S.zone.depth||0;S.zone.log=S.zone.log||[];S.zone.ev=null;newFork()}
 if(S.zone&&!S.zone.fork&&!S.zone.ev&&S.zone.depth<ZDEPTH&&!S.battle)newFork();
 render();cloudInit();if(S.screen==='world')wbCall(WORLD.roomId?'wb_poll':'wb_status');if(S.screen==='pvp')pvpSchedule();
 const b=S.battle;if(b&&!b.over){const u=b.cur&&uById(b.cur);if(!u||u.side==='enemy'||b.menu==='wait'){if(u&&u.side==='ally'&&!teamAutoUnit(u)){b.menu='main';render()}else battleLater(u?aiAct:advance,600)}}}

/* Additive compatibility patch: existing saves keep all pets and inventories. */
function latestForestArt(){const p=S.P,id=Number(p?.lastForestId)||Math.max(1,Math.min(6,p?.zoneMax||1));return BUILTIN_SCENES[id===7?8:id+1]||BUILTIN_SCENES[2];}
const expBagUse=handlers.use;handlers.use=function(v){const [id,who]=v.split(':'),it=CON[id];if(!it?.petExp)return expBagUse(v);const p=who==='P'?null:petBy(Number(who));if(p&&p.lv>=S.P.lv){toast('อสูรมีเลเวลเท่ากับหรือสูงกว่าผู้เล่นแล้ว ใช้ผลึกเติบโตไม่ได้');return;}if(!p||!carriedPets().some(x=>x.uid===p.uid)||p.lv>=MAXLV||p.hp<=0||statsLocked()||!(S.P.items[id]>0)){toast('ใช้กับอสูรที่พกติดตัวและยังไม่ถึงเลเวลสูงสุด นอกการต่อสู้เท่านั้น');return}const growth=growthCrystalExp(p,it.petExp);if(growth<=0)return;const text=gainExp(p,growth,false);S.P.items[id]--;save();render();toast((text.join(' · ')||('เพิ่ม EXP '+growth+' ให้ '+petName(p)))+(growth<it.petExp?' · ถึงขีดจำกัดเลเวลผู้เล่นแล้ว EXP ส่วนเกินไม่สะสม':''));};
const skillElementOnly=skillElementIcon;
// Painted atlas: 64 shared motifs selected by each skill's actual effect and element.
const SKILL_ART_ATLAS='assets/skills/skill-atlas.webp';
function skillArtIndex(id,sk=SK[id],u=null){
 if(!sk)return id==='defend'?58:60;
 if(sk.rev||sk.revAll)return 57;
 if(sk.t==='heal')return sk.cure?35:56;
 if(sk.t==='rest'||id==='rest')return 60;
 if(sk.summon)return sk.summon==='golem'?26:61;
 if(sk.t==='form'||sk.t==='revert')return 62;
 if(sk.steal)return 63;
 if(sk.taunt||sk.immune==='p')return 58;
 if(sk.immune||sk.t==='buff')return 59;
 const physical=['p','auto'].includes(sk.t),area=!!(sk.all||sk.rt),el=sk.el;
 const pairs={fire:[10,8,9],water:[14,12,13],ice:[18,16,17],electric:[22,20,21],ground:[24,24,25],rock:[24,24,25],flying:[30,28,29],grass:[33,32,34],bug:[32,32,33],poison:[38,36,37],dark:[40,42,41],ghost:[44,52,53],psychic:[50,50,51],dragon:[55,54,54],fairy:[48,48,49],steel:[2,0,1],fighting:[0,0,1]};
 if(pairs[el])return pairs[el][area?2:physical?0:1];
 const name=sk.n||'',key=id||'';
 if(/ปืน|กระสุน|ยิงรัว/.test(name)||/^ws_gun|^gn_|^mm_|^gs_/.test(key))return 6;
 if(/ธนู|ลูกศร|ศร|^ar_|^rn_/.test(name+' '+key))return area?4:3;
 if(/ขวาน|คลั่ง/.test(name))return 2;
 if(/หอก/.test(name))return 5;
 if(/มีด|แทงหลัง|ซุ่ม|นินจา/.test(name))return 7;
 if(sk.ls)return 43;
 if(sk.t==='status'||sk.t==='debuff')return 42;
 if(sk.gold||sk.gc)return 63;
 if(id==='attack'&&u?.kind==='pet')return 55;
 return area||sk.hits?1:physical?0:46;
}
function skillPicture(u,sk,id){
 if(!sk&&id!=='defend')return '';
 sk=sk||{n:'ตั้งรับ',t:'buff',mp:0};
 const i=skillArtIndex(id,sk,u),x=(i%8)*100/7,y=Math.floor(i/8)*100/7;
 const color=EL[sk.el||'normal']?.c||'#d9b35b';
 const tier=Math.min(3,1+Math.floor((sk.mp||0)/15));
 return `<span class="skill-picture skill-painted" role="img" aria-label="${esc(sk.n)}" style="--skill-color:${color};--skill-x:${x}%;--skill-y:${y}%"><i class="skill-paint" aria-hidden="true"></i><span class="skill-rank" aria-hidden="true">${'◆'.repeat(tier)}</span></span>`;
}

skillElementIcon=function(u,sk,id){return skillPicture(u,sk,id)+skillElementOnly(u,sk,id);};
// Render the authenticated, already settled battle locally; no polling per animation frame.
const LOCAL_REPLAYS={};
function localReplay(mode,room){if(!room?.replay?.frames?.length||room.status!=='finished')return;const key=mode+':'+room.id;if(LOCAL_REPLAYS[key])return;LOCAL_REPLAYS[key]=true;const state=mode==='camp'?CAMP:mode==='pvp'?PVP:WORLD,final=JSON.parse(JSON.stringify(room)),frames=room.replay.frames,battle=JSON.parse(JSON.stringify(room.replay.initial));let i=0;state.room={...room,status:'active',battle,replaying:true};function tick(){if(state.room?.id!==room.id)return;const prior=JSON.parse(JSON.stringify(state.room)),f=frames[i++];if(!f){state.room=final;render();return}for(const u of f.spawns||[])if(![...battle.allies,...battle.enemies].some(x=>x.id===u.id))(u.side==='ally'?battle.allies:battle.enemies).push(JSON.parse(JSON.stringify(u)));if(f.enemyIds)battle.enemies=battle.enemies.filter(u=>f.enemyIds.includes(u.id));for(const [id,hp,mp,status,taunt] of f.units){const u=[...battle.allies,...battle.enemies].find(u=>u.id===id);if(u)Object.assign(u,{hp,mp,status,taunt});}Object.assign(battle,{cur:f.cur,round:f.round,turns:f.turns,bossTurns:f.bossTurns,damageTotal:f.damageTotal,damageBy:f.damageBy,effects:f.effects,log:f.log});if(S.screen===(mode==='camp'?'camp':mode==='pvp'?'pvp':'world')){render();onlineSkillEffects(prior,state.room,mode);}setTimeout(tick,850);}tick();}
const replayCampCall=campCall;campCall=async function(a,x={}){const res=await replayCampCall(a,x);if(res?.room)localReplay('camp',res.room);return res;};
const replayWorldCall=wbCall;wbCall=async function(a,x={}){const res=await replayWorldCall(a,x);if(res?.room)localReplay('world',res.room);return res;};
const replayWorldSchedule=wbClientSchedule;wbClientSchedule=function(){if(WORLD.room?.replaying){clearTimeout(WORLD.timer);return}replayWorldSchedule();};
handlers.campMove=()=>toast('โหมดนี้ต่อสู้อัตโนมัติเท่านั้น');handlers.wbMove=()=>toast('โหมดนี้ต่อสู้อัตโนมัติเท่านั้น');

const replayPvpReceive=pvpReceive;pvpReceive=function(result){replayPvpReceive(result);localReplay('pvp',result.room);};
const mistLegendsUnlocked=(P=S.P)=>!!P&&Number(P.cleared)>0;
const beastRarity=q=>q.legendary?'legendary':q.rare?'rare':'normal';
const BEAST_RARITY_LABELS=SoulbeastContent.BEAST_RARITY_LABELS();
function mistRarePool(zd){return [...zd.rare,...MIST_RARE_DEFS.filter(x=>x[4]===zd.id).map(x=>x[0])];}
function mistEncounter(zd,roll,P=S.P){
 let sp;
 if(!zd.train&&mistLegendsUnlocked(P)&&roll<.33*.10)sp=pick(MIST_LEGEND_DEFS.map(x=>x[0]));
 else if(roll<.33)sp=pick(mistRarePool(zd));else return null;
 const legendary=!!SP[sp].legendary,lv=legendary?clamp(Math.max(45,zd.lv[1]+R(0,2)),1,MAXLV):zd.lv[1]+R(0,2),e=wildUnit(sp,lv,0);
 e.rare=true;e.legendary=legendary;e.name=(legendary?'✦ ':'★ ')+e.name;return e;
}
function mistPortrait(key){
 const i=[...MIST_RARE_DEFS,...MIST_LEGEND_DEFS].findIndex(x=>x[0]===key);if(i<0)return '';
 return `<span class="mist-beast-art" role="img" aria-label="${esc(SP[key].n)}" style="--beast-x:${i%4*100/3}%;--beast-y:${Math.floor(i/4)*100/3}%"></span>`;
}
function mistLocations(k){const q=SP[k];if(q.legendary)return ['ม่านหมอกในป่าหลักทุกแห่ง · หลังชนะบอสจอมมารเท่านั้น · Lv 45–52'];if(q.mistNew){const z=ZN.find(z=>z.id===q.mistZone);return [z.n+' · ม่านหมอกเท่านั้น · Lv '+z.lv[1]+'–'+(z.lv[1]+2)];}return beastLocations(k);}
function bestiaryKeys(filter=S.ui.dexRarity||'all'){return Object.keys(SP).filter(k=>filter==='all'||beastRarity(SP[k])===filter).sort(compareBeastBook);}
fullBestiary=function(tabs){
 const P=S.P,filter=Object.hasOwn(BEAST_RARITY_LABELS,S.ui.dexRarity)?S.ui.dexRarity:'all',ks=bestiaryKeys(filter),all=Object.keys(SP);
 const controls=`<div class="rarity-filters" role="group" aria-label="กรองประเภทอสูร">${Object.entries(BEAST_RARITY_LABELS).map(([v,n])=>`<button class="btn sm ${filter===v?'pri':''}" data-a="dexRarity" data-v="${v}" aria-pressed="${filter===v}">${n}<span class="num">${v==='all'?all.length:bestiaryKeys(v).length}</span></button>`).join('')}</div>`;
 return `<div class="stack"><h2>สมุดอสูร · ${ks.length}/${all.length} ตัว</h2>${tabs}${controls}<p class="sub">ดูข้อมูลได้ทุกตัว ประวัติพบและจับยังนับจากการเล่นจริง · อสูรใหม่ทั้ง 16 ตัวมีร่างเดียวและสกิลเฉพาะตัว<br>อสูรในตำนาน: ค่าสถานะ +20% จากอสูรหายากคู่เทียบที่เลเวลและแต้มเท่ากัน</p>${!mistLegendsUnlocked(P)&&(filter==='all'||filter==='legendary')?'<div class="card legend-locked">✦ อสูรในตำนานยังไม่ปรากฏในโลก ต้องชนะบอสจอมมารก่อนจึงจะพบและผนึกได้ในม่านหมอก</div>':''}<div class="dex">${ks.map(k=>{const q=SP[k],locked=q.legendary&&!mistLegendsUnlocked(P)&&!Object.values(P.gachaLegendPets||{}).includes(k),loc=mistLocations(k);return `<article class="card stack rarity-${beastRarity(q)}"><b>${esc(q.n)}</b>${dexForms(k)}<div>${tChips(q.t)} <span class="chip">${q.noseal?'บอสพิเศษ · ผนึกไม่ได้':BEAST_RARITY_LABELS[beastRarity(q)]}</span>${q.mistNew?' <span class="chip">ร่างเดียว</span>':''}</div><small>${esc(q.o||'')} · ${esc(PAS[q.pas]?.n||'')}</small>${q.legendary?`<small class="legend-note">ค่าสถานะ +20% เทียบ ${esc(SP[q.rarePair].n)} · สกิลตำนานเฉพาะตัว</small>`:''}<small>คะแนนต่อเลเวล: ${q.rare?20:8} · เมื่อเป็นบอส: 30</small><small>พบที่: ${loc.map(esc).join('<br>')}</small><small>${locked?'ยังไม่ปลดล็อก':P.caught[k]?'จับแล้ว':P.seen[k]?'เคยพบ':'ยังไม่เคยพบ'}</small><details><summary>สกิล${q.sig?'และสกิลเฉพาะตัว':''}</summary>${q.sk.map(id=>skillRow(id)).join('')}${q.sig?skillRow(q.sig,true,'เฉพาะตัว · Lv '+SIGLV):''}</details><button class="btn sm" data-a="img" data-v="${k}">ใส่รูป</button></article>`}).join('')}</div></div>`;
};
handlers.dexRarity=v=>{if(!Object.hasOwn(BEAST_RARITY_LABELS,v))return;S.ui.dexRarity=v;render();};

const SIGNATURE_ART=SoulbeastContent.SIGNATURE_ART();
// Exactly one illustrated existing skill per profession; every eligible beast signature.
const signatureBasePicture=skillPicture;
skillPicture=function(u,sk,id){
 const art=SIGNATURE_ART[id];if(!art)return signatureBasePicture(u,sk,id);
 const x=art.index%8*100/7,y=Math.floor(art.index/8)*100/7,color=EL[sk?.el||'normal']?.c||'#e6bd65';
 const label=(art.kind==='job'?'ท่าเอกลักษณ์อาชีพ ':'สกิลเฉพาะตัว ')+art.owner;
 return `<span class="skill-picture skill-painted signature-picture" role="img" aria-label="${esc(sk?.n||id)} · ${esc(label)}" title="${esc(label)}" data-signature-owner="${esc(art.key)}" style="--skill-color:${color};--skill-x:${x}%;--skill-y:${y}%;--signature-atlas:url('assets/skills/signatures-${art.kind}.webp')"><i class="skill-paint" aria-hidden="true"></i><span class="skill-rank" aria-hidden="true">✦</span></span>`;
};


const GAME_TRANSLATIONS=SoulbeastContent.GAME_TRANSLATIONS();
const LANGUAGE_KEY='sealbeast_language_v1';
const LANGUAGE_NAMES=SoulbeastContent.LANGUAGE_NAMES();
let GAME_LANGUAGE='th';
try{const stored=localStorage.getItem(LANGUAGE_KEY);if(Object.hasOwn(LANGUAGE_NAMES,stored))GAME_LANGUAGE=stored;}catch(e){}
const LANGUAGE_KEYS=Object.keys(GAME_TRANSLATIONS.en).sort((a,b)=>b.length-a.length);
const LANGUAGE_PATTERN=new RegExp(LANGUAGE_KEYS.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
const LANGUAGE_TEXT_CACHE=new Map(),LANGUAGE_NODES=new WeakMap(),LANGUAGE_ATTRS=new WeakMap();
const LANGUAGE_MISSING=new Set();
function gameLocale(){return GAME_LANGUAGE==='en'?'en-US':GAME_LANGUAGE==='zh-CN'?'zh-CN':'th-TH';}
function languagePlayerNames(){
 const list=[S?.P?.name,...(PVP?.room?.players||[]).map(p=>p.name),...(CAMP?.room?.players||[]).map(p=>p.name),...(WORLD?.room?.players||[]).map(p=>p.name)];
 return [...new Set(list.filter(n=>typeof n==='string'&&n.length>1&&n!=='ผู้ผนึก'))].sort((a,b)=>b.length-a.length);
}
function translateGameText(value,lang=GAME_LANGUAGE,protectNames=true){
 const text=String(value??'');if(lang==='th'||!GAME_TRANSLATIONS[lang]||!/[ก-๙]/.test(text))return text;
 const held=[];let source=text;
 if(protectNames)for(const name of languagePlayerNames())if(source.includes(name)&&source.trim()!==name){const token='\uE000'+held.length+'\uE001';held.push(name);source=source.split(name).join(token);}
 const key=lang+'\n'+source;let out=LANGUAGE_TEXT_CACHE.get(key);
 if(out===undefined){
  out=source.replace(LANGUAGE_PATTERN,s=>lang==='en'?' '+(GAME_TRANSLATIONS[lang][s]||s)+' ':GAME_TRANSLATIONS[lang][s]||s);
  if(lang==='en')out=out.replace(/\s+/g,' ').replace(/\s+([,.!?])/g,'$1');
  if(/[ก-๙]/.test(out))LANGUAGE_MISSING.add(source);
  LANGUAGE_TEXT_CACHE.set(key,out);
 }
 return out.replace(/\uE000(\d+)\uE001/g,(_,i)=>held[Number(i)]||'');
}
function languagePanel(){return `<div class="card stack language-panel"><label for="gameLanguage"><b>ภาษา</b></label><select id="gameLanguage" aria-label="ภาษาที่ใช้แสดงผล">${Object.entries(LANGUAGE_NAMES).map(([value,label])=>`<option value="${value}" translate="no" ${GAME_LANGUAGE===value?'selected':''}>${label}</option>`).join('')}</select><small class="sub">ภาษาเปลี่ยนทันทีและบันทึกไว้ในเครื่องนี้</small></div>`;}
function setGameLanguage(lang){
 if(!Object.hasOwn(LANGUAGE_NAMES,lang))return false;
 GAME_LANGUAGE=lang;try{localStorage.setItem(LANGUAGE_KEY,lang);}catch(e){}
 render();applyGameLanguage(document.body);return true;
}
function languageSkip(el){return !el||!!el.closest('script,style,[contenteditable="true"],[translate="no"],[data-user-content]');}
function localizeGameElement(el){
 if(languageSkip(el))return;
 let attrs=LANGUAGE_ATTRS.get(el);if(!attrs){attrs={};LANGUAGE_ATTRS.set(el,attrs);}
 for(const key of ['title','placeholder','aria-label','alt']){
  const current=el.getAttribute(key);if(current==null)continue;
  let record=attrs[key];if(!record||record.last!==current)record=attrs[key]={source:current,last:current};
  const translated=translateGameText(record.source,GAME_LANGUAGE,false);
  if(current!==translated)el.setAttribute(key,translated);record.last=translated;
 }
}
function applyGameLanguage(root){
 if(typeof document.createTreeWalker!=='function'||!root)return;
 if(document.documentElement.lang!==GAME_LANGUAGE)document.documentElement.lang=GAME_LANGUAGE;
 const title=GAME_LANGUAGE==='en'?'Soulbeast Chronicles':GAME_LANGUAGE==='zh-CN'?'封兽传说':'ตำนานผนึกอสูร';
 if(document.title!==title)document.title=title;
 const elements=root.nodeType===1?[root,...root.querySelectorAll('*')]:[];
 for(const el of elements)localizeGameElement(el);
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while(node=walk.nextNode()){
  if(languageSkip(node.parentElement)||node.parentElement.closest('input,textarea'))continue;
  const current=node.nodeValue;if(!current?.trim())continue;
  let record=LANGUAGE_NODES.get(node);if(!record||record.last!==current)record={source:current,last:current};
  const translated=translateGameText(record.source);
  if(current!==translated)node.nodeValue=translated;record.last=translated;LANGUAGE_NODES.set(node,record);
 }
}
const languageBaseSettings=vSettings;
vSettings=function(){return languageBaseSettings().replace('<div class="achievement-grid">',languagePanel()+'<div class="achievement-grid">');};
const languageBaseStart=vStart;
vStart=function(){return `<div class="stack">${languagePanel()}${languageBaseStart()}</div>`;};
const languageBaseRender=render;
render=function(){languageBaseRender();applyGameLanguage(document.getElementById('app'));};
const languageBaseToast=toast;
toast=function(text){languageBaseToast(text);if(document.body?.querySelectorAll)for(const node of document.body.querySelectorAll('.toast'))applyGameLanguage(node);};
document.addEventListener('change',event=>{if(event.target?.id==='gameLanguage')setGameLanguage(event.target.value);});
if(typeof MutationObserver!=='undefined'&&document.body){
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='characterData')applyGameLanguage(record.target.parentElement);
   else for(const node of record.addedNodes)if(node.nodeType===1)applyGameLanguage(node);else if(node.nodeType===3)applyGameLanguage(node.parentElement);
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}


const WEAPON_ART=SoulbeastContent.WEAPON_ART();
const WEAPON_RARITY=SoulbeastContent.WEAPON_RARITY();
const weaponBaseItemIcon=itemIcon;
itemIcon=function(id,size=44){
 const art=WEAPON_ART[id];if(!art)return weaponBaseItemIcon(id,size);
 const lang=typeof GAME_LANGUAGE==='undefined'?'th':GAME_LANGUAGE,label=WEAPON_RARITY[art.rarity][lang]||WEAPON_RARITY[art.rarity].th;
 const name=typeof translateGameText==='function'?translateGameText(EQ[id].n,lang,false).trim():EQ[id].n;
 return `<span class="item-art weapon-unique weapon-${art.rarity}" role="img" aria-label="${esc(name+' · '+label)}" title="${esc(name+' · '+label)}" data-weapon-art="${esc(id)}" style="--item-size:${Math.max(28,Number(size)||44)}px;--weapon-x:${art.index%8*100/7}%;--weapon-y:${Math.floor(art.index/8)*100/6}%;--weapon-atlas:url('assets/weapons/${art.kind}.webp')"><i class="weapon-paint" aria-hidden="true"></i><small aria-hidden="true">${art.rarity==='crafted'?'◆':art.rarity==='eclipse'?'✹':'✦'}</small></span>`;
};
function weaponRarityLabel(it){return WEAPON_RARITY[it?.craft?'crafted':it?.worldLegend?'eclipse':'legendary'][typeof GAME_LANGUAGE==='undefined'?'th':GAME_LANGUAGE]||WEAPON_RARITY.legendary.th;}
const weaponBaseItemExtra=itemExtra;
itemExtra=function(it){const extra=weaponBaseItemExtra(it);return it?.slot==='weapon'&&(it.craft||it.legend)?` · <span class="weapon-rarity-label weapon-label-${it.craft?'crafted':it.worldLegend?'eclipse':'legendary'}" translate="no">${weaponRarityLabel(it)}</span>`+extra:extra;};
function weaponText(th,en,zh){return typeof GAME_LANGUAGE==='undefined'||GAME_LANGUAGE==='th'?th:GAME_LANGUAGE==='zh-CN'?zh:en;}
const weaponBaseBag=vBag;
vBag=function(){
 const ids=[...new Set(S.P.owned)].filter(id=>WEAPON_ART[id]);
 if(!ids.length)return weaponBaseBag();
 const card=`<div class="card stack"><div class="row"><h3 class="grow" translate="no">${weaponText('อาวุธหายากในกระเป๋า','Rare Weapons in Your Bag','背包中的稀有武器')}</h3><button class="btn sm" data-a="weaponEquipment" translate="no">${weaponText('หน้าสวมใส่','Equipment','装备')}</button></div><div class="lst">${ids.map(id=>{const it=EQ[id],a=WEAPON_ART[id],count=S.P.owned.filter(k=>k===id).length;return `<div class="row">${itemIcon(id,52)}<div class="grow"><b>${esc(it.n)}${count>1?' ×'+count:''}</b><div class="sub"><span class="weapon-rarity-label weapon-label-${a.rarity}" translate="no">${weaponRarityLabel(it)}</span> · Lv ${it.lv}</div></div></div>`}).join('')}</div></div>`;
 return weaponBaseBag().replace('</h2>','</h2>'+card);
};
handlers.weaponEquipment=()=>{S.ui.hero='gear';go('hero');};
// Keep the player's own name intact in the bag's vitals panel as well.
const weaponBaseBagVitals=bagVitals;
bagVitals=function(){return weaponBaseBagVitals().replace('<b>'+esc(S.P.name)+'</b>','<b data-user-content>'+esc(S.P.name)+'</b>');};

const GACHA_RATES=[['item',2000],['premium',1000],['beast',2000],['gear',2000],['craft',1500],['legendGear',1000],['rare',400],['legendBeast',30],['eternal',70]];
CON.eternalSeal={n:'ผนึกนิรันดร์',d:'ผนึกสำเร็จ100%กับอสูรที่จับได้ ไม่ใช้กับบอสที่ผนึกไม่ได้หรือในPVP',price:0,seal:Infinity,rareLoot:true};
function gachaCategory(roll,rarePity,legendPity){if(legendPity>=99)return 'legendBeast';if(rarePity>=9)return roll<30/430?'legendBeast':'rare';let at=0;for(const [key,weight]of GACHA_RATES){at+=weight;if(roll*10000<at)return key;}return 'eternal';}
function gachaPools(){const items=Object.keys(CON).filter(k=>!CON[k].rareLoot&&CON[k].price>=100),gear=Object.keys(EQ);return {item:items.filter(k=>CON[k].price<1000),premium:items.filter(k=>CON[k].price>=1000),beast:Object.keys(SP).filter(k=>!SP[k].noseal&&!SP[k].rare&&!SP[k].legendary),gear:gear.filter(k=>!EQ[k].legend&&!EQ[k].craft&&!EQ[k].special),craft:gear.filter(k=>EQ[k].craft),legendGear:gear.filter(k=>EQ[k].legend),rare:Object.keys(SP).filter(k=>SP[k].rare&&!SP[k].legendary&&!SP[k].noseal),legendBeast:Object.keys(SP).filter(k=>SP[k].legendary&&!SP[k].noseal),eternal:['eternalSeal']};}
function gachaGrant(P,rewards){P.items=P.items||{};P.owned=P.owned||[];P.pets=P.pets||[];P.gachaLegendPets=P.gachaLegendPets||{};for(const r of rewards){if(r.type==='item')P.items[r.key]=(P.items[r.key]||0)+1;else if(r.type==='gear'){P.owned.push(r.key);if(EQ[r.key].legend){P.legend=P.legend||{};P.legend[r.key]=1;}}else{const pet=JSON.parse(JSON.stringify(r.pet));if(P.pets.some(p=>p.uid===pet.uid))throw Error('pet uid collision');P.pets.push(pet);P.seen=P.seen||{};P.caught=P.caught||{};P.seen[pet.sp]=1;P.caught[pet.sp]=1;if(SP[pet.sp].legendary)P.gachaLegendPets[pet.uid]=pet.sp;}}return P;}

const COMMUNITY={busy:false,error:'',friends:[],online:[],incoming:null,serverTime:0,code:'',ready:false,match:null};
const GACHA={busy:false,coupons:null,totalDraws:0,rarePity:0,legendPity:0,rewards:[],error:'',pending:null};
const ct=(th,en,zh)=>GAME_LANGUAGE==='en'?en:GAME_LANGUAGE==='zh-CN'?zh:th;
const ctext=(th,en,zh)=>`<span translate="no">${ct(th,en,zh)}</span>`;
function communityError(message){const errors={
 'not enough coupons':['คูปองไม่พอ','Not enough coupons','兑换券不足'],'friends full':['เพื่อนเต็ม30คนแล้ว','Friend limit reached (30)','好友已满（30人）'],
 'friend offline':['เพื่อนออฟไลน์แล้ว','Your friend is offline','好友已离线'],'challenge expired':['คำท้าหมดอายุแล้ว','Challenge expired','挑战已过期'],
 'challenge cooldown':['รอ30วินาทีก่อนท้าครั้งถัดไป','Wait 30 seconds before another challenge','请等待30秒再发起挑战'],'challenge pending':['มีคำท้าที่รอคำตอบอยู่','A challenge is already pending','已有待回复的挑战'],
 'account banned':['บัญชีถูกระงับ กรุณาติดต่อผู้ดูแล','Account suspended. Contact the administrator.','账号已停用，请联系管理员'],
 'gacha stale':['เซฟอีกเครื่องมีผลสุ่มใหม่ โปรดโหลดเซฟออนไลน์ก่อน','New draw results exist. Load your online save first.','有新的抽奖结果，请先读取在线存档'],
 'finish other battle':['จบการต่อสู้หรือออกจากห้องเดิมก่อน','Finish your battle or leave the current room first','请先结束战斗或退出当前房间'],
 'pin':['PINไม่ตรงกับเซฟออนไลน์','Incorrect online save PIN','在线存档PIN错误'],'bad action':['ต้องอัปเดตเซิร์ฟเวอร์ก่อนใช้ระบบนี้','Update the server to use this feature','请先更新服务器'],
 'notfound':['บันทึกเซฟออนไลน์ก่อนใช้งาน','Save your game online first','请先在线保存游戏']};return errors[message]?ct(...errors[message]):ct('เชื่อมต่อไม่สำเร็จ: ','Connection failed: ','连接失败：')+String(message||'network');}
function communityAuth(){return {code:ensureCode(),pin:S.P.cpin||''};}
function communityBattleBusy(){return !!(S.zone||S.battle&&!S.battle.over||['waiting','lobby','active'].includes(PVP.room?.status)||['lobby','starting','active'].includes(WORLD.room?.status)||CAMP.room?.status==='active');}
async function communitySave(){if(S.battle&&!S.battle.over||GS.busy)throw Error('finish other battle');const r=await lbPost({action:'save',...communityAuth(),data:gsData(),name:S.P.name,clsName:CLS[S.P.cls].n,lv:S.P.lv});if(!r.ok)throw Error(r.error);applyAccount(r.account);S.P.gsAt=r.at;GS.lastAt=Date.now();GS.lastJson=gsData();if(r.coupons!=null)GACHA.coupons=r.coupons;return r;}
function communityApplyData(data){if(!data)return;const raw=JSON.parse(data),pin=S.P.cpin,code=ensureCode();if(!raw.P)throw Error('bad data');S.P=raw.P;S.P.code=code;S.P.cpin=pin;normalizePack();initDiscovery();save();GS.lastJson=gsData();}
function gachaPendingKey(){return 'sealbeast_gacha_pending_'+ensureCode();}
function gachaReadPending(){try{const p=JSON.parse(localStorage.getItem(gachaPendingKey())||'null');return p?.endpoint===SHEET_URL?p:null;}catch(e){return null;}}
function gachaStorePending(p){GACHA.pending=p;try{if(p)localStorage.setItem(gachaPendingKey(),JSON.stringify(p));else localStorage.removeItem(gachaPendingKey());}catch(e){}}
async function gachaCall(draw=0){if(GACHA.busy||COMMUNITY.busy||!S.P)return;if(!SHEET_URL){toast(communityError('bad action'));return;}if(communityBattleBusy()){toast(communityError('finish other battle'));return;}GACHA.busy=true;GACHA.error='';if(draw||gachaReadPending()){GACHA.rewards=[];ReleaseGacha.start();}render();try{let pending=gachaReadPending();if(draw||pending){if(!pending){await communitySave();pending={endpoint:SHEET_URL,request:crypto.randomUUID(),count:draw};gachaStorePending(pending);}const r=await lbPost({action:'gacha_draw',...communityAuth(),request:pending.request,count:pending.count});if(!r.ok)throw Error(r.error);communityApplyData(r.data);Object.assign(GACHA,{coupons:r.coupons,totalDraws:r.totalDraws,rarePity:r.rarePity,legendPity:r.legendPity,eclipseWeaponPity:r.eclipseWeaponPity,rewards:(r.rewards||[]).map(r=>r.type==='pet'?{...r,category:SP[r.key].legendary?'legendBeast':SP[r.key].rare?'rare':'beast'}:r)});gachaStorePending(null);await ReleaseGacha.finish(GACHA.rewards);}else{await communitySave();const r=await lbPost({action:'gacha_status',...communityAuth()});if(!r.ok)throw Error(r.error);Object.assign(GACHA,{coupons:r.coupons,totalDraws:r.totalDraws,rarePity:r.rarePity,legendPity:r.legendPity,eclipseWeaponPity:r.eclipseWeaponPity});}}catch(e){GACHA.error=communityError(e.message);toast(GACHA.error);}finally{ReleaseGacha.stop();GACHA.busy=false;render();}}
const GACHA_NAMES={item:['ไอเท็มทั่วไป','Common Items','普通物品'],premium:['ไอเท็มราคาแพง','Premium Items','高级物品'],beast:['อสูรทั่วไป','Common Beasts','普通妖兽'],gear:['อุปกรณ์ทั่วไป','Common Equipment','普通装备'],craft:['อุปกรณ์หลอม','Crafted Equipment','锻造装备'],legendGear:['อุปกรณ์ในตำนาน','Legendary Equipment','传说装备'],rare:['อสูรหายาก','Rare Beasts','稀有妖兽'],legendBeast:['อสูรในตำนาน','Legendary Beasts','传说妖兽'],eternal:['ผนึกนิรันดร์','Eternal Seal','永恒封印']};
function gachaRewardCard(r){const pet=r.type==='pet',name=pet?SP[r.key].n:r.type==='gear'?EQ[r.key].n:CON[r.key].n,art=pet?portrait(r.key,56):itemIcon(r.key,56),rare=['rare','legendBeast','legendGear','craft','eternal'].includes(r.category);return `<article class="card gacha-result ${rare?'gacha-special':''}">${art}<b>${esc(name)}</b><small translate="no">${ct(...GACHA_NAMES[r.category])}</small>${pet?`<small translate="no">${ct('Lv1 · ส่งเข้าค่าย','Lv1 · Sent to camp','Lv1 · 已送入营地')}</small>`:''}</article>`;}
function vGacha(){const pending=gachaReadPending(),locked=GACHA.busy||!SHEET_URL;return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('กาชาปองแห่งพันผนึก','Soulseal Gachapon','封印扭蛋')}</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="card stack gacha-machine ${GACHA.busy?'gacha-spinning':''}"><img class="gacha-machine-image" src="assets/ui/gachapon.webp" alt="ตู้กาชาปองอสูรและอาวุธตำนาน" width="480" height="320">${GACHA.busy?`<p class="gacha-busy-note" role="status" translate="no">${ct('กำลังตรวจคูปองและเปิดผนึก…','Checking coupons and opening soulseals…','正在核验兑换券并开启封印…')}</p>`:''}<h3 translate="no">${ct('ใช้คูปองเท่านั้น','Coupons Only','仅限兑换券')}</h3><b class="num" translate="no">${ct('คูปอง','Coupons','兑换券')}: ${GACHA.coupons==null?'—':fmt(GACHA.coupons)}</b><p translate="no">${ct('1คูปอง = 1ครั้ง · ไม่ใช้เหรียญหรือเงินจริง','1 coupon = 1 draw · No coin or cash payment','1张兑换券＝1次抽奖，不消耗金币或现金')}</p><div class="row wrap"><button class="btn pri" data-a="gachaDraw" data-v="1" ${locked||pending||GACHA.coupons==null||GACHA.coupons<1?'disabled':''} translate="no">${ct('สุ่ม1ครั้ง','Draw 1','抽1次')}</button><button class="btn seal" data-a="gachaDraw" data-v="10" ${locked||pending||GACHA.coupons==null||GACHA.coupons<10?'disabled':''} translate="no">${ct('สุ่ม10ครั้ง','Draw 10','抽10次')}</button><button class="btn" data-a="gachaRefresh" ${locked?'disabled':''} translate="no">${pending?ct('ตรวจผลสุ่มที่ค้าง','Recover Pending Draw','恢复待处理抽奖'):ct('ตรวจคูปอง','Refresh Coupons','刷新兑换券')}</button></div>${pending?`<small class="warn" translate="no">${ct('มีรายการรอตรวจผล กรุณากดตรวจผลก่อนเล่นต่อ ระบบจะไม่หักคูปองซ้ำ','A draw is pending. Recover it before continuing; coupons will not be charged twice.','有待处理的抽奖，请先恢复结果，不会重复扣券。')}</small>`:''}<small translate="no">${ct('การันตีหายากขึ้นไปในอีก','Rare or better within','稀有或以上保底剩余')} ${10-GACHA.rarePity} · ${ct('การันตีตำนานในอีก','Legendary within','传说保底剩余')} ${100-GACHA.legendPity}</small><small translate="no">${ct('สุ่มสะสมทั้งหมด','Total draws','累计抽奖')} ${fmt(GACHA.totalDraws)}</small></div>${GACHA.error?`<p class="warn" translate="no">${esc(GACHA.error)}</p>`:''}${GACHA.rewards.length?`<h3 translate="no">${ct('ผลการสุ่ม','Draw Results','抽奖结果')}</h3><p class="reward-note" translate="no">${ct('เรียงหมวดที่โอกาสออกน้อยก่อน · อัตราที่แสดงเป็นอัตราพื้นฐานก่อนการันตี','Rarest categories first · Rates are base rates before pity','低概率类别优先 · 所示为保底前基础概率')}</p>${GACHA.rewards.some(r=>['legendBeast','rare','legendGear','craft'].includes(r.category))?`<div class="gacha-congratulations" role="status" translate="no">✦ ${ct('ยินดีด้วย! คุณได้รับรางวัลพิเศษ','Congratulations! A special reward is yours!','恭喜！获得特别奖励！')} ✦</div>`:''}<div class="gacha-results">${gachaSortedRewards(GACHA.rewards).map((r,i)=>gachaRewardCard(r).replace('<article ',`<article style="--reward-index:${i}" `)).join('')}</div>`:''}<details class="card" open><summary translate="no">${ct('อัตราสุ่มและกติกา','Rates & Rules','概率与规则')}</summary><div class="stack">${GACHA_RATES.map(([key,w])=>`<div class="row"><span class="grow" translate="no">${ct(...GACHA_NAMES[key])}</span><b>${w/100}%</b></div>`).join('')}<p translate="no">${ct('อัตรารวม100% ก่อนการันตี · ไอเท็มทั่วไป100–999เหรียญ / ราคาแพงตั้งแต่1000เหรียญ · ครบ10ครั้งที่ยังไม่ออกหายากขึ้นไป การันตี1ตัว ครบ100ครั้งที่ยังไม่ออกตำนาน การันตีตำนาน1ตัว นับสะสมทั้งการกด1และ10ครั้ง การันตีตำนานมีลำดับก่อนและนับแทนหายากได้','Base rates total 100%. Common items cost 100–999 coins; premium items cost 1,000+. After 9 draws without a rare-or-better beast, the next is guaranteed. After 99 without a legendary beast, the next is guaranteed. Single and 10-draw pulls share counters. Legendary pity takes priority and also satisfies rare pity.','基础概率合计100%。普通物品价格100–999金币，高级物品1000金币起。连续9次未获得稀有以上妖兽，第10次保底；连续99次未获得传说妖兽，第100次保底。单抽与十连共用计数，传说保底优先且满足稀有保底。')}</p><p translate="no">${ct('อสูรจากกาชาเริ่มLv1และพักในค่าย ตำนานจากกาชาใช้ได้ทันที · ผนึกนิรันดร์จับสำเร็จ100%เฉพาะอสูรที่จับได้ ไม่จับบอสต้องห้ามหรือใช้ในPVP','Beasts arrive at Lv1 in camp. Gacha legends are usable immediately. Eternal Seals guarantee capture only for capturable beasts; forbidden bosses and PvP remain excluded.','扭蛋妖兽以Lv1进入营地，传说妖兽可立即使用。永恒封印仅对可捕获妖兽保证成功，不能捕获禁捕首领或用于PVP。')}</p><p translate="no">${ct('คูปอง: จอมมาร50%ครั้งละ1ใบ และบอสโลกคะแนนตั้งแต่500ขึ้นไป50%ครั้งละ1ใบ ตรวจยอดจากเซิร์ฟเวอร์','Coupons: Demon Lord 50% for 1; World Boss score 500+ also 50% for 1. Balances are checked on the server.','兑换券：魔王有50%概率掉落1张；世界首领积分达500以上有50%概率掉落1张。余额由服务器核验。')}</p></div></details></div>`;}
function weaponBookRarity(it){return it.craft?'craft':it.worldLegend?'eclipse':it.legend?'legend':'normal';}
const WEAPON_BOOK_FILTERS={all:['ทั้งหมด','All','全部'],normal:['ทั่วไป','Common','普通'],craft:['คราฟต์หายาก','Rare Crafted','稀有锻造'],legend:['ในตำนาน','Legendary','传说'],eclipse:['ตำนานสุริยคราส','Eclipse Legends','日蚀传说']};
function vWeaponBook(){const filter=S.ui.weaponRarity||'all',type=S.ui.weaponType||'all',all=Object.entries(EQ).filter(([,it])=>it.slot==='weapon'),list=all.filter(([,it])=>(filter==='all'||weaponBookRarity(it)===filter)&&(type==='all'||it.wt===type)).sort(compareWeaponBook);return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('ตำราอาวุธ','Weapon Guide','武器图鉴')} · ${list.length}/${all.length}</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="rarity-filters">${Object.entries(WEAPON_BOOK_FILTERS).map(([key,n])=>`<button class="btn ${filter===key?'pri':''}" data-a="weaponBookFilter" data-v="${key}" aria-pressed="${filter===key}" translate="no">${ct(...n)} <span class="num">${key==='all'?all.length:all.filter(([,it])=>weaponBookRarity(it)===key).length}</span></button>`).join('')}</div><label>${ctext('ประเภทอาวุธ','Weapon Type','武器种类')}<select id="weaponBookType"><option value="all" translate="no">${ct('ทุกประเภท','All Types','全部种类')}</option>${Object.entries(WT).map(([key,it])=>`<option value="${key}" ${type===key?'selected':''}>${it.n}</option>`).join('')}</select></label><div class="weapon-book-grid">${list.map(([id,it])=>`<article class="card stack"><div class="row">${itemIcon(id,64)}<div class="grow"><h3>${esc(it.n)}</h3><small>${WT[it.wt].n} · Lv ${it.lv}</small></div></div><div>${elChip(it.el)} <span translate="no">${ct(...WEAPON_BOOK_FILTERS[weaponBookRarity(it)])}</span></div><p class="sub">${statLine(it.st)}</p>${it.pas?`<div>${pasChip(it.pas)}<small>${PAS[it.pas].d}</small></div>`:''}${it.ws?`<details><summary>${ctext('สกิลอาวุธ','Weapon Skill','武器技能')}</summary>${skillRow(it.ws)}</details>`:''}<small translate="no">${ct('ได้จาก','Source','来源')}: ${it.craft?ct('หลอมจากชิ้นส่วนอสูร','Beast-material crafting','妖兽素材锻造'):it.worldLegend?ct('บอสโลก / จอมมาร / กาชา','World Boss / Demon Lord / Gacha','世界首领／魔王／扭蛋'):it.legend?ct('อุปกรณ์ตำนานประจำแผนที่ / กาชา','Zone legendary gear / Gacha','区域传说装备／扭蛋'):ct('ตลาดและรางวัล / กาชา','Shop and rewards / Gacha','商店与奖励／扭蛋')}</small></article>`).join('')}</div></div>`;}
function communityAvatar(p,size=48){return p.avatar?`<img class="friend-avatar" width="${size}" height="${size}" src="${esc(p.avatar)}" alt="">`:portrait('cls:'+p.cls,size);}
function communityFriendCard(p,friend){const elapsed=Math.max(0,COMMUNITY.serverTime-p.lastSave),when=p.lastSave?new Date(p.lastSave).toLocaleString(gameLocale()):ct('ไม่ทราบ','Unknown','未知');return `<article class="card row friend-card">${communityAvatar(p)}<div class="grow"><b data-user-content>${esc(p.name)}</b><small>Lv ${p.lv} · ${esc(CLS[p.cls]?.n||p.cls)}</small><small><i class="presence-dot ${p.online?'online':''}" aria-hidden="true"></i><span translate="no">${p.online?ct('ออนไลน์ · บันทึกใน5นาทีที่ผ่านมา','Online · Saved within 5 minutes','在线 · 5分钟内保存'):ct('ออฟไลน์ · บันทึกล่าสุด ','Offline · Last saved ','离线 · 最后保存 ')+when}</span></small></div><div class="stack friend-actions">${friend?`<button class="btn sm pri" data-a="friendChallenge" data-v="${p.id}" ${!p.online||COMMUNITY.busy?'disabled':''} translate="no">${ct('ท้าสู้','Challenge','挑战')}</button><button class="btn sm danger" data-a="friendRemove" data-v="${p.id}" ${COMMUNITY.busy?'disabled':''}>Unfriend</button>`:`<button class="btn sm" data-a="friendAdd" data-v="${p.id}" ${COMMUNITY.busy||COMMUNITY.friends.length>=30?'disabled':''} translate="no">${ct('เพิ่มเพื่อน','Add Friend','添加好友')}</button>`}</div></article>`;}
function vFriends(){return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('รายชื่อเพื่อน','Friend List','好友列表')} ${COMMUNITY.friends.length}/30</h2><button class="btn sm" data-a="communityRefresh" ${COMMUNITY.busy?'disabled':''} translate="no">${ct('รีเฟรช','Refresh','刷新')}</button></div><p class="sub" translate="no">${ct('ไฟเขียวหมายถึงมีการบันทึกออนไลน์ใน5นาทีที่ผ่านมา คำท้าหมดอายุภายใน60วินาที','A green dot means an online save within 5 minutes. Challenges expire after 60 seconds.','绿灯表示5分钟内在线保存过。挑战将在60秒后过期。')}</p>${COMMUNITY.error?`<p class="warn" translate="no">${esc(COMMUNITY.error)}</p>`:''}<div class="stack">${COMMUNITY.friends.map(p=>communityFriendCard(p,true)).join('')||`<p translate="no">${ct('ยังไม่มีเพื่อน','No friends yet','暂无好友')}</p>`}</div><h3 translate="no">${ct('ผู้เล่นที่ออนไลน์ทั้งหมด','All Online Players','所有在线玩家')} · ${COMMUNITY.online.length}</h3><div class="stack">${COMMUNITY.online.map(p=>communityFriendCard(p,COMMUNITY.friends.some(f=>f.id===p.id))).join('')||`<p translate="no">${ct('ยังไม่มีผู้เล่นอื่นออนไลน์','No other players online','暂无其他玩家在线')}</p>`}</div></div>`;}
async function communityCall(action='social_sync',extra={},saveFirst=false){if(COMMUNITY.busy||GACHA.busy||!S.P||!SHEET_URL)return;COMMUNITY.busy=true;COMMUNITY.error='';try{if(saveFirst)await communitySave();const r=await lbPost({action,...communityAuth(),...extra});if(!r.ok)throw Error(r.error);Object.assign(COMMUNITY,{friends:r.friends||[],online:r.online||[],incoming:r.incoming,serverTime:r.serverTime||Date.now(),ready:true,code:ensureCode()});if(r.match&&!communityBattleBusy()){PVP.code=ensureCode();PVP.pending=null;pvpReceive(r.match);S.screen='pvp';await lbPost({action:'friend_ack',...communityAuth(),invite:r.match.invite});COMMUNITY.incoming=null;pvpSessionSave();pvpSchedule();}if(action==='friend_challenge')toast(ct('ส่งคำท้าแล้ว','Challenge sent','已发送挑战'));}catch(e){COMMUNITY.error=communityError(e.message);if(action!=='social_sync'||S.screen==='friends')toast(COMMUNITY.error);}finally{COMMUNITY.busy=false;if(S.screen==='friends'||S.screen==='pvp'||COMMUNITY.incoming)render();}}
function communityChallengeOverlay(){const incoming=COMMUNITY.incoming;if(!incoming?.from||incoming.expires<(COMMUNITY.serverTime||Date.now())||communityBattleBusy()||S.ui.confirm)return '';const p=incoming.from;return `<div class="overlay community-invite"><div class="card stack" role="dialog" aria-modal="true"><h3 translate="no">${ct('มีเพื่อนท้าประลอง','A Friend Challenges You','好友邀请对战')}</h3><div class="row">${communityAvatar(p,64)}<div><b data-user-content>${esc(p.name)}</b><small>Lv ${p.lv} · ${esc(CLS[p.cls]?.n||p.cls)}</small></div></div><p translate="no">${ct('ยอมรับเพื่อสร้างและเข้าห้องPVPพร้อมกัน จากนั้นยืนยันทีมในห้อง','Accept to create and enter a PvP room together, then confirm your teams in the lobby.','接受后双方自动进入PVP房间，然后在大厅确认队伍。')}</p><div class="row"><button class="btn pri" data-a="friendAccept" data-v="${incoming.id}" ${COMMUNITY.busy?'disabled':''} translate="no">${ct('ตกลง','Accept','接受')}</button><button class="btn" data-a="friendDecline" data-v="${incoming.id}" ${COMMUNITY.busy?'disabled':''} translate="no">${ct('ยกเลิก','Decline','拒绝')}</button></div></div></div>`;}
const communityBaseTown=vTown;
vTown=function(){return communityBaseTown()+`<div class="community-links"><button class="card btn" data-a="go" data-v="weaponbook" translate="no">⚔ ${ct('ตำราอาวุธ','Weapon Guide','武器图鉴')}</button><button class="card btn" data-a="go" data-v="gacha" translate="no">✦ ${ct('กาชาปอง','Gachapon','扭蛋')}</button><button class="card btn" data-a="go" data-v="friends" translate="no">♟ ${ct('เพื่อนและผู้เล่นออนไลน์','Friends & Online Players','好友与在线玩家')}</button></div>`;};
const communityBaseGo=go;
go=function(screen){if(GACHA.busy){toast(ct('กำลังตรวจผลสุ่ม กรุณารอสักครู่','Checking draw results, please wait','正在核验抽奖结果，请稍候'));return;}if(['gacha','friends'].includes(screen)&&communityBattleBusy()){toast(communityError('finish other battle'));return;}communityBaseGo(screen);if(screen==='gacha')gachaCall();if(screen==='friends')communityCall('social_sync',{},true);};
const communityBaseRender=render;
render=function(){communityBaseRender();const app=document.getElementById('app');if(app?.insertAdjacentHTML)app.insertAdjacentHTML('beforeend',communityChallengeOverlay());applyGameLanguage(app);};
const communityBaseSettings=vSettings;
vSettings=function(){return communityBaseSettings()+`<div class="card row wrap"><button class="btn" data-a="go" data-v="weaponbook" translate="no">${ct('ตำราอาวุธ','Weapon Guide','武器图鉴')}</button><button class="btn" data-a="go" data-v="friends" translate="no">${ct('รายชื่อเพื่อน','Friend List','好友列表')}</button></div>`;};
handlers.gachaDraw=n=>gachaCall(Number(n));handlers.gachaRefresh=()=>gachaCall();
handlers.weaponBookFilter=v=>{if(!Object.hasOwn(WEAPON_BOOK_FILTERS,v))return;S.ui.weaponRarity=v;render();};
document.addEventListener('change',event=>{if(event.target?.id==='weaponBookType'){S.ui.weaponType=event.target.value;render();}});
handlers.communityRefresh=()=>communityCall('social_sync',{},true);
handlers.friendAdd=v=>communityCall('friend_add',{target:v});handlers.friendRemove=v=>communityCall('friend_remove',{target:v});
handlers.friendChallenge=v=>{if(communityBattleBusy())return toast(communityError('finish other battle'));communityCall('friend_challenge',{target:v},true);};
handlers.friendAccept=v=>{if(communityBattleBusy())return toast(communityError('finish other battle'));communityCall('friend_accept',{invite:v},true);};
handlers.friendDecline=v=>communityCall('friend_decline',{invite:v});
const communityBaseItemIcon=itemIcon;
itemIcon=function(id,size=44){if(id==='eternalSeal')return `<span class="eternal-seal-art">${communityBaseItemIcon('seal5',size)}<small>∞</small></span>`;return communityBaseItemIcon(id,size);};
const communityBaseGsSave=gsSave;
gsSave=async function(manual,newPin){if(GACHA.busy)return;return communityBaseGsSave(manual,newPin);};
const communityBaseLbPost=lbPost;
lbPost=async function(body){return communityBaseLbPost(body.id&&!body.code&&S.P?{...body,...communityAuth()}:body);};
const communityBaseSheetError=sheetError;
sheetError=function(r){return ['gacha stale','account banned','clear count jump'].includes(r?.error)?communityError(r.error):communityBaseSheetError(r);};
setInterval(()=>{if(!S.P||!SHEET_URL||document.hidden||COMMUNITY.busy||GACHA.busy||ONLINE_UI.count)return;if(COMMUNITY.code&&COMMUNITY.code!==ensureCode()){COMMUNITY.friends=[];COMMUNITY.online=[];COMMUNITY.incoming=null;COMMUNITY.ready=false;}communityCall();if(!S.zone&&!S.battle&&Date.now()-GS.lastAt>120000)gsSave(false);},60000);

/* Presentation only: server receipts, odds, inventory and save schema remain unchanged. */
const ReleaseGacha={charging:null,
 start(){this.stop();this.started=Date.now();ExtraAudio.play('charge');this.charging=Music.tracks.a1||null;},
 stop(){if(this.charging){this.charging.audio.pause();this.charging.audio.currentTime=0;}this.charging=null;},
 async finish(rewards){const wait=Math.max(0,1200-(Date.now()-(this.started||Date.now())));if(wait&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)await new Promise(resolve=>setTimeout(resolve,wait));this.stop();const cats=new Set(rewards.map(r=>r.category));ExtraAudio.play(cats.has('legendBeast')||cats.has('legendGear')||cats.has('rare')||cats.has('craft')?'specialRewardFx':'quest');}
};
function gachaSortedRewards(rewards){const weights=Object.fromEntries(GACHA_RATES);return rewards.map((r,i)=>({r,i})).sort((a,b)=>(weights[a.r.category]??10000)-(weights[b.r.category]??10000)||a.i-b.i).map(x=>x.r);}
function releaseArtButton(screen,image,title,sub){return `<button class="release-art-button" data-a="go" data-v="${screen}"><img src="assets/ui/${image}.webp" alt="" loading="lazy"><span><b translate="no">${title}</b><small translate="no">${sub}</small></span></button>`;}
const releaseTown=vTown;
vTown=function(){return releaseTown().replace(/<div class="community-links">[\s\S]*?<\/div>$/,'')+`<div class="release-menu">${releaseArtButton('gacha','gachapon',ct('กาชาปองแห่งพันผนึก','Soulseal Gachapon','封印扭蛋'),ct('ลุ้นอสูรและอาวุธตำนาน · ใช้คูปอง','Legendary beasts & weapons · Coupons only','传说妖兽与武器 · 仅限兑换券'))}${releaseArtButton('guide','handbook',ct('คู่มือผู้ผนึก','Soulkeeper Handbook','封印师指南'),ct('วิธีเล่น · สมุดอสูร · อาวุธ · อาชีพ','How to play · Beasts · Weapons · Classes','玩法 · 妖兽 · 武器 · 职业'))}</div>`;};
function guideBack(){return `<button class="btn sm" data-a="go" data-v="guide" translate="no">${ct('กลับคู่มือ','Back to Handbook','返回指南')}</button>`;}
function vGuide(){const steps=[
 [portrait('player',64),['เตรียมตัวก่อนเข้าป่า','Prepare for the forest','探索前准备'],['ซื้อยาและผนึกที่ตลาด ตรวจ HP/MP และอุปกรณ์ เลือกป่าเริ่มต้นให้เหมาะกับเลเวล','Buy medicine and seals. Check HP/MP and equipment, then choose a forest suited to your level.','购买药品和封印，检查生命、魔力及装备，选择适合等级的森林。']],
 [portrait('goblin',64),['สำรวจ ต่อสู้ และผนึก','Explore, battle and seal','探索、战斗与封印'],['เลือกทางเดิน ใช้สกิลตามธาตุ ลด HP อสูรแล้วใช้ผนึกกับตัวที่จับได้ ระวังบอสที่ห้ามจับ','Choose a path, use elemental skills, weaken a capturable beast and use a seal. Some bosses cannot be captured.','选择路线，利用属性技能削弱可捕获妖兽后使用封印；部分首领无法捕获。']],
 [portrait('kappa',64),['จัดคู่หูและค่าย','Manage companions and camp','管理伙伴与营地'],['เลือกคู่หูออกสู้ เก็บอสูรสำรองในผนึก และพักตัวอื่นในค่าย แพ้โจรป่าอาจเสียเฉพาะตัวสำรองในกระเป๋า','Choose active companions, carry sealed reserves and rest others at camp. Bandits can steal only bag reserves after defeat.','选择出战伙伴、携带封印后备，其余留营。败给强盗时仅背包后备可能被偷。']],
 [portrait('cls:'+S.P.cls,64),['เติบโต หลอม และเลื่อนอาชีพ','Grow, forge and promote','成长、锻造与转职'],['ใช้แต้มสถานะ ติดอุปกรณ์ และหลอมชิ้นส่วนอสูร เลื่อนอาชีพเมื่อถึง Lv25 และ Lv40 การเลือกสายย้อนกลับไม่ได้','Spend stat points, equip gear and forge beast materials. Promote at Lv25 and Lv40; branch choices are permanent.','分配属性点，穿戴装备并使用妖兽素材锻造。25级、40级转职，分支选择不可撤回。']],
 [itemIcon('seal5',64),['จอมมาร ม่านหมอก และกาชา','Demon Lord, mist and gachapon','魔王、迷雾与扭蛋'],['ชนะจอมมารเพื่อปลดล็อกตำนานในม่านหมอก เมื่อพบอสูรในหมอกจะเป็นหายาก90%/ตำนาน10% ตำนานจากกาชาใช้ได้ทันที คูปองมีโอกาสดรอป50%จากจอมมาร และบอสโลกเมื่อคะแนนถึง500','Defeat the Demon Lord to unlock mist legends: beast encounters are 90% rare / 10% legendary. Gacha legends work immediately. Demon Lord and World Boss score500+ each offer a 50% coupon drop.','击败魔王解锁迷雾传说：妖兽遭遇中稀有90%、传说10%。扭蛋传说可立即使用。魔王及世界首领积分500以上均有50%概率掉券。']],
 [portrait('cls:paladin',64),['บันทึกออนไลน์และเล่นกับเพื่อน','Save online and play with friends','在线存档与好友'],['บันทึกออนไลน์ในตั้งค่า เก็บรหัสและ PIN ไว้เป็นส่วนตัว ปุ่มเพื่อนอยู่ข้างตั้งค่า เพื่อนออนไลน์คือบันทึกใน5นาทีล่าสุด รับคำท้าเพื่อเข้าห้องPVPแล้วตรวจทีมก่อนพร้อมสู้','Save online in Settings; keep your code and PIN private. Friends is beside Settings. Online means saved within5minutes. Accept a challenge to enter PvP, then check your team and ready up.','在设置中在线保存，保管好存档码和PIN。好友位于设置旁，5分钟内保存视为在线。接受挑战进入PVP，检查队伍后准备。']]
 ];return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('คู่มือผู้ผนึก','Soulkeeper Handbook','封印师指南')}</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="guide-catalogs">${[['bestiary','สมุดอสูร','Bestiary','妖兽图鉴'],['weaponbook','ตำราอาวุธ','Weapon Guide','武器图鉴'],['classes','สายอาชีพและสกิล','Classes & Skills','职业与技能']].map(([k,...n])=>`<button class="btn" data-a="go" data-v="${k}" translate="no">${ct(...n)} →</button>`).join('')}</div><h3 translate="no">${ct('เริ่มผจญภัยใน 6 ขั้นตอน','Your adventure in 6 steps','六步开始冒险')}</h3>${steps.map(([art,title,body],i)=>`<article class="card guide-step"><div class="guide-visual"><span>${i+1}</span>${art}</div><div><h3 translate="no">${ct(...title)}</h3><p translate="no">${ct(...body)}</p></div></article>`).join('')}</div>`;}
function vGuideBestiary(){return fullBestiary(guideBack());}
function vGuideClasses(){return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('สายอาชีพและสกิล','Classes & Skills','职业与技能')}</h2>${guideBack()}</div>${vClassTree()}</div>`;}
const releaseWeaponBook=vWeaponBook;
vWeaponBook=function(){return releaseWeaponBook().replace('<button class="btn sm" data-a="go" data-v="town">กลับเมือง</button>',guideBack());};
const releaseSettings=vSettings;
vSettings=function(){return releaseSettings().replace(/<div class="card row wrap"><button class="btn" data-a="go" data-v="weaponbook"[\s\S]*?<\/div>$/,'')+`<div class="card">${releaseArtButton('guide','handbook',ct('คู่มือผู้ผนึก','Soulkeeper Handbook','封印师指南'),ct('วิธีเล่นและข้อมูลเกม','How to play & game reference','玩法与游戏资料'))}</div>`;};
const releaseGo=go;
go=function(screen){ReleaseGacha.stop();releaseGo(screen);};
handlers.teamtab=(tab)=>{if(tab==='dex'){go('bestiary');return;}S.ui.team=tab;S.ui.petView=null;render();};
handlers.herotab=(tab)=>{if(tab==='tree'){go('classes');return;}S.ui.hero=tab;render();};
const releaseRender=render;
render=function(){releaseRender();if(S.screen==='gacha'&&!GACHA.busy&&GACHA.rewards.length&&ReleaseGacha.revealed!==GACHA.rewards){ReleaseGacha.revealed=GACHA.rewards;document.querySelector('.gacha-congratulations,.gacha-results')?.scrollIntoView?.({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}};

/* Visual update only; the server remains authoritative for coupons and draw receipts. */
function beastFrameKind(key){const sp=SP[key];return !sp?'':sp.legendary?'legend':sp.rare?'rare':(sp.ev?.length||0)>=2?'three':sp.ev?.length===1?'two':'one';}
const BEAST_FRAME_LABELS={legend:['ตำนาน · กรอบทอง','Legendary · Gold frame','传说 · 金框'],rare:['หายาก · กรอบม่วง','Rare · Purple frame','稀有 · 紫框'],three:['ทั่วไป 3 ร่าง · กรอบฟ้า','Common, 3 forms · Blue frame','普通，3形态 · 蓝框'],two:['ทั่วไป 2 ร่าง · กรอบเขียว','Common, 2 forms · Green frame','普通，2形态 · 绿框'],one:['ทั่วไป 1 ร่าง · กรอบขาว','Common, 1 form · White frame','普通，1形态 · 白框']};
const ornatePortrait=portrait;
portrait=function(key,size,opts={}){const html=ornatePortrait(key,size,opts),kind=beastFrameKind(key);if(!kind)return html;return html.replace('class="pt ',`data-beast-rarity="${kind}" title="${esc(ct(...BEAST_FRAME_LABELS[kind]))}" class="pt beast-frame frame-${kind} `);};
function beastFrameLegend(){return `<div class="card stack"><h3 translate="no">${ct('สีกรอบรูปอสูร','Beast portrait frames','妖兽头像边框')}</h3><div class="frame-key">${Object.entries(BEAST_FRAME_LABELS).map(([k,n])=>`<span class="frame-key-${k}" translate="no">◆ ${ct(...n)}</span>`).join('')}</div></div>`;}
const ELEMENT_PICTURES=SoulbeastContent.ELEMENT_PICTURES();
function vGuideElements(){return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('ตารางธาตุและรูปธาตุ','Elements & Type Chart','属性图示与克制表')}</h2>${guideBack()}</div><p translate="no">${ct('รูปเล็กบนสกิล อาวุธ และอสูรบอกธาตุ ไม่ใช่ระดับความหายาก ดูชื่อธาตุคู่กับรูปด้านล่าง แล้วอ่านตารางโดยเริ่มจากธาตุของท่าโจมตี','Icons on skills, weapons and beasts identify elements. Rarity is shown by portrait frames. Match each icon to its name below; read the chart from the attack element.','技能、武器和妖兽上的小图表示属性，头像边框表示稀有度。下方可查看每种图示对应的属性；克制表以攻击属性为起点。')}</p><div class="element-key">${Object.entries(EL).map(([k,e])=>`<div class="card element-key-card">${elementIcon(k)}<div><b>${esc(e.n)}</b><small translate="no">${ct(...ELEMENT_PICTURES[k])}</small></div></div>`).join('')}</div><div class="card"><p translate="no">${ct('×2 = ได้เปรียบ · ×½ = ถูกต้าน · ×0 = ไม่มีผล · ธาตุที่ไม่ระบุมีผล ×1 อสูรสองธาตุคูณตัวคูณเข้าด้วยกัน เช่น ×2 กับ ×½ จะเหลือ ×1','×2 = super effective · ×½ = resisted · ×0 = no effect · Unlisted matchups are ×1. Multiply both types for dual-type targets: ×2 and ×½ gives ×1.','×2：克制 · ×½：抵抗 · ×0：无效 · 未列出的关系为×1。双属性目标需相乘，例如×2与×½相乘后为×1。')}</p></div>${vChart()}${beastFrameLegend()}</div>`;}
const ornateGuide=vGuide;
vGuide=function(){return ornateGuide().replace('<div class="guide-catalogs">',`<div class="guide-catalogs"><button class="btn" data-a="go" data-v="elements" translate="no">${ct('ตารางธาตุและรูปธาตุ','Elements & Type Chart','属性图示与克制表')} →</button>`);};
const ornateBestiary=vGuideBestiary;
vGuideBestiary=function(){return ornateBestiary()+beastFrameLegend();};
const ornateTeamTab=handlers.teamtab;
handlers.teamtab=function(tab){if(tab==='chart'){go('elements');return;}ornateTeamTab(tab);};
const ornateTeam=vTeam;
vTeam=function(){if(S.ui.team==='chart')S.ui.team='team';return ornateTeam();};
const ornateStart=ReleaseGacha.start,ornateStop=ReleaseGacha.stop;
ReleaseGacha.start=function(){ornateStart.call(this);this.active=true;};
ReleaseGacha.stop=function(){ornateStop.call(this);this.active=false;};
function gachaDrawOverlay(){return `<div class="gacha-draw-overlay" role="dialog" aria-modal="true" aria-labelledby="gachaWaitTitle" tabindex="-1"><div class="gacha-draw-panel"><div class="summoning-art" aria-hidden="true"><i class="summoning-ring ring-outer"></i><i class="summoning-ring ring-inner"></i><img src="assets/ui/soulseal-summoning.webp" alt="" width="480" height="480"><span class="summoning-spark spark-one">✦</span><span class="summoning-spark spark-two">✦</span><span class="summoning-spark spark-three">✧</span></div><h2 id="gachaWaitTitle" translate="no">${ct('กรุณารอ ระบบกำลังจับรางวัล','Please wait — drawing your rewards','请稍候，系统正在抽取奖励')}</h2><p role="status" aria-live="polite" translate="no">${ct('กำลังเปิดผนึกแห่งโชคชะตา…','Opening the seals of destiny…','正在开启命运封印…')}</p><div class="summoning-progress" aria-hidden="true"><i></i></div><small translate="no">${ct('โดยทั่วไปประมาณ 10 วินาที แต่อาจนานกว่านี้ตามการเชื่อมต่อ กรุณาเปิดหน้านี้ไว้จนผลปรากฏ','Usually about 10 seconds; connection speed may affect the wait. Keep this page open until your rewards appear.','通常约需10秒，实际时间取决于连接情况。请保持此页面打开，直到奖励显示。')}</small></div></div>`;}
const ornateRender=render;
render=function(){ornateRender();if(GACHA.busy&&ReleaseGacha.active){const app=document.getElementById('app');if(app?.insertAdjacentHTML){app.insertAdjacentHTML('beforeend',gachaDrawOverlay());for(const child of app.children||[])if(!child.classList.contains('gacha-draw-overlay'))child.inert=true;app.querySelector('.gacha-draw-overlay')?.focus?.({preventScroll:true});}}};

/* Zone encounter lists are the source of truth for forest rare species.
   Shared verbatim by browser and Apps Script: no stat/skill/save migration. */
const RARITY_CORRECTED_IDS=[];
for(const id of new Set(ZN.flatMap(zone=>zone.rare||[]))){
 const beast=SP[id];
 if(beast&&!beast.legendary&&!beast.rare){beast.rare=1;RARITY_CORRECTED_IDS.push(id);}
}

const ONLINE_UI={count:0,label:'',retry:false},ONLINE_NET={queue:[],running:false,sequence:0};
function onlineMessage(error){const text=String(error?.message||error||'');return ({busy:ct('ระบบกำลังมีผู้ใช้งานพร้อมกัน กรุณารอสักครู่แล้วลองอีกครั้ง','The server is busy. Please wait a moment and retry.','服务器繁忙，请稍候重试。'),'room too big':ct('ข้อมูลห้องมีขนาดใหญ่เกินไป กรุณาตรวจสถานะห้องอีกครั้ง','Room data is too large. Please check the room status.','房间数据过大，请重新查看状态。'),'room not found':ct('ไม่พบห้องหรือห้องปิดไปแล้ว','Room not found or already closed','房间不存在或已关闭'),'world pets':ct('เลือกอสูรที่พกติดตัวก่อนสร้างห้อง','Select a carried beast before creating a room','创建房间前请选择携带妖兽'),'not lobby':ct('ห้องเริ่มแล้วหรือปิดไปแล้ว','Room started or closed','房间已开始或关闭'),'world weekly limit':ct('ใช้สิทธิ์บอสโลกครบ 3 ครั้งในสัปดาห์นี้แล้ว','All 3 weekly World Boss entries are used','本周3次世界首领次数已用完'),'world ready':ct('ทุกคนต้องยืนยันพร้อมก่อนเริ่ม','Everyone must be ready before starting','所有玩家准备后才能开始'),'finish other battle':ct('จบการต่อสู้อื่นและออกจากป่าก่อน','Finish other battles and leave the forest first','请先结束其他战斗并离开森林'),'pin':ct('PIN ไม่ตรงกับเซฟออนไลน์','Online save PIN does not match','在线存档PIN不匹配')})[text]||text;}
const ONLINE_LABELS={wb_create:['กำลังสร้างปาร์ตี้บอสโลก','Creating a World Boss party','正在创建世界首领队伍'],wb_join:['กำลังเข้าร่วมปาร์ตี้','Joining the party','正在加入队伍'],wb_leave:['กำลังออกจากห้อง','Leaving the room','正在退出房间'],wb_start:['กำลังประมวลผลการต่อสู้บอสโลก','Processing the World Boss battle','正在处理世界首领战斗'],wb_ready:['กำลังยืนยันความพร้อม','Confirming readiness','正在确认准备'],save:['กำลังบันทึกเซฟออนไลน์','Saving online','正在保存在线存档'],load:['กำลังโหลดเซฟออนไลน์','Loading online save','正在读取在线存档']};
function onlineOverlay(){return `<div class="online-wait-overlay" role="dialog" aria-modal="true" aria-labelledby="onlineWaitTitle" tabindex="-1"><div class="gacha-draw-panel"><div class="online-hourglass" aria-hidden="true"><img src="assets/ui/online-hourglass.webp" alt="" width="280" height="280"><i></i></div><h2 id="onlineWaitTitle" translate="no">${ONLINE_UI.label||ct('กรุณารอ ระบบกำลังดำเนินการ','Please wait — processing your request','请稍候，系统正在处理请求')}</h2><p role="status" aria-live="polite" translate="no">${ONLINE_UI.retry?ct('ระบบกำลังตรวจสถานะและลองเชื่อมต่ออีกครั้ง…','Checking the status and reconnecting…','正在核验状态并重新连接…'):ct('กรุณารอการตอบกลับจากระบบ…','Waiting for the server response…','正在等待服务器响应…')}</p><div class="summoning-progress" aria-hidden="true"><i></i></div><small translate="no">${ct('กรุณาเปิดหน้านี้ไว้ ระบบกำลังตรวจและบันทึกรายการให้ครบถ้วน','Keep this page open while the server checks and completes your request.','请保持页面打开，服务器正在核验并完成请求。')}</small></div></div>`;}
function onlineShow(){if(!ONLINE_UI.count||GACHA.busy)return;const app=document.getElementById('app');if(!app?.insertAdjacentHTML||app.querySelector('.online-wait-overlay'))return;app.insertAdjacentHTML('beforeend',onlineOverlay());for(const el of app.children||[])if(!el.classList.contains('online-wait-overlay'))el.inert=true;app.querySelector('.online-wait-overlay')?.focus?.({preventScroll:true});}
async function withOnline(label,fn){const first=!ONLINE_UI.count;ONLINE_UI.count++;if(first){ONLINE_UI.label=ct(...(ONLINE_LABELS[label]||['กรุณารอ ระบบกำลังดำเนินการ','Please wait — processing your request','请稍候，系统正在处理请求']));ONLINE_UI.retry=false;}onlineShow();try{return await fn();}finally{ONLINE_UI.count--;if(!ONLINE_UI.count){document.querySelector('.online-wait-overlay')?.remove?.();const app=document.getElementById('app');for(const el of app?.children||[])el.inert=false;ONLINE_UI.retry=false;}else onlineShow();}}
const reliabilityRender=render;render=function(){reliabilityRender();onlineShow();};
function onlinePause(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function onlineFetch(options,foreground){for(let attempt=0;attempt<3;attempt++){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),foreground?60000:25000);
 try{const response=await fetch(SHEET_URL,{...options,signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const result=await response.json();if(!result||typeof result.ok!=='boolean')throw Error('Invalid response');if(result.error==='busy'&&attempt<2){ONLINE_UI.retry=true;await onlinePause(700+attempt*700+Math.floor(Math.random()*300));continue;}return result.error==='busy'?{...result,error:onlineMessage('busy')}:result;
 }catch(error){const failure=Error(ct('การตอบกลับขาดหายหรือใช้เวลานาน ระบบจะตรวจสถานะห้องให้ หากยังไม่สำเร็จให้กดตรวจข้อมูลอีกครั้ง','The response was interrupted or timed out. The room status will be checked; refresh its status if needed.','响应中断或超时，系统将核验房间状态；必要时请刷新状态。'));failure.onlineTransport=true;throw failure;}finally{clearTimeout(timer);}
}}
async function onlineDrain(){if(ONLINE_NET.running)return;ONLINE_NET.running=true;try{while(ONLINE_NET.queue.length){ONLINE_NET.queue.sort((a,b)=>a.priority-b.priority||a.order-b.order);const job=ONLINE_NET.queue.shift();try{job.resolve(await onlineFetch(job.options,job.priority===0));}catch(e){job.reject(e);}}}finally{ONLINE_NET.running=false;}}
sheetRequest=function(options){return new Promise((resolve,reject)=>{ONLINE_NET.queue.push({options,priority:ONLINE_UI.count||GACHA.busy?0:1,order:ONLINE_NET.sequence++,resolve,reject});onlineDrain();});};
const WORLD_NET={current:null,foreground:false};
function worldIntentKey(){return 'sealbeast_world_intent_'+ensureCode();}
function worldReadIntent(){try{const p=JSON.parse(localStorage.getItem(worldIntentKey())||'null');return p?.endpoint===SHEET_URL&&['wb_create','wb_join','wb_leave','wb_start'].includes(p.action)?p:null;}catch(e){return null;}}
function worldSaveIntent(intent){try{if(intent)localStorage.setItem(worldIntentKey(),JSON.stringify(intent));else localStorage.removeItem(worldIntentKey());}catch(e){}}
wbCall=async function(action,extra={}){
 const foreground=action!=='wb_poll';if(!S.P||!SHEET_URL||WORLD.room?.replaying&&action!=='wb_leave')return;
 if(foreground&&WORLD_NET.foreground||!foreground&&WORLD_NET.current)return;
 if(foreground)WORLD_NET.foreground=true;
 const task=async()=>{const prior=WORLD.room;WORLD.busy=true;WORLD.error='';if(foreground)render();let intent=worldReadIntent(),effective=action;
 try{
  if(intent&&['wb_status','wb_create','wb_join','wb_leave','wb_start'].includes(action)){effective=intent.action;extra=intent.extra||{};}
  if(!intent&&['wb_create','wb_join'].includes(effective)){
   if(communityBattleBusy())throw Error('finish other battle');
  }
  const packet=intent?{...intent.packet,...communityAuth()}:{action:effective,...communityAuth(),room:WORLD.room?.id||WORLD.roomId,...extra};
  if(['wb_create','wb_join','wb_leave','wb_start'].includes(effective)&&!intent){const stored={...packet};delete stored.pin;intent={endpoint:SHEET_URL,action:effective,extra,packet:stored};worldSaveIntent(intent);}
  let result;try{result=await lbPost(packet);}catch(e){if(!e.onlineTransport||!intent)throw e;ONLINE_UI.retry=true;result=await lbPost(packet);}
  if(!result.ok){if(result.error!=='busy')worldSaveIntent(null);throw Error(result.error);}
  if(result.worldAccount){worldApply(S.P,result.worldAccount);save();}if(result.used!=null)WORLD.used=result.used;
  if(result.left||effective==='wb_status'&&!result.room){WORLD.room=null;WORLD.roomId='';WORLD.pending=null;}
  else if(result.room){WORLD.room=result.room;WORLD.roomId=result.room.id;WORLD.clock=Date.now()-result.room.serverTime;onlineSkillEffects(prior,result.room,'world');if(WORLD.pending&&(result.room.rev>WORLD.pending.rev||result.room.status==='finished'))WORLD.pending=null;}
  worldSaveIntent(null);localStorage.setItem('sealbeast_world_v1',JSON.stringify({endpoint:SHEET_URL,room:WORLD.roomId}));if(result.room&&!result.left)localReplay('world',result.room);return result;
 }catch(e){WORLD.error=onlineMessage(e);if(foreground)toast(WORLD.error);}finally{WORLD.busy=false;render();wbClientSchedule();}
 };
 const runTask=async()=>{const previous=WORLD_NET.current;const operation=(async()=>{if(previous)await previous.catch(()=>{});return task();})();WORLD_NET.current=operation;try{return await operation;}finally{if(WORLD_NET.current===operation)WORLD_NET.current=null;}};
 try{return foreground?await withOnline(action,runTask):await runTask();}finally{if(foreground)WORLD_NET.foreground=false;}
};
const reliabilityPvp=pvpRequest;pvpRequest=async function(packet,silent=false){if(silent||PVP.busy)return reliabilityPvp(packet,silent);return withOnline(packet.action,()=>reliabilityPvp(packet,silent));};
const reliabilityCamp=campCall;campCall=async function(action,extra={}){if(CAMP.busy)return;return withOnline(action,()=>reliabilityCamp(action,extra));};
const reliabilityCommunity=communityCall;communityCall=async function(action='social_sync',extra={},saveFirst=false){if(COMMUNITY.busy||GACHA.busy)return;if(action==='social_sync'&&S.screen!=='friends')return reliabilityCommunity(action,extra,saveFirst);return withOnline(action,()=>reliabilityCommunity(action,extra,saveFirst));};
const reliabilityGsSave=gsSave;gsSave=async function(manual,newPin){if(GS.busy||!manual&&ONLINE_UI.count)return;if(!manual)return reliabilityGsSave(manual,newPin);return withOnline('save',()=>reliabilityGsSave(manual,newPin));};
const reliabilityGsLoad=gsLoad;gsLoad=async function(code,pin){if(GS.busy)return;return withOnline('load',()=>reliabilityGsLoad(code,pin));};
const reliabilityPvpConnect=pvpConnect;pvpConnect=async function(mode){if(PVP.busy)return;return withOnline('pvp_'+mode,()=>reliabilityPvpConnect(mode));};
lbLoad=async function(){if(!SHEET_URL||LB.busy)return;return withOnline('leaderboard',async()=>{LB.busy=1;LB.err='';render();try{await lbSubmit(true);const result=await sheetRequest({method:'GET',cache:'no-store'});if(!result.ok||!Array.isArray(result.rows))throw Error('Invalid leaderboard');LB.rows=result.rows;}catch(e){LB.err=onlineMessage(e);LB.rows=LB.rows||[];}finally{LB.busy=0;render();}});};
const reliabilityLbToggle=handlers.lbtoggle;handlers.lbtoggle=()=>withOnline('leaderboard',reliabilityLbToggle);
const reliabilityPvpError=pvpError;pvpError=function(message){return message==='busy'?onlineMessage(message):reliabilityPvpError(message);};
const reliabilityCommunityError=communityError;communityError=function(message){return message==='busy'?onlineMessage(message):reliabilityCommunityError(message);};
const crystalIcon=itemIcon;itemIcon=function(id,size=44){const i=['petExp1','petExp2','petExp3'].indexOf(id);return i<0?crystalIcon(id,size):`<span class="growth-crystal" role="img" aria-label="${esc(CON[id].n)}" title="${esc(CON[id].n)}" style="--s:${size}px;--crystal-x:${i*50}%"></span>`;};

// Isolated staging build: never uses the live game's local-storage namespace.
const SB_KEY='sb_publishable_-m9RbNVXYhaKjUZYSGGdMQ_rrkCuEL6';
const SB_ENV='live';
const sbTransport=sheetRequest;
const SB_CHECK={pending:null,needed:false,lastLoaded:null};
function sbMarkReady(code){try{localStorage.setItem('sealbeast_supabase_ready_'+code,SHEET_URL);}catch(e){}SB_CHECK.needed=false;}
async function sbCheckReady(code,pin){
 if(SB_ENV!=='live')return true;
 try{if(localStorage.getItem('sealbeast_supabase_ready_'+code)===SHEET_URL)return true;}catch(e){}
 if(SB_CHECK.pending)return SB_CHECK.pending;
 SB_CHECK.pending=(async()=>{
  const result=await sbTransport({method:'POST',headers:{'Content-Type':'application/json',apikey:SB_KEY,'x-soulbeast-environment':SB_ENV},body:JSON.stringify({action:'load',code,pin,_sbRequest:crypto.randomUUID()})});
  if(!result.ok){if(result.error==='notfound'){sbMarkReady(code);return true;}return result;}
  const remote=JSON.parse(result.data).P;
  if(S.P?.code===code&&Math.abs(Number(S.P.gsAt||0)-Number(result.at))<=2&&Number(S.P.gachaRevision||0)===Number(remote.gachaRevision||0)){sbMarkReady(code);return true;}
  SB_CHECK.needed=true;return {ok:false,error:'migration load required'};
 })();
 try{return await SB_CHECK.pending;}finally{SB_CHECK.pending=null;}
}
sheetRequest=async function(options={}){
 const next={...options,headers:{...options.headers,apikey:SB_KEY,'x-soulbeast-environment':SB_ENV}};
 let packet=null;
 if(next.body){packet=JSON.parse(next.body);packet._sbRequest??=packet.request||crypto.randomUUID();if(S.P){packet.code??=ensureCode();packet.pin??=S.P.cpin||'';}
  if(SB_ENV==='live'&&packet.action!=='load'&&packet.action!=='health'&&S.P){const ready=await sbCheckReady(packet.code,packet.pin);if(ready!==true)return ready;}
  if(['wb_create','wb_join'].includes(packet.action))packet._preSave=gsData();next.body=JSON.stringify(packet);}
 const result=await sbTransport(next);
 if(packet?._preSave&&result.savedAt&&S.P?.code===packet.code){applyAccount(result.account);S.P.gsAt=result.savedAt;GS.lastAt=Date.now();GS.lastJson=gsData();if(result.coupons!=null)GACHA.coupons=result.coupons;}
 if(packet?.action==='load'&&result.ok)SB_CHECK.lastLoaded={code:packet.code,at:result.at};
 return result;
};
const sbConfirmLoad=handlers.doloadcode;
handlers.doloadcode=function(){const remote=SB_CHECK.lastLoaded,confirmed=PENDING?.P;if(SB_ENV==='live'&&remote&&confirmed?.code===remote.code&&Number(confirmed.gsAt)===Number(remote.at)){
 try{if(S.P)localStorage.setItem('sealbeast_before_supabase_'+ensureCode(),JSON.stringify(S));}catch(e){}sbMarkReady(remote.code);SB_CHECK.lastLoaded=null;
}return sbConfirmLoad();};
handlers.sbMigrationLoad=()=>gsLoad(ensureCode(),S.P.cpin||'');
const sbSheetError=sheetError;sheetError=function(r){return r?.error==='migration load required'?ct('กรุณาโหลดเซฟออนไลน์ที่ตรวจย้ายแล้วก่อนใช้ระบบออนไลน์','Load the verified online save before using online features.','请先读取已核验的在线存档，再使用在线功能。'):sbSheetError(r);};
function sbOldLocalSave(){try{return S.P&&JSON.parse(localStorage.getItem('sealbeast_before_supabase_'+ensureCode())||'null');}catch{return null;}}
handlers.sbBeforeMigrationDownload=function(){const previous=sbOldLocalSave();if(!previous)return;try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['SB1.'+encSave({...previous,battle:null,ui:{}})],{type:'text/plain'}));a.download='soulbeast-before-supabase.txt';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}catch{S.ui.beforeMigrationCode=true;render();}};
const sbOriginalBackup=vBackup;vBackup=function(...args){let html=sbOriginalBackup(...args);const previous=SB_ENV==='live'&&sbOldLocalSave();if(previous)html+=`<div class="card stack"><b>${ct('เซฟในเครื่องก่อนย้ายระบบ','Local save before migration','迁移前的本地存档')}</b><button class="btn" data-a="sbBeforeMigrationDownload">${ct('ดาวน์โหลดสำเนาก่อนย้าย','Download pre-migration backup','下载迁移前备份')}</button>${S.ui.beforeMigrationCode?`<textarea readonly rows="3">SB1.${encSave({...previous,battle:null,ui:{}})}</textarea>`:''}</div>`;return html;};
const sbRender=render;render=function(){sbRender();const main=document.querySelector('main');if(!main?.querySelector)return;
 if(SB_ENV==='test'&&!main.querySelector('.sb-test-notice'))main.insertAdjacentHTML('afterbegin','<p class="sb-test-notice" style="padding:8px;border:1px solid #d9b35b;color:#f1d48a">SUPABASE TEST · ข้อมูลจำลอง แยกจากเกมจริง</p>');
 if(SB_ENV==='live'&&SB_CHECK.needed&&!main.querySelector('.sb-migration-notice'))main.insertAdjacentHTML('afterbegin',`<div class="card stack sb-migration-notice"><b>${ct('ยืนยันเซฟหลังย้ายระบบออนไลน์','Confirm your save after migration','迁移后确认存档')}</b><p>${ct('พบเซฟออนไลน์ที่ต่างจากในเครื่อง กรุณาตรวจและโหลดเซฟก่อนทำรายการ ข้อมูลในเครื่องจะสำรองไว้เมื่อคุณยืนยันโหลด','The online save differs from this device. Review and load it before online actions. Your current local save will be backed up when you confirm.','在线存档与本机不同。请先核对并读取，再进行在线操作。确认读取时会备份当前本地存档。')}</p><button class="btn pri" data-a="sbMigrationLoad">${ct('ตรวจและโหลดเซฟออนไลน์','Review and load online save','核对并读取在线存档')}</button></div>`);
};

// Display ordering only. Never reorder the shared gameplay catalogs.
function shopItemGroup(c){return c.rev?2:c.hp?0:c.mp?1:c.cure?3:c.seal?4:c.petExp?5:6;}
function compareShopItems(a,b){return shopItemGroup(a[1])-shopItemGroup(b[1])||(a[1].lv||1)-(b[1].lv||1)||(a[1].price||0)-(b[1].price||0);}
function compareBeastBook(a,b){
 const rank=q=>q.noseal?3:q.legendary?2:q.rare?1:0;
 return rank(SP[a])-rank(SP[b])||((SP[a].ev||[]).length-(SP[b].ev||[]).length);
}
function compareWeaponBook(a,b){
 const rank={normal:0,craft:1,legend:2,eclipse:3};
 return rank[weaponBookRarity(a[1])]-rank[weaponBookRarity(b[1])]||(a[1].lv||1)-(b[1].lv||1);
}

let forestForkShown=null;
function focusForestChoices(){
 const fork=S.screen==='zone'&&!S.battle&&!S.zone?.ev?S.zone?.fork:null;
 if(!fork){forestForkShown=null;return;}
 if(forestForkShown===fork)return;
 forestForkShown=fork;
 const target=document.querySelector('[data-a="fork"]')?.closest?.('.grid2');
 target?.scrollIntoView?.({block:'start',behavior:'instant'});
}
const forestFocusRender=render;
render=function(){forestFocusRender();focusForestChoices();};
const forestFocusContinue=handlers.cont;
handlers.cont=function(...args){forestFocusContinue(...args);focusForestChoicesAfterContinue();};
function focusForestChoicesAfterContinue(){
 // The original continue handler resets scroll after rendering.
 forestForkShown=null;focusForestChoices();
}

// Balance rules shared by browser and authoritative battle engine.
SP.demonlord.noseal=1;
// The final boss has a signature despite having no evolution tree.
const demonPetSkillsBase=petSkills;
petSkills=function(p){const skills=demonPetSkillsBase(p);if(p.sp==='demonlord')for(const id of [...SP.demonlord.sk,SP.demonlord.sig,'boss_legend_call'])if(SK[id]&&!skills.includes(id))skills.push(id);return skills;};

function balanceGachaKey(category,pool){
 if(category!=='legendGear')return pool[Math.floor(Math.random()*pool.length)];
 const eclipse=pool.filter(k=>EQ[k].worldLegend),ordinary=pool.filter(k=>!EQ[k].worldLegend);
 // The 10% legendary-gear category grants eclipse gear at most 10% of its rolls: <=1% overall.
 const chosen=eclipse.length&&ordinary.length&&Math.random()<.1?eclipse:ordinary;
 if(!chosen.length)throw Error('ordinary legendary pool required');
 return chosen[Math.floor(Math.random()*chosen.length)];
}
function wagerClass(a){if(!a)return 'none';if(a.type==='gold')return 'gold';if(a.type==='pet'){const q=SP[a.pet?.sp];return 'pet:'+(q?.legendary?'legendary':q?.rare?'rare':'normal');}if(a.type==='gear'){const q=EQ[a.key];return 'gear:'+(q?.worldLegend?'eclipse':q?.legend?'legendary':q?.craft?'crafted':'normal');}if(a.type==='item'){const q=CON[a.key];return 'item:'+(q?.rareLoot?'rare':q?.price>=1000?'premium':'normal');}return 'invalid';}
function wagersMatch(a,b){return (!a&&!b)||!!(a&&b&&wagerClass(a)===wagerClass(b));}

SK.boss_legend_call=SoulbeastContent.SK_boss_legend_call_1();
function bossSummonDue(u){u.legendTurn=(u.legendTurn||0)+1;const alive=B().enemies.some(x=>x.bossHelper&&x.hp>0);if(alive){u.legendDeadAt=null;return false;}if(!u.legendSummoned)return true;if(u.legendDeadAt==null)u.legendDeadAt=u.legendTurn;return u.legendTurn-u.legendDeadAt>=2;}
function bossSummonLegends(u,count){const b=B(),pool=Object.keys(SP).filter(k=>SP[k].legendary&&!SP[k].noseal);b.enemies=b.enemies.filter(x=>!x.bossHelper);b.queue=b.queue.filter(id=>!String(id).includes('_legend_'));const chosen=pool.slice();for(let i=0;i<count;i++){const sp=chosen.splice(Math.floor(Math.random()*chosen.length),1)[0],n=wildUnit(sp,40,0);n.id=u.id+'_legend_'+(u.legendBatch=(u.legendBatch||0)+1);n.side='enemy';n.owner=-1;n.temporary=true;n.bossHelper=true;n.summonedBy=u.id;n.r=99;n.skills=n.skills.filter(id=>!SK[id]?.summon);b.enemies.push(n);b.queue.push(n.id);}u.legendSummoned=true;u.legendDeadAt=null;blog(u.name+' ใช้ '+SK.boss_legend_call.n+' เรียกอสูรตำนาน Lv 40 จำนวน '+count+' ตัว');b.effects=b.effects||[];b.effects.push({k:'cast',uid:u.id,skill:'boss_legend_call'});if(typeof Sound!=='undefined')Sound.fx('charge');return true;}
const balanceBossAct=act;act=function(u,id,t,a,free){const b=B(),prior=b?.balanceDamageActor;if(b&&isWorldBattle())b.balanceDamageActor={side:u.side,owner:u.owner};try{if(id==='boss_legend_call')return bossSummonLegends(u,u.immortalWorld?2:1);return balanceBossAct(u,id,t,a,free);}finally{if(b)b.balanceDamageActor=prior;}};
function worldAttackTarget(b){return b.enemies.find(x=>x.bossHelper&&x.hp>0)||b.enemies[0];}

const balanceHurt=hurt;hurt=function(u,d,c='bad'){const beforeHp=u.hp;balanceHurt(u,d,c);if(isWorldBattle()&&u.bossHelper&&B().balanceDamageActor?.side==='ally'){const b=B(),damage=Math.max(0,beforeHp-u.hp);b.damageTotal=(b.damageTotal||0)+damage;const owner=b.balanceDamageActor.owner;if(Number.isInteger(owner)&&owner>=0)b.damageBy[owner]=(b.damageBy[owner]||0)+damage;}if(u.bossHelper&&u.hp<=0&&!B().enemies.some(x=>x.bossHelper&&x.hp>0)){const boss=B().enemies.find(x=>x.id===u.summonedBy);if(boss)boss.legendDeadAt=boss.legendTurn||0;}};

// Legendaries are protected even when carried as sealed reserves.
const balanceStealable=banditStealablePets;
banditStealablePets=function(P=S.P,b=B()){return balanceStealable(P,b).filter(p=>!SP[p.sp]?.legendary);};
const balanceAllocation=allocationPlan;
allocationPlan=function(p=null){const plan=balanceAllocation(p),primary=p?(SP[p.sp].b[3]>SP[p.sp].b[2]?'matk':'patk'):(WT[clsWeapon(S.P.cls)].t==='m'?'matk':'patk');plan.primary=primary;plan.weights.hp=Math.max(3,plan.weights.hp||0);plan.weights[primary]=Math.max(3,plan.weights[primary]||0);return plan;};
autoStats=function(uid){if(statsLocked())return toast('อัปสถานะได้หลังจบการต่อสู้');const hero=uid==='P',o=hero?S.P:petBy(Number(uid));if(!o)return;const used=Object.values(o.pts||{}).reduce((n,v)=>n+(Number(v)||0),0),n=Math.min(Math.max(0,Math.floor(Number(o.free)||0)),Math.max(0,(o.lv-1)*(hero?5:3)-used));if(!n)return;const before=hero?pStats():calcPet(o),hp=o.hp,mp=o.mp,plan=allocationPlan(hero?null:o),keys=Object.keys(plan.weights);o.pts=o.pts||{};for(let i=0;i<n;i++){const k=i===0?plan.primary:i===1?'hp':keys.reduce((a,k)=>plan.weights[k]/((o.pts[k]||0)+1)>plan.weights[a]/((o.pts[a]||0)+1)?k:a,keys[0]);o.pts[k]=(o.pts[k]||0)+1;}o.free-=n;const after=hero?pStats():calcPet(o);o.hp=hp>0?Math.min(after.hp,hp+after.hp-before.hp):0;o.mp=Math.min(after.mp,Math.max(0,mp+after.mp-before.mp));if(AUTO_STAT_BATCH)return;save();render();toast('จัดสรร '+n+' แต้มตาม'+plan.name+' แล้ว');};
const EvolutionNotice={queue:[],playing:false};
const balanceGainExp=gainExp;
gainExp=function(o,amount,hero){const old=o.form||0,lines=balanceGainExp(o,amount,hero);if(!hero&&(o.form||0)>old){for(let f=old+1;f<=o.form;f++)EvolutionNotice.queue.push({sp:o.sp,from:f-1,to:f});setTimeout(showEvolutionNotice,0);}return lines;};
function showEvolutionNotice(){if(EvolutionNotice.playing||!EvolutionNotice.queue.length)return;EvolutionNotice.playing=true;const e=EvolutionNotice.queue.shift(),overlay=document.createElement('div');overlay.className='evolution-notice';overlay.setAttribute('role','status');overlay.innerHTML='<div class="evolution-panel"><div class="evolution-rays"></div><h2>อสูรพัฒนาร่าง!</h2><div class="evolution-portraits">'+portrait(e.sp,100,{form:e.from})+'<span>✦</span>'+portrait(e.sp,150,{form:e.to})+'</div><h3>'+esc(formName(e.sp,e.to))+'</h3><p>'+esc(formName(e.sp,e.from))+' พัฒนาร่างแล้ว</p></div>';document.body.appendChild(overlay);ExtraAudio.play('evolution');setTimeout(()=>{overlay.remove();EvolutionNotice.playing=false;showEvolutionNotice();},3000);}

const balanceBossAI=aiAct;aiAct=function(){const b=B(),u=b&&uById(b.cur);if(u?.side==='enemy'&&u.sp==='demonlord'&&u.boss&&!u.immortalWorld&&u.hp>0&&bossSummonDue(u)){act(u,'boss_legend_call',u,u);endUnitTurn(u);render();battleLater(advance,600);return;}return balanceBossAI();};
const balanceSealable=sealable;
// Summoned helpers are battle-only and cannot be captured, including with Eternal Seals.
// sealable is a const; enforce through sealChance and the capture dispatcher instead.
const balanceSealChance=sealChance;sealChance=function(e,pow){return e?.bossHelper?0:balanceSealChance(e,pow);};
const balanceWagerPanel=wagerPanel;wagerPanel=function(r){let html=balanceWagerPanel(r);const other=r.wagers?.offers?.[1-r.me];if(!other)return html;html=html.replace(/<option value="([^"]+)"([^>]*)>([\s\S]*?)<\/option>/g,(full,value,attrs,label)=>{const [type,key]=value.split(':');if(type==='none')return full;const asset=type==='pet'?{type,pet:S.P.pets.find(p=>String(p.uid)===key)}:{type,key};return wagerClass(asset)===wagerClass(other)?full:'';});return html;};
const balancePvpError=pvpError;pvpError=function(m){return m==='stake rarity mismatch'?'ของเดิมพันต้องเป็นชนิดและความหายากเดียวกันทั้งสองฝ่าย':balancePvpError(m);};
const balanceWorldUI=vWorld;vWorld=function(){let html=balanceWorldUI();const b=WORLD.room?.battle;if(b?.enemies?.some(u=>u.bossHelper)){const pets=b.enemies.filter(u=>u.bossHelper);html='<div class="card stack"><h3>อสูรตำนานที่บอสเรียกมา · Lv 40</h3>'+pets.map(u=>'<div class="row">'+portrait(u.sp,46)+'<div class="grow">'+esc(u.name)+bar(u.hp,u.st.hp)+'</div></div>').join('')+'</div>'+html;}return html;};

// Summon timing is owned by aiAct/bossSummonDue, never the generic random-skill AI.
const demonAiChooseBase=aiChoose;aiChoose=function(u){if(u.sp!=='demonlord')return demonAiChooseBase(u);const original=u.skills;u.skills=original.filter(id=>id!=='boss_legend_call');try{return demonAiChooseBase(u);}finally{u.skills=original;}};

// Shared reward application supports ordinary legendary and crafted guild prizes.
const guildWorldApplyBase=worldApply;
worldApply=function(P,a){const previous=P.worldApplied?.loot||{};guildWorldApplyBase(P,a);for(const [id,n] of Object.entries(a?.loot||{})){if(!EQ[id]||EQ[id].worldLegend)continue;const add=Math.max(0,Number(n)-Number(previous[id]||0));P.owned=P.owned||[];for(let i=0;i<add;i++)P.owned.push(id);if(add&&EQ[id].legend){P.legend=P.legend||{};P.legend[id]=1;}}};

const GUILD_UI={busy:false,data:null,error:'',request:null,confirm:null,flag:'fenrir',search:'',page:0,warRoom:null,warFinal:null,replaySerial:0};
function guildError(m){return ({'guild already member':'คุณอยู่ในกิลแล้ว','guild full':'สมาชิกกิลครบ 20 คนแล้ว','guild not found':'ไม่พบกิล','guild leader required':'เฉพาะหัวหน้ากิลเท่านั้น','guild bad member':'สมาชิกไม่ถูกต้อง','guild transfer first':'โอนหัวหน้ากิลก่อนออก','guild immutable rules':'ชื่อและธงกิลเปลี่ยนไม่ได้ ต้องสมัครและรอหัวหน้าอนุมัติ','guild bad flag':'กรุณาเลือกรูปอสูรในเกม','guild bad name':'ชื่อกิลต้องยาว 2–24 ตัวอักษร','guild name exists':'ชื่อกิลนี้ถูกใช้แล้ว','guild application missing':'ใบสมัครนี้ไม่มีแล้ว','guild reward unavailable':'ไม่พบรางวัลนี้','guild war saturday':'สงครามกิลเปิดเฉพาะวันเสาร์ เวลาไทย','guild war level':'โจมตีได้เฉพาะกิลที่เลเวลต่างไม่เกิน 1','guild war bad target':'เลือกกิลฝ่ายตรงข้าม','guild war empty':'กิลเป้าหมายยังไม่มีสมาชิกที่ลงทะเบียนทีมตั้งรับ','defense required':'ต้องลงทะเบียนทีมตั้งรับก่อนโจมตี','camp pets selection':'เลือกอสูรจากกระเป๋าตามจำนวนที่อาชีพใช้ได้','guild required':'ต้องเป็นสมาชิกกิลก่อน','not enough coupons':'ต้องใช้คูปอง 10 ใบ'})[m]||pvpError(m);}
async function guildRequest(action='guild_sync',extra={},retry=false){if(GUILD_UI.busy)return;GUILD_UI.busy=true;GUILD_UI.error='';render();try{if(!retry&&action!=='guild_sync')await communitySave();const packet=retry?GUILD_UI.request:{action,...communityAuth(),...extra,_sbRequest:crypto.randomUUID()};if(!packet)return;GUILD_UI.request=packet;const r=await lbPost(packet);if(!r.ok){GUILD_UI.request=null;throw Error(r.error);}GUILD_UI.data=r;if(r.defense){CAMP.pets=r.defense.pets;CAMP.guardPicks=null;}GUILD_UI.request=null;applyAccount(r.account);GACHA.coupons=r.coupons;if(r.warRoom)guildPlayWar(r.warRoom);}catch(e){GUILD_UI.error=guildError(e.message);}finally{GUILD_UI.busy=false;if(['guild','guildwar'].includes(S.screen))render();}}
const guildGoBase=handlers.go;handlers.go=function(v){const result=guildGoBase(v);if(['guild','guildwar'].includes(v))guildRequest();return result;};
function guildMenuTile(war=false){return '<button class="card row" data-a="go" data-v="'+(war?'guildwar':'guild')+'" style="width:100%;text-align:left"><img src="assets/ui/'+(war?'guild-war.webp':'guild-menu.webp')+'" alt="" width="76" height="76" style="border-radius:12px"><span><b>'+(war?'สงครามกิล':'กิลและคะแนนกิจกรรม')+'</b><small style="display:block">'+(war?'ทุกวันเสาร์ · โจมตีได้คนละครั้ง':'สมาชิก 20 คน · สมัครและรอหัวหน้าอนุมัติ')+'</small></span></button>';}
const guildTownBase=vTown;vTown=function(){return '<div class="stack" style="margin-bottom:14px">'+guildMenuTile()+guildMenuTile(true)+'</div>'+guildTownBase();};
const guildLeaderBase=vLeader;vLeader=function(){return '<div class="row wrap"><button class="btn" data-a="go" data-v="guild">อันดับคะแนนกิล</button><button class="btn" data-a="go" data-v="guildwar">อันดับสงครามกิล</button></div>'+guildLeaderBase();};
function guildImage(g,size=56){return portrait(g.flag||'fenrir',size);}
function guildPending(inlineCreate=false){return `${GUILD_UI.confirm&&(inlineCreate?GUILD_UI.confirm.action==='guild_create':GUILD_UI.confirm.action!=='guild_create')?'<div class="card stack" role="dialog" aria-label="ยืนยันรายการกิล"><b>'+esc(GUILD_UI.confirm.message)+'</b><div class="row"><button class="btn pri" data-a="guildConfirmAccept">ยืนยัน</button><button class="btn" data-a="guildConfirmCancel">ยกเลิก</button></div></div>':''}${!inlineCreate&&GUILD_UI.busy?'<div class="card" role="status">✦ กรุณารอ ระบบกำลังตรวจสอบรายการ…</div>':''}${!inlineCreate&&GUILD_UI.error?'<p class="card" role="alert">'+esc(GUILD_UI.error)+'</p>':''}${!inlineCreate&&GUILD_UI.error&&GUILD_UI.request?'<button class="btn" data-a="guildRetry">ตรวจผลคำขอเดิมอีกครั้ง</button>':''}`;}
function guildTime(t){return t?new Date(t).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}):'ยังไม่มีข้อมูล';}
function guildRewardView(d){return '<div class="stack">'+(d?.rewards||[]).filter(r=>!r.claimed).map(r=>'<div class="card"><b>รางวัล '+esc(r.month)+' · '+esc(r.guildName)+' อันดับ '+r.rank+'</b><p>ผลงานส่วนตัว '+fmt(r.personalPoints||0)+' คะแนน</p><p>'+fmt(r.gold)+' เหรียญ · '+Object.entries(r.loot).map(([k,n])=>esc(EQ[k]?.n||CON[k]?.n||k)+' ×'+n).join(', ')+'</p><button class="btn" data-a="guildClaim" data-v="'+esc(r.id)+'">รับรางวัล</button></div>').join('')+'</div>';}
function vGuild(){const d=GUILD_UI.data,g=d?.guild;return `<div class="stack"><div class="row">${guildImage(g||{flag:GUILD_UI.flag},48)}<h2 class="grow">กิล</h2><button class="btn sm" data-a="guildRefresh">รีเฟรช</button></div>${guildPending()}${d?'<div class="card">คะแนนกิจกรรมสะสม <b>'+fmt(d.activity)+'</b> · คูปอง '+fmt(d.coupons)+'<p class="sub">ผลงานให้กิลเดือนนี้ '+fmt(d.monthPoints)+' คะแนน</p></div>':''}<details class="card"><summary>กติกา คะแนน และรางวัล</summary><p>สร้างกิล 10 คูปอง รวมหัวหน้าและสมาชิกไม่เกิน 20 คน ชื่อซ้ำไม่ได้และเปลี่ยนชื่อไม่ได้ เลือกอสูรเป็นธงหนึ่งครั้งตอนสร้าง</p><p>คะแนนกิลจาก PVP ต่างกิล: ชนะ 30 แพ้ 10 เสมอ 5 · จู่โจมค่าย (ไม่นับค่ายกิลเดียวกัน): ชนะ 20 แพ้ 5 · บอสโลกตามคะแนนแต่ละรอบ สมาชิกต้องออนไลน์ขณะจบกิจกรรม ยกเว้นชนะป้องกันสงครามกิล</p><p>เลเวลกิลสูงสุด 5 จากคะแนนสะสม 0 / 1,000 / 5,000 / 15,000 / 40,000 คะแนน วันที่ 1 เวลาไทยจัดอันดับก่อนลดคะแนนกิลปัจจุบันเหลือครึ่งหนึ่ง คะแนนสะสมส่วนบุคคลและคะแนนสะสมเลเวลไม่ลด</p><p>กิลอันดับ 1–10 รับเงิน ไอเท็ม และอุปกรณ์หลอมหรือตำนาน สมาชิกต้องอยู่กิลอย่างน้อย 7 วันและทำคะแนนในเดือนนั้น เงิน จำนวนของ และโอกาสอุปกรณ์ตำนานขึ้นกับอันดับกับคะแนนที่สมาชิกทำในเดือนนั้น กดรับได้ครั้งเดียว</p></details>
${g?`<div class="card stack"><div class="row">${guildImage(g)}<div><h3>${esc(g.name)} · Lv ${g.level}</h3><p>${fmt(g.score)} คะแนน · สมาชิก ${g.count}/20</p></div></div><p class="sub">ชื่อและธงกำหนดถาวร</p><h3>สมาชิกกิล</h3>${g.members.map(m=>`<div class="card row"><div class="grow"><b>${m.leader?'♛ ':''}${esc(m.name)}</b><p>Lv ${m.lv} · ${esc(CLS[m.cls]?.n||m.cls)}</p><p class="sub">คะแนนกิลสะสม ${fmt(m.totalPoints)} · เดือนนี้ ${fmt(m.points)}<br>${m.online?'🟢 ออนไลน์':'ออนไลน์ล่าสุด '+esc(guildTime(m.lastOnline))}</p></div>${g.isLeader&&!m.me?`<div class="stack"><button class="btn sm" data-a="guildTransfer" data-v="${esc(m.id)}">โอนหัวหน้า</button><button class="btn danger sm" data-a="guildKick" data-v="${esc(m.id)}">ปลดสมาชิก</button></div>`:''}</div>`).join('')}${g.isLeader?'<h3>ใบสมัคร '+g.applicants.length+' คน</h3>'+g.applicants.map(a=>'<div class="card"><b>'+esc(a.name)+'</b><p>Lv '+a.lv+' · '+esc(CLS[a.cls]?.n||a.cls)+'</p><div class="row"><button class="btn" data-a="guildAccept" data-v="'+esc(a.id)+'">รับสมาชิก</button><button class="btn danger" data-a="guildReject" data-v="'+esc(a.id)+'">ปฏิเสธ</button></div></div>').join(''):''}<button class="btn danger" data-a="guildLeave">${g.isLeader&&g.count===1?'ยุบกิลและออก':'ออกจากกิล'}</button></div>`:d?`<div class="card stack"><h3>สร้างกิล · 10 คูปอง</h3><label>ชื่อถาวร<input id="guildName" maxlength="24" placeholder="ชื่อกิล 2–24 ตัวอักษร"></label><label>อสูรบนธงกิล<select id="guildFlag">${Object.keys(SP).map(k=>'<option value="'+k+'" '+(k===GUILD_UI.flag?'selected':'')+'>'+esc(SP[k].n)+'</option>').join('')}</select></label>${portrait(GUILD_UI.flag,88)}<button class="btn pri" data-a="guildCreate" ${d.coupons<10?'disabled':''}>สร้างกิล</button>${guildPending(true)}</div>`:''}
${guildRewardView(d)}${guildRankingCard(d)}<details class="card stack"><summary>ค้นหาและสมัครเข้ากิล</summary><label>ค้นหาชื่อกิล<input id="guildSearch" maxlength="24" value="${esc(GUILD_UI.search)}"></label><button class="btn" data-a="guildSearch">ค้นหา</button>${(d?.guilds||[]).map(r=>`<div class="card stack"><div class="row">${guildImage(r,46)}<div class="grow"><b>${r.rank}. ${esc(r.name)} · Lv ${r.level}</b><p>${fmt(r.score)} คะแนน · ${r.count}/20</p></div></div><p>หัวหน้า ${esc(r.leader)} · Lv ${r.leaderLevel} · ${esc(CLS[r.leaderClass]?.n||r.leaderClass)}</p>${!g?'<button class="btn" data-a="'+(r.applied?'guildWithdraw':'guildApply')+'" data-v="'+esc(r.id)+'" '+(r.count>=20&&!r.applied?'disabled':'')+'>'+(r.applied?'ถอนใบสมัคร':'สมัครเข้ากิล')+'</button>':''}</div>`).join('')||'<p>ยังไม่พบกิล</p>'}<div class="row"><button class="btn sm" data-a="guildPage" data-v="${Math.max(0,(d?.page||0)-1)}" ${(d?.page||0)<=0?'disabled':''}>ก่อนหน้า</button><span>หน้า ${(d?.page||0)+1}/${d?.totalPages||1}</span><button class="btn sm" data-a="guildPage" data-v="${(d?.page||0)+1}" ${(d?.page||0)+1>=(d?.totalPages||1)?'disabled':''}>ถัดไป</button></div><p class="sub">รายชื่อสมาชิกแสดงเฉพาะคนในกิลเดียวกัน</p></details>${guildMenuTile(true)}<button class="btn" data-a="go" data-v="town">กลับเมือง</button></div>`;}
function guildWarCards(units){return '<div class="row wrap">'+units.map(u=>'<div class="card grow">'+portrait(u.img||u.sp,46,{form:u.evo||0})+'<b>'+esc(u.name)+'</b>'+bar(u.hp,u.st.hp)+'<small>HP '+u.hp+'/'+u.st.hp+'</small></div>').join('')+'</div>';}
function vGuildWar(){const d=GUILD_UI.data,w=d?.war,room=GUILD_UI.warRoom;return `<div class="stack"><div class="row"><img src="assets/ui/guild-war.webp" alt="สงครามกิล" width="76" height="76"><h2>สงครามกิล</h2></div>${guildPending()}<div class="card"><b>${w?.open?'เปิดสงครามวันเสาร์':'เปิดทุกวันเสาร์ 00:00–23:59 เวลาไทย'}</b><p>หนึ่งครั้งต่อสมาชิกต่อสงคราม · เลเวลกิลต่างกันได้ไม่เกิน 1</p><p>ชนะ: +100 คะแนนสงครามและคะแนนกิล · กิลฝ่ายรับแพ้เสียคะแนนกิลไม่เกิน 50 · ฝ่ายบุกแพ้ไม่เสียคะแนน แต่ใช้สิทธิ์แล้ว หากฝ่ายรับชนะ ฝ่ายรับได้คะแนน</p><p>${w?.used?'ใช้สิทธิ์รอบนี้แล้ว':'ยังไม่ใช้สิทธิ์รอบนี้'} · ${esc(w?.period||'')}</p></div>${room?'<div class="card stack"><h3>ผลสงครามกิล · '+(room.winner===0?'ชนะ':room.winner===1?'แพ้':'เสมอ')+'</h3>'+guildWarCards(room.battle.enemies)+'<div class="log">'+room.battle.log.slice(-6).map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>'+guildWarCards(room.battle.allies)+(room.replaying?'<button class="btn" data-a="guildSkipReplay">ข้ามรีเพลย์</button>':'<p>บันทึกผลที่เซิร์ฟเวอร์แล้ว</p>')+'</div>':''}<div class="card stack"><h3>เลือกกิลที่ต้องการโจมตี</h3>${!d?.guild?'<p>ต้องเข้ากิลก่อน</p>':(w?.targets||[]).map(g=>'<div class="card"><b>'+esc(g.name)+' · Lv '+g.level+'</b><p>คะแนนกิล '+fmt(g.score)+' · สงคราม '+fmt(g.warScore)+'</p><button class="btn danger" data-a="guildAttack" data-v="'+esc(g.id)+'" '+(!w.open||w.used||GUILD_UI.busy?'disabled':'')+'>สุ่มคู่ต่อสู้และโจมตี</button></div>').join('')||'<p>ไม่มีกิลในช่วงเลเวลที่โจมตีได้</p>'}<p class="sub">นักอัญเชิญและสายขั้นต่อยอดใช้อสูรจากทีมและกระเป๋าได้สูงสุด 3 ตัว · คู่ต่อสู้จะสุ่มหลังยืนยันโจมตี ไม่แสดงสมาชิกกิลเป้าหมาย</p></div><div class="card"><h3>อันดับคะแนนสงครามกิล</h3>${(d?.warLeaderboard||[]).filter((g,i)=>i<20||g.id===d?.guild?.id).map(g=>'<p>'+g.rank+'. '+esc(g.name)+' · '+fmt(g.warScore)+' คะแนน</p>').join('')||'<p>ยังไม่มีกิล</p>'}</div><button class="btn" data-a="go" data-v="guild">กลับเมนูกิล</button></div>`;}
function guildPlayWar(room){GUILD_UI.warFinal=JSON.parse(JSON.stringify(room));const frames=room.replay?.frames||[];if(!frames.length){GUILD_UI.warRoom=room;return;}const serial=++GUILD_UI.replaySerial,b=JSON.parse(JSON.stringify(room.replay.initial));GUILD_UI.warRoom={...room,battle:b,replaying:true};let n=0;function step(){if(serial!==GUILD_UI.replaySerial)return;const f=frames[n++];if(!f){GUILD_UI.warRoom=GUILD_UI.warFinal;render();return;}for(const [id,hp,mp,status,taunt]of f.units){const u=[...b.allies,...b.enemies].find(u=>u.id===id);if(u)Object.assign(u,{hp,mp,status,taunt});}Object.assign(b,{cur:f.cur,round:f.round,log:f.log,effects:f.effects});if(S.screen==='guildwar')render();setTimeout(step,400);}step();}
function guildConfirm(action,extra,message){GUILD_UI.confirm={action,extra,message};render();}
handlers.guildConfirmCancel=()=>{GUILD_UI.confirm=null;render();};handlers.guildConfirmAccept=()=>{const p=GUILD_UI.confirm;if(!p)return;GUILD_UI.confirm=null;guildRequest(p.action,p.extra);};handlers.guildRefresh=()=>guildRequest('guild_sync',{search:GUILD_UI.search,page:GUILD_UI.page});handlers.guildPage=p=>{GUILD_UI.page=Number(p)||0;guildRequest('guild_sync',{search:GUILD_UI.search,page:GUILD_UI.page});};handlers.guildSearch=()=>{GUILD_UI.search=document.getElementById('guildSearch')?.value||'';GUILD_UI.page=0;guildRequest('guild_sync',{search:GUILD_UI.search});};handlers.guildRetry=()=>guildRequest('',{},true);handlers.guildCreate=()=>guildConfirm('guild_create',{name:document.getElementById('guildName')?.value,flag:GUILD_UI.flag},'ใช้ 10 คูปองสร้างกิล ชื่อและธงเปลี่ยนไม่ได้ ยืนยันหรือไม่?');handlers.guildApply=id=>guildRequest('guild_apply',{guildId:id});handlers.guildWithdraw=id=>guildRequest('guild_withdraw',{guildId:id});handlers.guildAccept=id=>guildRequest('guild_accept',{target:id});handlers.guildReject=id=>guildRequest('guild_reject',{target:id});handlers.guildLeave=()=>guildConfirm('guild_leave',{},'ยืนยันออกจากกิล?');handlers.guildKick=id=>guildConfirm('guild_kick',{target:id},'ยืนยันปลดสมาชิก?');handlers.guildTransfer=id=>guildConfirm('guild_transfer',{target:id},'ยืนยันโอนหัวหน้ากิล?');handlers.guildClaim=id=>guildRequest('guild_claim',{reward:id});handlers.guildAttack=id=>guildConfirm('guild_war_attack',{guildId:id},'ใช้สิทธิ์สงครามกิลรอบนี้สุ่มคู่ต่อสู้และต่อสู้อัตโนมัติ ยืนยันหรือไม่?');handlers.guildSkipReplay=()=>{GUILD_UI.replaySerial++;GUILD_UI.warRoom=GUILD_UI.warFinal;render();};
document.addEventListener('change',e=>{if(e.target?.id==='guildFlag'&&SP[e.target.value]){GUILD_UI.flag=e.target.value;render();}});

function guildRankingCard(d){return '<div class="card stack"><h3>อันดับคะแนนกิล</h3><small>20 อันดับแรกและกิลของคุณ</small>'+((d?.leaderboard||[]).filter((g,i)=>i<20||g.id===d?.guild?.id).map(g=>'<div class="row '+(g.id===d?.guild?.id?'me':'')+'"><b>'+g.rank+'. '+esc(g.name)+(g.id===d?.guild?.id?' · กิลของคุณ':'')+'</b><span>'+fmt(g.score)+' คะแนน</span></div>').join('')||'<p>ยังไม่มีกิล</p>')+'</div>';}

const eclipseGachaViewBase=vGacha;vGacha=function(){const pity=Number.isInteger(GACHA.eclipseWeaponPity)?GACHA.eclipseWeaponPity:null;return '<div class="card stack"><b>'+ct('การันตีอาวุธตำนานสุริยัน (ชุดสุริยคราส)','Guaranteed Eclipse legendary weapon','日蚀传说武器保底')+'</b><p>'+ct('ได้ภายใน 50 ครั้งที่ยังไม่ออกอาวุธชุดนี้ นับรวมสุ่ม 1 และ 10 ครั้ง หากได้ก่อนจะเริ่มนับใหม่','Guaranteed within 50 pulls without an Eclipse weapon. Singles and 10-pulls share the counter; receiving one resets it.','连续未获得日蚀武器时50抽内保底，单抽与十连共用计数，获得后重置。')+'</p><b>'+ct('เหลืออีก','Remaining','剩余')+' '+(pity==null?'—':50-pity)+' '+ct('ครั้ง','pulls','抽')+'</b><small>'+ct('ครั้งการันตีรับอาวุธเพิ่ม ไม่แทนที่อสูรการันตี 10/100 ครั้ง · อัตราพื้นฐานก่อนการันตียังคงเดิม','The guaranteed weapon is an extra reward, preserving 10/100 beast pity. Base rates before pity remain unchanged.','保底武器为额外奖励，不占用10/100抽妖兽保底，保底前基础概率不变。')+'</small></div>'+eclipseGachaViewBase();};
const eclipseRewardCardBase=gachaRewardCard;gachaRewardCard=function(r){const html=eclipseRewardCardBase(r);return r.guaranteedEclipse?html.replace('</article>','<small class="good">'+ct('รางวัลการันตีอาวุธ 50 ครั้ง','50-pull weapon guarantee','50抽武器保底')+'</small></article>'):html;};

// Gameplay conveniences; progression remains in the existing save format.
function bagHealSkills(){return playerUnit().skills.filter(id=>SK[id]?.t==='heal'&&SK[id].pw>0&&!SK[id].gc);}
function bagHealTargets(){return [{key:'P',o:S.P,st:pStats(),name:S.P.name},...carriedPets().map(o=>({key:String(o.uid),o,st:calcPet(o),name:petName(o)}))];}
handlers.bagSkillHeal=function(value){
 if(statsLocked())return toast('ใช้สกิลนี้ในกระเป๋าได้หลังจบการต่อสู้');
 const [id,key]=value.split(':'),u=playerUnit(),sk=SK[id];if(!bagHealSkills().includes(id)||S.P.hp<=0)return;
 const cost=costOf(u,sk);if(S.P.mp<cost)return toast('MP ไม่พอ');
 const all=bagHealTargets(),list=sk.tg==='self'?[all[0]]:sk.tg==='team'?all:all.filter(x=>x.key===key);
 const wounded=list.filter(x=>x.o.hp>0&&x.o.hp<x.st.hp);if(!wounded.length)return toast('ไม่มีเป้าหมายที่ต้องฟื้น HP');
 S.P.mp-=cost;wounded.forEach(x=>{const amount=Math.round((x.st.hp*sk.pw/100+eff(u,'matk')*.5)*(hasPas(u,'healer')?1.3:1));x.o.hp=Math.min(x.st.hp,x.o.hp+amount);});
 ExtraAudio.play('heal');save();render();toast('ใช้ '+sk.n+' · MP −'+cost);
};
const playBagBase=vBag;vBag=function(){let html=playBagBase();const ids=bagHealSkills();if(!ids.length)return html;
 const targets=bagHealTargets();const section='<section class="card stack"><h3>✚ ฮีลด้วยสกิล · ใช้ MP</h3>'+ids.map(id=>{const sk=SK[id],u=playerUnit(),cost=costOf(u,sk),list=sk.tg==='self'?[targets[0]]:sk.tg==='team'?[{key:'P',name:'ทั้งทีม',o:{hp:1},st:{hp:2}}]:targets;return '<div><b>'+esc(sk.n)+'</b> · '+cost+' MP<div class="row wrap">'+list.map(t=>'<button class="btn sm" data-a="bagSkillHeal" data-v="'+id+':'+t.key+'" '+(S.P.mp<cost||S.P.hp<=0||t.o.hp<=0||t.o.hp>=t.st.hp?'disabled':'')+'>ฮีล '+esc(t.name)+'</button>').join('')+'</div></div>';}).join('')+'</section>';
 return html.replace('</h2>','</h2>'+section);
};
handlers.autoAllPets=function(){if(statsLocked())return toast('อัปแต้มหลังจบการต่อสู้');let count=0;AUTO_STAT_BATCH=true;try{S.P.pets.filter(p=>p.free>0).forEach(p=>{const before=p.free;autoStats(p.uid);if(p.free<before)count++;});}finally{AUTO_STAT_BATCH=false;}save();render();toast('อัปแต้มอัตโนมัติแล้ว '+count+' ตัว');};
const playRosterBase=vRoster;vRoster=function(tabs){let html=playRosterBase(tabs);if(S.ui.packFilter==='pending'){const n=S.P.pets.filter(p=>p.free>0).length;html=html.replace('<div class="pet-management">','<button class="btn pri full" data-a="autoAllPets" '+(!n?'disabled':'')+'>อัปแต้มอสูรทั้งหมดอัตโนมัติ · '+n+' ตัว</button><div class="pet-management">');}return html;};
// Only forest previews are grey; viewing a preview never marks discovery.
const playForestBase=forestDetail;forestDetail=function(z){const original=portrait;portrait=function(key,size,opts){const image=original(key,size,opts);return SP[key]&&!S.P.seen?.[key]?'<span class="forest-unseen" title="ยังไม่เคยพบ">'+image+'</span>':image;};try{return playForestBase(z);}finally{portrait=original;}};
const HeroLevelNotice={queue:[],playing:false};
function showHeroLevelNotice(){if(HeroLevelNotice.playing||!HeroLevelNotice.queue.length)return;if(EvolutionNotice.playing){setTimeout(showHeroLevelNotice,300);return;}HeroLevelNotice.playing=true;const n=HeroLevelNotice.queue.shift(),el=document.createElement('div');el.className='hero-level-notice';el.setAttribute('role','status');el.innerHTML='<div><small>✦ LEVEL UP ✦</small><h2>'+esc(n.name)+'</h2><strong>Lv '+n.from+' → Lv '+n.to+'</strong></div>';document.body.appendChild(el);setTimeout(()=>{el.remove();HeroLevelNotice.playing=false;showHeroLevelNotice();},1800);}
function notifyHeroLevels(o,from){for(let lv=from;lv<o.lv;lv++)HeroLevelNotice.queue.push({name:o.name,from:lv,to:lv+1});setTimeout(showHeroLevelNotice,0);}
const playEvolutionNotice=showEvolutionNotice;showEvolutionNotice=function(){if(HeroLevelNotice.playing||HeroLevelNotice.queue.length){setTimeout(showEvolutionNotice,300);return;}return playEvolutionNotice();};
const playGainExp=gainExp;gainExp=function(o,amount,isP){const from=o.lv,result=playGainExp(o,amount,isP);if(isP)notifyHeroLevels(o,from);return result;};
const playWorldApply=worldApply;worldApply=function(P,a){const from=P.lv,result=playWorldApply(P,a);if(P===S.P&&P.lv>from)notifyHeroLevels(P,from);return result;};
// Compact HP overview stays beside the commands while detailed cards/log remain scrollable.
handlers.battleDetails=function(){S.ui.battleDetails=!S.ui.battleDetails;render();};
handlers.battleCommands=function(){S.ui.battleCommandsHidden=!S.ui.battleCommandsHidden;render();};
const playBattleBase=vBattle;vBattle=function(){let html=playBattleBase();const b=B();if(!b)return html;
 // Detailed cards are secondary: each effect ID belongs only to the visible portrait.
 html=html.replace(/data-u=/g,'data-detail-u=');
 if(!b.over){const start=html.lastIndexOf('<div class="panel">');if(start>=0){const hidden=!!S.ui.battleCommandsHidden,controls='<div class="battle-command-controls">'+(teamAutoAllowed()?'<button class="btn sm '+(S.ui.autoTeam?'pri':'')+'" data-a="teamAuto" aria-pressed="'+!!S.ui.autoTeam+'">ออโต้ทีม '+(S.ui.autoTeam?'เปิด':'ปิด')+'</button>':'')+(b.allies.length>1?'<button class="btn sm" data-a="bt" data-v="auto:1" aria-pressed="'+!!S.ui.autoPet+'">อสูรออโต้ '+(S.ui.autoPet?'เปิด':'ปิด')+'</button>':'')+'<button class="btn sm" data-a="battleCommands" aria-expanded="'+!hidden+'" aria-controls="battleCommandBody">'+(hidden?'แสดงคำสั่ง':'ซ่อนคำสั่ง')+'</button></div>';html=html.slice(0,start)+'<section class="battle-command-dock"><div id="battleCommandBody" class="battle-command-body" '+(hidden?'hidden':'')+'>'+html.slice(start,-6)+'</div>'+controls+'</section></div>';}}

 const side=(units,enemy)=>'<section class="battle-side-summary"><small>'+(enemy?'ศัตรู':'ทีมเรา')+'</small><div class="battle-side-units">'+units.map((u,i)=>statusBattleCard('<button class="battle-vital '+(u.hp<=0?'down ':'')+(b.cur===u.id?'acting ':'')+((enemy?b.target:b.atarget)===i?'selected':'')+'" data-a="bt" data-v="'+(enemy?'target:':'ally:')+i+'"><span class="battle-face" data-u="'+esc(u.id)+'">'+portrait(u.img||u.sp,28,{form:u.evo||0})+'</span><div class="battle-meter"><b><span class="battle-unit-name">'+esc(u.name)+'</span><small class="battle-level">Lv '+esc(u.lv)+'</small></b>'+bar(u.hp,u.st.hp)+'<small>HP '+u.hp+'/'+u.st.hp+'</small>'+bar(u.mp,u.st.mp,'mp')+'<small>MP '+u.mp+'/'+u.st.mp+'</small></div>'+(b.fx||[]).filter(f=>f.id===u.id).map(f=>'<span class="fx '+esc(f.c)+'">'+esc(f.t)+'</span>').join('')+'</button>',u)).join('')+'</div></section>';
 const overview='<div class="battle-vitals">'+side(b.enemies,true)+side(b.allies,false)+'</div><button class="btn sm" data-a="battleDetails">'+(S.ui.battleDetails?'ย่อรายละเอียด':'ดูรูปและสถานะการต่อสู้')+'</button>';
 return html.replace('<div class="field battle-enhanced">','<div class="field battle-enhanced">'+overview);
};
const playRender=render;let playScreen=null,playBattle=null;
render=function(){const changed=playScreen!==S.screen,battleChanged=playBattle!==S.battle;if(battleChanged)S.ui.battleCommandsHidden=false;playRender();const main=document.querySelector('main');if(main){main.classList?.toggle('play-battle',!!S.battle);main.classList?.toggle('show-battle-details',!!S.ui.battleDetails);if(S.battle&&(battleChanged||changed))main.scrollTop=0;else if(changed&&S.screen!=='zone')main.scrollTop=0;}playScreen=S.screen;playBattle=S.battle;};
// Every class swaps freely during an allied command turn.
const playAutoAct=aiAct;aiAct=function(){const b=B(),u=b&&uById(b.cur);if(b&&!b.over&&u?.side==='ally'&&teamAutoUnit(u)&&b.enemies.some(e=>e.hp>e.st.hp*.5)){
 const slot=b.allies.findIndex((a,i)=>i>0&&a.kind==='pet'&&a.hp<=0),reserve=carriedPets().find(p=>p.hp>0&&!b.allies.some(a=>a.uid===p.uid));
 if(slot>0&&reserve){b.atarget=slot;b.menu='main';battleAction('swap:'+reserve.uid);}
 }return playAutoAct();};

// Crystal experience stops exactly at the owner's level, without banking overflow.
function growthCrystalExp(p,amount){const cap=Math.min(MAXLV,Math.max(1,Math.floor(S.P.lv)));if(p.lv>=cap)return 0;let remaining=-(Math.max(0,Number(p.exp)||0));for(let lv=p.lv;lv<cap;lv++)remaining+=need(lv);return Math.max(0,Math.min(amount,remaining));}
for(const it of Object.values(CON)){if(it.petExp)it.d+=' · ใช้เพิ่มเลเวลได้สูงสุดเท่าผู้เล่น EXP ส่วนเกินไม่สะสม';}

// Keep audio preferences on this device, separate from player progression.
const AUDIO_PREF_KEY=SB_ENV==='test'?'sealbeast_audio_v1':'sealbeast_audio_v1';
const audioLevel=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):1;
Sound.musicVolume=1;Sound.effectsVolume=1;
const mixerLoadBase=Sound.load;
Sound.load=function(){mixerLoadBase.call(this);try{const p=JSON.parse(localStorage.getItem(AUDIO_PREF_KEY)||'{}');this.musicVolume=audioLevel(p.musicVolume);this.effectsVolume=audioLevel(p.effectsVolume);}catch(e){this.musicVolume=1;this.effectsVolume=1;}};
Sound.load();
const mixerSaveBase=Sound.save;
Sound.save=function(){mixerSaveBase.call(this);try{localStorage.setItem(AUDIO_PREF_KEY,JSON.stringify({enabled:this.enabled,volume:this.volume,musicVolume:this.musicVolume,effectsVolume:this.effectsVolume}));}catch(e){}};
function audioTrackKind(key){return ['forest','intro','tense','town','water'].includes(key)||Object.entries(ExtraAudio.groups).some(([group,keys])=>group.endsWith('Music')&&keys.includes(key))?'music':'effects';}
function audioBus(kind){if(!Sound.ctx||!Sound.master)return Sound.master;if(Sound.mixContext!==Sound.ctx){Sound.mixContext=Sound.ctx;Sound.musicBus=Sound.ctx.createGain();Sound.effectsBus=Sound.ctx.createGain();Sound.musicBus.gain.value=Sound.musicVolume;Sound.effectsBus.gain.value=Sound.effectsVolume;Sound.musicBus.connect(Sound.master);Sound.effectsBus.connect(Sound.master);}return kind==='music'?Sound.musicBus:Sound.effectsBus;}
Sound.setChannelVolume=function(kind,value){if(!['music','effects'].includes(kind))return;this[kind+'Volume']=audioLevel(Number(value));const bus=this[kind+'Bus'];if(bus&&this.ctx)bus.gain.setTargetAtTime(this[kind+'Volume'],this.ctx.currentTime,.03);this.save();};
soundPanel=function(){const slider=(id,label,value,output)=>'<label class="row"><span>'+label+'</span><input id="'+id+'" type="range" min="0" max="100" step="1" value="'+Math.round(value*100)+'" style="flex:1;min-width:0" aria-label="'+label+'"><output id="'+output+'" style="min-width:3em;text-align:right">'+Math.round(value*100)+'%</output></label>';return '<div class="card stack"><div class="row"><h3 class="grow">'+ct('เสียงเกม','Game audio','游戏声音')+'</h3><button class="btn sm" data-a="soundtoggle" aria-pressed="'+Sound.enabled+'">'+(Sound.enabled?ct('🔊 เปิดอยู่','🔊 On','🔊 已开启'):ct('🔇 กดเพื่อเปิดเสียง','🔇 Enable audio','🔇 开启声音'))+'</button></div>'+slider('soundVolume',ct('เสียงรวม','Master volume','总音量'),Sound.volume,'soundPercent')+slider('soundMusicVolume',ct('เสียงเพลง','Music volume','音乐音量'),Sound.musicVolume,'soundMusicPercent')+slider('soundEffectsVolume',ct('เสียงเอฟเฟกต์','Effects volume','音效音量'),Sound.effectsVolume,'soundEffectsPercent')+'<small class="sub">'+ct('ปรับได้ทันที 0–100% เสียงรวมควบคุมทุกเสียง และจำระดับเสียงไว้ในเครื่องนี้','Changes apply immediately. Master volume controls all audio. Preferences are saved on this device.','即时调整0–100%。总音量控制所有声音，设置保存在此设备。')+'</small></div>';};
document.addEventListener('input',event=>{const kinds={soundMusicVolume:['music','soundMusicPercent'],soundEffectsVolume:['effects','soundEffectsPercent']},entry=kinds[event.target?.id];if(!entry)return;Sound.setChannelVolume(entry[0],Number(event.target.value)/100);const output=document.getElementById(entry[1]);if(output)output.textContent=Math.round(Sound[entry[0]+'Volume']*100)+'%';});

function campSelection(name){const cap=baseOf(S.P.cls)==='summoner'?3:1,carried=carriedPets().map(p=>p.uid),field=name==='campGuardPets'?'guardPicks':'raidPicks';if(!Array.isArray(CAMP[field]))CAMP[field]=(name==='campGuardPets'&&CAMP.pets?.length?CAMP.pets:S.P.party||[]).slice(0,cap);CAMP[field]=CAMP[field].filter(id=>carried.includes(id)).slice(0,cap);return CAMP[field];}
function campTeamPicker(name,label){const ids=campSelection(name),cap=baseOf(S.P.cls)==='summoner'?3:1;return '<fieldset class="card stack"><legend>'+label+' · '+ids.length+'/'+cap+' ตัว</legend><small>เลือกจากอสูรที่พกในกระเป๋า ไม่เปลี่ยนทีมเดินป่า</small>'+carriedPets().map(p=>'<label class="row">'+portrait(p.sp,36,{form:p.form||0})+'<input type="checkbox" name="'+name+'" value="'+p.uid+'" '+(ids.includes(p.uid)?'checked':ids.length>=cap?'disabled':'')+'>'+esc(petName(p))+' · Lv '+p.lv+'</label>').join('')+(!carriedPets().length?'<p>ไม่มีอสูรในกระเป๋า</p>':'')+'</fieldset>';}
const selectedCampView=vCampBase;vCampBase=function(){let h=selectedCampView();if(CAMP.room?.status==='active')return h;h=h.replace(/<label>ผู้เฝ้าค่าย[^<]*<\/label><select id="campPet">[\s\S]*?<\/select>/,campTeamPicker('campGuardPets','เลือกอสูรเฝ้าค่าย'));h=h.replace(/<label>อสูรสำหรับจู่โจม[^<]*<\/label><select id="campAttackPet">[\s\S]*?<\/select>/,campTeamPicker('campRaidPets','เลือกอสูรจู่โจม'));h=h.replace('จัดผู้ผนึกพร้อมอสูรเฝ้าค่าย นักอัญเชิญใช้ได้สูงสุด 3 ตัว: ตัวหลักที่เลือก และเสริมอัตโนมัติจากอสูรที่พักค่าย ระบบควบคุมเมื่อคุณไม่ออนไลน์','เลือกทีมเฝ้าค่ายจากอสูรในกระเป๋า นักอัญเชิญและสายขั้นต่อยอดเลือกได้สูงสุด 3 ตัว อาชีพอื่น 1 ตัว ระบบควบคุมเมื่อคุณไม่ออนไลน์');h=h.replace('ผู้จู่โจมใช้อสูรตัวหลักที่เลือก นักอัญเชิญเสริมจากอสูรที่พกได้สูงสุด 3 ตัว ห้ามสลับ','ทีมจู่โจมใช้เฉพาะอสูรที่ติ๊กเลือกจากกระเป๋า นักอัญเชิญสูงสุด 3 ตัว อาชีพอื่น 1 ตัว ห้ามสลับ');return h;};
document.addEventListener('change',event=>{const el=event.target;if(!['campGuardPets','campRaidPets'].includes(el?.name))return;const field=el.name==='campGuardPets'?'guardPicks':'raidPicks',ids=campSelection(el.name),cap=baseOf(S.P.cls)==='summoner'?3:1;if(el.checked&&!ids.includes(Number(el.value))&&ids.length<cap)ids.push(Number(el.value));if(!el.checked)CAMP[field]=ids.filter(id=>id!==Number(el.value));render();});
handlers.campRegister=async()=>{const pets=[...campSelection('campGuardPets')];if(!pets.length)return toast('เลือกอสูรเฝ้าค่ายก่อน');await gsSave(true);await campCall('camp_register',{pets});await campCall('camp_list');};
handlers.campBegin=async target=>{const pets=[...campSelection('campRaidPets')];if(!pets.length)return toast('เลือกอสูรจู่โจมก่อน');await gsSave(true);if(!CAMP.request)CAMP.request=crypto.randomUUID().replace(/-/g,'');await campCall('camp_begin',{target,pets,request:CAMP.request});};

function configuredDefenseReady(){return (CAMP.pets||[]).some(id=>carriedPets().some(p=>p.uid===id));}
const registeredCampView=vCampBase;vCampBase=function(){let h=registeredCampView();if(CAMP.room?.status==='active')return h;if(!configuredDefenseReady()){h='<p class="card" role="status">ต้องเลือกและกดตั้งอสูรเฝ้าค่ายก่อน จึงจะจู่โจมค่ายอื่นได้</p>'+h;h=h.replace(/<button[^>]*data-a="campBegin"[^>]*>/g,b=>b.includes('disabled')?b:b.replace('<button','<button disabled'));}return h;};
const registeredGuildWarView=vGuildWar;vGuildWar=function(){let h=registeredGuildWarView(),d=GUILD_UI.data;if(d?.guild){const panel='<section class="card stack"><h3>ทีมตั้งรับค่ายและสงครามกิล</h3><p>ใช้ทีมตั้งรับเดียวกับอสูรเฝ้าค่าย ต้องลงทะเบียนก่อนโจมตี ระบบใช้เฉพาะอสูรตั้งรับที่ลงทะเบียนไว้เมื่อถูกโจมตี</p>'+campTeamPicker('campGuardPets','เลือกทีมตั้งรับจากกระเป๋า')+'<button class="btn pri" data-a="guildDefenseSave" '+(GUILD_UI.busy?'disabled':'')+'>ลงทะเบียนทีมตั้งรับ</button><small>'+(d.defense?.ready?'ลงทะเบียนแล้ว · '+d.defense.pets.length+' ตัว':'ยังไม่ได้ลงทะเบียนทีมตั้งรับ')+'</small></section>';h=h.replace('<div class="card"><b>',panel+'<div class="card"><b>');if(!d.defense?.ready||!configuredDefenseReady())h=h.replace(/<button[^>]*data-a="guildAttack"[^>]*>/g,b=>b.includes('disabled')?b:b.replace('<button','<button disabled'));}return h;};
handlers.guildDefenseSave=()=>{const pets=[...campSelection('campGuardPets')];if(!pets.length)return toast('เลือกอสูรตั้งรับก่อน');guildRequest('guild_defense',{pets});};

// Presentation only: keep authenticated rooms, targeting, commands and rewards intact.
const ONLINE_COMPACT={key:'',hidden:false,details:false,effectStamp:''};
function compactRoom(mode=S.screen){return mode==='pvp'?PVP.room:mode==='world'?WORLD.room:mode==='camp'?CAMP.room:mode==='guildwar'?GUILD_UI.warRoom:null;}
function compactBattleReady(mode=S.screen){const r=compactRoom(mode);return !!r?.battle&&(mode==='guildwar'||['active','finished'].includes(r.status));}
handlers.onlineCommands=()=>{ONLINE_COMPACT.hidden=!ONLINE_COMPACT.hidden;render();};
handlers.onlineBattleDetails=()=>{ONLINE_COMPACT.details=!ONLINE_COMPACT.details;ONLINE_COMPACT.hidden=false;render();};
handlers.guildBattleClose=()=>{GUILD_UI.replaySerial++;GUILD_UI.warRoom=null;GUILD_UI.warFinal=null;render();};
function compactButton(action,text,value='',disabled=false,primary=false){return '<button class="btn sm '+(primary?'pri':'')+'" data-a="'+action+'" '+(value?'data-v="'+esc(value)+'" ':'')+(disabled?'disabled ':'')+'>'+text+'</button>';}
function compactOnlineCard(u,mode,r,own){
 const selected=mode==='pvp'?(own?PVP.friend:PVP.target)===u.id:mode==='world'&&WORLD.friend===u.id;
 const action=mode==='pvp'?(own?'pvpFriend':'pvpTarget'):mode==='world'?'wbFriend':mode==='camp'?(own?'campFriend':'campTarget'):'';
 const image=u.kind==='player'&&!u.form?(u.owner===r.me?'player':'cls:'+u.cls):u.img||u.sp;
 const immortal=mode==='world'&&u.immortalWorld;
 const statuses=Object.keys(u.status||{}).filter(k=>STS[k]).map(k=>STS[k].n).join(' · ');
 return statusBattleCard('<button class="battle-vital '+(u.hp<=0?'down ':'')+(u.id===r.battle.cur?'acting ':'')+(selected?'selected':'')+'" '+(action?'data-a="'+action+'" data-v="'+esc(u.id)+'" ':'')+(!own&&u.hp<=0?'disabled ':'')+'title="'+esc(u.name)+' · Lv '+u.lv+(statuses?' · '+esc(statuses):'')+'"><span class="battle-face" data-u="'+esc(u.id)+'">'+portrait(image,28,{form:u.evo||0})+'</span><div class="battle-meter"><b><span class="online-unit-name" data-user-content>'+esc(u.name)+'</span> <small class="battle-level">Lv '+u.lv+'</small></b>'+bar(immortal?u.st.hp:u.hp,u.st.hp)+'<small>HP '+(immortal?'∞':fmt(u.hp)+'/'+fmt(u.st.hp))+'</small>'+bar(u.mp,u.st.mp,'mp')+'<small>MP '+fmt(u.mp)+'/'+fmt(u.st.mp)+'</small>'+(statuses?'<span class="online-unit-status">'+esc(statuses)+'</span>':'')+'</div></button>',u);
}
function compactOnlineSide(units,title,mode,r,own){const cols=mode==='world'&&own?4:units.length>9?4:units.length>4?3:units.length>1?2:1;return '<section class="online-combat-side"><small>'+title+' · '+units.filter(u=>u.hp>0).length+'/'+units.length+'</small><div class="online-unit-grid" style="--unit-cols:'+cols+'">'+units.map(u=>compactOnlineCard(u,mode,r,own)).join('')+'</div></section>';}
function compactPvpCommands(r,actor){if(r.replaying)return '<p>กำลังแสดงการต่อสู้ · ผลบันทึกแล้ว</p>';if(actor?.owner!==r.me)return '<p>รอ '+esc(actor?.name||'ผู้เล่นอีกฝ่าย')+'</p>';
 return '<p class="online-command-hint">แตะศัตรูเลือกเป้า · แตะฝ่ายเราเลือกเป้าฮีล/บัฟ</p><div class="acts">'+[...new Set([...(actor.skills||[]),'rest','defend'])].map(id=>{const sk=pvpSkill(id,true),cost=sk?costOf(actor,sk):0,cd=cooldownOf(actor,id);return '<button class="btn" data-a="pvpMove" data-v="'+id+'" '+(PVP.busy||PVP.pending||cost>actor.mp||cd>0?'disabled':'')+'>'+skillElementIcon(actor,sk,id)+'<span class="skill-name">'+esc(sk?.n||'ตั้งรับ')+'</span><small>'+(cd?'รอ '+cd+' เทิร์น':cost?'MP '+cost:id==='defend'?'ป้องกัน +50%':'')+(sk?.gc?' · เหรียญ '+sk.gc*actor.lv:'')+'</small></button>';}).join('')+'</div>';
}
function compactOnlineResult(mode,r){if(mode==='world'){const v=r.reward;return '<b>จบการท้าทาย · คะแนน '+fmt(r.sharedScore||0)+'</b><p>'+fmt(v?.gold||0)+' เหรียญ · EXP '+fmt(v?.xp||0)+' · พลัง '+fmt(v?.power||0)+'</p>'+Object.entries(v?.loot||{}).map(([id,n])=>'<p>✦ '+esc(EQ[id]?.n||CON[id]?.n||id)+' ×'+n+'</p>').join('');}
 return '<b>'+(r.winner<0?'เสมอ':r.winner===(r.me??0)?'ชนะ':'แพ้')+'</b><p>'+esc(r.reason||'บันทึกผลแล้ว')+'</p>'+(mode==='pvp'?'<small>ผลเดิมพันบันทึกบนเซิร์ฟเวอร์แล้ว</small>':mode==='camp'?'<small>เงินปัจจุบัน '+fmt(S.P.gold)+' เหรียญ · บันทึกผลจู่โจมแล้ว</small>':'<small>บันทึกคะแนนสงครามกิลแล้ว</small>');}
function compactOnlineBattle(mode,r){
 const b=r.battle,units=[...b.allies,...b.enemies],actor=units.find(u=>u.id===b.cur),finished=r.status==='finished'&&!r.replaying;
 const own=mode==='pvp'?units.filter(u=>u.owner===r.me):b.allies,foes=mode==='pvp'?units.filter(u=>u.owner!==r.me):b.enemies;
 if(mode==='pvp'){if(!own.some(u=>u.id===PVP.friend))PVP.friend=own[0]?.id||'';if(!foes.some(u=>u.id===PVP.target&&u.hp>0))PVP.target=foes.find(u=>u.hp>0)?.id||'';}
 const title={pvp:'PVP',world:'บอสโลก',camp:'จู่โจมค่าย',guildwar:'สงครามกิล'}[mode];
 const state=mode==='guildwar'?GUILD_UI:mode==='pvp'?PVP:mode==='world'?WORLD:CAMP;
 const score=mode==='world'?' · คะแนน '+fmt(finished?r.sharedScore||0:Math.floor((b.damageTotal||0)/Math.max(1,r.players?.length||1)/25)):'';
 let commands=finished?compactOnlineResult(mode,r):mode==='pvp'?compactPvpCommands(r,actor):'<p>ต่อสู้อัตโนมัติ · '+esc(actor?.name||'กำลังประมวลผล')+'</p>';
 if(ONLINE_COMPACT.details){commands+='<details open><summary>รายงานการต่อสู้</summary><div class="online-full-log">'+(b.log||[]).slice(-25).map(line=>'<p>'+esc(line)+'</p>').join('')+'</div></details>'+(mode==='pvp'?foldCard('เดิมพันที่ตกลงไว้',wagerPanel(r)):'');}
 let actions='';if(mode==='pvp'&&!finished)actions+=onlineAutoButton('pvp');
 if(r.replaying&&mode==='guildwar')actions+=compactButton('guildSkipReplay','ข้ามรีเพลย์');
 if(finished)actions+=compactButton(mode==='pvp'?'pvpClear':mode==='world'?'wbClear':mode==='camp'?'campClear':'guildBattleClose','กลับ', '',false,true);
 else if(!r.replaying&&mode==='pvp')actions+=compactButton('pvpLeave','ออก / ยอมแพ้');
 if(mode==='pvp'&&PVP.pending)actions+=compactButton('pvpRetry','ตรวจคำสั่งเดิม','',PVP.busy);
 if(mode==='world'&&WORLD.pending)actions+=compactButton('wbRetry','ตรวจคำสั่งเดิม','',WORLD.busy);
 actions+=compactButton('onlineBattleDetails',ONLINE_COMPACT.details?'ย่อรายงาน':'รายละเอียด');
 actions+='<button class="btn sm" data-a="onlineCommands" aria-controls="onlineCommandBody" aria-expanded="'+!ONLINE_COMPACT.hidden+'">'+(ONLINE_COMPACT.hidden?'แสดงคำสั่ง':'ซ่อนคำสั่ง')+'</button>';
 return '<section class="online-arena"><header class="online-combat-heading"><b>'+title+'</b>'+(mode==='pvp'&&!r.replaying?'<time id="pvpTurnTimer" class="pvp-turn-timer">'+pvpTurnTimeText()+'</time>':'')+(mode==='pvp'&&!r.replaying?'<button class="btn sm online-refresh" data-a="pvpPoll" aria-label="ตรวจสถานะห้อง PVP" '+(PVP.busy?'disabled':'')+'>↻</button>':'')+'<small>รอบ '+(b.round||0)+score+' · '+(r.replaying?'รีเพลย์':finished?'จบแล้ว':actor?'ตาของ '+esc(actor.name):'กำลังรอ')+'</small></header><div class="online-combat-board">'+compactOnlineSide(foes,'ศัตรู',mode,r,false)+compactOnlineSide(own,'ทีมเรา',mode,r,true)+'</div><footer class="online-combat-footer"><p class="online-last-log">'+esc(state.error||(b.log||[]).slice(-1)[0]||'')+'</p><div id="onlineCommandBody" class="online-command-body" '+(ONLINE_COMPACT.hidden?'hidden':'')+'>'+commands+'</div><div class="battle-command-controls">'+actions+'</div></footer></section>';
}
const compactPvpView=vPvp;vPvp=function(){return compactBattleReady('pvp')?compactOnlineBattle('pvp',PVP.room):compactPvpView();};
const compactWorldView=vWorld;vWorld=function(){return compactBattleReady('world')?compactOnlineBattle('world',WORLD.room):compactWorldView();};
const compactCampView=vCamp;vCamp=function(){return compactBattleReady('camp')?compactOnlineBattle('camp',CAMP.room):compactCampView();};
const compactGuildView=vGuildWar;vGuildWar=function(){return compactBattleReady('guildwar')?compactOnlineBattle('guildwar',GUILD_UI.warRoom):compactGuildView();};
const compactRenderBase=render;render=function(){const active=compactBattleReady(),room=active?compactRoom():null,key=active?S.screen+':'+room.id:'';const previousBody=document.querySelector('.online-command-body'),scroll=ONLINE_COMPACT.key===key?previousBody?.scrollTop||0:0;if(ONLINE_COMPACT.key!==key){ONLINE_COMPACT.key=key;ONLINE_COMPACT.hidden=false;ONLINE_COMPACT.details=false;ONLINE_COMPACT.effectStamp='';}compactRenderBase();const main=document.querySelector('main');main?.classList?.toggle('online-combat-screen',active);document.getElementById('app')?.classList?.toggle?.('online-combat-mode',active);if(active){if(main)main.scrollTop=0;const body=document.querySelector('.online-command-body');if(body)body.scrollTop=scroll;if(S.screen==='guildwar'&&room.replaying){const b=room.battle,stamp=key+':'+b.cur+':'+b.round+':'+JSON.stringify([b.effects,[...b.allies,...b.enemies].map(u=>[u.id,u.hp,u.mp])]);if(stamp!==ONLINE_COMPACT.effectStamp){ONLINE_COMPACT.effectStamp=stamp;VQ.push(...(b.effects||[]).slice(-64));(window.requestAnimationFrame||setTimeout)(flushVfx);}}}};

function battlePortraitElements(html,u){if(html.includes('class="battle-portrait-elements"'))return html;const types=[...new Set(u.types||SP[u.sp]?.t||[])].filter(k=>EL[k]);if(!types.length)return html;return html.replace(/(<span class="battle-face"[^>]*>)/,'$1<span class="battle-portrait-elements">'+types.map(elementIcon).join('')+'</span>');}
function statusBattleCard(html,u){html=battleEffectIcons(battlePortraitElements(html,u),u);const statuses=Object.keys(u.status||{}).filter(k=>STS[k]&&u.status[k]);if(!statuses.length)return html;const colors=statuses.map(k=>STS[k].c),label=statuses.map(k=>STS[k].n).join(' · ');return html.replace(/<button\b[^>]*>/,tag=>{tag=tag.replace('class="','class="has-battle-status '+(colors.length>1?'multi-battle-status ':'')).replace(/style="/, 'style="--status-main:'+colors[0]+';--status-gradient:linear-gradient(120deg,'+colors.join(',')+');');if(!tag.includes('style="'))tag=tag.replace('<button','<button style="--status-main:'+colors[0]+';--status-gradient:linear-gradient(120deg,'+colors.join(',')+');"');if(tag.includes('title="'))tag=tag.replace('title="','title="'+esc(label)+' · ');else tag=tag.replace('<button','<button title="'+esc(label)+'"');return tag.replace('<button','<button data-status="'+statuses.join(' ')+'"');});}
const statusUnitCard=ucard;ucard=function(u,i){return statusBattleCard(statusUnitCard(u,i),u);};
const statusPvpCard=pvpCard;pvpCard=function(u,own,me){return statusBattleCard(statusPvpCard(u,own,me),u);};
const statusWorldCard=worldCard;worldCard=function(u,me){return statusBattleCard(statusWorldCard(u,me),u);};
let PVP_TIMEOUT_POLL='';
function pvpTurnTimeText(){const r=PVP.room;if(!r||r.replaying||r.status!=='active')return r?.replaying?'รีเพลย์':'';const actor=[...r.battle.allies,...r.battle.enemies].find(u=>u.id===r.battle.cur);if(r.players[actor?.owner]?.auto)return 'ออโต้';return Math.max(0,Math.ceil((r.deadline-(Date.now()-(PVP.clock||0)))/1000))+' วินาที';}
onlineClockTick=function(){const clock=document.getElementById('pvpTurnTimer');if(clock)clock.textContent=pvpTurnTimeText();const popup=document.getElementById('turnClockPopup');if(popup)popup.hidden=true;const r=PVP.room;if(S.screen!=='pvp'||!r||r.replaying||r.status!=='active'||!PVP.token||PVP.busy||document.hidden)return;const actor=[...r.battle.allies,...r.battle.enemies].find(u=>u.id===r.battle.cur);if(r.players[actor?.owner]?.auto||Date.now()-(PVP.clock||0)<r.deadline)return;const stamp=r.id+':'+r.rev+':'+r.deadline;if(PVP_TIMEOUT_POLL===stamp)return;PVP_TIMEOUT_POLL=stamp;pvpRequest({action:'pvp_poll'},true);};

// Presentation must never interrupt experience, loot or battle completion.
function optionalProgressEffect(fn){try{return fn();}catch(error){console.warn('Skipped game presentation effect',error);}}
const progressionSoundFx=Sound.fx;
Sound.fx=function(...args){return optionalProgressEffect(()=>progressionSoundFx.apply(this,args));};
const progressionExtraPlay=ExtraAudio.play;
ExtraAudio.play=function(...args){return optionalProgressEffect(()=>progressionExtraPlay.apply(this,args));};
for(const key of ['sync','cry','skill']){const original=Sound[key];Sound[key]=function(...args){return optionalProgressEffect(()=>original.apply(this,args));};}
const progressionHeroNotice=showHeroLevelNotice;
showHeroLevelNotice=function(){try{return progressionHeroNotice();}catch(error){HeroLevelNotice.playing=false;HeroLevelNotice.queue.length=0;document.querySelectorAll('.hero-level-notice').forEach(el=>el.remove());console.warn('Skipped hero level animation',error);}};
const progressionEvolutionNotice=showEvolutionNotice;
showEvolutionNotice=function(){try{return progressionEvolutionNotice();}catch(error){EvolutionNotice.playing=false;EvolutionNotice.queue.length=0;document.querySelectorAll('.evolution-notice').forEach(el=>el.remove());console.warn('Skipped evolution animation',error);}};

TOWN_ART.arena='assets/ui/martial-tower-v1.webp';
const TOWER_FLOORS=NPC.map((n,i)=>({n,i})).sort((a,b)=>a.n.lv-b.n.lv||a.i-b.i);
const TOWER_UI={busy:false,error:'',today:'',ready:false,saving:null};
const towerActive=()=>!!S.P?.towerRun?.active;
function towerError(error){return {'tower daily limit':'เข้าหอคอยได้วันละครั้ง วันนี้ใช้สิทธิ์แล้ว','tower heal first':'รักษาตัวและเตรียมทีมก่อนเข้าหอคอย','tower wrong run':'ข้อมูลรอบหอคอยไม่ตรง กรุณาตรวจสถานะอีกครั้ง','tower wrong floor':'ชั้นหอคอยไม่ตรง กรุณาตรวจสถานะอีกครั้ง','tower locked':'ต้องจบหอคอยหรือแพ้ก่อนออกไปทำกิจกรรมอื่น'}[error]||sheetError({error});}
function towerApply(run,coupons,recovery){const old=S.P.towerRun;S.P.towerBest=run.best||0;S.P.towerRun={...run,checkpoint:old?.id===run.id?old.checkpoint:null};if(Number.isFinite(coupons))GACHA.coupons=coupons;if(recovery&&S.P.towerRecoveryApplied!==recovery.id){if(recovery.cleanse||recovery.id.endsWith(':entry')||recovery.id.endsWith(':exit')){S.P.ailments={};S.P.pets.forEach(p=>p.ailments={});}S.P.hp=recovery.hp;S.P.mp=recovery.mp;for(const v of recovery.pets){const p=petBy(v.uid);if(p){p.hp=v.hp;p.mp=v.mp;}}S.P.towerRecoveryApplied=recovery.id;}if(recovery?.reward&&S.P.towerTreasureApplied!==recovery.reward.id){const w=recovery.reward;S.P.owned.push(w.gear);S.P.gold+=w.gold;S.P.towerTreasureApplied=w.id;toast('หีบสมบัติ: '+EQ[w.gear].n+' · '+fmt(w.gold)+' เหรียญ');}}
function towerCheckpoint(){const run=S.P?.towerRun,b=S.battle;if(run&&b?.towerRun===run.id){run.checkpoint=JSON.parse(JSON.stringify(b));}}
async function towerSaveNow(){if(TOWER_UI.saving)await TOWER_UI.saving;towerCheckpoint();save();const data=gsData();TOWER_UI.saving=(async()=>{const r=await lbPost({action:'save',data});if(!r.ok)throw Error(r.error||'save failed');S.P.gsAt=r.at;GS.lastJson=data;GS.lastAt=Date.now();return r;})();try{return await TOWER_UI.saving;}finally{TOWER_UI.saving=null;}}
async function towerStatus(){if(TOWER_UI.busy)return;TOWER_UI.busy=true;TOWER_UI.error='';render();try{const r=await lbPost({action:'tower_status'});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);TOWER_UI.today=r.today;TOWER_UI.ready=true;if(towerActive())towerResume();else if(S.battle?.towerRun===r.run.id){S.battle=null;S.P.towerRun.checkpoint=null;S.screen=r.run.outcome==='lose'?'hospital':'arena';}}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;save();render();}}
function towerStartFloor(){const run=S.P.towerRun,entry=TOWER_FLOORS[run.floor-1];if(!run.active||!entry)return;S.battle=null;S.P.party=S.P.party.filter(uid=>run.carried.includes(uid)&&S.P.carried.includes(uid));const n=entry.n,es=[humanUnit(n.n,n.cls,n.lv,0)];n.pets.forEach(([sp,lv],i)=>{const u=wildUnit(sp,lv,i+1);u.name+='ของ'+n.n.split(' ')[0];u.kind='npcpet';es.push(u);});
 // startBattle advances immediately; set the run marker before its first render/timer.
 TOWER_UI.starting={id:run.id,floor:run.floor};try{startBattle(es,'npc',entry.i);}finally{TOWER_UI.starting=null;}towerCheckpoint();save();render();}
const towerStartBattle=startBattle;
startBattle=function(...args){if(TOWER_UI.starting){const prior=newRound;newRound=function(){Object.assign(S.battle,{towerRun:TOWER_UI.starting.id,towerFloor:TOWER_UI.starting.floor});return prior();};try{return towerStartBattle(...args);}finally{newRound=prior;}}return towerStartBattle(...args);};
function towerResumePending(){const b=S.battle;if(!b?.towerRun||b.over||b.menu!=='wait')return;const next=b.towerContinuation;const fn=next==='ai'?aiAct:next==='charge'?()=>releaseCharge(uById(b.cur)):advance;battleLater(fn,200);}
function towerResume(){const run=S.P.towerRun;if(!run?.active)return;S.zone=null;if(run.restPending){S.battle=null;S.screen='arena';return;}const cp=run.checkpoint;if(cp?.towerRun===run.id&&cp.towerFloor===run.floor){if(S.battle?.towerRun!==run.id||S.battle.towerFloor!==run.floor){S.battle=JSON.parse(JSON.stringify(cp));S.screen='battle';towerResumePending();}else S.screen='battle';}else towerStartFloor();}
const towerBattleLater=battleLater;
battleLater=function(fn,ms){const b=S.battle;if(!b?.towerRun)return towerBattleLater(fn,ms);const serial=(b.towerTimerSerial||0)+1;b.towerTimerSerial=serial;b.towerContinuation=fn===aiAct?'ai':fn===advance?'advance':'charge';return towerBattleLater(()=>{if(b.towerTimerSerial!==serial||b.over)return;b.towerContinuation=null;fn();},ms);};
handlers.towerConfirm=function(){if(TOWER_UI.busy||towerActive()||!TOWER_UI.ready)return;S.ui.confirm={msg:'เข้าหอคอยประลองยุทธ? ต้องเริ่มชั้น 1 และสู้ต่อเนื่องจนจบหรือตาย ออกไปใช้ยา รักษาตัว หรือเปลี่ยนอสูรจากค่ายไม่ได้ ใช้สกิลฮีลและพักฟื้นได้ มีจุดพักทุก 5 ชั้น ฟื้น HP/MP ทั้งหมดฟรีก่อนเข้าและเมื่อจบ แพ้ไม่เสีย EXP หรือเงิน · วันละครั้ง (รีเซ็ตเที่ยงคืนเวลาไทย)',act:'towerEnter'};render();};
handlers.towerEnter=async function(){if(TOWER_UI.busy)return;S.ui.confirm=null;TOWER_UI.busy=true;TOWER_UI.error='';render();try{if(S.zone||S.battle)throw Error('finish other battle');await towerSaveNow();const r=await lbPost({action:'tower_enter'});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);TOWER_UI.today=r.today||r.run.day;towerStartFloor();await towerSaveNow();}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;render();}};
handlers.towerRefresh=towerStatus;
handlers.arena=()=>toast('เข้าหอคอยจากชั้น 1 ด้วยปุ่มยืนยันเท่านั้น');
handlers.towerNext=async function(){const b=S.battle,run=S.P.towerRun;if(TOWER_UI.busy||!b?.over||b.towerRun!==run?.id)return;TOWER_UI.busy=true;TOWER_UI.error='';render();try{await towerSaveNow();const r=await lbPost({action:'tower_result',run:run.id,floor:b.towerFloor,outcome:b.over.res==='win'?'win':'lose'});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);if(r.run.active){towerResume();await towerSaveNow();}else{S.battle=null;S.screen=r.run.outcome==='lose'?'hospital':'town';S.P.towerRun.checkpoint=null;await towerSaveNow();lbSubmit(true);}}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;save();render();}};
const towerEndBattle=endBattle;
async function towerRecordResult(b){if(TOWER_UI.busy||S.battle!==b||!b.over||b.towerResultSaved)return;TOWER_UI.busy=true;TOWER_UI.error='';render();try{await towerSaveNow();const r=await lbPost({action:'tower_result',run:b.towerRun,floor:b.towerFloor,outcome:b.over.res==='win'?'win':'lose'});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);b.towerResultSaved=true;if(r.run.lastCouponFloor===b.towerFloor&&r.run.lastCouponReward===2&&!b.towerCouponNotice){b.towerCouponNotice=true;b.over.lines.push('คูปองผ่านชั้นครั้งแรก +2 ใบ');}await towerSaveNow();if(!S.P.lbOff)lbSubmit(true);}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;render();}}
endBattle=function(res){const b=S.battle,wasOver=b?.over;let out;if(b?.towerRun&&!wasOver){syncBack();const lines=[];if(res==='win'){const n=NPC[b.meta],first=!S.P.arena[b.meta],base=first?n.gold:Math.round(n.gold*.3),lucky=b.allies[0].pas.filter(k=>k==='lucky').length,gold=Math.round(base*(1+.25*lucky));S.P.gold+=gold;S.P.arena[b.meta]=(S.P.arena[b.meta]||0)+1;lines.push('เงินรางวัล '+fmt(gold)+' เหรียญ'+(first?' (ผ่านครั้งแรก)':''),'หอคอยไม่แจก EXP หรือไอเท็ม');b.over={res,title:'ชัยชนะ',lines};Sound.fx('win');}else{b.over={res,title:'จบการท้าทาย',lines:['พ่ายแพ้ที่ชั้น '+b.towerFloor,'ไม่เสีย EXP และเงิน · ฟื้น HP/MP และรักษาสถานะทั้งหมดฟรีเมื่อจบการท้าทาย']};Sound.fx('lose');}b.menu='end';}else out=towerEndBattle(res);if(b?.towerRun&&!wasOver&&b.over){towerCheckpoint();save();setTimeout(()=>towerRecordResult(b),0);}return out;};
const towerBattleAction=battleAction;
battleAction=function(value){if(S.battle?.towerRun){const k=String(value).split(':')[0];if(k==='done')return handlers.towerNext();if(k==='swap'&&!S.P.towerRun.carried.includes(Number(value.split(':')[1])))return toast('เรียกได้เฉพาะอสูรที่พกเข้าหอคอย');if(k==='item'||k==='seal'||k==='flee'||value==='menu:item'||value==='menu:seal')return toast('หอคอยห้ามใช้ไอเท็ม ผนึก และหนี ใช้สกิลฮีลหรือพักฟื้นได้');}return towerBattleAction(value);};
const towerGo=go;
go=function(screen){if(towerActive()&&!['battle','settings'].includes(screen)){toast('ออกจากหอคอยไม่ได้จนกว่าจะเคลียร์หอคอยหรือตาย');towerResume();render();return;}if(screen==='arena'){if(S.zone||S.battle)return towerGo(screen);S.screen='arena';render();towerStatus();return;}return towerGo(screen);};
for(const action of ['heal','use','baguse','useitem','petCarry','petStore','dopromote','buy','craft','surrender','dosurrender','dozone']){const original=handlers[action];if(original)handlers[action]=function(...args){if(towerActive())return toast('ใช้ไม่ได้ระหว่างอยู่ในหอคอย');return original(...args);};}
const towerPackLocked=packLocked;packLocked=function(){return towerActive()||towerPackLocked();};
const towerCommunityBusy=communityBattleBusy;communityBattleBusy=function(){return towerActive()||towerCommunityBusy();};
const towerSave=save;save=function(){towerCheckpoint();return towerSave();};
vArenaBase=function(){const run=S.P.towerRun,used=run?.day===TOWER_UI.today;if(towerActive()&&run.restPending)return towerRestView();return '<div class="stack"><div class="row"><h2 class="grow">หอคอยประลองยุทธ</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="card stack"><h3>'+TOWER_FLOORS.length+' ชั้น · สถิติสูงสุด '+fmt(S.P.towerBest||0)+' ชั้น</h3><p>สู้ต่อเนื่องจากชั้น 1 ขึ้นไป ใช้เฉพาะอสูรในกระเป๋า ห้ามใช้ยาและออกไปรักษา จนกว่าจะเคลียร์หอคอยหรือตาย ใช้สกิลฮีลและพักฟื้นได้</p><p>จุดพักทุก 5 ชั้น · ผ่านชั้นครั้งแรกได้คูปอง 2 ใบ · แพ้ไม่เสีย EXP หรือเงิน · ก่อนเข้าและเมื่อจบฟื้น HP/MP ทุกตัวฟรี</p><p>วันละครั้ง · รีเซ็ต 00:00 เวลาไทย · รางวัลเป็นเงินเท่านั้น และคูปอง 2 ใบเมื่อผ่านแต่ละชั้นครั้งแรก · ไม่มี EXP หรือไอเท็ม</p><button class="btn pri full" data-a="towerConfirm" '+(TOWER_UI.busy||!TOWER_UI.ready||used?'disabled':'')+'>'+(TOWER_UI.busy?'กำลังตรวจสิทธิ์…':used?'วันนี้ใช้สิทธิ์แล้ว':'ยืนยันเข้าหอคอย · เริ่มชั้น 1')+'</button><button class="btn sm" data-a="towerRefresh">ตรวจสิทธิ์อีกครั้ง</button>'+(TOWER_UI.error?'<p role="alert">'+esc(TOWER_UI.error)+'</p>':'')+'</div><details class="card"><summary>ดูคู่ต่อสู้ทุกชั้น</summary>'+TOWER_FLOORS.map(({n,i},floor)=>'<div class="item">'+portrait('npc:'+n.cls,38)+'<div><b>ชั้น '+(floor+1)+' · '+esc(n.n)+'</b><small>Lv '+n.lv+' · '+esc(CLS[n.cls].n)+' · '+fmt(S.P.arena[i]?Math.round(n.gold*.3):n.gold)+' เหรียญ</small></div></div>').join('')+'</details></div>';};
LBTAB.tower={n:'หอคอยประลองยุทธ',v:r=>fmt(r.towerBest||0)+' ชั้น',k:r=>r.towerBest||0};
const towerBattleView=vBattle;
vBattle=function(){let html=towerBattleView(),b=S.battle;if(!b?.towerRun)return html;html='<div class="tower-floor">หอคอยประลองยุทธ · ชั้น '+b.towerFloor+'/'+TOWER_FLOORS.length+'</div>'+html;html=html.replace(/<button\b[^>]*data-v="menu:(?:item|seal)"[^>]*>[\s\S]*?<\/button>/g,'');if(b.over)html=html.replace('data-v="done">ไปต่อ','data-v="done" '+(TOWER_UI.busy?'disabled':'')+'>'+(TOWER_UI.busy?'กำลังบันทึก…':b.over.res==='lose'?'จบการท้าทาย':b.towerFloor===TOWER_FLOORS.length?'เคลียร์หอคอย · กลับเมือง':b.towerFloor%5===0?'ไปจุดพัก':'ขึ้นชั้นถัดไป'));if(TOWER_UI.error)html+='<div class="card" role="alert">'+esc(TOWER_UI.error)+' · กดไปต่อเพื่อลองบันทึกอีกครั้ง</div>';return html;};
const towerRender=render;
render=function(){if(towerActive()&&S.screen!=='settings'&&(S.screen!=='battle'||!S.battle?.towerRun)&&!TOWER_UI.starting)towerResume();towerRender();if(S.battle?.towerRun)save();if(towerActive()&&!TOWER_UI.ready&&!TOWER_UI.bootChecked){TOWER_UI.bootChecked=true;setTimeout(towerStatus,0);}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&towerActive())towerResumePending();});

function towerRestView(){const choice=(type,title,description)=>'<button class="door tower-rest-choice" data-a="towerRest" data-v="'+type+'" '+(TOWER_UI.busy?'disabled':'')+'>'+routePicture(type,false)+'<b>'+title+'</b><small>'+description+'</small><span class="chip">เลือก'+title+'</span></button>';return '<div class="stack"><h2>จุดพัก · หลังชั้น '+S.P.towerRun.restPending+'</h2><p>เลือกได้หนึ่งอย่าง ก่อนขึ้นชั้น '+S.P.towerRun.floor+'</p>'+towerRestVitals()+'<div class="grid2 tower-rest-grid">'+choice('revival','บ่อชุบชีวิต','อสูรที่พกและหมดสติฟื้น HP เต็มและ MP ครึ่งหนึ่ง หากไม่มีผู้หมดสติ ฟื้น HP 50% ให้ผู้ที่มีสัดส่วน HP ต่ำที่สุดหนึ่งตัว')+choice('spring','ลำธารใส','ฟื้น HP และ MP 35% ให้ผู้เล่นและอสูรที่พกซึ่งยังมีสติ')+choice('cleanse','บ่อชำระล้าง','ล้างสถานะผิดปกติทั้งหมดให้ผู้ผนึกและอสูรทุกตัว รวมในค่าย ฟรี พร้อมฟื้น HP/MP 10% ให้ผู้ที่ยังมีสติ')+choice('treasure','หีบสมบัติ','อุปกรณ์ที่ไม่ใช่ตำนาน 1 ชิ้น และเงิน '+fmt(150+S.P.towerRun.restPending*30)+' เหรียญ · ไม่ฟื้นพลังหรือล้างสถานะ')+'</div>'+(TOWER_UI.error?'<p role="alert">'+esc(TOWER_UI.error)+'</p>':'')+'</div>';}
handlers.towerRest=async function(choice){const run=S.P.towerRun;if(TOWER_UI.busy||!run?.restPending||!['spring','revival','cleanse','treasure'].includes(choice))return;TOWER_UI.busy=true;TOWER_UI.error='';render();try{await towerSaveNow();const r=await lbPost({action:'tower_rest',run:run.id,choice});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);towerStartFloor();await towerSaveNow();}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;render();}};

ROUTE_ART.treasure='assets/ui/tower-rest-treasure-v1.webp';
function towerRestVitals(){return '<section class="tower-rest-roster"><h3>ผู้ผนึกและอสูรที่พก · พลังปัจจุบัน</h3><div class="tower-rest-units">'+bagHealTargets().map(t=>{const states=Object.keys(storedAilments(t.o));return '<article class="card tower-rest-unit"><div class="row">'+portrait(t.key==='P'?'player':t.o.sp,36,{form:t.o.form||0})+'<b>'+esc(t.name)+' <small>Lv '+t.o.lv+'</small></b></div><small>HP '+fmt(t.o.hp)+'/'+fmt(t.st.hp)+(t.o.hp<=0?' · หมดสติ':'')+'</small>'+bar(t.o.hp,t.st.hp)+'<small>MP '+fmt(t.o.mp)+'/'+fmt(t.st.mp)+'</small>'+bar(t.o.mp,t.st.mp,'mp')+'<div class="row wrap">'+states.map(k=>'<span class="battle-effect-icon" title="'+esc(STS[k].n)+'">'+battleEffectImage(k,STS[k].n)+'</span>').join('')+'</div><small>'+(states.length?states.map(k=>STS[k].n).join(' · '):'ไม่มีสถานะผิดปกติ')+'</small></article>';}).join('')+'</div></section>';}

function forestPassed(z){return (S.P.forestClears?.[z.id]||0)>0||(!z.train&&(z.final?(S.P.cleared||0)>0:(S.P.zoneMax||1)>z.id));}
function forestBossFor(z){return forestPassed(z)?pick(z.bosses||[z.boss]):z.boss;}
const forestStoryEnd=endBattle;
endBattle=function(result){const b=S.battle,first=b&&!b.over&&b.kind==='boss'&&result==='win';const out=forestStoryEnd(result);if(first&&b.over?.res==='win'){S.P.forestClears=S.P.forestClears||{};S.P.forestClears[b.meta]=(S.P.forestClears[b.meta]||0)+1;save();}return out;};

// Durable ailments belong to player saves; online match snapshots remain independent.
const PERSISTENT_AILMENTS=['poison','burn','confuse','para','static','freeze','chill'];
function persistentBattleUnit(u){return !!S.battle&&!['pvp','world','camp','guildwar'].includes(S.battle.kind)&&u.side==='ally'&&['player','pet'].includes(u.kind);}
function retainedBattleAilments(u){return persistentBattleUnit(u)?Object.fromEntries(PERSISTENT_AILMENTS.filter(k=>u.status?.[k]).map(k=>[k,u.status[k]])):{};}
function storedAilments(o){return Object.fromEntries(PERSISTENT_AILMENTS.filter(k=>o.ailments?.[k]).map(k=>[k,Math.max(2,Number(o.ailments[k])||2)]));}
const forestPlayerUnit=playerUnit;playerUnit=function(){const u=forestPlayerUnit();u.status={...u.status,...storedAilments(S.P)};return u;};
const forestPetUnit=petUnit;petUnit=function(p){const u=forestPetUnit(p);u.status={...u.status,...storedAilments(p)};return u;};
const forestSyncBack=syncBack;syncBack=function(){const b=S.battle;forestSyncBack();if(!b)return;for(const u of b.allies){const o=u.kind==='player'?S.P:u.kind==='pet'?petBy(u.uid):null;if(o)o.ailments=Object.fromEntries(PERSISTENT_AILMENTS.filter(k=>u.status[k]).map(k=>[k,Math.max(2,u.status[k]) ]));}};
// Swapped-out pets also keep their ailments when their battle unit leaves the field.
const forestBattleAction=battleAction;battleAction=function(v){if(forestAutoLocked()&&String(v).startsWith('auto:'))return toast('ต่อสู้อัตโนมัติปลดล็อกเลเวล 10');if(String(v).startsWith('swap:'))syncBack();return forestBattleAction(v);};
const forestFullHeal=fullHeal;fullHeal=function(){forestFullHeal();S.P.ailments={};(S.zone?carriedPets():S.P.pets).forEach(p=>p.ailments={});};
const forestAllFull=allFull;allFull=function(){return forestAllFull()&&![S.P,...(S.zone?carriedPets():S.P.pets)].some(o=>Object.keys(storedAilments(o)).length);};
const forestUse=handlers.use;handlers.use=function(v){const [id,who]=v.split(':'),it=CON[id];if(!it?.cure)return forestUse(v);if(statsLocked()||towerActive())return toast('ใช้ยาแก้สถานะได้หลังจบการต่อสู้');const o=who==='P'?S.P:carriedPets().find(p=>p.uid===+who);if(!o||!(S.P.items[id]>0))return;const cured=it.cure.filter(k=>o.ailments?.[k]);if(!cured.length)return toast('ไม่มีสถานะที่ยานี้รักษาได้');cured.forEach(k=>delete o.ailments[k]);S.P.items[id]--;ExtraAudio.play('heal');save();render();toast('รักษา '+cured.map(k=>STS[k].n).join(' · '));};
const forestSteal=steal;steal=function(u,t){if(S.battle?.towerRun){blog('หอคอยไม่อนุญาตให้ขโมยเงินหรือไอเท็มจากคู่ต่อสู้');return;}return forestSteal(u,t);};
// Both player and pet autoplay unlock at level 10 in forest battles.
function forestAutoLocked(){return !!S.zone&&S.P.lv<10;}
const forestAutoAllowed=teamAutoAllowed;teamAutoAllowed=function(){return !forestAutoLocked()&&forestAutoAllowed();};
const forestAutoUnit=teamAutoUnit;teamAutoUnit=function(u){return forestAutoLocked()&&u?.side==='ally'?false:forestAutoUnit(u);};
const forestStartBattle=startBattle;startBattle=function(...args){if(S.zone&&S.P.lv<10){S.ui.autoTeam=false;S.ui.autoPet=false;}const out=forestStartBattle(...args);if(S.zone&&S.P.lv>=10&&!S.P.forestAutoIntroduced){S.P.forestAutoIntroduced=true;S.ui.forestAutoNotice=true;save();render();}return out;};
handlers.forestAutoNotice=function(){S.ui.forestAutoNotice=false;render();};
const forestBattleView=vBattle;vBattle=function(){let html=forestBattleView();if(forestAutoLocked())html=html.replace(/<button\b[^>]*data-a="bt"[^>]*data-v="auto:1"[^>]*>[\s\S]*?<\/button>/g,'');if(S.ui.forestAutoNotice&&S.zone)html='<div class="card forest-auto-notice" role="status"><b>ปลดล็อกต่อสู้อัตโนมัติแล้ว!</b><p>เลเวล 10 ใช้ปุ่มออโต้ทีมให้ตัวละครและอสูรเลือกสกิลเองได้ กดปิดเพื่อกลับมาเล่นเอง</p><button class="btn sm" data-a="forestAutoNotice">เข้าใจแล้ว</button></div>'+html;return html;};
function villageGearEligible(id){const it=EQ[id];return !!it&&it.slot==='weapon'&&!!it.craft&&!it.legend&&!it.worldLegend;}
function villageGearStock(ev){if(!Array.isArray(ev.gearStock)||ev.gearStock.some(v=>!villageGearEligible(v.id))){const pool=Object.keys(EQ).filter(k=>villageGearEligible(k)&&EQ[k].lv<=Math.max(10,S.P.lv+8));ev.gearStock=[];while(pool.length&&ev.gearStock.length<2){const i=R(0,pool.length-1);ev.gearStock.push({id:pool.splice(i,1)[0],sold:false});}save();}return ev.gearStock;}
function villageGearPrice(id){return Math.max(500,Math.round(priceOf(EQ[id])*1.75));}
handlers.villageGear=function(value){const ev=S.zone?.ev;if(ev?.type!=='village'||S.battle||towerActive())return;const entry=villageGearStock(ev)[+value];if(!entry||entry.sold)return;const price=villageGearPrice(entry.id);if(S.P.gold<price)return toast('เหรียญไม่พอ');S.P.gold-=price;S.P.owned.push(entry.id);entry.sold=true;ExtraAudio.play('buy');save();render();};
const forestZoneView=vZone;vZone=function(){let html=forestZoneView(),ev=S.zone?.ev;if(ev?.type!=='village')return html;const cont='<button class="btn pri full" data-a="cont">เดินป่าต่อ →</button>',gear='<section class="card stack village-gear"><h3>อาวุธหลอม / คราฟต์หายาก · สุ่มขาย 2 ชิ้น</h3><small>ราคาสูงกว่าร้านทั่วไป · ชิ้นละหนึ่งชิ้นต่อการพบหมู่บ้าน</small>'+villageGearStock(ev).map((v,i)=>'<div class="item">'+itemIcon(v.id)+'<div class="grow"><b>'+esc(EQ[v.id].n)+'</b><small>คราฟต์หายาก · Lv '+EQ[v.id].lv+' · '+compareGear(EQ[v.id])+'</small></div><button class="btn sm" data-a="villageGear" data-v="'+i+'" '+(v.sold||S.P.gold<villageGearPrice(v.id)?'disabled':'')+'>'+(v.sold?'ขายแล้ว':fmt(villageGearPrice(v.id))+' เหรียญ')+'</button></div>').join('')+'</section>';return html.replace(/(<div class="card stack">)(<img class="route-banner")/,'$1'+cont+'$2').replace('<div class="lst">',gear+'<div class="lst">');};

function battleEffectIcons(html,u){if(html.includes('battle-effect-strip'))return html;const symbols={burn:'🔥',poison:'☠',freeze:'❄',chill:'🕸',love:'♥',sleep:'Zz',confuse:'✫',static:'ϟ',charm:'◎',para:'⛓'},stats={patk:['⚔','พลังโจมตีกายภาพ'],matk:['⚚','พลังโจมตีเวท'],crit:['✦','คริติคอล'],acc:['⊕','แม่นยำ'],eva:['➶','หลบหลีก'],spd:['➟','ความเร็ว'],pdef:['⬟','เกราะกายภาพ'],mdef:['◈','เกราะเวท']};const icons=[];for(const [k,n] of Object.entries(u.status||{}))if(n&&STS[k])icons.push('<span class="battle-effect-icon" title="'+esc(STS[k].n+' · '+STS[k].info)+'" aria-label="'+esc(STS[k].n)+'">'+battleEffectImage(k,STS[k].n)+'</span>');const sums={};for(const b of u.buffs||[])if(b.tn>0&&b.st)sums[b.st]=(sums[b.st]||0)+b.amt;for(const [k,n] of Object.entries(sums))if(n){const q=stats[k]||['✧',k],label=(n>0?'เพิ่ม':'ลด')+q[1]+' '+Math.round(Math.abs(n)*100)+'%';icons.push('<span class="battle-effect-icon '+(n>0?'good':'bad')+'" title="'+esc(label)+'" aria-label="'+esc(label)+'">'+(stats[k]?battleEffectImage(k+(n>0?'-up':'-down'),label):q[0])+'</span>');}icons.push(...battleSpecialEffects(u));if(!icons.length)return html;html=html.replace(/<span class="online-unit-status">[^<]*<\/span>/g,'');return html.replace(/<\/button>$/, '<span class="battle-effect-strip" aria-label="บัฟและดีบัฟ">'+icons.join('')+'</span></button>');}

function battleEffectImage(key,label){return '<img class="battle-effect-image" src="assets/ui/status/'+key+'.webp" alt="'+esc(label)+'" width="20" height="20" decoding="async">';}

// One generated atlas, indexed left-to-right in six columns and four rows.
const BATTLE_SPECIAL_ICONS={taunt:[0,'neutral'],charging:[1,'good'],empowered:[2,'good'],physicalImmune:[3,'good'],magicImmune:[4,'good'],enchant:[5,'good'],firestorm:[6,'bad'],whirlpool:[7,'bad'],constrict:[8,'bad'],thorns2:[9,'good'],omni:[10,'good'],poisonTouch2:[11,'good'],mpsave:[12,'good'],regen:[13,'good'],guardian:[14,'good'],wolf:[15,'neutral'],bear:[16,'neutral'],hawk:[17,'good'],treant:[18,'neutral'],saber:[19,'good'],gdragon:[20,'good'],moon:[21,'good'],defending:[22,'good'],summonLife:[23,'neutral']};
function battleSpecialEffects(u){const effects=[],add=(key,label)=>{const icon=BATTLE_SPECIAL_ICONS[key];if(icon)effects.push({key,label,index:icon[0],kind:icon[1]});};
 if(u.taunt>0)add('taunt','ยั่วยุ · ดึงการโจมตีเข้าหาตัว '+u.taunt+' เทิร์น');
 if(u.charging)add('charging','กำลังชาร์จ'+(SK[u.charging.id]?' · '+SK[u.charging.id].n:''));
 if(u.charge>1)add('empowered','พลังโจมตีครั้งถัดไป ×'+u.charge);
 if(u.immune==='p')add('physicalImmune','ป้องกันกายภาพ 100%');
 if(u.immune==='m')add('magicImmune','ป้องกันเวท 100%');
 if(u.enchant)add('enchant','ประทับธาตุอาวุธ · '+(EL[u.enchant]?.n||u.enchant));
 const dots={'พายุไฟ':'firestorm','วังน้ำวน':'whirlpool','บีบรัด':'constrict'};
 for(const d of u.dots||[])if(d.turns>0)add(dots[d.n],d.n+' · '+d.turns+' เทิร์น');
 const passive=new Set();for(const b of u.buffs||[])if(b.tn>0&&b.pas&&!passive.has(b.pas)){passive.add(b.pas);add(b.pas,(PAS[b.pas]?.n||b.pas)+' · '+b.tn+' เทิร์น');}
 if(u.form&&FORMS[u.form])add(u.form,FORMS[u.form].n);
 if(u.summonLife>0)add('summonLife','อสูรอัญเชิญชั่วคราว · เหลือ '+u.summonLife+' เทิร์น');
 return effects.map(e=>'<span class="battle-effect-icon special-effect '+e.kind+'" data-effect="'+e.key+'" title="'+esc(e.label)+'" aria-label="'+esc(e.label)+'"><span class="battle-special-image" role="img" aria-label="'+esc(e.label)+'" style="background-position:'+(e.index%6*20)+'% '+(Math.floor(e.index/6)*100/3)+'%"></span></span>');
}

function bagAilmentInfo(o,who){const states=Object.keys(storedAilments(o));if(!states.length)return '';const cures=Object.entries(CON).filter(([,it])=>it.cure?.some(k=>states.includes(k)));return '<section class="bag-ailments" aria-label="สถานะที่ติดค้าง"><b>สถานะที่ติดค้าง</b>'+states.map(k=>'<div class="bag-ailment-row"><span class="battle-effect-icon">'+battleEffectImage(k,STS[k].n)+'</span><div><strong>'+esc(STS[k].n)+'</strong><small>รักษาด้วย '+cures.filter(([,it])=>it.cure.includes(k)).map(([,it])=>esc(it.n)).join(' / ')+'</small></div></div>').join('')+'<div class="row wrap bag-cure-actions">'+cures.map(([id,it])=>'<button class="btn sm" data-a="use" data-v="'+id+':'+who+'" '+(!(S.P.items[id]>0)||statsLocked()||towerActive()?'disabled':'')+'>ใช้'+esc(it.n)+' · มี '+fmt(S.P.items[id]||0)+'</button>').join('')+'</div></section>';}
function bagRecoveryActions(o,who,st){if(o.hp<=0||o.hp>=st.hp&&o.mp>=st.mp)return '';const items=Object.entries(CON).filter(([,it])=>!it.rev&&(it.hp&&o.hp<st.hp||it.mp&&o.mp<st.mp));return '<section class="bag-recovery" aria-label="ยาฟื้น HP และ MP"><b>ใช้ยากับตัวนี้</b><div class="row wrap bag-cure-actions">'+items.map(([id,it])=>'<button class="btn sm" data-a="use" data-v="'+id+':'+who+'" '+(!(S.P.items[id]>0)||statsLocked()||towerActive()?'disabled':'')+'>'+esc(it.n)+' · '+[it.hp?'HP +'+it.hp:'',it.mp?'MP +'+it.mp:''].filter(Boolean).join(' / ')+' · มี '+fmt(S.P.items[id]||0)+'</button>').join('')+'</div></section>';}
bagVitals=function(){return '<div class="bag-vitals">'+bagHealTargets().map(t=>'<div class="card stack"><b '+(t.key==='P'?'data-user-content':'')+'>'+esc(t.name)+'</b><small>HP '+t.o.hp+'/'+t.st.hp+'</small>'+bar(t.o.hp,t.st.hp)+'<small>MP '+t.o.mp+'/'+t.st.mp+'</small>'+bar(t.o.mp,t.st.mp,'mp')+bagRecoveryActions(t.o,t.key,t.st)+bagAilmentInfo(t.o,t.key)+'</div>').join('')+'</div>';};

const statusHandbook=vGuide;vGuide=function(){return statusHandbook().replace('<div class="guide-catalogs">','<div class="guide-catalogs"><button class="btn" data-a="go" data-v="statusbook">สมุดสถานะผิดปกติ →</button>');};
function statusBookArt(key,name){const v=BATTLE_SPECIAL_ICONS[key];return '<span class="status-book-art">'+(v?'<span class="battle-effect-icon special-effect '+v[1]+'"><span class="battle-special-image" role="img" aria-label="'+esc(name)+'" style="background-position:'+(v[0]%6*20)+'% '+(Math.floor(v[0]/6)*100/3)+'%"></span></span>':'<span class="battle-effect-icon">'+battleEffectImage(key,name)+'</span>')+'</span>';}
function statusBookCard(key,name,description,extra=''){return '<article class="card status-book-card">'+statusBookArt(key,name)+'<div><h3>'+esc(name)+'</h3><p>'+esc(description)+'</p>'+extra+'</div></article>';}
function vStatusBook(){const ailments=Object.keys(STS).map(k=>{const cure=Object.values(CON).filter(it=>it.cure?.includes(k)).map(it=>it.n).join(' / '),persistent=PERSISTENT_AILMENTS.includes(k),description=k==='freeze'?'ขยับไม่ได้ แต่พลังป้องกันกายภาพและเวทเพิ่ม 50%':STS[k].info;return statusBookCard(k,STS[k].n,description,'<small class="status-book-persistence">'+(persistent?'ติดค้างหลังการต่อสู้ · ไม่หายเอง':'มีระยะเวลา · หายเมื่อครบผลของสถานะ'+(k==='sleep'?' หรือถูกโจมตี':''))+'</small><small>รักษาด้วย: '+esc(cure)+'</small>');}).join('');
 const names={patk:'พลังโจมตีกายภาพ',matk:'พลังโจมตีเวท',crit:'คริติคอล',acc:'ความแม่นยำ',eva:'หลบหลีก',spd:'ความเร็ว',pdef:'ป้องกันกายภาพ',mdef:'ป้องกันเวท'};
 const buffs=Object.entries(names).flatMap(([key,name])=>[true,false].map(up=>statusBookCard(key+(up?'-up':'-down'),(up?'เพิ่ม':'ลด')+name,'ปรับ'+name+' ตามเปอร์เซ็นต์และระยะเวลาของสกิล หมดผลเมื่อครบระยะเวลา ไม่ใช่สถานะติดค้างที่ต้องใช้ยา'))).join('');
 const extra=[['taunt','ยั่วยุ','ดึงการโจมตีเป้าหมายเดี่ยวส่วนใหญ่ให้เล็งผู้ยั่วยุ ช่วยป้องกันเพื่อน แต่ทำให้ตัวเองเสี่ยงถูกโจมตี'],['charging','กำลังชาร์จ','รวบรวมพลังเพื่อปล่อยสกิลเมื่อถึงจังหวะถัดไป'],['empowered','พลังโจมตีครั้งถัดไป','เพิ่มพลังการโจมตีครั้งถัดไปตามตัวคูณของสกิล'],['physicalImmune','ป้องกันกายภาพ 100%','ป้องกันการโจมตีกายภาพขณะผลยังทำงาน'],['magicImmune','ป้องกันเวท 100%','ป้องกันการโจมตีเวทขณะผลยังทำงาน'],['enchant','ประทับธาตุอาวุธ','เปลี่ยนธาตุการโจมตีปกติเป็นธาตุที่ประทับชั่วคราว'],['summonLife','ระยะเวลาอัญเชิญ','ผู้ช่วยอัญเชิญอยู่ได้ตามจำนวนเทิร์นที่เหลือ และออกจากสนามเมื่อหมดเวลา']];
 const dotKeys={'พายุไฟ':'firestorm','วังน้ำวน':'whirlpool','บีบรัด':'constrict'};for(const sk of Object.values(SK))if(sk.dot&&dotKeys[sk.dot.n]&&!extra.some(x=>x[0]===dotKeys[sk.dot.n]))extra.push([dotKeys[sk.dot.n],sk.dot.n,'เสีย HP ตอนจบเทิร์น '+Math.round(sk.dot.rate*100)+'% ของ HP เต็ม ก่อนคิดผลธาตุ นาน '+sk.dot.turns+' เทิร์น เป็นผลสกิลแยกจากติดไฟหรือติดพิษ ยาแก้สถานะทั่วไปไม่ล้างผลนี้']);
 for(const key of ['thorns2','omni','poisonTouch2','mpsave','regen','guardian'])extra.push([key,PAS[key].n,PAS[key].d+' · เป็นบัฟชั่วคราวเมื่อได้รับจากสกิล ระยะเวลาและผลอาจปรับตามโหมดต่อสู้']);
 for(const [key,f]of Object.entries(FORMS))extra.push([key,f.n,'ค่าสเตตัสขณะอยู่ในร่างนี้: '+Object.entries(f.m).map(([k,v])=>(names[k]||SH[k]||k)+' ×'+v).join(' · ')]);
 return '<div class="stack status-book"><div class="row"><h2 class="grow">สมุดสถานะผิดปกติ</h2>'+guideBack()+'</div><div class="card stack"><p>กรอบเขียว: ผลดี · กรอบแดง: ผลเสีย · กรอบเหลือง: มีทั้งข้อดีและข้อเสีย</p><p>สถานะที่ติดค้างต้องใช้ยาที่รักษาถูกชนิด รักษาในโรงพยาบาล แวะบ่อชำระล้าง หรือเข้า–ออกหอคอย ดูสถานะและกดใช้ยาได้ในกระเป๋า</p></div><h3>สถานะผิดปกติ · '+Object.keys(STS).length+' ชนิด</h3><div class="status-book-grid">'+ailments+'</div><details class="card"><summary>บัฟและดีบัฟค่าสเตตัส · 16 แบบ</summary><div class="status-book-grid">'+buffs+'</div></details><details class="card"><summary>ผลพิเศษและร่างแปลง · '+extra.length+' แบบ</summary><div class="status-book-grid">'+extra.map(([key,n,d])=>statusBookCard(key,n,d)).join('')+'</div></details></div>';}

const comparisonShopView=vShop;vShop=function(){return comparisonShopView().replace('<div class="tabs">','<p class="sub">ค่าสเตตัสเทียบกับชิ้นที่สวมอยู่ในช่องเดียวกัน: <span style="color:var(--good)">เขียว = เพิ่มขึ้น</span> · <span style="color:var(--bad)">แดง = ลดลง</span> · ตัวเลขในวงเล็บคือผลต่าง</p><div class="tabs">');};

EV.cleanse=SoulbeastContent.EV_cleanse_1();SAFE.push('cleanse');ROUTE_ART.cleanse='assets/ui/purification-pool-v1.webp';
function cleanseAllAilments(){let n=0;for(const o of [S.P,...S.P.pets]){if(Object.keys(o.ailments||{}).length)n++;o.ailments={};if(o.hp>0){const st=o===S.P?pStats():calcPet(o);o.hp=Math.min(st.hp,o.hp+Math.round(st.hp*.1));o.mp=Math.min(st.mp,o.mp+Math.round(st.mp*.1));}}return n;}
const cleansingChooseFork=chooseFork;chooseFork=function(i){const z=S.zone;if(z?.fork?.[i]?.k!=='cleanse')return cleansingChooseFork(i);if(S.battle&&!S.battle.over)return;z.fork=null;z.depth++;const n=cleanseAllAilments();z.ev={type:'cleanse',msg:n?'น้ำศักดิ์สิทธิ์ชำระสถานะผิดปกติให้ผู้ผนึกและอสูรทุกตัว รวมในค่ายแล้ว พร้อมฟื้น HP/MP 10% ให้ผู้ที่ยังมีสติ ฟรี':'ผู้ผนึกและอสูรทุกตัวไม่มีสถานะผิดปกติ น้ำในบ่อฟื้น HP/MP 10% ให้ผู้ที่ยังมีสติแล้ว'};zlog('ก้าวที่ '+z.depth+': บ่อชำระล้าง · '+z.ev.msg);save();render();};

// Illustrated signature choreography. Presentation only: no battle RNG, state, or turn timers.
const SIGNATURE_EFFECT_THEMES={venom:'al_acid',fury:'be_frenzy',
 cyclone:'sw_whirl wd_storm sc_tempest s_tengu s_tbird s_nue',slash:'sa_iai ke_thousand th_back as_sonic rn_wander s_griffin s_baihu s_neko s_garuda',volley:'ar_pierce sn_heart gn_execute mk_bullseye gs_infinite bh_bounty',wing:'ra_falcon s_pegasus',thunder:'sb_thunder mg_thunderstorm s_raiju mist_sig_tempest_lynx',meteor:'am_meteor wl_split bs_hammer ms_godhammer s_golem s_yeti s_gargoyle s_erawan mist_sig_obsidian_scarab',
 ward:'sh_army gl_roar sg_barrier et_bastion su_command tm_double bk_order s_lamassu mist_sig_cosmic_tortoise',music:'bd_rally ma_heal di_requiem s_mandrake s_kodama',coin:'me_coinbomb ro_mug mt_plunder ga_transmute',blast:'sbw_doom mc_cannon at_grenade cn_barrage dm_blast',
 leech:'bw_drain ne_soul sl_share s_redcap s_kelpie mist_sig_ember_jackal',curse:'wk_curse en_mind tr_trick sm_bind s_tanuki s_basilisk s_jiangshi mist_sig_prism_owl',transform:'dr_treant fe_saber wg_dragon ad_moon',vines:'gv_rain s_joro mist_sig_bloom_jade_mare',
 fang:'pk_howl s_cerberus s_fenrir mist_sig_dusk_panther mist_sig_eclipse_wolf',nova:'te_judge el_omni sbs_unite sp_storm s_nil s_scarab s_dragon mist_sig_astral_dragon mist_sig_solar_sovereign',phoenix:'ss_rebirth s_phoenix mist_sig_dawn_valkyrie',eclipse:'s_nidhogg mist_sig_primordial_ouroboros mist_sig_void_phoenix',tide:'s_kappa s_naga s_kraken mist_sig_infinite_sea_serpent',fox:'s_wisp s_kitsune',heal:'pa_holy bc_elixir s_pixie s_qilin s_unicorn mist_sig_jade_moon_hare mist_sig_aurora_whale'
};
const SIGNATURE_THEME_BY_ID={};for(const [theme,ids]of Object.entries(SIGNATURE_EFFECT_THEMES))for(const id of ids.split(' '))SIGNATURE_THEME_BY_ID[id]=theme;
function signatureEffectProfile(id){const art=SIGNATURE_ART[id];if(!art)return null;const sk=SK[id],look=spellLook(id),seed=art.index+(art.kind==='job'?0:67),theme=SIGNATURE_THEME_BY_ID[id]||(sk.t==='heal'?'heal':sk.t==='buff'?'ward':sk.t==='status'?'curse':['p','h'].includes(sk.t)?'slash':sk.el==='water'?'tide':sk.el==='fire'?'blast':'nova');return {id,art,theme,seed,color:look[2],accent:look[3],spokes:3+seed%4,angle:seed*37%180,duration:760+seed%4*65};}
const SIGNATURE_ORIGINS=new Map();
function signatureEffectBurst(L,e,x,y){const p=signatureEffectProfile(e.skill);if(!p)return false;if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return true;const cast=e.k==='cast',mobile=window.innerWidth<620,size=Math.min(mobile?118:168,Math.max(76,(mobile?82:112)+skillIntensity(e.skill)*12)),budget=mobile?12:16;let used=0;
 const origin=SIGNATURE_ORIGINS.get(e.skill),source=origin&&origin.screen===S.screen&&Date.now()-origin.at<1800?origin:{x,y:y-size*.75};
 if(cast)SIGNATURE_ORIGINS.set(e.skill,{x,y,screen:S.screen,at:Date.now()});
 const spawn=(shape,dx=0,dy=0,wait=0,vars={})=>{if(used++>=budget)return;return vSpawn(L,'sig-fx sig-'+shape,[x+dx,y+dy],p.color,null,{'--a':p.accent,'--size':size+'px','--duration':p.duration+'ms','--life-ms':p.duration,'--wait':wait+'ms','--theta':p.angle+'deg','--sx':source.x-x+'px','--sy':source.y-y+'px','--dx':'0px','--dy':'0px',...vars});};
 const crest=spawn('crest',0,0,0,{'--size':(cast?size*.48:size*.6)+'px','--atlas':"url('assets/skills/signatures-"+p.art.kind+".webp')",'--ax':p.art.index%8*100/7+'%','--ay':Math.floor(p.art.index/8)*100/7+'%'});if(crest){crest.dataset.skill=e.skill;crest.dataset.signatureTheme=p.theme;}
 if(cast){spawn('seal',0,0,0,{'--theta':p.angle+'deg'});if(SK[e.skill].t==='heal'||SK[e.skill].t==='buff')spawn('halo');else spawn('orbit');return true;}
 const ray=(shape,i,n,spread=1)=>{const a=(i/n*Math.PI*2+p.angle*Math.PI/180),r=size*.43*spread;spawn(shape,Math.cos(a)*r,Math.sin(a)*r*.65,i*42,{'--theta':a*180/Math.PI+'deg','--dx':Math.cos(a)*size*.3+'px','--dy':Math.sin(a)*size*.3+'px'});};
 switch(p.theme){
 case 'venom':for(let i=0;i<4;i++)spawn('soul',(i-1.5)*15,-20,i*60,{'--dx':(i-1.5)*10+'px','--dy':'45px'});spawn('shock');break;
 case 'fury':spawn('orbit');for(let i=0;i<4;i++)ray('flame',i,4);spawn('cut');break;
 case 'slash':for(let i=0;i<Math.min(6,SK[e.skill].hits||p.spokes);i++)spawn('cut',(i-2)*7,(i-2)*5,i*65,{'--theta':p.angle+i*29+'deg'});break;
 case 'volley':for(let i=0;i<Math.min(6,SK[e.skill].hits||p.spokes);i++)spawn('arrow',(i-2)*5,(i-2)*6,i*65,{'--theta':Math.atan2(y-source.y,x-source.x)*180/Math.PI+'deg'});spawn('target');break;
 case 'thunder':for(let i=0;i<p.spokes;i++)spawn('bolt',(i-(p.spokes-1)/2)*size*.17,-size*.14,i*55);spawn('shock');break;
 case 'meteor':for(let i=0;i<p.spokes;i++)spawn('comet',(i-(p.spokes-1)/2)*size*.2,0,i*65);spawn('crack');break;
 case 'cyclone':for(let i=0;i<3;i++)spawn('wave',0,(i-1)*size*.18,i*85,{'--theta':p.angle+i*55+'deg'});spawn('cut');break;
 case 'wing':case 'phoenix':for(const side of [-1,1])spawn('wing',side*size*.18,0,0,{'--side':side});spawn('halo');if(p.theme==='phoenix')for(let i=0;i<3;i++)ray('petal',i,3);break;
 case 'tide':for(let i=0;i<3;i++)spawn('wave',0,(i-1)*size*.15,i*95,{'--theta':i*23+'deg'});if(e.skill==='s_kraken'||e.skill==='mist_sig_infinite_sea_serpent')for(let i=0;i<3;i++)ray('vine',i,3);break;
 case 'ward':spawn('shield');spawn('seal');for(let i=0;i<3;i++)ray('petal',i,3);break;
 case 'music':for(let i=0;i<p.spokes;i++)ray('note',i,p.spokes);spawn('wave',0,0,0,{'--theta':'0deg'});break;
 case 'coin':for(let i=0;i<p.spokes+1;i++)ray('coin',i,p.spokes+1);if(SK[e.skill].all)spawn('shock');break;
 case 'leech':for(let i=0;i<4;i++)spawn('soul',0,(i-1.5)*9,i*80,{'--dx':source.x-x+'px','--dy':source.y-y+'px'});spawn('fang');break;
 case 'curse':spawn('eye');spawn('seal');for(let i=0;i<3;i++)ray('chain',i,3);break;
 case 'vines':for(let i=0;i<p.spokes;i++)ray(e.skill==='s_joro'?'web':'vine',i,p.spokes);spawn('halo');break;
 case 'fang':for(const side of [-1,1])spawn('fang',side*size*.17,0,side>0?80:0,{'--side':side});for(let i=0;i<3;i++)spawn('cut',(i-1)*9,0,i*55,{'--theta':'65deg'});break;
 case 'transform':spawn('orbit');spawn('halo');for(let i=0;i<p.spokes;i++)ray('petal',i,p.spokes);break;
 case 'eclipse':spawn('eclipse');spawn('orbit');for(let i=0;i<3;i++)ray('soul',i,3);break;
 case 'fox':for(let i=0;i<p.spokes;i++)ray('flame',i,p.spokes);spawn('seal');break;
 case 'heal':spawn('halo');for(let i=0;i<p.spokes;i++)ray('petal',i,p.spokes);break;
 case 'blast':for(let i=0;i<3;i++)spawn('comet',(i-1)*size*.2,0,i*70);spawn('shock');break;
 default:spawn('seal');spawn('shock');for(let i=0;i<p.spokes;i++)ray('star',i,p.spokes);
 }return true;
}
const originalSignatureSpellBurst=spellBurst;spellBurst=function(L,e,x,y){try{if(signatureEffectBurst(L,e,x,y))return;}catch(error){console.warn('Skipped signature effect',error);}return originalSignatureSpellBurst(L,e,x,y);};

// Shared by the browser and authoritative API; inventory IDs and saved stats stay intact.
const ARMOR_ELEMENTS_V4={armor_0:['normal'],armor_1:['ground'],armor_2:['water'],armor_3:['dragon'],armor_4:['steel'],armor_5:['dark'],crown_0:['normal'],crown_1:['rock'],crown_2:['ice'],crown_3:['dragon'],crown_4:['psychic'],crown_5:['fairy'],crown_eagle:['flying'],crown_sage:['psychic'],armor_berserk:['fighting'],armor_dragon:['dragon','fire'],crown_pierce:['ground'],armor_saint:['fairy'],lg1_armor:['grass'],lg1_crown:['electric'],lg2_armor:['flying'],lg2_crown:['electric','ghost'],lg3_armor:['ghost'],lg3_crown:['ground','fighting'],lg4_armor:['water','dragon'],lg4_crown:['dragon'],lg5_armor:['ground'],lg5_crown:['psychic','fairy'],lg6_armor:['dark','fighting'],lg6_crown:['dark','psychic'],wl_armor:['steel'],wl_crown:['fairy']};
for(const [id,it]of Object.entries(EQ))if(['armor','crown'].includes(it.slot)){const types=ARMOR_ELEMENTS_V4[id]||(it.craft&&SP[it.craft]?.t)||['normal'];it.defTypes=[...new Set(types.map(k=>k==='steel'&&it.lv<30?'rock':k))].filter(k=>EL[k]);if(!it.defTypes.length)it.defTypes=['normal'];}
function equipmentElements(eq){const types=[...new Set(['armor','crown'].flatMap(slot=>EQ[eq?.[slot]]?.defTypes||[]))];return types.length?types:['normal'];}
function areaTotalBudget(count){return Math.min(1.5,.5+.25*Math.max(1,count));}
function areaDamageScale(sk,count){return areaTotalBudget(count)/Math.max(1,count)*(sk.ct?2:1);}
for(const sk of Object.values(SK))if(sk.all&&['p','m','h','auto'].includes(sk.t)){sk.pw=sk.basePower||sk.pw;sk.areaScale=null;}
// Strong forms retain their role, with a cost for sustained burst and area pressure.
FORMS.moon.m.matk=1.45;FORMS.moon.m.mdef=1.3;SK.f_moonbeam.mp=24;SK.f_moonbeam.cd=2;
FORMS.saber.m.patk=1.65;FORMS.saber.m.crit=1.5;FORMS.gdragon.m.patk=1.45;FORMS.gdragon.m.matk=1.45;
SK.gs_infinite.pw=68;SK.ke_thousand.pw=80;SK.sbs_unite.bf={patk:.3,matk:.3,crit:.3};
PAS.arcaneMastery={n:'เชี่ยวชาญมหาเวท',d:'สกิลโจมตีเวทแรงขึ้น 15% แม้ธาตุไม่ตรงกับอาวุธ'};
CLS.archmage.pas=CLS.archmage.pas.filter(k=>k!=='adapt').concat('arcaneMastery');
if(!CLS.gladiator.pas.includes('counter'))CLS.gladiator.pas.push('counter');
if(!CLS.gladiator.pas.includes('thorns'))CLS.gladiator.pas.push('thorns');
SK.th_ambush.charge=1.65;SK.th_ambush.bf.eva=.35;
function classCombatFactor(u,t,sk){const type=sk.t==='auto'?u.atkType:sk.t;let f=1;if(isBalancedPvp()&&u.kind==='pet'){const n=Math.max(1,sideOf(u).filter(x=>x.kind==='pet'&&x.owner===u.owner&&x.hp>0).length);const hero=sideOf(u).find(x=>x.kind==='player'&&x.owner===u.owner),growth=hero?.cls&&baseOf(hero.cls)==='summoner'?.35:.15;f*=(1+growth*(n-1))/n;if(t.kind==='player')f*=.6;}if(u.cls&&baseOf(u.cls)==='thief'&&['p','h'].includes(type)){if(t.cls){const victim=baseOf(t.cls);if(['mage','gunner','archer'].includes(victim))f*=1.25;else if(['gladiator','druid'].includes(victim))f*=.4;}}
if(u.cls&&t.cls&&baseOf(t.cls)==='gladiator'&&['mage','archer'].includes(baseOf(u.cls)))f*=1.35;
if(isBalancedPvp()){if(u.cls==='packlord')f*=.75;if(t.cls==='packlord')f*=1.25;}
if(isBalancedPvp()&&u.cls&&baseOf(u.cls)==='mage'&&type==='m')f*=1.15;
if(u.cls==='gunsaint'&&type==='p')f*=.95;if(hasPas(u,'arcaneMastery')&&type==='m')f*=1.15;return f;}
const elementsPlayerUnit=playerUnit;playerUnit=function(){const u=elementsPlayerUnit();u.defenseTypes=equipmentElements(S.P.eq);u.types=u.defenseTypes.slice();return u;};
const elementsHumanUnit=humanUnit;humanUnit=function(name,cls,lv,i){const u=elementsHumanUnit(name,cls,lv,i);u.defenseTypes=equipmentElements(npcEq(cls,lv));u.types=u.defenseTypes.slice();return u;};

function minimumHitChance(u,t){return u.cls&&t.cls&&['gladiator','druid'].includes(baseOf(u.cls))&&baseOf(t.cls)==='thief'?80:25;}

if(!CLS.druid.pas.includes('thorns'))CLS.druid.pas.push('thorns');
function rogueCritBlocked(u,t){return !!(u.cls&&t.cls&&baseOf(u.cls)==='thief'&&baseOf(t.cls)==='druid');}

function frontlinePierce(u,t){return u.cls&&t.cls&&baseOf(u.cls)==='archer'&&baseOf(t.cls)==='gladiator'?.3:0;}

SK.sbw_doom.pw=230;SK.sbw_doom.basePower=230;SK.sbw_doom.pi=.3;SK.sbw_doom.mp=20;
// Deterministic pressure estimate: autoplay respects armor elements and the same area budget.
function combatSkillScore(u,id,target,targets=foesOf(u).filter(x=>x.hp>0)){
 const sk=pvpSkill(id);if(!sk||!['p','m','h','auto'].includes(sk.t)||!targets.length)return 0;
 const type=sk.t==='auto'?u.atkType:sk.t,atk=type==='h'?(eff(u,'patk')+eff(u,'matk'))/2:eff(u,type==='m'?'matk':'patk'),list=sk.all?targets:sk.rt?targets:[target||targets[0]];
 let score=0;for(const t of list){if(type===t.immune&&type!=='h')continue;const m=typeMult(effectiveElement(u,sk),t.types)*(sk.el==='ground'&&hasPas(t,'levitate')?0:1);if(!m)continue;let def=type==='h'?(eff(t,'pdef')+eff(t,'mdef'))/2:eff(t,type==='m'?'mdef':'pdef');if(sk.trueD)def=0;def*=1-Math.min(.8,(sk.pi||0)+(hasPas(u,'pierce')?.25:0)+frontlinePierce(u,t));const stab=sk.el&&(hasPas(u,'omni')||u.stab.includes(sk.el)||u.types.includes(sk.el)||u.form&&FORMS[u.form].t.includes(sk.el))?(hasPas(u,'adapt')?1.5:1.25):1,crit=hasPas(t,'nocrit')||rogueCritBlocked(u,t)?0:Math.min(isBalancedPvp()?65:100,eff(u,'crit')+(sk.cb||0))/100;let d=1.4*atk*(sk.pw/100)*atk/(atk+def)*m*stab*(sk.all?areaDamageScale(sk,targets.length):1)*(sk.hits||1)*(u.charge||1)*(1+crit*((hasPas(u,'deadly')?(isBalancedPvp()?1.7:2):1.5)-1))*classCombatFactor(u,t,sk)*pvpDamageFactor(u,t);if(type==='h'&&t.immune)d*=.5;if(hasPas(t,'thick')&&['fire','ice'].includes(sk.el))d*=.5;if(sideOf(t).some(x=>x.hp>0&&hasPas(x,'guardian')))d*=.9;d*=sk.acc>=100?1:hitChance(u,t,sk)/100;score+=d;}
 return score/(sk.ct?2:1)/(sk.rt?targets.length:1);
}

const elementItemExtra=itemExtra;itemExtra=function(it){return elementItemExtra(it)+(it.defTypes?' · ธาตุตั้งรับ '+it.defTypes.map(k=>EL[k].n).join(' / '):'');};
const elementTeamView=vHero;vHero=function(){return elementTeamView().replace('<h3>อุปกรณ์ที่สวมใส่</h3>','<h3>อุปกรณ์ที่สวมใส่</h3><div class="row wrap"><small>ธาตุตั้งรับจากเกราะ / มงกุฎ</small>'+tChips(equipmentElements(S.P.eq))+'</div>');};
bagVitals=function(){return '<div class="bag-vitals">'+bagHealTargets().map(t=>{const hero=t.key==='P',types=hero?equipmentElements(S.P.eq):SP[t.o.sp].t;return '<div class="card stack"><div class="row">'+portrait(hero?'player':t.o.sp,64,hero?{}:{form:t.o.form||0})+'<div class="grow" style="min-width:0"><b '+(hero?'data-user-content':'')+' style="overflow-wrap:anywhere">'+esc(t.name)+'</b><small>Lv '+t.o.lv+'</small><div class="row wrap" aria-label="ธาตุตั้งรับ"><small>ธาตุตั้งรับ</small>'+tChips(types)+'</div></div></div><small>HP '+t.o.hp+'/'+t.st.hp+'</small>'+bar(t.o.hp,t.st.hp)+'<small>MP '+t.o.mp+'/'+t.st.mp+'</small>'+bar(t.o.mp,t.st.mp,'mp')+bagRecoveryActions(t.o,t.key,t.st)+bagAilmentInfo(t.o,t.key)+'</div>';}).join('')+'</div>';};
const elementCompareGear=compareGear;compareGear=function(it){return elementCompareGear(it)+(it.defTypes?' · ธาตุตั้งรับ '+it.defTypes.map(k=>EL[k].n).join(' / '):'');};
const balanceCareerPanel=careerPanel;careerPanel=function(cls){const base=baseOf(cls),note=base==='thief'?'ลอบสังหาร: โจมตีกายภาพใส่นักเวทย์ มือปืน และนักธนูแรงขึ้น 25% แต่ใส่กลาดิเอเตอร์และดรูอิดเบาลง 60%':base==='gladiator'?'ตั้งรับสวนกลับ: สะท้อนกายภาพ 15% และมีโอกาสสวน 25% โจมตีโจรมีความแม่นยำขั้นต่ำ 80% แต่รับมือเวทและการยิงของนักธนูได้ยากขึ้น':base==='druid'?'ผิวพงไพร: สะท้อนกายภาพ 15% โจรไม่สามารถคริติคอลใส่ได้ และมีความแม่นยำขั้นต่ำ 80% เวลาโจมตีโจร':base==='mage'||base==='archer'?'เจาะแนวหน้า: โจมตีผู้สืบสายกลาดิเอเตอร์แรงขึ้น 35% นักธนูเจาะเกราะกลาดิเอเตอร์เพิ่ม 30% แต่ต้องระวังการลอบสังหารของโจร':'';return balanceCareerPanel(cls)+(cls==='packlord'?'<p class="sub">PVP: แบ่งพลังนำฝูง ดาเมจผู้ผนึก 75% และรับดาเมจ 125% เพื่อแลกกับความคล่องตัวและอสูรสองตัว</p>':'')+(note?'<p class="sub">'+note+'</p>':'');};
const balanceGuideView=vGuide;vGuide=function(){return balanceGuideView()+'<section class="card stack"><h3>ธาตุเกราะและการต่อสู้หมู่</h3><p>ผู้ผนึกและ NPC ใช้ธาตุจากเกราะกับมงกุฎรวมกัน ธาตุซ้ำไม่นับเพิ่ม ถ้าไม่ใส่เป็นธาตุปกติ ตรวจจุดอ่อนจากตารางธาตุก่อนเปลี่ยนชุด ธาตุเหล็กมีในอุปกรณ์ขั้นสูง แต่ยังแพ้ไฟ ดิน และต่อสู้</p><p>ดาเมจรวมท่าหมู่เทียบพลังพื้นฐาน: 1 เป้า 75% · 2 เป้า 100% · 3 เป้า 125% · 4 เป้าขึ้นไป 150% แบ่งดาเมจตามจำนวนเป้า ท่าชาร์จชดเชยเวลา 2 เทิร์น ธาตุ เกราะ คริติคอล และความสามารถของแต่ละเป้ายังคงมีผล ใน PVP อสูรโจมตีผู้ผนึกที่ 60% และอสูรหลายตัวแบ่งโบนัสประสานทีม เพื่อให้มีโอกาสตอบโต้ก่อนถูกสังหาร</p></section>';};

// Reward-only scaling: fixed-value crystals and previously earned EXP stay intact.
function progressionRewardExp(o,amount){const rate=o.lv>=40?.85*.85:o.lv>=25?.85:1;return Math.max(0,Math.round(amount*rate));}
// Preserve the original boss HP baseline and ordinary capture reconstruction.
const progressionWildUnit=wildUnit;
wildUnit=function(sp,lv,i,boss){const u=progressionWildUnit(sp,lv,i,boss);if(!boss)return u;u.st.hp=Math.round(u.st.hp*1.15);u.st.mp=Math.round(u.st.mp*1.15);for(const k of ['patk','matk'])u.st[k]=Math.round(u.st[k]*1.2/1.15);u.st.spd=Math.round(u.st.spd*1.1);u.hp=u.st.hp;u.mp=u.st.mp;u.bossAura=true;return u;};
function isBossDoorScene(){return S.screen==='zone'&&!!S.zone&&!S.zone.ev&&!S.zone.fork&&S.zone.depth>=ZDEPTH;}// Stat budget at equal level, before allocated points. Roles and accuracy/evasion stay distinct.
const BEAST_TIER_BUDGET=[.70,.82,.96,1.12,1.32,1.56,1.85];
function beastPowerTier(sp,form=0){if(sp.legendary)return 6;if(sp.rare)return 5;const stages=(sp.ev||[]).length+1;if(stages>=3)return form>=2?4:form===1?3:0;if(stages===2)return form>=1?4:1;return 2;}
function beastOriginZone(id){const sp=SP[id];if(sp.mistZone)return sp.mistZone;if(sp.legendary&&sp.rarePair)return beastOriginZone(sp.rarePair);const z=ZN.filter(z=>[...z.sp,...z.rare,...(z.bosses||[z.boss]).map(b=>b.sp)].includes(id));return z.length?Math.min(...z.map(z=>z.id)):1;}
function beastStatPower(s){return s.hp/10+Math.max(s.patk,s.matk)*2+(s.pdef+s.mdef)*.7+s.spd*.4+s.mp*.1;}
function beastBudget(lv,wild=1){const n=(lv-1)*wild;return 50*(1+.2*n)/10+14*(1+.17*n)*2+20*(1+.17*n)*.7+10*(1+.08*n)*.4+20*(1+.12*n)*.1;}
const beastBudgetPrevious=calcPet;
calcPet=function(p,wild=1){const result=beastBudgetPrevious(p,wild);if(p.sp==='demonlord')return result;const base=beastBudgetPrevious({...p,pts:{}},wild),tier=beastPowerTier(SP[p.sp],p.form||0),zone=Math.max(1,Math.min(7,beastOriginZone(p.sp))),target=beastBudget(p.lv,wild)*BEAST_TIER_BUDGET[tier]*(1+.012*(zone-1)),scale=target/beastStatPower(base);for(const key of ['hp','mp','patk','matk','pdef','mdef','spd'])result[key]=Math.max(1,Math.round(base[key]*scale+(result[key]-base[key])));return result;};
Object.assign(ExtraAudio.groups,{"bgIntroMusic":["upload_eb0e61e3b278"],"bgSuspenseMusic":["upload_ea5165438fef"],"bgBattleMusic":["upload_7a614db3a17f"],"bgViolinMusic":["upload_90b90549e0e6"],"bgInspireMusic":["upload_737ee9690b11","upload_d98d1e57f5f3"],"bgSuccessMusic":["upload_6538f1cf93fe"],"bgSadMusic":["upload_d10a4722ba41","upload_3a6e30249ec4"],"bgDramaMusic":["upload_8de45711bc58"],"bgHorrorMusic":["upload_7a5c276f6f6b","upload_8e33cb7d7bd6"],"bgBossIntroMusic":["upload_c2767908a098"],"bgRallyIntroMusic":["upload_dd0b44348182"],"specialRewardFx":["upload_dbc791784f00"],"swordFx":["upload_c7083078bbdc","upload_e026bc6d36a0"],"swordCriticalFx":["upload_c8a321eff1e5"],"daggerFx":["upload_a072720df2b8"],"daggerCriticalFx":["upload_57a48271daad"],"slashFx":["upload_ca3311db0e99"],"enchantSwordFx":["upload_bdf4191a942e"],"sharpenFx":["upload_baa2246559fd"],"whipFx":["upload_8154d63f83ea"],"whipCriticalFx":["upload_45baf4a0d480"],"gunRapidFx":["upload_1a2c2eb43346"],"gunHeavyFx":["upload_cc7742c998a8","upload_adf5e71838e4"],"gunSingleFx":["upload_cee18db7340c"],"gunThreeFx":["upload_37007fdda99a"],"gunCriticalFx":["upload_305c9fa26618"],"gunPlasmaFx":["upload_fd13f72aea0a"],"reloadFx":["upload_c1acdf3043f5"],"missileFx":["upload_2dbade1bfa8d"],"explosionFx":["upload_288457b2f6f6"],"bigExplosionFx":["upload_1f566cb08b23"],"nuclearFx":["upload_8f2e0648a38b"],"smokeFx":["upload_926be488ffc0"],"ninjaFx":["upload_ae40a3e115b2"],"shurikenFx":["upload_fb5e90512be3"],"reviveFx":["upload_c2ac41c1b294"],"heavenFx":["upload_823ca10d36c3"],"bardHarpFx":["upload_1bd86c22b172"],"bardGuitarFx":["upload_390249728a44"],"requiemFx":["upload_180188c90df5"],"mysteryCryFx":["upload_a010539da803"],"curseFx":["upload_9101017ee2a1","upload_a32ed467cc0d","upload_b89dfba391c8"],"strongCurseFx":["upload_9677fe5bdb10","upload_c165d95dadb0"],"demonLaughFx":["upload_4dd045e1aae3"],"bgPressureMusic":["upload_db080662d0be"],"bgDesertMusic":["upload_b6de92cbbf3d"],"bgDemonCastleMusic":["upload_f34a2c356dbc"],"bgGuildMusic":["upload_d6d1eba3ad02"],"bgWavesMusic":["upload_b19277d276ff"],"bgMysticForestMusic":["upload_575f7581ee84"],"bgDragonPeakMusic":["upload_f2ef4b725655"],"bgHeavenAmbientMusic":["upload_b7dd7f5297a8"],"bgMistValleyMusic":["upload_8c35f0ad34b7"],"bgAdventureMusic":["upload_3cd84beba88a"],"bgWorldTreeMusic":["upload_8a9202270cb1"],"bgDemonBossRoomMusic":["upload_41ac1161c8b2"],"bgGhostAmbientMusic":["upload_ef2b03ffd168"],"bgDragonBossDoorMusic":["upload_8f3321d5c6fa"],"bgMainThemeMusic":["upload_394f1ddfb257"],"bgPuzzleMusic":["upload_76e4f429449a"],"bgDesertBossDoorMusic":["upload_edbfc5290c65"],"bgAnxietyMusic":["upload_ca13cc0ffe40"],"bgBossRoomMusic":["upload_0ec632380285"],"bgMistBossRoomMusic":["upload_0e86c1cf8adc"]});
const UploadedAudio={action:null,serial:0,
 effect(group,critical=false){
  const a=this.action;if(a){if(critical&&a.criticalPlayed)return true;if(!critical&&a.normalPlayed)return true;if(critical&&a.group===group){a.criticalPlayed=true;return true;}if(critical&&a.track){a.track.audio.pause();a.track.audio.currentTime=0;}a[critical?'criticalPlayed':'normalPlayed']=true;a.group=group;}
  if(!Sound.enabled||document.hidden||Sound.ctx?.state!=='running')return true;
  ExtraAudio.play(group);if(a)a.track=ExtraAudio.active[ExtraAudio.active.length-1];return true;
 },
 skillGroup(id,u,strong){const sk=SK[id];if(!sk)return null;const n=sk.n||'',wt=u?.cls?clsWeapon(u.cls):null;
  if(id==='di_requiem')return 'requiemFx';
  if(['bard','maestro','dirge'].some(c=>CLS[c]?.sk.some(([,key])=>key===id)))return sk.t==='heal'||sk.t==='status'?'bardHarpFx':'bardGuitarFx';
  if(/นิวเคลีย|นิวเครีย/.test(n))return 'nuclearFx';
  if(/พลาสม/.test(n))return 'gunPlasmaFx';
  if(/มิสไซ|จรวด/.test(n))return strong?'bigExplosionFx':'missileFx';
  if(/ระเบิดควัน|ระเบิดพลังงาน/.test(n))return 'smokeFx';
  if(/ระเบิด/.test(n))return strong||(sk.pw||0)>=200?'bigExplosionFx':'explosionFx';
  if(/ดาวกระจาย/.test(n))return 'shurikenFx';
  if((u?.cls==='ninja'||/นินจา/.test(n))&&id!=='attack'&&['buff','status','debuff'].includes(sk.t))return 'ninjaFx';
  if(/คำสาป|มรณะ|วันพิพากษาแห่งจอมมาร/.test(n))return strong||(sk.pw||0)>=180?'strongCurseFx':'curseFx';
  if(['p','m','h','auto'].includes(sk.t)&&((sk.el==='fairy'&&((sk.pw||0)>=180||sk.mile))||/ไม้ตายสวรรค์|ศรสวรรค์/.test(n)))return 'heavenFx';
  if(sk.rev||sk.revAll)return 'reviveFx';
  if(sk.t==='rest'&&wt==='gun')return 'reloadFx';
  if(sk.t==='buff'&&wt==='dagger'&&sk.bf?.patk)return 'sharpenFx';
  if(wt==='whip'&&(id==='attack'||/แส้|แซ่/.test(n)))return strong?'whipCriticalFx':'whipFx';
  if(!['p','h','auto'].includes(sk.t)||(sk.t==='auto'&&u?.atkType==='m'))return null;
  if(wt==='gun'){if(strong)return 'gunCriticalFx';if(sk.hits>=5)return 'gunHeavyFx';if(sk.hits===3)return 'gunThreeFx';if(sk.hits>1)return 'gunRapidFx';return sk.ct?'gunPlasmaFx':'gunSingleFx';}
  if(wt==='whip')return strong?'whipCriticalFx':'whipFx';
  if(wt==='dagger')return strong?'daggerCriticalFx':(sk.pi||0)>.25?'slashFx':'daggerFx';
  if(wt==='sword')return strong?'swordCriticalFx':sk.el&&sk.el!=='normal'?'enchantSwordFx':'swordFx';
  return null;
 }
};
const uploadedSkillPrevious=ExtraAudio.skill;
ExtraAudio.skill=function(id,u,strong=false){const a=UploadedAudio.action;if(a&&strong&&a.criticalPlayed)return true;const group=UploadedAudio.skillGroup(id,u,strong);if(group)return UploadedAudio.effect(group,strong);if(a&&strong)a.criticalPlayed=true;const result=uploadedSkillPrevious.call(this,id,u,strong);if(a&&!strong){a.normalPlayed=true;a.track=this.active[this.active.length-1];}return result;};
const uploadedActPrevious=act;
act=function(...args){const old=UploadedAudio.action;UploadedAudio.action={serial:++UploadedAudio.serial,u:args[0],id:args[1]};try{return uploadedActPrevious.apply(this,args);}finally{UploadedAudio.action=old;}};
const uploadedCryPrevious=ExtraAudio.cry;
ExtraAudio.cry=function(sp,death){if(!death&&['demonlord','demon_knight'].includes(sp))return UploadedAudio.effect('demonLaughFx');const q=SP[sp];if(!death&&!SPECIES_VOICE[sp]&&q&&(q.legendary||q.rare&&q.t.some(t=>['ghost','psychic','fairy','dragon'].includes(t))))return UploadedAudio.effect('mysteryCryFx');return uploadedCryPrevious.call(this,sp,death);};
const uploadedFxPrevious=Sound.fx;
Sound.fx=function(kind,...args){if(kind==='revive')return UploadedAudio.effect('reviveFx');if(kind==='chest')return UploadedAudio.effect('specialRewardFx');if(kind==='charge'&&UploadedAudio.action?.u?.cls&&clsWeapon(UploadedAudio.action.u.cls)==='gun')return UploadedAudio.effect('reloadFx');return uploadedFxPrevious.call(this,kind,...args);};
function uploadedMusicScene(){
 const q=S.ui.cinema||(!S.P&&!S.ui.introSeen?{chapter:0,index:S.ui.introFrame||0}:null);
 if(q){const f=storyFrames(q.chapter,q.after)[q.index||0],key=f?.music||'intro',group=({intro:'bgIntroMusic',sadMusic:'bgSadMusic',hauntMusic:'bgHorrorMusic',battleMusic:'bgDramaMusic',pianoMusic:'bgInspireMusic',peaceMusic:'bgInspireMusic'})[key]||key;const themed=/ต้นไม้โลก|รากโลก/.test(f?.text||f?.t||'')?'bgWorldTreeMusic':/ปราสาทจอมมาร/.test(f?.text||f?.t||'')?'bgDemonCastleMusic':group;return {group:themed,stamp:'cinema:'+q.chapter+':'+!!q.after+':'+group};}
 if(!S.P||S.screen==='start')return {group:'bgIntroMusic',stamp:'start'};
 const b=B(),active=['battle','pvp','world','camp','guildwar'].includes(S.screen)&&b;
 if(active&&b.over){const major=b.kind==='boss'||['pvp','world','guildwar'].includes(S.screen);const group=b.over.res==='lose'?'bgSadMusic':major?'bgSuccessMusic':'';return {group,stamp:'result:'+S.screen+':'+b.over.res};}
 if(active&&S.screen==='battle'&&S.zone)return {group:'bgBattleMusic',stamp:'forest-combat'};
 if(active&&b.enemies?.some(u=>u.sp==='demonlord'))return {group:'bgDemonBossRoomMusic',stamp:'demonlord-combat'};
 if(active&&b.kind==='boss')return {group:({2:'bgMistBossRoomMusic',6:'bgDemonBossRoomMusic'})[S.zone?.id]||'bgBossRoomMusic',stamp:'boss-combat:'+S.zone?.id};
 if(active)return {group:'bgBattleMusic',stamp:'combat:'+S.screen+':'+(b.kind||'')+':'+(S.zone?.id||0)};
 if(S.zone){const type=S.zone.ev?.type||'fork';if(isBossDoorScene())return {group:({2:'bgMistBossRoomMusic',3:'bgDesertBossDoorMusic',4:'bgDragonBossDoorMusic',6:'bgDemonBossRoomMusic'})[S.zone.id]||'bgBossRoomMusic',stamp:'boss-door:'+S.zone.id};if(['spring','revival','cleanse'].includes(type))return {group:'bgWavesMusic',stamp:'forest-water:'+S.zone.id};if(type==='village'||type==='hospital')return {group:'peaceMusic',stamp:'forest-rest:'+type+':'+S.zone.id};if(type==='chest'&&!S.zone.ev.opened)return {group:'bgPuzzleMusic',stamp:'forest-puzzle:'+S.zone.id};if(type==='mist'&&S.zone.id===6)return {group:'bgGhostAmbientMusic',stamp:'ghost-mist'};if(type==='stranger')return {group:'bgAnxietyMusic',stamp:'forest-stranger:'+S.zone.id};if(type==='ruins'&&S.zone.id===5)return {group:'bgWorldTreeMusic',stamp:'world-tree-ruins'};if(['mist','ruins'].includes(type))return {group:'bgPressureMusic',stamp:'forest-mystery:'+type+':'+S.zone.id};return {group:({1:'bgMysticForestMusic',2:'bgMistValleyMusic',3:'bgDesertMusic',4:'bgDragonPeakMusic',5:'bgHeavenAmbientMusic',6:'bgDemonCastleMusic'})[S.zone.id]||'bgAdventureMusic',stamp:'forest:'+S.zone.id};}
 if(S.screen==='guild')return {group:'bgGuildMusic',stamp:'guild'};
 if(S.screen==='hospital')return {group:'peaceMusic',stamp:'hospital'};
 if(S.screen==='story')return {group:'bgAdventureMusic',stamp:'story:'+S.P.zoneMax};
 if(S.screen==='arena'||S.screen==='guildwar')return {group:'bgRallyIntroMusic',next:'bgBattleMusic',stamp:'prepare:'+S.screen};
 if(['world','pvp','camp'].includes(S.screen))return {group:'bgSuspenseMusic',stamp:'lobby:'+S.screen};
 return {group:'bgMainThemeMusic',stamp:'town'};
}
Music.sync=function(){if(!Sound.enabled||document.hidden||Sound.ctx?.state!=='running'){this.stop();return;}const scene=uploadedMusicScene();if(this.current&&this.scene===scene.stamp)return;const old=this.tracks[this.playing];if(old){old.audio.pause();old.audio.currentTime=0;}this.scene=scene.stamp;this.current=scene.group;if(!scene.group){this.playing='';return;}const key=ExtraAudio.groups[scene.group]?ExtraAudio.choose(scene.group):scene.group;this.playing=key;const track=this.play(key,.34);if(track?.audio){track.audio.loop=!scene.next;track.audio.onended=scene.next?()=>{if(!Sound.enabled||document.hidden||this.scene!==scene.stamp)return;const follow=ExtraAudio.choose(scene.next);this.playing=follow;const t=this.play(follow,.34);if(t?.audio){t.audio.loop=true;t.audio.onended=null;}}:null;}};
const SECRET_DATA=SoulbeastContent.SECRET_LOCATIONS();
const Secret={
 busy:false,
 canDiscover(d){const r=this.state().locations[d.id];return !(SECRET_DATA.oncePerCharacter||d.once)||!(r?.discovered||r?.completed);},
 chance(d){return SECRET_DATA.testDiscovery100?1:d.chance;},
 data(id){return SECRET_DATA.locations.find(x=>x.id===id);},
 state(){if(!S.P)return null;const x=S.P.secrets||(S.P.secrets={version:1,runs:0,locations:{},flags:{},relations:{},pending:[],claims:{},burdens:{}});x.locations||={};x.flags||={};x.relations||={};x.pending||=[];x.claims||={};x.burdens||={};return x;},
 record(id){const x=this.state();return x.locations[id]||(x.locations[id]={discovered:true,choices:{},completed:false});},
 session(){return S.zone?.secretSession;},
 location(){return this.data(this.session()?.id);},
 persist(){towerCheckpoint();localStorage.setItem(SAVE,JSON.stringify(S));},
 checkpoint(){const z=S.zone,q=this.session();if(z&&q){z.ev={type:'secret',msg:''};z.fork=null;S.screen='zone';}this.persist();},
 plan(z){if(z.secretRun)return z.secretRun;const x=this.state(),d=SECRET_DATA.locations.find(l=>l.zone===z.id);const run={id:++x.runs,offered:false,processedDepth:-1,drain:null,notice:''};if(d&&this.canDiscover(d)){const found=Math.random()<this.chance(d);run.location=d.id;run.depth=found?5+Math.floor(Math.random()*4):null;}z.secretRun=run;return run;},
 eligible(d){return !!S.zone&&d.zone===S.zone.id&&(!ZN[d.zone-1].train||d.tutorial)&&this.canDiscover(d);},
 team(){return [{o:S.P,s:pStats()},...carriedPets().map(p=>({o:p,s:calcPet(p)}))];},
 heal(hp=0,mp=0){for(const {o,s}of this.team())if(o.hp>0){o.hp=Math.min(s.hp,o.hp+Math.round(s.hp*hp));o.mp=Math.min(s.mp,o.mp+Math.round(s.mp*mp));}},
 spend(e){for(const {o,s}of (e.heroOnly?this.team().slice(0,1):this.team()))if(o.hp>0){if(e.hp)o.hp=Math.max(1,o.hp-Math.round(s.hp*e.hp));if(e.mp)o.mp=Math.max(0,o.mp-Math.round(s.mp*e.mp));}},
 gear(){const d=this.location(),candidates=Object.keys(EQ).filter(k=>{const e=EQ[k];return (e.slot!=='weapon'||e.wt===clsWeapon(S.P.cls))&&e.lv<=Math.max(1,Math.min(S.P.lv,ZN[d.zone-1].lv[1]))&&!e.legend&&!e.worldLegend&&!(k.startsWith('lg')||k.startsWith('sun'))&&(e.craft||e.rare||e.rareLoot);});if(!candidates.length){S.P.gold+=100;return 'ไม่มีอุปกรณ์หายาก/หลอมที่เหมาะกับเลเวล รับเงิน 100 แทน';}const key=candidates[Math.floor(Math.random()*candidates.length)];S.P.owned.push(key);return 'ได้รับ '+EQ[key].n;},
 allowed(choice){const st=this.state();return (choice.conditions||[]).every(c=>c.type==='gold'?S.P.gold>=c.amount:c.type==='item'?(S.P.items[c.id]||0)>=c.amount:c.type==='flag'?st.flags[c.key]===c.value:c.type==='level'?S.P.lv>=c.min:false);},
 effects(list){const st=this.state(),z=S.zone,out=[];for(const e of list){if(e.type==='heal'){this.heal(e.hp,e.mp);out.push('ฟื้น HP '+Math.round((e.hp||0)*100)+'% / MP '+Math.round((e.mp||0)*100)+'% ให้ผู้ที่มีสติ');}else if(e.type==='spend'){this.spend(e);out.push('รับภาระตามคำสัญญา (ไม่ทำให้หมดสติ)');}else if(e.type==='gold'){S.P.gold+=e.amount;out.push('ได้รับ '+fmt(e.amount)+' เหรียญ');}else if(e.type==='gear')out.push(this.gear());else if(e.type==='questPet')out.push(this.questPet(e));else if(e.type==='questWeapon')out.push(this.questWeapon(e));else if(e.type==='trainingPet')out.push(this.trainingPet());else if(e.type==='trainingWeapon')out.push(this.trainingWeapon());else if(e.type==='relation')st.relations[e.key]=(st.relations[e.key]||0)+e.amount;else if(e.type==='burden')st.burdens[e.key]={location:this.location().id,text:e.text};else if(e.type==='pending'&&!st.pending.some(x=>x.id===e.id)&&!st.claims['delayed:'+e.id]){st.pending.push({...e});}else if(e.type==='drain'&&z){this.plan(z).drain={remaining:e.turns,mp:e.mp};}else if(!['pending','drain'].includes(e.type))throw Error('Unsupported secret effect');}return out;},
 forkConsequences(z){const run=this.plan(z);if(run.processedDepth===z.depth)return;run.processedDepth=z.depth;const st=this.state();run.notice='';if(run.drain?.remaining>0){this.spend({mp:run.drain.mp});run.drain.remaining--;run.notice='เงาคำสัญญา: ใช้ MP ทีมเพิ่ม '+Math.round(run.drain.mp*100)+'% · เหลือ '+run.drain.remaining+' จุด (เฉพาะรอบนี้)';}
 const e=st.pending.find(x=>x.zone===z.id&&!st.claims['delayed:'+x.id]);if(!e||!z.fork)return;
 if(e.mode==='safe'){const k=e.id==='dragon-protector'?'revival':e.id==='hall-memory'?'cleanse':'spring';z.fork[0]={k,h:false};}else this.heal(e.hp,e.mp);
 st.claims['delayed:'+e.id]=true;st.pending=st.pending.filter(x=>x.id!==e.id);run.notice+=(run.notice?' · ':'')+e.text;},
 enter(){const z=S.zone,run=z&&this.plan(z),d=this.data(run?.location);if(!d||!this.eligible(d)||z.secretSession)return;const rec=this.record(d.id);z.depth++;z.fork=null;run.offered=true;z.secretSession={id:d.id,event:rec.completed?'finished':d.tutorial?'encounter':'intro',revision:0,last:'',puzzleAttempts:0,battleWon:false,arrival:true};z.ev={type:'secret',msg:''};this.checkpoint();},
 token(){const q=this.session();return q?q.id+':'+q.event+':'+q.revision:'';},
 valid(token){return !!this.session()&&this.token()===token&&S.screen==='zone'&&!S.battle;},
 transact(token,fn){if(this.busy||!this.valid(token))return;this.busy=true;const before=JSON.stringify(S);try{fn();if(this.session())this.session().revision++;this.checkpoint();render();this.focus();}catch(e){S=JSON.parse(before);toast('บันทึกเหตุการณ์ไม่ได้ ข้อมูลยังไม่เปลี่ยนแปลง ตรวจพื้นที่จัดเก็บแล้วลองอีกครั้ง');}finally{this.busy=false;}},
 advance(){const q=this.session(),d=this.location();if(d.tutorial)return;if(['intro','encounter'].includes(q.event))q.event=d.events[q.event].next;},
 leave(){const q=this.session(),z=S.zone;if(!q||S.battle)return;delete z.secretSession;z.ev=null;S.screen='zone';newFork();save();render();this.focus();},
 focus(){const q=this.session(),el=document.getElementById('secretEvent');if(q&&q.event!=='intro'&&el?.scrollIntoView)el.scrollIntoView({block:'start'});else document.querySelector('main')?.scrollTo?.(0,0);},
 choose(token,choiceId){this.transact(token,()=>{const d=this.location(),q=this.session(),rec=this.record(d.id);if((q.event!=='decision'&&!(d.tutorial&&q.event==='encounter'))||rec.completed)return;const choice=d.choices.find(x=>x.id===choiceId);if(!choice||(choice.requireVictory&&!q.battleWon)||!this.allowed(choice))return;const receipt=d.id+':decision';if(this.state().claims[receipt]){q.event='finished';return;}const out=this.effects(choice.effects);for(const [id,n]of Object.entries(d.rewardItems||{})){if(!CON[id]||!Number.isSafeInteger(n)||n<1)throw Error('Invalid secret item bundle');S.P.items[id]=(S.P.items[id]||0)+n;out.push('ได้รับ '+CON[id].n+' ×'+n);}S.P.gold+=d.gold;this.state().claims[receipt]=true;this.state().flags[d.id+':evidence']=true;rec.choices.main=choiceId;rec.completed=true;rec.outcome=choice.outcome;rec.results=[...out,...(d.gold?['บันทึกการค้นพบครั้งแรก +'+fmt(d.gold)+' เหรียญ']:[])];q.last=rec.outcome;q.event=d.tutorial?'finished':d.events[q.event].next;});},
 puzzle(token,i){this.transact(token,()=>{const q=this.session(),d=this.location();if(q.event!=='puzzle')return;if(Number(i)===d.correct){q.event=d.events[q.event].next;q.last='ตราเปิดออก คุณเข้าใจคำใบ้แล้ว';}else{q.puzzleAttempts++;q.last='ตรายังไม่ตอบรับ ลองอ่านคำใบ้อีกครั้ง ไม่มีบทลงโทษหรือรางวัลจากการลองซ้ำ';}});},
 fight(token){if(this.busy||!this.valid(token)||this.session().event!=='encounter'||S.P.hp<=0)return;const d=this.location(),q=this.session();q.event='combat';q.revision++;q.battleReturn='encounter';const zd=ZN[d.zone-1],lv=Math.min(zd.lv[1],Math.max(zd.lv[0],S.P.lv-1)),e=wildUnit(d.enemy,lv,0);e.kind='secretEcho';e.name='เงาทดสอบ · '+e.name;e.temporary=true;this.checkpoint();startBattle([e],'secret',d.zone);S.battle.secretId=d.id;save();render();},
 finishBattle(res){const b=S.battle,q=this.session();if(!b||b.kind!=='secret'||b.over)return;syncBack();const rec=this.record(b.secretId);if(res==='win'){q.battleWon=true;rec.guardWon=true;b.over={res,title:'ผ่านบททดสอบ',lines:Secret.location()?.tutorial?['ชนะบททดสอบแล้ว! ไม่มี EXP หรือของดรอปจากเงาฝึก','กดไปต่อเพื่อรับอาวุธหลอมหรือหายากตรงอาชีพ Lv ไม่เกิน 15 จำนวน 1 ชิ้น']:['ผู้เฝ้ายอมรับความตั้งใจ ไม่มี EXP ไอเทม หรือคะแนนจากเงาทดสอบ','กลับไปฟังเรื่องราวและเลือกคำสัญญาของคุณ']};Sound.fx('win');}else{S.P.hp=Math.max(1,S.P.hp);b.over={res,title:res==='lose'?'ผู้เฝ้าให้โอกาสอีกครั้ง':'ถอยจากบททดสอบ',lines:['ไม่เสียเงินหรือ EXP จากการประลองในสถานที่ลับ','กลับไปเจรจา อ่านเรื่องต่อ หรือออกจากสถานที่ได้']};Sound.fx('lose');}b.menu='end';save();},
 resume(){const q=this.session();if(!q)return;if(q.event==='combat'&&!S.battle){q.event='encounter';q.last='กลับถึงจุดก่อนประลอง การโหลดออนไลน์ไม่เก็บสนามรบ คุณเลือกเจรจาหรือเริ่มการประลองใหม่ได้';q.revision++;}},
 bookButton(){return '<button class="btn full secret-book-link" data-a="secretBook">บันทึกสถานที่ลับ · คำสัญญาที่ถูกจดจำ</button>';},
 canEnding(){const st=this.state();return S.P.cleared>0&&SECRET_DATA.locations.filter(d=>!d.optionalEnding).every(d=>st.locations[d.id]?.completed)&&!Object.keys(st.burdens).length;},
 repair(id,method){if(this.busy||S.battle||S.ui.cinema||!S.P||S.screen!=='story'||!S.ui.secretBook)return;const st=this.state(),e=st.burdens[id],d=e&&this.data(e.location);if(!d)return;const cost=d.zone*45;if(method==='donate'&&S.P.gold<cost)return;this.busy=true;const before=JSON.stringify(S);try{if(method==='donate')S.P.gold-=cost;else this.spend({mp:.1});delete st.burdens[id];st.flags[d.id+':atoned']=true;st.relations[id]=(st.relations[id]||0)+1;if(id==='scale'&&S.zone?.secretRun)S.zone.secretRun.drain=null;this.persist();render();toast(method==='donate'?'ส่งความช่วยเหลือและคืนคำสัญญาแล้ว':'คุณทำงานช่วยเหลือและคืนคำสัญญาแล้ว ใช้ MP ไม่เกิน 10% ของ MP เต็ม');}catch(e){S=JSON.parse(before);toast('บันทึกคำสัญญาไม่ได้ ข้อมูลยังไม่เปลี่ยนแปลง');}finally{this.busy=false;}},
 status(){return '<details class="card secret-team" open><summary>HP / MP และสถานะทีมที่พก</summary>'+this.team().map(({o,s})=>{const states=Object.keys(storedAilments(o));return '<div class="secret-status-row"><strong>'+esc(o===S.P?S.P.name:petName(o))+'</strong><span>HP '+fmt(o.hp)+'/'+fmt(s.hp)+' · MP '+fmt(o.mp)+'/'+fmt(s.mp)+'</span><small>'+(o.hp<=0?'หมดสติ':states.length?states.map(k=>esc(STS[k].n)).join(' · '):'ไม่มีสถานะผิดปกติ')+'</small></div>';}).join('')+'</details>';},
 panel(d,index,label,cls=''){return `<figure class="secret-panel ${cls}" role="img" aria-label="${esc(label)}" style="--story-atlas:url('assets/ui/secrets/${d.id}-story-v1.webp');--sx:${(index%3)*50}%;--sy:${Math.floor(index/3)*50}%"><figcaption>${esc(label)}</figcaption></figure>`;},
 imageButton(d,index,label,act,value,detail=''){return `<button class="btn secret-choice" data-a="${act}" data-v="${esc(value)}">${this.panel(d,index,label)}${detail?'<span class="secret-choice-detail">'+esc(detail)+'</span>':''}</button>`;},
 arrival(){const d=this.location();return `<section class="stack secret-location secret-arrival" aria-label="ค้นพบสถานที่ลับ"><div class="secret-portal"><div class="secret-arrival-image" style="background-image:url('assets/ui/secrets/${d.id}${d.tutorial?'-story':''}-v1.webp');${d.tutorial?'background-size:300% 300%;background-position:0 0;':''}"></div><i></i><i></i><h2>ค้นพบทางลับ!</h2><p>${esc(d.name)}</p></div><button class="btn pri full" data-a="secretArrival" data-v="${esc(this.token())}">ก้าวผ่านม่านพลัง · เข้าสู่สถานที่ลับ</button></section>`;},
 giftPet(sp,level){normalizePack();if(!SP[sp]||SP[sp].legendary||SP[sp].noseal)throw Error('Forbidden secret pet');const p=mkPet(sp,Math.max(1,Math.min(S.P.lv,level)));S.P.pets.push(p);const carry=S.P.carried.length<carryLimit();if(carry)S.P.carried.push(p.uid);S.P.seen[sp]=1;S.P.caught[sp]=1;markFormSeen(sp,p.form||0);return 'ได้รับ '+SP[sp].n+' Lv '+p.lv+' จำนวน 1 ตัว'+(carry?' · อยู่ในกระเป๋า':' · กระเป๋าเต็ม ส่งไปค่ายแล้ว');},
 questPet(e){const pool=ZN[e.zone-1].rare.filter(k=>SP[k]?.rare&&!SP[k].legendary&&!SP[k].noseal);if(!pool.length)throw Error('No eligible rare quest pet');return this.giftPet(pick(pool),e.level);},
 questWeapon(e){const wt=clsWeapon(S.P.cls);let pool;if(e.quality==='legend')pool=Object.keys(EQ).filter(k=>{const x=EQ[k];return x.slot==='weapon'&&x.wt===wt&&Number(x.legend)===e.zone&&!x.worldLegend&&k.startsWith('lg'+e.zone+'_weapon_')&&!/^(wl_|sun)/.test(k);});else pool=Object.keys(EQ).filter(k=>{const x=EQ[k];return x.slot==='weapon'&&x.wt===wt&&x.lv<=e.maxLevel&&(x.craft||x.rare||x.rareLoot)&&!x.legend&&!x.worldLegend&&!/^(lg|sun|wl_)/.test(k);});if(!pool.length)throw Error('No eligible quest weapon');const id=pick(pool),x=EQ[id];if(x.worldLegend||/^(wl_|sun)/.test(id))throw Error('Forbidden eclipse reward');S.P.owned.push(id);return 'ได้รับ '+x.n+' · Lv '+x.lv+' จำนวน 1 ชิ้น'+(x.legend?' · ตำนานทั่วไป':'');},
 commonReward(d){if(!d.rewardItems)return '';return '<div class="card secret-common-rewards"><b>รางวัลเมื่อจบเหตุการณ์ · ได้ทั้งสองทางเลือก</b><p>'+fmt(d.gold)+' เหรียญ</p><small>'+Object.entries(d.rewardItems).map(([id,n])=>esc(CON[id].n)+' ×'+n).join(' · ')+'</small><p class="sub">บวกของรางวัลเฉพาะทางเลือกด้านล่าง · รับได้ครั้งเดียว</p></div>';},
 trainingPet(){normalizePack();const pool=ZN[6].sp.filter(k=>SP[k].ev?.length===2&&!SP[k].legendary&&!ZN.some(z=>z.rare.includes(k)));if(!pool.length)throw Error('No ordinary three-form starter');const sp=pick(pool),p=mkPet(sp,1,0);S.P.pets.push(p);const carried=S.P.carried.length<carryLimit();if(carried)S.P.carried.push(p.uid);S.P.seen[sp]=1;S.P.caught[sp]=1;return 'ได้รับ '+SP[sp].n+' ร่างแรก Lv 1 จำนวน 1 ตัว'+(carried?' · อยู่ในกระเป๋า':' · กระเป๋าเต็ม ส่งไปค่ายแล้ว');},
 trainingWeapon(){const pool=Object.keys(EQ).filter(k=>{const e=EQ[k];return e.slot==='weapon'&&e.wt===clsWeapon(S.P.cls)&&e.lv<=15&&(e.craft||e.rare||e.rareLoot)&&!e.legend&&!e.worldLegend&&!/^(lg|sun)/.test(k);});if(!pool.length)throw Error('No eligible starter weapon');const id=pick(pool);S.P.owned.push(id);return 'ได้รับ '+EQ[id].n+' · Lv '+EQ[id].lv+' จำนวน 1 ชิ้น';},
 trainingView(){const d=this.location(),q=this.session(),rec=this.record(d.id),token=this.token();if(q.event==='finished')return `<section class="stack secret-location"><h2>${esc(d.name)}</h2>${this.panel(d,rec.choices.main==='peace'?5:4,rec.choices.main==='peace'?'สหายใหม่เลือกเดินเคียงข้างคุณ':'รางวัลแห่งการประลอง')}<div class="card stack"><h3>คำสัญญาแรกถูกจดจำแล้ว</h3><p>${esc(rec.outcome)}</p>${(rec.results||[]).map(t=>'<p>'+esc(t)+'</p>').join('')}</div><button class="btn pri full" data-a="secretLeave" data-v="${esc(token)}">กลับสู่ป่าฝึกหัด</button></section>`;
 const choices=q.event==='decision'&&q.battleWon?this.imageButton(d,4,'รับอาวุธจากผู้เฝ้า','secretChoose',token+'|trial',d.choices[1].detail):this.imageButton(d,3,d.choices[0].name,'secretChoose',token+'|peace',d.choices[0].detail)+this.imageButton(d,4,d.choices[1].name,'secretFight',token,d.choices[1].detail);
 return `<section class="stack secret-location"><h2>${esc(d.name)}</h2>${this.panel(d,0,d.visual.intro)}<p>${esc(d.intro)}</p>${q.last?'<p role="status">'+esc(q.last)+'</p>':''}<div class="secret-choice-grid">${choices}</div><p class="sub">เลือกผลลัพธ์ได้เพียงทางเดียว · อสูรที่ได้ถ้ากระเป๋าเต็มจะพักที่ค่าย · บททดสอบไม่มี EXP หรือของดรอปอื่น</p>${this.status()}<button class="btn full" data-a="secretLeave" data-v="${esc(token)}">ออกจากสถานที่ลับ · กลับป่าฝึกหัด</button></section>`;},
 view(){const d=this.location(),q=this.session();if(!d||!q)return '';if(q.arrival)return this.arrival();if(d.tutorial)return this.trainingView();const rec=this.record(d.id),token=this.token(),button=(label,act,v=token,extra='')=>`<button class="btn full ${extra}" data-a="${act}" data-v="${esc(v)}">${esc(label)}</button>`,details=text=>`<details class="secret-prose"><summary>อ่านเรื่องราวเพิ่มเติม</summary><p>${esc(text)}</p></details>`;let body='';
 if(q.event==='intro')body=`${this.panel(d,0,d.visual.intro)}${details(d.intro)}${this.imageButton(d,1,'สำรวจร่องรอย','secretNext',token)}`;
 else if(q.event==='puzzle')body=`${this.panel(d,1,d.visual.puzzle)}<blockquote>${esc(d.clue)}</blockquote><h3>${esc(d.question)}</h3><div class="secret-choice-grid">${d.answers.map((a,i)=>this.imageButton(d,6+i,a,'secretPuzzle',token+'|'+i)).join('')}</div>${q.puzzleAttempts?'<p class="sub">คำใบ้: '+esc(d.answers[d.correct])+' · ลองใหม่ได้โดยไม่เสียทรัพยากร</p>':''}`;
 else if(q.event==='encounter')body=`${this.panel(d,2,d.visual.encounter)}${details(d.guard)}<p class="sub">เงาทดสอบ Lv ${Math.min(ZN[d.zone-1].lv[1],Math.max(ZN[d.zone-1].lv[0],S.P.lv-1))} · ผนึกไม่ได้ · แพ้ไม่เสียเงิน/EXP</p><div class="secret-choice-grid">${this.imageButton(d,2,'ประลองกับผู้เฝ้า','secretFight',token,'ท้าทายเงาผู้พิทักษ์')}${this.imageButton(d,1,'วางอาวุธและรับฟัง','secretNext',token,'ผ่านโดยไม่สู้')}</div>`;
 else if(q.event==='decision')body=`${this.panel(d,1,d.visual.decision)}${this.commonReward(d)}<p>${esc(d.decision)}</p><p class="sub">คำสัญญาถูกบันทึกถาวร · ภาระที่ติดค้างชดเชยได้ในบันทึก</p><div class="secret-choice-grid">${d.choices.map((c,i)=>this.imageButton(d,3+i,c.name,'secretChoose',token+'|'+c.id,c.detail)).join('')}</div>`;
 else if(q.event==='finished'){const i=Math.max(0,d.choices.findIndex(c=>c.id===rec.choices.main));body=`${this.panel(d,3+i,d.choices[i].name)}<h3>คำสัญญาที่ถูกจดจำ</h3><p>${esc(rec.outcome||'คุณเคยผ่านเรื่องราวนี้แล้ว ไม่มีรางวัลครั้งแรกซ้ำ')}</p>${(rec.results||[]).map(t=>'<p class="sub">'+esc(t)+'</p>').join('')}${details(d.evidence)}<p class="sub">อ่านเรื่องย้อนหลังได้ในบันทึก สถานที่นี้จะไม่สุ่มพบอีก</p>`;}
 return `<section class="stack secret-location" aria-label="สถานที่ลับ ${esc(d.name)}"><div class="row"><h2 class="grow">${esc(d.name)}</h2><span class="sub">ชั้น ${S.zone.depth}/10</span></div><p class="sub">${esc(d.thai)} · ${q.event==='finished'?'จบเรื่องแล้ว':'ช่วง '+({intro:1,puzzle:2,encounter:3,decision:4}[q.event]||3)+'/4'}</p><div class="card stack" id="secretEvent">${q.last?'<p role="status">'+esc(q.last)+'</p>':''}${body}</div>${this.status()}${button(q.event==='finished'?'กลับสู่ทางแยกในป่า':'ออกจากสถานที่ลับ · กลับป่า','secretLeave',token)}</section>`;},
 art(d){if(d.tutorial)return this.panel(d,0,d.name);const src='assets/ui/secrets/'+d.id+'-v1.webp';return `<figure class="secret-scene" style="--secret-color:${['#8de0ac','#b9b6ef','#e5bd73','#91d9e8','#f1dbab','#d6a0c2'][d.zone-1]}"><img src="${src}" alt="${esc(d.thai)}" width="640" height="320"><figcaption><small>สถานที่ลับ</small><strong>${esc(d.name)}</strong><span>${esc(d.thai)}</span></figcaption></figure>`;},
 book(){const st=this.state();if(S.ui.secretEnding){if(!this.canEnding()){S.ui.secretEnding=false;return this.book();}return `<div class="stack"><h2>${esc(SECRET_DATA.ending.title)}</h2>${sceneArt(1,'คำสัญญาแห่งสหาย')}${SECRET_DATA.ending.text.map(t=>'<div class="card"><p>'+esc(t)+'</p></div>').join('')}<p class="sub">บทส่งท้ายเพิ่มเติม · ฉากจบหลักและรางวัลเดิมคงเดิม</p><button class="btn pri" data-a="secretBook">กลับบันทึกสถานที่ลับ</button></div>`;}
 const count=SECRET_DATA.locations.filter(d=>st.locations[d.id]?.completed).length;return `<div class="stack"><div class="row"><h2 class="grow">บันทึกสถานที่ลับ</h2><button class="btn" data-a="secretBookBack">กลับเกม</button></div><p>เรื่องราวที่พบ ${count}/${SECRET_DATA.locations.length} · โอกาสพบคิดต่อการเข้าป่าหนึ่งรอบ เฉพาะทางแยกชั้น 5–8</p>${SECRET_DATA.testDiscovery100?'<p class="card" role="status">โหมดทดสอบชั่วคราว: พบสถานที่ลับ 100% เมื่อเข้าป่ารอบใหม่ · ยังต้องเดินถึงชั้น 5–8</p>':''}<p class="sub">พบได้แห่งละหนึ่งครั้งต่อตัวละคร · อ่านย้อนหลังได้ในบันทึก · ไม่ต้องสำรวจครบก็จบเรื่องหลักได้</p>${SECRET_DATA.locations.map(d=>{const r=st.locations[d.id];return `<details class="card secret-journal"><summary>${r?esc(d.name):'สถานที่ที่ยังไม่ค้นพบ'} · ${esc(ZN[d.zone-1].n)} · ${Math.round(this.chance(d)*100)}%${r?.completed?' · จบเรื่องแล้ว':''}</summary>${r?`<p>${esc(d.thai)}</p><p>${esc(r.completed?d.evidence:'ออกจากสถานที่ก่อนทำเหตุการณ์จบแล้ว สถานที่นี้จะไม่สุ่มพบซ้ำ')}</p>${r.completed?'<p>'+esc(r.outcome)+'</p><small>คำสัญญา: '+esc(d.choices.find(c=>c.id===r.choices.main)?.name||'')+'</small>':''}`:'<p>ทางแยกอาจเผยให้เห็นร่องรอยระหว่างความลึก 5–8 โอกาสสุ่มใหม่เมื่อเข้าป่ารอบใหม่</p>'}</details>`;}).join('')}${Object.entries(st.burdens).map(([id,e])=>{const d=this.data(e.location),cost=d.zone*45;return `<div class="card stack"><h3>คำสัญญาที่ยังติดค้าง</h3><p>${esc(e.text)}</p><p class="sub">${esc(d.repair)} หรือใช้แรงช่วยเหลือแทนเงิน</p><button class="btn" data-a="secretRepair" data-v="${id}|donate" ${S.P.gold<cost?'disabled':''}>บริจาค ${cost} เหรียญ</button><button class="btn" data-a="secretRepair" data-v="${id}|volunteer">ช่วยงานอาสา · ใช้ MP ทีมไม่เกิน 10% · ไม่มีค่าใช้จ่าย</button></div>`;}).join('')}<div class="card stack"><h3>บทส่งท้ายที่ซ่อนอยู่</h3><p>จบเรื่องหลัก · ค้นพบเรื่องราวครบหกแห่ง · คืนคำสัญญาที่ติดค้าง</p>${this.canEnding()?'<button class="btn pri" data-a="secretEnding">อ่านบทส่งท้ายลับ</button>':'<p class="sub">ยังมีเรื่องราวหรือคำสัญญาที่รอคุณอยู่</p>'}</div><div class="card"><h3>ร่องรอยที่เคยช่วยเหลือ</h3>${Object.entries(st.relations).length?Object.entries(st.relations).map(([k,n])=>'<p>'+esc(({root:'รากไม้',bell:'ผู้เฝ้าระฆัง',scale:'ตาชั่ง',dragon:'มังกรเหนือเมฆ',protector:'ผู้คุ้มครอง',hall:'วิหาร',witness:'พยาน',survivor:'ผู้รอดชีวิต'})[k]||'ผู้พิทักษ์')+' · ความไว้ใจ '+n+'</p>').join(''):'<p class="sub">ยังไม่มีคำสัญญาที่ถูกจดจำ</p>'}</div></div>`;}
};
ROUTE_ART.secret=BUILTIN_SCENES[2];
EV.secret={n:'ร่องรอยสถานที่ลับ',g:'✧',d:'ทางที่ไม่ได้ปรากฏทุกครั้ง มีเรื่องราวและคำสัญญารออยู่',w:0};
const secretNewForkPrevious=newFork;
newFork=function(...args){const z=S.zone;if(!z)return secretNewForkPrevious(...args);if(z.secretSession)return;const run=Secret.plan(z);secretNewForkPrevious(...args);Secret.forkConsequences(z);if(!z.fork||run.offered||run.depth!==z.depth+1)return;const d=Secret.data(run.location);if(!d||!Secret.eligible(d))return;z.fork[z.depth%2]={k:'secret',h:false};run.offered=true;save();};
const secretChooseForkPrevious=chooseFork;
chooseFork=function(i){if(S.zone?.fork?.[Number(i)]?.k==='secret'){if(S.battle&&!S.battle.over)return;Secret.enter();render();Secret.focus();return;}return secretChooseForkPrevious(i);};
const secretZonePrevious=vZone;
vZone=function(){Secret.resume();if(Secret.session()&&S.zone?.ev?.type==='secret')return Secret.view();const html=secretZonePrevious(),notice=S.zone?.secretRun?.notice;return (notice?'<p class="card" role="status">'+esc(notice)+'</p>':'')+html;};
const secretStartBattlePrevious=startBattle;
startBattle=function(...args){const result=secretStartBattlePrevious(...args);if(args[1]==='boss'&&S.zone&&S.P?.secrets){const st=Secret.state(),id=SECRET_DATA.locations.find(d=>d.zone===S.zone.id)?.id;if(id&&st.locations[id]?.completed){blog('ผู้พิทักษ์จดจำคำสัญญาของคุณ: '+SECRET_DATA.locations.find(d=>d.id===id).evidence);if(S.zone.id===6){const n=SECRET_DATA.locations.filter(d=>!d.optionalEnding&&st.locations[d.id]?.completed).length;blog('จอมมาร: «เจ้าได้ยินเสียงที่ข้าพยายามเก็บไว้แล้ว '+n+' แห่ง... แต่การรู้ความเจ็บปวดของข้า ไม่ได้ทำให้เจ้าต้องยอมรับข้า»');}}}return result;};
const secretEndBattlePrevious=endBattle;
endBattle=function(res){if(S.battle?.kind==='secret')return Secret.finishBattle(res);return secretEndBattlePrevious(res);};
const secretBattleActionPrevious=battleAction;
battleAction=function(v){const b=S.battle,q=Secret.session();if(b?.kind==='secret'&&q&&v==='done'&&b.over){const won=b.over.res==='win';S.battle=null;q.event=won?'decision':'encounter';q.last=won?'ผู้เฝ้าเปิดทาง คุณพร้อมฟังเรื่องราวต่อ':'คุณยังเลือกเจรจาหรือออกไปเตรียมทีมได้';q.revision++;Secret.checkpoint();if(won&&Secret.location()?.tutorial){Secret.choose(Secret.token(),'trial');return;}render();Secret.focus();return;}return secretBattleActionPrevious(v);};
const secretContinuePrevious=handlers.cont;
handlers.cont=function(...args){if(Secret.session())return;return secretContinuePrevious(...args);};
Object.assign(handlers,{
 secretArrival:v=>Secret.transact(v,()=>{Secret.session().arrival=false;}),secretNext:v=>Secret.transact(v,()=>Secret.advance()),secretPuzzle:v=>{const [token,i]=v.split('|');Secret.puzzle(token,i);},secretChoose:v=>{const [token,id]=v.split('|');Secret.choose(token,id);},secretFight:v=>Secret.fight(v),secretLeave:v=>{if(!Secret.valid(v))return;if((SECRET_DATA.oncePerCharacter||Secret.location()?.once)&&!Secret.record(Secret.location().id).completed){S.ui.confirm={msg:'ออกจากสถานที่ลับที่ยังไม่จบหรือไม่? สถานที่นี้พบได้ครั้งเดียวต่อตัวละคร ออกแล้วจะไม่สุ่มพบอีก และรางวัลที่ยังไม่รับจะไม่ได้รับ',act:'secretLeaveConfirm',v};render();return;}Secret.leave();},secretLeaveConfirm:v=>{if(Secret.valid(v)){S.ui.confirm=null;Secret.leave();}},
 secretBook:()=>{if(!S.P)return;S.ui.secretReturn=S.ui.secretReturn||S.screen;S.ui.secretBook=true;S.ui.secretEnding=false;S.screen='story';save();render();Secret.focus();},secretBookBack:()=>{const back=S.ui.secretReturn;delete S.ui.secretBook;delete S.ui.secretEnding;delete S.ui.secretReturn;S.screen=back==='story'?(S.zone?'zone':'town'):back||'town';render();Secret.focus();},secretRepair:v=>{const [id,method]=v.split('|');if(['donate','volunteer'].includes(method))Secret.repair(id,method);},secretEnding:()=>{if(!Secret.canEnding())return;Secret.state().endingSeen=true;S.ui.secretEnding=true;save();render();Secret.focus();}
});
const secretStoryPrevious=vStory;
vStory=function(){if(S.ui.secretBook)return Secret.book();return secretStoryPrevious()+(S.ui.cinema?'':Secret.bookButton());};
const secretGuidePrevious=vGuide;
vGuide=function(){return Secret.bookButton()+secretGuidePrevious();};
const secretMigratePrevious=migrate;
migrate=function(){secretMigratePrevious();if(S.P){Secret.state();Secret.resume();}};
const secretMusicPrevious=uploadedMusicScene;
uploadedMusicScene=function(){if(S.screen==='story'&&S.ui.secretEnding)return {group:'bgSuccessMusic',stamp:'secret-ending'};if(S.screen==='zone'&&Secret.location())return {group:Secret.location().music,stamp:'secret:'+Secret.location().id};return secretMusicPrevious();};
// PVP uses its own key so future tower artwork cannot overwrite its backdrop.
TOWN_ART.pvp='assets/media/d22b62fc32b6345a4255bd69.webp';
// Forest-only teleport hazards. A separate battle kind cannot clear story bosses.
const SecretWarp={
 riskyChests:['blood','legend'],
 eligible(){return !!S.zone&&!ZN[S.zone.id-1].train&&!S.zone.warpUsed&&!S.zone.warpGate&&!S.zone.secretSession&&!S.battle;},
 trigger(source){if(!this.eligible())return false;const z=S.zone,from=z.id,target=Math.min(6,from+1),base=ZN[target-1].boss;z.warpUsed=true;z.warpGate={source,phase:'arrival',target,boss:{...base,lv:base.lv+(from===6?8:0)},originDepth:z.depth};z.fork=null;z.ev={type:'warpGate',msg:''};z.after=null;zlog('กับดักวาร์ป! ถูกพามาหน้าประตูบอสแห่ง'+ZN[target-1].n);save();render();return true;},
 gate(){const g=S.zone?.warpGate;if(!g)return '';if(g.phase==='arrival')return `<section class="stack warp-arrival"><div class="secret-portal warp-portal"><div class="secret-arrival-image" style="background-image:url('assets/ui/secrets/warp-trap-v1.webp')"></div><i></i><i></i><h2>กับดักวาร์ป!</h2><p>ม่านพลังฉีกเส้นทางสู่ประตูต้องห้าม</p></div><button class="btn danger full" data-a="warpArrive">ตั้งสติ · ดูประตูที่ถูกพามา</button></section>`;
 return `<section class="stack warp-gate"><h2>ประตูบอสต้องห้าม</h2><img class="boss-gate-art" src="assets/ui/boss-gates/gate-${g.target}.webp" alt="ประตูบอส ${esc(ZN[g.target-1].n)}"><div class="card stack"><h3>${esc(g.boss.n)} · Lv ${g.boss.lv}</h3><p>กับดักพาคุณข้ามเส้นทางมาถึงบอสที่ยากกว่าปกติ ก่อนจะพร้อม</p><p class="sub">ชนะไม่ปลดล็อกด่านหรือจบเนื้อเรื่อง · แพ้เสียเงินและ EXP ตามกติกาป่าปกติ · หนีระหว่างสู้ไม่ได้</p>${Secret.status()}<button class="btn danger full" data-a="warpFight">ท้าทายบอสที่อยู่หลังประตู</button><button class="btn full" data-a="warpRetreat">ถอยผ่านรอยแยก · กลับทางแยกเดิม</button></div></section>`;},
 retreat(){if(!S.zone?.warpGate||S.battle)return;delete S.zone.warpGate;S.zone.ev=null;newFork();save();render();},
 fight(){const g=S.zone?.warpGate;if(!g||g.phase!=='gate'||S.battle||S.P.hp<=0)return;g.phase='combat';const e=wildUnit(g.boss.sp,g.boss.lv,0,g.boss.n);startBattle([e],'warpBoss',g.target);S.battle.noFlee=true;save();render();},
 resume(){const g=S.zone?.warpGate;if(g&&g.phase==='combat'&&!S.battle)g.phase='gate';}
};
const secretVisualForkPrevious=chooseFork;
chooseFork=function(i){const d=S.zone?.fork?.[Number(i)];if(d?.h&&SecretWarp.eligible()&&Math.random()<.10){S.zone.depth++;return SecretWarp.trigger('dark');}return secretVisualForkPrevious(i);};
const secretVisualChestPrevious=handlers.openchest;
handlers.openchest=function(...args){const e=S.zone?.ev;if(e?.type==='chest'&&!e.opened&&SecretWarp.riskyChests.includes(e.chest)&&SecretWarp.eligible()&&!e.warpChecked){e.warpChecked=true;if(Math.random()<.10){e.opened=true;return SecretWarp.trigger('chest:'+e.chest);}}return secretVisualChestPrevious(...args);};
const secretVisualZonePrevious=vZone;
vZone=function(){SecretWarp.resume();if(S.zone?.warpGate&&!S.battle)return SecretWarp.gate();return secretVisualZonePrevious();};
const secretVisualBattlePrevious=battleAction;
battleAction=function(v){if(S.battle?.kind==='warpBoss'&&S.battle.over&&v==='done'&&S.zone)delete S.zone.warpGate;if(S.battle?.kind==='warpBoss'&&String(v).split(':')[0]==='flee')return toast('ประตูปิดแล้ว หนีระหว่างการท้าทายไม่ได้');return secretVisualBattlePrevious(v);};
const secretVisualBossPrevious=handlers.boss;
handlers.boss=function(...args){if(S.zone?.warpGate)return;return secretVisualBossPrevious(...args);};
const secretVisualContinuePrevious=handlers.cont;
handlers.cont=function(...args){if(S.zone?.warpGate)return;return secretVisualContinuePrevious(...args);};
Object.assign(handlers,{warpArrive:()=>{const g=S.zone?.warpGate;if(!g||g.phase!=='arrival'||S.battle)return;g.phase='gate';save();render();},warpFight:()=>SecretWarp.fight(),warpRetreat:()=>SecretWarp.retreat()});
const secretVisualForestPrevious=forestDetail;
forestDetail=function(z){const html=secretVisualForestPrevious(z),d=SECRET_DATA.locations.find(x=>x.zone===z.id);if(!d)return html;const known=!!S.P.secrets?.locations?.[d.id]?.discovered;const marker=known?`<div class="secret-map-known">${Secret.art(d)}<small>ค้นพบแล้ว · สถานที่ลับ</small></div>`:'<div class="secret-map-unknown"><span class="secret-silhouette" aria-hidden="true"></span><b>สถานที่ลับ · ยังไม่ค้นพบ</b><small>มีร่องรอยซ่อนอยู่ในทางแยกชั้น 5–8</small></div>';return html.replace('<div class="row wrap">',marker+'<div class="row wrap">');};
const secretVisualWildPrevious=vWild;
vWild=function(){let html=secretVisualWildPrevious();for(const d of SECRET_DATA.locations){const known=!!S.P.secrets?.locations?.[d.id]?.discovered;html=html.replace('<strong class="forest-name">'+esc(ZN[d.zone-1].n)+'</strong>','<strong class="forest-name">'+esc(ZN[d.zone-1].n)+'</strong><span class="secret-map-mini">'+'สถานที่ลับ : '+(known?esc(d.name):'ยังไม่ปลดล๊อค')+'</span>');}return html;};
const secretVisualMusicPrevious=uploadedMusicScene;
uploadedMusicScene=function(){if(S.battle?.kind==='warpBoss'&&S.battle.over?.res==='win')return {group:'bgSuccessMusic',stamp:'warp-victory'};if(S.screen==='zone'&&S.zone?.warpGate){const id=S.zone.warpGate.target;return {group:({2:'bgMistBossRoomMusic',3:'bgDesertBossDoorMusic',4:'bgDragonBossDoorMusic',6:'bgDemonBossRoomMusic'})[id]||'bgBossRoomMusic',stamp:'warp:'+id};}return secretVisualMusicPrevious();};const ForestSpecial={
 busy:false,
 data(){return SECRET_DATA.repeatableEvents.find(d=>d.zone===S.zone?.id);},
 plan(z){if(z.specialRun)return z.specialRun;const found=Math.random()<.15;return z.specialRun={depth:found?5+Math.floor(Math.random()*4):null,offered:false,used:false};},
 session(){return S.zone?.specialSession;},
 valid(token){return !!this.session()&&this.session().token===token&&S.screen==='zone'&&!S.battle&&!S.zone.secretSession&&!S.zone.warpGate;},
 persist(){towerCheckpoint();localStorage.setItem(SAVE,JSON.stringify(S));},
 focus(){document.getElementById('forestSpecial')?.scrollIntoView?.({block:'start'});},
 enter(){const z=S.zone;if(!z||S.battle||z.secretSession||z.warpGate||z.specialSession||!this.data()||this.plan(z).used)return;const before=JSON.stringify(S);try{z.depth++;z.fork=null;z.specialRun.used=true;z.specialSession={token:'special:'+z.id+':'+z.depth+':'+crypto.randomUUID(),claimed:false,results:[]};z.ev={type:'specialEvent',msg:''};zlog('ก้าวที่ '+z.depth+' · เหตุการณ์พิเศษ: '+this.data().name);this.persist();render();this.focus();}catch(e){S=JSON.parse(before);toast('บันทึกเหตุการณ์ไม่ได้ ลองอีกครั้ง');}},
 pet(){normalizePack();const d=this.data(),pool=ZN[d.zone-1].sp.filter(k=>SP[k]&&!SP[k].rare&&!SP[k].legendary&&!SP[k].noseal&&!ZN.some(z=>z.rare.includes(k)));if(!pool.length||S.P.pets.length>=MAXPETS){S.P.gold+=d.gold;return 'พื้นที่อสูรเต็มหรือไม่มีอสูรทั่วไปที่เหมาะสม รับเงิน '+fmt(d.gold)+' เหรียญแทน';}const sp=pick(pool),lv=Math.max(1,Math.min(S.P.lv,ZN[d.zone-1].lv[0])),p=mkPet(sp,lv);S.P.pets.push(p);const carry=S.P.carried.length<carryLimit();if(carry)S.P.carried.push(p.uid);S.P.seen[sp]=1;S.P.caught[sp]=1;markFormSeen(sp,p.form||0);return 'ได้รับ '+petName(p)+' Lv '+lv+' · '+(carry?'อยู่ในกระเป๋า':'กระเป๋าเต็ม ส่งไปค่าย');},
 gear(weapon){const d=this.data(),limit=Math.max(1,Math.min(S.P.lv,ZN[d.zone-1].lv[1])),pool=Object.keys(EQ).filter(k=>{const e=EQ[k];return e.lv<=limit&&!e.rare&&!e.rareLoot&&!e.craft&&!e.legend&&!e.worldLegend&&!/^(lg|wl_|sun)/.test(k)&&(!weapon||e.slot==='weapon')&&(e.slot!=='weapon'||e.wt===clsWeapon(S.P.cls));});if(!pool.length){S.P.gold+=d.gold;return 'ไม่มีอุปกรณ์ทั่วไปที่เหมาะสม รับเงิน '+fmt(d.gold)+' เหรียญแทน';}const k=pick(pool);S.P.owned.push(k);return 'ได้รับ '+EQ[k].n+' Lv '+EQ[k].lv+' · อุปกรณ์ทั่วไป';},
 choose(token,id){if(this.busy||!this.valid(token)||this.session().claimed)return;const d=this.data(),c=d.choices.find(x=>x.id===id);if(!c)return;this.busy=true;const before=JSON.stringify(S);try{const q=this.session(),out=[];q.claimed=true;q.choice=id;if(c.pet)out.push(this.pet());if(c.gear)out.push(this.gear(c.weapon));if(c.gold){S.P.gold+=d.gold;out.push('ได้รับ '+fmt(d.gold)+' เหรียญ');}if(c.xp){const xp=progressionRewardExp(S.P,d.xp);out.push('ผู้ผนึกได้รับ EXP '+fmt(xp));out.push(...gainExp(S.P,xp,true));}if(c.hp||c.mp){Secret.heal(c.hp||0,c.mp||0);out.push('ฟื้น HP '+Math.round((c.hp||0)*100)+'% / MP '+Math.round((c.mp||0)*100)+'% ให้ทีมที่มีสติ');}if(c.costHP||c.costMP){Secret.spend({heroOnly:true,hp:c.costHP||0,mp:c.costMP||0});out.push('ผู้ผนึกใช้ HP '+Math.round((c.costHP||0)*100)+'% / MP '+Math.round((c.costMP||0)*100)+'% · ไม่ทำให้หมดสติ');}q.results=out;this.persist();Sound.fx('win');render();this.focus();}catch(e){S=JSON.parse(before);toast('บันทึกรางวัลไม่ได้ ข้อมูลยังไม่เปลี่ยนแปลง ลองอีกครั้ง');}finally{this.busy=false;}},
 leave(token){if(this.busy||!this.valid(token))return;const before=JSON.stringify(S);try{delete S.zone.specialSession;S.zone.ev=null;newFork();this.persist();render();focusForestChoicesAfterContinue();}catch(e){S=JSON.parse(before);toast('บันทึกไม่ได้ ลองอีกครั้ง');}},
 panel(d,index,label){return `<span class="special-panel" role="img" aria-label="${esc(label)}" style="--special-art:url('assets/ui/events/${d.id}-v1.webp');--special-y:${index*50}%"></span>`;},
 view(){const d=this.data(),q=this.session();if(!d||!q)return '';return `<section class="stack forest-special" id="forestSpecial"><small class="sub">เหตุการณ์พิเศษ · พบซ้ำได้ในการเข้าป่ารอบใหม่</small><h2>${esc(d.name)}</h2>${this.panel(d,q.claimed?d.choices.findIndex(c=>c.id===q.choice)+1:0,d.name)}<p>${esc(d.text)}</p>${q.claimed?`<div class="card stack" role="status"><h3>เรื่องราวระหว่างทาง</h3>${q.results.map(t=>'<p>'+esc(t)+'</p>').join('')}</div>`:`<p class="sub">เลือกได้หนึ่งทาง · ผลจบทันที ไม่มีคำสาปหรือเงื่อนไขเนื้อเรื่องระยะยาว · EXP ลดตามช่วงเลเวลปกติ</p><div class="special-choices">${d.choices.map((c,i)=>`<button class="special-choice" data-a="specialChoose" data-v="${q.token}|${c.id}">${this.panel(d,i+1,c.name)}<strong>${esc(c.name)}</strong><small>${esc(c.detail)}</small></button>`).join('')}</div>`}${Secret.status()}<button class="btn ${q.claimed?'pri':''} full" data-a="specialLeave" data-v="${q.token}">${q.claimed?'เดินป่าต่อ':'ขอผ่าน · เดินป่าต่อ'}</button></section>`;}
};
EV.specialEvent={n:'เหตุการณ์พิเศษ',g:'✦',d:'เรื่องสั้นระหว่างทาง · เลือกรับผลทันที · พบซ้ำได้รอบหน้า',w:0};
ROUTE_ART.specialEvent='assets/ui/events/training-v1.webp';
const specialRoutePrevious=routePicture;
routePicture=function(k,...args){if(k==='specialEvent'&&!args[0]){const d=ForestSpecial.data();if(d)return `<span class="special-route">${ForestSpecial.panel(d,0,d.name)}</span>`;}return specialRoutePrevious(k,...args);};
const specialNewForkPrevious=newFork;
newFork=function(...args){const z=S.zone;if(!z)return specialNewForkPrevious(...args);if(z.specialSession)return;const plan=ForestSpecial.plan(z);specialNewForkPrevious(...args);if(!z.fork||plan.offered||plan.used||plan.depth!==z.depth+1||!ForestSpecial.data()||z.secretSession||z.warpGate)return;const slots=z.fork.map((x,i)=>x.k==='secret'?-1:i).filter(i=>i>=0);if(!slots.length)return;z.fork[slots[z.depth%slots.length]]={k:'specialEvent',h:false};plan.offered=true;save();};
const specialForkPrevious=chooseFork;
chooseFork=function(i){if(S.zone?.specialSession)return;if(S.zone?.fork?.[Number(i)]?.k==='specialEvent'){ForestSpecial.enter();return;}return specialForkPrevious(i);};
const specialZonePrevious=vZone;
vZone=function(){if(ForestSpecial.session())return ForestSpecial.view();return specialZonePrevious();};
const specialContinuePrevious=handlers.cont;
handlers.cont=function(...args){if(ForestSpecial.session())return;return specialContinuePrevious(...args);};
Object.assign(handlers,{specialChoose:v=>{const cut=v.lastIndexOf('|');ForestSpecial.choose(v.slice(0,cut),v.slice(cut+1));},specialLeave:v=>ForestSpecial.leave(v)});
const specialMusicPrevious=uploadedMusicScene;
uploadedMusicScene=function(){if(S.screen==='zone'&&ForestSpecial.session())return {group:({training:'bgAdventureMusic',moon:'bgMysticForestMusic',mist:'bgMistValleyMusic',desert:'bgDesertMusic',dragon:'bgDragonPeakMusic',heaven:'bgHeavenAmbientMusic',castle:'bgSuspenseMusic'})[ForestSpecial.data()?.id]||'bgPuzzleMusic',stamp:'forest-special:'+ForestSpecial.data()?.id};return specialMusicPrevious();};

window.claude?.hot?.snapshot?.(()=>({S}));
window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});

