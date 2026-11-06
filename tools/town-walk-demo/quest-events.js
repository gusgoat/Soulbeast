(function(g){'use strict';
// Presentation only. Quest progress and rewards remain owned by WalkQuestEngine.
const root='/Soulbeast/',frames={shop:0,guild:1,hall:2,camp:3,hospital:4,tower:5,forge:6,library:1};
const countries={blue:'เหมันตคีรี',green:'พนาสมุทร',red:'อัคนีบรรพต'},forests={7:'ป่าฝึกหัด',1:'ป่าแสงจันทร์',2:'หุบเขาหมอกเซียน',3:'ทะเลทรายสุสานทอง',4:'ยอดเขามังกรหลับ',5:'แดนสวรรค์ล่มสลาย',6:'ปราสาทจอมมาร',8:'ป่าทมิฬพันธนาการ'};
const art={coin:root+'assets/ui/unit-frames/coin.svg',chest:root+'assets/country-walk/temperate-chest.png.webp',hero:root+'assets/ui/handbook.webp',map:root+'assets/ui/country-war-map-v1.png.webp',rescue:root+'assets/world-quests/rescue-v1.png.webp',gem:root+'assets/world-quests/gem-v1.png.webp'};
let pending=[];
const data=()=>g.WorldQuestData,engine=()=>g.WalkQuestEngine;
function portrait(place,npc){const cast=data()?.cast?.find(n=>n.place===place&&n.id===npc);return cast?.portrait||(frames[npc]!=null?root+'assets/ui/npc-busts-20261103/service-'+frames[npc]+'-bust-v1.png.webp':art.map)}
function placeName(id){return data()?.placeNames?.[id]||data()?.waypoints?.[id]?.name||g.townProfiles?.profiles?.[id]?.name||id||''}
function destination(p,q,o){
 if(!o)return {label:'กลับรายงานผู้มอบหมาย',place:placeName(q.place),name:data()?.npcs?.[q.place]?.[q.npc]||q.npc,art:portrait(q.place,q.npc)};
 const services={guide:'library',guild:'guild',world:'hall',camp:'camp',arena:'tower',hospital:'hospital',shop:'shop',forge:'forge'},npc=o.type==='talk'?o.target:services[o.target]||({heal:'hospital',craft:'forge',buySeal:'shop'})[o.type];
 const country=engine().objectiveCountry(q,o),place=o.place?placeName(o.place):o.zone?(forests[o.zone]+' · '+countries[country]):country?'แผนที่ประเทศ'+countries[country]:o.type==='dungeonBoss'?'มหาวงกต · ประเทศอัคนีบรรพต':'';
 return {label:o.label,place,name:npc?data()?.npcs?.[o.place]?.[npc]||'':'',art:npc?portrait(o.place,npc):o.type==='chest'?art.chest:art.map};
}
function snapshot(p,quests){const s=engine().state(p);return Object.fromEntries(quests.map(q=>{const a=s.accepted[q.id];return [q.id,a?{step:a.step,count:a.count}:null]}))}
function rewardArt(r){return g.QuestRewardArt?.[r.id]?.art||(r.kind==='beast'?root+'assets/companions/'+r.id+'.webp':art.chest)}
function model(p,q,phase,extra={}){
 const E=engine(),s=E.state(p),a=s.accepted[q.id],out=s.outcomes?.[q.id],choice=q.choices?.find(c=>c.id===((phase==='offered'?extra.choiceId:null)||a?.choice||out?.choice)),route=choice?.steps||q.steps;
 const index=extra.objectiveStep??Math.max(0,(a?.step||0)-1),o=route[index],done=phase==='completed',accepted=phase==='accepted',progress=phase==='progress',discovered=phase==='discovered',offered=phase==='offered';
 const visual=(offered?choice?.visuals?.offer||q.visuals?.offer:accepted?choice?.visuals?.accept||q.visuals?.accept:done?choice?.visuals?.complete||q.visuals?.complete:discovered?(o?.visual?.discover||{art:o?.visual?.art}):progress?(o?.visual?.progress||{}):(o?.visual?.complete||o?.visual))||{};
 const owner=data()?.npcs?.[q.place]?.[q.npc]||q.npc;
 const speaker=o?.type==='talk'&&!done&&!accepted&&!offered?data()?.npcs?.[o.place]?.[o.target]||owner:owner;
 let heading=offered?'เรื่องราวภารกิจ':discovered?'พบเหตุการณ์ระหว่างทาง':accepted?'รับภารกิจแล้ว':done?'รายงานสำเร็จแล้ว':progress?'บันทึกความคืบหน้า':'สำเร็จขั้นตอนนี้แล้ว';
 let quote=accepted?'“รับงานแล้ว เมื่อทำตามเป้าหมายครบ กลับมาหาข้าอีกครั้ง”':done?'“ข้ารับรายงานและมอบรางวัลให้เจ้าแล้ว”':o?.type==='talk'?'“ข้าได้รับเรื่องแล้ว บันทึกขั้นตอนนี้ไว้เรียบร้อย”':o?.type==='forestSearch'?'“พบเบาะแสแล้ว เก็บหลักฐานไว้ในบันทึกภารกิจ”':'บันทึกผลงานลงในภารกิจแล้ว';
 let result=accepted?(choice?'เลือก: '+choice.label:'เริ่มภารกิจ '+q.title):done?'รับรางวัลเข้าตัวละครแล้ว':o?.label||q.title;
 let next=done?{label:'ภารกิจสำเร็จ',place:'ดูภารกิจถัดไปที่ป้ายเควสหรือผู้มอบหมาย',art:portrait(q.place,q.npc)}:destination(p,q,route[a?.step||0]);
 const certified=q.promotion&&!done&&!accepted&&o?.type==='talk'&&o.target==='forge'&&!progress;
 if(certified){heading='ได้รับคำรับรองจากช่างหลอมแล้ว';quote='“ข้าขอรับรองว่าเจ้าผ่านบททดสอบ จงนำคำรับรองกลับไปรายงาน”';result='รับคำรับรองแล้ว';next.label='กลับไปรายงานผลและรับรางวัล';}
 if(q.promotion&&done){heading='ผ่านบททดสอบเลื่อนอาชีพแล้ว';quote='“เจ้าได้รับการรับรองแล้ว จงเลือกเส้นทางอาชีพขั้นต่อไป”';next={label:'เปิดเมนูตัวละคร → เลื่อนอาชีพได้แล้ว! → เลือกอาชีพ → ยืนยัน',place:'เลือกแล้วเปลี่ยนกลับไม่ได้',art:art.hero};}
 if(o?.target==='lost-person'&&!done&&!accepted){quote='“ขอบคุณที่ช่วยพาข้ากลับจุดพักปลอดภัย”';result='ช่วยผู้หลงทางแล้ว';}
 if(o?.target==='moon-gem'&&!done&&!accepted){quote='พบอัญมณีที่ตรงกับหลักฐานในภารกิจ';result='เก็บอัญมณีเพื่อส่งคืนแล้ว';}
 const special=!done&&!accepted&&(o?.target==='lost-person'?art.rescue:o?.target==='moon-gem'?art.gem:null);
 const scene={src:visual.art||special||q.art,crop:visual.crop,fit:visual.fit,columns:visual.columns||3,rows:visual.rows||2,grid:visual.grid??(!visual.art&&!special&&!!q.sceneCaptions),frame:visual.frame??(accepted?0:done?2:Math.min(2,index)),row:visual.row??q.sceneRow??0,alt:visual.alt||q.title};
 const realEvent=extra.event,actualArt=o?.type==='captureRare'?g.QuestBeastArt?.[realEvent?.beastSp]:o?.type==='craft'?g.QuestActionArt?.[realEvent?.gearId]:null;if(phase==='step'&&actualArt){scene.src=actualArt;scene.grid=false;scene.crop=null;scene.fit='contain';scene.alt=realEvent.beastName||realEvent.gearName||o.label;}
 const rewards=done?[{id:'gold',name:'เหรียญ',qty:out?.gold??choice?.gold??q.gold,art:art.coin},...E.rewardList(q).map(r=>({...r,art:rewardArt(r)}))]:[];
 if(discovered){quote=o?.target==='lost-person'?'มีผู้หลงทางบาดเจ็บอยู่ริมทาง เขาต้องการความช่วยเหลือ':o?.target==='moon-gem'?'มีแสงจากอัญมณีใต้รากไม้ ตรวจให้ตรงกับของที่เจ้าของตามหา':'พบร่องรอยที่เกี่ยวข้องกับภารกิจ ตรวจสอบเพื่อบันทึกหลักฐาน';result='พบเหตุการณ์แล้ว · ยังไม่ได้บันทึกผลงาน';}
 if(offered){quote='อ่านเป้าหมายและเงื่อนไขก่อนรับภารกิจ';result='รายละเอียดก่อนรับภารกิจ';}if(progress){quote='ผลงานครั้งนี้ถูกบันทึกแล้ว ทำต่อให้ครบเป้าหมาย';}
 result=visual.result||result;if(phase==='step'&&actualArt)result=(o.type==='captureRare'?'ผนึก ':'หลอม ')+(realEvent.beastName||realEvent.gearName)+' สำเร็จแล้ว';
 if(accepted&&choice?.cost>0)result+=' · จ่าย '+choice.cost+' เหรียญแล้ว';
 return {key:q.id,questId:q.id,phase,heading,title:q.title,choice:choice?.label||'',scene,speaker:visual.speaker||speaker,portrait:visual.portrait||(o?.type==='talk'&&!done&&!accepted&&!offered?portrait(o.place,o.target):portrait(q.place,q.npc)),quote:visual.quote||quote,result,next:{...next,...visual.next},rewards,count:progress?{value:a?.count||0,total:o?.count||1}:null};
}
function changes(p,quests,before,event){const s=engine().state(p);return quests.flatMap(q=>{const b=before[q.id],a=s.accepted[q.id];if(!b||!a||a.step===b.step&&a.count===b.count)return [];return [model(p,q,a.step>b.step?'step':'progress',{objectiveStep:b.step,event})]})}
function node(tag,text,cls){const n=g.document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
function image(src,alt,cls){const im=node('img',null,cls);im.src=src;im.alt=alt||'';im.decoding='async';im.loading='lazy';im.addEventListener('error',()=>{if(im.src.endsWith('/country-war-map-v1.png.webp'))return;im.src=art.map;im.classList.add('quest-event-fallback')},{once:true});return im}
function render(m){
 const card=node('article',null,'quest-event');card.dataset.questEvent=m.phase;card.setAttribute('aria-label',m.heading+' · '+m.title);
 card.append(node('small',m.choice?m.title+' · '+m.choice:m.title,'quest-event-kicker'),node('h3',m.heading));
 const figure=node('figure',null,'quest-event-scene');figure.append(image(m.scene.src,m.scene.alt));if(m.scene.fit)figure.firstChild.style.objectFit=m.scene.fit;if(m.scene.crop){const c=m.scene.crop;figure.classList.add('quest-event-grid');figure.style.aspectRatio=c.width+'/'+c.height;figure.firstChild.style.width=c.sourceWidth/c.width*100+'%';figure.firstChild.style.height=c.sourceHeight/c.height*100+'%';figure.firstChild.style.left=-c.x/c.width*100+'%';figure.firstChild.style.top=-c.y/c.height*100+'%';}else if(m.scene.grid){figure.classList.add('quest-event-grid');figure.firstChild.style.width=(m.scene.columns||3)*100+'%';figure.firstChild.style.height=(m.scene.rows||2)*100+'%';figure.firstChild.style.left=(-m.scene.frame*100)+'%';figure.firstChild.style.top=(-m.scene.row*100)+'%';}card.append(figure);
 const speech=node('div',null,'quest-event-speech'),copy=node('div');copy.append(node('b',m.speaker),node('p',m.quote));speech.append(image(m.portrait,m.speaker),copy);card.append(speech);
 card.append(node('p',(['discovered','offered'].includes(m.phase)?'◇ ':'✓ ')+m.result,'quest-event-result'));
 if(m.count){const meter=node('progress');meter.max=m.count.total;meter.value=m.count.value;meter.setAttribute('aria-label',m.count.value+' / '+m.count.total);card.append(meter,node('small',m.count.value+' / '+m.count.total));}
 if(m.rewards?.length){const rewards=node('ul',null,'quest-event-rewards');rewards.setAttribute('aria-label','รางวัลที่ได้รับ');for(const r of m.rewards){const li=node('li');li.append(image(r.art,r.name),node('span',r.name+' ×'+r.qty));rewards.append(li)}card.append(rewards)}
 const next=node('div',null,'quest-event-next'),copyNext=node('div');copyNext.append(node('small',m.phase==='completed'?'หลังจบภารกิจ':'เป้าหมายถัดไป'),node('b',m.next.label),node('span',[m.next.name,m.next.place].filter(Boolean).join(' · ')));next.append(image(m.next.art,m.next.name||m.next.place),copyNext);card.append(next);return card;
}
function present(body,models){if(!body||!models?.length)return;const section=node('section',null,'quest-event-stack');section.setAttribute('aria-label','ผลเหตุการณ์ภารกิจ');for(const m of models)section.append(render(m));body.prepend(section);return section}
function flush(body){const models=pending;pending=[];g.document?.getElementById('questEventTray')?.remove();present(body,models);return models}
function push(models,{tray=true}={}){for(const m of models||[]){pending=pending.filter(x=>x.key!==m.key);pending.push(m)}if(tray)drawTray();return models}
function drawTray(){
 if(!g.document?.body||!pending.length)return;g.document.getElementById('questEventTray')?.remove();
 const tray=node('aside',null,'quest-event-tray');tray.id='questEventTray';tray.setAttribute('aria-live','polite');tray.setAttribute('role','status');const open=node('button',null,'quest-event-open'),last=pending[pending.length-1];open.type='button';open.setAttribute('aria-label','ดูผลเหตุการณ์ภารกิจ '+pending.length+' รายการ');open.append(image(last.scene.src,''),node('span',last.heading+' · ดูเหตุการณ์ '+pending.length+' รายการ'));open.onclick=()=>{
  const dialog=node('dialog',null,'quest-event-dialog'),header=node('header'),title=node('h2','ผลการผจญภัย'),close=node('button','กลับไปเล่นต่อ'),body=node('div');close.type='button';close.onclick=()=>dialog.close();header.append(title,close);dialog.append(header,body);g.document.body.append(dialog);flush(body);dialog.addEventListener('close',()=>{dialog.remove();g.document.getElementById('interact')?.focus?.()},{once:true});dialog.showModal();close.focus?.();
 };tray.append(open);g.document.body.append(tray);
}
function loot(result){return {key:'loot',phase:'loot',heading:'ได้รับสมบัติแล้ว',title:'หีบสมบัติโจรป่า',scene:{src:art.chest,alt:'หีบสมบัติ'},portrait:art.chest,speaker:'สมบัติที่ค้นพบ',quote:'เก็บของรางวัลเข้ากระเป๋าแล้ว',result:'เปิดหีบสำเร็จ',next:{label:'เดินทางต่อ',place:'ดูเป้าหมายถัดไปในเมนูเควส',art:art.map},rewards:[...(result.gold?[{id:'gold',name:'เหรียญ',qty:result.gold,art:art.coin}]:[]),{id:result.id,name:result.name,qty:result.qty,art:rewardArt(result)}]}}
const api={art,portrait,destination,snapshot,model,changes,render,present,push,flush,loot,pending:()=>pending.slice()};g.WalkQuestEvents=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
