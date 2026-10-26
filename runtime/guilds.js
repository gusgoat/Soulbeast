// Guild membership and guild war
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0766-guildWorldApplyBase


// Shared reward application supports ordinary legendary and crafted guild prizes.
const guildWorldApplyBase=worldApply;
// @soulbeast-end 0766-guildWorldApplyBase
// @soulbeast-unit 0767-worldApply

worldApply=function(P,a){const previous=P.worldApplied?.loot||{};guildWorldApplyBase(P,a);for(const [id,n] of Object.entries(a?.loot||{})){if(!EQ[id]||EQ[id].worldLegend)continue;const add=Math.max(0,Number(n)-Number(previous[id]||0));P.owned=P.owned||[];for(let i=0;i<add;i++)P.owned.push(id);if(add&&EQ[id].legend){P.legend=P.legend||{};P.legend[id]=1;}}};
// @soulbeast-end 0767-worldApply
// @soulbeast-unit 0768-GUILD_UI


const GUILD_UI={busy:false,data:null,error:'',request:null,confirm:null,flag:'fenrir',search:'',page:0,warRoom:null,warFinal:null,replaySerial:0};
// @soulbeast-end 0768-GUILD_UI
// @soulbeast-unit 0769-guildError

function guildError(m){return ({'guild already member':'คุณอยู่ในกิลแล้ว','guild full':'สมาชิกกิลครบ 20 คนแล้ว','guild not found':'ไม่พบกิล','guild leader required':'เฉพาะหัวหน้ากิลเท่านั้น','guild bad member':'สมาชิกไม่ถูกต้อง','guild transfer first':'โอนหัวหน้ากิลก่อนออก','guild immutable rules':'ชื่อและธงกิลเปลี่ยนไม่ได้ ต้องสมัครและรอหัวหน้าอนุมัติ','guild bad flag':'กรุณาเลือกรูปอสูรในเกม','guild bad name':'ชื่อกิลต้องยาว 2–24 ตัวอักษร','guild name exists':'ชื่อกิลนี้ถูกใช้แล้ว','guild application missing':'ใบสมัครนี้ไม่มีแล้ว','guild reward unavailable':'ไม่พบรางวัลนี้','guild war saturday':'สงครามกิลเปิดเฉพาะวันเสาร์ เวลาไทย','guild war level':'โจมตีได้เฉพาะกิลที่เลเวลต่างไม่เกิน 1','guild war bad target':'เลือกกิลฝ่ายตรงข้าม','guild war empty':'กิลเป้าหมายยังไม่มีสมาชิกที่ลงทะเบียนทีมตั้งรับ','defense required':'ต้องลงทะเบียนทีมตั้งรับก่อนโจมตี','camp pets selection':'เลือกอสูรจากกระเป๋าตามจำนวนที่อาชีพใช้ได้','guild required':'ต้องเป็นสมาชิกกิลก่อน','not enough coupons':'ต้องใช้คูปอง 10 ใบ'})[m]||pvpError(m);}
// @soulbeast-end 0769-guildError
// @soulbeast-unit 0770-guildRequest

async function guildRequest(action='guild_sync',extra={},retry=false){if(GUILD_UI.busy)return;GUILD_UI.busy=true;GUILD_UI.error='';render();try{if(!retry&&action!=='guild_sync')await communitySave();const packet=retry?GUILD_UI.request:{action,...communityAuth(),...extra,_sbRequest:crypto.randomUUID()};if(!packet)return;GUILD_UI.request=packet;const r=await lbPost(packet);if(!r.ok){GUILD_UI.request=null;throw Error(r.error);}GUILD_UI.data=r;if(r.defense){CAMP.pets=r.defense.pets;CAMP.guardPicks=null;}GUILD_UI.request=null;applyAccount(r.account);GACHA.coupons=r.coupons;if(r.warRoom)guildPlayWar(r.warRoom);}catch(e){GUILD_UI.error=guildError(e.message);}finally{GUILD_UI.busy=false;if(['guild','guildwar'].includes(S.screen))render();}}
// @soulbeast-end 0770-guildRequest
// @soulbeast-unit 0771-guildGoBase

const guildGoBase=handlers.go;
// @soulbeast-end 0771-guildGoBase
// @soulbeast-unit 0773-guildMenuTile

function guildMenuTile(war=false){return '<button class="card row" data-a="go" data-v="'+(war?'guildwar':'guild')+'" style="width:100%;text-align:left"><img src="assets/ui/'+(war?'guild-war.webp':'guild-menu.webp')+'" alt="" width="76" height="76" style="border-radius:12px"><span><b>'+(war?'สงครามกิล':'กิลและคะแนนกิจกรรม')+'</b><small style="display:block">'+(war?'ทุกวันเสาร์ · โจมตีได้คนละครั้ง':'สมาชิก 20 คน · สมัครและรอหัวหน้าอนุมัติ')+'</small></span></button>';}
// @soulbeast-end 0773-guildMenuTile
// @soulbeast-unit 0776-guildLeaderBase

const guildLeaderBase=vLeader;
// @soulbeast-end 0776-guildLeaderBase
// @soulbeast-unit 0777-vLeader
vLeader=function(){return '<div class="row wrap"><button class="btn" data-a="go" data-v="guild">อันดับคะแนนกิล</button><button class="btn" data-a="go" data-v="guildwar">อันดับสงครามกิล</button></div>'+guildLeaderBase();};
// @soulbeast-end 0777-vLeader
// @soulbeast-unit 0778-guildImage

function guildImage(g,size=56){return portrait(g.flag||'fenrir',size);}
// @soulbeast-end 0778-guildImage
// @soulbeast-unit 0779-guildPending

function guildPending(inlineCreate=false){return `${GUILD_UI.confirm&&(inlineCreate?GUILD_UI.confirm.action==='guild_create':GUILD_UI.confirm.action!=='guild_create')?'<div class="card stack" role="dialog" aria-label="ยืนยันรายการกิล"><b>'+esc(GUILD_UI.confirm.message)+'</b><div class="row"><button class="btn pri" data-a="guildConfirmAccept">ยืนยัน</button><button class="btn" data-a="guildConfirmCancel">ยกเลิก</button></div></div>':''}${!inlineCreate&&GUILD_UI.busy?'<div class="card" role="status">✦ กรุณารอ ระบบกำลังตรวจสอบรายการ…</div>':''}${!inlineCreate&&GUILD_UI.error?'<p class="card" role="alert">'+esc(GUILD_UI.error)+'</p>':''}${!inlineCreate&&GUILD_UI.error&&GUILD_UI.request?'<button class="btn" data-a="guildRetry">ตรวจผลคำขอเดิมอีกครั้ง</button>':''}`;}
// @soulbeast-end 0779-guildPending
// @soulbeast-unit 0780-guildTime

function guildTime(t){return t?new Date(t).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}):'ยังไม่มีข้อมูล';}
// @soulbeast-end 0780-guildTime
// @soulbeast-unit 0781-guildRewardView

function guildRewardView(d){return '<div class="stack">'+(d?.rewards||[]).filter(r=>!r.claimed).map(r=>'<div class="card"><b>รางวัล '+esc(r.month)+' · '+esc(r.guildName)+' อันดับ '+r.rank+'</b><p>ผลงานส่วนตัว '+fmt(r.personalPoints||0)+' คะแนน</p><p>'+fmt(r.gold)+' เหรียญ · '+Object.entries(r.loot).map(([k,n])=>esc(EQ[k]?.n||CON[k]?.n||k)+' ×'+n).join(', ')+'</p><button class="btn" data-a="guildClaim" data-v="'+esc(r.id)+'">รับรางวัล</button></div>').join('')+'</div>';}
// @soulbeast-end 0781-guildRewardView
// @soulbeast-unit 0782-vGuild

function vGuild(){const d=GUILD_UI.data,g=d?.guild;return `<div class="stack"><div class="row">${guildImage(g||{flag:GUILD_UI.flag},48)}<h2 class="grow">กิล</h2><button class="btn sm" data-a="guildRefresh">รีเฟรช</button></div>${guildPending()}${d?'<div class="card">คะแนนกิจกรรมสะสม <b>'+fmt(d.activity)+'</b> · คูปอง '+fmt(d.coupons)+'<p class="sub">ผลงานให้กิลเดือนนี้ '+fmt(d.monthPoints)+' คะแนน</p></div>':''}<details class="card"><summary>กติกา คะแนน และรางวัล</summary><p>สร้างกิล 10 คูปอง รวมหัวหน้าและสมาชิกไม่เกิน 20 คน ชื่อซ้ำไม่ได้และเปลี่ยนชื่อไม่ได้ เลือกอสูรเป็นธงหนึ่งครั้งตอนสร้าง</p><p>คะแนนกิลจาก PVP ต่างกิล: ชนะ 30 แพ้ 10 เสมอ 5 · จู่โจมค่าย (ไม่นับค่ายกิลเดียวกัน): ชนะ 20 แพ้ 5 · บอสโลกตามคะแนนแต่ละรอบ สมาชิกต้องออนไลน์ขณะจบกิจกรรม ยกเว้นชนะป้องกันสงครามกิล</p><p>เลเวลกิลสูงสุด 5 จากคะแนนสะสม 0 / 1,000 / 5,000 / 15,000 / 40,000 คะแนน วันที่ 1 เวลาไทยจัดอันดับก่อนลดคะแนนกิลปัจจุบันเหลือครึ่งหนึ่ง คะแนนสะสมส่วนบุคคลและคะแนนสะสมเลเวลไม่ลด</p><p>กิลอันดับ 1–10 รับเงิน ไอเท็ม และอุปกรณ์หลอมหรือตำนาน สมาชิกต้องอยู่กิลอย่างน้อย 7 วันและทำคะแนนในเดือนนั้น เงิน จำนวนของ และโอกาสอุปกรณ์ตำนานขึ้นกับอันดับกับคะแนนที่สมาชิกทำในเดือนนั้น กดรับได้ครั้งเดียว</p></details>
${g?`<div class="card stack"><div class="row">${guildImage(g)}<div><h3>${esc(g.name)} · Lv ${g.level}</h3><p>${fmt(g.score)} คะแนน · สมาชิก ${g.count}/20</p></div></div><p class="sub">ชื่อและธงกำหนดถาวร</p><h3>สมาชิกกิล</h3>${g.members.map(m=>`<div class="card row"><div class="grow"><b>${m.leader?'♛ ':''}${esc(m.name)}</b><p>Lv ${m.lv} · ${esc(CLS[m.cls]?.n||m.cls)}</p><p class="sub">คะแนนกิลสะสม ${fmt(m.totalPoints)} · เดือนนี้ ${fmt(m.points)}<br>${m.online?'🟢 ออนไลน์':'ออนไลน์ล่าสุด '+esc(guildTime(m.lastOnline))}</p></div>${g.isLeader&&!m.me?`<div class="stack"><button class="btn sm" data-a="guildTransfer" data-v="${esc(m.id)}">โอนหัวหน้า</button><button class="btn danger sm" data-a="guildKick" data-v="${esc(m.id)}">ปลดสมาชิก</button></div>`:''}</div>`).join('')}${g.isLeader?'<h3>ใบสมัคร '+g.applicants.length+' คน</h3>'+g.applicants.map(a=>'<div class="card"><b>'+esc(a.name)+'</b><p>Lv '+a.lv+' · '+esc(CLS[a.cls]?.n||a.cls)+'</p><div class="row"><button class="btn" data-a="guildAccept" data-v="'+esc(a.id)+'">รับสมาชิก</button><button class="btn danger" data-a="guildReject" data-v="'+esc(a.id)+'">ปฏิเสธ</button></div></div>').join(''):''}<button class="btn danger" data-a="guildLeave">${g.isLeader&&g.count===1?'ยุบกิลและออก':'ออกจากกิล'}</button></div>`:d?`<div class="card stack"><h3>สร้างกิล · 10 คูปอง</h3><label>ชื่อถาวร<input id="guildName" maxlength="24" placeholder="ชื่อกิล 2–24 ตัวอักษร"></label><label>อสูรบนธงกิล<select id="guildFlag">${Object.keys(SP).map(k=>'<option value="'+k+'" '+(k===GUILD_UI.flag?'selected':'')+'>'+esc(SP[k].n)+'</option>').join('')}</select></label>${portrait(GUILD_UI.flag,88)}<button class="btn pri" data-a="guildCreate" ${d.coupons<10?'disabled':''}>สร้างกิล</button>${guildPending(true)}</div>`:''}
${guildRewardView(d)}${guildRankingCard(d)}<details class="card stack"><summary>ค้นหาและสมัครเข้ากิล</summary><label>ค้นหาชื่อกิล<input id="guildSearch" maxlength="24" value="${esc(GUILD_UI.search)}"></label><button class="btn" data-a="guildSearch">ค้นหา</button>${(d?.guilds||[]).map(r=>`<div class="card stack"><div class="row">${guildImage(r,46)}<div class="grow"><b>${r.rank}. ${esc(r.name)} · Lv ${r.level}</b><p>${fmt(r.score)} คะแนน · ${r.count}/20</p></div></div><p>หัวหน้า ${esc(r.leader)} · Lv ${r.leaderLevel} · ${esc(CLS[r.leaderClass]?.n||r.leaderClass)}</p>${!g?'<button class="btn" data-a="'+(r.applied?'guildWithdraw':'guildApply')+'" data-v="'+esc(r.id)+'" '+(r.count>=20&&!r.applied?'disabled':'')+'>'+(r.applied?'ถอนใบสมัคร':'สมัครเข้ากิล')+'</button>':''}</div>`).join('')||'<p>ยังไม่พบกิล</p>'}<div class="row"><button class="btn sm" data-a="guildPage" data-v="${Math.max(0,(d?.page||0)-1)}" ${(d?.page||0)<=0?'disabled':''}>ก่อนหน้า</button><span>หน้า ${(d?.page||0)+1}/${d?.totalPages||1}</span><button class="btn sm" data-a="guildPage" data-v="${(d?.page||0)+1}" ${(d?.page||0)+1>=(d?.totalPages||1)?'disabled':''}>ถัดไป</button></div><p class="sub">รายชื่อสมาชิกแสดงเฉพาะคนในกิลเดียวกัน</p></details>${guildMenuTile(true)}<button class="btn" data-a="go" data-v="town">กลับเมือง</button></div>`;}
// @soulbeast-end 0782-vGuild
// @soulbeast-unit 0783-guildWarCards

function guildWarCards(units){return '<div class="row wrap">'+units.map(u=>'<div class="card grow">'+unitPortrait(u,46)+'<b>'+esc(u.name)+'</b>'+bar(u.hp,u.st.hp)+'<small>HP '+u.hp+'/'+u.st.hp+'</small></div>').join('')+'</div>';}
// @soulbeast-end 0783-guildWarCards
// @soulbeast-unit 0784-vGuildWar

function vGuildWar(){const d=GUILD_UI.data,w=d?.war,room=GUILD_UI.warRoom;return `<div class="stack"><div class="row"><img src="assets/ui/guild-war.webp" alt="สงครามกิล" width="76" height="76"><h2>สงครามกิล</h2></div>${guildPending()}<div class="card"><b>${w?.open?'เปิดสงครามวันเสาร์':'เปิดทุกวันเสาร์ 00:00–23:59 เวลาไทย'}</b><p>หนึ่งครั้งต่อสมาชิกต่อสงคราม · เลเวลกิลต่างกันได้ไม่เกิน 1</p><p>ชนะ: +100 คะแนนสงครามและคะแนนกิล · กิลฝ่ายรับแพ้เสียคะแนนกิลไม่เกิน 50 · ฝ่ายบุกแพ้ไม่เสียคะแนน แต่ใช้สิทธิ์แล้ว หากฝ่ายรับชนะ ฝ่ายรับได้คะแนน</p><p>${w?.used?'ใช้สิทธิ์รอบนี้แล้ว':'ยังไม่ใช้สิทธิ์รอบนี้'} · ${esc(w?.period||'')}</p></div>${room?'<div class="card stack"><h3>ผลสงครามกิล · '+(room.winner===0?'ชนะ':room.winner===1?'แพ้':'เสมอ')+'</h3>'+guildWarCards(room.battle.enemies)+'<div class="log">'+room.battle.log.slice(-6).map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>'+guildWarCards(room.battle.allies)+(room.replaying?'<button class="btn" data-a="guildSkipReplay">ข้ามรีเพลย์</button>':'<p>บันทึกผลที่เซิร์ฟเวอร์แล้ว</p>')+'</div>':''}<div class="card stack"><h3>เลือกกิลที่ต้องการโจมตี</h3>${!d?.guild?'<p>ต้องเข้ากิลก่อน</p>':(w?.targets||[]).map(g=>'<div class="card"><b>'+esc(g.name)+' · Lv '+g.level+'</b><p>คะแนนกิล '+fmt(g.score)+' · สงคราม '+fmt(g.warScore)+'</p><button class="btn danger" data-a="guildAttack" data-v="'+esc(g.id)+'" '+(!w.open||w.used||GUILD_UI.busy?'disabled':'')+'>สุ่มคู่ต่อสู้และโจมตี</button></div>').join('')||'<p>ไม่มีกิลในช่วงเลเวลที่โจมตีได้</p>'}<p class="sub">นักอัญเชิญและสายขั้นต่อยอดใช้อสูรจากทีมและกระเป๋าได้สูงสุด 3 ตัว · คู่ต่อสู้จะสุ่มหลังยืนยันโจมตี ไม่แสดงสมาชิกกิลเป้าหมาย</p></div><div class="card"><h3>อันดับคะแนนสงครามกิล</h3>${(d?.warLeaderboard||[]).filter((g,i)=>i<20||g.id===d?.guild?.id).map(g=>'<p>'+g.rank+'. '+esc(g.name)+' · '+fmt(g.warScore)+' คะแนน</p>').join('')||'<p>ยังไม่มีกิล</p>'}</div><button class="btn" data-a="go" data-v="guild">กลับเมนูกิล</button></div>`;}
// @soulbeast-end 0784-vGuildWar
// @soulbeast-unit 0785-guildPlayWar

function guildPlayWar(room){GUILD_UI.warFinal=JSON.parse(JSON.stringify(room));const frames=room.replay?.frames||[];if(!frames.length){GUILD_UI.warRoom=room;return;}const serial=++GUILD_UI.replaySerial,b=JSON.parse(JSON.stringify(room.replay.initial));GUILD_UI.warRoom={...room,battle:b,replaying:true};let n=0;function step(){if(serial!==GUILD_UI.replaySerial)return;if(typeof MotionTimeline!=='undefined'&&MotionTimeline.busy()){setTimeout(step,60);return;}const f=frames[n++];if(!f){GUILD_UI.warRoom=GUILD_UI.warFinal;render();return;}applyClass10Replay(b,f);for(const [id,hp,mp,status,taunt]of f.units){const u=[...b.allies,...b.enemies].find(u=>u.id===id);if(u)Object.assign(u,{hp,mp,status,taunt});}Object.assign(b,{cur:f.cur,round:f.round,log:f.log,effects:f.effects});if(S.screen==='guildwar')render();setTimeout(step,400);}step();}
// @soulbeast-end 0785-guildPlayWar
// @soulbeast-unit 0786-guildConfirm

function guildConfirm(action,extra,message){GUILD_UI.confirm={action,extra,message};render();}
// @soulbeast-end 0786-guildConfirm
// @soulbeast-unit 0787-handlers-guildConfirmCancel

handlers.guildConfirmCancel=()=>{GUILD_UI.confirm=null;render();};
// @soulbeast-end 0787-handlers-guildConfirmCancel
// @soulbeast-unit 0788-handlers-guildConfirmAccept
handlers.guildConfirmAccept=()=>{const p=GUILD_UI.confirm;if(!p)return;GUILD_UI.confirm=null;return guildRequest(p.action,p.extra);};
// @soulbeast-end 0788-handlers-guildConfirmAccept
// @soulbeast-unit 0789-handlers-guildRefresh
handlers.guildRefresh=()=>guildRequest('guild_sync',{search:GUILD_UI.search,page:GUILD_UI.page});
// @soulbeast-end 0789-handlers-guildRefresh
// @soulbeast-unit 0790-handlers-guildPage
handlers.guildPage=p=>{GUILD_UI.page=Number(p)||0;return guildRequest('guild_sync',{search:GUILD_UI.search,page:GUILD_UI.page});};
// @soulbeast-end 0790-handlers-guildPage
// @soulbeast-unit 0791-handlers-guildSearch
handlers.guildSearch=()=>{GUILD_UI.search=document.getElementById('guildSearch')?.value||'';GUILD_UI.page=0;return guildRequest('guild_sync',{search:GUILD_UI.search});};
// @soulbeast-end 0791-handlers-guildSearch
// @soulbeast-unit 0792-handlers-guildRetry
handlers.guildRetry=()=>guildRequest('',{},true);
// @soulbeast-end 0792-handlers-guildRetry
// @soulbeast-unit 0793-handlers-guildCreate
handlers.guildCreate=()=>guildConfirm('guild_create',{name:document.getElementById('guildName')?.value,flag:GUILD_UI.flag},'ใช้ 10 คูปองสร้างกิล ชื่อและธงเปลี่ยนไม่ได้ ยืนยันหรือไม่?');
// @soulbeast-end 0793-handlers-guildCreate
// @soulbeast-unit 0794-handlers-guildApply
handlers.guildApply=id=>guildRequest('guild_apply',{guildId:id});
// @soulbeast-end 0794-handlers-guildApply
// @soulbeast-unit 0795-handlers-guildWithdraw
handlers.guildWithdraw=id=>guildRequest('guild_withdraw',{guildId:id});
// @soulbeast-end 0795-handlers-guildWithdraw
// @soulbeast-unit 0796-handlers-guildAccept
handlers.guildAccept=id=>guildRequest('guild_accept',{target:id});
// @soulbeast-end 0796-handlers-guildAccept
// @soulbeast-unit 0797-handlers-guildReject
handlers.guildReject=id=>guildRequest('guild_reject',{target:id});
// @soulbeast-end 0797-handlers-guildReject
// @soulbeast-unit 0798-handlers-guildLeave
handlers.guildLeave=()=>guildConfirm('guild_leave',{},'ยืนยันออกจากกิล?');
// @soulbeast-end 0798-handlers-guildLeave
// @soulbeast-unit 0799-handlers-guildKick
handlers.guildKick=id=>guildConfirm('guild_kick',{target:id},'ยืนยันปลดสมาชิก?');
// @soulbeast-end 0799-handlers-guildKick
// @soulbeast-unit 0800-handlers-guildTransfer
handlers.guildTransfer=id=>guildConfirm('guild_transfer',{target:id},'ยืนยันโอนหัวหน้ากิล?');
// @soulbeast-end 0800-handlers-guildTransfer
// @soulbeast-unit 0801-handlers-guildClaim
handlers.guildClaim=id=>guildRequest('guild_claim',{reward:id});
// @soulbeast-end 0801-handlers-guildClaim
// @soulbeast-unit 0802-handlers-guildAttack
handlers.guildAttack=id=>guildConfirm('guild_war_attack',{guildId:id},'ใช้สิทธิ์สงครามกิลรอบนี้สุ่มคู่ต่อสู้และต่อสู้อัตโนมัติ ยืนยันหรือไม่?');
// @soulbeast-end 0802-handlers-guildAttack
// @soulbeast-unit 0803-handlers-guildSkipReplay
handlers.guildSkipReplay=()=>{GUILD_UI.replaySerial++;GUILD_UI.warRoom=GUILD_UI.warFinal;render();};
// @soulbeast-end 0803-handlers-guildSkipReplay
// @soulbeast-unit 0805-guildRankingCard


function guildRankingCard(d){return '<div class="card stack"><h3>อันดับคะแนนกิล</h3><small>20 อันดับแรกและกิลของคุณ</small>'+((d?.leaderboard||[]).filter((g,i)=>i<20||g.id===d?.guild?.id).map(g=>'<div class="row '+(g.id===d?.guild?.id?'me':'')+'"><b>'+g.rank+'. '+esc(g.name)+(g.id===d?.guild?.id?' · กิลของคุณ':'')+'</b><span>'+fmt(g.score)+' คะแนน</span></div>').join('')||'<p>ยังไม่มีกิล</p>')+'</div>';}
// @soulbeast-end 0805-guildRankingCard
// @soulbeast-unit 0864-registeredGuildWarView

const registeredGuildWarView=vGuildWar;
// @soulbeast-end 0864-registeredGuildWarView
// @soulbeast-unit 0865-vGuildWar
vGuildWar=function(){let h=registeredGuildWarView(),d=GUILD_UI.data;if(d?.guild){const panel='<section class="card stack"><h3>ทีมตั้งรับค่ายและสงครามกิล</h3><p>ใช้ทีมตั้งรับเดียวกับอสูรเฝ้าค่าย ต้องลงทะเบียนก่อนโจมตี ระบบใช้เฉพาะอสูรตั้งรับที่ลงทะเบียนไว้เมื่อถูกโจมตี</p>'+campTeamPicker('campGuardPets','เลือกทีมตั้งรับจากกระเป๋า')+'<button class="btn pri" data-a="guildDefenseSave" '+(GUILD_UI.busy?'disabled':'')+'>ลงทะเบียนทีมตั้งรับ</button><small>'+(d.defense?.ready?'ลงทะเบียนแล้ว · '+d.defense.pets.length+' ตัว':'ยังไม่ได้ลงทะเบียนทีมตั้งรับ')+'</small></section>';h=h.replace('<div class="card"><b>',panel+'<div class="card"><b>');if(!d.defense?.ready||!configuredDefenseReady())h=h.replace(/<button[^>]*data-a="guildAttack"[^>]*>/g,b=>b.includes('disabled')?b:b.replace('<button','<button disabled'));}return h;};
// @soulbeast-end 0865-vGuildWar
// @soulbeast-unit 0866-handlers-guildDefenseSave

handlers.guildDefenseSave=()=>{const pets=[...campSelection('campGuardPets')];if(!pets.length)return toast('เลือกอสูรตั้งรับก่อน');return guildRequest('guild_defense',{pets});};
// @soulbeast-end 0866-handlers-guildDefenseSave
// @soulbeast-unit 0872-handlers-guildBattleClose

handlers.guildBattleClose=()=>{GUILD_UI.replaySerial++;GUILD_UI.warRoom=null;GUILD_UI.warFinal=null;render();};
// @soulbeast-end 0872-handlers-guildBattleClose
// @soulbeast-unit 0885-compactGuildView

const compactGuildView=vGuildWar;
// @soulbeast-end 0885-compactGuildView
// @soulbeast-unit 0886-vGuildWar
vGuildWar=function(){return compactBattleReady('guildwar')?compactOnlineBattle('guildwar',GUILD_UI.warRoom):compactGuildView();};
// @soulbeast-end 0886-vGuildWar
