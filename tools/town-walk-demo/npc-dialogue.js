(function(g){'use strict';
const serviceAtlas='/Soulbeast/assets/town-walk-preview/npcs-v2.png.webp';
const serviceFrames={shop:0,guild:1,hall:2,camp:3,hospital:4,tower:5,forge:6,coupon:0,library:1,west:7,east:7,exit:7};
const roles={hospital:'nurse',shop:'merchant',library:'librarian',forge:'blacksmith',hall:'official',guild:'guild',camp:'commander',tower:'warden',coupon:'coupon',west:'guard',east:'guard',exit:'guard'};
function resolve(id,place,label,data=g.WorldQuestData){
 const cast=data?.cast?.find(n=>n.id===id&&n.place===place);
 if(cast)return {src:cast.portrait,name:cast.name,role:cast.role,id:cast.slug,cast:true};
 const role=roles[id];if(!role)return null;
 return {portrait:'/Soulbeast/assets/ui/npc-busts-20261103/service-'+serviceFrames[id]+'-bust-v1.png.webp',src:serviceAtlas,frame:{index:serviceFrames[id],columns:4,rows:2},name:data?.npcs?.[place]?.[id]||label||({hospital:'พยาบาลประจำวิหาร',shop:'พ่อค้าประจำเมือง',library:'บรรณารักษ์',forge:'ช่างหลอม',hall:'เจ้าหน้าที่เมือง',guild:'เจ้าหน้าที่กิล',camp:'หัวหน้าค่าย',tower:'ผู้คุมหอคอย',coupon:'ผู้ดูแลร้านคูปอง'})[id]||'ทหารเฝ้าประตู',role:({hospital:'ผู้รักษา',shop:'ร้านค้า',library:'ห้องสมุด',forge:'โรงหลอม',hall:'ที่ว่าการ',guild:'กิล',camp:'ค่าย',tower:'หอคอย',coupon:'ร้านคูปอง'})[id]||'ทหารรักษาการณ์',id:role};
}
function frameRect(npc,width,height){const f=npc?.frame;if(!f)return null;const w=width/f.columns,h=height/f.rows;return {x:(f.index%f.columns)*w,y:Math.floor(f.index/f.columns)*h,width:w,height:h}}
function createArt(npc){const image=document.createElement('img');image.className='npc-speaker-art';image.src=npc.portrait||npc.src;image.alt=npc.name+' · '+npc.role;image.decoding='async';image.dataset.referenceSource=npc.src;if(npc.frame)image.dataset.referenceFrame=String(npc.frame.index);if(!npc.cast)return image;const frame=document.createElement('span');frame.className='npc-speaker-art npc-existing-bust';frame.append(image);return frame}
function clear(dialog){if(!dialog)return;g.ForestEntrance?.clear(dialog);const footer=dialog.querySelector(':scope > .npc-dialog-footer');if(footer){const close=footer.querySelector('#closeDialog');if(close)footer.before(close);footer.remove()}dialog.classList.remove('has-npc-speaker');delete dialog.dataset.speaker;}
function set(dialog,id,place,label){clear(dialog);const npc=resolve(id,place,label);if(!npc)return null;const title=dialog.querySelector('#dialogTitle');if(!title)return null;
 const footer=document.createElement('div'),figure=document.createElement('figure'),art=createArt(npc),caption=document.createElement('figcaption');footer.className='npc-dialog-footer';figure.className='npc-dialog-speaker';caption.textContent=npc.name;if(npc.cast)title.textContent=npc.name+' · '+npc.role;figure.append(art,caption);const close=dialog.querySelector('#closeDialog');if(close)footer.append(close);footer.append(figure);dialog.append(footer);dialog.classList.add('has-npc-speaker');dialog.dataset.speaker=npc.id;return npc;
}

g.NpcDialogue={resolve,set,clear,roles,serviceAtlas,serviceFrames,frameRect,createArt};if(typeof module!=='undefined')module.exports=g.NpcDialogue;
})(typeof window==='undefined'?globalThis:window);
