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

// 计划配置结构 (需与 NativeModule 保持一致)
struct PlanConfig: Codable {
    let id: String
    let name: String?
    let start: Int // 分钟数
    let end: Int   // 分钟数
    let days: [Int]
    let apps: [String] // 应用 ID 数组，格式为 ["stableId:type", ...]
    let token: String // FamilyActivitySelection 的 JSON/Base64 字符串
}

// Optionally override any of the functions below.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    
    private let kPlansMap = "FocusOne.PlansMap"
    
    /// 当 DeviceActivity 监控区间开始时触发
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        // 1. 暂停恢复活动：不处理
        if activity.rawValue == "FocusOne.PauseResume" {
            logToJS(level: "log", message: "暂停恢复活动开始，无需处理")
            return
        }
        
        // 2. 一次性任务：检查跨日、配额，发送通知
        if activity.rawValue == "FocusOne.ScreenTime" {
            logToJS(level: "log", message: "一次性任务开始，发送通知")
            checkAndHandleDayChange(defaults: defaults)
            
            // 获取计划时长（一次性任务的时长存在 TotalMinutes 中）
            let totalMin = defaults.integer(forKey: "FocusOne.TotalMinutes")
            if totalMin > 0 {
                _ = checkFreeUserQuota(totalMinutes: totalMin, defaults: defaults)
            }
            
            notifyStart()
            return
        }
        
        // 3. 周期任务：本地查找计划并应用屏蔽
        startPlanSession(for: activity, defaults: defaults)
    }
    
    /// 当 DeviceActivity 监控区间结束时触发
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        if defaults.bool(forKey: "FocusOne.TaskFailed") { return }
        
        // 检查是否是暂停恢复活动，如果是则跳过处理
        if activity.rawValue == "FocusOne.PauseResume" { return }
        
        // 到点自动清理屏蔽
        let store = ManagedSettingsStore()
        store.clearAllSettings()
        
        // 完成专注记录
        completeRecord()
        
        notifyEnd()
    }
    
    /// 在监控区间结束前的警告阶段触发
    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        if defaults.bool(forKey: "FocusOne.TaskFailed") { return }

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
                    logToJS(level: "log", message: "恢复：使用当前任务的屏蔽设置")
                } else if let data = defaults.data(forKey: "FocusOne.AppSelection"),
                          let appSelection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
                    selection = appSelection
                    logToJS(level: "log", message: "恢复：使用历史应用选择数据")
                }
                
                if let selection = selection {
                    let store = ManagedSettingsStore()
                    store.shield.applications = selection.applicationTokens
                    store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
                    store.shield.webDomains = selection.webDomainTokens
                    
                    notifyResume()
                    
                    logToJS(level: "log", message: "恢复成功：屏蔽已恢复")
                } else {
                    logToJS(level: "error", message: "恢复失败：无法获取屏蔽设置数据")
                }
            } else {
                logToJS(level: "log", message: "已手动恢复，跳过自动恢复")
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

    // MARK: - Core Logic
    
    private func startPlanSession(for activity: DeviceActivityName, defaults: UserDefaults) {
        // 0. 检查跨日，同步权益
        checkAndHandleDayChange(defaults: defaults)
        
        // 1. 从 activity name 解析 planId
        // Name format: FocusOne.Plan.{planId}_D{d} or FocusOne.Plan.{planId}_P1_D{d}
        let raw = activity.rawValue
        guard raw.starts(with: "FocusOne.Plan.") else { return }
        
        // 简单解析：去除前缀，然后截取到第一个 _ 之前（如果 planId 本身包含 _ 可能会有问题，但通常是 UUID 或 MongoId）
        // 更稳妥的方式：我们知道后缀格式是固定的 _D\d+ 或 _P\d+_D\d+
        // 假设 planId 不包含 "_D" 这种子串
        
        // 使用 findPlan 方法查找对应的计划配置
        guard let plan = findPlan(by: raw, defaults: defaults) else {
            logToJS(level: "error", message: "未找到对应的计划配置", data: ["activityName": raw])
            return
        }
        
        logToJS(level: "log", message: "找到计划: \(plan.id), 开始执行 shielding", data: ["planId": plan.id, "planName": plan.name ?? ""])
        
        // 2. 解析 Selection Token 并应用屏蔽
        if let data = Data(base64Encoded: plan.token),
           let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
            
            // 保存屏蔽设置到本地，供暂停恢复使用
            if let selectionData = try? JSONEncoder().encode(selection) {
                defaults.set(selectionData, forKey: "FocusOne.CurrentShieldSelection")
            }
            
            let store = ManagedSettingsStore()
            store.shield.applications = selection.applicationTokens
            store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
            store.shield.webDomains = selection.webDomainTokens
            
            logToJS(level: "log", message: "屏蔽已应用", data: ["planId": plan.id])
        } else {
            logToJS(level: "error", message: "无法解析 selection token", data: ["planId": plan.id])
        }
        
        // 3. 记录时间和状态
        let now = Date()
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: now)
        
        // 计算实际的 Start/End 时间
        // 注意：这里的 plan.start/end 是分钟数。我们需要根据当前日期构建 Date。
        // 如果是跨日拆分的 P2，start 应该是 0。但 plan.start 存的是原始开始时间。
        // 为了简单，我们记录的 FocusStartAt/EndAt 主要是为了 UI 显示倒计时。
        // 对于拆分的情况，Monitor 实际上是分段运行的。
        // 既然 Monitor 已经启动，说明我们处于某一段中。
        // 简单起见，我们计算这一段的结束时间。
        
        // 重新计算当前段的结束时间
        var sessionEndTime: Date
        
        var planEndTime = today.addingTimeInterval(TimeInterval(plan.end * 60))
        if plan.end <= plan.start {
            planEndTime = planEndTime.addingTimeInterval(24 * 3600)
        }
        
        // 判断当前是 P1 还是 P2
        if raw.contains("_P1_") {
            // P1: start -> 23:59
            if let endOfDay = calendar.date(bySettingHour: 23, minute: 59, second: 59, of: now) {
                sessionEndTime = endOfDay
            } else {
                sessionEndTime = planEndTime // Fallback
            }
        } else if raw.contains("_P2_") {
            // P2: 00:00 -> end
            sessionEndTime = planEndTime // end is on "today" (which is actually the next day of P1)
        } else {
            // Normal
            sessionEndTime = planEndTime
        }
        
        defaults.set(now.timeIntervalSince1970, forKey: "FocusOne.FocusStartAt")
        defaults.set(sessionEndTime.timeIntervalSince1970, forKey: "FocusOne.FocusEndAt")
        
        let totalMin = max(1, Int(ceil((sessionEndTime.timeIntervalSince1970 - now.timeIntervalSince1970) / 60)))
        defaults.set(totalMin, forKey: "FocusOne.TotalMinutes")
        defaults.set("periodic", forKey: "FocusOne.FocusType")
        defaults.set(plan.id, forKey: "FocusOne.CurrentPlanId")
        
        // 4. 检查配额（仅用于发送通知提醒，不阻止已调度的任务）
        _ = checkFreeUserQuota(totalMinutes: totalMin, defaults: defaults)
        
        // 5. 发送通知
        notifyStart()
        
        // 6. 创建后端记录 (异步，不阻塞屏蔽)
        createRecord(for: plan, totalMinutes: totalMin, defaults: defaults)
    }
    
    private func findPlan(by activityName: String, defaults: UserDefaults) -> PlanConfig? {
        guard let data = defaults.data(forKey: kPlansMap),
              let plans = try? JSONDecoder().decode([String: PlanConfig].self, from: data) else {
            return nil
        }
        
        // 尝试匹配 planId
        // 格式: FocusOne.Plan.{ID}_...
        let prefix = "FocusOne.Plan."
        guard activityName.starts(with: prefix) else { return nil }
        let rest = String(activityName.dropFirst(prefix.count))
        
        // 遍历所有 key，看 rest 是否以 key 开头
        // 这是一个比较笨但有效的方法，因为我们不知道 ID 的长度
        // 但 ID 通常不会包含 _D, _P 这种后缀
        // 或者我们可以尝试从 plans map 中查找 key
        
        for (id, config) in plans {
            // 构造可能的 activityName 前缀
            // 如果 ID 确定的，那 activityName 必须包含 ID
            if rest.hasPrefix(id) {
                return config
            }
        }
        
        return nil
    }

    private func createRecord(for plan: PlanConfig, totalMinutes: Int, defaults: UserDefaults) {
        let requestBody: [String: Any] = [
            "plan_id": plan.id,
            "start_min": plan.start,
            "total_min": totalMinutes, // 总时长
            "title": plan.name ?? "专注计划",
            "apps": plan.apps, // apps 数组
            "mode": "shield"
        ]
        
        logToJS(level: "log", message: "创建后端记录", data: ["planId": plan.id, "totalMinutes": totalMinutes])
        
        NetworkManager.shared.post(path: "/record/add", body: requestBody) { result in
            switch result {
            case .success(let response):
                if let json = response.json(),
                   let data = json["data"] as? [String: Any],
                   let recordId = data["id"] as? String {
                    defaults.set(recordId, forKey: "record_id")
                    self.logToJS(level: "log", message: "记录创建成功", data: ["recordId": recordId, "planId": plan.id])
                } else {
                    self.logToJS(level: "warn", message: "记录创建成功但无法解析 recordId", data: ["planId": plan.id])
                }
            case .failure(let error):
                let tempId = "pending_\(Int(Date().timeIntervalSince1970))"
                defaults.set(tempId, forKey: "record_id")
                self.logToJS(level: "error", message: "记录创建失败", data: ["error": "\(error)", "planId": plan.id, "tempId": tempId])
            }
        }
    }

    // MARK: - Helpers
    
    /// 将日志发送到 JS 侧（用于调试）
    /// - Parameters:
    ///   - level: 日志级别 (log, warn, error)
    ///   - message: 日志消息
    ///   - data: 可选的额外数据（会被序列化为 JSON）
    private func logToJS(level: String = "log", message: String, data: [String: Any]? = nil) {
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        // 构建单条日志对象（不保存历史，只保存最新一条）
        var logEntry: [String: Any] = [
            "level": level,
            "message": message,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        if let data = data {
            logEntry["data"] = data
        }
        
        // 保存单条日志（覆盖，不累积）
        // NativeModule 会读取后立即删除，实现实时传递
        if let logData = try? JSONSerialization.data(withJSONObject: [logEntry]) {
            defaults.set(logData, forKey: "FocusOne.ExtensionLogs")
            
            // 发送 Darwin 通知告知主 App 有新日志
            let center = CFNotificationCenterGetDarwinNotifyCenter()
            let name = CFNotificationName("com.focusone.extension.log" as CFString)
            CFNotificationCenterPostNotification(center, name, nil, nil, true)
        }
    }
    
    private func notifyEnd() {
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        let name = CFNotificationName("com.focusone.focus.ended" as CFString)
        CFNotificationCenterPostNotification(center, name, nil, nil, true)
        
        let content = UNMutableNotificationContent()
        content.title = "专注结束"
        content.body = "屏蔽已自动结束，做得很好！"
        let request = UNNotificationRequest(identifier: "FocusEnd", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            defaults.set("ended", forKey: "FocusOne.LastFocusEvent")
            defaults.removeObject(forKey: "FocusOne.FocusStartAt")
            defaults.removeObject(forKey: "FocusOne.FocusEndAt")
            defaults.removeObject(forKey: "FocusOne.TotalMinutes")
            defaults.removeObject(forKey: "FocusOne.CurrentPlanId")
            defaults.removeObject(forKey: "FocusOne.CurrentShieldSelection")
        }
    }

    private func notifyResume() {
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        let name = CFNotificationName("com.focusone.focus.resumed" as CFString)
        CFNotificationCenterPostNotification(center, name, nil, nil, true)
        
        let content = UNMutableNotificationContent()
        content.title = "专注恢复"
        content.body = "屏蔽已自动恢复，继续加油！"
        let request = UNNotificationRequest(identifier: "FocusResume", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            defaults.set("resumed", forKey: "FocusOne.LastFocusEvent")
            defaults.removeObject(forKey: "FocusOne.IsPauseActivity")
            defaults.removeObject(forKey: "FocusOne.PausedUntil")
        }
        
        let deviceActivityCenter = DeviceActivityCenter()
        let pauseResumeActivity = DeviceActivityName("FocusOne.PauseResume")
        deviceActivityCenter.stopMonitoring([pauseResumeActivity])
    }
    
    private func notifyStart() {
        let dCenter = CFNotificationCenterGetDarwinNotifyCenter()
        let dName = CFNotificationName("com.focusone.focus.started" as CFString)
        CFNotificationCenterPostNotification(dCenter, dName, nil, nil, true)

        let content = UNMutableNotificationContent()
        content.title = "专注一点"
        content.body = "屏蔽已开启，保持专注"
        let request = UNNotificationRequest(identifier: "FocusStartPeriodic", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }
    
    private func completeRecord() {
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        let taskFailed = defaults.bool(forKey: "FocusOne.TaskFailed")
        if taskFailed {
            defaults.removeObject(forKey: "FocusOne.TaskFailed")
            defaults.removeObject(forKey: "FocusOne.FailedReason")
            return
        }
        
        guard let recordId = defaults.string(forKey: "record_id"), !recordId.isEmpty else { return }
        
        let completedKey = "FocusOne.RecordCompleted_\(recordId)"
        if defaults.bool(forKey: completedKey) { return }
        
        // 更新今日已使用时长
        let totalMin = defaults.integer(forKey: "FocusOne.TotalMinutes")
        if totalMin > 0 {
            updateTodayUsed(minutes: totalMin, defaults: defaults)
        }
        
        NetworkManager.shared.post(path: "/record/complete/\(recordId)") { result in
            switch result {
            case .success(_):
                defaults.set(true, forKey: completedKey)
                defaults.removeObject(forKey: "record_id")
            case .failure(_):
                defaults.removeObject(forKey: "record_id")
            }
        }
    }
    
    // MARK: - 配额管理
    
    /// 格式化日期为 YYYY-MM-DD
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    /// 检查是否跨日，如果是则重置 today_used 并同步权益
    private func checkAndHandleDayChange(defaults: UserDefaults) {
        let today = formatDate(Date())
        let storedDate = defaults.string(forKey: "today_date") ?? ""
        
        if storedDate != today {
            logToJS(level: "log", message: "检测到跨日", data: ["stored": storedDate, "today": today])
            
            // 重置今日已使用
            defaults.set(0, forKey: "today_used")
            defaults.set(today, forKey: "today_date")
            
            // 异步同步权益（从后端获取最新数据）
            syncBenefitStatus(defaults: defaults)
        }
    }
    
    /// 从后端同步权益状态
    private func syncBenefitStatus(defaults: UserDefaults) {
        NetworkManager.shared.get(path: "/benefit") { result in
            switch result {
            case .success(let response):
                if let json = response.json(),
                   let data = json["data"] as? [String: Any] {
                    
                    // 更新订阅状态
                    if let isSubscribed = data["is_subscribed"] as? Bool {
                        defaults.set(isSubscribed ? "true" : "false", forKey: "is_subscribed")
                    }
                    
                    // 更新权益配额
                    if let dayDuration = data["day_duration"] as? Int {
                        defaults.set(dayDuration, forKey: "day_duration")
                    }
                    
                    // 更新今日已使用（后端返回的是准确值）
                    if let todayUsed = data["today_used"] as? Int {
                        defaults.set(todayUsed, forKey: "today_used")
                    }
                    
                    // 更新 App/分类 数量限制
                    if let appCount = data["app_count"] as? Int {
                        defaults.set(appCount, forKey: "app_count")
                    }
                    if let categoryCount = data["category_count"] as? Int {
                        defaults.set(categoryCount, forKey: "category_count")
                    }
                    
                    self.logToJS(level: "log", message: "权益同步成功", data: data)
                }
            case .failure(let error):
                self.logToJS(level: "error", message: "权益同步失败: \(error.localizedDescription)")
            }
        }
    }
    
    /// 更新今日已使用时长
    private func updateTodayUsed(minutes: Int, defaults: UserDefaults) {
        let currentUsed = defaults.integer(forKey: "today_used")
        let newUsed = currentUsed + minutes
        defaults.set(newUsed, forKey: "today_used")
        logToJS(level: "log", message: "更新今日已使用", data: ["added": minutes, "total": newUsed])
    }
    
    /// 检查免费用户配额（返回是否允许继续）
    private func checkFreeUserQuota(totalMinutes: Int, defaults: UserDefaults) -> Bool {
        // 1. 检查是否为 VIP
        let isSubscribed = defaults.string(forKey: "is_subscribed") == "true"
        if isSubscribed {
            logToJS(level: "log", message: "VIP用户，不限制配额")
            return true
        }
        
        // 2. 免费用户，检查配额
        let dayDuration = defaults.integer(forKey: "day_duration")
        let todayUsed = defaults.integer(forKey: "today_used")
        let remaining = dayDuration - todayUsed
        
        logToJS(level: "log", message: "配额检查", data: [
            "dayDuration": dayDuration,
            "todayUsed": todayUsed,
            "remaining": remaining,
            "planMinutes": totalMinutes
        ])
        
        // 3. 如果剩余配额不足
        if remaining <= 0 {
            notifyQuotaExhausted()
            return false
        }
        
        // 4. 如果剩余配额不足以完成本次计划，发送提醒
        if remaining < totalMinutes {
            notifyQuotaWarning(remaining: remaining)
        } else if remaining <= 15 {
            // 剩余15分钟以内，发送提醒
            notifyQuotaLow(remaining: remaining)
        }
        
        return true
    }
    
    /// 发送配额耗尽通知
    private func notifyQuotaExhausted() {
        let content = UNMutableNotificationContent()
        content.title = "今日配额已用完"
        content.body = "升级 VIP 解锁无限专注时长"
        let request = UNNotificationRequest(identifier: "QuotaExhausted", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }
    
    /// 发送配额不足警告
    private func notifyQuotaWarning(remaining: Int) {
        let content = UNMutableNotificationContent()
        content.title = "配额提醒"
        content.body = "今日还剩 \(remaining) 分钟免费额度"
        let request = UNNotificationRequest(identifier: "QuotaWarning", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }
    
    /// 发送配额即将耗尽提醒
    private func notifyQuotaLow(remaining: Int) {
        let content = UNMutableNotificationContent()
        content.title = "配额即将用完"
        content.body = "今日还剩 \(remaining) 分钟，升级 VIP 无限制"
        let request = UNNotificationRequest(identifier: "QuotaLow", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }
}
