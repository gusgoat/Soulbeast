const actions=new Set(['inventory','status','pulse','move','claim','openDoor','bossContact','tick','nextFloor','worldTick','battleCommand','battleAuto','battleReady','chest','heal','leave','trapArm','trapResolve']);
const publicErrors=new Set(['invalid_inventory_action','login_required','character_not_owned','party_not_member','party_unavailable',
 'trap_unavailable','trap_not_due','trap_out_of_reach','enemy_unavailable','already_fighting','boss_battle_active','enemy_out_of_reach','door_out_of_reach',
 'floor_quota_incomplete','boss_out_of_reach','boss_door_closed','boss_unavailable',
 'battle_not_member','stairs_out_of_reach','boss_not_defeated','player_defeated','bad_request_id','request_mismatch',
 'movement_wrong_floor','bad_movement','not_your_turn','stale_turn','battle_presenting','invalid_skill','invalid_item','invalid_capture','invalid_summon','invalid_escape','pet_capacity','invalid_target','invalid_auto_mode','chest_locked','chest_out_of_reach','spring_out_of_reach']);
export function dungeonPartyHttp({verifyToken,command,origins,environment,report=()=>{}}){
 const allowed=new Set(origins);
 return async request=>{
  const origin=request.headers.get('origin');
  const headers={'content-type':'application/json','cache-control':'no-store','vary':'Origin'};
  if(origin&&allowed.has(origin))headers['access-control-allow-origin']=origin;
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!allowed.has(origin))return reply(403,{ok:false,error:'origin_denied'});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,
   'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'authorization, apikey, content-type'}});
  if(request.method!=='POST')return reply(405,{ok:false,error:'method_not_allowed'});
  const token=request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if(!token)return reply(401,{ok:false,error:'login_required'});
  let identity;
  try{identity=await verifyToken(token);}catch{return reply(401,{ok:false,error:'login_required'});}
  if(!identity?.id)return reply(401,{ok:false,error:'login_required'});
  let packet;
  try{
   const reader=request.body?.getReader();if(!reader)throw Error();
   const chunks=[];let bytes=0;
   while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
    if(bytes>8192){await reader.cancel();return reply(413,{ok:false,error:'request_too_large'});}chunks.push(value);}
   const joined=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}
   packet=JSON.parse(new TextDecoder().decode(joined));
  }catch{return reply(400,{ok:false,error:'bad_request'});}
  if(!packet||(environment&&packet.environment!==environment)||!actions.has(packet.action)||!['live','test'].includes(packet.environment)||
   !/^[A-Z0-9]{16}$/.test(packet.code||'')||
   !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(packet.room||'')||
   (packet.data!==undefined&&(!packet.data||typeof packet.data!=='object'||Array.isArray(packet.data))))
   return reply(400,{ok:false,error:'bad_request'});
  try{
   // Account identity comes solely from a verified bearer token, never JSON.
   const result=await command({accountId:identity.id,environment:packet.environment,code:packet.code},packet.room,packet.action,packet.data||{});
   return reply(200,{ok:true,result});
  }catch(error){
   if(publicErrors.has(error.message))return reply(error.message==='character_not_owned'||error.message==='party_not_member'?403:409,{ok:false,error:error.message});
   report({kind:'dungeon_party_error',action:packet.action,error});
   return reply(503,{ok:false,error:'party_service_unavailable'});
  }
 };
}
