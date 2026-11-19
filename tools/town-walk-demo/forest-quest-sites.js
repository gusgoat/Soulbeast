(function(g){'use strict';
// Presentation only: eligibility always comes from the original quest engine.
const stories=[
 ['rescue',0,'ตามรอยคนหายในป่าฝึกหัด'],['rescue',1,'อัญมณีใต้แสงจันทร์'],['rescue',2,'เจ้าตัวเล็กที่ไม่ยอมกลับบ้าน'],
 ['rescue',3,'ระฆังที่ดังช้าไปหนึ่งครั้ง'],['rescue',4,'คำสั่งสุดท้ายของยาม'],['rescue',5,'ข้าวถุงสุดท้ายของบ้าน'],
 ['evidence',0,'จดหมายที่แม่ไม่ได้ส่ง'],['evidence',1,'รอยเท้าคู่ที่สาม'],['evidence',2,'กับดักที่จับคำโกหก'],
 ['evidence',3,'รหัสในเพลงกล่อมเด็ก'],['evidence',4,'ข่าวลวงสามฉบับ'],['evidence',5,'ชื่อที่ถูกลบจากหิน'],
 ['witness',0,'เสียงตอบจากอีกฟากผนึก'],['witness',1,'รายชื่อที่ไม่มีค่าหัว'],['witness',2,'ใบสั่งฆ่าคนที่ตายแล้ว'],
 ['witness',3,'ทำนองที่หายไปหนึ่งห้อง'],['witness',4,'คอนเสิร์ตของคนไร้ชื่อ'],['witness',5,'กระดิ่งที่ไม่ยอมเงียบ'],
 ['pact',0,'บ้านของผู้ที่เลือกเรา'],['pact',1,'คนแก่ที่ไม่มีเงา'],['pact',2,'สัญญาที่เขียนด้วยรอยกีบ'],
 ['pact',3,'ของปลอมที่จำเจ้าของได้'],['pact',4,'พิพิธภัณฑ์ของสิ่งที่ไม่ควรถูกขโมย'],['pact',5,'เหรียญที่ซื้อพรไม่ได้'],
 ['help',0,'บททดสอบของคนที่ไม่มีผู้เห็น']
];
const positions=[[-13,-31],[13,-31],[-25,-31],[25,-31],[-13,-18],[13,-18],[-25,-18],[25,-18],[-13,-5],[13,-5],[-27,-5],[27,-5],[-13,8],[13,8],[-30,8],[30,8],[-14,22],[0,22],[14,22],[-28,23],[28,23],[-14,36],[0,36],[14,36],[0,14]];
function describe(q){const i=stories.findIndex(s=>q.title.split(/ — | · /)[0]===s[2]);if(i<0)return null;const [atlas,cell,label]=stories[i];return {id:'city-quest-'+i,atlas,cell,label,position:positions[i].slice(),width:8.5};}
function available(p,quests,context){
 const groups=new Map();
 for(const e of g.WalkQuestEngine.searchObjectives(p,quests,context)){
  const d=describe(e.quest);if(!d)throw Error('Missing forest quest scenery: '+e.quest.id);
  if(!groups.has(d.id))groups.set(d.id,{...d,entries:[]});
  groups.get(d.id).entries.push({questId:e.questId,objectiveStep:e.objectiveStep});
 }
 return [...groups.values()];
}
g.ForestQuestSites={describe,available,stories,positions};if(typeof module!=='undefined')module.exports=g.ForestQuestSites;
})(typeof window==='undefined'?globalThis:window);
