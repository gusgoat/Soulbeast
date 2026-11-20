(function(scope){'use strict';
const F=.64;
function create(data,nav,count=50,options={}){
 let seed=options.seed??102930;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const actors=[];
 function allowed(x,y){const capital=data.cities?.find(c=>c.type==='capital');if((data.cities||[]).concat(data.villages||[]).some(s=>nav.distance({x,y},s)<(options.settlementRadii?.[s.type]??(s.type==='capital'?1400:s.type==='city'?850:620))))return false;if(!nav.walkable(x,y)||nav.nearest({x,y}).distance<(options.minRoadDistance??0)||options.allowed&&!options.allowed(x,y))return false;if(data.regionLayout)return !nav.places.some(s=>{if(s.type==='junction')return false;let box;if(s.type==='border'){const geometry=typeof module!=='undefined'?require('./region-gate-geometry.js'):scope.RegionGateGeometry;box=geometry.bounds(s);}else{const w=({capital:490,city:375,village:235,forest:310,colosseum:390,islandPort:190,dungeon:420})[s.type]||310,h=({capital:650,city:570,village:200,forest:310,colosseum:260,islandPort:190,dungeon:420})[s.type]||310;box={left:s.x-w/2,right:s.x+w/2,top:s.y*F-h*.94,bottom:s.y*F+h*.06};}return x>box.left-65&&x<box.right+65&&y*F>box.top-65&&y*F<box.bottom+65;});return !nav.places.some(s=>{const city=s.type!=='forest',width=s.type==='capital'?490:city?375:310;return Math.abs(x-s.x)<width/2+65&&y>s.y-(city?940:600)&&y<s.y+240})}
 function clear(a,b){const steps=Math.max(1,Math.ceil(nav.distance(a,b)/12));for(let i=0;i<=steps;i++)if(!allowed(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true}
 function spawn(x,y){if(!allowed(x,y)||actors.some(a=>nav.distance(a,{x,y})<(options.minSpacing??140)))return false;actors.push({x,y,home:{x,y},speed:.84*(58+random()*30),goal:null,wait:random()*1.5,phase:random()*8,facing:1,moving:false,walked:0});return true}
 // Keep several wanderers visible from the first snowy clearing; spread the rest through the country.
 for(const [x,y]of (options.starts??[[1350,4150],[1900,4400],[2050,4650],[2000,3900],[1100,3770],[2350,4700],[1320,5000],[2400,3240]]))spawn(x,y);
 if(options.forestSpawns!==false)for(const place of data.forests)for(let i=0;i<3;i++){const angle=random()*Math.PI*2,r=360+random()*260;spawn(place.x+Math.cos(angle)*r,place.y+Math.sin(angle)*r/F)}
 if(options.spread){
  const candidates=[];for(let tries=0;candidates.length<700&&tries<20000;tries++){const p={x:550+random()*(data.width-1100),y:750+random()*(data.height-1200)};if(allowed(p.x,p.y))candidates.push(p);}
  while(actors.length<count&&candidates.length){let best=0,score=-1;for(let i=0;i<candidates.length;i++){const p=candidates[i],distance=actors.length?Math.min(...actors.map(a=>nav.distance(a,p))):nav.nearest(p).distance;if(distance>score){score=distance;best=i;}}const p=candidates.splice(best,1)[0];spawn(p.x,p.y);}
 }
 for(let tries=0;actors.length<count&&tries<16000;tries++)spawn(550+random()*(data.width-1100),750+random()*(data.height-1200));
 if(actors.length>count)actors.length=count;
 if(options.requireCount&&actors.length!==count)throw Error('Not enough safe roaming positions in '+data.regionId+': '+actors.length+'/'+count);
 function choose(a){for(let i=0;i<18;i++){const angle=random()*Math.PI*2,r=60+random()*180,goal={x:a.x+Math.cos(angle)*r,y:a.y+Math.sin(angle)*r/F};if(nav.distance(goal,a.home)>(options.homeRadius??430)||!clear(a,goal)||(a.habitatAllowed&&!a.habitatAllowed(goal.x,goal.y))||actors.some(b=>b!==a&&nav.distance(b,goal)<60))continue;a.goal=goal;return}a.goal=null;a.wait=.5+random()}
 function update(dt,player){for(const a of actors){if(a.chasing||a.returning||a.cooldown>0)continue;a.moving=false;if(a.wait>0){a.wait=Math.max(0,a.wait-dt);continue}if(!a.goal)choose(a);if(!a.goal)continue;const dx=a.goal.x-a.x,dy=(a.goal.y-a.y)*F,len=Math.hypot(dx,dy);if(len<5){a.goal=null;a.wait=.7+random()*2.4;continue}const step=Math.min(a.speed*dt,len),x=a.x+dx/len*step,y=a.y+dy/len*step/F;if(!allowed(x,y)||(a.habitatAllowed&&!a.habitatAllowed(x,y))||actors.some(b=>b!==a&&nav.distance(b,{x,y})<(options.patrolSpacing??38))||(player&&nav.distance(player,{x,y})<48)){a.goal=null;a.wait=.25+random()*.6;continue}a.x=x;a.y=y;a.walked+=step;a.phase+=dt*a.speed/70*9;if(Math.abs(dx)>4)a.facing=dx<0?-1:1;a.moving=true}}
 return {actors,update,allowed,clear};
}
function createRegional(data,nav){const spacing=({blue:{E:240},green:{W:260},red:{N:350}})[data.countryId]?.[data.regionId]??420;return create(data,nav,10,{seed:102930+data.regionId.charCodeAt(0)*193,minRoadDistance:210,minSpacing:spacing,settlementRadii:{capital:1400,city:700,village:500},starts:[],forestSpawns:false,homeRadius:350,spread:true,requireCount:true,patrolSpacing:160});}
const api={create,createRegional};scope.hemantRoamers=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
