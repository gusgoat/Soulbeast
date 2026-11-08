const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(process.argv[2], 'utf8')
 .split('const accountCors=')[0].replace(/^import .*\r?\n/gm, '');
const digest = value => crypto.createHash('sha256').update(value).digest();
const context = vm.createContext({
 console, TextEncoder, TextDecoder, Uint8Array, Date, structuredClone,
 crypto: crypto.webcrypto, btoa, atob, sha256: digest
});
vm.runInContext(source, context);
const book = context.createWorkbook({});
const utilities = context.createUtilities(digest, () => crypto.randomUUID());
const engine = context.accountEngineFactory(context.createEngine, v => digest(v).toString('hex'))(book, utilities);
const codes = Array.from({length: 5}, (_, i) => 'PVPTEAMTEST0000' + i);
const pin = 'test-party-1';
const send = (seat, action, extra={}) => engine.dispatch({code:codes[seat], pin, action:'pvp_'+action, ...extra});
const success = result => {
 assert.equal(result.ok, true, result.error);
 return result;
};
for (const [seat, code] of codes.entries()) {
 const state = structuredClone(vm.runInContext("accountTemplates['swordsman|mandrake']", context));
 Object.assign(state.P, {code, name:'Sealer '+seat, gold:100});
 success(engine.dispatch({action:'save', code, pin, data:JSON.stringify(state)}));
}
const tokens = [];
const create = mode => {
 const result=success(send(0, 'create', mode ? {mode} : {}));
 tokens[0] = result.token;
 return result.room;
};
const join = (id, seat, team) => {
 const result=success(send(seat, 'join', {room:id, team}));
 tokens[seat] = result.token;
 return result.room;
};
const command = (id, seat, action, extra) => send(seat, action, {room:id, token:tokens[seat], ...extra});

let room = create('2v2');
const id = room.id;
assert.equal(room.mode, '2v2');
assert.equal(room.wagers, null);
room = join(id, 1, 0);
assert.equal(room.side, 0);
assert.equal(send(2, 'join', {room:id, team:0}).error, 'pvp team full');
assert.equal(command(id, 0, 'ready').error, 'not lobby');
room = join(id, 2, 1);
assert.equal(room.status, 'waiting');
room = join(id, 3);
assert.equal(room.status, 'lobby');
assert.deepEqual(Array.from(room.players, p => p.side), [0, 0, 1, 1]);
assert.equal(send(4, 'join', {room:id}).error, 'room full');
assert.equal(send(4, 'poll', {room:id, token:tokens[0]}).error, 'character_not_owned');
assert.equal(command(id, 0, 'wager', {type:'gold', qty:20}).error, 'pvp no wagers');
for (let seat=0; seat<4; seat++) {
 room = success(command(id, seat, 'ready')).room;
 assert.equal(room.status, seat===3 ? 'active' : 'lobby');
}
assert.equal(room.battle.teamPvp, true);
const units = [...room.battle.allies, ...room.battle.enemies];
const actor = units.find(unit => unit.id===room.battle.cur);
const teammate = units.find(unit => unit.owner!==actor.owner && unit.side===actor.side);
const target = units.find(unit => unit.side!==actor.side && unit.hp>0);
const attack = {rev:room.rev, request:crypto.randomUUID(), skill:'attack'};
assert.equal(command(id, teammate.owner, 'move', {...attack, target:target.id}).error, 'not your turn');
assert.equal(command(id, actor.owner, 'move', {...attack, target:teammate.id}).error, 'bad target');
const moved = success(command(id, actor.owner, 'move', {...attack, target:target.id})).room;
assert.equal(moved.rev, room.rev+1);
assert.equal(success(command(id, actor.owner, 'move', {...attack, target:target.id})).room.rev, moved.rev);
const finished = success(command(id, 1, 'leave')).room;
assert.equal(finished.status, 'finished');
assert.equal(finished.winner, 1);
assert.equal(finished.wagers, null);
assert.equal(book.tables.PvpWagers?.some(row=>row[0]===id) ?? false, false);

room = create('2v2');
const eliminationId = room.id;
join(eliminationId, 1, 0);
join(eliminationId, 2, 1);
join(eliminationId, 3, 1);
for (let seat=0; seat<4; seat++) room = success(command(eliminationId, seat, 'ready')).room;
function knockOutAndAdvance(heroId) {
 const row=book.tables.PVPRooms.find(entry=>entry[0]===eliminationId);
 const encoded=row.slice(4).map(chunk=>chunk.slice(4)).join('');
 const stored=JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
 stored.battle.allies.find(unit=>unit.id===heroId).hp=0;
 stored.battle.cur='p2';
 row[4]='PV1:'+Buffer.from(JSON.stringify(stored)).toString('base64');
 for(let i=5;i<row.length;i++)row[i]='PV1:';
 return success(command(eliminationId, 2, 'move', {
  rev:stored.rev, request:crypto.randomUUID(), skill:'defend'
 })).room;
}
assert.equal(knockOutAndAdvance('p0').status, 'active');
const eliminated=knockOutAndAdvance('p1');
assert.equal(eliminated.status, 'finished');
assert.equal(eliminated.winner, 1);

room = create('2v2');
const swapRoom = room.id;
const movedSide = success(command(swapRoom, 0, 'team', {teamRevision:0})).room;
assert.equal(movedSide.side, 1);
assert.equal(movedSide.teamRevision, 1);
assert.equal(movedSide.battle.enemies[0].owner, 0);
assert.equal(command(swapRoom, 0, 'team', {teamRevision:0}).error, 'pvp teams changed');
join(swapRoom, 1, 0);
join(swapRoom, 2, 0);
join(swapRoom, 3, 1);
success(command(swapRoom, 0, 'ready', {teamRevision:1}));
const requestSwap = () => success(command(swapRoom, 1, 'team', {target:0, teamRevision:1})).room.teamSwap;
let swap = requestSwap();
assert.equal(command(swapRoom, 2, 'team', {response:'accept', swapId:swap.id}).error, 'unauthorized');
assert.equal(success(command(swapRoom, 0, 'team', {response:'decline', swapId:swap.id})).room.teamSwap, null);
const oldId = swap.id;
swap = requestSwap();
assert.equal(command(swapRoom, 0, 'team', {response:'accept', swapId:oldId}).error, 'pvp swap expired');
assert.equal(success(command(swapRoom, 1, 'team', {response:'cancel', swapId:swap.id})).room.teamSwap, null);
swap = requestSwap();
room = success(command(swapRoom, 0, 'team', {response:'accept', swapId:swap.id})).room;
assert.equal(room.teamRevision, 2);
assert.equal(room.side, 0);
assert.equal(room.teamSwap, null);
assert.ok(room.players.every(player=>!player.ready));
assert.deepEqual(Array.from(room.players, player=>player.side), [0, 1, 0, 1]);
for (const [side,units] of [[0,room.battle.allies],[1,room.battle.enemies]]) {
 assert.ok(units.every(unit=>room.players[unit.owner].side===side && unit.side===(side===0?'ally':'enemy')));
}
assert.equal(command(swapRoom, 0, 'ready', {teamRevision:1}).error, 'pvp teams changed');
for (let seat=0; seat<4; seat++) room = success(command(swapRoom, seat, 'ready', {teamRevision:2})).room;
assert.equal(room.status, 'active');
assert.equal(command(swapRoom, 0, 'team', {teamRevision:2,target:1}).error, 'pvp team locked');
success(command(swapRoom, 1, 'leave'));

room = create();
assert.equal(room.mode, '1v1');
room = join(room.id, 1);
assert.equal(room.status, 'lobby');
assert.equal(room.wagers.rev, 0);
const duelId = room.id;
assert.equal(command(duelId, 0, 'team', {teamRevision:0}).error, 'pvp team locked');
const wager = success(command(duelId, 0, 'wager', {type:'gold', qty:20, wagerRev:0, request:crypto.randomUUID()})).room;
assert.equal(wager.wagers.offers[0].qty, 20);
success(command(duelId, 1, 'wager', {type:'gold', qty:20, wagerRev:1, request:crypto.randomUUID()}));
assert.equal(success(command(duelId, 0, 'ready', {wagerRev:2})).room.status, 'lobby');
assert.equal(success(command(duelId, 1, 'ready', {wagerRev:2})).room.status, 'active');
assert.equal(success(command(duelId, 1, 'leave')).room.winner, 0);
console.log('PASS team selection, four-player readiness, turn ownership, match isolation and legacy wagers');
