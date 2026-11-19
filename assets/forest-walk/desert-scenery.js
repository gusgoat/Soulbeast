import {DESERT_FRAMES} from './desert-frames.js?v=desert-release-1';
import {forestSceneAssetURL} from './storage-assets.js?v=desert-release-1';
const cache=new Map();
async function image(id){
  if(cache.has(id)){const ready=cache.get(id);cache.delete(id);cache.set(id,ready);return ready;}
  if(!cache.has(id)){
    const promise=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Desert PNG failed: '+id));im.src=forestSceneAssetURL('desert',id);});
    cache.set(id,promise);promise.catch(()=>cache.delete(id));
    while(cache.size>8)cache.delete(cache.keys().next().value);
  }
  return cache.get(id);
}
const ordinary={entrance:'gate',exit:'gate',footprints:'woodland',bandit:'caravan',stranger:'caravan',shrine:'shrine',spring:'spring',revival:'spring',cleanse:'spring',village:'settlement',hospital:'settlement',bush:'ruins',mist:'storm',ruins:'ruins',boss:'woodland'};
export async function desertScenery(map,scene,baseProps,trapIndex=-1){
  const kit=map==='boss'?'woodland':scene?.kit||ordinary[map]||'woodland',tiles={},props=[];
  for(const id of new Set(['woodland','ruins',kit,'ground-sand',...(trapIndex>=0?['traps']:[])]))tiles['desert-'+id]=await image(id);
  function cut(id,cell,x,z,width,extra={}){
    const source=DESERT_FRAMES[id][cell],p={kind:'training-prop',art:'desert-'+id,effectId:'desert-'+id+'#'+cell,source,x,z,width,pivot:1,layered:true,...extra};
    if(p.height)p.width=p.height*source[2]/source[3];return p;
  }
  // Deterministic sparse decor; it never consumes native encounter randomness.
  for(const old of baseProps){
    const pick=Math.abs(Math.round(old.x*13+old.z*7));let cell=3,extra={};
    if(old.kind==='gate')continue;
    if(old.kind==='tree'){
      if(pick%5)continue;cell=pick%2;
      extra={kind:'cactus',height:cell===0?6.5:3.1,canopy:undefined};
    }else if(old.kind==='rock'){if(pick%2)continue;cell=4;}
    else if(old.kind==='direction-sign')cell=5;
    else if(old.kind==='shrub'){if(pick%4)continue;cell=2;extra={height:2.7};}
    else if(pick%4)continue;
    props.push(cut('woodland',cell,old.x,old.z,old.width,{...old,source:DESERT_FRAMES.woodland[cell],art:'desert-woodland',effectId:'desert-woodland#'+cell,pivot:1,layered:true,...extra}));
  }
  // Low distant city remnants flank the Y arms without closing either route.
  for(const [cell,x,z,w]of [[1,-42,9,10],[2,42,6,4],[5,-22,39,4]])props.push(cut('ruins',cell,x,z,w));
  if(trapIndex>=0&&trapIndex<6)props.push(cut('traps',trapIndex,0,-29,trapIndex===4?12:11,{ground:[0,1,3].includes(trapIndex),pivot:[0,1,3].includes(trapIndex)?.7:.9}));
  const x=1.05,z=-11.9,add=(cell,dx,dz,w,extra={})=>{const p=cut(kit,cell,x+dx,z+dz,w,extra);props.push(p);return p;};
  const floor=(w=19)=>add(0,0,0,w,{ground:true,pivot:.5});
  const roof=(cell,w,height,dz=0)=>add(cell,0,dz,w,{elevation:height,reveal:{x,z,rx:8,rz:7},minOpacity:.08});
  if(['entrance','exit'].includes(map)&&!scene){
    const cx=map==='entrance'?0:44,cz=map==='entrance'?-47.6:-15;
    for(const [cell,dx,dz,w,e]of [[0,0,0,20,0],[1,0,4,16,0],[2,-6,0,2.8,0],[3,6,0,2.8,0],[4,0,0,15,7],[5,8,-3,5,0]])props.push(cut('gate',cell,cx+dx,cz+dz,w,{elevation:e,height:cell===2||cell===3?8:undefined,ground:cell===0||cell===5,pivot:cell===0?.5:1}));
  }else if(['spring','revival','cleanse'].includes(map)&&!scene){
    add(1,0,5.5,12);add(2,-11,0,6);add(3,11,0,6);add(4,-7,-7,3.5);add(5,9,-5,2.8);
  }else if(kit==='woodland'){
    // Native beast/trap contacts stay visible on the sand; no giant obstacle.
  }else if(kit==='caravan'||kit==='chest'||kit==='ledger'||kit==='cloth'||kit==='settlement'){
    floor(kit==='settlement'?22:19);add(1,0,4,12);
    add(2,-6,0,0,{height:kit==='ledger'?7:8});add(3,6,0,0,{height:kit==='ledger'?7:8});
    roof(4,17,7);add(5,5,-3,kit==='chest'?5:4);
  }else if(kit==='sahara'||kit==='ruins'){
    floor(22);add(1,0,4,16);add(2,-7,0,0,{height:10});add(3,7,0,0,{height:10});roof(4,16,8);add(5,6,-4,4.2);
  }else if(kit==='hourglass'){
    floor();add(1,0,5,15);add(2,-5,1,0,{height:8});add(3,6,0,4);roof(4,16,8);add(5,4,-4,4,{ground:true,pivot:.5});
  }else if(kit==='scales'){
    floor(18);add(1,0,3,7);add(2,0,3,0,{height:7,elevation:2.7});
    const [px,py,pw,ph]=DESERT_FRAMES.scales[4];
    for(const [i,dx]of [[0,-2.15],[1,2.15]])add(4,dx,2.8,2.2,{elevation:2.8,source:[px+i*pw/2,py,pw/2,ph]});
    add(3,-2.15,2.8,1.3,{elevation:3.2});add(5,5,-2,3);
  }else if(kit==='storm'){
    floor(20);add(1,0,5,17);add(2,-8,-1,7);add(3,9,2,0,{height:9});add(4,8,-5,7,{ground:true,pivot:.6});add(5,-6,-4,3);
  }else if(kit==='scarab'){
    floor();add(1,0,5,14);add(2,-5,-2,3,{ground:true,pivot:.6});add(3,6,-2,2.5);add(4,-8,1,4);add(5,6,2,4);
  }else if(kit==='delivery'){
    floor();add(1,0,4,14);add(2,-6,0,0,{height:6});add(3,6,0,7);add(4,-5,2,8,{reveal:{x,z,rx:7,rz:6},minOpacity:.08});add(5,5,-4,3.5);
  }else if(kit==='waterways'){
    floor(22);add(1,0,5,11);add(2,-8,0,7);add(3,8,0,7);add(4,-6,-3,0,{height:5});add(5,6,-4,3.5);
  }else if(kit==='shrine'){
    floor(18);add(1,0,3,8);add(2,-7,1,0,{height:7});add(3,7,1,0,{height:7});add(4,0,3,3,{elevation:5});add(5,4,-3,3);
  }
  return {tiles:{...tiles,ground:tiles['desert-ground-sand'],trail:tiles['desert-ground-sand']},props,kit};
}
export function desertThicket(prop){return {...prop,art:'desert-woodland',effectId:'desert-woodland#2',source:DESERT_FRAMES.woodland[2],canopy:undefined,pivot:1,width:prop.width*.65,layered:true};}
