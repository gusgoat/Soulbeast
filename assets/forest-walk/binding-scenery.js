import {BINDING_FRAMES as F} from './binding-frames.js?v=binding-release-1';
import {DEMON_FRAMES} from './demon-frames.js?v=demon-castle-release-1';
import {forestSceneAssetURL} from './storage-assets.js?v=binding-release-1';
const cache=new Map();
async function image(id,folder='binding'){
 const key=folder+'/'+id;if(cache.has(key))return cache.get(key);
 const promise=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Ironwood PNG failed: '+key));im.src=forestSceneAssetURL(folder,id);});cache.set(key,promise);promise.catch(()=>cache.delete(key));while(cache.size>10)cache.delete(cache.keys().next().value);return promise;
}
const ordinary={entrance:'gate',exit:'gate',footprints:'woodland',bandit:'camp',stranger:'camp',shrine:'sanctuary',spring:'spring',revival:'spring',cleanse:'spring',village:'settlement',hospital:'medicine',bush:'woodland',mist:'fog',ruins:'bridge',boss:'woodland'};
export async function bindingScenery(map,scene,baseProps,trapIndex=-1,depth=0){
 const kit=map==='boss'?'woodland':scene?.kit||ordinary[map]||'woodland',tiles={},props=[];
 for(const id of new Set(['ground','woodland',kit]))tiles['binding-'+id]=await image(id);
 function cut(id,cell,x,z,width,extra={}){const source=F[id][cell],p={kind:'training-prop',art:'binding-'+id,effectId:'binding-'+id+'#'+cell,source,x,z,width,pivot:1,layered:true,...extra};if(p.height)p.width=p.height*source[2]/source[3];props.push(p);return p;}
 // Retain original positions/colliders, with sparse layers and calibrated actor fading.
 for(const old of baseProps){
  if(old.kind==='gate')continue;const pick=Math.abs(Math.round(old.x*13+old.z*7));
  if(old.kind==='tree'&&pick%3===0)continue;if(old.kind==='shrub'&&pick%2)continue;
  const cell=old.kind==='tree'?pick%2:old.kind==='rock'?4:old.kind==='direction-sign'?5:old.kind==='shrub'?2:3;
  const p=cut('woodland',cell,old.x,old.z,old.width,{...old,art:'binding-woodland',source:F.woodland[cell],effectId:'binding-woodland#'+cell,pivot:1,layered:true});
  if(old.kind==='tree'){delete p.canopy;p.height=old.width*1.35;p.width=p.height*p.source[2]/p.source[3];}
 }
 const x=1.05,z=-11.9;
 const add=(cell,dx,dz,w,extra={})=>cut(kit,cell,x+dx,z+dz,w,extra);
 const floor=(w=20)=>add(0,0,0,w,{ground:true,pivot:.5});
 const roof=(cell=4,w=17,elevation=7)=>add(cell,0,0,w,{elevation,reveal:{x,z,rx:9,rz:7},minOpacity:.06});
 if(map==='boss'){
  // Existing eight-part boss room and guardian pair are appended by the engine.
 }else if(['entrance','exit'].includes(map)&&!scene){
  const cx=map==='entrance'?0:44,cz=map==='entrance'?-47.6:-15;
  cut('gate',0,cx,cz,20,{ground:true,pivot:.5});cut('gate',1,cx,cz+2,17);
 }else if(['spring','revival','cleanse'].includes(map)&&!scene){
  add(1,0,5.5,13);add(2,-11,0,6);add(3,11,0,6);add(4,-7,-7,3);add(5,9,-5,3);
 }else if(['bush','mist','footprints'].includes(map)&&!scene){
  if(map==='mist'){add(0,0,0,18,{ground:true,pivot:.5});add(1,-10,5,8);add(3,11,1,7);}
 }else if(map==='shrine'){
  floor(18);add(1,0,4,10);for(const [cell,side]of [[2,-1],[3,1]])add(cell,side*7,0,0,{height:7});add(4,0,3,3,{elevation:6});add(5,6,-3,3);
 }else if(map==='village'){
  floor(23);add(1,0,4,14);add(2,-7,-1,8);add(3,7,-1,8);roof(4,19,8);add(5,7,-4,0,{height:6.5,storyNpc:true,minOpacity:1});
 }else if(map==='hospital'){
  floor(21);add(1,-3,3,10);add(2,6,3,6);add(3,-8,0,5);roof(4,18,8);add(5,2,-.5,0,{height:6.6,storyNpc:true,minOpacity:1});
 }else if(map==='ruins'){
  floor(22);add(1,0,4,16);add(2,-8,-1,0,{height:8});add(3,8,-1,0,{height:8});add(4,7,-4,6);
 }else if(kit==='camp'){
  floor(21);add(1,0,4,15);add(5,7,-3,5);
 }else if(['bells','chains','fog','hounds'].includes(kit)&&scene?.id!=='iron-bell'){
  floor(22);add(1,0,6,14);for(const [cell,dx,dz]of [[2,-6,-1],[3,0,1],[4,6,-1]])add(cell,dx,dz,4.5,{height:kit==='bells'?7:undefined});add(5,8,-5,3.5);
 }else{
  floor(22);add(1,0,5,15);
  if(kit==='bridge'){add(2,-8,0,0,{height:7});add(3,8,0,0,{height:7});add(4,-7,-4,5);}
  else if(kit==='reliquary'){add(2,-8,0,0,{height:9});add(3,8,0,0,{height:9});roof(4,19,8);}
  else {add(2,-7,-1,6);add(3,7,-1,6);if(['settlement','wagon'].includes(kit))roof(4,18,8);else add(4,5,-4,5);}
  add(5,kit==='reliquary'?0:5,kit==='reliquary'?-5:-2,0,{height:kit==='reliquary'?4.5:6.5,storyNpc:kit!=='reliquary',minOpacity:1});
 }
 // Native pools change at depths 3/6; scenery echoes that progression without RNG.
 if(depth>=3)for(const [dx,dz]of [[-26,15],[27,29]])cut('woodland',4,dx,dz,7);
 if(depth>=6){if(!tiles['binding-gate'])tiles['binding-gate']=await image('gate');for(const side of [-1,1])cut('gate',side<0?2:3,side*30,7,0,{height:11});}
 if(trapIndex>=0){tiles['demon-traps']=await image('traps','demon');props.push({kind:'training-prop',art:'demon-traps',effectId:'demon-traps#'+trapIndex,source:DEMON_FRAMES.traps[trapIndex],x:0,z:-29,width:trapIndex===4?12:11,pivot:[0,1,3].includes(trapIndex)?.7:.9,ground:[0,1,3].includes(trapIndex),layered:true});}
 return {tiles:{...tiles,ground:tiles['binding-ground'],trail:tiles['binding-ground']},props,kit};
}
export function bindingThicket(prop){return {...prop,art:'binding-woodland',source:F.woodland[2],effectId:'binding-woodland#2',canopy:undefined,pivot:1,width:prop.width*.75,layered:true};}
