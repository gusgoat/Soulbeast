// Render between received positions and coast briefly through a late packet.
export function remoteWalkMotion({delay=100,maxPrediction=100,teleportDistance=700}={}) {
 const peers=new Map();

 function receive(code,packet,now=performance.now()) {
  if(!Number.isFinite(packet.x)||!Number.isFinite(packet.y))return;
  const sample={...packet,time:now};
  const peer=peers.get(code), last=peer?.samples.at(-1);
  if(!last||last.session!==packet.session||now-last.time>1000||
     Math.hypot(last.x-packet.x,last.y-packet.y)>teleportDistance){
   peers.set(code,{samples:[sample],phase:0,drawnAt:now});
   return;
  }
  peer.samples.push(sample);
  if(peer.samples.length>12)peer.samples.shift();
 }

 function position(code,now=performance.now()) {
  const peer=peers.get(code);
  if(!peer)return null;
  const samples=peer.samples, last=samples.at(-1), target=now-delay;
  while(samples.length>3&&samples[1].time<=target-250)samples.shift();
  let previous=samples[0], next=null;
  for(const sample of samples){
   if(sample.time>target){next=sample;break;}
   previous=sample;
  }

  let {x,y,dir,moving,running}=previous;
  if(next&&previous.time<target){
   const blend=(target-previous.time)/(next.time-previous.time);
   x+=(next.x-x)*blend;
   y+=(next.y-y)*blend;
  }else if(!next&&last.moving){
   for(let i=samples.length-2;i>=0;i--){
    const older=samples[i], elapsed=last.time-older.time;
    if(!older.moving||older.dir!==last.dir||older.running!==last.running||elapsed>350)break;
    if(elapsed<45)continue;
    const extra=Math.min(maxPrediction,elapsed,target-last.time);
    x+=(last.x-older.x)*extra/elapsed;
    y+=(last.y-older.y)*extra/elapsed;
    break;
   }
  }

  moving=Boolean(moving)&&now-last.time<=1000;
  const dt=Math.max(0,Math.min(.1,(now-peer.drawnAt)/1000));
  peer.drawnAt=now;
  if(moving)peer.phase+=dt*(running?12:8);
  return {x,y,dir,moving,running:Boolean(running),phase:peer.phase,stale:now-last.time>5000};
 }

 return {receive,position,remove:code=>peers.delete(code),clear:()=>peers.clear()};
}
