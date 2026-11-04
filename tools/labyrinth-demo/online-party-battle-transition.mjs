// Apply only authenticated server room snapshots, never peer motion messages.
// Local combat completion handlers must call isCurrent before displaying rewards.
export function partyBattleTransition({code,stopSolo,enterBoss}) {
 let revision=-1,current=null,generation=0,queue=Promise.resolve();
 function apply(transition) {
  if(!transition||!Number.isSafeInteger(transition.revision)||
   transition.revision<=revision||!transition.participants?.includes(code)||
   typeof transition.battle!=='string')return queue;
  revision=transition.revision;
  const token=++generation;
  current=transition.battle;
  // Invalidate old callbacks immediately, before asynchronous UI cleanup.
  queue=queue.catch(()=>{}).then(async()=>{
   await stopSolo({award:false,interrupted:transition.interrupted||[]});
   if(token===generation)await enterBoss({battle:current,floor:transition.floor,automatic:true});
  });
  return queue;
 }
 return {apply,
  beginSolo(battle){current=battle;generation++;return {battle,generation};},
  isCurrent(ticket){return ticket?.battle===current&&ticket.generation===generation;},
  reset(){current=null;generation++;},
  get battle(){return current;}
 };
}
