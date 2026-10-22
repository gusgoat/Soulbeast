const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const jobs=JSON.parse(fs.readFileSync('content/class-portrait-jobs.json'));
assert.equal(jobs.length,63);assert.equal(new Set(jobs.map(j=>j.id)).size,63);
for(const j of jobs){
 const meta=JSON.parse(fs.readFileSync('content/class-portrait-prompts/'+j.id+'.json'));
 assert.equal(meta.newGender,j.newGender);assert.equal(meta.originalGender,j.originalGender);
 assert(fs.statSync(meta.target).size>10000);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(j.art)).digest('hex'),j.originalSHA256,j.id+' legacy art was changed');
}
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r('render=()=>{};Sound.fx=()=>{};');
 // All starting professions and both choices; same combat stats, load/store gender.
 for(const base of JSON.parse(r('JSON.stringify(BASES)')))for(const gender of ['male','female']){
  r(`S.screen='start';S.ui={cls:'${base}',gender:'${gender}'};handlers.newgame();`);
  assert.equal(r('S.P.gender'),gender);assert.equal(r('S.P.cls'),base);
  const stats=r('JSON.stringify(pStats())');r('S=JSON.parse(gsData());');assert.equal(r('S.P.gender'),gender);assert.equal(r('JSON.stringify(pStats())'),stats);
  r('var expectedStats=JSON.stringify(pStats());delete S.P.gender;');assert.equal(r('JSON.stringify(pStats())'),stats);
 }
 for(const j of jobs)for(const gender of ['male','female']){
  r(`S.screen='town';S.P.cls='${j.id}';S.P.gender='${gender}';`);
  const expected=gender===j.originalGender?j.art:'assets/portraits/'+j.id+'-'+gender+'.webp';
  assert.equal(r(`classPortraitSource('${j.id}','${gender}')`),expected);
  assert(r("portrait('player',64)").includes(expected),j.id+' '+gender);
  assert(r("townNavArt('hero')").includes(expected));
  assert(r("bagVitals()").includes(expected));
  assert.equal(r('playerUnit().gender'),gender);
  // A remote old character and old NPC must not inherit this viewer's gender.
  assert(r(`unitPortrait({kind:'player',cls:'${j.id}',img:'player'},40)`).includes(j.art));
  assert(r(`portrait('npc:${j.id}',40)`).includes(j.art));
  r('delete S.P.gender;');assert(r("portrait('player',64)").includes(j.art));
  assert(!r("portrait('player',64)").includes('assets/portraits/'));
 }
 // Promotion must retain chosen gender through every edge of the class tree.
 for(const j of jobs.filter(j=>j.parent))for(const gender of ['male','female']){
  r(`S.P.cls='${j.parent}';S.P.gender='${gender}';S.P.lv=60;handlers.dopromote('${j.id}');`);
  assert.equal(r('S.P.cls'),j.id);assert.equal(r('S.P.gender'),gender);
 }
 r("IMG.player='data:image/png;base64,TEST_CUSTOM';S.P.gender='female';");assert(r("portrait('player',64)").includes('TEST_CUSTOM'));r('delete IMG.player;');
 r("S.screen='start';S.ui={gender:'female',introSeen:true};");assert(r('vStart()').includes('data-a="genderpick"'));assert(r('vStart()').includes('aria-pressed="true"'));
 r("S.screen='town';var priorGender=S.P.gender;handlers.genderpick('male');");assert.equal(r('S.P.gender'),r('priorGender'));
 console.log('PASS '+file+': 126 class/gender portraits, 18 creation choices, save reload, all promotion edges, legacy/custom art, no stat changes');
}
