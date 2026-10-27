// @soulbeast-unit 1106-equipmentBalance
// Compare equal-role equipment at eligible levels; preserve adequate stats, skill costs and unique passives.
function applyEquipmentBalance(table){
 const rank=e=>e.worldLegend?3:e.legend?2:e.craft?1:0;
 const comparable=(a,b)=>a.slot===b.slot&&(a.slot!=='weapon'||a.wt===b.wt);
 const all=Object.entries(table).sort((a,b)=>rank(a[1])-rank(b[1])||a[1].lv-b[1].lv||a[0].localeCompare(b[0]));
 for(const [id,item]of all){const r=rank(item);if(!r)continue;
  const lower=all.filter(([,e])=>rank(e)<r&&!e.special&&e.lv<=item.lv&&comparable(item,e)).map(([,e])=>e);
  const margin=r===3?1.12:1.10;
  for(const key of Object.keys(item.st||{})){if(!(item.st[key]>0))continue;const baseline=Math.max(0,...lower.map(e=>e.st?.[key]||0));if(baseline)item.st[key]=Math.max(item.st[key],Math.ceil(baseline*margin));}
 }
}
applyEquipmentBalance(EQ);
// @soulbeast-end 1106-equipmentBalance
