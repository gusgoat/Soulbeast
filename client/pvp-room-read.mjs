import {connectAccounts} from './account-client.mjs?v=gacha-recovery-1';
// Safe read optimization; no move, save, auto toggle, or settlement is implemented here.
export function createPvpRoomReader({read,environment,code}){
 let available=true;const pending=new Map();
 async function poll(packet,current,balanceVersion=4){
  if(!available||environment!=='test'||!current||current.status!=='active'||packet.room!==current.id||current.replaying)return null;
  const actor=[...current.battle.allies,...current.battle.enemies].find(u=>u.id===current.battle.cur);
  // The acting owner must advance auto immediately, through the authoritative engine.
  if(actor?.owner===current.me&&current.players?.[actor.owner]?.auto)return null;
  const key=[packet.room,packet.token,current.rev].join(':');
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   let result;try{result=await read({p_env:environment,p_code:code,p_room:packet.room,p_token:packet.token,p_known_rev:current.rev});}
   catch(error){if(error.status===404||error.code==='42883'||error.code==='PGRST202'){available=false;return null;}throw error;}
   if(!result?.ok){if(['not_enabled','room_not_found'].includes(result?.error)){available=false;return null;}throw Error(result?.error||'room_read_failed');}
   if(result.needsEngine&&(!result.changed||!result.room))return null;
   if(!result.changed)return {ok:true,pvpVersion:1,balanceVersion,room:{...current,serverTime:result.serverTime}};
   const next=result.room;if(!next||next.id!==current.id||next.status!=='active'||next.rev<current.rev||next.me!==current.me)return null;
   // Wagers and rule limits are immutable in an active match. Final settlement uses the engine.
   return {ok:true,pvpVersion:1,balanceVersion,room:{...current,...next}};
  })();pending.set(key,task);try{return await task;}finally{pending.delete(key);}
 }
 return {poll,get available(){return available;}};
}

export function connectPvpRoomReader(storage,context){
 const client=connectAccounts(()=>{},storage),fetcher=client.fetcher;
 client.fetcher=(url,options)=>fetcher(url,{...options,signal:typeof AbortSignal.any==='function'?AbortSignal.any([options.signal,AbortSignal.timeout(5000)]):AbortSignal.timeout(5000)});
 return createPvpRoomReader({environment:context.environment,code:context.code,read:async args=>client.request('/rest/v1/rpc/sb_pvp_room_read',args,await client.sessions.token())});
}
