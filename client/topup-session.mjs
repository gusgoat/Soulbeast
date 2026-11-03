// Shop-only persistence. No game save or admin-session keys are read or written.
export class ShopSession{
 constructor({storage,legacy,refresh,now=()=>Date.now(),lock=fn=>fn()}){this.storage=storage;this.legacy=legacy;this.refresh=refresh;this.now=now;this.lock=lock;this.key='soulbeast_shop_test_auth_v1';this.memory=null;this.pending=null;this.volatile=false;
  if(!this.read()){try{const old=JSON.parse(legacy?.getItem(this.key)||'null');if(old?.access_token)this.save(old);}catch{}}
 }
 read(){if(!this.storage||this.volatile)return this.memory;try{const a=JSON.parse(this.storage.getItem(this.key)||'null');return a&&typeof a.access_token==='string'?a:null;}catch{return this.memory;}}
 save(a){this.memory=a;try{if(!this.storage)throw Error('storage unavailable');a?this.storage.setItem(this.key,JSON.stringify(a)):this.storage.removeItem(this.key);this.volatile=false;this.legacy?.removeItem(this.key);}catch{this.volatile=true;}return a;}
 async token(force=false){
  if(this.pending)return this.pending;
  this.pending=this.lock(async()=>{
   let a=this.read();if(!a?.access_token)throw Error('login_required');
   if(!force&&a.expires_at*1000>this.now()+60000)return a.access_token;
   const used=a.refresh_token;
   try{if(!used)throw Object.assign(Error('login_required'),{status:401});const next=await this.refresh(used);a={...next,expires_at:Number(next.expires_at)||Math.floor(this.now()/1000)+Number(next.expires_in||3600)};this.save(a);return a.access_token;}
   catch(error){const newer=this.read();if(newer?.access_token&&newer.refresh_token!==used)return newer.access_token;
    // A timeout, offline state, rate limit or server error is not a sign-out.
    if([400,401,403].includes(error.status)&&(['refresh_token_not_found','refresh_token_already_used','invalid_grant','session_not_found','user_not_found'].includes(error.code)||error.message==='login_required'))this.save(null);
    throw error;
   }
  });try{return await this.pending;}finally{this.pending=null;}
 }
}
