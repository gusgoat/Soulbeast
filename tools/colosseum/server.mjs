import {Match} from './match.mjs';
import {startPractice} from './practice.mjs';
import {createAccountLoader} from './account-auth.mjs';

const TYPES={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.mp3':'audio/mpeg'};
const STATIC=new Set(['index.html','client.mjs','arena.mjs','survival-arena.mjs','arena-traps.mjs','scene.mjs','sight.mjs','style.css','rare-art.mjs','battle-presentation.mjs','pvp-card-art.mjs','labyrinth-demo/traps.js','town-walk-demo/sealer-sprite-catalog.js']);
const ROOT=new URL('../../',import.meta.url);
const TICK=50, LOBBY_TTL=30*60_000, LOBBY_RECONNECT_MS=60_000, FINISH_TTL=5*60_000;
const MAX_ROOMS=32, MAX_CONNECTIONS=160;

export function serve({loadCharacter=null,siteOrigin=null,lobbyReconnectMs=LOBBY_RECONNECT_MS,...options}={}){
 const rooms=new Map(), peers=new Set(),tickets=new Map();
 const allowed=req=>req.headers.get('origin')===(siteOrigin||new URL(req.url).origin);
 const send=(peer,value)=>{
  if(peer.ws.readyState===WebSocket.OPEN&&peer.ws.bufferedAmount<96_000)peer.ws.send(JSON.stringify(value));
 };
 function push(peer,now){
  if(!peer.room||!peer.player)return;
  const {room,player}=peer;
  if(peer.ws.bufferedAmount>=96_000)return;
  send(peer,room.snapshot(player,now));
  const b=player.phase==='battle'&&room.battles.get(player.battle);
  const key=b?`${b.id}:${b.turn}:${b.last?.n||0}:${b.finished}:${b.autoVersion}:${b.fogVersion??0}`:'';
  if(key!==peer.battleKey){peer.battleKey=key;send(peer,{type:'battle',battle:room.battleSnapshot(player)});}
 }
 function closeRoom(room){
  rooms.delete(room.code);
  for(const peer of peers)if(peer.room===room)peer.ws.close(1000,'room closed');
 }
 let last=Date.now(), frame=0;
 const timer=setInterval(()=>{
  const now=Date.now(),dt=Math.min(.10,(now-last)/1000);last=now;
  const changed=new Set();
  for(const [ticket,entry] of tickets)if(now>=entry.until)tickets.delete(ticket);
  for(const room of rooms.values()){
   if(room.phase==='lobby'){
    const before=room.players.length;
    room.players=room.players.filter(p=>p.connected||now-(p.disconnectedAt??now)<lobbyReconnectMs);
    if(room.players.length!==before)changed.add(room);
   }
   if((room.phase==='lobby'&&(now-room.created>LOBBY_TTL||!room.host))||
      (room.phase==='finished'&&now-room.finishedAt>FINISH_TTL)){
    closeRoom(room);
    continue;
   }
   const event=room.eventSerial,battle=room.battleSerial,phase=room.phase;
   try{room.tick(now,dt);}catch(error){
    console.error('Colosseum simulation failed:',error);
    room.finish(-1,'error',now);
   }
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
  const old=[...peers].find(q=>q!==peer&&q.player===p);
  if(old){old.player=null;old.ws.close(4001,'session resumed');}
  peer.room=room;peer.player=p;peer.battleKey=null;
  p.connected=true;p.disconnectedAt=null;p.dx=p.dy=0;
  send(peer,{type:'welcome',room:room.code,token:p.token,seq:p.seq});push(peer,Date.now());
 }
 function connect(req){
  if(!allowed(req))return new Response('Origin rejected',{status:403});
  if(peers.size>=MAX_CONNECTIONS)return new Response('Busy',{status:503});
  const {socket:ws,response}=Deno.upgradeWebSocket(req);
  const peer={ws,room:null,player:null,quota:0,bucket:0};
  peers.add(peer);
  const timeout=setTimeout(()=>{if(!peer.player&&ws.readyState===WebSocket.OPEN)ws.close(1000,'join timed out');},30_000);
  ws.addEventListener('close',()=>{
   peers.delete(peer);clearTimeout(timeout);
   if(peer.player){
    peer.player.connected=false;peer.player.disconnectedAt=Date.now();peer.player.dx=peer.player.dy=0;
    if(peer.room.phase==='lobby')peer.player.ready=false;
   }
  });
  ws.addEventListener('error',()=>{});
  ws.addEventListener('message',event=>{
   const now=Date.now(),second=Math.floor(now/1000);
   if(peer.bucket!==second){peer.bucket=second;peer.quota=0;}
   if(++peer.quota>50||typeof event.data!=='string'||event.data.length>4096){ws.close(1008,'message limit');return;}
   let m;
   try{
    m=JSON.parse(event.data);if(!m||typeof m.type!=='string')return;
    if(peer.player){
     if(m.type==='ping'){if(Number.isFinite(m.echo))send(peer,{type:'pong',echo:m.echo,now});return;}
     if(m.type==='leavePractice'&&peer.room.practice){
      rooms.delete(peer.room.code);
      peer.player=null;peer.room=null;ws.close(1000,'left');
      return;
     }
     if(m.type==='chest'&&(peer.player.appliedSeq??-1)<peer.player.seq){peer.pendingChest??=m;return;}
     const room=peer.room,serial=room.eventSerial,phase=room.phase;
     if(m.type==='leave'){
      if(phase!=='lobby')throw Error('การแข่งขันเริ่มแล้ว');
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
     if(phase==='lobby'||room.eventSerial!==serial||room.phase!==phase)for(const q of peers)if(q.room===room)push(q,now);
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
    if(character&&['create','survival','join','createPublic','joinPublic'].includes(m.type)){
     // Opening the arena in another tab must not claim a second seat.
     for(const room of rooms.values()){
      if(room.phase==='finished'||room.practice)continue;
      const existing=room.players.find(p=>p.character?.code===character.code);
      if(existing){assign(peer,room,existing);return;}
     }
    }
    if(['createPublic','joinPublic'].includes(m.type)&&!['team','survival'].includes(m.mode))throw Error('กรุณาเลือกโหมดการแข่งขัน');
    if(m.type==='resume'){
     const room=rooms.get(code);
     const p=typeof m.token==='string'&&room?.players.find(x=>!x.bot&&x.token===m.token);
     if(!p||(character&&p.character?.code!==character.code))throw Error('ห้องเดิมหมดอายุหรือไม่พบผู้เล่น');
     assign(peer,room,p);
    }else if(['create','practice','survival','survivalPractice','createPublic'].includes(m.type)){
     if(rooms.size>=MAX_ROOMS)throw Error('ห้องเต็มชั่วคราว');
     let key;do{key=crypto.randomUUID().slice(0,8).toUpperCase();}while(rooms.has(key));
     const practice=m.type==='practice'||m.type==='survivalPractice';
     const survival=m.type==='survival'||m.type==='survivalPractice'||(m.type==='createPublic'&&m.mode==='survival');
     const room=new Match(key,now,Math.random,survival?'survival':'team');
     room.isPublic=m.type==='createPublic';
     const p=practice?startPractice(room,m,now,character):room.join(m,character);
     rooms.set(key,room);assign(peer,room,p);
    }else if(m.type==='joinPublic'){
     const room=[...rooms.values()].filter(r=>r.isPublic&&r.phase==='lobby'&&r.solo===(m.mode==='survival')&&
      r.players.length<10&&r.players.every(p=>p.connected)).sort((a,b)=>b.players.length-a.players.length||a.created-b.created)[0];
     if(!room)throw Error('ยังไม่มีห้องสาธารณะที่ว่างในโหมดนี้ ลองสร้างห้องสาธารณะเพื่อรอผู้เล่นคนอื่น');
     assign(peer,room,room.join(m,character));
    }else if(m.type==='join'){
     const room=rooms.get(code);if(!room)throw Error('ไม่พบห้อง');
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
  const atlas=/^art\/(?:(swordsman|archer|mage|summoner)-(idle|run)|tall-grass-v1|tall-hedge-v2|maze-wall-v1|stone-base-v1|arena-(crowd|paving|column|ruins)-v1|(?:ice|fire)-castle-(?:main|small)-v1)\.webp$/.test(path);
  if(!contentType||!(STATIC.has(path)||asset||atlas))return new Response('Not found',{status:404});
  const location=asset?new URL(path,ROOT):new URL(path.includes('/')&&STATIC.has(path)?'../'+path:path,import.meta.url);
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
 if(publicServer&&(!siteOrigin||!accountURL||!accountKey))throw Error('Missing Colosseum public server settings');
 serve({hostname:publicServer||Deno.args.includes('--lan')?'0.0.0.0':'127.0.0.1',
  port:Number(port),siteOrigin,loadCharacter:publicServer?createAccountLoader(accountURL,accountKey):null});
}
