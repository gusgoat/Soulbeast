'use strict';
// Executes the exact bundled Edge handler with a fake Stripe transport and fake RPC.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
require('node:child_process').execFileSync(process.execPath,['tools/build-payments.cjs']);
const catalog=require('../content/payment-packs.test.json'),account='77777777-0000-4000-8000-000000000001',requestId=crypto.randomUUID();
let authenticated=true,verified=true,secret='sk_test_fixture',hook='whsec_fixture',fetches=[],commands=[],order;
const db={auth:{getUser:async()=>({data:{user:authenticated?{id:account,email:'qa@example.invalid',email_confirmed_at:verified?'2026-10-22':null}:null},error:authenticated?null:Error('bad token')})},rpc:async(name,args)=>{
 commands.push({name,args});if(name==='sb_shop_test_command'){
  if(args.p_action==='reserve')order??={id:crypto.randomUUID(),account_id:account,request_id:requestId,pack_id:'first-10',price_id:catalog.packs[0].priceId,amount_satang:3500,coupons:10,game_env:'test',code:'SHOPQATEST001',status:'creating',created_at:new Date().toISOString()};
  if(args.p_action==='bind')order={...order,status:'open',session_id:args.p_data.session_id,checkout_url:args.p_data.checkout_url};
  if(args.p_action==='credit')order={...order,status:'credited'};
  if(args.p_action==='status')return {data:{characters:[],orders:order?[order]:[],balances:[]}};
  return {data:order};
 }if(name==='sb_engine_snapshot')return {data:{auth_locked:false,tables:{Saves:[[],['SHOPQATEST001',crypto.createHash('sha256').update('SHOPQATEST001:1234').digest('hex'),'QA owner']]}}};
 if(name==='sb_engine_auth_failure')return {data:{}};
 throw Error('Unexpected RPC');
}};
const stripeFetch=async(url,options)=>{fetches.push({url,options});if(url.includes('/prices/')){const p=catalog.packs.find(p=>url.includes(p.priceId));return Response.json({id:p.priceId,livemode:false,active:true,type:'one_time',recurring:null,currency:'thb',billing_scheme:'per_unit',unit_amount:p.amountSatang,product:{active:true}});}
 if(url.endsWith('/checkout/sessions'))return Response.json({id:'cs_test_fixture',livemode:false,url:'https://checkout.stripe.com/c/pay/cs_test_fixture'});
 if(url.includes('/checkout/sessions/'))return Response.json({id:order.session_id,livemode:false,mode:'payment',client_reference_id:order.id,metadata:{order_id:order.id,account_id:account,pack_id:order.pack_id},amount_total:3500,amount_subtotal:3500,currency:'thb',line_items:{has_more:false,data:[{price:{id:order.price_id},quantity:1,amount_total:3500}]},payment_status:'paid',status:'complete',payment_intent:'pi_fixture'});
 throw Error('Unexpected Stripe request');};
const source=fs.readFileSync('build/payments/index.ts','utf8').replace(/^import .*withSupabase.*\r?\n/m,'').replace('export default {','globalThis.handler = {');
const ctx=vm.createContext({console,Response,Request,URL,URLSearchParams,AbortSignal,TextEncoder,Uint8Array,Date,crypto:crypto.webcrypto,fetch:stripeFetch,Deno:{env:{get:n=>n==='STRIPE_TEST_SECRET_KEY'?secret:hook}},withSupabase:(_,f)=>req=>f(req,{supabaseAdmin:db})});vm.runInContext(source,ctx);
async function call(body,headers={},path='') {return ctx.handler.fetch(new Request('https://example.invalid/soulbeast-payments-test'+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)}));}
(async()=>{
 let r=await call({action:'catalog'});assert.equal(r.status,200);assert.equal((await r.json()).packs.length,8);assert.equal(fetches.length,8);assert.equal(commands.length,0);
 r=await call({action:'checkout',pack_id:'first-10',request_id:requestId});assert.equal(r.status,401);assert.equal(commands.length,0);
 const headers={Authorization:'Bearer a.b.c'};verified=false;r=await call({action:'status'},headers);assert.equal(r.status,401);verified=true;
 r=await call({action:'link',code:'SHOPQATEST001',pin:'9999',game_env:'test'},headers);assert.equal(r.status,403);assert(!commands.some(c=>c.args.p_action==='link'));
 r=await call({action:'link',code:'SHOPQATEST001',pin:'1234',game_env:'test'},headers);assert.equal(r.status,200);assert(commands.some(c=>c.args.p_action==='link'&&c.args.p_account===account));commands=[];
 hook='';r=await call({action:'checkout'},headers);assert.equal(r.status,503);assert.equal(commands.length,0);hook='whsec_fixture';
 r=await call({action:'checkout',pack_id:'first-10',request_id:requestId,code:'SHOPQATEST001',game_env:'test',price_id:'evil',amount:1,coupons:999999},headers);assert.equal(r.status,200);assert.equal((await r.json()).order.status,'open');
 const stripeCall=fetches.find(x=>x.url.endsWith('/checkout/sessions'));assert.equal(stripeCall.options.headers['Idempotency-Key'],'soulbeast-test-'+order.id);assert.equal(stripeCall.options.body.get('line_items[0][price]'),catalog.packs[0].priceId);assert.equal(stripeCall.options.body.get('metadata[account_id]'),account);
 assert(!JSON.stringify(commands).includes('999999'));assert(!JSON.stringify(commands).includes('evil'));
 r=await call({action:'refresh',order_id:order.id},headers);assert.equal(r.status,200);assert.equal((await r.json()).order.status,'credited');assert(commands.some(c=>c.args.p_action==='credit'));
 const timestamp=Math.floor(Date.now()/1000),body=JSON.stringify({livemode:false,type:'checkout.session.completed',data:{object:{object:'checkout.session',id:order.session_id,livemode:false,metadata:{order_id:order.id,account_id:account}}}}),signature=crypto.createHmac('sha256',hook).update(timestamp+'.'+body).digest('hex');
 r=await call(body,{'Stripe-Signature':`t=${timestamp},v1=${signature}`},'/webhook');assert.equal(r.status,200);
 r=await call(body,{},'/webhook');assert.equal(r.status,400);r=await call(body+' ',{'Stripe-Signature':`t=${timestamp},v1=${signature}`},'/webhook');assert.equal(r.status,400);
 const other=JSON.stringify({livemode:false,type:'checkout.session.completed',data:{object:{object:'checkout.session',livemode:false,metadata:{}}}}),otherSig=crypto.createHmac('sha256',hook).update(timestamp+'.'+other).digest('hex');r=await call(other,{'Stripe-Signature':`t=${timestamp},v1=${otherSig}`},'/webhook');assert.equal(r.status,200);assert.equal((await r.json()).ignored,true);
 secret='sk_live_forbidden';r=await call({action:'catalog'});assert.equal(r.status,503);
 console.log('PASS exact Edge handler: unauthenticated/unverified denied, fixed server prices, idempotency key, refresh and signed webhook fulfillment, unsigned/tampered/live rejected (mock services)');
})().catch(e=>{console.error(e);process.exitCode=1;});
