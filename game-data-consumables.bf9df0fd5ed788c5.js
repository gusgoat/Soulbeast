'use strict';
Object.assign(SoulbeastContent,{
CON:()=>({
 petExp1:{n:'ผลึกเติบโตอสูร',d:'เพิ่ม EXP ให้อสูร 500 ใช้ได้เฉพาะนอกการต่อสู้',price:300,petExp:500},
 petExp2:{n:'ผลึกเติบโตอสูรชั้นสูง',d:'เพิ่ม EXP ให้อสูร 2500 ใช้ได้เฉพาะนอกการต่อสู้',price:1300,petExp:2500,lv:15},
 petExp3:{n:'ผลึกเติบโตอสูรโบราณ',d:'เพิ่ม EXP ให้อสูร 10000 ใช้ได้เฉพาะนอกการต่อสู้',price:4500,petExp:10000,lv:30},
 pot:{n:'ยาฟื้นพลัง',d:'ฟื้น HP 60',price:20,hp:60},
 pot2:{n:'ยาฟื้นพลังชั้นสูง',d:'ฟื้น HP 250',price:90,hp:250,lv:10},
 pot3:{n:'ยาฟื้นพลังเต็มขวด',d:'ฟื้น HP 700',price:300,hp:700,lv:25},
 eth:{n:'น้ำมนต์เวท',d:'ฟื้น MP 30',price:30,mp:30},
 eth2:{n:'น้ำมนต์เวทชั้นสูง',d:'ฟื้น MP 120',price:150,mp:120,lv:20},
 revivePotion:{n:'ยาชุบชีวิตแห่งแสง',d:'ไอเท็มหายากจากหีบ ชุบอสูรที่หมดสติ 1 ตัว ฟื้น HP เต็ม',price:0,rev:1,rareLoot:true},
 rev:{n:'ธูปเรียกวิญญาณ',d:'ปลุกอสูรที่หมดสติ ฟื้น HP ครึ่งหนึ่ง',price:120,rev:.5},
 antidote:{n:'ยาแก้พิษ',d:'รักษาติดพิษ',price:15,cure:['poison']},
 burnheal:{n:'ขี้ผึ้งดับร้อน',d:'รักษาติดไฟ',price:15,cure:['burn']},
 thaw:{n:'น้ำมันอุ่นกาย',d:'รักษาแช่แข็งและเยือกแข็ง',price:15,cure:['freeze','chill']},
 relax:{n:'ยาคลายเส้น',d:'รักษาอัมพาตและไฟฟ้าสถิต',price:15,cure:['para','static']},
 calm:{n:'ธูปสงบจิต',d:'รักษานอนหลับ มึนงง หลงรัก มนต์สะกด',price:25,cure:['sleep','confuse','love','charm']},
 allcure:{n:'โอสถครอบจักรวาล',d:'รักษาทุกสถานะ',price:70,lv:8,cure:Object.keys(STS)},
 seal1:{n:'ผนึกกระดาษ',d:'พลังผนึก ×1.0',price:30,seal:1},
 seal2:{n:'ผนึกหยก',d:'พลังผนึก ×1.7',price:120,seal:1.7,lv:6},
 seal3:{n:'ผนึกทองคำ',d:'พลังผนึก ×2.6',price:420,seal:2.6,lv:13},
 seal4:{n:'ผนึกจักรพรรดิ',d:'พลังผนึก ×4.0',price:1300,seal:4,lv:21},
 seal5:{n:'ผนึกสวรรค์',d:'พลังผนึก ×6.0',price:3500,seal:6,lv:32},
}),
CURES:()=>(['antidote','burnheal','thaw','relax','calm']),
SEALS:()=>(['seal1','seal2','seal3','seal4','seal5'])
});
