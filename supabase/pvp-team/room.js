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
