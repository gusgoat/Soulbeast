// The legacy engine accepts a PvP room token by itself. Bind it to the already authorized character too.
export function accountEngineFactory(createEngine,hash){
 return (workbook,utilities)=>{
  const engine=createEngine(workbook,utilities);
  return {dispatch(packet){
   if(packet?.action?.startsWith('pvp_')&&!['pvp_create','pvp_join','pvp_resume'].includes(packet.action)){
    try{
     const row=(workbook.tables.PVPRooms||[]).slice(1).find(r=>r[0]===String(packet.room||'').toUpperCase());
     if(!row)throw Error('no room');
     const room=JSON.parse(utilities.newBlob(utilities.base64Decode(row.slice(4).map(v=>String(v||'').replace(/^PV1:/,'')).join(''))).getDataAsString());
     const actor=room.players.find(p=>p.tokenHash===hash(room.id+':'+String(packet.token||'')));
     if(!actor||actor.code!==packet.code)throw Error('wrong actor');
    }catch{return {ok:false,error:'character_not_owned'};}
   }
   return engine.dispatch(packet);
  }};
 };
}
