/* First-created characters learn with the real allocation handlers, after the intro. */
const statLessonActive=()=>S.P?.walkStatTutorial==='pending';
const lessonHero=vHero;
vHero=function(){const html=lessonHero();if(!statLessonActive()&&!S.ui.walkStatLessonComplete)return html;
 const primary=allocationPlan(null).primary;
 const panel=S.ui.walkStatLessonComplete?'<h2>อัปค่าสถานะสำเร็จแล้ว!</h2><p>พลังของผู้ผนึกเพิ่มขึ้นแล้ว ทุกครั้งที่เลเวลอัปจะได้แต้มเพิ่ม กลับมาเพิ่มค่าสถานะได้ที่เมนู “ตัวละคร” ด้านล่างเสมอ</p><button class="btn pri full" data-a="walkStatLessonFinish">พร้อมแล้ว · ไปเดินในเมือง</button>':'<h2>ก้าวแรกของผู้ผนึก · อัปค่าสถานะ</h2><p>ก่อนออกผจญภัย คุณมีแต้มคงเหลือ <b>'+Math.max(0,S.P.free||0)+' แต้ม</b> ใช้เพิ่มความแข็งแกร่งให้เหมาะกับอาชีพได้</p><p>ลองเพิ่ม <b>'+esc(LBL[primary])+'</b> ซึ่งเป็นค่าสำคัญของ'+esc(CLS[S.P.cls].n)+' ด้วยปุ่มด้านล่าง ใช้ 1 แต้มจริงจากแต้มที่มี</p><button class="btn pri full" data-a="walkStatLessonAdd" '+(S.P.free>0?'':'disabled')+'>+ '+esc(LBL[primary])+' · ใช้ 1 แต้ม</button><p class="sub">ในตารางค่าสถานะ กดปุ่ม + ข้างค่านั้นเพื่อเพิ่มทีละแต้ม หรือใช้ “จัดสรรแต้ม” ให้ระบบเลือกตามอาชีพ</p><button class="btn full" data-a="walkStatLessonTable">ดูตารางค่าสถานะ</button>';
 return '<section class="card stack" id="walkStatLesson" role="region" aria-label="บทสอนอัปค่าสถานะ" style="border-color:#e5bd66;box-shadow:0 0 18px #d3a24433">'+panel+'</section>'+html;
};
function finishStatLessonIfSpent(before){if(!statLessonActive()||!(S.P.free<before))return;S.P.walkStatTutorial='done';S.ui.walkStatLessonComplete=true;save();render();document.querySelector('main')?.scrollTo(0,0)}
const lessonPoint=handlers.pt;handlers.pt=function(...args){const before=S.P.free,r=lessonPoint.apply(this,args);finishStatLessonIfSpent(before);return r};
const lessonAuto=autoStats;autoStats=function(uid,...args){const before=S.P.free,r=lessonAuto.call(this,uid,...args);if(uid==='P')finishStatLessonIfSpent(before);return r};
handlers.walkStatLessonAdd=()=>handlers.pt(allocationPlan(null).primary);
handlers.walkStatLessonTable=()=>{S.ui.hero='stat';render();const panel=document.querySelector('[data-panel-art="stats"]');panel?.scrollIntoView({block:'start',behavior:'smooth'});if(panel){panel.style.outline='2px solid #e5bd66';panel.style.outlineOffset='3px'}};
handlers.walkStatLessonFinish=()=>{S.ui.walkStatLessonComplete=false;save();parent.postMessage({type:'town-return'},location.origin)};
if(statLessonActive()&&S.screen==='hero'){S.ui.hero='stat';if(!(S.P.free>0)){S.P.walkStatTutorial='done';S.ui.walkStatLessonComplete=true;save()}render()}
