'use strict';
const assert=require('node:assert/strict'),{validateCatalog,validateStripePrice}=require('./payment-catalog.cjs');
const c=require('../content/payment-packs.test.json');validateCatalog(c);
const expected=[['first-10',10,3500],['first-50',50,15000],['first-100',100,27500],['normal-5',5,3500],['normal-10',10,7000],['normal-50',50,30000],['normal-100',100,55000],['normal-200',200,100000]];
assert.deepEqual(c.packs.map(p=>[p.id,p.coupons,p.amountSatang]),expected);
for(const pack of c.packs){
 const price={id:pack.priceId,livemode:false,active:true,type:'one_time',recurring:null,currency:'thb',billing_scheme:'per_unit',unit_amount:pack.amountSatang,custom_unit_amount:null,product:{active:true}};
 assert(validateStripePrice(pack,price));
 for(const change of [{livemode:true},{active:false},{type:'recurring'},{recurring:{interval:'month'}},{currency:'usd'},{unit_amount:pack.amountSatang+1},{billing_scheme:'tiered'},{custom_unit_amount:{enabled:true}},{product:{active:false}},{id:'price_wrong'}])assert.throws(()=>validateStripePrice(pack,{...price,...change}));
}
for(const change of [{enabled:true},{stripeMode:'live'},{currency:'usd'},{packs:[...c.packs,c.packs[0]]},{promotionLimit:{scope:'character',perPack:1,consumeOn:'checkout'}}])assert.throws(()=>validateCatalog({...c,...change}));
console.log('PASS payment catalog: 8 agreed packs, 3 account-limited promotions; rejects live, recurring, wrong-price and inactive products (mock Stripe fixtures only, not a remote verification)');
