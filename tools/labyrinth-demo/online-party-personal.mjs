import {createPersonalStart,personalState,personalTrap,personalAction,personalInventory} from '../../supabase/functions/soulbeast-dungeon-party/personal-combat.mjs?v=instant-party-3';

// A receipt stays durable until its exact sequence has been acknowledged. Neither
// collision nor the next local battle waits for the network worker.
export function personalParty({roomId,code,send,receive=()=>{},changed=()=>{},report=()=>{},storage=globalThis.localStorage,legacyStorage=globalThis.sessionStorage}){
 const key=`party-personal-v2:${code}:${roomId}`;
 let saved;try{saved=JSON.parse(storage.getItem(key)||legacyStorage?.getItem(key)||'null');}catch{}
 let data=saved||{grant:null,state:null,seq:0,spent:{},retired:{},outbox:[],active:null},worker=null,timer=0,closed=false,paused=0,joining=false;
 const persist=()=>storage.setItem(key,JSON.stringify(data));
 const clone=x=>JSON.parse(JSON.stringify(x));
 function accept(grant){
  if(!grant||grant.version!==2||grant.code!==code)return;
  if(data.grant?.id!==grant.id){
   if(data.outbox.length||data.active)throw Error('personal_pending_floor');
   data={grant:clone(grant),state:clone(grant.state),seq:grant.seq,spent:clone(grant.spent),retired:{},outbox:[],active:null};joining=false;
  }else{
   data.grant=clone(grant);
   if(!data.outbox.length&&!data.active&&grant.seq>=data.seq){data.state=clone(grant.state);data.seq=grant.seq;data.spent=clone(grant.spent);}
  }
  persist();changed();if(data.outbox.length)background();
 }
 function append(receipt,state){
  const next={...data,state,seq:receipt.seq,outbox:[...data.outbox,receipt],active:null};
  // Persist before exposing rewards or releasing the encounter.
  storage.setItem(key,JSON.stringify(next));data=next;changed();background();
 }
 async function flush(){
  clearTimeout(timer);if(worker)return worker;
  worker=(async()=>{
   while(!closed&&data.outbox.length){
    const receipt=data.outbox[0],result=await send(receipt);
    if(result.personalAck?.grant!==receipt.grant||result.personalAck?.seq!==receipt.seq)throw Error('personal_missing_ack');
    data.outbox.shift();persist();
    if(result.snapshot?.personal)accept(result.snapshot.personal);
    await receive(result.snapshot);changed();
   }
  })().finally(()=>{worker=null;});return worker;
 }
 function background(){if(closed||worker)return;clearTimeout(timer);timer=setTimeout(()=>{void flush().catch(error=>{report(error);if(!closed)timer=setTimeout(background,5000);});},0);}
 function base(kind){const seq=data.seq+1;return {grant:data.grant.id,floor:data.grant.floor,seq,kind,requestId:data.grant.id+'-'+seq,deferAccountSave:true};}
 return {
  receive:accept,
  begin(enemy,auto=false){
   if(!this.available||data.grant.bossDefeated||data.spent[enemy]||data.retired[enemy])return null;
   const start=createPersonalStart(data.grant,data.state,enemy,data.seq+1,auto);
   data.active=clone(start);persist();changed();return start;
  },
  complete({start,sim,events}){
   if(data.active?.run.id!==start.run.id)throw Error('personal_sequence');
   const receipt={...base('battle'),enemy:start.run.enemyId,events:clone(events),result:sim.run.result,auto:start.auto};
   const spent={...data.spent};if(sim.run.result==='win')spent[receipt.enemy]=true;
   const before=data.spent;data.spent=spent;
   try{append(receipt,personalState(sim.member.save.P,sim.member,data.state.traps,data.state.chests));}catch(error){data.spent=before;throw error;}
  },
  trap(effect){
   if(!this.available||data.state.traps[effect.id])return;
   const receipt={...base('trap'),trap:effect.id,arm:effect.armPosition,position:effect.hitPosition};
   const result=personalTrap(data.grant,data.state,receipt);append(receipt,result.state);return result;
  },
  inventory(command={}){
   if(!command.op)return personalInventory(data.state);
   return this.action('inventory',{op:command.op,data:Object.fromEntries(['id','slot','ids','target'].filter(k=>command[k]!==undefined).map(k=>[k,clone(command[k])]))});
  },
  action(kind,details){
   if(!this.available)throw Error('already_fighting');
   const receipt={...base(kind),...clone(details)},next=personalAction(data.grant,data.state,receipt);
   append(receipt,next.state);return next.result;
  },
  counts(world){return Object.fromEntries(['shadow','bandit'].map(kind=>[kind,(world.kills?.[kind]||0)+Math.max(0,Object.keys(data.spent).filter(id=>data.grant?.enemies[id]?.kind===kind).length-(world.contributions?.[code]?.[kind]||0))]));},
  retire(id){data.retired[id]=true;persist();},
  async exclusive(work){paused++;changed();try{await flush();return await work();}finally{paused--;changed();}},
  join(value=true){joining=value;changed();},
  flush,background,
  get available(){return !!data.grant&&!closed&&!paused&&!joining&&!data.active&&!data.grant.suspended&&data.state.member.hp>0;},
  get active(){return data.active;},get grant(){return data.grant;},get state(){return data.state;},get seq(){return data.seq;},
  get spent(){return data.spent;},get retired(){return data.retired;},get pending(){return data.outbox.length;},get joining(){return joining;},
  forget(){if(!data.outbox.length&&!data.active){storage.removeItem?.(key);legacyStorage?.removeItem?.(key);}},
  close(){closed=true;clearTimeout(timer);}
 };
}
