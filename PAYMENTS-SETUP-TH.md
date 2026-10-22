# เติมคูปอง: เตรียม Sandbox วันที่ 22 ตุลาคม 2026

สถานะ: ตรวจราคาผ่าน Stripe Sandbox จริงครบ 8 แพ็กแล้ว มีหน้าร้านแยก `topup-test.html`, ฟังก์ชัน `soulbeast-payments-test`, บัญชีอีเมล Supabase Auth และตารางทดสอบแยก ไม่รับเงินจริงและไม่เติมคูปองในเกมจริง ยังต้องให้เจ้าของเกมล็อกอินอีเมลและทดลองชำระผ่านหน้า Stripe จริงใน Sandbox เพื่อยืนยันครบวงจร

แหล่งข้อมูล: `content/payment-packs.test.json` เก็บจำนวนเงินเป็นสตางค์ รหัสนี้ใช้กับ Sandbox เท่านั้น ห้ามนำไปสร้างรายการเงินจริง รายการราคาไม่ได้เป็นความลับ แต่คีย์ API เป็นความลับ

โปรโมชั่น 35/150/275 บาท รับ 10/50/100 คูปอง ตามลำดับ ซื้อได้แพ็กละ 1 ครั้งต่อบัญชี แพ็กปกติ 35/70/300/550/1000 บาท รับ 5/10/50/100/200 คูปอง ทุกแพ็กเป็น one-off

## ตรวจระบบเดิม

- `runtime/social.js`: `communityAuth()` ใช้รหัสเซฟตัวละครและ PIN; `communitySave()` รับยอดคูปองจากเซิร์ฟเวอร์
- `runtime/economy.js`: `gachaCall()` และ `GACHA.coupons` ใช้ยอดออนไลน์ ไม่ให้เพิ่มคูปองจาก callback หน้าเว็บ
- API ที่สำรองไว้ใน `../private/player-gender-20261022/api-deployed.ts` มี `communityCoupon_`, `communityWriteCoupon_`, `communitySyncCredits_` และ `createGameService` ซึ่งใช้ snapshot/revision/commit ฝั่ง Supabase ยอดคูปองอยู่ตาราง Coupons และมีเครดิต/ธุรกรรมแยกจากเซฟ
- เจ้าของเกมเลือกเพิ่มบัญชีอีเมลรวมหลายตัวละคร ใช้ Supabase Auth user ID ที่เซิร์ฟเวอร์ตรวจด้วย `getUser` และต้องยืนยันอีเมลแล้ว `sb_shop_characters` เก็บเจ้าของตัวละครแบบผูกได้ครั้งเดียว ต้องตรวจรหัสเซฟและ PIN ฝั่งเซิร์ฟเวอร์ก่อนผูก ไม่มีการเปลี่ยนวิธีเข้าเกมเดิมหรือเก็บ PIN ในตารางร้าน

## สิ่งที่ติดตั้งแล้ว

- `server/payments/001-sandbox.sql`: ตารางผู้รับ คำสั่งซื้อ และเครดิตทดสอบ มี RLS และถอนสิทธิ์ตรงจาก anon/authenticated ใช้ service_role ผ่านฟังก์ชันที่ตรวจบัญชีแล้วเท่านั้น
- `server/payments/core.mjs`, `index.ts`: allowlist ราคา, Checkout แบบ payment quantity=1, card + promptpay, idempotency key, raw-body HMAC, ตรวจ paid/complete/amount/THB/ราคา/ผู้รับ ก่อนเครดิต
- เครดิตและการใช้สิทธิ์โปรโมชั่นอยู่ใน transaction เดียว มี advisory lock ต่อบัญชีและ unique constraints ต่อโปรโมชั่นที่ยังไม่หมดอายุ, session และ payment intent
- ยกเลิก/หมดอายุคืนสิทธิ์ได้เฉพาะเมื่อ Stripe ยืนยัน session expired ไม่เชื่อ cancel URL; หากสร้าง session แล้วตอบกลับขาดหายใช้ idempotency key เดิมเพื่อกู้รายการ หยุดกู้โดยอัตโนมัติเมื่อเกิน 23 ชั่วโมงเพื่อไม่ให้เกิดรายการซ้ำหลัง Stripe หมดอายุ idempotency key
- `topup-test.html` + `client/topup-test.*`: แสดงแพ็ก 8 รายการ เข้าบัญชีด้วย magic link, เลือก/ผูกหลายตัวละคร, ประวัติ, กลับไปจ่ายรายการเดิม, ตรวจผล/ยกเลิก และยอดคูปองจำลองแยกตามตัวละคร
- ลิงก์เข้าบัญชีกลับได้เฉพาะ URL `https://gusgoat.github.io/Soulbeast/topup-test.html` ที่เพิ่มใน allowlist ไม่เปลี่ยน Site URL ของ admin เดิม โทเคนอยู่ sessionStorage เฉพาะร้านและถูกลบจาก URL ทันที ไม่เข้าเซฟเกม
- Stripe destination `we_1UTO98LvVJpWGsebGADyzkTR` รับ checkout.session.completed, checkout.session.async_payment_succeeded และ checkout.session.expired แบบ Snapshot ใน Sandbox ปลายทาง `/functions/v1/soulbeast-payments-test/webhook`
- ตั้ง STRIPE_TEST_SECRET_KEY และ STRIPE_TEST_WEBHOOK_SECRET ใน Supabase Secrets เท่านั้น ไม่มีคีย์ลับใน repository หรือไฟล์สำรอง

## หลักฐานทดสอบปัจจุบัน

- Stripe API จริง: ราคาทั้ง 8 รายการผ่าน active/one_time/THB/จำนวนเงิน/โหมดทดสอบ
- `002-transaction-tests.sql` รันผ่าน Supabase: เจ้าของตัวละคร, โปรโมชั่นร่วมสองตัวละคร, ป้องกันเปลี่ยน payload, เครดิตซ้ำ, ยกเลิกไม่เสียสิทธิ์, ใช้สิทธิ์แล้วไม่เปิดใหม่, ซื้อปกติซ้ำได้ และ RPC/RLS protection; fixtures อยู่ใน transaction ที่ rollback ทั้งหมด
- `npm test` ผ่านทั้งเกมเดิมและชุดทดสอบ payment catalog/rules/Edge handler แบบ mock ตรวจ spoofed amount/price/account, unsigned/tampered/replayed webhook, key/live mode, login/verified-email gate
- HTTP จริง: catalog ตอบครบ 8 แพ็ก, การอ่านบัญชีโดยไม่ login ตอบ 401 การรับ webhook ที่ไม่มีลายเซ็นถูกปฏิเสธ
- ยังไม่ยืนยันการส่งอีเมลถึงผู้เล่นทั่วไปหรือการชำระครบวงจรกับบัญชีผู้ใช้จริง ต้องทดสอบต่อก่อนเปิดใช้คูปองจริง กรณีอีเมลส่งไม่ได้ต้องตั้งผู้ให้บริการอีเมล SMTP ของเจ้าของเกม ไม่ปิดการยืนยันอีเมลเพื่อแก้ปัญหา

## งานเชื่อมที่ต้องทำก่อนเปิดใช้

1. กำหนดเจ้าของบัญชีที่ใช้สิทธิ์โปรโมชั่น; บัญชีที่รับคูปองต้องมีการยืนยันสิทธิ์ ไม่ใช้รหัสสาธารณะอย่างเดียว
2. ตั้งคีย์ทดสอบ Stripe ใน Edge Function Secrets ของ Supabase; แนะนำ restricted test key โดยให้สิทธิ์ตาม endpoint ที่จะใช้เท่านั้น ไม่ใส่คีย์ใน GitHub, HTML หรือแชต
3. ตรวจราคาจริงทั้ง 8 รายการ: active, livemode=false, THB, ราคาเป็นสตางค์ตรงกัน, one_time, product active ผ่านแล้วจากฟังก์ชันฝั่งเซิร์ฟเวอร์ เครื่องมือตรวจแบบอ่านอย่างเดียว `node tools/check-stripe-catalog.cjs` เป็นตัวเลือกสำหรับเครื่องผู้พัฒนา ไม่ต้องนำคีย์ออกจาก Supabase มาใช้
4. สร้างคำสั่งซื้อจาก pack ID ที่เซิร์ฟเวอร์อนุญาตเท่านั้น quantity=1 และราคาจาก allowlist ผูก order/account/ตัวละครแบบแก้ไขไม่ได้จาก browser สร้าง Checkout Session แบบ payment, ใช้ idempotency key ต่อ order และจำกัด order โปรโมชั่นที่รอจ่ายซ้อนกัน
5. รับ Stripe webhook ด้วยการตรวจลายเซ็น raw request body และ secret เฉพาะ endpoint ตรวจสถานะ paid, โหมดทดสอบ, ยอดเงิน, สกุลเงิน, ราคา, quantity, order/ผู้รับ และไม่เติมจาก success URL หรือ completed event ที่ยังไม่ paid
6. เครดิตคูปอง + บันทึก payment/order + ใช้สิทธิ์โปรโมชั่น ต้องเป็นธุรกรรมเดียวกันกับกลไก revision ของยอดคูปองเดิม ห้ามแก้ Coupons นอก transaction เดิมจนเกิด lost update กับกาชา/กิล การส่ง webhook ซ้ำหรือมาพร้อมกันต้องไม่เติมเพิ่ม
7. ชำระค้าง/หมดอายุ/ยกเลิกต้องไม่เสียสิทธิ์โปรโมชั่น จัดการ race ระหว่าง session เก่าและ session ใหม่ ก่อนปล่อยสิทธิ์ต้องยืนยัน session เก่าจ่ายต่อไม่ได้ เก็บ ledger และ reconciliation สำหรับเคสตอบกลับขาดหาย
8. ทดสอบสำเร็จ/ยกเลิก/pending/expired/ลายเซ็นปลอม/ยอดผิด/webhook ซ้ำและพร้อมกัน/เซฟเก่าทับ/ใช้สองแท็บ/เปลี่ยนตัวละคร/กลับจาก mobile banking/คืนเงิน พร้อมแยก Sandbox จากคูปองเกมจริง

การใช้คูปองกับระบบสุ่มต้องอธิบายให้ผู้ให้บริการชำระเงินทราบตรงตามการใช้งานจริง และยืนยันสิทธิ์เปิดรับเงินจริงก่อน launch; ขณะนี้ยังไม่ยืนยันการอนุมัติธุรกิจ

ทดสอบข้อมูลและตัวตรวจด้วย `node tools/test-payment-catalog.cjs` เป็น unit tests และข้อมูลจำลอง ไม่ใช่หลักฐานว่าจ่ายเงินจริง/ทดสอบกับ Stripe สำเร็จ

เอกสารอ้างอิง: https://docs.stripe.com/keys , https://docs.stripe.com/checkout/fulfillment , https://supabase.com/docs/guides/functions/secrets
