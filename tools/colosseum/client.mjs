const assets = new URL('../../assets/',import.meta.url).pathname;
import {BASE_REPAIR_MS, BASE_REPAIR_RANGE, CHEST_COUNT, CLASSES, COLORS, HEAL_TARGET, RAID_TARGET, TEAM_ARENA, TEAMS, canRaidBase, distance} from './arena.mjs?v=base-repair-1';
import {SURVIVAL_ARENA, insideFogSafe, walkInArena} from './survival-arena.mjs';
import {Scene, drawMap, portrait, sealerGender} from './scene.mjs?v=bottom-shield-1';
import {SHIELDS,shieldFor,shieldUrl} from './ranking.mjs?v=shields-2';
import {battlePresentation} from './battle-presentation.mjs?v=projectile-2';
import pvpCardArt,{beastPortraits} from './pvp-card-art.mjs?v=battle-parity-1';

const battleAsset=path=>path?.replace(/^\/assets\//,assets);
const $=id=>document.getElementById(id);
const node=(tag,content,className)=>{
 const e=document.createElement(tag);if(content!=null)e.textContent=content;if(className)e.className=className;return e;
};
const scene=new Scene($('world')), actors=new Map(), keys=new Set();
const presentation=battlePresentation($('battle-vfx'));
const mapDialog=$('large-map'), channel='soulbeast-colosseum-session';
let ws,state,battle,me,local,lastInput='',seq=0,offset=0,stick={x:0,y:0,id:null},retry,packet;
let lobbyKey='',battleKey='',teamHpKey='',survivalRankKey='',selected=null,pendingTurn=null,now=0,previous=performance.now(),lastMap=0;
let showBattleLog=false;
let resultKey='';
const battleUpdates=[];
const spectatorPan={x:0,y:0};
let spectatorDrag=null;
const watchedPlayer=()=>state?.spectating&&state.players.find(p=>p.id===state.spectating);
const viewingBattle=()=>state?.phase==='match'&&(me?.phase==='battle'||watchedPlayer()?.phase==='battle');
let pendingChest=null, pendingMoves=[], correction=null, oneWay=0, bestRtt=Infinity;
function acceptPong(message){
 const rtt=performance.now()-message.echo;
 if(rtt>=0&&rtt<bestRtt){bestRtt=rtt;oneWay=Math.min(rtt/2,180);}
}
function replayMovement(player,snapshot){
 const predicted={x:player.x,y:player.y};
 const end=snapshot.now+oneWay;
 let at=snapshot.now,input=snapshot.input||[0,0];
 const advance=until=>{
  while(at<until){
   const step=Math.min(16,until-at);at+=step;
   walkInArena(scene.arena,snapshot.zone,predicted,...input,step/1000);
  }
 };
 for(const move of pendingMoves){
  advance(Math.min(end,Math.max(at,move.at)));
  input=[move.x,move.y];
 }
 advance(end);
 return predicted;
}
const gameWeb=location.pathname.toLowerCase().startsWith('/soulbeast/');
const serverURL=document.querySelector('meta[name="colosseum-server"]').content;
const params=new URLSearchParams(location.search);
let selectedCharacter=null,accountContext=null,selectedRating=null;
try{
 selectedCharacter=JSON.parse(sessionStorage.getItem('soulbeast-walk-preview-player-v1')||'null');
 accountContext=JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1')||'null');
 if(accountContext&&selectedCharacter?.code!==accountContext.code)selectedCharacter=null;
}catch{}
const practiceType=type=>type==='practice'||type==='survivalPractice';
const onlineEnabled=!gameWeb||/^https:\/\//i.test(serverURL);
function practiceSocket(){
 const worker=new Worker(new URL('./practice-worker.mjs?v=colosseum-ranks-1',import.meta.url),{type:'module'});
 const socket={readyState:WebSocket.OPEN,local:true,send:data=>worker.postMessage(JSON.parse(data)),close:()=>worker.terminate()};
 worker.onmessage=({data})=>socket.onmessage?.({data:JSON.stringify(data)});
 worker.onerror=()=>socket.onmessage?.({data:JSON.stringify({type:'error',message:'เปิดสนามทดลองไม่ได้'})});
 return socket;
}
async function onlineTicket(base){
 if(!accountContext?.code||accountContext.environment!=='live')throw Error('กรุณาเข้าสู่ระบบและเลือกตัวละครออนไลน์');
 const {connectAccounts}=await import('../../client/account-client.mjs?v=admin-session-20261107');
 const client=connectAccounts(()=>{});
 const result=await fetch(new URL('/ticket',base),{
  method:'POST',headers:{Authorization:'Bearer '+await client.sessions.token(),'Content-Type':'application/json'},
  body:JSON.stringify({code:accountContext.code}),signal:AbortSignal.timeout(12000),
 });
 const body=await result.json();
 if(!result.ok)throw Error(body.error||'ตรวจสอบตัวละครไม่สำเร็จ');
 return body.ticket;
}
const send=m=>{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify(m));return true;}return false;};
const own=()=>state?.players.find(p=>p.id===state.me);
const clock=ms=>{const t=Math.max(0,Math.ceil(ms/1000));return [Math.floor(t/60),t%60].map(x=>String(x).padStart(2,'0')).join(':');};
function saved(){try{return JSON.parse(sessionStorage.getItem(channel)||'null');}catch{return null;}}
function store(value){try{if(value)sessionStorage.setItem(channel,JSON.stringify(value));else sessionStorage.removeItem(channel);}catch{}}
async function waitForHost(base,payload){
 const deadline=Date.now()+105_000;
 const url=new URL('/healthz',base);
 while(packet===payload&&Date.now()<deadline){
  try{
   const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12_000)});
   if(response.status===204)return;
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,2500));
 }
 throw Error('เซิร์ฟเวอร์ยังเปิดไม่สำเร็จ กรุณาลองอีกครั้ง');
}
let opening=false,queued=false,leaving=false,leaveTimer;
function updateEntryControls(){
 $('country-return').hidden=!$('country-return').hasAttribute('href')||opening||queued||Boolean(state);
 for(const button of $('entry-form').querySelectorAll('button[type="submit"]')){
  button.disabled=opening||(!onlineEnabled&&!practiceType(button.value));
 }
}
async function connect(payload){
 clearTimeout(retry);packet=payload;opening=true;updateEntryControls();
 pendingMoves=[];pendingChest=null;correction=null;oneWay=0;bestRtt=Infinity;
 const useWorker=practiceType(payload.type)&&Boolean(selectedCharacter);
 const base=new URL(gameWeb&&serverURL?serverURL:location.origin);
 const url=new URL('/ws',base);
 url.protocol=base.protocol==='https:'?'wss:':'ws:';
 $('notice').textContent='กำลังเชื่อมต่อสนาม…';
 let ticket=null;
 if(gameWeb&&!useWorker){
  try{
   if(!accountContext?.code||accountContext.environment!=='live')throw Error('กรุณาเข้าสู่ระบบและเลือกตัวละครออนไลน์');
   $('notice').textContent='กำลังเปิดเซิร์ฟเวอร์สนาม อาจใช้เวลาประมาณหนึ่งนาที…';
   await waitForHost(base,payload);
   if(packet!==payload)return;
   if(payload.type==='ranked'){
    const ready=await fetch(new URL('/ranked-health',base),{cache:'no-store',signal:AbortSignal.timeout(10_000)});
    if(ready.status!==204)throw Error('ระบบจัดอันดับยังไม่พร้อม กรุณาลองใหม่อีกครั้ง');
    if(packet!==payload)return;
   }
   ticket=await onlineTicket(base);
   if(packet!==payload)return;
   $('notice').textContent='กำลังเชื่อมต่อสนาม…';
  }catch(error){
   if(packet===payload)reset(error.message);
   return;
  }
 }
 const socket=useWorker?practiceSocket():new WebSocket(url);
 ws=socket;
 socket.onopen=()=>{if(ws===socket)send(ticket?{...payload,ticket}:payload);};
 socket.onmessage=({data})=>{
  if(ws!==socket)return;
  const m=JSON.parse(data);
  if(m.type==='rankQueue'){
   showRankQueue(m);
  }else if(m.type==='welcome'){
   queued=false;
   $('rank-queue').hidden=true;
   seq=Math.max(seq,m.seq);if(!socket.local)store({type:'resume',code:m.room,token:m.token});
   send({type:'ping',echo:performance.now()});
   $('signal').hidden=true;$('notice').textContent='';
  }else if(m.type==='left'){reset(m.message||'',true);}
  else if(m.type==='pong'){acceptPong(m);}
  else if(m.type==='chest-result'){pendingChest=null;}
  else if(m.type==='error'){
   if(m.action==='chest')pendingChest=null;
   if(opening||queued&&m.action==='ranked'){reset(m.message);return;}
   if(m.action==='leave'){leaving=false;clearTimeout(leaveTimer);$('leave').disabled=false;}
   if(state?.phase==='match'){
    $('signal').textContent=m.message;$('signal').hidden=false;
    setTimeout(()=>{if(ws?.readyState===WebSocket.OPEN)$('signal').hidden=true;},1800);
   }else $('notice').textContent=m.message;
  }else if(m.type==='state')applyState(m);
  else if(m.type==='battle')receiveBattle(m.battle);
 };
 socket.onclose=event=>{
  if(ws!==socket)return;
  release();lastInput='';
  if(event.code===4001){reset('เปิดห้องเดิมในอีกแท็บแล้ว');return;}
  if(event.code===1000&&event.reason==='left'){reset('',true);return;}
  if(event.code===1000&&event.reason==='room closed'){reset('ห้องเดิมปิดแล้ว',true);return;}
  if(leaving){reset('ออกจากหน้าห้องแล้ว เซิร์ฟเวอร์จะคืนที่นั่งหลังหมดเวลารอเชื่อมต่อ',true);return;}
  const p=saved();
  if(p&&state?.phase!=='finished'){
   $('signal').textContent='กำลังเชื่อมต่อกลับเข้าสนาม…';$('signal').hidden=false;
   retry=setTimeout(()=>connect(p),900);
  }else if(packet&&state?.phase!=='finished')reset('เชื่อมต่อสนามไม่ได้ ลองอีกครั้ง');
 };
 socket.onerror=()=>{};
 if(useWorker){store(null);send({type:payload.type,character:selectedCharacter,rating:selectedRating});}
}
function receiveBattle(next){
 if(presentation.busy){
  const queued=battleUpdates.at(-1);
  if(battleUpdates.length&&queued?.id===next?.id&&queued?.last?.n===next?.last?.n)
   battleUpdates[battleUpdates.length-1]=next;
  else battleUpdates.push(next);
  return;
 }
 if(next?.id!==battle?.id){
  presentation.setActive(false);
  showBattleLog=false;
  delete $('battle').dataset.battleId;
  delete $('battle').dataset.last;
 }
 if(next?.id!==battle?.id||next?.turn!==battle?.turn||next?.auto!==battle?.auto||next?.finished){
  selected=null;pendingTurn=null;
 }
 presentation.holdHp(battle,next);
 battle=next;battleKey='';
 if(battle)renderBattle();
 else hideBattle();
}
function continueBattle(){
 if(battleUpdates.length)receiveBattle(battleUpdates.shift());
 else if(!viewingBattle())hideBattle();
 else{battleKey='';renderBattle();}
}
function hideBattle(){
 if(presentation.busy)return;
 $('battle').hidden=true;
 presentation.setActive(false);
}
function reset(message='',clearInvite=false){
 battleUpdates.length=0;
 spectatorPan.x=spectatorPan.y=0;spectatorDrag=null;
 presentation.walk(false);
 presentation.setActive(false);
 hideBattle();
 opening=queued=leaving=false;clearTimeout(leaveTimer);$('leave').disabled=false;
 if(clearInvite){
  $('code').value='';
  const url=new URL(location.href);
  if(url.searchParams.has('room')){url.searchParams.delete('room');history.replaceState(history.state,'',url);}
 }
 store(null);packet=null;clearTimeout(retry);const current=ws;ws=null;current?.close();
 state=me=local=battle=null;actors.clear();scene.camera=null;lobbyKey='';battleKey='';teamHpKey='';survivalRankKey='';lastInput='';
 pendingMoves=[];pendingChest=null;correction=null;
 resultKey='';
 $('match-results').hidden=true;
 $('survival-standings').open=false;
 $('arena').hidden=$('room').hidden=$('rank-queue').hidden=true;$('lobby').hidden=$('entry').hidden=false;$('notice').textContent=message;
 updateEntryControls();
 if(mapDialog.open)mapDialog.close();
}
function showRankQueue(message){
 const first=!queued;
 opening=false;
 queued=true;
 store({type:'ranked',mode:message.mode});
 $('entry').hidden=$('room').hidden=true;
 $('rank-queue').hidden=false;
 $('notice').textContent='';
 $('rank-queue-title').textContent=message.mode==='team'?'ค้นหาแมตช์ทีม 5 ต่อ 5':'ค้นหาแมตช์เอาตัวรอด 10 คน';
 const count=message.count+' / 10 ผู้เล่นที่เข้ากลุ่มได้';
 if($('rank-queue-count').textContent!==count)$('rank-queue-count').textContent=count;
 const elapsed=message.elapsed;
 $('rank-queue-detail').textContent=elapsed<240_000?'ขยายช่วงระดับโล่ใน '+clock(240_000-elapsed):
  elapsed<360_000?'กำลังค้นหาข้ามระดับโล่ · เติมบอทได้ใน '+clock(360_000-elapsed):
  message.mode==='team'?'กำลังจัดผู้เล่นจริงให้เท่ากันทั้งสองทีมก่อนเติมบอท':'กำลังจัดแมตช์และเติมบอท';
 updateEntryControls();
 if(first)$('cancel-rank-queue').focus();
}
$('cancel-rank-queue').onclick=()=>{
 if(!send({type:'cancelRank'}))reset();
};
function abandonRanked(){
 if(!state?.ranked||state.phase!=='match')return;
 if(!confirm(window.SoulbeastLocale?.text('ออกก่อนจบจะเสีย 2 แต้มและถูกระงับการเล่นจัดอันดับ ต้องการออกจากแมตช์หรือไม่?')??'ออกก่อนจบจะเสีย 2 แต้มและถูกระงับการเล่นจัดอันดับ ต้องการออกจากแมตช์หรือไม่?'))return;
 if(!send({type:'rankLeave'})){
  $('signal').textContent='กำลังเชื่อมต่อกลับเข้าสนาม…';
  $('signal').hidden=false;
 }
}
$('rank-leave').onclick=abandonRanked;
$('rank-leave-respawn').onclick=abandonRanked;

const entryForm=$('entry-form');
const selectedMode=()=>entryForm.elements.mode.value;
function updateModeOptions(){
 const survival=selectedMode()==='survival';
 $('create-private').textContent=survival?'สร้างห้องเอาตัวรอด':'สร้างห้องทีม';
 $('practice-label').textContent=survival?'ทดลองเอาตัวรอด 10 คน':'ทดลอง 5 ต่อ 5 กับบอท';
 $('practice-detail').textContent=survival?'คุณ 1 คน · คู่แข่งบอท 9 ตัว':'เล่นคนเดียว · เพื่อนบอท 4 · คู่แข่งบอท 5';
 for(const section of $('rules').querySelectorAll('[data-rules-mode]')){
  section.hidden=section.dataset.rulesMode!==selectedMode();
 }
}
entryForm.addEventListener('change',event=>{
 if(event.target.name==='mode')updateModeOptions();
});
updateModeOptions();
$('open-rules').onclick=()=>$('rules').showModal();

function applyState(next){
 const arrival=performance.now();
 const entering=opening||!state;
 if(next.spectating!==state?.spectating){
  spectatorPan.x=spectatorPan.y=0;spectatorDrag=null;scene.camera=null;
  if(next.spectating){
   battleUpdates.length=0;battle=null;battleKey='';
   presentation.setActive(false);hideBattle();
  }
 }
 opening=false;state=next;offset=next.now+oneWay-arrival;
 if(entering)updateEntryControls();
 $('lobby').hidden=state.phase!=='lobby';$('arena').hidden=state.phase==='lobby';
 $('entry').hidden=true;$('room').hidden=false;
 if(state.phase==='lobby'){renderLobby();return;}
 me=own();
 if(state.rankSaved&&Number.isFinite(me?.rating)&&selectedRating!==me.rating){
  selectedRating=me.rating;
  renderRankProfile();
 }
 renderMatchResults();
 if(!me||!Number.isFinite(me.x))return;
 const solo=state.mode==='survival';
 scene.arena=solo?SURVIVAL_ARENA:TEAM_ARENA;
 $('blue-label').textContent=solo?'เหลือผู้รอด':'ไพลิน';
 $('red-label').textContent=solo?'พื้นที่ปลอดภัย':'ทับทิม';
 $('vitals-label').textContent=solo?'พลังของคุณ':'HP ทีมเรา';
 $('map-legend').textContent=solo?'กรอบเขียว พื้นที่ปลอดภัย · ◎ ตำแหน่งมุมมอง':'◆ ฐานใหญ่ · ▣ ฐานกลาง · □ ฐานเล็ก · เส้นแสดงฐานที่เชื่อมกัน';
 renderTeamHp();
 renderSurvivalRank(solo);
 pendingMoves=pendingMoves.filter(move=>move.seq>next.ack);
 if(!local||local.warp!==me.warp||local.phase!==me.phase){
  local={...me};correction=null;pendingMoves=[];if(me.phase!=='walk')release();
 }else{
  const expected=me.phase==='walk'?replayMovement(me,next):me;
  const err=distance(local,expected);
  if(err>145||!scene.arena.fits(local.x,local.y)){local.x=expected.x;local.y=expected.y;correction=null;}
  else correction=err>7?{x:expected.x-local.x,y:expected.y-local.y}:null;
  for(const k of ['phase','connected','safeUntil','repairingBase','rating'])local[k]=me[k];
 }
 const visible=[...next.players.filter(p=>p.id!==me.id&&Number.isFinite(p.x)&&p.connected&&p.phase!=='dead'),...next.shadows,...next.bosses];
 const ids=new Set(visible.map(p=>p.id));
 for(const id of actors.keys())if(!ids.has(id))actors.delete(id);
 for(const p of visible){
  const q=actors.get(p.id);
  if(!q||q.warp!==p.warp||distance(q.samples.at(-1),p)>160)actors.set(p.id,{...p,samples:[{x:p.x,y:p.y,at:next.now}]});
  else{
   const {x,y}=q;Object.assign(q,p,{x,y});
   if(next.now>q.samples.at(-1).at)q.samples.push({x:p.x,y:p.y,at:next.now});
   if(q.samples.length>6)q.samples.shift();
  }
 }
 if((state.phase!=='match'||me.phase!=='walk'&&!state.spectating)&&mapDialog.open)mapDialog.close();
 if(!viewingBattle())hideBattle();
}
function shieldIcon(score){
 const shield=shieldFor(score);
 if(!shield)return null;
 const icon=node('img',null,'rank-shield');
 icon.src=shieldUrl(shield);
 icon.dataset.rank=shield.id;
 icon.alt=icon.title=shield.name;
 icon.width=24;
 icon.height=24;
 return icon;
}
function playerName(name,score){
 const label=node('span',null,'rank-name');
 const badge=shieldIcon(score);
 if(badge)label.append(badge);
 label.append(name);
 return label;
}
function scoreTable(label,headings,rows){
 const table=node('table',null,'rank-table');
 table.append(node('caption',label));
 const header=node('tr');
 for(const heading of headings){
  const cell=node('th',heading);
  cell.scope='col';
  header.append(cell);
 }
 const thead=node('thead');
 thead.append(header);
 const tbody=node('tbody');
 for(const row of rows){
  const tr=node('tr');
  for(const value of row){
   const cell=node('td');
   cell.append(value);
   tr.append(cell);
  }
  tbody.append(tr);
 }
 table.append(thead,tbody);
 return table;
}
function renderMatchResults(){
 const panel=$('match-results');
 panel.hidden=state.phase!=='finished';
 if(panel.hidden)return;
 const key=JSON.stringify([state.finishedAt,state.results,state.rankDelta,state.rankSaved,state.rankingAvailable,state.rankPending,state.placement,me?.rating]);
 if(key===resultKey)return;
 resultKey=key;
 const sections=(state.results||[]).map((team,i)=>{
  const rows=team.map(p=>{
   const name=playerName(p.name,state.players.find(player=>player.id===p.id)?.rating??p.rating);
   if(p.mvp)name.append(node('small','MVP','mvp-label'));
   return [name,String(p.points),String(p.kills)];
  });
  return scoreTable(TEAMS[i],['ผู้เล่น','คะแนน','สังหาร'],rows);
 });
 if(state.rankDelta!=null){
  const delta=state.rankDelta>0?'+'+state.rankDelta:String(state.rankDelta);
  const message=state.rankSaved?'แต้มสะสม '+delta+' · รวม '+me.rating
   :state.rankingAvailable?'กำลังบันทึกแต้มสะสม '+delta:'แต้มสะสมยังไม่พร้อมใช้งาน';
  sections.push(node('p',message,'rank-result'));
 }else if(state.reason!=='error'){
  sections.push(node('p',state.rankPending?'กำลังตรวจสอบผลจัดอันดับ…':'แมตช์นี้ไม่คิดแต้มสะสม','rank-result'));
 }
 panel.replaceChildren(...sections);
}

function renderLobby(){
 const key=JSON.stringify([state.players,state.canStart,state.host,state.canManageBots]);if(key===lobbyKey)return;lobbyKey=key;
 $('room-code').textContent=state.code;
 $('public-room-label').hidden=!state.isPublic;
 const p=own();
 if(state.mode==='survival'){
  const box=node('div',null,'roster'), list=node('ul');
  box.append(node('h2',`เอาตัวรอด · ${state.players.length}/10 คน`),list);
  list.append(...state.players.map(lobbySeat));
  if(state.canManageBots)box.append(addBotButton(null,state.players.length>=10));
  $('rosters').replaceChildren(box);$('rosters').classList.add('survival');
 }else{
 $('rosters').classList.remove('survival');
 $('rosters').replaceChildren(...TEAMS.map((name,i)=>{
  const list=state.players.filter(u=>u.side===i), box=node('div',null,'roster');box.style.setProperty('--team',COLORS[i]);
  box.append(node('h2',`${name} · ${list.length}/5`));
  const ul=node('ul');
  ul.append(...list.map(lobbySeat));
  box.append(ul);
  if(state.canManageBots)box.append(addBotButton(i,list.length>=5));
  if(p.side!==i){
   const btn=node('button',`ย้ายไปทีม${name}`,'secondary');btn.disabled=list.length>=5;btn.onclick=()=>send({type:'team',side:i});box.append(btn);
  }
  return box;
 }));
 }
 $('ready').textContent=p.ready?'ยกเลิกพร้อม':'ยืนยันพร้อม';
 $('start').hidden=p.id!==state.host;$('start').disabled=!state.canStart;
}
function lobbySeat(u){
 const li=node('li',`${u.name} · Lv ${u.lv}${u.bot?' · '+(u.className||CLASSES[u.baseCls]||''):u.ready?' ✓':''}${u.connected?'':' · หลุด'}`);
 li.dataset.ready=String(u.ready);
 const badge=shieldIcon(u.rating);
 if(badge)li.prepend(badge);
 if(u.bot&&state.canManageBots){
  const remove=node('button','เอาออก','secondary remove-bot');
  remove.setAttribute('aria-label','เอา '+u.name+' ออกจากห้อง');
  remove.onclick=()=>send({type:'removeBot',id:u.id});
  li.append(remove);
 }
 return li;
}
function addBotButton(side,full){
 const button=node('button',side===null?'เพิ่มบอท':`เพิ่มบอททีม${TEAMS[side]}`,'secondary add-bot');
 button.disabled=full;
 button.onclick=()=>send({type:'addBot',side});
 return button;
}
const classEmblems={swordsman:'sword',archer:'bow',mage:'arcane',summoner:'summon'};
const statusLabels={burn:'ไฟไหม้',poison:'พิษ',para:'อัมพาต',sleep:'หลับ',freeze:'แช่แข็ง',
 confuse:'สับสน',charm:'หลงเสน่ห์',chill:'หนาวเย็น',static:'ไฟฟ้าสถิต',love:'หลงรัก'};
function frameArt(unit){
 if(unit.kind==='player')return assets+'ui/element-card-scenes/class-'+(classEmblems[unit.baseCls||unit.cls]||'sword')+'.webp';
 return assets+'ui/element-card-scenes/element-'+(unit.types?.[0]||'normal')+'.webp';
}
function combatPose(unit){
 if(unit.form&&pvpCardArt['form:'+unit.form])return pvpCardArt['form:'+unit.form];
 if(unit.kind==='player'){
  return pvpCardArt[`${unit.cls}-${sealerGender(unit)}`];
 }
 const form=unit.evo||0,pose=pvpCardArt[`${unit.sp}:${form}`];
 return pose||(beastPortraits[unit.sp]?.[form]?undefined:pvpCardArt[`${unit.sp}:0`]);
}
function unitCard(unit,current,selectable,choose){
 const card=node(selectable?'button':'div',null,'card');
 card.title=`${unit.name} · Lv ${unit.lv} · HP ${unit.hp}/${unit.maxHp} · MP ${unit.mp}/${unit.maxMp}`;
 const aura=unit.baseAura===true?20:unit.baseAura;
 const auraLabel=`ออร่าฐาน โจมตี +${aura}% · ป้องกัน +${aura}%`;
 if(aura)card.title+=' · '+auraLabel;
 card.dataset.unitId=unit.id;
 card.dataset.dead=String(unit.hp<=0);
 card.dataset.current=String(unit.id===current);
 card.dataset.frame=unit.kind==='player'?'black':beastPortraits[unit.sp]?.length>1?['white','green','blue'][unit.evo||0]||'white':'purple';
 card.style.setProperty('--painted-card-bg',`url("${frameArt(unit)}")`);
 if(selectable){card.classList.add('battle-target');card.onclick=choose;}
 const face=node('span',null,'battle-face');
 const pose=combatPose(unit);
 const art=node('img');
 const portraits=beastPortraits[unit.sp];
 const fallback=unit.sp?battleAsset(portraits?.[unit.evo||0]||portraits?.[0]):portrait(unit);
 const source=battleAsset(pose?.idle)||fallback;
 art.alt='';
 if(source)art.src=source;
 if(pose?.idle){
  art.dataset.pvpIdle=pose.motion||'breathe';
  art.dataset.pose='idle';
  for(const phase of ['idle','melee','windup','hit','threat','power','meleeEffect'])
   if(pose[phase])art.dataset[phase]=battleAsset(pose[phase]);
  if(pose.origin)art.dataset.origin=pose.origin.join(',');
  if(pose.windupDuration)art.dataset.windupDuration=pose.windupDuration;
 }
 art.onerror=()=>{
  const phase=art.dataset.pose;
  if(phase&&phase!=='idle'){
   delete art.dataset[phase];art.dataset.pose='idle';art.src=art.dataset.idle;
  }else{
   delete art.dataset.pvpIdle;art.onerror=null;
   if(fallback&&art.getAttribute('src')!==fallback)art.src=fallback;
   else art.removeAttribute('src');
  }
 };
 face.append(art);
 const name=node('b',unit.name);
 const badge=unit.kind==='player'&&shieldIcon(state.players.find(p=>p.id===battle?.roster[unit.owner])?.rating);
 if(badge)name.prepend(badge);
 const meters=[['HP',unit.hp,unit.maxHp],['MP',unit.mp,unit.maxMp]].map(([label,value,max])=>{
  const meter=node('meter',null,label.toLowerCase());
  meter.min=0;meter.max=Math.max(1,max);meter.value=value;
  meter.setAttribute('aria-label',label);
  return meter;
 });
 const stats=node('div',null,'battle-meter');
 const level=node('small',`Lv ${unit.lv}`,'battle-level');
 if(aura){
  const badge=node('span','◆','battle-base-aura');
  badge.title=auraLabel;badge.setAttribute('aria-label',auraLabel);
  level.append(' ',badge);
 }
 stats.append(name,level,...meters);
 const statuses=(unit.statuses||[]).filter(status=>Object.hasOwn(statusLabels,status));
 if(statuses.length){
  const strip=node('span',null,'battle-statuses');
  for(const status of statuses){
   const icon=node('img');icon.src=assets+'ui/status/'+status+'.webp';
   icon.alt=statusLabels[status];icon.title=statusLabels[status];strip.append(icon);
  }
  stats.append(strip);
 }
 card.append(face,stats);
 return card;
}
function skillButton(skill,enabled,onClick){
 const button=node('button',null,'battle-skill');
 button.disabled=!enabled;button.onclick=onClick;
 const icon=node('img');
 icon.src=assets+'skills/painted-v2/'+skill.id+'.webp';icon.alt='';
 icon.onerror=()=>{icon.onerror=null;icon.src=assets+'ui/unit-frames/sword.svg';};
 const caption=node('span',skill.name);
 const mp=node('small',skill.mp?`${skill.mp} MP`:'ไม่ใช้ MP');
 button.append(icon,caption,mp);
 return button;
}
function renderBattle(){
 const panel=$('battle'),inCombat=me?.phase==='battle'&&state?.phase==='match',watch=watchedPlayer();
 if(!battle||(!viewingBattle()&&panel.hidden))return;
 const b=battle,effectKey=`${b.id}:${b.last?.n??0}`,playEffect=panel.dataset.last!==effectKey&&!!b.last;
 const can=inCombat&&!playEffect&&!presentation.busy&&!battleUpdates.length&&b.commands.length>0&&now>=b.openAt&&now<b.deadline&&pendingTurn!==b.turn;
 const position=watch||me,inFog=!insideFogSafe(state.zone,position.x,position.y);
 const key=`${b.id}:${b.turn}:${b.last?.n}:${b.finished}:${b.auto}:${can}:${selected?.id}:${pendingTurn}:${inFog}`;
 if(battleKey===key)return;
 const first=panel.dataset.battleId!==b.id;
 const previousStage=panel.querySelector('.battle-stage')?.scrollTop||0;
 const previousCommands=panel.querySelector('.commands')?.scrollTop||0;
 battleKey=key;panel.dataset.last=effectKey;panel.dataset.battleId=b.id;panel.hidden=false;
 presentation.setActive(true);
 const isPvp=b.teams[1].length>0;
 const host=node('div',null,'battle-inner'), title=node('div',null,'battle-title');
 title.append(node('b',isPvp?`PvP · ${b.teams[0].length} ต่อ ${b.teams[1].length}`:b.boss?'ศึกบอสโคลอสเซียม':'ปะทะอสูรเงา'),
  node('span',inFog?'☠ หมอกพิษ · เสีย HP 2%/วิ':`รอบ ${b.round}`,inFog?'battle-fog':null));
 const stage=node('div',null,'battle-stage');
 host.append(title,stage);
 const known=[...b.allies,...b.enemies], current=known.find(u=>u.id===b.cur);
 const solo=state.mode==='survival',order=b.teams[1].includes(position.id)?[0,1]:[1,0];
 function act(skill,target){
  if(send({type:'combat',turn:b.turn,skill,target})){
   pendingTurn=b.turn;selected=null;renderBattle();
   setTimeout(()=>{if(battle?.id===b.id&&pendingTurn===b.turn){pendingTurn=null;renderBattle();}},1000);
  }
 }
 for(const side of order){
  const units=side?b.enemies:b.allies, slots=b.teams[side];
  const own=side===order[1];
  const section=node('div',null,`battle-side${slots.length<=1?' solo':''}`);
  if(slots.length)section.style.setProperty('--team',solo?(own?'#e9ca85':COLORS[1]):COLORS[isPvp?side:me.side]);
  const sideName=slots.length?(solo?(own?(watch?'ผู้เล่นที่กำลังชม':'ฝ่ายเรา'):'คู่ต่อสู้'):`${own?'ทีมเรา':'ฝ่ายตรงข้าม'} · ${TEAMS[isPvp?side:me.side]}`):b.boss?'ออร่าบอสโคลอสเซียม':'อสูรเงา';
  const header=node('div',null,'battle-side-title');
  header.append(node('b',sideName),node('small',`${units.filter(unit=>presentation.hp(unit)>0).length}/${units.length}`));
  section.append(header);
  for(const owner of slots.length?slots:[null]){
   const group=units.filter(u=>owner===null||b.roster[u.owner]===owner);
   const row=node('div',null,'battle-row');row.style.setProperty('--cols',Math.max(slots.length>1?4:1,group.length));
   if(slots.length>1)section.append(node('small',group.find(unit=>unit.kind==='player')?.name,'battle-owner'));
   for(const u of group){
    row.append(unitCard({...u,hp:presentation.hp(u)},b.cur,can&&selected?.targets.includes(u.id),()=>act(selected.id,u.id)));
   }
   for(let i=group.length;slots.length>1&&i<4;i++){
    const empty=node('span',null,'battle-slot-empty');empty.setAttribute('aria-hidden','true');row.append(empty);
   }
   section.append(row);
  }
  stage.append(section);
 }
 const footer=node('div',null,'battle-footer'), controls=node('div',null,'battle-controls');
 const status=node('b',b.finished?'จบการต่อสู้':pendingTurn===b.turn?'ส่งคำสั่งแล้ว':b.commands.length?`ตาของ ${current?.name??''}`:`รอ ${current?.name??'เทิร์นถัดไป'}`);
 const heading=node('div',null,'battle-turn');
 heading.append(status);
 if(!b.finished){const timer=node('time');timer.id='turn-timer';heading.append(timer);}
 const logButton=node('button',showBattleLog?'ย่อรายงาน':'รายงาน','secondary');
 logButton.setAttribute('aria-expanded',String(showBattleLog));
 logButton.onclick=()=>{showBattleLog=!showBattleLog;battleKey='';renderBattle();};
 const soundButton=node('button',presentation.enabled?'ปิดเสียง':'เปิดเสียง','secondary');
 soundButton.setAttribute('aria-label','เสียงฉากต่อสู้');
 soundButton.setAttribute('aria-pressed',String(presentation.enabled));
 soundButton.onclick=()=>{
  presentation.toggle();
  syncWalkSound();
  soundButton.textContent=presentation.enabled?'ปิดเสียง':'เปิดเสียง';
  soundButton.setAttribute('aria-pressed',String(presentation.enabled));
 };
 const actions=node('div',null,'battle-control-buttons');
 if(!b.finished&&!watch){
  const autoButton=node('button',b.auto?'อัตโนมัติ: เปิด':'สู้อัตโนมัติ','secondary battle-auto');
  autoButton.setAttribute('aria-label','สู้อัตโนมัติ');
  autoButton.setAttribute('aria-pressed',String(b.auto));
  autoButton.onclick=()=>send({type:'combatAuto',enabled:!b.auto});
  actions.append(autoButton);
 }
 actions.append(logButton,soundButton);
 controls.append(heading,actions);
 footer.append(controls);
 if(solo&&state.nextEliminationAt){
  const cut=node('p',null,'battle-survival-score');cut.id='battle-elimination-clock';footer.append(cut);
 }
 const recent=b.log.at(-1);
 if(recent||b.last){
  const log=node('div',null,'battle-log');
  if(showBattleLog)log.append(...b.log.map(line=>node('p',line)));
  else log.append(node('p',b.finished?recent:b.last?`${known.find(u=>u.id===b.last.actor)?.name??''} · ${b.last.skill}`:recent));
  footer.append(log);
 }
 const cmds=node('div',null,'commands');
 if(!b.finished&&b.commands.length){
  if(selected){
   const prompt=node('p',`${selected.name} · แตะการ์ดที่เรืองแสงเพื่อเลือกเป้าหมาย`,'battle-prompt');
   const back=node('button','กลับไปเลือกท่า','secondary');
   back.onclick=()=>{selected=null;renderBattle();};
   cmds.append(prompt,back);
  }else for(const skill of b.commands)cmds.append(skillButton(skill,can,()=>{
   if(skill.targets.length<=1)act(skill.id,skill.targets[0]);else{selected=skill;renderBattle();}
  }));
 }
 if(cmds.childElementCount)footer.append(cmds);
 if(state.ranked&&!watch&&!b.finished){
  const leave=node('button','ออกจากแมตช์จัดอันดับ','secondary battle-rank-leave');
  leave.onclick=abandonRanked;
  footer.append(leave);
 }
 host.append(footer);
 panel.replaceChildren(host);
 presentation.syncPoses();
 if(!first)stage.scrollTop=previousStage;
 if(!first&&!selected)cmds.scrollTop=previousCommands;
 if(playEffect)presentation.action(b.last,[...b.allies,...b.enemies].find(unit=>unit.id===b.last.actor),b.effects||[],b.fx||[],b.finished,()=>{
  battleKey='';renderBattle();
 },continueBattle);
 else if(battleUpdates.length&&!presentation.busy)continueBattle();
}

function renderRankProfile(){
 const rating=selectedRating??0,shield=shieldFor(rating);
 for(const [image,text] of [['mode-rank-shield','mode-rank-text'],['queue-rank-shield','queue-rank-text']]){
  $(image).replaceChildren(shieldIcon(rating));
  $(text).textContent=shield.name+' · '+rating+' แต้ม';
 }
}
function renderRankLadder(){
 const list=$('rank-ladder-list');
 list.replaceChildren(...SHIELDS.map((shield,i)=>{
  const item=node('li');
  const upper=SHIELDS[i+1]?.minimum-1;
  const range=i===0?'10 แต้มลงไป':i===SHIELDS.length-1?'101 แต้มขึ้นไป':shield.minimum+'–'+upper+' แต้ม';
  item.append(shieldIcon(i===0?0:shield.minimum),node('b',shield.name),node('small',range));
  return item;
 }));
}
function showSelectedProfile(){
 const label=selectedCharacter.name+' · Lv '+selectedCharacter.lv;
 $('selected-profile').textContent=label;
}
async function loadSelectedRating(){
 try{
  const {accountRealtimeConfig:{url,key}}=await import('../../client/account-client.mjs?v=admin-session-20261107');
  const response=await fetch(new URL('/rest/v1/rpc/sb_colosseum_rating',url),{
   method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
   body:JSON.stringify({p_code:accountContext.code}),signal:AbortSignal.timeout(8000),
  });
  if(!response.ok)return;
  const rating=await response.json();
  if(!Number.isInteger(rating)||selectedRating!==null)return;
  selectedRating=rating;
  renderRankProfile();
  if(ws?.local)send({type:'displayRating',rating});
 }catch{}
}
renderRankProfile();
renderRankLadder();
for(const [id,name] of Object.entries(CLASSES))$('cls').add(new Option(name,id));
const fromLink=params.get('room'),country=params.get('country')||selectedCharacter?.country;
if(['blue','green','red'].includes(country)){
 $('country-return').href='../hemant-walk-demo/?country='+country+'&arrival=colosseum';
}
if(selectedCharacter){
 $('demo-profile').hidden=$('demo-profile').disabled=true;
 showSelectedProfile();
 $('selected-profile').hidden=false;
}
if(gameWeb&&accountContext?.environment==='live'&&selectedCharacter){
 void loadSelectedRating();
}
if(!onlineEnabled){
 $('code').disabled=true;
 $('notice').textContent='โหมดออนไลน์กำลังรอเปิดเซิร์ฟเวอร์ · ทดลองกับบอทได้';
}
updateEntryControls();
if(/^[A-F0-9]{8}$/i.test(fromLink??''))$('code').value=fromLink.toUpperCase();
$('entry-form').onsubmit=event=>{
 event.preventDefault();
 if(opening||queued||state)return;
 const action=event.submitter?.value??'create',mode=selectedMode(),code=$('code').value.trim().toUpperCase();
 let type=action;
 if(mode==='survival'){
  if(action==='create')type='survival';
  if(action==='practice')type='survivalPractice';
 }
 if(!practiceType(type)&&!onlineEnabled)return;
 if(gameWeb&&!selectedCharacter){location.assign('../../accounts.html');return;}
 if(type==='join'&&!/^[A-F0-9]{8}$/.test(code)){$('notice').textContent='กรอกรหัสห้อง 8 ตัวก่อน';return;}
 if(ws){const old=ws;ws=null;old.close();}
 connect({type,code,mode,name:$('name').value,cls:$('cls').value,lv:$('level').value});
};
$('ready').onclick=()=>{if(!leaving)send({type:'ready',ready:!own()?.ready});};
$('start').onclick=()=>{if(!leaving)send({type:'start'});};
$('leave').onclick=()=>{
 if(leaving||state?.phase!=='lobby')return;
 if(!send({type:'leave'})){reset('ออกจากหน้าห้องแล้ว เซิร์ฟเวอร์จะคืนที่นั่งหลังหมดเวลารอเชื่อมต่อ',true);return;}
 leaving=true;$('leave').disabled=true;
 $('notice').textContent='กำลังออกจากห้อง…';
 leaveTimer=setTimeout(()=>reset('ออกจากหน้าห้องแล้ว เซิร์ฟเวอร์จะคืนที่นั่งหลังหมดเวลารอเชื่อมต่อ',true),5000);
};
function leavePractice(){
 if(!send({type:'leavePractice'}))reset();
}
$('back').onclick=()=>state?.practice?leavePractice():reset();
$('spectator-leave').onclick=$('back').onclick;
function cycleSpectator(step){
 const survivors=state?.players.filter(p=>p.connected&&p.phase!=='dead')||[];
 if(survivors.length<2)return;
 const current=survivors.findIndex(p=>p.id===state.spectating);
 send({type:'spectate',target:survivors[(current+step+survivors.length)%survivors.length].id});
}
$('spectator-prev').onclick=()=>cycleSpectator(-1);
$('spectator-next').onclick=()=>cycleSpectator(1);
const world=$('world');
world.addEventListener('pointerdown',e=>{
 if(!state?.spectating)return;
 world.setPointerCapture(e.pointerId);
 spectatorDrag={id:e.pointerId,x:e.clientX,y:e.clientY};
});
world.addEventListener('pointermove',e=>{
 if(spectatorDrag?.id!==e.pointerId)return;
 const pan=(value,delta)=>Math.max(-480,Math.min(480,value+delta));
 spectatorPan.x=pan(spectatorPan.x,spectatorDrag.x-e.clientX);
 spectatorPan.y=pan(spectatorPan.y,spectatorDrag.y-e.clientY);
 spectatorDrag.x=e.clientX;spectatorDrag.y=e.clientY;
});
world.addEventListener('lostpointercapture',()=>{spectatorDrag=null;});
$('leave-practice').onclick=leavePractice;
$('copy').onclick=async()=>{
 const link=new URL(location.pathname,location.href);link.searchParams.set('room',state.code);
 try{await navigator.clipboard.writeText(link.href);$('notice').textContent='คัดลอกลิงก์ห้องแล้ว';}
 catch{$('notice').textContent=link.href;}
};
$('map').onclick=()=>{release();mapDialog.showModal();};
function objective(){
 if(!me||state.phase!=='match'||me.phase!=='walk')return null;
 if(now>=me.safeUntil){
  const chest=state.chests.find(c=>scene.arena.chestInReach(local||me,c));
  if(chest)return {type:'chest',id:chest.id,disabled:pendingChest===chest.id,
   label:pendingChest===chest.id?'กำลังเปิดหีบ…':state.mode==='survival'?'เปิดหีบ · +5 คะแนน':'เปิดหีบสมบัติ'};
  const base=state.bases.find(b=>RAID_TARGET(me,b));
  if(base){
   const allowed=canRaidBase(me.side,base,state.bases);
   return {type:'raid',id:base.id,disabled:!allowed,label:allowed?`จู่โจม${base.label} · ${base.remaining}/${base.maxDurability??4} · +${base.points}`:
    base.main?'ยึดฐานกลางที่เชื่อมอยู่ก่อน':'ยึดฐานเล็กที่เชื่อมอยู่ก่อน'};
  }
 }
 if(!state.vitals)return null;
 const friendly=state.bases.find(b=>HEAL_TARGET(me,b));
 return friendly?{type:'healBase',id:friendly.id,label:friendly.main?'ฟื้นเต็มทั้งทีม + ล้างสถานะ':'ฟื้น HP/MP ทั้งทีม 30%',
  disabled:me.hp>=me.maxHp&&state.vitals.mp>=state.vitals.maxMp&&!(friendly.main&&state.vitals.ailments.length)}:null;
}
$('raid').onclick=()=>{
 const target=objective();
 if(target&&!target.disabled&&send({type:target.type,id:target.id})&&target.type==='chest')pendingChest=target.id;
};
function renderTeamHp(){
 const team=state.players.filter(p=>p.side===me.side&&Number.isFinite(p.maxHp));
 const {mp,maxMp}=state.vitals??{};
 const key=JSON.stringify([team.map(p=>[p.id,p.hp,p.maxHp]),mp,maxMp]);
 if(key===teamHpKey)return;
 teamHpKey=key;
 $('team-hp').replaceChildren(...team.map(p=>{
  const label=p.id===me.id?p.name+' (คุณ)':p.name;
  const li=node('li'), name=node('span',label), value=node('span',`${p.hp}/${p.maxHp}`), bar=node('meter');
  name.title=label;bar.max=p.maxHp;bar.value=p.hp;bar.setAttribute('aria-label',`HP ${label}`);
  li.append(name,value,bar);return li;
 }));
 $('own-mp').textContent=Number.isFinite(maxMp)?`MP คุณ ${mp}/${maxMp}`:'';
}
function renderSurvivalRank(solo){
 const enabled=solo&&Number.isFinite(me.points);
 $('survival-standings').hidden=!enabled;
 $('elimination-clock').hidden=!enabled||!state.nextEliminationAt;
 if(!enabled)return;
 const ranks=state.players.filter(p=>p.phase!=='dead').sort((a,b)=>b.points-a.points||a.scoreAt-b.scoreAt);
 const key=JSON.stringify([me.points,ranks.map(p=>[p.id,p.points])]);
 if(key===survivalRankKey)return;
 survivalRankKey=key;
 $('survival-points').textContent=`คะแนนคุณ ${me.points} · ดูอันดับ`;
 $('survival-ranks').replaceChildren(...ranks.map((p,i)=>{
  const item=node('li'),name=node('span',`${i+1}. ${p.name}`);
  name.title=p.name;
  if(p.id===me.id)item.setAttribute('aria-current','true');
  item.append(name,node('b',p.points));return item;
 }));
}
const keyboard=['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'];
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(me?.phase==='walk'&&!mapDialog.open&&keyboard.includes(k)){if(!keys.has(k)){keys.add(k);sendMove(...direction());}e.preventDefault();}
});
addEventListener('keyup',e=>{if(keys.delete(e.key.toLowerCase())&&me?.phase==='walk')sendMove(...direction());});
addEventListener('blur',release);
document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
function release(){
 keys.clear();stick={x:0,y:0,id:null};$('thumb').style.transform='';
 if(me?.phase==='walk')sendMove(0,0);
}
function pointer(e){
 const bounds=$('stick').getBoundingClientRect(),r=bounds.width*.34;
 let dx=(e.clientX-bounds.left-bounds.width/2)/r,dy=(e.clientY-bounds.top-bounds.height/2)/r;
 const mag=Math.hypot(dx,dy);
 if(mag<.13)dx=dy=0;else if(mag>1){dx/=mag;dy/=mag;}
 stick.x=dx;stick.y=dy;$('thumb').style.transform=`translate(${dx*r}px,${dy*r}px)`;
}
$('stick').onpointerdown=e=>{
 if(stick.id!==null||me?.phase!=='walk')return;
 $('stick').setPointerCapture(e.pointerId);stick.id=e.pointerId;pointer(e);sendMove(...direction());
};
$('stick').onpointermove=e=>{if(stick.id===e.pointerId)pointer(e);};
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(type,e=>{if(stick.id===e.pointerId)release();});
function direction(){
 if(!me||me.phase!=='walk'||state?.phase!=='match'||mapDialog.open||ws?.readyState!==WebSocket.OPEN)return [0,0];
 const k=(...names)=>Number(names.some(name=>keys.has(name)));
 return [stick.x+k('d','arrowright')-k('a','arrowleft'),stick.y+k('s','arrowdown')-k('w','arrowup')].map(x=>Math.max(-1,Math.min(1,x)));
}
function sendMove(x,y){
 const text=`${x.toFixed(2)}:${y.toFixed(2)}`;
 if((x||y||text!==lastInput)&&send({type:'move',seq:++seq,x,y})){
  lastInput=text;
  pendingMoves.push({seq,x,y,at:performance.now()+offset});
  if(pendingMoves.length>48)pendingMoves.shift();
 }
}
setInterval(()=>{if(state?.phase==='match')sendMove(...direction());},55);
setInterval(()=>{if(state?.phase==='match')send({type:'ping',echo:performance.now()});},5000);
function frame(t){
 const dt=Math.min(.05,(t-previous)/1000);previous=t;
 if(state&&local&&state.phase!=='lobby'){
  now=t+offset;
  const solo=state.mode==='survival',zone=state.zone;
  const startX=local.x,startY=local.y;
  const [dx,dy]=direction();if(dx||dy)walkInArena(scene.arena,zone,local,dx,dy,dt);
  const stepped=Math.hypot(local.x-startX,local.y-startY)>.02;
  if(correction){
   const weight=Math.min(1,dt*10),cx=correction.x*weight,cy=correction.y*weight;
   const x=local.x+cx,y=local.y+cy;
   if(scene.arena.fits(x,y)&&(!insideFogSafe(zone,local.x,local.y)||insideFogSafe(zone,x,y))){
    local.x=x;local.y=y;correction.x-=cx;correction.y-=cy;
   }else correction=null;
  }
  for(const p of actors.values()){
   const renderAt=now-120;
   while(p.samples.length>2&&p.samples[1].at<=renderAt)p.samples.shift();
   const [from,to=from]=p.samples;
   const a=to===from?0:Math.max(0,Math.min(1,(renderAt-from.at)/(to.at-from.at)));
   p.x=from.x+(to.x-from.x)*a;p.y=from.y+(to.y-from.y)*a;
  }
  const all=[...actors.values(),...(local.phase==='dead'?[]:[local])];
  const watch=watchedPlayer(),focus=watch?(actors.get(watch.id)||watch):local;
  scene.render(focus,all,t,state.chests,state.bases,state.traps,now,zone,watch?spectatorPan:null);
  $('blue').textContent=solo?state.survivors:state.score[0];
  $('red').textContent=solo?`${Math.round(zone.remaining*100)}%`:state.score[1];
  $('clock').textContent=solo?(zone.nextAt?clock(zone.nextAt-(state.finishedAt??now)):'☠'):clock(state.ends-(state.finishedAt??now));
  let activity;
  for(let i=state.events.length-1;i>=0;i--)if(state.events[i].type!=='boss'){activity=state.events[i];break;}
  const event=activity&&now-activity.at<4800?activity:null;
  const bossEvent=state.bossEvent;$('boss-announcement').textContent=bossEvent&&now-bossEvent.at<8500?bossEvent.text:'';
  const heal=state.baseHeal;
  const healing=heal&&now-heal.at<3300&&(!event||heal.at>=event.at);
  $('event').textContent=healing?[heal.source,heal.hp?`HP +${heal.hp}`:'',heal.mp?`MP +${heal.mp}`:'',
   heal.petsRecovered?`ฟื้นพลังอสูร ${heal.petsRecovered} ตัว`:'',heal.petsRevived?`ชุบอสูร ${heal.petsRevived} ตัว`:'',
   heal.cleansed?'ล้างสถานะผิดปกติ':''].filter(Boolean).join(' · '):event?.text??'';
  const walking=state.phase==='match'&&me.phase==='walk';
  $('stick').hidden=!walking;$('map').hidden=!walking&&!watch;
  $('arena').toggleAttribute('data-spectating',Boolean(watch));
  $('spectator').hidden=!watch;
  if(watch){
   const label=`${state.placement?'อันดับ '+state.placement+' · ':''}ชม ${watch.name}`;
   if($('spectator-name').textContent!==label)$('spectator-name').textContent=label;
   const canSwitch=state.players.filter(p=>p.connected&&p.phase!=='dead').length>1;
   $('spectator-prev').disabled=$('spectator-next').disabled=!canSwitch;
  }
  $('walk-sound').hidden=!walking;
  presentation.walk(walking,stepped?(scene.arena.bushAt(local)!==null?'leaves':'stone'):null);
  $('objectives').hidden=!walking;
  const repair=walking&&state.baseRepair;
  const repairBase=repair&&state.bases.find(b=>b.id===repair.id&&distance(local,b)<=BASE_REPAIR_RANGE);
  $('base-repair').hidden=!repairBase;
  if(repairBase){
   const label=`กำลังซ่อม${repairBase.label} · ${repairBase.remaining}/${repairBase.maxDurability}`;
   const text=$('base-repair-label');if(text.textContent!==label)text.textContent=label;
   const elapsed=repair.elapsed+Math.min(150,Math.max(0,now-state.now));
   $('base-repair-progress').value=Math.min(BASE_REPAIR_MS-1,elapsed)/BASE_REPAIR_MS;
  }
  $('leave-practice').hidden=!state.practice;
  $('rank-leave').hidden=!state.ranked||!walking;
  const treasure=`หีบเหลือ ${state.chestsLeft}/${state.chestsTotal??CHEST_COUNT}`;
  $('chest-count').textContent=treasure;$('map-chests').textContent=treasure;
  $('boss-clock').textContent=solo?(!insideFogSafe(zone,focus.x,focus.y)?'อยู่ในหมอกพิษ · เสีย HP 2%/วิ':zone.nextAt?`หมอกเข้ามาอีก ${clock(zone.nextAt-now)}`:'หมอกปกคลุมทั้งสนาม'):
   state.nextBossAt?`บอสเกิดอีก ${clock(state.nextBossAt-now)}`:'ไม่มีบอสเกิดเพิ่ม';
  const target=walking&&objective();
  $('raid').hidden=!target;
  if(target){const button=$('raid');button.textContent=target.label;button.dataset.action=target.type;button.disabled=Boolean(target.disabled);}
  if((walking||watch)&&t-lastMap>80){
   drawMap($('mini'),state,all,focus);
   if(mapDialog.open)drawMap($('full-map'),state,all,focus,2);
   lastMap=t;
  }
  const ended=state.phase==='finished',dead=me.phase==='dead';
  $('rank-leave-respawn').hidden=ended||solo||!dead||!state.ranked;
  $('overlay').hidden=(!$('battle').hidden)||Boolean(watch)||!ended&&!dead;$('back').hidden=!ended&&!(solo&&dead);
  if(ended||dead){
   if(solo){
    $('overlay-title').textContent=ended?(state.winner===me.id?'คุณรอดเป็นคนสุดท้าย!':state.winnerName?'จบการประลอง':'เสมอ'):'คุณตกรอบ';
    const result=ended?(state.winnerName?`${state.winnerName} เป็นผู้รอดคนสุดท้าย`:state.reason==='error'?'สนามยุติการเล่น':'ผู้เล่นคนสุดท้ายล้มพร้อมกัน'):
     `เหลือผู้รอด ${state.survivors} คน`;
    $('overlay-text').textContent=[state.placement?'อันดับ '+state.placement:'',state.eliminationCause,result,Number.isFinite(me.points)?`คะแนนคุณ ${me.points}`:''].filter(Boolean).join(' · ');
   }else{
    $('overlay-title').textContent=ended?(state.winner===-1?'เสมอ':state.winner===me.side?'ทีมคุณชนะ!':'ทีมคุณแพ้'):'ผู้ผนึกล้มลง';
    $('overlay-text').textContent=ended?`${state.reason==='base-captured'?`${TEAMS[state.winner]} ยึดฐานใหญ่ · `:state.reason==='error'?'สนามยุติการเล่น · ':''}${TEAMS[0]} ${state.score[0]} : ${state.score[1]} ${TEAMS[1]}`:`เกิดใหม่ที่ฐานใหญ่ใน ${clock(state.respawnAt-now)}`;
   }
  }
  if(walking&&scene.arena.bushAt(local)!==null&&!event&&!healing)$('event').textContent='อยู่ในพุ่มไม้ · ความเร็วครึ่งหนึ่ง';
  renderBattle();
  if(state.nextEliminationAt){
   const cut=`คัดคะแนนต่ำสุดใน ${clock(state.nextEliminationAt-now)}`;
   $('elimination-clock').textContent=cut;
   const battleCut=$('battle-elimination-clock');
   if(battleCut)battleCut.textContent=`คะแนนคุณ ${me.points} · ${cut}`;
  }
  const turn=$('turn-timer');if(turn&&battle)turn.textContent=clock(battle.deadline-now);
 }
 requestAnimationFrame(frame);
}
function syncWalkSound(){
 const button=$('walk-sound');
 button.textContent=presentation.enabled?'🔊':'🔇';
 button.setAttribute('aria-pressed',String(presentation.enabled));
 button.title=presentation.enabled?'ปิดเสียงโคลอสเซียม':'เปิดเสียงโคลอสเซียม';
}
$('walk-sound').onclick=()=>{presentation.toggle();syncWalkSound();};
syncWalkSound();
if(onlineEnabled&&saved())connect(saved());
requestAnimationFrame(frame);
