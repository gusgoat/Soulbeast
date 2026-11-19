import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {BINDING_FRAMES} from '../assets/forest-walk/binding-frames.js';
const source=await readFile(new URL('./town-walk-demo/menu.html',import.meta.url),'utf8');
const original=execFileSync('git',['show','ec2199bd:tools/town-walk-demo/menu.html'],{encoding:'utf8',maxBuffer:64*1024*1024});
assert(source.slice(source.indexOf('</head>')).replaceAll('\r\n','\n')===original.slice(original.indexOf('</head>')).replaceAll('\r\n','\n'),'native gameplay, boss or reward code changed');
const c={};vm.createContext(c);vm.runInContext(await readFile(new URL('./town-walk-demo/binding-forest-scenes.js',import.meta.url),'utf8')+'\nglobalThis.catalog=BindingForestScenes;',c);
const quests=JSON.parse(source.match(/const STAGE_SEVEN_QUESTS=(\[[^\r\n]+\]);TALES_DATA/)[1]);
const riddles=JSON.parse(source.match(/FOREST_RIDDLES\.push\(\.\.\.(\[[^\r\n]+\])\);/)[1]);
for(const id of ['ironreliquary','iron-wagon','encounter-8','villager','boss',...quests.map(q=>q.id),...riddles.map(q=>q.id)])assert(c.catalog.ids.includes(id),'missing native scene '+id);
globalThis.location={hostname:'localhost',search:''};globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload());}};
const {bindingScenery}=await import('../assets/forest-walk/binding-scenery.js');
const random=Math.random;Math.random=()=>{throw Error('Scenery consumed native RNG');};
try{
 for(const id of c.catalog.ids){const r=await bindingScenery(id==='boss'?'boss':'training',c.catalog.describe(id),[], -1,4);assert(r.props.every(p=>p.source?.length===4&&p.layered));assert(!r.props.some(p=>p.radius),'new native event collider');}
 for(const map of ['entrance','footprints','bandit','stranger','shrine','spring','revival','cleanse','village','hospital','bush','mist','ruins','exit']){const r=await bindingScenery(map,null,[],-1,7);assert(r.tiles.ground);assert(r.props.every(p=>p.source?.length===4));}
 for(let i=0;i<6;i++){const r=await bindingScenery('footprints',null,[],i);assert(r.props.some(p=>p.art==='demon-traps'&&p.source===undefined)===false);assert(r.props.some(p=>p.effectId==='demon-traps#'+i));}
}finally{Math.random=random;}
for(const [id,frames]of Object.entries(BINDING_FRAMES)){const b=await readFile(new URL('../assets/forest-walk/generated/binding/'+id+'.png',import.meta.url));const w=b.readUInt32BE(16),h=b.readUInt32BE(20);if(id!=='ground')assert.equal(b[25],6);for(const [x,y,cw,ch]of frames)assert(x>=0&&y>=0&&cw>0&&ch>0&&x+cw<=w&&y+ch<=h);}
console.log('PASS native zone-8 events and boss/reward runtime unchanged, 18 PNG bounds, 14 ordinary maps, six original traps and no scenery RNG/new contact collider');
