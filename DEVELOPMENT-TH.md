# การพัฒนาและ build Soulbeast หลังระยะ 5

หน้าเกมสร้างจากต้นทางใน repository ได้โดยตรง ไม่ต้องมีโฟลเดอร์ work/ หรือ HTML ก้อนเก่าจาก workspace เดิม ใช้ Node.js และ npm พร้อม parser ที่ล็อกเวอร์ชันไว้

## เริ่มใช้งานจากโฟลเดอร์ repository

```sh
npm ci --prefix tools/runtime-build --ignore-scripts --no-audit --no-fund
npm test
npm run build
```

ไฟล์ที่ได้อยู่ build/ (ไม่ commit) มี live-index.html, staging-index.html, client-files.json และไฟล์ JS/CSS ที่ตั้งชื่อด้วย hash คำสั่ง build ไม่คัดลอกทับ index.html และไม่เผยแพร่เอง ให้ตรวจ staging ก่อนเลือกนำ live-index.html ไปเป็น index.html เสมอ เก็บ assets/ เดิมคู่กับไฟล์หน้าเกม เส้นทางรูปและเสียงยังเหมือนเดิม

## แก้ที่ไหน

- client/shell.html: โครง HTML และตำแหน่งโหลดสคริปต์ ห้ามลบ marker ทั้งสองตำแหน่ง
- client/styles.css: CSS ต้นทางที่ใช้จริง รักษาลำดับกฎเดิม
- content/*.js: ตารางข้อมูลเกม 10 กลุ่ม เป็น factory ที่ถูกเรียก ณ ตำแหน่งเริ่มต้นเดิม
- runtime/*.js: ระบบเกม 24 โมดูล แก้ด้านใน unit ตาม README ของ runtime
- runtime/manifest.json: เจ้าของ unit ลำดับเริ่มต้น และ mapping live/test เดิม
- tools/client-build.cjs: สร้างหน้า live/test และ asset hash โดยไม่พึ่ง HTML เก่าหรือไฟล์แพตช์ client

npm test เทียบผลกับหน้าเกมรุ่นอ้างอิงใน repository และตรวจ build ซ้ำ/ต้นทางถูกใช้/ส่วนที่ตกหล่น หากตั้งใจเปลี่ยนเกมในอนาคตต้องเพิ่มการทดสอบพฤติกรรมและปรับรุ่นอ้างอิงอย่างชัดเจน ไม่แก้ expected เพื่อกลบความผิดพลาด

โมดูลยังรวมเป็น classic script เพื่อรักษา shared scope, hoisting และ wrapper เดิม ยังไม่ใช่ native ESM และยังไม่รื้อโครงสร้างภายในทุกฟังก์ชัน ไม่เปลี่ยนกติกาหรือเพิ่มเนื้อเรื่องในระยะนี้

## API และการเผยแพร่

ตัว build ข้างบนสร้างเฉพาะหน้าเกม ไม่สร้าง/ติดตั้ง API, SQL หรือเปลี่ยนฐานข้อมูล เครื่องมือดูแลเซิร์ฟเวอร์เดิมยังอยู่ใน workspace: work/build-supabase.cjs สร้าง API ด้วย pipeline เดิมแล้วเรียก client builder ตัวใหม่นี้ แพตช์ที่ server ใช้อยู่ยังจำเป็น ห้ามลบทั้งหมดเพียงเพราะ client เลิกอ่านแล้ว

ใน workspace เดิมตรวจเพิ่มด้วย node work/run-refactor-regressions.cjs outputs/refactor-phase5 แล้วแพ็กและเผยแพร่ตามขั้นตอนเดิม ห้ามทดสอบธุรกรรมด้วยบัญชีผู้เล่นจริงใน staging

GitHub Actions ชื่อ Canonical client checks ตรวจ npm test และ build live/test บน Linux เมื่อ push หรือเปิด pull request ใช้สิทธิ์อ่าน repository เท่านั้น ไม่ deploy และไม่ใช้ข้อมูลลับหรือบัญชีผู้เล่น

ชุดเสียงผู้เล่น20ตุลาคม2026เพิ่มไฟล์ต้นฉบับ51ไฟล์ ใช้assetBudgetBytesในclient/build.json (ปัจจุบัน50MB) สำหรับการตรวจขนาดแพ็ก เสียงโหลดเมื่อใช้ ไม่ได้โหลดทั้งlibraryเมื่อเปิดเกม รายการไฟล์และการเลือกฉากดูAUDIO-LIBRARY-TH.md
