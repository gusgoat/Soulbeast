const fs=require('fs'),assert=require('assert/strict');
const g=require('./game-context.cjs')('build/staging-index.html'),run=g.run,json=s=>JSON.parse(run('JSON.stringify('+s+')'));
const manifest=require('../content/projectile-effects-v2.json');assert.equal(manifest.assets.length,8);
for(const a of manifest.assets){const b=fs.readFileSync(a.path);assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b[25],6,'PNG must retain alpha: '+a.id);}
run('Math.random=()=>{throw Error("VFX must not use combat RNG")};');const before=run('JSON.stringify(S)');
assert.equal(run('BattleEffects.profile("mg_fire").painted'),null);assert.equal(run('BattleEffects.profile("sw_bash").painted'),null);
for(const [id,asset,kind]of [['ms_mage50','electric-high','beam'],['mg_thunderstorm','storm','vortex'],['gv_storm','storm','vortex'],['f_dragonbreath','dragon-high','beam'],['f_moonbeam','holy-high','beam'],['am_meteor','meteor','meteor'],['mc_cannon','beam','beam']]){const p=json('BattleEffects.profile('+JSON.stringify(id)+').painted');assert.equal(p.asset,asset,id);assert.equal(p.kind,kind,id);assert(fs.existsSync(p.path));}
assert(run('BattleEffects.profile("solar_raijaku_s6").painted.scale>BattleEffects.profile("mg_thunderstorm").painted.scale'));
assert.equal(run('JSON.stringify(S)'),before,'Profiles must not change save or combat state');
const nodes=[],animations=[];const arena={getBoundingClientRect:()=>({left:15,top:200,width:290,height:400})};
function node(){return {style:{setProperty(k,v){this[k]=v;}},dataset:{},isConnected:true,appendChild(n){(this.children??=[]).push(n);},setAttribute(){},closest:()=>arena,remove(){this.removed=true;},animate(frames,options){const a={frames,options,cancel(){}};animations.push(a);return a;}};}
g.ctx.document.createElement=()=>{const n=node();nodes.push(n);return n;};g.ctx.L=node();g.ctx.from={x:80,y:520,size:40,node:node()};g.ctx.to={x:220,y:260,size:40,node:node()};
for(const id of ['mg_thunderstorm','gv_storm','am_meteor']){
 const at=nodes.length;const delay=run('BattleEffects.travel(L,from,to,BattleEffects.profile('+JSON.stringify(id)+'))');assert(delay>0);
 assert.equal(nodes[at].style.width,'290px');assert.equal(nodes[at].style.height,'400px');assert(nodes[at].className.includes('painted-projectile-clip'));
 const a=animations.at(-1);assert.equal(a.options.easing,'linear');assert(a.frames.length<=4);a.onfinish();assert(nodes[at].removed);assert.equal(run('BattleEffects.live.size'),0);
}
const scheduled=[];g.ctx.recordDelay=(fn,ms)=>scheduled.push({fn,ms});run('BattleEffects.later=(fn,ms)=>recordDelay(fn,ms);BattleEffects.travel(L,from,to,BattleEffects.profile("solar_pentadrake_s5"));');
assert.deepEqual(scheduled.slice(0,4).map(x=>x.ms),[80,160,240,320],'Authored five-shot Eclipse volley must retain all four echoes');run('BattleEffects.clear()');
console.log('PASS alpha assets, skill-name routing, tier scaling, beginner/melee preservation, battlefield clipping, linear travel, cleanup and no combat/save/RNG changes');
