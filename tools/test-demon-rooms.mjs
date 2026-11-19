import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import '../tools/town-walk-demo/demon-room-plan.js';
import {DEMON_ROOM_FRAMES} from '../assets/forest-walk/demon-room-frames.js';
globalThis.location={hostname:'localhost',search:''};
globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload());}};
const {demonScenery}=await import('../assets/forest-walk/demon-scenery.js');
const P=globalThis.DemonCastleRooms;
assert.equal(P.ids.length,12);
assert.equal(P.stepFor(2,{map:'spring',phase:'pending'}),3);
assert.equal(P.stepFor(3,{map:'spring',phase:'cleared'}),3);
assert.equal(P.stepFor(3,{map:'spring',phase:'pending'}),4);
assert.equal(P.stepFor(9,{map:'boss',phase:'pending'}),10);
const base=Array.from({length:30},(_,i)=>({kind:'tree',art:'tree-2',x:20+i*.7,z:30+i,width:10,radius:.75}));
const lanes=[[[0,-43],[0,-30],[1,-12],[0,-1.75]],[[0,-1.75],[-6,7],[-13.65,14.7],[-24.15,30.1],[-34.3,37.8]],[[0,-1.75],[5.95,7],[14,12.95],[26.95,31.5],[35.7,39.55]]];
function gap(x,z,paths){let d=Infinity;for(const path of paths)for(let i=1;i<path.length;i++){const [ax,az]=path[i-1],[bx,bz]=path[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(x-ax-t*dx,z-az-t*dz));}return d;}
const random=Math.random;Math.random=()=>{throw Error('Room decoration consumed native RNG');};
try{
 for(let step=1;step<=3;step++){const r=await demonScenery('footprints',null,base,-1,{step});assert(!r.interior);assert(r.props.some(p=>p.kind==='tree'));}
 for(const room of P.ids){const boss=room==='throne',r=await demonScenery(boss?'boss':'footprints',null,base,-1,{step:boss?10:4,room});
  assert(r.interior);assert.equal(r.room,room);assert(!r.props.some(p=>p.kind==='tree'||p.art==='demon-woodland'));
  assert.equal(r.props.filter(p=>p.exitDoor).length,boss?0:2);assert(r.props.some(p=>p.roomWall));assert(r.props.some(p=>p.roomFurniture));
  assert(r.props.every(p=>p.source?.length===4));assert.equal(r.props.some(p=>p.redCarpet),boss);
  for(const p of r.props.filter(p=>p.radius))assert(gap(p.x,p.z,boss?[lanes[0]]:lanes)>p.radius+.36,room+' furnishing blocks native Y lane '+JSON.stringify([p.x,p.z,p.radius]));
 }
}finally{Math.random=random;}
for(const [id,frames]of Object.entries(DEMON_ROOM_FRAMES)){
 const b=await readFile(new URL('../assets/forest-walk/generated/demon-interior/'+id+'.png',import.meta.url));const w=b.readUInt32BE(16),h=b.readUInt32BE(20);if(id!=='floor')assert.equal(b[25],6);for(const [x,y,cw,ch]of frames)assert(x>=0&&y>=0&&cw>0&&ch>0&&x+cw<=w&&y+ch<=h);
}
const current=await readFile(new URL('./town-walk-demo/menu.html',import.meta.url),'utf8');
const before=execFileSync('git',['show','7c4bd95c:tools/town-walk-demo/menu.html'],{encoding:'utf8',maxBuffer:64*1024*1024});
function native(s,name){const start=s.indexOf('{',s.indexOf(name+':()=> ('));let q=false,e=false,d=0;for(let i=start;i<s.length;i++){const c=s[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c==='{')d++;else if(c==='}'&&!--d)return JSON.parse(s.slice(start,i+1));}throw Error(name);}
for(const name of ['SECRET_LOCATIONS','WORLD_TALES'])assert.deepEqual(native(current,name),native(before,name),'native rules/rewards changed');
console.log('PASS first three outdoor steps, twelve interior layouts, native Y/contact clearance, real alpha crop bounds, deterministic room plan and original event rules/rewards');
