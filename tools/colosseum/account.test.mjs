import {botCareer, demoProfile} from './combat.mjs';
import {Match} from './match.mjs';
import {startPractice} from './practice.mjs';
import {createAccountLoader} from './account-auth.mjs';
import {serve} from './server.mjs';

const eq=(actual,expected)=>{if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error(JSON.stringify({actual,expected}));};
const character={code:'test-character',name:'Chosen Character',lv:42,cls:'kensei',gender:'female',eq:{weapon:'wp_sword5'},pts:{},pets:[{uid:1,sp:'kappa',lv:40,pts:{}}],party:[1],carried:[1]};

Deno.test('practice uses the selected character and all bots promote strictly after 25 and 40',()=>{
 eq([25,26,40,41].map(lv=>botCareer('kensei',lv,0)),['swordsman','samurai','samurai','kensei']);
 for(const mode of ['team','survival']){
  const room=new Match('FIXTURE',0,()=>.5,mode);
  const chosen=startPractice(room,{name:'Fake',lv:10,cls:'mage'},0,character);
  const team=demoProfile(chosen,0);
  eq([chosen.name,chosen.lv,chosen.cls,team[0].gender,team[1].sp,team[1].lv],
   ['Chosen Character',42,'kensei','female','kappa',40]);
  eq(room.players.filter(p=>p.bot&&p.lv===42&&p.cls===botCareer(p.cls,42,0)).length>0,true);
  eq(room.players.filter(p=>p.bot&&p.lv===42&&p.cls!==p.baseCls&&p.cls!==botCareer(p.cls,40,0)).length,9);
 }
});

Deno.test('public WebSocket seats require a one-use ticket and trust only the account profile',async()=>{
 const origin='https://game.example',abort=new AbortController(),sockets=[];
 const loadCharacter=createAccountLoader('https://accounts.example/characters','public-key',async (url,init)=>{
  eq(url,'https://accounts.example/characters');
  eq(init.headers['x-soulbeast-environment'],'live');
  eq(JSON.parse(init.body),{action:'load',code:character.code});
  const ok=init.headers.Authorization==='Bearer valid-token';
  return Response.json({ok,data:JSON.stringify({P:character})});
 });
 const server=serve({port:0,signal:abort.signal,onListen(){},siteOrigin:origin,loadCharacter});
 const host='127.0.0.1:'+server.addr.port;
 function connect(ticket){
  return new Promise((resolve,reject)=>{
   const ws=new WebSocket('ws://'+host+'/ws',{headers:{Origin:origin}});sockets.push(ws);
   const timeout=setTimeout(()=>reject(Error('WebSocket timeout')),2000);
   ws.onopen=()=>ws.send(JSON.stringify({type:'create',ticket,name:'Spoof',cls:'mage',lv:10}));
   ws.onmessage=({data})=>{
    const m=JSON.parse(data);
    if(m.type==='state'||m.type==='error'){clearTimeout(timeout);resolve(m);}
   };
   ws.onerror=()=>{clearTimeout(timeout);reject(Error('WebSocket connection failed'));};
  });
 }
 const request=(token,requestOrigin=origin)=>fetch('http://'+host+'/ticket',{
  method:'POST',headers:{Origin:requestOrigin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({code:character.code}),
 });
 try{
  const cross=await request('valid-token','https://other.example');eq(cross.status,403);await cross.text();
  const invalid=await request('invalid');eq(invalid.status,403);await invalid.text();
  eq((await connect('unissued')).type,'error');
  const response=await request('valid-token');eq(response.status,200);
  const {ticket}=await response.json();
  const lobby=await connect(ticket),p=lobby.players.find(x=>x.id===lobby.me);
  eq([p.name,p.cls,p.lv],[character.name,character.cls,character.lv]);
  eq((await connect(ticket)).type,'error');
 }finally{
  await Promise.all(sockets.map(ws=>ws.readyState===WebSocket.CLOSED?null:new Promise(resolve=>{ws.addEventListener('close',resolve,{once:true});ws.close();})));
  abort.abort();await server.finished;
 }
});

Deno.test('public lobbies reuse a character seat, confirm leaving and expire disconnected seats',async()=>{
 const origin='https://game.example',abort=new AbortController(),sockets=[];
 const server=serve({port:0,signal:abort.signal,onListen(){},siteOrigin:origin,lobbyReconnectMs:250,
  loadCharacter:async(token,code)=>({...character,code,name:token})});
 const host='127.0.0.1:'+server.addr.port;
 const wait=async(peer,test)=>{
  for(let i=0;i<90;i++){
   const value=peer.messages.find(test);
   if(value)return value;
   await new Promise(resolve=>setTimeout(resolve,20));
  }
  throw Error('Timed out waiting for lobby');
 };
 async function enter(code,command){
  const response=await fetch('http://'+host+'/ticket',{
   method:'POST',headers:{Origin:origin,Authorization:'Bearer '+code,'Content-Type':'application/json'},
   body:JSON.stringify({code}),
  });
  const {ticket}=await response.json();
  const ws=new WebSocket('ws://'+host+'/ws',{headers:{Origin:origin}}),messages=[];
  const peer={messages,send:m=>ws.send(JSON.stringify(m)),close:()=>ws.close()};
  sockets.push(ws);
  ws.onmessage=({data})=>messages.push(JSON.parse(data));
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  peer.send({...command,ticket});
  return peer;
 }
 try{
  const a=await enter('player-a',{type:'create'});
  const first=await wait(a,m=>m.type==='welcome');
  const duplicate=await enter('player-a',{type:'survival'});
  const reused=await wait(duplicate,m=>m.type==='welcome');
  eq([reused.room,reused.token],[first.room,first.token]);
  const b=await enter('player-b',{type:'join',code:first.room});
  const joined=await wait(b,m=>m.type==='state'&&m.players.length===2);
  eq(joined.code,first.room);
  duplicate.send({type:'leave'});
  await wait(duplicate,m=>m.type==='left');
  const promoted=await wait(b,m=>m.type==='state'&&m.players.length===1);
  eq(promoted.host,joined.me);
  b.close();
  await new Promise(resolve=>setTimeout(resolve,450));
  const late=await enter('player-c',{type:'join',code:first.room});
  eq((await wait(late,m=>m.type==='error')).message,'ไม่พบห้อง');
  const again=await enter('player-a',{type:'create'});
  eq((await wait(again,m=>m.type==='welcome')).room===first.room,false);
  again.send({type:'leave'});
  await wait(again,m=>m.type==='left');
 }finally{
  await Promise.all(sockets.map(ws=>ws.readyState===WebSocket.CLOSED?null:new Promise(resolve=>{ws.addEventListener('close',resolve,{once:true});ws.close();})));
  abort.abort();await server.finished;
 }
});
