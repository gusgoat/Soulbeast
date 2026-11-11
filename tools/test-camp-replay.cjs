const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));

const bundle = 'tools/town-walk-demo/social-engine.generated.js';
const menu = fs.readFileSync('tools/town-walk-demo/menu.html', 'utf8');
const clean = value => JSON.parse(JSON.stringify(value));

function engine(source, browserBundle) {
 const math = Object.create(Math);
 math.random = () => 0.37;
 let serial = 0;
 const context = vm.createContext({
  Math: math, window: {localStorage: {}}, console, structuredClone,
  TextEncoder, TextDecoder, Uint8Array, btoa, atob,
  sha256: value => createHash('sha256').update(value).digest(),
  uuid: () => createHash('sha256').update(String(++serial)).digest('hex').slice(0, 32),
 });
 if (browserBundle) {
  source = source.replace(/\}\)\(\);\s*$/, 'window.fixture = {createWorkbook, createUtilities, createEngine};})();');
 } else {
  source = source.split('const accountCors=')[0].replace(/^import .*\r?\n/gm, '');
 }
 vm.runInContext(source, context);
 const api = browserBundle ? context.window.fixture : context;
 const book = api.createWorkbook({});
 const utilities = api.createUtilities(context.sha256, context.uuid);
 return {context, send: packet => clean(api.createEngine(book, utilities).dispatch(packet))};
}

function raid(source, browserBundle, starter) {
 const {send} = engine(source, browserBundle);
 const pin = 'test123456', attacker = 'CAMPATTACK000001', defender = 'CAMPDEFEND000001';
 function request(action, code, extra = {}) {
  const result = send({action, code, pin, ...extra});
  assert(result.ok, JSON.stringify(result));
  return result;
 }
 for (const code of [attacker, defender]) {
  const save = clean(starter);
  Object.assign(save.P, {lv: 30, code, name: code, gold: 500, pts: {hp: 145}});
  Object.assign(save.P.pets[0], {lv: 30, pts: {hp: 87}});
  save.P.party = [save.P.pets[0].uid];
  save.P.carried = [...save.P.party];
  request('save', code, {name: save.P.name, lv: save.P.lv, data: JSON.stringify(save)});
  request('camp_register', code, {pets: save.P.party});
 }
 const list = request('camp_list', attacker);
 assert.equal(list.camps.length, 1);
 const payload = {target: list.camps[0].id, pets: [starter.P.pets[0].uid], request: 'camp-regression-request-01'};
 const result = request('camp_begin', attacker, payload);
 assert.equal(result.room.status, 'finished');
 assert.equal(request('camp_begin', attacker, payload).room.id, result.room.id);
 const polled = request('camp_poll', attacker, {room: result.room.id, token: result.token});
 assert.equal(polled.room.winner, result.room.winner);
 assert.equal(polled.room.gold, result.room.gold);
 assert.deepEqual(polled.room.replay, result.room.replay);
 return result.room;
}

function verifyFrames(room, baseline) {
 const {battle, replay} = room;
 assert.equal(room.winner, baseline.winner);
 assert.equal(room.gold, baseline.gold);
 assert.equal(battle.turns, baseline.battle.turns);
 assert.deepEqual(battle.allies, baseline.battle.allies);
 assert.deepEqual(battle.enemies, baseline.battle.enemies);
 assert.deepEqual(battle.log, baseline.battle.log);
 const emitted = replay.frames.flatMap(frame => frame.effects);
 assert(emitted.length > 40, 'fixture must pass the old battle-wide effect cap');
 assert.equal(battle.effects.length, 0);
 for (const frame of replay.frames.slice(1)) {
  assert.equal(frame.campAction, true);
  assert(frame.actor);
  for (const cast of frame.effects.filter(e => e.k === 'cast' || e.k === 'charge')) {
   assert.equal(cast.id, frame.actor);
   assert.equal(cast.skill, frame.skill);
  }
 }
 console.log('PASS actual raid', battle.turns, 'turns,', emitted.length, 'effects, same outcome, retry and poll');
}

async function verifyPlayback() {
 const call = menu.slice(menu.indexOf('async function campCall('), menu.indexOf('async function enterCamp('));
 const source = menu.slice(menu.indexOf('function campFrameEffects('), menu.indexOf('const replayWorldCall='));
 const timeline = menu.slice(menu.indexOf('const MotionTimeline={'), menu.indexOf('const timelineSkill='));
 const card = menu.slice(menu.indexOf('function compactOnlineCard('), menu.indexOf('function compactOnlineSide('));
 const actor = {id: 'a', hp: 100, mp: 20, st: {hp: 100, mp: 20}, status: {}, name: 'A', lv: 10};
 const target = {...actor, id: 'b', name: 'B'};
 const hit = {k: 'hit', id: 'b', source: 'a', skill: 'fire'};
 const miss = {k: 'miss', id: 'b', source: 'a', skill: 'fire'};
 const room = {id: 'raid', status: 'finished', winner: 0, replay: {
  initial: {cur: 'a', allies: [actor], enemies: [target], effects: []},
  frames: [
   {campAction: true, actor: 'a', skill: 'fire', effects: [miss], units: []},
   {campAction: true, actor: 'a', skill: 'fire', effects: [miss, hit], units: [['b', 70, 20, {burn: 2}, 0]]},
   {campAction: true, actor: 'a', skill: 'fire', effects: [hit], units: [['b', 40, 20, {burn: 1}, 0]]},
  ],
 }};
 const timers = [], sounds = [], draws = [], queued = [];
 let now = 0;
 const c = {
  S: {screen: 'camp', P: {}}, CAMP: {room: null}, LOCAL_REPLAYS: {}, VQ: [], window: {},
  lbPost: async () => ({ok: true, room}), ensureCode: () => 'fixture',
  applyAccount() {}, observeUnits() {}, localStorage: {setItem() {}}, SHEET_URL: '',
  onlineSkillEffects() { assert.fail('camp response must start the replay before effects'); },
  toast(message) { assert.fail(message); },
  structuredClone, Date: {now: () => now}, BattleSpeed: {ms: n => n, rate: () => 1},
  setTimeout: (fn, ms) => timers.push({fn, at: now + ms}),
  Sound: {fx: name => sounds.push({name, drawn: draws.at(-1)})},
  SK: {}, vSpawn() {},
  document: {
   getElementById: () => ({appendChild() {}}),
   createElement: () => ({style: {}, remove() {}}),
  },
  BattleEffects: {
   enrich: effects => effects.map(effect => ({...effect, group: 0})),
   anchor: () => ({x: 1, y: 1}), profile: () => ({}), prepareProjectile() {},
   battle: () => c.CAMP.room.battle,
   actor: id => [...c.CAMP.room.battle.allies, ...c.CAMP.room.battle.enemies].find(u => u.id === id),
   spawn() {
    assert(draws.at(-1).html.includes('HP 100/'));
    assert(!draws.at(-1).html.includes('Burn'), 'a miss must not reveal the next hit');
    queued.push('miss');
   },
   impact() {
    assert(draws.at(-1).html.includes('Burn'));
    assert(draws.at(-1).html.includes(queued.length === 2 ? 'HP 70/' : 'HP 40/'));
    queued.push('hit');
   },
  },
  CharacterMotion: {
   sync() {}, reduced: () => false, resolve: () => null, mode: () => 'melee',
   melee: () => 700, phase() {}, landed: effect => effect.k === 'hit',
   schedule: (fn, ms) => c.setTimeout(fn, ms),
  },
  applyClass10Replay() {}, fmt: String, esc: String, unitPortrait: () => '',
  STS: {burn: {n: 'Burn'}}, bar: (n, max) => `<meter value="${n}" max="${max}"></meter>`,
 };
 c.statusBattleCard = (html, u) => c.timeline.shown(html, u);
 c.render = () => {
  const current = c.CAMP.room;
  if (!current) return;
  draws.push({status: current.status, html: current.battle ?
   c.compactOnlineCard(current.battle.enemies[0], 'camp', current, false) : ''});
 };
 c.flushVfx = () => c.timeline.flush();
 vm.createContext(c);
 room.battle = {allies: [actor], enemies: [{...target, hp: 40, status: {burn: 1}}]};
 vm.runInContext(call + '\n' + source + '\n' + timeline + '\n' + card + '\nthis.timeline=MotionTimeline;', c);
 c.timeline.sound = () => {};
 assert.equal((await c.campCall('camp_begin')).room.status, 'finished');
 assert.deepEqual(sounds, []);
 assert.equal(draws[0].status, 'active');
 for (let step = 0; timers.length && step < 300; step++) {
  timers.sort((a, b) => a.at - b.at);
  const timer = timers.shift();
  now = timer.at;
  timer.fn();
 }
 assert.equal(timers.length, 0);
 assert.deepEqual(queued, ['miss', 'miss', 'hit', 'hit'], 'new turns can emit identical effects');
 assert.equal(sounds.length, 1);
 assert.equal(sounds[0].name, 'win');
 assert.equal(sounds[0].drawn.status, 'finished');
 await c.campCall('camp_poll');
 assert.equal(sounds.length, 1);
 assert.deepEqual(clean(c.campFrameEffects({effects: [miss, hit]}, [miss])), [hit]);
 assert.equal(c.campFrameEffects({effects: [miss, hit]}, [miss, hit]).length, 0);
 console.log('PASS playback: legacy duplicates, identical new hits, HP/status on impact, outcome sound once after replay');
}

const server = process.argv[2], serverBase = process.argv[3];
if (server && serverBase) {
 const source = fs.readFileSync(server, 'utf8');
 const baseline = fs.readFileSync(serverBase, 'utf8');
 const starter = vm.runInContext("accountTemplates['swordsman|mandrake']", engine(source, false).context);
 verifyFrames(raid(source, false, starter), raid(baseline, false, starter));
 const current = fs.readFileSync(bundle, 'utf8');
 const prior = execFileSync('git', ['show', 'f4b2032:' + bundle], {encoding: 'utf8'});
 verifyFrames(raid(current, true, starter), raid(prior, true, starter));
}
verifyPlayback().catch(error => {
 console.error(error);
 process.exitCode = 1;
});
