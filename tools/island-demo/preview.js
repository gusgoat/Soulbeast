(()=>{'use strict';
const I=window.IslandRules;
const kit=IslandPreviewProfile,previewId=kit.id,previewKey='soulbeast-walk-save:'+previewId;
const read=()=>JSON.parse(sessionStorage.getItem(I.key)||localStorage.getItem(previewKey)||'null');
const choices=document.getElementById('choices'),message=document.getElementById('message');
const activePlayer=JSON.parse(sessionStorage.getItem(I.key)||'null');
if(sessionStorage.getItem(I.onlineKey)||(activePlayer&&activePlayer.walkId!==previewId)){
 message.textContent='เปิดตัวอย่างในแท็บใหม่เพื่อใช้เซฟทดสอบแยกจากตัวละครที่กำลังเล่น';
 const link=document.createElement('a');link.href=location.href;link.target='_blank';link.rel='noopener';
 link.textContent='เปิดแท็บทดสอบเกาะ';choices.append(link);return;
}
const current=read(),active=current&&I.state(current).visit;
if(kit.upgrade(current,WalkVitals.maximum)){
 sessionStorage.setItem(I.key,JSON.stringify(current));
 localStorage.setItem(previewKey,JSON.stringify(current));
}
function button(text,action){
 const control=document.createElement('button');control.type='button';control.textContent=text;
 control.onclick=action;choices.append(control);
}
if(active)button('กลับไป'+I.islands[active.country].name,()=>{
 sessionStorage.setItem(I.key,JSON.stringify(current));
 location.assign('index.html?country='+active.country);
});
const preferred=new URLSearchParams(location.search).get('country');
const destinations=I.countries.includes(preferred)?[preferred,...I.countries.filter(country=>country!==preferred)]:I.countries;
for(const country of destinations)button('ไป'+I.islands[country].port,()=>{
 const player=read()||{
  ...structuredClone(MineGameData.demo),name:'ผู้สำรวจเกาะ',country,lv:60,gold:40000,walkId:previewId,
  pts:{hp:35,mp:15,patk:65,pdef:32,mdef:32,spd:35,acc:34},
  items:{pot:30,eth:20,seal1:30,seal2:20,eternalSeal:5},eq:{weapon:'wp_sword6'},
 };
 if(!read()){
  kit.upgrade(player,WalkVitals.maximum);
  localStorage.setItem(previewKey,JSON.stringify(player));
 }
 sessionStorage.setItem(I.key,JSON.stringify(player));
 location.assign('../hemant-walk-demo/index.html?country='+country+'&arrival=island-port');
});
})();
