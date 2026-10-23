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
assert.equal(crypto.createHash('sha256').update(run('JSON.stringify(EQ)')).digest('hex'),'30197bbd49049f6e5a178229ae0c941d40eeff6256000ee38e8d822c5bc12284','Every existing equipment property must stay unchanged');
assert(fs.readFileSync('client/styles.css','utf8').includes('object-fit:contain'));
console.log('PASS 16 unique full-composition Eclipse images; all equipment stats, abilities and rates unchanged; existing 32 art intact; 3-language icon bindings');
