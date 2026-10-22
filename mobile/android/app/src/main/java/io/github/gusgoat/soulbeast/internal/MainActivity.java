package io.github.gusgoat.soulbeast.internal;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SoulbeastBillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
