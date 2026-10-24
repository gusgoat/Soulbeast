// Server administrators only. No checkout, payment, ledger or settings writes.
export async function paymentCheckAuthorized(headers,env,hash){
 const supplied=headers.get('apikey');if(!supplied)return false;
 let configured;try{configured=JSON.parse(env('SUPABASE_SECRET_KEYS')||'{}');}catch{return false;}
 const keys=[env('SUPABASE_SERVICE_ROLE_KEY'),...Object.values(configured)].filter(k=>typeof k==='string'&&k.length>=20);
 const digest=await hash(supplied);for(const key of keys)if(digest===await hash(key))return true;
 return false;
}
export async function checkPaymentConnection({catalog,packs,stripe,settings,webhookConfigured}){
 const checks=[];
 for(const expected of catalog.packs){
  const p=packs.find(p=>p.id===expected.id);
  if(!p||!p.active||p.coupons!==expected.coupons||p.amount_satang!==expected.amountSatang||p.promotion!==expected.promotion||!/^price_[A-Za-z0-9]+$/.test(p.stripe_price_id||'')){
   checks.push({pack:expected.id,ok:false,error:'catalog_mismatch'});continue;
  }
  try{await stripe.checkPrice(p);checks.push({pack:p.id,ok:true});}
  catch(e){checks.push({pack:p.id,ok:false,error:e.message==='stripe_price_mismatch'?'stripe_price_mismatch':'stripe_connection_failed',...(e.status?{httpStatus:e.status}:{})});}
 }
 return {ok:packs.length===catalog.packs.length&&checks.every(c=>c.ok)&&stripe.ready&&webhookConfigured,readOnly:true,
  stripeKeyConfigured:stripe.keyConfigured===true,webhookSecretConfigured:webhookConfigured,checks,
  salesSwitches:{stripe:settings.stripe_enabled===true,google_play:settings.play_enabled===true},
  checkoutWriteTested:false,webhookDeliveryTested:false};
}
