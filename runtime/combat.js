// Combat rules, turns, commands and settlement
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0099-endUnitTurn

function endUnitTurn(u){if(!u||u.hp<=0)return;for(const d of (u.dots||[])){const m=typeMult(d.el,u.types);if(m>0)hurt(u,Math.max(1,Math.round(u.st.hp*d.rate*m)));d.turns--;blog(u.name+' ได้รับผล '+d.n)}u.dots=(u.dots||[]).filter(d=>d.turns>0);}
// @soulbeast-end 0099-endUnitTurn
// @soulbeast-unit 0100-beginUnitTurn

function beginUnitTurn(u){u.freeFormUsed=false;u.freeFormPending=false;u.cooldowns=u.cooldowns||{};for(const k in u.cooldowns)u.cooldowns[k]=Math.max(0,u.cooldowns[k]-1);if(u.enchantTurns>0&&!--u.enchantTurns)delete u.enchant;if(u.immuneTurns>0&&!--u.immuneTurns)delete u.immune;if(u.summonLife!=null&&!--u.summonLife){u.hp=0;blog(u.name+' หมดเวลาอัญเชิญ');return true}return false}
// @soulbeast-end 0100-beginUnitTurn
// @soulbeast-unit 0102-addTemporary

// Four positions per sealer (world raid) or side. Dead positions are reused.
function battleSlotGroup(u,b=B()){if(!b)return [];const list=u.side==='ally'?b.allies:b.enemies;return b.kind==='world'&&u.side==='ally'?list.filter(x=>x.owner===u.owner):list;}
function battleHasRoom(u,b=B()){return !!b&&battleSlotGroup(u,b).filter(x=>x.hp>0).length<4;}
function battlePlaceUnit(u,n){
 const b=B(),list=sideOf(u),group=battleSlotGroup(u);if(group.filter(x=>x.hp>0).length>=4)return false;
 const old=group.find(x=>x.hp<=0);if(old){
  if(!old.temporary)(b.retiredUnits??=[]).push(old);
  // Persist a defeated pet before its visible slot is reused.
  const p=old.side==='ally'&&old.kind==='pet'&&S.P?.pets?.find(p=>p.uid===old.uid);
  if(p){p.hp=old.hp;p.mp=old.mp;p.ailments=Object.fromEntries(['poison','burn','confuse','para','static','freeze','chill'].filter(k=>old.status?.[k]).map(k=>[k,Math.max(2,old.status[k])]));}
  b.queue=(b.queue||[]).filter(id=>String(id).replace(/\*$/,'')!==old.id);
  list[list.indexOf(old)]=n;
 }else list.push(n);
 (b.queue??=[]).push(n.id);return true;
}
function addTemporary(u,sk){if(!battleHasRoom(u))return false;let n;
 if(sk.summon==='clone'){n=JSON.parse(JSON.stringify(u));n.st=Object.fromEntries(Object.entries(u.st).map(([k,v])=>[k,Math.max(k==='hp'?1:0,Math.round(v*(k==='hp'?(u.cls&&baseOf(u.cls)==='thief'?.25:.5):.8)))]));n.hp=n.st.hp;n.mp=n.st.mp;n.skills=n.skills.slice();n.name='ร่างแยก '+u.name;n.shadowOwner=u.id;}
 else if(sk.summon==='golem'){n=wildUnit('bastion_golem',u.lv,0);n.name='โกเลมอัญเชิญ';n.taunt=3;n.skills=['attack','guard_taunt'];}
 else{const P=u.kind==='player'||u.owner!=null?S.P:u;if(!Number.isFinite(P.gold))P.gold=u.lv*30;const cost=Math.floor(Math.max(0,P.gold)*.10);if(cost<1)return false;P.gold-=cost;const jobs=Object.keys(CLS).filter(c=>baseOf(c)!=='merchant'&&tierOf(c)<=Math.max(0,tierOf(u.cls)-1));const lv=Math.max(1,Math.floor(u.lv*.85));const eligible=jobs.filter(c=>tierOf(c)===0||lv>=(tierOf(c)===1?25:40));n=humanUnit('ทหารรับจ้าง',pick(eligible),lv,0);n.skills=n.skills.filter(id=>!SK[id].summon);}
 n.id=u.id+'_summon_'+(B().summonSerial=(B().summonSerial||0)+1);n.side=u.side;n.owner=u.owner;n.kind='summon';n.temporary=true;n.summonLife=sk.life+1;n.cooldowns={};n.buffs=[];n.status={};n.dots=[];n.immune=null;n.enchant=null;delete n.uid;return battlePlaceUnit(u,n);
}
// @soulbeast-end 0102-addTemporary
// @soulbeast-unit 0216-B


/* ================= BATTLE ENGINE ================= */
const B=()=>S.battle;
// @soulbeast-end 0216-B
// @soulbeast-unit 0235-unit


function unit(o){return {buffs:[],status:{},pas:[],stab:[],types:[],taunt:0,...o}}
// @soulbeast-end 0235-unit
// @soulbeast-unit 0236-playerUnit

function playerUnit(){const P=S.P,s=pStats(),w=EQ[P.eq.weapon];
 return unit({id:'P',side:'ally',kind:'player',name:P.name,lv:P.lv,st:s,hp:Math.min(P.hp,s.hp),mp:Math.min(P.mp,s.mp),skills:humanSkills(P.cls,P.lv,P.eq),pas:humanPas(P.cls,P.eq),stab:w&&w.el?[w.el]:[],atkType:w?w.t:'p',img:'player',cls:P.cls,gender:P.gender})}
// @soulbeast-end 0236-playerUnit
// @soulbeast-unit 0237-petUnit

function petUnit(p){const s=calcPet(p);return unit({id:'pet'+p.uid,uid:p.uid,side:'ally',kind:'pet',sp:p.sp,evo:p.form||0,name:petName(p),types:SP[p.sp].t.slice(),stab:SP[p.sp].t,lv:p.lv,st:s,hp:Math.min(p.hp,s.hp),mp:Math.min(p.mp,s.mp),skills:petSkills(p),pas:[SP[p.sp].pas],atkType:s.patk>=s.matk?'p':'m',img:p.sp})}
// @soulbeast-end 0237-petUnit
// @soulbeast-unit 0238-wildUnit

function wildUnit(sp,lv,i,boss){const t={sp,lv,form:formFor(sp,lv),pts:{}},s=calcPet(t,1.1);
 if(boss){s.hp=Math.round(s.hp*2);['patk','matk','pdef','mdef'].forEach(k=>s[k]=Math.round(s[k]*1.15))}
 return unit({id:'e'+i,side:'enemy',kind:'beast',sp,evo:t.form,name:boss||petName(t),types:SP[sp].t.slice(),stab:SP[sp].t,lv,st:s,hp:s.hp,mp:s.mp,skills:petSkills(t),pas:[SP[sp].pas],atkType:s.patk>=s.matk?'p':'m',boss:!!boss,r:SP[sp].r*(boss?2.5:1),img:sp})}
// @soulbeast-end 0238-wildUnit
// @soulbeast-unit 0240-humanUnit

function humanUnit(name,cls,lv,i){const eq=npcEq(cls,lv),focus=clsMult(cls,'patk')>=clsMult(cls,'matk')?'patk':'matk',pts={},n=5*(lv-1);
 Object.entries({[focus]:.35,hp:.25,pdef:.1,mdef:.1,spd:.1,acc:.1}).forEach(([k,v])=>pts[k]=n*v);
 const s=humanStats(cls,lv,pts,eq);s.hp=Math.round(s.hp*1.3);const w=EQ[eq.weapon];
 return unit({id:'e'+i,side:'enemy',kind:'human',name,cls,lv,st:s,hp:s.hp,mp:s.mp,skills:humanSkills(cls,lv,eq).filter(k=>!['form','revert'].includes(SK[k].t)&&!SK[k].gc),pas:humanPas(cls,eq),stab:w&&w.el?[w.el]:[],atkType:w.t,img:'npc:'+cls})}
// @soulbeast-end 0240-humanUnit
// @soulbeast-unit 0241-startBattle


function startBattle(enemies,kind,meta,pre){VQ.length=0;enemies=enemies.slice(0,4);
 const P=S.P,allies=[playerUnit()],used=[];
 party().filter(p=>p.hp>0).slice(0,Math.min(3,clsSum(P.cls))).forEach(p=>{allies.push(petUnit(p));used.push(p.uid)});
 enemies.forEach(e=>{if(e.sp)markFormSeen(e.sp,e.evo||0)});
 if(kind!=='npc')enemies.filter(e=>e.sp).slice(0,3).forEach((e,i)=>Sound.cry(e.sp,false,i*.18));
 S.battle={v:4,kind,meta,enemies,allies,round:0,queue:[],cur:null,log:[],target:0,atarget:allies.length>1&&baseOf(P.cls)==='summoner'?1:0,menu:'wait',over:null,used,fx:[]};
 S.screen='battle';if(pre)blog(pre);
 blog(kind==='npc'?`${enemies[0].name} ท้าประลองกับคุณ!`:kind==='traveler'?`นักเดินทางถอดผ้าคลุมออก... ${enemies[0].name} Lv ${enemies[0].lv} พุ่งเข้าโจมตี!`:kind==='bandit'?`${enemies[0].name} ตะโกนว่า "ทิ้งเงินไว้แล้วไปซะ!"`:kind==='boss'?`${enemies[0].name} ปรากฏตัว! บรรยากาศหนักอึ้ง`:enemies[0].rare?`★ ${enemies[0].name} ปรากฏตัวจากหมอก! อสูรหายาก`:enemies.length>1?`ฝูงอสูร ${enemies.length} ตัวพุ่งเข้าใส่!`:`${enemies[0].name} Lv ${enemies[0].lv} โผล่ออกมา!`);
 allU().forEach(u=>{if(hasPas(u,'intimidate')&&u.hp>0){foesOf(u).forEach(f=>f.buffs.push({st:'patk',amt:-.2,tn:4}));blog(`${u.name} ข่มขวัญ! ฝ่ายตรงข้ามโจมตีกายภาพลดลง`)}});
 newRound()}
// @soulbeast-end 0241-startBattle
// @soulbeast-unit 0242-blog

function blog(t){const b=B();b.log.push(t);if(b.log.length>60)b.log.shift()}
// @soulbeast-end 0242-blog
// @soulbeast-unit 0243-allU

const allU=()=>[...B().allies,...B().enemies];
// @soulbeast-end 0243-allU
// @soulbeast-unit 0245-sideOf

const sideOf=u=>u.side==='ally'?B().allies:B().enemies;
// @soulbeast-end 0245-sideOf
// @soulbeast-unit 0246-foesOf

const foesOf=u=>u.side==='ally'?B().enemies:B().allies;
// @soulbeast-end 0246-foesOf
// @soulbeast-unit 0247-hasPas

const hasPas=(u,k)=>u.pas.includes(k)||u.buffs.some(b=>b.pas===k);
// @soulbeast-end 0247-hasPas
// @soulbeast-unit 0248-eff

function eff(u,k){const a=u.buffs.reduce((s,b)=>b.st===k?s+b.amt:s,0);let v=u.st[k]*(1+Math.max(-.6,a));
 if(u.form){const f=FORMS[u.form].m[k];if(f)v*=f}
 const s=u.status;if(s.freeze&&(k==='pdef'||k==='mdef'))v*=1.5;if(k==='spd'){if(s.chill)v*=.6;if(s.static)v*=.7}if(k==='acc'&&s.static)v*=.9;
 if(k==='spd'&&hasPas(u,'swift'))v*=1.2;if(k==='eva'&&hasPas(u,'elusive'))v*=1.25;if(k==='acc'&&hasPas(u,'eagle'))v*=1.15;if(k==='crit'&&hasPas(u,'keen'))v+=10;
 if((k==='patk'||k==='matk')&&hasPas(u,'rage')&&u.hp<u.st.hp/2)v*=1.3;
 if((k==='pdef'||k==='mdef')&&hasPas(u,'laststand')&&u.hp<u.st.hp*.3)v*=1.5;
 if(['patk','matk'].includes(k)&&['pet','npcpet'].includes(u.kind)&&!u.temporary){const count=sideOf(u).filter(x=>['pet','npcpet'].includes(x.kind)&&!x.temporary&&x.hp>0&&x.owner===u.owner).length;v*=Math.max(0,1-.15*Math.max(0,count-1));}
 if(k==='acc'&&u.boss)v+=15;
 if(isWorldBattle()&&u.immortalWorld&&['patk','matk'].includes(k))v*=Math.pow(1.05,Math.max(0,(B().bossTurns||1)-1));return Math.max(k==='crit'?0:1,pvpOffense(u,k,v))}
// @soulbeast-end 0248-eff
// @soulbeast-unit 0249-hitChance

const hitChance=(u,t,sk)=>clamp(eff(u,'acc')-eff(t,'eva')+15+((sk&&sk.acc)||0),minimumHitChance(u,t),100);
// @soulbeast-end 0249-hitChance
// @soulbeast-unit 0252-costOf

const costOf=(u,sk)=>sk.mp?Math.round(sk.mp*(hasPas(u,'mpsave')?.7:1)*WorldTales.skillFactor(u)):0;
// @soulbeast-end 0252-costOf
// @soulbeast-unit 0255-hurt

// Once per battle; only an owner's living permanent companion can pay the cost.
function trySummonerSoulRevive(u){
 if(!u.cls||baseOf(u.cls)!=='summoner'||!['player','human'].includes(u.kind)||u.temporary||u.summonerSoulRevived||!B())return false;
 const pet=sideOf(u).filter(p=>['pet','npcpet'].includes(p.kind)&&!p.temporary&&p.owner===u.owner&&p.hp>0).reduce((a,p)=>!a||p.hp<a.hp?p:a,null);
 if(!pet)return false;
 u.summonerSoulRevived=true;pet.hp=0;pet.reborn=1;
 u.hp=Math.max(1,Math.round(u.st.hp*.3));
 u.status=typeof retainedBattleAilments==='function'?retainedBattleAilments(u):{};
 blog(pet.name+' สละพลังชีวิตให้ '+u.name+' ฟื้นคืนชีพด้วย HP 30% (1 ครั้งต่อการต่อสู้)');
 fxAdd(pet,'สละชีวิต','bad');fxAdd(u,'คืนชีพ 30%','good');vfx('heal',u.id);return true;
}
function hurt(u,d,c='bad'){if(isWorldBattle()&&u.immortalWorld){const b=B(),damage=Math.max(0,Math.min(1e12,Math.round(Number(d)||0)));b.damageTotal=(b.damageTotal||0)+damage;const owner=b.wbDamageOwner;if(Number.isInteger(owner)&&owner>=0)b.damageBy[owner]=(b.damageBy[owner]||0)+damage;u.hp=u.st.hp;fxAdd(u,'-'+damage,c);return;}const wasAlive=u.hp>0;u.hp=Math.max(0,u.hp-d);fxAdd(u,'-'+d,c);
 if(u.hp<=0){if(hasPas(u,'rebirth')&&!u.reborn){u.reborn=1;u.hp=Math.round(u.st.hp*.4);u.status=retainedBattleAilments(u);blog(`${u.name} ลุกขึ้นจากเถ้าถ่าน! ฟื้นคืนชีพ`);fxAdd(u,'คืนชีพ','good')}else if(wasAlive&&trySummonerSoulRevive(u)){/* revived before settlement */}else{blog(`${u.name} ล้มลง`);if(wasAlive)Sound.cry(u.sp,true)}}}
// @soulbeast-end 0255-hurt
// @soulbeast-unit 0256-heal

function heal(u,a){const v=Math.min(u.st.hp-u.hp,Math.round(a));if(v>0){u.hp+=v;fxAdd(u,'+'+v,'good')}return v}
// @soulbeast-end 0256-heal
// @soulbeast-unit 0257-turnStartBase

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
// @soulbeast-end 0257-turnStartBase
// @soulbeast-unit 0261-steal

function steal(u,t){const P=S.P;if(u.side==='ally'){if(Math.random()<.6){const g=R(t.lv*3,t.lv*6);P.gold+=g;ExtraAudio.play('coin');blog(`ขโมยได้ ${g} เหรียญ`)}else{const k=pick(['pot','eth','seal1','antidote',t.lv>12?'pot2':'pot',t.lv>12?'seal2':'seal1']);P.items[k]=(P.items[k]||0)+1;blog(`ขโมยได้ ${CON[k].n}`)}}
 else if(t.kind==='player'){const g=Math.min(P.gold,u.lv*4);P.gold-=g;if(g)blog(`${u.name} ขโมยเงินคุณไป ${g} เหรียญ!`)}}
// @soulbeast-end 0261-steal
// @soulbeast-unit 0262-actBase

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
  const hm=(hasPas(u,'healer')?1.3:1)*((['pet','npcpet','summon'].includes(u.kind)||u.kind==='beast'&&u.side==='ally') ? .7 : ['player','human'].includes(u.kind)&&u.cls&&['druid','summoner'].includes(baseOf(u.cls))&&!(['pvp','raid','camp','guildwar','tower','world'].includes(B()?.kind)||B()?.towerRun) ? .7 : 1);
  list.forEach(x=>{if(sk.t==='heal'){if(x.hp<=0){if(sk.rev||sk.revAll){x.hp=Math.round(x.st.hp*sk.pw/100);x.status=retainedBattleAilments(x);blog(`${x.name} ฟื้นคืนชีพ!`);fxAdd(x,'คืนชีพ','good')}return}
   heal(x,(x.st.hp*sk.pw/100+eff(u,'matk')*.5)*hm);if(sk.cure)x.status=retainedBattleAilments(x);vfx('heal',x.id)}
   if(sk.t==='buff')vfx('buff',x.id,{c:sk.charge?'#6f9cf0':'#d9b35b'});
   addBuffs(x,sk);if(sk.charge){x.charge=sk.charge;fxAdd(x,'×'+sk.charge,'mp')}});
  if(sk.taunt)u.taunt=sk.taunt;
  blog(`${u.name} ใช้ ${sk.n}${sk.tg==='team'?' ให้ทั้งทีม':list[0]!==u?` ให้ ${list[0].name}`:''}`);return true}
 let side=foesOf(u);
 if(u.status.charm&&Math.random()<.45){side=mates;tgt=pick(mates.filter(x=>x.hp>0));blog(`${u.name} ถูกมนต์สะกด หันไปโจมตี ${tgt.name}!`)}
 const alive=side.filter(x=>x.hp>0&&(sk.all||!class10Invisible(x)));if(!alive.length)return true;
 if(!tgt||tgt.hp<=0||!side.includes(tgt))tgt=alive[0];
 blog(`${u.name} ใช้ ${sk.n}${sk.all?'':sk.rt?'':` ใส่ ${tgt.name}`}`);
 if(sk.all&&['p','m','h'].includes(sk.t))vfx('flash',null,{el:sk.el});
 if(sk.all)alive.forEach(t=>u.hp>0&&hitOne(u,sk,t,areaDamageScale(sk,alive.length),alive.length));
 else{for(let i=0;i<(sk.hits||1);i++){const al=side.filter(x=>x.hp>0&&!class10Invisible(x));if(!al.length||u.hp<=0)break;const t=sk.rt?pick(al):tgt.hp>0?tgt:al[0];hitOne(u,sk,t,1)}
  if(hasPas(u,'multihit')&&['p','m','h','auto'].includes(sk.t)&&Math.random()<.3&&tgt.hp>0){blog(`${u.name} โจมตีซ้ำด้วยเศียรอื่น!`);hitOne(u,sk,tgt,.5)}}
 if(sk.self&&u.hp>0)hurt(u,Math.round(u.st.hp*sk.self));
 const dmgSk=['p','m','h','auto'].includes(sk.t);if(dmgSk&&u.charge)u.charge=0;
 if(!free&&dmgSk&&sk.t!=='auto'&&u.hp>0&&hasPas(u,'echo')&&Math.random()<.2&&foesOf(u).some(x=>x.hp>0)){blog(`เสียงสะท้อนเวท! ${u.name} ใช้ ${sk.n} ซ้ำ`);act(u,id,tgt&&tgt.hp>0?tgt:null,atgt,true)}
 return true}
// @soulbeast-end 0262-actBase
// @soulbeast-unit 0263-turnStart


function turnStart(u){if(beginUnitTurn(u))return true;const skip=turnStartBase(u);if(skip)endUnitTurn(u);return skip}
// @soulbeast-end 0263-turnStart
// @soulbeast-unit 0264-act

function act(u,id,tgt,atgt,free){const sk=pvpSkill(id);if(!sk)return false;if(!free&&cooldownOf(u,id)>0){blog(sk.n+' กำลังคูลดาวน์');return false}if(!free&&costOf(u,sk)>u.mp)return false;
 if(!sk.all&&!sk.rt&&['p','m','h','auto','status','debuff'].includes(sk.t)){const forced=foesOf(u).find(x=>x.hp>0&&x.taunt>0&&!class10Invisible(x));if(forced)tgt=forced}
 let ok;const outer=!B().acting;B().acting=(B().acting||0)+1;
 try{if(sk.summon){ok=addTemporary(u,sk);if(ok){u.mp-=costOf(u,sk);blog(u.name+' ใช้ '+sk.n);Sound.fx('charge');vfx('buff',u.id)}}else{ok=actBase(u,id,tgt,atgt,free);if(ok&&sk.immune){u.immune=sk.immune;u.immuneTurns=2}if(ok&&sk.enchant){u.enchant=sk.enchant;u.enchantTurns=4}}}
 finally{B().acting--}
 if(ok&&!free&&sk.cd){u.cooldowns=u.cooldowns||{};u.cooldowns[id]=sk.cd===1?2:sk.cd}if(ok&&outer&&!u.freeFormPending)endUnitTurn(u);return ok}
// @soulbeast-end 0264-act
// @soulbeast-unit 0279-hitOne


function hitOne(u,sk,t,scale,areaCount=0){
 const dmgT=['p','m','h','auto'].includes(sk.t);
 const attackEl=effectiveElement(u,sk);const m=attackMultiplier(u,sk,t);
 if(m===0){blog(`ไม่มีผลต่อ ${t.name}`);fxAdd(t,'×0','muted');ExtraAudio.play('miss');vfx('miss',t.id);return}
 if(!sk.acc||sk.acc<100)if(Math.random()*100>hitChance(u,t,sk)){blog(`${t.name} หลบได้`);fxAdd(t,'พลาด','muted');ExtraAudio.play('miss');vfx('miss',t.id);return}
 const tx=hasPas(u,'toxin')?1.5:1;
 if(!dmgT){if(class10BlockHit(u,sk,t,false))return;vfx('debuff',t.id,{el:sk.el,c:sk.el?null:'#a07ad8'});addBuffs(t,{bf:sk.bf,tn:sk.tn});if(sk.bf)fxAdd(t,'↓','bad');if(sk.st)for(const k in sk.st)applyStatus(t,k,sk.st[k]*tx);return}
 const type=sk.t==='auto'?u.atkType:sk.t;if((type==='p'&&t.immune==='p')||(type==='m'&&t.immune==='m')){blog(t.name+' ป้องกันสมบูรณ์');vfx('buff',t.id);return}if(class10BlockHit(u,sk,t,true))return;if(type==='h'&&t.immune)scale*=.5;let atk,def;
 if(type==='h'){atk=(eff(u,'patk')+eff(u,'matk'))/2;def=(eff(t,'pdef')+eff(t,'mdef'))/2}else{atk=eff(u,type==='p'?'patk':'matk');def=eff(t,type==='p'?'pdef':'mdef')}
 if(sk.trueD)def=0;def*=1-Math.min(.8,(sk.pi||0)+(hasPas(u,'pierce')?.25:0)+frontlinePierce(u,t));
 const stab=sk.el&&(hasPas(u,'omni')||u.stab.includes(sk.el)||u.types.includes(sk.el)||u.form&&FORMS[u.form].t.includes(sk.el))?(hasPas(u,'adapt')?1.5:1.25):1;
 let d=1.4*atk*(sk.pw/100)*atk/(atk+def)*m*stab*scale*(u.charge||1)*(.9+Math.random()*.2);
 d*=pvpDamageFactor(u,t)*classCombatFactor(u,t,sk);
 if(hasPas(t,'thick')&&(attackHasElement(u,sk,'fire')||attackHasElement(u,sk,'ice')))d*=.5;
 if(sideOf(t).some(x=>x.hp>0&&hasPas(x,'guardian')))d*=.9;
 const crit=classRefreshStealthCrit(u)||(!hasPas(t,'nocrit')&&!rogueCritBlocked(u,t)&&Math.random()*100<(isBalancedPvp()?Math.min(65,eff(u,'crit')+(sk.cb||0)):eff(u,'crit')+(sk.cb||0)));if(crit){d*=hasPas(u,'deadly')?(isBalancedPvp()?1.7:2):1.5;if(t.boss)d*=.75;} if(crit)ExtraAudio.skill(VSKID.get(sk),u,true);
 d*=hasPas(t,'counter50')?.5:hasPas(t,'reflect50')?.8:1;d*=classDefenseDamageFactor(u,t);d=Math.max(1,Math.round(d));if(classDefenseAbsorb(u,sk,t,d))return;
 if(hasPas(t,'sturdy')&&t.hp===t.st.hp&&d>=t.hp&&t.hp>1){d=t.hp-1;blog(`${t.name} อึดทนไว้ได้!`)}
 blog(`→ ${t.name} ${d} ดาเมจ${crit?' คริติคอล!':''}${m>1?' ได้ผลดีมาก':m<1?' ไม่ค่อยได้ผล':''}`);
 vfx('hit',t.id,{skill:VSKID.get(sk)||sk._pvpId,el:sk.el,phys:type!=='m',crit});
 if(isWorldBattle()&&t.immortalWorld)B().wbDamageOwner=u.owner;hurt(t,d);if(sk.dot&&t.hp>0){t.dots=t.dots||[];t.dots=t.dots.filter(x=>x.n!==sk.dot.n);t.dots.push({...sk.dot,rate:sk.dot.rate*(sk.all?areaTotalBudget(areaCount)/Math.max(1,areaCount):1)})}
 const ls=(sk.ls||0)+(hasPas(u,'lifesteal')?.15:0);if(ls&&u.hp>0)heal(u,d*ls);
 if(hasPas(u,'manadrain'))u.mp=Math.min(u.st.mp,u.mp+Math.round(d*.08));
 if(sk.steal)steal(u,t);
 if(sk.gold&&u.kind==='player'){const g=u.lv*8;S.P.gold+=g;ExtraAudio.play('coin');blog(`ได้ ${g} เหรียญ`)}
 reflectShieldDamage(u,t,d);if((type==='p'||type==='h')&&u.hp>0){const tf=(hasPas(t,'counter50')||hasPas(t,'reflect50'))?0:hasPas(t,'thorns2')?.4:hasPas(t,'thorns')?.25:0;if(tf){const r=Math.max(1,Math.round(d*tf));blog(`${u.name} โดนสะท้อน ${r}`);if(isWorldBattle()&&u.immortalWorld)B().wbDamageOwner=t.owner;hurt(u,r)}
  if(hasPas(t,'flameBody')&&Math.random()<.25)applyStatus(u,'burn',1);if(hasPas(t,'staticbody')&&Math.random()<.25)applyStatus(u,'para',1);
  const pt=hasPas(u,'poisonTouch2')?.5:hasPas(u,'poisonTouch')?.25:0;if(pt)applyStatus(t,'poison',pt*tx);
  if(t.hp>0&&u.hp>0&&hasPas(t,'counter')&&!t._ctr&&Math.random()<.25){t._ctr=1;blog(`${t.name} สวนกลับ!`);hitOne(t,SK.attack,u,1);t._ctr=0}}
 if(t.hp<=0)return;
 if(t.status.sleep){delete t.status.sleep;blog(`${t.name} สะดุ้งตื่น!`)}
 if(t.status.freeze&&attackHasElement(u,sk,'fire')&&!persistentBattleUnit(t)){delete t.status.freeze;blog(`ไฟละลายน้ำแข็งของ ${t.name}`)}
 if(sk.bf)addBuffs(t,{bf:sk.bf,tn:sk.tn});
 if(sk.st)for(const k in sk.st)applyStatus(t,k,sk.st[k]*(sk.all?areaTotalBudget(areaCount)/Math.max(1,areaCount):scale<1?.7:1)*tx)}
// @soulbeast-end 0279-hitOne
// @soulbeast-unit 0283-battleLater

function battleLater(fn,ms){const battle=S.battle;const run=()=>{if(S.battle!==battle||!battle)return;if(S.ui.trapNotice||S.ui.confirm?.act==='dosurrender'){setTimeout(run,150);return}fn()};setTimeout(run,ms)}
// @soulbeast-end 0283-battleLater
// @soulbeast-unit 0285-after

function after(){const b=B();if(!b)return;if(checkEnd()){render();return}b.menu='wait';battleLater(advance,450);render()}
// @soulbeast-end 0285-after
// @soulbeast-unit 0286-curTarget

function curTarget(){const b=B();let t=b.enemies[b.target];if(!t||t.hp<=0){b.target=b.enemies.findIndex(e=>e.hp>0);t=b.enemies[b.target]}return t}
// @soulbeast-end 0286-curTarget
// @soulbeast-unit 0287-curAlly

const curAlly=()=>B().allies[B().atarget]||B().allies[0];
// @soulbeast-end 0287-curAlly
// @soulbeast-unit 0288-sealable

const sealable=e=>!SP[e?.sp]?.solar&&!e?.bossHelper&&!(SP[e?.sp]?.legendary&&!mistLegendsUnlocked())&&e&&e.hp>0&&B()?.kind!=='pvp'&&B()?.kind!=='raid'&&!(e.sp&&SP[e.sp].noseal)&&(e.kind==='beast'||(e.kind==='npcpet'&&B()&&['bandit','traveler','npc'].includes(B().kind)&&!B().enemies.some(x=>x.kind==='human'&&x.hp>0)));
// @soulbeast-end 0288-sealable
// @soulbeast-unit 0289-sealChance

function sealChance(e,pow){if(!sealable(e))return 0;
 if(pow===Infinity)return 1;const lf=clamp(1+(S.P.lv-e.lv)*.03,.6,1.3);let c=pow*(1-.85*e.hp/e.st.hp)*(.55/e.r)*lf;const s=e.status;
 if(s.sleep||s.freeze||s.para)c*=1.5;else if(Object.keys(s).length)c*=1.15;if(hasPas(B().allies[0],'sealer'))c*=1.5;return clamp(c,.01,.97)}
// @soulbeast-end 0289-sealChance
// @soulbeast-unit 0290-syncBack

function syncBack(){const b=B(),P=S.P,pu=b.allies[0];P.hp=pu.hp;P.mp=pu.mp;b.allies.slice(1).forEach(u=>{const p=petBy(u.uid);if(p){p.hp=u.hp;p.mp=u.mp}})}
// @soulbeast-end 0290-syncBack
// @soulbeast-unit 0292-endBattle

function endBattle(res){const b=B();if(b.over)return;syncBack();const P=S.P,lines=[];const earned=[...b.enemies,...(b.retiredUnits||[]).filter(x=>x.side==='enemy')].filter(e=>e.hp<=0&&!e.temporary).reduce((n,e)=>n+scoreValue(e),0);if(earned){P.score=(P.score||0)+earned;lines.push('คะแนนสะสม +'+earned)}
 if(res==='win'){let exp=0,gold=0;
  [...b.enemies,...(b.retiredUnits||[]).filter(x=>x.side==='enemy')].filter(e=>!e.temporary).forEach(e=>{let x=expFor(e.lv)*(e.boss?3:e.rare?2:1)*(e.kind==='human'?1.5:1);if(e.captured)x*=.5;exp+=x;
   if(e.kind==='human'&&b.kind==='traveler')x*=2;
   if(e.kind==='human'&&b.kind==='bandit'){const g=e.lv*20+R(0,e.lv*10);gold+=g;lines.push(`ยึดถุงเงินโจรได้ ${fmt(g)} เหรียญ`)}
   if(e.kind!=='human'&&!e.captured&&e.sp){gold+=e.lv*4+R(0,e.lv*3);const n=e.boss||e.rare?2:Math.random()<.6?1:0;
    for(let i=0;i<n;i++){const pi=e.boss||e.rare?i:(Math.random()<.7?0:1),key=e.sp+'|'+pi;P.parts[key]=(P.parts[key]||0)+1;lines.push(`ได้ ${SP[e.sp].parts[pi][0]}`)}}});
  exp=Math.round(exp);
  if(b.kind==='npc'){const n=NPC[b.meta],first=!P.arena[b.meta];const g=first?n.gold:Math.round(n.gold*.3);gold+=g;P.arena[b.meta]=(P.arena[b.meta]||0)+1;lines.unshift(`เงินรางวัลประลอง ${fmt(g)} เหรียญ${first?' (ชนะครั้งแรก)':''}`)}
  if(b.kind==='traveler')lines.push(...travelerLoot(b.enemies[0]));
  if(b.kind==='boss'&&b.enemies.some(e=>e.sp==='demonlord')){P.rewardRulesVersion=2;lines.push('รางวัลจอมมารจะยืนยันจากเซิร์ฟเวอร์เมื่อบันทึกออนไลน์');}
  if(b.kind==='boss'&&ZN[b.meta-1].final&&b.enemies.some(e=>e.sp==='demonlord')){if(!P.cleared){gold+=20000;lines.push('🏆 ปราบจอมมารสำเร็จเป็นครั้งแรก! รางวัลพิเศษ 20,000 เหรียญ')}else lines.push('🏆 ปราบจอมมารได้อีกครั้ง!');P.cleared=(P.cleared||0)+1}
  if(b.kind==='boss'){const z=b.meta;if(P.zoneMax<=z&&z<ZN.length){P.zoneMax=z+1;lines.push(`ปลดล็อกพื้นที่ใหม่: ${ZN[z].n}`)}gold+=ZN[z-1].boss.lv*25}
  const lucky=b.allies[0].pas.filter(k=>k==='lucky').length;if(lucky)gold=Math.round(gold*(1+.25*lucky));
  P.gold+=gold;lines.unshift(`ได้ EXP ${fmt(progressionRewardExp(P,exp))} · ${fmt(gold)} เหรียญ`);
  lines.push(...gainExp(P,progressionRewardExp(P,exp),true));b.used.forEach(uid=>{const p=petBy(uid);if(p)lines.push(...gainExp(p,progressionRewardExp(p,exp),false))});
  Sound.fx('win');b.over={res,title:'ชัยชนะ',lines}}
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
// @soulbeast-end 0292-endBattle
// @soulbeast-unit 0293-battleAction


function battleAction(v){const b=B();if(!b)return;const [k,a,c]=v.split(':');
 if(k==='target'){const i=+a;if(b.enemies[i]&&b.enemies[i].hp>0){b.target=i;render()}return}
 if(k==='ally'){b.atarget=+a;render();return}
 if(k==='auto'){S.ui.autoPet=!S.ui.autoPet;const u=uById(b.cur);render();if(S.ui.autoPet&&u&&u.kind==='pet'&&b.menu!=='wait'&&b.menu!=='end'){b.menu='wait';battleLater(aiAct,300)}return}
 if(k==='done'){const res=b.over.res,kind=b.kind;S.battle=null;
  if(res==='lose'){S.zone=null;S.screen='hospital'}
  else if(kind==='npc')S.screen='arena';
  else if(kind==='boss'&&res==='win'){S.zone=null;S.screen=forestReturnScreen();toast(S.screen==='hospital'?'ชนะบอสแล้ว! HP ต่ำกว่า 80% พามาที่โรงพยาบาลในเมือง':'ชนะบอสแล้ว! กลับสู่นครพันผนึกอย่างผู้ชนะ')}
  else{S.screen='zone';if(S.zone){if(S.zone.after){S.zone.ev=S.zone.after;S.zone.after=null;S.zone.fork=null}else newFork()}}
  save();render();return}
 if(b.menu==='wait'||b.menu==='end')return;const u=uById(b.cur);if(!u)return;
 if(k==='menu'){b.menu=a;render();return}
 if(k==='sk'){const sk=SK[a];if(costOf(u,sk)>u.mp){toast('MP ไม่พอ');return}if(sk.gc&&S.P.gold<sk.gc*u.lv){toast('เงินไม่พอ');return}if(!act(u,a,curTarget(),curAlly()))return;after();return}
 if(k==='item'){const it=CON[a];if(!it||it.petExp||!(S.P.items[a]>0))return;const tgt=curAlly();if(!potionUseful(it,tgt,tgt.st)){toast('พลังเต็มแล้ว ใช้ยานี้ไม่จำเป็น');return}
  if(it.rev){if(tgt.hp>0||tgt.kind==='player'){toast('เลือกอสูรที่หมดสติก่อน (แตะการ์ดฝ่ายเรา)');return}Sound.fx('revive');tgt.hp=Math.round(tgt.st.hp*it.rev);tgt.status=retainedBattleAilments(tgt);blog(`${tgt.name} ฟื้นคืนสติ`)}
  else if(tgt.hp<=0){toast('เป้าหมายหมดสติ ใช้ธูปเรียกวิญญาณก่อน');return}
  else if(it.cure){const has=it.cure.filter(x=>tgt.status[x]);if(!has.length){toast(`${tgt.name} ไม่มีสถานะที่ยานี้รักษาได้`);return}has.forEach(x=>delete tgt.status[x]);blog(`ใช้ ${it.n} กับ ${tgt.name} หายจาก${has.map(x=>STS[x].n).join(' ')}`);fxAdd(tgt,'หาย','good')}
  else{if(it.hp)heal(tgt,taleRecoveryAmount(it,'hp'));if(it.mp){tgt.mp=Math.min(tgt.st.mp,tgt.mp+taleRecoveryAmount(it,'mp'));fxAdd(tgt,'+'+it.mp+' MP','mp')}blog(`ใช้ ${it.n} กับ ${tgt.name}`)}
  ExtraAudio.play(it.cure?'heal':'drink');vfx('heal',tgt.id);S.P.items[a]--;after();return}
 if(k==='seal'){const it=CON[a],t=curTarget();if(!(S.P.items[a]>0)||!t)return;if(!sealable(t)){toast('ผนึกเป้าหมายนี้ไม่ได้');return}if(S.P.pets.length>=MAXPETS){toast('ผนึกเต็มแล้ว ปล่อยอสูรบางตัวก่อน');return}
  S.P.items[a]--;ExtraAudio.play('seal');vfx('buff',t.id,{c:'#6dcfc1'});const ch=sealChance(t,it.seal);blog(`คุณขว้าง${it.n}ใส่ ${t.name}...`);
  if(Math.random()<ch){const p=mkPet(t.sp,t.lv,t.evo);const s=calcPet(p);p.hp=Math.max(1,Math.round(s.hp*t.hp/t.st.hp));p.mp=s.mp;S.P.pets.push(p);if(S.P.carried.length<carryLimit())S.P.carried.push(p.uid);else blog(petName(p)+' ถูกส่งไปพักที่ค่าย กระเป๋าเต็มแล้ว');S.P.caught[t.sp]=1;
   if(S.P.carried.includes(p.uid)&&S.P.party.length<clsSum(S.P.cls))S.P.party.push(p.uid);
   ExtraAudio.play('quest');t.captured=true;t.hp=0;fxAdd(t,'ผนึก!','good');blog(`สำเร็จ! ${petName(p)} ถูกผนึกแล้ว`)}
  else{ExtraAudio.play('miss');fxAdd(t,'หลุด','muted');blog(`ผนึกแตก! ${t.name} ดิ้นหลุดออกมา`)}
  after();return}
 if(k==='swap'){if(b.over||u.side!=='ally'||u.hp<=0)return;const p=petBy(+a);if(!p||p.hp<=0||!S.P.carried.includes(p.uid)||b.allies.some(x=>x.uid===p.uid))return;
  const pets=b.allies.filter(x=>x.kind==='pet'&&x.hp>0),dead=b.allies.findIndex(x=>x.hp<=0&&x.kind!=='player'),sel=b.allies[b.atarget];let slot;
  if(dead>=0)slot=dead;
  else if(battleHasRoom(u)&&pets.length<Math.min(3,clsSum(S.P.cls)))slot=b.allies.length;
  else if(sel?.kind==='pet'&&sel.hp>0)slot=b.allies.indexOf(sel);
  else slot=b.allies.findIndex(x=>x.kind==='pet'&&x.hp>0);
  if(slot<0){toast(ct('สนามเต็ม 4 ตำแหน่งแล้ว','All four battlefield positions are occupied','战场四个位置已满'));return;}
  const old=b.allies[slot],n=petUnit(p);if(old){const op=petBy(old.uid);if(op){op.hp=old.hp;op.mp=old.mp;op.ailments=Object.fromEntries(PERSISTENT_AILMENTS.filter(k=>old.status?.[k]).map(k=>[k,Math.max(2,old.status[k])]));}b.queue=b.queue.map(id=>String(id).replace(/\*$/,'')===old.id?id.replace(old.id,n.id):id);}
  b.allies[slot]=n;if(!old||old.hp<=0){b.queue=b.queue.filter(id=>String(id).replace(/\*$/,'')!==n.id);b.queue.push(n.id);}
  if(!b.used.includes(p.uid))b.used.push(p.uid);
  S.P.party=b.allies.filter(x=>x.kind==='pet').map(x=>x.uid);blog(`เรียก ${petName(p)} ออกจากผนึก!`);b.menu='main';render();return;}
 if(k==='flee'){if(!['wild','bandit','traveler'].includes(b.kind)){toast('หนีไม่ได้ในการต่อสู้นี้');return}const es=b.enemies.filter(e=>e.hp>0);const avg=es.reduce((s,e)=>s+eff(e,'spd'),0)/es.length;
  if(Math.random()<clamp(.5+(eff(u,'spd')-avg)*.03,.2,.92)){endBattle('flee');render()}else{blog('หนีไม่สำเร็จ!');after()}return}
}
// @soulbeast-end 0293-battleAction
// @soulbeast-unit 0349-allFull

function allFull(){const P=S.P,s=pStats();return P.hp>=s.hp&&P.mp>=s.mp&&(S.zone?carriedPets():P.pets).every(p=>{const q=calcPet(p);return p.hp>=q.hp&&p.mp>=q.mp})}
// @soulbeast-end 0349-allFull
// @soulbeast-unit 0350-fullHeal

function fullHeal(){const P=S.P,s=pStats();P.hp=s.hp;P.mp=s.mp;(S.zone?carriedPets():P.pets).forEach(p=>{const q=calcPet(p);p.hp=q.hp;p.mp=q.mp})}
// @soulbeast-end 0350-fullHeal
// @soulbeast-unit 0466-endBattle

endBattle=function(res){const b=B(),trigger=b&&!b.over&&res==='win'&&b.kind==='boss';endBattleFull(res);if(trigger)openCinema(b.meta,true,'battle')};
// @soulbeast-end 0466-endBattle
// @soulbeast-unit 0737-bossSummonDue

function bossSummonDue(u){u.legendTurn=(u.legendTurn||0)+1;const alive=B().enemies.some(x=>x.bossHelper&&x.hp>0);if(alive){u.legendDeadAt=null;return false;}if(!u.legendSummoned)return true;if(u.legendDeadAt==null)u.legendDeadAt=u.legendTurn;return u.legendTurn-u.legendDeadAt>=2;}
// @soulbeast-end 0737-bossSummonDue
// @soulbeast-unit 0738-bossSummonLegends

function bossSummonLegends(u,count){const b=B(),pool=Object.keys(SP).filter(k=>SP[k].legendary&&!SP[k].noseal);if(!battleHasRoom(u))return false;const chosen=pool.slice();let placed=0;for(let i=0;i<count&&battleHasRoom(u);i++){const sp=chosen.splice(Math.floor(Math.random()*chosen.length),1)[0],n=wildUnit(sp,40,0);n.id=u.id+'_legend_'+(u.legendBatch=(u.legendBatch||0)+1);n.side=u.side;n.owner=u.owner;n.temporary=true;n.bossHelper=true;n.summonedBy=u.id;n.r=99;n.skills=n.skills.filter(id=>!SK[id]?.summon);if(battlePlaceUnit(u,n))placed++;}u.legendSummoned=true;u.legendDeadAt=null;blog(u.name+' ใช้ '+SK.boss_legend_call.n+' เรียกอสูรตำนาน Lv 40 จำนวน '+placed+' ตัว');b.effects=b.effects||[];b.effects.push({k:'cast',uid:u.id,skill:'boss_legend_call'});if(typeof Sound!=='undefined')Sound.fx('charge');return true;}
// @soulbeast-end 0738-bossSummonLegends
// @soulbeast-unit 0739-balanceBossAct

const balanceBossAct=act;
// @soulbeast-end 0739-balanceBossAct
// @soulbeast-unit 0740-act
act=function(u,id,t,a,free){const b=B(),prior=b?.balanceDamageActor;if(b&&isWorldBattle())b.balanceDamageActor={side:u.side,owner:u.owner};try{if(id==='boss_legend_call')return bossSummonLegends(u,u.immortalWorld?2:1);return balanceBossAct(u,id,t,a,free);}finally{if(b)b.balanceDamageActor=prior;}};
// @soulbeast-end 0740-act
// @soulbeast-unit 0742-balanceHurt


const balanceHurt=hurt;
// @soulbeast-end 0742-balanceHurt
// @soulbeast-unit 0743-hurt
hurt=function(u,d,c='bad'){const beforeHp=u.hp;balanceHurt(u,d,c);if(isWorldBattle()&&u.bossHelper&&B().balanceDamageActor?.side==='ally'){const b=B(),damage=Math.max(0,beforeHp-u.hp);b.damageTotal=(b.damageTotal||0)+damage;const owner=b.balanceDamageActor.owner;if(Number.isInteger(owner)&&owner>=0)b.damageBy[owner]=(b.damageBy[owner]||0)+damage;}if(u.bossHelper&&u.hp<=0&&!B().enemies.some(x=>x.bossHelper&&x.hp>0)){const boss=B().enemies.find(x=>x.id===u.summonedBy);if(boss)boss.legendDeadAt=boss.legendTurn||0;}};
// @soulbeast-end 0743-hurt
// @soulbeast-unit 0744-balanceStealable


// Legendaries are protected even when carried as sealed reserves.
const balanceStealable=banditStealablePets;
// @soulbeast-end 0744-balanceStealable
// @soulbeast-unit 0745-banditStealablePets

banditStealablePets=function(P=S.P,b=B()){return balanceStealable(P,b).filter(p=>!SP[p.sp]?.legendary&&!SP[p.sp]?.solar);};
// @soulbeast-end 0745-banditStealablePets
// @soulbeast-unit 0755-balanceSealable

const balanceSealable=sealable;
// @soulbeast-end 0755-balanceSealable
// @soulbeast-unit 0756-balanceSealChance

// Summoned helpers are battle-only and cannot be captured, including with Eternal Seals.
// sealable is a const; enforce through sealChance and the capture dispatcher instead.
const balanceSealChance=sealChance;
// @soulbeast-end 0756-balanceSealChance
// @soulbeast-unit 0757-sealChance
sealChance=function(e,pow){return e?.bossHelper?0:balanceSealChance(e,pow);};
// @soulbeast-end 0757-sealChance
// @soulbeast-unit 0829-handlers-battleDetails

// Compatibility handler for older local UI state; the arena is the only combat card set.
handlers.battleDetails=function(){S.ui.battleDetails=!S.ui.battleDetails;render();};
// @soulbeast-end 0829-handlers-battleDetails
// @soulbeast-unit 0831-playBattleBase

const playBattleBase=vBattle;
// @soulbeast-end 0831-playBattleBase
// @soulbeast-unit 0832-vBattle
vBattle=function(){let html=playBattleBase();const b=B();if(!b)return html;
 // Only the arena owns combat portraits and effect targets.
 html=html.replace(/data-u=/g,'data-detail-u=');
 if(!b.over){const start=html.lastIndexOf('<div class="panel">');if(start>=0){const hidden=!!S.ui.battleCommandsHidden,controls='<div class="battle-command-controls">'+(teamAutoAllowed()?'<button class="btn sm '+(S.ui.autoTeam?'pri':'')+'" data-a="teamAuto" aria-pressed="'+!!S.ui.autoTeam+'">ออโต้ทีม '+(S.ui.autoTeam?'เปิด':'ปิด')+'</button>':'')+(b.allies.length>1?'<button class="btn sm" data-a="bt" data-v="auto:1" aria-pressed="'+!!S.ui.autoPet+'">อสูรออโต้ '+(S.ui.autoPet?'เปิด':'ปิด')+'</button>':'')+'<button class="btn sm" data-a="battleCommands" aria-expanded="'+!hidden+'" aria-controls="battleCommandBody">'+(hidden?'แสดงคำสั่ง':'ซ่อนคำสั่ง')+'</button></div>';html=html.slice(0,start)+'<section class="battle-command-dock"><div id="battleCommandBody" class="battle-command-body" '+(hidden?'hidden':'')+'>'+html.slice(start,-6)+'</div>'+controls+'</section></div>';}}

 const side=(units,enemy)=>'<section class="battle-side-summary"><small>'+(enemy?'ศัตรู':'ทีมเรา')+'</small><div class="battle-side-units">'+units.map((u,i)=>statusBattleCard('<button class="battle-vital '+(u.hp<=0?'down ':'')+(b.cur===u.id?'acting ':'')+((enemy?b.target:b.atarget)===i?'selected':'')+'" data-a="bt" data-v="'+(enemy?'target:':'ally:')+i+'"><span class="battle-face" data-u="'+esc(u.id)+'">'+portrait(u.img||u.sp,28,{form:u.evo||0})+'</span><div class="battle-meter"><b><span class="battle-unit-name">'+esc(u.name)+'</span><small class="battle-level">Lv '+esc(u.lv)+'</small></b>'+bar(u.hp,u.st.hp)+'<small>HP '+u.hp+'/'+u.st.hp+'</small>'+bar(u.mp,u.st.mp,'mp')+'<small>MP '+u.mp+'/'+u.st.mp+'</small></div>'+(b.fx||[]).filter(f=>f.id===u.id).map(f=>'<span class="fx '+esc(f.c)+'">'+esc(f.t)+'</span>').join('')+'</button>',u)).join('')+'</div></section>';
 const overview='<div class="battle-vitals battle-scenery"'+BattleScenery.attributes(b)+'>'+BattleScenery.decoration(b)+side(b.enemies,true)+side(b.allies,false)+'</div>';
 return html.replace('<div class="field battle-enhanced">','<div class="field battle-enhanced">'+overview);
};
// @soulbeast-end 0832-vBattle
// @soulbeast-unit 0834-playScreen-playBattle
let playScreen=null,playBattle=null;
// @soulbeast-end 0834-playScreen-playBattle
// @soulbeast-unit 0869-compactBattleReady

function compactBattleReady(mode=S.screen){const r=compactRoom(mode);return !!r?.battle&&(mode==='guildwar'||['active','finished'].includes(r.status));}
// @soulbeast-end 0869-compactBattleReady
// @soulbeast-unit 0933-endBattle

endBattle=function(res){const b=S.battle,wasOver=b?.over;let out;if(b?.towerRun&&!wasOver){syncBack();const lines=[];if(res==='win'){const n=NPC[b.meta],first=!S.P.arena[b.meta],base=first?n.gold:Math.round(n.gold*.3),lucky=b.allies[0].pas.filter(k=>k==='lucky').length,gold=Math.round(base*(1+.25*lucky));S.P.gold+=gold;S.P.arena[b.meta]=(S.P.arena[b.meta]||0)+1;lines.push('เงินรางวัล '+fmt(gold)+' เหรียญ'+(first?' (ผ่านครั้งแรก)':''),'หอคอยไม่แจก EXP หรือไอเท็ม');b.over={res,title:'ชัยชนะ',lines};Sound.fx('win');}else{b.over={res,title:'จบการท้าทาย',lines:['พ่ายแพ้ที่ชั้น '+b.towerFloor,'ไม่เสีย EXP และเงิน · ฟื้น HP/MP และรักษาสถานะทั้งหมดฟรีเมื่อจบการท้าทาย']};Sound.fx('lose');}b.menu='end';}else out=towerEndBattle(res);if(b?.towerRun&&!wasOver&&b.over){towerCheckpoint();save();setTimeout(()=>towerRecordResult(b),0);}return out;};
// @soulbeast-end 0933-endBattle
// @soulbeast-unit 0968-forestSyncBack

const forestSyncBack=syncBack;
// @soulbeast-end 0968-forestSyncBack
// @soulbeast-unit 0969-syncBack
syncBack=function(){const b=S.battle;forestSyncBack();if(!b)return;for(const u of b.allies){const o=u.kind==='player'?S.P:u.kind==='pet'?petBy(u.uid):null;if(o)o.ailments=Object.fromEntries(PERSISTENT_AILMENTS.filter(k=>u.status[k]).map(k=>[k,Math.max(2,u.status[k]) ]));}};
// @soulbeast-end 0969-syncBack
// @soulbeast-unit 0996-battleEffectIcons


function battleEffectIcons(html,u){if(html.includes('battle-effect-strip'))return html;const symbols={burn:'🔥',poison:'☠',freeze:'❄',chill:'🕸',love:'♥',sleep:'Zz',confuse:'✫',static:'ϟ',charm:'◎',para:'⛓'},stats={patk:['⚔','พลังโจมตีกายภาพ'],matk:['⚚','พลังโจมตีเวท'],crit:['✦','คริติคอล'],acc:['⊕','แม่นยำ'],eva:['➶','หลบหลีก'],spd:['➟','ความเร็ว'],pdef:['⬟','เกราะกายภาพ'],mdef:['◈','เกราะเวท']};const icons=[];for(const [k,n] of Object.entries(u.status||{}))if(n&&STS[k])icons.push('<span class="battle-effect-icon" title="'+esc(STS[k].n+' · '+STS[k].info)+'" aria-label="'+esc(STS[k].n)+'">'+battleEffectImage(k,STS[k].n)+'</span>');const sums={};for(const b of u.buffs||[])if(b.tn>0&&b.st)sums[b.st]=(sums[b.st]||0)+b.amt;for(const [k,n] of Object.entries(sums))if(n){const q=stats[k]||['✧',k],label=(n>0?'เพิ่ม':'ลด')+q[1]+' '+Math.round(Math.abs(n)*100)+'%';icons.push('<span class="battle-effect-icon '+(n>0?'good':'bad')+'" title="'+esc(label)+'" aria-label="'+esc(label)+'">'+(stats[k]?battleEffectImage(k+(n>0?'-up':'-down'),label):q[0])+'</span>');}icons.push(...battleSpecialEffects(u));if(!icons.length)return html;html=html.replace(/<span class="online-unit-status">[^<]*<\/span>/g,'');return html.replace(/<\/button>$/, '<span class="battle-effect-strip" aria-label="บัฟและดีบัฟ">'+icons.join('')+'</span></button>');}
// @soulbeast-end 0996-battleEffectIcons
// @soulbeast-unit 0997-battleEffectImage


function battleEffectImage(key,label){return '<img class="battle-effect-image" src="assets/ui/status/'+key+'.webp" alt="'+esc(label)+'" width="20" height="20" decoding="async">';}
// @soulbeast-end 0997-battleEffectImage
// @soulbeast-unit 0998-BATTLE_SPECIAL_ICONS


// One generated atlas, indexed left-to-right in six columns and four rows.
const BATTLE_SPECIAL_ICONS={taunt:[0,'neutral'],charging:[1,'good'],empowered:[2,'good'],physicalImmune:[3,'good'],magicImmune:[4,'good'],enchant:[5,'good'],firestorm:[6,'bad'],whirlpool:[7,'bad'],constrict:[8,'bad'],thorns2:[9,'good'],omni:[10,'good'],poisonTouch2:[11,'good'],mpsave:[12,'good'],regen:[13,'good'],guardian:[14,'good'],wolf:[15,'neutral'],bear:[16,'neutral'],hawk:[17,'good'],treant:[18,'neutral'],saber:[19,'good'],gdragon:[20,'good'],moon:[21,'good'],defending:[22,'good'],summonLife:[23,'neutral']};
// @soulbeast-end 0998-BATTLE_SPECIAL_ICONS
// @soulbeast-unit 0999-battleSpecialEffects

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
// @soulbeast-end 0999-battleSpecialEffects
// @soulbeast-unit 1027-areaTotalBudget

function areaTotalBudget(count){return Math.min(1.5,.5+.25*Math.max(1,count));}
// @soulbeast-end 1027-areaTotalBudget
// @soulbeast-unit 1028-areaDamageScale

function areaDamageScale(sk,count){return areaTotalBudget(count)/Math.max(1,count)*(sk.ct?2:1);}
// @soulbeast-end 1028-areaDamageScale
// @soulbeast-unit 1048-elementsPlayerUnit

const elementsPlayerUnit=playerUnit;
// @soulbeast-end 1048-elementsPlayerUnit
// @soulbeast-unit 1049-playerUnit
playerUnit=function(){const u=elementsPlayerUnit();u.defenseTypes=equipmentElements(S.P.eq);u.types=u.defenseTypes.slice();return u;};
// @soulbeast-end 1049-playerUnit
// @soulbeast-unit 1050-elementsHumanUnit

const elementsHumanUnit=humanUnit;
// @soulbeast-end 1050-elementsHumanUnit
// @soulbeast-unit 1051-humanUnit
humanUnit=function(name,cls,lv,i){const u=elementsHumanUnit(name,cls,lv,i);u.defenseTypes=equipmentElements(npcEq(cls,lv));u.types=u.defenseTypes.slice();return u;};
// @soulbeast-end 1051-humanUnit
// @soulbeast-unit 1052-minimumHitChance


function minimumHitChance(u,t){return u.cls&&t.cls&&['gladiator','druid'].includes(baseOf(u.cls))&&baseOf(t.cls)==='thief'?80:u.boss?40:25;}
// @soulbeast-end 1052-minimumHitChance
// @soulbeast-unit 1054-rogueCritBlocked

function rogueCritBlocked(u,t){return !!(u.cls&&t.cls&&baseOf(u.cls)==='thief'&&baseOf(t.cls)==='druid');}
// @soulbeast-end 1054-rogueCritBlocked
// @soulbeast-unit 1055-frontlinePierce


function frontlinePierce(u,t){return u.cls&&t.cls&&baseOf(u.cls)==='archer'&&baseOf(t.cls)==='gladiator'?.3:0;}
// @soulbeast-end 1055-frontlinePierce
