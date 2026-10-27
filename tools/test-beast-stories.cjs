const fs=require('fs'),assert=require('assert/strict');
const g=require('./game-context.cjs')('build/live-index.html'),run=g.run;
const source=require('../content/beast-stories.json').species;
assert.deepEqual(JSON.parse(run('JSON.stringify(BEAST_STORIES)')),source);
assert.deepEqual(Object.keys(source).sort(),JSON.parse(run('JSON.stringify(Object.keys(SP).sort())')));
assert.equal(Object.keys(source).length,132);
for(const [sp,v]of Object.entries(source)){assert.equal(v.story.length,8,sp);assert(v.origin&&v.title&&v.references.length,sp);assert(run(`beastStoryButton('${sp}').includes('data-a="beastStory"')`));}
assert.equal((run("fullBestiary('')").match(/data-a="beastStory"/g)||[]).length,132);
run("render=()=>{};save=()=>{throw Error('Story handlers must not save directly')};Math.random=()=>{throw Error('Story navigation must not use gameplay RNG')};S.screen='team';S.ui.petView=S.P.pets[0].uid;S.ui.packFilter='camp';");
const before=run('JSON.stringify(S.P)'),view=run('S.ui.petView');
run("handlers.beastStory('kappa:2')");assert.equal(run('S.screen'),'beaststory');assert.equal(run('BeastStory.selected.form'),2);
const html=run('vBeastStory()');assert(html.includes('ขันน้ำที่ไม่มีผู้เฝ้า'));assert(html.includes('280px'));assert(html.includes('gallery-motion'));assert(html.includes('noopener noreferrer'));assert.equal((html.match(/data-a="beastStoryBack"/g)||[]).length,2);
run('handlers.beastStoryBack()');assert.equal(run('S.screen'),'team');assert.equal(run('S.ui.petView'),view);assert.equal(run('S.ui.packFilter'),'camp');assert.equal(run('JSON.stringify(S.P)'),before);
run("S.screen='bestiary';S.ui.dexRarity='rare';handlers.beastStory('wisp:99');");assert.equal(run('BeastStory.selected.form'),run('SP.wisp.ev.length'));run('handlers.beastStoryBack()');assert.equal(run('S.screen'),'bestiary');assert.equal(run('S.ui.dexRarity'),'rare');
run("handlers.beastStory('__invalid__:0');handlers.beastStory('__proto__:0')");assert.equal(run('S.screen'),'bestiary');
for(const filter of ['carried','camp']){run(`S.screen='team';S.ui.petView=null;S.ui.packFilter='${filter}';`);if(filter==='camp')run('S.P.carried=[];S.P.party=[];');assert(run("vRoster('').includes('data-a=\"beastStory\"')"),filter);}
assert(run('vPet(S.P.pets[0]).includes(\'data-a="beastStory"\')'));
console.log('PASS all 132 supplied stories/IDs, eight sentences each, book/carried/camp/detail buttons, large animated art, safe source links, exact back context and no stats/save/RNG changes');
