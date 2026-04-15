package com.municipal.pool;

import android.app.PendingIntent;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private NfcAdapter nfcAdapter;
    private PendingIntent pendingIntent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        nfcAdapter = NfcAdapter.getDefaultAdapter(this);

        if (nfcAdapter != null) {
            Intent intent = new Intent(this, getClass())
                    .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            pendingIntent = PendingIntent.getActivity(
                    this, 0, intent,
                    PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (nfcAdapter != null && pendingIntent != null) {
            nfcAdapter.enableForegroundDispatch(this, pendingIntent, null, null);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (nfcAdapter != null) {
            nfcAdapter.disableForegroundDispatch(this);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        String action = intent.getAction();
        if (NfcAdapter.ACTION_TAG_DISCOVERED.equals(action)
                || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action)
                || NfcAdapter.ACTION_TECH_DISCOVERED.equals(action)) {

            Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            if (tag != null) {
                byte[] id = tag.getId();
                String serialNumber = bytesToHexColon(id);

                // Disparar evento JavaScript en el WebView
                final String jsCode = "window.dispatchEvent(new CustomEvent('nfc-tag-detected', " +
                        "{ detail: { serialNumber: '" + serialNumber + "' } }));";

                runOnUiThread(() -> {
                    if (bridge != null && bridge.getWebView() != null) {
                        bridge.getWebView().evaluateJavascript(jsCode, null);
                    }
                });
            }
        }
    }

    /**
     * Convierte bytes a formato XX:XX:XX (igual que Web NFC serialNumber)
     */
    private String bytesToHexColon(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < bytes.length; i++) {
            if (i > 0) sb.append(":");
            sb.append(String.format("%02x", bytes[i]));
        }
        return sb.toString();
    }
}
