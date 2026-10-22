const assert=require('assert/strict'),fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
cp.execFileSync(process.execPath,['tools/build-play.cjs']);
(async()=>{
 const {playBillingService}=await import('../server/payments/play-service.mjs'),{verifyPlayPurchase}=await import('../server/payments/google-play-core.mjs');
 const user={id:'owner',email_confirmed_at:'today'},row=['CHARACTER001','QA',7,0,0,0,0,false,'',0,0,0,''];
 let order={id:crypto.randomUUID(),provider:'google_play',package_name:'com.soulbeastgame.app',product_id:'soulbeast_normal_5',code:'CHARACTER001',pack_id:'normal-5',coupons:5,status:'reserved',account_hash:'account-hash'},balance=7,grants=0,consumes=0,conflicts=1,failConsume=true;
 const purchase={purchaseState:0,purchaseType:0,quantity:1,orderId:'GPA.TEST',consumptionState:0,obfuscatedExternalAccountId:'account-hash',obfuscatedExternalProfileId:order.id};
 const command=async(a,id,d)=>{assert.equal(id,user.id);if(a==='get')return structuredClone(order);if(a==='grant'){if(conflicts-- >0)return {conflict:true};if(order.status==='reserved'){assert.equal(d.before,balance);balance=d.after;grants++;order={...order,status:'granted',token_hash:d.token_hash,provider_order:d.provider_order};}return {order:structuredClone(order)};}if(a==='consumed'){order.status='consumed';return structuredClone(order);}throw Error(a);};
 const deps={command,hash:async s=>crypto.createHash('sha256').update(s).digest('hex'),snapshot:async()=>({mode:'test',revision:2,tables:{Coupons:[['header'],[...row.slice(0,2),balance,...row.slice(3)]]}}),google:{verify:verifyPlayPurchase,retrieve:async()=>purchase,consume:async()=>{consumes++;if(failConsume)throw Error('network');purchase.consumptionState=1;}},packageName:order.package_name,catalog:[],enabled:true};
 await assert.rejects(()=>playBillingService({...deps,enabled:false})(user,{}),/disabled/);await assert.rejects(()=>playBillingService(deps)(null,{}),/verified/);
 const service=playBillingService(deps),body={action:'verify',order_id:order.id,purchaseToken:'token'};
 purchase.purchaseState=2;assert((await service(user,body)).pending);assert.equal(grants,0);assert.equal(consumes,0);
 purchase.purchaseState=0;purchase.purchaseType=undefined;await assert.rejects(()=>service(user,body),/live_play/);assert.equal(grants,0);purchase.purchaseType=0;
 purchase.obfuscatedExternalAccountId='attacker';await assert.rejects(()=>service(user,body),/invalid/);purchase.obfuscatedExternalAccountId='account-hash';
 const first=await service(user,body);assert(first.credited&&first.consumePending);assert.equal(balance,12);assert.equal(grants,1);
 failConsume=false;assert((await service(user,body)).credited);assert.equal(balance,12);assert.equal(grants,1);assert.equal(order.status,'consumed');
 assert((await service(user,body)).credited);assert.equal(grants,1);assert.equal(consumes,2,'Already consumed retry does not call consume again');
 await assert.rejects(()=>service(user,{...body,purchaseToken:'other-token'}),/token_changed/);
 const {googlePlayProvider}=await import('../server/payments/play-provider.mjs');
 const keys=crypto.generateKeyPairSync('rsa',{modulusLength:2048}),privateKey=keys.privateKey.export({type:'pkcs8',format:'pem'});let oauth=0,gets=0,consumeCalls=0;
 const transport=async(url,o)=>{
  if(url==='https://oauth2.googleapis.com/token'){
   oauth++;const parts=o.body.get('assertion').split('.'),claims=JSON.parse(Buffer.from(parts[1],'base64url'));assert.equal(claims.aud,url);assert.equal(claims.scope,'https://www.googleapis.com/auth/androidpublisher');assert(crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),keys.publicKey,Buffer.from(parts[2],'base64url')));return Response.json({access_token:'fixture-access',expires_in:3600});
  }
  assert(url.startsWith('https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.soulbeastgame.app/'));assert.equal(o.headers.Authorization,'Bearer fixture-access');
  if(o.method==='POST'){consumeCalls++;return new Response(null,{status:204});}gets++;return Response.json(purchase);
 };
 const provider=googlePlayProvider({credentials:{type:'service_account',client_email:'fixture@example.invalid',private_key:privateKey},packageName:order.package_name,fetcher:transport,subtle:crypto.webcrypto.subtle});await provider.retrieve(order.product_id,'token/with/slash');await provider.consume(order.product_id,'token/with/slash');assert.equal(oauth,1);assert.equal(gets,1);assert.equal(consumeCalls,1);
 const {openPlayShop}=await import('../client/play-shop.mjs');let notices=0;await openPlayShop({config:{android:{purchasesEnabled:false}},native:{getCapabilities:async()=>({enabled:false})},notify:()=>notices++});assert.equal(notices,1);
 // Actual bundled handler: even with the server flag on, no account bypass is possible.
 const vm=require('vm'),source=fs.readFileSync('build/play/index.ts','utf8').replace(/^import .*withSupabase.*\r?\n/m,'').replace('export default {','globalThis.handler={');
 const ctx=vm.createContext({Response,Request,Headers,URL,URLSearchParams,AbortSignal,TextEncoder,Uint8Array,Date,crypto:crypto.webcrypto,btoa,atob,fetch:()=>{throw Error('Unexpected network');},Deno:{env:{get:()=>undefined}},withSupabase:(_,f)=>req=>f(req,{supabaseAdmin:{auth:{getUser:async()=>({data:{user:null},error:Error('invalid')})}}})});vm.runInContext(source,ctx);
 for(const token of ['', 'Bearer invalid']){const r=await ctx.handler.fetch(new Request('https://example.invalid',{method:'POST',headers:{Origin:'https://localhost',Authorization:token},body:'{}'}));assert.equal(r.status,401);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://localhost');}
 console.log('PASS Play: pending/live/wrong account denied, CAS retry, 5 coupons delivered once, crash after grant recovers consumption, consumed replay safe, token rebinding denied; exact handler auth/CORS');
})().catch(e=>{console.error(e);process.exitCode=1;});
