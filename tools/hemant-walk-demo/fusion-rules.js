(function(g){'use strict';
const ITEM='fusionSeal',PRICE=50,ART='/Soulbeast/assets/world-quests/beast-fusion-seal-v1.png.webp';
const beasts=[['solar_cryostag','คริโอสเทล',.35,'crystal-stag'],['eclipse_wolf','หมาป่าคราสนิรันดร์',.25,'moonwolf'],['baihu','เสือขาวไป่หู่',.15,'white-tiger'],['legend2_tricephalos','ไตรเซฟาลอส มังกรสามเศียร',.25,'tricephalos'],['solar_pentadrake','เพนทาไพโรส มังกรห้าเศียร',.35,'infernal-hydra'],['qilin','กิเลน',.15,'golden-kirin'],['solar_sovereign','พญาราชสีห์สุริยะ',.25,'solar-lion']].map(([sp,name,boost,model])=>({sp,name,boost,model}));
const portraits={solar_cryostag:'/Soulbeast/assets/beasts/solar/solar_cryostag.webp',baihu:'/Soulbeast/assets/media/cf6ac6efb738d271f91db73d.webp',legend2_tricephalos:'/Soulbeast/assets/beasts/eclipse-v2/legend2_tricephalos.webp',solar_pentadrake:'/Soulbeast/assets/beasts/solar/solar_pentadrake.webp',qilin:'/Soulbeast/assets/media/f52f778aef5eaa0b132732a2.webp'};
for(const beast of beasts){beast.portrait=portraits[beast.sp]||'/Soulbeast/assets/beasts/mist-beasts.webp';if(beast.sp==='eclipse_wolf')beast.portraitPosition='100% 100%';if(beast.sp==='solar_sovereign')beast.portraitPosition='0% 100%'}
function owned(p){return !!p&&(p.entitlements?.beastFusion===true||Number(p.items?.[ITEM])>0)}
function available(p){const carried=new Set((p?.carried??p?.party??[]).map(String));const types=new Set((p?.pets||[]).filter(v=>carried.has(String(v.uid))).map(v=>v.sp));return beasts.filter(b=>types.has(b.sp))}
function balance(p){return Math.max(0,Math.floor(Number(p?.walkCoupons)||0))}
function buy(p){if(!p)return {ok:false,reason:'character'};if(owned(p))return {ok:false,reason:'owned'};if(balance(p)<PRICE)return {ok:false,reason:'funds'};p.walkCoupons=balance(p)-PRICE;p.items||={};p.items[ITEM]=1;p.entitlements||={};p.entitlements.beastFusion=true;return {ok:true}}
function current(p){return owned(p)?available(p).find(b=>b.sp===p.walkFusion)||null:null}
function choose(p,sp){if(!owned(p)||!available(p).some(b=>b.sp===sp))return false;p.walkFusion=sp;return true}
const api={ITEM,PRICE,ART,beasts,owned,available,balance,buy,current,choose};g.BeastFusionRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
