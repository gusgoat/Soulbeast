(function(scope){'use strict';
function npcPoint(s){return s.id==='west'?{x:245,y:1150}:s.id==='east'?{x:2205,y:1150}:s.id==='exit'?{x:1220,y:1760}:{x:s.x,y:s.y+65}}
// Keep tree trunks and their full canopies inside the lawn, clear of wall tops.
function treeOnLawn(x,y){return x>=240&&x<=2210&&y>=505&&y<=1720}
const treePlacements=[[260,540],[735,820],[1630,650],[265,1490],[1258,535],[2190,840],[1810,1670]].map(([x,y],type)=>({x,y,type:type%4}));
function depth(o){return o.y+(o.drawType==='building'&&['west','east'].includes(o.id)?-100:0)}
function exitGate(x,y){if(x<=62&&y>=995&&y<=1080)return 'west';if(x>=2388&&y>=995&&y<=1080)return 'east';if(y>=1855&&x>=900&&x<=1040)return 'south';return null}
function boundaryBlocked(x,y){
 if(x<40||x>2410||y<230||y>1870)return true;
 const sidePass=y>=995&&y<=1080,southPass=x>=900&&x<=1040;
 if((x<150||x>2300)&&!sidePass)return true;
 if(y>1800&&!southPass)return true;
 if(y>1770&&y<1870&&Math.abs(x-970)>70&&Math.abs(x-970)<200)return true;
 // The tower bases flank the horizontal tunnel, leaving the passage clear.
 if((Math.abs(x-130)<65||Math.abs(x-2320)<65)&&(y>900&&y<995||y>1080&&y<1160))return true;
 return false;
}
const api={npcPoint,boundaryBlocked,treeOnLawn,depth,treePlacements,exitGate};scope.townGeometry=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);

