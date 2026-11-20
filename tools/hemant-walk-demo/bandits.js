(function(scope){'use strict';
function createLegacy(data,nav,terrain){const questClearings=[];
 function deepForest(x,y){const point={x,y},edge=Math.min(x,data.width-x,y*.64,(data.height-y)*.64);if(edge>1400)return false;if([...data.cities,...(data.villages||[])].some(city=>nav.distance(city,point)<1100))return false;if(data.regionLayout){const p={x,y};if(!nav.clear(p,nav.nearest(p).foot))return false;let camp=false;for(let n=0;n<48&&!camp;n++){const a=n*2.399963,r=100+Math.floor(n/12)*35;camp=nav.clear(p,{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r/.64});}if(!camp)return false;}let nearbyTrees=0;for(const tree of terrain.trees)if(nav.distance(tree,point)<430&&++nearbyTrees>=5)return true;return false}
 const model=scope.hemantRoamers.create(data,nav,5,{seed:814705,minRoadDistance:280,minSpacing:1000,homeRadius:260,starts:[],forestSpawns:false,allowed:deepForest});
 return {...model,deepForest,addQuestClearing:p=>questClearings.push(p)};
}
function create(data,nav,terrain){
 if(!data.regionLayout)return createLegacy(data,nav,terrain);
 const R=typeof module!=='undefined'?require('./roamers.js'):scope.hemantRoamers,C=typeof module!=='undefined'?require('./region-coast.js'):scope.RegionCoast;
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=(b.y-a.y)*.64,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*.64*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-dx*t,(p.y-a.y)*.64-dy*t);};
 const edge=p=>Math.min(...data.regionPolygon.map((a,i)=>distance(p,a,data.regionPolygon[(i+1)%data.regionPolygon.length])));
 const clearance={capital:1200,city:550,village:550,border:550,forest:800,colosseum:1000,dungeon:900,islandPort:1300};
 function remote(x,y){const p={x,y},e=edge(p);return e>=18&&e<=650&&!C.isBeach(data,x,y,120)&&!nav.places.some(o=>o.type!=='junction'&&nav.distance(p,o)<(clearance[o.type]||550));}
 const options={seed:814705,minRoadDistance:400,minSpacing:0,homeRadius:120,starts:[],forestSpawns:false,allowed:remote,settlementRadii:{capital:1200,city:550,village:550}};
 const probe=R.create(data,nav,0,options),candidates=[];
 for(const step of [55,30]){
  for(let y=780;y<data.height-120;y+=step)for(let x=200;x<data.width-120;x+=step){if(!probe.allowed(x,y))continue;const p={x,y},road=nav.nearest(p),nearest=Math.min(...nav.places.filter(o=>o.type!=='junction').map(o=>nav.distance(p,o)));candidates.push({...p,foot:road.foot,score:Math.min(road.distance,1000)+Math.min(nearest,1800)*.7-Math.abs(edge(p)-220)*.15});}
  if(candidates.length)break;
 }
 candidates.sort((a,b)=>b.score-a.score);
 function room(p){for(let n=0;n<48;n++){const a=n*2.399963,r=100+Math.floor(n/12)*35;if(nav.clear(p,{x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r/.64}))return true;}return false;}
 let camp=candidates.find(p=>nav.clear(p,p.foot)&&room(p));
 if(!camp)camp=candidates.slice(0,80).find(p=>room(p)&&nav.pathBetween(p,p.foot).length);
 if(!camp)throw Error('No safe remote bandit camp in '+data.countryId+'-'+data.regionId);
 const model=R.create(data,nav,1,{...options,starts:[[camp.x,camp.y]],requireCount:true});
 model.actors[0].aggroRadius=180;model.actors[0].campId=data.countryId+'-'+data.regionId+'-remote-camp';
 return {...model,deepForest:remote,addQuestClearing:()=>{},edgeDistance:edge};
}
const api={create};scope.hemantBandits=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
