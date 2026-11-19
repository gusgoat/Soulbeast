import {DRAGON_TREE_FRAMES} from './dragon-tree-frames.js?v=dragon-blender-preview-1';
import {DRAGON_FRAMES} from './dragon-frames.js?v=dragon-city-release-1';
import {forestSceneAssetURL} from './storage-assets.js?v=dragon-city-release-1';
const cache=new Map();
async function image(id,folder='dragon'){
  const key=folder+'/'+id;
  if(cache.has(key)){const ready=cache.get(key);cache.delete(key);cache.set(key,ready);return ready;}
  if(!cache.has(key)){
    const promise=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Dragon PNG failed: '+id));im.src=forestSceneAssetURL(folder,id);});
    cache.set(key,promise);promise.catch(()=>cache.delete(key));
    while(cache.size>8)cache.delete(cache.keys().next().value);
  }
  return cache.get(key);
}
const ordinary={entrance:'gate',exit:'gate',footprints:'woodland',bandit:'camp',stranger:'camp',shrine:'shrine',spring:'spring',revival:'spring',cleanse:'spring',village:'settlement',hospital:'settlement',bush:'nest',mist:'avalanche',ruins:'ruins',boss:'woodland'};
export async function dragonScenery(map,scene,baseProps,trapIndex=-1){
 const kit=map==='boss'?'woodland':scene?.kit||ordinary[map]||'woodland',tiles={},props=[];
 for(const id of new Set(['woodland','ruins','avalanche',kit,'ground-rock',...(scene?.id==='encounter-4'?['nest']:[]),...(trapIndex>=0?['traps']:[])]))tiles['dragon-'+id]=await image(id);
 for(const id of Object.keys(DRAGON_TREE_FRAMES))tiles['dragon-tree-'+id]=await image(id,'dragon-trees');
 function cut(id,cell,x,z,width,extra={}){
  const source=DRAGON_FRAMES[id][cell],p={kind:'training-prop',art:'dragon-'+id,effectId:'dragon-'+id+'#'+cell,source,x,z,width,pivot:1,layered:true,...extra};
  if(p.height)p.width=p.height*source[2]/source[3];return p;
 }
 // Sparse, deterministic mountain vegetation, never an encounter roll.
 for(const old of baseProps){
  const pick=Math.abs(Math.round(old.x*13+old.z*7));let cell=3,extra={};
  if(old.kind==='gate')continue;
  if(old.kind==='tree'){
   if(pick%3)continue;
   const id=pick%2?'pine-upright':'pine-windswept',source=DRAGON_TREE_FRAMES[id][0],height=old.width*1.45;
   props.push({...old,art:'dragon-tree-'+id,source,height,width:height*source[2]/source[3],pivot:1,layered:true,canopy:undefined});continue;
  }
  else if(old.kind==='rock')cell=4;
  else if(old.kind==='direction-sign')cell=5;
  else if(old.kind==='shrub'){if(pick%3)continue;cell=2;extra={height:2.8};}
  else if(pick%3)continue;
  props.push(cut('woodland',cell,old.x,old.z,old.width,{...old,source:DRAGON_FRAMES.woodland[cell],art:'dragon-woodland',effectId:'dragon-woodland#'+cell,pivot:1,layered:true,...extra}));
 }
 for(const [cell,x,z,w]of [[1,-43,9,11],[2,43,7,5],[5,-22,40,4]])props.push(cut('ruins',cell,x,z,w));
 if(map!=='boss'){
  props.push(cut('avalanche',2,-19,-4,0,{height:14}));
  props.push(cut('avalanche',4,21,-5,10));
 }
 if(trapIndex>=0&&trapIndex<6)props.push(cut('traps',trapIndex,0,-29,trapIndex===4?12:11,{ground:[0,1,3].includes(trapIndex),pivot:[0,1,3].includes(trapIndex)?.7:.9}));
 const x=1.05,z=-11.9,add=(cell,dx,dz,w,extra={})=>{const p=cut(kit,cell,x+dx,z+dz,w,extra);props.push(p);return p;};
 const floor=(w=19)=>add(0,0,0,w,{ground:true,pivot:.5});
 const roof=(cell,w,height,dz=0)=>add(cell,0,dz,w,{elevation:height,reveal:{x,z,rx:8,rz:7},minOpacity:.08});
 if(['entrance','exit'].includes(map)&&!scene){
  const cx=map==='entrance'?0:44,cz=map==='entrance'?-47.6:-15;
  for(const [cell,dx,dz,w,e]of [[0,0,0,20,0],[1,0,4,16,0],[2,-6,0,2.8,0],[3,6,0,2.8,0],[4,0,0,15,7],[5,8,-3,5,0]])props.push(cut('gate',cell,cx+dx,cz+dz,w,{elevation:e,height:cell===2||cell===3?8:undefined,ground:cell===0||cell===5,pivot:cell===0?.5:1}));
 }else if(['spring','revival','cleanse'].includes(map)&&!scene){
  add(1,0,5.5,12);add(2,-11,0,6);add(3,11,0,6);add(4,-7,-7,3);add(5,9,-5,2.8);
 }else if(kit==='woodland'){
  // Beast tracks and original contact are left clear.
 }else if(['camp','keeper','scale-cache','settlement'].includes(kit)){
  floor(kit==='settlement'?22:19);add(1,0,4,12);add(2,-6,0,0,{height:8});add(3,6,0,0,{height:8});roof(4,17,7);add(5,5,-3,4);
 }else if(['gate','ruins','echo'].includes(kit)){
  floor(22);add(1,0,4,16);add(2,-7,0,0,{height:10});add(3,7,0,0,{height:10});roof(4,16,8);add(5,6,-4,4);
 }else if(kit==='bridge'){
  floor(22);add(1,0,5,15);add(2,-7,0,0,{height:7});add(3,7,0,0,{height:7});add(4,0,0,14,{elevation:6.7,pivot:0,reveal:{x,z,rx:8,rz:7},minOpacity:.08});add(5,-6,-4,4);
  if(scene?.id==='encounter-4')props.push(cut('nest',5,x+5,z-2,4));
 }else if(kit==='forge'){
  floor(20);add(1,0,5,12);add(2,-6,0,4.5);add(3,6,0,4.5);add(5,6,-4,3);
 }else if(kit==='avalanche'){
  floor(20);add(1,0,5,17);add(2,-9,0,7);add(3,9,1,0,{height:8});add(4,-7,-4,5);add(5,7,-4,4);
 }else if(kit==='nest'){
  floor(20);add(1,0,5,15);add(2,-8,0,6);add(3,8,0,6);roof(4,18,8);add(5,5,-3,4);
 }else if(kit==='beacon'){
  floor(20);add(1,0,5,11);add(2,-6,0,4);add(3,6,0,4);add(5,6,-4,3);
 }else if(kit==='shrine'){
  floor(18);add(1,0,3,8);add(2,-7,1,0,{height:7});add(3,7,1,0,{height:7});add(4,0,3,3,{elevation:5});add(5,4,-3,3);
 }
 return {tiles:{...tiles,ground:tiles['dragon-ground-rock'],trail:tiles['dragon-ground-rock']},props,kit};
}
export function dragonThicket(prop){return {...prop,art:'dragon-woodland',effectId:'dragon-woodland#2',source:DRAGON_FRAMES.woodland[2],canopy:undefined,pivot:1,width:prop.width*.7,layered:true};}
