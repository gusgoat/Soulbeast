(function(g){'use strict';
 const F=.64,asset='/Soulbeast/assets/companions/kappa.webp';
 function create(data,nav,terrain,options={}){
  const water=terrain.water,actors=[];if(data.waterTraversal!=='wade'||options.enabled===false)return {actors,update(){},nav};
  const distance=nav.distance,allowed=(p,id)=>{const s=water.sampleAt(p.x,p.y,true);return !!s&&(!id||s.id===id)&&!terrain.playerBlocked(p.x,p.y);};
  function clear(a,b,id=water.sampleAt(a.x,a.y,true)?.id){const n=Math.max(1,Math.ceil(distance(a,b)/8));for(let i=0;i<=n;i++)if(!allowed({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n},id))return false;return true;}
  function pathBetween(a,b){
   const start=water.sampleAt(a.x,a.y,true),end=water.sampleAt(b.x,b.y,true);if(!start||!end||start.id!==end.id)return [];if(clear(a,b))return [b];
   let points;
   if(start.type==='river'){const p=start.body.points,index=q=>p.reduce((best,v,i)=>distance(q,v)<distance(q,p[best])?i:best,0),ai=index(a),bi=index(b);points=p.slice(Math.min(ai,bi),Math.max(ai,bi)+1);if(ai>bi)points.reverse();points=[...points,b];}
   else if(start.type==='lake')points=[start.body.center,b];else return [];
   let last=a;for(const p of points){if(!clear(last,p))return [];last=p;}return points;
  }
  const waterNav={distance,clear,walkable:(x,y)=>allowed({x,y}),pathBetween};
  function spawn(p,body){if(!allowed(p,body.id)||actors.some(a=>distance(a,p)<125))return false;actors.push({...p,id:'water-'+data.countryId+'-'+data.regionId+'-'+body.id+'-'+actors.length,bodyId:body.id,bodyType:body.type,home:{...p},goal:null,wait:.5,phase:actors.length*2,kind:'waterBeast',name:'อสูรน้ำ',aggroRadius:135,chaseSpeed:95,facing:0,moving:false});return true;}
  function riverSpawn(r){const candidates=Array.from({length:31},(_,i)=>water.pointAt(r,(i+1)/32)).filter(p=>allowed(p,r.id)&&water.bridges.every(b=>distance(p,b)>125));candidates.sort((a,b)=>Math.min(...water.bridges.map(p=>distance(b,p)))-Math.min(...water.bridges.map(p=>distance(a,p))));return candidates.some(p=>spawn(p,{id:r.id,type:'river'}));}
  if(options.river!==false)for(const r of water.rivers)if(!riverSpawn(r))throw Error('No safe river creature in '+data.countryId+data.regionId);
  let sea=false;
  if(options.sea){const coast=typeof module!=='undefined'?require('./region-coast.js'):g.RegionCoast;for(const e of coast.segments(data)){for(const fraction of [.5,.3,.7]){const p={x:e.a.x+(e.b.x-e.a.x)*fraction+e.nx*85,y:e.a.y+(e.b.y-e.a.y)*fraction+e.ny*85/F},sample=water.seaSampleAt(p.x,p.y);if(sample&&spawn(p,{id:sample.id,type:'sea'})){sea=true;break;}}if(sea)break;}}
  if(!sea&&options.river!==false)for(const r of water.rivers){if(riverSpawn(r))break;}
  for(const a of actors)a.navigation={distance,clear:(p,q)=>clear(p,q,a.bodyId),walkable:(x,y)=>allowed({x,y},a.bodyId),pathBetween};
  let seed=17093;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function update(dt){for(const a of actors){if(a.chasing||a.returning||a.cooldown>0)continue;a.moving=false;if(a.wait>0){a.wait-=dt;continue;}if(!a.goal){for(let i=0;i<20;i++){const angle=random()*Math.PI*2,r=45+random()*100,p={x:a.home.x+Math.cos(angle)*r,y:a.home.y+Math.sin(angle)*r/F};if(allowed(p,a.bodyId)&&clear(a,p)){a.goal=p;break;}}if(!a.goal){a.wait=1;continue;}}
   const dx=a.goal.x-a.x,dy=(a.goal.y-a.y)*F,len=Math.hypot(dx,dy);if(len<4){a.goal=null;a.wait=.8+random()*2;continue;}const step=Math.min(45*dt,len),p={x:a.x+dx/len*step,y:a.y+dy/len*step/F};if(!allowed(p,a.bodyId)){a.goal=null;continue;}Object.assign(a,p);a.facing=Math.abs(dx)>Math.abs(dy)?dx<0?2:3:dy<0?1:0;a.phase+=dt*2;a.moving=true;
  }}
  return {actors,nav:waterNav,update,eligible:(a,p)=>{const s=p.bridgeDeck?null:water.sampleAt(p.x,p.y,p.bridgeDeck===null);return !!s&&s.depth>.2&&s.id===a.bodyId;}};
 }
 function draw(ctx,a,image,x,y,zoom,time){if(!image?.naturalWidth)return;const frame=a.facing||0,w=108*zoom,h=w;
  g.WaterInteraction.ripple(ctx,x,y,zoom,time,a.moving);ctx.save();g.WaterInteraction.clipAbove(ctx,x,y,zoom);ctx.drawImage(image,(frame%2)*256,Math.floor(frame/2)*256,256,256,x-w/2,y-h*.82+Math.sin(time*2+a.phase)*2*zoom,w,h);ctx.restore();g.WaterInteraction.ripple(ctx,x,y,zoom,time,a.moving,true);
 }
 const api={asset,create,draw};g.CountryWaterBeasts=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
