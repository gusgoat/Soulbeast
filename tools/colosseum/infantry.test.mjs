import assert from 'node:assert/strict';
import {Match} from './match.mjs';
import {BASE_FIRE_RANGE, BASE_BOLT_MS, COLS, cellCenter, distance, FLAT, RAID_TARGET, siegeProfile} from './arena.mjs';
import {spawnInfantry, stepInfantry} from './infantry.mjs';
import {siegeAudio} from './siege-audio.mjs';

function match(){
 const room=new Match('INFANTRY',0);
 const blue=room.join({name:'Blue',cls:'mage'});
 const red=room.join({name:'Red',cls:'archer'});
 room.start(0);
 return {room,blue,red};
}

Deno.test('team waves spawn five soldiers per capital and new waves gain 5 HP every 2 minutes',()=>{
 const {room,blue}=match();
 room.tick(29_999,0);
 assert.equal(room.infantry.length,0);
 room.tick(30_000,0);
 assert.deepEqual([0,1].map(side=>room.infantry.filter(unit=>unit.side===side).length),[5,5]);
 assert.equal(room.snapshot(blue,30_000).infantry.length,5);
 for(const unit of room.infantry)assert.equal(unit.hp,40);
 const assigned=room.infantry.filter(unit=>unit.side===0).map(unit=>unit.path.find(point=>point.baseId)?.baseId);
 assert.deepEqual(assigned,['1-3','1-4','1-5','1-6','1-7']);
 const routeCells=new Set(room.infantry.flatMap(unit=>unit.path.map(room.arena.indexAt)));
 assert.ok(room.shadows.every(beast=>!routeCells.has(room.arena.indexAt(beast.home))));
 for(let i=0;i<5;i++){
  const left=room.infantry[i],right=room.infantry[i+5];
  assert.deepEqual(left.path.map(p=>[room.arena.width-p.x,p.y]),right.path.map(p=>[p.x,p.y]));
 }
 room.tick(59_999,0);
 assert.equal(room.infantry.length,10);
 room.tick(60_000,0);
 assert.equal(room.infantry.length,20);
 const veteran=room.infantry[0];
 veteran.hp=11;
 room.tick(120_000,0);
 assert.equal(veteran.hp,11);
 assert.equal(veteran.maxHp,40);
 assert.equal(room.infantry.find(unit=>unit.id==='infantry-4-0-0').hp,45);
 room.tick(240_000,0);
 assert.equal(room.infantry.find(unit=>unit.id==='infantry-8-0-0').maxHp,50);
});

Deno.test('in an uncontested lane, infantry passes linked allied forts and the mirrored enemy forts',()=>{
 const {room}=match();
 spawnInfantry(room,1);
 const unit=room.infantry.find(p=>p.id==='infantry-1-0-4');
 room.infantry=[unit];
 for(const p of room.players)p.phase='battle';
 for(const base of room.bases)if(base.side===1)base.hp=0;
 const visited=new Set();
 let traveled=false;
 for(let t=0;t<90_000;t+=50){
  const previous={x:unit.x,y:unit.y};
  stepInfantry(room,t,.05);
  const d=distance(unit,previous);
  assert.ok(d<=8.00001);
  if(d>0){
   traveled=true;
   assert.ok(unit.x===previous.x||unit.y===previous.y);
   assert.ok([0,2,4,6].includes(unit.dir));
  }
  for(const base of room.bases)if(distance(unit,base)<.001)visited.add(base.id);
 }
 assert.ok(traveled);
 for(const id of ['0-8','0-7','1-7','1-8','1-0'])assert.ok(visited.has(id),id);
});

Deno.test('a fort targets soldiers before even a nearer sealer and uses percent damage',()=>{
 const {room,red}=match();
 spawnInfantry(room,1);
 const fort=room.bases.find(b=>b.id==='0-0');
 for(const base of room.bases)if(base!==fort)base.hp=0;
 const soldier=room.infantry.find(unit=>unit.side===1);
 room.infantry=[soldier];
 const hp=red.hp;
 Object.assign(red,{x:fort.x+65,y:fort.y,safeUntil:0});
 Object.assign(soldier,{x:fort.x+BASE_FIRE_RANGE-10,y:fort.y});
 room.siegeBases(4000);
 assert.equal(room.baseBolts.find(bolt=>bolt.base===fort).target,soldier);
 room.siegeBases(4000+BASE_BOLT_MS);
 assert.equal(soldier.hp,33.6);
 assert.equal(red.hp,hp);
});

Deno.test('only living allied infantry within 300 units of the attacked fort restore full damage',()=>{
 const {room,blue,red}=match();
 const fort=room.bases.find(base=>base.id==='1-7');
 const support={side:blue.side,hp:40,x:fort.x+301,y:fort.y};
 const enemy={...support,side:red.side,x:fort.x};
 room.infantry=[support,enemy];
 blue.baseCls='archer';
 room.damageBase(fort,blue,3000);
 room.damageBase(fort,blue,4000);
 assert.equal(fort.hp,58.5);
 support.x--;
 room.damageBase(fort,blue,5000);
 assert.equal(fort.hp,55.5);
 support.hp=0;
 room.damageBase(fort,blue,6000);
 assert.equal(fort.hp,54);
 assert.equal(blue.earned,3);
 assert.deepEqual(room.score,[303,297]);
});

Deno.test('repair fills a fort with fractional damage without exceeding its maximum HP',()=>{
 const {room,blue,red}=match();
 const fort=room.bases.find(base=>base.id==='0-7');
 Object.assign(blue,{baseCls:'merchant',x:fort.x,y:fort.y});
 red.baseCls='archer';
 room.damageBase(fort,red,3000);
 room.damageBase(fort,red,4000);
 assert.equal(fort.hp,58.5);
 room.command(blue,{type:'repairBase',id:fort.id},4001);
 room.siegeBases(6501);
 assert.equal(fort.hp,59.5);
 room.siegeBases(9001);
 assert.equal(fort.hp,60);
 assert.equal(blue.repair,undefined);
});

Deno.test('soldier priorities, automatic sealer hits and damage rates use the overworld',()=>{
 const {room,red,blue}=match();
 spawnInfantry(room,1);
 const base=room.bases.find(b=>b.id==='1-7');
 const a=room.infantry.find(unit=>unit.id==='infantry-1-0-4');
 const b=room.infantry.find(unit=>unit.side===1);
 room.infantry=[a,b];
 a.waypoint=a.path.findIndex(point=>point.baseId===base.id);
 Object.assign(a,{x:base.x-60,y:base.y});
 Object.assign(b,{x:base.x-100,y:base.y});
 Object.assign(red,{x:base.x-35,y:base.y,safeUntil:0});
 stepInfantry(room,4000,0);
 assert.equal(a.target,b);
 stepInfantry(room,5000,0);
 assert.equal(b.hp,39);
 assert.ok(room.baseEffects.some(event=>event.kind==='infantry-slash'&&event.baseId===b.id&&event.targetInfantry));
 b.hp=0;
 stepInfantry(room,5100,0);
 assert.equal(a.target,base);
 stepInfantry(room,6100,0);
 assert.equal(base.hp,base.maxHp-1);
 room.attackInfantry(red,a,6200);
 const before=a.hp;
 room.attackInfantry(red,a,7200);
 assert.equal(a.hp,before-4);
 b.hp=100;
 room.attackInfantry(blue,b,7300);
 room.attackInfantry(blue,b,8300);
 assert.equal(b.hp,97);
 assert.equal(room.battles.size,0);
});

Deno.test('sealers attack an eligible fort before a nearer enemy soldier',()=>{
 const {room,blue,red}=match();
 spawnInfantry(room,1);
 const base=room.bases.find(b=>b.id==='1-7');
 const enemy=room.infantry.find(unit=>unit.side===red.side);
 room.infantry=[enemy];
 for(const fort of room.bases)fort.fireAt=Infinity;
 Object.assign(blue,{x:base.x-160,y:base.y,safeUntil:0});
 Object.assign(enemy,{x:base.x-120,y:base.y});
 red.phase='battle';
 assert.ok(RAID_TARGET(blue,base));
 room.siegeBases(3000);
 room.siegeBases(4000);
 assert.equal(blue.siege?.id,base.id);
 assert.equal(base.hp,base.maxHp-2.5);
 assert.equal(enemy.hp,40);
 base.hp=0;
 room.siegeBases(5000);
 room.siegeBases(6000);
 assert.equal(blue.siege,undefined);
 assert.equal(enemy.hp,37);
});

Deno.test('magic careers can attack from 180 units, including promoted careers',()=>{
 const {room}=match();
 const base=room.bases.find(b=>b.id==='1-7');
 for(const [baseCls,cls] of [['mage','archmage'],['druid','druid'],['summoner','summoner']]){
  const player={baseCls,cls,side:0,x:base.x-180,y:base.y};
  assert.deepEqual(siegeProfile(player),{range:180,effect:'magic'});
  assert.ok(RAID_TARGET(player,base));
  player.x--;
  assert.ok(!RAID_TARGET(player,base));
 }
});

Deno.test('infantry damage gains one HP per second every four minutes against all target types',()=>{
 const {room,red,blue}=match();
 spawnInfantry(room,1);
 const base=room.bases.find(b=>b.id==='1-7');
 const soldier=room.infantry.find(unit=>unit.id==='infantry-1-0-4');
 const enemy=room.infantry.find(unit=>unit.side===red.side);
 Object.assign(soldier,{x:base.x-60,y:base.y});
 Object.assign(enemy,{x:base.x-100,y:base.y});
 Object.assign(red,{x:base.x-35,y:base.y,safeUntil:0});
 room.infantry=[soldier];
 blue.phase='battle';
 for(const [before,after,damage] of [[239_999,240_000,2],[479_999,480_000,3],[719_999,720_000,4]]){
  for(const [target,at] of [[enemy,before-2000],[base,after],[red,after+2000]]){
   room.infantry=target===enemy?[soldier,enemy]:[soldier];
   soldier.waypoint=target===base?soldier.path.findIndex(point=>point.baseId===base.id):soldier.path.length;
   delete soldier.nextHitAt;
   stepInfantry(room,at-1000,0);
   const hp=target.hp;
   stepInfantry(room,at,0);
   assert.equal(target.hp,hp-(target===enemy?damage-1:damage),target.id);
  }
 }
});

Deno.test('sealer infantry damage follows career and uses current personal score thresholds',()=>{
 const {room,blue,red}=match();
 spawnInfantry(room,1);
 const enemy=room.infantry.find(unit=>unit.side===red.side);
 const careers={archer:4,swordsman:5,thief:5,mage:3,gunner:3,druid:3,summoner:2,merchant:4,gladiator:4};
 for(const [baseCls,damage] of Object.entries(careers)){
  for(const [earned,bonus] of [[74,0],[75,1],[149,1],[150,2]]){
   Object.assign(blue,{baseCls,cls:'promoted',earned,infantryAttackTime:0});
   enemy.hp=enemy.maxHp;
   delete blue.infantryStrike;
   room.attackInfantry(blue,enemy,3000);
   assert.equal(enemy.hp,enemy.maxHp);
   room.attackInfantry(blue,enemy,4000);
   assert.equal(enemy.hp,enemy.maxHp-damage-bonus,baseCls+' at '+earned);
  }
 }
});

Deno.test('personal score boosts fort damage and unsupported attacks still deal half',()=>{
 const {room,blue}=match();
 spawnInfantry(room,1);
 const base=room.bases.find(b=>b.id==='1-7');
 const support=room.infantry.find(unit=>unit.side===blue.side);
 Object.assign(support,{x:base.x,y:base.y});
 blue.earned=150;
 room.damageBase(base,blue,3000);
 room.damageBase(base,blue,4000);
 assert.equal(base.hp,base.maxHp-7);
 support.hp=0;
 blue.earned=0;
 room.damageBase(base,blue,5000);
 assert.equal(base.hp,base.maxHp-7-2.5);
 blue.earned=150;
 room.damageBase(base,blue,6000);
 assert.equal(base.hp,base.maxHp-7-2.5-3.5);
});

Deno.test('summoner attacks a fort, then an enemy, then heals the lowest living ally in range',()=>{
 const {room,blue,red}=match();
 spawnInfantry(room,1);
 const base=room.bases.find(b=>b.id==='1-7');
 const [low,near,out,fallen]=room.infantry.filter(unit=>unit.side===blue.side);
 const enemy=room.infantry.find(unit=>unit.side===red.side);
 room.infantry=[low,near,out,fallen,enemy];
 for(const fort of room.bases)fort.fireAt=Infinity;
 Object.assign(blue,{baseCls:'summoner',x:base.x-160,y:base.y,safeUntil:0});
 red.phase='battle';
 Object.assign(low,{x:blue.x-180,y:blue.y,hp:22,maxHp:25});
 Object.assign(near,{x:blue.x,y:blue.y,hp:23,maxHp:25});
 Object.assign(out,{x:blue.x-181,y:blue.y,hp:1});
 Object.assign(fallen,{x:blue.x,y:blue.y,hp:0});
 Object.assign(enemy,{x:blue.x+40,y:blue.y});
 room.siegeBases(3000);
 room.siegeBases(4000);
 assert.equal(base.hp,base.maxHp-3);
 assert.equal(enemy.hp,40);
 assert.equal(low.hp,22);
 base.hp=0;
 room.siegeBases(5000);
 room.siegeBases(6000);
 assert.equal(enemy.hp,38);
 assert.equal(low.hp,22);
 enemy.hp=0;
 room.siegeBases(7000);
 room.siegeBases(7999);
 assert.equal(low.hp,22);
 room.siegeBases(8000);
 assert.equal(low.hp,24);
 assert.ok(room.snapshot(blue,8000).infantry.find(unit=>unit.id===low.id).healUntil>8000);
 room.siegeBases(9000);
 assert.equal(near.hp,25);
 room.siegeBases(10_000);
 assert.equal(low.hp,25);
 room.siegeBases(11_000);
 assert.equal(blue.nextInfantryHealAt,undefined);
 assert.equal(out.hp,1);
 assert.equal(fallen.hp,0);
 blue.baseCls='druid';
 near.hp=20;
 room.siegeBases(12_000);
 room.siegeBases(13_000);
 assert.equal(near.hp,20);
});

Deno.test('infantry hits use battle weapon clips, and corresponding tower hits use siege clips',()=>{
 const player={id:'player'};
 const cases=[
  ['melee','swordsman','swordsman','melee','heavy-melee-impact'],
  ['melee','gladiator','paladin','axe','heavy-melee-impact'],
  ['melee','thief','ninja','dagger','dagger-impact'],
  ['hammer','merchant','blacksmith','mace','heavy-melee-impact'],
  ['archer','archer','ranger','bow','ranged-impact'],
  ['gunner','gunner','gunner','gun','ranged-impact'],
  ['gunner','gunner','cannoneer','cannon','ranged-impact'],
  ['magic','mage','mage','spell','magic-impact'],
  ['magic','summoner','summoner','whip','magic-impact'],
 ];
 for(const [kind,baseCls,cls,weapon,impact] of cases){
  const played=[],audio=siegeAudio(key=>played.push(key));
  const state={now:3000,players:[{...player,baseCls,cls}],baseEffects:[
   {id:1,kind,playerId:player.id,at:3000,until:4000,targetInfantry:{x:1,y:1}},
   {id:2,kind,playerId:player.id,at:3000,until:4000},
  ]};
  audio.sync(state,player);
  audio.sync(state,player);
  assert.deepEqual(played,['weapon-'+weapon,impact]);
 }
 const played=[],audio=siegeAudio(key=>played.push(key));
 const melee={id:1,kind:'infantry-slash',playerId:'soldier',targetInfantry:{x:1,y:1},at:3000,until:3300};
 audio.sync({now:3000,players:[],baseEffects:[melee,{...melee,id:2}]},player);
 assert.deepEqual(played,['weapon-melee']);
});

Deno.test('soldiers abandon a moving target beyond 600 units and return to their route',()=>{
 const {room,blue,red}=match();
 spawnInfantry(room,1);
 const unit=room.infantry.find(p=>p.side===0);
 room.infantry=[unit];
 blue.phase='battle';
 const home={x:unit.x,y:unit.y};
 Object.assign(red,{x:home.x+230,y:home.y,safeUntil:0});
 stepInfantry(room,4000,.05);
 assert.equal(unit.target,red);
 assert.ok(unit.x>home.x);
 red.x=home.x+601;
 stepInfantry(room,4050,.05);
 assert.equal(unit.target,undefined);
 assert.ok(distance(unit,home)<.001);
 assert.ok(distance(unit,red)>600);
});

Deno.test('soldier hits earn whole personal points across targets and the last hit earns five once',()=>{
 const {room,blue,red}=match();
 spawnInfantry(room,1);
 const [first,second]=room.infantry.filter(unit=>unit.side===red.side);
 const scores=[...room.score];
 room.attackInfantry(blue,first,3000);
 room.attackInfantry(blue,first,3999);
 assert.equal(blue.earned,0);
 for(const now of [4000,5000,6000])room.attackInfantry(blue,first,now);
 assert.equal(blue.earned,0);
 delete blue.infantryStrike;
 room.attackInfantry(blue,second,12_000);
 assert.equal(blue.earned,0);
 second.hp=1;
 room.attackInfantry(blue,second,13_000);
 assert.equal(blue.earned,6);
 room.attackInfantry(blue,second,14_000);
 assert.equal(blue.earned,6);
 assert.equal(second.hp,0);
 assert.deepEqual(room.score,scores);
 assert.equal(blue.kills,0);
 assert.equal(room.snapshot(blue,14_000).players.find(p=>p.id===blue.id).points,6);
});

Deno.test('the first soldier exits the allied upper medium fort north without retracing its approach',()=>{
 const {room}=match();
 spawnInfantry(room,1);
 for(const side of [0,1]){
  const unit=room.infantry.find(p=>p.id===`infantry-1-${side}-0`);
  const medium=room.bases.find(b=>b.id===`${side}-1`);
  const small=room.bases.find(b=>b.id===`${side}-3`);
  const mediumAt=unit.path.findIndex(p=>distance(p,medium)===0);
  const smallAt=unit.path.findIndex(p=>distance(p,small)===0);
  const key=p=>[p.x,p.y].join(',');
  const approach=new Set(unit.path.slice(0,mediumAt).map(key));
  const continuation=unit.path.slice(mediumAt+1,smallAt+1);
  assert.ok(continuation.length>0);
  assert.deepEqual({x:continuation[0].x,y:continuation[0].y},cellCenter(side===0?5:COLS-6,12));
  assert.ok(continuation.every(point=>!approach.has(key(point))));
 }
});

Deno.test('the fourth soldier continues past the lower small fort to the relocated medium fort',()=>{
 for(const side of [0,1]){
  const {room}=match();
  spawnInfantry(room,1);
  const unit=room.infantry.find(p=>p.id===`infantry-1-${side}-3`);
  const small=room.bases.find(b=>b.id===`${1-side}-6`);
  const medium=room.bases.find(b=>b.id===`${1-side}-2`);
  const marked=cellCenter(side===0?COLS-4:3,29);
  assert.equal(distance(medium,marked),0);
  const smallAt=unit.path.findIndex(p=>p.x===small.x&&p.y===small.y);
  const mediumAt=unit.path.findIndex(p=>p.x===medium.x&&p.y===medium.y);
  const approach=new Set(unit.path.slice(0,smallAt).map(p=>[p.x,p.y].join(',')));
  const continuation=unit.path.slice(smallAt+1,mediumAt+1);
  assert.equal(continuation.length,11);
  assert.ok(continuation.every(p=>!approach.has([p.x,p.y].join(','))));
  const direction=side===0?1:-1;
  const before=unit.path[smallAt-1], after=unit.path[smallAt+1];
  assert.equal(Math.sign(small.x-before.x),direction);
  assert.equal(Math.sign(after.x-small.x),direction);

  room.infantry=[unit];
  for(const p of room.players)p.phase='battle';
  Object.assign(unit,{x:small.x-direction*60,y:small.y,waypoint:smallAt-1,
   target:small,anchor:{x:before.x,y:before.y}});
  small.hp=0;
  const x=unit.x;
  stepInfantry(room,4000,.05);
  assert.equal(Math.sign(unit.x-x),direction);
  assert.equal(unit.waypoint,smallAt);
  assert.deepEqual(unit.anchor,{x:small.x,y:small.y});
 }
});

Deno.test('infantry damages a sealer without a battle and cannot engage or be engaged by monsters',()=>{
 const {room,blue,red}=match();
 spawnInfantry(room,1);
 const unit=room.infantry[0];
 room.infantry=[unit];
 blue.phase='battle';red.phase='battle';
 const hp=red.hp;
 const monster={...room.shadows[0],x:unit.x+20,y:unit.y,phase:'walk',hp:100};
 room.shadows=[monster];
 const before=unit.hp;
 room.tick(4000,0);
 room.tick(5000,0);
 assert.equal(unit.target,undefined);
 assert.equal(unit.hp,before);
 assert.equal(monster.hp,100);
 Object.assign(red,{phase:'walk',x:unit.x+58,y:unit.y,safeUntil:0});
 stepInfantry(room,5100,0);
 stepInfantry(room,6100,0);
 assert.equal(red.hp,hp-1);
 assert.equal(room.battles.size,0);
});
