import {partySnapshot} from './dungeon-party-snapshot.mjs';

// Called in the room transaction: rollback also rolls back the Realtime message.
// Each recipient gets only their own battle/chest view, never a raw save.
export async function broadcastPartyState(tx,{environment,serverNow,action,actor},room,participants){
 if(action==='status')return;
 if(action==='pulse'&&serverNow-(room.lastBroadcastAt||0)<500)return;
 // Pulse already returns this same snapshot to its caller.
 const messages=participants.filter(member=>action!=='pulse'||member.code!==actor).map(member=>({
  payload:partySnapshot(room,member.code,serverNow),
  topic:`sb-party-state:${environment}:${room.id}:${member.code}`
 }));
 if(messages.length)await tx.query(`select realtime.send(message.payload,'state',message.topic,true)
  from jsonb_to_recordset($1::jsonb) as message(payload jsonb,topic text)`,[JSON.stringify(messages)]);
 room.lastBroadcastAt=serverNow;
}
