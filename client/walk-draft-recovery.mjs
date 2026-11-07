import {backups,mergeWalkPlayer,clean,equal} from './walk-save-merge.mjs?v=save-safe-20261106';
// Offer only a same-account draft whose independent changes can be merged safely.
// Never replace a conflicting server field or resume a stale battle/forest state.
export async function offerUnsavedWalkRecovery({snapshot,owner,code,environment,revision,storage=localStorage,confirm=message=>window.confirm(message)}){
 if(!owner||snapshot?.P?.code!==code||snapshot.battle&&!snapshot.battle.over||snapshot.zone)return null;
 const rows=backups(storage,{owner,code,environment}).filter(r=>r.owner===owner&&r.code===code&&r.environment===environment&&Number(r.revision)<=Number(revision)).sort((a,b)=>b.at-a.at);
 for(const row of rows){
  if(row.player?.code!==code||row.basePlayer?.code!==code)continue;
  const result=mergeWalkPlayer(row.basePlayer,row.player,snapshot.P);
  if(!result.ok||equal(clean(result.player),clean(snapshot.P)))continue;
  const yes=await confirm('พบความคืบหน้าที่ยังไม่บันทึกออนไลน์ของ '+snapshot.P.name+' ในเครื่องนี้\nเซิร์ฟเวอร์ Lv '+snapshot.P.lv+' · ความคืบหน้าในเครื่อง Lv '+result.player.lv+'\nต้องการเรียกความคืบหน้านี้กลับมาและบันทึกออนไลน์ก่อนเข้าเกมหรือไม่?');
  if(!yes)return null;
  return {...snapshot,P:{...result.player,gsAt:Number(revision)}};
 }
 return null;
}
