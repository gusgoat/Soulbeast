const assert=require('assert/strict');
for(const file of ['build/live-index.html','build/staging-index.html']){
const g=require('./game-context.cjs')(file),r=g.run;
r('render=()=>{};save=()=>{};toast=()=>{};Secret.persist=()=>{};Sound.fx=()=>{};');
assert.equal(r('TALES_DATA.quests.filter(d=>d.zone===8).length'),4);
assert.equal(r('FOREST_RIDDLES.filter(d=>d.zone===8).length'),4);
assert.equal(r('TALES_DATA.special.filter(d=>d.zone===8).length'),1);
assert.equal(r('SECRET_DATA.repeatableEvents.filter(d=>d.zone===8).length'),1);
assert(r("WorldTales.extraPanel(8,1,'test').includes('quests.png')"));
assert(r("WorldTales.afterDef({zone:8,source:'special:encounter-8'}).hint.length===2"));
r('S.P.forestClears={};');const owned=r('S.P.owned.length');
r("handlers.stageSevenFirstReward('gear')");assert.equal(r('S.P.owned.length'),owned);
r('S.P.forestClears[8]=1;');const original=r('JSON.stringify(S)');
r("handlers.stageSevenFirstReward('gear')");assert.equal(r('S.P.owned.length'),owned+1);assert(r('EQ[S.P.stageSevenFirstReward.id].worldLegend'));
r("S=JSON.parse(JSON.stringify(S));handlers.stageSevenFirstReward('pet')");assert.equal(r('S.P.owned.length'),owned+1);assert.equal(r('S.P.stageSevenFirstReward.choice'),'gear');
r('S='+original);const pets=r('S.P.pets.length');r("handlers.stageSevenFirstReward('pet')");assert.equal(r('S.P.pets.length'),pets+1);assert(r('SP[S.P.pets.at(-1).sp].legendary&&!SP[S.P.pets.at(-1).sp].solar&&S.P.pets.at(-1).lv===60'));
r('S='+original);r("Secret.persist=()=>{throw Error('storage')};handlers.stageSevenFirstReward('gear')");assert.equal(r('S.P.owned.length'),owned);assert(r('stageSevenFirstEligible()'));r('Secret.persist=()=>{}');
for(const d of JSON.parse(r('JSON.stringify(FOREST_RIDDLES.filter(d=>d.zone===8))'))){
g.ctx.def=d;r("S.zone={id:8,depth:5,log:[],riddleSession:{id:def.id,token:'test',answered:false,phase:'question',results:[]}};S.screen='zone';ForestRiddle.persist=()=>{};ForestRiddle.focus=()=>{};ForestRiddle.choose('test',def.answer)");assert(r('ForestRiddle.session().correct'));assert(r("ForestRiddle.panel(def.id,0,'scene').includes('riddles.png')"));
}
console.log('PASS '+file+': stage7 content counts, aftermath art, first reward eligibility/exclusivity/reload/rollback and all correct riddles');
}
