(function(scope){'use strict';
const KEY='soulbeast-walk-preview-player-v1';
function create(nav,bandits,storage,catalog,random=Math.random,country='blue'){
 const chests=bandits.map((owner,i)=>{let point;for(let n=0;n<48&&!point;n++){const angle=n*2.399963,offset=100+Math.floor(n/12)*35,p={x:owner.home.x+Math.cos(angle)*offset,y:owner.home.y+Math.sin(angle)*offset/.64};if(nav.walkable(p.x,p.y)&&nav.clear(owner.home,p))point=p}if(!point)throw Error('No reachable bandit treasure position');return {...point,id:owner.questId||(country==='blue'?'hemant':country)+'-bandit-chest-'+i,kind:'chest',owner,name:'หีบสมบัติโจรป่า'}});
 function player(){try{return JSON.parse(storage.getItem(KEY)||'null')}catch{return null}}
 function state(chest){const p=player(),s=p?.walkTreasure;return s?.opened?.[chest.id]?'opened':s?.defeated?.[chest.id]?'ready':'guarded'}
 function unlock(owner){const chest=chests.find(c=>c.owner===owner),p=player();if(!chest||!p)return;const s=p.walkTreasure||={};s.defeated||={};s.defeated[chest.id]=true;storage.setItem(KEY,JSON.stringify(p))}
 function claim(chest,position){if(!chests.includes(chest)||nav.distance(chest,position)>125)return {ok:false,reason:'far'};const p=player();if(!p)return {ok:false,reason:'player'};if(state(chest)!=='ready')return {ok:false,reason:state(chest)};
  const roll=random(),type=roll<.5?'items':roll<.9?'gear':'crafted',pool=catalog[type],entry=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))],qty=type==='items'?1+Math.floor(random()*3):1,gold=type==='crafted'?0:100+Math.floor(random()*201);
  p.gold=(Number(p.gold)||0)+gold;
  if(type!=='items'){p.owned||=[];p.owned.push(entry.id)}else{p.items||={};p.items[entry.id]=(p.items[entry.id]||0)+qty}
  p.walkTreasure.opened||={};p.walkTreasure.opened[chest.id]={gold,type,id:entry.id,qty};storage.setItem(KEY,JSON.stringify(p));return {ok:true,id:entry.id,gold,name:entry.name,qty,type};
 }
 return {chests,state,unlock,claim};
}
scope.hemantTreasures={create};if(typeof module!=='undefined')module.exports={create};
})(typeof window==='undefined'?globalThis:window);
