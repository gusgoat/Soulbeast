import {CHEST_TARGET, COLS, FLAT, RAID_TARGET, SPEED, TEAM_ARENA, canSeeOpponent, cellCenter, clearPath, distance, indexAt, nextCell} from './arena.mjs';
import {fogZone, insideFogSafe, walkInArena} from './survival-arena.mjs';
import {botCareer} from './combat.mjs';

const CLASS_BY_SEAT = ['swordsman', 'archer', 'mage', 'summoner', 'swordsman'];
const BOT_NAMES = [
 ['อรุณ', 'ลูน่า', 'นภา', 'วายุ', 'ธารา'],
 ['ไอริส', 'ราตรี', 'อัคคี', 'พราย', 'ศิลา'],
];
const ROLE_BY_SEAT = ['guard', 'raider', 'scout', 'raider', 'hunter'];

export function startPractice(match, profile, now, character=null) {
 const player = match.join(profile,character);
 player.ready = true;
 for (let i = 1; i < 10; i++) {
  // Alternate name pools for variety. Team practice also uses alternating sides.
  const side = i % 2;
  const seat = Math.floor(i / 2);
  const bot = match.join({
   name: BOT_NAMES[side][seat],
   cls: botCareer(seat === 0 ? player.cls : CLASS_BY_SEAT[seat],player.lv,i),
   botCareer: true,
   lv: player.lv,
  });
  bot.ready = true;
  bot.bot = {role: ROLE_BY_SEAT[seat], seat, patrol: 0};
 }
 match.practice = true;
 match.start(now);
 return player;
}

function patrolPoint(bot) {
 const points = [[9,13], [15,6], [9,29], [15,38]];
 const [x, y] = points[bot.bot.patrol % points.length];
 return cellCenter(bot.side === 0 ? x : COLS - 1 - x, y);
}

function chooseObjective(match, bot) {
 const {role, seat} = bot.bot;
 if (role === 'guard') {
  const opponent = match.players.find(player => player.side !== bot.side && player.phase === 'walk' &&
   player.connected && distance(bot, player) <= 550 && canSeeOpponent(bot, player) && clearPath(bot, player));
  if (opponent) return {type: 'intercept', point: opponent};
  const x = bot.bot.patrol % 2 === 0 ? 6 : 10;
  return {type: 'patrol', point: cellCenter(bot.side === 0 ? x : COLS - 1 - x, 21)};
 }
 // Scouts explore, while hunters divert to a nearby boss. Raiders split
 // between the upper and lower routes so a whole team does not move as one.
 if (role === 'hunter') {
  const boss = match.bosses.find(candidate => candidate.phase === 'walk' && distance(bot, candidate) <= 1100);
  if (boss) return {type: 'boss', point: boss};
 }
 if (role === 'scout' || role === 'hunter') {
  const chests = match.chests.filter(chest => !chest.opened && distance(bot, chest) <= 1650);
  chests.sort((a, b) => distance(bot, a) - distance(bot, b));
  if (chests.length) return {type: 'chest', point: chests[0]};
 }
 if (role === 'scout' && bot.bot.patrol % 3 !== 2) return {type: 'patrol', point: patrolPoint(bot)};
 const baseIndex = role === 'raider' ? (seat === 1 ? 1 : 3) : 2;
 const targets=match.bases.filter(base=>base.side!==bot.side&&base.remaining>0);
 const base=targets.find(base=>base.id===`${1-bot.side}-${baseIndex}`)||
  targets.sort((a,b)=>distance(bot,a)-distance(bot,b))[0];
 return base?{type:'raid',point:base}:{type:'patrol',point:patrolPoint(bot)};
}

function currentObjective(match, bot, now) {
 const brain = bot.bot;
 const goal = brain.goal;
 const expired = goal?.type === 'chest' && goal.point.opened ||
  goal?.type === 'raid' && !goal.point.remaining ||
  goal?.type === 'boss' && (goal.point.claimed || goal.point.phase !== 'walk') ||
  goal?.type === 'intercept' && (goal.point.phase !== 'walk' || !canSeeOpponent(bot, goal.point));
 if (!goal || expired || now >= brain.planAt) {
  if (expired) brain.waypoint = null;
  brain.goal = chooseObjective(match, bot);
  brain.planAt = now + 1800;
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
 const canInteract = type === 'raid' ? RAID_TARGET(bot, point) : type === 'chest' && CHEST_TARGET(bot, point);
 if (canInteract) {
  match.command(bot, {type, id: point.id}, now);
  brain.goal = null;
  if (brain.role === 'scout' && type === 'raid') brain.patrol++;
  return;
 }
 if (type === 'patrol' && distance(bot, point) < 12) {
  brain.patrol++;
  brain.goal = null;
  return;
 }
 walkToward(bot, point, dt);
}

export function resetBotRoute(bot) {
 if (!bot.bot) return;
 bot.bot.waypoint = null;
 bot.bot.goal = null;
 bot.bot.retryAt = 0;
}
