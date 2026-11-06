import {connectAccounts,accountRealtimeConfig} from './account-client.mjs?v=game-session-2';
// The websocket carries only a wake-up hint. Battle state always comes from the API.
export function createPvpRealtime({storage,onChange,loadClient=()=>import('https://esm.sh/@supabase/supabase-js@2.76.1')}) {
 let room='',channel=null,supabase=null,ready=false,generation=0,revision=0,authAt=0;
 const account=connectAccounts(()=>{},storage);
 function close(){generation++;room='';ready=false;revision=0;if(channel&&supabase)void supabase.removeChannel(channel).catch(()=>{});channel=null;}
 async function watch(id,environment){
  if(room===id){if(Date.now()-authAt>60000&&supabase){authAt=Date.now();void supabase.realtime.setAuth().catch(()=>{});}return;}close();if(!/^[A-F0-9]{8}$/.test(id)||!['test','live'].includes(environment))return;
  room=id;const ticket=generation;
  try{
   if(!supabase){const {createClient}=await loadClient();if(ticket!==generation)return;supabase=createClient(accountRealtimeConfig.url,accountRealtimeConfig.key,{accessToken:()=>account.sessions.token()});}
   await supabase.realtime.setAuth();authAt=Date.now();if(ticket!==generation)return;
   const current=supabase.channel('sb-pvp:'+environment+':'+id,{config:{private:true,broadcast:{self:false}}});channel=current;
   current.on('broadcast',{event:'changed'},({payload})=>{
    if(channel!==current||payload?.room!==id||!Number.isInteger(payload.rev)||payload.rev<=revision)return;
    revision=payload.rev;onChange(payload);
   }).subscribe(status=>{if(channel!==current)return;ready=status==='SUBSCRIBED';if(ready)onChange();});
  }catch{if(ticket===generation){ready=false;room='';}}
 }
 addEventListener('pagehide',()=>{close();supabase?.realtime.disconnect();});
 return {watch,close,get ready(){return ready;}};
}
