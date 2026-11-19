import {forestSceneAssetURL} from './storage-assets.js?v=dragon-city-release-1';
import {QUEST_FRAMES} from './quest-frames.js?v=dragon-city-release-1';
const cache=new Map();
export async function questScenery(sites){
 const tiles={},props=[];
 for(const site of sites){
  const id=site.atlas;
  if(!cache.has(id)){const p=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Quest PNG failed: '+id));im.src=forestSceneAssetURL('city-quests',id);});cache.set(id,p);p.catch(()=>cache.delete(id));}
  tiles['quest-'+id]=await cache.get(id);
  props.push({kind:'training-prop',art:'quest-'+id,source:QUEST_FRAMES[id][site.cell],x:site.position[0],z:site.position[1],width:site.width,pivot:.86,layered:true,questSite:site.id});
 }
 return {tiles,props};
}
