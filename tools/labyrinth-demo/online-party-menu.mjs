// Private inventory requests only when a menu opens; never part of motion broadcasts.
export function partyMenu({request,refresh,picture,onOpen,canOpen}){
 const $=id=>document.getElementById(id),panel=$('partyMenu'),body=$('partyMenuBody');const aux=$('partyAuxMenu'),quest=$('townDialog'),hud=[$('hudTop'),$('hudBottom')];let member=null;
 let tab='bag',data=null,busy=false,pending=null,generation=0;
 function close(){generation++;panel.hidden=true;if(quest.open)quest.close();aux.hidden=true;aux.removeAttribute('src');onOpen(false);window.focus();}
 function sendInventory(){if(data?.player&&!aux.hidden&&inventoryTabs.has(tab))aux.contentWindow.postMessage({type:'party-inventory-state',player:data.player,capacity:data.capacity},location.origin);}
 async function load(){
  const current=generation;
  $('partyMenuStatus').textContent='กำลังโหลดข้อมูล…';
  try{const result=await request({});if(current!==generation)return;
   if(!result.player)throw Error('ข้อมูลกระเป๋ายังไม่พร้อม');
   data=result;syncHud();sendInventory();$('partyMenuStatus').textContent='';
  }catch(e){if(current===generation)$('partyMenuStatus').textContent='โหลดไม่สำเร็จ · '+e.message;}
 }
 async function act(command){
  if(busy)return;
  busy=true;pending??={...command,requestId:crypto.randomUUID()};
  $('partyMenuStatus').textContent='กำลังบันทึก…';
  try{await request(pending);pending=null;await refresh();await load();}
  catch(e){$('partyMenuStatus').textContent=e.message==='invalid_inventory_action'?'ใช้คำสั่งนี้ไม่ได้ในสถานะปัจจุบัน':'บันทึกไม่สำเร็จ · กดอีกครั้งเพื่อตรวจรายการเดิม';if(['invalid_inventory_action','already_fighting'].includes(e.message))pending=null;}
  finally{busy=false;aux.contentWindow?.postMessage({type:'party-inventory-idle'},location.origin);}
 }
 $('partyMenuClose').onclick=close;$('menuReload').onclick=()=>void load();
 const titles={hero:'ตัวละคร',team:'อสูร',bag:'กระเป๋า',friends:'เพื่อน',mail:'จดหมาย',settings:'ตั้งค่า',coupon:'ร้านคูปอง'};
 const inventoryTabs=new Set(['hero','team','bag']);
 function syncHud(){if(!member)return;for(const frame of hud)frame.contentWindow?.postMessage({type:'party-hud-state',member,gold:data?.gold},location.origin);}
 for(const frame of hud)frame.addEventListener('load',syncHud);
 function open(screen){
  if(!canOpen()||busy)return;
  close();
  if(screen==='quests'){window.townQuests.show(true);onOpen(true);return;}
  if(!Object.hasOwn(titles,screen))return;
  tab=screen;generation++;panel.hidden=false;panel.dataset.tab=tab;onOpen(true);
  $('partyMenuTitle').textContent=titles[tab];$('partyMenuStatus').textContent='';
  const inventory=inventoryTabs.has(tab);
  body.hidden=true;$('menuReload').hidden=!inventory;aux.hidden=false;
  const country=['blue','green','red'].includes(member?.country)?member.country:'blue';
  aux.src=tab==='coupon'?'../town-walk-demo/coupon.html':`../town-walk-demo/menu.html?${inventory?'partyInventory=2':'partyAux=1'}&screen=${tab}&dungeon=party&country=${country}&city=${country}-capital`;
  if(inventory){data=null;void load();}
 }
 quest.addEventListener('close',()=>onOpen(false));
 addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  if(hud.some(frame=>frame.contentWindow===event.source)&&event.data?.type==='walk-menu')open(event.data.screen);
  if(event.source===aux.contentWindow&&!aux.hidden){
   if(event.data?.type==='party-inventory-ready')sendInventory();
   if(event.data?.type==='party-inventory-command'&&inventoryTabs.has(tab)&&canOpen())void act(event.data.command);
   if(event.data?.type==='town-return')close();
   if(event.data?.type==='town-open-quests')open('quests');
  }
 });
 return {close,get open(){return !panel.hidden||quest.open;},update(m){member=m;syncHud();}};
}
