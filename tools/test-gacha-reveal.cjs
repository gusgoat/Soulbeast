const assert=require('node:assert/strict');const {run:r}=require('./game-context.cjs')('build/live-index.html');
r(`GACHA.rewards=Object.entries(SP).map(([key])=>({type:'pet',key,category:'beast'}));`);
assert.equal(r(`GACHA.rewards.every(r=>gachaRevealColor(r)===(SP[r.key].solar?'red':SP[r.key].legendary?'gold':SP[r.key].rare?'purple':(SP[r.key].ev||[]).length>=2?'blue':(SP[r.key].ev||[]).length===1?'green':'white'))`),true);
for(const [category,color]of Object.entries({item:'white',gear:'green',premium:'blue',craft:'blue',legendGear:'purple',eclipseGear:'gold',eternal:'blue'}))assert.equal(r(`gachaRevealColor({type:'item',category:'${category}'})`),color);
r(`GACHA.rewards=[{type:'pet',key:'kappa',category:'beast'},{type:'item',key:'pot',category:'item'}];`);
let html=r('gachaRevealScene()');assert(!html.includes('gacha-front'));assert(!html.includes('คัปปะ'));assert(!html.includes('data-motion-actor'));
const before=r('JSON.stringify(S.P)');r('render=()=>{};GachaReveal.entryAt=0;handlers.gachaRevealOne("0")');html=r('gachaRevealScene()');assert.equal((html.match(/class="gacha-front"/g)||[]).length,1);assert(html.includes('คัปปะ'));r('handlers.gachaRevealOne("0")');assert.equal(r('GachaReveal.opened.size'),1);r('handlers.gachaRevealAll()');assert.equal(r('GachaReveal.opened.size'),2);assert.equal(r('JSON.stringify(S.P)'),before);
r('GACHA.rewards=GACHA.rewards.slice();gachaRevealScene()');assert.equal(r('GachaReveal.opened.size'),0);r('GACHA.rewards=Array(11).fill(GACHA.rewards[0])');html=r('gachaRevealScene()');assert.equal((html.match(/class="gacha-reveal-stage /g)||[]).length,2);assert.equal((html.match(/data-a="gachaRevealOne"/g)||[]).length,11);
console.log('PASS gacha reveal rarity, hidden rewards, individual/all reveal, duplicate clicks, receipt reset, overflow rewards, unchanged player data');

r(`const revealAudio=[];Sound.ctx={state:'running'};Sound.tone=(...a)=>revealAudio.push(['tone',...a]);Sound.hiss=(...a)=>revealAudio.push(['hiss',...a]);Sound.enabled=false;gachaRevealSound([{type:'item',category:'eclipseGear'}]);`);
assert.equal(r('revealAudio.length'),0,'muted reveal must schedule no audio');
r(`Sound.enabled=true;GACHA.rewards=[{type:'item',key:'pot',category:'eclipseGear'},{type:'item',key:'pot',category:'item'}];gachaRevealSync();GachaReveal.entryAt=0;handlers.gachaRevealOne('0');`);
assert(r('revealAudio.length')>0);const voices=r('revealAudio.length');r(`handlers.gachaRevealOne('0')`);assert.equal(r('revealAudio.length'),voices,'reopening a card must not replay sound');
let effect=r('gachaRevealScene()');assert(effect.includes('gacha-unseal'));effect=r('gachaRevealScene()');assert(!effect.includes('gacha-unseal'),'effects must not replay on unrelated rendering');
console.log('PASS reveal sound respects mute, duplicate clicks are silent, high rarity burst plays once');

assert.equal(r(`Object.keys(SP).every(key=>{const a=CharacterMotion.resolve({sp:key,evo:0}),html=gachaFrontContent({type:'pet',key,category:'beast'},0,true);return !a||(html.includes(a.assets.idle)&&html.includes(a.assets.windup)&&html.includes('data-reveal-windup="true"')&&!html.includes('class="pt ')&&html.includes('um-embers')===!!a.identity.particles);})`),true,'all beasts use original idle/windup art and exact particle policy');
assert(r(`gachaFrontType({type:'pet',key:'kappa'})`).includes('3'));
assert(r(`gachaFrontContent({type:'gear',key:WORLD_LEGENDS[0],category:'eclipseGear'},0,true)`).includes('equipment-motes'));
assert(!r(`gachaFrontContent({type:'item',key:'pot',category:'item'},0,true)`).includes('um-body'));
console.log('PASS full-art beast faces preserve source poses and particles; form labels, Eclipse gear motes and stationary item artwork');

r(`GACHA.rewards=[{type:'item',key:'pot',category:'item'}];gachaRevealSync();`);
assert.equal(r('gachaDealing()'),true);const entryAt=r('GachaReveal.entryAt');
assert(r('gachaRevealScene()').includes('gacha-arrival-portal'));r(`handlers.gachaRevealOne('0');handlers.gachaRevealAll();`);assert.equal(r('GachaReveal.opened.size'),0,'early taps must not bypass summoning');
r('gachaRevealSync()');assert.equal(r('GachaReveal.entryAt'),entryAt,'rerender must not restart receipt animation');
r('GachaReveal.entryAt=Date.now()-5000');assert(!r('gachaRevealScene()').includes('gacha-arrival-portal'));r(`handlers.gachaRevealOne('0')`);assert.equal(r('GachaReveal.opened.size'),1);
r(`GACHA.rewards=GACHA.rewards.slice();window.matchMedia=()=>({matches:true});gachaRevealSync();`);assert.equal(r('gachaDealing()'),false,'reduced motion opens immediately');
console.log('PASS summoning precedes cards, early taps blocked, receipt timing preserved across render, ready/skip states');
// Each card gets a flip sound, including Open All; only gold/red get fanfare notes.
r(`Sound.enabled=true;revealAudio.length=0;gachaRevealSound(['item','gear','premium','legendGear'].map(category=>({type:'item',category})));`);
assert.equal(r(`revealAudio.filter(a=>a[0]==='hiss').length`),4);
assert.equal(r(`revealAudio.filter(a=>a[0]==='tone').length`),0,'ordinary/purple flips have no celebration');
r(`revealAudio.length=0;GACHA.rewards=[{type:'item',key:'pot',category:'item'},{type:'item',key:'pot',category:'premium'},{type:'gear',key:WORLD_LEGENDS[0],category:'eclipseGear'}];gachaRevealSync();GachaReveal.entryAt=0;handlers.gachaRevealAll();`);
assert.equal(r(`revealAudio.filter(a=>a[0]==='hiss').length`),3,'Open All plays one whoosh for every remaining card');
assert.equal(r(`revealAudio.filter(a=>a[0]==='tone').length`),5,'one gold celebration');
assert.deepEqual(Array.from(r(`revealAudio.filter(a=>a[0]==='hiss').map(a=>a[4])`)),[0,.09,.18]);
const soundCount=r('revealAudio.length');r('handlers.gachaRevealAll()');assert.equal(r('revealAudio.length'),soundCount,'already-open cards stay silent');
// Shortcut is inside each art stage and does not reveal reward text ahead of time.
r(`GACHA.rewards=[{type:'item',key:'pot',category:'item'}];`);html=r('gachaRevealScene()');
assert(html.indexOf('gacha-open-all')>html.indexOf('class="gacha-reveal-stage'));
assert(html.indexOf('gacha-open-all')<html.indexOf('class="gacha-card-grid'));
assert.equal((html.match(/data-a="gachaRevealAll"/g)||[]).length,1);
// Focus once per new receipt, never again on card flips or unrelated renders.
r(`const dealFocusFrames=[],dealFocusMoves=[];window.requestAnimationFrame=fn=>dealFocusFrames.push(fn);document.querySelector=selector=>selector==='.gacha-reveal-stage'?{scrollIntoView:o=>dealFocusMoves.push(o)}:null;S.screen='gacha';GACHA.rewards=GACHA.rewards.slice();gachaRevealSync();while(dealFocusFrames.length)dealFocusFrames.shift()();`);
assert.equal(r('dealFocusMoves.length'),1);assert.equal(r('dealFocusMoves[0].block'),'start');
r('gachaRevealSync()');assert.equal(r('dealFocusFrames.length'),0);
r(`GACHA.rewards=GACHA.rewards.slice();gachaRevealSync();S.screen='town';while(dealFocusFrames.length)dealFocusFrames.shift()();`);
assert.equal(r('dealFocusMoves.length'),1,'leaving gacha cancels stale focus');
console.log('PASS per-card flip sounds, gold/red-only fanfares, in-art shortcut and one-time receipt focus with stale-screen guard');
