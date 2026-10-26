// New email accounts. Enabled only on the separate account staging shell until SMTP is ready.
// @soulbeast-unit 1091-playerAccounts
const ACCOUNT_GAME=(()=>{
 if(!window.SOULBEAST_ACCOUNTS)return {enabled:false};
 const state={enabled:true,client:null,mode:'login',busy:false,error:'',message:'',email:'',characters:[],user:null,code:'',boot:null,draft:null,request:null};
 const root=()=>document.getElementById('app');
 const key=(code=state.code)=>'soulbeast_account_save_v1:'+SB_ENV+':'+state.user.id+':'+code;
 const blank=()=>({screen:'start',ui:{}});
 const ui=()=>{
  if(['playing','create'].includes(state.mode))return false;
  const login=!state.user,reset=state.mode==='recovery',signup=state.mode==='signup',forgot=state.mode==='forgot';
  root().innerHTML='<main class="account-page"><section class="card stack"><img class="account-logo" src="assets/ui/soulbeast-logo-transparent-v3.webp" alt="Soulbeast" onerror="this.hidden=true"><p class="sub">'+ct('เลือกตัวละครเพื่อเล่นต่อ หรือสร้างตัวละครใหม่','Choose a character to continue, or create a new one.','选择角色继续游戏，或创建新角色。')+'</p><h2>'+(login?(signup?'สมัครสมาชิก':forgot?'ลืมรหัสผ่าน':'เข้าสู่ระบบ'):reset?'ตั้งรหัสผ่านใหม่':'ตัวละครของฉัน')+'</h2>'+(state.error?'<p class="account-error" role="alert">'+esc(state.error)+'</p>':'')+(state.message?'<p role="status">'+esc(state.message)+'</p>':'')+
  (state.busy?'<div class="account-wait" role="status" aria-live="polite"><div class="online-hourglass" aria-hidden="true"><img src="assets/ui/online-hourglass.webp" alt="" width="120" height="120"><i></i></div><p>'+ct('กำลังเชื่อมต่อและโหลดข้อมูล…','Connecting and loading…','正在连接并加载…')+'</p></div>':login||reset?'<form id="accountForm" class="stack">'+(reset?'':'<label>อีเมล<input name="email" type="email" autocomplete="email" required value="'+esc(state.email)+'"></label>')+(!forgot?'<label>'+(reset?'รหัสผ่านใหม่':'รหัสผ่าน')+'<input name="password" type="password" minlength="8" autocomplete="'+(signup||reset?'new-password':'current-password')+'" required></label>':'')+(signup||reset?'<label>ยืนยันรหัสผ่าน<input name="confirm" type="password" minlength="8" autocomplete="new-password" required></label>':'')+'<button class="btn pri full">'+(reset?'บันทึกรหัสผ่านใหม่':signup?'สมัครสมาชิก':forgot?'ส่งลิงก์ตั้งรหัสผ่านใหม่':'เข้าสู่ระบบ')+'</button></form>'+(reset?'':'<div class="row wrap"><button class="btn" data-account="'+(signup||forgot?'login':'signup')+'">'+(signup||forgot?'กลับเข้าสู่ระบบ':'สร้างบัญชีใหม่')+'</button>'+(!forgot?'<button class="btn" data-account="forgot">ลืมรหัสผ่าน</button>':'')+'</div><small>รหัสผ่านอย่างน้อย 8 ตัวอักษร · ยืนยันอีเมลก่อนเริ่มเล่น</small>'):
   '<p data-user-content>'+esc(state.user.email)+'</p><p>'+ct('ช่องตัวละคร','Character slots','角色栏位')+': '+(state.slotsUsed??state.characters.length)+' / 5</p><div class="stack">'+state.characters.map(c=>'<div class="account-character-row"><button class="btn" data-account-code="'+esc(c.code)+'"><span class="account-character-portrait" aria-hidden="true"><img src="'+esc(classPortraitSource(CLS[c.cls]?c.cls:'swordsman',c.gender))+'" alt="" decoding="async"></span><span class="account-character-meta"><b data-user-content>'+esc(c.name)+'</b><small>'+esc(CLS[c.cls]?.n||c.cls)+' · Lv '+esc(c.lv||3)+'</small></span></button><button class="btn danger" data-account-delete="'+esc(c.code)+'" aria-label="'+ct('ลบตัวละคร','Delete character','删除角色')+'"><span>'+ct('ลบ','Delete','删除')+'</span></button></div>').join('')+'</div><button class="btn pri" data-account="create" '+((state.slotsUsed??state.characters.length)>=5?'disabled':'')+'>สร้างตัวละครใหม่</button>'+((state.slotsUsed??state.characters.length)>=5?'<p>'+ct('ครบ 5 ตัวแล้ว ต้องลบตัวเก่าก่อนสร้างเพิ่ม','All five slots are used. Delete a character before creating another.','5个栏位已满，请先删除一个角色再创建。')+'</p>':'')+'<button class="btn" data-account="logout">ออกจากบัญชี</button>'+deleteDialog())+languagePanel()+'</section></main>';
  applyGameLanguage(root());
  root().querySelector('#accountForm')?.addEventListener('submit',async e=>{
   e.preventDefault();const f=e.currentTarget,email=f.elements.email?.value.trim(),password=f.elements.password?.value,confirm=f.elements.confirm?.value;
   if(confirm!==undefined&&password!==confirm){state.error='รหัสผ่านทั้งสองช่องไม่ตรงกัน';ui();return;}
   state.email=email||state.email;
   await task(async()=>{if(reset){await state.client.resetPassword(password);state.mode='list';state.message='ตั้งรหัสผ่านใหม่แล้ว';await list();}
    else if(forgot){await state.client.recover(email);state.message='หากอีเมลนี้มีบัญชี ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ กรุณาตรวจจดหมายขยะด้วย';}
    else if(signup){await state.client.signup(email,password);state.mode='login';state.message='ตรวจอีเมลเพื่อยืนยันบัญชี แล้วเข้าสู่ระบบด้วยรหัสผ่านที่ตั้งไว้';}
    else{await state.client.login(email,password);state.message='';await list();}});
  });
  root().querySelectorAll('[data-account]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.account)));
  root().querySelectorAll('[data-account-delete]').forEach(b=>b.addEventListener('click',()=>{state.deleteCode=b.dataset.accountDelete;ui();}));
  const dialog=root().querySelector('.account-delete-dialog');if(dialog){const buttons=dialog.querySelectorAll('button');buttons[0]?.focus();dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();state.deleteCode=null;ui();}if(e.key==='Tab'){e.preventDefault();(document.activeElement===buttons[0]?buttons[1]:buttons[0])?.focus();}});}
  root().querySelectorAll('[data-account-code]').forEach(b=>b.addEventListener('click',()=>task(()=>select(b.dataset.accountCode))));return true;
 };
 async function task(fn){if(state.busy)return;state.busy=true;state.error='';ui();try{await fn();}catch(e){state.error=state.errorText?.(e)||'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง';if(e.message==='email_wait')state.error='กรุณารอสักครู่ก่อนส่งอีเมลอีกครั้ง';}finally{state.busy=false;if(!ui())render();}}
 async function list(){state.user=await state.client.identity();if(!state.user.email_confirmed_at)throw Error('verified_account_required');const r=await state.client.game('account_list',{},SB_ENV);state.characters=await Promise.all(r.characters.map(async c=>{try{const saved=await state.client.game('load',{code:c.code},SB_ENV),data=typeof saved.data==='string'?JSON.parse(saved.data):saved.data,p=data?.P;if(saved.ok&&p?.code===c.code)return {...c,name:p.name||c.name,cls:CLS[p.cls]?p.cls:c.cls,gender:['male','female'].includes(p.gender)?p.gender:undefined,lv:p.lv||c.lv};}catch{}return c;}));state.slotsUsed=r.slotsUsed??r.characters.length;state.limit=r.characterLimit||5;state.mode='list';}
 async function select(code,remoteOnly=false){if(!state.characters.some(c=>c.code===code))throw Error('character_not_owned');state.code=code;let data;
  try{data=JSON.parse(localStorage.getItem(key())||'null');}catch{}
  const r=await state.client.game('load',{code},SB_ENV);
  if(remoteOnly||data?.P?.code!==code||(!data.battle&&Number(r.at)>Number(data.P.gsAt||0))){data=JSON.parse(r.data);data.P.gsAt=r.at;}
  if(r.account?.name)data.P.name=r.account.name;if(r.account?.renameAt)data.P.renameAt=r.account.renameAt;
  state.saveConflict=false;state.pendingSave=null;
  delete data.P.cpin;state.mode='playing';IMG={};GS.lastJson='';GS.lastAt=0;sbMarkReady(code);state.boot({S:data});save();
 }
 function deleteDialog(){const c=state.characters.find(c=>c.code===state.deleteCode);if(!c)return '';return '<div class="account-delete-overlay"><section class="account-delete-dialog card stack" role="dialog" aria-modal="true" aria-labelledby="delete-character-title"><h3 id="delete-character-title">'+ct('ยืนยันลบตัวละคร','Confirm character deletion','确认删除角色')+'</h3><p><span data-user-content>'+esc(c.name)+'</span></p><p>'+ct('ตัวละครนี้จะออกจากรายชื่อและเล่นต่อไม่ได้ ตรวจสอบชื่อให้ถูกต้องก่อนยืนยัน','This character will leave your list and can no longer be played. Check the name before confirming.','此角色将从列表移除，且无法继续游玩。请核对名称后再确认。')+'</p><div class="row wrap"><button class="btn" data-account="delete-cancel">'+ct('ยกเลิก','Cancel','取消')+'</button><button class="btn danger" data-account="delete-confirm">'+ct('ยืนยันลบ','Confirm delete','确认删除')+'</button></div></section></div>';}
 function beginCreate(){state.draft=null;state.request=null;state.deleteCode=null;state.mode='create';state.code='';S=blank();S.ui.introSeen=true;IMG={};render();}
 async function action(a){state.error='';state.message='';if(['login','signup','forgot'].includes(a)){state.mode=a;ui();return;}
  if(a==='delete-cancel'){state.deleteCode=null;ui();return;}
  if(a==='delete-confirm'){const code=state.deleteCode;if(!state.characters.some(c=>c.code===code))return;return task(async()=>{await state.client.game('account_delete',{code,confirm:true,_sbRequest:crypto.randomUUID()},SB_ENV);state.deleteCode=null;await list();});}
  if(a==='create'){if((state.slotsUsed??state.characters.length)>=5){state.error=ct('ครบ 5 ตัวแล้ว ต้องลบตัวเก่าก่อนสร้างเพิ่ม','All five slots are used. Delete a character before creating another.','5个栏位已满，请先删除一个角色再创建。');ui();return;}beginCreate();return;}
  if(a==='logout'){await task(async()=>{await state.client.logout();state.user=null;state.mode='login';S=blank();state.code='';});return;}
 }
 const originalRender=render;render=function(...a){if(ui())return;const out=originalRender(...a);if(state.saveConflict)document.querySelector('main')?.insertAdjacentHTML?.('afterbegin','<aside class="card" role="alert">พบเซฟใหม่จากอีกเครื่อง ระบบหยุดบันทึกเพื่อป้องกันข้อมูลถูกทับ <button class="btn" data-a="go" data-v="settings">ตรวจเซฟในตั้งค่า</button></aside>');applyGameLanguage(root());return out;};
 // Every local save belongs to an authenticated account and a server-authorized character.
 save=function(){if(state.mode==='playing'&&state.user&&S.P?.code===state.code)try{localStorage.setItem(key(),JSON.stringify(S));}catch{};};
 load=function(){S=state.initial||blank();IMG={};if(state.user&&state.code)try{IMG=JSON.parse(localStorage.getItem(key()+':images')||'{}');}catch{}};
 saveImg=function(){if(state.user&&state.code)try{localStorage.setItem(key()+':images',JSON.stringify(IMG));}catch{toast('พื้นที่เก็บรูปเต็ม');}};
 const originalCreate=handlers.newgame;
 const originalStart=vStart;vStart=()=>'<div class="card row"><button class="btn" data-a="accountCharacters">กลับหน้าตัวละคร</button><small>'+esc(state.user?.email||'')+'</small></div>'+(state.error?'<p role="alert">'+esc(state.error)+'</p>':'')+originalStart();
 const originalCinema=cinemaView;cinemaView=intro=>{const html=originalCinema(intro);return intro?html.replace(/<button class="btn full" data-a="introLoad">[^<]*<\/button>/,''):html;};
 handlers.newgame=async()=>{if(state.mode!=='create'||state.busy)return;state.busy=true;state.error='';
  try{if(!state.draft){originalCreate();state.draft=JSON.parse(gsData());state.request=crypto.randomUUID();}state.mode='creating';ui();
   const r=await state.client.game('account_create',{data:state.draft,request_id:state.request},SB_ENV);state.code=r.character.code;if(!state.characters.some(c=>c.code===state.code))state.characters.push(r.character);const loaded=await state.client.game('load',{code:state.code},SB_ENV);S=JSON.parse(loaded.data);S.P.gsAt=loaded.at;delete S.P.cpin;state.draft=null;state.request=null;state.mode='playing';sbMarkReady(state.code);state.boot({S});save();render();
  }catch(e){state.mode='create';state.error=state.errorText(e);toast(state.error);}finally{state.busy=false;render();}};
 // No legacy save import, PIN-based load, or destructive reset in the new account flow.
 vBackup=()=>'';vCloud=()=>'';cloudInit=()=>{CLOUD.st='off';};
 vระบบออนไลน์Save=start=>start?'':'<div class="card stack"><h3>บันทึกในบัญชีอีเมล</h3><p>บันทึกออนไลน์อัตโนมัติเมื่อกลับเมือง</p><small>'+(S.P?.gsAt?'บันทึกล่าสุด '+esc(new Date(S.P.gsAt).toLocaleString(gameLocale())):'กำลังรอบันทึกออนไลน์')+'</small>'+(state.saveConflict?'<p role="alert">มีเซฟใหม่จากอีกเครื่อง ระบบหยุดบันทึกเพื่อป้องกันข้อมูลถูกทับ</p><button class="btn" data-a="dlsave">ดาวน์โหลดสำเนาในเครื่อง</button><button class="btn" data-a="accountReload">โหลดเซฟใหม่จากเซิร์ฟเวอร์</button>':'<button class="btn" data-a="gssave">บันทึกตอนนี้</button>')+'</div>';
 handlers.gsload=()=>{};handlers.doloadcode=()=>{};handlers.reset=()=>handlers.accountCreate();
 handlers.accountCharacters=()=>{if(S.battle||S.zone){toast('กลับเมืองและจบการต่อสู้ก่อนสลับตัวละคร');return;}return task(async()=>{if(state.mode==='playing'){save();await communitySave();save();}state.deleteCode=null;state.draft=null;state.request=null;await list();});};
 handlers.accountCreate=()=>{if(S.battle||S.zone){toast('กลับเมืองและจบการต่อสู้ก่อนสลับตัวละคร');return;}return task(async()=>{if(state.mode==='playing'){save();await communitySave();save();}await list();if(state.slotsUsed>=5)throw Error('character_limit');beginCreate();});};
 handlers.accountLogout=()=>{if(S.battle||S.zone){toast('กลับเมืองและจบการต่อสู้ก่อนออกจากบัญชี');return;}return task(async()=>{await gsSave(true);await state.client.logout();state.user=null;state.mode='login';S=blank();state.code='';});};
 handlers.accountReload=()=>{S.ui.confirm={msg:'โหลดเซฟใหม่จากเซิร์ฟเวอร์? ระบบจะเก็บสำเนาความคืบหน้าในเครื่องนี้ไว้ก่อน',act:'accountReloadConfirm'};render();};
 handlers.accountReloadConfirm=()=>task(async()=>{S.ui.confirm=null;localStorage.setItem(key()+':before-conflict-load',JSON.stringify(S));await select(state.code,true);});
 handlers.accountDeleteRequest=async()=>{if(!confirm(ct('ส่งคำขอลบบัญชีและข้อมูลตัวละครทั้งหมดให้ผู้ดูแลตรวจสอบ?','Request deletion of your account and all character data for support review?','申请删除账户及全部角色数据，由支持人员审核？')))return;try{const {paymentApi}=await import('./client/production-shop.mjs');const r=await paymentApi(state.client)('request_delete',{confirmed:true});toast(ct('บันทึกคำขอลบบัญชีแล้ว เลขที่ ','Deletion request recorded: ','删除申请已记录：')+r.request_id);}catch{toast(ct('ส่งคำขอไม่สำเร็จ กรุณาติดต่อ Line @soulbeast','Could not submit request. Contact Line @soulbeast.','申请提交失败，请联系Line @soulbeast。'));}};
 handlers.accountOpenShop=async()=>{try{const config=await (await fetch('./content/billing-channels.json')).json();if(window.SOULBEAST_PLATFORM==='android'&&config.mode==='production'){const {openProductionPlayShop}=await import('./client/production-shop.mjs');return await openProductionPlayShop({client:state.client,code:state.code,native:window.SB_NATIVE.billing,config,notify:toast,lang:document.documentElement.lang,onUpdated:async()=>{const r=await state.client.game('gacha_status',{code:state.code},SB_ENV);if(r.ok)GACHA.coupons=r.coupons;}});}if(window.SOULBEAST_PLATFORM==='android'){const {openPlayShop}=await import('./client/play-shop.mjs');return await openPlayShop({client:state.client,code:state.code,native:window.SB_NATIVE.billing,config,notify:toast,translate:text=>translateGameText(text),onUpdated:async()=>{const r=await state.client.game('gacha_status',{code:state.code},SB_ENV);if(r.ok)GACHA.coupons=r.coupons;}});}const {createBilling}=await import('./client/billing-client.mjs');await createBilling({platform:'web',config,openWeb:path=>location.assign(path)}).open();}catch{toast('ร้านคูปองยังไม่พร้อม กรุณาลองภายหลัง');}};
 window.SB_ACCOUNT_PAUSE=()=>{if(state.mode==='playing'){save();if(!S.battle)gsSave(false);}};
 window.SB_ACCOUNT_BACK=()=>{if(state.mode==='create'){handlers.accountCharacters();return true;}if(state.mode==='playing'&&!S.zone&&!S.battle&&S.screen!=='town'){go('town');return true;}return false;};
 const settings=vSettings;vSettings=()=>'<div class="card stack"><b>'+esc(state.user?.email||'')+'</b><button class="btn" data-a="accountCharacters">กลับหน้าเลือกตัวละคร</button>'+couponShopButton('settings')+'<button class="btn" data-a="accountLogout">ออกจากบัญชี</button><button class="btn" data-a="accountDeleteRequest">'+ct('ขอลบบัญชี','Request account deletion','申请删除账户')+'</button></div>'+settings().replace('<button class="btn" data-a="accountCharacters">กลับหน้าเลือกตัวละคร</button>','').replace(foldCard('สำรอง / นำเข้าเซฟ',''),'').replace('<button class="btn" data-a="reset">เริ่มเกมใหม่</button>','<button class="btn" data-a="accountCreate">เริ่มเกมใหม่</button>');
 sheetRequest=async options=>{
  const p=JSON.parse(options?.body||'{}');if(!state.user)return {ok:false,error:'login_required'};
  const owner=state.user.id,selected=state.code;p._sbRequest??=p.request||crypto.randomUUID();p.code=selected;
  if(['wb_create','wb_join'].includes(p.action))p._preSave=gsData();
  if(p.action==='save'||p._preSave)p.expectedSaveAt=Number(S.P?.gsAt||0);
  if(p.action==='save'){
   const fingerprint=JSON.stringify([p.code,p.data,p.expectedSaveAt]);
   if(state.pendingSave?.fingerprint!==fingerprint)state.pendingSave={fingerprint,id:crypto.randomUUID()};
   p._sbRequest=state.pendingSave.id;
  }
  try{
   const r=await state.client.game(p.action,p,SB_ENV);if(state.user?.id!==owner||state.code!==selected)return {ok:false,error:'account_changed'};
   if(r.error==='save_conflict'){state.saveConflict=true;toast('พบเซฟใหม่จากอีกเครื่อง กรุณาเปิดตั้งค่าเพื่อเลือกโหลดเซฟ');}
   if(r.ok&&r.accountSaveAt&&S.P?.code===selected)S.P.gsAt=r.accountSaveAt;
   if(r.ok&&p.action==='save')state.pendingSave=null;
   if(r.ok&&r.account?.name)state.characters=state.characters.map(c=>c.code===selected?{...c,name:r.account.name}:c);
   if(p._preSave&&r.savedAt&&S.P?.code===p.code){applyAccount(r.account);S.P.gsAt=r.accountSaveAt||r.savedAt;GS.lastAt=Date.now();GS.lastJson=gsData();if(r.coupons!=null)GACHA.coupons=r.coupons;}
   return r;
  }catch(e){if(e.code==='save_conflict')state.saveConflict=true;return {ok:false,error:e.code||e.message};}
 };
 const previousSheetError=sheetError;sheetError=r=>r?.error==='save_conflict'?'พบเซฟใหม่จากอีกเครื่อง กรุณาเปิดตั้งค่าและโหลดเซฟใหม่ก่อน':previousSheetError(r);
 const originalBoot=boot;boot=()=>{S=blank();state.busy=true;ui();(async()=>{try{const m=await import('./client/account-client.mjs');state.errorText=m.accountError;state.client=m.connectAccounts(()=>{if(!state.busy)task(async()=>{if(state.client.sessions.read()){const user=await state.client.identity();if(user.id===state.user?.id)return;S=blank();state.code='';state.user=null;await list();}else{S=blank();state.code='';state.user=null;state.mode='login';}});});
    const hash=location.hash; if(hash){history.replaceState(null,'',location.pathname+location.search);await state.client.acceptCallback(hash);}
    if(state.client.sessions.read()){if(state.client.recovery){state.user=await state.client.identity();state.mode='recovery';}else {await list();if(new URLSearchParams(location.search).get('create')==='1'&&state.slotsUsed<5)beginCreate();}}
   }catch(e){state.error=state.errorText?.(e)||'ระบบบัญชียังไม่พร้อม กรุณาลองใหม่อีกครั้ง';}finally{state.busy=false;}ui();})();};state.boot=data=>{state.initial=data.S;try{return originalBoot({});}finally{state.initial=null;}};
 return state;
})();
// @soulbeast-end 1091-playerAccounts
