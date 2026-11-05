import {connectOnlineWalk} from '../../client/online-walk.mjs?v=revision-retry-1';
import {connectDungeonParty,partySessionKey} from '../../client/dungeon-party.mjs?v=short-code-1';
import {partyRules} from './online-party-rules.mjs';
const $=id=>document.getElementById(id);
const errors={login_required:'กรุณาเข้าสู่ระบบออนไลน์ก่อน',party_full:'ห้องนี้มีผู้ผนึกครบ 4 คนแล้ว',
 party_not_ready:'สมาชิกต้องออนไลน์และกดพร้อมทุกคน',party_host_only:'เฉพาะหัวหน้าห้องเท่านั้นที่เริ่มได้',
 save_conflict:'เซฟตัวละครมีการเปลี่ยนแปลง กรุณาเข้าเกมใหม่ก่อนเริ่มปาร์ตี้',party_already_active:'ตัวละครนี้อยู่ในปาร์ตี้แล้ว',party_unavailable:'ห้องปิดหรือหมดเวลาแล้ว',
 ready_not_confirmed:'เซิร์ฟเวอร์ยังไม่ยืนยันสถานะพร้อม กรุณากดอีกครั้ง',party_started:'ห้องนี้เริ่มดันเจี้ยนแล้ว',party_size:'ต้องมีสมาชิกอย่างน้อย 2 คน',
 one_character_per_account:'หนึ่งบัญชีเข้าร่วมได้หนึ่งตัวละคร',party_run_active:'ปาร์ตี้เริ่มเดินทางแล้ว'};
let connection,walkSave,room=null,busy=false,timer,stopped=false,checked=false,polling=false,actionVersion=0;
const feedback=$('status').parentElement;
const lobbyAnchor=$('joinPanel');
function render(){
 $('joinPanel').hidden=!!room||!checked;$('create').disabled=$('join').disabled=busy;$('roomPanel').hidden=!room;
 if(room&&feedback.parentElement!==$('roomPanel'))$('requirements').after(feedback);
 if(!room&&feedback.parentElement!==lobbyAnchor.parentElement)lobbyAnchor.before(feedback);
 if(!room)return;
 $('roomId').textContent=room.joinCode||'…';$('copy').disabled=!room.joinCode;
 $('count').textContent=room.members.length+'/4';$('members').replaceChildren();
 for(const m of room.members){const row=document.createElement('li');row.dataset.ready=String(m.ready&&m.online);
  row.textContent=`${m.name} · Lv ${m.level}${m.code===room.host?' · หัวหน้าห้อง':''} · ${!m.online?'ขาดการเชื่อมต่อ':m.ready?'พร้อมแล้ว':'ยังไม่พร้อม'}`;$('members').append(row);}
 const me=room.members.find(m=>m.code===connection.code);$('ready').textContent=me?.ready?'ยกเลิกพร้อม':'ยืนยันพร้อม';
 $('ready').hidden=room.state!=='waiting';$('ready').disabled=busy;$('leave').disabled=busy;
 $('resume').hidden=room.state!=='active';$('resume').disabled=busy;
 $('start').hidden=room.host!==connection.code||room.state!=='waiting';
 $('start').disabled=busy||room.state!=='waiting'||room.members.length<2||!room.members.every(m=>m.ready&&m.online);
 const size=room.startedSize||room.members.length;
 if(size>=2){const rule=partyRules(size);$('requirements').textContent=`ต่อชั้น: อสูรเงา ${rule.shadows} ตัว · โจรป่า ${rule.bandits} ตัว · พลังบอสและสมุน ×${rule.bossMultiplier.toFixed(1)}`;}
 else $('requirements').textContent='รอผู้ผนึกอีกอย่างน้อย 1 คน';
}
function resume(){stopped=true;clearInterval(timer);location.assign('index.html?room='+encodeURIComponent(room.id));}
async function update(action='status',extra={}){
 if(busy||stopped)return;actionVersion++;busy=true;$('retryLobby').hidden=true;render();
 let saving=false;
 try{
  let refreshFailed=false;
  const wasWaiting=room?.state==='waiting',wasChecked=checked;
  let result;
  if(action==='start'||(action==='ready'&&extra.ready)){
   saving=true;$('status').textContent='กำลังบันทึกตัวละคร…';
   await walkSave.flush(true);saving=false;
   $('status').textContent=action==='ready'?'กำลังยืนยันพร้อม…':'กำลังเริ่มดันเจี้ยน…';
  }
  if(action==='leave'&&room?.state==='active'){
   await connection.run(room.id,'leave');
   result={left:true};
   try{await connection.restoreWalk();}catch{refreshFailed=true;}
  }else{
   try{result=await connection.call(action,{room:room?.id,...extra});}
   catch(error){
    if(error.message!=='party_already_active')throw error;
    result=await connection.call('status');
   }
  }
  if(action==='ready'&&result.members?.find(m=>m.code===connection.code)?.ready!==extra.ready){
   throw Error('ready_not_confirmed');
  }
  checked=true;
  if(result.left){room=null;sessionStorage.removeItem(partySessionKey);}
  else {room=result;sessionStorage.setItem(partySessionKey,JSON.stringify({id:room.id,code:connection.code}));}
  if(action!=='status'||!room||room.state==='active'||!$('status').textContent||!wasChecked)$('status').textContent=room?.state==='active'?'พบปาร์ตี้เดิม · กลับเข้าดันเจี้ยนหรือออกจากห้องได้':action==='leave'?(refreshFailed?'ออกจากห้องแล้ว · โหลดเซฟล่าสุดไม่สำเร็จ กรุณาเข้าเกมใหม่':'ออกจากห้องแล้ว'):'';
  if(room?.state==='active'&&wasWaiting)resume();
 }catch(error){
  if(action==='status'&&['party_unavailable','party_not_member'].includes(error.message)){
   room=null;sessionStorage.removeItem(partySessionKey);
  }
  if(action==='status'&&room&&$('status').textContent)return;
  $('status').textContent=errors[error.message]||errors[error.code]||
   (saving?'บันทึกตัวละครก่อนเริ่มดันเจี้ยนไม่สำเร็จ กรุณาลองอีกครั้ง':error.status===401?'กรุณาเข้าสู่ระบบเกมใหม่':error.status===403?'บัญชีนี้ไม่มีสิทธิ์ใช้ตัวละครที่เลือก กรุณาเข้าเกมใหม่':action==='ready'?'ยืนยันพร้อมไม่สำเร็จ กรุณาลองอีกครั้ง':action==='create'?'เซิร์ฟเวอร์สร้างห้องไม่สำเร็จ กรุณาลองอีกครั้ง':'เชื่อมต่อห้องไม่สำเร็จ กรุณาลองอีกครั้ง');
 }
 finally{busy=false;render();}
}
// A background refresh must never disable the ready button or overwrite a newer action.
async function pollRoom(){
 if(!room||busy||stopped||polling||document.hidden)return;
 const id=room.id,version=actionVersion;
 polling=true;
 try{
  const latest=await connection.call('status',{room:id});
  if(stopped||busy||version!==actionVersion||room?.id!==id)return;
  if(latest.left){void update();return;}
  const wasWaiting=room.state==='waiting';
  room=latest;render();
  if(wasWaiting&&room.state==='active')resume();
 }catch(error){
  if(!stopped&&!busy&&version===actionVersion&&['party_unavailable','party_not_member'].includes(error.message))void update();
 }finally{polling=false;}
}
$('create').onclick=()=>update('create');$('retryLobby').onclick=()=>update();$('joinForm').onsubmit=event=>{event.preventDefault();const id=$('roomCode').value.trim();
 if(/^[a-f0-9]{8}$/i.test(id)){void update('join',{joinCode:id.toUpperCase()});return;}
 if(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)){void update('join',{room:id});return;}
 $('status').textContent='กรุณาใส่รหัสห้อง 8 ตัวตามที่หัวหน้าห้องส่งให้';};
$('ready').onclick=()=>update('ready',{ready:!room.members.find(m=>m.code===connection.code)?.ready});
$('start').onclick=()=>update('start');$('leave').onclick=()=>{if(room?.state!=='active'||window.confirm('ออกจากปาร์ตี้และดันเจี้ยนเดิมหรือไม่?'))void update('leave');};$('resume').onclick=resume;
$('copy').onclick=async()=>{if(!room?.joinCode)return;try{await navigator.clipboard.writeText(room.joinCode);$('status').textContent='คัดลอกรหัสห้องแล้ว';}catch{$('status').textContent='เลือกและคัดลอกรหัสห้องด้านบนได้เลย';}};
try{connection=connectDungeonParty();walkSave=connectOnlineWalk();void update();
 timer=setInterval(pollRoom,5000);
}catch{$('status').textContent=errors.login_required;$('create').disabled=$('join').disabled=true;}
addEventListener('pagehide',()=>{stopped=true;clearInterval(timer);});
addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
