import {connectDungeonParty,partySessionKey} from '../../client/dungeon-party.mjs';
import {partyRules} from './online-party-rules.mjs';
const $=id=>document.getElementById(id);
const errors={login_required:'กรุณาเข้าสู่ระบบออนไลน์ก่อน',party_full:'ห้องนี้มีผู้ผนึกครบ 4 คนแล้ว',
 party_not_ready:'สมาชิกต้องออนไลน์และกดพร้อมทุกคน',party_host_only:'เฉพาะหัวหน้าห้องเท่านั้นที่เริ่มได้',
 party_already_active:'ตัวละครนี้อยู่ในปาร์ตี้แล้ว',party_unavailable:'ห้องปิดหรือหมดเวลาแล้ว',
 party_started:'ห้องนี้เริ่มดันเจี้ยนแล้ว',party_size:'ต้องมีสมาชิกอย่างน้อย 2 คน',
 one_character_per_account:'หนึ่งบัญชีเข้าร่วมได้หนึ่งตัวละคร',party_run_active:'ปาร์ตี้เริ่มเดินทางแล้ว'};
let connection,room=null,busy=false,timer,stopped=false;
function render(){
 $('joinPanel').hidden=!!room;$('roomPanel').hidden=!room;if(!room)return;
 $('roomId').textContent=room.id;$('count').textContent=room.members.length+'/4';$('members').replaceChildren();
 for(const m of room.members){const row=document.createElement('li');row.dataset.ready=String(m.ready&&m.online);
  row.textContent=`${m.name} · Lv ${m.level}${m.code===room.host?' · หัวหน้าห้อง':''} · ${!m.online?'ขาดการเชื่อมต่อ':m.ready?'พร้อมแล้ว':'ยังไม่พร้อม'}`;$('members').append(row);}
 const me=room.members.find(m=>m.code===connection.code);$('ready').textContent=me?.ready?'ยกเลิกพร้อม':'ยืนยันพร้อม';
 $('ready').disabled=busy||room.state!=='waiting';$('leave').disabled=busy||room.state!=='waiting';
 $('start').hidden=room.host!==connection.code;
 $('start').disabled=busy||room.state!=='waiting'||room.members.length<2||!room.members.every(m=>m.ready&&m.online);
 const size=room.startedSize||room.members.length;
 if(size>=2){const rule=partyRules(size);$('requirements').textContent=`ต่อชั้น: อสูรเงา ${rule.shadows} ตัว · โจรป่า ${rule.bandits} ตัว · พลังบอสและสมุน ×${rule.bossMultiplier.toFixed(1)}`;}
 else $('requirements').textContent='รอผู้ผนึกอีกอย่างน้อย 1 คน';
}
async function update(action='status',extra={}){
 if(busy||stopped)return;busy=true;render();
 try{
  const result=await connection.call(action,{room:room?.id,...extra});
  if(result.left){room=null;sessionStorage.removeItem(partySessionKey);}
  else {room=result;sessionStorage.setItem(partySessionKey,JSON.stringify({id:room.id,code:connection.code}));}
  $('status').textContent=room?.state==='active'?'ทุกคนพร้อมแล้ว กำลังเข้าสู่ดันเจี้ยน…':'';
  if(room?.state==='active'){
   // Dedicated party runtime; never enter the legacy local simulation as an online team.
   stopped=true;clearInterval(timer);location.assign('online-party-run.html?room='+encodeURIComponent(room.id));
  }
 }catch(error){
  if(action==='status'&&['party_unavailable','party_not_member'].includes(error.message)){
   room=null;sessionStorage.removeItem(partySessionKey);
  }
  $('status').textContent=errors[error.message]||'เชื่อมต่อห้องไม่สำเร็จ กรุณาลองอีกครั้ง';
 }
 finally{busy=false;render();}
}
$('create').onclick=()=>update('create');$('join').onclick=()=>{const id=$('roomCode').value.trim();
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)){$('status').textContent='กรุณาใส่รหัสห้องให้ครบ';return;}update('join',{room:id});};
$('ready').onclick=()=>update('ready',{ready:!room.members.find(m=>m.code===connection.code)?.ready});
$('start').onclick=()=>update('start');$('leave').onclick=()=>update('leave');
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(room.id);$('status').textContent='คัดลอกรหัสห้องแล้ว';}catch{$('status').textContent='เลือกและคัดลอกรหัสห้องด้านบนได้เลย';}};
try{connection=connectDungeonParty();const saved=JSON.parse(sessionStorage.getItem(partySessionKey)||'null');
 if(saved?.code===connection.code){room={id:saved.id,members:[],state:'waiting'};void update();}
 timer=setInterval(()=>{if(room&&!document.hidden)void update();},5000);
}catch{$('status').textContent=errors.login_required;$('create').disabled=$('join').disabled=true;}
addEventListener('pagehide',()=>{stopped=true;clearInterval(timer);});
