(function(g){'use strict';
 const freshwater=new Set(['kappa','kelpie','amabie','bunyip','moon_tortoise','nilmangkorn']),marine=new Set(['kraken','mermaid','aurora_whale','infinite_sea_serpent','cosmic_tortoise','jormungandr']);
 function kind(sp,species){if(/crab/.test(sp))return 'beach';if(species?.t?.includes('water')||/turtle|tortoise|crocodile|whale|mermaid|kraken/.test(sp))return 'water';return 'land';}
 function allowed(sp,species,options={}){const habitat=options.habitat||'land';if(kind(sp,species)!==habitat)return false;if(habitat==='water'&&options.waterType==='sea'&&freshwater.has(sp))return false;if(habitat==='water'&&options.waterType==='river'&&marine.has(sp))return false;return true;}
 function beachPoint(data,nav,terrain,allowed){const coast=typeof module!=='undefined'?require('../hemant-walk-demo/region-coast.js'):g.RegionCoast;for(const e of coast.segments(data))for(const f of [.3,.5,.7,.15,.85])for(const inset of [110,140,75]){const p={x:e.a.x+(e.b.x-e.a.x)*f-e.nx*inset,y:e.a.y+(e.b.y-e.a.y)*f-e.ny*inset/.64};if(!nav.walkable(p.x,p.y)||!coast.isBeach(data,p.x,p.y,-80)||terrain.water.raw(p.x,p.y,80)||!allowed(p.x,p.y))continue;return p;}return null;}
 function islandActors(actors,data,country,player){
  const living=g.LivingBeasts,candidates=actors.filter(a=>a.kind==='shadow'),cfg=g.IslandRules.islands[country],F=.64;
  const signed=(x,y)=>{const angle=Math.atan2((y-data.center.y)*F,x-data.center.x),edge=data.coast(angle);return Math.hypot(x-data.center.x,(y-data.center.y)*F)-Math.hypot(edge.x-data.center.x,(edge.y-data.center.y)*F);};
  let moved=0;
  for(const habitat of ['water','water','beach']){
   const options={scene:'island',country,player,habitat,waterType:habitat==='water'?'sea':undefined};if(!living.canPlan(options))continue;
   const actor=candidates[candidates.length-1-moved];if(!actor)break;const angle=cfg.angle+.65+moved*.65,edge=data.coast(angle),dx=edge.x-data.center.x,dy=(edge.y-data.center.y)*F,len=Math.hypot(dx,dy),off=habitat==='water'?55:-75;
   actor.x=edge.x+dx/len*off;actor.y=edge.y+dy/len*off/F;actor.home={x:actor.x,y:actor.y};actor.goal=null;delete actor.beastModelId;delete actor.encounterPlan;living.ensure(actor,options);
   actor.habitatAllowed=(x,y)=>{const d=signed(x,y);return habitat==='water'?d>=12&&d<=160:d<=-12&&d>=-175;};actor.navigation={distance:g.IslandRules.distance,walkable:actor.habitatAllowed};moved++;
  }
  return actors;
 }
 const api={kind,allowed,beachPoint,islandActors};g.BeastHabitats=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
