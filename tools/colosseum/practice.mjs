import {CHEST_TARGET, COLS, FLAT, HEAL_TARGET, RAID_TARGET, SPEED, TEAM_ARENA, canSeeOpponent, cellCenter, distance, indexAt, nextCell} from './arena.mjs';
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

function chooseObjective(match,bot,now){
 const {role,lane,patrol,skipPoint}=bot.bot;
 const pick=points=>nearestTo(bot,points.filter(p=>p!==skipPoint||now>=bot.bot.skipUntil));
 const own=match.bases.filter(base=>base.side===bot.side&&base.remaining>0);
 const low=bot.hp<bot.maxHp*.58||bot.mp<bot.maxMp*.34,afflicted=Object.keys(bot.ailments).length>0;
 const heal=pick(low?own:afflicted?own.filter(base=>base.main&&distance(bot,base)<900):[]);
 if(heal)return {type:'healBase',point:heal};

 const visible=p=>inSight(bot,p)&&canSeeOpponent(bot,p);
 const opponents=match.players.filter(p=>p.side!==bot.side&&p.connected&&p.phase==='walk'&&now>=p.safeUntil&&visible(p));
 const allies=match.players.filter(p=>p!==bot&&p.side===bot.side&&p.connected&&p.phase==='walk');
 const opponent=pick(opponents);
 if(opponent&&(role==='guard'||role==='escort'||role==='hunter'&&bot.hp>bot.maxHp*.78))
  return {type:'intercept',point:opponent};

 const active=p=>p.phase==='walk'&&!p.claimed&&now>=(p.safeUntil||0)&&visible(p);
 const boss=role==='hunter'&&pick(match.bosses.filter(active));
 if(boss)return {type:'hunt',point:boss};
 const chest=pick(match.chests.filter(p=>!p.opened&&visible(p)&&(role!=='guard'||distance(bot,p)<160)));
 if(chest)return {type:'chest',point:chest};
 const shadow=role==='hunter'&&pick(match.shadows.filter(active));
 if(shadow)return {type:'hunt',point:shadow};

 if(role==='escort'){
  const partner=pick(allies.filter(p=>!p.bot&&distance(bot,p)>180&&distance(bot,p)<720));
  if(partner)return {type:'escort',point:partner};
 }
 if(role==='raider'||role==='scout'&&patrol%4===3){
  const targets=match.bases.filter(base=>base.side!==bot.side&&base.remaining>0);
  const preferred=targets.filter(base=>base.id===`${1-bot.side}-${lane===0?1:3}`);
  const raid=pick(preferred)||pick(targets);
  if(raid)return {type:'raid',point:raid};
 }
 return {type:'patrol',point:patrolPoint(bot)};
}

function currentObjective(match, bot, now) {
 const brain = bot.bot;
 const goal = brain.goal;
 const expired = goal?.type === 'chest' && goal.point.opened ||
  ['raid','healBase'].includes(goal?.type) && !goal.point.remaining ||
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
 const speed = arena.bushAt(bot) === null ? SPEED : SPEED / 2;
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
 const canInteract = type==='raid'?RAID_TARGET(bot,point):type==='healBase'?HEAL_TARGET(bot,point):
  type==='chest'&&CHEST_TARGET(bot,point);
 if (canInteract) {
  match.command(bot, {type, id: point.id}, now);
  brain.goal = null;
  if(type==='raid'){brain.lane=1-brain.lane;brain.patrol++;}
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
