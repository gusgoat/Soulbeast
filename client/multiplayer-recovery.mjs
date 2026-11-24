import {connectAccounts} from './account-client.mjs?v=admin-session-20261107';
import {connectOnlineWalk} from './online-walk.mjs?v=room-recovery-1';
import {connectDungeonParty,partySessionKey} from './dungeon-party.mjs?v=room-recovery-1';

const root=new URL('../',import.meta.url);
const arenaHost='https://soulbeast-colosseum.onrender.com';
const contextKey='soulbeast-online-walk-v1';
const read=key=>JSON.parse(sessionStorage.getItem(key)||'null');
const roomKey=r=>r.kind+':'+r.id;
const isArena=r=>r.kind==='arena'||r.kind==='queue';
const names={dungeon:'ปาร์ตี้ดันเจี้ยน',world:'บอสโลก',kingdom:'การต่อสู้บอสอาณาจักร',pvp:'ประลอง PvP',camp:'จู่โจมค่าย',arena:'โคลอสเซียม',queue:'คิวจัดอันดับโคลอสเซียม'};
const translations={
 'พบห้องเดิมของตัวละคร':['Your character is still in a room','角色仍在房间中'],
 'ห้องผู้เล่นหลายคน':['Multiplayer rooms','多人房间'],
 'กลับเข้าไปเล่นต่อ':['Resume playing','返回并继续'],
 'ออกจากห้อง':['Leave room','离开房间'],
 'ปาร์ตี้ดันเจี้ยน':['Party dungeon','组队地下城'],
 'บอสโลก':['World Boss','世界首领'],
 'การต่อสู้บอสอาณาจักร':['Kingdom Boss encounter','王国首领战'],
 'ประลอง PvP':['PvP duel','玩家对决'],
 'จู่โจมค่าย':['Camp raid','营地突袭'],
 'โคลอสเซียม':['Colosseum','竞技场'],
 'คิวจัดอันดับโคลอสเซียม':['Ranked matchmaking','竞技场排位队列'],
 'การออกจากค่ายขณะจู่โจมถือว่ายอมแพ้และเสียเงิน 20%':['Leaving the raid forfeits the fight and costs 20% of your gold.','退出突袭会认输并损失当前金币的20%。'],
 'การออกจากการประลองที่เริ่มแล้วถือว่ายอมแพ้':['Leaving an active duel counts as a forfeit.','退出已开始的对决将视为认输。'],
 'การออกระหว่างแมตช์จัดอันดับมีบทลงโทษตามกติกา':['Leaving a ranked match early incurs the ranked penalty.','提前退出排位赛将受到相应处罚。'],
 'กำลังตรวจเซฟตัวละครหลังออกจากห้อง':['Checking your character save after leaving…','正在检查离房后的角色存档…'],
 'กำลังตรวจสอบกับเซิร์ฟเวอร์…':['Checking with the server…','正在与服务器确认…'],
 'ยังยืนยันการออกจากห้องหรือบันทึกตัวละครไม่ได้ ความคืบหน้ายังอยู่ในเครื่อง':['Room exit or saving could not be confirmed. Your local progress is still on this device.','暂时无法确认离房或保存角色。进度仍保存在此设备上。'],
 'ลองอีกครั้ง':['Retry','重试']
};
function t(value){
 const locale=window.SoulbeastLocale?.get();
 return translations[value]?.[locale==='en'?0:locale==='zh-CN'?1:-1]??window.SoulbeastLocale?.text(value)??value;
}

async function arenaRequest(client,ctx,path){
 const response=await fetch(arenaHost+(ctx.environment==='test'?'/test':'')+path,{method:'POST',cache:'no-store',
  headers:{Authorization:'Bearer '+await client.sessions.token(),'Content-Type':'application/json'},
  body:JSON.stringify({code:ctx.code}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('arena_unavailable');
 return response.json();
}
export async function leaveArena(room,ticket,environment,Socket=WebSocket){
 return new Promise((resolve,reject)=>{
  const socket=new Socket(arenaHost.replace('https:','wss:')+(environment==='test'?'/test':'')+'/ws');
  let sent=false,done=false;
  function finish(error){
   if(done)return;done=true;clearTimeout(timer);socket.close();
   if(error)reject(error);else resolve();
  }
  const timer=setTimeout(()=>finish(Error('arena_timeout')),18000);
  socket.onopen=()=>socket.send(JSON.stringify({...room.resume,ticket}));
  socket.onmessage=({data})=>{
   const m=JSON.parse(data);
   if(m.type==='left'){finish();return;}
   if(m.type==='error'){finish(Error(m.message));return;}
   if(sent)return;
   if(room.kind==='queue'&&m.type==='rankQueue'){sent=true;socket.send(JSON.stringify({type:'cancelRank'}));}
   if(room.kind==='arena'&&m.type==='state'){sent=true;socket.send(JSON.stringify({type:m.ranked&&m.phase!=='lobby'?'rankLeave':'leave'}));}
  };
  socket.onerror=()=>finish(Error('arena_unavailable'));
  socket.onclose=()=>finish(Error('arena_disconnected'));
 });
}

function start(ctx){
 const client=connectAccounts(()=>{}),walk=connectOnlineWalk(),party=connectDungeonParty();
 const scope=[ctx.environment,ctx.owner,ctx.code].join(':');
 const syncKey='sb-multiplayer-exit-sync:'+scope;
 const destination='sb-multiplayer-return:'+scope;
 const arenaSession=ctx.environment==='test'?'soulbeast-colosseum-test-session':'soulbeast-colosseum-session';
 const pendingRooms=new Map(), failures=new Set();
 let epoch=0,working=false,again=false,lastHidden=0,retryTimer,attempt=0;
 const dialog=document.createElement('dialog');
 dialog.style.cssText='max-width:min(87vw,26rem);padding:20px;border:1px solid #c29951;border-radius:12px;background:#142a35;color:#fff1cc';
 dialog.setAttribute('aria-label',t('ห้องผู้เล่นหลายคน'));
 document.body.append(dialog);
 const current=()=>{const c=read(contextKey);return c?.code===ctx.code&&c?.owner===ctx.owner&&c?.environment===ctx.environment;};
 const lookup=async source=>{
  if(source==='arena')return (await arenaRequest(client,ctx,'/room-status')).rooms;
  return client.request('/rest/v1/rpc/sb_walk_recover_rooms',{p_env:ctx.environment,p_code:ctx.code},await client.sessions.token());
 };
 function open(){if(!dialog.open)dialog.showModal();}
 function label(text){const p=document.createElement('p');p.textContent=t(text);dialog.append(p);}
 function button(text,click){
  const b=document.createElement('button');b.textContent=t(text);b.onclick=click;b.style.cssText='padding:9px 13px;margin:4px';dialog.append(b);
 }
 function cityURL(){
  const player=read('soulbeast-walk-preview-player-v1');
  const url=new URL('tools/town-walk-demo/index.html',root);
  url.searchParams.set('city',(['blue','red','green'].includes(player?.country)?player.country:'blue')+'-capital');
  return url;
 }
 function resume(room){
  let url;
  if(room.kind==='dungeon'){
   url=new URL('tools/labyrinth-demo/'+(room.state==='waiting'?'online-party-lobby.html':'index.html'),root);
   if(room.state==='active')url.searchParams.set('room',room.id);
  }else if(room.kind==='kingdom'){
   sessionStorage.setItem(destination,JSON.stringify(room));
   url=new URL('tools/hemant-walk-demo/index.html',root);
   url.searchParams.set('country',room.country);
  }else if(isArena(room)){
   sessionStorage.setItem('sb-arena-return',ctx.code);
   sessionStorage.setItem(arenaSession,JSON.stringify(room.resume));
   url=new URL('tools/colosseum/index.html',root);
  }else{
   sessionStorage.setItem(destination,JSON.stringify(room));
   url=cityURL();url.searchParams.set('returnRoom',room.kind);
  }
  // A recovery choice can navigate to the same document that was just restored.
  sessionStorage.setItem(destination+':navigation',url.pathname+url.search);
  location.replace(url.href);
 }
 async function leave(room){
  if(room.kind==='dungeon'){
   if(room.state==='active'){
    const {personalParty}=await import('../tools/labyrinth-demo/online-party-personal.mjs?v=instant-party-3');
    const ledger=personalParty({roomId:room.id,code:ctx.code,send:data=>party.run(room.id,'personalFinish',data)});
    try{await ledger.flush();await party.run(room.id,'leave');ledger.forget();}finally{ledger.close();}
   }else await party.call('leave',{room:room.id});
   sessionStorage.removeItem(partySessionKey);
  }else if(isArena(room)){
   await leaveArena(room,(await arenaRequest(client,ctx,'/ticket')).ticket,ctx.environment);
   sessionStorage.removeItem(arenaSession);
  }else if(room.kind==='pvp'){
   const match=await walk.social('pvp_resume');
   if(match.room?.id!==room.id)throw Error('room_changed');
   await walk.social('pvp_leave',{room:room.id,token:match.token});
  }else if(room.kind==='kingdom')await walk.social('kingdom_boss_leave',{round:room.round,fight:room.id});
  else if(room.kind==='world')await walk.social('wb_leave',{room:room.id});
  else if(room.kind==='camp')await walk.social('camp_leave',{room:room.id,token:room.token});
 }
 function render(){
  if(!current()||working)return;
  dialog.replaceChildren();
  for(const room of pendingRooms.values()){
   label('พบห้องเดิมของตัวละคร');label(names[room.kind]);
   if(room.kind==='camp')label('การออกจากค่ายขณะจู่โจมถือว่ายอมแพ้และเสียเงิน 20%');
   if(room.kind==='pvp'&&room.state==='active')label('การออกจากการประลองที่เริ่มแล้วถือว่ายอมแพ้');
   if(room.kind==='kingdom'&&room.duel)label('การออกจากการประลองที่เริ่มแล้วถือว่ายอมแพ้');
   if(room.ranked)label('การออกระหว่างแมตช์จัดอันดับมีบทลงโทษตามกติกา');
   button('กลับเข้าไปเล่นต่อ',()=>resume(room));
   button('ออกจากห้อง',()=>void settle(room));open();return;
  }
  if(localStorage.getItem(syncKey)){
   label('กำลังตรวจเซฟตัวละครหลังออกจากห้อง');button('ลองอีกครั้ง',()=>void settle());open();return;
  }
  if(dialog.open)dialog.close();
 }
 async function settle(room){
  if(working||!current())return;
  working=true;epoch++;dialog.replaceChildren();label('กำลังตรวจสอบกับเซิร์ฟเวอร์…');open();
  try{
   if(room){
    const source=isArena(room)?'arena':'account',key=roomKey(room);
    const find=async()=>(await lookup(source)).find(r=>roomKey(r)===key);
    const active=await find();
    localStorage.setItem(syncKey,'1');
    if(active){
     if(active.state!==room.state||!!active.ranked!==!!room.ranked){
      pendingRooms.set(key,active);working=false;render();return;
     }
     try{await leave(active);}catch(error){if(await find())throw error;}
     if(await find())throw Error('room_still_active');
    }
    pendingRooms.delete(key);
   }
   if(!pendingRooms.size){
    // This path backs up local edits and merges a newer server revision before saving.
    await walk.flush(true);await walk.reloadWalk();
    localStorage.removeItem(syncKey);
    const next=cityURL();next.searchParams.set('checkRooms','1');location.replace(next.href);return;
   }
   working=false;render();
  }catch{
   working=false;dialog.replaceChildren();label('ยังยืนยันการออกจากห้องหรือบันทึกตัวละครไม่ได้ ความคืบหน้ายังอยู่ในเครื่อง');
   button('ลองอีกครั้ง',()=>void settle(room));open();
  }finally{if(again&&!working){again=false;void scan();}}
 }
 function scan(){
  if(!current()||navigator.onLine===false)return;
  if(working){again=true;return;}
  const generation=++epoch;clearTimeout(retryTimer);
  const sources=['account','arena'];
  Promise.all(sources.map(async source=>{
   try{
    const rooms=await lookup(source);
    if(!Array.isArray(rooms))throw Error('bad_rooms');
    if(generation!==epoch||!current())return;
    if(source==='arena'&&!rooms.length)window.dispatchEvent(new Event('sb-arena-room-closed'));
    for(const [key,room] of pendingRooms)if((source==='arena')===isArena(room))pendingRooms.delete(key);
    for(const room of rooms)if(names[room.kind])pendingRooms.set(roomKey(room),room);
    failures.delete(source);
    if(pendingRooms.size)render();
   }catch{if(generation===epoch)failures.add(source);}
  })).then(()=>{
   if(generation!==epoch||!current())return;
   if(!pendingRooms.size&&localStorage.getItem(syncKey)&&!failures.size){void settle();return;}
   render();
   if(failures.size)retryTimer=setTimeout(scan,Math.min(120000,5000*2**Math.min(5,attempt++)));
   else attempt=0;
  });
 }
 dialog.oncancel=e=>e.preventDefault();
 addEventListener('online',scan);addEventListener('sb-room-reconnect',scan);
 addEventListener('pageshow',e=>{if(e.persisted)scan();});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)lastHidden=Date.now();
  else if(lastHidden&&Date.now()-lastHidden>30000)scan();
 });
 const target=sessionStorage.getItem(destination+':navigation');
 sessionStorage.removeItem(destination+':navigation');
 const nav=performance.getEntriesByType('navigation')[0];
 const previous=document.referrer&&new URL(document.referrer);
 const normalTravel=nav?.type==='navigate'&&previous?.origin===location.origin&&previous.pathname.startsWith(root.pathname+'tools/');
 const arenaEntry=location.pathname.endsWith('/colosseum/index.html')&&sessionStorage.getItem(arenaSession);
 if(target!==location.pathname+location.search&&(!normalTravel||arenaEntry||localStorage.getItem(syncKey)||new URL(location.href).searchParams.has('checkRooms')))scan();
}
if(typeof window!=='undefined'&&window.top===window){
 const ctx=read(contextKey);
 if(ctx?.code&&ctx.owner&&['live','test'].includes(ctx.environment))start(ctx);
}
