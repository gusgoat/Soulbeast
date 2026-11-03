/* Inserted into the isolated game's lexical scope. Purchases use its normal gold/item flow. */
CON.beastRepellent={n:'เครื่องหอมไล่อสูร',d:'ป้องกันเงาอสูรวิ่งเข้าหาผู้ผนึกบนแผนที่ประเทศ 10 นาที หากเข้าไปชนเองยังเกิดการต่อสู้ · ใช้จากกระเป๋า · ไม่ป้องกันโจรป่า',price:150,lv:1};
ITEM_ART.beastRepellent=ITEM_ART.calm;
const repellentRules=window.walkRepellent;
handlers.buyRepellent=()=>handlers.buy(repellentRules.ITEM);
handlers.useRepellent=()=>{if(S.screen!=='bag'||S.battle&&!S.battle.over)return;const result=repellentRules.activate(S.P);if(!result.ok){toast(result.reason==='active'?'เครื่องหอมไล่อสูรยังไม่หมดฤทธิ์':'ไม่มีเครื่องหอมไล่อสูร');return}save();render();toast('ใช้เครื่องหอมไล่อสูรแล้ว · ป้องกันเงาอสูร 10 นาที')};
// Render through the same consumable rows as potions and seals.
CON.beastRepellent.bagAction='useRepellent';
CON.beastRepellent.bagDisabled=()=>!!repellentRules.remaining(S.P)||!!(S.battle&&!S.battle.over);
const repellentBag=vBag;vBag=function(){const html=repellentBag(),left=repellentRules.remaining(S.P);return left?html.replace('<h3>ยา ยาแก้สถานะ และผนึก</h3>','<h3>ยา ยาแก้สถานะ และผนึก</h3><small data-repellent-time>คุ้มครองเหลือ '+repellentRules.format(left)+'</small>'):html};
setInterval(()=>{if(S.screen!=='bag')return;const status=document.querySelector('[data-repellent-time]');if(status){const remaining=repellentRules.remaining(S.P);status.textContent=remaining?'คุ้มครองเหลือ '+repellentRules.format(remaining):''}const row=document.querySelector('[data-consumable="beastRepellent"]');if(!row)return;const left=repellentRules.remaining(S.P),label=row.querySelector('.bag-item-copy .sub'),button=row.querySelector('[data-a="useRepellent"]');if(label)label.textContent=CON.beastRepellent.d+(left?' · คุ้มครองเหลือ '+repellentRules.format(left):'');if(button)button.disabled=!!left||!!(S.battle&&!S.battle.over)},1000);
