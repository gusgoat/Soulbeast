# Refactor ระยะ 5 — 20 ตุลาคม 2026

รุ่นอ้างอิง d139f42 สำรอง 940 ไฟล์พร้อม SHA256 ใน private/refactor-phase5-20261020/baseline.zip ตรวจอ่านกลับครบแล้ว ไม่เผยแพร่สำรองหรือข้อมูลผู้เล่น

ระยะนี้จัด pipeline ให้หน้าเกมสร้างจาก client/, content/ และ runtime/ ใน repository ได้โดยตรง ไม่พึ่ง HTML เก่าหรือการแพตช์ client ใน work/ อีกต่อไป เพิ่ม tools/client-build.cjs, npm test, npm run build และ DEVELOPMENT-TH.md เก็บไฟล์เดิมไว้สำหรับย้อนกลับและสร้าง server ตามเดิม

- ย้ายโครง HTML และ CSS ไปเป็นต้นทางใน client/ โดยคงไบต์เดิมทั้งหมด รวม CRLF/LF ที่ผสมอยู่
- compiler เพิ่ม compile(environment) โดยตรง เส้นทาง assemble(input) เดิมยังตรวจ legacy drift สำหรับชุดตรวจ migration
- ตรวจ marker ของ HTML, factory ข้อมูลครบ 75 ส่วน, กลุ่มไม่ซ้ำและ path ถูกต้อง, syntax runtime, unit/owner/order และ environment mapping ก่อนเขียนผล
- ผลลัพธ์ใช้ content hash และลำดับ classic blocking script เดิม ไม่เพิ่ม defer/async หรือเปลี่ยน shared scope
- build ไม่เผยแพร่เองและไม่ทับ index.html อัตโนมัติ ผลอยู่ build/ ที่ Git ไม่ติดตาม
- server engine/API ใช้ pipeline เดิม ไม่ย้าย schema สิทธิ์หรือข้อมูลผู้เล่น

## ผลทดสอบก่อนเผยแพร่

- build จากสำเนาที่มีเฉพาะต้นทาง client/content/runtime/tools และ parser ที่ล็อกเวอร์ชัน ไม่มี work/ หรือ HTML เก่า ผ่าน
- HTML, CSS และ JS ทุกไฟล์ของ live/test ตรงรุ่นสำรองทุกไบต์ (ตรวจไฟล์ผลลัพธ์ 16 ไฟล์ ไม่รวม metadata client-files.json)
- API bundle SHA256 ตรงสำรอง ไม่ต้อง deploy Supabase
- build ซ้ำได้ผลเดิม แก้โมดูลแบบจำลองแล้ว hash เปลี่ยนจริง ปฏิเสธ factory ตกหล่น, marker หาย, คำสั่งนอก unit, path ผิด และ environment ที่ไม่รู้จัก
- ชุดตรวจฟีเจอร์ปัจจุบัน 39/39 ผ่าน รวมต่อสู้ AI สถานะ ยา สลับอสูร เลเวล กาชา หอคอย PVP กิล ค่าย บอสโลกและแอดมิน ใช้ข้อจำกัด historical suites ตามระยะ 1–4 เดิม
- แพ็ก 24,982,364 ไบต์เท่าเดิม ไม่อ้างว่าระยะนี้เพิ่มประสิทธิภาพหรือเปลี่ยนสถาปัตยกรรมเป็น native ESM

## ย้อนกลับ

กลับไป commit d139f42 และคืน work/build-supabase.cjs จาก archive หากต้องย้อนเครื่องมือ workspace หน้าเกม runtime ที่เผยแพร่เหมือนเดิมทุกไบต์ จึงไม่ต้องย้อนฐานข้อมูล เก็บ hashed assets เดิมรองรับแท็บที่เปิดค้าง

## Staging ที่ตรวจจริง

ไฟล์หน้า staging และ dependencies 14 ไฟล์ HTTP200 ชนิดเนื้อหาถูกต้องและตรง candidate ที่ build ใหม่ทั้งหมด ทดสอบตัวละครจำลองใน SUPABASE TEST บนจอ390×844: โจมตี13ดาเมจ สกิลอสูรใช้4MPและทำ8ดาเมจ ศัตรูตอบโต้และขึ้นเทิร์น2ได้ โหลดscript12ไฟล์ รูปเสีย0 console error0 ภาพหลักฐาน outputs/refactor-phase5/staging-mobile.png ไม่มีธุรกรรมบัญชีจริง

เพิ่ม GitHub Actions ตรวจ canonical client บน Linux (npm ci parser ที่ล็อกไว้, npm test, npm run build) บน push/PR ใช้ contents:read และไม่ deploy/แตะฐานข้อมูล ชุด39ฟีเจอร์ยังเป็นการตรวจเต็มใน workspace แยกจาก CI ของ client
