(function(s){'use strict';
function leash(width,height,zoom=1,screens=2){return screens*Math.max(width||800,height||600)/Math.max(.01,zoom)}
function limit(option){return typeof option==='function'?option():option||1600}
function beginReturn(a){a.chasing=false;a.returning=true;a.path=[];a.repath=0;a.goal=null;a.wait=0;a.moving=false}
function step(nav,a,target,dt,speed){const len=nav.distance(a,target);if(!len)return false;const ratio=Math.min(1,speed*dt/len),x=a.x+(target.x-a.x)*ratio,y=a.y+(target.y-a.y)*ratio;if(!nav.walkable(x,y)||nav.clear&&!nav.clear(a,{x,y}))return false;const dx=x-a.x,dy=y-a.y,flatten=nav.distance({x:0,y:0},{x:0,y:1});a.x=x;a.y=y;a.moving=ratio>0;if(Math.abs(dx)>1)a.facing=dx<0?-1:1;if(a.moving)a.dir=(Math.round(-Math.atan2(dx,dy*flatten)/(Math.PI/4))+8)%8;return a.moving}
function returnHome(nav,a,dt,speed){a.moving=false;if(nav.distance(a,a.home)<6){Object.assign(a,a.home);a.returning=false;a.path=null;a.goal=null;a.wait=2;return false}a.repath=(a.repath||0)-dt;if(a.repath<=0){a.path=nav.pathBetween(a,a.home);a.repath=.6}while(a.path?.length&&nav.distance(a,a.path[0])<5)a.path.shift();return a.path?.length?step(nav,a,a.path[0],dt,speed):false}
const api={leash,limit,beginReturn,step,returnHome};s.WorldPursuit=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
