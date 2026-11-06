// Exploration is client animated. Transactions arbitrate shared interactions.
export function acceptLocalPosition(room,member,data,nav){
 if(data.floor!==room.floor)throw Error('movement_wrong_floor');
 const p=data.position;
 if(!p||![p.x,p.y].every(Number.isFinite)||Math.abs(p.x)>20000||Math.abs(p.y)>20000||!nav.walkable(p.x,p.y))throw Error('bad_movement');
 if(member.hp<=0||!member.exploring)throw Error('already_fighting');
 member.position={x:p.x,y:p.y};
}
export function localEnemyContact(room,member,id,point,nav){
 const enemy=room.dungeon.enemies[id];
 if(!enemy||enemy.state!=='roaming'||!point||![point.x,point.y].every(Number.isFinite))return false;
 const home=enemy.home||enemy.position;
 return nav.walkable(point.x,point.y)&&nav.distance(home,point)<=900&&
  nav.distance(member.position,point)<=48&&nav.clear(member.position,point);
}
export function armLocalTrap(room,member,id,now,nav){
 const trap=room.dungeon.traps.find(t=>t.id===id);
 if(!trap)throw Error('trap_unavailable');
 if(trap.state!=='hidden')return;
 if(nav.distance(member.position,trap)>48)throw Error('trap_out_of_reach');
 Object.assign(trap,{state:'armed',armedAt:now,explodeAt:now+2000,
  eligible:room.members.filter(m=>m.hp>0&&m.exploring).map(m=>m.code),resolved:[]});
}
export function resolveLocalTrap(room,member,id,now,nav){
 const t=room.dungeon.traps.find(t=>t.id===id);
 if(!t||t.state==='hidden'||!t.eligible?.includes(member.code))throw Error('trap_unavailable');
 if(t.resolved?.includes(member.code))return {hit:false,alreadyResolved:true};
 if(now<t.explodeAt)throw Error('trap_not_due');
 t.state='spent';t.resolved??=[];t.resolved.push(member.code);
 if(member.hp<=0||!member.exploring||nav.distance(member.position,t)>290)return {hit:false,type:t.type};
 const before=member.hp;
 if(t.type==='blast')member.hp=Math.max(0,member.hp-Math.max(1,Math.round(member.maxHp*.1)));
 else{
  const key={poison:'poison',fire:'burn',electric:'static',ice:'freeze'}[t.type];
  member.ailments??={};member.ailments[key]=Math.max(2,Number(member.ailments[key])||0);
 }
 return {hit:true,type:t.type,damage:Math.max(0,before-member.hp)};
}
