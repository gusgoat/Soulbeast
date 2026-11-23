/* Explicit, expiring transport faults for authenticated TEST accounts only. */
(()=>{
 const enabled='soulbeast-save-test-until',modeKey='soulbeast-save-test-mode',logKey='soulbeast-save-test-log';
 const read=key=>{try{return sessionStorage.getItem(key)}catch{return null}};
 const active=()=>{try{return Number(read(enabled))>Date.now()&&JSON.parse(read('soulbeast-online-walk-v1')||'null')?.environment==='test'}catch{return false}};
 const nativeFetch=window.fetch.bind(window);
 function log(action,id,result){let rows=[];try{rows=JSON.parse(read(logKey)||'[]')}catch{}rows.push({time:new Date().toLocaleTimeString('th-TH'),action,id:String(id||'—').slice(0,12),result});sessionStorage.setItem(logKey,JSON.stringify(rows.slice(-16)));}
 window.fetch=async function(input,init){
  if(!active())return nativeFetch(input,init);
  let url,body;try{url=new URL(typeof input==='string'?input:input.url,location.href);body=JSON.parse(init?.body||'{}')}catch{return nativeFetch(input,init)}
  if(url.hostname!=='zycmmtvubzyxduxqpuzl.supabase.co'||!/^\/(functions\/v1|rest\/v1\/rpc)\//.test(url.pathname))return nativeFetch(input,init);
  const env=new Headers(init?.headers||{}).get('x-soulbeast-environment')||body.environment||body.p_env;
  if(env!=='test')return nativeFetch(input,init);
  const action=body.action||body.p_action||url.pathname.split('/').pop(),id=body._sbRequest||body.data?.requestId||body.data?.battle;
  const mode=read(modeKey)||'online',settlement=['save','personalFinish','soloFinish','flushSave','chest'].includes(action);
  if(mode==='offline'){log(action,id,'บล็อกก่อนส่ง');throw TypeError('TEST_NETWORK_OFFLINE')}
  const response=await nativeFetch(input,init);
  if(mode==='drop-response'&&settlement&&response.ok){sessionStorage.setItem(modeKey,'offline');log(action,id,'ตอบสำเร็จ แต่จำลองคำตอบหาย');throw TypeError('TEST_NETWORK_RESPONSE_LOST')}
  if(settlement)log(action,id,'HTTP '+response.status);
  return response;
 };
 function mount(){
  if(!active()||location.pathname.endsWith('/hud.html'))return;
  const panel=document.createElement('details');panel.id='save-network-test';panel.style.cssText='position:fixed;left:8px;top:84px;z-index:2147483647;max-width:min(92vw,390px);padding:7px;background:#0c1828f5;color:#f2db9b;border:1px solid #c8a764;border-radius:7px;font:12px/1.5 system-ui;box-shadow:0 3px 12px #0008';
  panel.innerHTML='<summary style="cursor:pointer">ทดสอบเน็ต/เซฟ</summary><p>เฉพาะคำขอเกมของบัญชีทดสอบ</p><div style="display:flex;flex-wrap:wrap;gap:5px"><button data-mode="online">ปกติ</button><button data-mode="offline">เน็ตหลุด</button><button data-mode="drop-response">คำตอบหาย 1 ครั้ง</button><button data-stop>จบทดสอบ</button></div><pre style="max-height:160px;overflow:auto;white-space:pre-wrap;font:10px/1.5 system-ui"></pre>';
  panel.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-stop')){sessionStorage.removeItem(enabled);sessionStorage.removeItem(modeKey);panel.remove();return}sessionStorage.setItem(modeKey,b.dataset.mode);};
  document.body.append(panel);
  const paint=()=>{if(!active()){panel.remove();clearInterval(timer);return}const labels={online:'ปกติ',offline:'เน็ตหลุด', 'drop-response':'รอตัดคำตอบบันทึก'};panel.querySelector('summary').textContent='ทดสอบเน็ต/เซฟ · '+labels[read(modeKey)||'online'];let rows=[];try{rows=JSON.parse(read(logKey)||'[]')}catch{}panel.querySelector('pre').textContent=rows.map(r=>r.time+' '+r.action+' ['+r.id+'] '+r.result).join('\n');};
  const timer=setInterval(paint,500);paint();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
