(function(scope){'use strict';
const F=.64;
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*F);
function projection(p,a,b){const dx=b.x-a.x,dy=(b.y-a.y)*F,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*F*dy)/(dx*dx+dy*dy||1)));return {x:a.x+dx*t,y:a.y+(b.y-a.y)*t}}
function create(data){
 let terrain=null;
 const places=[...data.cities,...data.forests,...(data.villages||[]),...(data.gates||[])],byId=new Map(places.map(p=>[p.id,p])),nodes=[],lookup=new Map(),edges=[];
 function add(p){const key=p.x+','+p.y;if(!lookup.has(key)){lookup.set(key,nodes.length);nodes.push({...p,links:[]})}return lookup.get(key)}
 const waterAPI=typeof module!=='undefined'?require('./waterways.js'):scope.hemantWaterways,routingAPI=typeof module!=='undefined'?require('./road-routing.js'):scope.hemantRoadRouting;
 const reroute=routingAPI.create(data,waterAPI.create(data,{nodes:[],edges:[]}));
 for(const road of data.roads){const points=reroute([byId.get(road.a),...road.via.map(([x,y])=>({x,y})),byId.get(road.b)]);for(let i=1;i<points.length;i++){const a=add(points[i-1]),b=add(points[i]);if(a===b||nodes[a].links.some(l=>l.to===b))continue;const cost=distance(nodes[a],nodes[b]);nodes[a].links.push({to:b,cost});nodes[b].links.push({to:a,cost});edges.push([a,b])}}
 function nearest(p){let result;for(const [a,b]of edges){const foot=projection(p,nodes[a],nodes[b]),d=distance(p,foot);if(!result||d<result.distance)result={a,b,foot,distance:d}}return result}
 function walkable(x,y){return x>=80&&x<=data.width-80&&y>=80&&y<=data.height-80&&!terrain?.blocked(x,y)}
 function clear(a,b){const steps=Math.max(1,Math.ceil(distance(a,b)/8));for(let i=0;i<=steps;i++)if(!walkable(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true}
 // Connect an explorer on open snow back to the road without crossing solid scenery.
 function connect(start,goal){if(clear(start,goal))return [goal];const STEP=45,key=(x,y)=>x+','+y,open=new Map(),seen=new Map(),first={x:start.x,y:start.y,g:0,prev:null,ix:0,iy:0};first.f=distance(start,goal);open.set('0,0',first);seen.set('0,0',first);let count=0;
  while(open.size&&count++<26000){let cur;for(const n of open.values())if(!cur||n.f<cur.f)cur=n;open.delete(key(cur.ix,cur.iy));if(distance(cur,goal)<STEP*1.5&&clear(cur,goal)){const path=[goal];for(let n=cur;n.prev;n=n.prev)path.unshift({x:n.x,y:n.y});return path}
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const ix=cur.ix+dx,iy=cur.iy+dy,k=key(ix,iy),next={x:start.x+ix*STEP,y:start.y+iy*STEP/F};if(!clear(cur,next))continue;const g=cur.g+STEP*Math.hypot(dx,dy),before=seen.get(k);if(before&&before.g<=g)continue;const n={...next,ix,iy,g,f:g+distance(next,goal),prev:cur};open.set(k,n);seen.set(k,n)}
  }return [];
 }
 function route(start,id){const goal=byId.get(id);if(!goal)return [];const edge=nearest(start),costs=nodes.map(()=>Infinity),prev=nodes.map(()=>null),open=new Set(nodes.map((_,i)=>i));for(const n of [edge.a,edge.b])costs[n]=distance(edge.foot,nodes[n]);while(open.size){let u=null;for(const n of open)if(u===null||costs[n]<costs[u])u=n;if(!Number.isFinite(costs[u]))break;open.delete(u);for(const link of nodes[u].links){const next=costs[u]+link.cost;if(next<costs[link.to]){costs[link.to]=next;prev[link.to]=u}}}let u=lookup.get(goal.x+','+goal.y);const path=[];while(u!==null){path.unshift({x:nodes[u].x,y:nodes[u].y});u=prev[u]}return [edge.foot,...path]}
 const roadRoute=route;
 function safeRoute(start,id){const path=roadRoute(start,id);if(!path.length)return [];const approach=connect(start,path[0]);return approach.length?[...approach,...path.slice(1)]:[]}
 function spawnAt(place,gate='south'){const preferred=gate==='west'?{x:place.x-285,y:place.y+210}:gate==='east'?{x:place.x+295,y:place.y+190}:{x:place.x,y:place.y+265};const candidates=[preferred,{x:place.x,y:place.y+265},{x:place.x+200,y:place.y+150},{x:place.x-200,y:place.y+150},{x:place.x,y:place.y+120},{x:place.x,y:place.y}];return candidates.find(p=>walkable(p.x,p.y)&&clear(p,place))||{x:place.x,y:place.y}}
 return {spawnAt,places,byId,nodes,edges,nearest,walkable,route:safeRoute,pathBetween:connect,distance,clear,setTerrain:value=>{terrain=value}};
}
const api={create,distance,projection};scope.hemantNavigation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
