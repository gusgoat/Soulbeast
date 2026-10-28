const assert=require('assert/strict'),fs=require('fs');
(async()=>{
const g=require('./game-context.cjs')('build/staging-index.html'),r=g.run;
r('S.screen="zone";S.zone={id:7,depth:0,log:[],fork:[{k:"spring",h:false},{k:"bush",h:false}]};S.battle=null;Sound.enabled=false;');
const html=r('vZone()');assert(html.includes('forest-journey'));assert(!html.includes('<small>'+r('EV.spring.d')+'</small>'));assert(html.includes(r('EV.spring.n')));
const sources=require('../content/forest-journey-art.json');for(const scenes of Object.values(sources.zones))for(const scene of scenes)assert(fs.existsSync(scene.file));
assert.equal(Object.values(sources.zones).flat().length,30);assert(html.indexOf('forest-trail-panel')<html.indexOf('class="journey-ui"'),'trail stays outside the fading controls');
const frames=[],markerFrames=[],progressFrames=[],timers=[];let cancelled=0;const animated=list=>({classList:{add(){},remove(){}},animate:(f,o)=>{list.push({f,o});return{cancel(){cancelled++}}}});const stage={setAttribute(){},removeAttribute(){},querySelectorAll:()=>[],querySelector:selector=>animated(selector==='.journey-scene'?frames:selector==='.forest-trail-walker'?markerFrames:progressFrames),dataset:{}};
g.ctx.document.querySelector=()=>stage;g.ctx.setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length;};
r('let journeyResolved=0;chooseFork=function(){journeyResolved++};');
const before=r('JSON.stringify(S)');await r('ForestJourney.begin(1)');
assert.equal(r('journeyResolved'),0);assert.equal(r('JSON.stringify(S)'),before);
await r('ForestJourney.begin(0)');assert.equal(frames.length,1);assert.equal(frames[0].o.duration,3000);assert.equal(r('ForestJourney.stepMs'),1000);
assert.equal(markerFrames[0].o.duration,3000);assert.deepEqual(JSON.parse(JSON.stringify(markerFrames[0].f)),[{left:'0%'},{left:'10%'}]);assert.equal(progressFrames[0].o.duration,3000);assert.deepEqual(JSON.parse(JSON.stringify(progressFrames[0].f)),[{width:'0%'},{width:'10%'}]);assert(frames[0].f.at(-1).transform.includes('-9%'));assert(timers.some(t=>t.ms===3000));
r('ForestJourney.finish(ForestJourney.active)');assert.equal(r('journeyResolved'),1);assert.equal(r('ForestJourney.active'),null);assert.equal(cancelled,3,'scene, marker and progress animations are all cleaned up');
await r('ForestJourney.begin(0)');r('S.screen="town";ForestJourney.finish(ForestJourney.active)');assert.equal(r('journeyResolved'),1);
console.log('PASS 30 scene files, hidden route spoilers, 3x1000ms with visible trail and synchronized marker/progress, no early state change, double click guard, exactly-once resolution, navigation cancellation');
})().catch(e=>{console.error(e);process.exitCode=1;});
