import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {MOON_FRAMES} from '../assets/forest-walk/moonlight-frames.js';
globalThis.Image=class{set src(url){this.url=url;queueMicrotask(()=>this.onload());}};
const {moonlightScenery}=await import('../assets/forest-walk/moonlight-scenery.js');
const c={};vm.createContext(c);vm.runInContext(await readFile(new URL('./town-walk-demo/moonlight-forest-scenes.js',import.meta.url),'utf8')+'\nglobalThis.catalog=MoonlightForestScenes;',c);
assert.equal(c.catalog.ids.length,14);
assert.equal(c.catalog.describe('after:quest:moon-3').id,'after-moon');
assert.equal(c.catalog.selected({secretRun:{location:'yggdrasil'}},{k:'secret'}).id,'yggdrasil');
assert.equal(c.catalog.selected({riddleRun:{reward:{id:'moon-leaf-scale'}}},{k:'riddleReward'}).id,'moon-leaf-scale');
assert.equal(c.catalog.session({specialSession:{}}).id,'moon');
const original=Math.random;Math.random=()=>{throw Error('Scenery consumed encounter RNG');};
try{
  const base=[{kind:'tree',art:'tree-2',x:8,z:4,width:10,radius:.75},{kind:'rock',art:'rock-1',x:9,z:3,width:3,radius:.4}];
  const before=JSON.stringify(base);
  for(const id of c.catalog.ids){
    const result=await moonlightScenery('training',c.catalog.describe(id),base);
    if(id!=='boss')assert(result.props.some(p=>p.ground),id+' needs a ground layer');
    assert(result.props.every(p=>p.source?.length===4&&p.layered));
    assert(result.tiles['moon-blender-birch']&&result.tiles['moon-blender-rock']);
    assert.equal(result.props[0].radius,base[0].radius);
  }
  for(const map of ['entrance','exit','footprints','bandit','stranger','shrine','spring','revival','cleanse','village','hospital','bush','mist','ruins']){
    const result=await moonlightScenery(map,null,base);assert(result.props.length>base.length,map);
    if(['spring','revival','cleanse'].includes(map))assert(!result.props.some(p=>p.ground&&Math.abs(p.x-1.05)<4&&Math.abs(p.z+11.9)<4),'do not cover the calibrated basin');
  }
  assert.equal(JSON.stringify(base),before,'mutated shared scenery/collision envelopes');
}finally{Math.random=original;}
for(const [id,frames]of Object.entries(MOON_FRAMES)){
  const png=await readFile(new URL('../assets/forest-walk/generated/moonlight/'+id+'.png',import.meta.url));
  assert.equal(png[25],6);const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  for(const [x,y,cw,ch]of frames)assert(x>=0&&y>=0&&cw>0&&ch>0&&x+cw<=w&&y+ch<=h,id);
}
console.log('PASS zone-1 native IDs, 14 event scenes, 14 ordinary maps, 21 RGBA assets, Blender props, preserved basin/collision envelopes and no event RNG');
