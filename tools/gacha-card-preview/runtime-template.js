(function(){
'use strict';
const SP=/* PREVIEW_BEAST_DATA */{};
const S={screen:'gacha'},GACHA={busy:false,rewards:[]},handlers={};
const Sound={enabled:true,volume:.65,run(){}},ExtraAudio={play(){}},Music={sync(){}},CharacterMotion={resolve:()=>null};
const ct=th=>th,esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const portrait=key=>'<img class="gacha-beast-preview" src="'+esc(SP[key].art)+'" alt="" decoding="async">';
function render(){document.getElementById('trialCards').innerHTML=GACHA.rewards.length?gachaRevealScene().replaceAll('gacha-reveal-v1/red.png','gacha-reveal-v1/red.png.webp').replaceAll('gacha-reveal-v2/summoning-open.png','gacha-reveal-v2/summoning-open.png.webp'):'';}

/* PRODUCTION_REVEAL_CODE */

const keys=Object.keys(SP);
function draw(count,all=false){
 if(window.SoulbeastCinematics?.isOpen())return;
 const picked=all?[...keys]:Array.from({length:count},()=>keys[Math.floor(Math.random()*keys.length)]);
 GACHA.rewards=picked.map(key=>({type:'pet',key,category:'solarBeast',form:0}));
 render();document.getElementById('trialStatus').textContent='ได้การ์ดทดลอง '+picked.length+' ใบ · รอเรียงการ์ด แล้วแตะใบที่ต้องการเปิด';
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-a]');if(button&&!button.disabled)handlers[button.dataset.a]?.(button.dataset.v);});
window.GachaCardTrial={draw,setSound:enabled=>{Sound.enabled=!!enabled;},source:/* PRODUCTION_SOURCE */null};
})();
