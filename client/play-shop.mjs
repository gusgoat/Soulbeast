// Android only. Prices come from Google Play; entitlement and account ownership come from the server.
export async function openPlayShop({client,code,native,config,notify,translate=text=>text,onUpdated=()=>{}}){
 const caps=await native.getCapabilities();
 if(!config.android.purchasesEnabled||!caps.enabled){notify('ร้าน Google Play ยังไม่เปิดชำระเงินในรุ่นทดสอบนี้');return;}
 if(!code)throw Error('character_required');
 const api=async body=>{
  const send=async force=>fetch('https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-play-test',{method:'POST',headers:{apikey:'sb_publishable_-m9RbNVXYhaKjUZYSGGdMQ_rrkCuEL6',Authorization:'Bearer '+await client.sessions.token(force),'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
  let r=await send(false);if(r.status===401)r=await send(true);const v=await r.json();if(!r.ok||!v.ok)throw Error(v.error||'play_service_unavailable');return v;
 };
 const catalog=await api({action:'catalog'});
 if(catalog.packageName!==caps.packageName)throw Error('play_package_mismatch');
 const products=await native.getProducts({productIds:catalog.packs.map(p=>p.productId)});
 // After process death, recover only purchased tokens with their server-generated profile/order ID.
 const unfinished=await native.getPurchases();
 for(const p of unfinished.purchases||[])if(p.state==='purchased'&&p.orderId){await api({action:'verify',order_id:p.orderId,purchaseToken:p.purchaseToken});await onUpdated();}
 const dialog=document.createElement('dialog'),title=document.createElement('h2'),notice=document.createElement('p'),status=document.createElement('p');
 title.textContent=translate('คูปอง Soulbeast · Google Play');notice.textContent=translate('โหมดทดสอบ Google Play · ใช้บัญชี License tester เท่านั้น');dialog.append(title,notice,status);
 const buttons=[];
 for(const pack of catalog.packs){
  const product=products.products?.find(p=>p.id===pack.productId);if(!product)continue;
  const button=document.createElement('button');button.className='btn full';button.textContent=translate(pack.name)+' · '+product.formattedPrice;buttons.push(button);
  const old=catalog.orders?.find(o=>o.pack===pack.id&&o.code===code&&o.status==='reserved');
  button.disabled=pack.promotion&&catalog.promotions?.includes(pack.id)&&!old;
  button.onclick=async()=>{
   buttons.forEach(b=>{b.disabled=true;});status.textContent=translate('กำลังดำเนินการ…');
   try{
    const r=await api({action:'create',pack_id:pack.id,code,request_id:crypto.randomUUID()}),order=r.order;
    const p=await native.purchase({productId:order.productId,obfuscatedAccountId:order.accountHash,obfuscatedProfileId:order.id});
    if(p.state!=='purchased'){status.textContent=translate('รอการชำระเงิน คูปองจะเพิ่มหลังตรวจสอบสำเร็จ');return;}
    const result=await api({action:'verify',order_id:order.id,purchaseToken:p.purchaseToken});
    status.textContent=translate(result.credited?'ตรวจสอบและเพิ่มคูปองแล้ว':'รอการตรวจสอบ');await onUpdated();
   }catch{status.textContent=translate('รายการยังไม่สำเร็จ กรุณาเปิดร้านอีกครั้งเพื่อตรวจรายการค้าง');}
   finally{buttons.forEach(b=>{b.disabled=true;});}
  };dialog.append(button);
 }
 const close=document.createElement('button');close.className='btn';close.textContent=translate('ปิด');close.onclick=()=>dialog.close();dialog.append(close);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
}
