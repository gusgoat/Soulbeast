# Soulbeast: ตั้งค่ารับเงินจริงบนเว็บและ Android

ระบบที่เตรียมวันที่ 24 ตุลาคม 2026 ใช้ร้านเว็บ `topup.html` และ Google Play Billing ในแอป 0.2.17 ขึ้นไป ทั้งสองช่องทางใช้รายการซื้อ/โปรโมชั่นชุดเดียวกัน แยกจาก Stripe Sandbox และ Play test ledger เดิม

**สถานะล่าสุด 24 ตุลาคม 2026: เปิด Stripe บนเว็บแล้วตามคำขอเจ้าของ** ตั้ง `SB_PAY_STRIPE_ENABLED=true` และ `sb_pay_settings.stripe_enabled=true` ตรวจ public catalog จริงตอบ `enabled.stripe=true` ครบ 8 แพ็ก หลัง Stripe Account status แสดง Payments/Payouts/PromptPay Active และไม่มีงานยืนยันตัวตนค้าง

**Google Play Billing ยังไม่เปิด** Console ยังแสดง Create a payments profile to get started และ Supabase ยังไม่มี `GOOGLE_PLAY_PRODUCTION_SERVICE_ACCOUNT_JSON` / RTDN settings เจ้าของต้องสร้าง Payments profile ที่ https://play.google.com/console/u/0/developers/8061807277043627100/paymentssettings ก่อน แล้วจึงสร้างสินค้า 8 แพ็ก เชื่อมสิทธิ์ API/การแจ้งผล และทดสอบการซื้อใน Play ไม่เปิดสวิตช์ Google ก่อนขั้นตอนเหล่านี้เสร็จ ข้อมูลสถานะปิดร้านในผลทดสอบด้านล่างเป็นประวัติก่อนเปิด Stripe

## จุดตั้งค่าของคุณ

| ระบบ | เข้าไปที่ไหน | สิ่งที่คุณกรอกหรือยืนยันเอง |
|---|---|---|
| Stripe | https://dashboard.stripe.com/account/onboarding | ข้อมูลผู้ขาย/ธุรกิจ ผู้มีอำนาจยืนยันตัวตน บัญชีธนาคารรับเงิน ที่อยู่ ข้อมูลภาษีตามที่ Stripe ขอ |
| Stripe | Dashboard ของบัญชีจริง ไม่ใช่ Sandbox → Product catalogue | สินค้าทั้ง 8 แพ็กและราคา THB ตามตารางด้านล่าง เก็บ Live Price ID ของแต่ละแพ็ก |
| Stripe | Workbench → Webhooks / Event destinations | สร้าง endpoint แจ้งผลตามรายละเอียดด้านล่าง |
| Supabase | [Edge Functions → Secrets](https://supabase.com/dashboard/project/zycmmtvubzyxduxqpuzl/functions/secrets) | Live Stripe key, webhook signing secret, Google service-account JSON และค่าตั้งระบบด้านล่าง |
| Google Play | [Play Console ของ Soulbeast](https://play.google.com/console/u/0/developers/8061807277043627100/app/4972862105883328320/dashboard) → Monetize with Play | ยืนยัน payments profile/บัญชีรับเงิน สร้าง One-time products และเปิดจำหน่ายในประเทศที่เลือก |
| Google Cloud | https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com | เลือกโปรเจกต์สำหรับเกม เปิด Google Play Android Developer API |
| Google Cloud | IAM & Admin → Service Accounts | สร้างบัญชีระบบสำหรับตรวจ/consume รายการซื้อ แล้วเพิ่มบัญชีนั้นใน Play Console ด้วยสิทธิ์ดูข้อมูลการเงินและจัดการคำสั่งซื้อของแอปนี้เท่านั้น |
| Google Cloud | Pub/Sub → Topics / Subscriptions | ตั้งการแจ้งผล Google Play แบบ authenticated push ตามรายละเอียดด้านล่าง |

ไม่ต้องส่ง API key, service-account JSON, รหัสบัญชีธนาคาร, รหัสผ่าน หรือ OTP ในแชต และไม่ใส่ใน GitHub/แอป ข้อมูลลับกรอกใน Supabase Secrets โดยตรง

## แพ็กที่ใช้ทั้งสองช่องทาง

| Pack ID | คูปอง | ราคา THB | Google Product ID | สิทธิ์ |
|---|---:|---:|---|---|
| first-10 | 10 | 35 | soulbeast_first_10 | ครั้งเดียวต่อบัญชี |
| first-50 | 50 | 150 | soulbeast_first_50 | ครั้งเดียวต่อบัญชี |
| first-100 | 100 | 275 | soulbeast_first_100 | ครั้งเดียวต่อบัญชี |
| normal-5 | 5 | 35 | soulbeast_normal_5 | ซื้อซ้ำได้ |
| normal-10 | 10 | 70 | soulbeast_normal_10 | ซื้อซ้ำได้ |
| normal-50 | 50 | 300 | soulbeast_normal_50 | ซื้อซ้ำได้ |
| normal-100 | 100 | 550 | soulbeast_normal_100 | ซื้อซ้ำได้ |
| normal-200 | 200 | 1000 | soulbeast_normal_200 | ซื้อซ้ำได้ |

Stripe: ราคาแบบ one-time, THB, จำนวนสินค้าต่อรายการ 1 ไม่เปิดลดราคาหรือภาษีเพิ่มบน Checkout ของชุดราคานี้ เพราะเซิร์ฟเวอร์ตรวจยอดตรงตาราง Google Play: one-time consumable, ตั้ง buy option ที่ใช้งานหนึ่งรายการต่อ product ตาม native Billing ที่เตรียมไว้ ราคาที่ผู้เล่นเห็นอ่านจาก Google Play โดยตรง

ราคาและรหัสสินค้าเป็นข้อมูลสาธารณะ ส่งให้ผมช่วยตรวจได้ ส่วนคีย์ลับไม่ต้องส่ง

## สถานะที่ติดตั้งแล้ว

ติดตั้ง migration ตารางเติมเงินและฟังก์ชัน `soulbeast-payments` บน Supabase แล้ว และปิด Verify JWT with legacy secret เฉพาะฟังก์ชันนี้ตามอนุมัติ ตรวจ endpoint จริงแล้ว: catalog ตอบได้และทั้งสองช่องทาง `enabled: false`, คำขอบัญชีที่ไม่ล็อกอินถูกปฏิเสธ 401, Google notification/worker ที่ไม่มีสิทธิ์ถูกปฏิเสธ 401 และ origin อื่นถูกปฏิเสธ 403 ยังไม่ได้ใส่คีย์ผู้ขายจริงหรือเปิดรับเงิน

ขั้นตอนติดตั้งด้านล่างเก็บไว้สำหรับอัปเดต/กู้ระบบ ไม่ต้องสร้างฟังก์ชันซ้ำ ส่วนคีย์ สินค้า การแจ้งผล งานตรวจรายการอัตโนมัติ และการทดสอบกับผู้ให้บริการยังต้องตั้งค่าตามหัวข้อถัดไป

## Supabase: ชุดติดตั้งฝั่งเซิร์ฟเวอร์

สร้างชุดล่าสุดด้วย `node tools/build-production-payments.cjs`

1. สำรองฐานข้อมูลก่อน แล้วเปิด SQL Editor รัน `build/payments-production/004-production.sql` เป็น migration เพิ่มตารางใหม่ ไม่ย้ายผู้เล่นหรือเปลี่ยนยอดเดิม
2. สร้าง Edge Function ชื่อ **soulbeast-payments** จาก `build/payments-production/index.ts`
3. ในฟังก์ชันนี้ตั้ง Verify JWT with legacy secret เป็น OFF เพื่อให้ Stripe และ Google แจ้งผลได้ ฟังก์ชันตรวจ JWT บัญชีผู้เล่น, Stripe HMAC, Google OIDC และ worker secret เองแยกแต่ละเส้นทาง ห้ามปิดการตรวจสิทธิ์ในโค้ดหรือเปลี่ยนฟังก์ชันบัญชีเดิม
4. ตั้ง Secrets ตามตารางนี้ ส่วนเปิดรับคำสั่งซื้อยังคง false จนทดสอบครบ

| Secret | ค่า/แหล่งที่มา |
|---|---|
| STRIPE_LIVE_SECRET_KEY | Live secret/restricted key ของ Stripe อนุญาตอ่าน prices/products/payment intents/charges/disputes และสร้าง/อ่าน/expire Checkout Session |
| STRIPE_LIVE_WEBHOOK_SECRET | Signing secret ของ endpoint **จริง** ที่สร้างใหม่ ไม่ใช้ secret ของ Sandbox |
| GOOGLE_PLAY_PRODUCTION_SERVICE_ACCOUNT_JSON | JSON ของ service account ที่ให้สิทธิ์เฉพาะแอป Soulbeast ใน Google Play |
| SB_PAY_STRIPE_ENABLED | `false` ก่อนทดสอบ/เปิดจริง |
| SB_PAY_PLAY_ENABLED | `false` ก่อนทดสอบ/เปิดจริง |
| SB_PAY_RECONCILE_SECRET | ข้อความสุ่มอย่างน้อย 32 bytes สำหรับ worker สร้างและเก็บเอง |
| SB_PAY_RTDN_AUDIENCE | `https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-payments/play-notifications` |
| SB_PAY_RTDN_SERVICE_ACCOUNT_EMAIL | อีเมล service account ที่ Pub/Sub ใช้เซ็น authenticated push |
| SB_PAY_RTDN_SUBSCRIPTION | `projects/PROJECT_ID/subscriptions/soulbeast-payments` แทน PROJECT_ID ด้วยโปรเจกต์ Google Cloud ของคุณ |

ระบบบัญชีในแอปที่เผยแพร่ปัจจุบันใช้ game environment `test` แม้ผู้เล่นเป็นบัญชีจริง ชุดเติมเงินจริงจึงผูกกับ `test` ของตัวละครปัจจุบันอย่างชัดเจน **ไม่ย้ายไป environment live และไม่สร้างตัวละครใหม่** Ledger การเงินจริงใช้ตาราง `sb_pay_*` แยกต่างหาก หากจะย้ายเกม environment ต้องวางแผนย้ายบัญชีและแก้ catalog/server ให้ตรงกันก่อน

## Stripe: endpoint แจ้งผล

URL:
`https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-payments/stripe-webhook`

เลือก events:

- checkout.session.completed
- checkout.session.async_payment_succeeded
- checkout.session.expired
- charge.refunded
- charge.dispute.created
- charge.dispute.closed

เป็น endpoint ของ Live account และ Snapshot events ระบบตรวจลายเซ็น raw body แล้วอ่านผลล่าสุดจาก Stripe อีกครั้ง ไม่ส่งคูปองจากหน้า success URL หรือจาก event ที่ยังไม่ได้ชำระ

หลังสร้าง Live Prices ครบ ใส่ `stripe_price_id` ลง `public.sb_pay_packs` ให้ตรง Pack ID ทั้ง 8 แถว ตัวอย่าง `update public.sb_pay_packs set stripe_price_id='price_รหัสจริง' where id='normal-5';` อย่าใช้ test Price ID เดิม

อธิบายสินค้าและการใช้งานคูปองสุ่มในเกมต่อ Stripe ตามจริง และดำเนินการตามการตรวจสอบของผู้ให้บริการให้เรียบร้อยก่อนเปิด

## Google Play: แจ้งผลและรายการคืนเงิน

1. สร้าง Pub/Sub topic เช่น `soulbeast-payments` ให้ `google-play-developer-notifications@system.gserviceaccount.com` มี Pub/Sub Publisher เฉพาะ topic นี้
2. Play Console → Monetization setup → Real-time developer notifications ใส่ full topic name และเปิด one-time product notifications
3. สร้าง Push subscription `soulbeast-payments` ไป URL ด้านล่าง เปิด Authentication เลือก push service account และ Audience ให้ตรง `SB_PAY_RTDN_AUDIENCE` service agent ของ Pub/Sub ต้องสร้าง OIDC token ในนามบัญชีที่เลือกได้ ตามคู่มือ Google
4. ตั้งชื่อ subscription เต็มใน `SB_PAY_RTDN_SUBSCRIPTION` และอีเมล push account ใน `SB_PAY_RTDN_SERVICE_ACCOUNT_EMAIL` ห้ามใช้การแจ้งผลแบบไม่ตรวจลายเซ็น
5. กด Send test notification จาก Google Play ต้องตอบสำเร็จ การแจ้งผลเป็นเพียงสัญญาณให้เซิร์ฟเวอร์อ่านรายการจริงจาก Google ไม่เชื่อข้อมูลเพื่อส่งคูปองทันที

URL:
`https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-payments/play-notifications`

## งานอัตโนมัติทุก 5 นาที

ใน Supabase Vault สร้าง secret ชื่อ `soulbeast_pay_reconcile` ให้ค่าเหมือน `SB_PAY_RECONCILE_SECRET` แล้วรัน `server/payments/production/005-reconciliation-cron.sql`

งานนี้ตรวจรายการค้าง ส่งคูปองที่ยืนยันแล้ว retry consume และอ่านรายการคืนเงิน/voided purchases จาก Google โดยไม่ต้องรอผู้เล่นเปิดแอป ตรวจผลใน Integrations → Cron และ Edge Function logs ถ้ามี `failed>0` ต้องตรวจสาเหตุก่อนเปิดรับเงิน ห้ามปิด worker เมื่อมีรายการชำระเงินจริงค้าง

## หน้าและข้อมูลผู้ขาย

- ร้าน: https://gusgoat.github.io/Soulbeast/topup.html
- การซื้อ/คืนเงิน: https://gusgoat.github.io/Soulbeast/purchase-policy.html
- Privacy: https://gusgoat.github.io/Soulbeast/privacy.html
- ขอลบบัญชี: https://gusgoat.github.io/Soulbeast/delete-account.html

ตรวจเนื้อหาและเพิ่มข้อมูลชื่อผู้ขาย/อีเมล/ที่อยู่ที่ผู้ให้บริการขอให้ตรงข้อมูลจริงก่อนรับเงิน ใน Play Console ใส่ URL Privacy, Data deletion และตอบ Data safety ตามข้อมูลและ SDK ที่ใช้งานจริง หน้าขอลบบัญชีบันทึกคำขอให้ผู้ดูแล ไม่ใช่การลบอัตโนมัติ ผู้ดูแลต้องรับผิดชอบดำเนินการลบข้อมูลบัญชี/ตัวละครที่อนุมัติ และกำหนดระยะเก็บเอกสารธุรกรรมให้ชัดเจน

ดูคำขอใน Supabase Table Editor → `sb_pay_deletion_requests` หรือ SQL Editor ด้วยบัญชีเจ้าของเท่านั้น ห้ามเปิดตารางเหล่านี้ให้ anon/authenticated อ่าน ผู้ใช้ส่งคำขอเฉพาะบัญชีตนเองผ่าน endpoint หลังเข้าสู่ระบบ มีปุ่มในตั้งค่าแอปและหน้าร้านเว็บ

## ทดสอบก่อนเปิด

ตรวจการเชื่อมต่อโดยไม่เริ่มซื้อได้จาก Edge Functions → `soulbeast-payments` → Test: ส่ง `{"action":"connection_check"}` และใช้ **Add header options → Add secret key** ของ Supabase Dashboard (คีย์ผู้ดูแลโปรเจกต์ ไม่ใช่คีย์ Stripe) คำสั่งนี้ยอมรับเฉพาะคีย์ผู้ดูแลที่มีอยู่ใน environment ของโปรเจกต์ แล้วใช้คีย์ Stripe ที่เก็บบนเซิร์ฟเวอร์อ่าน Live Price ทั้ง 8 แพ็ก ไม่สร้าง Checkout ไม่ชำระเงิน ไม่เปลี่ยนยอด/ledger/สวิตช์ร้าน และไม่ส่งค่าคีย์กลับมา หลังทดสอบล้างช่อง Header value ก่อนเก็บภาพผล

ผล `ok: true` ยืนยันว่าคีย์อ่านราคาจริงได้ และราคา/สกุลเงิน/ชนิดชำระครั้งเดียวตรงกับ catalog พร้อมตรวจว่ามี webhook secret ในรูปแบบที่ถูกต้องเท่านั้น **ยังไม่ยืนยันสิทธิ์เขียน Checkout หรือการส่ง webhook ครบวงจร** (`checkoutWriteTested` และ `webhookDeliveryTested` เป็น false) จึงยังต้องทำขั้นตอนทดสอบด้านล่างก่อนเปิดรับเงินจริง

`npm run test:production` ตรวจด้วย PostgreSQL/WASM และข้อมูลผู้ให้บริการจำลอง: เจ้าของตัวละคร ราคา/โหมด บัญชีอื่นใช้ไม่ได้ ไม่ส่งคูปองเมื่อค้าง CAS/ledger transaction ส่งซ้ำไม่เพิ่ม โปรโมชั่นข้ามช่องทาง คืนเงินบางส่วน/เต็ม/ข้อโต้แย้ง ยอดค้างตรวจสอบ retry consume และการแจ้งผลปลอม

ยังต้องยืนยันกับผู้ให้บริการจริง:

- Stripe Sandbox เดิมทดสอบ Checkout + webhook ให้ครบวงจรด้วยยอดจำลองเท่านั้น ไม่ทดสอบระบบด้วยบัตรจริงในโหมดทดสอบ
- Google Play License testers ในระบบทดสอบเดิม: สำเร็จ ยกเลิก pending ปิดแอป คืนเงิน และซื้อซ้ำได้หลัง consume ระบบเงินจริงปฏิเสธ license-test purchase เพื่อไม่ผสม ledger
- ตรวจ Live Stripe account ได้รับอนุมัติ, webhook จริงรับ event, ราคาทั้ง 8 ตรง, Google products active และสิทธิ์ service account/RTDN ถูกต้อง
- ตรวจคูปองตัวละครจากเซิร์ฟเวอร์และการกู้รายการเดิม ไม่มีการแก้คูปองใน client
- การซื้อเงินจริงครั้งแรกต้องเป็นการซื้อที่เจ้าของตั้งใจทำด้วยตนเอง ไม่ให้เอเจนต์กดชำระแทน

## ผลตรวจ Checkout / webhook วันที่ 24 ตุลาคม 2026

ทดสอบกับ Stripe Sandbox จริงโดยไม่ใช้เงินหรือคูปองเกมจริง: บัตรจำลอง 35 บาทและ PromptPay จำลอง 35 บาทสำเร็จ, webhook ตอบ HTTP 200 และเพิ่มใน `sb_shop_test_credits` รายการละ 5 ใบเท่านั้น ส่งเหตุการณ์บัตรเดิมซ้ำแล้วตอบ 200 โดยเครดิตยังมี 1 รายการ/5 ใบ อีก Checkout กดกลับและสั่งหมดอายุแล้วได้รับ `checkout.session.expired` HTTP 200 โดยเครดิตเป็น 0 ทั้งหมดใช้คำสั่งซื้อ QA ที่จอง/ผูกผ่านคำสั่งผู้ดูแล ไม่ได้ทดสอบการล็อกอินและคลิกซื้อผ่านหน้าร้านด้วย session ผู้เล่น

endpoint จริงปฏิเสธ webhook ไม่มีลายเซ็น/ลายเซ็นปลอม (Sandbox 400, Live 401) และ public catalog ยังปิด Stripe/Google Play ชุด `test:payments` และ `test:production` ผ่าน รวมการคืนเงิน/ข้อพิพาท/ยอดติดลบ/สิทธิ์โปรโมชั่น/การส่งซ้ำในฐานข้อมูล PostgreSQL ทดสอบและ provider fixtures; การคืนเงินจริง/ข้อพิพาทจริงและ Google Play ยังไม่ได้ทดสอบกับผู้ให้บริการจริง

เพิ่มคำสั่งผู้ดูแล `{"action":"checkout_probe"}` ตามอนุมัติ ใช้ admin key แบบเดียวกับ connection_check เฉพาะขณะสวิตช์ร้านทั้งสองปิด: ตรวจราคา normal-5 สร้าง Live Checkout ที่ไม่ผูกคำสั่งซื้อหรือบัญชีเกม แล้ว expire ทันที ไม่ส่ง payable URL กลับ ไม่แก้ ledger ถ้าปิดไม่สำเร็จจะคืน sessionId และ `cleanup_required` ให้ผู้ดูแลปิดรายการทันที ห้ามเรียกซ้ำโดยไม่ตรวจผลครั้งก่อน

การทดสอบ Live รอบแรกถูก Stripe ปฏิเสธ HTTP 400 (`req_1zjT53ggvFMntE`) เพราะ `payment_method_types` ไม่รองรับในการสร้าง Checkout ตาม API ของบัญชี โค้ดปรับให้ใช้วิธีชำระจาก Stripe Dashboard ตามคู่มือ https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods และเพิ่ม regression test ทั้ง Checkout จริงและ probe แล้ว เจ้าของอนุมัติและติดตั้งการแก้นี้แล้ว ทดสอบ Live ผ่าน HTTP 200: session `cs_live_a10qBpCeTF3Gtkfca2MCBposz93reecSfTMoS7GTl983XHHTUDUfgjKi7D` ถูกปิดทันทีเป็น expired/unpaid, ไม่มี payment_intent และ ledgerWrites=0; webhook จริง `evt_1UTxVlLgZW0zbsdXFL3diSKm` ส่งถึงปลายทาง Live ตอบ HTTP 200 `{ok:true,ignored:true}` ตามที่ตั้งใจ เพราะ QA session ไม่ใช่คำสั่งซื้อผู้เล่น จึงยืนยันลายเซ็น/การส่ง Live ได้โดยไม่คิดเงินจริง

ตรวจหลังทดสอบ: production orders ยังคง 0, Stripe/Play disabled ทั้งใน DB และ public catalog, anonymous checkout_probe และ webhook ไม่มีลายเซ็นถูกปฏิเสธ 401 บัตรและ PromptPay เปิดใช้ใน Stripe Dashboard แต่บัญชียังแสดง Payouts paused ต้องให้เจ้าของจัดการ View task ก่อนเปิดรับเงินจริง การทดสอบนี้ไม่ยืนยัน paid fulfillment ด้วยเงินจริงหรือการซื้อ Google Play จริง

## เปิดและหยุดรับคำสั่งซื้อ

เมื่อทุกข้อผ่านและเจ้าของอนุมัติเปิดรับเงิน ให้เปิดทีละช่องทาง:

1. Secrets: `SB_PAY_STRIPE_ENABLED=true` และ/หรือ `SB_PAY_PLAY_ENABLED=true`
2. SQL: `update public.sb_pay_settings set stripe_enabled=true where id;` และ/หรือ `update public.sb_pay_settings set play_enabled=true where id;`
3. `catalog` ต้องตอบ `mode: production` และ enabled ช่องทางที่เปิดเป็น true ร้านจึงอนุญาตซื้อได้ แอปยังต้องเป็นรุ่น 0.2.17 ขึ้นไปที่ติดตั้งผ่าน Google Play

หยุดรับรายการใหม่ได้ด้วยตั้งคอลัมน์ใน `sb_pay_settings` เป็น false หรือ Secrets flag เป็น false แต่ **คง credentials, webhook และ cron** ไว้ให้รายการที่ชำระไปแล้วและการคืนเงินยังตรวจต่อได้ ไม่ย้อนโค้ดบัญชี/ยอดคูปองเพื่อปิดร้าน

กรณีคืนเงิน: ปรับจำนวนคูปองตามสิทธิ์ล่าสุด รายการเดิมที่เคยส่งแล้วไม่ส่งซ้ำ เงินคืนบางส่วนคำนวณคูปองปัดขึ้น หากใช้คูปองไปแล้วจะหักเท่าที่ยังเหลือและบันทึกยอดขาดใน `sb_pay_accounts.debt` พร้อมพักการซื้อเพื่อให้ผู้ดูแลตรวจสอบ ไม่ลบอสูร/อุปกรณ์ที่สุ่มมาอัตโนมัติ อย่าแก้ debt หรือ ledger โดยไม่มีการตรวจธุรกรรมต้นทาง

## เอกสารผู้ให้บริการ

- Stripe account: https://docs.stripe.com/get-started/account/set-up
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe fulfillment: https://docs.stripe.com/checkout/fulfillment
- Google billing backend: https://developer.android.com/google/play/billing/backend
- Google RTDN: https://developer.android.com/google/play/billing/rtdn-reference
- Pub/Sub push authentication: https://cloud.google.com/pubsub/docs/authenticate-push-subscriptions
