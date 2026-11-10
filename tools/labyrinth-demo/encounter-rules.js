(function(s){'use strict';
const common=['wisp','golem','goblin','redcap','iron_armadillo'],commonRare=['obsidian_scarab','prism_owl','dusk_panther'];
const native={
 1:['mummy','scarab','minotaur','cyclops','basilisk','stone_lion','bastion_golem'],
 2:['sphinx','basilisk','manticore','mummy','scarab','obsidian_rhino','desert_witch','mummy_king','night_horse'],
 3:['mandrake','kodama','moss_treant','jorogumo','bunyip','crocodile','naga','wyvern','jade_bull','celestial_deer'],
 4:['yeti','glacier_bear','ice_wolf','baku','moon_cat','banshee','night_horse'],
 5:['gargoyle','jiangshi','banshee','nekomata','zombie','demon_knight','night_horse','void_mantis'],
 6:['mummy','scarab','minotaur','cyclops','basilisk','stone_lion','bastion_golem','abyss_turtle'],
 7:['salamander','fire_imp','ifrit','dragon','hydra','chimera','rajasi','storm_drake']
};
const nativeRare={1:['lamassu','sand_colossus','scorpion_pharaoh'],2:['baihu','lamassu','sand_colossus','scorpion_pharaoh'],3:['qilin','unicorn','lunar_stag','thorn_queen','bloom_jade_mare'],4:['frost_lich','fenrir','jade_moon_hare','aurora_whale'],5:['vampire_queen','abyss_emperor','fenrir'],6:['lamassu','sand_colossus','scorpion_pharaoh','storm_wyvern'],7:['phoenix','sun_devourer','ember_jackal','garuda']};
function pools(floor,catalog){const sp=catalog.species,rareIds=new Set(catalog.zones.flatMap(z=>z.rare||[])),eligible=id=>sp[id]&&!sp[id].legendary&&!sp[id].solar&&!sp[id].gachaOnly&&!sp[id].noseal,isRare=id=>!!sp[id].rare||rareIds.has(id);return {common:common.filter(id=>eligible(id)&&!isRare(id)),native:(native[floor]||[]).filter(id=>eligible(id)&&!isRare(id)),commonRare:commonRare.filter(id=>eligible(id)&&isRare(id)),nativeRare:(nativeRare[floor]||[]).filter(id=>eligible(id)&&isRare(id))}}
function plan(P,kind,catalog,floor,random=Math.random,now=Date.now()){
 const clock=typeof module!=='undefined'?require('../town-walk-demo/game-clock.js'):s.SoulBeastClock;
 const encounter=clock.at(now).encounter;
 const progression=typeof module!=='undefined'?require('./progression.js'):s.DungeonProgression,range=progression.get(floor.floor).levels,p=Object.fromEntries(Object.entries(pools(floor.floor,catalog)).map(([key,ids])=>[key,clock.filter(ids,encounter)])),roll=(a,b)=>a+Math.min(b-a,Math.floor(random()*(b-a+1))),pick=a=>{if(!a.length)throw Error('Empty dungeon encounter pool');return a[Math.min(a.length-1,Math.floor(random()*a.length))]},species=(rare)=>{const a=rare?p.commonRare:p.common,b=rare?p.nativeRare:p.native;return pick(!a.length?b:!b.length?a:random()<1/3?a:b)},units=[];
 if(kind==='bandit'){const lv=roll(...range),tier=lv>=40?2:lv>=25?1:0,cls=pick(catalog.classes.filter(c=>c.tier===tier));units.push({type:'human',cls:cls.id,lv});for(let i=0,n=roll(1,Math.min(3,cls.capacity));i<n;i++)units.push({type:'pet',sp:species(false),lv:Math.max(range[0],lv-roll(0,2))})}
 else{const r=random(),n=r<.45?1:r<.78?2:r<.92?3:4;for(let i=0;i<n;i++){const rare=random()>=.85&&(p.commonRare.length>0||p.nativeRare.length>0);units.push({type:'beast',sp:species(rare),lv:roll(...range),dungeonRare:rare,nightAura:encounter==='night'})}}
 return {kind:kind==='bandit'?'bandit':'wild',zoneId:floor.battleZone||(floor.floor===2?3:1),zoneIds:[floor.battleZone||(floor.floor===2?3:1)],zoneName:floor.name,units};
}
const api={pools,plan,common,commonRare,native,nativeRare};s.DungeonEncounterRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
