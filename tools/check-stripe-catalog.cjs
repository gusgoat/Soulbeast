'use strict';
// Read-only verification. Never creates a charge or exposes the credential in output.
const {validateCatalog,validateStripePrice}=require('./payment-catalog.cjs');
const catalog=validateCatalog(require('../content/payment-packs.test.json'));
(async()=>{
 const key=process.env.STRIPE_TEST_SECRET_KEY||'';
 if(!/^(rk|sk)_test_[A-Za-z0-9]+$/.test(key))throw Error('Set STRIPE_TEST_SECRET_KEY to a sandbox restricted or secret key in the server environment; never commit it');
 for(const pack of catalog.packs){
  const response=await fetch('https://api.stripe.com/v1/prices/'+encodeURIComponent(pack.priceId)+'?expand%5B%5D=product',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Stripe price verification failed: HTTP '+response.status+' for '+pack.id);
  validateStripePrice(pack,await response.json());console.log('PASS '+pack.id+' '+pack.amountSatang/100+' THB / '+pack.coupons+' coupons');
 }
 console.log('PASS all 8 prices verified against Stripe sandbox; purchases remain disabled');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
