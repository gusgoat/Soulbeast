CON.fusionSeal={n:'ผนึกรวมร่าง',d:'สิทธิ์ถาวรเฉพาะตัวละคร · แปลงกายเป็นอสูรที่พกติดตัวบนแผนที่ประเทศ · ซื้อด้วยคูปองเท่านั้น',rareLoot:true,bagAction:'useFusion',bagDisabled:()=>params.get('walkScene')!=='country'||!!(S.battle&&!S.battle.over)};
ITEM_ART.fusionSeal='assets/world-quests/beast-fusion-seal-v1.png.webp';
if(S.P.entitlements?.beastFusion){S.P.items.fusionSeal=1;}
handlers.useFusion=()=>{if(params.get('walkScene')!=='country'||S.battle&&!S.battle.over)return;save();parent.postMessage({type:'walk-fusion-open'},location.origin)};
const fusionBuy=handlers.buy;handlers.buy=function(id){if(id==='fusionSeal')return toast('ซื้อผนึกรวมร่างด้วยคูปองจากร้านคูปองเท่านั้น');return fusionBuy(id)};
