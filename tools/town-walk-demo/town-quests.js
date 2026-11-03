(()=>{'use strict';
const profile=window.townProfiles?.get(new URLSearchParams(location.search).get('city'));
const tasks=profile?.village?[
 {id:'merchant',title:'เตรียมเสบียงที่ตลาด',text:'รับงานแล้วเปิดร้านค้าของ'+profile.name,targets:['shop']},
 {id:'healer',title:'พบหมอประจำหมู่บ้าน',text:'รับงานแล้วเปิดเมนูโรงพยาบาล'+profile.shortName,targets:['hospital']},
 {id:'hall',title:'รายงานตัวกับผู้ใหญ่บ้าน',text:'รับงานแล้วไปที่ว่าการ และเปิดเมนูกิจกรรมกับผู้ใหญ่บ้าน',targets:['countrywar','leader','pvp','world']}
]:[
 {id:'merchant',title:'เตรียมตัวก่อนออกเดินทาง',text:'รับงานแล้วไปคุยกับมีนา และเปิดเมนูร้านค้าประจำเมือง',targets:['shop']},
 {id:'healer',title:'ทำความรู้จักวิหารขาว',text:'รับงานแล้วไปพบผู้ดูแลวิหาร และเปิดเมนูโรงพยาบาล',targets:['hospital']},
 {id:'gate',title:'ข่าวจากประตูใต้',text:'รับงานแล้วไปคุยกับทหารเฝ้าประตูทางออกสู่ป่า',targets:['exit','wild']}
];
const accepted=new Set(),completed=new Set();
function visit(place){for(const q of tasks)if(accepted.has(q.id)&&q.targets.includes(place))completed.add(q.id)}
function show(logOnly=false){
 document.getElementById('dialogTitle').textContent=logOnly?'สมุดภารกิจ':profile?.village?profile.questboard:'ป้ายประกาศรับเควส';
 document.getElementById('dialogText').textContent=(profile?.village?'ภารกิจแนะนำสถานที่ในหมู่บ้าน':'ภารกิจแนะนำสถานที่ในเมือง')+' · ทดลองเฉพาะรอบนี้ ยังไม่เชื่อมรางวัลหรือเซฟจริง';
 const body=document.getElementById('dialogChoices');body.replaceChildren();
 const list=logOnly?tasks.filter(q=>accepted.has(q.id)):tasks;
 if(!list.length){const p=document.createElement('p');p.textContent='ยังไม่ได้รับงาน เดินไปที่ป้ายประกาศใกล้ลานกลางเมืองเพื่อรับเควส';body.append(p)}
 for(const q of list){const card=document.createElement('article');card.className='quest-entry';const title=document.createElement('b');title.textContent=q.title;const p=document.createElement('p');p.textContent=q.text;const b=document.createElement('button');b.textContent=completed.has(q.id)?'✓ สำเร็จแล้ว':accepted.has(q.id)?'รับงานแล้ว · กำลังดำเนินการ':'รับเควส';b.disabled=accepted.has(q.id);b.onclick=()=>{accepted.add(q.id);show(logOnly)};card.append(title,p,b);body.append(card)}
 const dialog=document.getElementById('townDialog');if(!dialog.open)dialog.showModal();
}
window.townQuests={show,visit,status:()=>({accepted:accepted.size,completed:completed.size})};
})();
