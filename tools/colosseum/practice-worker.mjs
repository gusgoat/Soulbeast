import {Match} from './match.mjs?v=career-art';
import {startPractice} from './practice.mjs';

let room,player,timer,last,frame=0,battleKey;
const send=message=>postMessage(message);
function push(now){
 send(room.snapshot(player,now));
 const b=player.phase==='battle'&&room.battles.get(player.battle);
 const key=b?`${b.id}:${b.turn}:${b.last?.n||0}:${b.finished}:${b.autoVersion}:${b.fogVersion??0}`:'';
 if(key!==battleKey){battleKey=key;send({type:'battle',battle:room.battleSnapshot(player)});}
}
self.onmessage=({data})=>{
 const now=Date.now();
 try{
  if(!room){
   if(!['practice','survivalPractice'].includes(data.type)||!data.character)throw Error('กรุณาเลือกตัวละครก่อนเข้าสนาม');
   const code=crypto.randomUUID().slice(0,8).toUpperCase();
   const next=new Match(code,now,Math.random,data.type==='survivalPractice'?'survival':'team');
   player=startPractice(next,{},now,data.character);
   room=next;last=now;
   send({type:'welcome',room:code,seq:player.seq});
   push(now);
   timer=setInterval(()=>{
    const now=Date.now(),dt=Math.min(.1,(now-last)/1000);last=now;
    try{room.tick(now,dt);}catch(error){console.error(error);room.finish(-1,'error',now);}
    if(++frame%2===0||room.phase==='finished')push(now);
    if(room.phase==='finished')clearInterval(timer);
   },50);
  }else if(data.type==='leavePractice'){
   clearInterval(timer);send({type:'left'});close();
  }else if(data.type==='ping')send({type:'pong',echo:data.echo,now});
  else{
   const serial=room.eventSerial,phase=room.phase;
   room.command(player,data,now);
   if(data.type==='chest')send({type:'chest-result',id:data.id});
   if(serial!==room.eventSerial||phase!==room.phase)push(now);
  }
 }catch(error){send({type:'error',action:data?.type,message:error.message});}
};
