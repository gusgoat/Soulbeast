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
