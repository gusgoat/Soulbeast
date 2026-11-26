const assert = require('node:assert/strict');
const {countries} = require('./hemant-walk-demo/country-regions-data.js');
const {create} = require('./hemant-walk-demo/destination-guide.js');
const navigation = require('./hemant-walk-demo/navigation.js');
const terrain = require('./hemant-walk-demo/terrain.js');
const guide = create(countries);
const start = countries.green.regions.E;
const dungeon = guide.lookup('red/W/seven-floor-dungeon');

for (const country of Object.values(countries)) {
  for (const map of Object.values(country.regions)) {
    const groups = guide.groups(map);
    const entries = groups.flat();
    assert.equal(new Set(entries.map(d => d.key)).size, entries.length);
    for (const [column, items] of groups.entries()) {
      for (const dest of items) {
        const expected = dest.country !== map.countryId ? 2 : dest.region !== map.regionId ? 1 : 0;
        assert.equal(column, expected, dest.key);
        const gates = guide.gatesTo(map, dest);
        assert.ok(gates, dest.key);
        const last = gates.at(-1);
        assert.equal(last?.targetCountry ?? map.countryId, dest.country);
        assert.equal(last?.targetRegion ?? map.regionId, dest.region);
      }
    }
  }
}

// This trip crosses three gates. A line towards the next road node can hit a bridge rail.
let map = start;
let arrival;
let crossings = 0;
for (;;) {
  const nav = navigation.create(map);
  nav.setTerrain(terrain.create(map, nav));
  const player = arrival ?? nav.spawnAt(map.cities[0]);
  const gate = guide.gatesTo(map, dungeon)[0];
  const destination = gate ?? dungeon.place;
  const radius = gate ? 36 : 130;
  const path = nav.guideRoute(player, destination.id, radius);
  assert.ok(path.length, destination.name);
  for (const waypoint of path) {
    let stepsLeft = Math.ceil(nav.distance(player, waypoint) / 5) + 2;
    while (nav.distance(player, waypoint) >= .01) {
      assert.ok(stepsLeft-- > 0, 'Stalled on approach to ' + destination.name);
      const distance = nav.distance(player, waypoint);
      const step = Math.min(5, distance) / distance;
      const x = player.x + (waypoint.x - player.x) * step;
      const y = player.y + (waypoint.y - player.y) * step;
      assert.ok(nav.playerMove(player, {x,y}), destination.name);
    }
  }
  assert.ok(nav.distance(player, destination) <= radius + .01);
  if (!gate) break;
  assert.ok(++crossings < 12);
  map = countries[gate.targetCountry].regions[gate.targetRegion];
  const back = map.gates.find(g => g.id === gate.id);
  arrival = {x: back.x + back.inward.x * 180, y: back.y + back.inward.y * 180};
}
assert.equal(crossings, 3);
console.log('Cross-region destinations and bridge approach passed.');
