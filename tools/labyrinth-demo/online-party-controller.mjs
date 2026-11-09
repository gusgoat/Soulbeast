// Mutations stay ordered. Read-only refreshes never hold up a manual command.
export function partyRunController({connection,roomId,scene,openMotion,onState=()=>{},onError=()=>{},onResult=()=>{},localExploration=false,getPosition=()=>null,canAdvanceBattle=()=>true}){
 let closed=false,busy=false,snapshot=null,motion=null,motionKey='',path=[],seq=0,pendingState=null,commands=[],reading=false,snapshotAt=0,soloKnown=null;
 async function refresh(next){
  next??=await connection.run(roomId,'status',localExploration?{localExploration:true}:{});
  if(closed)return;
  if(!next||next.id!==roomId)throw Error('invalid_party_snapshot');
  if(snapshot&&next.revision<snapshot.revision){
   if(next.soloStart?.run.id===snapshot.battle?.id&&snapshot.battle?.status==='active'){
    soloKnown=next.soloStart.run.id;onState({...snapshot,soloStart:next.soloStart},path);
   }
   return;
  }
  if(next.soloStart)soloKnown=next.soloStart.run.id;
  await scene.receiveState(next);if(snapshot&&next.revision<snapshot.revision)return;snapshot=next;snapshotAt=Date.now();seq=Math.max(seq,next.movementSeq||0);
  if(next.departure||next.state==='closed'){path=[];await motion?.close();motion=null;onState(next);return;}
  const key=JSON.stringify([next.floor,next.members.map(m=>m.code).sort()]);
  if(key!==motionKey){
   path=[];await motion?.close();motion=null;
   const created=await openMotion(connection,next,(sender,p)=>scene.receiveMotion(sender,p),incoming=>{
    if(closed||incoming.revision<=(snapshot?.revision??-1))return;
    if(!pendingState||incoming.revision>pendingState.revision)pendingState=incoming;
    // A committed combat update can be displayed while an older HTTP call is pending.
    if(busy&&snapshot&&incoming.floor===snapshot.floor&&JSON.stringify([incoming.floor,incoming.members?.map(m=>m.code).sort()])===motionKey&&incoming.state==='active'&&!incoming.departure){if(pendingState===incoming)pendingState=null;void refresh(incoming).catch(onError);}
    else if(!busy)void drain();
   });
   if(closed){await created.close();return;}motion=created;motionKey=key;
  }
  if(next.battle?.status==='active')path=[];
  onState(next,path);
 }
 async function lane(work){
  if(busy||closed)return false;busy=true;
  try{await work();return true;}catch(error){path=[];onError(error);return false;}finally{busy=false;if(!closed)queueMicrotask(()=>{if(commands.length){const job=commands.shift();void lane(job.work).then(job.resolve);}else if(pendingState)void drain();});}
 }
 async function drain(){if(busy||closed||!pendingState)return;const next=pendingState;pendingState=null;return lane(()=>refresh(next));}
 const serverNow=()=>snapshot?.serverTime+Math.max(0,Date.now()-snapshotAt);
 function manualWait(){
  const w=snapshot?.battle?.waiting;
  return snapshot?.battle?.status==='active'&&!snapshot.battle.presentation&&w&&!snapshot.autoPlayers?.[w.ownerCode]&&w.deadline>serverNow()+120;
 }
 async function readStatus(){
  if(reading||closed)return false;reading=true;
  try{
   const next=await connection.run(roomId,'status',{...(localExploration?{localExploration:true}:{}),...(soloKnown&&snapshot?.battle?.id===soloKnown?{soloStart:false}:{})});
   if(closed||snapshot&&next.revision<snapshot.revision)return false;
   if(!pendingState||next.revision>pendingState.revision)pendingState=next;
   if(!busy&&!commands.length)await drain();return true;
  }catch(error){onError(error);return false;}finally{reading=false;}
 }
 return {
  refresh:()=>snapshot?readStatus():lane(refresh),
  // Renderer supplies traversed points, not an arbitrary end-point through walls.
  move(point,previous){
   if(closed||!snapshot||snapshot.departure||snapshot.state!=='active'||snapshot.battle?.status==='active')return false;
   if(localExploration)return true;
   const start=path.at(-2),last=path.at(-1);
   if(start&&last&&previous&&last.x===previous.x&&last.y===previous.y){
    const ax=last.x-start.x,ay=last.y-start.y,bx=point.x-last.x,by=point.y-last.y;
    if(Math.abs(ax*by-ay*bx)<1e-6&&ax*bx+ay*by>0){path[path.length-1]=point;return true;}
   }
   // The wire limit is per request, not per local input buffer.
   if(path.length>=128)return false;
   path.push({x:point.x,y:point.y});return true;
  },
  broadcast(position,moving,running){if(!closed&&snapshot?.state==='active'&&snapshot.battle?.status!=='active')motion?.send(position,moving,running);},
  pulse:()=>(snapshot?.battle?.localCombatVersion&&snapshot.battle.status==='active')||manualWait()||(snapshot?.battle?.presentation?.deadline>serverNow())?readStatus():lane(async()=>{
   if(!snapshot)return refresh();
   if(snapshot.departure||snapshot.state==='closed')return;
   if(snapshot.battle?.status==='active'||snapshot.battle?.presentation){
    if(!canAdvanceBattle(snapshot.battle))return refresh();
    if(snapshot.battle.loading&&!snapshot.battle.loading.pending.includes(connection.code))return refresh();
    if(snapshot.battle.loading?.pending?.includes(connection.code)){const result=await connection.run(roomId,'battleReady',{battle:snapshot.battle.id,presentationVersion:2});await refresh(result.snapshot);return;}
   }
   if(localExploration){
    // Advance my encounter directly. A failing unrelated solo battle must not
    // roll back this player's turn through the room-wide pulse transaction.
    if(snapshot.battle?.status==='active'||snapshot.battle?.presentation){
     const result=await connection.run(roomId,'tick',{battle:snapshot.battle.id});
     await refresh(result.snapshot);return;
    }
    const position=getPosition();
    await refresh(await connection.run(roomId,'pulse',{localExploration:true,floor:snapshot.floor,...(position?{position}:{})}));return;
   }
   const start=snapshot.members.find(member=>member.code===connection.code)?.position;
   const movement=path.length?{floor:snapshot.floor,seq:++seq,path:path.splice(0,16)}:null;
   const next=await connection.run(roomId,'pulse',movement?{movement}:{});
   if(movement&&next.floor===movement.floor&&next.movementSeq===movement.seq&&next.battle?.status!=='active'){
    const confirmed=next.members?.find(member=>member.code===connection.code)?.position;
    path=remainingSteps(start,movement.path,confirmed).concat(path);
   }
   await refresh(next);
  }),
  command:(action,data={})=>new Promise(resolve=>{
   const work=async()=>{
   // Interactions use confirmed positions. Keep pending walking in the pulse
   // queue, including when a target moves away before the action arrives.
   try{
    const result=await connection.run(roomId,action,{...(localExploration?{floor:snapshot.floor,position:getPosition()}:{}),...data,requestId:data.requestId||crypto.randomUUID()});
    await onResult(action,result,data);
    if(action==='leave'){await refresh(result);return;}
    if(result.snapshot){await refresh(result.snapshot);return;}
   }
   catch(error){
    if(['trap_unavailable','trap_out_of_reach','enemy_out_of_reach','boss_out_of_reach','enemy_unavailable','door_out_of_reach','stairs_out_of_reach','chest_out_of_reach','spring_out_of_reach'].includes(error.message)){
     await refresh();return;
    }
    if(action==='soloFinish'&&['battle_not_member','party_not_member'].includes(error.message)){await refresh();return;}
    throw error;
   }
   await refresh();
   };
   if(closed)return resolve(false);
   if(busy)commands.push({work,resolve});else void lane(work).then(resolve);
  }),
  get state(){return snapshot;},get busy(){return busy;},
  get pollDelay(){
   const b=snapshot?.battle;
   if(b?.localCombatVersion||!(b?.status==='active'||b?.presentation))return 5000;
   if(!canAdvanceBattle(b)||b.presentation)return 750;
   if(b.loading)return b.loading.pending.includes(connection.code)?0:750;
   if(manualWait())return Math.max(100,Math.min(5000,b.waiting.deadline-serverNow()));
   return Math.max(100,Math.min(750,(b.waiting?.deadline??b.nextTurnAt)-serverNow()||100));
  },
  async close(){closed=true;path=[];for(const job of commands.splice(0))job.resolve(false);scene.close();await motion?.close();motion=null;}
 };
}

// The server can accept a packet but stop halfway through a step when its
// movement budget runs out. Retain only the unconfirmed suffix of that path.
export function remainingSteps(start,points,confirmed){
 if(!start||!confirmed)return [];
 const end=points.at(-1);
 if(end&&Math.hypot(end.x-confirmed.x,end.y-confirmed.y)<.001)return [];
 for(let i=0;i<points.length;i++){
  const target=points[i],dx=target.x-start.x,dy=target.y-start.y;
  const lengthSquared=dx*dx+dy*dy;
  if(lengthSquared>0){
   const progress=((confirmed.x-start.x)*dx+(confirmed.y-start.y)*dy)/lengthSquared;
   if(progress>=0&&progress<=1&&Math.hypot(confirmed.x-start.x-progress*dx,confirmed.y-start.y-progress*dy)<.001){
    return points.slice(progress>=1?i+1:i);
   }
  }
  start=target;
 }
 return [];
}
