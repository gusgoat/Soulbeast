// Provider-independent boundary for the future Play fulfillment endpoint. No client-reported price or quantity is trusted.
export function verifyPlayPurchase(order,purchase,{packageName,productId,testOnly=true,allowConsumed=false}){
 const reject=()=>{throw Error('invalid_google_play_purchase');};
 if((order.packageName||order.package_name)!==packageName||(order.productId||order.product_id)!==productId)reject();
 if(purchase.purchaseState!==0||Number(purchase.quantity??1)!==1||purchase.obfuscatedExternalAccountId!==(order.accountHash||order.account_hash)||purchase.obfuscatedExternalProfileId!==order.id)reject();
 if(testOnly&&purchase.purchaseType!==0)throw Error('live_play_purchase_forbidden');
 if(!purchase.orderId||purchase.orderId!==String(purchase.orderId))reject();
 if(purchase.consumptionState!==0&&!(allowConsumed&&purchase.consumptionState===1))throw Error('purchase_already_consumed');
 return {provider:'google_play',providerOrderId:purchase.orderId,orderId:order.id,coupons:order.coupons};
}
export async function retrievePlayPurchase({accessToken,packageName,productId,purchaseToken,fetcher=fetch}){
 if(!accessToken||!purchaseToken||purchaseToken.length>4096)throw Error('bad_purchase_token');
 const path=[packageName,productId,purchaseToken].map(encodeURIComponent);
 const response=await fetcher('https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'+path[0]+'/purchases/products/'+path[1]+'/tokens/'+path[2],{headers:{Authorization:'Bearer '+accessToken},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('google_play_verification_failed');return response.json();
}
