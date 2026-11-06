// One compact, persistent warning only while progress is not committed online.
export function mountSaveNotice(connection){
 if(window.__walkSaveNotice)return;window.__walkSaveNotice=true;
 let failed=false,panel;
 const backup=()=>globalThis.WalkSaveSafety?.backupActiveWalk(localStorage,sessionStorage,'page-exit');
 function show(detail){
  if(detail.state==='saved'){failed=false;panel?.remove();panel=null;return;}
  if(detail.state!=='error')return;failed=true;backup();
  if(!panel){
   panel=document.createElement('aside');panel.setAttribute('role','alert');panel.style='position:fixed;left:5%;right:5%;top:92px;z-index:10030;padding:10px;border:1px solid #d9b35b;border-radius:10px;background:#132632f5;color:#ffe7a0;font:12px Tahoma;box-shadow:0 3px 14px #0009';
   const message=document.createElement('p');message.textContent='ยังบันทึกออนไลน์ไม่สำเร็จ · ความคืบหน้ายังอยู่ในเครื่อง อย่าโหลดเซฟทับ';message.style.margin='0 0 8px';panel.append(message);
   const retry=document.createElement('button');retry.textContent='ลองบันทึกอีกครั้ง';retry.style='margin-right:8px;padding:7px;border:1px solid #d9b35b;border-radius:7px;background:#193f48;color:#fff0bc';
   retry.onclick=async()=>{retry.disabled=true;try{await connection.flush(true);show({state:'saved'});}catch{retry.disabled=false;}};
   const download=document.createElement('button');download.textContent='เก็บไฟล์สำรอง';download.style=retry.style.cssText;download.onclick=()=>{
    backup();const context=JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1')||'null');if(!context)return;
    const rows=globalThis.WalkSaveSafety.backups(localStorage,context);if(!rows.length)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify({version:2,drafts:rows})],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='soulbeast-unsaved-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   };
   panel.append(retry,download);document.body.append(panel);
  }
 }
 addEventListener('online-walk-save-status',e=>show(e.detail||{}));
 addEventListener('message',e=>{const frames=['regionMenu','townMenu','menuFrame'].map(id=>document.getElementById(id)?.contentWindow).filter(Boolean);if(e.origin===location.origin&&frames.includes(e.source)&&e.data?.type==='online-walk-save-status')show(e.data);});
 addEventListener('beforeunload',e=>{if(failed){backup();e.preventDefault();e.returnValue='';}});
 addEventListener('pagehide',backup);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){backup();void connection.flush();}});
}
