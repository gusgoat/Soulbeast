const fs=require('fs'),b=require('./client-build.cjs').build(null,{write:false});
const setup=`<script>
const previewName=document.createElement('input');previewName.id='nm';previewName.value='ผู้ทดสอบเรื่องเล่า';previewName.hidden=true;document.body.appendChild(previewName);
handlers.newgame();previewName.remove();S.ui={introSeen:true};S.P.name='ผู้ทดสอบเรื่องเล่า';S.P.lv=30;S.P.gold=5000;S.P.items.pot=10;S.P.hp=pStats().hp;S.P.mp=pStats().mp;S.zone={id:1,depth:3,log:[]};S.screen='zone';WorldTales.run();
const demo=new URLSearchParams(location.search).get('demo');
if(demo==='ending'){WorldTales.record('secret:1',1,'Yggdrasil',0,'น้ำกลับถึงหมู่บ้าน แต่รังอสูรบางส่วนถูกทิ้งร้าง');WorldTales.record('quest:moon-3',1,'เส้นแบ่งบนแผนที่',1,'ชาวบ้านสร้างสะพานอ้อมรังอสูรเพื่อใช้เส้นทางร่วมกัน');S.P.cleared=1;S.ui.taleBook=true;S.screen='story';}
else if(demo==='followup'){WorldTales.record('secret:1',1,'Yggdrasil',0,'น้ำถึงหมู่บ้าน');WorldTales.state().aftermaths['secret:1'].heard=2;WorldTales.state().serial++;WorldTales.startAfter('secret:1',false);}
else if(demo==='rumor'){S.zone.taleSession={mode:'rumor',token:'preview',text:TALES_DATA.chatter[0],result:[]};}
else if(demo==='decision'){S.zone.taleSession={mode:'question',id:'moon-0',token:'preview',result:[]};WorldTales.state().quests['moon-0']={id:'moon-0',kind:'short',status:'active'};}
else if(demo==='puzzle'){const d=SECRET_DATA.locations.find(d=>d.zone===1);S.zone.secretSession={id:d.id,event:'puzzle',revision:0,puzzleAttempts:0};Secret.record(d.id);}
else if(demo==='special'){S.zone={id:4,depth:5,log:[]};WorldTales.run();S.zone.taleSession={mode:'special',id:'encounter-4',token:'preview',result:[]};}
else if(demo==='fork'){S.zone.fork=[{k:'villager',h:false},{k:'mist',h:true}];}
else{S.zone.taleSession={mode:'offer',id:'moon-0',token:'preview',result:[]};}render();
</script>`;
const guard='<script>Object.defineProperty(window,"localStorage",{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});window.fetch=()=>Promise.reject(Error("Isolated QA preview: network disabled"));</script>';
const banner='<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#b88b30;color:#111;text-align:center;font-size:12px">หน้าทดสอบเรื่องเล่า · ไม่บันทึกเซฟและไม่เชื่อมต่อบัญชีจริง</div>';
fs.writeFileSync('world-tales-preview.html',b.files['staging-index.html'].replace('<head>','<head>'+guard).replace('<body>','<body>'+banner).replace('</body>',setup+'</body>'));
console.log('Built isolated quest/rumor/choice/ending preview');
