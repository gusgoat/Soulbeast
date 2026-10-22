// Test purchases only. Provider calls are outside the database transaction; delivery is atomic with engine CAS.
export function playBillingService({command,snapshot,google,hash,packageName,catalog,enabled=false}){
 const publicOrder=o=>({id:o.id,pack:o.pack_id,productId:o.product_id,accountHash:o.account_hash,code:o.code,status:o.status,coupons:o.coupons});
 const owned=async(user,id)=>command('get',user.id,{order_id:id});
 return async(user,body)=>{
  if(!user?.id||!user.email_confirmed_at)throw Error('verified_account_required');
  if(!enabled)throw Error('play_billing_disabled');
  if(body.action==='catalog')return {ok:true,testOnly:true,packageName,packs:catalog,...await command('status',user.id,{})};
  if(body.action==='create'){
   if(!catalog.some(p=>p.id===body.pack_id)||!/^\w{12,16}$/.test(body.code||'')||!/^[a-f0-9-]{36}$/i.test(body.request_id||''))throw Error('bad_order');
   const o=await command('reserve',user.id,{provider:'google_play',pack_id:body.pack_id,code:body.code,request_id:body.request_id,account_hash:await hash('soulbeast:test:'+packageName+':'+user.id)});
   return {ok:true,order:publicOrder(o)};
  }
  if(body.action!=='verify')throw Error('bad_billing_action');
  if(typeof body.purchaseToken!=='string'||body.purchaseToken.length<1||body.purchaseToken.length>4096)throw Error('bad_purchase_token');
  let order=await owned(user,body.order_id);
  if(order.provider!=='google_play'||order.package_name!==packageName)throw Error('wrong_payment_provider');
  const tokenHash=await hash(body.purchaseToken),purchase=await google.retrieve(order.product_id,body.purchaseToken);
  if(purchase.purchaseState===2)return {ok:true,pending:true,order:publicOrder(order)};
  // A consumed token is accepted only when this exact order already has the committed grant.
  const previouslyGranted=order.status!=='reserved'&&order.token_hash===tokenHash;
  if(order.status!=='reserved'&&!previouslyGranted)throw Error('purchase_token_changed');
  if(previouslyGranted&&order.provider_order!==purchase.orderId)throw Error('purchase_token_changed');
  const result=google.verify(order,purchase,{packageName,productId:order.product_id,testOnly:true,allowConsumed:previouslyGranted});
  if(!previouslyGranted){
   let delivered=false;
   for(let attempt=0;attempt<5;attempt++){
    const snap=await snapshot(order.code);
    if(snap.mode!=='test')throw Error('test_environment_required');
    const rows=structuredClone(snap.tables?.Coupons||[]),row=rows.slice(1).find(r=>r[0]===order.code);
    if(!row||row[7]===true||/^(true|1|yes|banned)$/i.test(String(row[7])))throw Error('coupon_account_unavailable');
    const before=Number(row[2]);if(!Number.isSafeInteger(before)||before<0||before>1e9-order.coupons)throw Error('invalid_coupon_balance');
    row[2]=before+order.coupons;row[6]=Date.now();
    const grant=await command('grant',user.id,{order_id:order.id,token_hash:tokenHash,provider_order:result.providerOrderId,expected:snap.revision,changes:{Coupons:rows},before,after:row[2]});
    if(grant.conflict)continue;order=grant.order;delivered=true;break;
   }
   if(!delivered)throw Error('billing_busy_retry');
  }
  // Never consume before the grant commits. A retry after a crash reuses the durable order/token binding.
  let consumePending=false;
  try{if(purchase.consumptionState===0)await google.consume(order.product_id,body.purchaseToken);order=await command('consumed',user.id,{order_id:order.id,token_hash:tokenHash});}
  catch{consumePending=true;}
  return {ok:true,credited:true,consumePending,order:publicOrder(order)};
 };
}
