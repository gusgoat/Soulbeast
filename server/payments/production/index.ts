import {withSupabase} from 'jsr:@supabase/server@^1';
import {createRemoteJWKSet,jwtVerify} from 'npm:jose@6.1.0';
/* PRODUCTION_MODULES */
const PROD_CATALOG=/* PRODUCTION_CATALOG */;
const PUBSUB_KEYS=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const ORIGINS=['https://gusgoat.github.io','https://localhost'];
const utf8=new TextEncoder();
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',utf8.encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const secureEqual=async(a,b)=>!!a&&!!b&&(await sha(a))===(await sha(b));
const response=(v,status=200)=>Response.json(v,{status});
const handler=withSupabase({auth:'none'},async(req,ctx)=>{
 try{
  const url=new URL(req.url),route=url.pathname.split('/').at(-1),db=ctx.supabaseAdmin;
  const rpc=async(name,args)=>{const r=await db.rpc(name,args);if(r.error){const k=['promotion_unavailable','character_not_owned','request_changed','order_not_found','order_rate_limit','billing_review_required','purchases_disabled','stripe_price_not_configured','purchase_token_changed','invalid_purchase_binding','grant_required'].find(c=>String(r.error.message).includes(c));throw Error(k||'billing_database_unavailable');}return r.data;};
  const command=(action,account,data)=>rpc('sb_pay_command',{p_action:action,p_account:account,p_data:data});
  const settings=await command('settings',null,{});payDemand(settings?.game_env===PROD_CATALOG.gameEnvironment,'game_environment_mismatch');
  const stripe=liveStripe({key:Deno.env.get('STRIPE_LIVE_SECRET_KEY'),webhookSecret:Deno.env.get('STRIPE_LIVE_WEBHOOK_SECRET'),returnUrl:'https://gusgoat.github.io/Soulbeast/topup.html'});
  const sa=Deno.env.get('GOOGLE_PLAY_PRODUCTION_SERVICE_ACCOUNT_JSON'),credentials=sa?JSON.parse(sa):null;
  const google=productionGoogle({base:googlePlayProvider({credentials,packageName:PROD_CATALOG.packageName}),credentials,packageName:PROD_CATALOG.packageName});
  const readiness={stripe:stripe.ready&&Deno.env.get('SB_PAY_STRIPE_ENABLED')==='true',google_play:!!credentials&&Deno.env.get('SB_PAY_PLAY_ENABLED')==='true'};
  const service=productionPayments({catalog:PROD_CATALOG,command,snapshot:(env,code)=>rpc('sb_engine_snapshot',{p_env:env,p_code:code,p_request:crypto.randomUUID()}),stripe,google,hash:sha,readiness});
  if(req.method!=='POST')return response({ok:false,error:'method_not_allowed'},405);
  const raw=await req.text();payDemand(raw.length<=250000,'body_too_large');
  if(route==='stripe-webhook'){
   await verifySignature(raw,req.headers.get('stripe-signature'),Deno.env.get('STRIPE_LIVE_WEBHOOK_SECRET'));
   return response(await service.stripeEvent(JSON.parse(raw)));
  }
  const bearer=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(route==='play-notifications'){
   const audience=Deno.env.get('SB_PAY_RTDN_AUDIENCE'),email=Deno.env.get('SB_PAY_RTDN_SERVICE_ACCOUNT_EMAIL');payDemand(audience&&email&&bearer,'notification_auth_required');
   const {payload}=await jwtVerify(bearer,PUBSUB_KEYS,{issuer:['https://accounts.google.com','accounts.google.com'],audience});
   payDemand(payload.email===email&&payload.email_verified===true,'notification_auth_required');
   const body=JSON.parse(raw);payDemand(body.subscription===Deno.env.get('SB_PAY_RTDN_SUBSCRIPTION')&&typeof body.message?.data==='string','bad_notification');
   return response(await service.playNotification(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(body.message.data),c=>c.charCodeAt(0))))));
  }
  if(route==='reconcile'){
   const workerSecret=Deno.env.get('SB_PAY_RECONCILE_SECRET');payDemand(workerSecret?.length>=32&&await secureEqual(bearer,workerSecret),'worker_auth_required');
   const result=await service.reconcile();return response(result,result.ok?200:503);
  }
  payDemand(raw.length<=16384,'body_too_large');const body=JSON.parse(raw);
  if(body.action==='connection_check'){
   payDemand(await paymentCheckAuthorized(req.headers,name=>Deno.env.get(name),sha),'diagnostic_auth_required');
   const {data:packs,error}=await db.from('sb_pay_packs').select('id,coupons,amount_satang,promotion,stripe_price_id,active');
   payDemand(!error&&Array.isArray(packs),'billing_database_unavailable');
   const result=await checkPaymentConnection({catalog:PROD_CATALOG,packs,stripe,settings,webhookConfigured:/^whsec_[A-Za-z0-9]+$/.test(Deno.env.get('STRIPE_LIVE_WEBHOOK_SECRET')||'')});
   return response(result,result.ok?200:503);
  }
  if(body.action==='catalog')return response(await service.handle(null,body));
  payDemand(bearer,'login_required');const {data,error}=await db.auth.getUser(bearer);payDemand(!error&&data?.user?.email_confirmed_at,'verified_account_required');
  return response(await service.handle(data.user,body));
 }catch(e){
  const known=['login_required','verified_account_required','purchases_disabled','provider_not_configured','promotion_unavailable','character_not_owned','bad_order','order_not_found','request_changed','billing_busy_retry','billing_review_required','invalid_purchase_binding','bad_purchase_token','purchase_token_changed','purchase_order_changed','invalid_google_play_purchase','purchase_already_consumed','payment_amount_mismatch','stripe_price_mismatch','stripe_price_not_configured','order_needs_review','coupon_account_unavailable','test_payment_forbidden','notification_auth_required','worker_auth_required','invalid_signature','bad_notification','notification_order_not_found','notification_needs_reconciliation','game_environment_mismatch','billing_database_unavailable'];
  const code=e.message==='diagnostic_auth_required'?e.message:known.includes(e.message)?e.message:'payment_service_unavailable';return response({ok:false,error:code},['diagnostic_auth_required','login_required','verified_account_required','notification_auth_required','worker_auth_required','invalid_signature'].includes(code)?401:['purchases_disabled','provider_not_configured','billing_database_unavailable','payment_service_unavailable'].includes(code)?503:409);
 }
});
export default {async fetch(req){
 const origin=req.headers.get('origin');if(origin&&!ORIGINS.includes(origin))return response({ok:false,error:'origin_not_allowed'},403);
 const r=req.method==='OPTIONS'?new Response(null,{status:204}):await handler(req),h=new Headers(r.headers);
 if(origin)h.set('Access-Control-Allow-Origin',origin);h.set('Vary','Origin');h.set('Cache-Control','no-store');h.set('Access-Control-Allow-Headers','authorization,apikey,content-type');h.set('Access-Control-Allow-Methods','POST,OPTIONS');return new Response(r.body,{status:r.status,headers:h});
}};
