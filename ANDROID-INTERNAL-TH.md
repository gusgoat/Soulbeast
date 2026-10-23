# Soulbeast Android — รุ่นทดสอบภายใน

รุ่นนี้ใช้บัญชีและเซฟ environment `test` ของ Supabase เป็นเกมที่แพ็กไฟล์ไว้ในแอปด้วย Capacitor ไม่ใช่การเปิดเว็บเกมหลักแบบ remote URL หน้าเกมหลักยังคงเดิมจนระบบส่งอีเมลพร้อม

## สิ่งที่ทำแล้ว

- สมัคร/เข้าบัญชีอีเมลและรหัสผ่าน ใช้เจ้าของตัวละครจากเซิร์ฟเวอร์เดียวกับเว็บทดสอบ
- ป้องกันเซฟเก่าจากอีกเครื่องเขียนทับเซฟใหม่: ตรวจ timestamp ภายใน snapshot/commit retry และใช้ receipt เดิมเมื่อส่งซ้ำหลังคำตอบสูญหาย
- มีการเก็บเซฟในเครื่องและสำรองก่อนโหลดเซฟเมื่อเกิด conflict
- แยกตัวเลือกเติมเงิน: เว็บไป Stripe Sandbox; Android ใช้ Google Play เท่านั้น ไม่มี fallback หรือปุ่มพาไปจ่าย Stripe
- Google Play Billing 9.1.0 อยู่ใน native plugin พร้อม query products, launch purchase และ query unfinished purchases แต่ปิดการซื้อทั้ง native BuildConfig และ config ของเกม
- ไม่มีการเพิ่มคูปองหรือ consume purchase ในฝั่งแอป มีแกนตรวจ purchase ฝั่งเซิร์ฟเวอร์และ tests เตรียมไว้ แต่ยังไม่มี endpoint/ledger สำหรับแจกคูปองจาก Google Play เปิดใช้งานจริง
- ปุ่มย้อนกลับและการพักแอปเรียกเก็บเซฟในเครื่อง ไม่รีเซ็ตเกม
- แพ็กภาพ/เสียงในแอป ไม่บรรจุ admin, SQL, Stripe checkout, secrets หรือหน้าจำลอง QA

## ข้อมูลรุ่น

- ชื่อ: Soulbeast
- Package ID ปัจจุบันที่เจ้าของอนุมัติ: `com.soulbeastgame.app` (APK รุ่นเก่าใช้ `io.github.gusgoat.soulbeast.internal`)
- Android 7+ (minSdk 24), targetSdk/compileSdk 36
- Capacitor 8.5.3, App plugin 8.1.2, Node 24, JDK 21
- มี APK debug สำหรับติดตั้งทดสอบ และ AAB release ที่ยังต้องลงนามด้วย upload key ส่วนตัวก่อนส่ง Play Console ดู `GOOGLE-PLAY-SETUP-TH.md`
- คีย์ debug ของ CI อาจเปลี่ยนระหว่าง build จึงยังไม่รับประกันการติดตั้งทับ APK รุ่นก่อน ก่อนใช้ทดสอบต่อเนื่องควรตั้งคีย์ลงนามทดสอบส่วนตัวใน Secrets ห้าม commit keystore หรือรหัสผ่าน

## พื้นที่ปลอดภัยของหน้าจอ Android (0.2.1-internal / versionCode 3)

ใช้ SystemBars native insets และ viewport-fit=contain เฉพาะไฟล์ในแอป ให้ WebView รวมปุ่ม fixed และหน้าต่างต่าง ๆ อยู่พ้นแถบนาฬิกา/ปุ่มนำทาง/รอยบาก ขอบแถบระบบสีเข้มและไอคอนสีสว่าง ไม่มีการเพิ่ม padding ซ้ำใน CSS หน้าเว็บ ต้องตรวจจริงทั้งโหมด 3 ปุ่มและ gesture, แนวนอน, หน้าต่อสู้/ปุ่มไปต่อ/เมนูล่าง/คีย์บอร์ดบนเครื่องทดสอบอีกครั้ง

## สนามต่อสู้ตามสถานที่ (0.2.3-internal / versionCode 5)

กรอบรวมศัตรูและทีมใช้ภาพสถานที่เดิมร่วมกับลายประดับ SVG ขนาดเล็ก 10 แบบ: ป่า หมอก ทะเลทราย มังกรเพลิง ซากสวรรค์ ป้อมปราการ ห้องบอส ลานประลอง บัลลังก์จอมมาร และบอสโลก รวมถึงการต่อสู้ออนไลน์ ไม่เพิ่มค่าในเซฟหรือเปลี่ยนกติกาการต่อสู้ ลายประดับไม่รับการแตะและไม่ทับข้อความ HP/MP ปุ่มเลือกเป้าเดิมยังทำงานตามเดิม

ตรวจตัวอย่างผ่าน `battle-preview.html` ซึ่งแยกจากบัญชี/เซฟ/เครือข่ายจริง รุ่น Android ต้องติดตั้ง AAB ใหม่ผ่าน Internal testing โดยลงนามด้วย upload key เดิม ห้ามสร้างกุญแจใหม่หรือเปลี่ยนการตั้งค่า safe area ที่ผู้เล่นยืนยันว่าใช้งานได้แล้ว

## Build

```sh
npm ci --prefix tools/runtime-build --ignore-scripts --no-audit --no-fund
npm ci --prefix mobile --ignore-scripts --no-audit --no-fund
npm run test:accounts
node tools/test-platform-billing.cjs
node tools/build-mobile.cjs
cd mobile
npx --no-install cap sync android
cd android
./gradlew :app:assembleDebug :app:lintDebug
```

ใช้ JDK 21 และ Android SDK 36 ที่ติดตั้งและยอมรับข้อตกลงแล้ว เครื่องนี้ยังไม่มี SDK จึงใช้ GitHub Actions `Android internal APK` ซึ่งใช้ SDK ที่มีใน runner และเก็บ APK เป็น artifact 14 วัน ไม่ใช้ service key หรือข้อมูลบัญชีผู้เล่นในการ build

## ทดสอบบนโทรศัพท์

1. ติดตั้ง APK บนเครื่อง Android ทดสอบด้วยตัวเอง
2. สมัครบัญชีใหม่ ยืนยันอีเมล แล้วล็อกอินด้วยรหัสผ่าน (ขั้นนี้ยังรอ SMTP ของเจ้าของเกม)
3. สร้างตัวละคร เลือกเพศ/อาชีพ/คู่หู ทดสอบบทสอน ต่อสู้ บันทึก แล้วโหลดจากเว็บทดสอบด้วยบัญชีเดียวกัน
4. เปิดบัญชีเดียวกันบนสองเครื่อง ทดสอบว่าเซฟที่เก่ากว่าไม่ทับความคืบหน้าใหม่
5. ทดสอบกด Home/กลับเข้าแอป ปิดเสียง ปุ่มย้อนกลับ เครือข่ายหลุด และการกลับมาหลังแอปถูกปิด
6. ปุ่มร้าน Google Play ต้องแจ้งว่ายังไม่เปิดชำระเงิน และต้องไม่เปิด Stripe

อีเมลยืนยันและกู้รหัสผ่านเปิดกลับเว็บ `accounts-staging.html` ในเบราว์เซอร์ก่อน แล้วกลับแอปเพื่อล็อกอิน ยังไม่ตั้ง native App Links จนกว่าโดเมนและลายเซ็นแอปจะพร้อม

## ก่อนเปิดให้ซื้อใน Google Play

- สมัคร/ยืนยัน Play Console, สร้างแอปและ internal testing track, เลือก Package ID production และเก็บ upload key ให้ปลอดภัย
- สร้าง one-time products ตาม `content/billing-channels.json` และตั้งราคา/ผู้ทดสอบใบอนุญาตใน Play Console
- ตั้ง Google Play Developer API/service account เฉพาะสิทธิ์ที่จำเป็น โดยเก็บ credential ใน server secrets
- ติดตั้ง fulfillment endpoint และ ledger รวมที่ตรวจ token กับ Google, ผูก account/order/character, จำกัดโปรโมชั่นข้ามเว็บและแอป, ป้องกันซ้ำ, รองรับ pending/refund/revocation และ consume หลังแจกสำเร็จเท่านั้น ปัจจุบันยังไม่เปิดส่วนนี้
- ทดสอบ license-test purchases ครบวงจรก่อนเปิด flag native และ server ไม่ใช้เงินจริงทดสอบขั้นแรก
- ตั้ง SMTP, ทดสอบยืนยัน/กู้รหัสผ่านจริง, เพิ่มกระบวนการลบบัญชีทั้งในแอปและเว็บไซต์, Privacy Policy/Data safety, อัตรากาชา, age rating, สิทธิ์ภาพ/เสียง และบัญชีสำหรับผู้ตรวจแอป
- การปล่อย Play Store จริงต้องมีการทดสอบบนเครื่องและผ่านการตรวจของ Google อีกครั้ง ไม่ได้เผยแพร่จาก workflow นี้

แหล่งข้อมูล:
- https://capacitorjs.com/docs/getting-started
- https://developer.android.com/google/play/billing/integrate
- https://support.google.com/googleplay/android-developer/answer/9858738
- https://support.google.com/googleplay/android-developer/answer/13327111
