(function(g){'use strict';
// Extend the authored pilots using the original story, route and exact objective context.
const D=g.WorldQuestData,P=g.PilotQuestVisuals;if(!D||!P)throw Error('Load catalog and pilot visuals before the expansion');
const R='/Soulbeast/',atlas=R+'assets/world-quests/expansion/quest-events-v1.webp',pilot=P.atlas,ids=[],coverage=[];
const countries={blue:'เหมันตคีรี',green:'พนาสมุทร',red:'อัคนีบรรพต'},zones={7:'ป่าฝึกหัด',1:'ป่าแสงจันทร์',2:'หุบเขาหมอกเซียน',3:'ทะเลทรายสุสานทอง',4:'ยอดเขามังกรหลับ',5:'แดนสวรรค์ล่มสลาย',6:'ปราสาทจอมมาร',8:'ป่าทมิฬพันธนาการ'};
for(const n of D.cast.filter(n=>n.road))D.placeNames[n.place]||='จุดพักนอกเมือง · '+countries[n.country]+' · '+n.name;
const serviceFrames={shop:0,guild:1,hall:2,camp:3,hospital:4,tower:5,forge:6,library:1};
const roles=new Set(['soldier','captain','villager','hunter','exbandit','exspy','mage','assassin','merchant','musician','keeper','beastelder','collector','angelelder']);
const name=(place,npc)=>D.npcs[place]?.[npc]||npc,place=id=>D.placeNames?.[id]||D.waypoints?.[id]?.name||id;
const title=q=>q.title.split(' — ')[0].split(' · ')[0];
const portrait=(at,npc)=>D.cast.find(n=>n.place===at&&n.id===npc)?.portrait||(serviceFrames[npc]!=null?R+'assets/ui/npc-busts-20261103/service-'+serviceFrames[npc]+'-bust-v1.png.webp':R+'assets/ui/country-war-map-v1.png.webp');
const scene=(index,alt)=>({art:atlas,crop:{x:index%3*362+2,y:Math.floor(index/3)*362+2,width:358,height:358,sourceWidth:1086,sourceHeight:1448},alt});
const pilotCuts=[[0,322,644,1086],[0,339,717,1086],[0,339,717,1086],[0,339,717,1086]];
const oldScene=(index,alt)=>{const row=Math.floor(index/3),col=index%3,x=pilotCuts[row][col];return {art:pilot,crop:{x,y:row*362,width:pilotCuts[row][col+1]-x,height:362,sourceWidth:1086,sourceHeight:1448},alt}};
const storyScene=(q,frame,alt)=>({art:q.art,grid:!!q.sceneCaptions,frame,row:q.sceneRow||0,alt:alt||'ภาพประกอบเรื่อง '+title(q)});
const speakerVisual=(at,npc,alt)=>({art:portrait(at,npc),fit:'contain',alt,speaker:name(at,npc),portrait:portrait(at,npc)});
const narrator={speaker:'บันทึกการเดินทาง'};
function family(q){return q.choices?.map(c=>c.id).join('|')||''}
function storyBeat(q){return q.story.match(/เล่าว่า “([^”]+)”/)?.[1]||null}
function context(q){
 const beat=storyBeat(q);if(beat)return name(q.place,q.npc)+' ขอให้ตรวจเรื่อง “'+title(q)+'” — '+beat;
 const f=family(q);if(f==='expose|deliver')return 'คาราวานสองคันถูกปล้น แต่หลักฐานอาจเปิดเผยการกักตุนยา เลือกเปิดโปงบัญชีหรือคุ้มกันเสบียงตามสัญญา';
 if(f==='care|trace')return 'อสูรเลี้ยงไม่ยอมกลับบ้าน เพราะอาจมีคนเจ็บรออยู่ เลือกซื้อยาไปช่วย หรือสืบเจ้าของเดิมผ่านทูตต่างแดน';
 const key=q.id.split(':').pop(),o=q.steps[0],owner=name(q.place,q.npc);
 const briefs={guide:'เรียนรู้วิธีเล่นจากคู่มือที่ห้องสมุด แล้วกลับมาแจ้งผู้แนะนำ',guild:'เปิดข้อมูลกิลและสงครามกิลก่อนตัดสินใจร่วมกิจกรรม แล้วกลับมาแจ้งผู้แนะนำ',world:'เข้าปาร์ตี้บอสโลกและจบรอบที่มีคะแนนโดยไม่ถอนตัว เพื่อบันทึกผลงานกลับมารายงาน',camp:'ร่วมการจู่โจมค่ายและนำผลกลับมารายงานผู้มอบหมาย',heal:'ใช้บริการโรงพยาบาลให้การรักษาสำเร็จ แล้วนำข่าวกลับมาแจ้งผู้แนะนำ',tower:'เข้าท้าทายหอคอยประลองเพื่อบันทึกการเข้าร่วม ไม่ต้องพิชิตหอคอยทั้งหมด',forge:'หลอมอุปกรณ์ชนิดใดก็ได้สำเร็จหนึ่งชิ้น แล้วกลับมาแจ้งผู้มอบหมาย',seal:'ซื้อผนึกจากร้านค้าให้สำเร็จ แล้วกลับมารายงานก่อนนำไปจับอสูร',conquest:'เดินทางไปยึดหมู่บ้านต่างประเทศตามเส้นทางสงครามที่เปิดถึง แล้วนำผลกลับมารายงาน',defend:'เดินทางไปชุมชนฝ่ายตนและลงทะเบียนป้องกัน งานนี้ตรวจการลงทะเบียน ไม่ใช่ชัยชนะการรบ',rare:'ผนึกอสูรหายากในป่าโดยไม่ทำให้หมดสติ แล้วนำบันทึกการพบกลับมา',bandit:'โจรขวางเส้นทางเกวียน จัดการกลุ่มโจรให้ครบตามจำนวนและประเทศที่ระบุ',local:'เงาอสูรคุกคามทางเข้าเมือง ชนะกลุ่มที่อยู่ในเขตใกล้เมืองนี้ตามจำนวนที่ระบุ',escort:'คาราวานยาถูกขวาง พบหมอที่หมู่บ้านปลายทางก่อน แล้วจัดการโจรในเขตนั้น',chain:'มีการปลอมตราจดหมาย ตามข่าวจากผู้ใหญ่บ้าน ค้นหีบ ถามทูตต่างแดน แล้วส่งตราถึงที่ว่าการเมืองหลวง',watch:'ยามพบเงาอสูรใกล้หมู่บ้าน จัดการกลุ่มที่อยู่ในเขตหมู่บ้านนี้เพื่อให้ชาวบ้านเดินทางต่อ',supplies:'พ่อค้าพบรายการยาที่ตกข้างเกวียน นำจดหมายไปให้หมอประจำหมู่บ้านแล้วกลับมาแจ้งข่าว',dungeon25:'ไปมหาวงกตในอัคนีบรรพตและปราบเวนดิโกหิวโหยชั้นที่ 1 งานนี้ไม่ต้องผ่านทั้งเจ็ดชั้น'};
 if(briefs[key])return briefs[key]+' · ผู้มอบหมาย '+owner;
 if(key.startsWith('forest')||key==='boss')return 'เดินทางไป '+zones[o.zone]+' ผ่านบอสของพื้นที่ แล้วนำบันทึกกลับมาให้ '+owner;
 if(key.startsWith('envoy-'))return 'ส่งสารสันติถึงทูตนอกเมืองบนแผนที่ประเทศ '+countries[key.slice(6)]+' ไม่ต้องยึดเมืองเพื่อพบผู้รับ แล้วกลับมาแจ้ง '+owner;
 return 'งาน “'+title(q)+'” จาก '+owner+' · '+o.label;
}
function routeSummary(route){return route.map(o=>o.label+(o.count?' ×'+o.count:'')).join(' → ')}
function endpoint(q,c){
 const f=family(q),id=c?.id;
 if(f==='expose|deliver')return {...scene(id==='expose'?2:3,id==='expose'?'เปิดโปงบัญชียาและคืนยาให้ชุมชน':'คาราวานส่งเสบียงถึงเมืองโดยรักษาสัญญา'),quote:c.ending,result:id==='expose'?'เปิดโปงบัญชีกักตุนยา · '+title(q):'ส่งเสบียงตามสัญญา · '+title(q)};
 if(f==='care|trace')return {...scene(id==='care'?0:1,id==='care'?'ผู้ดูแลที่บาดเจ็บได้รับการช่วยเหลือพร้อมอสูรเลี้ยง':'เด็กและเจ้าของเดิมตกลงดูแลอสูรร่วมกัน'),quote:c.ending,result:id==='care'?'ช่วยผู้ดูแลและอสูรเลี้ยงแล้ว':'ตรวจปลอกคอและตกลงดูแลอสูรร่วมกันแล้ว'};
 if(f==='protect|verify')return {...scene(id==='protect'?4:5,id==='protect'?'พยานได้รับความคุ้มครองและกล้าให้ข้อมูล':'หมอและทูตตรวจทานหลักฐานก่อนลงความเห็น'),quote:c.ending.split('คุณกลับมาหา')[0],result:(id==='protect'?'คุ้มครองพยานในเรื่อง “':'ส่งหลักฐานตรวจสอบเรื่อง “')+title(q)+'” แล้ว'};
 if(q.cast)return {...storyScene(q,2),quote:'“ข้ารับหลักฐานเรื่อง '+title(q)+' แล้ว ข้อมูลที่เจ้ารวบรวมจะถูกบันทึกไว้กับคำให้การของข้า”',result:'ส่งหลักฐานให้ '+name(q.place,q.npc)+' · '+title(q)};
 const last=q.steps[q.steps.length-1],base=['craft','captureRare'].includes(last.type)?{art:portrait(q.place,q.npc),fit:'contain',alt:'ผู้มอบหมายรับบันทึกผลการ'+(last.type==='craft'?'หลอมอุปกรณ์':'ผนึกอสูรหายาก')}:actionArt(q,last,'complete');
 return {...base,speaker:name(q.place,q.npc),portrait:portrait(q.place,q.npc),quote:'“ข้ารับรายงานงาน '+title(q)+' แล้ว นี่คือรางวัลตามที่ตกลงกัน”',result:'รายงาน “'+title(q)+'” และรับรางวัลแล้ว'};
}
function actionArt(q,o,phase){
 if(o.type==='talk')return speakerVisual(o.place,o.target,'ผู้ให้ข้อมูล: '+name(o.place,o.target));
 if(o.type==='forestSearch'){
  if(o.target?.startsWith('npc-'))return storyScene(q,1,'ฉากประกอบการตามเบาะแสเรื่อง '+title(q));
  if(o.target==='lost-person')return {art:R+'assets/world-quests/rescue-v1.png.webp',alt:family(q)==='care|trace'?'พบผู้ดูแลอสูรที่บาดเจ็บในป่า':'พบผู้หลงทางที่ต้องการความช่วยเหลือ',...narrator};
  if(o.target==='moon-gem')return {art:R+'assets/world-quests/gem-v1.png.webp',alt:'ประกายอัญมณีใต้รากไม้',...narrator};
  throw Error('Unmapped search '+q.id+' '+o.target);
 }
 if(o.type==='chest')return oldScene(7,'ค้นหลักฐานในหีบ · '+title(q));
 if(o.type==='defeat')return o.kind==='shadow'?scene(6,'เงาอสูรบนเส้นทางสลายตัว'):oldScene(8,'หยุดโจรป่าที่ขัดขวางเส้นทาง');
 if(o.type==='boss')return {art:R+'assets/video/forest-story/zone-'+o.zone+'-'+(phase==='offer'?'before':'after')+'.webp',alt:(phase==='offer'?'เส้นทางสู่':'ผ่านบททดสอบใน')+zones[o.zone]};
 if(o.type==='dungeonBoss')return {art:q.art,alt:'มหาวงกตชั้นที่ 1 · เวนดิโกหิวโหย'};
 if(o.type==='visit')return o.target==='guide'?scene(7,'เรียนรู้ระบบผู้ผนึกจากคู่มือ'): {art:R+'assets/ui/guild-menu.webp',alt:'กิลและระบบสงครามกิล'};
 if(o.type==='heal')return speakerVisual(o.place||q.place,'hospital','รับการรักษาที่โรงพยาบาล');
 if(o.type==='craft')return scene(8,'ภาพตัวอย่างงานหลอมอุปกรณ์บนทั่ง');
 if(o.type==='buySeal')return {art:R+'assets/media/f1a44ab79c10c68d59fcaa05.webp',fit:'contain',alt:'ผนึกกระดาษจากร้านค้า'};
 if(o.type==='activity'){const assets={world:'assets/media/1620b9ca7d9052245fe7d7a1.webp',camp:'assets/media/8b78ec776d3bac46f1f1bbde.webp',arena:'assets/ui/martial-tower-v1.webp'};if(!assets[o.target])throw Error('Unknown activity '+o.target);return {art:R+assets[o.target],alt:o.label};}
 if(o.type==='captureRare')return scene(9,'ตัวอย่างการผนึกอสูรหายากโดยไม่ทำให้หมดสติ');
 if(o.type==='captureVillage')return scene(11,'เปลี่ยนธงหมู่บ้านหลังยึดพื้นที่สำเร็จ');
 if(o.type==='defend')return scene(10,'ลงทะเบียนผู้ป้องกันที่ประตูชุมชน');
 throw Error('Unmapped objective '+o.type+' '+q.id);
}
function dialogue(q,c,route,o,i,phase){
 const subject=title(q),owner=name(q.place,q.npc),next=i<route.length-1?'ทำขั้นถัดไปตามบันทึกก่อนกลับไปรายงาน':'กลับไปแจ้ง '+owner;
 if(phase==='progress')return {quote:'บันทึกผลงานในเรื่อง “'+subject+'” ครั้งนี้แล้ว ยังต้องทำให้ครบจำนวนในขั้นนี้',result:'เพิ่มความคืบหน้า · '+o.label};
 if(phase==='discover')return {quote:o.target?.startsWith('npc-')?'พบร่องรอยที่เกี่ยวข้องกับเรื่อง “'+subject+'” ตรวจสอบให้แน่ใจก่อนบันทึก':family(q)==='care|trace'?'อสูรเลี้ยงนำทางมาถึงผู้ดูแลที่บาดเจ็บ ตรวจร่องรอยตามภารกิจที่เลือก':'พบสิ่งที่ตรงกับคำบอกเล่าของ '+owner+' ตรวจสอบก่อนนำกลับไปส่ง',result:'พบเบาะแส · ยังไม่ได้บันทึกผลงาน'};
 if(o.type==='talk'){
  const prior=route.slice(0,i),hasEvidence=prior.some(s=>['chest','forestSearch','boss'].includes(s.type));
  const kind=o.target;
  const words=kind==='hospital'?(hasEvidence?'“ข้ารับรายละเอียดที่เจ้าพบในเรื่อง '+subject+' แล้ว จะเพิ่มข้อมูลจากบันทึกการรักษาให้ตรวจต่อ”':'“เรื่อง '+subject+' ต้องตรวจจากร่องรอยด้วย ตามจุดที่ระบุในบันทึกแล้วนำข้อมูลมาเทียบกัน”'):kind==='envoy'?'“ข้ารับข้อมูลเรื่อง '+subject+' เพื่อตรวจคำให้การข้ามประเทศแล้ว '+next+'”':kind==='library'?'“ข้าค้นบันทึกที่เกี่ยวกับ '+subject+' ให้แล้ว ใช้เทียบกับหลักฐานจากสถานที่จริงด้วย”':kind==='shop'?'“ข้ารับข่าวเรื่อง '+subject+' แล้ว ข้อมูลการซื้อขายที่เจ้าถามถูกเพิ่มไว้ในรายงาน”':'“ข้ารับข้อมูลเรื่อง '+subject+' แล้ว '+next+'”';
  return {quote:words,result:'รับคำตอบจาก '+name(o.place,kind)+' · '+subject};
 }
 const complete={
  forestSearch:['บันทึกเบาะแสเรื่อง “'+subject+'” ให้ '+owner+' แล้ว '+next,'ตรวจและบันทึกเบาะแส · '+subject],
  chest:['ค้นหลักฐานจากหีบครบตามจำนวนแล้ว '+next,'รวบรวมหลักฐาน '+(o.count||1)+'/'+(o.count||1)+' หีบ · '+subject],
  defeat:['เอาชนะ'+(o.kind==='shadow'?'เงาอสูร':'โจรป่า')+'ครบตามเงื่อนไขของเรื่อง “'+subject+'” แล้ว '+next,'จัดการศัตรู '+(o.count||1)+'/'+(o.count||1)+' กลุ่ม · '+subject],
  boss:['ผ่านบอส'+zones[o.zone]+' แล้ว '+next,'ผ่านบททดสอบ '+zones[o.zone]],
  dungeonBoss:['ผ่านผู้เฝ้าชั้นแรกของมหาวงกตแล้ว งานนี้ไม่ต้องฝ่าครบเจ็ดชั้น กลับไปรายงานผู้มอบหมาย','ผ่านมหาวงกตชั้นที่ 1 แล้ว'],
  visit:[o.target==='guide'?'เปิดคู่มือผู้ผนึกแล้ว กลับไปแจ้งผู้แนะนำเมื่อพร้อม':'เปิดข้อมูลกิลและสงครามกิลแล้ว กลับไปแจ้งผู้แนะนำ','บันทึกการเข้าดูข้อมูล · '+subject],
  heal:['รับการรักษาแล้ว ตรวจ HP/MP ของทีมก่อนเดินทาง และกลับไปรายงานงาน '+subject,'รับการรักษาสำเร็จ'],
  craft:['อุปกรณ์ที่หลอมสำเร็จถูกเก็บเข้ากระเป๋าแล้ว กลับไปแจ้งผู้มอบหมาย','หลอมอุปกรณ์สำเร็จ 1 ชิ้น'],
  buySeal:['ซื้อผนึกเข้ากระเป๋าแล้ว กลับไปแจ้งผู้มอบหมายก่อนนำไปใช้','ซื้อผนึกสำเร็จ'],
  captureRare:['ผนึกอสูรหายากสำเร็จแล้ว นำบันทึกการพบกลับไปให้ '+owner,'ผนึกอสูรหายากสำเร็จ 1 ตัว'],
  captureVillage:['ยึดหมู่บ้านสำเร็จแล้ว นำผลการปฏิบัติการกลับไปรายงาน','บันทึกการยึดหมู่บ้านสำเร็จ'],
  defend:['ลงทะเบียนป้องกันสำเร็จแล้ว นี่คือการรับหน้าที่ป้องกัน ยังไม่ใช่ผลชนะการรบ','ลงทะเบียนป้องกันชุมชนแล้ว'],
  activity:[o.target==='world'?'บันทึกผลการเข้าต่อสู้กับบอสโลกแล้ว นำผลงานกลับไปรายงาน':o.target==='arena'?'บันทึกการเข้าท้าทายหอคอยแล้ว ไม่จำเป็นต้องชนะหอคอยทั้งหมดเพื่อส่งงานนี้':'บันทึกผลการจู่โจมค่ายแล้ว นำผลงานกลับไปรายงาน','บันทึกกิจกรรม · '+subject]
 };
 if(!complete[o.type])throw Error('Missing dialogue '+o.type);return {quote:complete[o.type][0],result:complete[o.type][1]};
}
const branchNotes={
 expose:'จ่ายค่าผิดสัญญาเพื่อเปิดโปงบัญชียา แล้วส่งหลักฐานให้ทูต',deliver:'คุ้มกันเสบียงตามสัญญา ไม่ตัดสินคดีบัญชีโดยไม่มีหลักฐาน',
 care:'ซื้อยา ตามร่องรอยในป่า แล้วกลับไปให้หมอดูแลผู้บาดเจ็บ',trace:'ตรวจปลอกคอกับพ่อค้าและทูตต่างแดน ก่อนตามร่องรอยเจ้าของเดิม',
 protect:'ออกค่าใช้จ่ายคุ้มครองพยาน แล้วรวบรวมหลักฐานตามเส้นทาง',verify:'ให้หมอและทูตตรวจหลักฐานเพิ่มก่อนลงความเห็น โดยไม่จ่ายล่วงหน้า'
};
function offerArt(q,c){if(!c&&q.choices)return storyScene(q,0,'ฉากตั้งต้นของเรื่อง '+title(q));const f=family(q);if(f==='expose|deliver')return scene(c?.id==='deliver'?3:2,c?.id==='deliver'?'คาราวานส่งเสบียงตามสัญญา':'ตรวจบัญชียาที่อาจถูกปลอม');if(f==='care|trace')return scene(c?.id==='trace'?1:0,c?.id==='trace'?'ตรวจปลอกคอเพื่อสืบเจ้าของอสูร':'ซื้อยาและช่วยผู้ดูแลที่บาดเจ็บ');if(f==='protect|verify')return scene(c?.id==='verify'?5:4,c?.id==='verify'?'ตรวจทานหลักฐานกับหมอและทูต':'ออกค่าใช้จ่ายคุ้มครองพยาน');if(q.cast)return storyScene(q,0);return actionArt(q,q.steps[0],'offer')}
for(const q of D.quests){
 if(q.pilotVisuals)continue;if(q.cast&&!roles.has(q.castRole))throw Error('Unknown cast role '+q.castRole);
 const f=family(q);if(f&&!['expose|deliver','care|trace','protect|verify'].includes(f))throw Error('Unmapped branch family '+f);
 const owner=name(q.place,q.npc),intro=context(q);
 q.eventVisuals=true;q.visuals={offer:{...offerArt(q),speaker:owner,portrait:portrait(q.place,q.npc),quote:intro,result:'เรื่อง “'+title(q)+'” · '+place(q.place)},accept:{...offerArt(q),quote:'“ข้าฝากงาน '+title(q)+' ให้เจ้า เริ่มจาก '+q.steps[0].label+'”',result:'รับงานจาก '+owner},complete:endpoint(q,q.choices?.[0])};
 for(const c of q.choices||[]){const note=branchNotes[c.id];if(!note)throw Error('No branch note '+c.id);c.visuals={offer:{...offerArt(q,c),quote:c.description,result:c.cost?'ค่าใช้จ่ายเมื่อรับงาน: '+c.cost+' เหรียญ':'ไม่มีค่าใช้จ่ายเมื่อรับงาน'},accept:{...offerArt(q,c),quote:'“เส้นทาง '+c.label+' เริ่มที่ '+c.steps[0].label+'”',result:'เลือก '+c.label},complete:endpoint(q,c)};}
 // Include base steps as a read-only briefing route as well as all selectable routes.
 for(const {choice,steps}of [{choice:null,steps:q.steps},...(q.choices||[]).map(c=>({choice:c,steps:c.steps}))])for(const [i,o]of steps.entries()){
  o.visual={discover:{...actionArt(q,o,'discover'),...narrator,...dialogue(q,choice,steps,o,i,'discover')},progress:{...actionArt(q,o,'progress'),...narrator,...dialogue(q,choice,steps,o,i,'progress')},complete:{...actionArt(q,o,'complete'),...(o.type==='talk'?{}:narrator),...dialogue(q,choice,steps,o,i,'complete')}};
  if(o.type==='forestSearch')o.visual.discover.actionLabel=o.target?.startsWith('npc-')?'ตรวจเบาะแสให้ '+owner:family(q)==='care|trace'?'ตรวจร่องรอยและช่วยผู้ดูแลอสูร':'ตรวจและเก็บหลักฐานตามภารกิจ';
  if(f==='care|trace'&&(!choice||choice.id==='care')&&o.type==='talk'&&o.target==='hospital'&&i===steps.length-1)Object.assign(o.visual.complete,scene(0,'หมอดูแลผู้บาดเจ็บหลังได้รับความช่วยเหลือ'));
  if(o.type!=='talk'){o.visual.discover.portrait=q.portrait||portrait(q.place,q.npc);o.visual.progress.portrait=q.portrait||portrait(q.place,q.npc);o.visual.complete.portrait=q.portrait||portrait(q.place,q.npc);}
 }
 ids.push(q.id);coverage.push({id:q.id,family:f||q.castRole||'service/local',storyBeat:storyBeat(q),routes:q.choices?.length||1});
}
g.ExpandedQuestVisuals={ids,coverage,atlas};if(typeof module!=='undefined')module.exports=g.ExpandedQuestVisuals;
})(typeof window==='undefined'?globalThis:window);
