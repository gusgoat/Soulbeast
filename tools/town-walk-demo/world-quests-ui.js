(()=>{'use strict';
const key='soulbeast-walk-preview-player-v1',E=window.WalkQuestEngine,D=window.WorldQuestData,place=new URLSearchParams(location.search).get('city')||'blue-capital';
let cachedRaw=null,cachedPlayer=null;
function read(){try{const raw=sessionStorage.getItem(key);if(raw!==cachedRaw){cachedRaw=raw;cachedPlayer=JSON.parse(raw||'null')}return cachedPlayer}catch{return null}}
function write(p){sessionStorage.setItem(key,JSON.stringify(p));if(p.walkId)localStorage.setItem('soulbeast-walk-save:'+p.walkId,JSON.stringify(p));for(const id of ['hudTop','hudBottom'])document.getElementById(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin)}
function emit(type,extra={}){const p=read();if(!p)return false;const V=window.WalkQuestEvents,before=V?.snapshot(p,D.quests),event={type,place,country:E.countryOf(place)||p.country,id:crypto.randomUUID(),...extra};const changed=E.emit(p,D.quests,event);write(p);if(changed&&V)V.push(V.changes(p,D.quests,before,event),{tray:type!=='talk'});return changed}
let queryPlayer=null,activeQuests=[],trackedQuest=null,targetCache=new Map(),markerCache=new Map();
function queries(){
 const p=read();
 if(p!==queryPlayer){
  queryPlayer=p;
  const s=p&&E.state(p);
  activeQuests=s?D.quests.filter(q=>s.accepted[q.id]&&!s.completed[q.id]):[];
  trackedQuest=activeQuests.find(q=>E.isTracking(p,q));
  targetCache.clear();
  markerCache.clear();
 }
 return p;
}
function marker(npc,at=place){const p=queries();if(!p)return '';const key=at+'|'+npc;if(markerCache.has(key))return markerCache.get(key);let mark='';if(target({type:'npc',place:at,target:npc}))mark='X';else{const s=E.state(p),list=D.quests.filter(q=>q.place===at&&(npc==='questboard'?!q.cast:q.npc===npc));mark=list.some(q=>s.accepted[q.id]?.step>=E.steps(p,q).length)?'?':list.some(q=>E.available(p,q))?'!':''}markerCache.set(key,mark);return mark}
function targetStyle(probe){
 const p=queries();
 if(!p||!activeQuests.length)return '';
 const key=JSON.stringify(probe);
 if(!targetCache.has(key)){
  const tracked=trackedQuest&&E.isTarget(p,[trackedQuest],probe);
  targetCache.set(key,tracked?'tracked':E.isTarget(p,activeQuests,probe)?'active':'');
 }
 return targetCache.get(key);
}
function target(probe){return !!targetStyle(probe)}
function markerStyle(npc,at=place){return targetStyle({type:'npc',place:at,target:npc})}
function drawTarget(ctx,x,y,scale=1,style='active'){
 if(!style)return;
 const size=Math.max(.55,scale),r=10*size,tracked=style==='tracked';
 ctx.save();ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-r,y-r);ctx.lineTo(x+r,y+r);ctx.moveTo(x+r,y-r);ctx.lineTo(x-r,y+r);
 ctx.strokeStyle=tracked?'#432b10':'#fff5e6';ctx.lineWidth=7*size;ctx.stroke();
 ctx.strokeStyle=tracked?'#ffdb32':'#e32c3c';ctx.lineWidth=4*size;ctx.stroke();ctx.restore();
}
const questOrder=(a,b)=>Number(!!b.mainQuest)-Number(!!a.mainQuest)||(a.mainQuest&&b.mainQuest?(a.mainOrder||0)-(b.mainOrder||0):0);
function decorateQuest(card,q){if(!q.mainQuest)return;card.className+=' quest-main';card.append(node('span','✦ เควสหลัก · เนื้อเรื่อง'));card.children[card.children.length-1].className='quest-main-badge'}
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
function trackButton(p,q,refresh){
 const tracked=E.isTracking(p,q),button=node('button',tracked?'ยกเลิกติดตาม':'ติดตามเควส');
 button.type='button';
 button.className='quest-track';
 button.dataset.questTrack=q.id;
 button.setAttribute('aria-label','ติดตามเควส '+q.title);
 button.setAttribute('aria-pressed',String(tracked));
 button.onclick=()=>{
  const fresh=read();
  if(!fresh||!E.toggleTracking(fresh,q))return;
  write(fresh);
  const dialog=document.getElementById('townDialog'),scroll=dialog.scrollTop;
  refresh();
  const current=[...dialog.querySelectorAll('[data-quest-track]')].find(b=>b.dataset.questTrack===q.id);
  current?.focus({preventScroll:true});
  dialog.scrollTop=scroll;
 };
 return button;
}
const countries={blue:'เหมันตคีรี',green:'พนาสมุทร',red:'อัคนีบรรพต'},forests={7:'ป่าฝึกหัด',1:'ป่าแสงจันทร์',2:'หุบเขาหมอกเซียน',3:'ทะเลทรายสุสานทอง',4:'ยอดเขามังกรหลับ',5:'แดนสวรรค์ล่มสลาย',6:'ปราสาทจอมมาร',8:'ป่าทมิฬพันธนาการ'};
function placeName(id){return D.placeNames?.[id]||D.waypoints?.[id]?.name||window.townProfiles?.profiles?.[id]?.name||id}
function destination(o,p,q){if(o.type==='dungeonBoss')return 'มหาวงกตดันเจี้ยน · ชั้นที่ 1 · ทางเข้าในประเทศอัคนีบรรพต';if(o.place)return placeName(o.place)+(o.target&&D.npcs[o.place]?.[o.target]?' · '+D.npcs[o.place][o.target]:'');if(o.zone){const country=E.objectiveCountry(q,o);return forests[o.zone]+' · '+countries[country]}if(o.country)return 'แผนที่ประเทศ'+countries[o.country];if(o.type==='captureVillage')return 'หมู่บ้านต่างประเทศที่ผ่านเงื่อนไขโจมตี';if(o.type==='defend')return 'เมนูสงครามอาณาจักร · ลงทะเบียนป้องกันหมู่บ้านหรือเมือง';if(o.type==='captureRare')return 'ป่าที่พบอสูรหายาก';return o.label}
function expandStory(q){const d=node('dialog');d.className='quest-art-view';const close=node('button','ปิดภาพ'),frame=node('div'),im=node('img'),caption=node('p'),controls=node('div');frame.className='quest-panel-window';im.src=q.art;im.alt=q.title;im.style.top=q.sceneRow?'-100%':'0';frame.append(im);d.append(close,node('h3',q.title),frame,caption,controls);for(let i=0;i<3;i++){const b=node('button','เหตุการณ์ '+(i+1));b.onclick=()=>{im.style.left=(-i*100)+'%';caption.textContent=q.sceneCaptions[i]};controls.append(b)}im.style.left='0';caption.textContent=q.sceneCaptions[0];close.onclick=()=>d.close();d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal()}
function story(card,q){if((q.pilotVisuals||q.eventVisuals)&&window.WalkQuestEvents){const p=read(),st=p&&E.state(p);if(p){window.WalkQuestEvents.present(card,[window.WalkQuestEvents.model(p,q,st.completed[q.id]?'completed':st.accepted[q.id]?'accepted':'offered')]);if(q.eventVisuals){const lore=node('details');lore.append(node('summary','อ่านเรื่องราวเต็ม'),node('p',q.story));card.append(lore)}return}}if(q.portrait&&document.querySelector('.npc-dialog-speaker img')?.getAttribute('src')!==q.portrait){const portrait=node('img');portrait.className='quest-npc-portrait';portrait.src=q.portrait;portrait.alt=D.npcs[q.place][q.npc];portrait.loading='lazy';card.append(portrait)}const im=node('img');im.src=q.art;im.alt=q.sceneCaptions?.join(' → ')||q.title;im.loading='lazy';if(q.sceneCaptions){const window=node('div');window.className='quest-story-window';im.style.top=q.sceneRow?'-100%':'0';window.append(im);card.append(window);const captions=node('ol');captions.className='quest-story-captions';q.sceneCaptions.forEach(v=>captions.append(node('li',v)));card.append(captions);const zoom=node('button','ขยายภาพเหตุการณ์ทีละฉาก');zoom.className='quest-answer';zoom.onclick=()=>expandStory(q);card.append(zoom)}else{im.className='quest-scene';card.append(im)}card.append(node('p',q.story))}
function reward(card,q,gold){card.append(node('p','รางวัล: '+gold+' เหรียญ'+(E.rewardText(q)?' · '+E.rewardText(q):'')))}
function open(title,text){const dialog=document.getElementById('townDialog');window.NpcDialogue?.clear(dialog);dialog.classList.remove('places-list');if(!dialog.querySelector('.quest-close-bar')){const toolbar=node('div');toolbar.className='quest-close-bar';const close=node('button','×');close.type='button';close.className='quest-close';close.setAttribute('aria-label','ปิดเมนูเควส');close.onclick=()=>dialog.close();toolbar.append(close);dialog.prepend(toolbar)}document.getElementById('dialogTitle').textContent=title;document.getElementById('dialogText').textContent=text;const body=document.getElementById('dialogChoices');body.replaceChildren();return {dialog,body}}
function promotionNotice(body,q,certified=false){const V=window.WalkQuestEvents,p=read();if(V&&p)V.present(body,[V.model(p,q,certified?'step':'completed',{objectiveStep:E.steps(p,q).length-1})])}
function resultNotice(p,q,phase){const V=window.WalkQuestEvents;if(V){V.push([V.model(p,q,phase)],{tray:false});V.flush(document.getElementById('dialogChoices'))}}
function show(logOnly=false,npc='questboard',at=place){if(logOnly)return journal();const p=read();if(!p)return;const s=E.state(p),{dialog,body}=open(D.npcs[at]?.[npc]||'ภารกิจประจำพื้นที่','เลือกงานของผู้มอบหมาย · ทำตามลำดับ · กลับมารายงานที่ NPC คนเดิม');
window.NpcDialogue?.set(dialog,npc,at,D.npcs[at]?.[npc]);window.WalkQuestEvents?.flush(body);
const list=D.quests.filter(q=>q.place===at&&(npc==='questboard'?!q.cast:q.npc===npc)).sort(questOrder);if(!list.length)body.append(node('p','ยังไม่มีภารกิจให้รับ'));
for(const q of list){const a=s.accepted[q.id],done=s.completed[q.id],choice=q.choices?.find(c=>c.id===(a?.choice||s.outcomes?.[q.id]?.choice)),card=node('article');card.className='quest-entry';decorateQuest(card,q);card.append(node('h3',q.title+' · Lv '+q.level));if(a&&!done)card.append(trackButton(p,q,()=>show(false,npc,at)));story(card,q);if(done)card.append(node('p',s.outcomes?.[q.id]?.ending||q.ending));card.append(node('small','ผู้มอบหมาย: '+D.npcs[q.place][q.npc]+' · '+placeName(q.place)));reward(card,q,choice?.gold??q.gold);
const steps=node('ol');E.steps(p,q).forEach((o,i)=>steps.append(node('li',(done||a&&i<a.step?'✓ ':a&&i===a.step?'→ ':'')+o.label+(a&&i===a.step&&o.count?' '+a.count+'/'+o.count:''))));card.append(steps);
const button=node('button');button.className='quest-answer';if(done){button.textContent='รายงานสำเร็จแล้ว';button.disabled=true}else if(a?.step>=E.steps(p,q).length){button.textContent='รายงานผลและรับรางวัล';button.onclick=()=>{const fresh=read();if(E.claim(fresh,q,at,npc)){write(fresh);show(false,npc,at);resultNotice(fresh,q,'completed')}}}else if(a){button.textContent='กำลังดำเนินภารกิจ · ดูรายละเอียดในเมนูเควส';button.onclick=()=>journal(q.id)}else if(q.choices&&E.available(p,q)){button.hidden=true;for(const c of q.choices){const cb=node('button',c.label+' · จ่าย '+(c.cost||0)+' เหรียญ · ได้ '+c.gold+' เหรียญ พร้อมของรางวัลข้างต้น');cb.className='quest-answer';cb.disabled=(p.gold||0)<(c.cost||0);cb.onclick=()=>{const fresh=read();if(E.accept(fresh,q,c.id)){write(fresh);show(false,npc,at);resultNotice(fresh,q,'accepted')}};if((q.pilotVisuals||q.eventVisuals)&&window.WalkQuestEvents){const offer=window.WalkQuestEvents.render(window.WalkQuestEvents.model(p,q,'offered',{choiceId:c.id}));offer.classList.add('quest-event-choice');offer.append(cb);card.append(offer)}else card.append(cb,node('p',c.description))}}else{button.textContent=E.available(p,q)?'ข้าจะรับภารกิจนี้':E.blockedReason(p,q);button.disabled=!E.available(p,q);button.onclick=()=>{const fresh=read();if(E.accept(fresh,q)){write(fresh);show(false,npc,at);resultNotice(fresh,q,'accepted')}}}card.append(button);
if(!a&&!E.available(p,q)||done){const details=node('details');details.className=q.mainQuest?'quest-main-summary':'';details.append(node('summary',(q.mainQuest?'✦ เควสหลัก · ':'')+q.title+' · '+(done?'สำเร็จแล้ว':'Lv '+q.level)),card);body.append(details)}else body.append(card)}if(!dialog.open)dialog.showModal()}
function journal(selected,category){
 const p=read();if(!p)return;
 const s=E.state(p),all=D.quests.filter(q=>s.accepted[q.id]||s.completed[q.id]).sort(questOrder);
 const status=q=>s.completed[q.id]?'completed':s.accepted[q.id].step>=E.steps(p,q).length?'report':'active';
 const categories={active:'รายการเควสที่กำลังทำ',report:'รายการเควสที่รอรายงาน',completed:'รายการเควสที่ทำสำเร็จแล้ว'};
 const picked=all.find(q=>q.id===selected);
 if(picked&&!category)category=status(picked);
 const {dialog,body}=open('เควส','เลือกติดตามได้ครั้งละ 1 เควส · X สีเหลืองคือเป้าหมายที่ติดตาม · X สีแดงคือเป้าหมายเควสอื่น');
 const tracked=all.find(q=>E.isTracking(p,q));
 if(tracked){
  const banner=node('p','กำลังติดตาม: '+tracked.title);
  banner.className='quest-tracking-status';
  body.append(banner);
 }
 const list=all.filter(q=>status(q)===category),q=list.find(q=>q.id===selected);
 if(!category){
  for(const [id,title] of Object.entries(categories)){
   const button=node('button',title+' · '+all.filter(q=>status(q)===id).length);
   button.className='quest-answer';
   button.onclick=()=>journal(null,id);
   body.append(button);
  }
 }else if(!q){
  body.append(node('h3',categories[category]));
  const back=node('button','‹ กลับหมวดเควส');
  back.className='quest-answer';back.onclick=()=>journal();body.append(back);
  if(!list.length)body.append(node('p','ยังไม่มีเควสในหมวดนี้'));
  for(const quest of list){
   const row=node('div'),button=node('button',(quest.mainQuest?'✦ เควสหลัก · ':'')+quest.title);
   row.className='quest-log-row';
   button.className='quest-answer'+(quest.mainQuest?' quest-main-link':'');
   button.onclick=()=>journal(quest.id,category);
   row.append(button);
   if(category!=='completed')row.append(trackButton(p,quest,()=>journal(null,category)));
   body.append(row);
  }
 }else{
  const back=node('button','‹ กลับรายชื่อเควส');
  back.className='quest-answer';back.onclick=()=>journal(null,category);body.append(back);
  const a=s.accepted[q.id],outcome=s.outcomes?.[q.id],done=!!s.completed[q.id];
  const choice=q.choices?.find(c=>c.id===(a?.choice||outcome?.choice)),route=E.steps(p,q),current=a&&route[a.step];
  const card=node('article');card.className='quest-entry';decorateQuest(card,q);
  card.append(node('h3',q.title));
  if(!done)card.append(trackButton(p,q,()=>journal(q.id,category)));
  story(card,q);
  card.append(node('p','รับจาก: '+placeName(q.place)+' · '+D.npcs[q.place][q.npc]));
  if(choice)card.append(node('p','ทางเลือก: '+choice.label));
  card.append(node('h4','เป้าหมายถัดไป'),node('p',done?'ภารกิจสำเร็จแล้ว':current?current.label+(current.count?' ('+a.count+'/'+current.count+')':''):'กลับไปรายงานกับผู้มอบหมาย'),node('p','สถานที่ถัดไป: '+(done?'ไม่มี':current?destination(current,p,q):placeName(q.place)+' · '+D.npcs[q.place][q.npc])));
  const ol=node('ol');
  route.forEach((o,i)=>ol.append(node('li',(done||a&&i<a.step?'✓ ':a&&i===a.step?'→ ':'')+o.label+' — '+destination(o,p,q))));
  card.append(ol);reward(card,q,outcome?.gold??choice?.gold??q.gold);
  if(done)card.append(node('p',outcome?.ending||q.ending));
  body.append(card);
  if(done&&!q.pilotVisuals&&!q.eventVisuals)window.WalkQuestEvents?.present(body,[window.WalkQuestEvents.model(p,q,'completed')]);
 }
 if(!dialog.open)dialog.showModal();
}
function append(npc){const recent=window.WalkQuestEvents?.flush(document.getElementById('dialogChoices'))||[];const p=read();if(npc==='forge'&&p){const state=E.state(p);for(const q of D.quests){const a=state.accepted[q.id];if(q.promotion&&q.place===place&&a&&a.step>=E.steps(p,q).length&&!recent.some(m=>m.questId===q.id))promotionNotice(document.getElementById('dialogChoices'),q,true)}}if(!D.quests.some(q=>q.place===place&&q.npc===npc))return;const b=node('button',(marker(npc)||'◇')+' พูดคุยเรื่องภารกิจ');b.className='quest-answer';b.onclick=()=>show(false,npc);document.getElementById('dialogChoices').append(b)}
function knownMenuSource(source){return !!source&&['townMenu','regionMenu','menuFrame'].some(id=>document.getElementById(id)?.contentWindow===source)}
addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='walk-player-saved'&&knownMenuSource(e.source)){const p=read();if(p){write(p);window.dispatchEvent(new Event('walk-player-saved'));}}});
addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='walk-quest-events'||!knownMenuSource(e.source)||!e.source)return;const models=(Array.isArray(e.data.models)?e.data.models:[]).filter(m=>D.quests.some(q=>q.id===m.questId));window.WalkQuestEvents?.push(models)});
addEventListener('pagehide',()=>{const p=read();if(p?.walkId)localStorage.setItem('soulbeast-walk-save:'+p.walkId,JSON.stringify(p))});
window.townQuests={show,append,marker,markerStyle,target,targetStyle,drawTarget,emit,visit:target=>emit('visit',{target}),talk:target=>emit('talk',{target}),npcName:id=>D.npcs[place]?.[id],status:()=>{const p=read(),s=p&&E.state(p);return {accepted:Object.keys(s?.accepted||{}).length,completed:Object.keys(s?.completed||{}).length}},read,write};
})();
