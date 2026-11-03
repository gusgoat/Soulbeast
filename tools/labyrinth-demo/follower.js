(function(scope){'use strict';
function create(nav,leader){
 const offsets=[[0,-125],[-90,0],[90,0],[0,125],[-65,-90],[65,-90]],spawn=offsets.map(([x,y])=>({x:leader.x+x,y:leader.y+y})).find(p=>nav.walkable(p.x,p.y)&&nav.clear(p,leader))||leader;
 const flatten=nav.distance({x:0,y:0},{x:0,y:1});
 const actor={x:spawn.x,y:spawn.y,dir:leader.dir||0,phase:0,moving:false,running:false};let path=[],routeClock=0;
 function update(dt,target,leaderRunning=false,paused=false){actor.moving=actor.running=false;if(paused){routeClock=0;return}routeClock-=dt;const gap=nav.distance(actor,target);if(gap<=85&&nav.clear(actor,target)){path=[];return}
  if(routeClock<=0||!path.length){path=nav.pathBetween(actor,target);routeClock=.3}
  while(path.length&&nav.distance(actor,path[0])<5)path.shift();if(!path.length)return;
  const point=path[0],dx=point.x-actor.x,dy=point.y-actor.y,d=nav.distance(actor,point);actor.running=leaderRunning||gap>210;const speed=(actor.running?360:220)*.68425*(gap>180?1.12:1),travel=Math.min(d,speed*dt),ratio=travel/(d||1),nx=actor.x+dx*ratio,ny=actor.y+dy*ratio;
  if(nav.walkable(nx,ny)&&nav.clear(actor,{x:nx,y:ny})){actor.x=nx;actor.y=ny;actor.moving=travel>.01;actor.dir=(Math.round(-Math.atan2(dx,dy*flatten)/(Math.PI/4))+8)%8;if(actor.moving)actor.phase+=dt*(actor.running?15:9)}else{path=[];routeClock=0;actor.running=false}
 }
 return {actor,update};
}
const api={create};scope.MineFollower=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
