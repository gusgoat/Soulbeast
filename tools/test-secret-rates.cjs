const assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const g=require('./game-context.cjs')(file),r=g.run;
 r('render=()=>{};const rateRandom=Math.random;');
 assert.equal(r('SECRET_DATA.testDiscovery100'),false);
 assert.equal(r('SECRET_DATA.oncePerCharacter'),true);
 for(const zone of [7,1,2,3,4,5,6]){
  const chance=[7,1,2,3].includes(zone)?.10:.05;
  r(`handlers.newgame();var rateLocation=SECRET_DATA.locations.find(d=>d.zone===${zone});`);
  assert.equal(r('Secret.chance(rateLocation)'),chance,'Zone '+zone);
  // Each forest entry rolls once; depth selection is separate and remains 5–8.
  for(const roll of [0,chance-.00001,chance,.99999]){
   r(`S.zone={id:${zone},depth:0,log:[]};var rateCalls=0;Math.random=()=>++rateCalls===1?${roll}:.999;Secret.plan(S.zone);`);
   assert.equal(r('S.zone.secretRun.depth'),roll<chance?8:null);
   const calls=r('rateCalls');
   r('for(let n=0;n<20;n++){S.zone.depth=n%10;Secret.plan(S.zone);}S=JSON.parse(JSON.stringify(S));Secret.plan(S.zone);');
   assert.equal(r('rateCalls'),calls,'No reroll on progress or save reload');
  }
  r(`S.zone={id:${zone},depth:0,log:[]};var rateFound=0,rateSeed=234;Math.random=()=>{rateSeed=(Math.imul(rateSeed,1664525)+1013904223)>>>0;return rateSeed/4294967296;};for(let i=0;i<10000;i++){const z={id:${zone},depth:0,log:[]};if(Secret.plan(z).depth!=null)rateFound++;}Math.random=rateRandom;`);
  assert(Math.abs(r('rateFound/10000')-chance)<.012,'Observed per-run rate: zone '+zone);
  r(`Secret.record(rateLocation.id);S.zone={id:${zone},depth:0,log:[]};Math.random=()=>{throw Error('Discovered location must not roll again')};Secret.plan(S.zone);Math.random=rateRandom;`);
  assert.equal(r('S.zone.secretRun.depth'),undefined,'Once-per-character guard preserved');
 }
 console.log('PASS '+file+': 10/10/10/10/5/5/5%, test mode disabled, once per run, reload stable, depth5–8, once per character');
}
