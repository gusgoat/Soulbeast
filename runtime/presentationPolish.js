// @soulbeast-unit 1101-presentationPolish
// Text and presentation only: no reward grants or save mutations.
const PresentationPolish={
 reward(text){
  const value=String(text),matches=[];
  const entries=[...Object.entries(CON),...Object.entries(EQ),...Object.entries(SP).flatMap(([sp,v])=>(v.parts||[]).map((x,i)=>[sp+'|'+i,{n:x[0]}]))].sort((a,b)=>b[1].n.length-a[1].n.length);
  let rest=value;for(const [id,it]of entries)if(rest.includes(it.n)){matches.push(id);rest=rest.split(it.n).join('');}
  return matches.length?'<span class="reward-icons">'+[...new Set(matches)].map(id=>itemIcon(id,56)).join('')+'</span>':'';
 },
 enhance(root=document){
  for(const el of root.querySelectorAll('.res .lines>div,.toast,#secretEvent [role="status"],.online-command-body>p,.event-msg,.event-result,main p')){
   if(el.querySelector('.reward-icons')||(!el.matches('.res .lines>div')&&!/ได้รับ|ได้ |รับรางวัล|✦|×|จำนวน|ชิ้นส่วน/.test(el.textContent)))continue;
   const icons=this.reward(el.textContent);if(icons){el.classList.add('reward-with-art');el.insertAdjacentHTML('afterbegin',icons);}
  }
 }
};
const polishToast=toast;
toast=function(text){polishToast(text);const d=document.querySelector('.toast:last-of-type');if(d){const icons=PresentationPolish.reward(text);if(icons&&/ได้รับ|ได้ |รางวัล|เปิดหีบ/.test(text)){d.classList.add('reward-with-art');d.insertAdjacentHTML('afterbegin',icons);}}};
const polishRender=render;
render=function(...args){const result=polishRender(...args);PresentationPolish.enhance();return result;};
const galleryPortrait=portrait;
portrait=function(key,size,opts={}){
 const gallery=['hero','team','bag','bestiary','beaststory'].includes(S.screen)&&!S.battle&&size>=44;
 if(!gallery||opts.unk)return galleryPortrait(key,size,opts);
 const bigger=S.screen==='beaststory'?280:['bestiary','team'].includes(S.screen)?120:Math.min(144,Math.max(72,Math.round(size*1.6))),html=galleryPortrait(key,bigger,opts);
 const u=key==='player'?{cls:S.P.cls,gender:S.P.gender,id:'P'}:key?.startsWith('cls:')?{cls:key.slice(4),gender:opts.gender||S.P.gender}:key?.startsWith('form:')?{form:key.slice(5)}:{sp:key,evo:opts.form||0};
 const a=CharacterMotion.resolve(u);if(!a)return html;
 const layers='<span class="um-aura" aria-hidden="true"></span><span class="um-body"><span class="um-window"><img class="um-art" data-pose="idle" src="'+a.assets.idle+'" alt="" loading="lazy" decoding="async"></span></span>'+(a.identity.particles?'<span class="um-embers" aria-hidden="true">'+Array.from({length:8},(_,i)=>'<i style="--i:'+i+';--um-particle-color:'+a.identity.colors[i%a.identity.colors.length]+'"></i>').join('')+'</span>':'');
 return html.replace(/<img class="(?:atlas-face|legendary-beast-portrait)"[^>]*>|<span class="mist-beast-art"[^>]*><\/span>/,layers).replace('class="pt ','class="pt motion-unit gallery-motion ').replace('style="','style="'+CharacterMotion.styles(a)).replace('<div ','<div '+CharacterMotion.attrs(a)+' ');
};
const galleryItem=itemIcon;
itemIcon=function(id,size=44){if(size>=36&&['hero','bag','weaponbook'].includes(S.screen)&&!S.battle)size=S.screen==='weaponbook'?128:Math.max(size,72);return galleryItem(id,size);};
const secretRiddleText={
 yggdrasil:'คืนที่ไม่มีลม ผู้เฝ้าจดไว้ว่า ส่วนที่แตะฟ้าจะตื่นไม่ได้จนกว่าส่วนที่ยืนรับน้ำหนักจะส่งชีวิตให้ ส่วนที่ยืนรับน้ำหนักเองไม่มีสิทธิ์เริ่มพิธี และสิ่งที่เริ่มพิธีต้องไม่เคยเห็นดวงดาว จงเรียงทั้งสามเพียงครั้งเดียว',
 shangrila:'ผู้เดินทางตีระฆังใบสุดท้ายแล้วกลับมายืนที่เดิม ผู้เฝ้าจึงบอกกฎสองข้อ: สิ่งที่ทำให้พรุ่งนี้ต่างจากเมื่อวานต้องอยู่ท้ายสุด ส่วนการอยู่ร่วมกับความจริงต้องเกิดหลังการมองเห็นมัน ระฆังทั้งสามห้ามตีซ้ำ',
 sahara:'ตาชั่งไม่ไหวติงเมื่อเพิ่มทอง และยังเอียงเมื่อเก็บเสียงทุกเสียงไว้ในผนึก ผู้จดบัญชีลองเปลี่ยนเพียงรายการเดียว: ขีดชื่อผู้ครอบครองปัจจุบันออก แล้วลงชื่อผู้มอบของไว้แต่แรก เข็มจึงค่อยกลับกลาง สิ่งใดคือกฎของตาชั่ง?',
 dragongate:'ตราทั้งสามใช้ได้ครั้งเดียว หมอกปลายทางต้องรอผู้พามาถึงก่อน ผู้พาไม่อาจเริ่มเอง เพราะต้องมีสิ่งให้พา และสิ่งที่ให้กำเนิดความร้อนต้องไม่อยู่หลังผู้พา ประตูต้องการเหตุที่ต่อเนื่องกัน มิใช่ตราที่ใหญ่ที่สุด',
 valhalla:'บันทึก ก: ประตูเปิดให้ผู้อยู่ข้างในออกได้ บันทึก ข: ยามรับคำสั่งว่าทุกคนต้องปลอดภัยจึงปิดประตู บันทึก ค: แม้ภัยภายนอกสิ้นสุด กุญแจก็ยังอยู่กับยาม และคำขอออกไปถูกลบทิ้ง บันทึกทั้งสามมีรอยผนึกของผู้สั่งคนเดียวกัน สิ่งใดเปลี่ยนไปจาก ก ถึง ค?',
 pandemonium:'มีหลักฐานที่ตรวจตรงกันได้สามข้อ: ผู้บนบัลลังก์เคยถูกพรากครอบครัว; ผนึกในมือเขามีเสียงของชาวเมืองที่ยังมีชีวิต; ผู้รอดชีวิตขอคืนเสียงแต่ไม่ได้ขอให้ลบประวัติความสูญเสีย ข้อสรุปใดไม่ปฏิเสธหลักฐานข้อใดเลย?'
};
for(const d of SECRET_DATA.locations)if(secretRiddleText[d.id])d.clue=secretRiddleText[d.id];
// @soulbeast-end 1101-presentationPolish
