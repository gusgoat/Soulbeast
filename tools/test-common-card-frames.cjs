const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
for(const file of ['build/live-index.html','build/staging-index.html']){
 const {run}=require('./game-context.cjs')(file);
 const species=JSON.parse(run('JSON.stringify(Object.entries(SP).filter(([k,q])=>k!=="demonlord"&&!q.rare&&!q.legendary&&!q.solar).map(([k,q])=>({k,forms:1+(q.ev?.length||0)})))'));
 const original=run('JSON.stringify(S)');
 for(const {k,forms} of species){
  const kind=forms>=3?'three':forms===2?'two':'one';
  for(let form=0;form<forms;form++){
   const html=run(`UnitFrames.attributes({sp:${JSON.stringify(k)},form:${form}})`);
   assert(html.includes('data-beast-frame="'+kind+'"'),k+' form '+form);
   assert(html.includes('data-card-rarity="common"'),k);
  }
 }
 assert.equal(run('JSON.stringify(S)'),original,'Decoration must not mutate saves');
 const book=run('fullBestiary("")');
 for(const [k,kind] of [['harpy','one'],['nekomata','two'],['kappa','three']])assert(book.includes('data-beast-frame="'+kind+'"'));
 assert(book.includes('data-beast-frame="boss"'));
 run('S.P.cls="summoner";S.P.lv=30;S.ui.hero="stat"');
 assert(run('vHero()').includes('data-panel-art="promotion"'));
 assert(run('vHero()').includes('data-panel-art="stats"'));
 for(const tab of ['skill','gear']){run(`S.ui.hero='${tab}'`);assert(run('vHero()').includes('data-panel-art="'+(tab==='gear'?'equipment':'skills')+'"'));}
 console.log('PASS '+file+': '+species.length+' common species retain white/green/blue identity across all evolution forms; boss excluded, themed hero panels and unchanged saves');
}
const art=require('../content/menu-portrait-v2.json');
assert.equal(art.assets.length,14);
for(const a of art.assets){const b=fs.readFileSync(a.path);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,a.id);}
console.log('PASS 11 new portrait backgrounds and 3 transparent frame assets with exact provenance');
