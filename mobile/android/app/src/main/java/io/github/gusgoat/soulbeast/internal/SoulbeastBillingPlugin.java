package io.github.gusgoat.soulbeast.internal;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "SoulbeastBilling")
public class SoulbeastBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private BillingClient billing;
    private PluginCall pending;

    @PluginMethod public void getCapabilities(PluginCall call) {
        JSObject r = new JSObject(); r.put("provider", "google_play");
        r.put("enabled", BuildConfig.BILLING_ENABLED); r.put("packageName", getContext().getPackageName()); call.resolve(r);
    }

    private void connected(PluginCall call, Runnable action) {
        if (!BuildConfig.BILLING_ENABLED) { call.reject("purchases_disabled"); return; }
        if (billing == null) billing = BillingClient.newBuilder(getContext()).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
        if (billing.isReady()) { action.run(); return; }
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) action.run();
                else call.reject("google_play_unavailable");
            }
            @Override public void onBillingServiceDisconnected() { }
        });
    }

    @PluginMethod public void getProducts(PluginCall call) {
        if (!BuildConfig.BILLING_ENABLED) { JSObject r = new JSObject(); r.put("enabled", false); r.put("products", new JSArray()); call.resolve(r); return; }
        connected(call, () -> {
            JSArray ids = call.getArray("productIds", new JSArray()); List<QueryProductDetailsParams.Product> products = new ArrayList<>();
            for (int i=0; i<ids.length(); i++) products.add(QueryProductDetailsParams.Product.newBuilder().setProductId(ids.optString(i)).setProductType(BillingClient.ProductType.INAPP).build());
            if (products.isEmpty()) { call.reject("missing_product_ids"); return; }
            billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(products).build(), (result, details) -> {
                if (result.getResponseCode()!=BillingClient.BillingResponseCode.OK) { call.reject("google_play_unavailable"); return; }
                JSArray list = new JSArray();
                for (ProductDetails d : details.getProductDetailsList()) {
                    List<ProductDetails.OneTimePurchaseOfferDetails> offers = d.getOneTimePurchaseOfferDetailsList();
                    if (offers == null || offers.isEmpty()) continue;
                    JSObject p = new JSObject(); p.put("id", d.getProductId()); p.put("name", d.getName());
                    p.put("formattedPrice", offers.get(0).getFormattedPrice()); p.put("currency", offers.get(0).getPriceCurrencyCode()); list.put(p);
                }
                JSObject r = new JSObject(); r.put("enabled", true); r.put("products", list); call.resolve(r);
            });
        });
    }

    @PluginMethod public void purchase(PluginCall call) {
        if (!BuildConfig.BILLING_ENABLED) { call.reject("purchases_disabled"); return; }
        if (pending != null) { call.reject("purchase_in_progress"); return; }
        String id = call.getString("productId", ""), account = call.getString("obfuscatedAccountId", ""), profile = call.getString("obfuscatedProfileId", "");
        if (!account.matches("[a-f0-9]{64}") || !profile.matches("[a-f0-9-]{36}") || id.isEmpty()) { call.reject("invalid_billing_order"); return; }
        connected(call, () -> {
            QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build();
            billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(product)).build(), (result, details) -> {
                if (result.getResponseCode()!=BillingClient.BillingResponseCode.OK || details.getProductDetailsList().size()!=1) { call.reject("product_unavailable"); return; }
                ProductDetails d = details.getProductDetailsList().get(0); List<ProductDetails.OneTimePurchaseOfferDetails> offers = d.getOneTimePurchaseOfferDetailsList();
                if (offers == null || offers.size()!=1) { call.reject("product_offer_not_configured"); return; }
                BillingFlowParams.ProductDetailsParams p = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d).setOfferToken(offers.get(0).getOfferToken()).build();
                BillingFlowParams flow = BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(p)).setObfuscatedAccountId(account).setObfuscatedProfileId(profile).build();
                getActivity().runOnUiThread(() -> { pending=call; BillingResult started=billing.launchBillingFlow(getActivity(), flow); if (started.getResponseCode()!=BillingClient.BillingResponseCode.OK) { pending=null; call.reject("purchase_not_started"); } });
            });
        });
    }

    private JSObject purchaseView(Purchase p) {
        JSObject r = new JSObject(); r.put("purchaseToken", p.getPurchaseToken()); r.put("productIds", new JSArray(p.getProducts()));
        if (p.getAccountIdentifiers()!=null) r.put("orderId", p.getAccountIdentifiers().getObfuscatedProfileId());
        r.put("state", p.getPurchaseState()==Purchase.PurchaseState.PURCHASED ? "purchased" : "pending"); return r;
    }
    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        PluginCall call=pending; pending=null;
        if (call==null) return;
        if (result.getResponseCode()==BillingClient.BillingResponseCode.USER_CANCELED) { call.reject("purchase_cancelled"); return; }
        if (result.getResponseCode()!=BillingClient.BillingResponseCode.OK || purchases==null || purchases.size()!=1) { call.reject("purchase_incomplete"); return; }
        call.resolve(purchaseView(purchases.get(0)));
        // Never grant or consume here: delivery and acknowledgement belong to the verified server transaction.
    }
    @PluginMethod public void getPurchases(PluginCall call) {
        if (!BuildConfig.BILLING_ENABLED) { JSObject r=new JSObject(); r.put("purchases",new JSArray()); call.resolve(r); return; }
        connected(call, () -> billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> {
            if (result.getResponseCode()!=BillingClient.BillingResponseCode.OK) { call.reject("google_play_unavailable"); return; }
            JSArray list=new JSArray(); for(Purchase p:purchases) list.put(purchaseView(p)); JSObject r=new JSObject(); r.put("purchases",list); call.resolve(r);
        }));
    }
    @Override protected void handleOnDestroy() { if(billing!=null)billing.endConnection(); super.handleOnDestroy(); }
}
