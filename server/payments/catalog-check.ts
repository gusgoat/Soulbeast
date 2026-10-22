// Server-side read-only readiness check. This file is deployed first, then replaced by index.ts.
import {withSupabase} from 'jsr:@supabase/server@^1';
const CATALOG = /* PAYMENT_CATALOG */;
const cors={'Access-Control-Allow-Origin':'https://gusgoat.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'};
export default {async fetch(req){
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 return withSupabase({auth:'publishable:*'},async()=>{
  const key=Deno.env.get('STRIPE_TEST_SECRET_KEY')||'';
  if(!/^(sk|rk)_test_[A-Za-z0-9]+$/.test(key))return Response.json({ok:false,error:'test_key_not_configured'},{status:503,headers:cors});
  const prices=[];
  for(const p of CATALOG.packs){
   const r=await fetch('https://api.stripe.com/v1/prices/'+p.priceId+'?expand%5B%5D=product',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});
   if(!r.ok)return Response.json({ok:false,error:'stripe_price_lookup_failed',pack:p.id,status:r.status},{status:503,headers:cors});
   const s=await r.json();
   if(!(s.id===p.priceId&&s.livemode===false&&s.active&&s.type==='one_time'&&s.recurring===null&&s.currency==='thb'&&s.billing_scheme==='per_unit'&&s.unit_amount===p.amountSatang&&!s.custom_unit_amount&&s.product?.active))return Response.json({ok:false,error:'stripe_price_mismatch',pack:p.id},{status:503,headers:cors});
   prices.push({id:p.id,priceId:p.priceId,coupons:p.coupons,amountSatang:p.amountSatang,verified:true});
  }
  return Response.json({ok:true,service:'soulbeast-payments-test',mode:'test',purchasesEnabled:false,keyConfigured:true,prices},{headers:cors});
 })(req);
}};
