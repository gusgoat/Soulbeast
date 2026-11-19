import '../../tools/town-walk-demo/demon-room-plan.js?v=demon-castle-release-1';
import {DEMON_ROOM_FRAMES as F} from './demon-room-frames.js?v=demon-castle-release-1';
import {DEMON_FRAMES as STORY} from './demon-frames.js?v=demon-castle-release-1';
import {forestSceneAssetURL} from './storage-assets.js?v=demon-castle-release-1';
import {CASTLE_SERVICE_FRAMES,CASTLE_SERVICE_SITES} from './castle-service-sites.js?v=demon-castle-release-1';
const cache=new Map();
async function image(folder,id){const key=folder+'/'+id;if(cache.has(key))return cache.get(key);const p=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Castle interior PNG failed: '+key));im.src=forestSceneAssetURL(folder,id);});cache.set(key,p);p.catch(()=>cache.delete(key));while(cache.size>14)cache.delete(cache.keys().next().value);return p;}
// Furniture groups are intentional room zones. Central native contacts and Y lanes stay open.
const layouts={
 basement:[[1,-29,-10,15],[0,-23,-30,9],[2,26,-30,7],[3,25,-9,12],[4,-31,20,7],[5,0,25,10],[2,-10,-31,5],[2,10,-31,5]],
 prison:[[0,-30,-20,16],[0,30,-20,16],[0,-30,15,16],[0,30,15,16],[1,-31,-27,7],[1,31,-27,7],[2,0,25,12],[3,8,22,3],[4,-22,0,5],[5,22,0,4],[4,-11,-31,4],[4,11,-31,4]],
 music:[[0,0,27,28,{ground:true,pivot:.5}],[1,0,33,18],[2,-10,27,6],[4,8,26,4],[5,13,26,4],[3,-23,-25,11],[3,23,-25,11],[3,-11,-31,8],[3,11,-31,8]],
 dining:[[0,-23,-13,18],[0,23,-13,18],[1,0,29,14],[3,-33,15,8],[4,33,15,8],[2,-11,-31,4],[2,11,-31,4],[5,0,-13,11,{elevation:10,ceiling:true}]],
 lounge:[[0,-24,-12,24,{ground:true,pivot:.5}],[1,-24,1,14],[2,-24,-13,14],[3,-14,-22,7],[3,-34,-22,7],[4,-24,-23,10],[5,25,-20,12],[0,25,-12,20,{ground:true,pivot:.5}],[2,25,0,12],[3,-10,-31,6],[3,10,-31,6]],
 armory:[[0,-28,-25,14],[0,28,-25,14],[1,-30,5,13],[1,30,5,13],[2,-23,-5,5],[2,23,-5,5],[3,0,27,17],[4,-32,25,7],[4,32,25,7],[5,22,-33,8],[2,-10,-31,4],[2,10,-31,4]],
 laboratory:[[1,-28,5,15],[1,28,5,15],[0,-23,-18,16],[0,23,-18,16],[2,-30,23,7],[3,30,23,7],[4,0,27,8],[5,-34,-31,6],[3,-10,-31,5],[3,10,-31,5]],
 ritual:[[0,0,24,25,{ground:true,pivot:.5}],[1,0,30,15],[2,-10,25,4],[2,10,25,4],[3,-27,20,5],[3,27,20,5],[4,-24,-20,10],[5,24,-20,6],[2,-10,-31,3],[2,10,-31,3]],
 library:[[0,-28,5,17],[0,28,5,17],[0,0,34,20],[1,-23,-18,17],[1,23,-18,17],[2,-31,-31,8],[2,31,-31,8],[3,-21,5,5],[4,-10,-31,5],[4,10,-31,5],[5,-32,23,6]],
 banquet:[[0,0,-31,20,{ground:true,pivot:.5}],[1,-24,-12,20],[1,24,-12,20],[3,0,30,20],[4,-10,-31,4],[4,10,-31,4],[5,0,-12,14,{elevation:10,ceiling:true}]],
 treasury:[[0,-25,-22,10],[0,25,-22,10],[1,-28,7,15],[1,28,7,15],[2,-28,27,8],[2,28,27,8],[3,-23,-14,11,{ground:true,pivot:.5}],[3,23,-14,11,{ground:true,pivot:.5}],[4,0,28,16],[5,-30,19,12],[5,30,19,12],[0,-10,-31,6],[0,10,-31,6]],
 throne:[[0,1.05,-29,4.8,{ground:true,pivot:.5,redCarpet:true}],[1,1.05,26,10,{height:13}],[2,-10,-30,5],[3,10,-30,5],[2,-10,24,6],[3,10,24,6],[4,-26,-15,13],[4,26,-15,13],[5,1.05,27,20,{elevation:10,ceiling:true}]]
};
export async function demonRoomScenery(map,scene,step,override,trapIndex=-1){
 const plan=globalThis.DemonCastleRooms,room=plan.names[override]?override:plan.roomFor(map,scene,step),tiles={},props=[];
 const load=async(folder,id)=>{const key=folder==='demon-interior'?'castle-'+id:'demon-'+id;tiles[key]=await image(folder,id);return key;};
 for(const id of ['floor','shell','supports',room])await load('demon-interior',id);
 function cut(id,cell,x,z,width,extra={}){const source=F[id][cell],p={kind:'training-prop',art:'castle-'+id,effectId:'castle-'+id+'#'+cell,source,x,z,width,pivot:1,layered:true,castleProp:true,...extra};if(p.height)p.width=p.height*source[2]/source[3];props.push(p);return p;}
 function furnishing(cell,x,z,width,extra={}){return cut(room,cell,x,z,width,{roomFurniture:true,...extra,...(extra.ceiling?{reveal:{x,z,rx:12,rz:8},minOpacity:.08}:{}),radius:extra.ground||extra.ceiling?undefined:Math.min(3.5,width*.23)});}
 // Restore the original PNG architecture, with both side walls left out of view.
 for(const x of [-42,-28,-14,0,14,28,42])cut('shell',0,x,49,14,{height:10,roomWall:true});
 for(const z of [-35,-13,9,30]){
  for(const side of [-1,1])cut('supports',side<0?0:2,side*12,z,0,{height:9.5,radius:.7,roomColumn:true});
  if(z!==30||!['exit','village'].includes(map))cut('shell',4,0,z,26,{elevation:8.6,reveal:{x:0,z,rx:16,rz:6},minOpacity:.06,roomBeam:true});
 }
 if(map==='boss'){
  cut('supports',4,1.05,-12,16,{ground:true,pivot:.5});
  cut('shell',5,1.05,-9.1,0,{height:14,roomWall:true});
  for(const side of [-1,1])cut('shell',0,1.05+side*9,-9.1,11,{height:14,roomWall:true});
 }else for(const [x,z]of [[-34.3,41.2],[35.7,42.9]])cut('shell',5,x,z,12,{height:11,exitDoor:true});
 // Wall collision is separate from the cutaway art; keep both native Y door approaches clear.
 for(const side of [-1,1])for(let z=-43;z<=49;z+=4)cut('supports',0,side*46,z,1,{renderHidden:true,radius:2.4,roomBoundary:true});
 for(let x=-44;x<=44;x+=4){if(map!=='boss'&&(Math.abs(x+34.3)<6||Math.abs(x-35.7)<6))continue;cut('supports',0,x,50,1,{renderHidden:true,radius:2.4,roomBoundary:true});}
 for(const spec of layouts[room])furnishing(...spec);
 const entry={prison:[4,4],music:[3,8],armory:[2,4.5],laboratory:[3,5],ritual:[2,3],library:[5,5.5]};
 if(entry[room])for(const side of [-1,1])furnishing(entry[room][0],side*10,-31,entry[room][1]);
 if(room==='lounge')for(const side of [-1,1]){furnishing(3,side*10,-28,6);furnishing(4,side*10,-35,7);}
 if(room==='dining'||room==='banquet')for(const side of [-1,1])furnishing(room==='dining'?4:3,side*10,-31,7);

 if(room==='dining'||room==='banquet')for(const side of [-1,1])for(const z of [-18,-10])for(const dx of [-7,7])furnishing(2,side*23+dx,z,3.2);
 // Common torches stay against room partitions and outside the original Y lanes.
 for(const side of [-1,1])for(const z of [-30,22])cut('supports',5,side*32,z,2.4,{height:7});
 function old(id,cell,x,z,width,extra={}){const p={kind:'training-prop',art:'demon-'+id,effectId:'demon-'+id+'#'+cell,source:STORY[id][cell],x,z,width,pivot:1,layered:true,...extra};if(p.height)p.width=p.height*p.source[2]/p.source[3];props.push(p);return p;}
 const kit=scene?.kit;
 if(kit&&kit!=='boss'&&STORY[kit]){
  await load('demon',kit);
  if(['mirrors','chains','banquet','hounds'].includes(kit))for(const [cell,x,z,w]of [[2,-5,-11,3.8],[3,1.05,-9,3.8],[4,7,-11,3.8],[5,8,-16,3.5]])old(kit,cell,x,z,w,{nativeStory:true});
  else old(kit,5,5.05,-11.4,4,{height:['pandemonium','parcel','knocking','witness','prison','messenger','settlement'].includes(kit)?kit==='parcel'?4.2:6.5:undefined,storyNpc:true,minOpacity:1,nativeStory:true});
 }
 if(['spring','revival','cleanse'].includes(map)){
  await load('demon','spring');old('spring',1,1.05,-6.4,12,{nativeWellBackdrop:true});old('spring',5,10,-17,3);
 }
 const site=CASTLE_SERVICE_SITES[map];
 if(site){
  const siteAsset=site.asset||'services-v2',siteFrames=site.frames||CASTLE_SERVICE_FRAMES;
  await load('demon-interior',siteAsset);
  for(const [cell,x,z,width,extra={}]of site.pieces){
   const source=siteFrames[cell],p={kind:'training-prop',art:'castle-'+siteAsset,source,x,z,width,pivot:1,layered:true,castleProp:true,siteMarker:map,siteLabel:site.label,nativeContact:site.contact,...extra};
   if(p.height)p.width=p.height*source[2]/source[3];props.push(p);
  }
  // Searchable ruin debris sits on broken indoor flagstones at the original site.
  if(map==='ruins'){await load('demon','ruins');old('ruins',0,1.05,-11.9,18,{ground:true,pivot:.5,siteMarker:map});}
  if(map==='village'){await load('demon','settlement');old('settlement',5,7,38,0,{height:6.4,siteMarker:map});}
 }
 // Keep the new central aisle open without moving either native Y branch.
 if(map==='exit'||map==='village')for(const p of props)if(p.roomFurniture&&p.radius&&p.z>-2&&p.z<43&&Math.abs(p.x)<p.radius+3)p.x=p.x<0?-10:10;
 if(trapIndex>=0){await load('demon','traps');old('traps',trapIndex,0,-29,trapIndex===4?12:11,{ground:[0,1,3].includes(trapIndex),pivot:[0,1,3].includes(trapIndex)?.7:.9});}
 return {tiles:{...tiles,ground:tiles['castle-floor'],trail:tiles['castle-floor']},props,kit:room,interior:true,room,roomName:plan.names[room]};
}
