package com.focusone

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Context.RECEIVER_NOT_EXPORTED
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.net.VpnService
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.focusone.VpnServer.Companion.TRange
import com.google.gson.Gson
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking

class NativeClass(context: ReactApplicationContext): ReactContextBaseJavaModule(context) {
    
    companion object {
        private const val TAG = "NativeClass"
    }

    override fun getName(): String =  "NativeClass";

    override fun initialize() {
        if (!registerReceiver()) {
            initActivity()
        } else {
            Log.d(TAG, "initialize: 非异常退出")
        }
    }

    private fun initActivity() = runBlocking<Unit> {
        delay(2000L)
        registerReceiver()
    }

    // 注册广播监听者
    private fun registerReceiver(): Boolean  {
        val activity = currentActivity as? MainActivity
        if (activity === null) {
            return false
        }
        val globalReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val message = intent?.getStringExtra("message")
                Log.d("原生模块", "广播消息: $message")
                val params = Arguments.createMap().apply {
                    putString("state", message)
                }
                sendEvent("vpn-change", params)
            }
        }
        val filter = IntentFilter("com.focusone.MY_GLOBAL_BROADCAST")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            activity.registerReceiver(globalReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            activity.registerReceiver(globalReceiver, filter)
        }
        return true
    }

    // 向JS发送消息
    fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod fun startVpn(onlyInit: Boolean = false, promise: Promise) {
        val activity = currentActivity as MainActivity
        activity.runServer(onlyInit) { ok->
            promise.resolve(ok);
        }
        Log.d(TAG, "startVpn: 执行了, onlyInit=$onlyInit")
    }

    @ReactMethod fun stopVpn(promise: Promise) {
        val activity = currentActivity as MainActivity
        activity.stopVpn()
    }

    @ReactMethod fun isVpnInit(promise: Promise) {
        val activity = currentActivity as MainActivity
        val init = VpnService.prepare(activity) == null
        promise.resolve(init);
    }

    // 更新时间区间
    @ReactMethod fun setTimerange(timerange: String, promise: Promise) {
        // Log.d(TAG, "时间段字符串: $timerange")
        val json_range = Gson().fromJson(timerange, Array<TRange>::class.java).toList()
        Log.d(TAG, "时间段对象: $json_range")
        VpnServer.FOCUS_TIMERANGE = json_range
        promise.resolve(true);
    }

    // 更新专注APP列表
    @ReactMethod fun updateFocusApps(focus_apps: String, promise: Promise) {
        val apps = Gson().fromJson(focus_apps, Array<String>::class.java)
        VpnServer.FOCUS_APPS = apps.plus("com.focusone").toList()
//        Log.d(TAG, "专注APP列表: $apps")
        promise.resolve(true);
    }

    // 更新屏蔽APP列表
    @ReactMethod fun updateShieldApps(shield_apps: String, promise: Promise) {
        val apps = Gson().fromJson(shield_apps, Array<String>::class.java)
        VpnServer.SHIELD_APPS = apps.toList()
        promise.resolve(true);
    }

    // 检查电池优化是否屏蔽
    @ReactMethod fun checkBattery(apply: Boolean, promise: Promise) {
        val activity = currentActivity as MainActivity
        val isok = activity.checkBatteryOptimization(apply)
        promise.resolve(isok)
    }

    // 打开横幅通知
    @ReactMethod fun openBanner(promise: Promise) {
        val activity = currentActivity as MainActivity
        val isok = activity.openBannerNotification()
        promise.resolve(isok)
    }

    // 获取已安装的APP
    @ReactMethod fun getApps(promise: Promise) {
        val activity = currentActivity as MainActivity
        val list = activity.getApplications()
        val jsonStr = Gson().toJson(list)
        promise.resolve(jsonStr);
    }

    @ReactMethod fun openAppByPackageName(packageName: String) {
        val activity = currentActivity as MainActivity
        val packageManager = activity.packageManager
        // 尝试查找目标应用的信息
        val resolveInfo = packageManager.getLaunchIntentForPackage(packageName)
        if (resolveInfo != null) {
            // 应用已安装，我们可以启动它
            activity.startActivity(resolveInfo)
        } else {
            // 应用未安装，提示用户去下载
            val marketIntent = Intent(Intent.ACTION_VIEW)
            marketIntent.data = Uri.parse("market://details?id=$packageName")
            activity.startActivity(marketIntent)
        }
    }

    @ReactMethod fun addListener(eventName: String) {
        Log.d(TAG, "addListener: $eventName")
    }

    @ReactMethod fun removeListeners(count: Int) {
        Log.d(TAG, "removeListeners: $count")
    }
}
