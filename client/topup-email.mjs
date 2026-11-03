// UI resend guard only. The server's email quota remains authoritative.
export function emailErrorText(code,message='',status=0){
 if(['over_email_send_rate_limit','over_request_rate_limit'].includes(code)||status===429||/email rate limit exceeded/i.test(message))return 'ระบบส่งอีเมลถึงขีดจำกัดชั่วคราว กรุณาตรวจกล่องจดหมายและสแปม หากยังไม่ได้รับให้ลองใหม่ภายหลัง';
 if(code==='email_address_not_authorized'||/email address not authorized|only send.*team/i.test(message))return 'ยังส่งอีเมลไปยังที่อยู่นี้ไม่ได้ กรุณาติดต่อผู้ดูแลเกมเพื่อตรวจระบบส่งอีเมล';
 if(code==='email_provider_disabled')return 'ระบบส่งลิงก์เข้าบัญชียังไม่พร้อม กรุณาลองใหม่ภายหลัง';
 return null;
}
export class EmailSendGate{
 constructor(storage,now=()=>Date.now()){this.storage=storage;this.now=now;this.until=0;this.key='soulbeast_shop_test_email_wait_v1';}
 remaining(){try{this.until=Math.max(this.until,Number(this.storage?.getItem(this.key))||0);}catch{}return Math.max(0,Math.ceil((this.until-this.now())/1000));}
 wait(retryAfter=60){let seconds=Number(retryAfter);if(!Number.isFinite(seconds)||seconds<=0){const date=Date.parse(retryAfter);seconds=Number.isFinite(date)?Math.ceil((date-this.now())/1000):60;}seconds=Math.max(60,Math.min(86400,seconds));this.until=Math.max(this.until,this.now()+seconds*1000);try{this.storage?.setItem(this.key,String(this.until));}catch{}return this.remaining();}
}
