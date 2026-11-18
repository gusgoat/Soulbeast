import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {DESERT_FRAMES} from '../assets/forest-walk/desert-frames.js';
globalThis.location={hostname:'localhost',search:''};
globalThis.Image=class{set src(value){this.url=value;queueMicrotask(()=>this.onload());}};
const {desertScenery}=await import('../assets/forest-walk/desert-scenery.js');
const c={};vm.createContext(c);vm.runInContext(await readFile(new URL('./town-walk-demo/desert-forest-scenes.js',import.meta.url),'utf8')+'\nglobalThis.catalog=DesertForestScenes;',c);
const source=await readFile(new URL('./town-walk-demo/menu.html',import.meta.url),'utf8');
function native(name){const start=source.indexOf('{',source.indexOf(name+':()=> ('));let q=false,e=false,depth=0;for(let i=start;i<source.length;i++){const ch=source[i];if(q){if(e)e=false;else if(ch==='\\')e=true;else if(ch==='"')q=false;}else if(ch==='"')q=true;else if(ch==='{')depth++;else if(ch==='}'&&!--depth)return JSON.parse(source.slice(start,i+1));}throw Error(name);}
const secret=native('SECRET_LOCATIONS'),tales=native('WORLD_TALES');
const expected=new Set(['villager','boss','after-desert',...[...secret.locations,...secret.repeatableEvents,...secret.riddles,...tales.quests,...tales.special].filter(x=>x.zone===3).map(x=>x.id)]);
assert.deepEqual(new Set(c.catalog.ids),expected);assert.equal(expected.size,14);
assert.equal(c.catalog.describe('after:quest:desert-3').id,'after-desert');
assert.equal(c.catalog.selected({secretRun:{location:'sahara'}},{k:'secret'}).id,'sahara');
assert.equal(c.catalog.session({specialSession:{}}).id,'desert');
const base=Array.from({length:30},(_,i)=>({kind:'tree',art:'tree-2',x:20+i*.7,z:30+i,width:10,radius:.75}));
base.push({kind:'rock',art:'rock-1',x:-24,z:35,width:3,radius:.4});const before=JSON.stringify(base);
const random=Math.random;Math.random=()=>{throw Error('Scenery consumed native RNG');};
try{
 for(const id of c.catalog.ids){const result=await desertScenery(id==='boss'?'boss':'training',c.catalog.describe(id),base);
  assert(result.props.every(p=>p.source?.length===4&&p.layered));assert(!result.props.some(p=>p.kind==='tree'));
  const cacti=result.props.filter(p=>p.kind==='cactus');assert(cacti.length>0&&cacti.length<=8,'cactus density');
  assert(result.tiles.ground===result.tiles['desert-ground-sand']);assert(result.tiles.trail===result.tiles.ground);
  if(id!=='boss')assert(result.props.some(p=>p.ground),id+' ground layer');
  for(const p of cacti)assert.equal(p.radius,base.find(b=>b.x===p.x&&b.z===p.z).radius);
 }
 for(const map of ['entrance','exit','footprints','bandit','stranger','shrine','spring','revival','cleanse','village','hospital','bush','mist','ruins']){
  const r=await desertScenery(map,null,base);assert(r.props.length>0,map);
  if(['spring','revival','cleanse'].includes(map))assert(!r.props.some(p=>p.ground&&Math.abs(p.x-1.05)<4&&Math.abs(p.z+11.9)<4),'calibrated basin covered');
 }
 for(let i=0;i<6;i++){const r=await desertScenery('footprints',null,base,i);const trap=r.props.find(p=>p.art==='desert-traps'&&p.z===-29);assert(trap);assert.deepEqual(trap.source,DESERT_FRAMES.traps[i]);}
 assert.equal(JSON.stringify(base),before,'mutated shared scene input');
}finally{Math.random=random;}
for(const [id,frames]of Object.entries(DESERT_FRAMES)){
 const png=await readFile(new URL('../assets/forest-walk/generated/desert/'+id+'.png',import.meta.url));if(id!=='ground-sand')assert.equal(png[25],6);
 const w=png.readUInt32BE(16),h=png.readUInt32BE(20);for(const [x,y,cw,ch]of frames)assert(x>=0&&y>=0&&cw>0&&ch>0&&x+cw<=w&&y+ch<=h,id);
}
console.log('PASS native zone-3 catalogue, 14 event scenes, 14 ordinary maps, 19 PNGs, sparse cacti, sand ground, original six hazards/basins and no scenery RNG');
