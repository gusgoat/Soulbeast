// Provider evidence is fetched on the server. Neither browser callbacks nor RTDN payloads grant coupons.
export const payDemand=(ok,code)=>{if(!ok)throw Error(code);};
export const payPublicOrder=o=>o?Object.fromEntries(['id','pack_id','provider','code','status','coupons','amount_satang','checkout_url','created_at','entitlement','settled','consumed'].map(k=>[k,o[k]])):null;
export function productionPayments({catalog,command,snapshot,stripe,google,hash,now=()=>Date.now(),readiness={stripe:false,google_play:false}}){
 const call=(action,o,data={})=>command(action,o.account_id,{order_id:o.id,...data});
 const lookup=data=>command('locate',null,data);
 const get=(id,account)=>command('get',account,{order_id:id});
 async function apply(original,proof){
  for(let i=0;i<6;i++){
   const o=await get(original.id,original.account_id),state=await command('status',o.account_id,{});
   payDemand(o.financial_revision===original.financial_revision,'billing_busy_retry');
   const delta=proof.entitlement-o.entitlement,debt=state.debt;
   let body={...proof,financial_revision:o.financial_revision,debt_before:debt};
   if(delta){
    const s=await snapshot(o.game_env,o.code);payDemand(s.mode===o.game_env,'game_environment_mismatch');
    const rows=structuredClone(s.tables?.Coupons),row=rows?.slice(1).find(r=>r[0]===o.code);
    payDemand(row,'coupon_account_unavailable');const before=Number(row[2]);payDemand(Number.isSafeInteger(before)&&before>=0&&before<=1e9,'invalid_coupon_balance');
    row[2]=delta>=0?before+Math.max(0,delta-debt):Math.max(0,before+delta);payDemand(row[2]<=1e9,'invalid_coupon_balance');row[6]=now();
    Object.assign(body,{expected:s.revision,before,after:row[2],changes:{Coupons:rows}});
   }
   const r=await call('settle',o,body);if(!r.conflict)return r;
  }throw Error('billing_busy_retry');
 }
 async function stripeSync(o,{expire=false}={}){
  payDemand(o.provider==='stripe','wrong_payment_provider');
  if(!o.session_id){
   // Recover a lost create response using the same provider idempotency key; do not recreate after its retention window.
   payDemand(now()-new Date(o.created_at).getTime()<23*3600000,'order_needs_review');
   const session=await stripe.create(o);o=await call('bind_stripe',o,{session_id:session.id,checkout_url:session.url});
  }
  let s=await stripe.retrieve(o.session_id);
  if(expire&&s.status==='open')s=await stripe.expire(o.session_id);
  if(s.status==='expired')return call('expire',o);
  if(s.payment_status!=='paid')return call('pending',o);
  const financial=await stripe.verify(o,s);
  const revoked=financial.disputed?o.coupons:Math.min(o.coupons,Math.ceil(o.coupons*financial.refunded/o.amount_satang));
  return apply(o,{entitlement:o.coupons-revoked,status:financial.disputed?'disputed':revoked?'refunded':'credited',provider_order:s.payment_intent,payment_intent:s.payment_intent});
 }
 async function playSync(o,token=o.purchase_token,{voided=false}={}){
  payDemand(o.provider==='google_play','wrong_payment_provider');payDemand(typeof token==='string'&&token.length>0&&token.length<=4096,'bad_purchase_token');
  const p=await google.retrieve(o.product_id,token);
  payDemand(p.obfuscatedExternalAccountId===o.account_hash&&p.obfuscatedExternalProfileId===o.id,'invalid_purchase_binding');
  payDemand(Number(p.quantity??1)===1&&p.purchaseType===undefined,'invalid_google_play_purchase');
  const tokenHash=await hash(token);payDemand(!o.token_hash||o.token_hash===tokenHash,'purchase_token_changed');
  o=await call('bind_play',o,{token_hash:tokenHash,purchase_token:token});
  if(p.purchaseState===2)return call('pending',o);
  if(voided||p.purchaseState===1)o=await call('voided',o);
  if(p.purchaseState===1||o.voided){
   if(!o.settled)return call('expire',o);
   return apply(o,{entitlement:0,status:'refunded',provider_order:p.orderId||o.provider_order,payment_intent:null});
  }
  payDemand(p.purchaseState===0&&/^GPA\./.test(p.orderId||''),'invalid_google_play_purchase');
  // A consumed token is valid only for the exact durable grant already recorded here.
  payDemand(p.consumptionState===0||(o.settled&&o.token_hash===tokenHash&&o.provider_order===p.orderId),'purchase_already_consumed');
  o=await apply(o,{entitlement:o.coupons,status:'credited',provider_order:p.orderId,payment_intent:null});
  try{if(p.consumptionState===0)await google.consume(o.product_id,token);o=await call('consumed',o);}catch{/* Durable token and worker retry survive process death. */}
  return o;
 }
 async function refresh(o,options){return o.provider==='stripe'?stripeSync(o,options):o.purchase_token?playSync(o,undefined,options):call('checked',o);}
 async function handle(user,b){
  const cfg=await command('settings',null,{});
  if(b.action==='catalog')return {ok:true,mode:'production',packageName:catalog.packageName,gameEnvironment:cfg.game_env,
   enabled:{stripe:cfg.stripe_enabled&&cfg.stripe_prices_ready&&readiness.stripe,google_play:cfg.play_enabled&&readiness.google_play},packs:catalog.packs};
  payDemand(user?.id&&user.email_confirmed_at,'verified_account_required');
  if(b.action==='request_delete')return {ok:true,...await command('request_delete',user.id,{confirmed:b.confirmed===true})};
  if(b.action==='status')return {ok:true,...await command('status',user.id,{})};
  if(['checkout','create'].includes(b.action)){
   const provider=b.action==='checkout'?'stripe':'google_play';payDemand(readiness[provider],'provider_not_configured');
   payDemand(catalog.packs.some(p=>p.id===b.pack_id)&&/^[A-Z0-9]{12,16}$/.test(b.code||'')&&/^[a-f0-9-]{36}$/i.test(b.request_id||''),'bad_order');
   let o=await command('reserve',user.id,{provider,code:b.code,pack_id:b.pack_id,request_id:b.request_id,account_hash:await hash('soulbeast:production:'+catalog.packageName+':'+user.id)});
   if(provider==='stripe')o=await stripeSync(o);
   return {ok:true,order:{...payPublicOrder(o),...(provider==='google_play'?{productId:o.product_id,accountHash:o.account_hash}:{})}};
  }
  const o=await get(b.order_id,user.id);
  if(b.action==='verify'){const result=await playSync(o,b.purchaseToken);return {ok:true,credited:result.settled&&result.status==='credited',pending:result.status==='pending',order:payPublicOrder(result)};}
  if(['refresh','expire'].includes(b.action)){
   payDemand(b.action!=='expire'||o.provider==='stripe','pending_play_cannot_expire');
   return {ok:true,order:payPublicOrder(await refresh(o,{expire:b.action==='expire'}))};
  }throw Error('bad_billing_action');
 }
 async function stripeEvent(event){
  payDemand(event.livemode===true,'test_payment_forbidden');const v=event.data?.object;payDemand(v,'bad_event');
  const supported=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.expired','charge.refunded','charge.dispute.created','charge.dispute.closed'];
  if(!supported.includes(event.type))return {ok:true,ignored:true};
  let o=await lookup(v.object==='checkout.session'?{session_id:v.id}:{payment_intent:typeof v.payment_intent==='string'?v.payment_intent:v.payment_intent?.id});
  // A paid webhook can beat the checkout bind response. Fetch metadata, then bind only an authenticated Stripe event's session.
  if(!o&&v.object==='checkout.session'&&v.metadata?.order_id){o=await lookup({order_id:v.metadata.order_id});if(o){payDemand(o.provider==='stripe'&&v.metadata.account_id===o.account_id&&v.metadata.pack_id===o.pack_id,'invalid_purchase_binding');const s=await stripe.retrieve(v.id);o=await call('bind_stripe',o,{session_id:s.id,checkout_url:s.url||'https://checkout.stripe.com/paid'});}}
  if(!o)return {ok:true,ignored:true};await stripeSync(o);return {ok:true};
 }
 async function playNotification(n){
  payDemand(n.packageName===catalog.packageName,'play_package_mismatch');if(n.testNotification)return {ok:true,test:true};
  const v=n.oneTimeProductNotification||n.voidedPurchaseNotification;payDemand(v?.purchaseToken,'bad_notification');
  // Notifications are hints. Retrieve the actual purchase from Google before resolving its opaque order ID.
  let o=await lookup({token_hash:await hash(v.purchaseToken)});
  if(!o){payDemand(v.sku,'notification_needs_reconciliation');const p=await google.retrieve(v.sku,v.purchaseToken);o=await lookup({order_id:p.obfuscatedExternalProfileId});}
  payDemand(o,'notification_order_not_found');payDemand(!v.sku||v.sku===o.product_id,'invalid_purchase_binding');
  await playSync(o,v.purchaseToken,{voided:!!n.voidedPurchaseNotification});return {ok:true};
 }
 async function reconcile(){
  let failed=0,checked=0;for(const o of await command('queue',null,{})){try{await refresh(o);checked++;}catch{failed++;await call('checked',o);}}
  // Read all pages from a rolling window: old refunds and consumed purchases need no open app.
  if(google.ready??readiness.google_play){let page;do{const v=await google.voided(page);for(const p of v.voidedPurchases||[]){const o=await lookup({token_hash:await hash(p.purchaseToken)});if(o)try{await playSync(o,p.purchaseToken,{voided:true});}catch{failed++;}}page=v.tokenPagination?.nextPageToken;}while(page);}
  return {ok:failed===0,checked,failed};
 }
 return {handle,stripeEvent,playNotification,reconcile};
}
