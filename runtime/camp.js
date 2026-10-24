// Camp registration, defense and raids
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0373-vCamp

function vCamp(){return (CAMP.room?.status==='active'?'':activityBackdrop('camp','ค่ายผู้ผนึก · วางแผนก่อนจู่โจม'))+vCampBase();}
// @soulbeast-end 0373-vCamp
// @soulbeast-unit 0396-CAMP


const CAMP={rows:[],used:0,pet:null,busy:false,error:'',room:null,token:'',target:'',friend:'',request:''};
// @soulbeast-end 0396-CAMP
// @soulbeast-unit 0399-campCall

async function campCall(action,extra={}){if(CAMP.busy||CAMP.room?.replaying)return;const prior=CAMP.room;CAMP.busy=true;CAMP.error='';render();try{const res=await lbPost({action,code:ensureCode(),pin:S.P.cpin||'',room:CAMP.room?.id||CAMP.roomId,token:CAMP.token,...extra});if(!res.ok)throw Error(res.error);applyAccount(res.account);if(res.camps){CAMP.rows=res.camps;CAMP.used=res.used;CAMP.pet=res.pet;CAMP.pets=res.pets||[];CAMP.guardPicks=null}if(res.room){CAMP.room=res.room;onlineSkillEffects(prior,res.room,'camp');observeUnits([...res.room.battle.allies,...res.room.battle.enemies]);CAMP.roomId=res.room.id;CAMP.token=res.token||CAMP.token;CAMP.request='';localStorage.setItem('sealbeast_camp_v1',JSON.stringify({endpoint:SHEET_URL,room:CAMP.roomId,token:CAMP.token}));if(res.room.status==='finished')Sound.fx(res.room.winner===0?'win':'lose')}if(action==='camp_profile'){save();toast('เปลี่ยนชื่อแล้ว');}return res}catch(e){CAMP.error=({'defense required':'ต้องลงทะเบียนอสูรเฝ้าค่ายก่อนจู่โจม','camp daily limit':'ใช้สิทธิจู่โจมครบ 3 ครั้งของวันนี้แล้ว','camp level 10':'ปลดล็อกค่ายที่เลเวล 10','rename weekly':'เปลี่ยนชื่อได้สัปดาห์ละ 1 ครั้ง','choose one pet':'เลือกอสูร 1 ตัวก่อน','pet at camp':'เลือกอสูรที่พกติดตัวสำหรับจู่โจม','pet travelling':'ฝากอสูรไว้ที่ค่ายก่อนตั้งให้เฝ้าค่าย','stale turn':'เทิร์นเปลี่ยนแล้ว กดตรวจข้อมูลใหม่','bad action':'โปรดอัปเดตระบบเซิร์ฟเวอร์เป็นรุ่นใหม่ก่อน'})[e.message]||'ดำเนินการไม่สำเร็จ: '+e.message;toast(CAMP.error)}finally{CAMP.busy=false;render()}}
// @soulbeast-end 0399-campCall
// @soulbeast-unit 0400-enterCamp

async function enterCamp(){if(S.P.lv<10){toast('ปลดล็อกค่ายที่เลเวล 10');return}go('camp');await gsSave(true);await campCall('camp_list');if(CAMP.roomId)await campCall('camp_poll')}
// @soulbeast-end 0400-enterCamp
// @soulbeast-unit 0401-vCampBase

function vCampBase(){const P=S.P;let body='';if(CAMP.room&&CAMP.room.status==='active'){const r=CAMP.room,b=r.battle,all=[...b.allies,...b.enemies],u=all.find(x=>x.id===b.cur);const card=(x,friend)=>`<button class="card" data-a="${friend?'campFriend':'campTarget'}" data-v="${x.id}" ${x.hp<=0?'disabled':''}>${unitPortrait(x,48)}<b>${esc(x.name)}</b><small>HP ${x.hp}/${x.st.hp} · MP ${x.mp}/${x.st.mp}</small>${bar(x.hp,x.st.hp)}${x.taunt?'<small>ยั่วยุ '+x.taunt+' เทิร์น</small>':''}</button>`;body=`<div class="row wrap">${b.enemies.map(x=>card(x,false)).join('')}</div><div class="log">${b.log.slice(-12).map(t=>`<p>${esc(t)}</p>`).join('')}</div><div class="row wrap">${b.allies.map(x=>card(x,true)).join('')}</div><p>ตาของ ${esc(u?.name||'')} · ต่อสู้อัตโนมัติ</p><div class="acts"></div><span class="sub">กำลังแสดงการต่อสู้อัตโนมัติ · ผลและรางวัลบันทึกแล้ว</span>`}
 else{const result=CAMP.room?.status==='finished'?`<div class="card"><b>${CAMP.room.winner===0?'จู่โจมสำเร็จ':CAMP.room.winner===-1?'เสมอ':'จู่โจมล้มเหลว'}</b><p>${esc(CAMP.room.reason||'')} · เงินปัจจุบัน ${fmt(P.gold)}</p><button class="btn" data-a="campClear">ปิดผลการต่อสู้</button></div>`:'';body=result+`<p>จัดผู้ผนึกพร้อมอสูรเฝ้าค่าย นักอัญเชิญใช้ได้สูงสุด 3 ตัว: ตัวหลักที่เลือก และเสริมอัตโนมัติจากอสูรที่พักค่าย ระบบควบคุมเมื่อคุณไม่ออนไลน์</p><label>ผู้เฝ้าค่าย (เลือกจากอสูรที่พักค่าย)</label><select id="campPet">${storedPets().map(p=>`<option value="${p.uid}" ${CAMP.pet===p.uid?'selected':''}>${esc(petName(p))} Lv ${p.lv}</option>`).join('')}</select><button class="btn" data-a="campRegister">ตั้งอสูรเฝ้าค่าย</button><label>อสูรสำหรับจู่โจม (เลือกจากที่พก)</label><select id="campAttackPet">${carriedPets().map(p=>`<option value="${p.uid}">${esc(petName(p))} Lv ${p.lv}</option>`).join('')}</select><p>ผู้จู่โจมใช้อสูรตัวหลักที่เลือก นักอัญเชิญเสริมจากอสูรที่พกได้สูงสุด 3 ตัว ห้ามสลับ ห้ามไอเท็ม ห้ามผนึก · สิทธิ์วันนี้ ${CAMP.used}/3 (เริ่มวันใหม่เวลาไทย)</p><p>ฝ่ายแพ้เสียเงินปัจจุบัน 20% ให้ฝ่ายชนะ ระบบคำนวณผลและบันทึกรางวัลก่อนแสดงการต่อสู้ เจ้าของค่ายไม่ต้องออนไลน์</p><div class="lst">${CAMP.rows.map(c=>`<div class="item"><div class="grow"><b>${esc(CLS[c.cls]?.n||c.cls)}</b><small>Lv ${c.level} · เงิน ${fmt(c.gold)} เหรียญ</small></div><button class="btn" data-a="campBegin" data-v="${c.id}" ${CAMP.busy||CAMP.used>=3?'disabled':''}>จู่โจม</button></div>`).join('')||'<p>ยังไม่มีค่ายให้เลือก กดตรวจข้อมูลใหม่</p>'}</div>`}
 return `<div class="stack"><div class="row"><h2 class="grow">จู่โจมค่าย</h2><button class="btn" data-a="go" data-v="town">กลับเมือง</button></div>${CAMP.error?`<p style="color:var(--bad)">${esc(CAMP.error)}</p>`:''}<button class="btn" data-a="campRefresh" ${CAMP.busy?'disabled':''}>ตรวจข้อมูลใหม่</button>${body}</div>`}
// @soulbeast-end 0401-vCampBase
// @soulbeast-unit 0502-replayCampCall

const replayCampCall=campCall;
// @soulbeast-end 0502-replayCampCall
// @soulbeast-unit 0503-campCall
campCall=async function(a,x={}){const res=await replayCampCall(a,x);if(res?.room)localReplay('camp',res.room);return res;};
// @soulbeast-end 0503-campCall
// @soulbeast-unit 0508-handlers-campMove

handlers.campMove=()=>toast('โหมดนี้ต่อสู้อัตโนมัติเท่านั้น');
// @soulbeast-end 0508-handlers-campMove
// @soulbeast-unit 0682-reliabilityCamp

const reliabilityCamp=campCall;
// @soulbeast-end 0682-reliabilityCamp
// @soulbeast-unit 0683-campCall
campCall=async function(action,extra={}){if(CAMP.busy)return;return withOnline(action,()=>reliabilityCamp(action,extra));};
// @soulbeast-end 0683-campCall
// @soulbeast-unit 0854-campSelection


function campSelection(name){const cap=baseOf(S.P.cls)==='summoner'?3:1,carried=carriedPets().map(p=>p.uid),field=name==='campGuardPets'?'guardPicks':'raidPicks';if(!Array.isArray(CAMP[field]))CAMP[field]=(name==='campGuardPets'&&CAMP.pets?.length?CAMP.pets:S.P.party||[]).slice(0,cap);CAMP[field]=CAMP[field].filter(id=>carried.includes(id)).slice(0,cap);return CAMP[field];}
// @soulbeast-end 0854-campSelection
// @soulbeast-unit 0855-campTeamPicker

function campTeamPicker(name,label){const ids=campSelection(name),cap=baseOf(S.P.cls)==='summoner'?3:1;return '<fieldset class="card stack"><legend>'+label+' · '+ids.length+'/'+cap+' ตัว</legend><small>เลือกจากอสูรที่พกในกระเป๋า ไม่เปลี่ยนทีมเดินป่า</small>'+carriedPets().map(p=>'<label class="row">'+portrait(p.sp,36,{form:p.form||0})+'<input type="checkbox" name="'+name+'" value="'+p.uid+'" '+(ids.includes(p.uid)?'checked':ids.length>=cap?'disabled':'')+'>'+esc(petName(p))+' · Lv '+p.lv+'</label>').join('')+(!carriedPets().length?'<p>ไม่มีอสูรในกระเป๋า</p>':'')+'</fieldset>';}
// @soulbeast-end 0855-campTeamPicker
// @soulbeast-unit 0856-selectedCampView

const selectedCampView=vCampBase;
// @soulbeast-end 0856-selectedCampView
// @soulbeast-unit 0857-vCampBase
vCampBase=function(){let h=selectedCampView();if(CAMP.room?.status==='active')return h;h=h.replace(/<label>ผู้เฝ้าค่าย[^<]*<\/label><select id="campPet">[\s\S]*?<\/select>/,campTeamPicker('campGuardPets','เลือกอสูรเฝ้าค่าย'));h=h.replace(/<label>อสูรสำหรับจู่โจม[^<]*<\/label><select id="campAttackPet">[\s\S]*?<\/select>/,campTeamPicker('campRaidPets','เลือกอสูรจู่โจม'));h=h.replace('จัดผู้ผนึกพร้อมอสูรเฝ้าค่าย นักอัญเชิญใช้ได้สูงสุด 3 ตัว: ตัวหลักที่เลือก และเสริมอัตโนมัติจากอสูรที่พักค่าย ระบบควบคุมเมื่อคุณไม่ออนไลน์','เลือกทีมเฝ้าค่ายจากอสูรในกระเป๋า นักอัญเชิญและสายขั้นต่อยอดเลือกได้สูงสุด 3 ตัว อาชีพอื่น 1 ตัว ระบบควบคุมเมื่อคุณไม่ออนไลน์');h=h.replace('ผู้จู่โจมใช้อสูรตัวหลักที่เลือก นักอัญเชิญเสริมจากอสูรที่พกได้สูงสุด 3 ตัว ห้ามสลับ','ทีมจู่โจมใช้เฉพาะอสูรที่ติ๊กเลือกจากกระเป๋า นักอัญเชิญสูงสุด 3 ตัว อาชีพอื่น 1 ตัว ห้ามสลับ');return h;};
// @soulbeast-end 0857-vCampBase
// @soulbeast-unit 0859-handlers-campRegister

handlers.campRegister=async()=>{const pets=[...campSelection('campGuardPets')];if(!pets.length)return toast('เลือกอสูรเฝ้าค่ายก่อน');await gsSave(true);await campCall('camp_register',{pets});await campCall('camp_list');};
// @soulbeast-end 0859-handlers-campRegister
// @soulbeast-unit 0860-handlers-campBegin

handlers.campBegin=async target=>{const pets=[...campSelection('campRaidPets')];if(!pets.length)return toast('เลือกอสูรจู่โจมก่อน');await gsSave(true);if(!CAMP.request)CAMP.request=crypto.randomUUID().replace(/-/g,'');await campCall('camp_begin',{target,pets,request:CAMP.request});};
// @soulbeast-end 0860-handlers-campBegin
// @soulbeast-unit 0862-registeredCampView

const registeredCampView=vCampBase;
// @soulbeast-end 0862-registeredCampView
// @soulbeast-unit 0863-vCampBase
vCampBase=function(){let h=registeredCampView();if(CAMP.room?.status==='active')return h;if(!configuredDefenseReady()){h='<p class="card" role="status">ต้องเลือกและกดตั้งอสูรเฝ้าค่ายก่อน จึงจะจู่โจมค่ายอื่นได้</p>'+h;h=h.replace(/<button[^>]*data-a="campBegin"[^>]*>/g,b=>b.includes('disabled')?b:b.replace('<button','<button disabled'));}return h;};
// @soulbeast-end 0863-vCampBase
// @soulbeast-unit 0883-compactCampView

const compactCampView=vCamp;
// @soulbeast-end 0883-compactCampView
// @soulbeast-unit 0884-vCamp
vCamp=function(){return compactBattleReady('camp')?compactOnlineBattle('camp',CAMP.room):compactCampView();};
// @soulbeast-end 0884-vCamp
