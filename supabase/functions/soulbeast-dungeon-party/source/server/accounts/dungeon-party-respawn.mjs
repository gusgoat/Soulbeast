// Invoked inside the room/save transaction, before membership is deleted.
export function partyRespawnAdapter({engine}) {
 if(typeof engine?.recover!=='function')throw Error('recovery_engine_required');
 return async function evacuate(room,member) {
  const save=member.save,p=save?.P;
  if(!p||p.code!==member.code)throw Error('server_save_required');
  if(!['blue','green','red'].includes(p.country))throw Error('invalid_respawn_country');
  const destination={city:p.country+'-capital',screen:'hospital'};
  Object.assign(member,engine.recover(p),{exploring:false});
  save.battle=null;save.zone=null;save.screen='hospital';
  p.walkLastSettlement=destination.city;
  return destination;
 };
}
