// Frame-rate independent interpolation. Rendering never reads or writes account saves.
export function remotePartyMotion({delay=100,maxPrediction=120,teleportDistance=700}={}) {
 const peers=new Map();
 function receive(code,packet,now=performance.now()) {
  if(!Number.isFinite(packet.x)||!Number.isFinite(packet.y))return;
  const old=peers.get(code),sample={...packet,time:now};
  if(!old||old.session!==packet.session||Math.hypot(old.samples.at(-1).x-packet.x,old.samples.at(-1).y-packet.y)>teleportDistance){
   peers.set(code,{session:packet.session,samples:[sample],phase:0,last:now});return;
  }
  old.samples.push(sample);if(old.samples.length>12)old.samples.shift();
 }
 function position(code,now=performance.now()) {
  const peer=peers.get(code);if(!peer)return null;
  const samples=peer.samples,last=samples.at(-1),target=now-delay;
  let a=samples[0],b=a;
  for(const sample of samples){if(sample.time<=target)a=sample;if(sample.time>=target){b=sample;break;}b=sample;}
  let x=a.x,y=a.y,moving=!!b.moving;
  if(b.time>a.time){const blend=Math.max(0,Math.min(1,(target-a.time)/(b.time-a.time)));x=a.x+(b.x-a.x)*blend;y=a.y+(b.y-a.y)*blend;}
  else if(target>last.time&&last.moving&&samples.length>1){
   const previous=samples.at(-2),elapsed=Math.max(1,last.time-previous.time),extra=Math.min(maxPrediction,target-last.time);
   x=last.x+(last.x-previous.x)*extra/elapsed;y=last.y+(last.y-previous.y)*extra/elapsed;
  }
  if(now-last.time>1000)moving=false;
  const dt=Math.max(0,Math.min(.1,(now-peer.last)/1000));peer.last=now;
  if(moving)peer.phase+=dt*(b.running?12:8);
  return {x,y,dir:b.dir,phase:peer.phase,moving,running:!!b.running,stale:now-last.time>5000};
 }
 return {receive,position,remove:code=>peers.delete(code),clear:()=>peers.clear()};
}
export function mountPartyVitals(parent=document.body) {
 const box=document.createElement('section');box.className='online-party-vitals';box.setAttribute('aria-label','HP และ MP ของสมาชิกปาร์ตี้');
 const style=document.createElement('style');style.textContent=`.online-party-vitals{position:fixed;left:6px;top:calc(var(--walk-top,0px) + 70px);width:min(32vw,154px);z-index:12;pointer-events:none}.online-party-member{padding:5px 7px;margin:0 0 5px;background:#071b2ee8;border:1px solid #b99b62;border-radius:7px;font:11px/1.4 Tahoma;color:#f6e6bf}.online-party-member strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.online-party-member meter{display:block;width:100%;height:9px;appearance:none;margin:2px 0;background:#03101b;border-radius:4px}.online-party-member meter::-webkit-meter-bar{background:#03101b;border:0}.online-party-member meter::-webkit-meter-optimum-value{background:#52ca8b}.online-party-member .mp::-webkit-meter-optimum-value{background:#54b9ef}.online-party-member meter::-moz-meter-bar{background:#52ca8b}.online-party-member .mp::-moz-meter-bar{background:#54b9ef}`;
 parent.append(style,box);let signature='';
 return {update(members){const values=JSON.stringify(members.map(m=>[m.code,m.name,m.hp,m.mp,m.maxHp,m.maxMp,m.online]));if(values===signature)return;signature=values;box.replaceChildren();
  for(const member of members){const row=document.createElement('div');row.className='online-party-member';const name=document.createElement('strong');name.textContent=member.name+(member.online===false?' · หลุด':'');row.append(name);
   for(const [key,maxKey]of [['hp','maxHp'],['mp','maxMp']]){const bar=document.createElement('meter');bar.className=key;bar.min=0;bar.max=Math.max(1,Number(member[maxKey])||1);bar.value=Math.max(0,Math.min(bar.max,Number(member[key])||0));bar.setAttribute('aria-label',`${member.name} ${key.toUpperCase()} ${bar.value}/${bar.max}`);row.append(bar);}box.append(row);}
 },setHidden(value){box.hidden=!!value;},remove(){box.remove();style.remove();}};
}
