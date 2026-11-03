(function(g){'use strict';
const base='/Soulbeast/assets/ui/dialogue-20261103/';
const roles={hospital:'nurse',shop:'merchant',library:'librarian',forge:'blacksmith',hall:'official',guild:'guild',camp:'commander',tower:'warden',coupon:'coupon',west:'guard',east:'guard',exit:'guard'};
function resolve(id,place,label,data=g.WorldQuestData){
 const cast=data?.cast?.find(n=>n.id===id&&n.place===place);
 if(cast)return {src:cast.portrait,name:cast.name,role:cast.role,id:cast.slug,cast:true};
 const role=roles[id];if(!role)return null;
 return {src:base+'npc-'+role+'.png.webp',name:data?.npcs?.[place]?.[id]||label||({hospital:'พยาบาลประจำวิหาร',shop:'พ่อค้าประจำเมือง',library:'บรรณารักษ์',forge:'ช่างหลอม',hall:'เจ้าหน้าที่เมือง',guild:'เจ้าหน้าที่กิล',camp:'หัวหน้าค่าย',tower:'ผู้คุมหอคอย',coupon:'ผู้ดูแลร้านคูปอง'})[id]||'ทหารเฝ้าประตู',role:({hospital:'ผู้รักษา',shop:'ร้านค้า',library:'ห้องสมุด',forge:'โรงหลอม',hall:'ที่ว่าการ',guild:'กิล',camp:'ค่าย',tower:'หอคอย',coupon:'ร้านคูปอง'})[id]||'ทหารรักษาการณ์',id:role};
}
function clear(dialog){if(!dialog)return;const intro=dialog.querySelector(':scope > .npc-dialog-intro');if(intro){const copy=intro.querySelector('.npc-dialog-copy');while(copy?.firstChild)dialog.insertBefore(copy.firstChild,intro);intro.remove()}dialog.classList.remove('has-npc-speaker');delete dialog.dataset.speaker;}
function set(dialog,id,place,label){clear(dialog);const npc=resolve(id,place,label);if(!npc)return null;const title=dialog.querySelector('#dialogTitle'),text=dialog.querySelector('#dialogText');if(!title||!text)return null;
 const intro=document.createElement('div'),copy=document.createElement('div'),figure=document.createElement('figure'),im=document.createElement('img'),caption=document.createElement('figcaption');intro.className='npc-dialog-intro';copy.className='npc-dialog-copy';figure.className='npc-dialog-speaker';im.src=npc.src;im.alt=npc.name+' · '+npc.role;im.decoding='async';caption.textContent=npc.name;if(npc.cast)title.textContent=npc.name+' · '+npc.role;figure.append(im,caption);title.before(intro);copy.append(title,text);intro.append(copy,figure);dialog.classList.add('has-npc-speaker');dialog.dataset.speaker=npc.id;return npc;
}
g.NpcDialogue={resolve,set,clear,roles};if(typeof module!=='undefined')module.exports=g.NpcDialogue;
})(typeof window==='undefined'?globalThis:window);
