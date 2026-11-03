(function(scope){'use strict';
function create(data,nav,terrain){const questClearings=[];
 function deepForest(x,y){const point={x,y},edge=Math.min(x,data.width-x,y*.64,(data.height-y)*.64);if(edge>1400)return false;if([...data.cities,...(data.villages||[])].some(city=>nav.distance(city,point)<1100))return false;let nearbyTrees=0;for(const tree of terrain.trees)if(nav.distance(tree,point)<430&&++nearbyTrees>=5)return true;return false}
 const model=scope.hemantRoamers.create(data,nav,5,{seed:814705,minRoadDistance:280,minSpacing:1000,homeRadius:260,starts:[],forestSpawns:false,allowed:deepForest});
 return {...model,deepForest,addQuestClearing:p=>questClearings.push(p)};
}
const api={create};scope.hemantBandits=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
