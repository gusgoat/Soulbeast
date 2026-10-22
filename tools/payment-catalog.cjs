'use strict';
const assert=require('node:assert/strict');
function validateCatalog(catalog){
 assert.equal(catalog.version,1);assert.equal(catalog.enabled,false,'Purchases must remain disabled until integration is tested');
 assert.equal(catalog.stripeMode,'test');assert.equal(catalog.currency,'thb');
 assert.deepEqual(catalog.promotionLimit,{scope:'account',perPack:1,consumeOn:'paid-and-credited'});
 assert.equal(catalog.packs.length,8);
 const ids=new Set(),prices=new Set();
 for(const p of catalog.packs){
  assert.match(p.id,/^(first|normal)-[1-9][0-9]*$/);assert(!ids.has(p.id),'Duplicate pack');ids.add(p.id);
  assert.match(p.priceId,/^price_[A-Za-z0-9]+$/);assert(!prices.has(p.priceId),'Duplicate price');prices.add(p.priceId);
  assert(Number.isSafeInteger(p.coupons)&&p.coupons>0);assert(Number.isSafeInteger(p.amountSatang)&&p.amountSatang>0);
  assert.equal(p.promotion,p.id.startsWith('first-'));assert.equal(p.coupons,Number(p.id.split('-')[1]));assert.equal(typeof p.name,'string');
 }
 return catalog;
}
function validateStripePrice(pack,price){
 assert.equal(price.id,pack.priceId,'Wrong Stripe price');assert.equal(price.livemode,false,'Live Stripe price is forbidden in test catalog');
 assert.equal(price.active,true,'Inactive price');assert.equal(price.type,'one_time','Recurring prices are forbidden');
 assert.equal(price.recurring,null);assert.equal(price.currency,'thb','Wrong currency');assert.equal(price.billing_scheme,'per_unit');
 assert.equal(price.unit_amount,pack.amountSatang,'Wrong amount');assert.equal(price.custom_unit_amount??null,null,'Customer must not choose amount');
 assert(price.product&&typeof price.product==='object'&&price.product.active===true,'Missing or inactive expanded product');
 return true;
}
module.exports={validateCatalog,validateStripePrice};
