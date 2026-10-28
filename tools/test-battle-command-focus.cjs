const assert=require('node:assert/strict');
const {run:r}=require('./game-context.cjs')('build/live-index.html');
r(`const focusFrames=[],focusMoves=[];window.requestAnimationFrame=fn=>focusFrames.push(fn);const focusMain={scrollTop:0,scrollHeight:1300,clientHeight:700,style:{},getBoundingClientRect:()=>({top:100}),querySelector:s=>s==='#battleCommandBody'?focusBody:focusArena};const focusBody={hidden:false,getBoundingClientRect:()=>({top:800-focusMain.scrollTop})},focusArena={getBoundingClientRect:()=>({top:140-focusMain.scrollTop})};document.querySelector=()=>focusMain;let focusBusy=false;MotionTimeline.busy=()=>focusBusy;const focusPlayer={id:'P',side:'ally',kind:'player',hp:100,mp:100},focusPet={id:'pet1',side:'ally',kind:'pet',hp:100};S.battle={round:1,cur:'P',queue:['pet1','enemy'],allies:[focusPlayer,focusPet],enemies:[],menu:'main'};S.ui.autoTeam=false;S.ui.autoPet=false;const focusTick=()=>{BattleCommandFocus.prepare();BattleCommandFocus.sync();while(focusFrames.length)focusFrames.shift()();};`);
r('focusTick()');assert.equal(r('focusMain.scrollTop'),688,'first manual turn scrolls to commands');
r('focusMain.scrollTop=300;focusTick()');assert.equal(r('focusMain.scrollTop'),300,'ordinary render preserves browsing');
r("S.battle.menu='skill';focusTick()");assert.equal(r('focusMain.scrollTop'),688,'submenu stays at command heading');
r('focusMain.scrollTop=300;focusTick()');assert.equal(r('focusMain.scrollTop'),300,'target/stat rerender does not recenter');
r("BattleCommandFocus.commit();focusBusy=true;S.battle.menu='wait';focusTick()");assert.equal(r('focusMain.scrollTop'),28,'accepted action shows arena');
r("S.battle.cur='pet1';S.battle.queue=['enemy'];S.battle.menu='main';focusTick()");assert.equal(r('focusMain.scrollTop'),28,'effects finish before command scroll');
r('focusBusy=false;focusTick()');assert.equal(r('focusMain.scrollTop'),688,'manual pet turn scrolls to commands');
r("BattleCommandFocus.commit();focusBusy=true;focusTick();focusBusy=false;focusTick()");assert.equal(r('focusMain.scrollTop'),688,'same-actor extra turn gets commands after effects');
r("S.ui.autoPet=true;focusTick();focusMain.scrollTop=28;focusTick()");assert.equal(r('focusMain.scrollTop'),28,'auto turns do not focus commands');
r("S.ui.autoPet=false;BattleCommandFocus.prepare();BattleCommandFocus.sync();BattleCommandFocus.commit();while(focusFrames.length)focusFrames.shift()()");assert.equal(r('focusMain.scrollTop'),28,'stale queued command scroll cannot override committed action');
// Failed actions retain command position; no changes to combat data or saved player.
r(`S.battle.cur='P';S.battle.menu='main';focusBusy=false;focusTick();const beforeFocusPlayer=JSON.stringify(S.P);const focusOriginalAct=act,focusOriginalAfter=after;act=()=>false;after=()=>{throw Error('invalid action advanced turn')};battleAction('sk:attack');`);
assert.equal(r('focusMain.scrollTop'),688);assert.equal(r('JSON.stringify(S.P)===beforeFocusPlayer'),true);
r('act=focusOriginalAct;after=focusOriginalAfter;S.battle=null;focusTick()');
assert.equal(r('BattleCommandFocus.battle'),null);
console.log('PASS command show/turn/submenu focus, arena on commit, busy/auto guards, extra turns, stale callbacks, invalid action unchanged');
