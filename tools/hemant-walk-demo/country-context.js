(()=>{'use strict';
const q=new URLSearchParams(location.search),inferred=(q.get('from')||'').split('-')[0],id=q.get('country')||inferred||'blue';
if(window.walkCountries[id])window.hemantMap=window.walkCountries[id];
const data=window.hemantMap;data.countryId||='blue';
window.walkForestPolicy.apply(data);
document.documentElement.dataset.country=data.countryId;window.WalkLoading.message('loading','กำลังเปิดเส้นทางสู่'+data.country+'…');
document.title='Soulbeast · ประเทศ'+data.country;
document.querySelector('.location h1').textContent=data.country;
document.querySelector('.location>span').textContent='✦ '+({blue:'HEMANTAKHIRI',green:'PHANASAMUT',red:'AKKHANIBANPHOT'}[data.countryId])+' ✦';
document.querySelector('.location p').textContent='เมืองหลวง 1 · เมืองรอง 4 · หมู่บ้าน 16 · ทางเข้าป่า '+data.forests.length+' · ประตูชายแดน 4';
document.querySelector('#townDialog>small').textContent='แผนที่ประเทศ'+data.country;
document.querySelector('#world').setAttribute('aria-label','แผนที่เดินทางประเทศ'+data.country);

document.querySelector('.joystick-wrap>small').textContent='ลากน้อยเดิน · ลากไกลวิ่ง · ปล่อยหยุด';
})();
