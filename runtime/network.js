// Transport, retries and request errors
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0233-onlineSkillEffects

function onlineSkillEffects(before,after,screen){if(!before||!after||S.screen!==screen||!after.battle)return;if(after.rev<=before.rev&&(after.battle.turns||0)<=(before.battle?.turns||0))return;const fx=after.battle.effects||[];if(!fx.length)return;VQ.push(...fx.slice(-64));(window.requestAnimationFrame||setTimeout)(flushVfx);}
// @soulbeast-end 0233-onlineSkillEffects
// @soulbeast-unit 0326-sheetRequest

async function sheetRequest(options){const c=new AbortController(),timer=setTimeout(()=>c.abort(),25000);try{const r=await fetch(SHEET_URL, {...options,signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!j||typeof j.ok!=='boolean')throw new Error('Invalid response');return j}finally{clearTimeout(timer)}}
// @soulbeast-end 0326-sheetRequest
// @soulbeast-unit 0332-sheetError

function sheetError(r){return ({pin:'PIN ไม่ถูกต้องหรือไม่ตรงกับเซฟบน ระบบออนไลน์',notfound:'ไม่พบรหัสผู้เล่นนี้','bad id':'โปรดอัปเดต ระบบออนไลน์ เป็นเวอร์ชันใหม่','bad code':'รหัสผู้เล่นไม่ถูกต้อง','too big':'ข้อมูลเซฟใหญ่เกินพื้นที่ที่รองรับ','bad data':'ข้อมูลเซฟไม่ถูกต้อง','bad pin':'PIN ต้องเป็นตัวเลขหรือตัวอักษร 4–12 ตัว',busy:'เซิร์ฟเวอร์กำลังทำงาน โปรดลองอีกครั้ง'})[r&&r.error]||'ดำเนินการไม่สำเร็จ โปรดตรวจการเชื่อมต่อและการ Deploy';}
// @soulbeast-end 0332-sheetError
// @soulbeast-unit 0436-onlineRoom



function onlineRoom(mode){return mode==='pvp'?PVP.room:WORLD.room}
// @soulbeast-end 0436-onlineRoom
// @soulbeast-unit 0437-onlineSeconds

function onlineSeconds(mode){const r=onlineRoom(mode);return !r?0:Math.max(0,Math.ceil((r.deadline-(Date.now()-(mode==='pvp'?(PVP.clock||0):WORLD.clock)))/1000))}
// @soulbeast-end 0437-onlineSeconds
// @soulbeast-unit 0438-onlineAutoButton

function onlineAutoButton(mode){if(onlineRoom(mode)?.replaying)return '<span class="chip">กำลังแสดงการต่อสู้ในเครื่อง</span>';if(mode==='world')return '<span class="chip">ต่อสู้อัตโนมัติเท่านั้น</span>';const r=onlineRoom(mode);if(!r||!['lobby','active'].includes(r.status))return '';const auto=!!r.players[r.me]?.auto,busy=mode==='pvp'?PVP.busy:WORLD.busy;return `<button class="btn ${auto?'pri':''}" data-a="onlineAuto" data-v="${mode}" aria-pressed="${auto}" ${busy?'disabled':''}>⚙ สู้ออโต้ ${auto?'เปิด':'ปิด'} · ตัวละครและอสูร</button>`}
// @soulbeast-end 0438-onlineAutoButton
// @soulbeast-unit 0439-onlineClockMarkup

function onlineClockMarkup(){return '<aside id="turnClockPopup" class="turn-clock-popup" hidden role="status" aria-live="polite"><span class="clock-face" aria-hidden="true">◷</span><div><b>ใกล้หมดเวลา!</b><small id="turnClockText"></small></div></aside>'}
// @soulbeast-end 0439-onlineClockMarkup
// @soulbeast-unit 0440-ONLINE_WARNED

let ONLINE_WARNED='';
// @soulbeast-end 0440-ONLINE_WARNED
// @soulbeast-unit 0441-onlineClockTick

function onlineClockTick(){const hiddenClock=document.getElementById('turnClockPopup');if(hiddenClock)hiddenClock.hidden=true;return; const mode=S.screen==='pvp'?'pvp':S.screen==='world'?'world':null,r=mode&&onlineRoom(mode),popup=document.getElementById('turnClockPopup');if(!mode||!r||r.status!=='active'||document.hidden){if(popup)popup.hidden=true;return}const secs=onlineSeconds(mode),counter=document.getElementById(mode==='pvp'?'pvpCountdown':'wbCountdown');if(counter)counter.textContent='เหลือ '+secs+' วินาที';const units=[...r.battle.allies,...r.battle.enemies],actor=units.find(u=>u.id===r.battle.cur),mine=actor?.owner===r.me,near=mine&&secs<=5;
 if(popup)popup.hidden=!near;const label=document.getElementById('turnClockText');if(near&&label)label.textContent=secs?'เหลือ '+secs+' วินาที · หมดเวลาระบบเลือกท่าให้':'หมดเวลา · ระบบกำลังเลือกท่าให้';
 const key=mode+':'+r.id+':'+r.battle.cur+':'+r.deadline;if(near&&secs>0&&ONLINE_WARNED!==key){ONLINE_WARNED=key;if(Sound.enabled)ExtraAudio.play('warn');}}
// @soulbeast-end 0441-onlineClockTick
// @soulbeast-unit 0618-communityBaseSheetError

const communityBaseSheetError=sheetError;
// @soulbeast-end 0618-communityBaseSheetError
// @soulbeast-unit 0619-sheetError

sheetError=function(r){return ['gacha stale','account banned','clear count jump'].includes(r?.error)?communityError(r.error):communityBaseSheetError(r);};
// @soulbeast-end 0619-sheetError
// @soulbeast-unit 0663-ONLINE_UI-ONLINE_NET


const ONLINE_UI={count:0,label:'',retry:false},ONLINE_NET={queue:[],running:false,sequence:0};
// @soulbeast-end 0663-ONLINE_UI-ONLINE_NET
// @soulbeast-unit 0664-onlineMessage

function onlineMessage(error){const text=String(error?.message||error||'');return ({busy:ct('ระบบกำลังมีผู้ใช้งานพร้อมกัน กรุณารอสักครู่แล้วลองอีกครั้ง','The server is busy. Please wait a moment and retry.','服务器繁忙，请稍候重试。'),'room too big':ct('ข้อมูลห้องมีขนาดใหญ่เกินไป กรุณาตรวจสถานะห้องอีกครั้ง','Room data is too large. Please check the room status.','房间数据过大，请重新查看状态。'),'room not found':ct('ไม่พบห้องหรือห้องปิดไปแล้ว','Room not found or already closed','房间不存在或已关闭'),'world pets':ct('เลือกอสูรที่พกติดตัวก่อนสร้างห้อง','Select a carried beast before creating a room','创建房间前请选择携带妖兽'),'not lobby':ct('ห้องเริ่มแล้วหรือปิดไปแล้ว','Room started or closed','房间已开始或关闭'),'world weekly limit':ct('ใช้สิทธิ์บอสโลกครบ 3 ครั้งในสัปดาห์นี้แล้ว','All 3 weekly World Boss entries are used','本周3次世界首领次数已用完'),'world ready':ct('ทุกคนต้องยืนยันพร้อมก่อนเริ่ม','Everyone must be ready before starting','所有玩家准备后才能开始'),'finish other battle':ct('จบการต่อสู้อื่นและออกจากป่าก่อน','Finish other battles and leave the forest first','请先结束其他战斗并离开森林'),'pin':ct('PIN ไม่ตรงกับเซฟออนไลน์','Online save PIN does not match','在线存档PIN不匹配')})[text]||text;}
// @soulbeast-end 0664-onlineMessage
// @soulbeast-unit 0665-ONLINE_LABELS

const ONLINE_LABELS={wb_create:['กำลังสร้างปาร์ตี้บอสโลก','Creating a World Boss party','正在创建世界首领队伍'],wb_join:['กำลังเข้าร่วมปาร์ตี้','Joining the party','正在加入队伍'],wb_leave:['กำลังออกจากห้อง','Leaving the room','正在退出房间'],wb_start:['กำลังประมวลผลการต่อสู้บอสโลก','Processing the World Boss battle','正在处理世界首领战斗'],wb_ready:['กำลังยืนยันความพร้อม','Confirming readiness','正在确认准备'],save:['กำลังบันทึกเซฟออนไลน์','Saving online','正在保存在线存档'],load:['กำลังโหลดเซฟออนไลน์','Loading online save','正在读取在线存档']};
// @soulbeast-end 0665-ONLINE_LABELS
// @soulbeast-unit 0666-onlineOverlay

function onlineOverlay(){return `<div class="online-wait-overlay" role="dialog" aria-modal="true" aria-labelledby="onlineWaitTitle" tabindex="-1"><div class="gacha-draw-panel"><div class="online-hourglass" aria-hidden="true"><img src="assets/ui/online-hourglass.webp" alt="" width="280" height="280"><i></i></div><h2 id="onlineWaitTitle" translate="no">${ONLINE_UI.label||ct('กรุณารอ ระบบกำลังดำเนินการ','Please wait — processing your request','请稍候，系统正在处理请求')}</h2><p role="status" aria-live="polite" translate="no">${ONLINE_UI.retry?ct('ระบบกำลังตรวจสถานะและลองเชื่อมต่ออีกครั้ง…','Checking the status and reconnecting…','正在核验状态并重新连接…'):ct('กรุณารอการตอบกลับจากระบบ…','Waiting for the server response…','正在等待服务器响应…')}</p><div class="summoning-progress" aria-hidden="true"><i></i></div><small translate="no">${ct('กรุณาเปิดหน้านี้ไว้ ระบบกำลังตรวจและบันทึกรายการให้ครบถ้วน','Keep this page open while the server checks and completes your request.','请保持页面打开，服务器正在核验并完成请求。')}</small></div></div>`;}
// @soulbeast-end 0666-onlineOverlay
// @soulbeast-unit 0667-onlineShow

function onlineShow(){if(!ONLINE_UI.count||GACHA.busy)return;const app=document.getElementById('app');if(!app?.insertAdjacentHTML||app.querySelector('.online-wait-overlay'))return;app.insertAdjacentHTML('beforeend',onlineOverlay());for(const el of app.children||[])if(!el.classList.contains('online-wait-overlay'))el.inert=true;app.querySelector('.online-wait-overlay')?.focus?.({preventScroll:true});}
// @soulbeast-end 0667-onlineShow
// @soulbeast-unit 0668-withOnline

async function withOnline(label,fn){const first=!ONLINE_UI.count;ONLINE_UI.count++;if(first){ONLINE_UI.label=ct(...(ONLINE_LABELS[label]||['กรุณารอ ระบบกำลังดำเนินการ','Please wait — processing your request','请稍候，系统正在处理请求']));ONLINE_UI.retry=false;}onlineShow();try{return await fn();}finally{ONLINE_UI.count--;if(!ONLINE_UI.count){document.querySelector('.online-wait-overlay')?.remove?.();const app=document.getElementById('app');for(const el of app?.children||[])el.inert=false;ONLINE_UI.retry=false;}else onlineShow();}}
// @soulbeast-end 0668-withOnline
// @soulbeast-unit 0671-onlinePause

function onlinePause(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
// @soulbeast-end 0671-onlinePause
// @soulbeast-unit 0672-onlineFetch

async function onlineFetch(options,foreground){for(let attempt=0;attempt<3;attempt++){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),foreground?60000:25000);
 try{const response=await fetch(SHEET_URL,{...options,signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const result=await response.json();if(!result||typeof result.ok!=='boolean')throw Error('Invalid response');if(result.error==='busy'&&attempt<2){ONLINE_UI.retry=true;await onlinePause(700+attempt*700+Math.floor(Math.random()*300));continue;}return result.error==='busy'?{...result,error:onlineMessage('busy')}:result;
 }catch(error){const failure=Error(ct('การตอบกลับขาดหายหรือใช้เวลานาน ระบบจะตรวจสถานะห้องให้ หากยังไม่สำเร็จให้กดตรวจข้อมูลอีกครั้ง','The response was interrupted or timed out. The room status will be checked; refresh its status if needed.','响应中断或超时，系统将核验房间状态；必要时请刷新状态。'));failure.onlineTransport=true;throw failure;}finally{clearTimeout(timer);}
}}
// @soulbeast-end 0672-onlineFetch
// @soulbeast-unit 0673-onlineDrain

async function onlineDrain(){if(ONLINE_NET.running)return;ONLINE_NET.running=true;try{while(ONLINE_NET.queue.length){ONLINE_NET.queue.sort((a,b)=>a.priority-b.priority||a.order-b.order);const job=ONLINE_NET.queue.shift();try{job.resolve(await onlineFetch(job.options,job.priority===0));}catch(e){job.reject(e);}}}finally{ONLINE_NET.running=false;}}
// @soulbeast-end 0673-onlineDrain
// @soulbeast-unit 0674-sheetRequest

sheetRequest=function(options){return new Promise((resolve,reject)=>{ONLINE_NET.queue.push({options,priority:ONLINE_UI.count||GACHA.busy?0:1,order:ONLINE_NET.sequence++,resolve,reject});onlineDrain();});};
// @soulbeast-end 0674-sheetRequest
// @soulbeast-unit 0707-sheetRequest

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
// @soulbeast-end 0707-sheetRequest
// @soulbeast-unit 0711-sbSheetError

const sbSheetError=sheetError;
// @soulbeast-end 0711-sbSheetError
// @soulbeast-unit 0712-sheetError
sheetError=function(r){return r?.error==='migration load required'?ct('กรุณาโหลดเซฟออนไลน์ที่ตรวจย้ายแล้วก่อนใช้ระบบออนไลน์','Load the verified online save before using online features.','请先读取已核验的在线存档，再使用在线功能。'):sbSheetError(r);};
// @soulbeast-end 0712-sheetError
// @soulbeast-unit 0867-ONLINE_COMPACT


// Presentation only: keep authenticated rooms, targeting, commands and rewards intact.
const ONLINE_COMPACT={key:'',hidden:false,details:false,effectStamp:''};
// @soulbeast-end 0867-ONLINE_COMPACT
// @soulbeast-unit 0870-handlers-onlineCommands

handlers.onlineCommands=()=>{ONLINE_COMPACT.hidden=!ONLINE_COMPACT.hidden;render();};
// @soulbeast-end 0870-handlers-onlineCommands
// @soulbeast-unit 0871-handlers-onlineBattleDetails

handlers.onlineBattleDetails=()=>{ONLINE_COMPACT.details=!ONLINE_COMPACT.details;ONLINE_COMPACT.hidden=false;render();};
// @soulbeast-end 0871-handlers-onlineBattleDetails
// @soulbeast-unit 0874-compactOnlineCard

function compactOnlineCard(u,mode,r,own){
 const selected=mode==='pvp'?(own?PVP.friend:PVP.target)===u.id:mode==='world'&&WORLD.friend===u.id;
 const action=mode==='pvp'?(own?'pvpFriend':'pvpTarget'):mode==='world'?'wbFriend':mode==='camp'?(own?'campFriend':'campTarget'):'';
 const image=u.kind==='player'&&!u.form?(u.owner===r.me?'player':'cls:'+u.cls):u.img||u.sp;
 const immortal=mode==='world'&&u.immortalWorld;
 const statuses=Object.keys(u.status||{}).filter(k=>STS[k]).map(k=>STS[k].n).join(' · ');
 return statusBattleCard('<button class="battle-vital '+(u.hp<=0?'down ':'')+(u.id===r.battle.cur?'acting ':'')+(selected?'selected':'')+'" '+(action?'data-a="'+action+'" data-v="'+esc(u.id)+'" ':'')+(!own&&u.hp<=0?'disabled ':'')+'title="'+esc(u.name)+' · Lv '+u.lv+(statuses?' · '+esc(statuses):'')+'"><span class="battle-face" data-u="'+esc(u.id)+'">'+portrait(image,28,{form:u.evo||0})+'</span><div class="battle-meter"><b><span class="online-unit-name" data-user-content>'+esc(u.name)+'</span> <small class="battle-level">Lv '+u.lv+'</small></b>'+bar(immortal?u.st.hp:u.hp,u.st.hp)+'<small>HP '+(immortal?'∞':fmt(u.hp)+'/'+fmt(u.st.hp))+'</small>'+bar(u.mp,u.st.mp,'mp')+'<small>MP '+fmt(u.mp)+'/'+fmt(u.st.mp)+'</small>'+(statuses?'<span class="online-unit-status">'+esc(statuses)+'</span>':'')+'</div></button>',u);
}
// @soulbeast-end 0874-compactOnlineCard
// @soulbeast-unit 0875-compactOnlineSide

function compactOnlineSide(units,title,mode,r,own){const cols=mode==='world'&&own?4:units.length>9?4:units.length>4?3:units.length>1?2:1;return '<section class="online-combat-side"><small>'+title+' · '+units.filter(u=>u.hp>0).length+'/'+units.length+'</small><div class="online-unit-grid" style="--unit-cols:'+cols+'">'+units.map(u=>compactOnlineCard(u,mode,r,own)).join('')+'</div></section>';}
// @soulbeast-end 0875-compactOnlineSide
// @soulbeast-unit 0877-compactOnlineResult

function compactOnlineResult(mode,r){if(mode==='world'){const v=r.reward;return '<b>จบการท้าทาย · คะแนน '+fmt(r.sharedScore||0)+'</b><p>'+fmt(v?.gold||0)+' เหรียญ · EXP '+fmt(v?.xp||0)+' · พลัง '+fmt(v?.power||0)+'</p>'+Object.entries(v?.loot||{}).map(([id,n])=>'<p>✦ '+esc(EQ[id]?.n||CON[id]?.n||id)+' ×'+n+'</p>').join('');}
 return '<b>'+(r.winner<0?'เสมอ':r.winner===(r.me??0)?'ชนะ':'แพ้')+'</b><p>'+esc(r.reason||'บันทึกผลแล้ว')+'</p>'+(mode==='pvp'?'<small>ผลเดิมพันบันทึกบนเซิร์ฟเวอร์แล้ว</small>':mode==='camp'?'<small>เงินปัจจุบัน '+fmt(S.P.gold)+' เหรียญ · บันทึกผลจู่โจมแล้ว</small>':'<small>บันทึกคะแนนสงครามกิลแล้ว</small>');}
// @soulbeast-end 0877-compactOnlineResult
// @soulbeast-unit 0878-compactOnlineBattle

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
// @soulbeast-end 0878-compactOnlineBattle
// @soulbeast-unit 0899-onlineClockTick

onlineClockTick=function(){const clock=document.getElementById('pvpTurnTimer');if(clock)clock.textContent=pvpTurnTimeText();const popup=document.getElementById('turnClockPopup');if(popup)popup.hidden=true;const r=PVP.room;if(S.screen!=='pvp'||!r||r.replaying||r.status!=='active'||!PVP.token||PVP.busy||document.hidden)return;const actor=[...r.battle.allies,...r.battle.enemies].find(u=>u.id===r.battle.cur);if(r.players[actor?.owner]?.auto||Date.now()-(PVP.clock||0)<r.deadline)return;const stamp=r.id+':'+r.rev+':'+r.deadline;if(PVP_TIMEOUT_POLL===stamp)return;PVP_TIMEOUT_POLL=stamp;pvpRequest({action:'pvp_poll'},true);};
// @soulbeast-end 0899-onlineClockTick
