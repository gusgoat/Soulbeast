import {MOON_FRAMES,MOON_DETAILS} from './moonlight-frames.js';
import {forestSceneAssetURL} from './storage-assets.js?v=moonlight-release-1';

const cache=new Map();
async function image(id){
  if(cache.has(id))return cache.get(id);
  const url=forestSceneAssetURL('moonlight',id);
  const ready=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Moonlight PNG failed: '+id));im.src=url;});
  cache.set(id,ready);ready.catch(()=>cache.delete(id));
  while(cache.size>9)cache.delete(cache.keys().next().value);
  return ready;
}
const ordinary={entrance:'gate',exit:'gate',footprints:'wolves',bandit:'camp',stranger:'lantern',shrine:'shrine',spring:'spring',revival:'spring',cleanse:'spring',village:'settlement',hospital:'settlement',bush:'woodland',mist:'woodland',ruins:'ruins',boss:'boss'};

export async function moonlightScenery(map,scene,baseProps){
  const tiles={},props=[];
  const kit=map==='boss'?'woodland':scene?.kit||ordinary[map]||'woodland';
  const ids=[...new Set(['woodland','blender-oak','blender-birch','blender-rock','blender-post',kit])];
  await Promise.all(ids.map(async id=>{tiles['moon-'+id]=await image(id);}));
  function cut(id,cell,x,z,width,extra={}){
    const source=MOON_FRAMES[id][cell];
    const p={kind:'training-prop',art:'moon-'+id,effectId:id+'#'+cell,source,x,z,width,pivot:1,layered:true,...extra};
    if(p.height)p.width=p.height*source[2]/source[3];
    return p;
  }
  // Keep the existing positions and collision envelopes; only replace their art.
  for(const old of baseProps){
    let id='woodland',cell=3;
    if(old.kind==='tree')id=old.art.endsWith('-2')||old.art.endsWith('-4')?'blender-birch':'blender-oak';
    else if(old.kind==='rock')id='blender-rock';
    else if(old.kind==='direction-sign'){id='blender-post';cell=0;}
    else if(old.kind==='shrub')cell=2;
    else if(old.kind==='gate')continue;
    const p=cut(id,id.startsWith('blender-')?0:cell,old.x,old.z,old.width,{...old,source:MOON_FRAMES[id][id.startsWith('blender-')?0:cell],art:'moon-'+id,pivot:1,layered:true});
    if(old.kind==='tree'){p.height=old.width*1.45;p.width=p.height*p.source[2]/p.source[3];}
    props.push(p);
  }
  const x=1.05,z=-11.9;
  const add=(cell,dx,dz,w,extra={})=>{const p=cut(kit,cell,x+dx,z+dz,w,extra);props.push(p);return p;};
  const floor=(w=19)=>add(0,0,0,w,{ground:true,pivot:.5});
  const canopy=(cell,w,elevation,dz=-2)=>add(cell,0,dz,w,{elevation,reveal:{x,z,rx:8,rz:7},minOpacity:.08});
  if(['entrance','exit'].includes(map)&&!scene){
    const cx=map==='entrance'?0:44,cz=map==='entrance'?-47.6:-15;
    for(const p of assembleGate())props.push({...p,x:p.x+cx-x,z:p.z+cz-z});
  }else if(['spring','revival','cleanse'].includes(map)&&!scene){
    // Retain the calibrated basin PNG and its exact water/rim contact geometry.
    add(1,0,5.5,12);add(2,-11,0,6);add(3,11,0,6);add(4,-7,-7,4,{ground:true,pivot:.6});add(5,9,-5,2.8);
  }else if(['bush','mist'].includes(map)&&!scene){
    for(const [dx,dz]of [[-7,4],[6,4],[-7,-3],[7,-3]])props.push(cut('woodland',2,x+dx,z+dz,5.5));
  }else if(kit==='settlement'){
    floor(22);add(1,0,3.5,11);add(2,-5,-1,8);add(3,5.3,-1,8);canopy(4,18.5,6.6);add(5,7,-4,3.6);
  }else if(kit==='camp'){
    floor();add(1,0,3.5,12);add(2,-6,-2,0,{height:8});add(3,6,-2,0,{height:8});canopy(4,15,5.8);add(5,7,-4,4);
  }else if(kit==='yggdrasil'){
    floor(22);add(1,0,4,0,{height:13});add(2,-6,-1,9);add(3,6,-1,9);canopy(4,23,8);add(5,-3,-5,6,{ground:true,pivot:.6});
  }else if(kit==='ruins'){
    floor();add(1,0,4,14);add(2,-5,-1,0,{height:9});add(3,5,-1,0,{height:9});canopy(4,13,6.7,-1);add(5,7,-4,4);
  }else if(kit==='shrine'){
    floor(18);add(1,0,3,7);add(2,-6,0,0,{height:6});add(3,6,0,0,{height:6});add(4,0,3,3,{elevation:5});add(5,4,-3,3);
  }else if(kit==='boss'){
    floor(23);add(1,0,5,14);add(2,-8,-.5,8);add(3,8,-.5,8);canopy(4,19,7);add(5,0,-6,18,{ground:true,pivot:.6});
  }else if(kit==='lantern'){
    floor(18);add(1,0,4,11);add(2,-6,0,0,{height:6.5});add(3,6,0,0,{height:6.5});add(4,-4,0,2,{elevation:4.5,pivot:0});add(5,4,-3,4);
  }else if(kit==='reflections'){
    floor(18);add(1,0,6,7);add(2,-7,1,3);add(3,7,1,3);add(4,-8,-4,4);add(5,7,-4,4,{ground:true,pivot:.6});
  }else if(kit==='scales'){
    floor(16);add(1,0,3,6.5);add(2,0,3,6,{elevation:3});add(4,0,2.9,5.2,{elevation:7,pivot:0});
    for(const dx of [-.55,0,.55])add(3,-1.8+dx,2.8,.7,{elevation:3.2,source:MOON_DETAILS.scaleLeaf});
    add(5,2,2.8,1.4,{elevation:3.2});
  }else if(kit==='seedmap'){
    floor(16);
    if(scene?.id==='moon-2'){add(1,-5,4,4.8);add(2,0,2,4.2);add(3,6,3,4);}
    else {add(1,0,4,6.2);add(3,0,1.5,6.5);add(2,6,2,2.2);}
    add(4,-6,1,1.5,{elevation:4,pivot:0});add(5,4,-2,3);
  }else if(kit==='waterways'){
    floor(22);add(1,0,4,10);add(2,-8,0,6);add(3,8,0,6);add(4,-6,-1,0,{height:6});add(5,6,-3,5);
  }else if(kit==='axe'){
    floor(18);add(1,0,4,12);add(2,-5,0,4);add(3,-3,0,2.2);add(4,5,1,5);add(5,6,-3,4);
  }else if(kit==='moth'){
    floor(16);add(1,0,4,9);add(2,-3,1,3);add(3,3,0,3.5);add(4,0,2,2.5,{elevation:4,pivot:0});add(5,5,-2,2);
  }else if(kit==='wolves'){
    floor(18);add(1,0,5,4);add(2,-7,0,6);add(3,7,0,6);add(4,0,6,10);add(5,0,-4,7,{ground:true,pivot:.5});
  }
  function assembleGate(){
    const list=[];for(const [cell,dx,dz,w,e]of [[0,0,0,20,0],[1,0,4,16,0],[2,-6,0,2.8,0],[3,6,0,2.8,0],[4,0,0,15,7.5],[5,8,-3,5,0]])list.push(cut('gate',cell,x+dx,z+dz,w,{elevation:e,height:cell===2||cell===3?8:undefined,ground:cell===0||cell===5,pivot:cell===0?.5:1}));return list;
  }
  return {tiles,props,kit};
}

export function moonlightThicket(prop){
  return {...prop,art:'moon-woodland',source:MOON_FRAMES.woodland[2],layered:true};
}
