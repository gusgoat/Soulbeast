# Soulbeast — เตรียม Google Play Internal testing

## สถานะปัจจุบัน

- เจ้าของยืนยัน Package ID `com.soulbeastgame.app` แล้ว แอปชื่อ Soulbeast รุ่น 0.2.0-internal / versionCode 2 ใช้ environment `test`
- บัญชีอีเมลเข้าได้แล้วตามผลทดสอบของเจ้าของเกม
- มี native Billing 9.1.0, หน้าร้าน Android, สร้าง order จากเซิร์ฟเวอร์, ตรวจ purchase กับ Google, ผูก account/order/product/package และแจกยอดใน Coupons ของเกมทดสอบ
- ธุรกรรมเพิ่ม Coupons ใช้ engine revision CAS และบันทึก grant ledger ใน SQL transaction เดียวกัน จึงไม่ใช่แก้เซฟ client และไม่ผ่าน CouponCredits ที่จำกัดจำนวนต่อแถว
- ใช้สิทธิ์โปรโมชั่นร่วมกับ Stripe Sandbox ผ่าน account lock/unique reservation; ร้านเว็บยังเป็นยอดจำลองเดิม ไม่เปลี่ยนไปแจกคูปองเกมหรือรับเงินจริง
- รองรับ pending โดยไม่แจก, token ซ้ำ, กู้คืนหลังแจกสำเร็จแต่ consume สะดุด และ query purchased items หลังเปิดร้านอีกครั้ง
- **ยังไม่ติดตั้ง schema/Edge Function ใหม่บน Supabase** ยังไม่มี Google service account และสินค้าจาก Play Console
- **ยังปิดการซื้อ** ทั้ง native flag, client config และ server flag; endpoint รับเฉพาะ license-test purchase และ environment test เท่านั้น ไม่มีวิธีเปิดเงินจริงด้วยการเปลี่ยน flag อย่างเดียว
- AAB ที่ workflow สร้างยัง unsigned ถ้ายังไม่ตั้ง upload key จึงยังอัปเข้า Play Console ไม่ได้ ห้ามใช้ debug key เป็น upload key

## ขั้นต่อไปสำหรับเจ้าของ — ทำทีละช่วง

1. รอ Play Console ยืนยันบัญชี แล้วกด Create app: Soulbeast / Game / Free ตามรูปแบบเกมที่จะเปิดให้ดาวน์โหลด
2. เตรียม upload key ส่วนตัวผ่าน Android Studio → Generate Signed Bundle / APK → Android App Bundle → Create new keystore รักษาไฟล์และรหัสผ่านไว้เอง ไม่ส่งในแชตหรือ commit Git
3. เปิดโปรเจกต์ `mobile/android` ด้วย JDK 21 และ Android SDK 36 ที่ติดตั้งแล้ว จากนั้น build และลงนาม release bundle โดยใช้ upload key เดิมทุกครั้ง ค่าลงนาม Gradle รับจาก `SB_UPLOAD_STORE_FILE`, `SB_UPLOAD_STORE_PASSWORD`, `SB_UPLOAD_KEY_ALIAS`, `SB_UPLOAD_KEY_PASSWORD` ในเครื่องเท่านั้น
4. เปิด Play App Signing ตามขั้นตอน Console แล้วอัป signed AAB เข้า Internal testing ไม่ใช่ Production
5. สร้าง One-time products สำหรับคูปองแบบ consumable จำนวน 8 แพ็กตามตารางด้านล่าง ให้แต่ละ product มี buy option ที่ใช้ได้ 1 รายการ เปิดในประเทศทดสอบ และราคาที่ Play แสดงต้องตรงกับที่เจ้าของอนุมัติ
6. เพิ่มบัญชี Google บนโทรศัพท์เข้า Internal testers **และ** License testing เป็นคนละรายการ จากนั้นติดตั้งผ่านลิงก์ทดสอบ Play
7. สร้าง service account ใน Google Cloud, เปิด Google Play Android Developer API แล้วเพิ่ม service account เข้า Play Console เฉพาะแอปนี้ด้วยสิทธิ์ดูข้อมูลคำสั่งซื้อและจัดการรายการซื้อที่ Developer API ต้องใช้ ไม่ให้สิทธิ์เจ้าของบัญชี
8. เก็บ JSON ของ service account ใน Supabase secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` โดยกรอกเอง ไม่ใส่ใน Git/แชต/แอป
9. ติดตั้ง `build/play/003-play-test.sql` และ Edge Function `soulbeast-play-test` จาก `build/play/index.ts` ก่อนติดตั้งจริงต้องตรวจ signature/ผลคืนค่าของ `sb_engine_commit` กับฐานข้อมูลปัจจุบัน และสำรองให้เรียบร้อย ฟังก์ชันใช้ `auth.getUser` ตรวจ verified account เองทุกครั้ง
10. หลังพร้อมค่อยตั้ง server `SB_PLAY_TEST_ENABLED=true`, client `purchasesEnabled=true`, native `BILLING_ENABLED=true` แล้ว build signed AAB รุ่นใหม่ โดยเพิ่ม versionCode ทุกครั้ง การทดสอบแรกต้องแสดงวิธีจ่ายแบบ Test card จาก Google เท่านั้น

## สินค้า

| Product ID | คูปอง | ราคาอ้างอิง THB | สิทธิ์ |
|---|---:|---:|---|
| soulbeast_first_10 | 10 | 35 | 1 ครั้งต่อบัญชี |
| soulbeast_first_50 | 50 | 150 | 1 ครั้งต่อบัญชี |
| soulbeast_first_100 | 100 | 275 | 1 ครั้งต่อบัญชี |
| soulbeast_normal_5 | 5 | 35 | ซื้อซ้ำได้หลัง consume |
| soulbeast_normal_10 | 10 | 70 | ซื้อซ้ำได้หลัง consume |
| soulbeast_normal_50 | 50 | 300 | ซื้อซ้ำได้หลัง consume |
| soulbeast_normal_100 | 100 | 550 | ซื้อซ้ำได้หลัง consume |
| soulbeast_normal_200 | 200 | 1000 | ซื้อซ้ำได้หลัง consume |

ราคาในแอปอ่านจาก Google Play ไม่อ่านราคาที่ client ส่งมา ไม่ใช้ Price ID ของ Stripe กับ Google Play

## ทดสอบก่อนเปิดจริง

`npm run test:play` รัน service และ exact endpoint โดย mock Google/Auth พร้อม PostgreSQL/WASM จริงสำหรับ migration/transaction: auth, ownership, pending/live rejection, token replay, CAS conflict, rollback เมื่อ token ชน, consume recovery และ promotion ข้ามผู้ให้บริการทั้งสองทิศทาง ส่วน CAS engine ใน SQL tests เป็น fixture ไม่ใช่ฐานข้อมูล production

ยังต้องทดสอบ end-to-end กับ Google: ซื้อสำเร็จ/ยกเลิก/pending/เน็ตขาด/ปิดแอป/ใช้บัญชีอื่น/ซื้อแพ็กเดิมซ้ำ/สลับเว็บ/เพิ่มคูปองแล้วสุ่มจริง ปัจจุบันยังไม่ได้ทดสอบรายการซื้อจาก Google จริง

ก่อนรับเงินจริงต้องทำ RTDN/voided-purchase reconciliation, นโยบายคืนเงินและการย้อนสิทธิ์, งาน retry consume ฝั่งเซิร์ฟเวอร์โดยไม่ต้องรอเปิดแอป, production ledger/environment, ขั้นตอนลบบัญชี, Privacy Policy/Data safety และตรวจนโยบายไอเทมสุ่ม บิลลิงรุ่นนี้เตรียมทดสอบเท่านั้น

เอกสารอ้างอิง:
- https://developer.android.com/google/play/billing/security
- https://developer.android.com/google/play/billing/test
- https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products
- https://developer.android.com/studio/publish/app-signing
