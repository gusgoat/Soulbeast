const assets = new URL('../../assets/',import.meta.url).pathname;
import {CHEST_COUNT, CLASSES, COLORS, HEAL_TARGET, RAID_TARGET, TEAM_ARENA, TEAMS, distance} from './arena.mjs';
import {SURVIVAL_ARENA, insideFogSafe, walkInArena} from './survival-arena.mjs';
import {Scene, drawMap, portrait, portraitAtlas} from './scene.mjs';
import {battlePresentation} from './battle-presentation.mjs';
import pvpCardArt from './pvp-card-art.mjs';

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
let selectedCharacter=null,accountContext=null;
try{
 selectedCharacter=JSON.parse(sessionStorage.getItem('soulbeast-walk-preview-player-v1')||'null');
 accountContext=JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1')||'null');
 if(accountContext&&selectedCharacter?.code!==accountContext.code)selectedCharacter=null;
}catch{}
const practiceType=type=>type==='practice'||type==='survivalPractice';
const onlineEnabled=!gameWeb||/^https:\/\//i.test(serverURL);
function practiceSocket(){
 const worker=new Worker(new URL('./practice-worker.mjs',import.meta.url),{type:'module'});
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
function connect(payload){
 clearTimeout(retry);packet=payload;
 pendingMoves=[];pendingChest=null;correction=null;oneWay=0;bestRtt=Infinity;
 const useWorker=practiceType(payload.type)&&Boolean(selectedCharacter);
 const base=new URL(serverURL||location.origin);
 const url=new URL('/ws',base);
 url.protocol=base.protocol==='https:'?'wss:':'ws:';
 const socket=useWorker?practiceSocket():new WebSocket(url);
 ws=socket;$('notice').textContent='กำลังเชื่อมต่อสนาม…';
 socket.onopen=async()=>{
  try{
   const ticket=gameWeb?await onlineTicket(base):null;
   if(ws===socket)send(ticket?{...payload,ticket}:payload);
  }catch(error){
   if(ws===socket){ws=null;socket.close();$('notice').textContent=error.message;}
  }
 };
 socket.onmessage=({data})=>{
  if(ws!==socket)return;
  const m=JSON.parse(data);
  if(m.type==='welcome'){
   seq=Math.max(seq,m.seq);if(!socket.local)store({type:'resume',code:m.room,token:m.token});
   send({type:'ping',echo:performance.now()});
   $('signal').hidden=true;$('notice').textContent='';
  }else if(m.type==='left'){reset();}
  else if(m.type==='pong'){acceptPong(m);}
  else if(m.type==='chest-result'){pendingChest=null;}
  else if(m.type==='error'){
   if(m.action==='chest')pendingChest=null;
   if(packet?.type==='resume'&&!state){store(null);packet=null;}
   if(state?.phase==='match'){
    $('signal').textContent=m.message;$('signal').hidden=false;
    setTimeout(()=>{if(ws?.readyState===WebSocket.OPEN)$('signal').hidden=true;},1800);
   }else $('notice').textContent=m.message;
  }else if(m.type==='state')applyState(m);
  else if(m.type==='battle'){
   if(m.battle?.id!==battle?.id){
    presentation.setActive(false);
    showBattleLog=false;
    delete $('battle').dataset.battleId;
    delete $('battle').dataset.last;
   }
   if(m.battle?.id!==battle?.id||m.battle?.turn!==battle?.turn||m.battle?.auto!==battle?.auto||m.battle?.finished){
    selected=null;pendingTurn=null;
   }
   presentation.holdHp(battle,m.battle);
   battle=m.battle;battleKey='';
   if(battle)renderBattle();
   else hideBattle();
  }
 };
 socket.onclose=event=>{
  if(ws!==socket)return;
  release();lastInput='';
  if(event.code===4001){
   store(null);packet=null;
   if(state?.phase==='match'){$('signal').textContent='เปิดห้องเดิมในอีกแท็บแล้ว';$('signal').hidden=false;}
   else $('notice').textContent='เปิดห้องเดิมในอีกแท็บแล้ว';
   return;
  }
  const p=saved();
  if(event.code===1000&&['left','room closed'].includes(event.reason)){reset();return;}
  if(p&&state?.phase!=='finished'){
   $('signal').textContent='กำลังเชื่อมต่อกลับเข้าสนาม…';$('signal').hidden=false;
   retry=setTimeout(()=>connect(p),900);
  }else if(packet)$('notice').textContent='เชื่อมต่อสนามไม่ได้ ลองอีกครั้ง';
 };
 socket.onerror=()=>{};
 if(useWorker){store(null);send({type:payload.type,character:selectedCharacter});}
}
function hideBattle(){
 $('battle').hidden=true;
 presentation.setActive(false);
}
function reset(){
 hideBattle();
 store(null);packet=null;clearTimeout(retry);const current=ws;ws=null;current?.close();
 state=me=local=battle=null;actors.clear();scene.camera=null;lobbyKey='';battleKey='';teamHpKey='';survivalRankKey='';lastInput='';
 pendingMoves=[];pendingChest=null;correction=null;
 $('survival-standings').open=false;
 $('arena').hidden=$('room').hidden=true;$('lobby').hidden=$('entry').hidden=false;$('notice').textContent='';
 if(mapDialog.open)mapDialog.close();
}
function applyState(next){
 const arrival=performance.now();
 state=next;offset=next.now+oneWay-arrival;
 $('lobby').hidden=state.phase!=='lobby';$('arena').hidden=state.phase==='lobby';
 $('entry').hidden=true;$('room').hidden=false;
 if(state.phase==='lobby'){renderLobby();return;}
 me=own();
 if(!me||!Number.isFinite(me.x))return;
 const solo=state.mode==='survival';
 scene.arena=solo?SURVIVAL_ARENA:TEAM_ARENA;
 $('blue-label').textContent=solo?'เหลือผู้รอด':'ไพลิน';
 $('red-label').textContent=solo?'พื้นที่ปลอดภัย':'ทับทิม';
 $('vitals-label').textContent=solo?'พลังของคุณ':'HP ทีมเรา';
 $('map-legend').textContent=solo?'กรอบเขียว พื้นที่ปลอดภัย · ◎ ตำแหน่งคุณ':'◆ ฐานใหญ่ · □ ฐานย่อย · ● ทีมเรา · ◎ ตำแหน่งคุณ';
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
  for(const k of ['phase','connected','safeUntil'])local[k]=me[k];
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
 if((state.phase!=='match'||me.phase!=='walk')&&mapDialog.open)mapDialog.close();
 if(me.phase!=='battle'||state.phase!=='match')hideBattle();
}
function renderLobby(){
 const key=JSON.stringify([state.players,state.canStart,state.host]);if(key===lobbyKey)return;lobbyKey=key;
 $('room-code').textContent=state.code;
 const p=own();
 if(state.mode==='survival'){
  const box=node('div',null,'roster'), list=node('ul');
  box.append(node('h2',`เอาตัวรอด · ${state.players.length}/10 คน`),list);
  for(const u of state.players){
   const li=node('li',`${u.name} · Lv ${u.lv}${u.ready?' ✓':''}${u.connected?'':' · หลุด'}`);
   li.dataset.ready=String(u.ready);list.append(li);
  }
  $('rosters').replaceChildren(box);$('rosters').classList.add('survival');
 }else{
 $('rosters').classList.remove('survival');
 $('rosters').replaceChildren(...TEAMS.map((name,i)=>{
  const list=state.players.filter(u=>u.side===i), box=node('div',null,'roster');box.style.setProperty('--team',COLORS[i]);
  box.append(node('h2',`${name} · ${list.length}/5`));
  const ul=node('ul');
  for(const u of list){
   const li=node('li',`${u.name} · Lv ${u.lv} ${u.ready?' ✓':''}${!u.connected?' · หลุด':''}`);
   li.title=u.name;li.dataset.ready=String(u.ready);ul.append(li);
  }
  box.append(ul);
  if(p.side!==i){
   const btn=node('button',`ย้ายไปทีม${name}`,'secondary');btn.disabled=list.length>=5;btn.onclick=()=>send({type:'team',side:i});box.append(btn);
  }
  return box;
 }));
 }
 $('ready').textContent=p.ready?'ยกเลิกพร้อม':'ยืนยันพร้อม';
 $('start').hidden=p.id!==state.host;$('start').disabled=!state.canStart;
}
const classEmblems={swordsman:'sword',archer:'bow',mage:'arcane',summoner:'summon'};
// Portraits are used if a PvP pose fails to load.
const pvpBeastPortraits={
 kappa:['713641b7a7553676be240c65','461fcea3e3fa6c0c6318da75','12b411b09447cf597f811d0e'],
 griffin:['03b84fa7a9db969df7f0cadd','4bdcac1f711d739ebbdf4bc3','6064ba55eee573df4a91f79d'],
};
const statusLabels={burn:'ไฟไหม้',poison:'พิษ',para:'อัมพาต',sleep:'หลับ',freeze:'แช่แข็ง',
 confuse:'สับสน',charm:'หลงเสน่ห์',chill:'หนาวเย็น',static:'ไฟฟ้าสถิต',love:'หลงรัก'};
function frameArt(unit){
 if(unit.kind==='player')return assets+'ui/element-card-scenes/class-'+(classEmblems[unit.baseCls||unit.cls]||'sword')+'.webp';
 return assets+'ui/element-card-scenes/element-'+(unit.types?.[0]||'normal')+'.webp';
}
function combatPose(unit){
 if(unit.kind==='player'){
  // Follow the PvP art defaults for fighters without a selected gender.
  const gender=['male','female'].includes(unit.gender)?unit.gender:unit.cls==='swordsman'?'male':'female';
  return pvpCardArt[`${unit.cls}-${gender}`]??pvpCardArt[`${unit.baseCls}-${gender}`];
 }
 return pvpCardArt[`${unit.sp}:${unit.evo||0}`];
}
function unitCard(unit,current,selectable,choose){
 const card=node(selectable?'button':'div',null,'card');
 card.title=`${unit.name} · Lv ${unit.lv} · HP ${unit.hp}/${unit.maxHp} · MP ${unit.mp}/${unit.maxMp}`;
 if(unit.baseAura)card.title+=' · ออร่าฐาน โจมตี +20% · ป้องกัน +20%';
 card.dataset.unitId=unit.id;
 card.dataset.dead=String(unit.hp<=0);
 card.dataset.current=String(unit.id===current);
 card.dataset.frame=unit.kind==='player'?'black':pvpBeastPortraits[unit.sp]?['white','green','blue'][unit.evo||0]||'white':'purple';
 card.style.setProperty('--painted-card-bg',`url("${frameArt(unit)}")`);
 if(selectable){card.classList.add('battle-target');card.onclick=choose;}
 const face=node('span',null,'battle-face');
 const pose=combatPose(unit);
 const atlas=pose?null:portraitAtlas(unit);
 const art=node(atlas?'span':'img',null,atlas?'atlas-portrait':null);
 if(atlas){
  art.style.backgroundImage=`url("${portrait(unit)}")`;
  art.style.backgroundSize='400% 400%';
  art.style.backgroundPosition=`${atlas.x}% ${atlas.y}%`;
 }else{
  const portraits=pvpBeastPortraits[unit.sp];
  const asset=portraits?.[unit.evo||0]||portraits?.[0];
  const fallback=asset?assets+'media/'+asset+'.webp':portrait(unit);
  art.src=pose?.idle?.replace(/^\/assets\//,assets)||fallback;
  art.alt='';
  if(pose){
   art.dataset.pvpIdle=pose.motion;
   art.dataset.pose='idle';
   for(const phase of ['idle','melee','windup','hit'])if(pose[phase])art.dataset[phase]=pose[phase].replace(/^\/assets\//,assets);
   art.dataset.power=pose.idle.endsWith('-idle-v1.webp')?pose.idle.replace(/^\/assets\//,assets).replace('-idle-v1.webp','-power-v1.webp'):assets+'portraits/motion/summoner-male-power-front-v2.webp';
  }
  art.onerror=()=>{
   delete art.dataset.pvpIdle;
   if(art.getAttribute('src')===fallback){art.onerror=null;art.removeAttribute('src');}
   else art.src=fallback;
  };
 }
 face.append(art);
 const name=node('b',unit.name);
 const meters=[['HP',unit.hp,unit.maxHp],['MP',unit.mp,unit.maxMp]].map(([label,value,max])=>{
  const meter=node('meter',null,label.toLowerCase());
  meter.min=0;meter.max=Math.max(1,max);meter.value=value;
  meter.setAttribute('aria-label',label);
  return meter;
 });
 const stats=node('div',null,'battle-meter');
 const level=node('small',`Lv ${unit.lv}`,'battle-level');
 if(unit.baseAura){
  const aura=node('span','◆','battle-base-aura');
  aura.title='ออร่าฐาน โจมตี +20% · ป้องกัน +20%';aura.setAttribute('aria-label',aura.title);
  level.append(' ',aura);
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
 if(!battle||me?.phase!=='battle'||state.phase!=='match')return;
 const b=battle, can=b.commands.length>0&&now>=b.openAt&&now<b.deadline&&pendingTurn!==b.turn;
 const inFog=!insideFogSafe(state.zone,me.x,me.y);
 const key=`${b.id}:${b.turn}:${b.last?.n}:${b.finished}:${b.auto}:${can}:${selected?.id}:${pendingTurn}:${inFog}`;
 if(battleKey===key)return;
 const panel=$('battle');
 const first=panel.dataset.battleId!==b.id;
 const previousStage=panel.querySelector('.battle-stage')?.scrollTop||0;
 const previousCommands=panel.querySelector('.commands')?.scrollTop||0;
 const effectKey=`${b.id}:${b.last?.n??0}`, playEffect=$('battle').dataset.last!==effectKey&&!!b.last;
 battleKey=key;panel.dataset.last=effectKey;panel.dataset.battleId=b.id;panel.hidden=false;
 presentation.setActive(true);
 const isPvp=b.teams[1].length>0;
 const host=node('div',null,'battle-inner'), title=node('div',null,'battle-title');
 title.append(node('b',isPvp?`PvP · ${b.teams[0].length} ต่อ ${b.teams[1].length}`:b.boss?'ศึกบอสโคลอสเซียม':'ปะทะอสูรเงา'),
  node('span',inFog?'☠ หมอกพิษ · เสีย HP 2%/วิ':`รอบ ${b.round}`,inFog?'battle-fog':null));
 const stage=node('div',null,'battle-stage');
 host.append(title,stage);
 const known=[...b.allies,...b.enemies], current=known.find(u=>u.id===b.cur);
 const solo=state.mode==='survival',order=b.teams[1].includes(me.id)?[0,1]:[1,0];
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
  const sideName=slots.length?(solo?(own?'ฝ่ายเรา':'คู่ต่อสู้'):`${own?'ทีมเรา':'ฝ่ายตรงข้าม'} · ${TEAMS[isPvp?side:me.side]}`):b.boss?'ออร่าบอสโคลอสเซียม':'อสูรเงา';
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
  soundButton.textContent=presentation.enabled?'ปิดเสียง':'เปิดเสียง';
  soundButton.setAttribute('aria-pressed',String(presentation.enabled));
 };
 const actions=node('div',null,'battle-control-buttons');
 if(!b.finished){
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
 host.append(footer);
 panel.replaceChildren(host);
 presentation.syncPoses();
 if(!first)stage.scrollTop=previousStage;
 if(!first&&!selected)cmds.scrollTop=previousCommands;
 if(playEffect)presentation.action(b.last,b.effects||[],b.fx||[],()=>{
  battleKey='';renderBattle();
 });
}

for(const [id,name] of Object.entries(CLASSES))$('cls').add(new Option(name,id));
const fromLink=params.get('room'),country=params.get('country');
if(['blue','green','red'].includes(country)){
 $('country-return').href='../hemant-walk-demo/?country='+country+'&arrival=colosseum';
 $('country-return').hidden=false;
}
if(selectedCharacter){
 $('demo-profile').hidden=$('demo-profile').disabled=true;
 $('selected-profile').textContent=`${selectedCharacter.name} · Lv ${selectedCharacter.lv}`;
 $('selected-profile').hidden=false;
}
if(!onlineEnabled){
 for(const button of document.querySelectorAll('button[value="create"],button[value="survival"],button[value="join"],#code'))button.disabled=true;
 $('notice').textContent='โหมดออนไลน์กำลังรอเปิดเซิร์ฟเวอร์ · ทดลองกับบอทได้';
}
if(/^[A-F0-9]{8}$/i.test(fromLink??''))$('code').value=fromLink.toUpperCase();
$('entry-form').onsubmit=event=>{
 event.preventDefault();
 const type=event.submitter?.value??'create',code=$('code').value.trim().toUpperCase();
 if(!practiceType(type)&&!onlineEnabled)return;
 if(gameWeb&&!selectedCharacter){location.assign('../../accounts.html');return;}
 if(type==='join'&&!/^[A-F0-9]{8}$/.test(code)){$('notice').textContent='กรอกรหัสห้อง 8 ตัวก่อน';return;}
 if(ws){const old=ws;ws=null;old.close();}
 connect({type,code,name:$('name').value,cls:$('cls').value,lv:$('level').value});
};
$('ready').onclick=()=>send({type:'ready',ready:!own()?.ready});
$('start').onclick=()=>send({type:'start'});
$('leave').onclick=()=>send({type:'leave'});
function leavePractice(){
 if(!send({type:'leavePractice'}))reset();
}
$('back').onclick=()=>state?.practice?leavePractice():reset();
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
  if(base)return {type:'raid',id:base.id,label:`จู่โจม${base.label} · +${base.points}`};
 }
 if(!state.vitals)return null;
 const friendly=state.bases.find(b=>HEAL_TARGET(me,b));
 return friendly?{type:'healBase',id:friendly.id,label:friendly.main?'ฟื้นเต็ม + ล้างสถานะ':'ฟื้น HP/MP 30%',
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
  const [dx,dy]=direction();if(dx||dy)walkInArena(scene.arena,zone,local,dx,dy,dt);
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
  scene.render(local,all,t,state.chests,state.bases,state.traps,now,zone);
  $('blue').textContent=solo?state.survivors:state.score[0];
  $('red').textContent=solo?`${Math.round(zone.remaining*100)}%`:state.score[1];
  $('clock').textContent=solo?(zone.nextAt?clock(zone.nextAt-(state.finishedAt??now)):'☠'):clock(state.ends-(state.finishedAt??now));
  let activity;
  for(let i=state.events.length-1;i>=0;i--)if(state.events[i].type!=='boss'){activity=state.events[i];break;}
  const event=activity&&now-activity.at<4800?activity:null;
  const bossEvent=state.bossEvent;$('boss-announcement').textContent=bossEvent&&now-bossEvent.at<8500?bossEvent.text:'';
  const heal=state.baseHeal;
  const healing=heal&&now-heal.at<3300&&(!event||heal.at>=event.at);
  $('event').textContent=healing?[heal.source,heal.hp?`HP +${heal.hp}`:'',heal.mp?`MP +${heal.mp}`:'',heal.cleansed?'ล้างสถานะผิดปกติ':''].filter(Boolean).join(' · '):event?.text??'';
  const walking=state.phase==='match'&&me.phase==='walk';
  $('stick').hidden=!walking;$('map').hidden=!walking;
  $('objectives').hidden=!walking;
  $('leave-practice').hidden=!state.practice;
  const treasure=`หีบเหลือ ${state.chestsLeft}/${state.chestsTotal??CHEST_COUNT}`;
  $('chest-count').textContent=treasure;$('map-chests').textContent=treasure;
  $('boss-clock').textContent=solo?(!insideFogSafe(zone,me.x,me.y)?'อยู่ในหมอกพิษ · เสีย HP 2%/วิ':zone.nextAt?`หมอกเข้ามาอีก ${clock(zone.nextAt-now)}`:'หมอกปกคลุมทั้งสนาม'):
   state.nextBossAt?`บอสเกิดอีก ${clock(state.nextBossAt-now)}`:'ไม่มีบอสเกิดเพิ่ม';
  const target=walking&&objective();
  $('raid').hidden=!target;
  if(target){const button=$('raid');button.textContent=target.label;button.dataset.action=target.type;button.disabled=Boolean(target.disabled);}
  if(walking&&t-lastMap>80){
   drawMap($('mini'),state,all,local);
   if(mapDialog.open)drawMap($('full-map'),state,all,local,2);
   lastMap=t;
  }
  const ended=state.phase==='finished',dead=me.phase==='dead';
  $('overlay').hidden=!ended&&!dead;$('back').hidden=!ended&&!(solo&&dead);
  if(ended||dead){
   if(solo){
    $('overlay-title').textContent=ended?(state.winner===me.id?'คุณรอดเป็นคนสุดท้าย!':state.winnerName?'จบการประลอง':'เสมอ'):'คุณตกรอบ';
    const result=ended?(state.winnerName?`${state.winnerName} เป็นผู้รอดคนสุดท้าย`:state.reason==='error'?'สนามยุติการเล่น':'ผู้เล่นคนสุดท้ายล้มพร้อมกัน'):
     `เหลือผู้รอด ${state.survivors} คน`;
    $('overlay-text').textContent=[state.eliminationCause,result,Number.isFinite(me.points)?`คะแนนคุณ ${me.points}`:''].filter(Boolean).join(' · ');
   }else{
    $('overlay-title').textContent=ended?(state.winner===-1?'เสมอ':state.winner===me.side?'ทีมคุณชนะ!':'ทีมคุณแพ้'):'ผู้ผนึกล้มลง';
    $('overlay-text').textContent=ended?`${state.reason==='error'?'สนามยุติการเล่น · ':''}${TEAMS[0]} ${state.score[0]} : ${state.score[1]} ${TEAMS[1]}`:`เกิดใหม่ที่ฐานใหญ่ใน ${clock(state.respawnAt-now)}`;
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
if(onlineEnabled&&saved())connect(saved());
requestAnimationFrame(frame);
