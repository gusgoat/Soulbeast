// Local saves, import/export and storage
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0104-SAVE-SAVEIMG



/* ================= STATE & HELPERS ================= */
const SAVE='sealbeast_save_v1', SAVEIMG='sealbeast_img_v1';
// @soulbeast-end 0104-SAVE-SAVEIMG
// @soulbeast-unit 0106-load

function load(){try{const t=localStorage.getItem(SAVE);if(t)S=JSON.parse(t)}catch(e){}try{const t=localStorage.getItem(SAVEIMG);if(t)IMG=JSON.parse(t)||{}}catch(e){}if(!S)S={screen:'start',ui:{}}}
// @soulbeast-end 0106-load
// @soulbeast-unit 0107-save

function save(){try{localStorage.setItem(SAVE,JSON.stringify(S))}catch(e){}}
// @soulbeast-end 0107-save
// @soulbeast-unit 0108-saveImg

function saveImg(){try{localStorage.setItem(SAVEIMG,JSON.stringify(IMG))}catch(e){toast('พื้นที่เก็บรูปเต็ม ลองใช้รูปขนาดเล็กลง')}}
// @soulbeast-end 0108-saveImg
// @soulbeast-unit 0317-CLOUD

const CLOUD={st:'init',info:null,busy:0};
// @soulbeast-end 0317-CLOUD
// @soulbeast-unit 0318-cloudInit

async function cloudInit(){try{const c=window.claude;if(!c||!c.use){CLOUD.st='off';return}
 const [db,user]=await Promise.all([c.use('db'),c.use('user')]);if(!db||!user){CLOUD.st='off';render();return}
 const id=await user.id();if(!id){CLOUD.st='off';render();return}
 CLOUD.db=db;CLOUD.uid=id;CLOUD.ref=db.doc('data/users/'+id+'/save');CLOUD.st='ready';const s=await CLOUD.ref.get();CLOUD.info=s.exists?s.data():null;render()}catch(e){CLOUD.st='off';render()}}
// @soulbeast-end 0318-cloudInit
// @soulbeast-unit 0319-cloudSave

async function cloudSave(){if(CLOUD.st!=='ready'||!S.P||CLOUD.busy)return;if(S.battle){toast('บันทึกระหว่างต่อสู้ไม่ได้');return}
 CLOUD.busy=1;render();const d={json:JSON.stringify({...S,battle:null,ui:{}}),at:Date.now(),name:S.P.name,lv:S.P.lv,cls:S.P.cls};
 try{await CLOUD.ref.set(d);CLOUD.info=d;toast('บันทึกขึ้นคลาวด์แล้ว');lbSubmit(true)}catch(e){toast(e&&e.code==='invalid_argument'?'บัญชีนี้ยังไม่มีสิทธิ์บันทึกในเกมนี้ ให้เจ้าของแชร์แบบผู้ร่วมใช้งาน (Contributor)':e&&e.code==='quota_exceeded'?'พื้นที่คลาวด์เต็ม':'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง')}
 CLOUD.busy=0;render()}
// @soulbeast-end 0319-cloudSave
// @soulbeast-unit 0320-cloudLoad

async function cloudLoad(){if(CLOUD.st!=='ready'||CLOUD.busy)return;CLOUD.busy=1;render();
 try{const s=await CLOUD.ref.get();if(!s.exists){toast('ยังไม่มีเซฟบนคลาวด์')}else{const d=s.data();S=JSON.parse(d.json);S.ui={};S.battle=null;S.screen=S.zone?'zone':'town';migrate();save();CLOUD.info=d;toast('โหลดเซฟจากคลาวด์แล้ว')}}catch(e){toast('โหลดไม่สำเร็จ ลองใหม่อีกครั้ง')}
 CLOUD.busy=0;render()}
// @soulbeast-end 0320-cloudLoad
// @soulbeast-unit 0331-GS

/* ---- game saves on เซิร์ฟเวอร์ออนไลน์: player code + optional PIN ---- */
const GS={busy:0,lastJson:'',lastAt:0};
// @soulbeast-end 0331-GS
// @soulbeast-unit 0336-gsData

const gsData=()=>{const P={...S.P};delete P.cpin;delete P.gsAt;return JSON.stringify({...S,P,battle:null,ui:{}})};
// @soulbeast-end 0336-gsData
// @soulbeast-unit 0337-gsSave

async function gsSave(manual,newPin){if(!SHEET_URL||!S.P||S.battle||GS.busy||S.ui.confirm)return;const P=S.P;ensureCode();const data=gsData();
 if(!manual&&(data===GS.lastJson||Date.now()-GS.lastAt<120000))return;
 GS.busy=1;GS.lastAt=Date.now();if(manual)render();
 try{const body={action:'save',code:ensureCode(),pin:P.cpin||'',data,name:P.name,clsName:CLS[P.cls].n,lv:P.lv};if(newPin!=null)body.newPin=newPin;
  const r=await lbPost(body);
  if(r&&r.ok){applyAccount(r.account);GS.lastJson=gsData();P.gsAt=r.at;if(newPin!=null){P.cpin=newPin;const el=document.getElementById('gsnewpin');if(el)el.value=''}save();if(manual)toast(newPin!=null?(newPin?'ตั้ง PIN แล้ว':'ลบ PIN แล้ว'):'บันทึกลง เซิร์ฟเวอร์ออนไลน์ แล้ว')}
  else if(manual)toast(sheetError(r))}
 catch(e){if(manual)toast('บันทึกไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต')}
 GS.busy=0;render()}
// @soulbeast-end 0337-gsSave
// @soulbeast-unit 0338-gsLoad

async function gsLoad(code,pin){if(GS.busy)return;code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<12||code.length>16){toast('รหัสผู้เล่นไม่ถูกต้อง');return}
 GS.busy=1;render();
 try{const r=await lbPost({action:'load',code,pin:pin||''});
  if(r&&r.ok){const d=JSON.parse(r.data);if(!d.P)throw 0;d.P.code=code;d.P.cpin=pin||'';d.P.gsAt=r.at;PENDING=d;S.ui.confirm={msg:`โหลดเซฟของ <span data-user-content>${esc(d.P.name)}</span> Lv ${d.P.lv} จาก เซิร์ฟเวอร์ออนไลน์? ความคืบหน้าในเครื่องนี้จะถูกแทนที่`,act:'doloadcode'}}
  else toast(sheetError(r))}
 catch(e){toast('โหลดไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต')}
 GS.busy=0;render()}
// @soulbeast-end 0338-gsLoad
// @soulbeast-unit 0339-v-----------Save

function vระบบออนไลน์Save(startOnly){if(!SHEET_URL)return '';const P=S.P;
 const loadForm=`<div class="row wrap" style="gap:6px"><input type="text" id="gscode" autocomplete="off" placeholder="รหัสผู้เล่น เช่น ABCD-EFGH-JKLM" style="flex:2;min-width:160px"><input type="password" id="gspin" autocomplete="off" placeholder="PIN (ถ้ามี)" style="flex:1;min-width:100px"></div><button class="btn sm" data-a="gsload" ${GS.busy?'disabled':''}>โหลดเซฟจาก เซิร์ฟเวอร์ออนไลน์</button>`;
 if(startOnly)return `<div class="card stack" style="gap:8px"><h3>มีรหัสผู้เล่นอยู่แล้ว?</h3><p class="sub" style="margin:0">ใส่รหัสผู้เล่นเพื่อเล่นต่อจากเครื่องอื่น</p>${loadForm}</div>`;
 return `<div class="card stack" style="gap:8px"><h3>เซฟบน เซิร์ฟเวอร์ออนไลน์</h3><p class="sub" style="margin:0">บันทึกอัตโนมัติเมื่อกลับเข้าเมือง ใช้รหัสผู้เล่นนี้โหลดเกมในเครื่องอื่น อย่าบอกรหัสและ PIN กับคนอื่น</p>
 <div class="row wrap" style="gap:8px"><span class="sub">รหัสผู้เล่น</span><b class="num" style="font-size:17px;letter-spacing:.06em;color:var(--gold)">${fmtCode(ensureCode())}</b><button class="btn sm" data-a="copycode">คัดลอก</button></div>
 <div class="sub">${P.gsAt?`บันทึกล่าสุด ${new Date(P.gsAt).toLocaleString(gameLocale(),{dateStyle:'medium',timeStyle:'short'})}`:'ยังไม่เคยบันทึกขึ้น เซิร์ฟเวอร์ออนไลน์'} · ${P.cpin?'ตั้ง PIN แล้ว':'ยังไม่ได้ตั้ง PIN'}</div>
 <div class="row wrap" style="gap:8px"><button class="btn sm pri" data-a="gssave" ${GS.busy?'disabled':''}>${GS.busy?'กำลังบันทึก...':'บันทึกตอนนี้'}</button><input type="password" id="gsnewpin" autocomplete="new-password" maxlength="12" placeholder="PIN ใหม่ 4–12 ตัว" style="width:150px"><button class="btn sm" data-a="gssetpin" ${GS.busy?'disabled':''}>${P.cpin?'เปลี่ยน PIN':'ตั้ง PIN'}</button></div>
 <details><summary class="sub" style="cursor:pointer">โหลดเซฟของรหัสอื่น</summary><div class="stack" style="gap:6px;margin-top:6px">${loadForm}</div></details></div>`}
// @soulbeast-end 0339-v-----------Save
// @soulbeast-unit 0340-encSave-decSave

/* ---- save backup: code / file (works anywhere, including GitHub) ---- */
const encSave=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))),decSave=t=>JSON.parse(decodeURIComponent(escape(atob(t))));
// @soulbeast-end 0340-encSave-decSave
// @soulbeast-unit 0341-saveCode

const saveCode=()=>'SB1.'+encSave({...S,battle:null,ui:{}});
// @soulbeast-end 0341-saveCode
// @soulbeast-unit 0343-askLoadCode

function askLoadCode(t){t=String(t||'').trim().replace(/^SB1\./,'').replace(/\s+/g,'');if(!t){toast('วางรหัสเซฟก่อน');return}
 try{const d=decSave(t);if(!d||!d.P)throw 0;PENDING=d}catch(e){toast('รหัสเซฟไม่ถูกต้อง');return}
 S.ui.confirm={msg:`โหลดเซฟของ <span data-user-content>${esc(PENDING.P.name)}</span> Lv ${PENDING.P.lv}? ความคืบหน้าปัจจุบันในเครื่องนี้จะถูกแทนที่`,act:'doloadcode'};render()}
// @soulbeast-end 0343-askLoadCode
// @soulbeast-unit 0344-vBackup

function vBackup(startOnly){const show=S.ui.showCode;
 return `<div class="card stack" style="gap:8px"><h3>สำรองและย้ายเซฟ</h3><p class="sub" style="margin:0">เซฟเก็บในเบราว์เซอร์ของเครื่องนี้ ใช้รหัสเซฟหรือไฟล์เซฟเพื่อย้ายไปเล่นเครื่องอื่น หรือเก็บสำรองกันหาย (รูปที่ใส่เองไม่รวมในเซฟ)</p>
 ${startOnly?'':`<div class="row wrap" style="gap:8px"><button class="btn sm pri" data-a="copysave">คัดลอกรหัสเซฟ</button>${window.claude?'':'<button class="btn sm" data-a="dlsave">ดาวน์โหลดไฟล์เซฟ</button>'}</div>`}
 ${show&&!startOnly?`<textarea id="codeout" readonly rows="3" style="width:100%;font-size:11px">${saveCode()}</textarea>`:''}
 <textarea id="savein" rows="2" placeholder="วางรหัสเซฟที่นี่" style="width:100%;font-size:12px"></textarea>
 <div class="row wrap" style="gap:8px"><button class="btn sm" data-a="loadcode">โหลดจากรหัสเซฟ</button><button class="btn sm" data-a="pickfile">โหลดจากไฟล์เซฟ</button></div></div>`}
// @soulbeast-end 0344-vBackup
// @soulbeast-unit 0345-vCloud

function vCloud(){const i=CLOUD.info,has=S.P;
 if(CLOUD.st==='init')return `<div class="card"><span class="sub">กำลังเชื่อมต่อเซฟบนคลาวด์...</span></div>`;
 if(CLOUD.st==='off')return `<div class="card stack" style="gap:4px"><h3>เซฟบนคลาวด์</h3><p class="sub" style="margin:0">ใช้ได้เมื่อล็อกอิน Claude ตอนนี้เกมเซฟไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น</p></div>`;
 return `<div class="card stack" style="gap:8px"><h3>เซฟบนคลาวด์</h3><p class="sub" style="margin:0">ผูกกับบัญชี Claude ของคุณ เปิดเกมจากเครื่องไหนก็โหลดต่อได้ รูปที่ใส่เองไม่ถูกบันทึกขึ้นคลาวด์</p>
 <div class="sub">${i?`เซฟล่าสุด: <b style="color:var(--fg)"><span data-user-content>${esc(i.name)}</span> · ${CLS[i.cls]?CLS[i.cls].n:''} Lv ${i.lv}</b> · ${new Date(i.at).toLocaleString(gameLocale(),{dateStyle:'medium',timeStyle:'short'})}`:'ยังไม่มีเซฟบนคลาวด์'}</div>
 <div class="row wrap" style="gap:8px">${has?`<button class="btn sm pri" data-a="cloudsave" ${CLOUD.busy?'disabled':''}>${CLOUD.busy?'กำลังบันทึก...':'บันทึกขึ้นคลาวด์'}</button>`:''}${i?`<button class="btn sm" data-a="cloudload" ${CLOUD.busy?'disabled':''}>โหลดจากคลาวด์</button>`:''}</div></div>`}
// @soulbeast-end 0345-vCloud
// @soulbeast-unit 0686-reliabilityGsSave

const reliabilityGsSave=gsSave;
// @soulbeast-end 0686-reliabilityGsSave
// @soulbeast-unit 0687-gsSave
gsSave=async function(manual,newPin){if(GS.busy||!manual&&ONLINE_UI.count)return;if(!manual)return reliabilityGsSave(manual,newPin);return withOnline('save',()=>reliabilityGsSave(manual,newPin));};
// @soulbeast-end 0687-gsSave
// @soulbeast-unit 0688-reliabilityGsLoad

const reliabilityGsLoad=gsLoad;
// @soulbeast-end 0688-reliabilityGsLoad
// @soulbeast-unit 0689-gsLoad
gsLoad=async function(code,pin){if(GS.busy)return;return withOnline('load',()=>reliabilityGsLoad(code,pin));};
// @soulbeast-end 0689-gsLoad
// @soulbeast-unit 0701-SB_KEY


// Isolated staging build: never uses the live game's local-storage namespace.
const SB_KEY='sb_publishable_-m9RbNVXYhaKjUZYSGGdMQ_rrkCuEL6';
// @soulbeast-end 0701-SB_KEY
// @soulbeast-unit 0702-SB_ENV

const SB_ENV='live';
// @soulbeast-end 0702-SB_ENV
// @soulbeast-unit 0703-sbTransport

const sbTransport=sheetRequest;
// @soulbeast-end 0703-sbTransport
// @soulbeast-unit 0704-SB_CHECK

const SB_CHECK={pending:null,needed:false,lastLoaded:null};
// @soulbeast-end 0704-SB_CHECK
// @soulbeast-unit 0705-sbMarkReady

function sbMarkReady(code){try{localStorage.setItem('sealbeast_supabase_ready_'+code,SHEET_URL);}catch(e){}SB_CHECK.needed=false;}
// @soulbeast-end 0705-sbMarkReady
// @soulbeast-unit 0706-sbCheckReady

async function sbCheckReady(code,pin){
 if(SB_ENV!=='live')return true;
 try{if(localStorage.getItem('sealbeast_supabase_ready_'+code)===SHEET_URL)return true;}catch(e){}
 if(SB_CHECK.pending)return SB_CHECK.pending;
 SB_CHECK.pending=(async()=>{
  const result=await sbTransport({method:'POST',headers:{'Content-Type':'application/json',apikey:SB_KEY,'x-soulbeast-environment':SB_ENV},body:JSON.stringify({action:'load',code,pin,_sbRequest:crypto.randomUUID()})});
  if(!result.ok){if(result.error==='notfound'){sbMarkReady(code);return true;}return result;}
  const remote=JSON.parse(result.data).P;
  if(S.P?.code===code&&Math.abs(Number(S.P.gsAt||0)-Number(result.at))<=2&&Number(S.P.gachaRevision||0)===Number(remote.gachaRevision||0)){sbMarkReady(code);return true;}
  SB_CHECK.needed=true;return {ok:false,error:'migration load required'};
 })();
 try{return await SB_CHECK.pending;}finally{SB_CHECK.pending=null;}
}
// @soulbeast-end 0706-sbCheckReady
// @soulbeast-unit 0708-sbConfirmLoad

const sbConfirmLoad=handlers.doloadcode;
// @soulbeast-end 0708-sbConfirmLoad
// @soulbeast-unit 0709-handlers-doloadcode

handlers.doloadcode=function(){const remote=SB_CHECK.lastLoaded,confirmed=PENDING?.P;if(SB_ENV==='live'&&remote&&confirmed?.code===remote.code&&Number(confirmed.gsAt)===Number(remote.at)){
 try{if(S.P)localStorage.setItem('sealbeast_before_supabase_'+ensureCode(),JSON.stringify(S));}catch(e){}sbMarkReady(remote.code);SB_CHECK.lastLoaded=null;
}return sbConfirmLoad();};
// @soulbeast-end 0709-handlers-doloadcode
// @soulbeast-unit 0710-handlers-sbMigrationLoad

handlers.sbMigrationLoad=()=>gsLoad(ensureCode(),S.P.cpin||'');
// @soulbeast-end 0710-handlers-sbMigrationLoad
// @soulbeast-unit 0713-sbOldLocalSave

function sbOldLocalSave(){try{return S.P&&JSON.parse(localStorage.getItem('sealbeast_before_supabase_'+ensureCode())||'null');}catch{return null;}}
// @soulbeast-end 0713-sbOldLocalSave
// @soulbeast-unit 0714-handlers-sbBeforeMigrationDownload

handlers.sbBeforeMigrationDownload=function(){const previous=sbOldLocalSave();if(!previous)return;try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['SB1.'+encSave({...previous,battle:null,ui:{}})],{type:'text/plain'}));a.download='soulbeast-before-supabase.txt';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}catch{S.ui.beforeMigrationCode=true;render();}};
// @soulbeast-end 0714-handlers-sbBeforeMigrationDownload
// @soulbeast-unit 0715-sbOriginalBackup

const sbOriginalBackup=vBackup;
// @soulbeast-end 0715-sbOriginalBackup
// @soulbeast-unit 0716-vBackup
vBackup=function(...args){let html=sbOriginalBackup(...args);const previous=SB_ENV==='live'&&sbOldLocalSave();if(previous)html+=`<div class="card stack"><b>${ct('เซฟในเครื่องก่อนย้ายระบบ','Local save before migration','迁移前的本地存档')}</b><button class="btn" data-a="sbBeforeMigrationDownload">${ct('ดาวน์โหลดสำเนาก่อนย้าย','Download pre-migration backup','下载迁移前备份')}</button>${S.ui.beforeMigrationCode?`<textarea readonly rows="3">SB1.${encSave({...previous,battle:null,ui:{}})}</textarea>`:''}</div>`;return html;};
// @soulbeast-end 0716-vBackup
// @soulbeast-unit 0717-sbRender

const sbRender=render;
// @soulbeast-end 0717-sbRender
// @soulbeast-unit 0718-render
render=function(){sbRender();const main=document.querySelector('main');if(!main?.querySelector)return;
 if(SB_ENV==='test'&&!main.querySelector('.sb-test-notice'))main.insertAdjacentHTML('afterbegin','<p class="sb-test-notice" style="padding:8px;border:1px solid #d9b35b;color:#f1d48a">SUPABASE TEST · ข้อมูลจำลอง แยกจากเกมจริง</p>');
 if(SB_ENV==='live'&&SB_CHECK.needed&&!main.querySelector('.sb-migration-notice'))main.insertAdjacentHTML('afterbegin',`<div class="card stack sb-migration-notice"><b>${ct('ยืนยันเซฟหลังย้ายระบบออนไลน์','Confirm your save after migration','迁移后确认存档')}</b><p>${ct('พบเซฟออนไลน์ที่ต่างจากในเครื่อง กรุณาตรวจและโหลดเซฟก่อนทำรายการ ข้อมูลในเครื่องจะสำรองไว้เมื่อคุณยืนยันโหลด','The online save differs from this device. Review and load it before online actions. Your current local save will be backed up when you confirm.','在线存档与本机不同。请先核对并读取，再进行在线操作。确认读取时会备份当前本地存档。')}</p><button class="btn pri" data-a="sbMigrationLoad">${ct('ตรวจและโหลดเซฟออนไลน์','Review and load online save','核对并读取在线存档')}</button></div>`);
};
// @soulbeast-end 0718-render
