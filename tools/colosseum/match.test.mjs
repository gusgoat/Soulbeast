import {ASSIST, BASES, BEAST_SPEED_SCALE, BOSS_INTERVAL, BUSHES, CELL, COLS, MATCH_MS, OBSTACLES, RADIUS, RESPAWN_MS, SPEED, bushAt, cellCenter, clearPath, distance, fits, maze, movePlayer, nextCell, spawns} from './arena.mjs';
import {SIGHT_RANGE} from './sight.mjs';
import {Match} from './match.mjs';
import {bossUnit, combatAction, combatView, demoProfile, makeCombat, rareSpecies} from './combat.mjs';
import {serve} from './server.mjs';
import {startPractice} from './practice.mjs';

const ok=(test,message='assertion failed')=>{if(!test)throw Error(message);};
const eq=(a,b)=>ok(JSON.stringify(a)===JSON.stringify(b),`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
function match(n=2){
 const r=new Match('1234AABB',0),p=Array.from({length:n},(_,i)=>r.join({name:`P${i}`,cls:i%2?'mage':'summoner',lv:10+i}));
 return {r,p};
}
function start(r,p){for(const u of p)r.command(u,{type:'ready',ready:true},0);r.command(p[0],{type:'start'},0);}
function checkAura(unit,reference,active){
 eq(unit.baseAura||0,active);
 for(const [stat,value] of Object.entries(reference.st)){
  const factor=['patk','matk','pdef','mdef'].includes(stat)?1+active/100:1;
  ok(Math.abs(unit.st[stat]-value*factor)<.001,`incorrect ${stat} for ${unit.name}`);
 }
}

Deno.test('the host fills team and survival vacancies with ready bots without replacing human seats',()=>{
 const {r,p}=match();
 const [host,guest]=p;
 r.command(guest,{type:'team',side:0},0);
 let rejected=false;
 try{r.command(guest,{type:'addBot',side:1},0);}catch{rejected=true;}
 ok(rejected);
 for(let i=0;i<2;i++)r.command(host,{type:'addBot',side:1},0);
 const bots=r.players.filter(u=>u.bot);
 eq(bots.map(u=>[u.side,u.lv,u.ready]),[[1,host.lv,true],[1,host.lv,true]]);
 eq(r.snapshot(host,0).canManageBots,true);
 eq(r.snapshot(guest,0).canManageBots,false);
 start(r,p);
 eq(r.phase,'match');

 const solo=new Match('SURVIVAL',0,()=>.5,'survival');
 const owner=solo.join({name:'Host',cls:'mage',lv:42});
 for(let i=0;i<9;i++)solo.command(owner,{type:'addBot'},0);
 const generated=solo.players.filter(u=>u.bot);
 ok(new Set(generated.map(u=>u.baseCls)).size>=6);
 ok(new Set(generated.flatMap(u=>u.bot.loadout.pets.map(p=>p.sp))).size>=9);
 ok(new Set(generated.map(u=>u.bot.loadout.eq.weapon)).size>=5);
 for(const u of generated)ok(demoProfile(u,0).some(p=>p.sp));
 rejected=false;
 try{solo.command(owner,{type:'addBot'},0);}catch{rejected=true;}
 ok(rejected);
 solo.command(owner,{type:'removeBot',id:generated[0].id},0);
 eq(solo.players.length,9);
 eq(solo.host,owner.id);
});

Deno.test('mirror, connected arena, all spawn and base cells accessible',()=>{
 const origin=21*COLS+2;
 for(const [y,row] of maze.entries())for(const [x,open] of row.entries()){
  eq(open,row[COLS-1-x]);const dest=y*COLS+x;
  if(open&&dest!==origin)ok(nextCell(origin,dest)!==origin,`unreachable at ${x},${y}`);
  if(open)for(const [nx,ny] of [[x+1,y],[x,y+1]]){
   if(maze[ny]?.[nx])ok(clearPath(cellCenter(x,y),cellCenter(nx,ny),RADIUS),`blocked route at ${x},${y}`);
  }
 }
 for(const p of [...BASES,...spawns(0),...spawns(1)])ok(fits(p.x,p.y));
 eq(maze.filter(row=>row[Math.floor(COLS/2)]).length,7);
 eq(BUSHES.length,40);eq(CELL,180);
 eq(BASES.map(base=>base.maxDurability),[8,6,6,4,4,4,4,8,6,6,4,4,4,4]);
 ok(OBSTACLES.every(prop=>!fits(prop.x,prop.y)));
 for(const b of BUSHES)for(let i=0;i<b.w;i++)ok(maze[b.y][b.x+i]);
});
Deno.test('balanced rooms start at 1v1 and 5v5; 12 minutes, draw on tie',()=>{
 for(const n of [2,10]){
  const {r,p}=match(n);eq(r.canStart(),false);
  start(r,p);eq(r.ends,12*60_000);eq(r.score,[100,100]);eq(r.shadows.length,10);
  ok(r.shadows.every(b=>rareSpecies.includes(b.sp)&&b.lv===Math.round(10+(n-1)/2)&&fits(b.x,b.y)));
  r.tick(MATCH_MS,0);eq(r.winner,-1);
 }
 const {r,p}=match(3);for(const u of p)r.command(u,{type:'ready',ready:true},0);
 eq(r.canStart(),false);
});
Deno.test('only enemy bases in reach score, teleport immediately, zero ends the match',()=>{
 const {r,p:[a,b]}=match();
 start(r,[a,b]);const mini=BASES.find(x=>x.side!==a.side&&x.tier==='small'),main=BASES.find(x=>x.side!==a.side&&x.main);
 let rejected=false;try{r.command(a,{type:'raid',id:main.id},3000);}catch{rejected=true;}ok(rejected);
 Object.assign(a,{x:mini.x,y:mini.y});r.command(a,{type:'raid',id:mini.id},4000);eq(r.score,[105,95]);eq({x:a.x,y:a.y},a.spawn);
 rejected=false;try{r.command(a,{type:'raid',id:mini.id},4001);}catch{rejected=true;}ok(rejected);
 r.score[1]=2;Object.assign(a,{x:mini.x,y:mini.y});r.command(a,{type:'raid',id:mini.id},10000);eq(r.score,[110,0]);eq(r.winner,0);
});
Deno.test('friendly castles heal the player with 30% or a full cleanse; enemy, distant and ruined castles refuse',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const [main,small]=r.bases.filter(base=>base.side===a.side);
 const enemy=r.bases.find(base=>base.side!==a.side);
 const tryHeal=(base,now)=>r.command(a,{type:'healBase',id:base.id},now);
 const denied=base=>{let rejected=false;try{tryHeal(base,3000);}catch{rejected=true;}ok(rejected);};
 denied(small);Object.assign(a,{x:enemy.x,y:enemy.y});denied(enemy);
 Object.assign(a,{x:small.x,y:small.y,hp:1,mp:0,ailments:{poison:2}});
 tryHeal(small,4000);eq(a.hp,1+Math.round(a.maxHp*.3));eq(a.mp,Math.round(a.maxMp*.3));eq(a.ailments,{poison:2});
 a.hp=a.maxHp-1;tryHeal(small,4100);eq(a.hp,a.maxHp);
 small.remaining=0;denied(small);
 Object.assign(a,{x:main.x,y:main.y,hp:1,mp:0});
 tryHeal(main,4200);eq(a.hp,a.maxHp);eq(a.mp,a.maxMp);eq(a.ailments,{});
 eq(r.snapshot(a,4200).baseHeal,{hp:a.maxHp-1,mp:a.maxMp,cleansed:true,at:4200});
 eq(r.score,[100,100]);eq(main.remaining,8);
});
Deno.test('base repair counts 15 seconds of walking inside the ring and discards time on exit',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 const base=r.bases.find(x=>x.side===a.side&&x.tier==='small');
 base.remaining=1;
 Object.assign(a,{x:base.x+150,y:base.y,safeUntil:100_000});
 r.tick(3000,0);r.tick(9000,0);
 eq(r.snapshot(a,9000).baseRepair,{id:base.id,elapsed:6000});
 r.encounter(a,b,9000);
 r.tick(23000,0);
 eq(base.remaining,1);eq(r.snapshot(a,23000).baseRepair,undefined);
 Object.assign(r.battles.get(a.battle),{finished:true,releasedAt:24000});
 r.tick(24000,0);r.tick(32999,0);
 eq(base.remaining,1);eq(r.snapshot(a,32999).baseRepair?.elapsed,14999);
 r.tick(33000,0);
 eq(base.remaining,2);eq(r.snapshot(a,33000).baseRepair?.elapsed,0);
 r.tick(40000,0);a.x+=1;r.tick(40001,0);
 eq(r.snapshot(a,40001).baseRepair,undefined);
 a.x-=1;r.tick(42000,0);r.tick(56999,0);
 eq(base.remaining,2);
 r.tick(57000,0);r.tick(72000,0);
 eq(base.remaining,4);eq(r.snapshot(a,72000).baseRepair,undefined);
 eq(r.score,[100,100]);
});
Deno.test('pet HP and MP carry to the next fight and team bases can revive downed pets',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 r.encounter(a,b,3000);
 const fight=r.battles.get(a.battle),pets=fight.allies.filter(u=>u.kind==='pet');
 eq(pets.length,2);
 Object.assign(pets[0],{hp:0,mp:0});Object.assign(pets[1],{hp:9,mp:3});
 Object.assign(fight,{finished:true,releasedAt:4000});r.tick(4000,0);
 r.encounter(b,a,8000);
 const rematch=r.battles.get(a.battle);
 eq(rematch.allies.filter(u=>u.kind==='pet').map(u=>[u.hp,u.mp]),[[0,0],[9,3]]);
 Object.assign(rematch,{finished:true,releasedAt:9000});r.tick(9000,0);
 const small=r.bases.find(x=>x.side===a.side&&x.tier==='small');
 Object.assign(a,{x:small.x,y:small.y});
 r.command(a,{type:'healBase',id:small.id},10000);
 const revived=a.petVitals.get(pets[0].uid);
 eq([revived.hp,revived.mp],[Math.round(revived.maxHp*.3),Math.round(revived.maxMp*.3)]);
 eq(a.baseHeal.petsRevived,1);
 const capital=r.bases.find(x=>x.side===a.side&&x.main);
 Object.assign(a,{x:capital.x,y:capital.y});
 r.command(a,{type:'healBase',id:capital.id},11000);
 eq([...a.petVitals.values()].map(v=>[v.hp===v.maxHp,v.mp===v.maxMp]),[[true,true],[true,true]]);
});
Deno.test('only current owners can repair and simultaneous repairs stop at maximum',()=>{
 const {r,p:[a,b,mate]}=match(4);start(r,r.players);r.shadows=[];
 const base=r.bases.find(x=>x.side===a.side&&x.tier==='small');
 base.remaining=3;
 for(const p of [a,b,mate])Object.assign(p,{x:base.x,y:base.y,safeUntil:100_000});
 r.tick(3000,0);
 eq(r.snapshot(b,3000).baseRepair,undefined);
 eq(r.snapshot(b,3000).players.find(p=>p.id===a.id).repairingBase,undefined);
 eq(r.snapshot(a,3000).players.find(p=>p.id===mate.id).repairingBase,base.id);
 r.tick(18000,0);
 eq(base.remaining,4);
 eq(r.snapshot(a,18000).baseRepair,undefined);eq(r.snapshot(mate,18000).baseRepair,undefined);
 base.remaining=1;r.tick(19000,0);
 eq(r.snapshot(a,19000).baseRepair?.elapsed,0);
 b.safeUntil=0;r.command(b,{type:'raid',id:base.id},20000);
 Object.assign(b,{x:base.x,y:base.y});
 r.tick(20001,0);
 eq(r.snapshot(a,20001).baseRepair,undefined);
 eq(r.snapshot(b,20001).baseRepair,{id:base.id,elapsed:0});
});
Deno.test('team snapshots expose live fight HP to teammates only and preserve HP, MP and ailments between fights',()=>{
 const {r,p:[a,b,mate,other]}=match(4);start(r,[a,b,mate,other]);
 r.encounter(a,b,3000);
 const fight=r.battles.get(a.battle), hero=fight.allies.find(u=>u.sealer===a.id&&u.kind==='player');
 const shownTo=viewer=>r.snapshot(viewer,4000).players.find(p=>p.id===a.id).hp;
 Object.assign(hero,{hp:31,mp:0,status:{poison:2}});
 eq(shownTo(mate),31);eq(shownTo(other),undefined);
 Object.assign(fight,{finished:true,releasedAt:4000});r.tick(4000,0);
 eq(a.hp,31);eq(a.mp,0);eq(a.ailments,{poison:2});eq(shownTo(mate),31);
 r.encounter(a,b,8000);
 const next=r.battles.get(a.battle).allies.find(u=>u.sealer===a.id&&u.kind==='player');
 eq(next.hp,31);eq(next.mp,0);
});
Deno.test('PvP base aura is inclusive at 600 from the collision midpoint and requires a standing friendly base',()=>{
 for(const [range,remaining,active] of [[600,4,10],[601,4,0],[600,0,0]]){
  const {r,p:[a,b]}=match();start(r,[a,b]);
  const base=r.bases.find(x=>x.side===a.side&&x.tier==='small');base.remaining=remaining;r.bases=[base];
  Object.assign(a,{x:base.x+range+20,y:base.y});Object.assign(b,{x:base.x+range-20,y:base.y});
  r.encounter(a,b,3000);
  const duel=r.battles.get(a.battle);
  duel.allies.forEach((unit,i)=>checkAura(unit,demoProfile(a,0)[i],active));
  duel.enemies.forEach((unit,i)=>checkAura(unit,demoProfile(b,1)[i],0));
  eq(combatView(duel,a.id).allies[0].baseAura||0,active);
 }
});
Deno.test('base aura applies independently to both PvP sides and their helpers without stacking',()=>{
 const {r,p:[a,b,helper]}=match(4);start(r,r.players);
 const at=cellCenter(15,21);Object.assign(a,at);Object.assign(b,at);Object.assign(helper,at,{x:at.x+180});
 for(const side of [a.side,b.side]){
  const base=r.bases.find(x=>x.side===side&&!x.main);
  Object.assign(base,at,{x:at.x+(side===a.side?-200:200)});
 }
 const extra=r.bases.find(x=>x.side===a.side&&x.main);
 Object.assign(extra,{x:at.x,y:at.y});
 r.encounter(a,b,3000);
 const fight=r.battles.get(a.battle);
 eq(fight.teams,[[a.id,helper.id],[b.id]]);
 for(const [side,group] of [fight.allies,fight.enemies].entries()){
  for(const id of fight.teams[side]){
   const seat=fight.roster.indexOf(id), player=r.players.find(p=>p.id===id);
   group.filter(u=>u.owner===seat).forEach((unit,i)=>checkAura(unit,demoProfile(player,seat)[i],side===0?30:20));
  }
 }
});
Deno.test('friendly main base aura covers PvE and summoned golems while shadow and boss stats remain neutral',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const at=a.spawn;Object.assign(a,at);
 const shadow=r.shadows[0];Object.assign(shadow,at);
 r.encounter(a,shadow,3000,true);
 const fight=r.battles.get(a.battle), reference=makeCombat('no-aura',[[a],[]],shadow,3000);
 const summon=battle=>{
  battle.cur=battle.allies[0].id;
  ok(combatAction(battle,a.id,{turn:battle.turn,skill:'summon_golem',target:battle.enemies[0].id},battle.openAt));
  return battle.allies.find(u=>u.sp==='bastion_golem');
 };
 checkAura(fight.enemies[0],reference.enemies[0],0);
 checkAura(summon(fight),summon(reference),30);
 r.spawnBoss(BOSS_INTERVAL);const boss=r.bosses[0];Object.assign(boss,at);
 r.encounter(a,boss,BOSS_INTERVAL,true);
 const bossFight=r.battles.get(a.battle);
 bossFight.allies.forEach((unit,i)=>checkAura(unit,demoProfile(a,0)[i],30));
 checkAura(bossFight.enemies[0],bossUnit(boss),0);
});
Deno.test('team and survival enforce a 300-unit sight boundary without changing chest totals or the team minimap',()=>{
 for(const mode of ['team','survival']){
  const r=new Match('SIGHT',0,()=>.5,mode), [a,b,ally]=Array.from({length:4},()=>r.join({}));
  start(r,r.players);
  Object.assign(a,{x:200,y:200});
  Object.assign(b,{x:500,y:200});
  Object.assign(ally,{x:501,y:200});
  r.shadows=[{id:'near-shadow',x:500,y:200,phase:'walk'},{id:'far-shadow',x:501,y:200,phase:'walk'}];
  r.bosses=mode==='team'?[{id:'near-boss',x:500,y:200},{id:'far-boss',x:501,y:200}]:[];
  r.chests=[{id:'near-chest',x:500,y:200},{id:'far-chest',x:501,y:200}];
  const view=r.snapshot(a,0), other=view.players.find(p=>p.id===ally.id);
  eq(view.players.find(p=>p.id===b.id).x,500);
  eq(other.x,undefined);eq(other.mapX,mode==='team'?501:undefined);
  eq(view.shadows.map(x=>x.id),['near-shadow']);
  eq(view.bosses.map(x=>x.id),mode==='team'?['near-boss']:[]);
  eq(view.chests.map(x=>x.id),['near-chest']);eq(view.chestsLeft,2);
  Object.assign(b,{x:200,y:670});
  eq(r.snapshot(a,0).players.find(p=>p.id===b.id).x,undefined);
 }
});
Deno.test('nearest ally within 400 units; allies alone never fight; far enemy coordinates are omitted',()=>{
 const {r,p}=match(6);start(r,p);
 const center=cellCenter(15,21), [a,b,help,far,further,tooFar]=p;
 Object.assign(b,{x:a.x+SIGHT_RANGE+1,y:a.y});
 eq(r.snapshot(a,0).players.find(q=>q.id===b.id).x,undefined);
 for(const [u,dx] of [[a,0],[b,20],[help,200],[far,440],[further,-250],[tooFar,450]])Object.assign(u,center,{x:center.x+dx});
 r.tick(3000,0);
 const duel=r.battles.get('1');eq(duel.teams,[[a.id,help.id],[b.id]]);
 ok(distance(a,help)<=ASSIST);
 duel.fallen.push(b.id);r.recordFalls(duel,4000);r.recordFalls(duel,4001);
 eq(r.score[1],90);eq(b.phase,'dead');eq(b.respawnAt,4000+RESPAWN_MS);
 r.tick(4000+RESPAWN_MS-1,0);eq(b.phase,'dead');
 r.tick(4000+RESPAWN_MS,0);eq(b.phase,'walk');eq({x:b.x,y:b.y},b.spawn);
});
Deno.test('combat command must be current, authorized and targeted to the appropriate side',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const at=cellCenter(15,21);Object.assign(a,at);Object.assign(b,at);r.tick(3000,0);
 const duel=r.battles.get('1');
 const actor=duel.roster[[...duel.allies,...duel.enemies].find(x=>x.id===duel.cur).owner];
 const other=actor===a.id?b.id:a.id, view=combatView(duel,actor);
 const skill=view.commands.find(s=>s.id==='attack');ok(skill?.targets.length);
 const action={turn:view.turn,skill:skill.id,target:skill.targets[0]},now=duel.openAt;
 eq(combatAction(duel,actor,action,now-1),false);
 eq(combatAction(duel,other,action,now),false);
 eq(combatAction(duel,actor,{...action,target:duel.cur},now),false);
 eq(combatAction(duel,actor,action,now),true);
 eq(combatAction(duel,actor,action,now),false);
 eq(duel.last.skill,skill.name);
});
Deno.test('battle auto uses the active owner and can be toggled off without resetting the clock',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 r.encounter(a,b,3000);
 const duel=r.battles.get('1'), active=[...duel.allies,...duel.enemies].find(u=>u.id===duel.cur);
 const owner=r.players.find(p=>p.id===duel.roster[active.owner]), other=owner===a?b:a;
 const deadline=duel.deadline, openedAt=duel.openAt, turn=duel.turn;
 const auto=(p,enabled)=>r.command(p,{type:'combatAuto',enabled},openedAt);
 auto(other,true);eq(r.battleSnapshot(owner).deadline,deadline);
 auto(owner,'false');eq(r.battleSnapshot(owner).auto,false);
 auto(owner,true);eq(r.battleSnapshot(owner).commands,[]);eq(r.battleSnapshot(other).deadline,openedAt+500);
 auto(owner,false);eq(r.battleSnapshot(owner).deadline,deadline);ok(r.battleSnapshot(owner).commands.length>0);
 auto(owner,true);
 r.tick(openedAt+499,0);eq(duel.turn,turn);
 r.tick(openedAt+500,0);eq(duel.last.actor,active.id);
});
Deno.test('ten distinct random chest sites; only first opener earns 5–15 points',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 eq(r.chests.length,10);eq(new Set(r.chests.map(c=>`${c.x}:${c.y}`)).size,10);
 ok(r.chests.every(c=>fits(c.x,c.y)&&c.points>=5&&c.points<=15));
 const c=r.chests[0];Object.assign(a,{x:c.x,y:c.y});Object.assign(b,{x:c.x,y:c.y});
 r.command(b,{type:'chest',id:c.id},3000);eq(r.score,[100,100+c.points]);
 let denied=false;try{r.command(a,{type:'chest',id:c.id},3000);}catch{denied=true;}
 ok(denied);eq(r.snapshot(a,3000).chestsLeft,9);eq(r.snapshot(a,3000).chests.some(x=>x.id===c.id),false);
});
Deno.test('rare boss spawns every two minutes at the rounded average level and scores once',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 r.tick(BOSS_INTERVAL-1,0);eq(r.bosses.length,0);
 r.tick(BOSS_INTERVAL,0);eq(r.bosses.length,1);eq(r.nextBossAt,BOSS_INTERVAL*2);
 const beast=r.bosses[0];ok(rareSpecies.includes(beast.sp)&&rareSpecies.length>10);
 ok(fits(beast.x,beast.y));eq(beast.lv,11);eq(r.snapshot(a,BOSS_INTERVAL).nextBossAt,BOSS_INTERVAL*2);
 const at={x:beast.x,y:beast.y};
 Object.assign(a,at);r.tick(BOSS_INTERVAL+1,0);
 const battle=r.battles.get(a.battle);
 ok(battle?.boss);eq(battle.enemies.length,1);eq(battle.enemies[0].st,bossUnit(beast).st);
 battle.enemies[0].hp=0;r.recordFalls(battle,BOSS_INTERVAL+2);r.recordFalls(battle,BOSS_INTERVAL+3);
 eq(r.score,[120,80]);ok(r.events.at(-1).text.includes('นาทีที่ 4'));eq(beast.phase,'defeated');
 r.tick(BOSS_INTERVAL*2,0);eq(r.bosses.length,1);ok(r.bosses[0].sp!==beast.sp);
});
Deno.test('an undefeated boss is replaced at the deadline, even if a battle is active',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.tick(BOSS_INTERVAL,0);
 const old=r.bosses[0];
 Object.assign(a,{x:old.x,y:old.y});r.tick(BOSS_INTERVAL+1,0);
 const battle=r.battles.get(a.battle);ok(battle?.boss);
 r.command(a,{type:'combat',turn:battle.turn,skill:'attack',target:battle.enemies[0].id},2*BOSS_INTERVAL);
 eq(r.bosses.length,1);ok(r.bosses[0].id!==old.id&&r.bosses[0].sp!==old.sp);
 eq(battle.finished,true);eq(r.score,[100,100]);
 r.tick(2*BOSS_INTERVAL+1500,0);eq(a.phase,'walk');eq(r.battles.has(battle.id),false);
});
Deno.test('opponents cannot see through bush borders; walking in foliage is half speed',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);const bush=BUSHES[0],inside=cellCenter(bush.x,bush.y);
 const outside=cellCenter(bush.x-1,bush.y);
 Object.assign(a,inside);Object.assign(b,outside);
 eq(bushAt(a),bush.id);eq(r.snapshot(b,3000).players.find(p=>p.id===a.id).x,undefined);
 eq(r.snapshot(a,3000).players.find(p=>p.id===b.id).x,b.x);
 const ax=a.x,bx=b.x;movePlayer(a,1,0,.1);movePlayer(b,1,0,.1);
 ok(Math.abs((a.x-ax)*2-(b.x-bx))<.0001);
 Object.assign(b,{x:a.x+25,y:a.y});eq(r.snapshot(b,3000).players.find(p=>p.id===a.id).x,a.x);
 r.tick(3000,0);eq(r.battles.size,1);
});
Deno.test('a creature breaks pursuit on entry into grass and returns to its starting point',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const beast=r.shadows[0];
 const edge=8*CELL;
 Object.assign(a,{x:edge+6,y:beast.home.y});
 r.tick(2950,.05);r.tick(3000,.05);
 eq(beast.pursuedId,a.id);ok(beast.x<beast.home.x);
 Object.assign(a,{x:edge-5});
 r.tick(3050,0);
 eq(a.phase,'walk');eq(beast.pursuedId,undefined);eq(beast.returning,true);
 for(let time=3100;beast.returning&&time<=4000;time+=50)r.tick(time,.05);
 eq(beast.returning,false);ok(distance(beast,beast.home)<=10);
});
Deno.test('linked captures unlock only their own route and the capital wins above zero points',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const [capital,middle,other,small]=r.bases.filter(x=>x.side===1);
 r.score=[100,250];
 let now=3000;
 const raid=(base,player=a)=>{Object.assign(player,{x:base.x,y:base.y});r.command(player,{type:'raid',id:base.id},now+=3000);};
 const denied=base=>{let rejected=false;try{raid(base);}catch{rejected=true;}ok(rejected);};
 denied(middle);denied(capital);
 for(let i=0;i<4;i++)raid(small);
 eq([small.side,small.remaining],[0,2]);eq(r.snapshot(a,now).bases.length,14);eq(r.score,[120,230]);
 denied(other);denied(capital);
 for(let i=0;i<2;i++)raid(small,b);
 eq([small.side,small.remaining],[1,2]);denied(middle);
 for(let i=0;i<2;i++)raid(small);
 for(let i=0;i<6;i++)raid(middle);
 eq([middle.side,middle.remaining],[0,3]);eq(r.score,[180,170]);
 for(let i=0;i<8;i++)raid(capital);
 eq([capital.side,capital.remaining,r.winner,r.reason],[0,4,0,'base-captured']);
 eq(r.score,[300,50]);
});
Deno.test('a shadow acquires at 1000, runs 20% slower and returns after five seconds or beyond 2000',()=>{
 for(const reason of ['time','distance']){
  const {r,p:[a,b]}=match();start(r,[a,b]);
  const beast=r.shadows[0];
  beast.home=cellCenter(3,21);Object.assign(beast,beast.home);
  r.shadows=[beast];b.connected=false;
  Object.assign(a,{x:beast.x+1001,y:beast.y});
  r.tick(3000,0);eq(beast.pursuedId,undefined);
  a.x=beast.x+1000;r.tick(3100,0);eq(beast.pursuedId,a.id);
  a.x=beast.x+2000;r.tick(3200,.05);eq(beast.pursuedId,a.id);
  ok(Math.abs(distance(beast,beast.home)-SPEED*BEAST_SPEED_SCALE*.05)<.001);
  if(reason==='distance')a.x=beast.x+2001;
  r.tick(reason==='time'?8100:3300,0);eq(beast.pursuedId,undefined);
  r.tick(reason==='time'?8150:3350,.05);eq(distance(beast,beast.home),0);
 }
});
Deno.test('boss runs 20% slower, switches to the nearest visible sealer and patrols without a target',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 a.id='sealer-z';b.id='sealer-a';
 const now=BOSS_INTERVAL; r.tick(now,0);
 const boss=r.bosses[0],at=cellCenter(15,21);Object.assign(boss,at,{home:at,nav:null});
 Object.assign(a,at,{x:at.x+330});Object.assign(b,at,{x:at.x-370});
 r.tick(now+50,.05);eq(boss.pursuedId,a.id);ok(Math.abs(distance(boss,at)-SPEED*BEAST_SPEED_SCALE*.05)<.001);
 b.x=2*boss.x-a.x;r.tick(now+100,0);eq(boss.pursuedId,a.id);
 r.tick(now+5100,0);eq(boss.pursuedId,a.id);
 b.x=at.x-170;r.tick(now+5150,0);eq(boss.pursuedId,b.id);
 Object.assign(b,cellCenter(BUSHES[0].x,BUSHES[0].y));r.tick(now+5200,0);eq(boss.pursuedId,a.id);
 a.connected=b.connected=false;const previous={x:boss.x,y:boss.y};
 for(let time=5250;time<=5600;time+=50)r.tick(now+time,.05);
 eq(boss.pursuedId,undefined);ok(distance(previous,boss)>0);
});
Deno.test('rare creature kill scores once and island traps are randomized ten per side',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const traps=r.traps.controller.list;
 eq(traps.filter(trap=>trap.side===0).length,10);eq(traps.filter(trap=>trap.side===1).length,10);
 const other=new Match('OTHER',0,()=>.01);start(other,[other.join({}),other.join({})]);
 ok(JSON.stringify(traps.map(({x,y})=>[x,y]))!==JSON.stringify(other.traps.controller.list.map(({x,y})=>[x,y])));
 const trap=traps.find(t=>t.type==='blast');
 Object.assign(a,{x:trap.x,y:trap.y});
 r.updateTraps(3000,.05);
 ok(r.snapshot(a,3000).traps.some(t=>t.id===trap.id));
 r.updateTraps(5000,2);
 ok(a.hp<a.maxHp);
 const creature=r.shadows[0];
 r.encounter(a,creature,5200,true);
 const battle=r.battles.get(a.battle);
 eq(battle.allies[0].hp,a.maxHp-Math.round(a.maxHp*.1));
 battle.enemies[0].hp=0;r.recordFalls(battle,5500);r.recordFalls(battle,5600);
 eq(r.score,[105,100]);
});
Deno.test('solo practice starts with nine bots and runs normal objectives to a result',()=>{
 const r=new Match('1234AABB',0,()=>.5);
 const human=startPractice(r,{name:'Tester',cls:'mage',lv:20},0);
 const view=r.snapshot(human,0);
 eq(view.practice,true);eq(view.phase,'match');eq(view.ends,MATCH_MS);
 eq(view.players.filter(p=>p.side===0&&p.bot).length,4);
 eq(view.players.filter(p=>p.side===1&&p.bot).length,5);
 const bots=r.players.filter(p=>p.bot);
 const events=[];
 const note=r.note.bind(r);
 r.note=(text,...args)=>{events.push(text);note(text,...args);};
 let hasBotAttack=false;
 for(let time=50;r.phase==='match'&&time<=MATCH_MS;time+=50){
  r.tick(time,.05);
  if(!hasBotAttack){
   hasBotAttack=[...r.battles.values()].some(b=>{
    const actor=[...b.allies,...b.enemies].find(u=>u.id===b.last?.actor);
    return actor&&b.botOwners[actor.owner];
   });
  }
 }
 eq(r.phase,'finished');ok(['zero','time'].includes(r.reason));
 ok(bots.some(p=>p.warp>1)&&events.some(text=>text.includes('จู่โจม')));
 ok(r.chests.some(c=>c.opened));ok(hasBotAttack);
 eq({x:human.x,y:human.y},human.spawn);
});
Deno.test('two WebSocket sessions join, start, move and resume their own seat',async()=>{
 const abort=new AbortController(),server=serve({port:0,signal:abort.signal,onListen(){}});
 const host=`127.0.0.1:${server.addr.port}`,sockets=[];
 const open=async()=>{
  const ws=new WebSocket('ws://'+host+'/ws',{headers:{Origin:'http://'+host}}), seen=[];
  sockets.push(ws);ws.onmessage=e=>seen.push(JSON.parse(e.data));
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  return {ws,seen,send:m=>ws.send(JSON.stringify(m))};
 };
 const wait=async(p,test)=>{
  for(let i=0;i<70;i++){
   const found=p.seen.find(test);if(found)return found;
   await new Promise(r=>setTimeout(r,35));
  }
  throw Error('timed out waiting for WebSocket state');
 };
 try{
  const index=await fetch('http://'+host);eq(index.status,200);ok((await index.text()).includes('โคลอสเซียม'));
  for(const theme of ['ice','fire'])for(const size of ['main','small']){
   const castle=await fetch(`http://${host}/art/${theme}-castle-${size}-v1.webp`,{method:'HEAD'});
   eq(castle.status,200);eq(castle.headers.get('content-type'),'image/webp');
  }
  const hidden=await fetch('http://'+host+'/server.mjs');eq(hidden.status,404);await hidden.text();
  const a=await open();a.send({type:'create',name:'A'});
  const welcome=await wait(a,m=>m.type==='welcome'), first=await wait(a,m=>m.type==='state');
  const b=await open();b.send({type:'join',code:welcome.room,name:'B'});
  await wait(b,m=>m.type==='welcome');
  a.send({type:'ready',ready:true});b.send({type:'ready',ready:true});
  await wait(a,m=>m.canStart);a.send({type:'start'});
  const walk=await wait(a,m=>m.phase==='match'), p=walk.players.find(x=>x.id===walk.me);
  await wait(b,m=>m.phase==='match');a.send({type:'move',seq:1,x:1,y:0});
  await wait(a,m=>m.ack===1&&m.players.find(x=>x.id===m.me).x>p.x);
  const again=await open();again.send({type:'resume',code:welcome.room,token:welcome.token});
  const resumed=await wait(again,m=>m.phase==='match');eq(resumed.me,first.me);
  const solo=await open();solo.send({type:'practice',name:'Solo'});
  const practice=await wait(solo,m=>m.practice&&m.phase==='match');
  eq(practice.players.filter(p=>p.bot).length,9);
  const closed=new Promise(resolve=>solo.ws.addEventListener('close',resolve,{once:true}));
  solo.send({type:'leavePractice'});eq((await closed).reason,'left');
  const outsider=await open();outsider.send({type:'join',code:practice.code});
  await wait(outsider,m=>m.type==='error');
  const survival=await open();survival.send({type:'survivalPractice',name:'Survivor'});
  const freeForAll=await wait(survival,m=>m.practice&&m.mode==='survival'&&m.phase==='match');
  eq(freeForAll.survivors,10);eq(freeForAll.players.filter(p=>p.bot).length,9);
  const exit=new Promise(resolve=>survival.ws.addEventListener('close',resolve,{once:true}));
  survival.send({type:'leavePractice'});eq((await exit).reason,'left');
  const privateLobby=await open();privateLobby.send({type:'create',name:'Private'});
  const privateState=await wait(privateLobby,m=>m.type==='state');
  eq(privateState.isPublic,false);
  const finder=await open();finder.send({type:'joinPublic',mode:'team',name:'Guest'});
  await wait(finder,m=>m.type==='error');
  const teamLobby=await open();teamLobby.send({type:'createPublic',mode:'team',name:'Team host'});
  const teamState=await wait(teamLobby,m=>m.type==='state');
  eq(teamState.isPublic,true);
  const wrongMode=await open();wrongMode.send({type:'joinPublic',mode:'survival',name:'Wrong mode'});
  await wait(wrongMode,m=>m.type==='error');
  const survivalLobby=await open();survivalLobby.send({type:'createPublic',mode:'survival',name:'Survival host'});
  const survivalState=await wait(survivalLobby,m=>m.type==='state');
  eq(survivalState.mode,'survival');eq(survivalState.isPublic,true);
  const guest=await open();guest.send({type:'joinPublic',mode:'team',name:'Guest'});
  eq((await wait(guest,m=>m.type==='welcome')).room,teamState.code);
  await wait(guest,m=>m.type==='state'&&m.players.length===2);
  guest.send({type:'ready',ready:true});teamLobby.send({type:'ready',ready:true});
  await wait(teamLobby,m=>m.canStart);teamLobby.send({type:'start'});
  await wait(guest,m=>m.phase==='match');
  const late=await open();late.send({type:'joinPublic',mode:'team',name:'Late'});
  await wait(late,m=>m.type==='error');
 }finally{
  await Promise.all(sockets.map(ws=>ws.readyState===WebSocket.CLOSED?null:new Promise(resolve=>{ws.addEventListener('close',resolve,{once:true});ws.close();})));
  abort.abort();await server.finished;
 }
});
