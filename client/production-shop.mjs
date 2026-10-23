export const PAYMENT_ENDPOINT='https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-payments';
const KEY='sb_publishable_-m9RbNVXYhaKjUZYSGGdMQ_rrkCuEL6';
const words={
 title:['คูปอง Soulbeast','Soulbeast coupons','Soulbeast兑换券'],
 unavailable:['ยังไม่เปิดรับชำระเงินจริง กรุณาลองภายหลัง','Real-money purchases are not open yet. Please try later.','真实付款尚未开放，请稍后再试。'],
 received:['ตรวจสอบและส่งคูปองแล้ว','Payment verified; coupons delivered.','付款已核验，兑换券已发放。'],
 pending:['กำลังรอผลชำระเงิน ยังไม่มีการส่งคูปอง','Payment pending; coupons have not been delivered yet.','付款待确认，尚未发放兑换券。'],
 failed:['รายการยังไม่สำเร็จ กรุณาตรวจรายการเดิมก่อนซื้อซ้ำ','Payment is incomplete. Check the existing order before buying again.','交易未完成，重新购买前请检查原订单。'],
 review:['มีรายการคืนเงินที่ต้องตรวจสอบ กรุณาติดต่อ Line @soulbeast','A refunded purchase needs review. Contact Line @soulbeast.','退款交易需要审核，请联系Line @soulbeast。'],
 terms:['ชำระครั้งเดียว ไม่มีต่ออายุอัตโนมัติ · โปรโมชั่นใช้ร่วมเว็บและแอป · ตรวจอัตราสุ่มในหน้ากาชาก่อนซื้อ','One-time purchases, no automatic renewal. Promotions are shared across web and app. Review gacha rates before buying.','一次性购买，无自动续费。网页与应用共享首购资格，购买前请查看扭蛋概率。'],
 refresh:['ตรวจรายการ','Check orders','检查订单'],close:['ปิด','Close','关闭'],buy:['ซื้อ','Buy','购买'],
 used:['ใช้สิทธิ์แล้วหรือมีรายการค้าง','Used or pending','已使用或有待处理订单'],
 reserved:['กำลังสร้างรายการ','Creating order','创建订单中'],open:['รอชำระเงิน','Awaiting payment','等待付款'],credited:['ส่งคูปองแล้ว','Coupons delivered','已发放兑换券'],refunded:['ปรับสิทธิ์จากการคืนเงินแล้ว','Refund entitlement adjusted','已调整退款权益'],disputed:['กำลังตรวจข้อโต้แย้ง','Payment dispute under review','付款争议审核中'],expired:['ยกเลิกหรือหมดอายุ','Cancelled or expired','已取消或过期'],
 history:['ประวัติการซื้อ','Purchase history','购买记录'],recipient:['ผู้รับคูปอง','Recipient','接收角色'],
 support:['ติดต่อเรื่องการซื้อ/คืนเงิน: Line @soulbeast พร้อมเลขรายการ ไม่ต้องส่งรหัสผ่าน','Purchase/refund support: Line @soulbeast. Include the order ID, never your password.','购买/退款支持：Line @soulbeast。请提供订单号，勿发送密码。']
};
export const shopText=(key,lang='th')=>words[key]?.[lang==='en'?1:lang==='zh-CN'?2:0]||key;
export function paymentApi(client,fetcher=fetch){return async(action,body={})=>{
 const send=async force=>fetcher(PAYMENT_ENDPOINT,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json',...(action==='catalog'?{}:{Authorization:'Bearer '+await client.sessions.token(force)})},body:JSON.stringify({action,...body}),signal:AbortSignal.timeout(60000)});
 let r=await send(false);if(r.status===401&&action!=='catalog')r=await send(true);const v=await r.json();if(!r.ok||!v.ok)throw Error(v.error||'payment_service_unavailable');return v;
};}
export async function openProductionPlayShop({client,code,native,config,notify,onUpdated=()=>{},lang=document.documentElement.lang}){
 const t=k=>shopText(k,lang),api=paymentApi(client),caps=await native.getCapabilities();
 if(!config.android.purchasesEnabled||!caps.enabled){notify(t('unavailable'));return;}
 const catalog=await api('catalog');if(!catalog.enabled.google_play||catalog.mode!=='production'||catalog.packageName!==caps.packageName){notify(t('unavailable'));return;}
 const state=await api('status');if(state.debt){notify(t('review'));return;}
 if(!state.characters.some(c=>c.code===code))throw Error('character_not_owned');
 const recover=async()=>{for(const p of (await native.getPurchases()).purchases||[])if(p.orderId&&p.purchaseToken){try{await api('verify',{order_id:p.orderId,purchaseToken:p.purchaseToken});}catch{/* Unrelated account/test tokens cannot grant this account. */}}await onUpdated();};
 await recover();
 const products=(await native.getProducts({productIds:catalog.packs.map(p=>p.productId)})).products||[];
 const dialog=document.createElement('dialog');dialog.className='production-shop';const header=document.createElement('h2');header.textContent=t('title');dialog.append(header);const recipient=document.createElement('p');recipient.textContent=t('recipient')+': '+state.characters.find(c=>c.code===code).name;dialog.append(recipient);
 const terms=document.createElement('p');terms.textContent=t('terms');dialog.append(terms);const status=document.createElement('p');status.setAttribute('role','status');dialog.append(status);
 const history=document.createElement('details'),summary=document.createElement('summary'),historyRows=document.createElement('div');summary.textContent=t('history');history.append(summary,historyRows);
 let busy=false;
 const update=async()=>{
  const state=await api('status');historyRows.replaceChildren();for(const o of state.orders){const row=document.createElement('p');row.textContent=o.pack_id+' · '+t(o.status)+' · '+o.id;historyRows.append(row);}
  for(const b of dialog.querySelectorAll('[data-pack]')){const pack=catalog.packs.find(p=>p.id===b.dataset.pack);b.disabled=busy||state.debt>0||pack.promotion&&state.orders.some(o=>o.pack_id===pack.id&&o.status!=='expired');}
 };
 for(const pack of catalog.packs){const product=products.find(p=>p.id===pack.productId);if(!product)continue;
  const b=document.createElement('button');b.className='btn full';b.dataset.pack=pack.id;b.textContent=pack.names[lang==='en'?1:lang==='zh-CN'?2:0]+' · '+product.formattedPrice;dialog.append(b);
  b.onclick=async()=>{if(busy)return;busy=true;await update();try{
   const {order}=await api('create',{pack_id:pack.id,code,request_id:crypto.randomUUID()});
   const p=await native.purchase({productId:order.productId,obfuscatedAccountId:order.accountHash,obfuscatedProfileId:order.id});
   // Even pending tokens are persisted by the verified server for background recovery.
   const r=p.purchaseToken?await api('verify',{order_id:order.id,purchaseToken:p.purchaseToken}):{pending:true};
   status.textContent=t(r.credited?'received':r.order?.status==='refunded'?'review':'pending');await onUpdated();
  }catch{status.textContent=t('failed');}finally{busy=false;await update();}};
 }
 const refresh=document.createElement('button');refresh.className='btn';refresh.textContent=t('refresh');refresh.onclick=async()=>{if(busy)return;busy=true;try{await recover();await update();status.textContent=t('refresh');}catch{status.textContent=t('failed');}finally{busy=false;await update();}};dialog.append(refresh,history);
 const support=document.createElement('p');support.textContent=t('support');dialog.append(support);
 const close=document.createElement('button');close.className='btn';close.textContent=t('close');close.onclick=()=>dialog.close();dialog.append(close);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);await update();dialog.showModal();
}
