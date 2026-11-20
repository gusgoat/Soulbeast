(function(scope){'use strict';
function rollShadowCount(random=Math.random){const r=random()*100;return r<45?1:r<78?2:r<92?3:4}
function plan(P,kind,catalog,random=Math.random,country=null,now=Date.now(),habitat=typeof location!=='undefined'?new URLSearchParams(location.search).get('habitat'):null){
 const clock=typeof module!=='undefined'?require('../town-walk-demo/game-clock.js'):scope.SoulBeastClock;
 const {zones,classes,species}=catalog,order=[7,1,2,3,4,5,6,8],roll=(a,b)=>a+Math.floor(random()*(b-a+1)),pick=a=>a[Math.floor(random()*a.length)];
 const passed=order.filter(id=>(P.forestClears?.[id]||0)>0||(id===6&&(P.cleared||0)>0));
 const frontier=order.find(id=>!passed.includes(id))||order.at(-1),zone=zones.find(z=>z.id===(kind==='bandit'?(passed.at(-1)||7):frontier));if(!zone)throw Error('Missing forest pool');
 const groups=typeof module!=='undefined'?require('./beast-groups.js'):scope.walkBeastGroups,rare=new Set(zones.flatMap(z=>z.rare||[])),zoneIds=order.slice(0,order.indexOf(zone.id)+1),pool=[...new Set(zones.filter(z=>zoneIds.includes(z.id)).flatMap(z=>z.sp))].filter(id=>species[id]&&!rare.has(id)&&!species[id].rare&&!species[id].legendary&&!species[id].solar&&(kind==='bandit'||!country||groups.groups.common.includes(id)||groups.groups[country]?.includes(id)));if(!pool.length)throw Error('Empty ordinary beast pool');
 const encounter=clock.at(now).encounter,activePool=clock.filter(pool,encounter);
 if(!activePool.length)throw Error('Empty timed country encounter pool');
 const level=Math.max(1,Math.floor(P.lv)||1),units=[];
 if(habitat==='water'&&kind!=='bandit'){
  const groups=typeof module!=='undefined'?require('./beast-groups.js'):scope.walkBeastGroups,waterIds=new Set(groups.entries.filter(e=>!/crab/.test(e.id)&&(e.types?.includes('water')||/turtle|tortoise|crocodile/.test(e.id))).map(e=>e.id)),unlocked=pool.filter(id=>waterIds.has(id)),timed=clock.filter(unlocked,encounter),aquatic=timed.length?timed:unlocked;
  if(!aquatic.length)throw Error('No unlocked aquatic beasts');for(let i=0,n=Math.min(2,rollShadowCount(random));i<n;i++)units.push({type:'beast',sp:pick(aquatic),lv:Math.max(1,level-roll(3,10))});return {kind:'wild',habitat:'water',zoneId:zone.id,zoneIds,zoneName:zone.n,units};
 }
 if(kind==='bandit'){const lv=Math.max(1,level-roll(1,5)),tier=lv>=40?2:lv>=25?1:0,cls=pick(classes.filter(c=>c.tier===tier));if(!cls)throw Error('Missing bandit class');units.push({type:'human',cls:cls.id,lv,nightAura:encounter==='night'});for(let i=0,n=roll(1,Math.min(3,cls.capacity));i<n;i++)units.push({type:'pet',sp:pick(activePool),lv:Math.max(1,lv-roll(0,2))})}
 else{const groups=typeof module!=='undefined'?require('./beast-groups.js'):scope.walkBeastGroups,common=country?activePool.filter(id=>groups.groups.common.includes(id)):activePool,native=country?activePool.filter(id=>groups.groups[country]?.includes(id)):[];if(country&&!common.length&&!native.length)throw Error('No unlocked local beasts');const n=rollShadowCount(random);for(let i=0;i<n;i++){const chosen=!country?activePool:!common.length?native:!native.length?common:random()<2/3?common:native;units.push({type:'beast',sp:pick(chosen),lv:Math.max(1,level-roll(3,10))})}}
 return {kind:kind==='bandit'?'bandit':'wild',zoneId:zone.id,zoneIds,zoneName:zone.n,units};
}
const api={plan,rollShadowCount};scope.hemantEncounterRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
