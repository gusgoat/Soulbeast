CON.teleportScroll={n:'ใบเทเลพอร์ต',d:'วาร์ปไปเมืองหลวง เมือง หรือหมู่บ้านที่อาณาจักรของคุณครอบครอง · ใช้ไม่ได้ระหว่างต่อสู้หรืออยู่ในป่า',price:30,lv:1};
ITEM_ART.teleportScroll='assets/world-quests/teleport-scroll-v1.png.webp';
function walkTeleportBlocked(){return !!S.zone||!!(S.battle&&!S.battle.over)}
function teleportSaveError(error){
 const reason=error.code||error.message;
 if(reason==='save_conflict'||reason==='gacha stale'){
  teleportNeedsReload=true;
  return 'เซฟออนไลน์เปลี่ยนแล้ว กรุณากดโหลดเซฟออนไลน์ล่าสุด';
 }
 if(reason==='login_required'||reason==='character_not_owned'||error.status===401)return 'กรุณาเข้าสู่ระบบและเลือกตัวละครอีกครั้งก่อนเทเลพอร์ต';
 if(reason==='party_run_active'||reason==='tower locked'||reason==='finish other battle')return 'กรุณาจบกิจกรรมที่ค้างอยู่ก่อนเทเลพอร์ต';
 return 'ยังบันทึกการใช้ใบเทเลพอร์ตไม่ได้ กรุณาลองใหม่';
}
let teleportView=null, teleportDestination='', teleportBusy=false, teleportNeedsReload=false;
async function loadTeleportTerritory(){
 const packet={action:'country_status',code:S.P.code,pin:S.P.cpin||''};
 const view=WALK_ONLINE?await walkAccountPost(packet):await window.walkWarEngine.dispatch(S.P,packet);
 if(!view?.ok||!Array.isArray(view.map?.locations))throw Error('ตรวจสอบพื้นที่ที่ครอบครองไม่ได้ กรุณาลองใหม่');
 window.walkWar.update(view);
 return view;
}
function teleportLocations(){
 return (teleportView?.map.locations||[]).filter(n=>n.owner===S.P.country&&Object.hasOwn(window.townProfiles.profiles,n.id));
}
handlers.useTeleport=async()=>{
 if(S.screen!=='bag'||teleportBusy||walkTeleportBlocked()||!(S.P.items.teleportScroll>0))return;
 teleportBusy=true;
 try{
  teleportView=await loadTeleportTerritory();
  if(S.screen!=='bag'||walkTeleportBlocked())return;
  teleportDestination='';S.ui.walkTeleport=true;
  document.querySelector('main')?.scrollTo(0,0);
 }catch(e){toast(e.message);}finally{teleportBusy=false;render();}
};
handlers.reloadTeleportSave=async()=>{
 if(!WALK_ONLINE||!teleportNeedsReload||teleportBusy||!S.ui.walkTeleport)return;
 if(!window.confirm('โหลดเซฟออนไลน์ล่าสุดหรือไม่? การเปลี่ยนแปลงในแท็บนี้ที่ยังไม่ขึ้นเซิร์ฟเวอร์จะถูกแทนที่'))return;
 teleportBusy=true;render();
 try{
  S.P=await (await getWalkAccountConnection()).reloadWalk();
  normalizePack();initDiscovery();
  teleportNeedsReload=false;
  toast('โหลดเซฟออนไลน์แล้ว · ตรวจจำนวนใบก่อนยืนยันอีกครั้ง');
 }catch{toast('โหลดเซฟออนไลน์ไม่สำเร็จ กรุณาลองใหม่');}
 finally{teleportBusy=false;render();}
};
handlers.cancelTeleport=()=>{if(!teleportBusy){S.ui.walkTeleport=false;render();}};
handlers.selectTeleport=id=>{if(!teleportBusy&&teleportLocations().some(n=>n.id===id)){teleportDestination=id;render();}};
handlers.confirmTeleport=async()=>{
 if(S.screen!=='bag'||!S.ui.walkTeleport||teleportBusy||walkTeleportBlocked()||!(S.P.items.teleportScroll>0)||!teleportDestination||teleportNeedsReload)return;
 const destination=teleportDestination;
 teleportBusy=true;render();
 try{
  teleportView=await loadTeleportTerritory();
  if(S.screen!=='bag'||walkTeleportBlocked()||!(S.P.items.teleportScroll>0))return;
  if(!teleportLocations().some(n=>n.id===destination)){teleportDestination='';toast('อาณาจักรของคุณไม่ได้ครอบครองปลายทางนี้แล้ว');return;}
  const online=WALK_ONLINE?await getWalkAccountConnection():null;
  if(WALK_ONLINE){
   try{await online.flush(true);}
   catch(error){throw Error(teleportSaveError(error));}
  }
  if(S.screen!=='bag'||walkTeleportBlocked()||!(S.P.items.teleportScroll>0))return;
  S.P.items.teleportScroll--;save();
  if(online){
   try{await online.flush(true);}
   catch(error){S.P.items.teleportScroll++;save();throw Error(teleportSaveError(error));}
  }
  S.ui.walkTeleport=false;
  parent.postMessage({type:'walk-teleport',destination},location.origin);
 }catch(e){toast(e.message);}finally{teleportBusy=false;render();}
};
CON.teleportScroll.bagAction='useTeleport';CON.teleportScroll.bagDisabled=walkTeleportBlocked;
const teleportBag=vBag;
vBag=function(){
 if(!S.ui.walkTeleport||!teleportView)return teleportBag();
 const locations=teleportLocations(),selected=locations.find(n=>n.id===teleportDestination);
 return '<section class="card stack" aria-label="เลือกปลายทางเทเลพอร์ต"><h3>เลือกปลายทาง · ใช้ใบเทเลพอร์ต 1 ใบ</h3>'
  +countryMapView(locations,'selectTeleport',teleportDestination)
  +(selected?'<p>ปลายทาง · '+esc(selected.name)+'</p>':'<p>'+(locations.length?'แตะพื้นที่บนแผนที่ หรือเลือกจากรายชื่อด้านล่าง':'ไม่มีพื้นที่ที่สามารถเทเลพอร์ตไปได้')+'</p>')
  +'<button class="btn pri" data-a="confirmTeleport" '+(!selected||teleportBusy||teleportNeedsReload||!(S.P.items.teleportScroll>0)?'disabled':'')+'>ยืนยันเทเลพอร์ต</button> <button class="btn" data-a="cancelTeleport" '+(teleportBusy?'disabled':'')+'>ยกเลิก</button>'
  +(teleportNeedsReload?'<button class="btn" data-a="reloadTeleportSave" '+(teleportBusy?'disabled':'')+'>โหลดเซฟออนไลน์ล่าสุด</button>':'')
  +'<div class="row wrap">'+locations.map(n=>'<button class="btn sm" data-a="selectTeleport" data-v="'+esc(n.id)+'" aria-pressed="'+(n.id===teleportDestination)+'">'+esc(n.name)+'</button>').join('')+'</div></section>';
};
// Normal shop buys call handlers.buy; no discounted country/class pricing for this item.
const teleportBuy=handlers.buy;handlers.buy=function(id){if(id!=='teleportScroll')return teleportBuy(id);if(S.zone||S.P.gold<30)return toast('เหรียญไม่พอ หรือยังอยู่ในป่า');S.P.gold-=30;S.P.items.teleportScroll=(S.P.items.teleportScroll||0)+1;ExtraAudio.play('buy');save();render();toast('ซื้อใบเทเลพอร์ตแล้ว')};
CON.teleportScroll.fixedPrice=30;
const teleportUse=handlers.use;handlers.use=function(v){if(String(v).split(':')[0]==='teleportScroll')return handlers.useTeleport();return teleportUse(v)};
