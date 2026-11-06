(function(s){'use strict';
const rows=[
 {levels:[5,10],gold:[150,300],gear:[1,15],grandGold:1000,grandGear:[10,15]},
 {levels:[11,20],gold:[400,800],gear:[6,25],grandGold:3000,grandGear:[15,25]},
 {levels:[21,28],gold:[1000,1600],gear:[13,37],grandGold:5000,grandGear:[25,35]},
 {levels:[25,35],gold:[2000,3000],gear:[21,45],grandGold:7000,grandGear:[35,45]},
 {levels:[33,40],gold:[3500,5000],gear:[30,50],grandGold:9000,grandGear:[30,45]},
 {levels:[38,45],gold:[5500,7500],gear:[35,55],grandGold:11000,grandGear:[42,55]},
 {levels:[42,50],gold:[8000,10000],gear:[40,60],grandGold:15000,grandGear:[50,60]}
];
function get(floor){return rows[Math.max(0,Math.min(6,(Number(floor)||1)-1))]}
function gearType(g){return g.legend?'legendary':g.craft?'crafted':g.special?'rare':'gear'}
function pool(catalog,floor,big){const p=get(floor),range=big?p.grandGear:p.gear,allowed=big?(floor===7?['legendary']:floor>=5?['legendary','crafted','rare']:['crafted','rare']):floor<=3?['gear']:['crafted','rare'];return (catalog.equipment||[]).filter(g=>!g.worldLegend&&!g.solar&&g.lv>=range[0]&&g.lv<=Math.min(range[1],catalog.bossLevel||Infinity)&&allowed.includes(gearType(g)))}
const api={rows,get,gearType,pool};s.DungeonProgression=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
