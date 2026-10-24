// Bag, equipment, recovery and carried beasts
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0138-petName

const petName=p=>formName(p.sp,p.form||0);
// @soulbeast-end 0138-petName
// @soulbeast-unit 0149-petBy

const petBy=uid=>S.P.pets.find(p=>p.uid===uid);
// @soulbeast-end 0149-petBy
// @soulbeast-unit 0150-party

const party=()=>S.P.party.map(petBy).filter(Boolean);
// @soulbeast-end 0150-party
// @soulbeast-unit 0151-fixParty

function fixParty(){normalizePack()}
// @soulbeast-end 0151-fixParty
// @soulbeast-unit 0215-itemExtra

function itemExtra(it){return `${it.pas?' · '+PAS[it.pas].n:''}${it.ws?' · สกิล '+SK[it.ws].n:''}${it.sk?' · สกิล '+SK[it.sk].n:''}`}
// @soulbeast-end 0215-itemExtra
// @soulbeast-unit 0306-gearDrop

function gearDrop(tier,special){if(special){const zl=ZN[S.zone.id-1].lv[1]+6;const ks=Object.keys(SG).filter(k=>SG[k].lv<=zl);return pick(ks)}return pick(Object.keys(SLOTBASE))+'_'+clamp(tier,0,5)}
// @soulbeast-end 0306-gearDrop
// @soulbeast-unit 0308-legendDrop

function legendDrop(z){const P=S.P;if(ZN[z-1].train)return null;P.legend=P.legend||{};const left=SLOTS.map(x=>x[0]).filter(sl=>!P.legend[z+'_'+sl]);if(!left.length)return null;
 const sl=pick(left);P.legend[z+'_'+sl]=1;return sl==='weapon'?`lg${z}_weapon_${clsWeapon(P.cls)}`:`lg${z}_${sl}`}
// @soulbeast-end 0308-legendDrop
// @soulbeast-unit 0366-activityBackdrop

function activityBackdrop(key,label){return `<div class="activity-backdrop"><img src="${TOWN_ART[key]}" alt="${label}" decoding="async"><span>${label}</span></div>`;}
// @soulbeast-end 0366-activityBackdrop
// @soulbeast-unit 0392-vTeam

function vTeam(){const P=S.P,tab=S.ui.team||'team';if(S.ui.petView!=null){const p=petBy(S.ui.petView);if(p)return vPet(p)}
 const tabs=`<div class="tabs"><button class="${tab==='team'?'on':''}" data-a="teamtab" data-v="team">จัดทีมและค่าย ${P.pets.length}</button></div>`;
 if(tab==='chart')return `<div class="stack"><h2>ตารางธาตุ</h2>${tabs}${vChart()}</div>`;
  if(tab==='dex')return fullBestiary(tabs);
 return vRoster(tabs)}
// @soulbeast-end 0392-vTeam
// @soulbeast-unit 0393-bagVitals

function bagVitals(){const P=S.P,s=pStats();const row=(name,hp,mp,st)=>`<div class="card stack"><b>${esc(name)}</b><small>HP ${hp}/${st.hp}</small>${bar(hp,st.hp)}<small>MP ${mp}/${st.mp}</small>${bar(mp,st.mp,'mp')}</div>`;return `<div class="bag-vitals">`+row(P.name,P.hp,P.mp,s)+carriedPets().map(p=>row(petName(p),p.hp,p.mp,calcPet(p))).join('')+'</div>'}
// @soulbeast-end 0393-bagVitals
// @soulbeast-unit 0394-compareGear

function compareGear(it){const old=EQ[S.P.eq[it.slot]],bonus=x=>Object.fromEntries(Object.entries(x?.st||{}).map(([k,v])=>[k,Math.round(v*(x.slot==='weapon'&&x.wt!==clsWeapon(S.P.cls)?.8:1))])),ns=bonus(it),os=bonus(old);const keys=[...new Set([...Object.keys(it.st||{}),...Object.keys(old?.st||{})])];return keys.map(k=>{const delta=(ns[k]||0)-(os[k]||0);return `<span style="color:${delta>0?'var(--good)':delta<0?'var(--bad)':'#eee'}">${SH[k]} ${ns[k]||0} (${delta>0?'+':''}${delta})</span>`}).join(' · ')}
// @soulbeast-end 0394-compareGear
// @soulbeast-unit 0395-vBag

function vBag(){const P=S.P,its=Object.keys(CON).filter(k=>P.items[k]>0),parts=Object.entries(P.parts).filter(([,n])=>n>0),pp=party();
 return `<div class="stack"><h2>กระเป๋าเดินทาง</h2>${rosterSummary()}${bagVitals()}<div class="card stack" data-panel-art="supplies"><h3>ยา ยาแก้สถานะ และผนึก</h3>${its.length?`<div class="lst">${its.map(k=>{const c=CON[k];return `<div class="bag-consumable">${itemIcon(k)}<div class="grow bag-item-copy"><b>${c.n} ×${P.items[k]}</b><div class="sub" style="font-size:12px">${c.d}</div></div>${(c.hp||c.mp)?'<span class="sub">ใช้จากกรอบตัวละครด้านบน</span>':c.seal?'<span class="sub">ใช้ในการต่อสู้</span>':`<div class="row wrap bag-item-targets" style="gap:4px">${c.rev||c.petExp?'':`<button class="btn sm" data-a="use" data-v="${k}:P" ${bagPotionDisabled(k,'P')?'disabled aria-disabled="true"':''}>ตัวเอง</button>`}${(c.rev?carriedPets().filter(p=>p.hp<=0):carriedPets()).map(p=>`<button class="btn sm" data-a="use" data-v="${k}:${p.uid}" ${bagPotionDisabled(k,p.uid)?'disabled aria-disabled="true"':''}>${petName(p).slice(0,8)}</button>`).join('')}</div>`}</div>`}).join('')}</div>`:'<p class="sub">ว่างเปล่า</p>'}</div>
 <div class="card stack" data-panel-art="inventory"><h3>ชิ้นส่วนอสูร</h3>${parts.length?`<div class="lst">${parts.map(([key,n])=>{const [sp,i]=key.split('|');return `<div class="row">${itemIcon(key,32)}<span class="grow">${SP[sp].parts[+i][0]}</span><span class="num">×${n}</span></div>`}).join('')}</div>${S.zone?'':'<button class="btn sm" data-a="go" data-v="shop">ไปขายที่ตลาด</button>'}`:'<p class="sub" style="margin:0">ล้มอสูรในป่าเพื่อเก็บชิ้นส่วนไปขาย</p>'}</div></div>`}
// @soulbeast-end 0395-vBag
// @soulbeast-unit 0404-carryLimit


/* Carrying is a subset of owned pets; camp storage never deletes a pet. */
const carryLimit=(P=S.P)=>baseOf(P.cls)==='summoner'?8:5;
// @soulbeast-end 0404-carryLimit
// @soulbeast-unit 0405-normalizePack

function normalizePack(P=S.P){if(!P)return;const pets=Array.isArray(P.pets)?P.pets:[],valid=new Set(pets.map(p=>p.uid)),cap=carryLimit(P);const legacy=!Array.isArray(P.carried);const active=(Array.isArray(P.party)?P.party:[]).filter(id=>valid.has(id));const inBattle=S?.P===P?(S.battle?.allies||[]).filter(u=>u.kind==='pet').map(u=>u.uid):[];const list=legacy?[...inBattle,...active,...pets.map(p=>p.uid)]:[...active.filter(id=>P.carried.includes(id)),...P.carried];P.carried=[...new Set(list.filter(id=>valid.has(id)))].slice(0,cap);P.party=[...new Set(active.filter(id=>P.carried.includes(id)))].slice(0,clsSum(P.cls));P.packVersion=1;}
// @soulbeast-end 0405-normalizePack
// @soulbeast-unit 0406-carriedPets

function carriedPets(){normalizePack();return S.P.carried.map(petBy).filter(Boolean)}
// @soulbeast-end 0406-carriedPets
// @soulbeast-unit 0407-storedPets

function storedPets(){normalizePack();return S.P.pets.filter(p=>!S.P.carried.includes(p.uid))}
// @soulbeast-end 0407-storedPets
// @soulbeast-unit 0411-rosterSummary

function rosterSummary(){normalizePack();const P=S.P,cap=carryLimit(),slots=Array.from({length:cap},(_,i)=>{const p=petBy(P.carried[i]),active=p&&P.party.includes(p.uid);return `<div class="pack-slot ${p?active?'active':'':'empty'}" ${p?`title="${esc(petName(p))}"`:''}>${p?portrait(p.sp,38,{form:p.form||0}):'✧'}${active?'<em>◆</em>':''}</div>`}).join('');return `<section class="card roster-banner" data-panel-art="retinue"><div><div class="eyebrow">THE SUMMONER'S RETINUE</div><div class="roster-title">ขบวนอสูรคู่พันธสัญญา</div><p class="roster-help" style="margin:6px 0 0">${S.zone?'อยู่ในป่า · เรียกสลับได้เฉพาะอสูรที่พกมา':'จัดทีมและฝากอสูรพักที่ค่ายก่อนออกเดินทาง'}</p><div class="roster-count"><span>พก ${P.carried.length}/${cap}</span><span>ออกสู้ ${P.party.length}/${clsSum(P.cls)}</span><span>ค่าย ${storedPets().length}</span></div></div><div class="pack-slots ${cap===8?'eight':''}">${slots}</div></section>`}
// @soulbeast-end 0411-rosterSummary
// @soulbeast-unit 0412-vRoster

function vRoster(tabs){const P=S.P;normalizePack();const filter=S.ui.packFilter||'carried';const categories=[['carried','ติดตัว '+P.carried.length],['active','ออกสู้ '+P.party.length],['reserve','สำรอง '+(P.carried.length-P.party.length)],['camp','พักที่ค่าย '+storedPets().length],['pending','รออัปแต้ม '+P.pets.filter(p=>p.free>0).length]];const list=filter==='pending'?P.pets.filter(p=>p.free>0):filter==='camp'?storedPets():filter==='active'?carriedPets().filter(p=>P.party.includes(p.uid)):filter==='reserve'?carriedPets().filter(p=>!P.party.includes(p.uid)):carriedPets();return `<div class="stack"><div class="row"><h2 class="grow">สำนักพันธสัญญา</h2><span class="sub">ทั้งหมด ${P.pets.length}/${MAXPETS}</span></div>${tabs}${rosterSummary()}${advicePanel()}<div class="tabs">${categories.map(([id,n])=>`<button data-a="packFilter" data-v="${id}" class="${filter===id?'on':''}">${n}</button>`).join('')}</div><p class="roster-help" style="margin:0">${filter==='camp'?'อสูรพักค่ายไม่ใช้พื้นที่กระเป๋า และเรียกจากป่าไม่ได้':'จำนวนพกรวมทีมออกสู้และตัวสำรอง ◆ คือทีมออกสู้ สามารถเปลี่ยนทีมจากอสูรที่พกได้'}${carryLimit()===8?' · สายนักอัญเชิญพกได้ 8 ตัว':''}</p><div class="pet-management">${list.map(p=>{const st=calcPet(p),carried=P.carried.includes(p.uid),active=P.party.includes(p.uid),location=active?'active':carried?'reserve':'camp';return `<article class="card pet-tile unit-frame" ${UnitFrames.attributes(p)} data-location="${location}">${UnitFrames.decoration()}<button class="pet-open" data-a="petview" data-v="${p.uid}">${portrait(p.sp,58,{form:p.form||0})}<span class="grow"><b>${esc(petName(p))}</b><small class="sub">Lv ${p.lv} · ${tChips(SP[p.sp].t)}</small></span></button><div class="row wrap"><span class="pet-location">${active?'◆ ทีมออกสู้':carried?'✧ พกสำรอง':'⌂ พักที่ค่าย'}</span>${p.free?`<span class="chip">แต้ม +${p.free}</span>`:''}</div>${carried?`<small class="num">HP ${p.hp}/${st.hp} · MP ${p.mp}/${st.mp}</small>${bar(p.hp,st.hp)}${bar(p.mp,st.mp,'mp')}`:''}<div class="pet-actions">${p.free>0?`<button class="btn sm" data-a="autoStats" data-v="${p.uid}" ${statsLocked()?'disabled':''}>อัปอัตโนมัติ +${p.free}</button>`:''}${carried?`<button class="btn sm ${active?'':'pri'}" data-a="partytoggle" data-v="${p.uid}" ${S.battle?'disabled':''}>${active?'เป็นสำรอง':'ออกสู้'}</button><button class="btn sm" data-a="petStore" data-v="${p.uid}" ${packLocked()?'disabled':''}>พักที่ค่าย</button>`:`<button class="btn sm pri" data-a="petCarry" data-v="${p.uid}" ${packLocked()||P.carried.length>=carryLimit()?'disabled':''}>นำติดตัว</button>`}</div></article>`}).join('')||'<p class="empty-roster">ยังไม่มีอสูรในกลุ่มนี้</p>'}</div></div>`}
// @soulbeast-end 0412-vRoster
// @soulbeast-unit 0430-bagPotionDisabled

function bagPotionDisabled(id,who){if(CON[id]?.petExp){const p=who==='P'?null:petBy(Number(who));return !p||p.lv>=Math.min(MAXLV,S.P.lv)||p.hp<=0||statsLocked()}const o=who==='P'?S.P:petBy(Number(who));return !potionUseful(CON[id],o,who==='P'?pStats():o&&calcPet(o))}
// @soulbeast-end 0430-bagPotionDisabled
// @soulbeast-unit 0434-safeBagUse

const safeBagUse=handlers.use;
// @soulbeast-end 0434-safeBagUse
// @soulbeast-unit 0493-expBagUse

const expBagUse=handlers.use;
// @soulbeast-end 0493-expBagUse
// @soulbeast-unit 0557-weaponBaseItemExtra

const weaponBaseItemExtra=itemExtra;
// @soulbeast-end 0557-weaponBaseItemExtra
// @soulbeast-unit 0558-itemExtra

itemExtra=function(it){const extra=weaponBaseItemExtra(it);return it?.slot==='weapon'&&(it.craft||it.legend)?` · <span class="weapon-rarity-label weapon-label-${it.craft?'crafted':it.worldLegend?'eclipse':'legendary'}" translate="no">${weaponRarityLabel(it)}</span>`+extra:extra;};
// @soulbeast-end 0558-itemExtra
// @soulbeast-unit 0560-weaponBaseBag

const weaponBaseBag=vBag;
// @soulbeast-end 0560-weaponBaseBag
// @soulbeast-unit 0561-vBag

vBag=function(){
 const ids=[...new Set(S.P.owned)].filter(id=>WEAPON_ART[id]);
 if(!ids.length)return weaponBaseBag();
 const card=`<div class="card stack"><div class="row"><h3 class="grow" translate="no">${weaponText('อาวุธหายากในกระเป๋า','Rare Weapons in Your Bag','背包中的稀有武器')}</h3><button class="btn sm" data-a="weaponEquipment" translate="no">${weaponText('หน้าสวมใส่','Equipment','装备')}</button></div><div class="lst">${ids.map(id=>{const it=EQ[id],a=WEAPON_ART[id],count=S.P.owned.filter(k=>k===id).length;return `<div class="row">${itemIcon(id,52)}<div class="grow"><b>${esc(it.n)}${count>1?' ×'+count:''}</b><div class="sub"><span class="weapon-rarity-label weapon-label-${a.rarity}" translate="no">${weaponRarityLabel(it)}</span> · Lv ${it.lv}</div></div></div>`}).join('')}</div></div>`;
 return weaponBaseBag().replace('</h2>','</h2>'+card);
};
// @soulbeast-end 0561-vBag
// @soulbeast-unit 0562-handlers-weaponEquipment

handlers.weaponEquipment=()=>{S.ui.hero='gear';go('hero');};
// @soulbeast-end 0562-handlers-weaponEquipment
// @soulbeast-unit 0563-weaponBaseBagVitals

// Keep the player's own name intact in the bag's vitals panel as well.
const weaponBaseBagVitals=bagVitals;
// @soulbeast-end 0563-weaponBaseBagVitals
// @soulbeast-unit 0564-bagVitals

bagVitals=function(){return weaponBaseBagVitals().replace('<b>'+esc(S.P.name)+'</b>','<b data-user-content>'+esc(S.P.name)+'</b>');};
// @soulbeast-end 0564-bagVitals
// @soulbeast-unit 0810-bagHealSkills


// Gameplay conveniences; progression remains in the existing save format.
function bagHealSkills(){return playerUnit().skills.filter(id=>SK[id]?.t==='heal'&&SK[id].pw>0&&!SK[id].gc);}
// @soulbeast-end 0810-bagHealSkills
// @soulbeast-unit 0811-bagHealTargets

function bagHealTargets(){return [{key:'P',o:S.P,st:pStats(),name:S.P.name},...carriedPets().map(o=>({key:String(o.uid),o,st:calcPet(o),name:petName(o)}))];}
// @soulbeast-end 0811-bagHealTargets
// @soulbeast-unit 0812-handlers-bagSkillHeal

handlers.bagSkillHeal=function(value){
 if(statsLocked())return toast('ใช้สกิลนี้ในกระเป๋าได้หลังจบการต่อสู้');
 const [id,key]=value.split(':'),u=playerUnit(),sk=SK[id];if(!bagHealSkills().includes(id)||S.P.hp<=0)return;
 const cost=costOf(u,sk);if(S.P.mp<cost)return toast('MP ไม่พอ');
 const all=bagHealTargets(),list=sk.tg==='self'?[all[0]]:sk.tg==='team'?all:all.filter(x=>x.key===key);
 const wounded=list.filter(x=>x.o.hp>0&&x.o.hp<x.st.hp);if(!wounded.length)return toast('ไม่มีเป้าหมายที่ต้องฟื้น HP');
 S.P.mp-=cost;wounded.forEach(x=>{const amount=Math.round((x.st.hp*sk.pw/100+eff(u,'matk')*.5)*(hasPas(u,'healer')?1.3:1));x.o.hp=Math.min(x.st.hp,x.o.hp+amount);});
 ExtraAudio.play('heal');save();render();toast('ใช้ '+sk.n+' · MP −'+cost);
};
// @soulbeast-end 0812-handlers-bagSkillHeal
// @soulbeast-unit 0813-playBagBase

const playBagBase=vBag;
// @soulbeast-end 0813-playBagBase
// @soulbeast-unit 0814-vBag
vBag=function(){let html=playBagBase();const ids=bagHealSkills();if(!ids.length)return html;
 const targets=bagHealTargets();const section='<section class="card stack"><h3>✚ ฮีลด้วยสกิล · ใช้ MP</h3>'+ids.map(id=>{const sk=SK[id],u=playerUnit(),cost=costOf(u,sk),list=sk.tg==='self'?[targets[0]]:sk.tg==='team'?[{key:'P',name:'ทั้งทีม',o:{hp:1},st:{hp:2}}]:targets;return '<div><b>'+esc(sk.n)+'</b> · '+cost+' MP<div class="row wrap">'+list.map(t=>'<button class="btn sm" data-a="bagSkillHeal" data-v="'+id+':'+t.key+'" '+(S.P.mp<cost||S.P.hp<=0||t.o.hp<=0||t.o.hp>=t.st.hp?'disabled':'')+'>ฮีล '+esc(t.name)+'</button>').join('')+'</div></div>';}).join('')+'</section>';
 return html.replace('</h2>','</h2>'+section);
};
// @soulbeast-end 0814-vBag
// @soulbeast-unit 0816-playRosterBase

const playRosterBase=vRoster;
// @soulbeast-end 0816-playRosterBase
// @soulbeast-unit 0817-vRoster
vRoster=function(tabs){let html=playRosterBase(tabs);if(S.ui.packFilter==='pending'){const n=S.P.pets.filter(p=>p.free>0).length;html=html.replace('<div class="pet-management">','<button class="btn pri full" data-a="autoAllPets" '+(!n?'disabled':'')+'>อัปแต้มอสูรทั้งหมดอัตโนมัติ · '+n+' ตัว</button><div class="pet-management">');}return html;};
// @soulbeast-end 0817-vRoster
// @soulbeast-unit 1001-bagRecoveryActions

function bagRecoveryActions(o,who,st){if(o.hp<=0||o.hp>=st.hp&&o.mp>=st.mp)return '';const items=Object.entries(CON).filter(([,it])=>!it.rev&&(it.hp&&o.hp<st.hp||it.mp&&o.mp<st.mp));return '<section class="bag-recovery" aria-label="ยาฟื้น HP และ MP"><b>ใช้ยากับตัวนี้</b><div class="row wrap bag-cure-actions">'+items.map(([id,it])=>'<button class="btn sm" data-a="use" data-v="'+id+':'+who+'" '+(!(S.P.items[id]>0)||statsLocked()||towerActive()?'disabled':'')+'><span class="bag-dose-icon" aria-hidden="true">'+itemIcon(id,24)+'</span><span>'+esc(it.n)+' · '+[it.hp?'HP +'+it.hp:'',it.mp?'MP +'+it.mp:''].filter(Boolean).join(' / ')+' · มี '+fmt(S.P.items[id]||0)+'</span></button>').join('')+'</div></section>';}
// @soulbeast-end 1001-bagRecoveryActions
// @soulbeast-unit 1002-bagVitals

bagVitals=function(){return '<div class="bag-vitals">'+bagHealTargets().map(t=>'<div class="card stack"><b '+(t.key==='P'?'data-user-content':'')+'>'+esc(t.name)+'</b><small>HP '+t.o.hp+'/'+t.st.hp+'</small>'+bar(t.o.hp,t.st.hp)+'<small>MP '+t.o.mp+'/'+t.st.mp+'</small>'+bar(t.o.mp,t.st.mp,'mp')+bagRecoveryActions(t.o,t.key,t.st)+bagAilmentInfo(t.o,t.key)+'</div>').join('')+'</div>';};
// @soulbeast-end 1002-bagVitals
// @soulbeast-unit 1026-equipmentElements

function equipmentElements(eq){const types=[...new Set(['armor','crown'].flatMap(slot=>EQ[eq?.[slot]]?.defTypes||[]))];return types.length?types:['normal'];}
// @soulbeast-end 1026-equipmentElements
// @soulbeast-unit 1061-elementItemExtra


const elementItemExtra=itemExtra;
// @soulbeast-end 1061-elementItemExtra
// @soulbeast-unit 1062-itemExtra
itemExtra=function(it){return elementItemExtra(it)+(it.defTypes?' · ธาตุตั้งรับ '+it.defTypes.map(k=>EL[k].n).join(' / '):'');};
// @soulbeast-end 1062-itemExtra
// @soulbeast-unit 1065-bagVitals

bagVitals=function(){return '<div class="bag-vitals">'+bagHealTargets().map(t=>{const hero=t.key==='P',types=hero?equipmentElements(S.P.eq):SP[t.o.sp].t;return '<div class="card stack unit-frame" '+UnitFrames.attributes(hero?{kind:'player',cls:S.P.cls}:t.o)+'>'+UnitFrames.decoration()+'<div class="row">'+portrait(hero?'player':t.o.sp,64,hero?{}:{form:t.o.form||0})+'<div class="grow" style="min-width:0"><b '+(hero?'data-user-content':'')+' style="overflow-wrap:anywhere">'+esc(t.name)+'</b><small>Lv '+t.o.lv+'</small><div class="row wrap" aria-label="ธาตุตั้งรับ"><small>ธาตุตั้งรับ</small>'+tChips(types)+'</div></div></div><small>HP '+t.o.hp+'/'+t.st.hp+'</small>'+bar(t.o.hp,t.st.hp)+'<small>MP '+t.o.mp+'/'+t.st.mp+'</small>'+bar(t.o.mp,t.st.mp,'mp')+bagRecoveryActions(t.o,t.key,t.st)+bagAilmentInfo(t.o,t.key)+'</div>';}).join('')+'</div>';};
// @soulbeast-end 1065-bagVitals
// @soulbeast-unit 1066-elementCompareGear

const elementCompareGear=compareGear;
// @soulbeast-end 1066-elementCompareGear
// @soulbeast-unit 1067-compareGear
compareGear=function(it){return elementCompareGear(it)+(it.defTypes?' · ธาตุตั้งรับ '+it.defTypes.map(k=>EL[k].n).join(' / '):'');};
// @soulbeast-end 1067-compareGear
