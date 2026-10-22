'use strict';
const assert=require('node:assert/strict');
(async()=>{
 const {EmailSendGate,emailErrorText}=await import('../client/topup-email.mjs'),{ShopSession}=await import('../client/topup-session.mjs');
 const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
 let now=1000000;const s=store(),gate=new EmailSendGate(s,()=>now);assert.equal(gate.wait(),60);assert.equal(new EmailSendGate(s,()=>now).remaining(),60);now+=61000;assert.equal(gate.remaining(),0);assert.equal(gate.wait('120'),120);assert.equal(gate.wait('bad'),120);
 assert(emailErrorText('over_email_send_rate_limit','',429).includes('ขีดจำกัด'));assert(emailErrorText(undefined,'email rate limit exceeded',400).includes('ขีดจำกัด'));assert(emailErrorText('email_address_not_authorized').includes('ยังส่ง'));assert.equal(emailErrorText('network','offline'),null);
 const shared=store(),legacy=store(),key='soulbeast_shop_test_auth_v1',old={access_token:'old-access',refresh_token:'old-refresh',expires_at:Math.floor(now/1000)+3600};legacy.setItem(key,JSON.stringify(old));shared.setItem('sealbeast_save_v1','unchanged');shared.setItem('soulbeast_admin_session_v1','unchanged');
 let calls=0;const refresh=async rt=>{calls++;assert.equal(rt,'old-refresh');return {access_token:'new-access',refresh_token:'new-refresh',expires_in:3600};};
 const manager=new ShopSession({storage:shared,legacy,refresh,now:()=>now});assert.equal(manager.read().access_token,'old-access');assert.equal(legacy.getItem(key),null);
 assert.equal(await manager.token(),'old-access');assert.equal(calls,0);assert.equal(new ShopSession({storage:shared,refresh,now:()=>now}).read().access_token,'old-access','A second tab/reload keeps the shop login');
 manager.save({...old,expires_at:1});const tokens=await Promise.all([manager.token(),manager.token()]);assert.deepEqual(tokens,['new-access','new-access']);assert.equal(calls,1,'Concurrent requests share one refresh');
 for(const error of [Error('offline'),Object.assign(Error('server'),{status:503}),Object.assign(Error('rate limited'),{status:429})]){const m=new ShopSession({storage:shared,refresh:async()=>{throw error;},now:()=>now});m.save({...old,expires_at:1});await assert.rejects(()=>m.token());assert.equal(m.read().access_token,'old-access','Transient failure must not log out');}
 const revoked=new ShopSession({storage:shared,refresh:async()=>{throw Object.assign(Error('revoked'),{status:400,code:'refresh_token_not_found'});},now:()=>now});revoked.save({...old,expires_at:1});await assert.rejects(()=>revoked.token());assert.equal(revoked.read(),null);
 let queue=Promise.resolve();const lock=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};calls=0;
 const a=new ShopSession({storage:shared,refresh,now:()=>now,lock}),b=new ShopSession({storage:shared,refresh,now:()=>now,lock});a.save({...old,expires_at:1});assert.deepEqual(await Promise.all([a.token(),b.token()]),['new-access','new-access']);assert.equal(calls,1,'Cross-tab lock rotates the refresh token once');
 const stale=new ShopSession({storage:shared,now:()=>now,refresh:async()=>{stale.save({...old,access_token:'another-tab',refresh_token:'another-refresh'});throw Object.assign(Error('old token'),{status:400,code:'refresh_token_already_used'});}});stale.save({...old,expires_at:1});assert.equal(await stale.token(),'another-tab');assert.equal(stale.read().access_token,'another-tab');
 const blocked=new ShopSession({storage:{getItem:()=>null,setItem:()=>{throw Error('quota');}},refresh,now:()=>now});blocked.save(old);assert.equal(await blocked.token(),'old-access','Storage failure retains in-memory login');
 a.save(null);assert.equal(b.read(),null,'Logout propagates across tabs');assert.equal(shared.getItem('sealbeast_save_v1'),'unchanged');assert.equal(shared.getItem('soulbeast_admin_session_v1'),'unchanged');
 console.log('PASS shop auth: Thai email errors, resend/reload guard, tab/session migration, persistence, single refresh, cross-tab rotation, transient-error retention, revoked-session sign-out and isolated game/admin keys');
})().catch(e=>{console.error(e);process.exitCode=1;});
