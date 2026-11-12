(function(g){'use strict';
 const lessons=[
  ['board','การรับเควส','town-walk-preview/decor-notice-v2.png.webp','เดินไปที่กระดานภารกิจในเมืองหลวง แล้วกดสำรวจเพื่อดูเควสที่รับได้'],
  ['trackMenu','เมนูเควสและการติดตามเควส','ui/walk-tutorial/02-open-quests.webp','แตะไอคอน “เควส” ที่แถบเมนูด้านล่าง ตรงวงสีส้ม'],
  ['stats','อัปเลเวลและลงแต้มตัวละครกับอสูร','ui/walk-tutorial/03-character-menu.webp','เมื่อเลเวลเพิ่มและมีแต้มสถานะเหลือ ให้แตะ “ตัวละคร” ที่แถบด้านล่าง แล้วเปิด “ค่าสถานะ”'],
  ['shop','ซื้ออุปกรณ์ ยา ผนึก และใบเทเลพอร์ต','town-walk-preview/shop-building-v1.png.webp','มองหาร้านค้าในเมือง แล้วเข้าไปคุยกับพ่อค้าเพื่อเลือกซื้อของ'],
  ['enterForest','การเข้าป่า','ui/walk-tutorial/05-forest-entrance.webp','เมื่อออกจากเมืองหลวง ให้เดินไปที่ทางเข้าป่าบนแผนที่ประเทศ เช่น ป่าฝึกหัด แล้วกดสำรวจทางเข้า'],
  ['walkForest','การเดินในป่า','ui/walk-tutorial/06-forest-path.webp','เลือกทางซ้ายหรือขวาเพื่อเดินต่อ แถบ “เส้นทางสู่บอส” บอกว่าเดินมาลึกแค่ไหนและเหลืออีกกี่ก้าวถึงบอส เช่น 1/10 คือเดินมาแล้ว 1 ก้าว เหลืออีก 9 ก้าว'],
  ['hospital','รักษาตัวที่โรงพยาบาล','ui/walk-tutorial/07-hospital-entrance.webp','หลังออกจากป่า หากทีมบาดเจ็บ ให้ไปที่โรงพยาบาลในเมืองหลวง แล้วกดคุยกับหมอ หากตัวละครเสียชีวิต เกมจะพาคุณมาที่โรงพยาบาล'],
  ['night','ราตรีมาเยือน','ui/walk-tutorial/08-night-scene.webp','เมื่อเข้าสู่เวลากลางคืน อสูรเงาในดันเจี้ยนจะแข็งแกร่งขึ้น พลังโจมตีและป้องกันเพิ่ม 15% และอสูรบางชนิดจะปรากฏให้พบเฉพาะเวลากลางคืน'],
  ['capture','ผนึกอสูรเป็นคู่หู','ui/walk-tutorial/09-beast-hp.webp','ยิ่ง HP ของอสูรที่ผนึกได้เหลือน้อย โอกาสผนึกสำเร็จก็ยิ่งสูง ระวังอย่าโจมตีจน HP เหลือ 0 เพราะจะผนึกอสูรที่ล้มแล้วไม่ได้'],
  ['forge','การหลอมอุปกรณ์','ui/walk-tutorial/10-forge-entrance.webp','หลังชนะบอสป่าฝึกหัดและกลับเข้าเมือง ให้นำวัตถุดิบที่เก็บได้ไปที่โรงหลอม แล้วคุยกับช่าง'],
  ['equip','การสวมใส่อุปกรณ์','ui/walk-tutorial/11-equipment-menu.webp','เปิดเมนู “ตัวละคร” ที่แถบด้านล่าง แล้วเลือกแท็บ “อุปกรณ์”'],
  ['bandit','โจรป่า','ui/walk-tutorial/12-bandit-on-map.webp','เมื่อเห็นป้าย “โจรป่า” บนแผนที่ประเทศ ให้ระวังการเข้าใกล้ เพราะโจรอาจวิ่งเข้ามาโจมตี ถ้าทีมยังไม่พร้อม ให้เว้นระยะหรือเลือกทางอื่น'],
  ['shadow','เงาอสูร','ui/walk-tutorial/13-shadow-beast.webp','เงาอสูรพบได้ทั้งในดันเจี้ยนและบนแผนที่ประเทศ เมื่อปะทะจะสุ่มเจออสูรที่พบได้ในพื้นที่นั้น ถ้าเดินเข้าใกล้ เงาอสูรอาจวิ่งไล่ตาม'],
  ['tower','หอคอยประลองยุทธ','ui/walk-tutorial/14-tower-entrance.webp','เมื่อถึง Lv 8 ให้เดินไปที่หอคอยประลองยุทธในเมือง แล้วคุยกับผู้คุมหอคอย',8],
  ['raid','จู่โจมค่าย','ui/walk-tutorial/15-camp-entrance.webp','เมื่อถึง Lv 10 ให้เดินไปที่ค่ายผู้ผนึกในเมืองหลวง แล้วคุยกับหัวหน้าค่าย',10],
  ['auto','การสู้อัตโนมัติ','ui/walk-tutorial/16-auto-controls.webp','กด “ออโต้ทีม” (วงแดง) ให้ทั้งผู้ผนึกและอสูรเลือกคำสั่งสู้เอง หรือกด “อสูรออโต้” (วงส้ม) ให้เฉพาะอสูรสู้เอง โดยคุณยังควบคุมผู้ผนึกได้',10],

  ['village','การโจมตีหมู่บ้านอาณาจักรอื่น','ui/walk-tutorial/17-enemy-village.webp','เมื่อถึง Lv 15 ให้เดินไปถึงหมู่บ้านศัตรูที่ติดกับพื้นที่ของอาณาจักรเรา แล้วกด “สำรวจทางเข้า”',15],
  ['guild','เข้ากิลและสงครามกิล','ui/walk-tutorial/18-guild-castle.webp','เมื่อถึง Lv 20 ให้เดินไปที่ปราสาทกิลในเมืองหลวง แล้วคุยกับเจ้าหน้าที่กิล',20],
  ['gacha','ตู้กาชาปอง','ui/walk-tutorial/19-gacha-machine.webp','หลังพ่ายแพ้ในหอคอยประลองยุทธครั้งแรก ลองเดินไปที่ตู้กาชาปองในเมืองหลวง หากเคยผ่านชั้นใดเป็นครั้งแรก จะได้คูปอง 2 ใบต่อชั้นไว้ใช้สุ่ม'],
  ['world','บอสโลก','ui/walk-tutorial/20-world-boss.webp','ไปที่ว่าการเมืองหลวง คุยกับเจ้าหน้าที่ แล้วเลือก “บอสโลก” ในกรอบแดง จากนั้นสร้างห้องหรือเข้าร่วมปาร์ตี้ที่มีอยู่ เพื่อต่อสู้กับบอสโลกด้วยกันได้สูงสุด 4 ผู้เล่น',31],
  ['colosseum','โคลอสเซียม','ui/walk-tutorial/21-colosseum.webp','เมื่อถึง Lv 22 ให้หาโคลอสเซียมบนแผนที่ประเทศ เดินไปถึงทางเข้าแล้วกดเข้าสถานที่',22],
  ['kingdom','บอสอาณาจักร','ui/walk-tutorial/22-kingdom-boss-announcement.webp','บอสอาณาจักรเกิดเวลา 10:00 และ 22:00 น. ตามเวลาไทย ถ้าเปิดตารางทดสอบ จะเกิดเพิ่มเวลา 12:00, 14:00, 16:00, 18:00 และ 20:00 น. แต่ละรอบเปิด 1 ชั่วโมง ดูชื่อบอสและประเทศที่บอสเกิดได้จากประกาศ',35],
  ['promotion','เควสเปลี่ยนอาชีพขั้น 2','ui/walk-tutorial/23-promotion-accept.webp','เมื่อถึง Lv 25 ให้ไปที่ว่าการเมืองหลวงของอาณาจักรตัวเอง คุยกับผู้ประสานงาน เปิด “พูดคุยเรื่องภารกิจ” แล้วรับ “บททดสอบเลื่อนอาชีพระดับ 25”',25],
  ['guildwar','เข้าร่วมสงครามกิล','ui/walk-tutorial/24-guild-war-entry.webp','เมื่อถึง Lv 35 ให้ไปที่ปราสาทกิลในเมืองหลวง เลือก “ติดต่อกิล” แล้วเปิด “สงครามกิล” ก่อนลงแข่งต้องเป็นสมาชิกกิลและตั้งอสูรเฝ้าค่ายไว้แล้ว',35],
  ['dungeon','เข้ามหาวงกตดันเจี้ยน 7 ชั้น','ui/walk-tutorial/25-dungeon-entrance.webp','เมื่อถึง Lv 20 ให้ไปที่แผนที่ประเทศอัคนีบรรพต มองหาปากถ้ำ “มหาวงกตดันเจี้ยน 7 ชั้น” แล้วเดินเข้าใกล้',20],
 ].map(([id,title,art,body,level],i)=>({id,title,art,body,level,number:i+1}));
 const board=lessons[0];
 board.pages=[
  {
   art:board.art,
   body:board.body,
   en:'Go to the quest board in the capital and tap Inspect to see available quests.',
   zh:'走到首都的任务公告板前，点击「调查」查看可领取的任务。',
  },
  {
   art:'ui/walk-tutorial/01-accept-quest.webp',
   body:'เลือกเควสที่ต้องการ อ่านเงื่อนไขและรางวัล แล้วกด “ข้าจะรับภารกิจนี้” ตรงกรอบสีแดง',
   en:'Choose a quest and read its requirements and rewards. Tap “I’ll accept this quest” in the red box.',
   zh:'选择任务，查看条件和奖励，然后点击红框中的「我接受这个任务」。',
   highlight:{size:[408,257],box:[78,146,293,80]},
  },
  {
   art:'ui/walk-tutorial/01-talk-to-npc.webp',
   body:'บางเควสต้องรับจาก NPC ผู้มอบหมายโดยตรง เข้าไปคุยแล้วเลือก “พูดคุยเรื่องภารกิจ” ตรงกรอบสีแดง เพื่อดูและรับเควส',
   en:'Some quests come directly from an NPC. Talk to the quest giver and choose “Talk about quests” in the red box to view and accept a quest.',
   zh:'有些任务需要直接向 NPC 领取。与任务发布者对话，点击红框中的「谈谈任务」来查看并领取任务。',
   highlight:{size:[411,326],box:[27,18,311,79]},
  },
 ];
 const trackMenu=lessons[1];
 trackMenu.pages=[
  {
   art:trackMenu.art,
   body:trackMenu.body,
   en:'Tap the Quests icon circled in orange in the bottom bar.',
   zh:'点击底栏中用橙色圆圈标出的「任务」图标。',
   highlight:{size:[468,317],box:[193,238,77,78],shape:'circle',color:'#ff9800'},
  },
  {
   art:'ui/walk-tutorial/02-quest-categories.webp',
   body:'เมนูเควสแบ่งเป็น “กำลังทำ” “รอรายงาน” และ “ทำสำเร็จแล้ว” หากต้องการติดตามเควสที่เพิ่งรับ ให้เปิด “รายการเควสที่กำลังทำ”',
   en:'Quests are grouped into In Progress, Ready to Report, and Completed. To track a quest you just accepted, open In Progress.',
   zh:'任务分为「进行中」「待报告」和「已完成」。要追踪刚领取的任务，请打开「进行中」。',
  },
  {
   art:'ui/walk-tutorial/02-track-quest.webp',
   body:'เลือกเควสที่ต้องการ แล้วกด “ติดตามเควส” ตรงกรอบสีส้ม ติดตามได้ครั้งละ 1 เควส',
   en:'Choose a quest and tap Track Quest in the orange box. You can track one quest at a time.',
   zh:'选择任务，再点击橙框中的「追踪任务」。一次只能追踪一个任务。',
   highlight:{size:[401,275],box:[216,177,151,73],color:'#ff9800'},
  },
  {
   art:'ui/walk-tutorial/02-map-marker.webp',
   body:'X สีเหลืองบนแผนที่ชี้เป้าหมายของเควสที่ติดตาม ส่วน X สีแดงชี้เป้าหมายเควสอื่น หากเป้าหมายอยู่คนละประเทศ ให้ตาม X ไปยังประตูชายแดนก่อน',
   en:'A yellow X marks the tracked quest objective. Red X marks show other quests. If the target is in another kingdom, follow the yellow X to the border gate first.',
   zh:'地图上的黄色 X 标出正在追踪的目标，红色 X 标出其他任务的目标。如果目标在别国，先跟着黄色 X 到边境门。',
  },
  {
   art:'ui/walk-tutorial/02-world-marker.webp',
   body:'ในฉากเดินก็มองหา X สีเหลืองได้ เช่น เครื่องหมายหน้าประตูในภาพ เมื่อผ่านประตูแล้ว ให้ตาม X ต่อไปยังจุดหมายของเควส',
   en:'Look for the yellow X in the walking scene as well, such as the marker in front of this gate. After passing through, follow the X onward to the quest destination.',
   zh:'行走场景中也会出现黄色 X，例如图中的门前标记。穿过门后，继续跟着 X 前往任务目的地。',
   highlight:{size:[432,266],box:[186,139,77,74],shape:'circle',color:'#ff9800'},
  },
 ];
 const stats=lessons[2];
 stats.pages=[
  {
   art:stats.art,
   body:stats.body,
   en:'When you level up and have stat points to spend, tap Character in the bottom bar and open Stats.',
   zh:'升级后若有可分配的属性点，点击底栏的「角色」，再打开「属性」。',
   highlight:{size:[472,355],box:[97,274,85,81],shape:'circle',color:'#ff9800'},
  },
  {
   art:'ui/walk-tutorial/03-character-auto.webp',
   body:'ถ้าอยากให้เกมเลือกค่าสถานะให้ กด “จัดสรรแต้ม” ในส่วนอัปสถานะอัตโนมัติ เกมจะลงเฉพาะแต้มที่เหลือตามสายอาชีพ โดยไม่ล้างแต้มเดิม',
   en:'To let the game pick your stats, tap Allocate Points in the automatic allocation section. It spends only your remaining points based on your class and keeps your previous choices.',
   zh:'如果想让游戏替你选择属性，点击自动加点区的「分配点数」。系统会按职业分配剩余点数，保留之前的加点。',
   highlight:{size:[411,307],box:[23,213,365,66]},
  },
  {
   art:'ui/walk-tutorial/03-character-manual.webp',
   body:'ถ้าต้องการลงแต้มเอง ให้กดปุ่ม “+” ข้างค่าสถานะที่ต้องการ เช่น HP, MP หรือโจมตีเวท ตัวเลขบนปุ่มบอกว่าค่านั้นจะเพิ่มเท่าไร',
   en:'To allocate points yourself, tap the plus button beside a stat such as HP, MP, or Magic Attack. The number on the button shows how much the stat increases.',
   zh:'手动加点时，点击生命值、魔力或魔法攻击等属性旁的「+」。按钮上的数字表示属性将增加多少。',
   highlight:{size:[407,402],box:[327,1,74,400]},
  },
  {
   art:'ui/walk-tutorial/03-beast-roster.webp',
   body:'เปิดเมนู “อสูร” แล้วกด “ดูอสูรที่มีแต้ม” เพื่อหาอสูรที่ยังมีแต้มเหลือ หรือกด “อัปแต้มอสูรทั้งหมดอัตโนมัติ” เพื่อจัดสรรพร้อมกัน',
   en:'Open Beasts and tap View Beasts with Points to find beasts with unspent points. To allocate those points in one go, tap Auto-Allocate All Beast Points.',
   zh:'打开「异兽」菜单，点击「查看有点数的异兽」查找还有剩余点数的异兽。也可以点击「自动分配全部异兽点数」一次完成。',
   highlight:{size:[442,423],boxes:[
    {box:[287,79,135,53],color:'#ff9800'},
    {box:[7,358,429,61]},
   ]},
  },
  {
   art:'ui/walk-tutorial/03-beast-card.webp',
   body:'ถ้าต้องการอัปเฉพาะตัว ให้กด “อัปอัตโนมัติ” บนการ์ดอสูร หรือแตะรูปอสูรตามลูกศรเพื่อเปิดหน้าค่าสถานะและลงแต้มเอง',
   en:'To allocate points for one beast, tap Auto-Allocate on its card. To choose stats yourself, tap its portrait as shown by the arrow.',
   zh:'要为单只异兽加点，可点击卡片上的「自动分配」。如果想手动选择属性，请按箭头所示点击异兽头像。',
   highlight:{size:[435,533],boxes:[
    {box:[19,444,135,72]},
    {box:[139,128,31,28],shape:'arrow'},
   ]},
  },
  {
   art:'ui/walk-tutorial/03-beast-stats.webp',
   body:'ในหน้าค่าสถานะของอสูร กด “จัดสรรแต้ม” ในกรอบสีส้มเพื่อให้อัปอัตโนมัติ หรือกด “+” ในกรอบสีแดงเพื่อเลือกค่าสถานะเอง',
   en:'In the beast’s Stats screen, tap Allocate Points in the orange box for automatic allocation, or tap a plus button in the red box to choose the stat yourself.',
   zh:'在异兽属性页，点击橙框中的「分配点数」进行自动加点，或点击红框中的「+」手动选择属性。',
   highlight:{size:[406,407],boxes:[
    {box:[22,102,359,63],color:'#ff9800'},
    {box:[323,197,78,210]},
   ]},
  },
 ];
 const shop=lessons[3];
 shop.pages=[
  {
   art:shop.art,
   body:shop.body,
   en:'Find the shop in town and talk to the merchant to browse their goods.',
   zh:'找到城镇里的商店，与商人交谈以查看商品。',
  },
  {
   art:'ui/walk-tutorial/04-merchant.webp',
   body:'เมื่อคุยกับพ่อค้า ให้เลือก “ซื้อขายอุปกรณ์ ยา และผนึก” ตรงกรอบสีแดงเพื่อเปิดร้าน',
   en:'When speaking to the merchant, choose the equipment, potions, and seals option in the red box to open the shop.',
   zh:'与商人交谈时，点击红框中的「买卖装备、药剂和封印道具」打开商店。',
   highlight:{size:[406,592],box:[10,124,326,149]},
  },
  {
   art:'ui/walk-tutorial/04-categories.webp',
   body:'เลือกหมวด “อาวุธ” “ชุดเกราะ” “ของพิเศษ” หรือ “ยาและผนึก” ที่แถบด้านบน อ่านค่าสถานะและเลเวลที่ต้องการก่อนกดปุ่มราคาของชิ้นที่ต้องการซื้อ',
   en:'Choose Weapons, Armor, Special Items, or Potions and Seals in the top tabs. Check the stats and level requirement before tapping an item’s price button.',
   zh:'在顶部选择「武器」「护甲」「特殊物品」或「药剂与封印」。查看属性和等级要求后，点击想购买物品的价格按钮。',
   highlight:{size:[436,407],box:[7,9,429,69]},
  },
  {
   art:'ui/walk-tutorial/04-potions.webp',
   body:'เปิดหมวด “ยาและผนึก” เพื่อซื้อยาฟื้นพลัง ดูว่ายาแต่ละชนิดฟื้น HP เท่าไร ต้องใช้เลเวลเท่าไร และมีอยู่กี่ขวด แล้วกดปุ่มราคาของยาที่ต้องการ',
   en:'Open Potions and Seals to buy healing potions. Check how much HP each potion restores, its level requirement, and how many you already own, then tap its price button.',
   zh:'在「药剂与封印」中购买治疗药剂。先查看恢复的生命值、等级要求和现有数量，再点击价格按钮。',
   highlight:{size:[442,402],box:[319,9,119,55]},
  },
  {
   art:'ui/walk-tutorial/04-seals.webp',
   body:'เลื่อนลงในหมวด “ยาและผนึก” เพื่อหาผนึกสำหรับจับอสูร เช่น ผนึกกระดาษ ผนึกหยก และผนึกทองคำ ดูพลังผนึกและเลเวลที่ต้องการก่อนเลือกซื้อ',
   en:'Scroll down in Potions and Seals to find beast-capture items such as Paper, Jade, and Gold Seals. Check their sealing power and level requirements before buying.',
   zh:'在「药剂与封印」中向下滚动，可找到纸符、玉符和金符等捕捉异兽的道具。购买前查看封印能力和等级要求。',
  },
  {
   art:'ui/walk-tutorial/04-teleport.webp',
   body:'ในหมวดเดียวกันมี “ใบเทเลพอร์ต” สำหรับเดินทางไปเมืองหลวง เมือง หรือหมู่บ้านที่อาณาจักรของคุณครอบครอง ใบเทเลพอร์ตใช้ไม่ได้ระหว่างต่อสู้หรือขณะอยู่ในป่า',
   en:'Teleport Scrolls are in the same category. Use one to travel to a capital, town, or village controlled by your kingdom. Scrolls cannot be used during combat or while in a forest.',
   zh:'同一分类也出售「传送卷轴」，可以传送到本国控制的首都、城镇或村庄。战斗中或在森林里无法使用。',
  },
 ];
 const forest=lessons[4];
 forest.pages=[
  {
   art:forest.art,
   body:forest.body,
   en:'After leaving the capital, walk to a forest entrance on the kingdom map, such as the Training Forest, and tap Inspect Entrance.',
   zh:'离开首都后，前往王国地图上的森林入口，例如训练森林，再点击「调查入口」。',
  },
  {
   art:'ui/walk-tutorial/05-forest-beasts.webp',
   body:'หน้าทางเข้าจะแสดงอสูรที่พบได้ในป่านั้น ก่อนเข้าด่านให้เตรียมยาฟื้นพลัง ลงแต้มค่าสถานะของตัวละครและอสูร และพกผนึกไว้หากต้องการจับอสูร',
   en:'The entrance screen lists the beasts found in the forest. Before entering, stock up on healing potions, spend your character and beast stat points, and bring seals if you want to capture a beast.',
   zh:'入口页面会列出这片森林里能遇到的异兽。进入前请备好治疗药剂，分配角色和异兽的属性点，并在想捕捉异兽时带上封印道具。',
  },
  {
   art:'ui/walk-tutorial/05-enter-stage.webp',
   body:'เมื่อพร้อมแล้ว กด “เข้าสู่ด่าน” ตามด้วยชื่อป่า ใต้รูปป่า ก่อนรายการอสูรที่พบได้ เมื่อเข้าไปแล้วจะกดกลับเมืองจากเมนูปกติไม่ได้',
   en:'When you’re ready, tap Enter Stage under the forest image, above the list of beasts. Once inside, the regular menu cannot take you back to town.',
   zh:'准备好后，在森林图片下方、异兽列表上方点击「进入关卡」。进入后无法通过普通菜单返回城镇。',
  },
 ];
 const forestWalk=lessons[5];
 forestWalk.pages=[
  {
   art:forestWalk.art,
   body:forestWalk.body,
   en:'Choose the left or right path to move deeper. The Route to the Boss shows your current depth and the steps left. For example, 1/10 means you’ve taken one step and have nine to go.',
   zh:'选择左边或右边的道路继续前进。「通往首领的路线」会显示当前深度和剩余步数，例如 1/10 表示已走 1 步，还剩 9 步。',
   highlight:{size:[551,512],boxes:[
    {box:[59,57,64,97],shape:'circle'},
    {box:[429,50,99,107],shape:'circle',color:'#ed2b86'},
    {box:[20,297,254,211],color:'#ff790e'},
    {box:[276,297,245,211],color:'#ff790e'},
   ]},
  },
  {
   art:'ui/walk-tutorial/06-forest-menu.webp',
   body:'ระหว่างเดินป่า ใช้เมนูด้านล่างได้ เปิด “ตัวละคร” เพื่อลงแต้มค่าสถานะ “อสูร” เพื่อปรับอสูรออกรบ และ “กระเป๋า” เพื่อใช้ยา กด “ป่า” เพื่อกลับมาเลือกทางต่อ',
   en:'Use the bottom menu while exploring. Open Character to spend stat points, Beasts to change your active team, or Bag to use items. Tap Forest to return to the path choices.',
   zh:'探索时可使用底栏菜单。打开「角色」分配属性点，在「异兽」调整出战队伍，在「背包」使用道具。点击「森林」返回路线选择。',
  },
  {
   art:'ui/walk-tutorial/06-use-potion.webp',
   body:'ใน “กระเป๋า” เลือกตัวละครหรืออสูรที่ต้องการฟื้นพลัง แล้วกดยาที่มีอยู่ เช่น น้ำมนต์เวทในวงสีส้มใช้ฟื้น MP',
   en:'In Bag, choose the character or beast that needs recovery, then tap an available potion. The Magic Water circled in orange restores MP.',
   zh:'在「背包」中选择需要恢复的角色或异兽，再点击已有的药剂。橙圈中的魔力药水可恢复 MP。',
   highlight:{size:[548,471],box:[17,367,252,84],shape:'circle',color:'#ff790e'},
  },
  {
   art:'ui/walk-tutorial/06-surrender.webp',
   body:'กดออกจากป่าผ่านเมนูปกติไม่ได้ การเดินป่าจบได้เมื่อชนะบอส ตัวละครเสียชีวิต หรือกด “ยอมแพ้ [ยอมตาย]” ซึ่งจะกลับเมืองพร้อมรับบทลงโทษ หากเจอเหตุการณ์ “แสงปลายทาง” จะมีทางออกให้เลือกในเหตุการณ์นั้น',
   en:'The regular menu cannot take you out of the forest. A run can end by defeating the boss, dying, or choosing Surrender to return to town with a penalty. If you find the Light at the End event, it also offers an exit.',
   zh:'无法通过普通菜单离开森林。击败首领、角色死亡，或选择「认输」并承担惩罚返回城镇，都可结束探索。如果遇到「尽头的光」事件，也可选择离开。',
  },
 ];
 const hospital=lessons[6];
 hospital.pages=[
  {
   art:hospital.art,
   body:hospital.body,
   en:'After leaving a forest, visit the hospital in the capital and talk to the healer if your team needs recovery. If your character dies, the game takes you to the hospital.',
   zh:'离开森林后，如果队伍受伤，可以前往首都的医院与治疗师交谈。角色死亡后，游戏会将你送往医院。',
  },
  {
   art:'ui/walk-tutorial/07-see-healer.webp',
   body:'คุยกับหมอ แล้วเลือก “เข้ารับการรักษา” ตรงกรอบสีแดงเพื่อดูบริการฟื้นฟู HP และ MP ของทีม',
   en:'Talk to the healer and select Get Treatment in the red box to see the team’s HP and MP recovery service.',
   zh:'与治疗师交谈后，点击红框中的「接受治疗」，查看恢复队伍生命值和魔力的服务。',
   highlight:{size:[508,465],box:[16,112,416,151]},
  },
  {
   art:'ui/walk-tutorial/07-heal-team.webp',
   body:'ดูค่ารักษาที่แสดงบนปุ่ม แล้วกด “รักษาทั้งหมด” เพื่อฟื้น HP และ MP ให้ทั้งตัวละครและอสูรในผนึก รวมถึงอสูรที่หมดสติ',
   en:'Check the cost on the button and tap Heal All to restore HP and MP for your character and sealed beasts, including beasts that have fainted.',
   zh:'查看按钮上的费用，再点击「全部治疗」，恢复角色和已封印异兽的生命值与魔力，包括已昏迷的异兽。',
   highlight:{size:[581,533],box:[0,349,574,71]},
  },
 ];
 const nightfall=lessons[7];
 nightfall.pages=[
  {
   art:nightfall.art,
   body:nightfall.body,
   en:'At night, shadow beasts in dungeons gain 15% attack and defense. Some species can only be encountered at night.',
   zh:'进入夜间后，地牢中的影兽攻击力和防御力提高 15%。部分异兽只会在夜间出现。',
  },
  {
   art:'ui/walk-tutorial/08-night-clock.webp',
   body:'ดูเวลาในเกมใต้แผนที่ย่อ ตรงกรอบสีแดง ถ้าขึ้นคำว่า “กลางคืน” แสดงว่าตอนนี้อยู่ในช่วงที่อสูรเฉพาะกลางคืนจะปรากฏ',
   en:'Check the clock below the minimap in the red box. When it says Night, you can encounter night-only beasts.',
   zh:'查看小地图下方红框中的游戏时间。显示「夜间」时，就有机会遇到只在夜间出现的异兽。',
   highlight:{size:[175,200],box:[16,146,146,50]},
  },
 ];
 const capture=lessons[8];
 capture.pages=[
  {
   art:capture.art,
   body:capture.body,
   en:'The less HP a sealable beast has, the higher your chance of sealing it. Keep it above 0 HP so it can still be captured.',
   zh:'可封印异兽的生命值越低，封印成功率越高。注意别让它的生命值降到 0，否则无法封印。',
  },
  {
   art:'ui/walk-tutorial/09-seal-command.webp',
   body:'เมื่อถึงตาของผู้ผนึก เลือกอสูรเป้าหมายที่ยังมีชีวิต แล้วกดคำสั่ง “ผนึก”',
   en:'On your character’s turn, select the living beast you want to capture and tap Seal.',
   zh:'轮到封印师行动时，选中仍存活的目标异兽，再点击「封印」。',
  },
  {
   art:'ui/walk-tutorial/09-choose-seal.webp',
   body:'เลือกผนึกที่มีในกระเป๋า ดูโอกาสสำเร็จโดยประมาณของแต่ละชนิด แล้วกด “ขว้าง” ที่ผนึกที่ต้องการ',
   en:'Compare the estimated success rates of the seals you have, then tap Throw next to the one you want to use.',
   zh:'比较背包里各类封印道具的预计成功率，再点击所选道具旁的「投掷」。',
  },
 ];
 const forge=lessons[9];
 forge.pages=[
  {
   art:forge.art,
   body:forge.body,
   en:'After defeating the Training Forest boss and returning to town, take the materials you collected to the forge and talk to the smith.',
   zh:'击败训练森林首领并返回城镇后，带着收集到的材料前往锻造坊，与铁匠交谈。',
  },
  {
   art:'ui/walk-tutorial/10-open-forge.webp',
   body:'เลือก “หลอมอุปกรณ์” ตรงกรอบสีแดง เพื่อเปิดรายการสูตรหลอมและวัตถุดิบที่ต้องใช้',
   en:'Select Forge Equipment in the red box to see the recipes and their required materials.',
   zh:'点击红框中的「锻造装备」，查看配方和所需材料。',
   highlight:{size:[486,452],box:[5,107,428,158]},
  },
  {
   art:'ui/walk-tutorial/10-recipe-tabs.webp',
   body:'เลือกแถบชื่อป่าด้านบนเพื่อดูสูตรของแต่ละพื้นที่ จากนั้นตรวจค่าสถานะอุปกรณ์ เลเวลที่ต้องการ และรายการวัตถุดิบ ตัวเลข 2/3 หมายถึงมี 2 ชิ้นจากที่ต้องใช้ 3 ชิ้น',
   en:'Choose a forest tab to see its recipes. Check the equipment stats, level requirement, and materials. A count of 2/3 means you own two of the three pieces needed.',
   zh:'点击顶部的森林标签查看各地配方，再检查装备属性、等级要求和材料。2/3 表示需要 3 件，目前有 2 件。',
   highlight:{size:[580,362],box:[1,7,573,68]},
  },
  {
   art:'ui/walk-tutorial/10-craft-equipment.webp',
   body:'เมื่อมีวัตถุดิบและเหรียญครบตามรายการในกรอบสีส้ม ให้กด “หลอม” ที่วงสีแดงเพื่อสร้างอุปกรณ์ชิ้นนั้น',
   en:'Once you have all the materials and coins listed in the orange box, tap Forge in the red circle to craft the item.',
   zh:'集齐橙框中所列的材料和金币后，点击红圈里的「锻造」制作装备。',
   highlight:{size:[563,446],boxes:[
    {box:[65,395,386,34],color:'#ff9800'},
    {box:[456,245,90,77],shape:'circle'},
   ]},
  },
 ];
 const equipment=lessons[10];
 equipment.pages=[
  {
   art:equipment.art,
   body:equipment.body,
   en:'Open Character in the bottom bar, then select the Equipment tab.',
   zh:'在底栏打开「角色」，然后选择「装备」标签。',
   highlight:{size:[350,365],boxes:[
    {box:[181,24,104,65],shape:'circle'},
    {box:[123,270,89,95],shape:'circle'},
   ]},
  },
  {
   art:'ui/walk-tutorial/11-equipped-items.webp',
   body:'ดูว่าตอนนี้สวมอะไรอยู่ในส่วน “อุปกรณ์ที่สวมใส่” แล้วเลื่อนลงไปที่ “อุปกรณ์ในกระเป๋า” เพื่อเลือกชิ้นที่จะเปลี่ยน',
   en:'Check what you’re wearing under Equipped Items. Scroll down to Equipment in Bag to choose a replacement.',
   zh:'先在「已穿戴装备」查看当前装备，再向下滚动到「背包装备」选择替换的物品。',
  },
  {
   art:'ui/walk-tutorial/11-compare-and-equip.webp',
   body:'เทียบทีละค่าสถานะกับชิ้นที่สวมอยู่ สีเขียวคือค่านั้นดีขึ้น สีแดงคือแย่ลง ใช้อาวุธข้ามอาชีพได้ แต่จะได้รับค่าสถานะจากอาวุธนั้นเพียง 80% เมื่อเลือกแล้วให้กด “สวม” ในวงสีแดง',
   en:'Compare each stat with your current gear. Green means it improves and red means it gets worse. You can equip an off-class weapon, but it grants only 80% of its stats. Tap Equip in the red circle.',
   zh:'逐项与当前装备比较。绿色表示该属性更好，红色表示更差。可以装备跨职业武器，但只获得其 80% 的属性。选好后点击红圈中的「装备」。',
   highlight:{size:[531,280],boxes:[
    {box:[101,6,328,135],color:'#ff790e'},
    {box:[444,35,80,76],shape:'circle'},
   ]},
  },
 ];
 const bandit=lessons[11];
 bandit.pages=[
  {
   art:bandit.art,
   body:bandit.body,
   en:'Watch for the Bandit label on the kingdom map. A bandit may chase and attack you if you get close. Keep your distance or take another route if your team isn’t ready.',
   zh:'在王国地图上留意「盗匪」标记。靠近时，盗匪可能追上来攻击。如果队伍还没准备好，请保持距离或绕路。',
  },
  {
   art:'ui/walk-tutorial/12-bandit-defeat.webp',
   body:'ถ้าแพ้โจรป่า ไอเทมในกระเป๋าอาจถูกยึด และถ้าโชคร้าย อสูรสำรองที่พกอยู่ในกระเป๋าอาจถูกขโมยไปด้วย',
   en:'If you lose to a bandit, items in your bag may be taken. If you’re unlucky, a reserve beast you’re carrying may also be stolen.',
   zh:'如果输给盗匪，背包里的道具可能被抢走。运气不好时，随身携带的后备异兽也可能被偷走。',
  },
 ];
 const shadow=lessons[12];
 shadow.pages=[
  {
   art:shadow.art,
   body:shadow.body,
   en:'Shadow beasts appear in dungeons and on the kingdom map. An encounter draws from the beasts found in that area. The shadow may chase you if you get too close.',
   zh:'影兽会出现在地牢和王国地图中。发生遭遇时，会随机遇到当地可见的异兽。靠得太近，影兽可能会追你。',
  },
  {
   art:'ui/walk-tutorial/13-repellent.webp',
   body:'บนแผนที่ประเทศ กดปุ่ม “เครื่องหอมไล่อสูร” ในวงสีแดงเพื่อป้องกันเงาอสูรวิ่งไล่ระหว่างที่เครื่องหอมออกฤทธิ์ ถ้าเดินเข้าไปชนเองยังต้องต่อสู้ และในดันเจี้ยนเครื่องหอมไม่มีผล',
   en:'On the kingdom map, tap Beast Repellent in the red circle to prevent shadow beasts from chasing you while it lasts. Touching one still starts a fight, and the repellent has no effect in dungeons.',
   zh:'在王国地图上，点击红圈中的「驱兽香」。生效期间影兽不会追你，主动撞上仍会触发战斗。驱兽香在地牢中无效。',
   highlight:{size:[261,212],box:[185,74,69,72],shape:'circle'},
  },
 ];
 const tower=lessons[13];
 tower.pages=[
  {
   art:tower.art,
   body:tower.body,
   en:'At level 8, visit the Martial Tower in town and speak to its keeper.',
   zh:'达到 8 级后，前往城镇中的武道塔，与守塔人交谈。',
  },
  {
   art:'ui/walk-tutorial/14-tower-keeper.webp',
   body:'เลือก “หอคอยประลองยุทธ” ตรงกรอบสีแดง เข้าได้วันละ 1 ครั้ง รีเซ็ตเวลา 00:00 น. ตามเวลาไทย แต่ละรอบเริ่มที่ชั้น 1 และเกมจะบันทึกชั้นสูงสุดที่ผู้เล่นแต่ละคนผ่านได้',
   en:'Select Martial Tower in the red box. You can enter once a day, with a reset at midnight Thailand time. Each run starts on floor 1, and the game records the highest floor each player has cleared.',
   zh:'点击红框中的「武道塔」。每天可进入一次，于泰国时间 00:00 重置。每次从第 1 层开始，系统会记录每位玩家通过的最高楼层。',
   highlight:{size:[477,412],box:[1,44,429,162]},
  },
  {
   art:'ui/walk-tutorial/14-tower-rules.webp',
   body:'ทุก 5 ชั้นมีจุดพักให้เลือก 1 อย่าง เช่น เปิดหีบรับอุปกรณ์ ฟื้น HP/MP ชุบอสูรที่หมดสติ หรือล้างสถานะผิดปกติ ยิ่งผ่านหลายชั้นยิ่งสะสมเงินรางวัล และแต่ละชั้นที่ผ่านครั้งแรกจะได้คูปอง 2 ใบ พร้อมแล้วกด “ยืนยันเข้าหอคอย”',
   en:'Every five floors, choose one rest stop benefit: open a chest for gear, restore HP and MP, revive fainted beasts, or clear status effects. Earn coins as you clear floors, plus two coupons the first time you clear each floor. Tap Confirm Entry when ready.',
   zh:'每通过 5 层可在休息点选择一项：开宝箱获得装备、恢复生命值和魔力、复活昏迷异兽或清除异常状态。通关可累积金币，每层首次通过另得 2 张兑换券。准备好后点击「确认进入武道塔」。',
   highlight:{size:[560,477],box:[10,402,537,74]},
  },
 ];
 const raid=lessons[14];
 raid.pages=[
  {
   art:raid.art,
   body:raid.body,
   en:'At level 10, head to the Sealer Camp in the capital and speak to the camp leader.',
   zh:'达到 10 级后，前往首都的封印师营地，与营地长官交谈。',
  },
  {
   art:'ui/walk-tutorial/15-camp-service.webp',
   body:'เลือก “จู่โจมค่าย” เพื่อจัดทีมและดูค่ายของผู้เล่นอื่นที่สามารถจู่โจมเพื่อชิงเหรียญได้',
   en:'Select Camp Raid to set up your team and see which players’ camps you can raid for coins.',
   zh:'选择「突袭营地」来编队，并查看可以突袭以夺取金币的玩家营地。',
   highlight:{size:[475,443],box:[14,140,403,145]},
  },
  {
   art:'ui/walk-tutorial/15-register-defense.webp',
   body:'ต้องลงทะเบียนทีมป้องกันก่อนจึงจะจู่โจมผู้เล่นอื่นได้ เลือกอสูรที่พกติดตัว แล้วกด “ตั้งอสูรเฝ้าค่าย”',
   en:'Register your camp defense before raiding other players. Choose from the beasts you are carrying, then tap Set Camp Defenders.',
   zh:'突袭其他玩家前，必须先登记营地防守队伍。从随身携带的异兽中选择，然后点击「设置营地守卫」。',
   highlight:{size:[546,576],box:[3,509,539,60]},
  },
  {
   art:'ui/walk-tutorial/15-raid-targets.webp',
   body:'ดูเลเวลและจำนวนเหรียญของเป้าหมาย แล้วกด “จู่โจม” จู่โจมได้วันละ 3 ครั้ง ยิ่งเป้าหมายมีเหรียญมาก ยิ่งชิงเหรียญได้มากเมื่อชนะ ถ้าแพ้จะเสียเหรียญของตัวเอง',
   en:'Check the target’s level and coin balance, then tap Raid. You can raid three times a day. Winning against a richer target earns you more coins. If you lose, you lose some of your own coins.',
   zh:'查看目标的等级和持有金币，再点击「突袭」。每天可突袭 3 次。目标的金币越多，获胜时夺得的金币也越多。战败则会损失自己的部分金币。',
   highlight:{size:[550,396],box:[441,116,87,62]},
  },
 ];
 const autoBattle=lessons[15];
 autoBattle.pages=[
  {
   art:autoBattle.art,
   body:autoBattle.body,
   en:'Tap Team Auto (red) to let both the Sealer and their beasts fight automatically. Tap Beast Auto (orange) to automate only the beasts and keep controlling the Sealer yourself.',
   zh:'点击红圈中的「全队自动」，封印师和异兽都会自动战斗。点击橙圈中的「异兽自动」，只有异兽自动战斗，封印师仍由你操作。',
  },
  {
   art:'ui/walk-tutorial/16-auto-on.webp',
   body:'เมื่อปุ่มขึ้นว่า “เปิด” โหมดนั้นกำลังทำงาน ถ้าอยากกลับมาควบคุมเอง ให้กดปุ่มเดิมอีกครั้งเพื่อปิด',
   en:'When the button says On, that mode is active. Tap the same button again to turn it off and take back control.',
   zh:'按钮显示「开启」时，该模式正在运行。再点一次同一个按钮即可关闭，恢复手动操作。',
  },
 ];
 const villageWar=lessons[16];
 villageWar.pages=[
  {
   art:villageWar.art,
   body:villageWar.body,
   en:'At level 15, travel to an enemy village that borders your kingdom’s territory. Once you arrive, tap Inspect Entrance.',
   zh:'达到 15 级后，走到与本国领地接壤的敌方村庄，点击「查看入口」。',
  },
  {
   art:'ui/walk-tutorial/17-attack-village.webp',
   body:'กดปุ่ม “โจมตี” ที่มีชื่อหมู่บ้านเพื่อเปิดเมนูสงครามอาณาจักร จากนั้นตรวจทีมและยืนยันโจมตี การโจมตีและการลงทะเบียนป้องกันใช้สิทธิ์เดียวกัน เลือกได้วันละ 1 ครั้ง',
   en:'Tap the Attack button with the village name to open Kingdom War. Check your team, then confirm the attack. Attacking and registering to defend share one daily action. You can choose one per day.',
   zh:'点击带有村庄名称的「进攻」按钮，进入王国战争。检查队伍后确认进攻。进攻和登记防守共用每日一次的行动机会，每天只能选一项。',
   highlight:{size:[491,343],box:[17,183,440,65]},
  },
  {
   art:'ui/walk-tutorial/17-war-map.webp',
   body:'ดูแผนที่สงครามอาณาจักรเพื่อเช็กว่าหมู่บ้านแต่ละแห่งเป็นของฝ่ายไหน แล้วหาหมู่บ้านศัตรูที่เชื่อมกับพื้นที่ของอาณาจักรเรา เมื่ออาณาจักรเรายึดเมืองหรือหมู่บ้านได้ ที่นั่นจะเป็นปลายทางให้ใช้ใบเทเลพอร์ตได้ ถ้าเสียพื้นที่นั้นให้ศัตรู ปลายทางนั้นจะหายจากรายการของเรา',
   en:'Use the Kingdom War map to see who controls each village and find enemy villages connected to your kingdom’s territory. When your kingdom captures a city or village, you can use a Teleport Scroll to travel there. If your kingdom loses it, that destination is removed from your list.',
   zh:'查看王国战争地图，确认各村庄归哪一方控制，并找出与本国领地相连的敌方村庄。本国占领城市或村庄后，你可以使用传送卷轴前往该地。失去该领地后，它会从可传送的地点列表中移除。',
  },
  {
   art:'ui/walk-tutorial/17-kingdom-ranks.webp',
   body:'ดูอันดับอาณาจักรรายเดือนในเมนูสงครามอาณาจักร พื้นที่ที่ยึดครองมีคะแนนต่างกัน หมู่บ้าน 1 คะแนน เมือง 4 คะแนน และเมืองหลวง 16 คะแนน',
   en:'Check the monthly kingdom rankings in Kingdom War. Each controlled village is worth 1 point, each city 4 points, and each capital 16 points.',
   zh:'可在王国战争菜单查看王国月度排名。每占领一座村庄计 1 分、一座城市计 4 分、一座首都计 16 分。',
  },
  {
   art:'ui/walk-tutorial/17-village-hall.webp',
   body:'ถ้าต้องการป้องกัน ให้เดินไปที่ว่าการของหมู่บ้านหรือเมืองฝ่ายเราที่ต้องการปกป้อง แล้วคุยกับเจ้าหน้าที่',
   en:'To defend, go to the hall of the friendly village or city you want to protect and speak to the official there.',
   zh:'如果选择防守，就前往想保护的己方村庄或城市的政务厅，与那里的官员交谈。',
  },
  {
   art:'ui/walk-tutorial/17-war-service.webp',
   body:'เลือก “สงครามอาณาจักร” ในกรอบสีแดงเพื่อเปิดหน้าลงทะเบียนป้องกัน',
   en:'Select Kingdom War in the red box to open the defense registration screen.',
   zh:'点击红框中的「王国战争」，打开防守登记页面。',
   highlight:{size:[510,547],box:[25,97,413,170]},
  },
  {
   art:'ui/walk-tutorial/17-register-defense.webp',
   body:'ตรวจชื่อหมู่บ้านหรือเมือง แล้วกด “ลงทะเบียนป้องกัน” เพื่อใช้สิทธิ์วันนี้ ถ้าลงทะเบียนแล้วจะโจมตีไม่ได้ในวันเดียวกัน',
   en:'Check the village or city name and tap Register Defense to use your daily action. Once registered, you cannot attack on the same day.',
   zh:'确认村庄或城市的名称后，点击「登记防守」使用今日行动机会。登记后当天无法再进攻。',
   highlight:{size:[523,322],box:[10,253,500,63]},
  },
 ];
 const guild=lessons[17];
 guild.pages=[
  {
   art:guild.art,
   body:guild.body,
   en:'At level 20, go to the Guild Castle in the capital and speak to the guild official.',
   zh:'达到 20 级后，前往首都的公会城堡，与公会管理员交谈。',
  },
  {
   art:'ui/walk-tutorial/18-guild-service.webp',
   body:'กด “ติดต่อกิล” ในกรอบแดง แล้วเปิด “ค้นหาและสมัครเข้ากิล” เลือกกิลที่สนใจ ส่งคำขอ แล้วรอหัวหน้ากิลอนุมัติ',
   en:'Tap Contact Guild in the red box, then open Find and Apply to a Guild. Choose a guild, send your request, and wait for its leader to approve it.',
   zh:'点击红框中的「联系公会」，再打开「查找并申请加入公会」。选择想加入的公会，提交申请后等待会长批准。',
  },
  {
   art:'ui/walk-tutorial/18-guild-war.webp',
   body:'เมื่อเป็นสมาชิกแล้ว ให้เปิด “สงครามกิล” ในวงแดงเพื่อดูคู่แข่งและจัดทีม สงครามกิลเปิดทุกวันเสาร์ตามเวลาไทย และสมาชิกแต่ละคนโจมตีได้ 1 ครั้งต่อรอบ',
   en:'Once you are a member, open Guild War in the red circle to see opponents and prepare your team. Guild War opens every Saturday, Thailand time. Each member can attack once per event.',
   zh:'加入公会后，打开红圈中的「公会战」查看对手并编队。公会战于泰国时间每周六开放，每名成员每场活动可进攻一次。',
  },
 ];
 const gacha=lessons[18];
 gacha.pages=[
  {
   art:gacha.art,
   body:gacha.body,
   en:'After your first defeat in the Martial Tower, visit the Gachapon Machine in the capital. You earn two coupons for each floor you clear for the first time.',
   zh:'首次在武道塔战败后，可以前往首都的扭蛋机。每层首次通关时可获得 2 张兑换券。',
  },
  {
   art:'ui/walk-tutorial/19-gacha-service.webp',
   body:'กด “เปิดเมนูกาชาปอง” ในกรอบสีแดง',
   en:'Tap Open Gachapon Menu in the red box.',
   zh:'点击红框中的「打开扭蛋菜单」。',
  },
  {
   art:'ui/walk-tutorial/19-gacha-draw.webp',
   body:'ดูคูปองที่มี แล้วเลือก “สุ่ม 1 ครั้ง” หรือ “สุ่ม 10 ครั้ง” ใช้คูปอง 1 ใบต่อการสุ่ม 1 ครั้ง กด “ตรวจคูปอง” เพื่ออัปเดตยอด',
   en:'Check your coupon balance, then choose Draw 1 or Draw 10. Each draw costs one coupon. Tap Refresh Coupons to update your balance.',
   zh:'查看兑换券余额，然后选择「抽 1 次」或「抽 10 次」。每抽消耗 1 张兑换券。点击「刷新兑换券」可更新余额。',
  },
  {
   art:'ui/walk-tutorial/19-gacha-cards.webp',
   body:'เมื่อไพ่ปรากฏครบ ให้แตะเปิดทีละใบ หรือกด “เปิดทุกใบ” เพื่อดูรางวัลทั้งหมดพร้อมกัน',
   en:'Once the cards are dealt, tap to reveal them one at a time, or select Reveal All to see every reward at once.',
   zh:'发牌结束后，点按卡牌可逐张翻开，也可选择「全部翻开」一次查看所有奖励。',
  },
  {
   art:'ui/walk-tutorial/19-gacha-rewards.webp',
   body:'เปิดไพ่แล้วจะเห็นชื่อและประเภทของรางวัลที่ได้รับ เช่น อุปกรณ์หรืออสูร',
   en:'Revealed cards show the name and type of each reward, such as gear or beasts.',
   zh:'翻开卡牌后，可以查看每项奖励的名称和类型，例如装备或异兽。',
  },
 ];
 const towerDefeated=player=>player?.towerRun?.active===false&&player.towerRun.outcome==='lose';
 const worldBoss=lessons[19];
 worldBoss.pages=[
  {art:worldBoss.art,body:worldBoss.body,en:'Speak to the official at the capital’s government hall and select World Boss in the red box. Create a room or join an existing party to fight the World Boss with up to four players in total.',zh:'在首都政务厅与官员交谈，然后选择红框中的「世界首领」。创建房间或加入已有队伍，最多可由 4 名玩家一起挑战世界首领。',highlight:{size:[428,575],box:[15,167,361,146]}},
  {
   art:'ui/walk-tutorial/20-world-boss-rewards.webp',
   body:'ดูคะแนนการต่อสู้ที่ด้านบนของหน้าจอ ยิ่งทำคะแนนได้สูง ยิ่งได้เหรียญและ EXP มากขึ้น และมีโอกาสได้รางวัลที่มีค่ามากขึ้นด้วย',
   en:'Check your battle score at the top of the screen. A higher score earns more coins and EXP and improves your chances of getting more valuable rewards.',
   zh:'战斗分数显示在画面上方。分数越高，获得的金币和经验越多，也越有机会获得更丰厚的奖励。',
  },
 ];
 const colosseum=lessons[20];
 colosseum.pages=[
  {
   art:colosseum.art,
   body:colosseum.body,
   en:'At level 22, find the Colosseum on the kingdom map. Walk to its entrance and tap to enter.',
   zh:'达到 22 级后，在王国地图上找到竞技场，走到入口并点击进入。',
  },
  {
   art:'ui/walk-tutorial/21-colosseum-modes.webp',
   body:'เลือก “โหมดทีม” เพื่อลงแข่งเป็นฝ่ายไพลินหรือทับทิม หรือเลือก “เอาตัวรอด” เพื่อแข่งจนเหลือผู้รอดชีวิตคนสุดท้าย จากนั้นเลือกเล่นห้องปกติ จัดอันดับ หรือทดลองเล่นกับบอท',
   en:'Choose Team mode to fight for Sapphire or Ruby, or choose Survival to compete to be the last player standing. Then pick a casual room, ranked play, or practice with bots.',
   zh:'选择「团队」模式，为蓝宝石队或红宝石队作战；也可选择「生存」模式，争当最后一名幸存者。接着选择普通房间、排位赛或人机练习。',
  },
  {
   art:'ui/walk-tutorial/21-colosseum-shields.webp',
   body:'เมื่อเล่นจัดอันดับ คะแนนจะกำหนดระดับโล่ของคุณ ดูช่วงคะแนนของแต่ละระดับได้ที่ “ลำดับโล่จัดอันดับ” ในหน้าโคลอสเซียม',
   en:'Your ranked score determines your shield tier. See the points required for each tier under Ranked Shield Tiers on the Colosseum screen.',
   zh:'排位积分决定你的徽盾等级。可在竞技场页面的「排位徽盾等级」中查看各级所需的积分。',
  },
 ];
 const kingdomBoss=lessons[21];
 kingdomBoss.pages=[
  {
   art:kingdomBoss.art,
   body:kingdomBoss.body,
   en:'The Kingdom Boss spawns at 10:00 and 22:00 Thailand time. When the test schedule is enabled, it also spawns at 12:00, 14:00, 16:00, 18:00, and 20:00. Each round lasts one hour. The announcement shows the boss and its kingdom.',
   zh:'王国首领在泰国时间 10:00 和 22:00 出现。启用测试时段时，还会在 12:00、14:00、16:00、18:00 和 20:00 出现。每轮开放一小时。公告会显示首领及其所在王国。',
  },
  {
   art:'ui/walk-tutorial/22-kingdom-boss-minimap.webp',
   body:'ไปยังแผนที่ประเทศที่ระบุในประกาศ มองหาจุดแดงบนมินิแมป แล้วเดินไปหาบอสเพื่อเข้าต่อสู้',
   en:'Go to the kingdom map named in the announcement. Find the red dot on the minimap and approach the boss to fight.',
   zh:'前往公告中指定的王国地图，在小地图上寻找红点，靠近首领即可交战。',
  },
  {
   art:'ui/walk-tutorial/22-kingdom-boss-rewards.webp',
   body:'ผู้ที่โจมตีปิดฉากบอสอาณาจักรจะได้รับอสูรตัวนั้น ผู้เล่นจากอาณาจักรเดียวกับผู้ปิดฉากที่มีส่วนร่วมในรอบนั้นจะได้รับรางวัลทางจดหมายด้วย',
   en:'The player who lands the finishing blow receives the boss as a beast. Players from that same kingdom who took part in the event also receive rewards by mail.',
   zh:'打出最后一击的玩家将获得该首领作为异兽。同属该玩家王国且参与本轮活动的玩家也会通过邮件收到奖励。',
  },
 ];
 const promotion=lessons[22];
 promotion.pages=[
  {
   art:promotion.art,
   body:promotion.body,
   en:'At level 25, speak to the coordinator at your own capital’s government hall. Choose Talk About Quests and accept the Level 25 Class Promotion Trial.',
   zh:'达到 25 级后，前往本国首都的政务厅，与协调员交谈。选择「讨论任务」，领取「25 级职业进阶试炼」。',
  },
  {
   art:'ui/walk-tutorial/23-promotion-track.webp',
   body:'เปิดเมนู “เควส” ที่แถบล่าง เลือก “รายการเควสที่กำลังทำ” แล้วกด “ติดตามเควส” ข้างบททดสอบ ดูเครื่องหมาย X สีเหลืองบนแผนที่เมื่อเควสมีจุดหมายระบุไว้',
   en:'Open Quests in the bottom bar, choose Active Quests, and tap Track Quest next to the trial. Look for a yellow X on the map when the quest has a marked destination.',
   zh:'打开底栏的「任务」，选择「进行中的任务」，再点击试炼旁的「追踪任务」。任务有明确目的地时，可查看地图上的黄色 X 标记。',
  },
  {
   art:'ui/walk-tutorial/23-promotion-report.webp',
   body:'เอาชนะเงาอสูร 5 กลุ่มบนแผนที่ประเทศของตัวเอง แล้วคุยกับช่างหลอมในเมืองหลวงเพื่อขอคำรับรอง เมื่อครบแล้วให้กลับไปหาผู้ประสานงานคนเดิม กด “รายงานผลและรับรางวัล”',
   en:'Defeat five groups of Shadow Beasts on your own kingdom map, then speak to the capital’s smith for certification. Return to the same coordinator and select Report and Claim Reward.',
   zh:'先在本国地图上击败 5 群影兽，再与首都的铁匠交谈取得证明。完成后回到原来的协调员处，选择「报告结果并领取奖励」。',
  },
  {
   art:'ui/walk-tutorial/23-promotion-choose.webp',
   body:'หลังรายงานเควสแล้ว เปิดเมนู “ตัวละคร” แล้วดูหัวข้อ “เลื่อนอาชีพได้แล้ว!” อ่านรายละเอียดของแต่ละสาย กด “เลือก” ที่สายที่ต้องการ แล้วยืนยันเพื่อเปลี่ยนเป็นอาชีพขั้น 2',
   en:'After turning in the quest, open Character and find the Class Promotion Available section. Read the options, tap Choose on the class you want, and confirm to advance to tier 2.',
   zh:'交付任务后，打开「角色」，找到「可以进阶职业」一栏。查看各职业路线，点击想要的职业旁的「选择」，确认后即可进阶为二阶职业。',
  },
 ];
 const guildWar=lessons[23];
 guildWar.pages=[
  {
   art:guildWar.art,
   body:guildWar.body,
   en:'At level 35, go to the Guild Castle in your capital. Select Contact Guild, then Guild War. Before taking part, join a guild and set your camp defenders.',
   zh:'达到 35 级后，前往本国首都的公会城堡。选择「联系公会」，再打开「公会战」。参战前须加入公会并设置营地守卫。',
  },
  {
   art:'ui/walk-tutorial/24-guild-war-team.webp',
   body:'ที่ “เลือกอสูรโจมตีสงครามกิล” ให้แตะอสูรที่พกติดตัวเพื่อจัดทีม ดูจำนวนที่เลือกได้ตามอาชีพจากตัวเลขด้านบน แล้วตรวจเครื่องหมาย ✓ บนตัวที่ต้องการส่งลงสู้',
   en:'Under Choose Beasts for Guild War, tap the beasts you are carrying to set your team. Check the limit shown above the cards for your class and look for a check mark on each selected beast.',
   zh:'在「选择公会战出战异兽」中，点按随身携带的异兽来编队。查看卡牌上方显示的职业出战上限，并确认要出战的异兽带有勾选标记。',
  },
  {
   art:'ui/walk-tutorial/24-guild-war-targets.webp',
   body:'เลื่อนลงไปที่ “เลือกกิลที่ต้องการโจมตี” เลือกกิลคู่แข่งที่เลเวลกิลต่างจากของเราไม่เกิน 1 แล้วกด “สุ่มคู่ต่อสู้และโจมตี”',
   en:'Scroll to Choose a Guild to Attack. Pick a rival guild within one guild level of yours and tap Randomize Opponent and Attack.',
   zh:'向下滑到「选择要进攻的公会」，选一个与本公会等级相差不超过 1 级的对手，再点击「随机匹配对手并进攻」。',
  },
  {
   art:'ui/walk-tutorial/24-guild-war-confirm.webp',
   body:'กด “ยืนยัน” เพื่อใช้สิทธิ์ เกมจะสุ่มสมาชิกจากกิลที่เลือกแล้วสู้ให้อัตโนมัติ สงครามกิลเปิดทุกวันเสาร์ 00:00–23:59 น. ตามเวลาไทย สมาชิกโจมตีได้คนละ 1 ครั้งต่อวันเสาร์',
   en:'Tap Confirm to use your attack. The game picks a member of the chosen guild at random and runs the battle automatically. Guild War is open every Saturday, 00:00–23:59 Thailand time. Each member gets one attack per Saturday.',
   zh:'点击「确认」使用进攻机会。系统会从选定公会随机抽取一名成员，并自动进行战斗。公会战每周六泰国时间 00:00–23:59 开放，每名成员每周六可进攻 1 次。',
  },
 ];
 const dungeon=lessons[24];
 dungeon.pages=[
  {
   art:dungeon.art,
   body:dungeon.body,
   en:'At level 20, go to the Akkhanibanphot kingdom map. Look for the cave entrance marked Seven-Floor Labyrinth and walk up to it.',
   zh:'达到 20 级后，前往阿卡尼班波特王国地图，找到「七层迷宫」的洞口并靠近。',
  },
  {
   art:'ui/walk-tutorial/25-dungeon-inspect.webp',
   body:'กด “สำรวจทางเข้า” แล้วเลือก “เข้าหน้าเตรียมทีมดันเจี้ยน” ในกรอบแดง',
   en:'Tap Inspect Entrance, then select Prepare Dungeon Team in the red box.',
   zh:'点击「查看入口」，再选择红框中的「进入地下城组队页面」。',
   highlight:{size:[382,300],box:[18,161,330,54]},
  },
  {
   art:'ui/walk-tutorial/25-dungeon-modes.webp',
   body:'กด “เข้าดันเจี้ยนคนเดียว” เพื่อเริ่มเอง หรือเลือกเพื่อนออนไลน์ 1 คนที่เลเวลต่างกันไม่เกิน 10 ให้มาช่วยในโหมดเดี่ยว ถ้าจะเดินและเล่นพร้อมกัน ให้เลือก “สร้างหรือเข้าร่วมปาร์ตี้ออนไลน์ (2–4 คน)”',
   en:'Select Enter Dungeon Solo to go alone, or choose one online friend within 10 levels of you to assist in solo mode. To explore and play together, select Create or Join Online Party (2–4 Players).',
   zh:'选择「单人进入地下城」可独自探索，也可以选一名等级相差不超过 10 级的在线好友协助单人模式。想一起探索和战斗，请选择「创建或加入在线队伍（2–4 人）」。',
  },
  {
   art:'ui/walk-tutorial/25-dungeon-floor-one.webp',
   body:'เริ่มที่ชั้น 1 เหมืองสายแร่ แตะมินิแมปมุมขวาบนเพื่อดูแผนที่เขาวงกต เมื่อชนะบอสของชั้นแล้ว ให้สำรวจประตูเพื่อไปชั้นถัดไป',
   en:'You start on Floor 1, the Ore Mine. Tap the minimap at the upper right to see the maze. After defeating the floor boss, inspect the door to proceed to the next floor.',
   zh:'从第 1 层矿脉矿洞开始。点按右上角的小地图查看迷宫。击败本层首领后，查看通往下一层的门并继续前进。',
  },
 ];
 const translations={
  board:['Accepting quests','Go to the quest board in the capital and tap Inspect to see available quests.','领取任务','走到首都的任务公告板前，点击「调查」查看可领取的任务。'],
  trackMenu:['Quest menu and tracking','Tap the Quests icon in the bottom bar.','任务菜单与追踪','点击底栏中的「任务」图标。'],
  stats:['Leveling up and allocating character and beast points','Open Character and select Stats to allocate points.','角色和异兽升级与加点','打开「角色」，选择「属性」来分配点数。'],
  shop:['Buying equipment, potions, seals, and teleport scrolls','Talk to the merchant in town to browse their goods.','购买装备、药剂、封印道具和传送卷轴','与城镇商人交谈以查看商品。'],
  enterForest:['Entering a forest','Inspect the entrance to see what is inside.','进入森林','调查入口可查看森林详情。'],
  walkForest:['Exploring a forest','Choose a path to move deeper.','探索森林','选择一条路继续深入。'],
  hospital:['Getting treatment at the hospital','Visit the healer to recover.','在医院接受治疗','前往医院找治疗师恢复。'],
  capture:['Seal a beast','Lower a sealable beast’s HP without defeating it. On the Sealer’s turn, choose Seal and select a seal from your bag.','封印异兽','先降低可封印异兽的生命值，别把它击倒。在封印师回合选择「封印」，再选择背包中的封印道具。'],
  forge:['Forging equipment','Take your materials to the town forge after defeating the Training Forest boss.','锻造装备','击败训练森林首领后，带着材料前往城镇的锻造坊。'],
  equip:['Equipping gear','Open Character and select Equipment.','穿戴装备','打开「角色」，选择「装备」。'],
  bandit:['Bandits','Watch for bandits on the kingdom map.','盗匪','在王国地图上留意盗匪。'],
  shadow:['Shadow beasts','Shadow beasts can chase you when you get close.','影兽','靠近影兽时，它们可能会追你。'],
  night:['Nightfall','Some beasts appear only at night.','夜幕降临','部分异兽只会在夜间出现。'],
  tower:['Martial Tower','Visit the tower in town and speak to its keeper.','武道塔','前往城镇的武道塔，与守塔人交谈。'],
  auto:['Auto Battle','Team Auto controls both the Sealer and their beasts. Beast Auto controls only the beasts.','自动战斗','「全队自动」会接管封印师和异兽。「异兽自动」只接管异兽。'],
  raid:['Camp Raid','At level 10, head to the Sealer Camp in the capital and speak to the camp leader.','突袭营地','达到 10 级后，前往首都的封印师营地，与营地长官交谈。'],
  village:['Attacking an enemy village','At level 15, travel to an enemy village that borders your kingdom’s territory. Once you arrive, tap Inspect Entrance.','进攻敌国村庄','达到 15 级后，走到与本国领地接壤的敌方村庄，点击「查看入口」。'],
  guild:['Joining a Guild and Guild War','At level 20, go to the Guild Castle in the capital and speak to the guild official.','加入公会与参加公会战','达到 20 级后，前往首都的公会城堡，与公会管理员交谈。'],
  gacha:['Gachapon Machine','After your first defeat in the Martial Tower, visit the Gachapon Machine in the capital. You earn two coupons for each floor you clear for the first time.','扭蛋机','首次在武道塔战败后，可以前往首都的扭蛋机。每层首次通关时可获得 2 张兑换券。'],
  colosseum:['Colosseum',colosseum.pages[0].en,'竞技场',colosseum.pages[0].zh],
  promotion:['Tier 2 Class Promotion Quest',promotion.pages[0].en,'二阶职业进阶任务',promotion.pages[0].zh],
  kingdom:['Kingdom Boss',kingdomBoss.pages[0].en,'王国首领',kingdomBoss.pages[0].zh],
  world:['World Boss',worldBoss.pages[0].en,'世界首领',worldBoss.pages[0].zh],
  guildwar:['Join Guild War',guildWar.pages[0].en,'参加公会战',guildWar.pages[0].zh],
  dungeon:['Enter the Seven-Floor Labyrinth',dungeon.pages[0].en,'进入七层迷宫',dungeon.pages[0].zh],
 };
 function language(){return g.SoulbeastLocale?.get();}
 function tr(th,en,zh){return ({en,'zh-CN':zh})[language()]??th;}
 const asset='/Soulbeast/assets/',prefix='soulbeast-walk-tutorial-v1:',playerKey='soulbeast-walk-preview-player-v1';
 const memory=new Map();
 function characterKey(p){
  const id=p?.code||p?.characterId||p?.walkId;
  return id?prefix+id:null;
 }
 function progressStorage(){return typeof walkStorage==='undefined'?g.localStorage:walkStorage;}
 function localSeen(key){
  try{return {...memory.get(key),...JSON.parse(progressStorage().getItem(key)||'null')}}
  catch{return memory.get(key)||{}}
 }
 function seenFor(p){
  const key=characterKey(p);if(!key)return {};
  const old=[...new Set([p.walkId,p.characterId])].filter(id=>id&&id!=='island-preview-v1'&&prefix+id!==key).map(id=>localSeen(prefix+id));
  const seen=Object.assign({},...old,localSeen(key));
  for(const {id} of lessons)if(p.walkTutorialSeen?.[id]===true||old.some(record=>record[id]===true))seen[id]=true;
  if(lessons.some(({id})=>seen[id]===true&&p.walkTutorialSeen?.[id]!==true))store(p,seen);
  return seen;
 }
 function store(p,seen){
  const key=characterKey(p);if(!key)return;
  memory.set(key,seen);
  try{progressStorage().setItem(key,JSON.stringify(seen))}catch{}
  const completed=Object.fromEntries(lessons.filter(({id})=>seen[id]===true).map(({id})=>[id,true]));
  if(!Object.keys(completed).length)return;
  p.walkTutorialSeen={...p.walkTutorialSeen,...completed};
  try{
   const active=JSON.parse(g.sessionStorage.getItem(playerKey)||'null');
   if(characterKey(active)!==key||Object.keys(completed).every(id=>active.walkTutorialSeen?.[id]===true))return;
   active.walkTutorialSeen={...active.walkTutorialSeen,...completed};
   const serialized=JSON.stringify(active);
   g.sessionStorage.setItem(playerKey,serialized);
   if(active.walkId)progressStorage().setItem('soulbeast-walk-save:'+active.walkId,serialized);
   g.dispatchEvent(new Event('walk-player-saved'));
   if(g.parent!==g)g.parent.postMessage({type:'walk-player-saved'},g.location.origin);
  }catch{}
 }
 function choose(p,seen,{capital=false,town=false,capitalDeparture=false,night=false}={}){
  if(!p||p.tutorial?.enabled===false)return null;
  if(capitalDeparture&&!seen.enterForest)return forest;
  if(night&&!seen.night)return nightfall;
  if((capital||town)&&!seen.forge&&Number(p.forestClears?.[7])>0)return forge;
  if((town||capital)&&!seen.gacha&&towerDefeated(p))return gacha;
  const quests=p.worldQuests||{},hasQuest=Object.keys(quests.accepted||{}).length>0||Object.keys(quests.completed||{}).length>0;
  const starter=(p.lv||0)<=5;
  const allow={
   board:capital&&starter&&!hasQuest,
   trackMenu:Object.keys(quests.accepted||{}).length>0&&!(seen.track&&seen.marker),
   stats:(starter&&hasQuest)||(!starter&&(p.free>0||p.pets?.some(beast=>beast.free>0))),
   shop:seen.stats&&(starter||p.lv<=8),
  };
  return lessons.find(l=>l!==autoBattle&&!seen[l.id]&&(l.level?p.lv>=l.level:allow[l.id]))||null;
 }
 function node(tag,cls,content){
  const el=g.document.createElement(tag);if(cls)el.className=cls;if(content)el.textContent=content;return el;
 }
 function show(lesson,{review=false,presented=()=>{},done=()=>{},dismiss=()=>{}}={}){
  const doc=g.document;if(doc.querySelector('.walk-lesson'))return;
  if(!doc.getElementById('walk-lesson-style')){
   const sheet=node('link');sheet.id='walk-lesson-style';sheet.rel='stylesheet';sheet.href='/Soulbeast/tools/town-walk-demo/walk-tutorial.css?v=5';doc.head.append(sheet);
  }
  const dialog=node('dialog','walk-lesson'),card=node('article'),header=node('div','walk-lesson-top');
  dialog.dataset.lesson=lesson.id;
  dialog.setAttribute('aria-labelledby','walk-lesson-title');
  const step=node('p','walk-lesson-step'),title=node('h2'),image=node('img'),illustration=node('div','walk-lesson-picture'),caption=node('p','walk-lesson-caption'),controls=node('div','walk-lesson-controls');
  const pageLabel=node('p','walk-lesson-step');
  pageLabel.setAttribute('aria-live','polite');
  const highlightFrame=node('div','walk-lesson-highlight-frame');
  const highlightBox=node('span','walk-lesson-highlight-box');
  highlightFrame.setAttribute('aria-hidden','true');
  highlightFrame.append(highlightBox);
  title.id='walk-lesson-title';image.alt='';illustration.append(image,highlightFrame);
  const close=node('button','walk-lesson-confirm',review?tr('ปิดคู่มือ','Close guide','关闭指南'):tr('รับทราบ','Got it','知道了'));
  const previous=node('button'),next=node('button');
  close.type=previous.type=next.type='button';
  let index=lesson.number-1,pageIndex=0,acknowledged=false;
  // A lesson may supply pages with their own artwork and localized text.
  const pagesFor=l=>l.pages?.length?l.pages:[l];
  const focusControls=()=> (next.hidden||next.disabled?close:next).focus({preventScroll:true});
  close.onclick=()=>{
   acknowledged=!review&&pageIndex===pagesFor(lessons[index]).length-1;
   dialog.close();
  };
  previous.onclick=()=>{
   if(pageIndex>0)pageIndex--;
   else if(review&&index>0){
    index--;
    pageIndex=pagesFor(lessons[index]).length-1;
   }
   render();
   if(previous.hidden||previous.disabled)focusControls();
  };
  next.onclick=()=>{
   if(pageIndex+1<pagesFor(lessons[index]).length)pageIndex++;
   else if(review&&index+1<lessons.length){
    index++;
    pageIndex=0;
   }
   render();
   if(next.hidden||next.disabled)focusControls();
  };
  controls.append(previous,next,close);
  header.append(step,title,pageLabel);card.append(header,illustration,caption,controls);dialog.append(card);
  function render(){
   const l=lessons[index],pages=pagesFor(l),page=pages[pageIndex];
   const first=pageIndex===0,last=pageIndex===pages.length-1;
   step.textContent=tr('คู่มือผู้ผนึก','Sealer’s Guide','封印师指南')+' · '+l.number+'/'+lessons.length+(l.level?' · Lv '+l.level:'');
   pageLabel.hidden=pages.length===1;
   pageLabel.textContent=tr('หน้า','Page','页')+' '+(pageIndex+1)+' / '+pages.length;
   const [enTitle,enBody,zhTitle,zhBody]=translations[l.id];
   title.textContent=tr(l.title,enTitle,zhTitle);
   image.src=asset+page.art;
   highlightFrame.hidden=!page.highlight;
   highlightBox.replaceChildren();
   if(page.highlight){
    const {size:[width,height],boxes=[page.highlight]}=page.highlight;
    highlightBox.style.setProperty('--art-ratio',width/height);
    highlightBox.style.aspectRatio=width+'/'+height;
    for(const {box:[x,y,w,h],shape,color} of boxes){
     const marker=node('span','walk-lesson-highlight-border');
     marker.style.left=x/width*100+'%';
     marker.style.top=y/height*100+'%';
     marker.style.width=w/width*100+'%';
     marker.style.height=h/height*100+'%';
     if(shape)marker.dataset.shape=shape;
     if(color)marker.style.setProperty('--highlight-color',color);
     highlightBox.append(marker);
    }
   }
   caption.textContent=page===l?tr(l.body,enBody,zhBody):tr(page.body,page.en??page.body,page.zh??page.body);
   previous.hidden=!review&&pages.length===1;
   previous.disabled=first&&(!review||index===0);
   previous.textContent=first&&review?tr('บทก่อนหน้า','Previous lesson','上一课'):tr('หน้าก่อนหน้า','Previous page','上一页');
   next.hidden=!review&&last;
   next.disabled=last&&(!review||index===lessons.length-1);
   next.textContent=last&&review?tr('บทถัดไป','Next lesson','下一课'):tr('หน้าถัดไป','Next page','下一页');
   close.hidden=!review&&!last;
   dialog.scrollTop=0;
  }
  render();doc.body.append(dialog);
  dialog.addEventListener('close',()=>{
   dialog.remove();
   if(acknowledged)done();
   else if(!review)dismiss();
  },{once:true});
  dialog.showModal();presented();focusControls();
  return dialog;
 }
 function mount({read,capital=false,town=false,capitalDeparture=false,observesNight=false,blocked,stop}){
  let after=Date.now()+1100;
  const frame=()=>{
   const doc=g.document,now=Date.now();
   if(doc.visibilityState==='hidden')return;
   const p=read();if(!characterKey(p)||p.tutorial?.enabled===false)return;
   let seen=seenFor(p);
   if(seen.startLevel==null){
    seen={...seen,startLevel:Number(p.lv)||1};
    // Lessons below the current level stay in the guide for existing characters.
    for(const l of lessons)if(l!==autoBattle&&l.level&&l.level<seen.startLevel)seen[l.id]=true;
    store(p,seen);
   }
   if(observesNight&&!seen.nightPending&&!seen.night&&g.SoulBeastClock?.at(now).phase==='night'){
    seen={...seen,nightPending:true};store(p,seen);
   }
   if(now<after||blocked()||doc.querySelector('dialog[open]')||doc.documentElement.hasAttribute('data-event-announcement-open'))return;
   const lesson=choose(p,seen,{capital,town,capitalDeparture,night:seen.nightPending});
   if(!lesson)return;
   stop();
   show(lesson,{
    presented:()=>store(p,{...seenFor(p),[lesson.id]:true}),
    done:()=>{after=Date.now()+15_000},
    dismiss:()=>{after=Date.now()+15_000},
   });
  };
  g.setInterval(frame,600);
 }
 function showOnce(player,lesson){
  if(!characterKey(player)||player.tutorial?.enabled===false||seenFor(player)[lesson.id])return;
  return show(lesson,{presented:()=>store(player,{...seenFor(player),[lesson.id]:true})});
 }
 function onEquipmentAvailable(player,catalog){
  const canEquip=player?.owned?.some(id=>{
   const item=catalog[id];
   return item&&item.lv<=player.lv&&player.eq?.[item.slot]!==id;
  });
  if(canEquip)return showOnce(player,equipment);
 }
 function watchShadowSight({actors,visible,read,stop}){
  let nextCheck=0;
  return ()=>{
   const now=g.performance.now();
   if(now<nextCheck)return false;
   nextCheck=now+350;
   for(const actor of actors()){
    if(!visible(actor))continue;
    if(!showOnce(read(),shadow))return false;
    nextCheck=now+15000;
    stop();
    return true;
   }
   return false;
  };
 }
 const api={
  lessons,choose,mount,
  onTrainingForestEnter:(player,zoneId)=>zoneId===7?showOnce(player,forestWalk):undefined,
  onHospitalArrival:player=>showOnce(player,hospital),
  onEquipmentAvailable,
  onBanditSight:player=>showOnce(player,bandit),
  watchShadowSight,
  dismissShadow:()=>g.document.querySelector('.walk-lesson[data-lesson="shadow"][open]')?.close(),
  onForestCaptureOpportunity:(player,enemies,sealable)=>{
   if(enemies.some(enemy=>enemy.hp>0&&enemy.hp<enemy.st?.hp*.4&&sealable(enemy)))return showOnce(player,capture);
  },
  onTowerDefeat:player=>towerDefeated(player)?showOnce(player,gacha):undefined,
  onAutoBattleEnter:player=>Number(player?.lv)>=autoBattle.level?showOnce(player,autoBattle):undefined,
  battleLessonActive:()=>!!g.document.querySelector('.walk-lesson[data-lesson="capture"][open],.walk-lesson[data-lesson="auto"][open]'),
  active:()=>!!g.document.querySelector('.walk-lesson[open]'),
  review:()=>show(lessons[0],{review:true}),
 };
 g.WalkTutorial=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
