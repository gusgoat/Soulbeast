// Image-only walking actions retain their original buttons and event handlers.
const art={"recall-base":"https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/ui/colosseum-buttons-v1/recall-base-90c45d1e5752.webp","select-warp":"https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/ui/colosseum-buttons-v1/select-warp-ba90401cc0ee.webp"};
const names={'วาร์ปกลับฐานใหญ่':{en:'Recall to main base','zh-CN':'传送回主堡'},'ยกเลิกวาร์ป':{en:'Cancel teleport','zh-CN':'取消传送'},'เลือกจุดวาร์ป':{en:'Choose teleport destination','zh-CN':'选择传送地点'},'ยังไม่มีจุดวาร์ปที่ใช้ได้':{en:'No teleport destinations available','zh-CN':'暂无可用传送地点'}};
export function paintActionControl(button,label,{image=null,channeling=false}={}){
 if(!image){
  if(button.dataset.controlArt){delete button.dataset.controlArt;delete button.dataset.channeling;delete button.dataset.controlLabel;button.classList.remove('arena-art-control','arena-art-missing');button.removeAttribute('aria-labelledby');button.removeAttribute('translate');delete button.dataset.controlLanguage;button.removeAttribute('aria-label');button.removeAttribute('title');button.replaceChildren();}
  if(button.dataset.controlLabel!==label){button.textContent=label;button.dataset.controlLabel=label;}
  return;
 }
 if(button.dataset.controlArt!==image){
  button.classList.remove('arena-art-missing');const img=document.createElement('img');img.onerror=()=>{if(button.dataset.controlArt===image)button.classList.add('arena-art-missing');};img.onload=()=>button.classList.remove('arena-art-missing');img.src=art[image];img.alt='';img.draggable=false;img.decoding='async';img.width=img.height=256;
  const name=document.createElement('span');name.className='arena-control-name';name.id=button.id+'-accessible-name';
  const cancel=document.createElement('span');cancel.className='arena-cancel-mark';cancel.setAttribute('aria-hidden','true');
  button.replaceChildren(img,name,cancel);delete button.dataset.controlLabel;button.dataset.controlArt=image;button.classList.add('arena-art-control');button.setAttribute('translate','no');button.setAttribute('aria-labelledby',name.id);
 }
 const language=globalThis.SoulbeastLocale?.get()||'th',localized=names[label]?.[language]||label;
 const name=button.querySelector('.arena-control-name');if(button.dataset.controlLabel!==label||button.dataset.controlLanguage!==language){name.textContent=localized;button.title=localized;button.dataset.controlLabel=label;button.dataset.controlLanguage=language;}
 if(button.dataset.channeling!==String(channeling))button.dataset.channeling=String(channeling);
}

globalThis.addEventListener?.('soulbeast-language-change',()=>{for(const button of document.querySelectorAll('.arena-art-control'))paintActionControl(button,button.dataset.controlLabel,{image:button.dataset.controlArt,channeling:button.dataset.channeling==='true'});});
