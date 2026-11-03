(function(scope){'use strict';
const F=.64;
function create(data,nav,count=50,options={}){
 let seed=options.seed??102930;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const actors=[];
 function allowed(x,y){const capital=data.cities?.find(c=>c.type==='capital');if((data.cities||[]).concat(data.villages||[]).some(s=>nav.distance({x,y},s)<(s.type==='capital'?1400:s.type==='city'?850:620)))return false;if(!nav.walkable(x,y)||nav.nearest({x,y}).distance<(options.minRoadDistance??0)||options.allowed&&!options.allowed(x,y))return false;return !nav.places.some(s=>{const city=s.type!=='forest',width=s.type==='capital'?490:city?375:310;return Math.abs(x-s.x)<width/2+65&&y>s.y-(city?940:600)&&y<s.y+240})}
 function clear(a,b){const steps=Math.max(1,Math.ceil(nav.distance(a,b)/12));for(let i=0;i<=steps;i++)if(!allowed(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true}
 function spawn(x,y){if(!allowed(x,y)||actors.some(a=>nav.distance(a,{x,y})<(options.minSpacing??140)))return false;actors.push({x,y,home:{x,y},speed:.84*(58+random()*30),goal:null,wait:random()*1.5,phase:random()*8,facing:1,moving:false,walked:0});return true}
 // Keep several wanderers visible from the first snowy clearing; spread the rest through the country.
 for(const [x,y]of (options.starts??[[1350,4150],[1900,4400],[2050,4650],[2000,3900],[1100,3770],[2350,4700],[1320,5000],[2400,3240]]))spawn(x,y);
 if(options.forestSpawns!==false)for(const place of data.forests)for(let i=0;i<3;i++){const angle=random()*Math.PI*2,r=360+random()*260;spawn(place.x+Math.cos(angle)*r,place.y+Math.sin(angle)*r/F)}
 for(let tries=0;actors.length<count&&tries<16000;tries++)spawn(550+random()*(data.width-1100),750+random()*(data.height-1200));
 if(actors.length>count)actors.length=count;
 function choose(a){for(let i=0;i<18;i++){const angle=random()*Math.PI*2,r=60+random()*180,goal={x:a.x+Math.cos(angle)*r,y:a.y+Math.sin(angle)*r/F};if(nav.distance(goal,a.home)>(options.homeRadius??430)||!clear(a,goal)||actors.some(b=>b!==a&&nav.distance(b,goal)<60))continue;a.goal=goal;return}a.goal=null;a.wait=.5+random()}
 function update(dt,player){for(const a of actors){if(a.chasing||a.returning||a.cooldown>0)continue;a.moving=false;if(a.wait>0){a.wait=Math.max(0,a.wait-dt);continue}if(!a.goal)choose(a);if(!a.goal)continue;const dx=a.goal.x-a.x,dy=(a.goal.y-a.y)*F,len=Math.hypot(dx,dy);if(len<5){a.goal=null;a.wait=.7+random()*2.4;continue}const step=Math.min(a.speed*dt,len),x=a.x+dx/len*step,y=a.y+dy/len*step/F;if(!allowed(x,y)||actors.some(b=>b!==a&&nav.distance(b,{x,y})<38)||(player&&nav.distance(player,{x,y})<48)){a.goal=null;a.wait=.25+random()*.6;continue}a.x=x;a.y=y;a.walked+=step;a.phase+=dt*a.speed/70*9;if(Math.abs(dx)>4)a.facing=dx<0?-1:1;a.moving=true}}
 return {actors,update,allowed,clear};
}
const api={create};scope.hemantRoamers=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
