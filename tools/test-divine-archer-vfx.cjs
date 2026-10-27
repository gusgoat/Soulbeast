const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const g=require('./game-context.cjs')('build/live-index.html'),run=g.run;
assert.equal(run('CLS.sniper.n'),'เทพธนู');assert.equal(run("baseOf('sniper')"),'archer');assert.equal(run("clsWeapon('sniper')"),'bow');
for(const sex of ['male','female']){
 const path='assets/portraits/divine-archer-'+sex+'-v2.webp';assert(fs.existsSync(path));assert.equal(run(`classPortraitSource('sniper','${sex}')`),path);
 run(`S.P.cls='sniper';S.P.gender='${sex}';S.P.lv=60;`);assert(run("townNavArt('hero')").includes(path));assert(run('bagVitals()').includes(path));
 const actor=JSON.parse(run(`JSON.stringify(CharacterMotion.resolve(playerUnit()))`));assert(actor,'Missing bow motion '+sex);assert.equal(actor.cls,'sniper');
 for(const pose of ['idle','hit','windup','power','threat','melee','meleeEffect'])assert(fs.existsSync(actor.assets[pose]),pose+' '+sex);
}
const batch=require('../content/unit-motion-batch50.json');assert(batch.actors.filter(a=>a.cls==='sniper').every(a=>a.meleeWeapon==='bow'&&a.name.includes('เทพธนู')));
assert.equal(run("classPortraitSource('sniper')"),'assets/portraits/divine-archer-male-v2.webp');assert(run('vClassTree()').includes('เทพธนู'));
const examples={s_naga:['water-high','beam'],s_dragon:['fire-high','beam'],ms_mage50:['electric-high','beam'],solar_raijaku_s5:['wind-high','vortex'],ms_druid50:['earth-high','eruption']};
run('Math.random=()=>{throw Error("Presentation must not use gameplay RNG")};');const before=run('JSON.stringify(S)');
for(const [id,[asset,kind]]of Object.entries(examples)){const a=JSON.parse(run(`JSON.stringify(BattleEffects.profile('${id}').painted)`));assert.equal(a.asset,asset);assert.equal(a.kind,kind);assert(fs.existsSync(a.path));}
for(const id of ['mg_fire','mg_ice','mg_bolt','water_m1','flying_m1','ground_m1'])assert(!run(`BattleEffects.profile('${id}').painted?.advanced`),'Basic effect must stay unchanged: '+id);
assert.equal(run("BattleEffects.profile('am_meteor').painted.asset"),'meteor');assert.equal(run("BattleEffects.profile('di_requiem').painted.asset"),'music');assert.equal(run("BattleEffects.profile('sw_charge').painted.asset"),'crescent');assert.equal(run('JSON.stringify(S)'),before);
const animations=[];function node(){return {style:{setProperty(){}},dataset:{},isConnected:true,closest:()=>({getBoundingClientRect:()=>({left:0,top:0,width:320,height:400})}),appendChild(){},setAttribute(){},remove(){},animate(frames,options){const a={frames,options,cancel(){}};animations.push(a);return a;}};}
g.ctx.document.createElement=node;g.ctx.from={x:50,y:320,size:40,node:node()};g.ctx.to={x:200,y:80,size:40,node:node()};g.ctx.L=node();
const arrival=run("BattleEffects.travel(L,from,to,BattleEffects.profile('ms_druid50'))");assert.equal(arrival,360);assert(animations.at(-1).frames.every(f=>!f.transform?.includes('rotate')),'Earth must erupt in place');assert.equal(animations.at(-1).options.easing,'linear');
let source=fs.readFileSync('server/accounts/engine.ts','utf8').replace(/^import .*\r?\n/gm,'').replace('return {dispatch(packet){','return {testRun:code=>eval(code),dispatch(packet){');const ctx=vm.createContext({console,Date,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:require('crypto').webcrypto,sha256:()=>'',withSupabase:()=>{},btoa,atob});vm.runInContext(source,ctx);const engine=vm.runInContext('createEngine(createWorkbook({}),{})',ctx);assert.equal(engine.testRun('CLS.sniper.n'),'เทพธนู');assert.equal(engine.testRun("clsWeapon('sniper')"),'bow');
console.log('PASS Divine Archer stable ID, bow weapon, both portraits and all seven motion assets including threat, menus and authoritative name; five advanced elemental PNGs, beginner preservation, authored motifs, RNG/save isolation and stationary earth eruption');
