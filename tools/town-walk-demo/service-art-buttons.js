(function(g){'use strict';
// Reuse the original town-menu artwork; labels and actions remain live text.
const catalog={
 countrywar:{art:'/Soulbeast/assets/ui/country-war/activity-v1.webp',note:'ลงทะเบียนป้องกัน / สงครามอาณาจักร',position:'center'},
 world:{art:'/Soulbeast/assets/media/1620b9ca7d9052245fe7d7a1.webp',note:'สร้างหรือเข้าร่วมปาร์ตี้บอสโลก',position:'center 24%'},
 pvp:{art:'/Soulbeast/assets/media/d22b62fc32b6345a4255bd69.webp',note:'สร้างห้องหรือเข้าร่วมประลองกับผู้เล่น'},
 leader:{art:'/Soulbeast/assets/media/460b762d271285c444b0f7fa.webp',note:'กระดานคะแนนและอันดับผู้ผนึก'},
 arena:{art:'/Soulbeast/assets/ui/martial-tower-v1.webp',note:'ท้าดวลผู้ผนึกและรับรางวัล'},
 shop:{art:'/Soulbeast/assets/media/7955afaf9b7181a0383f4fbb.webp',note:'อุปกรณ์ ยา และผนึก'},
 hospital:{art:'/Soulbeast/assets/media/498edb7b9041e9a148e0dba1.webp',note:'ฟื้นฟู HP / MP และรักษาทีม'},
 forge:{art:'/Soulbeast/assets/media/7955afaf9b7181a0383f4fbb.webp',note:'สูตรหลอมและวัตถุดิบ'},
 guild:{art:'/Soulbeast/assets/ui/guild-menu.webp',note:'สมาชิกกิลและคะแนนกิจกรรม'},
 camp:{art:'/Soulbeast/assets/media/8b78ec776d3bac46f1f1bbde.webp',note:'จัดทีมก่อนออกจู่โจม'},
 guide:{art:'/Soulbeast/assets/ui/handbook.webp',note:'วิธีเล่น อาชีพ อุปกรณ์ และสมุดอสูร'},
 replay:{art:'/Soulbeast/assets/media/00f53b8f7c9f2ca72cd3aa25.webp',note:'รับชมคลิปเนื้อเรื่องที่ปลดล็อก'},
 story:{art:'/Soulbeast/assets/media/00f53b8f7c9f2ca72cd3aa25.webp',note:'เรื่องราวและบันทึกแห่งผนึก'},
 gacha:{art:'/Soulbeast/assets/ui/gachapon-square-v2.webp',note:'กาชาปองแห่งพันผนึก'},
 coupon:{art:'/Soulbeast/assets/shop/coupon-shop-entry-square.png.webp',note:'ไอเทมพิเศษสำหรับผู้ผนึก'}
};
function decorate(button,id,label){const item=catalog[id];if(!item){button.textContent=label;return button}button.classList.add('service-art-choice');button.dataset.serviceArt=id;button.setAttribute('aria-label',label);const art=document.createElement('img');art.src=item.art;art.alt='';art.decoding='async';art.draggable=false;art.style.objectPosition=item.position||'center 38%';art.addEventListener('error',()=>{art.hidden=true},{once:true});const copy=document.createElement('span'),name=document.createElement('strong'),note=document.createElement('small'),arrow=document.createElement('span');copy.className='service-art-copy';name.textContent=label;note.textContent=item.note;arrow.className='service-art-arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');copy.append(name,note);button.replaceChildren(art,copy,arrow);return button}
g.WalkServiceArt={catalog,decorate};
})(window);
