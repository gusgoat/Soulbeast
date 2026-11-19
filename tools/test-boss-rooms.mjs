import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {bossRoomParts,BOSS_ROOM_THEMES} from '../assets/forest-walk/boss-rooms.js';
import {BOSS_ROOM_FRAMES} from '../assets/forest-walk/boss-room-frames.js';
import {BOSS_STATUE_FRAMES} from '../assets/forest-walk/boss-statue-frames.js';
assert.equal(BOSS_ROOM_THEMES.length,8);assert.equal(BOSS_ROOM_THEMES.filter(t=>t.walking).length,7);
assert.deepEqual(new Set(BOSS_ROOM_THEMES.map(t=>t.zone)),new Set([1,2,3,4,5,6,7,8]));
// Compare with the native country entrance catalogue, including late-added zones.
await import('./hemant-walk-demo/forest-catalog.js');
assert.deepEqual(new Set(BOSS_ROOM_THEMES.map(t=>t.zone)),new Set(Object.keys(globalThis.ForestEntranceData.zones).map(Number)));
const binding=BOSS_ROOM_THEMES.find(t=>t.zone===8);assert.equal(binding.boss,'เฟอร์รอธ และมอร์ทิวาร์');assert.equal(binding.level,60);
for(const {theme} of BOSS_ROOM_THEMES){
  const parts=bossRoomParts(theme,'test');
  assert.equal(parts.filter(p=>p.closedDoor).length,1);
  assert(parts.some(p=>p.ground));assert(parts.filter(p=>p.source).length===8);
  const statues=parts.filter(p=>p.bossStatue);assert.deepEqual(statues.map(p=>p.bossStatue),['left','right']);
  assert(statues[0].x+statues[0].width/2<1.05-4.4);assert(statues[1].x-statues[1].width/2>1.05+4.4);
  for(let z=-45;z<=-16.25;z+=.25)for(const p of statues)assert(Math.hypot(1.05-p.x,z-p.z)>p.radius+.36,'statue blocks approach');
  const player=[1.05,-11.9-4.35];
  for(const p of parts.filter(p=>p.radius))assert(Math.hypot(player[0]-p.x,player[1]-p.z)>p.radius+.36,theme+' blocked original boss contact');
  const door=parts.find(p=>p.closedDoor);assert(door.radius>0,'closed door needs collision');
  const png=await readFile(new URL('../assets/forest-walk/generated/boss-rooms/'+theme+'.png',import.meta.url));
  assert.equal(png[25],6);const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  for(const [x,y,cw,ch]of BOSS_ROOM_FRAMES[theme])assert(x>=0&&y>=0&&cw>0&&ch>0&&x+cw<=w&&y+ch<=h);
  const statuePNG=await readFile(new URL('../assets/forest-walk/generated/boss-statues/'+theme+'.png',import.meta.url));
  assert.equal(statuePNG[25],6);
  for(const [x,y,cw,ch]of BOSS_STATUE_FRAMES[theme])assert(x>=0&&y>=0&&cw>0&&ch>0&&x+cw<=statuePNG.readUInt32BE(16)&&y+ch<=statuePNG.readUInt32BE(20));
}
console.log('PASS eight closed boss chambers with separate guardian pairs: native catalogue, RGBA bounds, open central approach and original boss contact; seven local walking themes enabled');
