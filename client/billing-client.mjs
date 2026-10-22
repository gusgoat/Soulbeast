export function billingChannel(platform){
 if(platform==='android')return 'google_play';
 if(platform==='web')return 'stripe';
 throw Error('unsupported_billing_platform');
}
export function createBilling({platform,config,native,openWeb,verifyPurchase}){
 const provider=billingChannel(platform);
 return {
  provider,
  async open(){
   if(provider==='stripe'){if(config.web.provider!=='stripe'||config.web.environment!=='sandbox')throw Error('web_billing_not_ready');return openWeb(config.web.checkoutPath);}
   // There is intentionally no fallback to Stripe, a browser link, or an unverified local grant on Android.
   const caps=await native.getCapabilities();
   if(!config.android.purchasesEnabled||!caps.enabled)return {enabled:false,provider,reason:'google_play_not_configured'};
   return native.getProducts({productIds:Object.values(config.android.products)});
  },
  async purchase(pack,order){
   if(provider!=='google_play'||!config.android.purchasesEnabled)throw Error('purchases_disabled');
   const caps=await native.getCapabilities();if(!caps.enabled)throw Error('purchases_disabled');
   const productId=config.android.products[pack];if(!productId||!order?.id||!order.accountHash)throw Error('invalid_billing_order');
   if(!verifyPurchase)throw Error('verification_service_not_ready');
   const result=await native.purchase({productId,obfuscatedAccountId:order.accountHash,obfuscatedProfileId:order.id});
   if(result.state!=='purchased')return {pending:true};
   // Only the server may validate, grant, and consume. This module never adds coupons.
   return verifyPurchase({orderId:order.id,productId,purchaseToken:result.purchaseToken});
  },
  async unfinished(){if(provider!=='google_play')return [];return (await native.getPurchases()).purchases||[];}
 };
}
