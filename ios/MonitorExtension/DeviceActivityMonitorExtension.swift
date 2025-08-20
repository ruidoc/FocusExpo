//
//  DeviceActivityMonitorExtension.swift
//  MonitorExtension
//
//  Created by 杨瑞 on 2025/6/5.
//

import DeviceActivity
import ManagedSettings
import UserNotifications
import FamilyControls

// Optionally override any of the functions below.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        // 区间开始：周期计划或暂停恢复调度，均应处理
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        let now = Date()
        var startAtTs = now.timeIntervalSince1970
        var endAtTs = now.addingTimeInterval(60 * 60).timeIntervalSince1970 // 兜底1小时
        var hasPlannedMatch = false
        var isPauseResume = false
        if activity.rawValue == "FocusOne.PauseResume" {
            isPauseResume = true
        }
        if let cfgStr = defaults.string(forKey: "FocusOne.PlannedConfigs"),
           let cfgData = cfgStr.data(using: .utf8) {
            struct PlanCfg: Codable { let start: Int; let end: Int; let repeatDays: [Int]? }
            if let cfgs = try? JSONDecoder().decode([PlanCfg].self, from: cfgData) {
                let cal = Calendar.current
                let comp = cal.dateComponents([.weekday, .hour, .minute], from: now)
                let weekdayApple = comp.weekday ?? 1 // 1=周日
                // 将 Apple weekday 转换为我们 1=周一..7=周日
                let mondayFirst = (weekdayApple == 1) ? 7 : (weekdayApple - 1)
                func hm(_ sec: Int) -> (Int, Int) { let m = max(0, sec/60); return (m/60, m%60) }
                for c in cfgs {
                    let days = (c.repeatDays?.isEmpty == false) ? c.repeatDays! : [1,2,3,4,5,6,7]
                    if !days.contains(mondayFirst) { continue }
                    let (sh, sm) = hm(c.start); let (eh, em) = hm(c.end)
                    let endHM = eh*60 + em
                    let startHM = sh*60 + sm
                    var eH = eh, eM = em
                    if endHM <= startHM { eH = 23; eM = 59 }
                    if let sDate = cal.date(bySettingHour: sh, minute: sm, second: 0, of: now) {
                        startAtTs = sDate.timeIntervalSince1970
                    }
                    if let endDate = cal.date(bySettingHour: eH, minute: eM, second: 0, of: now) {
                        endAtTs = endDate.timeIntervalSince1970
                        hasPlannedMatch = true
                        break
                    }
                }
            }
        }
        // 暂停恢复：直接按当前一次性/周期状态恢复屏蔽
        if isPauseResume {
            // 恢复屏蔽：清除暂停标记
            defaults.set(0, forKey: "FocusOne.PausedUntil")
            defaults.set("resumed", forKey: "FocusOne.LastFocusEvent")
            // 若任务仍有效则恢复屏蔽
            let now2 = Date().timeIntervalSince1970
            let endAt = defaults.double(forKey: "FocusOne.FocusEndAt")
            if endAt > now2 {
                var selection: FamilyActivitySelection? = nil
                if let data = defaults.data(forKey: "FocusOne.AppSelection"),
                   let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
                    selection = sel
                }
                let store = ManagedSettingsStore()
                if let sel = selection {
                    store.shield.applications = sel.applicationTokens
                    store.shield.applicationCategories = sel.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(sel.categoryTokens)
                    store.shield.webDomains = sel.webDomainTokens
                }
            }
            return
        }
        // 若不存在周期性计划匹配（一次性任务场景），不覆盖由快速开始设定的时间
        guard hasPlannedMatch else { return }
        // 加载选择的应用并应用屏蔽
        var selection: FamilyActivitySelection? = nil
        if let data = defaults.data(forKey: "FocusOne.AppSelection"),
           let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
            selection = sel
        }
        let store = ManagedSettingsStore()
        if let sel = selection {
            store.shield.applications = sel.applicationTokens
            store.shield.applicationCategories = sel.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(sel.categoryTokens)
            store.shield.webDomains = sel.webDomainTokens
        }
        // 使用计划中的开始/结束时间
        defaults.set(startAtTs, forKey: "FocusOne.FocusStartAt")
        defaults.set(endAtTs, forKey: "FocusOne.FocusEndAt")
        let totalMin = max(1, Int((endAtTs - startAtTs) / 60))
        defaults.set(totalMin, forKey: "FocusOne.TotalMinutes")
        defaults.set("periodic", forKey: "FocusOne.FocusType")
        // 发送开始通知（周期计划）
        let content = UNMutableNotificationContent()
        content.title = "专注一点"
        content.body = "屏蔽已开启，保持专注"
        let request = UNNotificationRequest(identifier: "FocusStartPeriodic", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        // 记录统一事件，供主 App 拉起后转发
        defaults.set("started", forKey: "FocusOne.LastFocusEvent")
    }
    
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        
        // 到点自动清理屏蔽
        let store = ManagedSettingsStore()
        store.clearAllSettings()
        notifyEnd()
        // 记录统一事件，供主 App 拉起后转发
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            defaults.set("ended", forKey: "FocusOne.LastFocusEvent")
        }
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
