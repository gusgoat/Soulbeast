import {CELL, RADIUS, cellCenter, distance} from './arena.mjs';
import {Match} from './match.mjs';
import {startPractice} from './practice.mjs';
import {FOG_INTERVAL, SURVIVAL_ARENA as arena, SURVIVAL_SPAWNS, fogZone, insideFogSafe, walkInArena} from './survival-arena.mjs';

const ok=(value,message='assertion failed')=>{if(!value)throw Error(message);};
const eq=(a,b)=>ok(JSON.stringify(a)===JSON.stringify(b),`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
function setup(count,random=Math.random){
 const room=new Match('SURVIVAL',0,random,'survival');
 const players=Array.from({length:count},(_,i)=>room.join({name:`P${i}`,lv:25,cls:'swordsman'}));
 for(const p of players)room.command(p,{type:'ready',ready:true},0);
 room.command(players[0],{type:'start'},0);
 return {room,players};
}

Deno.test('survival adds five distinct safe chests per two-minute cut',()=>{
 const {room,players}=setup(5,()=>.5);
 const safe=fogZone(0,240_000),spots=[];
 for(const p of room.sites)if(insideFogSafe(safe,p.x,p.y)&&spots.every(q=>distance(p,q)>240))spots.push(p);
 for(const [i,p] of players.entries())Object.assign(p,spots[i]);
 eq(room.chests.length,15);
 room.tick(119_999,0);eq(room.chests.length,15);
 for(const now of [120_000,240_000]){
  const before=room.chests.length;
  room.tick(now,0);
  const added=room.chests.slice(before);
  eq(added.length,5);
  ok(added.every(c=>insideFogSafe(room.zone,c.x,c.y)));
  eq(new Set(room.chests.map(c=>c.id)).size,room.chests.length);
  eq(new Set(room.chests.filter(c=>!c.opened).map(c=>arena.indexAt(c))).size,room.chests.length);
  room.tick(now+1,0);eq(room.chests.length,before+5);
 }
});

Deno.test('eliminated players can switch survivor perspectives and watch battles without commands',()=>{
 const {room,players:[a,b,c,d]}=setup(4,()=>.5);
 room.command(a,{type:'spectate',target:c.id},3000);
 eq(room.snapshot(a,3000).spectating,undefined);
 room.fall(a,3000);
 eq(room.snapshot(a,3000).spectating,b.id);
 room.command(a,{type:'spectate',target:c.id},3000);
 const view=room.snapshot(a,3000);
 eq(view.spectating,c.id);
 eq(view.players.find(p=>p.id===c.id).x,c.x);
 room.encounter(c,d,3000);
 eq(room.battleSnapshot(a).commands,[]);
 eq(room.viewedBattle(a).id,c.battle);
 room.fall(c,3000);
 eq(room.snapshot(a,3000).spectating,b.id);
});

Deno.test('four-axis symmetry and ten single-exit spawns; every safe ring remains connected',()=>{
 const n=arena.cols-1;
 eq(arena.rows,arena.cols);eq(SURVIVAL_SPAWNS.length,10);
 let bushes=0;
 for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){
  const cell=arena.maze[y][x];
  eq(cell,arena.maze[n-y][x]);eq(cell,arena.maze[y][n-x]);eq(cell,arena.maze[x][y]);
  if(arena.bushAt(cellCenter(x,y))!==null)bushes++;
 }
 eq(bushes,40);
 ok(arena.obstacles.length>100&&arena.obstacles.every(p=>!arena.fits(p.x,p.y)));
 for(const spawn of SURVIVAL_SPAWNS){
  const x=Math.floor(spawn.x/CELL),y=Math.floor(spawn.y/CELL);
  ok(x===1||y===1||x===n-1||y===n-1);
  eq([[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([i,j])=>arena.maze[j][i]).length,1);
  ok(arena.fits(spawn.x,spawn.y));
 }
 for(let step=0;step<10;step++){
  const zone=fogZone(0,FOG_INTERVAL*step), safe=new Set(),visited=new Set();
  const queue=[[15,15]];
  const key=(x,y)=>y*arena.cols+x;
  for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){
   const p=cellCenter(x,y);
   if(arena.maze[y][x]&&insideFogSafe(zone,p.x,p.y))safe.add(key(x,y));
  }
  visited.add(key(...queue[0]));
  for(const [x,y] of queue)for(const [i,j] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
   if(!safe.has(key(i,j))||visited.has(key(i,j))||!arena.clearPath(cellCenter(x,y),cellCenter(i,j),RADIUS))continue;
   visited.add(key(i,j));queue.push([i,j]);
  }
  eq(visited.size,safe.size);
 }
});

Deno.test('free-for-all supports odd rooms and ten unique spawns, and randomizes fifteen chests and twenty traps',()=>{
 const one=new Match('ONE',0,()=>.5,'survival'), p=one.join({});one.command(p,{type:'ready',ready:true},0);
 eq(one.canStart(),false);
 for(const n of [2,3,10]){
  const {room,players}=setup(n);
  eq(room.bases.length,0);eq(room.bosses.length,0);eq(room.shadows.length,10);eq(room.chests.length,15);
  eq(new Set(room.chests.map(chest=>arena.indexAt(chest))).size,15);
  eq(room.traps.controller.list.length,20);
  eq(new Set(players.map(p=>arena.indexAt(p))).size,n);
  const view=room.snapshot(players[0],0);
  eq(view.mode,'survival');eq(view.survivors,n);eq(view.chestsTotal,15);eq(view.chestsLeft,15);
  eq(view.nextEliminationAt,120_000);ok(view.players.every(p=>p.points===0));
  eq(view.players[1].hp,undefined);eq(view.players[1].x,undefined);
 }
 const a=setup(2,()=>.01).room,b=setup(2,()=>.9).room;
 ok(a.chests.some((p,i)=>distance(p,b.chests[i])>0));
 ok(a.traps.controller.list.some((p,i)=>distance(p,b.traps.controller.list[i])>0));
});

Deno.test('chests grant 5 and restore 15%, PvP knockouts grant 20 and restore 30% once',()=>{
 const {room,players:[a,b,c]}=setup(3);
 const chest=room.chests[0];Object.assign(a,{x:chest.x,y:chest.y,hp:1,mp:0,ailments:{poison:2}});
 room.command(a,{type:'chest',id:chest.id},3000);
 eq(a.hp,1+Math.round(a.maxHp*.15));eq(a.mp,Math.round(a.maxMp*.15));eq(a.ailments,{});eq(a.points,5);
 eq(room.snapshot(a,3000).chestsLeft,14);
 let repeat=false;try{room.command(a,{type:'chest',id:chest.id},3001);}catch{repeat=true;}ok(repeat);
 const at=cellCenter(15,15);Object.assign(a,at);Object.assign(b,at);
 room.tick(4000,0);
 const duel=room.battles.get(a.battle);eq(duel.teams,[[a.id],[b.id]]);
 ok([...duel.allies,...duel.enemies].every(unit=>!unit.baseAura));
 const attacker=room.battleHero(a);Object.assign(attacker,{hp:1,mp:0,status:{burn:2},dots:[{}]});
 room.battleHero(b).hp=0;duel.fallen.push(b.id);room.recordFalls(duel,4001);
 eq(attacker.hp,1+Math.round(a.maxHp*.3));eq(attacker.mp,Math.round(a.maxMp*.3));eq(attacker.status,{});
 eq(attacker.dots,[]);eq(b.phase,'dead');eq(b.respawnAt,undefined);eq(room.phase,'match');eq(a.points,25);
 room.recordFalls(duel,4002);eq(attacker.hp,1+Math.round(a.maxHp*.3));eq(a.points,25);
 room.fall(c,5000);room.checkScore(5000);
 eq(room.winner,a.id);eq(room.snapshot(a,5000).winnerName,a.name);
});

Deno.test('a beast victory grants 10 and restores 20% once without removing ailments',()=>{
 const {room,players:[a]}=setup(3);
 room.encounter(a,room.shadows[0],3000,true);
 const fight=room.battles.get(a.battle),hero=room.battleHero(a);
 Object.assign(hero,{hp:1,mp:0,status:{poison:2}});
 fight.enemies[0].hp=0;
 room.recordFalls(fight,3001);
 room.recordFalls(fight,3050);
 eq(a.points,10);eq(hero.hp,1+Math.round(a.maxHp*.2));eq(hero.mp,Math.round(a.maxMp*.2));eq(hero.status,{poison:2});
});

Deno.test('the score cut runs every two minutes, cuts one tied low scorer and grants no PvP reward',()=>{
 const {room,players:[a,b,c,d]}=setup(4);
 room.shadows=[];room.traps.controller.list.length=0;
 const center=cellCenter(15,15);
 Object.assign(a,center,{x:center.x-180});Object.assign(b,center,{x:center.x+180});
 Object.assign(c,center);Object.assign(d,center);
 room.addSurvivalPoints(a,20,30_000);
 room.addSurvivalPoints(b,5,40_000);
 room.addSurvivalPoints(c,5,50_000);
 room.addSurvivalPoints(d,10,60_000);
 room.encounter(c,d,119_800);
 const fight=room.battles.get(c.battle);
 room.tick(119_999,0);eq(room.snapshot(a,119_999).survivors,4);
 room.tick(120_000,0);
 eq(room.snapshot(a,120_000).nextEliminationAt,240_000);
 eq(room.snapshot(c,120_000).eliminationCause,'คัดคะแนนต่ำสุด (5 คะแนน)');
 eq(c.phase,'dead');eq(fight.finished,true);eq(b.phase,'walk');eq(d.points,10);eq(d.baseHeal,undefined);
 room.eliminateByScore(239_999);eq(b.phase,'walk');
 room.eliminateByScore(240_000);eq(b.phase,'dead');eq(room.snapshot(a,240_000).survivors,2);
 room.eliminateByScore(360_000);eq(room.winner,a.id);eq(room.snapshot(a,360_000).nextEliminationAt,null);
});

Deno.test('an exact score tie cuts just one player before accepting an action at the deadline',()=>{
 const {room,players:[a,b,c]}=setup(3,()=>.999);
 const chest=room.chests[0];
 Object.assign(c,{x:chest.x,y:chest.y});
 room.command(c,{type:'chest',id:chest.id},120_000);
 eq(c.phase,'dead');eq(c.points,0);eq(chest.opened,false);
 eq(room.snapshot(a,120_000).survivors,2);eq(b.phase,'walk');
});

Deno.test('fog removes 10% of original area every 30 seconds, blocks leaving and damages even during combat',()=>{
 eq(fogZone(0,29_999).remaining,1);
 eq(fogZone(0,30_000).remaining,.9);
 const zone=fogZone(0,FOG_INTERVAL);
 eq(zone.remaining,.9);
 const ratio=((zone.max-zone.min)/(arena.width-2*CELL))**2;ok(Math.abs(ratio-.9)<.0001);
 eq(fogZone(0,299_999).remaining,.1);eq(fogZone(0,300_000).remaining,0);
 const y=cellCenter(1,5).y;
 const inside={x:zone.min+4,y}, outside={x:zone.min-4,y};
 walkInArena(arena,zone,inside,-1,0,.05);ok(insideFogSafe(zone,inside.x,y));
 walkInArena(arena,zone,outside,1,0,.05);ok(insideFogSafe(zone,outside.x,y));
 const {room,players:[a,b,c]}=setup(3);
 Object.assign(a,SURVIVAL_SPAWNS[0]);Object.assign(b,SURVIVAL_SPAWNS[0]);Object.assign(c,cellCenter(15,15));
 room.encounter(a,b,FOG_INTERVAL-10);
 const duel=room.battles.get(a.battle), hero=room.battleHero(a), rival=room.battleHero(b);
 hero.hp=1;
 room.updateFog(FOG_INTERVAL);room.updateFog(FOG_INTERVAL+999);eq(hero.hp,1);
 room.updateFog(FOG_INTERVAL+1000);
 eq(a.phase,'dead');eq(duel.finished,true);eq(rival.hp,b.maxHp-Math.round(b.maxHp*.02));
 eq(b.baseHeal,undefined);eq(room.phase,'match');eq(c.hp,c.maxHp);
});

Deno.test('survival practice plays a ten-seat match with nine independent bots to a result',()=>{
 let seed=42;
 const random=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32;
 const room=new Match('PRACTICE',0,random,'survival');
 const human=startPractice(room,{name:'Tester',lv:20},0);
 const view=room.snapshot(human,0);
 eq(view.mode,'survival');eq(view.practice,true);eq(view.survivors,10);
 eq(view.players.filter(p=>p.bot).length,9);
 const [a,b]=room.players.filter(p=>p.bot);
 const center=cellCenter(15,15);Object.assign(a,center);Object.assign(b,center);
 let botTurn=false;
 for(let time=2500;room.phase==='match'&&time<=660_000;time+=50){
  room.tick(time,.05);
  botTurn||=[...room.battles.values()].some(fight=>!fight.beastId&&fight.botOwners.every(Boolean)&&fight.last);
 }
 eq(room.phase,'finished');eq(room.reason,'survival');
 ok(botTurn&&room.chests.some(chest=>chest.opened));
 ok(room.players.filter(p=>p.phase!=='dead').length<=1);
});

Deno.test('a practice bot navigates from a spawn in the fog back into the safe zone',()=>{
 const room=new Match('ESCAPE',0,()=>.42,'survival');
 startPractice(room,{name:'Tester',lv:20},0);
 const bot=room.players[1], spawn=SURVIVAL_SPAWNS[0], warp=bot.warp;
 Object.assign(bot,spawn);
 for(const p of room.players)if(p!==bot)p.connected=false;
 room.shadows=[];room.traps.controller.list.length=0;
 room.tick(FOG_INTERVAL,.05);
 eq(bot.bot.goal.type,'escape');
 ok(!insideFogSafe(room.zone,bot.x,bot.y));
 for(let time=FOG_INTERVAL+50;time<FOG_INTERVAL+4000&&!insideFogSafe(room.zone,bot.x,bot.y);time+=50){
  room.tick(time,.05);
 }
 ok(insideFogSafe(room.zone,bot.x,bot.y));
 eq(bot.warp,warp);
});
