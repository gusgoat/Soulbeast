import assert from 'node:assert/strict';
import {placeLayers,layerOpacity} from '../assets/forest-walk/training-layers.js';
import {LAYER_FRAMES} from '../assets/forest-walk/training-layer-frames.js';
import {readFile} from 'node:fs/promises';

const random=Math.random;
Math.random=()=>{throw Error('Artwork consumed event RNG');};
try {
  for(const id of Object.keys(LAYER_FRAMES)) {
    const data=await readFile(new URL('../assets/forest-walk/generated/layers/'+id+'.png',import.meta.url));
    assert.equal(data[25],6,id+' requires real RGBA');
    const w=data.readUInt32BE(16),h=data.readUInt32BE(20);
    for(const [i,frame] of LAYER_FRAMES[id].entries()) {
      const [x,y,cw,ch]=frame;
      assert(cw>0&&ch>0&&x>=i%3*w/3&&y>=Math.floor(i/3)*h/2);
      assert(x+cw<=(i%3+1)*w/3&&y+ch<=(Math.floor(i/3)+1)*h/2);
    }
    const parts=placeLayers(id,'test',1,-12,18);
    assert(parts[0].ground&&parts.every(p=>p.width>0));
    assert(parts.some(p=>!p.ground));
  }
  const parts=placeLayers('training-bells','test',1,-12,18);
  assert.equal(parts.filter(p=>p.radius).length,4,'four separate posts');
  assert(parts.filter(p=>p.radius).every(p=>Math.abs(p.x-1)>5),'central approach stays open');
  const roof=parts.find(p=>p.reveal);
  const rect={left:0,right:100,top:0,bottom:100},actor={left:40,right:60,top:30,bottom:90};
  assert.equal(layerOpacity(roof,{x:1,z:-12},rect,actor),.08,'roof reveals actor inside pavilion');
  assert.equal(layerOpacity(roof,{x:1,z:-20},rect,actor),1,'actor in front of roof');
  assert.equal(layerOpacity(roof,{x:30,z:-12},rect,{...actor,left:200,right:220}),1,'roof restored away from actor');
  assert.equal(layerOpacity(parts[0],{x:1,z:-12},rect,actor),1,'floor never fades');
} finally {Math.random=random;}
console.log('PASS 14 modular PNG atlases: source bounds, physical elevation, four posts, open approach, occlusion visibility and no event RNG');
