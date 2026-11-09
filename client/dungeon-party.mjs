import {connectAccounts,accountRealtimeConfig} from './account-client.mjs?v=admin-session-20261107';
export const partySessionKey='soulbeast-online-party-room-v1';
export function connectDungeonParty({storage=localStorage,session=sessionStorage}={}) {
 const context=JSON.parse(session.getItem('soulbeast-online-walk-v1')||'null');
 if(!context?.code)throw Error('login_required');
 const client=connectAccounts(()=>{},storage);
 async function call(action,{room=null,ready=null,joinCode=null}={}){
  const publicAction={createPublic:'create',joinPublic:'join',publicStatus:'status'}[action];
  const rpc=publicAction?'sb_dungeon_party_public':joinCode?'sb_dungeon_party_join':'sb_dungeon_party_command';
  const actor={p_env:context.environment,p_code:context.code};
  const body=publicAction?{...actor,p_action:publicAction,p_room:room}:joinCode?{...actor,p_join_code:joinCode}:{...actor,p_action:action,p_room:room,p_ready:ready};
  const response=await fetch(accountRealtimeConfig.url+'/rest/v1/rpc/'+rpc,{
   method:'POST',headers:{apikey:accountRealtimeConfig.key,Authorization:'Bearer '+await client.sessions.token(),
    'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)
  });
  const result=await response.json();
  if(!response.ok)throw Object.assign(Error(result.message||result.error||'party_request_failed'),{status:response.status});
  return result;
 }
 const run=async(room,action,data={})=>{
  const response=await client.request('/functions/v1/soulbeast-dungeon-party',{
   code:context.code,environment:context.environment,room,action,data
  },await client.sessions.token());
  return response.result;
 };
 async function restoreWalk(){
  const loaded=await client.game('load',{code:context.code},context.environment);
  const snapshot=JSON.parse(loaded.data);
  if(snapshot?.P?.code!==context.code)throw Error('character_not_owned');
  snapshot.P.gsAt=loaded.at;delete snapshot.P.cpin;delete snapshot.P.walkId;
  session.setItem('soulbeast-walk-preview-player-v1',JSON.stringify(snapshot.P));
  session.setItem('soulbeast-online-walk-v1',JSON.stringify({...context,revision:loaded.at,snapshot}));
  session.removeItem(partySessionKey);
  return snapshot.P;
 }
 return {code:context.code,call,run,restoreWalk,config:accountRealtimeConfig,token:()=>client.sessions.token(),environment:context.environment};
}
// Each authenticated member owns its own private broadcast topic. Read access is
// limited to the same active room, and movement never settles combat or rewards.
export async function partyMotion(connection,room,receive,receiveState=()=>{}) {
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.76.1');
 const api=createClient(connection.config.url,connection.config.key,{accessToken:connection.token});
 await api.realtime.setAuth();
 const channels=[],sequence=new Map();let publisher,ready=false,seq=0,last=0,lastState='',closed=false;
 const state=api.channel(`sb-party-state:${connection.environment}:${room.id}:${connection.code}`,{config:{private:true}})
  .on('broadcast',{event:'state'},({payload})=>{
   if(!closed&&payload?.id===room.id&&Number.isSafeInteger(payload.revision))receiveState(payload);
  }).subscribe();
 channels.push(state);
 for(const member of room.members) {
  const channel=api.channel(`sb-party:${connection.environment}:${room.id}:${member.code}`,{config:{private:true,broadcast:{self:false}}});
  channels.push(channel);
  if(member.code===connection.code) {
   publisher=channel;channel.subscribe(status=>{ready=status==='SUBSCRIBED';if(ready)lastState='';});
  }else channel.on('broadcast',{event:'motion'},({payload:p})=>{
   if(closed||!p||p.floor!==room.floor||!Number.isSafeInteger(p.seq)||p.seq<0||
    !Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>20000||p.y>20000||
    !Number.isFinite(p.dir)||p.dir<0||p.dir>7||typeof p.session!=='string'||p.session.length>40)return;
   const prior=sequence.get(member.code);
   if(prior?.session===p.session&&p.seq<=prior.seq)return;
   sequence.set(member.code,{session:p.session,seq:p.seq});receive(member.code,p);
  }).subscribe();
 }
 const session=crypto.randomUUID();
 const refresh=setInterval(()=>void api.realtime.setAuth().catch(()=>{}),60000);
 return {
  send(position,moving,running) {
   if(!ready||closed)return;
   const time=performance.now(),state=JSON.stringify([!!moving,!!running,position.dir]);
   if(state===lastState&&time-last<(moving?100:1500))return;
   last=time;lastState=state;
   void publisher.send({type:'broadcast',event:'motion',payload:{session,seq:++seq,floor:room.floor,
    x:Math.round(position.x),y:Math.round(position.y),dir:position.dir||0,moving:!!moving,running:!!running}}).catch(()=>{});
  },
  async close(){closed=true;ready=false;clearInterval(refresh);await Promise.all(channels.map(c=>api.removeChannel(c)));}
 };
}
