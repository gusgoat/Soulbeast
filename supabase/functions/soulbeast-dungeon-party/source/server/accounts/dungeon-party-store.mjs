import {dungeonPartyService} from './dungeon-party-service.mjs';
import {partySnapshot} from './dungeon-party-snapshot.mjs';

const passiveActions=new Set(['status','pulse','move','worldTick','trapArm','trapResolve']);

// Room results, deferred saves and membership changes are durable before a
// reply. Account writes still share the transaction whenever a member leaves.
export function dungeonPartyStore({pool,initialize,buildCombat,persist,uuid,publish}){
 return async function command({accountId,environment,code},roomId,action,data={}){
  if(!accountId||!['test','live'].includes(environment)||!code)throw Error('login_required');
  const tx=await pool.connect();
  const background=action==='flushSave';
  try{
   await tx.query('begin');
   await tx.query("set local lock_timeout = '5s'");
   const owner=await tx.query(`select c.code from public.sb_player_characters c
    join auth.users u on u.id=c.account_id
    where c.game_env=$1 and c.code=$2 and c.account_id=$3 and c.status='active'
     and u.email_confirmed_at is not null and u.deleted_at is null`,[environment,code,accountId]);
   if(!owner.rows.length)throw Error('character_not_owned');
   // Lock only this room; separate parties must not block each other's ticks.
   // Lobby start/leave also locks this row before changing the roster.
   const found=await tx.query(`select *,floor(extract(epoch from statement_timestamp())*1000)::bigint as server_now
    from public.sb_dungeon_party_rooms where id=$1 and game_env=$2 for update${background?' nowait':''}`,[roomId,environment]);
   const lobby=found.rows[0];if(!lobby)throw Error('party_unavailable');
   const record=await tx.query('select state from public.sb_dungeon_party_runs where room_id=$1 for update'+(background?' nowait':''),[roomId]);
   let room=record.rows[0]?.state;
   const serverNow=Number(lobby.server_now);
   const terminalStatus=['status','pulse','leave'].includes(action)&&(room?.departures?.[code]||room?.completed&&room.members?.some(m=>m.code===code));
   const expired=new Date(room?.accountSaveExpiry??lobby.expires_at).getTime()<=serverNow;
   const recoveringExpiry=expired&&room?.accountSaveExpiry&&['status','pulse','leave','flushSave'].includes(action);
   if(!terminalStatus&&(lobby.state!=='active'||expired&&!recoveringExpiry))throw Error('party_unavailable');
   const roster=await tx.query('select code from public.sb_dungeon_party_members where room_id=$1 order by joined_at,code',[roomId]);
   const codes=roster.rows.map(m=>m.code);
   if(!codes.includes(code)&&!(['status','pulse','leave'].includes(action)&&room?.departures?.[code]))throw Error('party_not_member');
   if(!room){
    room=await initialize(tx,{roomId,environment,codes,floor:lobby.floor});
    if(!room||!Array.isArray(room.members)||room.members.length!==codes.length||
     new Set(room.members.map(m=>m.code)).size!==codes.length||room.members.some(m=>!codes.includes(m.code)))throw Error('invalid_initial_roster');
    Object.assign(room,{id:roomId,host:lobby.host,state:'active',floor:lobby.floor,startedSize:lobby.started_size,revision:Number(lobby.revision)});
   }
   const before=JSON.stringify(room);
   // Retain references to removed members so death/respawn saves are committed
   // even after the service ejects them from room.members.
   const participants=[...room.members];
   const member=participants.find(m=>m.code===code);
   let result,expiryUpdate=null;
   if(background&&!recoveringExpiry){
    if(member?.pendingSaveDigest){
     await persist(tx,{environment,roomId,serverNow,flushCode:code,background},room,[member]);
     room.revision=(room.revision||0)+1;
    }
    result={snapshot:partySnapshot(room,code,serverNow)};
   }else{
    const effective=recoveringExpiry?'leave':action;
    const previousRevision=room.revision||0;
    const combat=await buildCombat(tx,{environment,roomId,serverNow});
    const service=dungeonPartyService({combat,uuid,now:()=>serverNow,transaction:async(_,fn)=>fn(room)});
    result=await service(code,roomId,effective,data);
    const battle=result.snapshot?.battle;
    const defer=action==='soloFinish'&&data.deferAccountSave===true&&battle?.id===data.battle&&battle?.settled&&
     room.state==='active'&&room.members.includes(member)&&member.hp>0;
    const pendingChanged=await persist?.(tx,{environment,roomId,serverNow,deferCode:defer?code:null,
     flushCode:passiveActions.has(effective)||defer?null:code,flushAll:action==='nextFloor'||action==='bossContact',background},room,participants);
    if(pendingChanged){
     if((room.revision||0)===previousRevision)room.revision=previousRevision+1;
     if(result.snapshot)result.snapshot=partySnapshot(room,code,serverNow,action==='claim'||!!result.snapshot.soloStart);
     else if(['status','pulse','leave'].includes(effective))result=partySnapshot(room,code,serverNow,!!result.soloStart);
    }
    if(background)result={snapshot:result};
   }
   const hasPending=room.members.some(m=>m.pendingSaveDigest);
   // Keep the existing save ownership and roster cleanup guards in force if
   // a player disconnects with a pending save. Gameplay still uses the real expiry.
   if(hasPending&&!room.accountSaveExpiry){
    room.accountSaveExpiry=new Date(lobby.expires_at).toISOString();expiryUpdate='infinity';
   }else if(!hasPending&&room.accountSaveExpiry){
    expiryUpdate=room.accountSaveExpiry;delete room.accountSaveExpiry;
   }
   if(!record.rows.length||JSON.stringify(room)!==before){
    if(room.members.some(m=>!codes.includes(m.code)))throw Error('party_roster_expanded');
    if(publish)await publish(tx,{environment,serverNow,action,actor:code},room,participants);
    await tx.query(`insert into public.sb_dungeon_party_runs(room_id,revision,state) values($1,$2,$3::jsonb)
     on conflict(room_id) do update set revision=excluded.revision,state=excluded.state,updated_at=now()`,[roomId,room.revision,JSON.stringify(room)]);
    const remaining=room.members.map(m=>m.code);
    if(remaining.length!==codes.length)
     await tx.query('delete from public.sb_dungeon_party_members where room_id=$1 and not(code=any($2::text[]))',[roomId,remaining]);
    // Closed rooms retain the last valid host for the non-null foreign key.
    await tx.query(`update public.sb_dungeon_party_rooms set state=$2,floor=$3,
     host=coalesce($4,host),revision=$5,expires_at=coalesce($6::timestamptz,expires_at) where id=$1`,[roomId,room.state,room.floor,room.host,room.revision,expiryUpdate]);
   }
   await tx.query('commit');return result;
  }catch(error){try{await tx.query('rollback');}catch{}if(background&&error.code==='55P03')throw Error('party_save_busy');throw error;}
  finally{tx.release();}
 };
}
