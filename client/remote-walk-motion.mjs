// Render between received positions and coast briefly through a late packet.
const validHeading=value=>Number.isFinite(value)&&value>=0&&value<8;

export function remoteWalkMotion({delay=100,maxDelay=delay,maxPrediction=100,teleportDistance=700}={}) {
 const peers=new Map(),adaptive=maxDelay>delay;

 function needBuffer(peer,extra,now){
  peer.requestedBuffer=Math.max(peer.requestedBuffer,Math.min(maxDelay,delay+extra));
  peer.keepBufferUntil=now+1500;
 }

 function playTime(peer,last,now,elapsed){
  if(!adaptive)return now-delay;
  const gap=now-last.arrival;
  if(last.moving&&gap>120&&gap<350)needBuffer(peer,gap-100,now);
  const requested=now<peer.keepBufferUntil?peer.requestedBuffer:delay;
  if(requested===delay)peer.requestedBuffer=delay;
  // Change the playback clock's speed gradually. It always moves forward.
  const adjustment=requested-peer.buffer;
  peer.buffer+=Math.max(-elapsed*.04,Math.min(elapsed*.38,adjustment));
  return now-peer.buffer;
 }

 function correctPrediction(peer,last,x,y,predicted,elapsed){
  const prior=peer.visual;
  if(prior){
   if(prior.predicted&&prior.last!==last){
    const scale=Math.min(elapsed,40);
    peer.correctionX=prior.x+prior.vx*scale-x;
    peer.correctionY=prior.y+prior.vy*scale-y;
   }
   const retain=Math.exp(-elapsed/85);
   peer.correctionX*=retain;
   peer.correctionY*=retain;
   x+=peer.correctionX;
   y+=peer.correctionY;
  }
  peer.visual={x,y,predicted,last,
   vx:prior&&elapsed>0?(x-prior.x)/elapsed:0,
   vy:prior&&elapsed>0?(y-prior.y)/elapsed:0};
  return {x,y};
 }

 function receive(code,packet,now=performance.now()) {
  if(!Number.isFinite(packet.x)||!Number.isFinite(packet.y))return;
  const sample={...packet,time:now,arrival:now};
  const peer=peers.get(code), last=peer?.samples.at(-1);
  if(!last||last.session!==packet.session||now-last.arrival>1000||
     Math.hypot(last.x-packet.x,last.y-packet.y)>teleportDistance){
   peers.set(code,{samples:[sample],phase:0,drawnAt:now,
    buffer:delay,requestedBuffer:delay,keepBufferUntil:0,correctionX:0,correctionY:0});
   return;
  }
  // A sender's monotonic clock supplies intervals without synchronizing clocks.
  // Arrival time still governs expiration and bounds malformed clock updates.
  const elapsed=packet.sentAt-last.sentAt;
  const sendTime=last.time+elapsed;
  if(Number.isFinite(elapsed)&&elapsed>0&&elapsed<1000&&Math.abs(now-sendTime)<500)sample.time=sendTime;
  else sample.time=Math.max(now,last.time+.01);
  const lateness=now-sample.time;
  if(adaptive&&sample.moving&&last.moving&&lateness>20)needBuffer(peer,lateness,now);
  peer.samples.push(sample);
  if(peer.samples.length>12)peer.samples.shift();
 }

 function position(code,now=performance.now()) {
  const peer=peers.get(code);
  if(!peer)return null;
  const samples=peer.samples,last=samples.at(-1),elapsed=Math.max(0,now-peer.drawnAt);
  const target=playTime(peer,last,now,elapsed);
  while(samples.length>3&&samples[1].time<=target-250)samples.shift();
  let previous=samples[0], next=null;
  for(const sample of samples){
   if(sample.time>target){next=sample;break;}
   previous=sample;
  }

  let {x,y,dir,moving,running}=previous;
  const predicted=!next&&last.moving&&target>last.time;
  let spriteDir=validHeading(previous.spriteDir)?previous.spriteDir:undefined;
  if(next&&previous.time<target){
   const blend=(target-previous.time)/(next.time-previous.time);
   x+=(next.x-x)*blend;
   y+=(next.y-y)*blend;
   if(moving&&next.moving&&spriteDir!==undefined&&validHeading(next.spriteDir)){
    const turn=(next.spriteDir-spriteDir+12)%8-4;
    spriteDir=(spriteDir+turn*blend+8)%8;
   }
  }else if(predicted){
   for(let i=samples.length-2;i>=0;i--){
    const older=samples[i], elapsed=last.time-older.time;
    if(!older.moving||older.running!==last.running||elapsed>350||(!Number.isFinite(last.sentAt)&&older.dir!==last.dir))break;
    if(elapsed<45)continue;
    const extra=Math.min(maxPrediction,adaptive?maxPrediction:elapsed,target-last.time);
    x+=(last.x-older.x)*extra/elapsed;
    y+=(last.y-older.y)*extra/elapsed;
    break;
   }
  }

  if(adaptive)({x,y}=correctPrediction(peer,last,x,y,predicted,elapsed));
  moving=Boolean(moving)&&now-last.arrival<=1000;
  const dt=Math.min(.1,elapsed/1000);
  peer.drawnAt=now;
  if(moving)peer.phase+=dt*(running?12:8);
  return {x,y,dir,moving,running:Boolean(running),phase:peer.phase,stale:now-last.arrival>5000,
   ...(spriteDir===undefined?{}:{spriteDir}),...(adaptive?{bufferMs:peer.buffer}:{})};
 }

 return {receive,position,remove:code=>peers.delete(code),clear:()=>peers.clear()};
}
