package com.focusone
import android.Manifest
import android.app.NotificationManager
import expo.modules.splashscreen.SplashScreenManager

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper
import java.io.ByteArrayOutputStream
import android.util.Base64
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

const val TAG = "安卓主进程"

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "FocusOne"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }

  // 请求 Vpn 连接并处理回调结果
  private val vpnLauncher = registerForActivityResult(VpnContent()) {
    if (it) {
      sendBroadcast("open")
      startVpn()
    } else {
      // Toast.makeText(this, "VPN连接取消", Toast.LENGTH_LONG).show()
      sendBroadcast("refuse")
    }
  }

  // 开启横幅通知检测
  private val bannerLauncher =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
      if (it.resultCode == RESULT_OK) {
        Log.d("TAG", "返回结果")
      }
    }

  private val batteryOption = registerForActivityResult(
    ActivityResultContracts.StartActivityForResult()) { result ->
    Log.d(TAG, "电池优化: ${result.resultCode}")
    if (result.resultCode == RESULT_OK) {
      // 用户已将应用添加到电池优化例外中
      Toast.makeText(this, "操作成功", Toast.LENGTH_SHORT).show()
      sendBroadcast("battery")
    } else {
      // 用户取消操作或者没有允许电池优化
      // Toast.makeText(this, "操作取消", Toast.LENGTH_SHORT).show()
    }
  }

  // 初始化 Vpn 服务
  fun runServer(onlyInit: Boolean = false, callback: (ok: Boolean) -> Unit) {
    VpnService.prepare(this@MainActivity)?.let {
      Log.d(TAG, "runServer: 初始化VPN")
      vpnLauncher.launch(it)
      if (onlyInit) {
        callback(true)
      }
    } ?: kotlin.run {
      Log.d(TAG, "runServer: Vpn马上启动")
      if (!onlyInit) {
        startVpn()
      }
      callback(true);
    }
  }

  /**
   * 启动vpn服务
   */
  private fun startVpn() {
    startService(Intent(this@MainActivity, VpnServer::class.java))
  }

  /**
   * 停止vpn服务
   */
  fun stopVpn() {
    startService(Intent(this@MainActivity, VpnServer::class.java).also {
      it.action = VpnServer.ACTION_DISCONNECT
    })
  }

  fun getApplications(): List<Any> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      requestQueryPermission()
    }
    val installedApps = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
    // 过滤掉系统预装应用，如果需要的话
    val f_apps = installedApps.filter { app ->
      (app.flags and ApplicationInfo.FLAG_SYSTEM) == 0 && app.packageName != "com.focusone"
    }
    data class MyApps(val appName: String, val packageName: String, val icon: String)
    return f_apps.map { app->
      MyApps(
        appName = packageManager.getApplicationLabel(app).toString(),
        packageName = app.packageName,
        icon = getIconBase64(app.loadIcon(packageManager))
      )
    }
  }

  // 转换base64代码
  fun getIconBase64(drawable: Drawable): String {
    return if (drawable is BitmapDrawable) {
      val icon = drawable.bitmap
      val outputStream = ByteArrayOutputStream()
      icon.compress(Bitmap.CompressFormat.WEBP, 50, outputStream)
      Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
    } else {
      drawable.toString()
    }
  }

  // 检查权限是否已被授予
  @RequiresApi(Build.VERSION_CODES.R)
  private fun hasQueryPermission(): Boolean {
    return ContextCompat.checkSelfPermission(this, Manifest.permission.QUERY_ALL_PACKAGES) == PackageManager.PERMISSION_GRANTED
  }

  // 请求权限
  @RequiresApi(Build.VERSION_CODES.R)
  private fun requestQueryPermission() {
    if(!hasQueryPermission()) {
      ActivityCompat.requestPermissions(
        this,
        arrayOf(Manifest.permission.QUERY_ALL_PACKAGES),
        8
      )
    }
  }

  fun checkBatteryOptimization(apply: Boolean): Boolean {
    val powerManager = getSystemService(POWER_SERVICE) as PowerManager
    if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
      // 用户尚未将应用添加到电池优化例外中
      if(apply) {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
        intent.data = Uri.parse("package:$packageName")
        batteryOption.launch(intent)
      }
      return false
    } else {
      return true
    }
  }

  fun openBannerNotification() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    val notifyManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    val bannerImportance = notifyManager.getNotificationChannel("NOTIF_MESSAGE").importance
    if (bannerImportance == NotificationManager.IMPORTANCE_DEFAULT) {
      val intent = Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
        .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
        .putExtra(Settings.EXTRA_CHANNEL_ID, "NOTIF_MESSAGE")
      bannerLauncher.launch(intent); false
    } else true
  } else true

  // 发送全局广播
  private fun sendBroadcast(message: String) {
    val broadcastIntent = Intent("com.focusone.MY_GLOBAL_BROADCAST")
    broadcastIntent.putExtra("message", message)
    sendBroadcast(broadcastIntent)
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    if (requestCode == 8) {
      if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
        // 权限被授予，可以继续执行相关操作
        Log.d("权限", "获取应用权限已开启")
      } else {
        // 权限被拒绝
        Toast.makeText(this, "请开启获取应用的权限", Toast.LENGTH_LONG).show()
      }
    }
  }

  class VpnContent : ActivityResultContract<Intent, Boolean>() {
    override fun createIntent(context: Context, input: Intent): Intent {
      return input
    }
    override fun parseResult(resultCode: Int, intent: Intent?): Boolean {
      return resultCode == RESULT_OK
    }
  }

}
