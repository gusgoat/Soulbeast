import {ShopSession} from './topup-session.mjs';
import {EmailSendGate,emailErrorText} from './topup-email.mjs';
const BASE='https://zycmmtvubzyxduxqpuzl.supabase.co',KEY='sb_publishable_-m9RbNVXYhaKjUZYSGGdMQ_rrkCuEL6',STORE='soulbeast_shop_test_auth_v1';
export const accountRealtimeConfig={url:BASE,key:KEY};
export const accountError=e=>emailErrorText(e.code,e.message,e.status)||({invalid_credentials:'อีเมลหรือรหัสผ่านไม่ถูกต้อง',email_not_confirmed:'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',login_required:'กรุณาเข้าสู่ระบบอีกครั้ง',verified_account_required:'กรุณายืนยันอีเมลก่อนเริ่มเล่น',character_not_owned:'บัญชีนี้ไม่มีตัวละครที่เลือก','finish other battle':'จบการต่อสู้ก่อนลบตัวละคร',character_deleted:'ตัวละครนี้ถูกลบแล้ว',payment_pending:'มีรายการชำระเงินค้าง กรุณาจัดการรายการก่อนลบตัวละคร',delete_confirmation_required:'กรุณายืนยันก่อนลบตัวละคร',character_limit:'สร้างตัวละครครบ 5 ตัวแล้ว กรุณาลบตัวเก่าก่อนสร้างเพิ่ม',account_service_unavailable:'ระบบบัญชีขัดข้องชั่วคราว กรุณาลองอีกครั้ง',account_database_unavailable:'ระบบบัญชียังไม่พร้อม กรุณาลองภายหลัง',weak_password:'รหัสผ่านไม่ผ่านเกณฑ์ความปลอดภัย',same_password:'กรุณาเลือกรหัสผ่านใหม่',otp_expired:'ลิงก์หมดอายุหรือถูกใช้แล้ว กรุณาขอลิงก์ใหม่'})[e.code||e.message]||'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง';
const revokedSession = error => [400,401,403].includes(error.status) &&
 ['session_not_found','refresh_token_not_found','refresh_token_already_used','invalid_grant','login_required','user_not_found'].includes(error.code||error.message);
export function gameSessionId(token){
 try{
  const payload=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  return JSON.parse(atob(payload)).session_id||null;
 }catch{return null;}
}
let watchingGameSession=false, leavingGame=false;
function leaveEndedGameSession(){
 if(leavingGame||typeof window==='undefined'||location.hostname!=='gusgoat.github.io')return;
 leavingGame=true;
 sessionStorage.removeItem('soulbeast-online-walk-v1');
 sessionStorage.removeItem('soulbeast-walk-preview-player-v1');
 window.top.location.replace('/Soulbeast/accounts.html?session=ended');
}
function watchGameSession(client){
 if(watchingGameSession||typeof window==='undefined'||window.top!==window||location.hostname!=='gusgoat.github.io')return;
 const onAccount=location.pathname==='/Soulbeast/accounts.html';
 if(!onAccount&&!sessionStorage.getItem('soulbeast-online-walk-v1'))return;
 watchingGameSession=true;
 const verify=()=>{if(!document.hidden&&client.sessions.read()&&!leavingGame)void client.verifySession().catch(()=>{});};
 addEventListener('focus',verify);
 document.addEventListener('visibilitychange',verify);
 setInterval(verify,30000);
}
export class AccountClient{
 constructor({storage,legacy,fetcher=fetch,lock=fn=>fn(),redirect=(globalThis.location?.pathname?.endsWith('/accounts-staging.html')?'https://gusgoat.github.io/Soulbeast/accounts-staging.html':'https://gusgoat.github.io/Soulbeast/accounts.html'),onChange=()=>{}}={}){
  // Native browser fetch rejects an AccountClient receiver (Illegal invocation).
  this.fetcher=(...args)=>fetcher(...args);this.redirect=redirect;this.onChange=onChange;this.user=null;this.recovery=false;this.gate=new EmailSendGate(legacy);
  this.sessions=new ShopSession({storage,legacy,lock,refresh:refresh_token=>this.request('/auth/v1/token?grant_type=refresh_token',{refresh_token})});
 }
 async verifySession(){
  const check = token => {
   let pinned;
   try{pinned=JSON.parse(globalThis.sessionStorage?.getItem('soulbeast-online-walk-v1')||'null')?.sessionId;}catch{}
   if(pinned&&gameSessionId(token)!==pinned){
    leaveEndedGameSession();
    throw Error('session_replaced');
   }
   return token;
  };
  check(this.sessions.read()?.access_token);
  try{return check(await this.sessions.token(true));}
  catch(error){if(revokedSession(error)&&!this.sessions.read())leaveEndedGameSession();throw error;}
 }
 async request(path,body,token,method='POST'){
  const r=await this.fetcher(BASE+path,{method,headers:{apikey:KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(45000)}),v=await r.json();
  if(!r.ok||v.ok===false||v.error)throw Object.assign(Error(v.error_description||v.msg||v.error||'request_failed'),{code:v.error_code||v.code||v.error,status:r.status});return v;
 }
 async acceptCallback(hash){
  const p=new URLSearchParams(hash.replace(/^#/,''));
  if(p.get('error'))throw Object.assign(Error('otp_expired'),{code:p.get('error_code')||'otp_expired'});
  if(!p.get('access_token'))return;
  const a={access_token:p.get('access_token'),refresh_token:p.get('refresh_token'),expires_at:Math.floor(Date.now()/1000)+Number(p.get('expires_in')||3600)};
  // Verify the callback before committing any account or game state.
  const user=await this.request('/auth/v1/user',undefined,a.access_token,'GET');
  this.sessions.save(a);this.user=user;this.recovery=p.get('type')==='recovery';
 }
 async identity(){const token=await this.sessions.token();this.user=await this.request('/auth/v1/user',undefined,token,'GET');return this.user;}
 async login(email,password){
  const a=await this.request('/auth/v1/token?grant_type=password',{email,password});
  const user=await this.request('/auth/v1/user',undefined,a.access_token,'GET');
  if(user.email_confirmed_at){
   const result=await this.fetcher(BASE+'/auth/v1/logout?scope=others',{
    method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+a.access_token},
    signal:AbortSignal.timeout(10000)
   });
   if(!result.ok)throw Error('account_service_unavailable');
  }
  this.sessions.save({...a,expires_at:a.expires_at||Math.floor(Date.now()/1000)+a.expires_in});
  this.user=user;this.onChange();
 }
 async signup(email,password){
  if(this.gate.remaining())throw Error('email_wait');this.gate.wait();
  return this.request('/auth/v1/signup?redirect_to='+encodeURIComponent(this.redirect),{email,password});
 }
 async recover(email){if(this.gate.remaining())throw Error('email_wait');this.gate.wait();return this.request('/auth/v1/recover?redirect_to='+encodeURIComponent(this.redirect),{email});}
 async resetPassword(password){if(!this.recovery)throw Error('login_required');await this.request('/auth/v1/user',{password},await this.sessions.token(),'PUT');this.recovery=false;}
 async game(action,extra={},env='test'){
  const post=token=>this.fetcher(BASE+'/functions/v1/soulbeast-accounts',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json','x-soulbeast-environment':env},body:JSON.stringify({action,...extra}),signal:AbortSignal.timeout(60000)});
  let r=await post(await (action==='save'&&env==='live'?this.verifySession():this.sessions.token()));if(r.status===401)r=await post(await this.verifySession());const v=await r.json();
  if(!r.ok||!v.ok)throw Object.assign(Error(v.error||'account_service_unavailable'),{status:r.status,code:v.error});return v;
 }
 async logout(){try{await this.request('/auth/v1/logout?scope=local',{},await this.sessions.token());}catch{}finally{this.sessions.save(null);this.user=null;this.onChange();}}
}
export function connectAccounts(onChange, accountStorage){
 let storage,legacy;try{storage=accountStorage??localStorage;legacy=sessionStorage;}catch{}
 const client=new AccountClient({storage,legacy,onChange,lock:fn=>navigator.locks?.request?navigator.locks.request(STORE+'-refresh',fn):fn()});
 watchGameSession(client);
 window.addEventListener('storage',e=>{if(e.key===STORE)onChange();});return client;
}
