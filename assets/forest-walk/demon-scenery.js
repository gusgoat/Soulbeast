import {demonRoomScenery} from './demon-room-scenery.js?v=demon-castle-release-1';
import '../../tools/town-walk-demo/demon-room-plan.js?v=demon-castle-release-1';
import {DEMON_FRAMES} from './demon-frames.js?v=demon-castle-release-1';
import {forestSceneAssetURL} from './storage-assets.js?v=demon-castle-release-1';
import {CASTLE_SERVICE_FRAMES,CASTLE_SERVICE_SITES} from './castle-service-sites.js?v=demon-castle-release-1';
const cache=new Map();
async function image(id,folder='demon'){
 const key=folder+'/'+id;
 if(cache.has(key)){const p=cache.get(key);cache.delete(key);cache.set(key,p);return p;}
 const p=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Demon PNG failed: '+key));im.src=forestSceneAssetURL(folder,id);});
 cache.set(key,p);p.catch(()=>cache.delete(key));while(cache.size>8)cache.delete(cache.keys().next().value);return p;
}
const ordinary={entrance:'gate',exit:'gate',footprints:'woodland',bandit:'camp',stranger:'camp',shrine:'shrine',spring:'spring',revival:'spring',cleanse:'spring',village:'settlement',hospital:'settlement',bush:'supplies',mist:'hounds',ruins:'ruins',boss:'woodland'};
export async function demonScenery(map,scene,baseProps,trapIndex=-1,{step=1,room}={}){
 if(step>=4||map==='boss')return demonRoomScenery(map,scene,step,room,trapIndex);
 const kit=map==='boss'?'woodland':scene?.kit||ordinary[map]||'woodland',tiles={},props=[];
 for(const id of new Set(['woodland','ruins',kit,'ground-basalt',...(trapIndex>=0?['traps']:[])]))tiles['demon-'+id]=await image(id);
 function cut(id,cell,x,z,width,extra={}){
  const source=DEMON_FRAMES[id][cell],p={kind:'training-prop',art:'demon-'+id,effectId:'demon-'+id+'#'+cell,source,x,z,width,pivot:1,layered:true,...extra};
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
  props.push(cut('woodland',cell,old.x,old.z,old.width,{...old,source:DEMON_FRAMES.woodland[cell],art:'demon-woodland',effectId:'demon-woodland#'+cell,pivot:1,layered:true,...extra}));
 }
 for(const [cell,x,z,w]of [[1,-43,9,13],[2,43,7,7],[5,-22,40,4]])props.push(cut('ruins',cell,x,z,w));
 if(trapIndex>=0&&trapIndex<6)props.push(cut('traps',trapIndex,0,-29,trapIndex===4?12:11,{ground:[0,1,3].includes(trapIndex),pivot:[0,1,3].includes(trapIndex)?.7:.9}));
 const x=1.05,z=-11.9,add=(cell,dx,dz,w,extra={})=>{const p=cut(kit,cell,x+dx,z+dz,w,extra);props.push(p);return p;};
 const floor=(w=20)=>add(0,0,0,w,{ground:true,pivot:.5});
 const roof=(cell,w,elevation,dz=0)=>add(cell,0,dz,w,{elevation,reveal:{x,z,rx:8,rz:7},minOpacity:.08});
 const temple=(w=20,postHeight=9,npc=false)=>{floor(w);add(1,0,5,15);add(2,-7,0,0,{height:postHeight});add(3,7,0,0,{height:postHeight});roof(4,16,postHeight*.82);if(npc)add(5,4,.5,0,{height:kit==='parcel'?4.2:6.5,storyNpc:true,minOpacity:1});else add(5,5,-3,4);};
 if(['exit','village'].includes(map)&&!scene){
  const site=CASTLE_SERVICE_SITES[map],asset=site.asset||'services-v2',frames=site.frames||CASTLE_SERVICE_FRAMES;
  tiles['castle-'+asset]=await image(asset,'demon-interior');
  for(const [cell,x,z,width,extra]of site.pieces)props.push({kind:'training-prop',art:'castle-'+asset,source:frames[cell],x,z,width,pivot:1,layered:true,siteMarker:map,siteLabel:site.label,nativeContact:site.contact,...extra});
  if(map==='village')props.push(cut('settlement',5,7,38,0,{height:6.4,siteMarker:map}));
 }else if(['entrance','exit'].includes(map)&&!scene){
  const cx=map==='entrance'?0:44,cz=map==='entrance'?-47.6:-15;
  for(const [cell,dx,dz,w,e]of [[0,0,0,20,0],[1,0,4,16,0],[2,-6,0,2.8,0],[3,6,0,2.8,0],[4,0,0,15,7],[5,8,-3,4,0]])props.push(cut('gate',cell,cx+dx,cz+dz,w,{elevation:e,height:cell===2||cell===3?8:undefined,ground:cell===0,pivot:cell===0?.5:1}));
 }else if(['spring','revival','cleanse'].includes(map)&&!scene){
  // Keep native basin image, surface, rim and water-contact calibration intact.
  add(1,0,5.5,12);add(2,-11,0,6);add(3,11,0,6);add(4,-7,-7,3);add(5,9,-5,3);
 }else if(kit==='woodland'){
  // Native tracks and encounter contact remain unobstructed.
 }else if(kit==='camp'){
  floor(21);add(1,0,5,15);roof(4,16,0);add(5,6,-3,5);
 }else if(['mirrors','chains','banquet','hounds'].includes(kit)){
  floor(22);add(1,0,5,15);add(2,-6,-1,4);add(3,0,1,4);add(4,6,-1,4);add(5,7,-4,4);
 }else if(kit==='shrine'){
  floor(18);add(1,0,4,9);add(2,-7,1,0,{height:7});add(3,7,1,0,{height:7});add(4,0,3,3,{elevation:5});add(5,5,-3,3);
 }else if(kit==='spring'){
  add(1,0,5.5,12);add(2,-11,0,6);add(3,11,0,6);add(4,-7,-7,3);add(5,9,-5,3);
 }else{
  temple(kit==='settlement'?22:21,9,['pandemonium','parcel','knocking','witness','prison','messenger','settlement'].includes(kit));
 }
 return {tiles:{...tiles,ground:tiles['demon-ground-basalt'],trail:tiles['demon-ground-basalt']},props,kit};
}
export function demonThicket(prop){return {...prop,art:'demon-woodland',effectId:'demon-woodland#2',source:DEMON_FRAMES.woodland[2],canopy:undefined,pivot:1,width:prop.width*.7,layered:true};}
