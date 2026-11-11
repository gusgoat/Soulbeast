'use strict';
const API='https://zycmmtvubzyxduxqpuzl.supabase.co',KEY='sb_publishable_-m9RbNVXYhaKjUZYSGGdMQ_rrkCuEL6';
const STORE='soulbeast_admin_session_v1',INTENT='soulbeast_admin_pending_v1';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sharedGameClient=null;
let session=null,players=[],selected=null,prepared=null,confirmation=null,busy=false,adminEmail='',pending=null;
const fmt=n=>n==null?'—':Number(n).toLocaleString('th-TH');
function notice(message,error=false){$('notice').textContent=message;$('notice').className=error?'error':'';$('notice').hidden=false;let target=$('notice');if($('manage').open){let n=$('manageNotice');if(!n){n=document.createElement('p');n.id='manageNotice';n.setAttribute('role','status');$('selectedInfo').after(n);}n.textContent=message;n.className=error?'error':'backup-ok';target=n;}if(pending){const b=document.createElement('button');b.textContent='ตรวจรายการค้าง / ลองอีกครั้ง';b.className='quiet';b.addEventListener('click',retryPending);target.append(document.createElement('br'),b);}}
const errors={admin_access_denied:'บัญชีนี้ยังไม่มีสิทธิ์แอดมิน หรือยังไม่ได้ยืนยันอีเมล',invalid_coupon_balance:'ลดคูปองไม่ได้: ยอดคงเหลือไม่พอ หรือยอดเกินขอบเขต',invalid_coupon_amount:'กรุณาใส่จำนวนเต็ม 1–1,000,000',player_not_found:'ไม่พบไอดีนี้ กรุณาอัปเดตรายชื่อ',ban_reason_required:'กรุณาระบุเหตุผลการแบน',backup_required:'กรุณาสำรองข้อมูลใหม่ก่อนลบ',confirmation_code_mismatch:'รหัสผู้เล่นที่ยืนยันไม่ตรงกัน',request_payload_changed:'รหัสรายการนี้ถูกใช้แล้ว กรุณาตรวจประวัติก่อน',live_game_not_active:'ระบบออนไลน์ยังไม่พร้อม กรุณาลองใหม่ภายหลัง',invalid_credentials:'อีเมลหรือรหัสผ่านไม่ถูกต้อง',email_not_confirmed:'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',over_email_send_rate_limit:'ส่งอีเมลถี่เกินไป กรุณารอสักครู่แล้วลองใหม่',user_already_exists:'อีเมลนี้มีบัญชีแล้ว ให้เข้าสู่ระบบหรือลืมรหัสผ่าน'};
function message(e){if(['session_expired','session_not_found','refresh_token_not_found'].includes(e.code))return 'เซสชันแอดมินหมดอายุ ให้ใช้บัญชีเกมที่ล็อกอินอยู่ หรือเข้าสู่ระบบแอดมินใหม่';const raw=String(e.message||e.code||'');if(e.code==='42501')return errors.admin_access_denied;if(raw.includes('expired'))return 'การเตรียมลบหมดอายุ กรุณาสำรองใหม่';if(raw.includes('permanently deleted'))return 'ไอดีที่ลบถาวรแล้วไม่สามารถปลดแบนได้';return errors[e.code]||errors[raw]||'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง หากเป็นรายการแก้ไข ให้ตรวจรายการค้างก่อนทำใหม่';}
function setSession(s){session=s;if(s)sessionStorage.setItem(STORE,JSON.stringify(s));else sessionStorage.removeItem(STORE);}
async function request(path,body,token){let response;try{response=await fetch(API+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});}catch{const e=Error('network');e.uncertain=true;throw e;}let data;try{data=await response.json();}catch{const e=Error('network');e.uncertain=true;throw e;}if(!response.ok){const e=Error(data.message||data.msg||data.error_description||data.error||'network');e.code=data.error_code||data.code||e.message;e.status=response.status;e.uncertain=response.status>=500;throw e;}return data;}
async function gameClient(){if(!sharedGameClient){const {AccountClient}=await import('./client/account-client.mjs?v=admin-session-20261107');sharedGameClient=new AccountClient({storage:localStorage,gameSession:false,lock:fn=>navigator.locks?.request?navigator.locks.request('soulbeast_shop_test_auth_v1-refresh',fn):fn()});}return sharedGameClient;}
async function useGameSession(email=null){const c=await gameClient();if(!c.sessions.read())return false;const cachedEmail=c.sessions.read()?.user?.email;if(email&&cachedEmail&&cachedEmail.toLowerCase()!==email.toLowerCase())return false;const user=await c.identity();if(email&&user.email?.toLowerCase()!==email.toLowerCase())return false;const existing=session;session={...c.sessions.read(),sharedGame:true};try{await enter();sessionStorage.removeItem(STORE);notice('ใช้เซสชันเกมเดิมเข้าสู่แอดมินแล้ว · ไม่ล็อกเอาต์เกม');return true;}catch(e){session=existing;throw e;}}
async function refreshSession(){if(session?.sharedGame){const c=await gameClient();await c.sessions.token(true);session={...c.sessions.read(),sharedGame:true};return;}if(!session?.refresh_token)throw Error('invalid_credentials');const next=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token});setSession(next);}
async function rpc(action,payload={},name='sb_mobile_admin'){if(session?.sharedGame){const c=await gameClient();session={...c.sessions.read(),access_token:await c.sessions.token(),sharedGame:true};}if(!session?.access_token)throw Error('invalid_credentials');try{return await request('/rest/v1/rpc/'+name,{p_action:action,[name==='sb_manual_topup_admin'?'p_data':'p_payload']:payload},session.access_token);}catch(e){if(e.status===401){await refreshSession();return request('/rest/v1/rpc/'+name,{p_action:action,[name==='sb_manual_topup_admin'?'p_data':'p_payload']:payload},session.access_token);}throw e;}}
async function working(fn){if(busy)return;busy=true;$('busy').hidden=false;$('busy').showModal();const buttons=[...document.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);try{await fn();}catch(e){notice(message(e),true);}finally{buttons.forEach(([b,d])=>b.disabled=d);busy=false;$('busy').close();$('busy').hidden=true;updateDeleteEnabled();}}
function clearPrivateView(){players=[];selected=null;prepared=null;confirmation=null;adminEmail='';pending=null;$('players').textContent='';clearTopups();$('history').textContent='';$('dashboard').hidden=true;$('logout').hidden=true;$('auth').hidden=false;$('recovery').hidden=true;for(const d of document.querySelectorAll('dialog[open]'))d.close();}
function restoreIntent(){try{const p=JSON.parse(sessionStorage.getItem(INTENT)||'null');pending=p?.email===adminEmail?p:null;}catch{pending=null;}}
async function enter(){const id=await rpc('identity');adminEmail=id.email;$('identity').textContent=adminEmail;$('auth').hidden=true;$('recovery').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;restoreIntent();await loadPlayers();await loadTopupsSafely();if(pending)notice('มีรายการที่ยังไม่ทราบผล กรุณาตรวจรายการค้างก่อนทำรายการใหม่',true);}
async function loadPlayers(){const r=await rpc('players');players=r.players;$('playerCount').textContent=players.length;$('bannedCount').textContent=players.filter(p=>p.banned===true).length;$('updatedAt').textContent=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});renderPlayers();}
function renderPlayers(){const query=$('search').value.toLocaleLowerCase(),sort=$('sort').value,list=players.filter(p=>[p.name,p.code,p.class].some(x=>String(x||'').toLocaleLowerCase().includes(query))).slice();list.sort((a,b)=>sort==='name'?String(a.name).localeCompare(String(b.name),'th'):Number(b[sort]||0)-Number(a[sort]||0)||String(a.code).localeCompare(String(b.code)));$('players').innerHTML=list.length?list.map(p=>`<article class="player"><div class="player-head"><h3>${esc(p.name||'ไร้ชื่อ')}</h3><span class="badge ${p.banned?'banned':''}">${p.banned?'ถูกแบน':'ปกติ'}</span></div><p class="code">${esc(p.code)}</p><p class="muted">Lv ${esc(p.level)} · ${esc(p.class)}</p><div class="metrics"><div><span>คะแนน</span><b>${fmt(p.score)}</b></div><div><span>คูปอง</span><b>${fmt(p.coupons)}</b></div><div><span>เงิน</span><b>${fmt(p.gold)}</b></div><div><span>อสูรตำนาน / อุปกรณ์ตำนาน</span><b>${fmt(p.legendaryPets)} / ${fmt(p.legendaryGear)}</b></div></div><p class="fine">ออนไลน์ล่าสุด ${p.lastOnline?esc(new Date(p.lastOnline).toLocaleString('th-TH')):'ยังไม่มีข้อมูล'}${p.inactiveProtected?' · ยกเว้นลบอัตโนมัติ':''}</p>${p.coupons==null?'<p class="fine">ยังไม่มีบัญชีคูปอง</p>':''}<button class="quiet" data-player="${esc(p.code)}">ดูข้อมูล / จัดการ</button></article>`).join(''):'<div class="panel muted">ไม่พบผู้เล่นตามคำค้น</div>';}
function openPlayer(code){selected=players.find(p=>p.code===code);if(!selected)return;prepared=null;$('manageNotice')?.remove();$('selectedName').textContent=selected.name;$('selectedCode').textContent=selected.code;$('selectedInfo').textContent=`Lv ${selected.level} · ${selected.class} · คะแนน ${fmt(selected.score)} · คูปอง ${fmt(selected.coupons)}`;$('couponForm').reset();$('banReason').value='';$('banTitle').textContent=selected.banned?'สถานะ: ถูกแบน':'สถานะ: ปกติ';$('banButton').textContent=selected.banned?'ปลดแบนผู้เล่น':'แบนผู้เล่น';$('deleteStage').hidden=true;$('deleteCode').value='';$('deleteAgree').checked=false;updateDeleteEnabled();$('manage').showModal();}
function ask(title,text,action,payload){if(pending){notice('กรุณาตรวจรายการค้างก่อนเริ่มรายการใหม่',true);return;}confirmation={action,payload};$('confirmTitle').textContent=title;$('confirmText').textContent=text;$('confirmAction').showModal();}
function updateDeleteEnabled(){$('confirmDelete').disabled=busy||!prepared||$('deleteCode').value!==selected?.code||!$('deleteAgree').checked;}
async function mutate(action,payload){if(pending)throw Error('request_payload_changed');pending={email:adminEmail,action,payload:{...payload,request:crypto.randomUUID()}};sessionStorage.setItem(INTENT,JSON.stringify(pending));await sendPending();}
async function sendPending(){const intent=pending;let result;try{result=await rpc(intent.action,intent.payload);}catch(e){if(!e.uncertain){pending=null;sessionStorage.removeItem(INTENT);}throw e;}pending=null;sessionStorage.removeItem(INTENT);if(intent.action==='prepare_delete'){selected=players.find(p=>p.code===intent.payload.code)||result.player;prepared=result;$('deleteTarget').textContent=`${result.player.name} · ${result.player.code} · Lv ${result.player.level} · ${result.player.class} · สำรองพร้อมใช้ 30 นาที`;$('deleteStage').hidden=false;$('deleteCode').value='';$('deleteAgree').checked=false;if(!$('manage').open)openPreparedPlayer(result);notice('สำรองสำเร็จ ตรวจเป้าหมายและพิมพ์รหัสเต็มเพื่อยืนยันลบ');updateDeleteEnabled();return;}
const success=intent.action==='coupons'?`ปรับคูปองสำเร็จ ${intent.payload.code}: ${fmt(result.before)} ${result.delta>0?'+':'−'} ${fmt(Math.abs(result.delta))} = ${fmt(result.after)} ใบ`:intent.action==='ban'?`${intent.payload.banned?'แบน':'ปลดแบน'} ${intent.payload.code} สำเร็จ`:`ลบไอดี ${intent.payload.code} แล้ว เก็บสำรองไว้ในระบบแอดมิน`;
$('manage').close();prepared=null;notice(success);try{await loadPlayers();}catch{notice(success+' · ยังอัปเดตรายชื่อไม่ได้ กรุณากดอัปเดตอีกครั้ง');}}
function openPreparedPlayer(result){openPlayer(result.player.code);prepared=result;$('deleteTarget').textContent=`${result.player.name} · ${result.player.code} · สำรองพร้อมใช้ 30 นาที`;$('deleteStage').hidden=false;}
function retryPending(){if(pending)working(sendPending);}
$('loginForm').addEventListener('submit',e=>{e.preventDefault();working(async()=>{const email=$('email').value.trim(),password=$('password').value;if(await useGameSession(email)){$('password').value='';return;}const s=await request('/auth/v1/token?grant_type=password',{email,password});$('password').value='';setSession(s);try{await enter();notice('เข้าสู่ระบบแอดมินแล้ว');}catch(err){setSession(null);clearPrivateView();throw err;}});});
$('useGameSession').addEventListener('click',()=>working(async()=>{if(!await useGameSession())notice('กรุณาเข้าสู่ระบบเกมบนเบราว์เซอร์นี้ก่อน หรือใช้อีเมลแอดมินแยกจากบัญชีเกม',true);}));
$('signup').addEventListener('click',()=>working(async()=>{if(!$('loginForm').reportValidity())return;const email=$('email').value.trim(),password=$('password').value;await request('/auth/v1/signup?redirect_to='+encodeURIComponent(location.origin+location.pathname),{email,password});$('password').value='';notice('ส่งคำขอสร้างบัญชีแล้ว กรุณาเปิดอีเมลเพื่อยืนยัน แล้วกลับมาเข้าสู่ระบบ หากมีบัญชีแล้ว ให้ใช้เข้าสู่ระบบหรือลืมรหัสผ่าน');}));
$('forgot').addEventListener('click',()=>working(async()=>{if(!$('email').reportValidity())return;await request('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+location.pathname),{email:$('email').value.trim()});notice('ส่งคำขอแล้ว หากอีเมลมีบัญชีอยู่ คุณจะได้รับลิงก์ตั้งรหัสผ่านใหม่');}));
$('resetForm').addEventListener('submit',e=>{e.preventDefault();working(async()=>{const response=await fetch(API+'/auth/v1/user',{method:'PUT',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({password:$('newPassword').value}),signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('network');$('newPassword').value='';await enter();notice('เปลี่ยนรหัสผ่านแล้ว');});});
$('logout').addEventListener('click',()=>working(async()=>{const token=session?.sharedGame?null:session?.access_token;setSession(null);clearPrivateView();$('notice').hidden=true;if(token)try{await request('/auth/v1/logout?scope=local',{},token);}catch{};}));
$('refresh').addEventListener('click',()=>working(loadPlayers));$('search').addEventListener('input',renderPlayers);$('sort').addEventListener('change',renderPlayers);
$('players').addEventListener('click',e=>{const button=e.target.closest('[data-player]');if(button)openPlayer(button.dataset.player);});
$('closeManage').addEventListener('click',()=>$('manage').close());$('cancelAction').addEventListener('click',()=>{confirmation=null;$('confirmAction').close();});
$('couponForm').addEventListener('submit',e=>{e.preventDefault();const amount=Number($('couponAmount').value);if(!Number.isSafeInteger(amount)||amount<1||amount>1000000)return;const delta=$('couponMode').value==='subtract'?-amount:amount;ask('ยืนยันปรับคูปอง',`${selected.name} (${selected.code}) · ${delta>0?'เพิ่ม':'ลด'} ${fmt(amount)} ใบ โดยใช้ยอดล่าสุดบนเซิร์ฟเวอร์`,'coupons',{code:selected.code,delta});});
$('banForm').addEventListener('submit',e=>{e.preventDefault();const banned=!selected.banned,reason=$('banReason').value.trim();if(banned&&reason.length<2){notice('กรุณาระบุเหตุผลการแบน',true);return;}ask(banned?'ยืนยันแบน':'ยืนยันปลดแบน',`${selected.name} (${selected.code})${reason?' · '+reason:''}`,'ban',{code:selected.code,banned,reason});});
$('submitAction').addEventListener('click',()=>{if(!confirmation)return;const c=confirmation;confirmation=null;$('confirmAction').close();working(()=>mutate(c.action,c.payload));});
$('prepareDelete').addEventListener('click',()=>working(()=>mutate('prepare_delete',{code:selected.code})));
$('deleteCode').addEventListener('input',updateDeleteEnabled);$('deleteAgree').addEventListener('change',updateDeleteEnabled);
$('deleteForm').addEventListener('submit',e=>{e.preventDefault();if(!prepared||$('deleteCode').value!==selected.code||!$('deleteAgree').checked)return;working(()=>mutate('confirm_delete',{code:selected.code,confirmation:$('deleteCode').value,token:prepared.token}));});
for(const d of document.querySelectorAll('dialog'))d.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
$('historyRefresh').addEventListener('click',()=>working(async()=>{const r=await rpc('history');$('history').innerHTML=r.events.length?r.events.map(e=>`<div class="history-entry"><b>${esc(e.code)}</b> · ${esc(e.operation==='permanent-delete'?'ลบไอดีถาวร':e.banned_before!==e.banned_after?(e.banned_after?'แบนผู้เล่น':'ปลดแบนผู้เล่น'):'ปรับคูปอง')}${e.coupons_before!=null?` · ${fmt(e.coupons_before)} → ${fmt(e.coupons_after)} คูปอง`:''}<small>${esc(new Date(e.created_at).toLocaleString('th-TH'))} · ${esc(e.event_id)}</small></div>`).join(''):'<p class="muted">ยังไม่มีรายการ</p>';}));
let reviewedTopup=null, slipUrl=null;
const topupApi=(action,data={})=>rpc(action,data,'sb_manual_topup_admin');
const topupStatus={pending:'รอตรวจยอด',credited:'ส่งคูปองแล้ว',rejected:'ไม่อนุมัติ'};
const topupPrice=satang=>new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB'}).format(satang/100);
function topupLabel(order){
 const name=players.find(player=>player.code===order.code)?.name;
 const pack=order.promotion?'แพ็กราคาพิเศษ (ครั้งเดียวต่อตัวละคร)':'แพ็กปกติ';
 return `${pack} ${fmt(order.coupons)} คูปอง · ยอดที่ต้องได้รับ ${topupPrice(order.amount_satang)} · ${name?name+' · ':''}${order.code}`;
}
function clearSlip(){
 if(slipUrl)URL.revokeObjectURL(slipUrl);
 slipUrl=null;reviewedTopup=null;
 $('topupSlipImage').removeAttribute('src');$('topupSlipImage').hidden=true;
 $('topupDetails').textContent='';$('topupFeedback').textContent='';
 $('topupApproval').reset();$('topupRejection').reset();
}
function clearTopups(){clearSlip();$('topupList').replaceChildren();$('topupCount').textContent='';}
async function loadTopupsSafely(){
 try{await loadTopups();}catch{$('topupList').replaceChildren();$('topupCount').textContent='โหลดรายการเติมผ่าน QR ไม่สำเร็จ';}
}
async function loadTopups(){
 const data=await topupApi('list');
 $('topupCount').textContent=`รอตรวจ ${fmt(data.pending_count)} รายการ`;
 $('topupList').replaceChildren();
 for(const order of data.orders){
  const item=document.createElement('article');item.className='history-entry';
  const title=document.createElement('b');title.textContent=topupLabel(order);
  const details=document.createElement('p');details.textContent=`${topupStatus[order.status]} · ${new Date(order.submitted_at).toLocaleString('th-TH')} · แพ็ก ${order.pack_id} · ${order.id}`;
  const button=document.createElement('button');button.className='quiet';button.textContent=order.status==='pending'?'เปิดสลิปและตรวจยอด':'ดูสลิปและรายละเอียด';
  button.onclick=()=>openTopup(order);
  item.append(title,details,button);$('topupList').append(item);
 }
}
async function openTopup(order){
 const dialog=$('topupReview');
 clearSlip();reviewedTopup=order;
 $('topupDetails').textContent=topupLabel(order)+' · '+order.id+(order.bank_reference?' · เลขอ้างอิง '+order.bank_reference:'')+(order.rejection_reason?' · '+order.rejection_reason:'');
 $('topupApproval').hidden=true;$('topupRejection').hidden=true;
 $('topupFeedback').textContent='กำลังโหลดสลิป…';dialog.showModal();
 try{
  const slip=await topupApi('slip',{order_id:order.id});
  if(reviewedTopup!==order||!dialog.open)return;
  if(!['image/png','image/jpeg'].includes(slip?.mime))throw Error('invalid_slip');
  slipUrl=URL.createObjectURL(new Blob([Uint8Array.from(atob(slip.content),c=>c.charCodeAt(0))],{type:slip.mime}));
  $('topupSlipImage').src=slipUrl;$('topupSlipImage').hidden=false;
  $('topupApproval').hidden=order.status!=='pending';$('topupRejection').hidden=order.status!=='pending';$('topupFeedback').textContent='';
 }catch{if(reviewedTopup===order)$('topupFeedback').textContent='เปิดสลิปไม่สำเร็จ กรุณาปิดแล้วลองใหม่';}
}
let decidingTopup=false;
async function decideTopup(action,data){
 if(decidingTopup||!reviewedTopup)return;
 decidingTopup=true;
 const buttons=[...$('topupReview').querySelectorAll('form button')];buttons.forEach(button=>button.disabled=true);
 try{
  const result=await topupApi(action,{order_id:reviewedTopup.id,...data});
  $('topupReview').close();notice(topupStatus[result.status]);
  await loadTopupsSafely();
  if(result.status==='credited')try{await loadPlayers();}catch{}
 }catch(error){
  const messages={bank_reference_used:'เลขอ้างอิงนี้ใช้อนุมัติรายการอื่นแล้ว',amount_mismatch:'ยอดเงินจริงไม่ตรงกับราคาแพ็ก',bank_reference_required:'กรุณากรอกเลขอ้างอิงธุรกรรมให้ครบ',character_not_owned:'ไม่พบตัวละครผู้รับที่ใช้งานอยู่'};
  $('topupFeedback').textContent=messages[error.message]||'บันทึกไม่สำเร็จ กรุณาอัปเดตรายการเพื่อตรวจผลก่อนลองอีกครั้ง';
 }finally{decidingTopup=false;buttons.forEach(button=>button.disabled=false);}
}
$('topupRefresh').onclick=()=>working(loadTopupsSafely);
setInterval(()=>{if(session&&adminEmail&&!busy&&!decidingTopup&&!document.hidden&&!$('topupReview').open)loadTopups().catch(()=>{});},30000);
$('topupClose').onclick=()=>$('topupReview').close();
$('topupReview').addEventListener('close',clearSlip);
$('topupApproval').onsubmit=event=>{
 event.preventDefault();
 const amount=$('topupAmount').value.trim();
 if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(amount)){$('topupFeedback').textContent='กรอกยอดเงิน เช่น 99 หรือ 99.50';return;}
 if(!$('topupChecked').checked)return;
 const [baht,satang='']=amount.split('.');
 decideTopup('approve',{amount_satang:Number(baht)*100+Number(satang.padEnd(2,'0')),bank_reference:$('topupBankRef').value.trim()});
};
$('topupRejection').onsubmit=event=>{
 event.preventDefault();decideTopup('reject',{reason:$('topupRejectReason').value.trim()});
};

async function start(){try{$('useGameSession').hidden=!JSON.parse(localStorage.getItem('soulbeast_shop_test_auth_v1')||'null')?.access_token;}catch{}try{session=JSON.parse(sessionStorage.getItem(STORE)||'null');}catch{session=null;}const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('access_token')){setSession({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token')});history.replaceState(null,'',location.pathname);if(hash.get('type')==='recovery'){/* The server verifies the recovery session when updating the password. */$('auth').hidden=true;$('recovery').hidden=false;return;}}if(session)await working(async()=>{try{await enter();}catch(e){if(e.status===401||e.code==='42501'||String(e.message).includes('admin_access_denied')){setSession(null);clearPrivateView();}throw e;}});}
start();
