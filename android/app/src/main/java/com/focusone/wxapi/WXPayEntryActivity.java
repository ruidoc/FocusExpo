
        package com.focusone.wxapi;

        import android.app.Activity;
        import android.content.Intent;
        import android.os.Bundle;

        public class WXPayEntryActivity extends Activity {
          @Override
          public void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);

            try {
              Intent intent = getIntent();
              Intent intentToBroadcast = new Intent();

              intentToBroadcast.setAction("com.hector.nativewechat.ACTION_REDIRECT_INTENT");
              intentToBroadcast.putExtra("intent", intent);

              sendBroadcast(intentToBroadcast);

              finish();
            } catch (Exception e) {
              e.printStackTrace();
            }
          }
        }
        