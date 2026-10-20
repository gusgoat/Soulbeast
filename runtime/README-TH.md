# Runtime modules — ระยะ4

โค้ดเกมต้นทางถูกจัดตามหน้าที่24โมดูล โค้ดเผยแพร่ยังรวมเป็นclassic scriptก้อนเดิม เพื่อรักษาขอบเขตตัวแปร การhoist และลำดับhookทั้งหมด โมดูลรอบนี้เป็นbuild-time compatibility modules ยังไม่ใช่ES Modulesที่มีimport/exportและscopeแยกกัน

## หาโค้ดที่ต้องแก้

| ไฟล์ | หน้าที่ |
|---|---|
| core.js | สถานะหลัก ค่าคงที่ และตัวช่วยร่วม |
| catalogs.js | สร้างข้อมูลสกิล/อุปกรณ์ที่คำนวณจากตาราง |
| progression.js | แต้ม อาชีพ EXP เลเวล และวิวัฒนาการ |
| beasts.js | การเติบโต สกิล ร่าง และการค้นพบอสูร |
| inventory.js | กระเป๋า อุปกรณ์ ยา และอสูรที่พก |
| exploration.js | ป่า ทางแยก เหตุการณ์ และบอสป่า |
| combat.js | ดาเมจ เทิร์น คำสั่ง และผลต่อสู้ |
| ai.js | เลือกสกิลและระบบอัตโนมัติ |
| combatUI.js | การ์ดต่อสู้และหน้าต่างคำสั่ง |
| status.js | สถานะค้าง บัฟ การรักษา และคู่มือสถานะ |
| tower.js | หอคอย จุดพัก และความคืบหน้า |
| pvp.js | ห้องดวล เดิมพัน และเวลาเลือกคำสั่ง |
| world.js | ห้องบอสโลก รีเพลย์ และรางวัล |
| camp.js | ตั้งรับค่ายและจู่โจม |
| guilds.js | กิลและสงครามกิล |
| economy.js | ร้านค้า หลอม และกาชา |
| social.js | เพื่อนและกระดานคะแนน |
| persistence.js | เซฟ โหลด สำรอง และย้ายเครื่อง |
| network.js | การติดต่อAPI การลองใหม่ และข้อผิดพลาด |
| audio.js | เพลง เอฟเฟกต์เสียง และระดับเสียง |
| presentation.js | รูป ไอคอน และเอฟเฟกต์ภาพ |
| story.js | เนื้อเรื่อง ฉาก และการแปลภาษา |
| ui.js | หน้าจอ เมนู เปลี่ยนหน้า และเหตุการณ์UI |
| bootstrap.js | เริ่มเกม โหลดสถานะ และเริ่มระบบต่างๆ |

## หลักการแก้ไข

- แก้ไฟล์runtime/*.jsตามหน้าที่ ข้อมูลเกมหลักยังแก้content/*.jsตามระยะ3 อย่าแก้game-app.<hash>.jsที่สร้างแล้ว
- แต่ละส่วนมี `// @soulbeast-unit ID` และ `// @soulbeast-end ID` ครอบ ให้แก้โค้ดด้านในและรักษาmarker โค้ดนอกmarkerที่เป็นคำสั่งจะทำให้buildหยุดแทนที่จะหายเงียบ
- manifest.jsonระบุเจ้าของและลำดับคำสั่ง1078ส่วนตามรุ่นอ้างอิง ไม่ได้ทำงานเรียงทีละไฟล์ ต้องใช้ตัวbuildรวมก่อน ห้ามเพิ่มscript srcชี้runtime/*.jsโดยตรง
- การแก้ฟังก์ชันในโมดูลจะถูกใช้จริง ตรวจแล้วด้วยการแก้เสมือนในหน่วยทดสอบ ไม่ถูกlegacyต้นทางเขียนทับ หากlegacyต้นทางเปลี่ยนจะหยุดbuildเพื่อให้ทบทวน แทนการมองข้าม
- เพิ่มhelperในส่วนที่เกี่ยวข้องได้ หากเพิ่มunitหรือโมดูลใหม่ให้ลงทะเบียนจำนวน/เจ้าของ/ลำดับในmanifestและทดสอบก่อน การเริ่มระบบหรือhookต้องอยู่ก่อนbootตามลำดับที่ออกแบบ
- live/testมีmappingเฉพาะstring literalที่ต่างกันตามรุ่นเดิม ไม่ใช้การแทนprefixทั่วไฟล์ซึ่งอาจเปลี่ยนkeyที่เดิมไม่ควรเปลี่ยน หากแก้ส่วนenvironmentจนmappingไม่ตรงbuildจะหยุดให้ตรวจ
- ยังใช้ตัวแปรร่วมและwrapperเดิม จึงต้องตรวจผลกระทบข้ามระบบก่อนเปลี่ยนsignature อย่าถือว่าแต่ละไฟล์มีscopeอิสระ การลดwrapperหรือเปลี่ยนเป็นESMควรทำเป็นงานย่อยพร้อมผลเทียบพฤติกรรม

## สร้างและตรวจ

จากworkspaceเดิม ติดตั้งparserสำหรับเครื่องใหม่ด้วย `npm ci --prefix recovered/site/tools/runtime-build --ignore-scripts --no-audit --no-fund` (acorn8.15.0ตามlockfile ใช้เฉพาะตอนbuild ไม่ส่งเข้าเกม)

1. node work/build-supabase.cjs
2. node work/test-refactor-phase4.cjs
3. node work/run-refactor-regressions.cjs outputs/refactor-phase4
4. python work/package-supabase.py
5. ทดสอบstagingก่อนเผยแพร่จริง

tools/runtime-build/modules.cjsมีbootstrapสำหรับการย้ายครั้งแรกเท่านั้น ห้ามเรียกซ้ำหลังแก้โมดูลด้วยมือ เพราะจะทับต้นทางจากรุ่นอ้างอิง ชุดตรวจเท่ากันทุกไบต์ใช้ยืนยันRefactorครั้งนี้ หากเปลี่ยนระบบเกมในอนาคตต้องปรับexpectedและเพิ่มการทดสอบพฤติกรรมอย่างตั้งใจ

## อัปเดตระยะ 5

หน้าเกม build จากโมดูลโดยตรงแล้ว ไม่ต้องประกอบ HTML เก่าหรือ client patches ก่อน ดู DEVELOPMENT-TH.md สำหรับ npm test และ npm run build จาก repository อย่างเดียว work/build-supabase.cjs ยังสร้าง API แบบเดิม แต่ส่วน client เรียก tools/client-build.cjs แทน เส้นทาง assemble(input) เดิมเก็บไว้สำหรับตรวจ migration เท่านั้น


อัปเดตสมดุลอสูร: เพิ่ม beastBalance.js (รวม25โมดูล) เป็นงบพลังรวมตามร่าง/rarity/ป่า ใช้กฎเดียวกับ server ดูรายงาน BEAST-BALANCE-TH.md

อัปเดตเสียง20ตุลาคม2026: runtime/uploadedAudio.js เป็นโมดูลที่26 ข้อมูลเพลง/เอฟเฟกต์51รายการอยู่content/audio-library.json การเพิ่มเสียงต้องคงmaster/music/effects bus,ไม่ใช้combatRNG และทดสอบsceneไม่restartทุกrender ดูAUDIO-LIBRARY-TH.md

Secret locations: secrets.js (1080-secretLocations) runs after combat/UI/audio and before bootstrap; content/secrets.js is a registered factory. It wraps forest boundaries and battle return, without altering damage formulas or online handlers. P.secrets stores decisions/claims; S.zone stores a fixed per-run discovery plan and resumable session. See SECRETS-GUIDE-TH.md for state, replay and offline receipt limits.
