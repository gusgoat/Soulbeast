'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const {checkSession,checkPrice,testKey,checkoutParams,verifySignature}=await import('../server/payments/core.mjs');
 const c=require('../content/payment-packs.test.json');
 for(const p of c.packs){assert.throws(()=>testKey('sk_live_abc'));checkPrice(p,{id:p.priceId,livemode:false,active:true,type:'one_time',recurring:null,currency:'thb',billing_scheme:'per_unit',unit_amount:p.amountSatang,product:{active:true}});}
 const order={id:crypto.randomUUID(),account_id:crypto.randomUUID(),pack_id:c.packs[0].id,price_id:c.packs[0].priceId,amount_satang:3500,session_id:'cs_test_order'};
 const session={id:order.session_id,livemode:false,mode:'payment',client_reference_id:order.id,metadata:{order_id:order.id,account_id:order.account_id,pack_id:order.pack_id},amount_total:3500,amount_subtotal:3500,currency:'thb',total_details:{amount_discount:0,amount_tax:0,amount_shipping:0},line_items:{has_more:false,data:[{price:{id:order.price_id},quantity:1,amount_total:3500}]},payment_status:'paid',status:'complete',payment_intent:'pi_test_order'};
 assert.equal(checkSession(order,session),session);
 for(const change of [{livemode:true},{mode:'subscription'},{id:'cs_test_other'},{client_reference_id:'other'},{amount_total:3501},{amount_subtotal:0},{currency:'usd'},{payment_status:'unpaid'},{status:'open'},{payment_intent:null},{metadata:{...session.metadata,account_id:'other'}},{metadata:{...session.metadata,pack_id:'normal-200'}},{line_items:{...session.line_items,has_more:true}},{line_items:{data:[...session.line_items.data,...session.line_items.data]}},{line_items:{data:[{...session.line_items.data[0],quantity:2}]}},{line_items:{data:[{...session.line_items.data[0],price:{id:'price_wrong'}}]}},{total_details:{amount_discount:1}}])assert.throws(()=>checkSession(order,{...session,...change}));
 const params=checkoutParams(order,'https://gusgoat.github.io/Soulbeast/topup-test.html');assert.equal(params['line_items[0][quantity]'],'1');assert.equal(params.mode,'payment');assert.equal(params['payment_method_types[1]'],'promptpay');assert(!params.customer_email);assert(!Object.keys(params).some(k=>k.includes('unit_amount')));assert.equal(params['metadata[account_id]'],order.account_id);
 const now=Date.now(),t=Math.floor(now/1000),body=JSON.stringify({livemode:false,type:'checkout.session.completed'}),secret='whsec_test_fixture',sig=crypto.createHmac('sha256',secret).update(t+'.'+body).digest('hex');
 assert(await verifySignature(body,'t='+t+',v1='+sig,secret,{now,subtle:crypto.webcrypto.subtle}));
 for(const [b,h,k]of [[body+' ',`t=${t},v1=${sig}`,secret],[body,`t=${t},v1=${sig}`,'wrong'],[body,`t=${t-301},v1=${sig}`,secret],[body,`t=${t+301},v1=${sig}`,secret],[body,'t=bad,v1='+sig,secret],[body,'',secret]])await assert.rejects(()=>verifySignature(b,h,k,{now,subtle:crypto.webcrypto.subtle}));
 console.log('PASS sandbox rules: all packs, session/account/amount/quantity/payment validation, test-key gate, PromptPay/card checkout, raw-body webhook signatures and replay age');
})().catch(e=>{console.error(e);process.exitCode=1;});
