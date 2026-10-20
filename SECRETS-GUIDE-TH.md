# สถานที่ลับและคำสัญญา

## วิธีเล่น
- เมื่อเข้าป่ารอบใหม่ สุ่มว่าจะพบทางลับหรือไม่หนึ่งครั้ง หากพบจะอยู่ที่ทางแยกความลึก5–8 (ชั้นที่เลือกเข้าไป) เลือกผ่านได้ มีทางปกติเสมอ
- ป่าแสงจันทร์3%, หุบเขาหมอกเซียน10%, ทะเลทรายสุสานทอง10%, ยอดเขามังกรหลับ3%, แดนสวรรค์ล่มสลาย5%, ปราสาทจอมมาร1% พื้นที่ฝึกไม่สุ่ม
- อ่านคำใบ้ ไขตรา ประลองหรือเจรจา แล้วเลือกคำสัญญา ผู้เฝ้าประลองเป็นเงาผนึกไม่ได้ ไม่มี EXP/ของ/คะแนนจากการประลองซ้ำ แพ้ไม่เสียเงิน/EXPและกลับมาเจรจาได้
- รางวัลและคำสัญญาหลักรับได้ครั้งเดียวต่อสถานที่ กลับไปเยือนซ้ำไม่เปลี่ยนคำสัญญา ไม่แจกซ้ำ
- ผลช่วยเหลือที่ตกลงไว้จะเกิดในป่าที่ระบุครั้งถัดไป ช่วยเปิดจุดพักหรือฟื้นพลัง ไม่เพิ่มค่าสถานะถาวรของโหมดออนไลน์
- เปิดบันทึกสถานที่ลับจากบันทึกแห่งพันผนึกหรือคู่มือ ดูคำสัญญา ความไว้ใจ และจัดการภาระด้วยเงินหรือแรงอาสาได้
- จบเรื่องหลัก ค้นเรื่องครบ6แห่ง และคืนภาระทั้งหมด จะอ่านบทส่งท้ายลับเพิ่มเติมได้ เรื่องหลักและรางวัลจอมมารเดิมยังอยู่ครบ ผู้ไม่พบสถานที่ลับก็จบเกมได้

## Canon ที่ใช้
คงธาราเทพเป็นผู้มอบผนึก จอมมารเป็นอดีตผู้พิทักษ์ผู้กลัวความสูญเสีย และหัวใจรัตติกาลเป็นสิ่งที่ต้องหยุด ไม่มีการเพิ่มอัลเดน/มาลธารอส ผู้บงการใหม่ หรือปีของสงครามให้เป็นข้อเท็จจริง เนื้อหาลับเป็นร่องรอยของความไว้ใจ การดูแล และการครอบครอง ไม่มีการอ้างว่าเรียกคนตายกลับมามีชีวิตจริง

## โครงสร้างสำหรับพัฒนา
- content/secrets.js: SECRET_LOCATIONS factory,6definitions, event IDs/chain, dialogue, puzzles, typed conditions/effects, discovery/replay policy, supplemental ending
- runtime/secrets.js: Secret state machine, transaction/claims, persistent record, run plan, delayed PvE effects, battle return checkpoint, journal, atonement and ending
- runtime/manifest.json:1080-secretLocations runs after existing systems and audio, before boot. Shared lexical scope as Phase5; no eval/data-supplied code
- P.secrets stores locations, flags, relations, pending, claims, burdens, endingSeen. S.zone.secretRun persists one discovery roll+depth; S.zone.secretSession persists the current story event
- Cloud gsData() intentionally removes UI and active battle. A cloud reload during secret combat returns to encounter, without reward. Local save retains the normal battle snapshot
- Decision transaction persists P and zone in one localStorage write, with rollback on quota failure. Claim id location:decision guards duplicate requests and revisit rewards; delayed:id claims guard delayed effects
- No coupon grants. No API or SQL change. Local save receipts are not server-authoritative anti-cheat and cannot prevent intentional old-save rollback or conflicting devices; retain the game's existing save concurrency guarantees
- Sahara equipment uses existing rare/crafted pool, excludes legends/world legends and caps required level to min(player level, parent zone maximum); fallback100gold if no eligible equipment
- Artwork assets/ui/secrets/*-v1.webp generated individually and visually inspected; originals archived privately. New images1.12MB total
- PVP backdrop key separated from arena to share existing red-moon tile image. Tower artwork unchanged

## Test and deployment workflow
Back up exact web/source/API before work. Test six places × two choices, discovery distribution/depth eligibility, save/load, delayed once, duplicate clicks, quota rollback, no main-boss rewards/unlocks from secret fights, ending/atonement and unchanged combat stats/API hash. Then all legacy regression suites, canonical build and isolated browser staging. QA pages secret-*-staging.html use synthetic test saves and disable API before runtime. Staging hub secrets-staging.html. Publish live only after tests and mobile layout checks pass.

## โหมดทดสอบชั่วคราว 100%
เปิด testDiscovery100 ใน content/secrets.js ตามคำขอผู้ใช้ อัตราเดิมของทั้งหกแห่งยังอยู่ครบ สวิตช์นี้ทำให้ทุกป่าหลักพบทางลับหนึ่งครั้งในชั้น5–8 ต่อการเข้ารอบใหม่ ไม่แก้ผลสุ่มของรอบที่เริ่มไปแล้ว ไม่รีเซ็ตรางวัลหรือคำสัญญา หลังทดสอบตั้ง testDiscovery100:false เพื่อกลับสู่อัตราปกติ

## ภาพเล่าเรื่องและกับดักวาร์ป
- ฉากค้นพบมีเอฟเฟคม่านพลัง 2.6 วินาทีและปุ่มก้าวเข้าสู่เหตุการณ์ กดข้ามได้ทันที และรองรับลดการเคลื่อนไหวตามเครื่อง
- ภาพเหตุการณ์และปุ่มตัดสินใจเฉพาะทั้งหกสถานที่ ใช้ภาพชุดใหม่ 54 ช่อง; ข้อความเนื้อเรื่องยาวกดขยายอ่านได้ ส่วนผลต่อทรัพยากรแสดงก่อนเลือกเสมอ
- หน้าเลือกป่าแสดงเงาดำและ ??? ก่อนค้นพบ เปิดชื่อและภาพจริงหลังพบครั้งแรก ไม่รวมป่าฝึกหัด
- หีบโลหิต หีบโบราณแห่งตำนาน และทางมืด สุ่มกับดักวาร์ป 10% สูงสุดหนึ่งครั้งต่อรอบป่า หีบที่ติดกับดักไม่ได้เปิดรับของ
- วาร์ปไปหน้าประตูบอสของป่าถัดไป; ถ้าอยู่ปราสาทอยู่แล้วเจอบอส Lv 68 เลือกท้าทายหรือถอยผ่านรอยแยกกลับเส้นทางเดิมได้
- เมื่อเริ่มท้าทายแล้วหนีระหว่างสู้ไม่ได้ แพ้เสียเงิน/EXP ตามป่าปกติ ชนะรับรางวัลต่อสู้ปกติ แต่ไม่ปลดล็อกด่าน ไม่ทำเครื่องหมายผ่านบอสเนื้อเรื่อง ไม่รับรางวัลจบจอมมาร
- การโหลดออนไลน์ระหว่างสู้กับดักจะกลับจุดประตูให้เลือกใหม่ ไม่ติดค้างในสนามที่ไม่ถูกบันทึก
- อัตราสถานที่ลับ 100% ชั่วคราวยังคงเปิดตามคำขอทดสอบ แยกจากโอกาสกับดัก 10%
- ภาพใหม่อยู่ assets/ui/secrets/*-story-v1.webp และ warp-trap-v1.webp; สร้างด้วย built-in image_gen และเก็บชุด prompt ไว้ content/secret-art-prompts.json

## ลานสัญญาแรก · ป่าฝึกหัด
- โอกาสปกติ 20% ต่อรอบป่าที่ชั้น5–8 เป็นอัตราปกติสูงสุด; ขณะนี้ยังคงโหมดทดสอบ100%ตามคำยืนยันของผู้ใช้
- พบสถานที่ลับทั้ง7แห่งได้แห่งละหนึ่งครั้งต่อตัวละคร โดยนับเมื่อเลือกเข้าสู่สถานที่ ไม่ใช่เมื่อเห็นปุ่มทางเข้า; ตัวละครที่เคยพบแล้วจะไม่สุ่มสถานที่นั้นซ้ำ แม้แผนรอบเก่าถูกบันทึกไว้
- เลือกไม่สู้: สุ่มอสูรทั่วไปในป่าฝึกหัดที่มีสามร่าง เริ่มร่างแรกLv1หนึ่งตัว ถ้ากระเป๋าเต็มส่งไปค่าย ไม่แทนที่อสูรตัวเดิม
- เลือกสู้: ต้องชนะเงาฝึกก่อน ได้อาวุธหลอมหรือหายากที่มีในเกม Lvไม่เกิน15หนึ่งชิ้น ไม่รวมตำนาน และไม่รับอสูรจากทางไม่สู้
- ไม่มีเงิน EXP หรือของดรอปอื่นจากสถานที่เริ่มต้นนี้ แพ้บททดสอบไม่เสียเงิน/EXP และเลือกประลองใหม่หรือเจรจาได้ในครั้งที่กำลังอยู่
- ถ้าออกก่อนจบมีคำเตือน: จะไม่สุ่มพบซ้ำและไม่ได้รางวัลที่ยังไม่รับ; การโหลดเซฟระหว่างเหตุการณ์ยังกลับจุดที่กำลังเล่นได้ตามปกติ อ่านเรื่องย้อนหลังได้ในบันทึก
- ลานสัญญาแรกไม่เป็นเงื่อนไขบังคับเพิ่มของบทส่งท้ายลับหกแห่งเดิม
- ภาพสร้างด้วย built-in image_gen: assets/ui/secrets/firstpact-story-v1.webp; prompt อยู่ content/firstpact-art-prompt.json

ข้อเสนอผลระยะกลาง/ยาว (ยังไม่เปิดใช้งาน)
- ทางผูกมิตร: ระยะกลางให้สหายใหม่ชี้จุดพักปลอดภัยในป่าแสงจันทร์หนึ่งครั้ง; ระยะยาวให้มีบทสนทนา/เควสต์ช่วยอสูรหลงทางและสมญาผู้รับฟังผืนป่า
- ทางประลอง: ระยะกลางให้ช่างในหมู่บ้านมอบภารกิจฝึกใช้อาวุธและวัตถุดิบหลอมเล็กน้อยครั้งเดียว; ระยะยาวให้ปลดเควสต์สืบทอดเครื่องหมายลานฝึกและสมญาผู้รักษาคำประลอง
- ทั้งสองทางให้คุณค่าพอ ๆ กัน ไม่มีบัฟพลังถาวรหรือได้เปรียบ PvP และไม่บังคับเส้นทางจบหลัก

รางวัลอาวุธจากสถานที่ลับทุกแห่งจะตรงกับชนิดอาวุธของอาชีพปัจจุบัน ณ เวลารับรางวัล รวมสายเลื่อนขั้น โดยลานสัญญาแรกยังคงเป็นหลอมหรือหายาก Lvไม่เกิน15หนึ่งชิ้น อุปกรณ์ช่องอื่นจากสถานที่ลับยังใช้เงื่อนไขเดิม มีผลกับรางวัลใหม่ ไม่เปลี่ยนไอเทมที่เคยได้รับแล้วอัตโนมัติ

## รางวัลสถานที่ลับเพิ่มขึ้น · 20 ตุลาคม 2026
ลานสัญญาแรกคงเดิมทุกประการ ส่วน6แห่งหลักมีเงินพื้นฐาน1,500 /3,500 /6,500 /10,000 /15,000 /22,000เหรียญ พร้อมชุดยาทั้งสองทางเลือก และรางวัลพิเศษเฉพาะทาง (อสูรหายากประจำด่าน หรืออาวุธตำนานทั่วไปตรงอาชีพ/อุปกรณ์หลอมตามข้อมูล) อสูรที่ได้รับไม่เกินเลเวลผู้เล่น ไม่แจกอสูรตำนานและอาวุธตำนานสุริยัน รับได้ครั้งเดียว รายการที่รับรางวัลไปแล้วไม่จ่ายซ้ำย้อนหลัง
อัตราปกติเรียงป่าฝึกหัด/แสงจันทร์/หมอกเซียน/สุสานทอง/ยอดเขา/สวรรค์/ปราสาท =20/15/15/10/10/5/5% แต่ยังคงโหมดทดสอบ100% ตามคำยืนยัน
ดูตารางรางวัลและผลตรวจบอสแยกอาชีพใน boss-balance-audit-20261020.html การตรวจบอสรอบนี้ใช้กติกาจริงและข้อมูลจำลอง ไม่ได้ปรับค่าพลังบอส/สกิลหรือกระทบPvP/บอสโลก
