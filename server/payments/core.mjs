// Sandbox-only rules. No secret or caller-selected price/amount is accepted here.
export class PaymentError extends Error {constructor(code,status=400){super(code);this.status=status;}}
export const demand=(condition,code,status=400)=>{if(!condition)throw new PaymentError(code,status);};
export function testKey(key){demand(/^(sk|rk)_test_[A-Za-z0-9]+$/.test(key||''),'test_key_not_configured',503);return key;}
export function packById(catalog,id){const p=catalog.packs.find(p=>p.id===id);demand(p,'unknown_pack');return p;}
export function checkPrice(pack,p){
 demand(p.id===pack.priceId&&p.livemode===false&&p.active===true&&p.type==='one_time'&&p.recurring===null&&p.currency==='thb'&&p.billing_scheme==='per_unit'&&p.unit_amount===pack.amountSatang&&!p.custom_unit_amount&&p.product?.active===true,'stripe_price_mismatch',503);return p;
}
export function checkSession(order,s){
 demand(s.id===order.session_id&&s.livemode===false&&s.mode==='payment','session_mismatch',409);
 demand(s.client_reference_id===order.id&&s.metadata?.order_id===order.id&&s.metadata?.account_id===order.account_id&&s.metadata?.pack_id===order.pack_id,'session_owner_mismatch',409);
 demand(s.amount_total===order.amount_satang&&s.amount_subtotal===order.amount_satang&&s.currency==='thb'&&!s.total_details?.amount_discount&&!s.total_details?.amount_tax&&!s.total_details?.amount_shipping,'payment_amount_mismatch',409);
 const lines=s.line_items;demand(lines&&!lines.has_more&&lines.data?.length===1,'payment_lines_mismatch',409);
 const line=lines.data[0];demand(line.price?.id===order.price_id&&line.quantity===1&&line.amount_total===order.amount_satang,'payment_lines_mismatch',409);
 demand(s.payment_status==='paid'&&s.status==='complete','payment_pending',409);
 demand(typeof s.payment_intent==='string'&&s.payment_intent.startsWith('pi_'),'payment_intent_missing',409);return s;
}
export function checkoutParams(order,returnUrl){
 return {'mode':'payment','line_items[0][price]':order.price_id,'line_items[0][quantity]':'1','payment_method_types[0]':'card','payment_method_types[1]':'promptpay','locale':'th','success_url':returnUrl+'?order='+order.id,'cancel_url':returnUrl+'?order='+order.id+'&cancelled=1','client_reference_id':order.id,'metadata[order_id]':order.id,'metadata[account_id]':order.account_id,'metadata[pack_id]':order.pack_id};
}
export async function verifySignature(body,header,secret,{now=Date.now(),subtle=crypto.subtle}={}){
 demand(secret,'webhook_not_configured',503);demand(header,'invalid_signature',400);
 const fields=header.split(',').map(p=>p.split('=')),t=fields.find(p=>p[0]==='t')?.[1],sigs=fields.filter(p=>p[0]==='v1').map(p=>p[1]);
 demand(/^\d+$/.test(t||'')&&Math.abs(now/1000-Number(t))<=300&&sigs.length<=10,'invalid_signature',400);
 const key=await subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 for(const sig of sigs){if(!/^[a-f0-9]{64}$/.test(sig||''))continue;const bytes=Uint8Array.from(sig.match(/../g),x=>parseInt(x,16));if(await subtle.verify('HMAC',key,bytes,new TextEncoder().encode(t+'.'+body)))return true;}
 throw new PaymentError('invalid_signature',400);
}
