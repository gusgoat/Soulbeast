// Story scenes and localization
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0172-STORY

const STORY=SoulbeastContent.STORY();
// @soulbeast-end 0172-STORY
// @soulbeast-unit 0200-storyContent

function storyContent(i,after=false){const c=STORY[i];return `<div class="stack"><p class="story-lead">${esc(c.lead)}</p><p>${esc(after&&c.after?c.after:c.text)}</p>${!after?`<blockquote>${esc(c.quote)}<div class="sub">— ${esc(c.speaker)}</div></blockquote>`:''}</div>`}
// @soulbeast-end 0200-storyContent
// @soulbeast-unit 0201-storyCard

function storyCard(i,after=false){const c=STORY[i];return `<div class="card stack story-card"><details ${after?'open':''}><summary>${after?'บทส่งท้าย · ':''}${esc(c.title)}</summary>${storyContent(i,after)}</details></div>`}
// @soulbeast-end 0201-storyCard
// @soulbeast-unit 0202-currentStory

function currentStory(){const P=S.P;if(P?.cleared)return storyCard(6,true);return storyCard(Math.min(6,Math.max(1,P?.zoneMax||1)))}
// @soulbeast-end 0202-currentStory
// @soulbeast-unit 0203-vStory

function vStory(){const P=S.P,max=P?Math.min(6,Math.max(1,P.zoneMax||1)):0;
 return `<div class="stack"><div class="row"><h2 class="grow">บันทึกแห่งพันผนึก</h2><button class="btn sm" data-a="storyback">กลับเกม</button></div>${sceneArt(0,'คำสาบานแห่งพันผนึก')}
 <p class="sub" style="margin:0">เรื่องราวของคุณกับอสูรคู่หู เปิดอ่านบทใหม่เมื่อปลดล็อกดินแดน</p>
 ${STORY.map((c,i)=>i<=max?`<div class="card stack story-card"><h3>${esc(c.title)}</h3>${i?zoneArt(i,true):''}${storyContent(i)}${i&&((i<6&&P?.zoneMax>i)||(i===6&&P?.cleared))?`<details><summary>อ่านบทส่งท้ายของด่าน</summary>${storyContent(i,true)}</details>`:''}</div>`:`<div class="card story-lock">${esc(c.title)} · ปลดล็อกเมื่อไปถึง${ZN[i-1].n}</div>`).join('')}</div>`}
// @soulbeast-end 0203-vStory
// @soulbeast-unit 0455-storyFramesOriginal

function storyFramesOriginal(chapter,after=false){if(chapter===7)return [{art:8,title:'ก้าวแรกของผู้ผนึก',text:'หลังประตูเมือง ป่าเล็กกำลังรอคุณและสหาย เรียนรู้ที่จะเชื่อใจกันก่อนออกสู่โลกกว้าง',music:'peaceMusic'},{art:8,title:'สัญญาใต้ร่มไม้',text:'พกยาและผนึกให้พร้อม เลือกทางเดินอย่างระมัดระวัง แล้วกลับมาพร้อมอสูรคู่หู',music:'forest'}];const c=STORY[chapter]||STORY[0],art=chapter?chapter+1:0;if(after)return [{art,title:'แสงหลังการต่อสู้',text:c.after||'ทางข้างหน้าเปิดออก คุณและสหายพร้อมออกเดินทางอีกครั้ง',music:'pianoMusic'},{art:chapter<6?chapter+2:1,title:chapter===6?'คำสัญญาที่กลับคืน':'เส้นทางถัดไป',text:chapter===6?'กลับสู่นครพันผนึกพร้อมสหาย การเดินทางยังไม่สิ้นสุด':STORY[Math.min(6,chapter+1)].lead,music:'peaceMusic'}];if(chapter===0)return [{art:0,title:'คืนที่ดวงจันทร์แตกร้าว',text:c.lead,music:'hauntMusic'},{art:1,title:'นครพันผนึก',text:'มนุษย์และอสูรเคยอยู่ร่วมกัน จนจอมมารปลุกหัวใจรัตติกาลและพรากเสียงของโลกไป',music:'pianoMusic'},{art:2,title:'ผนึกแรก',text:'ธาราเทพมอบผนึกให้คุณ «ผนึกที่แท้จริงไม่ได้เกิดจากการบังคับ แต่เกิดจากความไว้ใจ»',music:'peaceMusic'},{art:7,title:'คำสาบานแห่งสหาย',text:'เดินทางผ่านห้าดินแดนไปยังปราสาทจอมมาร จงกลับมาพร้อมสหาย มิใช่เพียงชัยชนะ',music:'intro'}];const words=c.text.split(' '),half=Math.max(1,Math.ceil(words.length/2));return [{art,title:c.title,text:c.lead,music:'forest'},{art,title:c.speaker,text:words.slice(0,half).join(' '),music:chapter>=5?'hauntMusic':'forest'},{art,title:'คำสาบานระหว่างทาง',text:words.slice(half).join(' ')||c.quote,music:chapter>=5?'tense':'pianoMusic'}]}
// @soulbeast-end 0455-storyFramesOriginal
// @soulbeast-unit 0456-CINEMA_ART

const CINEMA_ART=SoulbeastContent.CINEMA_ART();
// @soulbeast-end 0456-CINEMA_ART
// @soulbeast-unit 0457-storyFrames

function storyFrames(chapter,after=false){const isAfter=!!after&&chapter>0;const frames=chapter===7&&isAfter?[{art:8,title:'คำสัญญาแรกสำเร็จแล้ว',text:'คุณและอสูรคู่หูผ่านการฝึกใต้ร่มไม้ เส้นทางสู่ป่าแสงจันทร์รออยู่ กลับไปเตรียมตัวแล้วออกเดินทางด้วยกัน',music:'peaceMusic'}]:storyFramesOriginal(chapter,isAfter);return frames.map((f,i)=>({...f,sceneKey:chapter+'-'+(isAfter?'after':'before')+'-'+i}));}
// @soulbeast-end 0457-storyFrames
// @soulbeast-unit 0458-cinemaView


function cinemaView(intro=false){const q=intro?{chapter:0,index:S.ui.introFrame||0,after:false}:S.ui.cinema,frames=storyFrames(q.chapter,q.after),i=Math.min(q.index||0,frames.length-1),f=frames[i];return `<section class="cinema"><img class="cinema-art" src="${CINEMA_ART[f.sceneKey]}" alt="${esc(f.title)}"><div class="cinema-shade"></div><div class="cinema-top"><small>ตำนานผนึกอสูร · ${i+1}/${frames.length}</small><button class="btn sm" data-a="cinemaEnd" data-v="${intro?'intro':''}">ข้ามฉาก</button></div><div class="cinema-caption"><small>✦ ${q.after?'บทส่งท้าย':'คำสาบานแห่งพันผนึก'}</small><h1>${esc(f.title)}</h1><p>${esc(f.text)}</p><div class="cinema-controls"><button class="btn" data-a="cinemaPrev" data-v="${intro?'intro':''}" ${i?'':'disabled'}>ย้อนฉาก</button><button class="btn pri" data-a="cinemaNext" data-v="${intro?'intro':''}">${i===frames.length-1?(intro?'เลือกผู้ผนึก':'ออกเดินทางต่อ'):'ฉากถัดไป →'}</button><button class="btn sm" data-a="soundtoggle" aria-label="เปิดปิดเสียง">${Sound.enabled?'🔊':'🔇'}</button></div></div></section>${intro?'<button class="btn full" data-a="introLoad">มีเซฟอยู่แล้ว / โหลดเซฟ</button>':''}`}
// @soulbeast-end 0458-cinemaView
// @soulbeast-unit 0459-openCinema

function openCinema(chapter,after=false,back=S.screen){S.ui.cinema={chapter,index:0,after,back};S.screen='story';render()}
// @soulbeast-end 0459-openCinema
// @soulbeast-unit 0460-endCinema

function endCinema(intro){if(intro){S.ui.introSeen=true;S.ui.introFrame=0;S.screen='start'}else{const q=S.ui.cinema;delete S.ui.cinema;S.screen=q?.back||(S.P?'town':'start')}save();render()}
// @soulbeast-end 0460-endCinema
// @soulbeast-unit 0461-startFull-storyFull

const startFull=vStart,storyFull=vStory,heroFull=vHero,legendFull=vLegend,endBattleFull=endBattle;
// @soulbeast-end 0461-startFull-storyFull
// @soulbeast-unit 0463-vStory

vStory=function(){if(S.ui.cinema)return cinemaView();const max=S.P?Math.min(6,S.P.zoneMax||1):0;return `<div class="stack"><div class="row"><h2 class="grow">บันทึกแห่งพันผนึก</h2><button class="btn" data-a="storyback">กลับเกม</button></div><div class="forest-gallery">${STORY.map((c,i)=>i<=max?`<button class="story-cover" data-a="chapterPlay" data-v="${i}"><img src="${CINEMA_ART[i+'-before-0']}" alt=""><span>${esc(c.title)}</span></button>`:'').join('')}</div></div>`};
// @soulbeast-end 0463-vStory
// @soulbeast-unit 0472-storyCard


storyCard=function(i,after=false){const c=STORY[i];return `<button class="story-cover story-teaser" data-a="storyScene" data-v="${i}:${after?'after':''}"><img src="${CINEMA_ART[i+'-'+(after&&i>0?'after':'before')+'-0']}" alt=""><span>${after?'บทส่งท้าย · ':''}${esc(c.title)} <small>ชมฉากเรื่องราว →</small></span></button>`};
// @soulbeast-end 0472-storyCard
// @soulbeast-unit 0473-handlers-storyScene

handlers.storyScene=v=>{const [i,a]=v.split(':');openCinema(Number(i),a==='after',S.screen)};
// @soulbeast-end 0473-handlers-storyScene
// @soulbeast-unit 0525-GAME_TRANSLATIONS



const GAME_TRANSLATIONS=SoulbeastContent.GAME_TRANSLATIONS();
// @soulbeast-end 0525-GAME_TRANSLATIONS
// @soulbeast-unit 0526-LANGUAGE_KEY

const LANGUAGE_KEY='sealbeast_language_v1';
// @soulbeast-end 0526-LANGUAGE_KEY
// @soulbeast-unit 0527-LANGUAGE_NAMES

const LANGUAGE_NAMES=SoulbeastContent.LANGUAGE_NAMES();
// @soulbeast-end 0527-LANGUAGE_NAMES
// @soulbeast-unit 0528-GAME_LANGUAGE

let GAME_LANGUAGE='th';
// @soulbeast-end 0528-GAME_LANGUAGE
// @soulbeast-unit 0530-LANGUAGE_KEYS

const LANGUAGE_KEYS=[...new Set(Object.values(GAME_TRANSLATIONS).flatMap(dict=>Object.keys(dict)))].sort((a,b)=>b.length-a.length);
// @soulbeast-end 0530-LANGUAGE_KEYS
// @soulbeast-unit 0531-LANGUAGE_PATTERN

const LANGUAGE_PATTERN=new RegExp(LANGUAGE_KEYS.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
// @soulbeast-end 0531-LANGUAGE_PATTERN
// @soulbeast-unit 0532-LANGUAGE_TEXT_CACHE-LANGUAGE_NODES

const LANGUAGE_TEXT_CACHE=new Map(),LANGUAGE_NODES=new WeakMap(),LANGUAGE_ATTRS=new WeakMap();
// @soulbeast-end 0532-LANGUAGE_TEXT_CACHE-LANGUAGE_NODES
// @soulbeast-unit 0533-LANGUAGE_MISSING

const LANGUAGE_MISSING=new Set();
// @soulbeast-end 0533-LANGUAGE_MISSING
// @soulbeast-unit 0535-languagePlayerNames

function languagePlayerNames(){
 const list=[S?.P?.name,...(PVP?.room?.players||[]).map(p=>p.name),...(CAMP?.room?.players||[]).map(p=>p.name),...(WORLD?.room?.players||[]).map(p=>p.name)];
 return [...new Set(list.filter(n=>typeof n==='string'&&n.length>1&&n!=='ผู้ผนึก'))].sort((a,b)=>b.length-a.length);
}
// @soulbeast-end 0535-languagePlayerNames
// @soulbeast-unit 0536-translateGameText

function translateGameText(value,lang=GAME_LANGUAGE,protectNames=true){
 const text=String(value??'');if(lang==='th'||!GAME_TRANSLATIONS[lang]||!/[ก-๙]/.test(text))return text;
 const held=[];let source=text;
 if(protectNames)for(const name of languagePlayerNames())if(source.includes(name)){const token='\uE000'+held.length+'\uE001';held.push(name);source=source.split(name).join(token);}
 const key=lang+'\n'+source;let out=LANGUAGE_TEXT_CACHE.get(key);
 if(out===undefined){
  out=source.replace(LANGUAGE_PATTERN,s=>lang==='en'?' '+(GAME_TRANSLATIONS[lang][s]||s)+' ':GAME_TRANSLATIONS[lang][s]||s);
  if(lang==='en')out=out.replace(/\s+/g,' ').replace(/\s+([,.!?])/g,'$1');
  if(/[ก-๙]/.test(out))LANGUAGE_MISSING.add(source);
  LANGUAGE_TEXT_CACHE.set(key,out);
 }
 return out.replace(/\uE000(\d+)\uE001/g,(_,i)=>held[Number(i)]||'');
}
// @soulbeast-end 0536-translateGameText
// @soulbeast-unit 0537-languagePanel

function languagePanel(){return `<div class="card stack language-panel"><label for="gameLanguage"><b>ภาษา</b></label><select id="gameLanguage" aria-label="ภาษาที่ใช้แสดงผล">${Object.entries(LANGUAGE_NAMES).map(([value,label])=>`<option value="${value}" translate="no" ${GAME_LANGUAGE===value?'selected':''}>${label}</option>`).join('')}</select><small class="sub">ภาษาเปลี่ยนทันทีและบันทึกไว้ในเครื่องนี้</small></div>`;}
// @soulbeast-end 0537-languagePanel
// @soulbeast-unit 0538-setGameLanguage

function setGameLanguage(lang){
 if(!Object.hasOwn(LANGUAGE_NAMES,lang))return false;
 GAME_LANGUAGE=lang;try{localStorage.setItem(LANGUAGE_KEY,lang);}catch(e){}
 render();applyGameLanguage(document.body);return true;
}
// @soulbeast-end 0538-setGameLanguage
// @soulbeast-unit 0539-languageSkip

function languageSkip(el){return !el||!!el.closest('script,style,[contenteditable="true"],[translate="no"],[data-user-content]');}
// @soulbeast-end 0539-languageSkip
// @soulbeast-unit 0540-localizeGameElement

function localizeGameElement(el){
 if(languageSkip(el))return;
 let attrs=LANGUAGE_ATTRS.get(el);if(!attrs){attrs={};LANGUAGE_ATTRS.set(el,attrs);}
 for(const key of ['title','placeholder','aria-label','alt']){
  const current=el.getAttribute(key);if(current==null)continue;
  let record=attrs[key];if(!record||record.last!==current)record=attrs[key]={source:current,last:current};
  const translated=translateGameText(record.source,GAME_LANGUAGE,false);
  if(current!==translated)el.setAttribute(key,translated);record.last=translated;
 }
}
// @soulbeast-end 0540-localizeGameElement
// @soulbeast-unit 0541-applyGameLanguage

function applyGameLanguage(root){
 if(typeof document.createTreeWalker!=='function'||!root)return;
 if(document.documentElement.lang!==GAME_LANGUAGE)document.documentElement.lang=GAME_LANGUAGE;
 const title=GAME_LANGUAGE==='en'?'Soulbeast Chronicles':GAME_LANGUAGE==='zh-CN'?'封兽传说':'ตำนานผนึกอสูร';
 if(document.title!==title)document.title=title;
 const elements=root.nodeType===1?[root,...root.querySelectorAll('*')]:[];
 for(const el of elements)localizeGameElement(el);
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while(node=walk.nextNode()){
  if(languageSkip(node.parentElement)||node.parentElement.closest('input,textarea'))continue;
  const current=node.nodeValue;if(!current?.trim())continue;
  let record=LANGUAGE_NODES.get(node);if(!record||record.last!==current)record={source:current,last:current};
  const translated=translateGameText(record.source);
  if(current!==translated)node.nodeValue=translated;record.last=translated;LANGUAGE_NODES.set(node,record);
 }
}
// @soulbeast-end 0541-applyGameLanguage
// @soulbeast-unit 0542-languageBaseSettings

const languageBaseSettings=vSettings;
// @soulbeast-end 0542-languageBaseSettings
// @soulbeast-unit 0543-vSettings

vSettings=function(){return languageBaseSettings().replace('<div class="achievement-grid">',languagePanel()+'<div class="achievement-grid">');};
// @soulbeast-end 0543-vSettings
// @soulbeast-unit 0544-languageBaseStart

const languageBaseStart=vStart;
// @soulbeast-end 0544-languageBaseStart
// @soulbeast-unit 0545-vStart

vStart=function(){return `<div class="stack">${languagePanel()}${languageBaseStart()}</div>`;};
// @soulbeast-end 0545-vStart
// @soulbeast-unit 0546-languageBaseRender

const languageBaseRender=render;
// @soulbeast-end 0546-languageBaseRender
// @soulbeast-unit 0547-render

render=function(){languageBaseRender();applyGameLanguage(document.getElementById('app'));};
// @soulbeast-end 0547-render
// @soulbeast-unit 0548-languageBaseToast

const languageBaseToast=toast;
// @soulbeast-end 0548-languageBaseToast
// @soulbeast-unit 0549-toast

toast=function(text){languageBaseToast(text);if(document.body?.querySelectorAll)for(const node of document.body.querySelectorAll('.toast'))applyGameLanguage(node);};
// @soulbeast-end 0549-toast
// @soulbeast-unit 0572-ct

const ct=(th,en,zh)=>GAME_LANGUAGE==='en'?en:GAME_LANGUAGE==='zh-CN'?zh:th;
// @soulbeast-end 0572-ct
// @soulbeast-unit 0573-ctext

const ctext=(th,en,zh)=>`<span translate="no">${ct(th,en,zh)}</span>`;
// @soulbeast-end 0573-ctext
// @soulbeast-unit 0958-forestStoryEnd

const forestStoryEnd=endBattle;
// @soulbeast-end 0958-forestStoryEnd
// @soulbeast-unit 0959-endBattle

endBattle=function(result){const b=S.battle,first=b&&!b.over&&b.kind==='boss'&&result==='win';const out=forestStoryEnd(result);if(first&&b.over?.res==='win'){S.P.forestClears=S.P.forestClears||{};S.P.forestClears[b.meta]=(S.P.forestClears[b.meta]||0)+1;save();}return out;};
// @soulbeast-end 0959-endBattle
