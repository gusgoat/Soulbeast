import {BASE_FIRE_RANGE, BASE_INFANTRY_SUPPORT_RANGE, CHEST_TARGET, COLS, FLAT, HEAL_TARGET, INFANTRY_HEAL_RANGE, RAID_TARGET, REPAIR_TARGET, TEAM_ARENA, WOUNDED_INFANTRY, canRaidBase, canSeeOpponent, cellCenter, distance, hasInfantrySupport, indexAt, nextCell, walkSpeed} from './arena.mjs?v=team-bot-tactics-1';
import {inSight} from './sight.mjs';
import {fogZone, insideFogSafe, walkInArena} from './survival-arena.mjs';

export function startPractice(match, profile, now, character=null) {
 const player = match.join(profile,character);
 player.ready = true;
 for (let i = 1; i < 10; i++) match.addBot(match.solo?0:i%2,player.lv);
 match.practice = true;
 match.start(now);
 return player;
}

const patrolTiles=TEAM_ARENA.maze.flatMap((row,y)=>row.flatMap((open,x)=>{
 const point=cellCenter(x,y);
 return open&&TEAM_ARENA.fits(point.x,point.y)?[{...point,col:x,row:y}]:[];
}));
const nearestTo=(bot,points)=>points.reduce((best,p)=>!best||distance(bot,p)<distance(bot,best)?p:best,null);
function patrolPoint(bot){
 const brain=bot.bot,upper=(brain.lane+Math.floor(brain.patrol/2))%2===0;
 const guard=brain.role==='guard';
 const points=patrolTiles.filter(p=>{
  const col=bot.side===0?p.col:COLS-1-p.col;
  return (upper?p.row<17:p.row>25)&&col>=3&&col<=(guard?12:Math.floor(COLS*.63));
 });
 return points[(brain.routeSeed+brain.patrol*19)%points.length];
}

const WAVE_FOLLOW_RANGE=105;
const activeInfantry=(bot,match)=>match.infantry.filter(unit=>unit.side===bot.side&&unit.hp>0);
const canSee=(observer,target)=>inSight(observer,target)&&canSeeOpponent(observer,target);

function threatenedBase(match,bot,bases,opponents){
 const {role}=bot.bot;
 const threats=bases.flatMap(base=>{
  if(!base.main&&role!=='guard'&&distance(bot,base)>650)return [];
  const soldiers=match.infantry.filter(unit=>unit.side!==bot.side&&unit.hp>0&&
   (unit.target===base||distance(base,unit)<=BASE_FIRE_RANGE&&canSee(base,unit)&&match.arena.clearPath(base,unit)));
  const players=opponents.filter(p=>p.siege?.id===base.id||
   distance(base,p)<=BASE_FIRE_RANGE&&(canSee(bot,p)||canSee(base,p))&&match.arena.clearPath(base,p));
  const soldier=nearestTo(bot,soldiers),enemy=nearestTo(bot,players);
  return soldier||enemy?[{base,type:soldier?'fightInfantry':'intercept',point:soldier||enemy}]:[];
 });
 return threats.sort((a,b)=>Number(b.base.main)-Number(a.base.main)||
  distance(bot,a.point)-distance(bot,b.point))[0];
}

function pushWithInfantry(match,bot,allies,pick){
 if(!allies.length)return null;
 const raidBases=match.bases.filter(base=>canRaidBase(bot.side,base,match.bases));
 const supported=pick(raidBases.filter(base=>hasInfantrySupport(base,bot.side,allies,BASE_FIRE_RANGE)));
 const raidIds=new Set(raidBases.map(base=>base.id));
 const frontByLane=new Map();
 for(const unit of allies){
  const advancing=unit.path.some((point,i)=>i>=unit.waypoint&&raidIds.has(point.baseId));
  if(supported?distance(unit,supported)>BASE_FIRE_RANGE:!advancing)continue;
  const front=frontByLane.get(unit.lane);
  if(!front||unit.waypoint>front.waypoint)frontByLane.set(unit.lane,unit);
 }
 const wave=pick([...frontByLane.values()]);
 if(!wave)return null;
 const enemy=pick(match.infantry.filter(unit=>unit.side!==bot.side&&unit.hp>0&&canSee(wave,unit)&&
  (distance(wave,unit)<=BASE_INFANTRY_SUPPORT_RANGE||unit.target===wave)));
 if(enemy)return {type:'fightInfantry',point:enemy};
 if(supported)return {type:'raid',point:supported};
 return {type:'followInfantry',point:wave};
}

function chooseObjective(match,bot,now){
 const {role,skipPoint}=bot.bot;
 const pick=points=>nearestTo(bot,points.filter(p=>p!==skipPoint||now>=bot.bot.skipUntil));
 const healingBases=match.bases.filter(base=>base.side===bot.side&&base.hp>0);
 const lowVitals=u=>u.hp<u.maxHp*.58||u.mp<u.maxMp*.34;
 const low=lowVitals(bot)||[...bot.petVitals.values()].some(lowVitals);
 const heal=low&&pick(healingBases);
 if(heal)return {type:'recover',point:heal};
 const career=bot.baseCls||bot.cls;
 const enemies=match.players.filter(p=>p.side!==bot.side&&p.connected&&p.phase==='walk'&&now>=p.safeUntil);
 const defense=threatenedBase(match,bot,healingBases,enemies);
 if(defense)return defense;
 const repair=career==='merchant'&&pick(healingBases.filter(b=>b.hp<b.maxHp&&
  !match.players.some(p=>p!==bot&&p.repair?.baseId===b.id)));
 if(repair)return {type:'repairBase',point:repair};

 const visible=p=>canSee(bot,p);
 const opponents=enemies.filter(visible);
 const allies=match.players.filter(p=>p!==bot&&p.side===bot.side&&p.connected&&p.phase==='walk');
 const thief=career==='druid'&&pick(opponents.filter(p=>p.baseCls==='thief'));
 const opponent=thief||pick(opponents);
 const infantry=activeInfantry(bot,match);
 const active=p=>p.phase==='walk'&&!p.claimed&&now>=(p.safeUntil||0)&&visible(p);
 const beastHunter=role==='hunter'||career==='swordsman'||career==='summoner';
 const boss=beastHunter&&pick(match.bosses.filter(active));
 if(boss)return {type:'hunt',point:boss};
 const chest=pick(match.chests.filter(p=>!p.opened&&visible(p)&&(role!=='guard'||distance(bot,p)<160)));
 if(chest&&['thief','merchant'].includes(career))return {type:'chest',point:chest};

 const push=pushWithInfantry(match,bot,infantry,pick);
 if((push?.type==='fightInfantry'||push?.type==='raid')&&(role!=='guard'||distance(bot,push.point)<=360))return push;
 if(career==='summoner'){
  const wounded=infantry.filter(unit=>WOUNDED_INFANTRY(bot,unit)&&distance(bot,unit)<=360)
   .sort((a,b)=>a.hp-b.hp||distance(bot,a)-distance(bot,b))[0];
  if(wounded)return {type:'healInfantry',point:wounded};
 }
 if(push&&(role==='raider'||role==='escort'))return push;
 if(opponent&&(thief||role==='guard'||role==='escort'||(role==='hunter'||career==='thief')&&bot.hp>bot.maxHp*.78))
  return {type:'intercept',point:opponent};
 if(chest)return {type:'chest',point:chest};
 const shadow=beastHunter&&pick(match.shadows.filter(active));
 if(shadow)return {type:'hunt',point:shadow};
 if(push&&role!=='guard')return push;

 if(role==='escort'){
  const partner=pick(allies.filter(p=>!p.bot&&distance(bot,p)>180&&distance(bot,p)<720));
  if(partner)return {type:'escort',point:partner};
 }
 return {type:'patrol',point:patrolPoint(bot)};
}

function currentObjective(match, bot, now) {
 const brain = bot.bot;
 const goal = brain.goal;
 const expired = goal?.type === 'chest' && goal.point.opened ||
  goal?.type==='raid'&&(!canRaidBase(bot.side,goal.point,match.bases)||!hasInfantrySupport(goal.point,bot.side,match.infantry,BASE_FIRE_RANGE)) ||
  (goal?.type==='fightInfantry'||goal?.type==='followInfantry')&&goal.point.hp<=0 ||
  goal?.type==='healInfantry'&&!WOUNDED_INFANTRY(bot,goal.point) ||
  (goal?.type==='recover'||goal?.type==='repairBase')&&(goal.point.side!==bot.side||goal.point.hp<=0||goal.type==='repairBase'&&goal.point.hp>=goal.point.maxHp) ||
  goal?.type === 'hunt' && (goal.point.claimed || goal.point.phase !== 'walk') ||
  goal?.type === 'intercept' && (goal.point.phase !== 'walk' || !canSeeOpponent(bot, goal.point)) ||
  goal?.type === 'escort' && (goal.point.phase !== 'walk' || distance(bot,goal.point)<145);
 if (!goal || expired || now >= brain.planAt) {
  if (expired) brain.waypoint = null;
  brain.goal = chooseObjective(match,bot,now);
  brain.planAt = now+1200+brain.routeSeed%700;
 }
 return brain.goal;
}

function walkToward(bot, point, dt) {
 const brain = bot.bot;
 const destination = indexAt(point);
 // Finish a step to the center of a tile before turning into the next
 // corridor. Steering diagonally from an edge can wedge a bot at a corner.
 if (!brain.waypoint || distance(bot, brain.waypoint) < 2) {
  const here = indexAt(bot);
  const center = cellCenter(here % COLS, Math.floor(here / COLS));
  if (here === destination) brain.waypoint = {x: point.x, y: point.y};
  else if (distance(bot, center) > 2) brain.waypoint = center;
  else {
   const next = nextCell(here, destination);
   brain.waypoint = cellCenter(next % COLS, Math.floor(next / COLS));
  }
 }
 walkStep(bot, brain.waypoint, dt, TEAM_ARENA);
}

function walkStep(bot, point, dt, arena, zone) {
 const dx = point.x - bot.x;
 const dy = (point.y - bot.y) * FLAT;
 const length = Math.hypot(dx, dy);
 if (length < 0.01) return;
 const speed = walkSpeed(arena,bot);
 walkInArena(arena, zone, bot, dx / length, dy / length, Math.min(dt, length / speed));
}

const inside = (zone, point) => insideFogSafe(zone, point.x, point.y);

function survivalRoutes(arena, bot, zone) {
 const {cols, maze, indexAt} = arena;
 const key = indexAt(bot), confined = inside(zone, bot);
 const start = cellCenter(key % cols, Math.floor(key / cols));
 if (confined) {
  start.x = Math.min(zone.max, Math.max(zone.min, start.x));
  start.y = Math.min(zone.max, Math.max(zone.min, start.y));
 }
 const origin = {point: start, parent: null, steps: 0};
 const nodes = new Map([[key, origin]]), queue = [key];
 for (const cell of queue) {
  const x = cell % cols, y = Math.floor(cell / cols), parent = nodes.get(cell);
  for (const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
   const next = b*cols+a, point = cellCenter(a,b);
   if (!maze[b]?.[a] || nodes.has(next) || (confined && !inside(zone, point))) continue;
   nodes.set(next, {point, parent, steps: parent.steps+1});
   queue.push(next);
  }
 }
 return nodes;
}

function survivalObjective(match, bot, danger, preferredZone, now, routes) {
 const {arena} = match;
 const route = point => routes.get(arena.indexAt(point));
 const pickNearest = targets => targets.sort((a,b) => route(a).steps-route(b).steps || distance(bot,a)-distance(bot,b))[0];
 if (danger) {
  const shelter = [...routes.values()].find(({point}) => inside(danger,point));
  if (shelter) return {type:'escape', point:shelter.point};
 }
 const viable = point => route(point) && (!preferredZone?.remaining || inside(preferredZone,point));
 const chests = match.chests.filter(chest => !chest.opened && distance(bot,chest)<=900 && viable(chest));
 const enemies = match.players.filter(p => p!==bot && p.connected && p.phase==='walk' && now>=p.safeUntil &&
  distance(bot,p)<=750 && arena.canSeeOpponent(bot,p) && arena.clearPath(bot,p) && viable(p));
 const lowPower = bot.hp<bot.maxHp*.75 || bot.mp<bot.maxMp*.65 || Object.keys(bot.ailments).length>0;
 if (chests.length && (lowPower || bot.bot.role!=='hunter' || !enemies.length)) return {type:'chest', point:pickNearest(chests)};
 if (enemies.length) return {type:'intercept', point:pickNearest(enemies)};
 const safeRoutes = [...routes.values()].filter(({point}) => viable(point));
 const routesAhead = safeRoutes.filter(n => n.steps>=3 && n.steps<=9);
 const patrol = routesAhead.length ? routesAhead : safeRoutes.length ? safeRoutes : [...routes.values()];
 const node = patrol[Math.floor(match.random()*patrol.length)];
 return {type:'patrol', point:node.point};
}

function stepSurvivalBot(match, bot, now, dt) {
 const {arena, zone} = match, brain = bot.bot;
 const next = zone.nextAt && zone.nextAt-now<=12_000 ? fogZone(match.started,zone.nextAt) : null;
 const danger = zone.remaining && !inside(zone,bot) ? zone : next?.remaining && !inside(next,bot) ? next : null;
 const preferredZone = next?.remaining ? next : zone;
 const goal = brain.goal;
 const lostEnemy = goal?.type==='intercept' && (!goal.point.connected || goal.point.phase!=='walk' ||
  !arena.canSeeOpponent(bot,goal.point) || arena.indexAt(goal.point)!==brain.goalCell);
 if (!goal || brain.zoneStep!==zone.step || brain.dangerStep!==danger?.step || brain.preferredStep!==preferredZone.step || lostEnemy ||
   (goal.type==='chest' && goal.point.opened)) {
  if (!goal && now<brain.retryAt && brain.zoneStep===zone.step && brain.dangerStep===danger?.step) return;
  const routes = survivalRoutes(arena,bot,zone);
  brain.goal = survivalObjective(match,bot,danger,preferredZone,now,routes);
  brain.goalCell = arena.indexAt(brain.goal.point);
  brain.zoneStep = zone.step;
  brain.dangerStep = danger?.step;
  brain.preferredStep = preferredZone.step;
  brain.retryAt = now+500;
  brain.path = [];
  for (let node=routes.get(brain.goalCell);node;node=node.parent) brain.path.push(node.point);
 }
 const {type, point} = brain.goal;
 if (type==='chest' && arena.chestInReach(bot,point)) {
  match.command(bot,{type,id:point.id},now);
  brain.goal = null;
  return;
 }
 while (brain.path.length && distance(bot,brain.path.at(-1))<2) brain.path.pop();
 if (brain.path.length) walkStep(bot,brain.path.at(-1),dt,arena,zone);
 else if (type==='intercept' && distance(bot,point)>2) walkStep(bot,point,dt,arena,zone);
 else brain.goal = null;
}

export function stepBot(match, bot, now, dt) {
 if (now < bot.safeUntil) return;
 if (match.solo) return stepSurvivalBot(match,bot,now,dt);
 const brain = bot.bot;
 const {type, point} = currentObjective(match, bot, now);
 if(bot.repair){
  if(type==='repairBase'&&bot.repair.baseId===point.id)return;
  match.command(bot,{type:'stopRepair'},now);
 }
 if(((type==='raid'||type==='fightInfantry')&&RAID_TARGET(bot,point)&&
  (type==='raid'||canSeeOpponent(bot,point)))||(type==='recover'&&HEAL_TARGET(bot,point))||
  (type==='followInfantry'&&distance(bot,point)<=WAVE_FOLLOW_RANGE&&match.arena.clearPath(bot,point))||
  (type==='healInfantry'&&distance(bot,point)<=INFANTRY_HEAL_RANGE))return;
 if((type==='repairBase'&&REPAIR_TARGET(bot,point))||(type==='chest'&&CHEST_TARGET(bot,point))){
  match.command(bot,{type,id:point.id},now);
  brain.goal=null;
  return;
 }
 if (type === 'patrol' && distance(bot, point) < 12) {
  brain.patrol++;
  brain.goal = null;
  return;
 }
 const x=bot.x,y=bot.y;
 walkToward(bot, point, dt);
 if(Math.hypot(bot.x-x,bot.y-y)>.02)brain.blockedAt=null;
 else if(now-(brain.blockedAt??=now)>700){
  brain.skipPoint=point;brain.skipUntil=now+3500;
  brain.patrol++;brain.goal=null;brain.waypoint=null;brain.blockedAt=null;
 }
}

export function resetBotRoute(bot) {
 if (!bot.bot) return;
 bot.bot.waypoint = null;
 bot.bot.goal = null;
 bot.bot.retryAt = 0;
 bot.bot.blockedAt = null;
}
