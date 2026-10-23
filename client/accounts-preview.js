// Isolated visual QA. Credentials and saves are fictional and never leave this page.
(()=>{
 const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
 Object.defineProperty(window,'localStorage',{value:store()});Object.defineProperty(window,'sessionStorage',{value:store()});
 localStorage.setItem('soulbeast_web_intro_v1','seen');localStorage.setItem('sealbeast_web_intro_v1','seen');
 const previewLanguage=new URLSearchParams(location.search).get('lang');if(['en','zh-CN'].includes(previewLanguage))localStorage.setItem('soulbeast_supabase_test_language_v1',previewLanguage);
 const original=window.fetch.bind(window),user={id:'qa-account',email:'qa@example.invalid',email_confirmed_at:'2026-10-22'};
 let character=null,save=null;
 window.fetch=async(url,o={})=>{
  if(!String(url).includes('supabase.co'))return original(url,o);
  const b=JSON.parse(o.body||'{}');
  if(String(url).includes('/auth/v1/token'))return Response.json({access_token:'qa-invalid-token',refresh_token:'qa-invalid-refresh',expires_in:3600,user});
  if(String(url).includes('/auth/v1/user'))return Response.json(user);
  if(String(url).includes('/auth/v1/signup')||String(url).includes('/auth/v1/recover'))return Response.json({id:'qa-account'});
  if(b.action==='account_list')return Response.json({ok:true,characters:character?[character]:[]});
  if(b.action==='account_create'){save=structuredClone(b.data);save.P.code='ABCDEF0123456789';character={code:save.P.code,name:save.P.name,cls:save.P.cls,lv:3};return Response.json({ok:true,character});}
  if(b.action==='load')return Response.json({ok:true,data:JSON.stringify(save),at:Date.now()});
  if(b.action==='save'){save=JSON.parse(b.data);return Response.json({ok:true,at:Date.now()});}
  return Response.json({ok:false,error:'preview_blocks_online_actions'});
 };
 document.title='Soulbeast · บัญชีจำลอง';
 const banner=document.createElement('div');banner.textContent='หน้าทดสอบจำลอง · ใช้อีเมล qa@example.invalid และรหัสทดสอบเท่านั้น · ไม่สร้างบัญชีจริง';banner.style.cssText='position:fixed;top:0;left:0;right:0;z-index:999999;background:#55252a;color:#fff;padding:8px;text-align:center;font-size:12px';document.body.appendChild(banner);
})();
