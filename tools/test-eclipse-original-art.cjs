const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const g=require('./game-context.cjs')('build/staging-index.html'),run=g.run;
const jobs=require('../content/eclipse-original-art/jobs.json').jobs;
const records=require('../content/eclipse-original-art/art-manifest.json').assets;
assert.equal(jobs.length,16);assert.equal(records.length,16);
assert.equal(new Set(records.map(r=>r.sha256)).size,16);
for(const r of records){
 assert.deepEqual(r.cropBox,[0,0,...r.sourceSize]);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(r.path)).digest('hex'),r.sha256);
 assert.equal(run(`EQ[${JSON.stringify(r.id)}].worldLegend`),1);
 for(const lang of ['th','en','zh-CN']){
  run('GAME_LANGUAGE='+JSON.stringify(lang));
  for(const size of [44,64,100])assert(run(`itemIcon(${JSON.stringify(r.id)},${size})`).includes(r.path));
  assert(run('vWeaponBook()').includes(r.path),'Manual must use replacement art');
 }
}
for(const r of require('../content/eclipse-art-v2/art-manifest.json').assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(r.path)).digest('hex'),r.sha256,'Existing new collection art must stay intact');
assert.equal(crypto.createHash('sha256').update(run('JSON.stringify({gear:EQ,rates:GACHA_RATES})')).digest('hex'),'3e2650f13aa28adde67f27e7ace72d2694ca1f283a6bbc75b0adab48315694f8','Art-only change must preserve every equipment property and gacha rate');
assert(fs.readFileSync('client/styles.css','utf8').includes('object-fit:contain'));
console.log('PASS 16 unique full-composition Eclipse images; all equipment stats, abilities and rates unchanged; existing 32 art intact; 3-language icon bindings');
