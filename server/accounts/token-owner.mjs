// The legacy engine accepts a PvP room token by itself. Bind it to the already authorized character too.
export function accountEngineFactory(createEngine,hash,{request={}}={}){
 return (workbook,utilities)=>{
  const engine=createEngine(workbook,utilities);
  return {dispatch(packet){
   const ownRow=()=>workbook.tables.Saves?.slice(1).find(r=>r[0]===packet?.code);
   const savedAt=()=>{const value=ownRow()?.[5];return value?new Date(value).getTime():0;};
   // Runs inside the engine snapshot/commit retry, not in a separate preflight read.
   if(packet?.action==='save'&&ownRow()){
    const expected=Number(packet.expectedSaveAt??request.expectedSaveAt);
    if(!Number.isFinite(expected)||expected<=0||expected!==savedAt())return {ok:false,error:'save_conflict'};
   }
   if(packet?.action?.startsWith('pvp_')&&!['pvp_create','pvp_join','pvp_resume'].includes(packet.action)){
    try{
     const row=(workbook.tables.PVPRooms||[]).slice(1).find(r=>r[0]===String(packet.room||'').toUpperCase());
     if(!row)throw Error('no room');
     const room=JSON.parse(utilities.newBlob(utilities.base64Decode(row.slice(4).map(v=>String(v||'').replace(/^PV1:/,'')).join(''))).getDataAsString());
     const actor=room.players.find(p=>p.tokenHash===hash(room.id+':'+String(packet.token||'')));
     if(!actor||actor.code!==packet.code)throw Error('wrong actor');
    }catch{return {ok:false,error:'character_not_owned'};}
   }
   const prior=savedAt(),before=JSON.stringify(ownRow());
   const result=engine.dispatch(packet);
   if(result.ok&&ownRow()){
    if(prior&&before!==JSON.stringify(ownRow())&&savedAt()<=prior){ownRow()[5]=new Date(prior+1).toISOString();if(result.at!=null)result.at=prior+1;}
    result.accountSaveAt=savedAt();
   }
   return result;
  }};
 };
}
