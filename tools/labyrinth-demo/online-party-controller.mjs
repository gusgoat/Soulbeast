// A single request lane prevents old movement/solo responses overtaking a boss transition.
export function partyRunController({connection,roomId,scene,openMotion,onState=()=>{},onError=()=>{}}){
 let closed=false,busy=false,snapshot=null,motion=null,motionKey='',path=[],seq=0,pendingState=null;
 async function refresh(next){
  next??=await connection.run(roomId,'status');
  if(closed)return;
  if(!next||next.id!==roomId)throw Error('invalid_party_snapshot');
  if(snapshot&&next.revision<snapshot.revision)return;
  await scene.receiveState(next);snapshot=next;seq=Math.max(seq,next.movementSeq||0);
  if(next.departure||next.state==='closed'){path=[];await motion?.close();motion=null;onState(next);return;}
  const key=JSON.stringify([next.floor,next.members.map(m=>m.code).sort()]);
  if(key!==motionKey){
   path=[];await motion?.close();motion=null;
   const created=await openMotion(connection,next,(sender,p)=>scene.receiveMotion(sender,p),incoming=>{
    if(closed||incoming.revision<=(snapshot?.revision??-1))return;
    if(!pendingState||incoming.revision>pendingState.revision)pendingState=incoming;
    if(!busy)void drain();
   });
   if(closed){await created.close();return;}motion=created;motionKey=key;
  }
  if(next.battle?.status==='active')path=[];
  onState(next);
 }
 async function lane(work){
  if(busy||closed)return false;busy=true;
  try{await work();return true;}catch(error){path=[];onError(error);return false;}finally{busy=false;if(pendingState&&!closed)queueMicrotask(()=>void drain());}
 }
 async function drain(){if(busy||closed||!pendingState)return;const next=pendingState;pendingState=null;return lane(()=>refresh(next));}
 return {
  refresh:()=>lane(refresh),
  // Renderer supplies traversed points, not an arbitrary end-point through walls.
  move(point){if(!closed&&snapshot&&!snapshot.departure&&snapshot.state==='active'&&snapshot.battle?.status!=='active'&&path.length<16)path.push({x:point.x,y:point.y});},
  broadcast(position,moving,running){if(!closed&&snapshot?.state==='active'&&snapshot.battle?.status!=='active')motion?.send(position,moving,running);},
  pulse:()=>lane(async()=>{
   if(!snapshot)return refresh();
   if(snapshot.departure||snapshot.state==='closed')return;
   const data={};
   if(path.length){const points=path;path=[];data.movement={floor:snapshot.floor,seq:++seq,path:points};}
   await refresh(await connection.run(roomId,'pulse',data));
  }),
  command:(action,data={})=>lane(async()=>{
   // Flush accepted walking before the contact check. Failed contact is safe to retry.
   if(path.length){const points=path;path=[];await connection.run(roomId,'move',{floor:snapshot.floor,seq:++seq,path:points});}
   await connection.run(roomId,action,{...data,requestId:crypto.randomUUID()});await refresh();
  }),
  get state(){return snapshot;},get busy(){return busy;},
  async close(){closed=true;path=[];scene.close();await motion?.close();motion=null;}
 };
}
