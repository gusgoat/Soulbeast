import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('./traps.js',import.meta.url),'utf8');
const scope={},images=[];
class FakeImage{constructor(){images.push(this);this.complete=true;this.naturalWidth=1254;this.naturalHeight=1254;}}
vm.runInNewContext(code,{window:scope,Image:FakeImage});const rules=scope.DungeonTraps;
assert.deepEqual(Object.keys(rules.types),['blast','poison','fire','electric','ice']);
rules.preloadEffects();rules.preloadEffects();assert.equal(images.length,4);
for(const [burst,frame] of [[.8,0],[.6,4],[.4,8],[.001,15],[0,-1],[-.1,-1]])assert.equal(rules.effectFrame(burst),frame);
const calls=[],ctx=new Proxy({globalAlpha:1,drawImage(...args){calls.push(args)}},{get:(o,k)=>k in o?o[k]:()=>{}});
for(const type of ['poison','fire','electric','ice']){
 const before=calls.length;assert.ok(rules.drawEffect(ctx,type,{x:100,y:200},.4,.9));assert.equal(calls.length,before+1);
 const call=calls.at(-1);assert.ok(call[0].src.includes(type+'-atlas'));assert.equal(call[1],0);assert.equal(call[2],627);
}
assert.equal(rules.drawEffect(ctx,'blast',{x:0,y:0},.8),false);
assert.equal(rules.drawEffect(ctx,'ice',{x:0,y:0},0),false);
images[0].complete=false;assert.equal(rules.drawEffect(ctx,'poison',{x:0,y:0},.8),false);images[0].complete=true;
const nav={distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),walkable:()=>true};
const scene=rules.create({cells:[],spawn:{x:0,y:0}},nav);
for(const [i,type]of ['poison','fire','electric','ice'].entries())scene.test(type,{x:i*1000,y:0});
for(const trap of scene.list){assert.equal(scene.update(0,[{id:'p',position:trap}])[0].kind,'armed');const before=calls.length;scene.draw(ctx,p=>p,.64);assert.equal(calls.length,before);assert.equal(scene.update(2,[{id:'p',position:trap}])[0].kind,'explode');scene.draw(ctx,p=>p,.64);assert.ok(calls.length>before);scene.update(1,[]);}
const server={};vm.runInNewContext(code,{globalThis:server});assert.equal(server.DungeonTraps.drawEffect(ctx,'ice',{x:0,y:0},.8),false);
console.log('PASS four trap atlases, cached images, timeline, solo/island draw, loading fallback and server safety');
