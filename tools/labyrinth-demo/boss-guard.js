(function(s){'use strict';
const COUNTRY_RUN_SPEED=360*.68425,pursuit=typeof module!=='undefined'?require('../hemant-walk-demo/pursuit.js'):s.WorldPursuit;
function create(data,nav,options={}){const room=data.rooms.find(r=>r.id==='boss'),home={...data.boss},actor={...home,home,dir:0,phase:0,moving:false,chasing:false,returning:false},speed=(options.playerRunSpeed||COUNTRY_RUN_SPEED)*.5;let grace=0,locked=false,activated=false,resume=false;const touches=player=>(!nav.clear||nav.clear(actor,player))&&(options.contact?options.contact(actor,player):nav.distance(actor,player)<=(options.contactRadius||75));
 const inside=p=>p.x>=room.x0*data.cell&&p.x<(room.x1+1)*data.cell&&p.y>=room.y0*data.cell&&p.y<(room.y1+1)*data.cell;
 function update(dt,player,cleared,opened=false){actor.moving=false;grace=Math.max(0,grace-dt);if(cleared){actor.chasing=false;actor.returning=false;return false}if(locked)return false;if(!opened){activated=false;actor.chasing=false;return false}const firstOpen=!activated;activated=true;
  if(actor.returning){if(pursuit.returnHome(nav,actor,dt,speed))actor.phase+=dt;return false}
  const d=nav.distance(actor,player),leash=pursuit.limit(options.leashDistance);if(!actor.chasing&&(firstOpen||resume||d<=leash&&(inside(player)||d<=300&&(!nav.clear||nav.clear(actor,player))))){actor.chasing=true;resume=false}if(!actor.chasing)return false;
  if(d>leash){pursuit.beginReturn(actor);if(pursuit.returnHome(nav,actor,dt,speed))actor.phase+=dt;return false}if(grace>0)return false;if(touches(player)){locked=true;return true}
  const target=nav.clear(actor,player)?player:nav.pathBetween(actor,player)[0];if(target&&pursuit.step(nav,actor,target,dt,speed))actor.phase+=dt;if(touches(player)){locked=true;return true}return false;
 }
 function resolve(){locked=false;grace=3;resume=true;actor.chasing=false;actor.moving=false}
 return {actor,speed,inside,update,resolve};
}const api={create,COUNTRY_RUN_SPEED};s.MineBossGuard=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
