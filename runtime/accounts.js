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
  root().innerHTML='<main class="account-page"><section class="card stack"><img class="account-logo" src="assets/ui/soulbeast-logo.webp" alt="Soulbeast" onerror="this.hidden=true"><p class="sub">ทดสอบระบบบัญชีใหม่ · เริ่มตัวละครใหม่ทั้งหมด</p><h2>'+(login?(signup?'สมัครสมาชิก':forgot?'ลืมรหัสผ่าน':'เข้าสู่ระบบ'):reset?'ตั้งรหัสผ่านใหม่':'ตัวละครของฉัน')+'</h2>'+(state.error?'<p class="account-error" role="alert">'+esc(state.error)+'</p>':'')+(state.message?'<p role="status">'+esc(state.message)+'</p>':'')+
  (state.busy?'<p role="status">กำลังเชื่อมต่อ…</p>':login||reset?'<form id="accountForm" class="stack">'+(reset?'':'<label>อีเมล<input name="email" type="email" autocomplete="email" required value="'+esc(state.email)+'"></label>')+(!forgot?'<label>'+(reset?'รหัสผ่านใหม่':'รหัสผ่าน')+'<input name="password" type="password" minlength="8" autocomplete="'+(signup||reset?'new-password':'current-password')+'" required></label>':'')+(signup||reset?'<label>ยืนยันรหัสผ่าน<input name="confirm" type="password" minlength="8" autocomplete="new-password" required></label>':'')+'<button class="btn pri full">'+(reset?'บันทึกรหัสผ่านใหม่':signup?'สมัครสมาชิก':forgot?'ส่งลิงก์ตั้งรหัสผ่านใหม่':'เข้าสู่ระบบ')+'</button></form>'+(reset?'':'<div class="row wrap"><button class="btn" data-account="'+(signup||forgot?'login':'signup')+'">'+(signup||forgot?'กลับเข้าสู่ระบบ':'สร้างบัญชีใหม่')+'</button>'+(!forgot?'<button class="btn" data-account="forgot">ลืมรหัสผ่าน</button>':'')+'</div><small>รหัสผ่านอย่างน้อย 8 ตัวอักษร · ยืนยันอีเมลก่อนเริ่มเล่น</small>'):
   '<p>'+esc(state.user.email)+'</p><div class="stack">'+state.characters.map(c=>'<button class="btn" data-account-code="'+esc(c.code)+'">'+esc(c.name)+' · '+esc(CLS[c.cls]?.n||c.cls)+'</button>').join('')+'</div><button class="btn pri" data-account="create">สร้างตัวละครใหม่</button><button class="btn" data-account="logout">ออกจากบัญชี</button>')+'</section></main>';
  root().querySelector('#accountForm')?.addEventListener('submit',async e=>{
   e.preventDefault();const f=e.currentTarget,email=f.elements.email?.value.trim(),password=f.elements.password?.value,confirm=f.elements.confirm?.value;
   if(confirm!==undefined&&password!==confirm){state.error='รหัสผ่านทั้งสองช่องไม่ตรงกัน';ui();return;}
   state.email=email||state.email;
   await task(async()=>{if(reset){await state.client.resetPassword(password);state.mode='list';state.message='ตั้งรหัสผ่านใหม่แล้ว';await list();}
    else if(forgot){await state.client.recover(email);state.message='หากอีเมลนี้มีบัญชี ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ กรุณาตรวจจดหมายขยะด้วย';}
    else if(signup){await state.client.signup(email,password);state.mode='login';state.message='ตรวจอีเมลเพื่อยืนยันบัญชี แล้วเข้าสู่ระบบด้วยรหัสผ่านที่ตั้งไว้';}
    else{await state.client.login(email,password);await list();}});
  });
  root().querySelectorAll('[data-account]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.account)));
  root().querySelectorAll('[data-account-code]').forEach(b=>b.addEventListener('click',()=>task(()=>select(b.dataset.accountCode))));return true;
 };
 async function task(fn){if(state.busy)return;state.busy=true;state.error='';ui();try{await fn();}catch(e){state.error=state.errorText?.(e)||'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง';if(e.message==='email_wait')state.error='กรุณารอสักครู่ก่อนส่งอีเมลอีกครั้ง';}finally{state.busy=false;if(!ui())render();}}
 async function list(){state.user=await state.client.identity();if(!state.user.email_confirmed_at)throw Error('verified_account_required');const r=await state.client.game('account_list',{},SB_ENV);state.characters=r.characters;state.mode='list';}
 async function select(code){if(!state.characters.some(c=>c.code===code))throw Error('character_not_owned');state.code=code;let data;
  try{data=JSON.parse(localStorage.getItem(key())||'null');}catch{}
  const r=await state.client.game('load',{code},SB_ENV);
  if(data?.P?.code!==code||(!data.battle&&Number(r.at)>Number(data.P.gsAt||0))){data=JSON.parse(r.data);data.P.gsAt=r.at;}
  delete data.P.cpin;state.mode='playing';IMG={};GS.lastJson='';GS.lastAt=0;sbMarkReady(code);state.boot({S:data});save();
 }
 async function action(a){state.error='';state.message='';if(['login','signup','forgot'].includes(a)){state.mode=a;ui();return;}
  if(a==='create'){state.mode='create';state.code='';S=blank();IMG={};render();return;}
  if(a==='logout'){await task(async()=>{await state.client.logout();state.user=null;state.mode='login';S=blank();state.code='';});return;}
 }
 const originalRender=render;render=function(...a){if(ui())return;return originalRender(...a);};
 // Every local save belongs to an authenticated account and a server-authorized character.
 save=function(){if(state.mode==='playing'&&state.user&&S.P?.code===state.code)try{localStorage.setItem(key(),JSON.stringify(S));}catch{};};
 load=function(){S=state.initial||blank();IMG={};if(state.user&&state.code)try{IMG=JSON.parse(localStorage.getItem(key()+':images')||'{}');}catch{}};
 saveImg=function(){if(state.user&&state.code)try{localStorage.setItem(key()+':images',JSON.stringify(IMG));}catch{toast('พื้นที่เก็บรูปเต็ม');}};
 const originalCreate=handlers.newgame;
 const originalStart=vStart;vStart=()=>'<div class="card row"><button class="btn" data-a="accountCharacters">กลับหน้าตัวละคร</button><small>'+esc(state.user?.email||'')+'</small></div>'+(state.error?'<p role="alert">'+esc(state.error)+'</p>':'')+originalStart();
 handlers.newgame=async()=>{if(state.mode!=='create'||state.busy)return;state.busy=true;state.error='';
  try{if(!state.draft){originalCreate();state.draft=JSON.parse(gsData());state.request=crypto.randomUUID();}state.mode='creating';ui();
   const r=await state.client.game('account_create',{data:state.draft,request_id:state.request},SB_ENV);state.code=r.character.code;if(!state.characters.some(c=>c.code===state.code))state.characters.push(r.character);const loaded=await state.client.game('load',{code:state.code},SB_ENV);S=JSON.parse(loaded.data);S.P.gsAt=loaded.at;delete S.P.cpin;state.draft=null;state.request=null;state.mode='playing';sbMarkReady(state.code);state.boot({S});save();render();
  }catch(e){state.mode='create';state.error=state.errorText(e);toast(state.error);}finally{state.busy=false;render();}};
 // No legacy save import, PIN-based load, or destructive reset in the new account flow.
 vBackup=()=>'';vCloud=()=>'';cloudInit=()=>{CLOUD.st='off';};
 vระบบออนไลน์Save=start=>start?'':'<div class="card stack"><h3>บันทึกในบัญชีอีเมล</h3><p>บันทึกออนไลน์อัตโนมัติเมื่อกลับเมือง</p><button class="btn" data-a="gssave">บันทึกตอนนี้</button></div>';
 handlers.gsload=()=>{};handlers.doloadcode=()=>{};handlers.reset=()=>handlers.accountCharacters();
 handlers.accountCharacters=()=>{if(S.battle||S.zone){toast('กลับเมืองและจบการต่อสู้ก่อนสลับตัวละคร');return;}task(async()=>{await gsSave(true);state.mode='list';await list();});};
 handlers.accountLogout=()=>{if(S.battle||S.zone){toast('กลับเมืองและจบการต่อสู้ก่อนออกจากบัญชี');return;}task(async()=>{await gsSave(true);await state.client.logout();state.user=null;state.mode='login';S=blank();state.code='';});};
 const settings=vSettings;vSettings=()=>'<div class="card stack"><b>'+esc(state.user?.email||'')+'</b><button class="btn" data-a="accountCharacters">ตัวละครของฉัน</button><button class="btn" data-a="accountLogout">ออกจากบัญชี</button></div>'+settings();
 sheetRequest=async options=>{const p=JSON.parse(options?.body||'{}');if(!state.user) return {ok:false,error:'login_required'};p._sbRequest??=p.request||crypto.randomUUID();p.code=state.code;if(['wb_create','wb_join'].includes(p.action))p._preSave=gsData();try{const r=await state.client.game(p.action,p,SB_ENV);if(p._preSave&&r.savedAt&&S.P?.code===p.code){applyAccount(r.account);S.P.gsAt=r.savedAt;GS.lastAt=Date.now();GS.lastJson=gsData();if(r.coupons!=null)GACHA.coupons=r.coupons;}return r;}catch(e){return {ok:false,error:e.code||e.message};}};
 const originalBoot=boot;boot=()=>{S=blank();state.busy=true;ui();(async()=>{try{const m=await import('./client/account-client.mjs');state.errorText=m.accountError;state.client=m.connectAccounts(()=>{if(!state.busy)task(async()=>{if(state.client.sessions.read()){const user=await state.client.identity();if(user.id===state.user?.id)return;S=blank();state.code='';state.user=null;await list();}else{S=blank();state.code='';state.user=null;state.mode='login';}});});
    const hash=location.hash; if(hash){history.replaceState(null,'',location.pathname+location.search);await state.client.acceptCallback(hash);}
    if(state.client.sessions.read()){if(state.client.recovery){state.user=await state.client.identity();state.mode='recovery';}else await list();}
   }catch(e){state.error=state.errorText?.(e)||'ระบบบัญชียังไม่พร้อม กรุณาลองใหม่อีกครั้ง';}finally{state.busy=false;}ui();})();};state.boot=data=>{state.initial=data.S;try{return originalBoot({});}finally{state.initial=null;}};
 return state;
})();
// @soulbeast-end 1091-playerAccounts
