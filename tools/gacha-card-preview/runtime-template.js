(function(){
'use strict';
const SP=/* PREVIEW_BEAST_DATA */{};
const fixtures=/* PREVIEW_FIXTURES */{},EQ=fixtures.eq,CON=fixtures.con,GACHA_NAMES=fixtures.names;
const S={screen:'gacha'},GACHA={busy:false,rewards:[]},handlers={};
const Sound={enabled:true,volume:.65,run(){}},ExtraAudio={play(){}},Music={sync(){}},CharacterMotion={resolve:()=>null};
const ct=th=>th,esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const portrait=key=>{const src=esc(SP[key].art);return '<span class="gacha-portrait"><img class="gacha-art-ambience" src="'+src+'" alt="" aria-hidden="true" decoding="async"><img class="gacha-beast-preview" src="'+src+'" alt="" decoding="async"></span>';};
const itemIcon=key=>'<span class="item-art"><img src="'+esc((EQ[key]||CON[key]).art)+'" alt="" decoding="async"></span>';
function render(){document.getElementById('trialCards').innerHTML=GACHA.rewards.length?gachaRevealScene().replace(/gacha-reveal-v1\/(white|green|blue|purple|gold|red)\.png/g,'gacha-reveal-v1/$1.png.webp').replaceAll('gacha-reveal-v2/summoning-open.png','gacha-reveal-v2/summoning-open.png.webp'):'';}

/* PRODUCTION_REVEAL_CODE */

const keys=Object.keys(SP).filter(k=>SP[k].solar);
function draw(count,all=false){
 if(window.SoulbeastCinematics?.isOpen())return;
 const picked=all?[...keys]:Array.from({length:count},()=>keys[Math.floor(Math.random()*keys.length)]);
 GACHA.rewards=picked.map(key=>({type:'pet',key,category:'solarBeast',form:0}));
 render();document.getElementById('trialStatus').textContent='ได้การ์ดทดลอง '+picked.length+' ใบ · รอเรียงการ์ด แล้วแตะใบที่ต้องการเปิด';
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-a]');if(button&&!button.disabled)handlers[button.dataset.a]?.(button.dataset.v);});
function drawMixed(){if(window.SoulbeastCinematics?.isOpen())return;GACHA.rewards=fixtures.mixed.map(r=>({...r}));render();document.getElementById('trialStatus').textContent='ชุดทดลองคละ '+GACHA.rewards.length+' ใบ · ครบทุกระดับสีและทุกประเภท · ไม่ใช้คูปองจริง';}
window.GachaCardTrial={draw,drawMixed,setSound:enabled=>{Sound.enabled=!!enabled;},source:/* PRODUCTION_SOURCE */null};
})();
