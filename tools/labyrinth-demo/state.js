(function(s){'use strict';
const KEY='soulbeast-walk-preview-player-v1';
function startRun(storage){let p;try{p=JSON.parse(storage.getItem(KEY)||'null')}catch{}if(!p)return false;p.labyrinthBossChests||={};for(const f of Object.values(p.labyrinth||{})){const permanent={};for(const [id,reward]of Object.entries(f.opened||{}))if(id.endsWith('-grand')){permanent[id]=reward;p.labyrinthBossChests[id]=reward}f.opened=permanent;f.bossDoorOpen=false}p.labyrinthRun=(p.labyrinthRun||0)+1;storage.setItem(KEY,JSON.stringify(p));return p.labyrinthRun}
function create(storage,fallback,options={}){
 function player(){try{return JSON.parse(storage.getItem(KEY)||'null')||structuredClone(fallback)}catch{return structuredClone(fallback)}}
 function write(p){storage.setItem(KEY,JSON.stringify(p));return p}
 function floor(p){p.labyrinth||={};p.labyrinthBossChests||={};const f=p.labyrinth[options.key||'mine1']||={discovered:{},opened:{},bossCleared:false,miniCleared:false};f.discovered||={};f.opened||={};const grandId=options.grandId||'mine-f1-grand';if(f.opened[grandId])p.labyrinthBossChests[grandId]=f.opened[grandId];if(p.labyrinthBossChests[grandId])f.opened[grandId]=p.labyrinthBossChests[grandId];if(f.bossVersion!==2){f.bossVersion=2;f.bossCleared=false;f.treasureDoorOpen=false}return f}
 write(player());
 function get(){return floor(player())}
 function change(fn){const p=player(),f=floor(p);fn(f,p);write(p);return f}
 function claim(chest,position,nav,catalog,random=Math.random){if(nav.distance(chest,position)>145)return {ok:false,reason:'far'};const p=player(),f=floor(p);if(f.opened[chest.id]||chest.big&&p.labyrinthBossChests[chest.id])return {ok:false,reason:'opened'};
 if(chest.big&&(!f.bossCleared||!f.treasureDoorOpen))return {ok:false,reason:'locked'};
 const rules=typeof module!=='undefined'?require('./progression.js'):s.DungeonProgression,level=options.floor||1,progress=rules.get(level),roll=random(),category=chest.big?'equipment':roll<.25?'gold':roll<.65?'items':'equipment',pool=category==='equipment'?rules.pool({...catalog,bossLevel:options.bossLevel},level,!!chest.big):category==='items'?(catalog.items||[]).filter(i=>(i.minFloor||1)<=level):[];
 if(category!=='gold'&&!pool?.length)return {ok:false,reason:'empty-catalog'};
 const entry=category==='gold'?null:pool[Math.min(pool.length-1,Math.floor(random()*pool.length))],type=category==='equipment'?rules.gearType(entry):category,qty=type==='gold'?0:type==='items'?1+Math.floor(random()*Math.min(5,level+1)):1,gold=chest.big?progress.grandGold:progress.gold[0]+Math.min(progress.gold[1]-progress.gold[0],Math.floor(random()*(progress.gold[1]-progress.gold[0]+1)));
 p.gold=(p.gold||0)+gold;if(type==='items'){p.items||={};p.items[entry.id]=(p.items[entry.id]||0)+qty}else if(entry){p.owned||=[];p.owned.push(entry.id)}const reward={ok:true,id:entry?.id||'gold',name:entry?.name||'เหรียญ',lv:entry?.lv,type,qty,gold};f.opened[chest.id]=reward;if(chest.big)p.labyrinthBossChests[chest.id]=reward;write(p);return reward}
 function guardianResult(kind,result){if(result!=='win'||!['mine-boss','mine-mini'].includes(kind))return get();return change(f=>f[kind==='mine-boss'?'bossCleared':'miniCleared']=true)}
 return {player,get,change,claim,guardianResult};
}
const api={create,startRun,KEY};s.MineState=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
