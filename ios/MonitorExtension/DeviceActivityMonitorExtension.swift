//
//  DeviceActivityMonitorExtension.swift
//  MonitorExtension
//
//  Created by 杨瑞 on 2025/6/5.
//

import DeviceActivity
import ManagedSettings
import UserNotifications

// Optionally override any of the functions below.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        
        // Handle the start of the interval.
    }
    
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        
        // 到点自动清理屏蔽
        let store = ManagedSettingsStore()
        store.clearAllSettings()
        notifyEnd()
    }
    
    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        
        // Handle the event reaching its threshold.
    }
    
    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
        
        // Handle the warning before the interval starts.
    }
    
    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        
        // 在警告阶段（区间结束前 warningTime 分钟）提前清理，支持 <15 分钟的“有效时长”
        let store = ManagedSettingsStore()
        store.clearAllSettings()
        notifyEnd()
    }

    private func notifyEnd() {
        // 本地发送一个应用内广播，供主 App 的 EventEmitter 转发为 JS 事件
        NotificationCenter.default.post(name: NSNotification.Name("FocusOne.StopProgress"), object: nil, userInfo: nil)
        // 可选：直接发一条系统本地通知（需要扩展 Notification 权限）
        let content = UNMutableNotificationContent()
        content.title = "专注结束"
        content.body = "屏蔽已自动结束，做得很好！"
        let request = UNNotificationRequest(identifier: "FocusEnd", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        // 清理共享状态
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            defaults.removeObject(forKey: "FocusOne.FocusStartAt")
            defaults.removeObject(forKey: "FocusOne.FocusEndAt")
            defaults.removeObject(forKey: "FocusOne.TotalMinutes")
        }
    }
    
    override func eventWillReachThresholdWarning(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventWillReachThresholdWarning(event, activity: activity)
        
        // Handle the warning before the event reaches its threshold.
    }
}
