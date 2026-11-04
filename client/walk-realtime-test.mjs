export async function connectWalkRealtime({url, key, token, identity}) {
 const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.76.1');
 const supabase = createClient(url, key, {accessToken:token});
 await supabase.realtime.setAuth();
 let scene, publisher, generation=0, sequence=0, lastSent=0, lastMotion='', authAt=Date.now();
 const subscribers=new Map();
 const topic=id=>'sb-walk:test:'+scene+':'+id;
 const open=id=>supabase.channel(topic(id),{config:{private:true,broadcast:{self:false}}});
 const close=channel=>void supabase.removeChannel(channel).catch(()=>{});
 function reset(){
  generation++;
  if(publisher)close(publisher.channel);
  publisher=null;
  for(const channel of subscribers.values())close(channel);
  subscribers.clear();
 }
 function update(place, ids, receive) {
  if(scene!==place){reset();scene=place;}
  for(const [id,channel] of subscribers)if(!ids.has(id)){subscribers.delete(id);close(channel);}
  for(const id of ids)if(!subscribers.has(id)){
   const channel=open(id);
   subscribers.set(id,channel);
   channel.on('broadcast',{event:'position'},({payload})=>{
    if(subscribers.get(id)===channel)receive(id,payload);
   }).subscribe();
  }
  if(Date.now()-authAt>60000){authAt=Date.now();void supabase.realtime.setAuth().catch(()=>{});}
  if(publisher)return;
  const current=generation, pending={channel:null,ready:false};
  publisher=pending;
  identity().then(id=>{
   if(generation!==current||publisher!==pending)return;
   if(!id){publisher=null;return;}
   const channel=open(id);
   pending.channel=channel;
   channel.subscribe(status=>{pending.ready=status==='SUBSCRIBED';if(pending.ready)lastMotion='';});
  }).catch(()=>{if(publisher===pending)publisher=null;});
 }
 function send(place, position, moving, running){
  if(scene!==place||!publisher?.ready)return;
  const now=performance.now(),motion=[position.dir||0,!!moving,!!running].join(':');
  if(motion===lastMotion&&(!moving||now-lastSent<150))return;
  // Send only once the private channel is subscribed, so send stays on WebSocket.
  lastSent=now;lastMotion=motion;
  void publisher.channel.send({type:'broadcast',event:'position',payload:{
   x:Math.round(position.x),y:Math.round(position.y),dir:position.dir||0,
   moving:!!moving,running:!!running,seq:++sequence
  }}).catch(()=>{});
 }
 return {update,send,reset};
}
