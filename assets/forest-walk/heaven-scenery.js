import {HEAVEN_FRAMES} from './heaven-frames.js?v=heaven-waterfall-release-1';
import {forestSceneAssetURL} from './storage-assets.js?v=heaven-waterfall-release-1';
const cache=new Map();
async function image(id){
 if(cache.has(id)){const p=cache.get(id);cache.delete(id);cache.set(id,p);return p;}
 const p=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Heaven PNG failed: '+id));im.src=forestSceneAssetURL('heaven',id);});
 cache.set(id,p);p.catch(()=>cache.delete(id));while(cache.size>8)cache.delete(cache.keys().next().value);return p;
}
const ordinary={entrance:'gate',exit:'gate',footprints:'woodland',bandit:'camp',stranger:'camp',shrine:'shrine',spring:'spring',revival:'spring',cleanse:'spring',village:'settlement',hospital:'settlement',bush:'garden',mist:'wind',ruins:'ruins',boss:'woodland'};
export async function heavenScenery(map,scene,baseProps,trapIndex=-1){
 const kit=map==='boss'?'woodland':scene?.kit||ordinary[map]||'woodland',tiles={},props=[];
 for(const id of new Set(['woodland','ruins',kit,'ground-marble',...(trapIndex>=0?['traps']:[])]))tiles['heaven-'+id]=await image(id);
 function cut(id,cell,x,z,width,extra={}){
  const source=HEAVEN_FRAMES[id][cell],p={kind:'training-prop',art:'heaven-'+id,effectId:'heaven-'+id+'#'+cell,source,x,z,width,pivot:1,layered:true,...extra};
  if(p.height)p.width=p.height*source[2]/source[3];return p;
 }
 for(const old of baseProps){
  const pick=Math.abs(Math.round(old.x*13+old.z*7));let cell=3,extra={};
  if(old.kind==='gate')continue;
  if(old.kind==='tree'){if(pick%3)continue;cell=pick%2;extra={height:old.width*1.15,canopy:undefined};}
  else if(old.kind==='rock')cell=4;
  else if(old.kind==='direction-sign')cell=5;
  else if(old.kind==='shrub'){if(pick%3)continue;cell=2;extra={height:2.8};}
  else if(pick%3)continue;
  props.push(cut('woodland',cell,old.x,old.z,old.width,{...old,source:HEAVEN_FRAMES.woodland[cell],art:'heaven-woodland',effectId:'heaven-woodland#'+cell,pivot:1,layered:true,...extra}));
 }
 for(const [cell,x,z,w]of [[1,-43,9,13],[2,43,7,7],[5,-22,40,4]])props.push(cut('ruins',cell,x,z,w));
 if(trapIndex>=0&&trapIndex<6)props.push(cut('traps',trapIndex,0,-29,trapIndex===4?12:11,{ground:[0,1,3].includes(trapIndex),pivot:[0,1,3].includes(trapIndex)?.7:.9}));
 const x=1.05,z=-11.9,add=(cell,dx,dz,w,extra={})=>{const p=cut(kit,cell,x+dx,z+dz,w,extra);props.push(p);return p;};
 const floor=(w=20)=>add(0,0,0,w,{ground:true,pivot:.5});
 const roof=(cell,w,elevation,dz=0)=>add(cell,0,dz,w,{elevation,reveal:{x,z,rx:8,rz:7},minOpacity:.08});
 const temple=(w=20,postHeight=9,npc=false)=>{floor(w);add(1,0,5,15);add(2,-7,0,0,{height:postHeight});add(3,7,0,0,{height:postHeight});roof(4,16,postHeight*.82);if(npc)add(5,3,-1,0,{height:6.5});else add(5,5,-3,4);};
 if(['entrance','exit'].includes(map)&&!scene){
  const cx=map==='entrance'?0:44,cz=map==='entrance'?-47.6:-15;
  for(const [cell,dx,dz,w,e]of [[0,0,0,20,0],[1,0,4,16,0],[2,-6,0,2.8,0],[3,6,0,2.8,0],[4,0,0,15,7],[5,8,-3,4,0]])props.push(cut('gate',cell,cx+dx,cz+dz,w,{elevation:e,height:cell===2||cell===3?8:undefined,ground:cell===0,pivot:cell===0?.5:1}));
 }else if(['spring','revival','cleanse'].includes(map)&&!scene){
  // Keep native basin image, surface, rim and water-contact calibration intact.
  add(1,0,5.5,12);add(2,-11,0,6);add(3,11,0,6);add(4,-7,-7,3);add(5,9,-5,3);
 }else if(kit==='woodland'){
  // Native tracks and encounter contact remain unobstructed.
 }else if(kit==='garden'){
  floor(21);add(1,0,5,13);add(2,-6,-1,5);add(3,6,-1,4);add(4,-8,4,5);add(5,7,4,3.5);
 }else if(kit==='oath'){
  floor(22);add(1,0,5,14);add(2,-6,-1,4);add(3,0,1,4);add(4,6,-1,4);add(5,8,-4,3,{ground:true});
 }else if(kit==='storm'){
  floor(22);add(1,0,6,15);add(2,-7,0,0,{height:9});add(3,7,0,6);roof(4,10,0);add(5,7,-5,4,{ground:true});
 }else if(kit==='wind'){
  floor(22);add(1,0,5,15);add(2,-6,-1,4);add(3,0,1,4);add(4,6,-1,4);add(5,8,4,4);
 }else if(kit==='armor'){
  floor(20);add(1,0,5,15);add(2,-5,-1,4);add(3,5,-1,3.5);add(5,7,4,4);
 }else if(kit==='shrine'){
  floor(18);add(1,0,4,9);add(2,-7,1,0,{height:7});add(3,7,1,0,{height:7});add(4,0,3,3,{elevation:5});add(5,5,-3,3);
 }else if(kit==='spring'){
  add(1,0,5.5,12);add(2,-11,0,6);add(3,11,0,6);add(4,-7,-7,3);add(5,9,-5,3);
 }else{
  temple(kit==='settlement'?22:21,kit==='bell'?10:9,['lantern','watchpost','bell'].includes(kit));
 }
 return {tiles:{...tiles,ground:tiles['heaven-ground-marble'],trail:tiles['heaven-ground-marble']},props,kit};
}
export function heavenThicket(prop){return {...prop,art:'heaven-woodland',effectId:'heaven-woodland#2',source:HEAVEN_FRAMES.woodland[2],canopy:undefined,pivot:1,width:prop.width*.7,layered:true};}
