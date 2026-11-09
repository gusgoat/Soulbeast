// The map keeps using realtime for teammates; this encounter has its own local
// clock. Only the completed transcript and vitals cross the network.
import {simulateSolo,soloChoice,SOLO_EVENT_LIMIT} from '../../supabase/functions/soulbeast-dungeon-party/solo-combat.mjs?v=party-combat-latency-1';
export function localPartyCombat({publish,finish,report}){
 let session,timer=0;
 const storageKey=id=>'party-combat-v1:'+id;
 function read(id){try{const events=JSON.parse(sessionStorage.getItem(storageKey(id))||'[]');return Array.isArray(events)&&events.length<=SOLO_EVENT_LIMIT?events:[];}catch{return [];}}
 function save(s){try{sessionStorage.setItem(storageKey(s.id),JSON.stringify(s.events));}catch{}}
 function clear(id){try{sessionStorage.removeItem(storageKey(id));}catch{}}
 function schedule(s,ms,fn){clearTimeout(timer);timer=setTimeout(()=>{if(session===s)void fn();},ms);}
 function next(s,redraw=true){
  if(session!==s)return;
  clearTimeout(timer);
  const run=s.sim.view(),result=run.result;
  if(redraw){
   s.view={...run,status:'active',localCombatVersion:1};
   publish(s.view,s.sim.auto);
  }
  if(!s.visible||document.hidden)return;
  if(run.loading){schedule(s,0,()=>step(s,[0]));return;}
  if(run.presentation){
   // The iframe normally acknowledges after the last frame. This guard lets
   // the fight recover from an iframe reload or a lost presentation message.
   schedule(s,Math.max(0,run.presentation.deadline-Date.now()),()=>step(s,[0]));return;
  }
  if(s.events.length>=SOLO_EVENT_LIMIT-16||run.status==='finished'){
   schedule(s,0,()=>settle(s,result));return;
  }
  const due=s.view.waiting?.deadline??s.view.nextTurnAt;
  schedule(s,Math.max(0,due-Date.now()),()=>step(s,[1]));
 }
 async function settle(s,result){
  if(session!==s||s.sending)return;
  s.sending=true;
  const {hp,mp}=s.sim.member;
  try{
   const ok=await finish({battle:s.id,events:s.events,result,hp,mp});
   if(ok){clear(s.id);return;}
  }catch(error){report(error);}
  finally{s.sending=false;}
  if(session===s)schedule(s,1800,()=>settle(s,result));
 }
 async function step(s,event){
  if(session!==s||s.busy||s.sending)return false;
  s.busy=true;
  clearTimeout(timer);
  try{
   await s.sim.apply(event);
   if(session!==s)return false;
   s.events.push(event);save(s);next(s);return true;
  }catch(error){
   // Invalid input may have touched the engine's scratch state before throwing.
   // Rebuild from the last accepted input so local and server replay still match.
   s.sim=simulateSolo(s.start);
   for(const old of s.events)await s.sim.apply(old);
   report(error);next(s,false);return false;
  }finally{s.busy=false;}
 }
 return {
  async start(start){
   if(!start||session?.id===start.run.id)return;
   clearTimeout(timer);
   const id=start.run.id,s={id,start,events:read(id),sim:simulateSolo(start),visible:false};
   session=s;s.busy=true;
   try{for(const event of s.events)await s.sim.apply(event);}
   catch{s.events=[];s.sim=simulateSolo(start);clear(id);}
   finally{s.busy=false;}
   if(session===s)next(s);
  },
  active:id=>session?.id===id,
  current:()=>session?.view,
  auto:()=>session?.sim.auto,
  visible(id){const s=session;if(s?.id!==id||s.visible)return;s.visible=true;next(s,false);},
  resumed(){if(session&&!session.busy&&!session.sending)next(session,false);},
  presented(id,turn,sequence){const s=session,p=s?.sim.run.presentation;if(s?.id===id&&p&&turn===p.turn&&sequence===p.sequence)void step(s,[0]);},
  command(id,input){const s=session;return s?.id===id?step(s,soloChoice(input)):Promise.resolve(false);},
  setAuto(id,enabled){const s=session;if(s?.id===id&&s.sim.auto!==enabled&&!s.sim.run.loading&&!s.sim.run.presentation)void step(s,[3,enabled]);},
  stop(id){if(session&&session.id!==id){clearTimeout(timer);clear(session.id);session=undefined;}}
 };
}
