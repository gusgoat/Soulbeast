(function(s){'use strict';
// Normal legendary equipment, distinct from the excluded eclipse/world-legend set.
function register(EQ,weaponArt){for(const [base,g]of Object.entries(EQ).filter(([id,g])=>id.startsWith('lg6_')&&g.legend&&!g.worldLegend))for(const lv of [50,55,60]){const id='dg_'+lv+'_'+base;if(EQ[id])continue;const factor=1+(lv-g.lv)*.025;EQ[id]={...g,n:g.n+'แห่งมหาวงกต '+lv,lv,price:Math.round(g.price*factor),st:Object.fromEntries(Object.entries(g.st).map(([k,v])=>[k,Math.round(v*factor)])),dungeonLoot:true};if(weaponArt?.[base])weaponArt[id]={...weaponArt[base]}}return EQ}
const api={register};s.DungeonRewardEquipment=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
