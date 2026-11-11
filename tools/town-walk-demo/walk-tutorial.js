(function(g){'use strict';
 const lessons=[
  ['board','รับเควสหลัก','town-walk-preview/decor-notice-v2.png.webp','เดินไปที่ป้ายประกาศรับเควสในเมืองหลวง กดสำรวจ แล้วเลือกภารกิจที่มีป้าย “เควสหลัก” เพื่ออ่านและกดรับ'],
  ['track','ติดตามเควส','media/f1a44ab79c10c68d59fcaa05.webp','เปิดเมนูเควสด้านล่าง เลือกเควสที่รับแล้วและกด “ติดตามเควส” เกมจะแสดงเป้าหมายของขั้นปัจจุบัน'],
  ['stats','อัปค่าสถานะผู้ผนึกและอสูร','ui/menu-portrait/panel-stats.webp','เปิด “ตัวละคร” → ค่าสถานะ เพื่อใช้แต้มของผู้ผนึก ส่วนแต้มอสูรอยู่ในเมนู “อสูร” ให้เลือกอสูรตัวที่ต้องการแล้วเปิดค่าสถานะ'],
  ['shop','ซื้อผนึกและใบเทเลพอร์ต','town-walk-preview/shop-building-v1.png.webp','เดินไปที่ร้านค้าในเมืองแล้วคุยกับพ่อค้า ซื้อผนึกไว้จับอสูร และซื้อใบเทเลพอร์ตไว้เดินทางไปจุดที่ประเทศของคุณครอบครอง'],
  ['marker','ตาม X สีเหลือง','ui/country-war-map-v1.png.webp','X สีเหลืองชี้เป้าหมายของเควสที่เลือกติดตาม ดูได้ทั้งในฉากเดินและมินิแมป ถ้าเป้าหมายอยู่คนละประเทศ ให้ตาม X ไปที่ประตูชายแดนก่อน'],
  ['capture','ผนึกอสูรเป็นคู่หู','ui/soulseal-summoning.webp','ลด HP ของอสูรที่ผนึกได้โดยอย่าให้มันหมดสติ ในเทิร์นของผู้ผนึก เลือก “ผนึก” แล้วเลือกชนิดผนึกที่มีอยู่ในกระเป๋า'],
  ['forge','หลอมไอเทมหลังชนะบอสป่าฝึกหัด','town-walk-preview/forge-building-v2.png.webp','นำวัตถุดิบที่เก็บได้ไปหาโรงหลอมในเมือง เลือกสูตร ตรวจวัสดุและค่าใช้จ่าย แล้วกดยืนยันหลอม'],
  ['night','ระวังอสูรเวลากลางคืน','ui/tales/moon-v1.webp','ดูเวลาในเกมใต้แผนที่ย่อ กลางคืนมีอสูรที่พบต่างจากกลางวัน อสูรเงาในดันเจี้ยนและโจรป่าในฉากประเทศมีพลังโจมตีและป้องกันเพิ่ม 15%'],
  ['tower','หอคอยประลองยุทธ','ui/martial-tower-v1.webp','เดินไปที่หอคอยประลองยุทธในเมือง คุยกับผู้ดูแลเพื่อเลือกชั้นและเริ่มประลอง',8],
  ['auto','เปิดสู้อัตโนมัติ','ui/battle-scenes/training-v2.webp','ในฉากต่อสู้ กด “ออโต้ทีม” เพื่อให้ทีมเลือกคำสั่งเอง หรือกด “อสูรออโต้” เพื่อให้เฉพาะอสูรเลือกคำสั่ง กดซ้ำเพื่อปิด',10],
  ['raid','จู่โจมค่าย','town-walk-preview/camp-building-v1.png.webp','เดินไปที่ค่ายในเมือง เปิดเมนู “จู่โจมค่าย” จัดทีม เลือกเป้าหมาย แล้วตรวจเงื่อนไขก่อนเริ่ม',12],
  ['village','โจมตีหมู่บ้านอาณาจักรอื่น','ui/country-war/battle-volcano-v1.webp','เดินในแผนที่ประเทศไปยังหมู่บ้านศัตรูที่ติดกับพื้นที่ของฝ่ายคุณ เปิดเมนูสงครามอาณาจักรที่จุดนั้น แล้วตรวจทีมและสิทธิ์โจมตีประจำวัน',15],
  ['guild','เข้าร่วมกิล','ui/guild-menu.webp','เดินไปที่อาคารกิลในเมือง เปิดรายชื่อกิล เลือกกิลที่สนใจแล้วส่งคำขอเข้าร่วม',20],
  ['colosseum','เข้าโคลอสเซียม','country-walk/colosseum-v1.webp','หาโคลอสเซียมในแผนที่ประเทศแล้วเดินเข้าไป เลือกเล่นแบบทีมหรือเอาตัวรอด แล้วเลือกห้องปกติ จัดอันดับ หรือทดลองกับบอท',22],
  ['promotion','รับเควสเปลี่ยนอาชีพ','ui/menu-portrait/panel-promotion.webp','กลับไปที่ว่าการเมืองหลวงของประเทศตัวเอง คุยเพื่อรับบททดสอบเลื่อนอาชีพ แล้วติดตามเควสจนส่งสำเร็จ',25],
  ['kingdom','ร่วมสู้บอสอาณาจักร','ui/battle-scenes/boss-v2.webp','เมื่อประกาศบอสอาณาจักรขึ้น ให้ดูประเทศที่บอสปรากฏ ถ้าอยู่แผนที่เดียวกัน มินิแมปจะมีตำแหน่งบอส ให้เดินไปหาเพื่อเข้าต่อสู้',30],
  ['world','ร่วมสู้บอสโลก','ui/boss-gates/gate-6.webp','ไปที่ว่าการเมือง เปิดเมนู “บอสโลก” เพื่อดูเวลาของกิจกรรม จัดทีม และเข้าห้องเมื่อเปิดรับผู้เล่น',33],
  ['guildwar','เข้าร่วมสงครามกิล','ui/guild-war.webp','เข้ากิลก่อน แล้วเปิด “สงครามกิล” ในเมนูกิล ตรวจตารางและเงื่อนไขของรอบนั้น แล้วจัดทีมพร้อมเข้าร่วม',35],
 ].map(([id,title,art,body,level],i)=>({id,title,art,body,level,number:i+1}));
 const translations={
  board:['Accept a main quest','Approach the quest board in the capital and tap Inspect. Choose a quest marked Main Quest, read it, and accept it.','领取主线任务','走到首都的任务公告板前，点击调查。选择标有「主线任务」的任务，阅读后领取。'],
  track:['Track a quest','Open Quests in the bottom bar, select an accepted quest, and tap Track Quest to see its current objective.','追踪任务','打开底栏的任务菜单，选择已领取的任务，再点「追踪任务」查看当前目标。'],
  stats:['Spend stat points','Open Character → Stats to spend your Sealer’s points. To spend a beast’s points, select the beast in the Beasts menu and open its stats.','分配属性点','在「角色」→「属性」中分配封印师的点数。要分配异兽的点数，请在「异兽」菜单中选择对应异兽，再打开属性。'],
  shop:['Buy seals and teleport scrolls','Talk to the merchant in town. Seals capture beasts; teleport scrolls take you to settlements controlled by your kingdom.','购买封印道具和传送卷轴','与城镇商人交谈。封印道具可以捕捉异兽，传送卷轴可以把你送到本国控制的据点。'],
  marker:['Follow the yellow X','The yellow X marks your tracked objective on the walking map and minimap. If the objective is in another kingdom, follow the X to the border gate first.','跟随黄色 X','黄色 X 会在行走场景和小地图上标出追踪目标。如果目标在别国，先跟着 X 到边境门。'],
  capture:['Seal a beast','Lower a sealable beast’s HP without defeating it. On the Sealer’s turn, choose Seal and select a seal from your bag.','封印异兽','先降低可封印异兽的生命值，别把它击倒。在封印师回合选择「封印」，再选择背包中的封印道具。'],
  forge:['Forge after clearing the Training Forest','Take your materials to the town forge. Select a recipe, check the materials and cost, and confirm.','击败训练林首领后锻造','带着材料去城镇的锻造坊。选择配方，确认材料和费用后进行锻造。'],
  night:['Watch out at night','The game clock is below the minimap. Some beasts only appear at night. Dungeon shadows and kingdom-map bandits gain 15% attack and defense at night.','夜间小心','小地图下方显示游戏时间。有些异兽只在夜间出现。夜间，迷宫影兽和王国地图的盗匪攻防各提高 15%。'],
  tower:['Enter the martial tower','Visit the martial tower in town and talk to its keeper to choose a floor and start a challenge.','进入武道塔','前往城镇的武道塔，与管理员交谈，选择楼层并开始挑战。'],
  auto:['Turn on auto battle','In battle, Team Auto controls your whole team and Beast Auto controls only your beasts. Tap again to turn it off.','开启自动战斗','战斗中，「全队自动」接管整队，「异兽自动」只接管异兽。再次点击即可关闭。'],
  raid:['Raid a camp','Visit the town camp, open Camp Raid, assemble your team, and check the target and requirements before attacking.','突袭营地','前往城镇营地，打开「营地突袭」，编队后选择目标，并确认开战条件。'],
  village:['Attack an enemy village','Travel to an enemy village next to your kingdom’s territory. Open Kingdom War there to check your team and daily attack eligibility.','进攻敌国村庄','前往与本国领地接壤的敌国村庄。在当地打开「王国战争」，检查队伍和当天的进攻资格。'],
  guild:['Join a guild','Visit the guild building in town. Browse the guild list, choose one, and apply to join.','加入公会','前往城镇的公会建筑，浏览公会列表，选中感兴趣的公会并申请加入。'],
  colosseum:['Enter the Colosseum','Find the Colosseum on the kingdom map. Choose Team or Survival, then a casual room, ranked play, or practice with bots.','进入竞技场','在王国地图上找到竞技场，选择团队或生存模式，再选择普通房间、排位或人机练习。'],
  promotion:['Start your class promotion','Return to the government hall in your own capital, accept the promotion trial, and track it until you can turn it in.','领取职业进阶任务','返回本国首都的政务厅，领取进阶试炼并追踪任务，完成后交付。'],
  kingdom:['Fight the Kingdom Boss','Check the announcement to see where the boss has appeared. Its location is marked on the minimap when you are on the same map. Approach it to fight.','挑战王国首领','查看公告确认首领出现的王国。进入同一地图后，小地图会标出首领位置，靠近即可交战。'],
  world:['Fight the World Boss','Open World Boss at the government hall to check the event schedule. Assemble your team and join a room when entry opens.','挑战世界首领','在政务厅打开「世界首领」查看活动时间。编好队伍，开放入场后加入房间。'],
  guildwar:['Join Guild War','Join a guild first. Open Guild War in the guild menu, check the schedule and entry requirements, and prepare your team.','参加公会战','先加入公会，再从公会菜单打开「公会战」，确认赛程和参战条件后编队。'],
 };
 function language(){return g.SoulbeastLocale?.get();}
 function tr(th,en,zh){return ({en,'zh-CN':zh})[language()]??th;}
 const asset='/Soulbeast/assets/', prefix='soulbeast-walk-tutorial-v1:';
 const memory=new Map();
 function characterKey(p){
  const id=p?.walkId||p?.characterId||p?.code;
  return id?prefix+id:null;
 }
 function seenFor(p){
  const key=characterKey(p);if(!key)return {};
  try{return JSON.parse(g.localStorage.getItem(key)||'null')||memory.get(key)||{}}
  catch{return memory.get(key)||{}}
 }
 function store(p,seen){
  const key=characterKey(p);if(!key)return;
  memory.set(key,seen);
  try{g.localStorage.setItem(key,JSON.stringify(seen))}catch{}
 }
 function choose(p,seen,{capital=false,night=false}={}){
  if(!p||p.tutorial?.enabled===false)return null;
  const quests=p.worldQuests||{},hasQuest=Object.keys(quests.accepted||{}).length>0||Object.keys(quests.completed||{}).length>0;
  const tracked=!!quests.tracked&&!!quests.accepted?.[quests.tracked];
  const starter=(p.lv||0)<=5;
  const allow={
   board:capital&&starter&&!hasQuest,
   track:Object.keys(quests.accepted||{}).length>0&&!tracked,
   stats:(starter&&hasQuest)||(!starter&&(p.free>0||p.pets?.some(beast=>beast.free>0))),
   shop:seen.stats&&(starter||p.lv<=8),
   marker:tracked,
   capture:false, // Existing in-battle lesson keeps its live target and seal button.
   forge:Number(p.forestClears?.[7])>0,
   night,
  };
  return lessons.find(l=>!seen[l.id]&&(l.level?p.lv>=l.level:allow[l.id]))||null;
 }
 function node(tag,cls,content){
  const el=g.document.createElement(tag);if(cls)el.className=cls;if(content)el.textContent=content;return el;
 }
 function show(lesson,{review=false,done=()=>{}}={}){
  const doc=g.document;if(doc.querySelector('.walk-lesson'))return;
  if(!doc.getElementById('walk-lesson-style')){
   const sheet=node('link');sheet.id='walk-lesson-style';sheet.rel='stylesheet';sheet.href='/Soulbeast/tools/town-walk-demo/walk-tutorial.css?v=1';doc.head.append(sheet);
  }
  const dialog=node('dialog','walk-lesson'),card=node('article'),header=node('div','walk-lesson-top');
  dialog.setAttribute('aria-labelledby','walk-lesson-title');
  const step=node('p','walk-lesson-step'),title=node('h2'),image=node('img'),illustration=node('div','walk-lesson-picture'),caption=node('p','walk-lesson-caption'),controls=node('div','walk-lesson-controls');
  title.id='walk-lesson-title';image.alt='';illustration.append(image);
  const close=node('button','walk-lesson-confirm',review?tr('ปิดคู่มือ','Close guide','关闭指南'):tr('เข้าใจแล้ว','Got it','知道了'));
  close.type='button';close.onclick=()=>dialog.close();
  const previous=node('button','',tr('ก่อนหน้า','Previous','上一节')),next=node('button','',tr('ถัดไป','Next','下一节'));
  previous.type=next.type='button';previous.onclick=()=>render(lessons[index-1]);next.onclick=()=>render(lessons[index+1]);
  if(review)controls.append(previous,next);controls.append(close);
  header.append(step,title);card.append(header,illustration,caption,controls);dialog.append(card);
  let index=0;
  function render(l){
   if(!l)return;
   index=l.number-1;step.textContent=tr('คู่มือผู้ผนึก','Sealer’s Guide','封印师指南')+' · '+l.number+'/'+lessons.length+(l.level?' · Lv '+l.level:'');
   const [enTitle,enBody,zhTitle,zhBody]=translations[l.id];
   title.textContent=tr(l.title,enTitle,zhTitle);image.src=asset+l.art;caption.textContent=tr(l.body,enBody,zhBody);
   previous.disabled=index===0;next.disabled=index===lessons.length-1;
   illustration.querySelector('.walk-lesson-x')?.remove();
   if(l.id==='marker')illustration.append(node('span','walk-lesson-x','×'));
  }
  render(lesson);doc.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();done()},{once:true});dialog.showModal();close.focus();
  return dialog;
 }
 function mount({read,capital=false,observesNight=false,blocked,stop}){
  let after=Date.now()+1100;
  const frame=()=>{
   const doc=g.document,now=Date.now();
   if(doc.visibilityState==='hidden')return;
   const p=read();if(!characterKey(p)||p.tutorial?.enabled===false)return;
   let seen=seenFor(p);
   if(seen.startLevel==null){
    seen={...seen,startLevel:Number(p.lv)||1};
    // Lessons below the current level stay in the guide for existing characters.
    for(const l of lessons)if(l.level&&l.level<seen.startLevel)seen[l.id]=true;
    if(seen.startLevel>7&&Number(p.forestClears?.[7])>0)seen.forge=true;
    store(p,seen);
   }
   if(observesNight&&!seen.nightPending&&!seen.night&&g.SoulBeastClock?.at(now).phase==='night'){
    seen={...seen,nightPending:true};store(p,seen);
   }
   if(now<after||blocked()||doc.querySelector('dialog[open]')||doc.documentElement.hasAttribute('data-event-announcement-open'))return;
   const lesson=choose(p,seen,{capital,night:seen.nightPending});
   if(!lesson)return;
   stop();
   show(lesson,{done:()=>{store(p,{...seenFor(p),[lesson.id]:true});after=Date.now()+15_000}});
  };
  g.setInterval(frame,600);
 }
 const api={lessons,choose,mount,active:()=>!!g.document.querySelector('.walk-lesson[open]'),review:()=>show(lessons[0],{review:true})};
 g.WalkTutorial=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
