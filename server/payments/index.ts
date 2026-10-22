// Sandbox only. Credits are in sb_shop_test_credits, never in the live game Coupons table.
import {withSupabase} from 'jsr:@supabase/server@^1';
const CATALOG = /* PAYMENT_CATALOG */;
/* PAYMENT_CORE */
const RETURN_URL='https://gusgoat.github.io/Soulbeast/topup-test.html';
const cors={'Access-Control-Allow-Origin':'https://gusgoat.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200)=>Response.json(body,{status,headers:cors});
let catalogVerifiedAt=0;
async function stripe(path,method='GET',params=null,idempotency=null){
 const key=testKey(Deno.env.get('STRIPE_TEST_SECRET_KEY'));
 const headers={'Authorization':'Bearer '+key};if(params)headers['Content-Type']='application/x-www-form-urlencoded';if(idempotency)headers['Idempotency-Key']=idempotency;
 const res=await fetch('https://api.stripe.com/v1/'+path,{method,headers,body:params?new URLSearchParams(params):undefined,signal:AbortSignal.timeout(20000)});
 demand(res.ok,'stripe_request_failed',503);const value=await res.json();demand(value.livemode!==true,'live_mode_forbidden',503);return value;
}
async function verifyCatalog(){
 testKey(Deno.env.get('STRIPE_TEST_SECRET_KEY'));
 if(Date.now()-catalogVerifiedAt<60000)return;
 for(const p of CATALOG.packs)checkPrice(p,await stripe('prices/'+p.priceId+'?expand%5B%5D=product'));
 catalogVerifiedAt=Date.now();
}
async function userOf(req,db){
 const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');demand(token.split('.').length===3,'login_required',401);
 const {data,error}=await db.auth.getUser(token);demand(!error&&data?.user?.email_confirmed_at&&data.user.email,'verified_email_required',401);return data.user;
}
async function command(db,action,account,data={}){
 const r=await db.rpc('sb_shop_test_command',{p_action:action,p_account:account,p_data:data});
 if(r.error){const code=['verified_account_required','character_already_linked','character_not_linked','unknown_pack','request_changed','order_not_found','order_rate_limit','promotion_unavailable'].find(c=>String(r.error.message).includes(c));throw new PaymentError(code||'shop_database_unavailable',code?409:503);}return r.data;
}
async function sessionFor(order){return stripe('checkout/sessions/'+encodeURIComponent(order.session_id)+'?expand%5B%5D=line_items');}
async function settle(db,order,s){
 if(s.payment_status==='paid'){
  checkSession(order,s);return command(db,'credit',order.account_id,{order_id:order.id,session_id:s.id,payment_intent:s.payment_intent,amount_satang:s.amount_total,price_id:s.line_items.data[0].price.id});
 }
 demand(s.id===order.session_id&&s.livemode===false&&s.client_reference_id===order.id&&s.metadata?.account_id===order.account_id,'session_mismatch',409);
 if(s.status==='expired')return command(db,'expire',order.account_id,{order_id:order.id,session_id:s.id});
 return order;
}
async function verifyCharacter(db,user,body){
 const code=String(body.code||'').toUpperCase(),pin=String(body.pin||'');demand(/^[A-Z0-9]{12,16}$/.test(code)&&/^[A-Za-z0-9]{4,12}$/.test(pin),'save_code_and_pin_required');
 demand(['live','test'].includes(body.game_env),'bad_game_environment');
 const r=await db.rpc('sb_engine_snapshot',{p_env:body.game_env,p_request:crypto.randomUUID(),p_code:code});
 demand(!r.error&&r.data&&!r.data.auth_locked,'save_unavailable',409);
 const own=(r.data.tables?.Saves||[]).slice(1).find(row=>row[0]===code);demand(own&&own[1],'save_with_pin_required',409);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code+':'+pin))),b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==own[1]){await db.rpc('sb_engine_auth_failure',{p_env:body.game_env,p_code:code});throw new PaymentError('wrong_save_pin',403);}
 // Do not load or return the save body; metadata is enough for character selection.
 return command(db,'link',user.id,{game_env:body.game_env,code,name:String(own[2]||'ตัวละคร')});
}
const serve=withSupabase({auth:'none'},async(req,ctx)=>{
 try{
  demand(['GET','POST'].includes(req.method),'method_not_allowed',405);
  const isWebhook=new URL(req.url).pathname.endsWith('/webhook');
  if(isWebhook){
   demand(req.method==='POST','method_not_allowed',405);const body=await req.text();demand(body.length<=200000,'body_too_large',413);
   await verifySignature(body,req.headers.get('stripe-signature'),Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET'));
   const event=JSON.parse(body);demand(event.livemode===false,'live_mode_forbidden');
   if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.expired'].includes(event.type)){
    const s=event.data?.object;demand(s?.object==='checkout.session'&&s.livemode===false,'bad_event');
    if(!s.metadata?.account_id&&!s.metadata?.order_id)return reply({ok:true,ignored:true});
    demand(s.metadata?.account_id&&s.metadata?.order_id,'bad_event');
    const order=await command(ctx.supabaseAdmin,'get',s.metadata.account_id,{order_id:s.metadata.order_id});
    demand(order.session_id===s.id,'session_not_bound',409);await settle(ctx.supabaseAdmin,order,await sessionFor(order));
   }
   return reply({ok:true});
  }
  let body={};if(req.method==='POST'){const text=await req.text();demand(text.length<=8192,'body_too_large',413);body=JSON.parse(text);demand(body&&typeof body==='object'&&!Array.isArray(body),'bad_body');}
  const action=body.action||'catalog';
  if(action==='catalog'){
   await verifyCatalog();const ready=!!Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET');return reply({ok:true,mode:'test',purchasesEnabled:ready,keyConfigured:true,webhookConfigured:ready,packs:CATALOG.packs,promotionLimit:CATALOG.promotionLimit,credits:'sandbox-only'});
  }
  const db=ctx.supabaseAdmin,user=await userOf(req,db);
  if(action==='status')return reply({ok:true,mode:'test',email:user.email,...await command(db,'status',user.id)});
  if(action==='link'){await verifyCharacter(db,user,body);return reply({ok:true,...await command(db,'status',user.id)});}
  if(action==='checkout'){
   demand(!!Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET'),'webhook_not_configured',503);
   demand(/^[a-f0-9-]{36}$/i.test(body.request_id||''),'bad_request_id');packById(CATALOG,body.pack_id);await verifyCatalog();
   let order=await command(db,'reserve',user.id,{request_id:body.request_id,pack_id:body.pack_id,game_env:body.game_env,code:body.code});
   if(order.status==='credited')return reply({ok:true,order});demand(order.status!=='expired','order_expired',409);
   if(order.status==='creating'){
    demand(Date.now()-new Date(order.created_at).getTime()<23*3600000,'order_needs_recovery',409);
    const s=await stripe('checkout/sessions','POST',checkoutParams(order,RETURN_URL),'soulbeast-test-'+order.id);
    demand(s.id.startsWith('cs_test_')&&s.url?.startsWith('https://checkout.stripe.com/'),'bad_checkout',503);
    order=await command(db,'bind',user.id,{order_id:order.id,session_id:s.id,checkout_url:s.url});
   }
   return reply({ok:true,order});
  }
  if(['refresh','expire'].includes(action)){
   let order=await command(db,'get',user.id,{order_id:body.order_id});
   if(order.session_id){let session=await sessionFor(order);if(action==='expire'&&session.status==='open')session=await stripe('checkout/sessions/'+encodeURIComponent(order.session_id)+'/expire','POST',{});order=await settle(db,order,session);}
   return reply({ok:true,order,...await command(db,'status',user.id)});
  }
  throw new PaymentError('unknown_action');
 }catch(e){return reply({ok:false,error:e instanceof PaymentError?e.message:'payment_service_error'},e instanceof PaymentError?e.status:503);}
});
export default {async fetch(req){if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});return serve(req);}};
