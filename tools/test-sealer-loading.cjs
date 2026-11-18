const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function check(source) {
  let markerCount = 0;
  const scope = {
    Image: class { complete = false; naturalWidth = 0; },
    sealerSpriteCatalog: {archdruid: {name: 'Druid', female: {portrait: 'portrait.webp'}}},
    document: {createElement(tag) {
      assert.equal(tag, 'canvas');
      markerCount++;
      return {getContext: () => ({beginPath() {}, ellipse() {}, fill() {}})};
    }},
  };
  vm.runInNewContext(source, scope);
  const avatar = scope.sealerSprites.create({allow3d: false});
  await avatar.sync({cls: 'archdruid', gender: 'female'});
  const draws = [];
  // GroundShadows.sprite deliberately exposes only drawImage.
  const shadowSprite = {drawImage: (...args) => draws.push(args)};
  avatar.draw(shadowSprite, 100, 200, 154, 0, 0, false);
  avatar.draw(shadowSprite, 101, 200, 154, 0, 0, true, true);
  assert.equal(draws.length, 2, 'Loading must keep rendering through the shadow adapter');
  assert.equal(markerCount, 1, 'Reuse the loading canvas between frames');
  assert.equal(draws[0][0], draws[1][0]);
  assert.ok(draws[0].slice(1).every(Number.isFinite));
  const portrait = avatar.current.portrait;
  portrait.complete = true;
  portrait.naturalWidth = 128;
  avatar.draw(shadowSprite, 100, 200, 154, 0, 0, true);
  assert.equal(draws[2][0], portrait, 'Use the portrait once loaded');
  avatar.release();
  avatar.draw(shadowSprite, 100, 200, 154, 0, 0, false);
  assert.equal(draws.length, 3, 'Released avatars must stop drawing');
}

const file = path.join(__dirname, 'town-walk-demo/sealer-sprites.js');
check(fs.readFileSync(file, 'utf8')).then(() => {
  console.log('PASS: loading fallback, drawImage-only shadow adapter, marker reuse, portrait and release');
}).catch(error => {console.error(error); process.exitCode = 1;});
