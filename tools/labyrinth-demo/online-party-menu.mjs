// Private inventory requests only when a menu opens; never part of motion broadcasts.
export function partyMenu({request,refresh,getFloor,onOpen,canOpen}){
 const $=id=>document.getElementById(id),panel=$('gameMenu'),aux=$('menuFrame'),quest=$('townDialog'),hud=[$('hudTop'),$('hudBottom')];
 const feedback=document.createElement('div');
 feedback.className='party-menu-feedback';feedback.hidden=true;
 feedback.innerHTML='<span role="status"></span><button type="button" data-retry>โหลดอีกครั้ง</button><button type="button" data-close>กลับไปเดินต่อ</button>';
 panel.append(feedback);
 const status=feedback.querySelector('span'),retry=feedback.querySelector('[data-retry]');
 function report(message='',canRetry=false){
  status.textContent=message;feedback.hidden=!message;retry.hidden=!canRetry;
 }
 let member=null;
 let tab='bag',data=null,busy=false,pending=null,generation=0;
 function close(){generation++;panel.hidden=true;if(quest.open)quest.close();aux.removeAttribute('src');report();onOpen(false);window.focus();}
 function sendInventory(){if(data?.player&&!panel.hidden&&inventoryTabs.has(tab))aux.contentWindow.postMessage({type:'party-inventory-state',player:data.player,capacity:data.capacity},location.origin);}
 async function load(){
  const current=generation;
  report('กำลังโหลดข้อมูล…');
  try{const result=await request({});if(current!==generation)return;
   if(!result.player)throw Error('ข้อมูลกระเป๋ายังไม่พร้อม');
   data=result;syncHud();sendInventory();report();
  }catch(e){if(current===generation)report('โหลดข้อมูลไม่สำเร็จ',true);}
 }
 async function act(command){
  if(busy)return;
  busy=true;pending??={...command,requestId:crypto.randomUUID()};
  const current=generation;report('กำลังบันทึก…');
  try{await request(pending);pending=null;await refresh();if(current===generation)await load();}
  catch(e){if(current===generation)report(e.message==='invalid_inventory_action'?'ใช้คำสั่งนี้ไม่ได้ในสถานะปัจจุบัน':'บันทึกไม่สำเร็จ · กดอีกครั้งเพื่อตรวจรายการเดิม');if(['invalid_inventory_action','already_fighting'].includes(e.message))pending=null;}
  finally{busy=false;aux.contentWindow?.postMessage({type:'party-inventory-idle'},location.origin);}
 }
 feedback.querySelector('[data-close]').onclick=close;retry.onclick=()=>void load();
 const menuTabs=new Set(['hero','team','bag','friends','mail','settings','coupon']);
 const inventoryTabs=new Set(['hero','team','bag']);
 function syncHud(){
  if(!member)return;
  const player=data?.player;
  const lead=player?.party?.map(uid=>player.pets?.find(p=>String(p.uid)===String(uid))).find(Boolean);
  const companion=player?(lead?{sp:lead.sp,form:Number(lead.form)||0}:null):undefined;
  for(const frame of hud)frame.contentWindow?.postMessage({type:'party-hud-state',member,gold:data?.gold,companion},location.origin);
 }
 for(const frame of hud)frame.addEventListener('load',syncHud);
 function open(screen){
  if(!canOpen()||busy)return;
  close();
  if(screen==='quests'){window.townQuests.show(true);onOpen(true);return;}
  if(!menuTabs.has(screen))return;
  tab=screen;panel.hidden=false;onOpen(true);
  const inventory=inventoryTabs.has(tab);
  const country=['blue','green','red'].includes(member?.country)?member.country:'blue';
  const params=new URLSearchParams({v:'quest-content-1',screen:tab,dungeon:getFloor()||'mine-floor-1',country,city:country+'-capital'});
  params.set(inventory?'partyInventory':'partyAux','1');
  aux.src=tab==='coupon'?'../town-walk-demo/coupon.html':'../town-walk-demo/menu.html?'+params;
  if(inventory){data=null;void load();}
 }
 quest.addEventListener('close',()=>onOpen(false));
 addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  if(hud.some(frame=>frame.contentWindow===event.source)&&event.data?.type==='walk-menu')open(event.data.screen);
  if(event.source===aux.contentWindow&&!panel.hidden){
   if(event.data?.type==='party-inventory-ready')sendInventory();
   if(event.data?.type==='party-inventory-command'&&inventoryTabs.has(tab)&&canOpen())void act(event.data.command);
   if(event.data?.type==='town-return')close();
   if(event.data?.type==='town-open-quests')open('quests');
   if(event.data?.type==='party-menu-open')open(event.data.screen);
  }
 });
 return {close,get open(){return !panel.hidden||quest.open;},update(m){member=m;syncHud();}};
}
