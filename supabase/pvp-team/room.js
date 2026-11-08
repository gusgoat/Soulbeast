// Team matches share the duel engine. A seat owns its own units, independently
// of the side those units fight on.
function pvpSide_(room, seat) {
 return room.mode === '2v2' ? room.players[seat].side : seat;
}

function pvpJoinTeam_(room, row, auth, token, packet) {
 if (room.status !== 'waiting' || room.players.length >= 4) pvpFail_('room full');
 const seat = room.players.length;
 const countA = room.players.filter(player => player.side === 0).length;
 const countB = seat - countA;
 const requested = packet.team;
 if (requested != null && requested !== 0 && requested !== 1) pvpFail_('bad pvp team');
 const side = requested ?? (countA <= countB ? 0 : 1);
 if ((side === 0 ? countA : countB) >= 2) pvpFail_('pvp team full');

 const profile = activityPvpTeam_(auth.P, seat, packet.pets);
 const team = side === 0 ? room.battle.allies : room.battle.enemies;
 for (const unit of profile.team) unit.side = side === 0 ? 'ally' : 'enemy';
 team.push(...profile.team);
 room.players.push({
  code: auth.code, tokenHash: hash_(room.id, token), name: profile.name,
  cls: profile.cls, lv: profile.lv, gold: profile.gold, side, ready: false
 });
 room.rev++;
 room.battle.log.push(profile.name + ' เข้าทีม ' + (side === 0 ? 'A' : 'B'));
 if (room.players.length === 4) {
  room.status = 'lobby';
  room.expires = Date.now() + 5 * 60000;
  room.battle.log.push('ผู้เล่นครบแล้ว รอทั้งสี่คนยืนยัน');
 }
 pvpWrite_(room, row);
 return {...pvpView_(room, seat), token};
}

function pvpMoveTeamSeats_(room, seat, partner) {
 const player = room.players[seat];
 const nextSide = 1 - player.side;
 if (partner != null) room.players[partner].side = player.side;
 player.side = nextSide;

 const units = [...room.battle.allies, ...room.battle.enemies];
 room.battle.allies = [];
 room.battle.enemies = [];
 for (const unit of units) {
  const ally = room.players[unit.owner].side === 0;
  unit.side = ally ? 'ally' : 'enemy';
  (ally ? room.battle.allies : room.battle.enemies).push(unit);
 }
 for (const member of room.players) member.ready = false;
 room.teamRevision = (room.teamRevision || 0) + 1;
}

function pvpChangeTeam_(room, seat, packet) {
 if (room.mode !== '2v2' || !['waiting', 'lobby'].includes(room.status)) pvpFail_('pvp team locked');
 const player = room.players[seat];
 const swap = room.teamSwap;
 if (packet.response != null) {
  if (!swap || packet.swapId !== swap.id) pvpFail_('pvp swap expired');
  if (packet.response === 'cancel') {
   if (swap.from !== seat) pvpFail_('unauthorized');
  } else {
   if (swap.to !== seat) pvpFail_('unauthorized');
   if (packet.response === 'accept') {
    pvpMoveTeamSeats_(room, swap.from, seat);
    room.battle.log.push(room.players[swap.from].name + ' สลับทีมกับ ' + player.name);
   } else if (packet.response !== 'decline') pvpFail_('bad action');
  }
  delete room.teamSwap;
 } else {
  if ((packet.teamRevision ?? 0) !== (room.teamRevision || 0)) pvpFail_('pvp teams changed');
  if (swap) pvpFail_('pvp swap pending');
  const destination = room.players.filter(member => member.side !== player.side);
  if (destination.length < 2) {
   pvpMoveTeamSeats_(room, seat);
   room.battle.log.push(player.name + ' ย้ายไปทีม ' + (player.side === 0 ? 'A' : 'B'));
  } else {
   const target = Number.isInteger(packet.target) && room.players[packet.target];
   if (!target || target.side === player.side) pvpFail_('bad pvp team');
   room.teamSwap = {id:room.rev + 1, from:seat, to:packet.target};
  }
 }
 room.rev++;
}
