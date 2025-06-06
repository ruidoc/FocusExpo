package com.focusone

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okio.IOException
import org.joda.time.DateTime
import org.joda.time.Duration
import org.joda.time.LocalTime
import kotlin.random.Random

class VpnServer: VpnService() {

    private val TAG = "VpnServer";
    private val handler = Handler(Looper.getMainLooper())
    private var runnable: Runnable? = null
    private var running = false;
    // 单个任务运行的开始时间戳
    private var curtime = System.currentTimeMillis()
    private var startTime = LocalTime.now()

    private lateinit var notifyManager: NotificationManager
    private lateinit var sharedPrefs: SharedPreferences

    // 从VPN打开主页面的 Intend 对象
    private val mConfigureIntent: PendingIntent by lazy {
        var activityFlag = PendingIntent.FLAG_UPDATE_CURRENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            activityFlag += PendingIntent.FLAG_MUTABLE
        }
        PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), activityFlag)
    }

    private var pfd: ParcelFileDescriptor? = null

    override fun onCreate() {
        Log.d(TAG, "onCreate: VPN已经启动")
        notifyManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        sharedPrefs = getSharedPreferences("VpnPrefs", MODE_PRIVATE)
        val currentDate = getCurrentDate()
        val long = sharedPrefs.getInt("focus_time", 0)
        val ft = sharedPrefs.getString("focus_total_$currentDate", "[]")
        val ftag = sharedPrefs.getString("focus_tag", "")
        if(long > 0) {
            sendBroadcast("exit_time,${long},${ftag}")
        }
        sendBroadcast("focus_total,${ft}")
        runTimer()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return if (intent?.action == ACTION_DISCONNECT) {
            disconnect()
            START_NOT_STICKY
        } else {
             resetTimer()
            // createMsgNotification("在这里，彻底解决手机上瘾！夺回专注力、自控力！","欢迎使用专注一点APP")
            START_STICKY
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        disconnect()
        handler.removeCallbacks(runnable!!)
//        TcpWorker.stop()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.d(TAG, "onTaskRemoved: 服务任务被移除")
        super.onTaskRemoved(rootIntent)
        sendPostRequest("/logs/add", "{}")
        // 重启当前服务
        startService(Intent(this, VpnServer::class.java))
    }

    // 连接VPN
    private fun connect() {
        // 启动前台通知
        createServerNotification("欢迎使用专注一点👏")
        pfd = createVpnInterface()
        // val (focus) = getFocus()
        // if(focus != null) {
        //     running = true
        //     startTime = LocalTime.now()
        //     curtime = System.currentTimeMillis()
        //     createMsgNotification("本次专注时间 ${focus.end - focus.start} 分钟，加油啊！","开始专注喽！")
        //     sendBroadcast("start")
        // } else {
        //     sendBroadcast("notask")
        // }
    }

    // 断开VPN
    private fun disconnect() {
        pfd?.close()
        running = false
//        notifyManager.cancel(NOTIFICATION_ID)
        sendBroadcast("close")
        // System.gc()
    }

    // 重启VPN
    private fun restart() {
        disconnect()
        connect()
    }

    // 发送全局广播
    private fun sendBroadcast(message: String) {
        val broadcastIntent = Intent("com.focusone.MY_GLOBAL_BROADCAST")
        broadcastIntent.putExtra("message", message)
        sendBroadcast(broadcastIntent)
    }

    // 执行定时器
    private fun runTimer() {
        // 创建一个 Runnable 对象
        runnable = object : Runnable {
            override fun run() {
                // 在这里执行你的定时任务
//                println("定时任务启动：${System.currentTimeMillis()}")
                checkTime()
                // 重新调度任务，例如每 10 秒执行一次
                handler.postDelayed(this, 10000)
            }
        }
        // 首次执行 Runnable
        checkTime()
        // 首次执行 Runnable
        handler.postDelayed(runnable!!, 10000)
    }

    // 检测时间段
    private fun isCurrentTimeInInterval(startTime: LocalTime, endTime: LocalTime): Boolean {
        val currentTime = LocalTime.now()
        // 如果结束时间小于开始时间，那么时间段跨越了午夜
        if (endTime.isBefore(startTime)) {
            return currentTime.isAfter(startTime) || currentTime.isBefore(endTime)
        } else {
            return currentTime.isAfter(startTime) && currentTime.isBefore(endTime)
        }
    }

    // 获取当前任务对象和下一个任务对象
    private fun getFocus(): Array<TRange?> {
        // 当前分钟
        val minutes = DateTime().minuteOfDay().get()
        // 当前秒
        val now_sec = DateTime().secondOfDay().get()
        // Log.d(TAG, "当前分钟: $minutes, 当前秒: $now_sec")
        val rules = FOCUS_TIMERANGE.find { it->
            now_sec in it.start..it.end
        }
        val next = FOCUS_TIMERANGE.find { it->
            now_sec < it.start
        }
        return arrayOf(rules, next);
    }

    // 修改获取当前任务已运行的时长方法，加入记录逻辑
    private fun getDuraTime(): String {
        val duration = Duration(curtime, System.currentTimeMillis())
        val totalSeconds = duration.standardSeconds
        // 四舍五入到最近10秒（暂时先去掉）
        // val roundedSeconds = ((totalSeconds + 5) / 10) * 10
        val minutes = (totalSeconds / 60).toInt()
        val seconds = (totalSeconds % 60).toInt()
        val time = if(minutes < 60) {
            // "$minutes 分钟 $seconds 秒"
            "$minutes 分钟"
        } else {
            "${minutes / 60} 小时 ${minutes % 60} 分"
        }
        
        // 获取当前任务ID
        val taskTag = sharedPrefs.getString("focus_tag", "")
        if (taskTag != null && taskTag.isNotEmpty() && running) {
            val taskId = taskTag.split(",").firstOrNull() ?: ""
            // 读取上次记录的分钟数
            val lastMinutes = sharedPrefs.getInt("last_focus_minutes", -1)
            
            // 只在分钟数发生变化时更新
            if (lastMinutes != minutes && taskId.isNotEmpty()) {
                updateTaskDuration(taskId, minutes)
                
                // 记录当前分钟数，供下次比较
                with(sharedPrefs.edit()) {
                    putInt("last_focus_minutes", minutes)
                    apply()
                }
            }
        }
        
        // 更新总专注分钟数
        with(sharedPrefs.edit()) {
            putInt("focus_minutes", minutes)
            apply()
        }
        
        return time;
    }
    
    // 修改记录专注时长的方法，按任务ID记录
    private fun updateTaskDuration(taskId: String, minutes: Int) {
        val currentDate = getCurrentDate()
        val key = "focus_total_$currentDate"
        
        // 获取现有记录
        val existingJson = sharedPrefs.getString(key, "[]")
        val taskList = try {
            val list = ArrayList<String>()
            // 去掉前后的 []，按逗号分割
            val content = existingJson?.trim('[', ']') ?: ""
            if (content.isNotEmpty()) {
                content.split(",").forEach { item ->
                    list.add(item.trim(' ', '"'))
                }
            }
            list
        } catch (e: Exception) {
            ArrayList<String>()
        }
        
        // 查找当前任务是否已有记录
        var found = false
        val newList = taskList.map { item ->
            if (item.startsWith("$taskId:")) {
                found = true
                "$taskId:$minutes" // 更新时长
            } else {
                item // 保持其他任务记录不变
            }
        }.toMutableList()
        
        // 如果没找到当前任务，添加新记录
        if (!found) {
            newList.add("$taskId:$minutes")
        }
        
        // 保存更新后的记录
        val newJson = newList.joinToString(", ", "[", "]") { "\"$it\"" }
        with(sharedPrefs.edit()) {
            putString(key, newJson)
            apply()
        }
        
        Log.d(TAG, "更新任务时长: $taskId, $minutes 分钟, 今日记录: $newJson")
        sendBroadcast("task_update,$taskId,$minutes")
    }

    // 在class内部顶部添加获取当前日期的函数
    private fun getCurrentDate(): String {
        val now = DateTime.now()
        return "${now.year().get()}-${now.monthOfYear().get()}-${now.dayOfMonth().get()}"
    }

    // 定时执行的任务
    private fun checkTime() {
        // 获取当前任务已运行的时长（分钟或小时）
        val time = getDuraTime()
        // 获取当前任务对象和下一个任务对象
        val (focusTime, nextTime) = getFocus()
        // Log.d(TAG, "执行定时任务: $time, $focusTime")
        if (focusTime != null && Math.abs(DateTime().secondOfDay().get() - focusTime.end) > 1) {
            createServerNotification("已持续 $time", if(focusTime.mode == "shield") "屏蔽模式•运行中..." else "专注模式•运行中...")
            // 判断任务刚刚开始（有任务 & 状态非运行中）
            if(!running) {
                val nowSeconds = DateTime().secondOfDay().get()
                var isStarted = nowSeconds - focusTime.start > 1
                val taskStart = if(isStarted) nowSeconds else focusTime.start
                val total = focusTime.end - taskStart
                val total_min = (total / 60).toInt()
                if (isStarted) {
                    createMsgNotification("任务剩余时长 ${total_min} 分钟，加油啊！","已有任务，继续专注！")
                    sendBroadcast("continue,${focusTime.id}")
                } else {
                    createMsgNotification("本次任务时长 ${total_min} 分钟，加油啊！","开始专注喽！")
                    sendBroadcast("start")
                }
                restart() // 重启VPN
                running = true
                // startTime = LocalTime.now()
                // 更新任务开始时间戳
                curtime = System.currentTimeMillis()
                with(sharedPrefs.edit()) {
                    putString("focus_tag", focusTime.id + "," + focusTime.duration.toString())
                    apply()
                }
            }
            with(sharedPrefs.edit()) {
                // 每次更新当前时间戳
                putInt("focus_time", (System.currentTimeMillis() / 1000).toInt())
                apply() // 或者 commit()，但apply()是异步的，通常更推荐使用
            }
        } else {
            val minutes = sharedPrefs.getInt("focus_minutes", 0)
            val ftag = sharedPrefs.getString("focus_tag", "")
            val desc = if(nextTime != null) {
                val dur = nextTime.start - DateTime().secondOfDay().get()
                val hour = if(dur / 3600 > 0) " ${dur / 3600} 小时" else ""
                val min = (dur % 3600) / 60
                "下个任务${hour} ${min} 分钟后开始"
            } else "当天任务已经完毕，太棒了！";
            // 判断任务刚刚结束（无任务 & 状态是运行中）
            if(running) {
                createMsgNotification("坚持专注 $time，太厉害了！","恭喜完成专注！")
                restart()
                sendBroadcast("complete,${minutes},${ftag}")
            }
            createServerNotification(desc, "当前没有专注任务")
            with(sharedPrefs.edit()) {
                putInt("focus_time", 0)
                putInt("focus_minutes", 0)
                putString("focus_tag", "")
                apply()
            }
        }
    }

    // 创建前台服务通知
    private fun createServerNotification(message: String, title: String = "专注一点") {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "前台服务通知"
            val descriptionText = "服务运行通知"
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(NOTIFICATION_CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            notifyManager.createNotificationChannel(channel)
        }
        val builder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_logo)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(mConfigureIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        // 启动前台进程
        startForeground(NOTIFICATION_ID, builder.build())
    }

    // 创建消息通知
    private fun createMsgNotification(message: String, title: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "消息通知"
            val descriptionText = "开始结束任务通知"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel("NOTIF_MESSAGE", name, importance).apply {
                description = descriptionText
                enableVibration(true)
            }
            notifyManager.createNotificationChannel(channel)
        }
        val builder = NotificationCompat.Builder(this, "NOTIF_MESSAGE")
            .setSmallIcon(R.drawable.ic_logo)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true) // 点击关闭
            .setPriority(NotificationCompat.PRIORITY_HIGH) // 高优先级
            .setContentIntent(mConfigureIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC) // 锁屏通知
        notifyManager.notify(Random.nextInt(), builder.build())
    }

    // 创建VPN接口
    private fun createVpnInterface(): ParcelFileDescriptor {
        return Builder()
            .addAddress("10.0.0.2", 32)
            .addRoute("0.0.0.0", 0)
//            .addDnsServer("114.114.114.114")
            .addDnsServer("114.114.115.115")
            .setSession("VPN-Server")
            .setBlocking(true)
            .setConfigureIntent(mConfigureIntent)
            .also {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    it.setMetered(false)
                }
                val (focus) = getFocus()
                if(focus != null) {
                    val SELECTED_APPS = if(focus.mode=="focus") FOCUS_APPS else SHIELD_APPS
                    SELECTED_APPS.forEach { app->
                        if(focus.mode == "shield") {
                            it.addAllowedApplication(app)
                        } else it.addDisallowedApplication(app)
                    }
                    Log.d(TAG, "当前模式: ${focus.mode} / $SELECTED_APPS")
                } else {
                    it.addAllowedApplication("com.google.android.youtube")
                    Log.d(TAG, "当前没有专注任务")
                }
            }
            .establish() ?: throw IllegalStateException("无法初始化vpnInterface")
    }

    // 发送POST请求
    fun sendPostRequest(path: String, json: String) {
        val url = "https://focusone.ruidoc.cn/api$path"
        val client = OkHttpClient()
        val requestBody = json
            .toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")
            println(response.body?.string())
        }
    }

    // 重置定时器，重新开始计时
    private fun resetTimer() {
        val (focus) = getFocus()
        if(focus != null) {
            handler.removeCallbacks(runnable!!)
            curtime = System.currentTimeMillis()
            runTimer()
        }
    }

    companion object {
        data class TRange(
            val id: String, val start: Int, val end: Int, val repeat: String, val mode: String, val duration: Int
        )

        // 通知频道Id
        const val NOTIFICATION_CHANNEL_ID = "VpnServer"
        // 通知ID
        const val NOTIFICATION_ID = 3

        /**
         * 动作：连接
         */
        const val ACTION_CONNECT = "firstcompose.vpnserver.CONNECT"

        /**
         * 动作：断开连接
         */
        const val ACTION_DISCONNECT = "firstcompose.vpnserver.DISCONNECT"

        var FOCUS_APPS = listOf<String>() // 专注app列表
        var SHIELD_APPS = listOf<String>() // 屏蔽app列表

        var FOCUS_TIMERANGE = listOf<TRange>()
    }
}