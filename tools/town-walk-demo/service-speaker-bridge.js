/* Keep the selected service NPC visible while using that service; never in combat. */
function mountServiceSpeaker(){
 const main=document.querySelector('main');if(!main||S.battle||S.zone||S.screen!==params.get('screen'))return;
 const npc=window.NpcDialogue?.resolve(params.get('speaker'),params.get('city'));if(!npc||document.getElementById('serviceSpeaker'))return;
 const card=document.createElement('section'),copy=document.createElement('div'),label=document.createElement('small'),name=document.createElement('h3'),art=window.NpcDialogue.createArt(npc);card.id='serviceSpeaker';card.className='npc-service-banner';label.textContent='กำลังสนทนากับ';name.textContent=npc.name;copy.append(label,name);card.append(copy,art);main.prepend(card);
}
const serviceSpeakerRender=render;render=function(...args){const r=serviceSpeakerRender(...args);mountServiceSpeaker();return r};mountServiceSpeaker();
