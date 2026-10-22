# บัญชีอีเมลและรหัสผ่าน — รุ่นทดสอบ

ผู้เล่นใหม่สมัครและยืนยันอีเมล จากนั้นเข้าระบบด้วยรหัสผ่าน เลือกหรือสร้างตัวละครได้สูงสุด 10 ตัวต่อบัญชีต่อ environment ระบบไม่ย้ายตัวละครเก่า ไม่ลบเซฟเก่า และไม่ใช้เซฟเดิมในการสร้างตัวละครใหม่

## สถานะการเปิดใช้งาน

- `accounts-staging.html`: เกมทดสอบบัญชีใหม่ ใช้ environment `test` และ API `soulbeast-accounts`
- `accounts-preview.html`: ตัวอย่างภาพ/การใช้งานที่ใช้บัญชีและการตอบกลับจำลองทั้งหมด ไม่ส่งอีเมลหรือสร้างบัญชีจริง
- `index.html` ยังไม่เปลี่ยนไปบังคับสมัคร จนกว่าจะตั้ง SMTP และทดสอบสมัคร/ยืนยัน/กู้รหัสผ่านจริงผ่านครบ
- ยังไม่เปิดรับเงินจริง คูปองในร้าน sandbox เป็นยอดจำลอง
- 22 ต.ค. 2026 ติดตั้ง schema และ API ใหม่ พร้อม exact redirect ของหน้าทดสอบตามที่เจ้าของอนุมัติ ตรวจ missing/invalid token ได้ 401 และการอ่านตารางโดย anon ได้ 401; SQL transaction tests ผ่านและ rollback ทั้งหมด การสมัคร/ยืนยันอีเมลจริงยังรอ SMTP

## อีเมลที่ต้องตั้งก่อนเปิดรับผู้เล่น

แนะนำโดเมนของตนเองและ Resend SMTP:

1. จดโดเมนที่ต้องการใช้ ชื่อยังไม่ได้กำหนดหรือซื้อให้ สามารถโฮสต์เกมที่ GitHub Pages ต่อได้ ไม่ต้องย้ายเว็บเกม
2. สมัคร Resend และเพิ่ม sending subdomain เช่น `auth.<โดเมนของคุณ>`
3. เพิ่ม DNS ตามค่าที่ Resend แสดง แล้วรอสถานะ Verified อย่าคัดลอกค่าตัวอย่างจากที่อื่น
4. Supabase → Authentication → Email → SMTP ตั้ง Sender name `Soulbeast`, Sender email จากโดเมนที่ยืนยันแล้ว, Host `smtp.resend.com`, Port `465`, Username `resend`, Password เป็น API key ของ Resend คีย์ใส่ในช่องลับที่ Supabase เท่านั้น ไม่ใส่ในแชตหรือไฟล์เกม
5. เพิ่ม exact Redirect URL `https://gusgoat.github.io/Soulbeast/accounts-staging.html` ใน Authentication → URL Configuration รักษา URL ของ admin และร้านเดิมไว้
6. ทดสอบอีเมลยืนยันและกู้รหัสผ่านด้วยบัญชีทดสอบใหม่ ผู้ใช้กรอกรหัสผ่านและยืนยันเอง ไม่ส่งรหัสผ่าน/ลิงก์ยืนยันให้ผู้ดูแล
7. หลังผ่านทั้งหมด ค่อยเปิดหน้าเกมหลักและเปลี่ยน redirect ไป URL production ที่ตั้งใจใช้ พร้อมทดสอบซ้ำ

แหล่งข้อมูล: https://supabase.com/docs/guides/auth/auth-smtp และ https://resend.com/blog/how-to-configure-supabase-to-send-emails-from-your-domain

## โครงสร้างและความปลอดภัย

- รหัสผ่านส่งตรง Supabase Auth ไม่อยู่ในเซฟหรือ localStorage
- ใช้ session เดียวกับร้านคูปอง sandbox (`soulbeast_shop_test_auth_v1`) รักษาการ refresh ข้ามแท็บและไม่ล้างบัญชีเพราะเน็ตสะดุด
- ตาราง `sb_player_characters` เก็บเจ้าของ ตัวละคร environment และ PIN ภายในที่สุ่มจากเซิร์ฟเวอร์ เปิด RLS ปิดการเข้าถึงโดย anon/authenticated โดยตรง และอนุญาตเฉพาะ service_role
- RPC `sb_player_account_command` อนุญาตเฉพาะ service_role และตรวจเจ้าของทุกคำสั่ง
- API ตรวจ access token กับ `auth.getUser` และการยืนยันอีเมลก่อนเรียก engine ปฏิเสธตัวละครของบัญชีอื่น รวมถึงคำสั่ง PvP/บอสโลก
- token ห้อง PvP ต้องตรงกับตัวละครที่บัญชีเป็นเจ้าของด้วย ไม่ยอมรับ token ของอีกตัวละครโดยอ้าง code ของตนเอง
- ตัวละครใหม่สร้างจาก template ต้นทางเกม ไม่รับทอง/เลเวล/อุปกรณ์ที่ส่งมาใน payload สร้างตัวละคร
- retry การสร้างใช้ request UUID เดิม มี unique constraint และ digest; เมื่อบันทึกสำเร็จแต่ activation สะดุด การเรียก list จะทำต่อให้จบ ไม่แจกซ้ำ
- เมื่อ active จะเชื่อมตัวละครเข้าตารางร้าน sandbox โดยอัตโนมัติ สิทธิ์โปรโมชั่นยังนับต่อบัญชีเดียวกัน
- เซฟและรูปในเครื่องแยกด้วย environment/account ID/character code ป้องกันการปนระหว่างบัญชี ไม่มีการลบเซฟเดิม
- engine.ts เป็นสำเนา engine ที่ดาวน์โหลดจาก API รุ่นใช้งานล่าสุดเมื่อเริ่มงานนี้ ไม่มีคีย์ลับ ตัว build คง engine ไว้ทุกไบต์ และเพิ่มเพียง gateway; ก่อนเปิดจริงตรวจว่า engine ยังตรงกับ API ล่าสุดหากมีการแก้เกมระหว่างรอ SMTP

## Build และทดสอบ

`npm run test:accounts` สร้างเซิร์ฟเวอร์จากต้นทางใน repo ทดสอบเจ้าของข้ามบัญชี/environment, callback ปลอม, ไม่เก็บรหัสผ่าน, สร้างซ้ำ/activation สะดุด และรัน handler จริงกับ engine จริง โดย mock Auth/DB transport

`node tools/prepare-account-stage.cjs` สร้าง entry และ bundle แยก ไม่เขียนทับ production

`npm test` ตรวจระบบเกม/ร้านเดิมทั้งหมด

ไฟล์ติดตั้งอยู่ `build/accounts/001-accounts.sql` และ `build/accounts/index.ts` ห้ามเปิด JWT gateway แบบรับเฉพาะ legacy signing secret หากโครงการใช้ signing keys ใหม่ ต้องใช้การตรวจ `getUser` ใน handler ที่เตรียมไว้ และตรวจ unsigned request ถูกปฏิเสธหลัง deploy

ตรวจหน้าที่เผยแพร่ด้วย browser แล้ว: สมัครจำลอง/ล็อกอิน/เพศและอาชีพ/สร้างตัวละคร/บทสอนเล่น/บันทึกก่อนเลือกรายชื่อ/ออกจากบัญชี ผ่าน ไม่มี console error ก่อนเปิดจริงยังต้องทดสอบการส่งอีเมลและเข้าสู่ระบบจริงครบวงจร การผ่าน mock ไม่ยืนยันการส่งอีเมลหรือธุรกรรม Stripe จริง
