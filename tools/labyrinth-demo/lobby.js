import {connectAccounts} from '../../client/account-client.mjs?v=admin-session-20261107';

const api=DungeonPartyPresence, $=id=>document.getElementById(id);
const siteRoot=new URL('../../',import.meta.url);
const pet=p=>(p.party||[]).map(id=>p.pets?.find(v=>v.uid===id)).find(Boolean);
let context;
try{context=JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1')||'null');}catch{}
const online=Boolean(context?.code&&['live','test'].includes(context.environment));
if(online&&context.environment==='live'){
 const link=document.createElement('a');
 link.href='online-party-lobby.html';
 link.textContent='สร้างหรือเข้าร่วมปาร์ตี้ออนไลน์ (2–4 คน)';
 const modes=document.createElement('p');
 modes.append(link);
 $('identity').before(modes);
}

if(!online&&!api.player()){
 MineState.create(sessionStorage,{...MineGameData.demo,code:'DUNGEON-DEMO-'+crypto.randomUUID(),dungeonLobbyDemo:true});
}
const accounts=online?connectAccounts(()=>{}):null;
let selected=null,signature='',remoteRows=[],loadState='loading',pending,entering=false;

function eligible(row,me){
 if(!row||!me||Math.abs(row.player.lv-me.lv)>10||!pet(row.player))return false;
 return row.simulated||online||api.eligible(row,me);
}
function refreshOnline(){
 return pending??=(loadOnline().finally(()=>{pending=null;}));
}
async function loadOnline(){
 try{
  const rows=await accounts.request('/rest/v1/rpc/sb_dungeon_solo_friends',
   {p_env:context.environment,p_code:context.code},await accounts.sessions.token());
  if(!Array.isArray(rows))throw Error('invalid_friend_roster');
  remoteRows=rows.filter(row=>row?.id&&sealerSpriteCatalog[row.player?.cls]&&Number.isFinite(row.player.lv));
  loadState='ready';
 }catch(error){
  console.warn('Dungeon friend roster:',error.message);
  remoteRows=[];
  loadState='error';
 }finally{
  render();
 }
}

function friendCard(row,me,friends){
 const p=row.player,card=document.createElement('article');
 card.className='card'+(selected===row.id?' selected':'');
 const portraits=document.createElement('div');
 portraits.className='portraits';
 const char=document.createElement('div');
 char.className='sealer';
 const spec=sealerSpriteCatalog[p.cls]?.[p.gender==='male'?'male':'female'];
 if(spec)char.style.backgroundImage='url('+spec.portrait+')';
 char.setAttribute('role','img');
 char.setAttribute('aria-label','ผู้ผนึก '+p.name);
 portraits.append(char);
 const companion=pet(p),art=PartyArt[companion?.sp];
 const image=art?.forms?.[companion.form||0]||art?.image;
 if(image){
  const im=document.createElement('img');
  im.className='pet';
  im.alt=art.name;
  im.src=new URL(image,siteRoot).href;
  portraits.append(im);
 }
 const info=document.createElement('div');
 info.className='friend-info';
 for(const text of [p.name+(row.simulated?' · ตัวช่วยจำลอง':''),(sealerSpriteCatalog[p.cls]?.name||p.cls)+' · Lv '+p.lv,
  'คู่หูล่าสุด: '+(companion?(art?.name||companion.sp)+' Lv '+companion.lv:'ยังไม่ได้จัดคู่หู')]){
  const line=document.createElement('p');
  line.textContent=text;
  info.append(line);
 }
 const button=document.createElement('button');
 const gap=Math.abs(me.lv-p.lv),known=row.simulated||online||friends.includes(row.id);
 button.textContent=gap>10?'Lv ต่างเกิน':!companion?'ไม่มีคู่หู':!known?'เพิ่มเพื่อน':selected===row.id?'✓ เลือกแล้ว':'เลือก';
 button.setAttribute('aria-label',gap>10?'เลเวลต่างกันเกิน 10':!companion?'เพื่อนยังไม่ได้จัดอสูรออกสู้':
  !known?'เพิ่ม '+p.name+' เป็นเพื่อน':'เลือก '+p.name+' ให้ร่วมทีม');
 button.disabled=gap>10||!companion;
 button.onclick=()=>{
  if(!known)api.addFriend(row.id);
  selected=row.id;
  render();
 };
 card.append(portraits,info,button);
 return card;
}

function render(){
 const me=api.player();
 if(!me){
  $('identity').textContent='กรุณาเลือกตัวละครก่อนเข้าดันเจี้ยน';
  $('enter').disabled=true;
  return;
 }
 const rows=online?remoteRows:api.list(),friends=online?[]:api.friends();
 const simulated=DungeonSimulatedFriend.forPlayer(me);
 const current=selected===simulated?.id?simulated:rows.find(r=>r.id===selected);
 $('identity').textContent=me.name+' · '+(sealerSpriteCatalog[me.cls]?.name||me.cls)+' · Lv '+me.lv+
  (me.dungeonLobbyDemo?' · ผู้ผนึกทดสอบสำหรับแท็บนี้':'');
 $('enter').disabled=entering||Boolean(selected&&!eligible(current,me));
 $('enter').textContent=selected?'เข้าดันเจี้ยนพร้อมเพื่อน':'เข้าดันเจี้ยนคนเดียว';
 $('clearFriend').hidden=!selected;
 $('status').textContent=selected&&!current&&loadState!=='error'?'เพื่อนออฟไลน์แล้ว กรุณาเลือกใหม่':
  current?'เลือก '+current.player.name+' แล้ว':'';
 const sig=JSON.stringify([rows.map(r=>[r.id,r.player]),friends,me.lv,selected,online?loadState:null]);
 if(sig===signature)return;
 signature=sig;
 $('roster').replaceChildren(...rows.map(r=>friendCard(r,me,friends)));
 $('rosterMessage').textContent=online&&loadState==='loading'?'กำลังโหลดรายชื่อเพื่อนออนไลน์…':
  online&&loadState==='error'?'โหลดรายชื่อเพื่อนออนไลน์ไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ':
  !rows.length?'ยังไม่มีเพื่อนออนไลน์':'';
 $('simulatedRoster').replaceChildren(...(simulated?[friendCard(simulated,me,friends)]:[]));
}

$('clearFriend').onclick=()=>{selected=null;render();};
$('enter').onclick=async()=>{
 const me=api.player(),chosen=selected;
 if(!me||entering)return;
 entering=true;
 render();
 try{
  const simulated=DungeonSimulatedFriend.forPlayer(me);
  if(chosen&&chosen!==simulated?.id&&online)await refreshOnline();
  const row=chosen===simulated?.id?simulated:(online?remoteRows:api.list()).find(r=>r.id===chosen);
  if(chosen!==selected||chosen&&!eligible(row,me))return;
  sessionStorage.setItem('soulbeast-dungeon-entry-v1','country:red');
  if(row)sessionStorage.setItem('soulbeast-dungeon-party-v1',JSON.stringify({
   version:1,host:api.id(me),friend:row.player,friendId:row.id,chosenAt:Date.now()
  }));
  else sessionStorage.removeItem('soulbeast-dungeon-party-v1');
  MineState.startRun(sessionStorage);
  location.href='index.html?arrival=entrance&party='+(row?'duo':'solo');
 }finally{
  entering=false;
  render();
 }
};

render();
if(online){
 refreshOnline();
 setInterval(()=>{if(!document.hidden)refreshOnline();},10000);
}else setInterval(render,700);
