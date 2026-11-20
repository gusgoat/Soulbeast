(function(g){'use strict';
 function facing(x,y){return Math.abs(x)>.62?(x<0?'left':'right'):(y<0?'away':'toward');}
 function create(data,nav,terrain,excluded=[]){
  const F=data.flatten,lane=data.lane,setbacks=lane?[lane+36,lane+51,lane+72]:data.regionLayout?[132,151,172,195]:[132,151,172],poles=[];
  function put(p,foot,phase,bridgeId){
   if(!nav.walkable(p.x,p.y)||terrain.water.raw(p.x,p.y,42)||terrain.water.onBridge(p.x,p.y))return false;
   if(nav.nearest(p).distance<(lane?lane+21:119)||nav.places.some(o=>o.type!=='junction'&&nav.distance(o,p)<(o.type==='capital'?340:245)))return false;
   if(excluded.some(o=>nav.distance(o,p)<(o.clearance??(o.w?Math.min(125,o.w*.5):70)))||poles.some(o=>nav.distance(o,p)<(data.regionLayout?190:225)))return false;
   const dx=foot.x-p.x,dy=(foot.y-p.y)*F,len=Math.hypot(dx,dy)||1;
   poles.push({...p,kind:'roadLamp',dir:facing(dx/len,dy/len),phase,bridgeId,lightX:p.x+dx*.6,lightY:p.y+(foot.y-p.y)*.6});return true;
  }
  // Reserve dry corners at both bridge heads before regular shoulder lights.
  if(data.regionLayout)for(const [index,b]of terrain.water.bridges.entries()){
   const dx=(b.b.x-b.a.x)/b.length,dy=(b.b.y-b.a.y)*F/b.length,nx=-dy,ny=dx;
   for(const [end,sign]of [[b.a,-1],[b.b,1]])for(const side of [-1,1]){
    let placed=false;
    for(const along of [85,130,180,235]){const foot={x:end.x+dx*along*sign,y:end.y+dy*along*sign/F};for(const setback of [132,172,210,245]){if(put({x:foot.x+nx*setback*side,y:foot.y+ny*setback*side/F},foot,index+side*.7,b.id)){placed=true;break;}}if(placed)break;}
   }
  }
  for(const [i,[ai,bi]]of nav.edges.entries()){
   const a=nav.nodes[ai],b=nav.nodes[bi],dx=b.x-a.x,dy=(b.y-a.y)*F,len=Math.hypot(dx,dy);if(len<195)continue;
   const count=Math.max(1,Math.round(len/(data.regionLayout?275:375))),nx=-dy/len,ny=dx/len;
   for(let j=0;j<count;j++){const t=(j+.5)/count,foot={x:a.x+t*dx,y:a.y+t*(b.y-a.y)},side=(i+j)%2===0?1:-1;let placed=false;
    for(const s of [side,-side]){for(const setback of setbacks){if(put({x:foot.x+nx*s*setback,y:foot.y+ny*s*setback/F},foot,((i*97+j*31)%89)*.17)){placed=true;break;}}if(placed)break;}
   }
  }
  return poles;
 }
 const api={create};g.CountryRoadLampPlacement=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
