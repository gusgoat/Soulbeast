(function(g){'use strict';
function createAll(data,nav){return g.WorldQuestData.cast.filter(n=>n.road&&n.country===data.countryId).map(n=>{const anchor=data.cities.find(p=>p.id===n.anchor)||data.cities[0],start=nav.spawnAt(anchor,'south');let point;for(let i=0;i<120;i++){const angle=i*2.399963,r=100+(i%8)*18,p={x:start.x+Math.cos(angle)*r,y:start.y+Math.sin(angle)*r/.64};if(nav.walkable(p.x,p.y)&&nav.clear(start,p)){point=p;break}}if(!point)throw Error('No reachable NPC location '+n.slug);return {...n,...point,anchor:anchor.id,id:n.place,name:n.name+' · '+n.role,description:n.intro,type:'questNpc'}})}
g.walkQuestEnvoy={createAll,create:(data,nav)=>createAll(data,nav)[0]};if(typeof module!=='undefined')module.exports=g.walkQuestEnvoy;
})(typeof window==='undefined'?globalThis:window);
