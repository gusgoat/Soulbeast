const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),cp=require('child_process');
const {PGlite}=require('./play-tests/node_modules/@electric-sql/pglite');
cp.execFileSync(process.execPath,['tools/build-production-payments.cjs'],{stdio:'inherit'});
(async()=>{
 const {productionPayments}=await import('../server/payments/production/service.mjs');
 const catalog=require('../content/payment-packs.production.json'),db=new PGlite(),owner=crypto.randomUUID(),other=crypto.randomUUID(),hash=async s=>crypto.createHash('sha256').update(s).digest('hex');
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz,deleted_at timestamptz);
 create table sb_player_characters(account_id uuid,game_env text,code text,name text,status text,primary key(game_env,code));
 create table engine_fixture(env text primary key,revision bigint,tables jsonb);
 create function sb_engine_commit(p_env text,p_expected bigint,p_request text,p_digest text,p_changes jsonb,p_result jsonb) returns jsonb language plpgsql as $$
 begin perform 1 from engine_fixture where env=p_env for update;
 if p_expected<>(select revision from engine_fixture where env=p_env) then return '{"conflict":true}'::jsonb;end if;
 update engine_fixture set revision=revision+1,tables=tables||p_changes where env=p_env;return jsonb_build_object('result',p_result);end $$;`);
 await db.exec(fs.readFileSync('build/payments-production/004-production.sql','utf8'));
 await db.query('insert into auth.users values($1,now(),null),($2,now(),null)',[owner,other]);
 await db.query("insert into sb_player_characters values($1,'test','CHARACTER001','One','active'),($1,'test','CHARACTER002','Two','active'),($2,'test','CHARACTER003','Other','active')",[owner,other]);
 const tables={Coupons:[['code','name','coupons'],['CHARACTER001','One',7,0,0,0,0,false],['CHARACTER002','Two',9,0,0,0,0,false],['CHARACTER003','Other',3,0,0,0,0,false]]};
 await db.query("insert into engine_fixture values('test',1,$1::jsonb),('live',1,$1::jsonb)",[JSON.stringify(tables)]);
 const command=async(a,id,d)=>{const r=await db.query('select sb_pay_command($1,$2,$3::jsonb) v',[a,id,JSON.stringify(d)]);return r.rows[0].v;};
 const snapshot=async env=>{const {rows:[r]}=await db.query('select * from engine_fixture where env=$1',[env]);return {mode:env,revision:Number(r.revision),tables:r.tables};};
 const user={id:owner,email_confirmed_at:'yes'},stripes=new Map(),plays=new Map();let failConsume=false;
 const stripe={create:async o=>{const s={id:'cs_live_'+o.id,url:'https://checkout.stripe.com/'+o.id,status:'open',payment_status:'unpaid',payment_intent:'pi_'+o.id};stripes.set(s.id,{...s,refunded:0,disputed:false});return s;},retrieve:async id=>structuredClone(stripes.get(id)),expire:async id=>{const s=stripes.get(id);s.status='expired';return {...s};},verify:async(o,s)=>({refunded:stripes.get(s.id).refunded,disputed:stripes.get(s.id).disputed})};
 const google={retrieve:async(product,token)=>{const p=plays.get(token);assert.equal(product,p.product);return structuredClone(p);},consume:async(_,token)=>{if(failConsume)throw Error('network');plays.get(token).consumptionState=1;},voided:async()=>({})};
 const service=productionPayments({catalog,command,snapshot,stripe,google,hash,readiness:{stripe:true,google_play:true}});
 const req=(provider,pack='normal-5',code='CHARACTER001',id=crypto.randomUUID())=>({action:provider==='stripe'?'checkout':'create',pack_id:pack,code,request_id:id});
 assert.deepEqual((await service.handle(null,{action:'catalog'})).enabled,{stripe:false,google_play:false});
 await assert.rejects(()=>service.handle(user,req('stripe')),/purchases_disabled/);
 await db.exec("update sb_pay_settings set stripe_enabled=true,play_enabled=true;update sb_pay_packs set stripe_price_id='price_live_'||id;");
 await assert.rejects(()=>service.handle(null,req('stripe')),/verified/);
 await assert.rejects(()=>service.handle(user,req('stripe','normal-5','CHARACTER003')),/character_not_owned/);
 const draft=req('stripe'),one=await service.handle(user,draft),o=await command('get',owner,{order_id:one.order.id});
 assert(!one.order.account_hash&&!one.order.purchase_token);assert.equal((await snapshot('test')).tables.Coupons[1][2],7,'unpaid cannot grant');
 assert.equal((await service.handle(user,draft)).order.id,o.id,'network retry resumes same order');
 await assert.rejects(()=>service.handle({...user,id:other},{action:'refresh',order_id:o.id}),/order_not_found/);
 await assert.rejects(()=>db.query("update sb_player_characters set status='deleted' where code='CHARACTER001'"),/payment_pending/);
 const s=stripes.get(o.session_id);Object.assign(s,{status:'complete',payment_status:'paid'});
 await service.handle(user,{action:'refresh',order_id:o.id});await service.handle(user,{action:'refresh',order_id:o.id});
 assert.equal((await snapshot('test')).tables.Coupons[1][2],12);assert.equal((await db.query('select count(*) n from sb_pay_ledger')).rows[0].n,1,'receipt replay once');
 // Partial refund, then dispute, then won dispute: only cumulative entitlement changes balance.
 s.refunded=1400;await service.handle(user,{action:'refresh',order_id:o.id});assert.equal((await snapshot('test')).tables.Coupons[1][2],10);
 s.disputed=true;await service.handle(user,{action:'refresh',order_id:o.id});assert.equal((await snapshot('test')).tables.Coupons[1][2],7);
 s.disputed=false;await service.handle(user,{action:'refresh',order_id:o.id});assert.equal((await snapshot('test')).tables.Coupons[1][2],10);
 assert.equal((await snapshot('live')).tables.Coupons[1][2],7,'production billing does not silently migrate game environments');
 const promo=await service.handle(user,req('google_play','first-10'));await assert.rejects(()=>service.handle(user,req('stripe','first-10','CHARACTER002')),/promotion_unavailable/);
 const po=await command('get',owner,{order_id:promo.order.id}),token='token-private';
 plays.set(token,{product:po.product_id,purchaseState:2,quantity:1,consumptionState:0,obfuscatedExternalAccountId:po.account_hash,obfuscatedExternalProfileId:po.id,orderId:'GPA.1'});
 assert((await service.handle(user,{action:'verify',order_id:po.id,purchaseToken:token})).pending);assert.equal((await snapshot('test')).tables.Coupons[1][2],10);
 plays.get(token).purchaseType=0;plays.get(token).purchaseState=0;await assert.rejects(()=>service.handle(user,{action:'verify',order_id:po.id,purchaseToken:token}),/invalid_google_play_purchase/);delete plays.get(token).purchaseType;
 failConsume=true;await service.handle(user,{action:'verify',order_id:po.id,purchaseToken:token});assert.equal((await snapshot('test')).tables.Coupons[1][2],20);assert.equal((await command('get',owner,{order_id:po.id})).consumed,false);
 failConsume=false;await service.reconcile();assert.equal((await command('get',owner,{order_id:po.id})).consumed,true);assert.equal((await snapshot('test')).tables.Coupons[1][2],20,'worker must not grant twice');
 // Simulate spent coupons. Reversal deducts remaining balance and records deficit, never a negative balance.
 await db.exec("update engine_fixture set revision=revision+1,tables=jsonb_set(tables,'{Coupons,1,2}','2') where env='test'");
 await service.playNotification({packageName:catalog.packageName,voidedPurchaseNotification:{purchaseToken:token}});
 assert.equal((await snapshot('test')).tables.Coupons[1][2],0);assert.equal((await command('status',owner,{})).debt,8);
 await service.handle(user,{action:'verify',order_id:po.id,purchaseToken:token});assert.equal((await snapshot('test')).tables.Coupons[1][2],0,'void marker is durable even if purchase API temporarily still reports purchased');
 await assert.rejects(()=>service.handle(user,req('stripe')),/billing_review_required/);
 const publicState=JSON.stringify(await service.handle(user,{action:'status'}));assert(!publicState.includes(token)&&!publicState.includes('account_hash'));
 // Other user's token, wrong quantity, stale CAS and replay cannot mutate credited balances.
 const corrupt={...plays.get(token),obfuscatedExternalAccountId:'other'};plays.set('other-token',corrupt);await assert.rejects(()=>service.handle(user,{action:'verify',order_id:po.id,purchaseToken:'other-token'}),/invalid_purchase_binding/);
 const before=await snapshot('test');const stale=await command('settle',owner,{order_id:o.id,financial_revision:0,debt_before:8,entitlement:5,provider_order:s.payment_intent,payment_intent:s.payment_intent,status:'credited'});assert(stale.conflict);assert.deepEqual(await snapshot('test'),before);
 await db.exec('set role anon');await assert.rejects(()=>db.query('select * from sb_pay_orders'),/permission denied/);await assert.rejects(()=>command('settings',null,{}),/permission denied/);await db.exec('reset role');
 assert.equal((await db.query("select count(*) n from pg_class where relname like 'sb_pay_%' and relkind='r' and relrowsecurity")).rows[0].n,6);
 await assert.rejects(()=>service.handle(user,{action:'request_delete'}),/deletion_confirmation_required/);
 assert((await service.handle(user,{action:'request_delete',confirmed:true})).requested);
 assert.equal((await db.query('select count(*) n from sb_pay_deletion_requests')).rows[0].n,1);
 const {liveStripe}=await import('../server/payments/production/providers.mjs');let requests=0;
 const rejected=liveStripe({key:'sk_test_fixture',webhookSecret:'fixture',returnUrl:'https://example.invalid',fetcher:()=>{requests++;}});assert(!rejected.ready);await assert.rejects(()=>rejected.retrieve('cs_test_bad'),/live_key_missing/);assert.equal(requests,0);
 // Actual Stripe adapter validates amounts, metadata, product, paid status and current financial state.
 const liveOrder={id:'order',account_id:'account',pack_id:'normal-5',stripe_price_id:'price_real',amount_satang:3500,session_id:'cs_live_real'};
 const session={id:'cs_live_real',livemode:true,mode:'payment',status:'complete',payment_status:'paid',payment_intent:'pi_real',currency:'thb',amount_total:3500,amount_subtotal:3500,client_reference_id:'order',metadata:{order_id:'order',account_id:'account',pack_id:'normal-5'},line_items:{data:[{quantity:1,price:{id:'price_real'},amount_total:3500}],has_more:false}};
 let charge={id:'ch_real',livemode:true,paid:true,amount:3500,amount_refunded:1400,disputed:false};
 const provider=liveStripe({key:'sk_live_fixture',webhookSecret:'fixture',returnUrl:'https://example.invalid',fetcher:async url=>Response.json(url.includes('/disputes?')?{data:[{status:'won'}],has_more:false}:{livemode:true,status:'succeeded',amount:3500,currency:'thb',latest_charge:charge})});
 assert.deepEqual(await provider.verify(liveOrder,session),{refunded:1400,disputed:false});charge.disputed=true;assert.equal((await provider.verify(liveOrder,session)).disputed,false,'won dispute restores entitlement');
 for(const patch of [{livemode:false},{payment_status:'unpaid'},{amount_total:1},{currency:'usd'},{metadata:{...session.metadata,account_id:'other'}},{line_items:{...session.line_items,data:[{...session.line_items.data[0],quantity:2}]}}])await assert.rejects(()=>provider.verify(liveOrder,{...session,...patch}));
 const badPrice=liveStripe({key:'sk_live_fixture',webhookSecret:'fixture',returnUrl:'https://example.invalid',fetcher:async()=>Response.json({id:'price_real',livemode:true,active:true,type:'one_time',recurring:null,currency:'thb',unit_amount:1,billing_scheme:'per_unit',product:{active:true}})});await assert.rejects(()=>badPrice.create(liveOrder),/stripe_price_mismatch/);
 // Exact generated Edge entry: public readiness is available, every private route is independently authenticated.
 const vm=require('vm'),source=fs.readFileSync('build/payments-production/index.ts','utf8').replace(/^import .*\r?\n/gm,'').replace('export default {','globalThis.endpoint={');
 const ctx=vm.createContext({Response,Request,Headers,URL,URLSearchParams,AbortSignal,TextEncoder,TextDecoder,Uint8Array,Date,crypto:crypto.webcrypto,btoa,atob,fetch:()=>{throw Error('Unexpected network');},createRemoteJWKSet:()=>null,jwtVerify:async()=>{throw Error('invalid JWT');},Deno:{env:{get:()=>undefined}},withSupabase:(_,f)=>req=>f(req,{supabaseAdmin:{from:()=>({select:async()=>({data:checkPacks})}),rpc:async()=>({data:{game_env:'test',stripe_enabled:false,play_enabled:false}}),auth:{getUser:async()=>({data:{user:null},error:Error('invalid')})}}})});vm.runInContext(source,ctx);
 for(const action of ['status','checkout','create','verify','connection_check']){const r=await ctx.endpoint.fetch(new Request('https://example.invalid/functions/v1/soulbeast-payments',{method:'POST',body:JSON.stringify({action})}));assert.equal(r.status,401);}
 for(const path of ['stripe-webhook','play-notifications','reconcile']){const r=await ctx.endpoint.fetch(new Request('https://example.invalid/'+path,{method:'POST',body:'{}'}));assert.equal(r.status,path==='stripe-webhook'?503:401,path);}
 const rejectedOrigin=await ctx.endpoint.fetch(new Request('https://example.invalid',{method:'OPTIONS',headers:{Origin:'https://evil.invalid'}}));assert.equal(rejectedOrigin.status,403);
 const ready=await ctx.endpoint.fetch(new Request('https://example.invalid',{method:'POST',body:'{"action":"catalog"}'}));assert.equal(ready.status,200);assert.deepEqual((await ready.json()).enabled,{stripe:false,google_play:false});
 // Connection checks accept only an existing project administrator key and make GET requests only.
 const {paymentCheckAuthorized,checkPaymentConnection}=await import('../server/payments/production/connection-check.mjs');
 const adminKey='sb_secret_admin_fixture_long',legacyKey='legacy_service_role_fixture_long';
 const adminEnv=name=>({SUPABASE_SECRET_KEYS:JSON.stringify({default:adminKey}),SUPABASE_SERVICE_ROLE_KEY:legacyKey}[name]);
 for(const key of ['', 'sb_publishable_fixture','player_jwt_fixture'])assert.equal(await paymentCheckAuthorized(new Headers(key?{apikey:key}:{}),adminEnv,hash),false);
 for(const key of [adminKey,legacyKey])assert(await paymentCheckAuthorized(new Headers({apikey:key}),adminEnv,hash));
 const checkPacks=catalog.packs.map(p=>({id:p.id,coupons:p.coupons,amount_satang:p.amountSatang,promotion:p.promotion,stripe_price_id:'price_'+p.id.replaceAll('-',''),active:true}));let reads=0;
 const checkProvider=liveStripe({key:'rk_live_fixture',webhookSecret:'whsec_fixture',fetcher:async(url,options)=>{assert.equal(options.method,'GET');reads++;const p=checkPacks.find(p=>url.includes('/'+p.stripe_price_id+'?'));assert(p);return Response.json({id:p.stripe_price_id,livemode:true,active:true,type:'one_time',recurring:null,currency:'thb',unit_amount:p.amount_satang,billing_scheme:'per_unit',product:{active:true}});}});
 const check=await checkPaymentConnection({catalog,packs:checkPacks,stripe:checkProvider,settings:{stripe_enabled:false,play_enabled:false},webhookConfigured:true});assert(check.ok&&check.readOnly);assert.equal(reads,8);assert.deepEqual(check.salesSwitches,{stripe:false,google_play:false});assert(!JSON.stringify(check).includes('rk_live_fixture'));
 ctx.Deno.env.get=name=>({...Object.fromEntries(['SUPABASE_SECRET_KEYS','SUPABASE_SERVICE_ROLE_KEY'].map(k=>[k,adminEnv(k)])),STRIPE_LIVE_SECRET_KEY:'rk_live_fixture',STRIPE_LIVE_WEBHOOK_SECRET:'whsec_fixture'}[name]);
 let edgeReads=0;ctx.fetch=async(url,options)=>{assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer rk_live_fixture');edgeReads++;const p=checkPacks.find(p=>url.includes('/'+p.stripe_price_id+'?'));return Response.json({id:p.stripe_price_id,livemode:true,active:true,type:'one_time',recurring:null,currency:'thb',unit_amount:p.amount_satang,billing_scheme:'per_unit',product:{active:true}});};
 const checkRequest=key=>new Request('https://example.invalid',{method:'POST',headers:{apikey:key},body:'{"action":"connection_check"}'});
 assert.equal((await ctx.endpoint.fetch(checkRequest('sb_publishable_fixture'))).status,401);assert.equal(edgeReads,0);
 const checkedEdge=await ctx.endpoint.fetch(checkRequest(adminKey));assert.equal(checkedEdge.status,200);assert((await checkedEdge.json()).readOnly);assert.equal(edgeReads,8);

 const failedProvider=liveStripe({key:'rk_live_fixture',webhookSecret:'whsec_fixture',fetcher:async()=>new Response('never expose provider body',{status:403})});
 const failedCheck=await checkPaymentConnection({catalog,packs:checkPacks,stripe:failedProvider,settings:{},webhookConfigured:true});assert(!failedCheck.ok);assert.equal(failedCheck.checks[0].httpStatus,403);assert(!JSON.stringify(failedCheck).includes('never expose'));
 await db.close();console.log('PASS production billing: real PostgreSQL ledger/CAS, shared promo, ownership, unpaid/test rejection, refunds/disputes/debt, durable consumption/revocation, replay, RLS, worker and notification authentication, exact disabled Edge readiness');
})().catch(e=>{console.error(e);process.exitCode=1;});

