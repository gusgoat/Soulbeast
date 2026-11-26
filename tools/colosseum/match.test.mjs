import pvpCardArt from './pvp-card-art.mjs';
import {ASSIST, BASES, BASE_BOLT_MS, BASE_RECALL_MS, TEAM_SPEED, BOSS_INTERVAL, BUSHES, CELL, COLS, FLAT, WARP_ACCESS, WARP_PADS, WARP_PAD_RANGE, MATCH_MS, OBSTACLES, RADIUS, bushAt, cellCenter, clearPath, distance, fits, maze, movePlayer, nextCell, personalCombatBonus, siegeProfile, spawns, warpArrival} from './arena.mjs';
import {SIGHT_RANGE} from './sight.mjs';
import {Match} from './match.mjs';
import {advanceCombat, bossUnit, combatAction, combatView, demoProfile, makeCombat, rareSpecies, setCombatAuto} from './combat.mjs';
import {serve} from './server.mjs';
import {startPractice} from './practice.mjs';
import {spawnInfantry} from './infantry.mjs';
import {siegeAudio} from './siege-audio.mjs';

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

Deno.test('walking character vitals contain only the viewer’s actual companions in both modes',()=>{
 for(const mode of ['team','survival']){
  const room=new Match('PROFILE',0,Math.random,mode);
  const sealer=room.join({name:'Sealer',cls:'summoner',lv:20});
  const opponent=room.join({name:'Opponent',cls:'swordsman',lv:20});
  start(room,[sealer,opponent]);
  const pets=[...sealer.petVitals.values()];
  eq(pets.length,2);
  Object.assign(pets[0],{hp:0,mp:3});
  Object.assign(sealer,{hp:14,mp:7,points:31,earned:32,ailments:{burn:2}});
  const view=room.snapshot(sealer,0);
  const personal=view.players.find(p=>p.id===sealer.id);
  eq([personal.hp,personal.points,view.vitals.mp,view.vitals.ailments],
   [14,mode==='survival'?31:32,7,['burn']]);
  const shown=view.vitals.companions;
  eq(shown,pets);
  ok(shown.every(pet=>pet.name&&pet.sp&&pet.lv===20&&pet.maxHp>0&&pet.maxMp>=0));
  const otherView=room.snapshot(opponent,0);
  eq(otherView.vitals.companions.length,1);
  ok(!Object.hasOwn(otherView.players.find(p=>p.id===sealer.id),'companions'));
  room.recoverPets(sealer,.09,true);
  ok(room.snapshot(sealer,0).vitals.companions[0].hp>0);
  eq(shown[0].hp,0);
  sealer.phase='dead';eq(room.snapshot(sealer,0).vitals.companions,undefined);
 }
});
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
 eq(BUSHES.length,34);eq(CELL,180);
 for(const [x,y] of [[6,13],[6,21],[4,29]])for(const col of [x,x+1,COLS-2-x,COLS-1-x]){
  ok(maze[y][col]);
  eq(bushAt(cellCenter(col,y)),null);
 }
 eq(BASES.map(base=>base.maxHp),[100,80,80,60,60,60,60,60,80,100,80,80,60,60,60,60,60,80]);
 eq(OBSTACLES.length,0);
 for(const b of BUSHES)for(let i=0;i<b.w;i++)ok(maze[b.y][b.x+i]);
});
Deno.test('each central medium base unlocks after destroying any one of its three linked small bases',()=>{
 for(const side of [0,1])for(const child of [4,5,7]){
  const {r,p}=match();start(r,p);
  const attacker=p.find(p=>p.side!==side);
  const medium=r.bases.find(b=>b.id===`${side}-8`);
  const small=r.bases.find(b=>b.id===`${side}-${child}`);
  eq(medium.links,[4,5,7].map(id=>`${side}-${id}`));
  ok(medium.links.every(id=>r.bases.some(b=>b.id===id&&b.side===side&&b.tier==='small')));
  const stage=(base,now)=>{
   Object.assign(attacker,{x:base.x,y:base.y});
   for(const base of r.bases)base.fireAt=Infinity;
   r.siegeBases(now);r.siegeBases(now+1000);
  };
  stage(medium,3000);eq(medium.hp,80);
  small.hp=1;stage(small,4000);
  eq([small.side,small.hp,small.flagSide],[side,0,attacker.side]);
  eq([attacker.earned,r.score[attacker.side],r.score[side]],[31,321,259]);
  ok(!r.inBaseFireRange(small));
  stage(medium,5000);eq(medium.hp,attacker.baseCls==='summoner'?78.5:77.5);
  medium.hp=1;stage(medium,6000);
  eq([medium.side,medium.hp,attacker.earned,r.score[attacker.side],r.score[side]],[side,0,83,353,197]);
 }
});
Deno.test('balanced rooms start at 1v1 and 5v5; 15 minutes, draw on tie',()=>{
 for(const n of [2,10]){
  const {r,p}=match(n);eq(r.canStart(),false);
  start(r,p);eq(r.ends,15*60_000);eq(r.score,[300,300]);eq(r.shadows.length,10);
  ok(r.shadows.every(b=>rareSpecies.includes(b.sp)&&b.lv===Math.round(10+(n-1)/2)&&fits(b.x,b.y)));
  r.tick(12*60_000,0);eq(r.phase,'match');
  r.tick(MATCH_MS,0);eq(r.winner,-1);
 }
 const {r,p}=match(3);for(const u of p)r.command(u,{type:'ready',ready:true},0);
 eq(r.canStart(),false);
});
Deno.test('standing small and medium bases transfer net ownership points every thirty seconds',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 const small=r.bases.find(q=>q.side===b.side&&q.tier==='small');
 const medium=r.bases.find(q=>q.side===b.side&&q.tier==='medium');
 r.tick(30_000,0);eq(r.score,[300,300]);
 small.side=a.side;medium.side=a.side;
 r.tick(59_999,0);eq(r.score,[300,300]);
 r.tick(60_000,0);eq(r.score,[330,270]);
 r.tick(60_000,0);eq(r.score,[330,270]);
 small.side=b.side;
 r.tick(90_000,0);eq(r.score,[350,250]);
 eq([a.earned,b.earned],[0,0]);
});
Deno.test('archer siege hits for three HP every second, awards points, shows the warning, and never teleports',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const base=r.bases.find(base=>base.side===b.side&&base.tier==='small');
 base.fireAt=Infinity;
 Object.assign(a,{x:base.x,y:base.y,baseCls:'archer'});
 eq(siegeProfile(a),{range:250,effect:'archer'});
 r.siegeBases(3000);r.siegeBases(3199);eq(base.hp,60);
 eq(r.snapshot(b,3199).bases.find(x=>x.id===base.id).underAttack,true);
 eq(r.snapshot(a,3199).bases.find(x=>x.id===base.id).underAttack,false);
 r.siegeBases(3999);eq(base.hp,60);eq(r.score,[300,300]);
 r.siegeBases(4000);eq(base.hp,58.5);eq(r.score,[301,299]);eq(a.earned,1);eq([a.x,a.y],[base.x,base.y]);
 ok(r.baseEffects.some(e=>e.kind==='archer'));
 r.score[b.side]=1;r.siegeBases(4999);eq(r.score,[301,1]);
 r.siegeBases(5000);eq(r.score,[302,0]);eq(r.phase,'match');
 r.tick(MATCH_MS-1,0);eq(r.phase,'match');
 r.tick(MATCH_MS,0);eq(r.winner,a.side);eq(r.reason,'time');
});
Deno.test('archer and gunner share the turret boundary at 250 units',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const base=r.bases.find(q=>q.side===b.side&&q.tier==='small');
 r.bases=[base];
 Object.assign(a,{x:base.x-251,y:base.y,baseCls:'archer'});
 ok(clearPath(a,base));
 r.siegeBases(3000);eq(a.siege,undefined);
 a.x++;
 r.siegeBases(3100);r.siegeBases(4100);
 eq(base.hp,58.5);ok(a.hp<a.maxHp);
 eq(siegeProfile({baseCls:'gunner'}).range,siegeProfile(a).range);
});
Deno.test('friendly small and medium tower alerts are distinct from main base alerts and do not repeat during continuous damage',()=>{
 for(const tier of ['small','medium','large']){
  const {r,p:[attacker,defender]}=match();start(r,r.players);
  const base=r.bases.find(b=>b.side===defender.side&&b.tier===tier);
  const clip=tier==='large'?'base-under-attack':'tower-under-attack';
  r.damageBase(base,attacker,3000);
  r.damageBase(base,attacker,4000);
  r.damageBase(base,attacker,5000);
  eq(r.announcer.forPlayer(defender,5000).map(e=>e.clip),[clip]);
  eq(r.announcer.forPlayer(attacker,5000),[]);
  delete attacker.siege;
  r.damageBase(base,attacker,7000);
  r.damageBase(base,attacker,8000);
  eq(r.announcer.forPlayer(defender,8000).map(e=>e.clip),[clip,clip]);
 }
});
Deno.test('each extra attacker independently deals two HP without infantry and earns points every second',()=>{
 for(const [count,damage] of [[1,6],[2,12],[3,18]]){
  const {r,p}=match(6);start(r,p);
  const base=r.bases.find(b=>b.side===1&&b.tier==='small');
  r.bases=[base];base.fireAt=Infinity;
  const attackers=p.filter(u=>u.side===0).slice(0,count);
  for(const u of attackers)Object.assign(u,{x:base.x,y:base.y,baseCls:'swordsman'});
  for(let time=3000;time<=6000;time+=25)r.siegeBases(time);
  eq(base.hp,60-damage);eq(r.score,[300+3*count,300-3*count]);
  eq(attackers.map(u=>u.earned),Array(count).fill(3));
 }
});
Deno.test('small and medium base destruction gives every teammate a separate personal bonus',()=>{
 for(const [tier,personal,finisher,loss] of [['small',10,20,40],['medium',20,30,60],['large',0,50,100]]){
  const {r,p:[attacker,enemy,teammate,enemyAlly]}=match(4);start(r,r.players);
  const base=r.bases.find(b=>b.side===enemy.side&&b.tier===tier);
  base.hp=1;
  r.damageBase(base,attacker,3000);
  r.damageBase(base,attacker,4000);
  r.damageBase(base,attacker,5000);
  eq([attacker.earned,teammate.earned,enemy.earned,enemyAlly.earned],[1+finisher+personal,personal,0,0]);
  eq(r.score,[301+finisher,299-loss]);
 }
});
Deno.test('siege transfers one point per second for every base tier',()=>{
 for(const tier of ['small','medium','large']){
  const {r,p:[a,b]}=match();start(r,[a,b]);
  const base=r.bases.find(q=>q.side===b.side&&q.tier===tier);
  base.links=[];base.fireAt=Infinity;r.bases=[base];
  Object.assign(a,{x:base.x,y:base.y,baseCls:'thief'});
  r.siegeBases(3000);r.siegeBases(3999);
  eq(base.hp,base.maxHp);eq(a.earned,0);
  r.siegeBases(4000);
  eq(a.earned,1);eq(r.score,[301,299]);
 }
});
Deno.test('gladiator and thief stack both tower damage penalties without reducing score',()=>{
 for(const career of ['gladiator','thief']){
  const {r,p:[a,b]}=match();start(r,[a,b]);
  const base=r.bases.find(q=>q.side===b.side&&q.tier==='small');
  base.hp=2;base.fireAt=Infinity;r.bases=[base];
  Object.assign(a,{x:base.x,y:base.y,baseCls:career});
  r.siegeBases(3000);r.siegeBases(3999);eq(base.hp,2);
  r.siegeBases(4000);eq(base.hp,1);eq(r.score,[301,299]);
  r.siegeBases(5000);eq([base.side,base.hp],[b.side,0]);eq(r.score,[322,258]);
 }
});
Deno.test('base projectile locks the nearest sealer and hits even after they leave its range',()=>{
 const {r,p:[a,b,c]}=match(4);start(r,r.players);
 const base=r.bases.find(base=>base.side===b.side&&base.main);
 r.bases=[base];
 Object.assign(a,{x:base.x+70,y:base.y,baseCls:'gladiator'});
 Object.assign(c,{x:base.x+120,y:base.y});
 const {hp,maxHp}=a;
 r.siegeBases(3000);eq(r.baseBolts[0].target.id,a.id);
 a.x+=400;
 r.siegeBases(3000+BASE_BOLT_MS);ok(Math.abs(a.hp-(hp-maxHp*.08))<.001);
 eq(c.hp,c.maxHp);
});
Deno.test('a fatal tower hit plays the victim’s gendered voice once, including on their death screen',()=>{
 for(const gender of ['female','male']){
  const {r,p:[victim,nearby,teammate,far]}=match(4);start(r,r.players);
  const base=r.bases.find(b=>b.side===nearby.side&&b.tier==='small');
  r.bases=[base];
  Object.assign(victim,{gender,x:base.x+200,y:base.y,hp:1});
  Object.assign(nearby,{x:base.x+250,y:base.y});
  Object.assign(teammate,{x:base.x+700,y:base.y});
  Object.assign(far,{x:base.x+700,y:base.y});
  r.siegeBases(3000);
  ok(r.baseEffects.every(e=>e.kind!=='tower-fall'));
  const impact=3000+BASE_BOLT_MS;
  r.siegeBases(impact);
  eq(victim.phase,'dead');
  for(const [player,viewer,hears] of [[victim,null,true],[nearby,nearby,true],[far,far,false]]){
   const played=[],audio=siegeAudio(key=>played.push(key),p=>p.gender);
   audio.sync(r.snapshot(player,impact),viewer);
   audio.sync(r.snapshot(player,impact+100),viewer);
   const voices=played.filter(key=>key.startsWith('fall-'));
   eq(voices.length,hears?1:0);
   if(hears)ok(new RegExp(`^fall-${gender}-[1-4]$`).test(voices[0]));
  }
 }
});
Deno.test('turrets shoot every two seconds and deal constant damage to repeat targets',()=>{
 const {r,p:[a,b,c]}=match(4);start(r,r.players);
 const base=r.bases.find(q=>q.side===b.side&&q.tier==='small');
 r.bases=[base];
 a.baseCls=c.baseCls='swordsman';
 // Keep targets inside turret range but outside their own siege range.
 const enter=(p,dx)=>Object.assign(p,{x:base.x+dx,y:base.y});
 enter(a,200);enter(c,400);
 const hp=a.hp,max=a.maxHp;
 const fire=at=>{r.siegeBases(at);r.siegeBases(at+BASE_BOLT_MS);};
 fire(3000);ok(Math.abs(a.hp-(hp-max*.08))<.001);
 r.siegeBases(4999);eq(r.baseBolts.length,0);
 enter(a,400);enter(c,200);
 fire(5000);ok(Math.abs(c.hp-c.maxHp*.92)<.001);
 enter(a,200);enter(c,400);
 fire(7000);ok(Math.abs(a.hp-(hp-max*(.08*2)))<.001);
 fire(9000);ok(Math.abs(a.hp-(hp-max*(.08*3)))<.001);
 enter(a,400);fire(11000);fire(13000);
 enter(a,200);fire(15000);
 ok(Math.abs(a.hp-(hp-max*(.08*4)))<.001);
 for(let shot=2;shot<=8;shot++){
  a.hp=max;
  fire(15000+(shot-1)*2000);
  ok(Math.abs(a.hp-max*(1-.08))<.001);
 }
});
Deno.test('base recall locks movement for five seconds and warps to the main base without restoring vitals',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 const at=cellCenter(15,21);
 Object.assign(a,at,{hp:a.maxHp-20,mp:2});
 const hp=a.hp,warp=a.warp;
 r.command(a,{type:'recallBase'},3000);
 r.command(a,{type:'move',seq:1,x:1,y:0},3200);
 r.command(a,{type:'recallBase'},4500);
 r.tick(7999,.05);
 eq([a.x,a.y,a.recallEndsAt],[at.x,at.y,8000]);
 eq(r.snapshot(a,7999).players.find(p=>p.id===a.id).recallEndsAt,8000);
 r.tick(8000,.05);
 eq([a.x,a.y,a.hp,a.mp,a.warp,a.recallEndsAt],[a.spawn.x,a.spawn.y,hp,2,warp+1,undefined]);
});
Deno.test('manual cancellation and encounters with players, shadows or bosses prevent an active recall',()=>{
 for(const reason of ['manual','player','shadow','boss']){
  const {r,p:[a,b]}=match();start(r,[a,b]);
  const at=cellCenter(15,21);Object.assign(a,at);
  const shadow=r.shadows[0];
  r.shadows=reason==='shadow'?[shadow]:[];
  if(reason==='shadow')Object.assign(shadow,at,{home:at});
  if(reason==='boss'){r.rotateBosses(BOSS_INTERVAL);Object.assign(r.bosses[0],at);}
  if(reason==='player')Object.assign(b,at);
  r.command(a,{type:'recallBase'},3000);
  if(reason==='manual')r.command(a,{type:'cancelRecall'},7999);
  r.tick(8000,0);
  eq(a.recallEndsAt,undefined);
  eq([a.x,a.y,a.phase],[at.x,at.y,reason==='manual'?'walk':'battle']);
 }
});
Deno.test('thieves gain PvP damage only against eligible sealers',()=>{
 const {r}=match();
 const a=r.join({name:'Thief',cls:'thief',lv:25,botCareer:true});
 const gunner=r.join({name:'Gunner',cls:'gunner',lv:25,botCareer:true});
 const gladiator=r.join({name:'Gladiator',cls:'gladiator',lv:25,botCareer:true});
 const druid=r.join({name:'Druid',cls:'druid',lv:25,botCareer:true});
 const core=globalThis.SoulbeastColosseumEngine(),random=Math.random;
 const damage=(opponent,teamSiege,pet=false)=>{
  const b=makeCombat('career',[[a],[opponent]],null,3000,new Map(),teamSiege);
  const attacker=b.allies[0],target=b.enemies[pet?1:0];
  attacker.st.patk=180;
  attacker.st.matk=180;
  attacker.st.acc=500;
  target.hp=3000;
  core.bind(b);
  ok(core.act(attacker,'attack',target,attacker,true));
  ok(target.hp<3000,b.log.join(' | '));
  return 3000-target.hp;
 };
 try{
  Math.random=()=>.5;
  eq(damage(druid,true),damage(druid,false));
  const normal=damage(gunner,false);
  const boosted=damage(gunner,true);
  ok(Math.abs(boosted-normal*1.15)<=1,`expected 15% more than ${normal}, got ${boosted}; thief line ${a.baseCls}`);
  eq(damage(gladiator,true),damage(gladiator,false));
  eq(damage(gunner,true,true),damage(gunner,false,true));
 }finally{Math.random=random;}
});
Deno.test('entering combat cancels the turret projectile and hides the sealer until they return to the same spot',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 const base=r.bases.find(base=>base.side===b.side&&base.tier==='small');
 r.bases=[base];
 Object.assign(a,{x:base.x,y:base.y});Object.assign(b,{x:base.x+70,y:base.y});
 const hp=a.hp;
 r.siegeBases(3000);eq(r.baseBolts[0].target,a);
 r.encounter(a,b,3050);
 const battle=r.battles.get(a.battle);
 eq(r.baseBolts.length,0);
 r.siegeBases(3500);eq(base.hp,60);eq(a.hp,hp);
 const teammate=r.snapshot(b,3500).players.find(p=>p.id===a.id);
 eq(teammate.x,undefined);eq(teammate.mapX,undefined);
 Object.assign(battle,{finished:true,releasedAt:4000});
 r.tick(4000,0);eq(a.phase,'walk');eq([a.x,a.y],[base.x,base.y]);
});
Deno.test('shadows spawn outside turret range and creatures cannot cross through a 250-unit turret zone',()=>{
 const {r,p}=match();start(r,p);
 ok(r.shadows.every(beast=>!r.inBaseFireRange(beast)));
 const marked=[[7,7],[5,17],[11,27],[5,39],[9,1]];
 for(const [side,mirror] of [false,true].entries())for(const [i,[x,y]] of marked.entries()){
  const beast=r.shadows.find(shadow=>shadow.id===`s${side}${i}`);
  eq([Math.floor(beast.x/CELL),Math.floor(beast.y/CELL)],[mirror?COLS-1-x:x,y]);
  ok(fits(beast.x,beast.y));
 }
 const base=r.bases[0];
 r.bases=[base];
 const beast={x:base.x+251,y:base.y};
 beast.home={...beast};
 const target={x:base.x,y:base.y};
 ok(!r.beastPathAllowed(beast,target));
 ok(!r.beastPathAllowed({x:base.x-251,y:base.y},beast));
 r.moveBeast(beast,target,.1,200);
 ok(!r.inBaseFireRange(beast));
});
Deno.test('merchant stays put and earns one personal point per four seconds of active repair within 70 units',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 const base=r.bases.find(x=>x.side===a.side&&x.tier==='small');
 base.hp=55;Object.assign(a,{x:base.x,y:base.y});
 let denied=false;
 try{r.command(a,{type:'repairBase',id:base.id},3000);}catch{denied=true;}
 ok(denied);a.baseCls='merchant';
 a.x=base.x+71;
 denied=false;
 try{r.command(a,{type:'repairBase',id:base.id},3000);}catch{denied=true;}
 ok(denied);a.x=base.x+70;
 r.command(a,{type:'repairBase',id:base.id},3000);
 r.command(a,{type:'move',seq:2,x:1,y:0},3300);
 r.tick(5499,.05);eq(base.hp,55);eq(a.x,base.x+70);
 r.tick(5500,.05);eq(base.hp,56);eq(a.earned,0);
 r.tick(6999,0);eq(a.earned,0);
 r.tick(7000,0);eq(a.earned,1);
 r.tick(7999,0);eq(base.hp,56);eq(a.earned,1);
 r.tick(8000,0);eq(base.hp,57);eq(a.earned,1);
 r.command(a,{type:'stopRepair'},8500);
 r.tick(9000,0);eq(base.hp,57);
 r.command(a,{type:'repairBase',id:base.id},10000);
 r.tick(17499,0);eq(base.hp,59);
 r.tick(17500,0);eq(base.hp,60);eq(a.repair,undefined);eq(a.earned,2);eq(r.score,[300,300]);
});
Deno.test('every friendly base restores walking sealers and revives their pets at its tier rate',()=>{
 for(const [tier,ratio] of [['small',.03],['medium',.06],['large',.09]]){
  const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
  const base=r.bases.find(x=>x.side===a.side&&x.tier===tier);
  r.bases=[base];Object.assign(a,{x:base.x,y:base.y,hp:a.maxHp/2,mp:0,ailments:{poison:2}});
  const pet=a.petVitals.values().next().value;pet.hp=pet.mp=0;
  r.siegeBases(3000);r.siegeBases(3999);eq(pet.hp,0);
  r.siegeBases(4000);
  ok(Math.abs(a.hp-a.maxHp*(.5+ratio))<.001);
  eq([a.mp,pet.hp,pet.mp],[a.maxMp*ratio,pet.maxHp*ratio,pet.maxMp*ratio]);
  eq(a.ailments,{poison:2});
  eq(r.snapshot(a,4000).players.find(p=>p.id===a.id).healUntil,4850);
  eq(r.snapshot(a,4850).players.find(p=>p.id===a.id).healUntil,undefined);
 }
});
Deno.test('a raider bot holds its attack position and damages a base through the same siege ticks',()=>{
 const {r,p:[human]}=match(1),bot=r.addBot(1,10);
 start(r,r.players);r.shadows=[];
 const base=r.bases.find(b=>b.side===human.side&&b.tier==='small');
 spawnInfantry(r,1);
 const support=r.infantry.find(unit=>unit.side===bot.side);
 Object.assign(support,{x:base.x,y:base.y});
 r.infantry=[support];
 Object.assign(bot,{x:base.x,y:base.y});
 Object.assign(bot.bot,{goal:{type:'raid',point:base},planAt:9000});
 r.tick(3000,0);r.tick(4000,0);
 ok(base.hp<base.maxHp);eq(bot.x,base.x);
});
Deno.test('a merchant guarding a damaged base draws the bot into PvP before any siege damage',()=>{
 const {r,p:[human]}=match(1),bot=r.addBot(1,10);
 start(r,r.players);r.shadows=[];
 const base=r.bases.find(b=>b.side===human.side&&b.tier==='small');
 spawnInfantry(r,1);
 const support=r.infantry.find(unit=>unit.side===bot.side);
 Object.assign(support,{x:base.x,y:base.y});
 r.infantry=[support];
 base.hp=40;
 Object.assign(human,{x:base.x-34,y:base.y,baseCls:'merchant'});
 Object.assign(bot,{x:base.x+34,y:base.y});
 Object.assign(bot.bot,{goal:{type:'raid',point:base},planAt:9000});
 r.command(human,{type:'repairBase',id:base.id},3000);
 r.tick(3050,0);eq(bot.battle,human.battle);ok(bot.battle);
 eq(base.hp,40);eq(r.score,[300,300]);eq(human.repair.pausedAt,3050);
});
Deno.test('a raider clears enemy infantry first and waits for its wave to enter tower range',()=>{
 const {r,p:[human]}=match(1),bot=r.addBot(1,10);
 start(r,r.players);
 r.shadows=[];r.chests=[];
 human.phase='battle';
 const base=r.bases.find(b=>b.id==='0-7');
 for(const fort of r.bases)fort.fireAt=Infinity;
 spawnInfantry(r,1);
 const wave=r.infantry.find(unit=>unit.side===bot.side&&unit.lane===4);
 const enemy=r.infantry.find(unit=>unit.side===human.side);
 r.infantry=[wave,enemy];
 bot.bot.role='raider';
 Object.assign(bot,{baseCls:'archer',x:base.x+120,y:base.y});
 Object.assign(enemy,{x:base.x+55,y:base.y,hp:4});
 Object.assign(wave,{x:base.x+275,y:base.y});
 r.tick(3000,0);r.tick(4000,0);
 eq(enemy.hp,0);eq(base.hp,base.maxHp);
 r.tick(5000,0);r.siegeBases(6000);
 eq(bot.bot.goal.type,'followInfantry');eq(base.hp,base.maxHp);
 wave.x=base.x+100;
 r.tick(7000,0);r.tick(8000,0);
 eq(bot.bot.goal.type,'raid');eq(base.hp,base.maxHp-3);
 wave.hp=0;
 r.tick(9000,0);r.tick(10_000,0);
 eq(base.hp,base.maxHp-3);
});

Deno.test('a merchant bot defends a threatened fort and repairs once the infantry is gone',()=>{
 const {r,p:[human]}=match(1),bot=r.addBot(1,10);
 start(r,r.players);
 r.shadows=[];r.chests=[];
 human.phase='battle';
 const base=r.bases.find(b=>b.id==='1-7');
 for(const fort of r.bases)fort.fireAt=Infinity;
 spawnInfantry(r,1);
 const enemy=r.infantry.find(unit=>unit.side===human.side&&unit.lane===4);
 r.infantry=[enemy];
 Object.assign(bot,{baseCls:'merchant',x:base.x,y:base.y});
 Object.assign(enemy,{x:base.x-50,y:base.y,hp:4,waypoint:enemy.path.findIndex(point=>point.baseId===base.id)});
 base.hp-=5;
 r.tick(3000,0);
 eq(bot.bot.defense?.type,'fightInfantry');
 eq(bot.repair,undefined);
 r.tick(4000,0);eq(enemy.hp,0);
 r.tick(5000,0);eq(bot.repair?.baseId,base.id);
 r.tick(7500,0);eq(base.hp,base.maxHp-4);
});

Deno.test('team defense sends the first bot able to reach the approaching wave',()=>{
 const {r}=match(1), nearby=r.addBot(1,10), ranged=r.addBot(1,10);
 r.join({name:'Ally',cls:'mage',lv:10},null,0);
 start(r,r.players);
 const fort=r.bases.find(b=>b.id==='1-7');
 spawnInfantry(r,1);
 const soldier=r.infantry.find(unit=>unit.side===0&&unit.lane===4);
 r.infantry=[soldier];r.shadows=[];r.chests=[];
 for(const b of r.bases)b.fireAt=Infinity;
 Object.assign(soldier,{x:fort.x-265,y:fort.y,waypoint:soldier.path.findIndex(p=>p.baseId===fort.id)});
 Object.assign(nearby,{baseCls:'swordsman',x:fort.x-150,y:fort.y});
 Object.assign(ranged,{baseCls:'archer',x:fort.x-45,y:fort.y});
 r.tick(3000,0);
 eq(nearby.bot.defense,undefined);
 eq(ranged.bot.defense?.point,soldier);
 eq(ranged.bot.defense?.fort,fort);
 eq(fort.hp,fort.maxHp);
 r.tick(4000,0);
 eq(soldier.hp,36);
});

Deno.test('merchant takes a safe chest along the repair route, then resumes repairs',()=>{
 const {r}=match(1),bot=r.addBot(1,10);
 start(r,r.players);
 const fort=r.bases.find(b=>b.id==='1-7');
 const chest={id:'detour',x:fort.x-140,y:fort.y,points:10,opened:false};
 r.chests=[chest];r.shadows=[];
 Object.assign(bot,{baseCls:'merchant',x:fort.x-145,y:fort.y});
 fort.hp=fort.maxHp-10;
 r.tick(3000,0);
 ok(chest.opened);eq(bot.earned,15);
 bot.x=fort.x-40;
 r.tick(3250,0);
 eq(bot.repair?.baseId,fort.id);
});

Deno.test('a summoner bot moves into heal range and supports a wounded allied soldier',()=>{
 const {r,p:[human]}=match(1),bot=r.addBot(1,10);
 start(r,r.players);
 r.shadows=[];r.chests=[];
 human.phase='battle';
 const base=r.bases.find(b=>b.id==='1-7');
 spawnInfantry(r,1);
 const ally=r.infantry.find(unit=>unit.side===bot.side&&unit.lane===4);
 r.infantry=[ally];
 Object.assign(bot,{baseCls:'summoner',x:base.x-190,y:base.y});
 Object.assign(ally,{x:base.x,y:base.y,hp:30,waypoint:ally.path.length});
 r.tick(3000,0);
 eq(bot.bot.goal.type,'healInfantry');eq(bot.bot.goal.point,ally);
 eq(ally.hp,30);
 bot.x=base.x-175;
 r.tick(4000,0);r.tick(5000,0);
 eq(ally.hp,32);
});

Deno.test('a repairing defender in battle cannot block another player from hitting the base',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const base=r.bases.find(q=>q.side===b.side&&q.tier==='small');
 r.bases=[base];base.hp=base.maxHp-1;base.fireAt=Infinity;
 Object.assign(b,{x:base.x,y:base.y,baseCls:'merchant'});
 r.command(b,{type:'repairBase',id:base.id},3000);
 b.phase='battle';
 Object.assign(a,{x:base.x,y:base.y});
 r.siegeBases(3000);r.siegeBases(4000);
 eq(base.hp,base.maxHp-2.5);eq(r.score,[301,299]);
});
Deno.test('team movement runs at 200 and archer and thief at 240 with half speed in bushes',()=>{
 const bush=BUSHES[0];
 for(const [cls,speed] of [['mage',200],['thief',240],['archer',240]]){
  const open={...cellCenter(5,21),baseCls:cls};
  const inside={...cellCenter(bush.x,bush.y),baseCls:cls};
  for(const [p,expected] of [[open,speed],[inside,speed/2]]){
   const start=p.x;
   movePlayer(p,1,0,.1);
   ok(Math.abs(p.x-start-expected*.1)<.001);
  }
 }
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
Deno.test('PvP base aura is inclusive at 300 from the collision midpoint and requires a standing friendly base',()=>{
 for(const [range,hp,active] of [[300,4,10],[301,4,0],[300,0,0]]){
  const {r,p:[a,b]}=match();start(r,[a,b]);
  const base=r.bases.find(x=>x.side===a.side&&x.tier==='small');base.hp=hp;r.bases=[base];
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
 const fight=r.battles.get(a.battle), reference=makeCombat('no-aura',[[a],[]],shadow,3000,new Map(),true);
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
 const referenceBoss=makeCombat('boss-reference',[[a],[]],boss,BOSS_INTERVAL,new Map(),true);
 checkAura(bossFight.enemies[0],referenceBoss.enemies[0],0);
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
Deno.test('team minimap shares sight from active allies, infantry and living forts without sharing scene coordinates',()=>{
 const {r,p:[a,b,ally]}=match(4);start(r,r.players);
 Object.assign(a,{x:0,y:0});
 Object.assign(ally,{x:2000,y:0});
 Object.assign(b,{x:2300,y:0});
 const friend={id:'our-soldier',side:a.side,x:5000,y:0,hp:40};
 const enemy={id:'enemy-soldier',side:b.side,x:5300,y:0,hp:40};
 r.infantry=[friend,enemy];
 const fort={...r.bases[0],side:a.side,x:7000,y:0};
 r.bases=[fort];
 r.shadows=[{id:'shadow',x:7300,y:0,phase:'walk'},{id:'out-of-range',x:7301,y:0,phase:'walk'}];
 r.bosses=[{id:'boss',x:7275,y:0,phase:'walk'}];
 const get=()=>r.snapshot(a,3000);
 const markers=()=>new Map(get().mapUnits.map(unit=>[unit.id,unit.kind]));
 const visible=markers();
 eq(visible.get(b.id),'sealer');
 eq(visible.get(friend.id),'infantry');eq(visible.get(enemy.id),'infantry');
 eq(visible.get('shadow'),'shadow');eq(visible.get('boss'),'boss');
 ok(!visible.has('out-of-range'));
 const view=get();
 eq(view.players.find(p=>p.id===b.id).x,undefined);
 eq(view.infantry,[]);eq(view.shadows,[]);eq(view.bosses,[]);
 ally.phase='battle';friend.hp=0;fort.hp=0;
 for(const id of [b.id,friend.id,enemy.id,'shadow','boss'])ok(!markers().has(id));
});
Deno.test('waiting to respawn can spectate living allies and returns to the player on respawn',()=>{
 const {r,p:[a,b,ally,enemy,other]}=match(6);start(r,r.players);
 r.fall(a,3000);
 eq(r.snapshot(a,3000).spectating,ally.id);
 r.command(a,{type:'spectate',target:b.id},3001);
 eq(r.snapshot(a,3001).spectating,ally.id);
 r.command(a,{type:'spectate',target:other.id},3002);
 eq(r.snapshot(a,3002).spectating,other.id);
 r.encounter(other,enemy,3010);
 ok(r.viewedBattle(a));
 eq(r.battleSnapshot(a).commands,[]);
 r.respawn(a,a.respawnAt);
 eq(r.snapshot(a,13_000).spectating,undefined);
 eq(r.viewedBattle(a),null);
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
 eq(r.score[1],270);eq(b.phase,'dead');eq(b.respawnAt,14_000);
 r.tick(14_000-1,0);eq(b.phase,'dead');
 r.tick(14_000,0);eq(b.phase,'walk');eq({x:b.x,y:b.y},b.spawn);
});
Deno.test('team respawn time is fixed at death and increases at each elapsed minute',()=>{
 for(const [elapsed,delay] of [[0,10_000],[59_999,10_000],[60_000,15_000],[120_000,20_000],[899_999,80_000]]){
  const {r,p:[a,b]}=match();
  const started=30_000;
  r.start(started);
  ok(r.baseEffects.every(e=>e.kind!=='respawn'));
  const death=started+elapsed;
  r.fall(a,death);
  eq(r.snapshot(a,death).respawnAt,death+delay);
  if(elapsed===59_999){
   const pets=[...a.petVitals.values()];
   ok(pets.length>=2);
   pets.forEach((pet,index)=>{pet.hp=index===0?0:1;});
   r.tick(death+delay-1,0);eq(a.phase,'dead');eq(pets[0].hp,0);
   r.tick(death+delay,0);eq(a.phase,'walk');
   ok(pets.every(pet=>pet.hp===pet.maxHp));
   const played=[],audio=siegeAudio(key=>played.push(key),p=>p.gender);
   audio.sync(r.snapshot(a,death+delay),a);
   audio.sync(r.snapshot(a,death+delay+100),a);
   eq(played.filter(key=>key==='respawn'),['respawn']);
  }
 }
});
Deno.test('team warp pads lock movement for five seconds and reject or cancel destroyed destinations',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 const small=r.bases.filter(base=>base.side===a.side&&base.tier==='small');
 const enemy=r.bases.find(base=>base.side!==a.side&&base.tier==='small');
 const pad=WARP_PADS[a.side];
 for(const point of WARP_PADS)ok(fits(point.x,point.y));
 const warp=(base,at)=>r.command(a,{type:'warpSmallBase',id:base.id},at);
 const denied=(base,at)=>{try{warp(base,at);return false;}catch{return true;}};
 ok(denied(small[0],3000));
 Object.assign(a,pad,{hp:a.maxHp/2});
 ok(denied(enemy,3000));
 warp(small[0],3000);
 r.command(a,{type:'move',seq:1,x:1,y:0},4000);
 r.tick(7999,.05);eq([a.x,a.y],[pad.x,pad.y]);
 eq(r.snapshot(a,7999).players.find(q=>q.id===a.id).recallEndsAt,8000);
 r.tick(8000,0);eq([a.x,a.y],[small[0].x,small[0].y]);
 Object.assign(a,pad);warp(small[1],8100);
 r.command(a,{type:'cancelRecall'},8200);
 eq(a.recallEndsAt,undefined);
 warp(small[1],8300);small[1].hp=1;
 r.damageBase(small[1],b,8400);r.damageBase(small[1],b,9400);
 eq(small[1].hp,0);eq(a.recallEndsAt,undefined);
 ok(denied(small[1],9500));
 r.tick(13300,0);eq([a.x,a.y],[pad.x,pad.y]);
});
Deno.test('five players spawn in front of each capital and warp together from both pads without stacking',()=>{
 const {r,p}=match(10);start(r,p);
 const points=players=>players.map(({x,y})=>({x,y}));
 function checkSpacing(positions,gap){
  for(const [i,point] of positions.entries()){
   ok(fits(point.x,point.y));
   for(const other of positions.slice(i+1))ok(distance(point,other)>=gap);
  }
 }
 const starts=points(p);
 for(const side of [0,1]){
  const team=p.filter(player=>player.side===side);
  const capital=r.bases.find(base=>base.main&&base.side===side);
  const pad=WARP_PADS[side],mirror=side?-1:1;
  eq(team.length,5);
  eq(new Set(team.map(player=>player.y)).size,3);
  ok(Math.abs(pad.x-capital.x)-WARP_PAD_RANGE-225/2>=40);
  for(const player of team){
   ok((player.y-capital.y)*FLAT>=150);
   ok(Math.abs(player.x-pad.x)-WARP_PAD_RANGE>=90);
   ok(!WARP_ACCESS(player,r.bases));
  }
  checkSpacing(points(team),85);
  const destinations=r.bases.filter(base=>base.tier==='small');
  for(const base of destinations)checkSpacing(team.map(player=>warpArrival(player,base)),2*RADIUS);
  const landing=destinations.find(base=>base.side===side);
  const positions=[[-100,0],[-50,-42],[0,42],[50,-42],[100,0]].map(([dx,dy])=>({x:pad.x+mirror*dx,y:pad.y+dy/FLAT}));
  checkSpacing(positions,65);
  for(const [i,player] of team.entries()){
   Object.assign(player,positions[i]);
   ok(WARP_ACCESS(player,r.bases));
   r.command(player,{type:'warpSmallBase',id:landing.id},3000);
   eq(player.recallEndsAt,3000+BASE_RECALL_MS);
  }
 }
 r.tick(3000+BASE_RECALL_MS,0);
 for(const side of [0,1]){
  const team=p.filter(player=>player.side===side);
  checkSpacing(points(team),2*RADIUS);
  for(const player of team)r.command(player,{type:'recallBase'},9000);
 }
 r.tick(9000+BASE_RECALL_MS,0);
 eq(points(p),starts);
 for(const player of p){player.phase='dead';r.respawn(player,15000);}
 eq(points(p),starts);
});
Deno.test('mage deals 2.5 HP per second while summoner and druid deal 1.5 without infantry',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const base=r.bases.find(q=>q.side===b.side&&q.tier==='small');
 for(const cls of ['mage','summoner','druid']){
  delete a.siege;a.baseCls=cls;base.hp=60;
  r.damageBase(base,a,3000);r.damageBase(base,a,4000);
  eq(base.hp,cls==='mage'?57.5:58.5);
 }
});
Deno.test('team streak callouts include both triple and its milestone and reset on falling',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const clips=['Killing Spree!','Rampage!','Dominating','Unstoppable','Godlike!','Legendary','Divine Annihilator!!!'];
 for(let n=1;n<=9;n++){
  const at=4000+(n-1)*20_000;
  r.announcer.fall(b,a,at,false);
  const calls=r.announcer.forPlayer(b,at).map(e=>e.clip);
  if(n===2)ok(calls.includes('double-kill'));
  if(n===3)ok(calls.includes('triple-kill')&&calls.includes('killing-spree'));
  if(n>=3){
   eq(r.announcer.title(a),clips[n-3]);
   eq(r.announcer.bonuses(a,b,false).shutdown,(n-2)*5);
  }
 }
 a.earned=200;
 r.fall(a,180000,'',b);
 eq(a.earned,80); // 55% shutdown and 5 percentage points for revenge
 eq(r.announcer.title(a),undefined);
 eq(r.announcer.forPlayer(b,180000).map(e=>e.clip),['shutdown','revenge']);
});
Deno.test('revenge adds 5 percent to kill credit once and stale multi-kills restart',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 r.announcer.fall(a,b,3000,false);
 r.announcer.fall(b,a,4000,false);
 r.announcer.fall(b,a,24001,false);
 ok(!r.announcer.forPlayer(a,24001).some(e=>e.clip==='double-kill'));
 r.announcer.fall(a,b,25000,false);
 a.earned=0;b.earned=200;
 r.encounter(a,b,26000);
 const fight=r.battles.get(a.battle);
 const victim=fight.enemies.find(u=>u.kind==='player');
 victim.hp=0;fight.fallen.push(b.id);
 fight.colosseumFalls.set(victim.id,fight.roster.indexOf(a.id));
 r.recordFalls(fight,26001);r.recordFalls(fight,26002);
 eq([a.earned,b.earned,a.kills],[42,150,1]);
});
Deno.test('team knockout awards the victim score percentage or class minimum and deducts 20 percent from the victim',()=>{
 for(const [career,points,victimPoints,personal] of [['swordsman',20,1,20],['thief',30,0,30],['swordsman',20,209,41],['thief',30,209,52]]){
  const {r,p:[a,b]}=match();start(r,[a,b]);
  a.baseCls=career;b.earned=victimPoints;
  r.encounter(a,b,3000);
  const battle=r.battles.get(a.battle),target=battle.enemies.find(u=>u.sealer===b.id&&u.kind==='player');
  target.hp=0;
  battle.fallen.push(b.id);
  battle.colosseumFalls.set(target.id,battle.roster.indexOf(a.id));
  r.recordFalls(battle,3100);r.recordFalls(battle,3200);
  eq(r.score,[300+points,270]);eq(a.earned,personal);eq(a.kills,1);
  eq(b.earned,Math.floor(victimPoints*.8));eq(b.deaths,1);
  const board=r.snapshot(b,3200).players.find(p=>p.id===a.id);
  eq([board.points,board.kills,board.deaths],[personal,1,0]);
  r.finish(0,'time',4000);
  const result=r.snapshot(a,4000).results[0][0];
  eq([result.points,result.kills,result.beastKills,result.bossKills,result.deaths],[personal,1,0,0,0]);
 }
});
Deno.test('personal points boost only the sealer and cap at 60 percent',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const base=r.bases.find(q=>q.side===a.side&&q.tier==='small');
 r.bases=[base];
 Object.assign(a,{x:base.x,y:base.y,earned:425});
 Object.assign(b,{x:base.x,y:base.y,earned:29});
 r.encounter(a,b,3000);
 const fight=r.battles.get(a.battle);
 const stats=['patk','matk','pdef','mdef'];
 for(const [side,profile,bonus,aura] of [[fight.allies,a,.60,.10],[fight.enemies,b,.05,0]]){
  const reference=demoProfile(profile,0);
  for(const [i,unit] of side.entries())for(const stat of stats){
   const factor=(1+aura)*(unit.kind==='player'?1+bonus:1);
   ok(Math.abs(unit.st[stat]-reference[i].st[stat]*factor)<.00001);
  }
 }
 eq([0,4,5,299,300,999].map(personalCombatBonus),[0,0,1,59,60,60]);
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
Deno.test('a team battle bot can summon a golem when its own group still has a slot',()=>{
 const {p:[summoner,mage,ally,foe]}=match(4);
 const b=makeCombat('golem',[[{...summoner,bot:{}},ally],[mage,foe]],null,0,new Map(),true);
 const hero=b.allies[0];
 ok(b.allies.length>4);
 b.cur=hero.id;
 b.openAt=0;
 b.deadline=500;
 advanceCombat(b,500);
 eq(b.last.skillId,'summon_golem');
 const golem=b.allies.find(u=>u.kind==='summon');
 eq([golem.sp,golem.owner],['bastion_golem',hero.owner]);
 ok(b.queue.includes(golem.id)||b.cur===golem.id);
});
Deno.test('team Colosseum merchants hire without affecting character gold, manually and as bots',()=>{
 for(const automated of [false,true]){
  const merchant={id:'merchant',name:'Merchant',cls:'merchant',lv:20,gold:4321,...(automated?{bot:{}}:{})};
  const rival={id:'foe',name:'Opponent',cls:'mage',lv:20};
  const b=makeCombat('hire',[[merchant],[rival]],null,0,new Map(),true);
  const human=b.allies[0];
  b.cur=human.id;b.openAt=0;b.deadline=500;
  const order={turn:b.turn,skill:'hire_merc',target:b.enemies[0].id};
  if(automated)advanceCombat(b,500);
  else ok(combatAction(b,merchant.id,order,100));
  eq(b.last.skillId,'hire_merc');
  const hired=b.allies.find(u=>u.kind==='summon');
  eq([hired.name,hired.lv,hired.owner],['ทหารรับจ้าง',17,human.owner]);
  eq(merchant.gold,4321);
  const solo=makeCombat('hire-solo',[[merchant],[rival]],null,0);
  solo.cur=solo.allies[0].id;solo.openAt=0;solo.deadline=500;
  eq(combatAction(solo,merchant.id,{...order,turn:solo.turn,target:solo.enemies[0].id},100),false);
 }
});
Deno.test('walking HP is visible for nearby opponents and hidden for distant opponents',()=>{
 const {r,p:[a,b]}=match();
 start(r,[a,b]);
 Object.assign(a,cellCenter(15,21));
 Object.assign(b,{x:a.x+90,y:a.y,hp:12});
 const near=r.snapshot(a,3000).players.find(p=>p.id===b.id);
 eq([near.hp,near.maxHp],[12,b.maxHp]);
 b.x=a.x+1200;
 const far=r.snapshot(a,3000).players.find(p=>p.id===b.id);
 eq([far.hp,far.maxHp,far.x],[undefined,undefined,undefined]);
});
function autoDecisionBattle(cls,bot){
 const players=[[{id:'test-a',name:'A',cls,lv:45,...(bot?{bot:{}}:{})}],
  [{id:'test-b',name:'B',cls:'swordsman',lv:45}]];
 const battle=makeCombat('auto-audit',players,null,0,new Map(),true);
 const hero=battle.allies[0];
 battle.cur=hero.id;
 battle.openAt=0;
 battle.deadline=bot?500:12000;
 if(!bot)setCombatAuto(battle,'test-a',true);
 return {battle,hero};
}
Deno.test('gunners take opening priority, with speed deciding between them in either mode',()=>{
 for(const teamSiege of [true,false]){
  const players=[[{id:'a',name:'A',cls:'druid',lv:45}],[{id:'b',name:'B',cls:'gunner',lv:45}]];
  const make=()=>makeCombat('gunner-opening',players,null,0,new Map(),teamSiege);
  const slow=make();
  eq(slow.cur,slow.enemies[0].id);
  const nextRound=make();
  players[0][0]={...players[0][0],cls:'gunner',lv:60};
  const faster=make();
  eq(faster.cur,faster.allies[0].id);
  // The opening passive applies only in round one.
  const gunner=nextRound.enemies[0],fasterPet=nextRound.allies[1];
  gunner.st.spd=1;fasterPet.st.spd=10000;nextRound.queue=[];
  ok(combatAction(nextRound,'b',{turn:nextRound.turn,skill:'defend'},nextRound.openAt));
  eq([nextRound.round,nextRound.cur],[2,fasterPet.id]);
 }
});
Deno.test('manual and automatic rest, defend, and pet revival work in both modes',()=>{
 for(const teamSiege of [true,false])for(const control of ['manual','auto','bot']){
  function prepare(cls){
   const {battle,hero}=autoDecisionBattle(cls,control==='bot',teamSiege);
   if(control==='manual')setCombatAuto(battle,'test-a',false);
   return {battle,hero};
  }
  const act=(battle,id,target)=>{
   if(control==='manual'){
    const command=combatView(battle,'test-a').commands.find(skill=>skill.id===id);
    eq(command.targets,[target.id]);
    ok(combatAction(battle,'test-a',{turn:battle.turn,skill:id,target:target.id},0));
   }else advanceCombat(battle,500);
   eq(battle.last?.skillId,id);
  };
  const rest=prepare('mage');
  rest.hero.mp=0;
  act(rest.battle,'rest',rest.hero);
  eq(rest.hero.mp,Math.round(rest.hero.st.mp*.3));

  const defending=prepare('swordsman');
  // No effective attack gives the shared AI a reason to choose defend.
  defending.hero.skills=['rest'];
  act(defending.battle,'defend',defending.hero);
  eq(defending.hero.buffs.map(({st,amt,tn})=>[st,amt,tn]),[['pdef',.5,1],['mdef',.5,1]]);
  eq(combatView(defending.battle,'test-b').allies[0].badges.map(badge=>badge.icon),['⬟↑','◇↑']);

  const revival=prepare('summoner'),pet=revival.battle.allies[1];
  pet.hp=0;pet.status={burn:2};
  if(control==='manual'){
   const illegal={turn:revival.battle.turn,skill:'su_revive',target:revival.battle.enemies[0].id};
   eq(combatAction(revival.battle,'test-a',illegal,0),false);
  }
  act(revival.battle,'su_revive',pet);
  eq(pet.hp,Math.round(pet.st.hp*.4));eq(pet.status,{});
  ok(revival.battle.effects.some(effect=>effect.k==='heal'&&effect.id===pet.id));
 }
});
Deno.test('team revival restores companions of active sealers only',()=>{
 const player=(id,cls)=>({id,name:id,cls,lv:45});
 for(const auto of [false,true]){
  const battle=makeCombat('revive-party',[[player('a','soulsage'),player('b','mage')],[player('c','swordsman')]],null,0,new Map(),true);
  const [hero,...allies]=battle.allies;
  const pets=allies.filter(unit=>unit.kind==='pet'&&unit.owner===hero.owner);
  ok(hero.skills.includes('ss_rebirth'));
  for(const unit of allies)unit.hp=0;
  battle.cur=hero.id;battle.openAt=0;battle.deadline=12000;
  if(auto){setCombatAuto(battle,'a',true);advanceCombat(battle,500);}
  else{
   const skill=combatView(battle,'a').commands.find(skill=>skill.id==='ss_rebirth');
   eq(skill.targets,[hero.id]);
   ok(combatAction(battle,'a',{turn:battle.turn,skill:skill.id,target:hero.id},0));
  }
  ok(globalThis.SoulbeastColosseumEngine().skill(battle.last?.skillId)?.revAll);
  ok(pets.every(unit=>unit.hp>0));
  ok(allies.filter(unit=>unit.owner!==hero.owner).every(unit=>unit.hp===0));
 }
});
Deno.test('battle snapshots expose live status icons for both sides',()=>{
 for(const teamSiege of [true,false]){
  const battle=makeCombat('badges',[[{id:'a',name:'A',cls:'mage',lv:45}],[{id:'b',name:'B',cls:'archer',lv:45}]],null,0,new Map(),teamSiege);
  const [mage,summon]=battle.allies,[archer]=battle.enemies;
  Object.assign(mage,{taunt:2,charging:{id:'sw_charge'},charge:2,immune:'m',enchant:'fire',status:{burn:2},
   buffs:[{pas:'class10_parry',tn:2},{st:'spd',amt:-.3,tn:1}],dots:[{n:'พายุไฟ',turns:2}]});
  summon.summonLife=2;
  for(const viewer of ['a','b']){
   const snapshot=JSON.parse(JSON.stringify(combatView(battle,viewer)));
   eq(snapshot.allies[0].statuses,['burn']);
   eq(snapshot.allies[0].badges.map(badge=>badge.icon),[0,1,2,4,5,3,6,22,'➟↓']);
   eq(snapshot.allies[1].badges.map(badge=>badge.icon),[23]);
   eq(snapshot.enemies[0].badges.map(badge=>badge.icon),[14]);
  }
  archer.archerVeil=0;mage.buffs=[];mage.class10Barrier=0;
  eq(combatView(battle,'b').enemies[0].badges,[]);
  ok(!combatView(battle,'b').allies[0].badges.some(badge=>[3,22].includes(badge.icon)));
 }
});
Deno.test('druid bots and autoplay transform and expose the form portrait in the combat snapshot',()=>{
 for(const cls of ['druid','wildgod','archdruid'])for(const bot of [true,false]){
  const {battle,hero}=autoDecisionBattle(cls,bot);
  advanceCombat(battle,500);
  eq(globalThis.SoulbeastColosseumEngine().skill(battle.last.skillId).t,'form');
  ok(hero.form);
  for(const viewer of ['test-a','test-b']){
   const shown=combatView(battle,viewer).allies.find(u=>u.id===hero.id);
   eq(shown.form,hero.form);
   ok(pvpCardArt['form:'+shown.form]?.idle);
  }
 }
});
Deno.test('bot and player auto recover MP when the shared decision chooses rest',()=>{
 for(const bot of [true,false]){
  const {battle,hero}=autoDecisionBattle('mage',bot);
  hero.mp=0;
  advanceCombat(battle,500);
  eq(battle.last.skillId,'rest');
  eq(hero.mp,Math.round(hero.st.mp*.3));
 }
});
Deno.test('auto finishes a vulnerable enemy unless a living opponent forces a taunt',()=>{
 const {battle}=autoDecisionBattle('gunner',true);
 const [enemy,pet]=battle.enemies;
 enemy.hp=1;
 advanceCombat(battle,500);
 eq(battle.last.target,enemy.id);
 const next=autoDecisionBattle('gunner',false).battle;
 next.enemies[0].hp=1;
 next.enemies[1].taunt=3;
 advanceCombat(next,500);
 eq(next.last.target,pet.id);
});
Deno.test('auto buffs a healthy team but does not immediately duplicate that buff',()=>{
 const {battle,hero}=autoDecisionBattle('sage',false);
 hero.skills=['attack','sg_barrier'];
 advanceCombat(battle,500);
 eq(battle.last.skillId,'sg_barrier');
 ok(battle.allies[1].buffs.some(buff=>buff.st==='pdef'&&buff.amt>0));
 battle.cur=hero.id;
 battle.openAt=500;
 advanceCombat(battle,1000);
 eq(battle.last.skillId,'attack');
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
Deno.test('ten distinct random chest sites; only first opener earns 5–20 points',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 eq(r.chests.length,10);eq(new Set(r.chests.map(c=>`${c.x}:${c.y}`)).size,10);
 ok(r.chests.every(c=>fits(c.x,c.y)&&c.points>=5&&c.points<=20));
 const c=r.chests[0];Object.assign(a,{x:c.x,y:c.y});Object.assign(b,{x:c.x,y:c.y});
 r.command(b,{type:'chest',id:c.id},3000);eq(r.score,[300,300+c.points]);
 let denied=false;try{r.command(a,{type:'chest',id:c.id},3000);}catch{denied=true;}
 ok(denied);eq(r.snapshot(a,3000).chestsLeft,9);eq(r.snapshot(a,3000).chests.some(x=>x.id===c.id),false);
});
Deno.test('rare boss spawns every two minutes at the rounded average level and scores once',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 a.baseCls='mage';
 r.tick(BOSS_INTERVAL-1,0);eq(r.bosses.length,0);
 r.tick(BOSS_INTERVAL,0);eq(r.bosses.length,1);eq(r.nextBossAt,BOSS_INTERVAL*2);
 const beast=r.bosses[0];ok(rareSpecies.includes(beast.sp)&&rareSpecies.length>10);
 ok(fits(beast.x,beast.y));eq(Math.floor(beast.x/CELL),Math.floor(COLS/2));eq(beast.lv,11);eq(r.snapshot(a,BOSS_INTERVAL).nextBossAt,BOSS_INTERVAL*2);
 const at={x:beast.x,y:beast.y};
 Object.assign(a,at);r.tick(BOSS_INTERVAL+1,0);
 const battle=r.battles.get(a.battle);
 ok(battle?.boss);eq(battle.enemies.length,1);eq(battle.enemies[0].hp,bossUnit(beast).hp);
 eq(battle.enemies[0].st.patk,bossUnit(beast).st.patk);
 battle.enemies[0].hp=0;r.recordFalls(battle,BOSS_INTERVAL+2);r.recordFalls(battle,BOSS_INTERVAL+3);
 eq(r.score,[350,240]);ok(r.events.at(-1).text.includes('นาทีที่ 4'));eq(beast.phase,'defeated');
 r.tick(BOSS_INTERVAL*2,0);eq(r.bosses.length,1);ok(r.bosses[0].sp!==beast.sp);
});
Deno.test('swordsman and summoner earn 8 for a shadow and 60 for a boss',()=>{
 for(const career of ['swordsman','summoner']){
 const {r,p:[a,b]}=match();start(r,[a,b]);
 a.baseCls=career;
 r.encounter(a,r.shadows[0],3000,true);
 const hunt=r.battles.get(a.battle);
 hunt.enemies[0].hp=0;r.recordFalls(hunt,3100);r.recordFalls(hunt,3200);
 eq(a.earned,8);eq(r.score,[308,300]);
 r.rotateBosses(BOSS_INTERVAL);
 r.encounter(a,r.bosses[0],BOSS_INTERVAL,true);
 const boss=r.battles.get(a.battle);
 boss.enemies[0].hp=0;r.recordFalls(boss,BOSS_INTERVAL+1);r.recordFalls(boss,BOSS_INTERVAL+2);
 eq(a.earned,68);eq([a.beastKills,a.bossKills],[1,1]);eq(r.score,[368,240]);
 }
});
Deno.test('team shadows and bosses retain their base aura late in the match without time scaling',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const shadow=r.shadows[0],normal=makeCombat('normal',[[a],[]],shadow,0).enemies[0];
 r.encounter(a,shadow,BOSS_INTERVAL*3,true);
 const battle=r.battles.get(a.battle),beast=battle.enemies[0];
 eq(beast.hp,Math.round(normal.hp*1.5));eq(beast.st.pdef,Math.round(normal.st.pdef*1.5));
 eq(beast.st.patk,normal.st.patk);
 r.spawnBoss(BOSS_INTERVAL*3);
 const boss=r.bosses[0],reference=bossUnit(boss);
 r.encounter(a,boss,BOSS_INTERVAL*3,true);
 const bossFight=r.battles.get(a.battle).enemies[0];
 for(const stat of ['hp','mp','patk','matk','pdef','mdef','spd'])eq(bossFight.st[stat],reference.st[stat]);
});
Deno.test('five new team chests spawn per wave and thieves and merchants earn 1.5 times the chest score',()=>{
 for(const career of ['merchant','thief']){
  const {r,p:[a,b]}=match();start(r,[a,b]);
  r.rotateBosses(BOSS_INTERVAL-1);eq(r.chests.length,10);
  r.rotateBosses(BOSS_INTERVAL);eq(r.chests.length,15);
  r.rotateBosses(BOSS_INTERVAL);eq(r.chests.length,15);
  r.rotateBosses(BOSS_INTERVAL*2);eq(r.chests.length,20);
  eq(new Set(r.chests.map(c=>c.id)).size,20);
  eq(new Set(r.chests.map(c=>[c.x,c.y].join('/'))).size,20);
  const chest=r.chests[19];Object.assign(a,{x:chest.x,y:chest.y,baseCls:career});
  r.command(a,{type:'chest',id:chest.id},BOSS_INTERVAL*2);
  eq(a.earned,chest.points*1.5);eq(r.score[0],300+a.earned);
 }
});
Deno.test('captured flags enable allied warp and arrival cues only near the destination',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.shadows=[];
 const base=r.bases.find(q=>q.side===b.side&&q.tier==='small');base.hp=1;
 r.damageBase(base,a,3000);r.damageBase(base,a,4000);
 eq(base.flagSide,a.side);eq(base.hp,0);
 Object.assign(a,WARP_PADS[a.side]);Object.assign(b,{x:base.x,y:base.y});
 r.command(a,{type:'warpSmallBase',id:base.id},4100);
 eq(r.snapshot(a,4100).warpArrivals,[]);
 eq(r.snapshot(b,4100).warpArrivals,[{x:base.x,y:base.y,recallEndsAt:9100}]);
 r.command(a,{type:'cancelRecall'},4200);eq(r.snapshot(b,4200).warpArrivals,[]);
 r.command(a,{type:'warpSmallBase',id:base.id},4300);
 Object.assign(b,b.spawn);
 r.tick(9300,0);eq([a.x,a.y],[base.x,base.y]);
});
Deno.test('an undefeated boss is replaced at the deadline, even if a battle is active',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);r.tick(BOSS_INTERVAL,0);
 const old=r.bosses[0];
 Object.assign(a,{x:old.x,y:old.y});r.tick(BOSS_INTERVAL+1,0);
 const battle=r.battles.get(a.battle);ok(battle?.boss);
 r.command(a,{type:'combat',turn:battle.turn,skill:'attack',target:battle.enemies[0].id},2*BOSS_INTERVAL);
 eq(r.bosses.length,1);ok(r.bosses[0].id!==old.id&&r.bosses[0].sp!==old.sp);
 eq(battle.finished,true);eq(r.score,[300,300]);
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
 const home=cellCenter(13,5);
 Object.assign(beast,home,{home});
 const edge=13*CELL;
 Object.assign(a,{x:edge+6,y:beast.home.y});
 r.tick(2950,.05);r.tick(3000,.05);
 eq(beast.pursuedId,a.id);ok(beast.x<beast.home.x);
 Object.assign(a,{x:edge-5});
 r.tick(3050,0);
 eq(a.phase,'walk');eq(beast.pursuedId,undefined);eq(beast.returning,true);
 for(let time=3100;beast.returning&&time<=4000;time+=50)r.tick(time,.05);
 eq(beast.returning,false);ok(distance(beast,beast.home)<=10);
});
Deno.test('destroying a large base wins immediately even when trailing on score',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const capital=r.bases.find(x=>x.side===b.side&&x.main);
 r.bases.find(x=>x.id===capital.links[0]).hp=0;
 capital.hp=1;r.score=[100,300];
 Object.assign(a,{x:capital.x,y:capital.y});
 r.siegeBases(3000);r.siegeBases(4000);
 eq([capital.side,capital.hp,r.phase,r.winner,r.reason],[b.side,0,'finished',a.side,'base-captured']);
 ok(r.baseEffects.some(e=>e.baseId===capital.id&&e.kind==='collapse'));
 eq(r.score,[151,199]);eq(a.earned,51);
});
Deno.test('a team shadow waits at its post, detects under 300 units and abandons targets beyond its home range',()=>{
 const {r,p:[a,b]}=match();start(r,[a,b]);
 const beast=r.shadows[0],home=cellCenter(8,13);
 Object.assign(beast,home,{home});
 r.shadows=[beast];r.bases=[];b.connected=false;
 Object.assign(a,{x:home.x+300,y:home.y});
 for(let time=3000;time<=4000;time+=50)r.tick(time,.05);
 eq(beast.pursuedId,undefined);eq(distance(beast,home),0);
 a.x=home.x+299;r.tick(4050,.05);eq(beast.pursuedId,a.id);
 ok(Math.abs(distance(beast,home)-TEAM_SPEED*.05)<.001);
 r.tick(4100,.05);
 r.tick(9100,0);eq(beast.pursuedId,a.id);
 a.x=home.x+301;
 ok(distance(beast,a)<300);
 r.tick(9150,0);eq(beast.pursuedId,undefined);ok(beast.returning);
 for(let time=9200;time<=10_000;time+=50)r.tick(time,.05);
 eq(beast.returning,false);eq(distance(beast,home),0);
});
Deno.test('movement cannot take a team shadow more than 300 units from home',()=>{
 const {r,p}=match();start(r,p);r.bases=[];
 const beast=r.shadows[0],home=cellCenter(8,13);
 Object.assign(beast,home,{home});
 const outside={x:home.x+360,y:home.y};
 for(let i=0;i<100;i++){
  r.moveBeast(beast,outside,.05,TEAM_SPEED);
  ok(distance(beast,home)<=300);
 }
});
Deno.test('boss runs at 200 units per second, switches to the nearest visible sealer and patrols without a target',()=>{
 const {r,p:[a,b]}=match();r.random=()=>.5;start(r,[a,b]);r.shadows=[];
 a.id='sealer-z';b.id='sealer-a';
 const now=BOSS_INTERVAL; r.tick(now,0);
 const boss=r.bosses[0],at=cellCenter(15,21);Object.assign(boss,at,{home:at,nav:null});
 Object.assign(a,at,{x:at.x+330});Object.assign(b,at,{x:at.x-370});
 r.tick(now+50,.05);eq(boss.pursuedId,a.id);ok(Math.abs(distance(boss,at)-TEAM_SPEED*.05)<.001);
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
 eq([...new Set(traps.map(trap=>trap.type))],['blast']);
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
 a.baseCls='mage';
 r.encounter(a,creature,5200,true);
 const battle=r.battles.get(a.battle);
 eq(battle.allies[0].hp,a.maxHp-Math.round(a.maxHp*.1));
 battle.enemies[0].hp=0;r.recordFalls(battle,5500);r.recordFalls(battle,5600);
 eq(r.score,[305,300]);
});
Deno.test('solo practice starts with nine bots and runs normal objectives to a result',()=>{
 const r=new Match('1234AABB',0,()=>.5);
 const human=startPractice(r,{name:'Tester',cls:'mage',lv:20},0);
 const view=r.snapshot(human,0);
 eq(view.practice,true);eq(view.phase,'match');eq(view.ends,MATCH_MS);
 eq(view.players.filter(p=>p.side===0&&p.bot).length,4);
 eq(view.players.filter(p=>p.side===1&&p.bot).length,5);
 const bots=r.players.filter(p=>p.bot);
 let hasBotAttack=false,hasBotSiege=false;
 for(let time=50;r.phase==='match'&&time<=MATCH_MS;time+=50){
  r.tick(time,.05);
  hasBotSiege||=r.baseEffects.some(effect=>!effect.targetInfantry&&['melee','hammer','archer','gunner','magic'].includes(effect.kind)&&bots.some(bot=>bot.id===effect.playerId));
  if(!hasBotAttack){
   hasBotAttack=[...r.battles.values()].some(b=>{
    const actor=[...b.allies,...b.enemies].find(u=>u.id===b.last?.actor);
    return actor&&b.botOwners[actor.owner];
   });
  }
 }
 eq(r.phase,'finished');ok(['time','base-captured'].includes(r.reason));
 ok(hasBotSiege,'bots never besieged a base');
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
