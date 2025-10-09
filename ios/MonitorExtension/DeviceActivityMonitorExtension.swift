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
import Foundation

// Optionally override any of the functions below.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    
    /// 当 DeviceActivity 监控区间开始时触发
    /// 主要处理：
    /// 1. 周期性计划任务：根据当前时间匹配计划配置，应用屏蔽设置
    /// 2. 暂停恢复任务：不处理（在 intervalWillEndWarning 处理）
    /// 3. 一次性任务：只发送开始通知
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        // 1. 暂停恢复活动：不处理
        if activity.rawValue == "FocusOne.PauseResume" {
            print("【Extension】暂停恢复活动开始，无需处理")
            return
        }
        
        // 2. 一次性任务：只发送通知，不做其他处理
        if activity.rawValue == "FocusOne.ScreenTime" {
            print("【Extension】一次性任务开始，发送通知")
            notifyStart()
            return
        }
        
        // 3. 周期任务：获取当前计划并应用屏蔽
        createRecordAndShield(defaults: defaults)
    }
    
    /// 当 DeviceActivity 监控区间结束时触发
    /// 主要处理：
    /// 1. 自动清理所有屏蔽设置（ManagedSettings）
    /// 2. 发送结束通知和事件记录
    /// 3. 清理共享状态数据
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        
        // 检查是否是暂停恢复活动，如果是则跳过处理
        if activity.rawValue == "FocusOne.PauseResume" {
            print("【Extension】暂停恢复活动结束，跳过处理")
            return
        }
        
        // 到点自动清理屏蔽
        let store = ManagedSettingsStore()
        store.clearAllSettings()
        
        // 完成专注记录
        completeRecord()
        
        notifyEnd()
    }
    
    /// 当监控事件达到阈值时触发
    /// 当前实现：预留接口，未实现具体逻辑
    /// 可用于：应用使用时间达到限制阈值时的处理
    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        
        // Handle the event reaching its threshold.
    }
    
    /// 在监控区间开始前的警告阶段触发
    /// 当前实现：预留接口，未实现具体逻辑
    /// 可用于：提前通知用户即将开始屏蔽，或准备相关资源
    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
        
        // Handle the warning before the interval starts.
    }
    
    /// 在监控区间结束前的警告阶段触发
    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        // 区分暂停恢复 vs 正常任务
        if activity.rawValue == "FocusOne.PauseResume" {
            // 检查是否仍在暂停中（防止手动恢复后重复触发）
            let isPauseActivity = defaults.bool(forKey: "FocusOne.IsPauseActivity")
            
            if isPauseActivity {
                // 优先使用当前任务的屏蔽设置，如果没有则使用历史选择数据
                var selection: FamilyActivitySelection? = nil
                
                // 首先尝试读取当前任务的屏蔽设置
                if let data = defaults.data(forKey: "FocusOne.CurrentShieldSelection"),
                   let currentSelection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
                    selection = currentSelection
                    print("【Extension恢复】使用当前任务的屏蔽设置")
                } else if let data = defaults.data(forKey: "FocusOne.AppSelection"),
                          let appSelection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
                    selection = appSelection
                    print("【Extension恢复】使用历史应用选择数据")
                }
                
                if let selection = selection {
                    let store = ManagedSettingsStore()
                    store.shield.applications = selection.applicationTokens
                    store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
                    store.shield.webDomains = selection.webDomainTokens
                    
                    notifyResume()
                    
                    print("【Extension恢复成功】屏蔽已恢复")
                } else {
                    print("【Extension恢复失败】无法获取屏蔽设置数据")
                }
            } else {
                print("【Extension】已手动恢复，跳过自动恢复")
            }
            
        } else {
            // ===== 正常任务结束逻辑 =====
            // 在警告阶段（区间结束前 warningTime 分钟）提前清理，支持 <15 分钟的"有效时长"
            let store = ManagedSettingsStore()
            store.clearAllSettings()
            
            // 完成专注记录
            completeRecord()
            
            notifyEnd()
        }
    }

    /// 在监控事件达到阈值前的警告阶段触发
    /// 当前实现：预留接口，未实现具体逻辑
    /// 可用于：在应用使用时间即将达到限制前提前警告用户
    override func eventWillReachThresholdWarning(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventWillReachThresholdWarning(event, activity: activity)
        
        // Handle the warning before the event reaches its threshold.
    }

    /// 私有方法：处理屏蔽结束的统一逻辑
    private func notifyEnd() {
        // 发送 Darwin 跨进程通知，供主 App 转发为 JS 事件（仅当前台时转发）
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        let name = CFNotificationName("com.focusone.focus.ended" as CFString)
        CFNotificationCenterPostNotification(center, name, nil, nil, true)
        // 可选：直接发一条系统本地通知（需要扩展 Notification 权限）
        let content = UNMutableNotificationContent()
        content.title = "专注结束"
        content.body = "屏蔽已自动结束，做得很好！"
        let request = UNNotificationRequest(identifier: "FocusEnd", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        // 清理共享状态
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            defaults.set("ended", forKey: "FocusOne.LastFocusEvent")
            defaults.removeObject(forKey: "FocusOne.FocusStartAt")
            defaults.removeObject(forKey: "FocusOne.FocusEndAt")
            defaults.removeObject(forKey: "FocusOne.TotalMinutes")
            defaults.removeObject(forKey: "FocusOne.CurrentPlanId")
            defaults.removeObject(forKey: "FocusOne.CurrentShieldSelection")
        }
    }

    /// 私有方法：处理屏蔽恢复的统一逻辑
    private func notifyResume() {
        // 发送 Darwin 跨进程通知，供主 App 转发为 JS 事件（仅当前台时转发）
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        let name = CFNotificationName("com.focusone.focus.resumed" as CFString)
        CFNotificationCenterPostNotification(center, name, nil, nil, true)
        // 可选：直接发一条系统本地通知（需要扩展 Notification 权限）
        let content = UNMutableNotificationContent()
        content.title = "专注恢复"
        content.body = "屏蔽已自动恢复，继续加油！"
        let request = UNNotificationRequest(identifier: "FocusResume", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        // 清理共享状态
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            defaults.set("resumed", forKey: "FocusOne.LastFocusEvent")
            defaults.removeObject(forKey: "FocusOne.IsPauseActivity")
            defaults.removeObject(forKey: "FocusOne.PausedUntil")
        }
        
        // 停止暂停恢复监控，防止重复触发
        let deviceActivityCenter = DeviceActivityCenter()
        let pauseResumeActivity = DeviceActivityName("FocusOne.PauseResume")
        deviceActivityCenter.stopMonitoring([pauseResumeActivity])
        print("【Extension恢复】已停止暂停恢复监控")
    }
    
    /// 发送任务开始的 Darwin 通知
    private func notifyStart() {
        let dCenter = CFNotificationCenterGetDarwinNotifyCenter()
        let dName = CFNotificationName("com.focusone.focus.started" as CFString)
        CFNotificationCenterPostNotification(dCenter, dName, nil, nil, true)

        // 发送开始通知（周期计划）
        let content = UNMutableNotificationContent()
        content.title = "专注一点"
        content.body = "屏蔽已开启，保持专注"
        let request = UNNotificationRequest(identifier: "FocusStartPeriodic", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    /// 仅在周期性任务开始时调用，向服务器记录专注开始
    private func createRecordAndShield(defaults: UserDefaults) {
        fetchCurrentPlan { planData in
            if let planData = planData {
                // 从计划数据中提取时间信息
                let startMin = planData["start_min"] as? Int ?? 0
                let endMin = planData["end_min"] as? Int ?? 0
                let startSec = planData["start_sec"] as? Int ?? 0
                let endSec = planData["end_sec"] as? Int ?? 0
                
                // 计算时间戳
                let now = Date()
                let calendar = Calendar.current
                let today = calendar.startOfDay(for: now)
                
                let startTime = today.addingTimeInterval(TimeInterval(startMin * 60 + startSec))
                let endTime = today.addingTimeInterval(TimeInterval(endMin * 60 + endSec))
                
                // 处理跨午夜情况
                let finalEndTime = endTime > startTime ? endTime : calendar.date(byAdding: .day, value: 1, to: endTime) ?? endTime
                
                // 设置时间信息
                defaults.set(startTime.timeIntervalSince1970, forKey: "FocusOne.FocusStartAt")
                defaults.set(finalEndTime.timeIntervalSince1970, forKey: "FocusOne.FocusEndAt")
                let totalMin = max(1, Int((finalEndTime.timeIntervalSince1970 - startTime.timeIntervalSince1970) / 60))
                defaults.set(totalMin, forKey: "FocusOne.TotalMinutes")
                defaults.set("periodic", forKey: "FocusOne.FocusType")

                // 应用屏蔽设置
                let apps = planData["apps"] as? [String] ?? []
                if let selection = self.buildShieldSelectionFromPlanApps(apps) {
                    // 保存屏蔽设置到本地，供暂停恢复使用
                    if let data = try? JSONEncoder().encode(selection) {
                        defaults.set(data, forKey: "FocusOne.CurrentShieldSelection")
                    }
                    
                    // 应用屏蔽设置
                    let store = ManagedSettingsStore()
                    store.shield.applications = selection.applicationTokens
                    store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
                    store.shield.webDomains = selection.webDomainTokens
                    
                    print("【屏蔽设置】已应用基于计划的屏蔽设置")
                } else {
                    print("【屏蔽设置】无法构建屏蔽设置")
                }

                // 创建专注记录
                self.createRecordWithPlan(planData)
                
                // 发送 Darwin 跨进程"开始"事件
                self.notifyStart()
            } else {
                print("【Extension】未获取到当前计划")
            }
        }
    }
    
    /// 获取当前正在进行的计划
    private func fetchCurrentPlan(completion: @escaping ([String: Any]?) -> Void) {
        NetworkManager.shared.get(path: "/plan/current") { result in
            switch result {
            case .success(let response):
                if let json = response.json(),
                   let data = json["data"] as? [String: Any] {
                    // 检查任务状态，只有 active 才创建 record
                    let status = data["status"] as? String ?? ""
                    if status != "active" {
                        print("【任务状态检查】任务状态为 \(status)，跳过创建 record")
                        completion(nil)
                        return
                    }
                    print("【网络请求成功】获取当前计划: \(data)")
                    completion(data)
                } else {
                    print("【网络请求】当前无正在进行的计划")
                    completion(nil)
                }
            case .failure(let error):
                print("【网络请求失败】获取当前计划失败: \(error.localizedDescription)")
                completion(nil)
            }
        }
    }
    
    /// 根据计划中的应用列表构建屏蔽设置（使用共享方法）
    /// - Returns: 构建好的 FamilyActivitySelection，如果失败返回 nil
    private func buildShieldSelectionFromPlanApps(_ apps: [String]) -> FamilyActivitySelection? {
        return Helper.buildSelectionFromApps(apps)
    }
    
    /// 使用计划数据创建专注记录
    private func createRecordWithPlan(_ planData: [String: Any]) {
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else {
            print("【网络请求错误】无法获取 UserDefaults")
            return
        }
        
        // 获取当前时间的分钟数（作为备用值）
        let now = Date()
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        let currentMinute = hour * 60 + minute
        
        // 获取总时长（分钟）
        let totalMinutes = defaults.integer(forKey: "FocusOne.TotalMinutes")
        
        // 从计划数据中提取字段，优先使用接口返回的值
        let planId = planData["id"] as? String ?? "period_plan_id"
        let startMin = planData["start_min"] as? Int ?? currentMinute
        let apps = planData["apps"] as? [String] ?? []
        let mode = planData["mode"] as? String ?? "shield"
        let title = planData["name"] as? String ?? ""
        
        // 构造请求参数
        let requestBody: [String: Any] = [
            "plan_id": planId,
            "start_min": startMin,
            "total_min": totalMinutes,
            "title": title,
            "apps": apps,
            "mode": mode,
            // "base_amount": 0,
            // "bet_amount": 0
        ]
        
        print("【网络请求】创建专注记录: \(requestBody)")
        
        // 发送网络请求
        NetworkManager.shared.post(path: "/record/add", body: requestBody) { result in
            switch result {
            case .success(let response):
                if let json = response.json(),
                   let data = json["data"] as? [String: Any],
                   let recordId = data["id"] as? String {
                    // 保存记录ID，用于后续完成调用
                    defaults.set(recordId, forKey: "record_id")
                    print("【网络请求成功】专注记录已创建，ID: \(recordId)")
                } else {
                    print("【网络请求警告】创建记录成功，但无法解析记录ID")
                }
            case .failure(let error):
                print("【网络请求失败】创建专注记录失败: \(error.localizedDescription)")
                // 使用临时 ID，防止后续更新失败
                let tempId = "pending_\(Int(Date().timeIntervalSince1970))"
                defaults.set(tempId, forKey: "record_id")
                defaults.set("create_failed", forKey: "FocusOne.LastNetworkError")
                print("【使用临时ID】\(tempId)")
            }
        }
    }
    
    /// 完成专注记录
    /// 在专注结束时调用，向服务器标记专注完成
    private func completeRecord() {
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else {
            print("【网络请求错误】无法获取 UserDefaults")
            return
        }
        
        // 检查任务是否已失败（暂停超时或手动停止）
        let taskFailed = defaults.bool(forKey: "FocusOne.TaskFailed")
        if taskFailed {
            print("【网络请求跳过】任务已失败，不调用 complete")
            // 清理失败标记
            defaults.removeObject(forKey: "FocusOne.TaskFailed")
            defaults.removeObject(forKey: "FocusOne.FailedReason")
            return
        }
        
        // 获取记录ID
        guard let recordId = defaults.string(forKey: "record_id"), !recordId.isEmpty else {
            print("【网络请求错误】无法获取记录ID，跳过完成请求")
            return
        }
        
        // 防重复调用：检查是否已经完成
        let completedKey = "FocusOne.RecordCompleted_\(recordId)"
        if defaults.bool(forKey: completedKey) {
            print("【网络请求跳过】记录 \(recordId) 已经完成过")
            return
        }
        
        print("【网络请求】完成专注记录: \(recordId)")
        
        // 发送网络请求
        NetworkManager.shared.post(path: "/record/complete/\(recordId)") { result in
            switch result {
            case .success(_):
                print("【网络请求成功】专注记录已完成: \(recordId)")
                // 标记为已完成，防止重复调用
                defaults.set(true, forKey: completedKey)
                // 清理记录ID
                defaults.removeObject(forKey: "record_id")
            case .failure(let error):
                print("【网络请求失败】完成专注记录失败: \(error.localizedDescription)")
                // 记录失败信息
                defaults.set("complete_failed_\(recordId)", forKey: "FocusOne.LastNetworkError")
                // 完成失败也清理 record_id，避免影响下次任务
                defaults.removeObject(forKey: "record_id")
                print("【清理record_id】完成失败，已清理")
            }
        }
    }

    /// 匹配当前时间对应的周期计划（暂时不用）
    private func matchCurrentPeriodicPlan() -> (start: TimeInterval, end: TimeInterval)? {
        guard let defaults = UserDefaults(suiteName: "group.com.focusone"),
              let cfgStr = defaults.string(forKey: "FocusOne.PlannedConfigs"),
              let cfgData = cfgStr.data(using: .utf8) else {
            return nil
        }
        
        struct PlanCfg: Codable {
            let start: Int
            let end: Int
            let repeatDays: [Int]?
        }
        
        guard let cfgs = try? JSONDecoder().decode([PlanCfg].self, from: cfgData) else {
            return nil
        }
        
        let now = Date()
        let cal = Calendar.current
        let comp = cal.dateComponents([.weekday, .hour, .minute], from: now)
        let weekdayApple = comp.weekday ?? 1 // 1=周日
        
        // 将 Apple weekday 转换为我们 1=周一..7=周日
        let mondayFirst = (weekdayApple == 1) ? 7 : (weekdayApple - 1)
        
        // 辅助函数：秒 → (小时, 分钟)
        func hm(_ sec: Int) -> (Int, Int) {
            let m = max(0, sec / 60)
            return (m / 60, m % 60)
        }
        
        // 遍历所有计划，查找匹配的
        for c in cfgs {
            let days = (c.repeatDays?.isEmpty == false) ? c.repeatDays! : [1,2,3,4,5,6,7]
            if !days.contains(mondayFirst) { continue }
            
            let (sh, sm) = hm(c.start)
            let (eh, em) = hm(c.end)
            let startHM = sh * 60 + sm
            let endHM = eh * 60 + em
            
            guard let sDate = cal.date(bySettingHour: sh, minute: sm, second: 0, of: now) else { continue }
            guard var eDate = cal.date(bySettingHour: eh, minute: em, second: 0, of: now) else { continue }
            
            // 跨午夜：结束时间在开始时间之前/相等，则结束时间为次日同刻
            if endHM <= startHM {
                if let nextDay = cal.date(byAdding: .day, value: 1, to: eDate) {
                    eDate = nextDay
                }
            }
            
            // 仅当当前时间位于该区间内才命中该计划
            if now >= sDate && now < eDate {
                return (start: sDate.timeIntervalSince1970, end: eDate.timeIntervalSince1970)
            }
        }
        
        return nil
    }
}
