// Shops, crafting and gacha
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0074-CRAFT-CSL


/* crafting: one recipe per beast, built from its materials */
const CRAFT={},CSL=['weapon','armor','gloves','boots','belt','bracelet','ring','necklace','crown'];
// @soulbeast-end 0074-CRAFT-CSL
// @soulbeast-unit 0129-priceOf

const priceOf=it=>Math.round(it.price*(isMerchant()?.85:1)*(typeof WorldTales!=='undefined'&&S.zone?1+WorldTales.modifier('price'):1));
// @soulbeast-end 0129-priceOf
// @soulbeast-unit 0130-partPrice

const partPrice=v=>Math.round(v*(isMerchant()?1.2:1));
// @soulbeast-end 0130-partPrice
// @soulbeast-unit 0369-vShop

function vShop(){return activityBackdrop('shop','ตลาดช่างตีเหล็ก · เตรียมอุปกรณ์ก่อนออกผจญภัย')+vShopBase();}
// @soulbeast-end 0369-vShop
// @soulbeast-unit 0372-vForge

function vForge(){return activityBackdrop('shop','โรงหลอมเทพอสูร · หลอมพลังจากการผจญภัย')+vForgeBase();}
// @soulbeast-end 0372-vForge
// @soulbeast-unit 0377-vShopBase

function vShopBase(){const P=S.P,tab=S.ui.shop||'wp',tier=S.ui.tier??0,mw=clsWeapon(P.cls);
 const row=(id,it,extra='')=>{const lock=it.lv&&P.lv<it.lv,pr=priceOf(it);return `<div class="item">${itemIcon(id)}<div class="grow"><b>${it.n}</b>${it.el?' '+elChip(it.el):''}<small>${it.st?compareGear(it):it.d}${it.st?itemExtra(it):''}${it.lv>1?` · ต้องการ Lv ${it.lv}`:''}${extra}</small></div>
  <button class="btn sm ${lock?'':'pri'}" data-a="buy" data-v="${id}" ${P.gold<pr?'disabled':''}><span class="num">${fmt(pr)}</span></button></div>`};
 let body='';
 if(tab==='wp')body=Object.entries(EQ).filter(([,w])=>w.slot==='weapon'&&!w.worldLegend&&!w.eventCraft&&(w.wt===mw||S.ui.allw)).map(([id,w])=>row(id,w,w.wt!==mw?` · ${WT[w.wt].n} (อาชีพอื่น)`:'')).join('')+`<button class="btn sm" data-a="shoptab" data-v="wpall">${S.ui.allw?`แสดงเฉพาะ${WT[mw].n}`:'ดูอาวุธของอาชีพอื่น'}</button>`;
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
// @soulbeast-end 0377-vShopBase
// @soulbeast-unit 0386-craftId

const craftId=k=>CRAFT[k].sl==='weapon'?`cf_${k}_${clsWeapon(S.P.cls)}`:`cf_${k}`;
// @soulbeast-end 0386-craftId
// @soulbeast-unit 0387-canCraft

const canCraft=k=>{const c=CRAFT[k],P=S.P;return P.gold>=c.gold&&c.mats.every(([m,n])=>(P.parts[m]||0)>=n)};
// @soulbeast-end 0387-canCraft
// @soulbeast-unit 0388-vForgeBase

function vForgeBase(){const P=S.P,zi=S.ui.forge??0,z=ZN[zi],ks=[...z.sp,...z.rare].filter(k=>CRAFT[k]&&CRAFT[k].zi===zi);
 return `<div class="stack"><div class="row"><h2 class="grow">โรงหลอมเทพอสูร</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div>
 <p class="sub" style="margin:0">ใช้ชิ้นส่วนอสูรหลอมอุปกรณ์ที่ได้ความสามารถติดตัวและสกิลของอสูรตัวนั้น พลังใกล้เคียงของในตำนาน หลอมซ้ำได้ อาวุธจะออกเป็นอาวุธประเภทของอาชีพคุณ</p>
 <div class="tabs">${ZN.filter(x=>!x.final&&!x.train).map((x,i)=>`<button class="${zi===i?'on':''}" data-a="forgetab" data-v="${i}">${x.n}</button>`).join('')}</div>
 <div class="lst">${ks.map(k=>{const c=CRAFT[k],s=SP[k];if(!P.seen[k])return `<div class="item">${portrait(k,40,{unk:1})}<div class="grow"><b>???</b><small>พบอสูรตัวนี้ก่อนเพื่อดูสูตร</small></div></div>`;
  const it=EQ[craftId(k)],ok=canCraft(k);
  return `<div class="item" style="align-items:flex-start">${WEAPON_ART[craftId(k)]?itemIcon(craftId(k),52):portrait(k,40)}<div class="grow"><b>${it.n}</b>${WEAPON_ART[craftId(k)]?` <span class="weapon-rarity-label weapon-label-crafted" translate="no">${weaponRarityLabel(it)}</span>`:''} <span class="sub">${SLOTN[it.slot]}</span> ${elChip(it.el)}<small>${statLine(it.st)} · ต้องการ Lv ${it.lv}<br>ความสามารถ: <b>${PAS[it.pas].n}</b> — ${PAS[it.pas].d}<br>สกิล: <b>${SK[it.ws||it.sk].n}</b> — ${skillDesc(it.ws||it.sk)}<br>
  วัตถุดิบ: ${c.mats.map(([m,n])=>{const [sp,i]=m.split('|'),have=P.parts[m]||0;return `<span style="color:var(--${have>=n?'good':'bad'})">${SP[sp].parts[+i][0]} ${have}/${n}</span>`}).join(' · ')} · <span style="color:var(--${P.gold>=c.gold?'good':'bad'})">${fmt(c.gold)} เหรียญ</span></small></div>
  <button class="btn sm ${ok?'pri':''}" data-a="craft" data-v="${k}" ${ok?'':'disabled'}>หลอม</button></div>`}).join('')}</div></div>`}
// @soulbeast-end 0388-vForgeBase
// @soulbeast-unit 0565-GACHA_RATES

const GACHA_RATES=[["item",2000],["premium",1000],["beast",1990],["gear",2000],["craft",1500],["legendGear",950],["eclipseGear",50],["rare",400],["legendBeast",30],["solarBeast",10],["eternal",70]];
// @soulbeast-end 0565-GACHA_RATES
// @soulbeast-unit 0567-gachaCategory

function gachaCategory(roll,rarePity,legendPity){if(legendPity>=99)return roll<.5?'eclipseGear':'legendBeast';if(rarePity>=9)return roll<30/430?'legendBeast':'rare';let at=0;for(const [key,weight]of GACHA_RATES){at+=weight;if(roll*10000<at)return key;}return 'eternal';}
// @soulbeast-end 0567-gachaCategory
// @soulbeast-unit 0568-gachaPools

function gachaPools(){const items=Object.keys(CON).filter(k=>!CON[k].rareLoot&&CON[k].price>=100),gear=Object.keys(EQ);return {item:items.filter(k=>CON[k].price<1000),premium:items.filter(k=>CON[k].price>=1000),beast:Object.keys(SP).filter(k=>!SP[k].noseal&&!SP[k].rare&&!SP[k].legendary),gear:gear.filter(k=>!EQ[k].legend&&!EQ[k].craft&&!EQ[k].special),craft:gear.filter(k=>EQ[k].craft),legendGear:gear.filter(k=>EQ[k].legend&&!EQ[k].worldLegend),eclipseGear:gear.filter(k=>EQ[k].worldLegend),rare:Object.keys(SP).filter(k=>SP[k].rare&&!SP[k].legendary&&!SP[k].solar&&!SP[k].noseal),legendBeast:Object.keys(SP).filter(k=>SP[k].legendary&&!SP[k].noseal),solarBeast:Object.keys(SP).filter(k=>SP[k].solar&&!SP[k].noseal),eternal:['eternalSeal']};}
// @soulbeast-end 0568-gachaPools
// @soulbeast-unit 0569-gachaGrant

function gachaGrant(P,rewards){P.items=P.items||{};P.owned=P.owned||[];P.pets=P.pets||[];P.gachaLegendPets=P.gachaLegendPets||{};for(const r of rewards){if(r.type==='item')P.items[r.key]=(P.items[r.key]||0)+1;else if(r.type==='gear'){P.owned.push(r.key);if(EQ[r.key].legend){P.legend=P.legend||{};P.legend[r.key]=1;}}else{const pet=JSON.parse(JSON.stringify(r.pet));if(P.pets.some(p=>p.uid===pet.uid))throw Error('pet uid collision');P.pets.push(pet);P.seen=P.seen||{};P.caught=P.caught||{};P.seen[pet.sp]=1;P.caught[pet.sp]=1;if(SP[pet.sp].legendary)P.gachaLegendPets[pet.uid]=pet.sp;}}return P;}
// @soulbeast-end 0569-gachaGrant
// @soulbeast-unit 0571-GACHA

const GACHA={busy:false,coupons:null,totalDraws:0,rarePity:0,legendPity:0,solarPity:0,rewards:[],error:'',pending:null};
// @soulbeast-end 0571-GACHA
// @soulbeast-unit 0579-gachaPendingKey

function gachaPendingKey(){return 'sealbeast_gacha_pending_'+ensureCode();}
// @soulbeast-end 0579-gachaPendingKey
// @soulbeast-unit 0580-gachaReadPending

function gachaReadPending(){try{const p=JSON.parse(localStorage.getItem(gachaPendingKey())||'null');return p?.endpoint===SHEET_URL?p:null;}catch(e){return null;}}
// @soulbeast-end 0580-gachaReadPending
// @soulbeast-unit 0581-gachaStorePending

function gachaStorePending(p){GACHA.pending=p;try{if(p)localStorage.setItem(gachaPendingKey(),JSON.stringify(p));else localStorage.removeItem(gachaPendingKey());}catch(e){}}
// @soulbeast-end 0581-gachaStorePending
// @soulbeast-unit 0582-gachaCall

async function gachaCall(draw=0){if(GACHA.busy||COMMUNITY.busy||!S.P)return;if(!SHEET_URL){toast(communityError('bad action'));return;}if(communityBattleBusy()){toast(communityError('finish other battle'));return;}GACHA.busy=true;GACHA.error='';if(draw||gachaReadPending()){GACHA.rewards=[];ReleaseGacha.start();}render();try{let pending=gachaReadPending();if(draw||pending){if(!pending){await communitySave();pending={endpoint:SHEET_URL,request:crypto.randomUUID(),count:draw};gachaStorePending(pending);}const r=await lbPost({action:'gacha_draw',gachaRulesVersion:3,...communityAuth(),request:pending.request,count:pending.count});if(!r.ok)throw Error(r.error);communityApplyData(r.data,r.accountSaveAt);Object.assign(GACHA,{coupons:r.coupons,totalDraws:r.totalDraws,rarePity:r.rarePity,legendPity:r.legendPity,solarPity:r.solarPity||0,rewards:(r.rewards||[]).map(r=>r.type==='pet'?{...r,category:SP[r.key].solar?'solarBeast':SP[r.key].legendary?'legendBeast':SP[r.key].rare?'rare':'beast'}:r)});gachaStorePending(null);await ReleaseGacha.finish(GACHA.rewards);}else{await communitySave();const r=await lbPost({action:'gacha_status',...communityAuth()});if(!r.ok)throw Error(r.error);Object.assign(GACHA,{coupons:r.coupons,totalDraws:r.totalDraws,rarePity:r.rarePity,legendPity:r.legendPity,solarPity:r.solarPity||0});}}catch(e){GACHA.error=communityError(e.message);toast(GACHA.error);}finally{ReleaseGacha.stop();GACHA.busy=false;render();}}
// @soulbeast-end 0582-gachaCall
// @soulbeast-unit 0583-GACHA_NAMES

const GACHA_NAMES={item:['ไอเท็มทั่วไป','Common Items','普通物品'],premium:['ไอเท็มราคาแพง','Premium Items','高级物品'],beast:['อสูรทั่วไป','Common Beasts','普通妖兽'],gear:['อุปกรณ์ทั่วไป','Common Equipment','普通装备'],craft:['อุปกรณ์หลอม','Crafted Equipment','锻造装备'],legendGear:['อุปกรณ์ในตำนานทั่วไป','Ordinary Legendary Equipment','普通传说装备'],eclipseGear:['อุปกรณ์ตำนานสุริยคราส','Eclipse Legendary Equipment','日蚀传说装备'],rare:['อสูรหายาก','Rare Beasts','稀有妖兽'],legendBeast:['อสูรในตำนาน','Legendary Beasts','传说妖兽'],solarBeast:['อสูรตำนานสุริยคราส','Eclipse Legendary Beasts','日蚀传说妖兽'],eternal:['ผนึกนิรันดร์','Eternal Seal','永恒封印']};
// @soulbeast-end 0583-GACHA_NAMES
// @soulbeast-unit 0584-gachaRewardCard

function gachaRewardCard(r){const pet=r.type==='pet',name=pet?SP[r.key].n:r.type==='gear'?EQ[r.key].n:CON[r.key].n,art=pet?portrait(r.key,56):itemIcon(r.key,56),rare=['solarBeast','rare','legendBeast','eclipseGear','legendGear','craft','eternal'].includes(r.category);return `<article class="card gacha-result ${rare?'gacha-special':''}">${art}<b>${esc(name)}</b><small translate="no">${ct(...GACHA_NAMES[r.category])}</small>${pet?`<small translate="no">${ct('Lv1 · ส่งเข้าค่าย','Lv1 · Sent to camp','Lv1 · 已送入营地')}</small>`:''}</article>`;}
// @soulbeast-end 0584-gachaRewardCard
// @soulbeast-unit 0585-vGacha

function vGacha(){const pending=gachaReadPending(),locked=GACHA.busy||!SHEET_URL;return `<div class="stack"><div class="row"><h2 class="grow" translate="no">${ct('กาชาปองแห่งพันผนึก','Soulseal Gachapon','封印扭蛋')}</h2><button class="btn sm" data-a="go" data-v="town">กลับเมือง</button></div><div class="card stack gacha-machine ${GACHA.busy?'gacha-spinning':''}"><img class="gacha-machine-image" src="assets/ui/gachapon.webp" alt="ตู้กาชาปองอสูรและอาวุธตำนาน" width="480" height="320">${GACHA.busy?`<p class="gacha-busy-note" role="status" translate="no">${ct('กำลังตรวจคูปองและเปิดผนึก…','Checking coupons and opening soulseals…','正在核验兑换券并开启封印…')}</p>`:''}<h3 translate="no">${ct('ใช้คูปองเท่านั้น','Coupons Only','仅限兑换券')}</h3><b class="num" translate="no">${ct('คูปอง','Coupons','兑换券')}: ${GACHA.coupons==null?'—':fmt(GACHA.coupons)}</b><p translate="no">${ct('1คูปอง = 1ครั้ง · ไม่ใช้เหรียญหรือเงินจริง','1 coupon = 1 draw · No coin or cash payment','1张兑换券＝1次抽奖，不消耗金币或现金')}</p><div class="row wrap"><button class="btn pri" data-a="gachaDraw" data-v="1" ${locked||pending||GACHA.coupons==null||GACHA.coupons<1?'disabled':''} translate="no">${ct('สุ่ม1ครั้ง','Draw 1','抽1次')}</button><button class="btn seal" data-a="gachaDraw" data-v="10" ${locked||pending||GACHA.coupons==null||GACHA.coupons<10?'disabled':''} translate="no">${ct('สุ่ม10ครั้ง','Draw 10','抽10次')}</button><button class="btn" data-a="gachaRefresh" ${locked?'disabled':''} translate="no">${pending?ct('ตรวจผลสุ่มที่ค้าง','Recover Pending Draw','恢复待处理抽奖'):ct('ตรวจคูปอง','Refresh Coupons','刷新兑换券')}</button></div>${pending?`<small class="warn" translate="no">${ct('มีรายการรอตรวจผล กรุณากดตรวจผลก่อนเล่นต่อ ระบบจะไม่หักคูปองซ้ำ','A draw is pending. Recover it before continuing; coupons will not be charged twice.','有待处理的抽奖，请先恢复结果，不会重复扣券。')}</small>`:''}<small translate="no">${ct('การันตีหายากขึ้นไปในอีก','Rare or better within','稀有或以上保底剩余')} ${10-GACHA.rarePity} · ${ct('การันตีสุริยคราสหรือตำนานในอีก','Eclipse gear or legendary beast within','日蚀装备或传说妖兽保底剩余')} ${100-GACHA.legendPity}</small><small class="solar-rarity-label" translate="no">☀ ${ct('การันตีอสูรสุริยคราสในอีก','Eclipse beast within','日蚀传说保底剩余')} ${300-(GACHA.solarPity||0)} ${ct('ครั้ง','draws','抽')}</small><small translate="no">${ct('สุ่มสะสมทั้งหมด','Total draws','累计抽奖')} ${fmt(GACHA.totalDraws)}</small></div>${GACHA.error?`<p class="warn" translate="no">${esc(GACHA.error)}</p>`:''}${GACHA.rewards.length?`<h3 translate="no">${ct('ผลการสุ่ม','Draw Results','抽奖结果')}</h3><p class="reward-note" translate="no">${ct('เรียงหมวดที่โอกาสออกน้อยก่อน · อัตราที่แสดงเป็นอัตราพื้นฐานก่อนการันตี','Rarest categories first · Rates are base rates before pity','低概率类别优先 · 所示为保底前基础概率')}</p>${GACHA.rewards.some(r=>['solarBeast','legendBeast','rare','eclipseGear','legendGear','craft'].includes(r.category))?`<div class="gacha-congratulations" role="status" translate="no">✦ ${ct('ยินดีด้วย! คุณได้รับรางวัลพิเศษ','Congratulations! A special reward is yours!','恭喜！获得特别奖励！')} ✦</div>`:''}<div class="gacha-results">${gachaSortedRewards(GACHA.rewards).map((r,i)=>gachaRewardCard(r).replace('<article ',`<article style="--reward-index:${i}" `)).join('')}</div>`:''}<details class="card" open><summary translate="no">${ct('อัตราสุ่มและกติกา','Rates & Rules','概率与规则')}</summary><div class="stack">${GACHA_RATES.map(([key,w])=>`<div class="row"><span class="grow" translate="no">${ct(...GACHA_NAMES[key])}</span><b>${w/100}%</b></div>`).join('')}<p translate="no">${ct('อัตราพื้นฐานรวม 100% · การันตี 10 ครั้ง: หายากขึ้นไป โดยสุริยคราสนับแทนได้ · การันตีร่วม 100 ครั้ง: อุปกรณ์สุริยคราส 1 ชิ้น หรืออสูรตำนาน 1 ตัว อัตราหมวด 50:50 รวมอาวุธและเครื่องสวมใส่ทุกชิ้น · เมื่อได้สุริยคราสหรืออสูรตำนาน ตัวนับ 100 จะเริ่มใหม่ นับร่วมทั้งสุ่ม 1 และ 10 ครั้ง ไม่มีโบนัสการันตี 50 ครั้ง','Base rates total 100%. Ten-pull pity grants rare or better; Eclipse gear also satisfies it. Shared 100-pull pity grants ONE Eclipse item OR legendary beast, with a 50:50 category chance. All Eclipse weapons and wearables are included. Either high-tier reward resets the 100-pull counter. Singles and ten-pulls share counters. There is no 50-pull bonus.','基础概率合计100%。10抽保底为稀有或以上，日蚀装备也满足此保底。共用100抽保底只发放一件日蚀装备或一只传说妖兽，类别概率各50%，包含全部日蚀武器及穿戴装备。获得任一最高级奖励后100抽计数重置，单抽与十连共用计数，取消50抽额外保底。')}</p><p translate="no">${ct('อสูรจากกาชาเริ่มLv1และพักในค่าย ตำนานจากกาชาใช้ได้ทันที · ผนึกนิรันดร์จับสำเร็จ100%เฉพาะอสูรที่จับได้ ไม่จับบอสต้องห้ามหรือใช้ในPVP','Beasts arrive at Lv1 in camp. Gacha legends are usable immediately. Eternal Seals guarantee capture only for capturable beasts; forbidden bosses and PvP remain excluded.','扭蛋妖兽以Lv1进入营地，传说妖兽可立即使用。永恒封印仅对可捕获妖兽保证成功，不能捕获禁捕首领或用于PVP。')}</p><p translate="no">${ct('คูปอง: จอมมาร 10% ได้ 1 ใบ · บอสโลกคะแนน 500 ขึ้นไป 50% ได้ 1 ใบ · ยอดตรวจจากเซิร์ฟเวอร์','Coupons: Demon Lord 10% for one; World Boss score 500+ has 50% for one. Balances are verified by the server.','兑换券：魔王10%掉落1张；世界首领积分500以上50%掉落1张。余额由服务器核验。')}</p><p class="solar-rarity-label" translate="no">${ct('สุริยคราส: โอกาสพื้นฐาน 0.1% ได้เฉพาะกาชา ทั้ง 8 ตัวมีโอกาสเท่ากัน ตัวนับแยกสูงสุด 300 ครั้งและเริ่มใหม่เมื่อได้สุริยคราส เริ่มนับจากการสุ่มในระบบสุริยคราสนี้ นับร่วมทั้งสุ่ม 1 และ 10 ครั้ง คงการันตีเดิม 10/100 ครั้ง หากชนกับการันตี 100 ครั้งจะได้รับครบทั้งสองรางวัล อสูรสุริยคราสไม่รีเซ็ตตัวนับ 100 ครั้ง','Eclipse beasts: 0.1% base chance, gachapon only. All eight beasts are equally likely. A separate counter guarantees one within 300 draws and resets when a Eclipse beast arrives. Counting begins with draws under these Eclipse-beast rules. Singles and ten-pulls share progress. Existing 10/100 pity remains; overlapping 100/300 guarantees award both rewards. Eclipse beasts do not reset the 100-draw counter.','日蚀妖兽：基础概率0.1%，仅限扭蛋，八只妖兽概率相同。独立计数保证300抽内获得一只，获得日蚀妖兽后重置。从日蚀妖兽规则上线后的抽奖开始累计，单抽与十连共用计数。原10/100抽保底保留，100与300抽保底重叠时两份奖励均发放。日蚀妖兽妖兽不重置100抽计数。')}</p>${eclipseRateDetails()}</div></details></div>`;}
// @soulbeast-end 0585-vGacha
// @soulbeast-unit 0602-handlers-gachaDraw

handlers.gachaDraw=n=>gachaCall(Number(n));
// @soulbeast-end 0602-handlers-gachaDraw
// @soulbeast-unit 0603-handlers-gachaRefresh
handlers.gachaRefresh=()=>gachaCall();
// @soulbeast-end 0603-handlers-gachaRefresh
// @soulbeast-unit 0621-ReleaseGacha


/* Presentation only: server receipts, odds, inventory and save schema remain unchanged. */
const ReleaseGacha={charging:null,
 start(){this.stop();this.started=Date.now();ExtraAudio.play('charge');this.charging=Music.tracks.a1||null;},
 stop(){if(this.charging){this.charging.audio.pause();this.charging.audio.currentTime=0;}this.charging=null;},
 async finish(rewards){const wait=Math.max(0,1200-(Date.now()-(this.started||Date.now())));if(wait&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)await new Promise(resolve=>setTimeout(resolve,wait));this.stop();const cats=new Set(rewards.map(r=>r.category));ExtraAudio.play(cats.has('solarBeast')||cats.has('legendBeast')||cats.has('legendGear')||cats.has('rare')||cats.has('craft')?'specialRewardFx':'quest');}
};
// @soulbeast-end 0621-ReleaseGacha
// @soulbeast-unit 0622-gachaSortedRewards

function gachaSortedRewards(rewards){const weights=Object.fromEntries(GACHA_RATES);return rewards.map((r,i)=>({r,i})).sort((a,b)=>(weights[a.r.category]??10000)-(weights[b.r.category]??10000)||a.i-b.i).map(x=>x.r);}
// @soulbeast-end 0622-gachaSortedRewards
// @soulbeast-unit 0656-ReleaseGacha-start

ReleaseGacha.start=function(){ornateStart.call(this);this.active=true;};
// @soulbeast-end 0656-ReleaseGacha-start
// @soulbeast-unit 0657-ReleaseGacha-stop

ReleaseGacha.stop=function(){ornateStop.call(this);this.active=false;};
// @soulbeast-end 0657-ReleaseGacha-stop
// @soulbeast-unit 0658-gachaDrawOverlay

function gachaDrawOverlay(){return `<div class="gacha-draw-overlay" role="dialog" aria-modal="true" aria-labelledby="gachaWaitTitle" tabindex="-1"><div class="gacha-draw-panel"><div class="summoning-art" aria-hidden="true"><i class="summoning-ring ring-outer"></i><i class="summoning-ring ring-inner"></i><img src="assets/ui/soulseal-summoning.webp" alt="" width="480" height="480"><span class="summoning-spark spark-one">✦</span><span class="summoning-spark spark-two">✦</span><span class="summoning-spark spark-three">✧</span></div><h2 id="gachaWaitTitle" translate="no">${ct('กรุณารอ ระบบกำลังจับรางวัล','Please wait — drawing your rewards','请稍候，系统正在抽取奖励')}</h2><p role="status" aria-live="polite" translate="no">${ct('กำลังเปิดผนึกแห่งโชคชะตา…','Opening the seals of destiny…','正在开启命运封印…')}</p><div class="summoning-progress" aria-hidden="true"><i></i></div><small translate="no">${ct('โดยทั่วไปประมาณ 10 วินาที แต่อาจนานกว่านี้ตามการเชื่อมต่อ กรุณาเปิดหน้านี้ไว้จนผลปรากฏ','Usually about 10 seconds; connection speed may affect the wait. Keep this page open until your rewards appear.','通常约需10秒，实际时间取决于连接情况。请保持此页面打开，直到奖励显示。')}</small></div></div>`;}
// @soulbeast-end 0658-gachaDrawOverlay
// @soulbeast-unit 0719-shopItemGroup


// Display ordering only. Never reorder the shared gameplay catalogs.
function shopItemGroup(c){return c.rev?2:c.hp?0:c.mp?1:c.cure?3:c.seal?4:c.petExp?5:6;}
// @soulbeast-end 0719-shopItemGroup
// @soulbeast-unit 0720-compareShopItems

function compareShopItems(a,b){return shopItemGroup(a[1])-shopItemGroup(b[1])||(a[1].lv||1)-(b[1].lv||1)||(a[1].price||0)-(b[1].price||0);}
// @soulbeast-end 0720-compareShopItems
// @soulbeast-unit 0733-balanceGachaKey

function isEclipseReward(reward){return reward?.type==='gear'&&!!EQ[reward.key]?.worldLegend;}
function balanceGachaKey(category,pool){if(!pool.length)throw Error('empty gacha pool');return pool[Math.floor(Math.random()*pool.length)];}

function eclipseRateDetails(){return '<p translate="no">'+ct('จอมมาร: ผนึกพระเจ้า 30% · อุปกรณ์ตำนานทั่วไป 12% · คูปอง 1 ใบ 10% · อสูรหายากสุ่ม 13% · ผลึกเติบโตอสูรโบราณ 5 ชิ้น 35% สุ่มหนึ่งหมวดต่อชัยชนะ โบนัสเหรียญครั้งแรกคงเดิม','Demon Lord: God Seal 30%; ordinary legendary gear 12%; one coupon 10%; random rare beast 13%; five Ancient Beast Growth Crystals 35%. One category per victory. First-clear coin bonus is unchanged.','魔王：神之封印30%；普通传说装备12%；1张兑换券10%；随机稀有妖兽13%；5颗远古妖兽成长结晶35%。每次胜利随机一个类别，首次通关金币奖励不变。')+'</p><p translate="no">'+ct('ม่านหมอก: หลังชนะจอมมารอย่างน้อย 1 ครั้ง พบอสูรตำนาน 0.3% ต่อม่านหมอก ระดับ 40–60 · หีบตำนาน: หลังชนะจอมมาร พบอุปกรณ์สุริยคราส 1% ต่อหีบ','Mist: after defeating the Demon Lord at least once, each mist encounter has a 0.3% legendary beast chance at Lv40–60. Legendary chests have a 1% Eclipse equipment chance after that victory.','迷雾：至少击败魔王一次后，每次迷雾有0.3%概率遇见Lv40–60传说妖兽。通关后每个传说宝箱有1%概率获得日蚀装备。')+'</p><p translate="no">'+ct('บอสโลก: 500–999 คะแนน 0.5% · 1,000–1,999 คะแนน 1% · 2,000–3,999 คะแนน 5% · 4,000 ขึ้นไป 10% ได้สุริยคราส 1 ชิ้นเมื่อสำเร็จ ต้องมีผู้เล่น Lv45 ขึ้นไปอย่างน้อย 3 คนที่ไม่ถอนตัว','World Boss Eclipse chance: 500–999 points 0.5%; 1,000–1,999 points 1%; 2,000–3,999 points 5%; 4,000+ points 10%. One item on success. Requires at least three Lv45+ players who do not withdraw.','世界首领日蚀装备概率：500–999分0.5%；1000–1999分1%；2000–3999分5%；4000分以上10%。成功获得一件，须至少3名Lv45以上且未退出的玩家。')+'</p>';}
function applyDemonRewardReceipts(reply){const P=S.P;if(!P)return;for(const receipt of (reply.bossRewards||[]).sort((a,b)=>a.clear-b.clear)){if(receipt.clear<=Number(P.demonRewardRevision||0))continue;gachaGrant(P,receipt.rewards||[]);P.demonRewardRevision=receipt.clear;P.demonRewardHistory=[...(P.demonRewardHistory||[]),receipt].slice(-100);const labels=(receipt.rewards||[]).map(r=>(EQ[r.key]||CON[r.key]||SP[r.key])?.n||r.key);if(receipt.coupon)labels.push(ct('คูปองกาชาปอง 1 ใบ','1 Gacha Coupon','1张扭蛋兑换券'));const line=ct('รางวัลจอมมาร: ','Demon Lord reward: ','魔王奖励：')+labels.join(' · ');if(S.battle?.over?.res==='win')S.battle.over.lines.push(line);toast(line);}if(reply.coupons!=null)GACHA.coupons=reply.coupons;save();}
let DEMON_CLAIM_BUSY=false;
async function claimDemonVictory(){if(DEMON_CLAIM_BUSY||!S.P||!SHEET_URL)return;DEMON_CLAIM_BUSY=true;try{await communitySave();save();render();}catch(e){toast(communityError(e.message));}finally{DEMON_CLAIM_BUSY=false;}}

// @soulbeast-end 0733-balanceGachaKey
// @soulbeast-unit 0806-eclipseGachaViewBase


const eclipseGachaViewBase=vGacha;
// @soulbeast-end 0806-eclipseGachaViewBase
// @soulbeast-unit 0807-vGacha
vGacha=function(){return eclipseGachaViewBase();};
// @soulbeast-end 0807-vGacha
// @soulbeast-unit 0992-villageGearPrice

function villageGearPrice(id){return Math.max(500,Math.round(priceOf(EQ[id])*1.75));}
// @soulbeast-end 0992-villageGearPrice
// @soulbeast-unit 1008-comparisonShopView


const comparisonShopView=vShop;
// @soulbeast-end 1008-comparisonShopView
// @soulbeast-unit 1009-vShop
vShop=function(){return comparisonShopView().replace('<div class="tabs">','<p class="sub">ค่าสเตตัสเทียบกับชิ้นที่สวมอยู่ในช่องเดียวกัน: <span style="color:var(--good)">เขียว = เพิ่มขึ้น</span> · <span style="color:var(--bad)">แดง = ลดลง</span> · ตัวเลขในวงเล็บคือผลต่าง</p><div class="tabs">');};
// @soulbeast-end 1009-vShop
