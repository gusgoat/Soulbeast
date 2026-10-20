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
