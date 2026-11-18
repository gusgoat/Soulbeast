import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const requests=[];
let failLocalFor='';
globalThis.location={hostname:'localhost'};
globalThis.Image=class {
  set src(value){
    this.url=value;requests.push(value);
    queueMicrotask(()=>value.startsWith('file:')&&value.includes(failLocalFor)&&failLocalFor?this.onerror():this.onload());
  }
  get src(){return this.url;}
};
const {TRAINING_PNG,TRAP_PNG,trainingScenery}=await import('../assets/forest-walk/training-scenery.js');
const source=await readFile(new URL('./town-walk-demo/training-forest-scenes.js',import.meta.url),'utf8');
const profiles=vm.runInNewContext(source+'\nTrainingForestScenes.ids');
assert.deepEqual(Object.keys(TRAINING_PNG).sort(),[...profiles,...TRAP_PNG].sort());
for(const id of Object.keys(TRAINING_PNG)){
  const file=await readFile(new URL('../assets/forest-walk/generated/'+id+'.png',import.meta.url));
  assert.equal(file.subarray(1,4).toString(),'PNG',id);
  assert(file.readUInt32BE(16)>500&&file.readUInt32BE(20)>500,id+' insufficient source resolution');
  assert.equal(file[25],6,id+' requires RGBA');
}
const random=Math.random;
Math.random=()=>{throw Error('Scenery consumed event randomness');};
try{
  for(const id of profiles){
    const scene=await trainingScenery({id},-1);
    assert(scene.props.length>=6,id+' needs separate physical pieces');
    assert(scene.props[0].ground,id+' floor must draw below the player');
    assert(scene.props.every(p=>p.source?.length===4&&p.layered));
    assert.equal(scene.props[0].art,'training-png-'+id);
    assert(scene.tiles[scene.props[0].art].src.endsWith(id+'.png'));
    assert.equal(scene.props[0].pivot,.5);
  }
  for(let index=0;index<6;index++){
    const id=TRAP_PNG[index];
    if(index===2)failLocalFor=id;
    const scenery=await trainingScenery(null,index);
    assert.equal(scenery.props.length,1);
    assert.equal(scenery.props[0].art,'training-png-'+id);
    if(index===2)assert(scenery.tiles[scenery.props[0].art].src.startsWith('https://'));
    failLocalFor='';
  }
  assert.equal(TRAINING_PNG['trap-quicksand'].ground,true);
  assert.equal(TRAINING_PNG['trap-leeches'].ground,true);
  assert.equal(TRAINING_PNG['trap-spikes'].ground,true);
  assert(TRAINING_PNG['training-1'].width<TRAINING_PNG['training-3'].width/3);
  const before=requests.length;
  await trainingScenery(null,5);
  assert.equal(requests.length,before,'reloaded a cached PNG');
  assert.equal((await trainingScenery(null,-1)).props.length,0);
}finally{Math.random=random;}
console.log('PASS 20 real RGBA PNGs: all scene/trap bindings, natural prop scale, ground layers, cache, Storage fallback, zero event RNG');
