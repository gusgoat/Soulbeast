(function(g){'use strict';
const KEY='soulbeast-country-graphics-v1';
const CHANGE='walk-graphics-changed';
const storage=g.localStorage;
const levels=Object.freeze([
 Object.freeze({name:'ประหยัด',description:'ภาพพื้นฐาน ปิดน้ำไหล สภาพอากาศ และไอร้อน',scale:1,pixels:900000,frameMs:32,effects:0}),
 Object.freeze({name:'สมดุล',description:'เพิ่มความคม พร้อมเอฟเฟกต์แบบเบา',scale:1.5,pixels:900000,frameMs:32,effects:1}),
 Object.freeze({name:'คมชัด',description:'ภาพละเอียดขึ้นและการเคลื่อนไหวลื่นขึ้น พร้อมเอฟเฟกต์แบบเบา',scale:2,pixels:1600000,frameMs:16,effects:1}),
 Object.freeze({name:'สูงสุด',description:'ภาพคมที่สุด พร้อมเอฟเฟกต์ทุกอย่าง',scale:3,pixels:3200000,frameMs:16,effects:2})
]);
const valid=level=>Number.isInteger(level)&&level>=1&&level<=levels.length;
function read(){
 let saved;
 try{saved=Number(storage.getItem(KEY));}catch{}
 return valid(saved)?saved:(g.matchMedia?.('(pointer: coarse)').matches?2:4);
}
function write(level){
 if(!valid(level))return read();
 try{storage.setItem(KEY,String(level));}catch{return read();}
 g.dispatchEvent(new Event(CHANGE));
 return level;
}
g.WalkGraphics=Object.freeze({KEY,CHANGE,levels,read,write});
})(typeof window==='undefined'?globalThis:window);
