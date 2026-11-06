// Use the exact browser maze, floor seeds and trap placement rules on the server.
// These legacy files expose pure global APIs in both Node and Deno.
import '../../tools/labyrinth-demo/progression.js';
import '../../tools/labyrinth-demo/floors.js';
import '../../tools/labyrinth-demo/maze.js';
import '../../tools/labyrinth-demo/traps.js';
const {MineLabyrinth:Maze,MineFloors:Floors,DungeonTraps:Traps}=globalThis;
const point=p=>({x:p.x,y:p.y});
function random(seed){let n=seed>>>0;return ()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
export function partyMapAdapter({speed=180}={}){
 if(!Number.isFinite(speed)||speed<=0||speed>2000)throw Error('invalid_party_speed');
 const maps=new Map(),placements=new Map(),traps=new Map();
 function map(floor){
  if(!Number.isInteger(floor)||floor<1||floor>7)throw Error('bad_floor');
  if(!maps.has(floor))maps.set(floor,Maze.create(Floors.get(floor).seed,{floor}));
  return maps.get(floor);
 }
 function navigation(room){return Maze.navigation(map(room.floor),{
  bossDoorOpen:!!room.dungeon?.doorOpen,discovered:{mini:true},
  bossCleared:room.dungeon?.boss==='defeated',treasureDoorOpen:room.dungeon?.boss==='defeated'
 });}
 function member(room,code){return room.members.find(m=>m.code===code&&m.hp>0&&m.exploring===true);}
 function near(room,code,target,radius){const m=member(room,code);if(!m?.position||!target)return false;
  const nav=navigation(room);return nav.distance(m.position,target)<=radius&&nav.clear(m.position,target);}
 function enemyPlacements(floor){
  if(!placements.has(floor)){
   const data=map(floor),nav=navigation({floor}),rng=random(Floors.get(floor).seed+731);
   const candidates=data.cells.filter(p=>!data.roomAt(p)&&nav.walkable(p.x,p.y)&&nav.distance(data.spawn,p)>800);
   for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
   const chosen=[];
   for(const p of candidates){if(chosen.some(q=>nav.distance(p,q)<140))continue;chosen.push(p);if(chosen.length===58)break;}
   if(chosen.length!==58)throw Error('insufficient_enemy_spawns');
   const result={};chosen.forEach((p,i)=>{
    const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>({x:p.x+x*data.cell,y:p.y+y*data.cell})).filter(q=>!data.roomAt(q)&&nav.clear(p,q));
    result[(i<50?'shadow:':'bandit:')+(i<50?i:i-50)]={...point(p),patrol:[point(p),point(adjacent[0]||p)]};
   });placements.set(floor,result);
  }
  return structuredClone(placements.get(floor));
 }
 return {
  map,navigation,movementSpeed:()=>speed,
  bossMovement:room=>({spawn:point(map(room.floor).boss),speed:speed/2,leash:900}),
  spawnPoint(floor,code){return point(map(floor).spawn);},
  enemyPlacements,
  trapPlacements(floor){if(!traps.has(floor)){const data=map(floor),nav=navigation({floor});
    traps.set(floor,Traps.create(data,nav,{}, {seed:Floors.get(floor).seed+71371,count:35}).list.map(t=>({id:t.id,type:t.type,...point(t)})));}
   return structuredClone(traps.get(floor));},
  localBossContact(room,member,point){
   const nav=navigation(room);
   return room.dungeon.doorOpen&&room.dungeon.boss!=='defeated'&&member.exploring&&
    point&&[point.x,point.y].every(Number.isFinite)&&nav.walkable(point.x,point.y)&&
    nav.distance(map(room.floor).boss,point)<=900&&nav.distance(member.position,point)<=85&&nav.clear(member.position,point);
  },
  contact(room,code,id){
   if(id==='boss')return room.dungeon?.doorOpen&&room.dungeon.boss!=='defeated'&&near(room,code,room.dungeon.bossPosition||map(room.floor).boss,85);
   const enemy=room.dungeon?.enemies?.[id];return enemy?.state==='roaming'&&near(room,code,enemy.position,48);
  },
  atDoor(room,code){
   const p=member(room,code)?.position,gate=map(room.floor).rooms.find(r=>r.id==='boss').gate;
   // Door tile itself is blocked until opened. Test approach with only that door
   // hypothetically open; every other wall must still block the interaction.
   const nav=navigation({...room,dungeon:{...room.dungeon,doorOpen:true}});
   return !!p&&nav.distance(p,gate)<=210&&nav.clear(p,gate);
  },
  atStairs:(room,code)=>near(room,code,map(room.floor).stairs,120),
  arrive(room){for(const m of room.members){m.position=point(map(room.floor).spawn);m.exploring=m.hp>0;
   // Preserve sequence across floors but prevent accumulated idle movement credit.
   if(m.movement)m.movement.at=null;
  }}
 };
}
