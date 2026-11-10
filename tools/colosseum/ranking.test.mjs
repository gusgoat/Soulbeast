import {strict as assert} from 'node:assert';
import {Match} from './match.mjs';
import {serve} from './server.mjs';
import {balanceRankedTeams,compatiblePlayers,premadeRankPair,rankedGroup,RANKED_EXPAND_MS,RANKED_FILL_MS} from './matchmaking.mjs';
import {SHIELDS,shieldFor,matchRankChanges} from './ranking.mjs';

function populate(mode,count){
 const room=new Match('TEST',1000,Math.random,mode);
 for(let i=0;i<count;i++){
  const p=room.join({name:'Player '+i,lv:20,cls:'swordsman'});
  p.ready=true;
 }
 room.start(1000);
 room.ranked=true;
 for(const [i,p] of room.players.entries())Object.assign(p,{character:{code:'player-'+i},helpedFight:true});
 return room;
}

Deno.test('ranked team stats exempt players who fought and ordinary rooms award no rating',()=>{
 const room=populate('team',4);
 const [winner,losingMvp,otherWinner,otherLoser]=room.players;
 room.earn(winner,5);
 room.earn(otherWinner,5);
 winner.kills=1;
 room.earn(losingMvp,10);
 room.finish(0,'time',2000);
 assert.equal(room.results[0][0].id,winner.id);
 assert.deepEqual(room.results[0].map(({points,kills,mvp})=>({points,kills,mvp})),[
  {points:5,kills:1,mvp:true},{points:5,kills:0,mvp:false},
 ]);
 assert.deepEqual(matchRankChanges(room).map(row=>row.delta),[2,1,1,-1]);
 const snapshot=room.snapshot(losingMvp,2000);
 assert.equal(snapshot.rankDelta,1);
 assert.equal(snapshot.results[1][0].name,losingMvp.name);

 const mixed=populate('team',4);
 mixed.players[2].bot={};
 mixed.finish(0,'zero',2000);
 assert.deepEqual(matchRankChanges(mixed).map(row=>row.code),['player-0','player-1','player-3']);
 mixed.ranked=false;
 assert.deepEqual(matchRankChanges(mixed),[]);
 const draw=populate('team',2);
 draw.finish(-1,'time',2000);
 assert.deepEqual(matchRankChanges(draw),[]);
 draw.players[0].helpedFight=false;
 assert.equal(matchRankChanges(draw)[0].violation,'inactive');
});

Deno.test('ranked survival awards placement points even after bot fill',()=>{
 const room=populate('survival',6);
 for(let i=5;i>0;i--){
  const time=6000-i;
  room.fall(room.players[i],time,'หมอกพิษ');
  room.checkScore(time);
  assert.equal(room.snapshot(room.players[i],time).placement,i+1);
 }
 assert.deepEqual(matchRankChanges(room).map(row=>row.delta),[3,2,2,1,1,-1]);

 const mixed=populate('survival',2);
 mixed.players[1].bot={};
 mixed.fall(mixed.players[1],2000);
 mixed.checkScore(2000);
 assert.deepEqual(matchRankChanges(mixed).map(row=>row.delta),[3]);
 assert.equal(mixed.snapshot(mixed.players[0],2000).placement,1);
});

Deno.test('shield cutoffs have no missing scores',()=>{
 assert.deepEqual([-1,10,11,21,31,41,51,61,81,101].map(score=>shieldFor(score).id),
  [SHIELDS[0].id,...SHIELDS.map(shield=>shield.id)]);
});


Deno.test('an actual PvP knockout is credited once to the owner of the finishing unit',()=>{
 const room=populate('team',4);
 const [a,b]=room.players;
 for(const player of room.players){delete player.character;player.helpedFight=false;}
 room.encounter(a,b,4000);
 const battle=room.battles.get(a.battle);
 const attacker=battle.allies.find(unit=>unit.kind==='player'&&unit.sealer===a.id);
 const target=battle.enemies.find(unit=>unit.kind==='player'&&unit.sealer===b.id);
 target.hp=1;
 target.pas=[];
 battle.cur=attacker.id;
 const random=Math.random;
 try{
  Math.random=()=>.01;
  room.command(a,{type:'combat',turn:battle.turn,skill:'attack',target:target.id},battle.openAt);
 }finally{
  Math.random=random;
 }
 assert.equal(target.hp,0);
 assert.equal(a.kills,1);
 assert.equal(a.helpedFight,true);
 room.recordFalls(battle,battle.openAt);
 assert.equal(a.kills,1);
});

Deno.test('ranked queues require ten, expand by age, and fill equal human teams',()=>{
 const entries=[9,20,30,43,51,61,81,101,200,210].map((rating,i)=>({rating,enteredAt:i*100,peer:{ws:{readyState:1}}}));
 assert.equal(compatiblePlayers(entries[1],entries,1000).length,2);
 assert.equal(rankedGroup(entries,'team',RANKED_EXPAND_MS-1),null);
 assert.equal(rankedGroup(entries,'team',RANKED_EXPAND_MS).length,10);
 const odd=entries.slice(0,5);
 assert.equal(rankedGroup(odd,'team',RANKED_FILL_MS-1),null);
 const group=rankedGroup(odd,'team',RANKED_FILL_MS);
 assert.equal(group.length,4);
 assert(group.includes(odd[0]));
 const [left,right]=balanceRankedTeams([{rating:1},{rating:3},{rating:7},{rating:9}],()=>0);
 assert.equal(left.length,2);
 assert.equal(left.reduce((s,p)=>s+p.rating,0),right.reduce((s,p)=>s+p.rating,0));
 assert.equal(rankedGroup(entries.slice(0,1),'team',RANKED_FILL_MS),null);
 assert.equal(rankedGroup(entries.slice(0,1),'survival',RANKED_FILL_MS).length,1);
});

Deno.test('ranked socket starts ten humans without a host, reconnects, and penalizes leaving once',async()=>{
 const origin='https://game.example',abort=new AbortController(),sockets=[],writes=[];
 const profile={lv:42,cls:'kensei',gender:'female',eq:{weapon:'wp_sword5'},pts:{},pets:[{uid:1,sp:'kappa',lv:20,pts:{}}],party:[1],carried:[1]};
 const server=serve({port:0,signal:abort.signal,onListen(){},siteOrigin:origin,rankedReconnectMs:900,
  loadCharacter:async(_token,code)=>({...profile,code,name:code}),
  ranking:{
   enabled:true,rating:async()=>20,
   status:async code=>({account:code.replace(/-alt$/,''),rating:20,
    blockedUntil:writes.some(row=>row.code===code.replace(/-alt$/,''))?new Date(Date.now()+300000).toISOString():null}),
   commit:async(_match,rows)=>{writes.push(...rows);return rows.map(row=>({code:row.code,score:20+row.delta}));},
  },
 });
 const host='127.0.0.1:'+server.addr.port;
 const wait=async(test)=>{
  for(let i=0;i<160;i++){
   const value=test();
   if(value)return value;
   await new Promise(resolve=>setTimeout(resolve,20));
  }
  throw Error('Timed out waiting for ranked message');
 };
 async function enter(code,command){
  const response=await fetch('http://'+host+'/ticket',{method:'POST',headers:{Origin:origin,Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({code})});
  const {ticket}=await response.json();
  assert(ticket);
  const ws=new WebSocket('ws://'+host+'/ws',{headers:{Origin:origin}}),messages=[];
  sockets.push(ws);
  const peer={ws,messages,send:m=>ws.send(JSON.stringify(m))};
  ws.onmessage=({data})=>messages.push(JSON.parse(data));
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  peer.send({...command,ticket});
  return peer;
 }
 try{
  const queued=await enter('cancel',{type:'ranked',mode:'team'});
  await wait(()=>queued.messages.find(m=>m.type==='rankQueue'));
  queued.send({type:'cancelRank'});
  await wait(()=>queued.messages.find(m=>m.type==='left'));
  const group=await Promise.all(Array.from({length:10},(_,i)=>enter('rank-'+i,{type:'ranked',mode:'team'})));
  const welcomes=await Promise.all(group.map(peer=>wait(()=>peer.messages.find(m=>m.type==='welcome'))));
  assert.equal(new Set(welcomes.map(m=>m.room)).size,1);
  const state=await wait(()=>group[0].messages.find(m=>m.type==='state'));
  assert.equal(state.phase,'match');
  assert.equal(state.ranked,true);
  assert.equal(state.host,null);
  assert.equal(state.players.filter(p=>p.side===0).length,5);
  assert(!state.players.some(p=>p.bot));
  group[1].ws.close();
  const resumed=await enter('rank-1',{type:'resume',code:welcomes[1].room,token:welcomes[1].token});
  await wait(()=>resumed.messages.find(m=>m.type==='welcome'));
  assert.equal(writes.length,0);
  group[0].send({type:'rankLeave'});
  await wait(()=>group[0].messages.find(m=>m.type==='left'));
  await wait(()=>writes.find(row=>row.code==='rank-0'));
  assert.equal(writes[0].delta,-2);
  assert.equal(writes[0].violation,'abandon');
  const banned=await enter('rank-0-alt',{type:'ranked',mode:'team'});
  assert.match((await wait(()=>banned.messages.find(m=>m.type==='error'))).message,/ถูกระงับ/);
  group[2].ws.close();
  await wait(()=>writes.find(row=>row.code==='rank-2'));
  assert.deepEqual(writes.map(row=>row.code),['rank-0','rank-2']);
 }finally{
  await Promise.all(sockets.map(ws=>ws.readyState===WebSocket.CLOSED?null:new Promise(resolve=>{
   ws.addEventListener('close',resolve,{once:true});ws.close();
  })));
  abort.abort();
  await server.finished;
 }
});

Deno.test('premade matchmaking picks the closest team total and expands without mixing queues',()=>{
 const team=(ratings,rankSearch=1000)=>({rankSearch,canSearchRankTeam:()=>true,players:ratings.map(rating=>({rating}))});
 const first=team([50,45]),far=team([160],2000),close=team([85],3000),closer=team([89],4000);
 assert.deepEqual(premadeRankPair([far,close,first,closer],5000),[first,closer]);
 assert.equal(premadeRankPair([first,far],5000),null);
 assert.deepEqual(premadeRankPair([first,far],121000),[first,far]);
 assert.equal(premadeRankPair([first,team([500],2000)],400000),null);
});

Deno.test('premade rooms keep friends together, allow bots, and never match the solo queue',async()=>{
 const origin='https://game.example',abort=new AbortController(),sockets=[];
 const profile={lv:42,cls:'kensei',gender:'female',eq:{weapon:'wp_sword5'},pts:{},pets:[{uid:1,sp:'kappa',lv:20,pts:{}}],party:[1],carried:[1]};
 const ratings={alpha:20,friend:19,beta:40,solo:39};
 const server=serve({port:0,signal:abort.signal,onListen(){},siteOrigin:origin,
  loadCharacter:async(_token,code)=>({...profile,code,name:code}),
  ranking:{enabled:true,rating:async code=>ratings[code]??0,
   status:async code=>({account:code.replace(/-alt$/,''),rating:ratings[code]??0}),commit:async()=>[]},
 });
 const host='127.0.0.1:'+server.addr.port;
 async function wait(test){
  for(let i=0;i<250;i++){
   const value=test();
   if(value)return value;
   await new Promise(resolve=>setTimeout(resolve,20));
  }
  throw Error('Timed out waiting for premade message');
 }
 async function enter(code,command){
  const response=await fetch('http://'+host+'/ticket',{method:'POST',headers:{Origin:origin,Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({code})});
  const {ticket}=await response.json();
  assert(ticket);
  const ws=new WebSocket('ws://'+host+'/ws',{headers:{Origin:origin}}),messages=[];
  sockets.push(ws);
  ws.onmessage=({data})=>messages.push(JSON.parse(data));
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  const peer={ws,messages,send:msg=>ws.send(JSON.stringify(msg)),state:()=>messages.findLast(m=>m.type==='state')};
  peer.send({...command,ticket});
  return peer;
 }
 try{
  const alpha=await enter('alpha',{type:'createRankTeam'});
  const a=await wait(()=>alpha.messages.find(m=>m.type==='welcome'));
  const friend=await enter('friend',{type:'join',code:a.room});
  const f=await wait(()=>friend.messages.find(m=>m.type==='welcome'));
  const beta=await enter('beta',{type:'createRankTeam'});
  await wait(()=>beta.state()?.premade);
  const solo=await enter('solo',{type:'ranked',mode:'team'});
  await wait(()=>solo.messages.find(m=>m.type==='rankQueue'));
  const alternate=await enter('alpha-alt',{type:'ranked',mode:'team'});
  assert.match((await wait(()=>alternate.messages.find(m=>m.type==='error'))).message,/ออกจากห้องทีมจัดเอง/);
  alpha.send({type:'rankTeamStart'});
  await wait(()=>alpha.messages.find(m=>m.type==='error'&&m.action==='rankTeamStart'));
  for(const player of [alpha,friend,beta])player.send({type:'ready',ready:true});
  for(const [host,count] of [[alpha,3],[beta,4]])for(let i=0;i<count;i++)host.send({type:'addBot',side:0});
  await wait(()=>alpha.state()?.canSearchRankTeam&&beta.state()?.canSearchRankTeam);
  alpha.send({type:'rankTeamStart'});
  await wait(()=>alpha.state()?.rankSearching);
  alpha.send({type:'rankTeamCancel'});
  await wait(()=>alpha.state()?.rankSearching===false);
  beta.send({type:'rankTeamStart'});
  await wait(()=>beta.state()?.rankSearching);
  assert.equal(alpha.state().phase,'lobby');
  alpha.send({type:'rankTeamStart'});
  const match=await wait(()=>{const state=alpha.state();return state?.phase==='match'&&state;});
  assert.equal(match.ranked,true);
  assert.equal(match.players.length,10);
  assert.equal(match.players.filter(p=>p.bot).length,7);
  assert.equal(match.players.find(p=>p.name==='alpha').side,match.players.find(p=>p.name==='friend').side);
  assert.notEqual(match.players.find(p=>p.name==='alpha').side,match.players.find(p=>p.name==='beta').side);
  assert.equal(solo.messages.find(m=>m.type==='welcome'),undefined);
  assert.equal(solo.messages.findLast(m=>m.type==='rankQueue').count,1);
  friend.ws.close();
  const resumed=await enter('friend',{type:'resume',code:f.room,token:f.token});
  await wait(()=>resumed.state()?.phase==='match');
  assert.equal(resumed.state().code,match.code);
 }finally{
  await Promise.all(sockets.map(ws=>ws.readyState===WebSocket.CLOSED?null:new Promise(resolve=>{
   ws.addEventListener('close',resolve,{once:true});ws.close();
  })));
  abort.abort();
  await server.finished;
 }
});
