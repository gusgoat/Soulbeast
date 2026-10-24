export function liveStripe({key,webhookSecret,returnUrl,fetcher=fetch}){
 const demand=(v,c)=>{if(!v)throw Error(c);};
 async function api(path,method='GET',body,idempotency){
  demand(/^(sk|rk)_live_[A-Za-z0-9]+$/.test(key||''),'stripe_live_key_missing');
  const r=await fetcher('https://api.stripe.com/v1/'+path,{method,headers:{Authorization:'Bearer '+key,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(idempotency?{'Idempotency-Key':idempotency}:{})},...(body?{body:new URLSearchParams(body)}:{}),signal:AbortSignal.timeout(20000)});
  if(!r.ok){const e=Error('stripe_unavailable');e.status=r.status;throw e;}const v=await r.json();demand(v.livemode!==false,'test_payment_forbidden');return v;
 }
 async function verifyPrice(o){const p=await api('prices/'+encodeURIComponent(o.stripe_price_id)+'?expand[]=product');demand(p.id===o.stripe_price_id&&p.livemode===true&&p.active&&p.type==='one_time'&&p.recurring===null&&p.currency==='thb'&&p.unit_amount===o.amount_satang&&p.billing_scheme==='per_unit'&&!p.custom_unit_amount&&p.product?.active,'stripe_price_mismatch');}
 return {
  ready:/^(sk|rk)_live_[A-Za-z0-9]+$/.test(key||'')&&!!webhookSecret,
  keyConfigured:/^(sk|rk)_live_[A-Za-z0-9]+$/.test(key||''),
  checkPrice:verifyPrice,
  async probeCheckout(o){
   await verifyPrice(o);
   const probe=crypto.randomUUID();
   const s=await api('checkout/sessions','POST',{
    mode:'payment','line_items[0][price]':o.stripe_price_id,'line_items[0][quantity]':'1',
    locale:'th', // Eligible payment methods are configured in Stripe Dashboard.
    success_url:returnUrl+'?qa=unpaid',cancel_url:returnUrl+'?qa=cancelled',
    client_reference_id:'sb-qa-'+probe,'metadata[qa_probe]':probe
   },'soulbeast-unpaid-probe-'+probe);
   demand(s.livemode===true&&s.id?.startsWith('cs_live_'),'invalid_purchase_binding');
   // Never return the payable URL. Close the session before reporting success.
   try{
    const closed=await api('checkout/sessions/'+encodeURIComponent(s.id)+'/expire','POST',{});
    return {ok:closed.id===s.id&&closed.livemode===true&&closed.status==='expired'&&closed.payment_status==='unpaid',sessionId:s.id,status:closed.status,paymentStatus:closed.payment_status,charged:false};
   }catch{return {ok:false,sessionId:s.id,status:'cleanup_required',charged:false};}
  },
  async create(o){await verifyPrice(o);const s=await api('checkout/sessions','POST',{
   mode:'payment','line_items[0][price]':o.stripe_price_id,'line_items[0][quantity]':'1',
   locale:'th', // Eligible payment methods are configured in Stripe Dashboard.
   success_url:returnUrl+'?order='+o.id,cancel_url:returnUrl+'?order='+o.id+'&cancelled=1',
   client_reference_id:o.id,'metadata[order_id]':o.id,'metadata[account_id]':o.account_id,'metadata[pack_id]':o.pack_id,
   'payment_intent_data[metadata][order_id]':o.id,'payment_intent_data[metadata][account_id]':o.account_id
  },'soulbeast-production-'+o.id);demand(s.livemode===true&&s.id?.startsWith('cs_live_')&&s.url?.startsWith('https://checkout.stripe.com/'),'invalid_purchase_binding');return s;},
  retrieve:id=>api('checkout/sessions/'+encodeURIComponent(id)+'?expand[]=line_items'),
  expire:id=>api('checkout/sessions/'+encodeURIComponent(id)+'/expire','POST',{}),
  async verify(o,s){
   demand(s.livemode===true&&s.id===o.session_id&&s.mode==='payment'&&s.status==='complete'&&s.payment_status==='paid','payment_not_paid');
   demand(s.client_reference_id===o.id&&s.metadata?.order_id===o.id&&s.metadata?.account_id===o.account_id&&s.metadata?.pack_id===o.pack_id,'invalid_purchase_binding');
   const lines=s.line_items;demand(lines?.data?.length===1&&!lines.has_more&&lines.data[0].quantity===1&&lines.data[0].price?.id===o.stripe_price_id,'payment_amount_mismatch');
   demand(s.currency==='thb'&&s.amount_subtotal===o.amount_satang&&s.amount_total===o.amount_satang&&lines.data[0].amount_total===o.amount_satang&&!s.total_details?.amount_discount&&!s.total_details?.amount_tax&&!s.total_details?.amount_shipping,'payment_amount_mismatch');
   demand(typeof s.payment_intent==='string'&&s.payment_intent.startsWith('pi_'),'invalid_purchase_binding');
   const intent=await api('payment_intents/'+encodeURIComponent(s.payment_intent)+'?expand[]=latest_charge');
   const charge=intent.latest_charge;demand(intent.livemode===true&&intent.status==='succeeded'&&intent.amount===o.amount_satang&&intent.currency==='thb'&&charge?.livemode===true&&charge.paid&&charge.amount===o.amount_satang,'payment_amount_mismatch');
   const refunded=charge.amount_refunded;demand(Number.isSafeInteger(refunded)&&refunded>=0&&refunded<=o.amount_satang,'invalid_refund');
   let disputed=false;if(charge.disputed){const list=await api('disputes?charge='+encodeURIComponent(charge.id)+'&limit=10');demand(Array.isArray(list.data)&&!list.has_more,'dispute_state_unavailable');disputed=list.data.some(d=>!['won','warning_closed'].includes(d.status));}return {refunded,disputed};
  }
 };
}
// Extend the existing server-only OAuth provider with refund reconciliation.
export function productionGoogle({base,credentials,packageName,fetcher=fetch}){
 return {...base,ready:!!credentials,
  async voided(pageToken){
   const query=new URLSearchParams({type:'1',includeQuantityBasedPartialRefund:'true',startTime:String(Date.now()-29*86400000),...(pageToken?{token:pageToken}:{})});
   return base.authorized('https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'+encodeURIComponent(packageName)+'/purchases/voidedpurchases?'+query);
  }
 };
}
