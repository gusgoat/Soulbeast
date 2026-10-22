// World-boss rooms, replays and rewards
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0265-WORLD_LEGENDS


// PVP balance v3: transient battle rules only; persistent saves are unchanged.
/* World event shared rules — additive save fields, no changes to original skill tables. */
const WORLD_LEGENDS=[];
// @soulbeast-end 0265-WORLD_LEGENDS
// @soulbeast-unit 0266-WORLD_WEAPONS

const WORLD_WEAPONS=SoulbeastContent.WORLD_WEAPONS();
// @soulbeast-end 0266-WORLD_WEAPONS
// @soulbeast-unit 0268-WORLD_ARMOR

const WORLD_ARMOR=SoulbeastContent.WORLD_ARMOR();
// @soulbeast-end 0268-WORLD_ARMOR
// @soulbeast-unit 0271-isWorldBattle

function isWorldBattle(){return !!(S&&S.battle&&S.battle.kind==='world')}
// @soulbeast-end 0271-isWorldBattle
// @soulbeast-unit 0272-worldPowerStats

function worldPowerStats(P,s){const b=Math.min(20,Math.floor(Math.max(0,Number(P.worldPower)||0)/20));s.hp+=b*10;s.patk+=b;s.matk+=b;return s;}
// @soulbeast-end 0272-worldPowerStats
// @soulbeast-unit 0273-worldApply

function worldApply(P,a){if(!a)return;const prev=P.worldApplied||{},delta=k=>(Number(a[k])||0)-(Number(prev[k])||0);P.gold=(Number(P.gold)||0)+delta('gold');P.score=(Number(P.score)||0)+delta('score');
 let xp=Math.max(0,delta('xp'));P.exp=(Number(P.exp)||0)+xp;while(P.lv<MAXLV&&P.exp>=need(P.lv)){P.exp-=need(P.lv);P.lv++;P.free=(P.free||0)+5;}if(P.lv>=MAXLV)P.exp=0;
 P.worldPower=Number(a.power)||0;P.items=P.items||{};P.owned=P.owned||[];
 for(const [id,n] of Object.entries(a.loot||{})){const add=Math.max(0,n-Number((prev.loot||{})[id]||0));if(EQ[id]&&EQ[id].worldLegend){for(let i=0;i<add;i++)P.owned.push(id);if(add){P.legend=P.legend||{};P.legend[id]=1;}}else if(CON[id])P.items[id]=(P.items[id]||0)+add;}
 P.worldApplied=JSON.parse(JSON.stringify(a));
}
// @soulbeast-end 0273-worldApply
// @soulbeast-unit 0274-worldReward

function worldReward(score,roll,choice){const tier=score>=2000?4:score>=1000?3:score>=500?2:score>=250?1:0,chance=[0,.05,.15,.35,1][tier],loot={};if(score>=25)loot.eth=1;if(score>=100)loot.revivePotion=1;if(score>=250)loot.eth=3;if(roll<chance)loot[WORLD_LEGENDS[Math.min(15,Math.floor(choice*16))]]=1;return {gold:score*20,score,xp:score*25,power:Math.floor(score/10),loot,tier,chance};}
// @soulbeast-end 0274-worldReward
// @soulbeast-unit 0480-WORLD

const WORLD={room:null,roomId:'',busy:false,error:'',used:null,friend:'',timer:0,pending:null,clock:0};
// @soulbeast-end 0480-WORLD
// @soulbeast-unit 0482-wbClientSchedule

function wbClientSchedule(){clearTimeout(WORLD.timer);if(S.screen==='world'&&!document.hidden&&WORLD.roomId&&(!WORLD.room||['lobby','starting','active'].includes(WORLD.room.status)))WORLD.timer=setTimeout(()=>wbCall('wb_poll'),8000);}
// @soulbeast-end 0482-wbClientSchedule
// @soulbeast-unit 0483-wbCall

async function wbCall(action,extra={}){if(WORLD.busy||!S.P||WORLD.room?.replaying)return;const prior=WORLD.room;WORLD.busy=true;WORLD.error='';if(action!=='wb_poll')render();try{
 if(['wb_create','wb_join'].includes(action)){if(S.zone||S.battle||PVP.room?.status==='active'||CAMP.room?.status==='active'||WORLD.room?.status==='active')throw Error('finish other battle');const res=await lbPost({action:'save',code:ensureCode(),pin:S.P.cpin||'',data:gsData()});if(!res.ok)throw Error(res.error);applyAccount(res.account);}
 const res=await lbPost({action,code:ensureCode(),pin:S.P.cpin||'',room:WORLD.room?.id||WORLD.roomId,...extra});if(!res.ok)throw Error(res.error);
 if(res.worldAccount){worldApply(S.P,res.worldAccount);save();}if(res.used!=null)WORLD.used=res.used;
 if(res.left){WORLD.room=null;WORLD.roomId='';}else if(res.room){WORLD.room=res.room;onlineSkillEffects(prior,res.room,'world');WORLD.roomId=res.room.id;WORLD.clock=Date.now()-res.room.serverTime;if(WORLD.pending&&(res.room.rev>WORLD.pending.rev||res.room.status==='finished'))WORLD.pending=null;}
 localStorage.setItem('sealbeast_world_v1',JSON.stringify({endpoint:SHEET_URL,room:WORLD.roomId}));return res;
 }catch(e){WORLD.error=({'bad action':'โปรดอัปเดตระบบออนไลน์ก่อนเล่นบอสโลก','world pets':'เลือกอสูร 1 ตัว หรือสูงสุด 3 ตัวสำหรับสายนักอัญเชิญ','world weekly limit':'ใช้สิทธิ์ครบ 3 ครั้งในสัปดาห์นี้แล้ว','world ready':'ต้องมี 1–4 คน และทุกคนกดยืนยันพร้อม','pet at camp':'เลือกอสูรที่พกติดตัวเท่านั้น','finish other battle':'จบการต่อสู้อื่นและออกจากป่าก่อน','not your turn':'ยังไม่ถึงตาของคุณ','illegal skill':'ท่านี้ใช้ไม่ได้ หรือกำลังคูลดาวน์','not lobby':'ห้องเริ่มแล้วหรือปิดไปแล้ว','room full':'ห้องมีผู้เล่นครบ 4 คนแล้ว','pin':'PIN ไม่ตรงกับเซฟออนไลน์','unauthorized':'คุณไม่ได้อยู่ในห้องนี้','room not found':'ไม่พบห้องบอสโลก'})[e.message]||'เชื่อมต่อไม่สำเร็จ: '+e.message;
 }finally{WORLD.busy=false;render();wbClientSchedule();}}
// @soulbeast-end 0483-wbCall
// @soulbeast-unit 0484-worldPetSelection

function worldPetSelection(){return [...document.querySelectorAll('input[name="wbPet"]:checked')].map(e=>Number(e.value));}
// @soulbeast-end 0484-worldPetSelection
// @soulbeast-unit 0485-worldCard

function worldCard(u,me){const mine=u.owner===me,selected=WORLD.friend===u.id;return `<button data-u="${u.id}" class="ucard ally ${selected?'at':''} ${u.hp<=0?'down':''}" data-a="wbFriend" data-v="${u.id}">${unitPortrait(u,44,{own:mine&&u.kind==='player'})}<div class="grow"><b ${u.kind==='player'?'data-user-content':''}>${esc(u.name)}</b><small class="sub">${mine?'ของคุณ':'ของเพื่อน'} · Lv ${u.lv}</small>${bar(u.hp,u.st.hp)}<small>HP ${fmt(u.hp)}/${fmt(u.st.hp)} · MP ${fmt(u.mp)}/${fmt(u.st.mp)}</small>${bar(u.mp,u.st.mp,'mp')}</div></button>`;}
// @soulbeast-end 0485-worldCard
// @soulbeast-unit 0486-vWorld

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
// @soulbeast-end 0486-vWorld
// @soulbeast-unit 0504-replayWorldCall

const replayWorldCall=wbCall;
// @soulbeast-end 0504-replayWorldCall
// @soulbeast-unit 0505-wbCall
wbCall=async function(a,x={}){const res=await replayWorldCall(a,x);if(res?.room)localReplay('world',res.room);return res;};
// @soulbeast-end 0505-wbCall
// @soulbeast-unit 0506-replayWorldSchedule

const replayWorldSchedule=wbClientSchedule;
// @soulbeast-end 0506-replayWorldSchedule
// @soulbeast-unit 0507-wbClientSchedule
wbClientSchedule=function(){if(WORLD.room?.replaying){clearTimeout(WORLD.timer);return}replayWorldSchedule();};
// @soulbeast-end 0507-wbClientSchedule
// @soulbeast-unit 0509-handlers-wbMove
handlers.wbMove=()=>toast('โหมดนี้ต่อสู้อัตโนมัติเท่านั้น');
// @soulbeast-end 0509-handlers-wbMove
// @soulbeast-unit 0675-WORLD_NET

const WORLD_NET={current:null,foreground:false};
// @soulbeast-end 0675-WORLD_NET
// @soulbeast-unit 0676-worldIntentKey

function worldIntentKey(){return 'sealbeast_world_intent_'+ensureCode();}
// @soulbeast-end 0676-worldIntentKey
// @soulbeast-unit 0677-worldReadIntent

function worldReadIntent(){try{const p=JSON.parse(localStorage.getItem(worldIntentKey())||'null');return p?.endpoint===SHEET_URL&&['wb_create','wb_join','wb_leave','wb_start'].includes(p.action)?p:null;}catch(e){return null;}}
// @soulbeast-end 0677-worldReadIntent
// @soulbeast-unit 0678-worldSaveIntent

function worldSaveIntent(intent){try{if(intent)localStorage.setItem(worldIntentKey(),JSON.stringify(intent));else localStorage.removeItem(worldIntentKey());}catch(e){}}
// @soulbeast-end 0678-worldSaveIntent
// @soulbeast-unit 0679-wbCall

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
// @soulbeast-end 0679-wbCall
// @soulbeast-unit 0741-worldAttackTarget

function worldAttackTarget(b){return b.enemies.find(x=>x.bossHelper&&x.hp>0)||b.enemies[0];}
// @soulbeast-end 0741-worldAttackTarget
// @soulbeast-unit 0762-balanceWorldUI

const balanceWorldUI=vWorld;
// @soulbeast-end 0762-balanceWorldUI
// @soulbeast-unit 0763-vWorld
vWorld=function(){let html=balanceWorldUI();const b=WORLD.room?.battle;if(b?.enemies?.some(u=>u.bossHelper)){const pets=b.enemies.filter(u=>u.bossHelper);html='<div class="card stack"><h3>อสูรตำนานที่บอสเรียกมา · Lv 40</h3>'+pets.map(u=>'<div class="row">'+portrait(u.sp,46)+'<div class="grow">'+esc(u.name)+bar(u.hp,u.st.hp)+'</div></div>').join('')+'</div>'+html;}return html;};
// @soulbeast-end 0763-vWorld
// @soulbeast-unit 0827-playWorldApply

const playWorldApply=worldApply;
// @soulbeast-end 0827-playWorldApply
// @soulbeast-unit 0828-worldApply
worldApply=function(P,a){const from=P.lv,result=playWorldApply(P,a);if(P===S.P&&P.lv>from)notifyHeroLevels(P,from);return result;};
// @soulbeast-end 0828-worldApply
// @soulbeast-unit 0881-compactWorldView

const compactWorldView=vWorld;
// @soulbeast-end 0881-compactWorldView
// @soulbeast-unit 0882-vWorld
vWorld=function(){return compactBattleReady('world')?compactOnlineBattle('world',WORLD.room):compactWorldView();};
// @soulbeast-end 0882-vWorld
// @soulbeast-unit 0895-statusWorldCard

const statusWorldCard=worldCard;
// @soulbeast-end 0895-statusWorldCard
// @soulbeast-unit 0896-worldCard
worldCard=function(u,me){return statusBattleCard(statusWorldCard(u,me),u);};
// @soulbeast-end 0896-worldCard
