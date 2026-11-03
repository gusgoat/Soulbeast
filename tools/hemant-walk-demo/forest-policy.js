(function(scope){'use strict';
const homes={1:'green',2:'blue',3:'red',4:'red',5:'green',6:'blue',8:'green'};
function apply(data){const id=data.countryId||'blue';const removed=new Set(data.forests.filter(f=>f.zoneId!==7&&homes[f.zoneId]!==id).map(f=>f.id));data.forests=data.forests.filter(f=>!removed.has(f.id));data.roads=data.roads.filter(r=>!removed.has(r.a)&&!removed.has(r.b));return data;}
const api={homes,apply};scope.walkForestPolicy=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
