/* Runs inside the real menu bootstrap; events come from successful game operations. */
const questEngine=window.WalkQuestEngine,questList=window.WorldQuestData.quests;
function questLocation(){const place=params.get('city')||S.P.country+'-capital';return {place,country:params.get('country')||questEngine.countryOf(place)||S.P.country}}
function questEmit(type,extra={}){const V=window.WalkQuestEvents,before=V?.snapshot(S.P,questList),event={id:crypto.randomUUID(),type,...questLocation(),...extra};const changed=questEngine.emit(S.P,questList,event);save();if(changed&&V){const models=V.changes(S.P,questList,before,event);V.push(models);parent.postMessage({type:'walk-quest-events',models},location.origin)}return changed}
const questSave=save;save=function(){questSave();parent.postMessage({type:'walk-player-saved'},location.origin)};
if(!S.P.tutorial)S.P.tutorial={v:1,enabled:true,done:{},active:null,firstBoss:false};
// Old menu navigation lessons are replaced by the capital quests, combat lessons remain.
for(const id of ['stats','forest','training','fork','hospital','shop','equip','forge','tower','raid','guild','promotion','world','guildwar'])S.P.tutorial.done[id]=true;
if(!['skills','capture','captureIntro','battleIntro','elements'].includes(S.P.tutorial.active))S.P.tutorial.active=null;
const questCanPromote=canPromote;canPromote=function(p){const level=tierOf(p.cls)===0?25:40;return questCanPromote(p)&&!!p.worldQuests?.completed?.[p.country+'-capital:promotion'+level]};
const questHero=vHero;vHero=function(){return questHero()+((S.P.lv>=25&&tierOf(S.P.cls)<2&&!canPromote(S.P))?'<p class="card">ต้องผ่านบททดสอบเลื่อนอาชีพจากผู้ประสานงานเมืองหลวงก่อนเลือกอาชีพขั้นต่อไป</p>':'')};
for(const id of ['heal','buy','craft','bt']){const original=handlers[id];if(!original)continue;handlers[id]=function(v,...args){const gold=S.P.gold,owned=S.P.owned?.length||0,items=JSON.stringify(S.P.items),hp=S.P.hp,pets=new Set(S.P.pets.map(p=>p.uid));const out=original.call(this,v,...args);const after=()=>{if(id==='heal'&&(S.P.hp>hp||S.P.gold<gold))questEmit('heal',{target:'hospital'});if(id==='craft'&&(S.P.owned?.length||0)>owned)questEmit('craft',{gearId:S.P.owned[S.P.owned.length-1],gearName:EQ[S.P.owned[S.P.owned.length-1]]?.n});if(id==='buy'&&CON[v]?.seal&&JSON.stringify(S.P.items)!==items&&S.P.gold<gold)questEmit('buySeal');for(const pet of S.P.pets)if(!pets.has(pet.uid)&&SP[pet.sp]?.rare)questEmit('captureRare',{zone:S.zone?.id,beastSp:pet.sp,beastName:SP[pet.sp]?.n})};if(out?.then)return out.then(r=>{after();return r});after();return out}}
const questEnd=endBattle;endBattle=function(res){const b=B(),kind=b?.kind,zone=S.zone?.id,wasOver=!!b?.over;const out=questEnd(res);if(!wasOver&&res==='win'&&b?.walkActivity)questEmit('activity',{target:b.walkActivity});if(!wasOver&&res==='win'&&kind==='boss'&&zone)questEmit('boss',{zone});if(!wasOver&&res==='win'&&typeof dungeonFloor!=='undefined'&&dungeonFloor&&previewEncounter==='mine-boss')questEmit('dungeonBoss',{target:'floor-'+dungeonFloor.floor});return out};
const questStart=startBattle;startBattle=function(...args){const out=questStart(...args);if(B()?.towerRun)questEmit('activity',{target:'arena'});return out};
// Online world boss fights resolve through wbCall, not the local endBattle path.
if(typeof wbCall==='function'){
 const questWorldCall=wbCall;wbCall=async function(...args){const result=await questWorldCall.apply(this,args),room=result?.room;
 if(result?.ok&&room?.status==='finished'&&room.id&&Number(room.sharedScore)>0&&Number.isInteger(room.me)&&room.players?.[room.me]&&!room.players[room.me].forfeit){
 const seen=S.P.walkWorldQuestRooms||(S.P.walkWorldQuestRooms=[]);if(!seen.includes(room.id)){seen.push(room.id);questEmit('activity',{target:'world'})}
 }return result;
 };
}
// Search events are offered within the forest only after making progress, never from the quest log.
const searchEvents={'lost-person':{zone:7,depth:2,title:'เสียงเรียกจากริมทาง',text:'นักสำรวจบาดเจ็บอยู่หลังพุ่มไม้ เขายืนยันชื่อในประกาศคนหาย คุณทำแผลและพาเขากลับไปยังจุดพักหน้าป่า',choice:'ช่วยพานักสำรวจกลับจุดพัก'},'moon-gem':{zone:1,depth:3,title:'ประกายใต้รากไม้',text:'แสงจันทร์สะท้อนอัญมณีที่มีตราพ่อค้าอยู่ใต้รากไม้ คุณตรวจตราสัญลักษณ์ตรงกับจดหมายที่ได้รับมา',choice:'เก็บอัญมณีส่งคืนเจ้าของ'}};
function questSearchUI(){
 document.getElementById('walkQuestSearch')?.remove();if(!S.zone||S.battle&&!S.battle.over)return;
 const context={...questLocation(),zone:S.zone.id,depth:S.zone.depth};
 const entries=questEngine.searchObjectives(S.P,questList,context).map(({quest:q,objective:o,questId,objectiveStep})=>{
 const preset=searchEvents[o.target];return {...(preset||{title:q.title,text:q.story,choice:'ตรวจเบาะแสและบันทึกหลักฐานให้ '+window.WorldQuestData.npcs[q.place][q.npc],quest:q}),choice:o.visual?.discover?.actionLabel||(preset?.choice||'ตรวจเบาะแสและบันทึกหลักฐานให้ '+window.WorldQuestData.npcs[q.place][q.npc]),id:o.target,zone:o.zone,questId,objectiveStep,questTitle:q.title,sourceQuest:q};
 });
 if(!entries.length)return;const box=document.createElement('section');box.id='walkQuestSearch';box.className='card stack';
 for(const e of entries){const title=document.createElement('h3');title.textContent=e.title+' · '+e.questTitle;const text=document.createElement('p');text.textContent=e.text;const button=document.createElement('button');button.className='quest-answer';button.textContent=e.choice;button.onclick=()=>{if(!S.zone||S.battle&&!S.battle.over)return;const context={...questLocation(),zone:S.zone.id,depth:S.zone.depth};const active=questEngine.searchObjectives(S.P,questList,context).some(x=>x.questId===e.questId&&x.objectiveStep===e.objectiveStep);if(active)questEmit('forestSearch',{...context,target:e.id,questId:e.questId,objectiveStep:e.objectiveStep});render()};if(window.WalkQuestEvents&&e.sourceQuest){const card=window.WalkQuestEvents.render(window.WalkQuestEvents.model(S.P,e.sourceQuest,'discovered',{objectiveStep:e.objectiveStep}));card.append(button);box.append(card);continue}box.append(title);if(e.quest){const frame=document.createElement('div');frame.className='quest-story-window';const im=document.createElement('img');im.src=e.quest.art;im.alt=e.quest.sceneCaptions.join(' → ');im.style.top=e.quest.sceneRow?'-100%':'0';frame.append(im);box.append(frame)}box.append(text,button)}document.querySelector('main')?.prepend(box)
}
const questRender=render;render=function(...args){const result=questRender(...args);questSearchUI();return result};
// The local preview supplies real practice encounters for normally online-only activities.
if(screen==='world'){const addPractice=()=>{if(document.getElementById('walkActivityPractice')||S.battle)return;const b=document.createElement('button');b.id='walkActivityPractice';b.className='btn';b.textContent='ทดสอบ'+(screen==='camp'?'จู่โจมค่าย':'โจมตีบอสโลก')+'กับคู่ต่อสู้จำลอง';b.onclick=()=>{const enemy=wildUnit(screen==='camp'?ZN.find(z=>z.id===7).sp[0]:'salamander',S.P.lv,0);startBattle([enemy],'wild',7);B().walkActivity=screen;render()};document.querySelector('main')?.prepend(b)};const prior=render;render=function(...a){const r=prior(...a);addPractice();return r}}
questEmit('visit',{target:screen});save();render();

// The quest footer returns to the same shared journal used by both walking scenes.
document.addEventListener('click',e=>{if(!e.target.closest?.('nav.bottom [data-a="taleBook"]')||S.battle&&!S.battle.over)return;e.preventDefault();e.stopImmediatePropagation();if(S.zone)return toast('ทำภารกิจในป่าให้เสร็จก่อนกลับฉากเดิน');save();parent.postMessage({type:'town-open-quests'},location.origin)},true);
