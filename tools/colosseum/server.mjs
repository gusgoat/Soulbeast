import {Match} from './match.mjs';
import {demoProfile,settleCombat} from './combat.mjs?v=colosseum-ranks-1';
import {matchRankChanges,teamResults} from './ranking.mjs';
import {balanceRankedTeams,compatiblePlayers,premadeRankPair,rankedBanMessage,rankedGroup,RANKED_RECONNECT_MS} from './matchmaking.mjs';
import {startPractice} from './practice.mjs';
import {createRankingStore} from './ranking-store.mjs';
import {createAccountLoader} from './account-auth.mjs';

const TYPES={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.mp3':'audio/mpeg'};
const STATIC=new Set(['index.html','client.mjs','ranking.mjs','matchmaking.mjs','arena.mjs','survival-arena.mjs','arena-traps.mjs','scene.mjs','sight.mjs','style.css','rare-art.mjs','battle-presentation.mjs','battle-effects.generated.mjs','pvp-card-art.mjs','walk-joystick.mjs','labyrinth-demo/traps.js','town-walk-demo/sealer-sprite-catalog.js','town-walk-demo/sealer-sprites.js']);
const ROOT=new URL('../../',import.meta.url);
const TICK=50, LOBBY_TTL=30*60_000, LOBBY_RECONNECT_MS=60_000, FINISH_TTL=5*60_000;
const MAX_ROOMS=32, MAX_CONNECTIONS=160;

export function serve({loadCharacter=null,ranking=null,siteOrigin=null,lobbyReconnectMs=LOBBY_RECONNECT_MS,rankedReconnectMs=RANKED_RECONNECT_MS,...options}={}){
 const rooms=new Map(), peers=new Set(),tickets=new Map(),rankedQueue=new Map(),rankRoomAliases=new Map();
 let rankProbe=null,rankProbeAt=0;
 function rankedReady(){
  if(!ranking?.enabled)return Promise.resolve(false);
  if(!rankProbe||Date.now()>=rankProbeAt){
   rankProbeAt=Date.now()+15_000;
   // An absent character is expected. This exercises the database's scoped key check.
   rankProbe=ranking.status('__colosseum_readiness__').then(()=>true,()=>false);
  }
  return rankProbe;
 }
 const allowed=req=>req.headers.get('origin')===(siteOrigin||new URL(req.url).origin);
 const send=(peer,value)=>{
  if(peer.ws.readyState===WebSocket.OPEN&&peer.ws.bufferedAmount<96_000)peer.ws.send(JSON.stringify(value));
 };
 function push(peer,now){
  if(!peer.room||!peer.player)return;
  const {room,player}=peer;
  if(peer.ws.bufferedAmount>=96_000)return;
  send(peer,room.snapshot(player,now));
  const b=room.viewedBattle(player);
  const key=b?`${room.spectatorTarget(player)?.id||player.id}:${b.id}:${b.turn}:${b.last?.n||0}:${b.finished}:${b.autoVersion}:${b.fogVersion??0}`:'';
  if(key!==peer.battleKey){peer.battleKey=key;send(peer,{type:'battle',battle:room.battleSnapshot(player)});}
 }
 function writeRank(room,changes){
  room.rankWrites??=new Map();
  for(const row of changes)room.rankWrites.set(row.code,row);
 }
 function retireRanked(room,player,now,disconnected=false){
  if(player.bot||player.retired||room.solo&&player.phase==='dead'&&!disconnected)return;
  player.retired=true;
  player.rankDelta=-2;
  player.rankSaved=false;
  writeRank(room,[{code:player.character.code,name:player.name,delta:-2,violation:'abandon',at:now}]);
  if(room.phase!=='match'||player.phase==='dead')return;
  const battle=room.battles.get(player.battle),hero=room.battleHero(player);
  if(hero)hero.hp=0;
  room.fall(player,now,'ออกก่อนจบ');
  if(battle)settleCombat(battle,now);
  room.checkScore(now);
 }
 function evaluateRank(room,now){
  if(!room.ranked||room.rankEvaluated)return;
  if(room.reason==='error'){room.rankEvaluated=true;return;}
  let awaitingReturn=false;
  for(const player of room.players){
   if(player.bot||player.retired||player.connected||!player.disconnectedWhileActive)continue;
   if(now-player.disconnectedAt<rankedReconnectMs)awaitingReturn=true;
   else retireRanked(room,player,now,true);
  }
  if(room.phase!=='finished'||awaitingReturn)return;
  room.rankEvaluated=true;
  if(!room.solo)room.results=teamResults(room.players);
  writeRank(room,matchRankChanges(room).map(row=>({...row,at:room.finishedAt})));
 }
 function roomCode(){
  let code;
  do{code=crypto.randomUUID().slice(0,8).toUpperCase();}while(rooms.has(code)||rankRoomAliases.has(code));
  return code;
 }
 function queueStatus(entry,now){
  const waiting=[...rankedQueue.values()].filter(e=>e.mode===entry.mode&&e.peer?.ws.readyState===WebSocket.OPEN);
  const count=compatiblePlayers(entry,waiting,now).length;
  send(entry.peer,{type:'rankQueue',mode:entry.mode,count:Math.min(count,10),elapsed:now-entry.enteredAt});
 }
 function processQueues(now){
  for(const [account,entry] of rankedQueue){
   if(!entry.peer&&now-entry.disconnectedAt>=RANKED_RECONNECT_MS)rankedQueue.delete(account);
  }
  for(const mode of ['team','survival']){
   const entries=[...rankedQueue.values()].filter(e=>e.mode===mode);
   while(rooms.size<MAX_ROOMS){
    const group=rankedGroup(entries,mode,now);
    if(!group)break;
    const room=new Match(roomCode(),now,Math.random,mode);
    room.ranked=true;
    room.rankingAvailable=true;
    const teams=room.solo?[group]:balanceRankedTeams(group);
    try{
     for(const [side,team] of teams.entries()){
      for(const entry of team){
       const player=room.join({},entry.character,side);
       player.rating=entry.rating;
       player.ready=true;
       entry.player=player;
      }
      const level=Math.round(group.reduce((sum,p)=>sum+Number(p.character.lv),0)/group.length);
      while(room.players.filter(p=>p.side===side).length<(room.solo?10:5))room.addBot(side,level);
     }
     room.start(now);
     rooms.set(room.code,room);
    }catch(error){
     for(const entry of group){
      rankedQueue.delete(entry.account);
      entry.peer.waiting=null;
      send(entry.peer,{type:'error',action:'ranked',message:'เริ่มแมตช์จัดอันดับไม่สำเร็จ กรุณาค้นหาใหม่'});
     }
     console.error('Ranked match setup failed:',error.message);
     break;
    }
    for(const entry of group){
     rankedQueue.delete(entry.account);
     entry.peer.waiting=null;
     entries.splice(entries.indexOf(entry),1);
     assign(entry.peer,room,entry.player);
    }
   }
  }
  for(const entry of rankedQueue.values())if(entry.peer)queueStatus(entry,now);
 }
 function processPremadeQueue(now){
  while(true){
   const pair=premadeRankPair([...rooms.values()],now);
   if(!pair)return;
   const match=new Match(roomCode(),now);
   match.ranked=true;
   match.rankingAvailable=true;
   const seats=new Map([...peers].filter(peer=>pair.includes(peer.room)&&peer.player).map(peer=>[peer.player.id,peer]));
   try{
    match.players=pair.flatMap((lobby,side)=>lobby.players.map(player=>({...structuredClone(player),side})));
    if(match.players.some(player=>!player.bot&&seats.get(player.id)?.ws.readyState!==WebSocket.OPEN))throw Error('disconnected');
    match.start(now);
   }catch(error){
    for(const lobby of pair)lobby.rankSearch=null;
    for(const peer of seats.values())send(peer,{type:'error',action:'rankTeamStart',message:'เริ่มแมตช์จัดอันดับไม่สำเร็จ กรุณาค้นหาใหม่'});
    console.error('Premade ranked match setup failed:',error.message);
    continue;
   }
   for(const lobby of pair){
    rooms.delete(lobby.code);
    rankRoomAliases.set(lobby.code,match);
   }
   rooms.set(match.code,match);
   for(const player of match.players)if(!player.bot)assign(seats.get(player.id),match,player);
  }
 }
 async function joinPremade(peer,character,target,create){
  if(!ranking?.enabled||!character)throw Error('ระบบจัดอันดับต้องใช้ตัวละครออนไลน์');
  const status=await ranking.status(character.code);
  if(peer.ws.readyState!==WebSocket.OPEN)return;
  if(!status?.account)throw Error('ตรวจสอบสิทธิ์จัดอันดับไม่สำเร็จ');
  const blocked=rankedBanMessage(status);
  if(blocked)throw Error(blocked);
  const account=status.account;
  if(rankedQueue.has(account))throw Error('ออกจากคิวสุ่มจัดอันดับก่อนเข้าทีมจัดเอง');
  for(const room of rooms.values()){
   if(!room.ranked&&!room.premade){
    if(room.phase!=='finished'&&!room.practice&&room.players.some(p=>p.character?.code===character.code))throw Error('ออกจากห้องเดิมก่อนเข้าทีมจัดอันดับ');
    continue;
   }
   const existing=room.players.find(p=>p.character?.colosseumAccount===account);
   if(!existing)continue;
   if(room.phase==='finished'&&room.rankEvaluated&&!room.rankWrites?.has(existing.character.code))continue;
   if(existing.character.code===character.code&&!existing.retired&&(create||room===target)){
    assign(peer,room,existing);
    return;
   }
   throw Error('บัญชีนี้อยู่ในห้องหรือแมตช์จัดอันดับแล้ว');
  }
  if(create&&rooms.size>=MAX_ROOMS)throw Error('ห้องเต็มชั่วคราว');
  const lobby=create?new Match(roomCode(),Date.now()):target;
  if(!create&&(rooms.get(lobby?.code)!==lobby||!lobby?.premade||lobby.rankSearch!=null))throw Error('ห้องนี้กำลังค้นหาแมตช์หรือปิดแล้ว');
  lobby.premade=true;
  const player=lobby.join({}, {...character,colosseumAccount:account},0);
  player.rating=Number(status.rating)||0;
  if(create)rooms.set(lobby.code,lobby);
  assign(peer,lobby,player);
 }
 async function joinRankQueue(peer,character,mode){
  if(!ranking?.enabled||!character)throw Error('ระบบจัดอันดับต้องใช้ตัวละครออนไลน์');
  if(!['team','survival'].includes(mode))throw Error('กรุณาเลือกโหมดการแข่งขัน');
  const status=await ranking.status(character.code);
  if(peer.ws.readyState!==WebSocket.OPEN)return;
  if(!status?.account)throw Error('ตรวจสอบสิทธิ์จัดอันดับไม่สำเร็จ');
  const account=status.account,now=Date.now(),blocked=rankedBanMessage(status);
  character.colosseumAccount=account;
  for(const room of rooms.values()){
   if(room.premade&&room.players.some(p=>p.character?.colosseumAccount===account))throw Error('ออกจากห้องทีมจัดเองก่อนเข้าคิวสุ่มจัดอันดับ');
   if(!room.ranked)continue;
   const existing=room.players.find(p=>p.character?.colosseumAccount===account);
   if(!existing)continue;
   if(room.phase==='finished'&&room.rankEvaluated&&!room.rankWrites?.has(existing.character.code))continue;
   if(existing.retired||existing.character.code!==character.code)throw Error(blocked||'บัญชีนี้ยังมีแมตช์จัดอันดับที่กำลังดำเนินอยู่');
   assign(peer,room,existing);
   return;
  }
  if(blocked)throw Error(blocked);
  try{demoProfile({character,cls:character.cls},0);}catch{throw Error('ตรวจชุดอุปกรณ์หรืออสูรของตัวละครไม่ได้');}
  const previous=rankedQueue.get(account);
  if(previous?.peer&&previous.peer!==peer){
   previous.peer.waiting=null;
   previous.peer.ws.close(4001,'queue resumed');
  }
  const enteredAt=previous?.mode===mode?previous.enteredAt:now;
  const entry={peer,account,character,mode,enteredAt,rating:status.rating};
  rankedQueue.set(account,entry);
  peer.waiting=entry;
  queueStatus(entry,now);
 }

 function saveRank(room,now){
  if(!ranking?.enabled||!room.rankWrites?.size||room.rankPending||now<(room.rankRetryAt??0))return;
  room.rankPending=true;
  const sent=[...room.rankWrites.values()];
  ranking.commit(room.id,sent).then(scores=>{
   for(const player of room.players){
    if(!sent.some(row=>row.code===player.character?.code))continue;
    const saved=scores.find(row=>row.code===player.character.code);
    player.rankSaved=Boolean(saved);
    if(saved)player.rating=saved.score;
   }
   for(const row of sent)room.rankWrites.delete(row.code);
  }).catch(error=>{
   console.error('Colosseum ranking save failed:',error.message);
   room.rankRetryAt=Date.now()+15_000;
  }).finally(()=>{room.rankPending=false;});
 }
 function closeRoom(room){
  rooms.delete(room.code);
  for(const [alias,target] of rankRoomAliases)if(target===room)rankRoomAliases.delete(alias);
  for(const peer of peers)if(peer.room===room)peer.ws.close(1000,'room closed');
 }
 let last=Date.now(), frame=0,lastQueue=0;
 const timer=setInterval(()=>{
  const now=Date.now(),dt=Math.min(.10,(now-last)/1000);last=now;
  const changed=new Set();
  if(now-lastQueue>=1000){lastQueue=now;processQueues(now);processPremadeQueue(now);}
  for(const [ticket,entry] of tickets)if(now>=entry.until)tickets.delete(ticket);
  for(const room of rooms.values()){
   if(room.phase==='lobby'){
    const before=room.players.length;
    room.players=room.players.filter(p=>p.connected||now-(p.disconnectedAt??now)<lobbyReconnectMs);
    if(room.players.length!==before)changed.add(room);
   }
   if((room.phase==='lobby'&&(now-room.created>LOBBY_TTL||!room.host))||
      (room.phase==='finished'&&now-room.finishedAt>FINISH_TTL&&!room.rankWrites?.size)){
    closeRoom(room);
    continue;
   }
   const event=room.eventSerial,battle=room.battleSerial,phase=room.phase;
   try{room.tick(now,dt);}catch(error){
    console.error('Colosseum simulation failed:',error);
    room.finish(-1,'error',now);
   }
   evaluateRank(room,now);
   saveRank(room,now);
   if(room.eventSerial!==event||room.battleSerial!==battle||room.phase!==phase)changed.add(room);
  }
  for(const peer of peers){
   const m=peer.pendingChest;if(!m)continue;peer.pendingChest=null;
   try{peer.room.command(peer.player,m,now);changed.add(peer.room);send(peer,{type:'chest-result',id:m.id});}
   catch(error){send(peer,{type:'error',action:m.type,message:error.message});}
  }
  const periodic=++frame%2===0;
  for(const peer of peers)if(periodic||changed.has(peer.room))push(peer,now);
 },TICK);
 function assign(peer,room,p){
  if(room.ranked&&p.disconnectedWhileActive)evaluateRank(room,Date.now());
  if(p.retired)throw Error('คุณออกจากแมตช์นี้แล้ว');
  if(p.character&&p.rating==null)p.rating=p.character.colosseumRating??0;
  const old=[...peers].find(q=>q!==peer&&q.player===p);
  if(old){old.player=null;old.ws.close(4001,'session resumed');}
  peer.room=room;peer.player=p;peer.battleKey=null;
  p.connected=true;p.disconnectedAt=null;p.disconnectedWhileActive=false;p.dx=p.dy=0;
  send(peer,{type:'welcome',room:room.code,token:p.token,seq:p.seq});push(peer,Date.now());
 }
 function connect(req){
  if(!allowed(req))return new Response('Origin rejected',{status:403});
  if(peers.size>=MAX_CONNECTIONS)return new Response('Busy',{status:503});
  const {socket:ws,response}=Deno.upgradeWebSocket(req);
  const peer={ws,room:null,player:null,quota:0,bucket:0};
  peers.add(peer);
  const timeout=setTimeout(()=>{if(!peer.player&&!peer.waiting&&ws.readyState===WebSocket.OPEN)ws.close(1000,'join timed out');},30_000);
  ws.addEventListener('close',()=>{
   peers.delete(peer);clearTimeout(timeout);
   if(peer.waiting){peer.waiting.peer=null;peer.waiting.disconnectedAt=Date.now();}
   if(peer.player){
    peer.player.disconnectedWhileActive=peer.room.ranked&&peer.room.phase==='match'&&(!peer.room.solo||peer.player.phase!=='dead');
    peer.player.connected=false;peer.player.disconnectedAt=Date.now();peer.player.dx=peer.player.dy=0;
    if(peer.room.phase==='lobby'){
     peer.player.ready=false;
     if(peer.room.premade)peer.room.rankSearch=null;
    }
   }
  });
  ws.addEventListener('error',()=>{});
  ws.addEventListener('message',async event=>{
   const now=Date.now(),second=Math.floor(now/1000);
   if(peer.bucket!==second){peer.bucket=second;peer.quota=0;}
   if(++peer.quota>50||typeof event.data!=='string'||event.data.length>4096){ws.close(1008,'message limit');return;}
   let m;
   try{
    m=JSON.parse(event.data);if(!m||typeof m.type!=='string')return;
    if(peer.waiting){
     if(m.type==='cancelRank'){
      rankedQueue.delete(peer.waiting.account);
      peer.waiting=null;
      send(peer,{type:'left'});
      ws.close(1000,'left');
     }
     return;
    }
    if(peer.joining)return;
    if(peer.player){
     if(m.type==='rankLeave'&&peer.room.ranked){
      const {room,player}=peer;
      if(!room.solo&&room.phase==='match'&&now>=room.ends)room.expire(now);
      if(room.phase==='match')retireRanked(room,player,now);
      saveRank(room,now);
      player.connected=false;
      player.disconnectedAt=now;
      peer.player=null;
      peer.room=null;
      send(peer,{type:'left',message:player.retired?'ออกก่อนจบแมตช์ · เสีย 2 แต้ม ตรวจบทลงโทษได้ในจดหมายจัดอันดับ':''});
      ws.close(1000,'left');
      return;
     }
     if(m.type==='ping'){if(Number.isFinite(m.echo))send(peer,{type:'pong',echo:m.echo,now});return;}
     if(m.type==='leavePractice'&&peer.room.practice){
      rooms.delete(peer.room.code);
      peer.player=null;peer.room=null;ws.close(1000,'left');
      return;
     }
     if(m.type==='chest'&&(peer.player.appliedSeq??-1)<peer.player.seq){peer.pendingChest??=m;return;}
     const room=peer.room,serial=room.eventSerial,phase=room.phase;
     if(room.premade&&phase==='lobby'){
      if(m.type==='rankTeamStart'||m.type==='rankTeamCancel'){
       if(room.host!==peer.player.id)throw Error('เฉพาะหัวหน้าห้องเท่านั้นที่เริ่มหรือยกเลิกการค้นหาได้');
       if(m.type==='rankTeamStart'){
        if(!room.canSearchRankTeam())throw Error('จัดทีมให้ครบ 5 ที่นั่ง และให้ผู้เล่นทุกคนกดพร้อม');
        room.rankSearch??=now;
       }else room.rankSearch=null;
       for(const q of peers)if(q.room===room)push(q,now);
       return;
      }
      if(m.type==='team'||m.type==='start'||m.type==='addBot'&&m.side!==0)throw Error('ห้องจัดอันดับทีมจัดเองมีทีมเดียว');
      if(room.rankSearch!=null&&m.type!=='leave')throw Error('ยกเลิกค้นหาก่อนแก้ไขทีม');
     }
     if(m.type==='leave'){
      if(phase!=='lobby')throw Error('การแข่งขันเริ่มแล้ว');
      if(room.premade)room.rankSearch=null;
      room.command(peer.player,m,now);
      peer.player=null;peer.room=null;
      send(peer,{type:'left'});
      ws.close(1000,'left');
      if(!room.host)closeRoom(room);
      else for(const q of peers)if(q.room===room)push(q,now);
      return;
     }
     room.command(peer.player,m,now);
     if(m.type==='chest')send(peer,{type:'chest-result',id:m.id});
     if(m.type==='spectate')push(peer,now);
     else if(phase==='lobby'||room.eventSerial!==serial||room.phase!==phase)for(const q of peers)if(q.room===room)push(q,now);
     return;
    }
    let character=null;
    if(loadCharacter){
     const entry=tickets.get(m.ticket);
     tickets.delete(m.ticket);
     if(!entry||entry.until<=now)throw Error('กรุณายืนยันตัวละครใหม่');
     character=entry.character;
    }
    const code=String(m.code||'').trim().toUpperCase();
    const target=rooms.get(code);
    if(m.type==='createRankTeam'||m.type==='join'&&target?.premade){
     peer.joining=true;
     try{await joinPremade(peer,character,target,m.type==='createRankTeam');}finally{peer.joining=false;}
     return;
    }
    if(character&&['create','survival','join','createPublic','joinPublic'].includes(m.type)){
     // Opening the arena in another tab must not claim a second seat.
     for(const room of rooms.values()){
      if(room.phase==='finished'||room.practice)continue;
      const existing=room.players.find(p=>p.character?.code===character.code);
      if(existing){assign(peer,room,existing);return;}
     }
    }
    if(m.type==='ranked'){
     peer.joining=true;
     try{await joinRankQueue(peer,character,m.mode);}finally{peer.joining=false;}
     return;
    }
    if(['createPublic','joinPublic'].includes(m.type)&&!['team','survival'].includes(m.mode))throw Error('กรุณาเลือกโหมดการแข่งขัน');
    if(m.type==='resume'){
     const room=rooms.get(code)||rankRoomAliases.get(code);
     const p=typeof m.token==='string'&&room?.players.find(x=>!x.bot&&x.token===m.token);
     if(!p||(character&&p.character?.code!==character.code))throw Error('ห้องเดิมหมดอายุหรือไม่พบผู้เล่น');
     assign(peer,room,p);
    }else if(['create','practice','survival','survivalPractice','createPublic'].includes(m.type)){
     if(rooms.size>=MAX_ROOMS)throw Error('ห้องเต็มชั่วคราว');
     const key=roomCode();
     const practice=m.type==='practice'||m.type==='survivalPractice';
     const survival=m.type==='survival'||m.type==='survivalPractice'||(m.type==='createPublic'&&m.mode==='survival');
     const room=new Match(key,now,Math.random,survival?'survival':'team');
     room.isPublic=m.type==='createPublic';
     room.rankingAvailable=Boolean(ranking?.enabled);
     const p=practice?startPractice(room,m,now,character):room.join(m,character);
     rooms.set(key,room);assign(peer,room,p);
    }else if(m.type==='joinPublic'){
     const room=[...rooms.values()].filter(r=>r.isPublic&&r.phase==='lobby'&&r.solo===(m.mode==='survival')&&
      r.players.length<10&&r.players.every(p=>p.connected)).sort((a,b)=>b.players.length-a.players.length||a.created-b.created)[0];
     if(!room)throw Error('ยังไม่มีห้องสาธารณะที่ว่างในโหมดนี้ ลองสร้างห้องสาธารณะเพื่อรอผู้เล่นคนอื่น');
     assign(peer,room,room.join(m,character));
    }else if(m.type==='join'){
     const room=rooms.get(code);if(!room||room.ranked)throw Error('ไม่พบห้อง');
     assign(peer,room,room.join(m,character));
    }
   }catch(error){send(peer,{type:'error',action:m?.type,message:error instanceof SyntaxError?'คำสั่งไม่ถูกต้อง':error.message});}
  });
  return response;
 }
 const server=Deno.serve({hostname:'127.0.0.1',port:8788,...options},async req=>{
  const url=new URL(req.url);
  if(url.pathname==='/healthz'&&['GET','HEAD'].includes(req.method)){
   return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':siteOrigin||'*','Cache-Control':'no-store'}});
  }
  if(['/ranked-health','/ranked-team-health'].includes(url.pathname)&&['GET','HEAD'].includes(req.method)){
   return new Response(null,{status:await rankedReady()?204:503,
    headers:{'Access-Control-Allow-Origin':siteOrigin||'*','Cache-Control':'no-store'}});
  }
  if(url.pathname==='/rankings'&&req.method==='GET'){
   const headers={'Access-Control-Allow-Origin':siteOrigin||'*','Cache-Control':'no-store'};
   if(!ranking?.enabled)return Response.json({error:'กระดานคะแนนยังไม่พร้อมใช้งาน'},{status:503,headers});
   try{return Response.json({rows:await ranking.top()},{headers});}
   catch{return Response.json({error:'โหลดกระดานคะแนนไม่สำเร็จ'},{status:503,headers});}
  }
  if(url.pathname==='/ticket'&&loadCharacter){
   if(!allowed(req))return new Response(null,{status:403});
   const headers={'Access-Control-Allow-Origin':req.headers.get('origin'),'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Authorization, Content-Type','Cache-Control':'no-store',Vary:'Origin'};
   if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
   if(req.method!=='POST')return new Response(null,{status:405,headers});
   const token=req.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
   if(!token)return Response.json({error:'กรุณาเข้าสู่ระบบ'},{status:401,headers});
   if(tickets.size>=MAX_CONNECTIONS*2)return Response.json({error:'สนามเต็มชั่วคราว'},{status:503,headers});
   try{
    const {code}=await req.json(),character=await loadCharacter(token,code);
    if(ranking?.enabled){
     try{character.colosseumRating=await ranking.rating(code);}
     catch(error){console.error('Colosseum rating load failed:',error.message);}
    }
    const ticket=crypto.randomUUID();
    tickets.set(ticket,{character,until:Date.now()+30_000});
    return Response.json({ticket},{headers});
   }catch{return Response.json({error:'ยืนยันตัวละครไม่สำเร็จ กรุณาลองใหม่'},{status:403,headers});}
  }
  if(url.pathname==='/ws'&&req.headers.get('upgrade')?.toLowerCase()==='websocket')return connect(req);
  if(loadCharacter)return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(req.method))return new Response(null,{status:405});
  const path=url.pathname==='/'?'index.html':url.pathname.slice(1);
  const contentType=TYPES[path.match(/\.[a-z0-9]+$/i)?.[0]];
  const asset=path.startsWith('assets/')&&/^assets\/[a-z0-9_./-]+$/i.test(path)&&!path.split('/').some(x=>x.startsWith('.'));
  const atlas=/^art\/(?:(swordsman|archer|mage|summoner)-(idle|run)|tall-grass-v1|tall-hedge-v2|maze-wall-v1|stone-base-v1|arena-(crowd|paving|column|ruins)-v1|mode-(team|survival)-v1|(?:ice|fire)-castle-(?:main|small)-v1)\.webp$/.test(path);
  const effectStyles=path==='game-styles.afa6a43765a67ae5.css';
  const siegeArt=/^art\/(?:(?:ice|fire)-castle-(?:small|medium|large)-hp-(?:75|50|25)|siege-(?:archer|magic|gunner|melee|hammer|tower|collapse|fire|smoke))\.webp$/.test(path);
  if(!contentType||!(STATIC.has(path)||asset||atlas||siegeArt||effectStyles))return new Response('Not found',{status:404});
  const location=asset||effectStyles?new URL(path,ROOT):new URL(path.includes('/')&&STATIC.has(path)?'../'+path:path,import.meta.url);
  try{
   const body=req.method==='HEAD'?null:await Deno.readFile(location);
   return new Response(body,{headers:{'Content-Type':contentType,'X-Content-Type-Options':'nosniff','Cache-Control':asset?'public, max-age=3600':'no-store'}});
  }catch(error){
   if(error instanceof Deno.errors.NotFound)return new Response('Not found',{status:404});
   return new Response('File unavailable',{status:500});
  }
 });
 server.finished.finally(()=>clearInterval(timer));
 return server;
}
if(import.meta.main){
 const portArg=Deno.args.find(x=>x.startsWith('--port='));
 const publicServer=Deno.args.includes('--public');
 const port=portArg?.slice(7)||(publicServer?Deno.env.get('PORT'):null)||8788;
 const siteOrigin=publicServer?Deno.env.get('SB_COLOSSEUM_SITE_ORIGIN'):null;
 const accountURL=publicServer?Deno.env.get('SB_COLOSSEUM_ACCOUNT_URL'):null;
 const accountKey=publicServer?Deno.env.get('SB_COLOSSEUM_ACCOUNT_KEY'):null;
 const rankKey=publicServer?Deno.env.get('SB_COLOSSEUM_RANK_KEY'):null;
 if(publicServer&&(!siteOrigin||!accountURL||!accountKey))throw Error('Missing Colosseum public server settings');
 serve({hostname:publicServer||Deno.args.includes('--lan')?'0.0.0.0':'127.0.0.1',
  port:Number(port),siteOrigin,ranking:publicServer?createRankingStore(accountURL,accountKey,rankKey):null,loadCharacter:publicServer?createAccountLoader(accountURL,accountKey):null});
}
