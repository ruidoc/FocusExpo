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
    /// 2. 暂停恢复任务：恢复之前暂停的屏蔽设置
    /// 3. 更新共享状态：写入开始时间、结束时间、总时长等信息
    /// 4. 发送开始通知和事件记录
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        // 区间开始：周期计划或暂停恢复调度，均应处理
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        let now = Date()
        var startAtTs = now.timeIntervalSince1970
        var endAtTs = now.addingTimeInterval(60 * 60).timeIntervalSince1970 // 兜底1小时
        var hasPlannedMatch = false
        // 已弃用“自动恢复活动”，不再处理 FocusOne.PauseResume
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
                        startAtTs = sDate.timeIntervalSince1970
                        endAtTs = eDate.timeIntervalSince1970
                        hasPlannedMatch = true
                        break
                    }
                }
            }
        }
        // 已移除“自动恢复”活动逻辑
        // 若不存在周期性计划匹配（一次性任务场景），不覆盖一次性任务在主 App 设定的时间
        if hasPlannedMatch {
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
            
            // 创建专注记录（仅周期性任务）
            createRecord()
        }
        // 统一发送 Darwin 跨进程“开始”事件（一次性与周期均会调用到此处）
        let dCenter = CFNotificationCenterGetDarwinNotifyCenter()
        let dName = CFNotificationName("com.focusone.focus.started" as CFString)
        CFNotificationCenterPostNotification(dCenter, dName, nil, nil, true)
    }
    
    /// 当 DeviceActivity 监控区间结束时触发
    /// 主要处理：
    /// 1. 自动清理所有屏蔽设置（ManagedSettings）
    /// 2. 发送结束通知和事件记录
    /// 3. 清理共享状态数据
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        
        // 到点自动清理屏蔽
        let store = ManagedSettingsStore()
        store.clearAllSettings()
        
        // 完成专注记录
        completeRecord()
        
        notifyEnd()
        // 记录统一事件，供主 App 拉起后转发
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            defaults.set("ended", forKey: "FocusOne.LastFocusEvent")
        }
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
    /// 主要处理：
    /// 1. 提前清理屏蔽设置，支持小于15分钟的"有效时长"场景
    /// 2. 通过 warningTime 参数控制提前清理的时机
    /// 3. 发送结束通知和清理状态
    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        
        // 在警告阶段（区间结束前 warningTime 分钟）提前清理，支持 <15 分钟的"有效时长"
        let store = ManagedSettingsStore()
        store.clearAllSettings()
        
        // 完成专注记录
        completeRecord()
        
        notifyEnd()
    }

    /// 私有方法：处理屏蔽结束的统一逻辑
    /// 主要功能：
    /// 1. 发送应用内广播通知，供主 App 的 EventEmitter 转发为 JS 事件
    /// 2. 发送系统本地通知，告知用户专注结束
    /// 3. 清理共享状态数据（开始时间、结束时间、总时长等）
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
            defaults.removeObject(forKey: "FocusOne.FocusStartAt")
            defaults.removeObject(forKey: "FocusOne.FocusEndAt")
            defaults.removeObject(forKey: "FocusOne.TotalMinutes")
            defaults.removeObject(forKey: "FocusOne.CurrentPlanId")
        }
    }
    
    /// 在监控事件达到阈值前的警告阶段触发
    /// 当前实现：预留接口，未实现具体逻辑
    /// 可用于：在应用使用时间即将达到限制前提前警告用户
    override func eventWillReachThresholdWarning(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventWillReachThresholdWarning(event, activity: activity)
        
        // Handle the warning before the event reaches its threshold.
    }
    
    // MARK: - 网络请求方法
    
    /// 创建专注记录
    /// 仅在周期性任务开始时调用，向服务器记录专注开始
    private func createRecord() {
        fetchCurrentPlan { planData in
            if let planData = planData {
                self.createRecordWithPlan(planData)
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
}
