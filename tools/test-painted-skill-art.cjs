const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const art=JSON.parse(fs.readFileSync('content/individual-skill-art.json','utf8'));
const crops=JSON.parse(fs.readFileSync('content/skill-art-painted-v2/crops.json','utf8'));
const jobs=JSON.parse(fs.readFileSync('content/skill-art-painted-v2/jobs.json','utf8'));
assert.equal(art.version,2);assert.equal(art.skills.length,(504+require('../content/eclipse-expansion.json').skills.length));assert.equal(crops.skills.length,384);assert.equal(jobs.jobs.length,24);
assert.equal(jobs.generator,'built-in image_gen.imagegen');
assert.equal(new Set(art.skills.map(a=>a.id)).size,(504+require('../content/eclipse-expansion.json').skills.length));
for(const a of art.skills){
 assert(a.path.startsWith('assets/skills/painted-v2/')&&a.path.endsWith('.webp'),a.id);
 const file=fs.readFileSync(a.path);assert.equal(file.toString('ascii',0,4),'RIFF');assert.equal(file.toString('ascii',8,12),'WEBP');
 assert.equal(crypto.createHash('sha256').update(file).digest('hex'),a.sha256);
 const [l,t,r,b]=a.cropBox,[w,h]=a.sourceSize,[ow,oh]=a.outputSize;
 assert(l>=0&&t>=0&&r<=w&&b<=h&&r>l&&b>t,a.id+' crop bounds');
 assert(Math.abs((r-l)/(b-t)-ow/oh)<.01,a.id+' original proportions must be preserved');
}
for(const j of jobs.jobs){
 const list=crops.skills.filter(a=>a.sheet===j.key);assert.equal(list.length,16,j.key+' must have all 16 tiles');
 for(const a of list){
  assert.equal(a.id,j.tiles[a.slot].id);const row=Math.floor(a.slot/4),col=a.slot%4;
  assert.deepEqual(a.cropBox,[a.measuredXGutters[col][1]+2,a.measuredYGutters[row][1]+2,a.measuredXGutters[col+1][0]-2,a.measuredYGutters[row+1][0]-2]);
  assert(a.remainingGuideEdgeRatio<=.005,a.id+' guide contamination');
 }
}
const css=fs.readFileSync('client/styles.css','utf8');
assert(/\.skill-painted>\.skill-raster\{[^}]*background-size:contain/.test(css));
const runtime=fs.readFileSync('runtime/presentation.js','utf8');
assert(runtime.includes("assets/skills/painted-v2/${key}.webp"));assert(runtime.includes('skill-paint skill-individual skill-raster'));
console.log('PASS 384 image-generated crops + 120 retained painted crops + 16 individual Eclipse illustrations: all measured gutters, complete tile coverage, original proportions, WebP hashes and contain rendering.');
