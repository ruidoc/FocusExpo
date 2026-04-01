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
    let mode: String? // shield=黑名单屏蔽, allow=白名单放行
    let start_date: String? // 开始日期 YYYY-MM-DD
    let end_date: String? // 结束日期 YYYY-MM-DD，nil 表示长期有效
}

/// 根据 mode 应用不同的屏蔽策略（与 NativeModule.applyShield 保持一致）
func applyShield(store: ManagedSettingsStore, selection: FamilyActivitySelection, mode: String) {
    if mode == "allow" {
        store.shield.applicationCategories = .all(except: selection.applicationTokens)
        store.shield.webDomainCategories = .all(except: selection.webDomainTokens)
        store.shield.applications = nil
        store.shield.webDomains = nil
    } else {
        store.shield.applications = selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
        store.shield.webDomains = selection.webDomainTokens
    }
}

private func parsePlanDate(_ value: String?) -> Date? {
    guard let value, !value.isEmpty else { return nil }
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    // 接口可能给 ISO8601（含 T），仅取日期段再按本地日历解析，避免解析失败导致跳过 start_date 校验
    let datePart: String
    if let t = trimmed.firstIndex(of: "T") {
        datePart = String(trimmed[..<t])
    } else if trimmed.count >= 10 {
        datePart = String(trimmed.prefix(10))
    } else {
        datePart = trimmed
    }
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone.current
    return formatter.date(from: datePart)
}

// Optionally override any of the functions below.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    
    private let kPlansMap = "FocusOne.PlansMap"
    
    /// 当 DeviceActivity 监控区间开始时触发
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        // 补报上一次 pending 的 actual_min
        flushPendingActualMin(defaults: defaults)
        
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
                let remaining = checkFreeUserQuota(totalMinutes: totalMin, defaults: defaults)
                if remaining <= 0 {
                    let content = UNMutableNotificationContent()
                    content.title = "今日时长已用完"
                    content.body = "已停止本次专注，明天再来吧"
                    enqueueNotification(
                        identifier: "QuotaExceeded_\(Int(Date().timeIntervalSince1970))",
                        content: content
                    )
                    return
                }
            }
            
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
        if consumeQuotaSkipEventIfNeeded(
            activity: activity,
            defaults: defaults,
            clearAfterConsume: true
        ) { return }

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
                    let shieldMode = defaults.string(forKey: "FocusOne.ShieldMode") ?? "shield"
                    let store = ManagedSettingsStore()
                    applyShield(store: store, selection: selection, mode: shieldMode)
                    
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
            if consumeQuotaSkipEventIfNeeded(
                activity: activity,
                defaults: defaults,
                clearAfterConsume: false
            ) { return }
            // 在警告阶段（区间结束前 warningTime 分钟）提前清理，支持 <15 分钟的"有效时长"
            let store = ManagedSettingsStore()
            store.clearAllSettings()
            
            // 完成专注记录
            completeRecord()
            
            notifyEnd()
        }
    }

    // MARK: - Pending Flush
    
    /// 补报上一次未成功同步的 actual_min（覆盖式，只存最新值）
    private func flushPendingActualMin(defaults: UserDefaults) {
        let pendingMin = defaults.integer(forKey: "FocusOne.PendingActualMin")
        let pendingRecordId = defaults.string(forKey: "FocusOne.PendingRecordId") ?? ""
        
        guard pendingMin > 0, !pendingRecordId.isEmpty else { return }
        
        defaults.removeObject(forKey: "FocusOne.PendingActualMin")
        defaults.removeObject(forKey: "FocusOne.PendingRecordId")
        
        NetworkManager.shared.post(
            path: "/record/update/\(pendingRecordId)",
            body: ["actual_min": pendingMin]
        ) { result in
            switch result {
            case .success:
                self.logToJS(level: "log", message: "pending 时长补报成功", data: ["recordId": pendingRecordId, "actualMin": pendingMin])
            case .failure(let error):
                self.logToJS(level: "warn", message: "pending 时长补报失败: \(error.localizedDescription)", data: ["recordId": pendingRecordId, "actualMin": pendingMin])
            }
        }
    }

    // MARK: - Core Logic
    
    private func startPlanSession(for activity: DeviceActivityName, defaults: UserDefaults) {
        // 0. 检查跨日，同步权益
        checkAndHandleDayChange(defaults: defaults)

        // 1. 从 activity name 解析 planId
        let raw = activity.rawValue
        guard raw.starts(with: "FocusOne.Plan.") else { return }

        // 使用 findPlan 方法查找对应的计划配置
        guard let plan = findPlan(by: raw, defaults: defaults) else {
            // ❌ 埋点: 计划未找到
            // 从 activity name 尝试提取 plan_id 以判断类型
            let planIdMatch = raw.replacingOccurrences(of: "FocusOne.Plan.", with: "").split(separator: "_").first ?? ""
            let focusType = String(planIdMatch).hasPrefix("once") ? "once" : "repeat"
            Analytics.shared.track(
                event: "session_failed",
                properties: [
                    "activity_name": raw,
                    "focus_type": focusType,
                    "failure_stage": "shield_start",
                    "error_type": "plan_not_found"
                ]
            )
            logToJS(level: "error", message: "未找到对应的计划配置", data: ["activityName": raw])
            return
        }

        let today = Calendar.current.startOfDay(for: Date())
        if let startDate = parsePlanDate(plan.start_date),
           today < Calendar.current.startOfDay(for: startDate) {
            logToJS(
                level: "log",
                message: "计划尚未开始，跳过本次自动执行",
                data: [
                    "planId": plan.id,
                    "start_date": plan.start_date ?? "",
                    "end_date": plan.end_date ?? ""
                ]
            )
            return
        }

        if let endDate = parsePlanDate(plan.end_date),
           today > Calendar.current.startOfDay(for: endDate) {
            removePlan(plan, defaults: defaults)
            logToJS(
                level: "log",
                message: "计划已过期，已自动清理本地监控",
                data: [
                    "planId": plan.id,
                    "start_date": plan.start_date ?? "",
                    "end_date": plan.end_date ?? ""
                ]
            )
            return
        }

        logToJS(level: "log", message: "找到计划: \(plan.id), 开始执行 shielding", data: ["planId": plan.id, "planName": plan.name ?? ""])

        // 2. 解析 Selection Token
        guard let data = Data(base64Encoded: plan.token),
              let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
            // ❌ 埋点: Token 解码失败
            let focusType = plan.id.hasPrefix("once_") ? "once" : "repeat"
            Analytics.shared.track(
                event: "session_failed",
                properties: [
                    "plan_id": plan.id,
                    "focus_type": focusType,
                    "failure_stage": "token_decode",
                    "error_type": "token_decode_error",
                    "token_length": plan.token.count
                ]
            )
            logToJS(level: "error", message: "无法解析 selection token", data: ["planId": plan.id])
            return
        }

        // 3. 记录时间和状态
        let now = Date()
        let calendar = Calendar.current
        let currentDayStart = calendar.startOfDay(for: now)
        
        // 计算实际的 Start/End 时间
        // 注意：这里的 plan.start/end 是分钟数。我们需要根据当前日期构建 Date。
        // 如果是跨日拆分的 P2，start 应该是 0。但 plan.start 存的是原始开始时间。
        // 为了简单，我们记录的 FocusStartAt/EndAt 主要是为了 UI 显示倒计时。
        // 对于拆分的情况，Monitor 实际上是分段运行的。
        // 既然 Monitor 已经启动，说明我们处于某一段中。
        // 简单起见，我们计算这一段的结束时间。
        
        // 重新计算当前段的结束时间
        var sessionEndTime: Date
        
        var planEndTime = currentDayStart.addingTimeInterval(TimeInterval(plan.end * 60))
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
        
        let totalMin = max(1, Int(ceil((sessionEndTime.timeIntervalSince1970 - now.timeIntervalSince1970) / 60)))
        let shieldMode = plan.mode ?? "shield"

        // 4. 周期任务启动前同步权益，不足则整次跳过
        syncBenefitStatus(defaults: defaults) { [self] in
            let isSubscribed = defaults.string(forKey: "is_subscribed") == "true"
            let dayDuration = defaults.integer(forKey: "day_duration")
            let todayUsed = defaults.integer(forKey: "today_used")
            let remaining = dayDuration - todayUsed

            if !isSubscribed && dayDuration > 0 && remaining < totalMin {
                let window = computeWindowIdentity(plan: plan, activityRawValue: raw, now: now)
                handlePeriodicQuotaSkip(
                    defaults: defaults,
                    plan: plan,
                    remaining: max(remaining, 0),
                    required: totalMin,
                    windowStart: window?.start,
                    windowEnd: window?.end
                )
                return
            }

            defaults.set(now.timeIntervalSince1970, forKey: "FocusOne.FocusStartAt")
            defaults.set(sessionEndTime.timeIntervalSince1970, forKey: "FocusOne.FocusEndAt")
            defaults.set(totalMin, forKey: "FocusOne.TotalMinutes")
            defaults.set("periodic", forKey: "FocusOne.FocusType")
            defaults.set(plan.id, forKey: "FocusOne.CurrentPlanId")
            defaults.set("schedule", forKey: "FocusOne.FocusEntrySource")
            defaults.removeObject(forKey: "FocusOne.EndNotified")

            // 保存屏蔽设置到本地，供暂停恢复使用
            if let selectionData = try? JSONEncoder().encode(selection) {
                defaults.set(selectionData, forKey: "FocusOne.CurrentShieldSelection")
            }

            let store = ManagedSettingsStore()
            applyShield(store: store, selection: selection, mode: shieldMode)
            defaults.set(shieldMode, forKey: "FocusOne.ShieldMode")

            let focusType = plan.id.hasPrefix("once_") ? "once" : "repeat"
            let entrySource = defaults.string(forKey: "FocusOne.FocusEntrySource") ?? "schedule"
            Analytics.shared.track(
                event: "session_started",
                properties: [
                    "plan_id": plan.id,
                    "focus_type": focusType,
                    "duration_minutes": totalMin,
                    "mode": shieldMode,
                    "entry_source": entrySource,
                    "app_count": selection.applicationTokens.count,
                    "category_count": selection.categoryTokens.count
                ]
            )

            logToJS(level: "log", message: "屏蔽已应用", data: ["planId": plan.id])
            notifyStart("\(plan.name ?? "专注契约")，\(totalMin)分钟")
            createRecord(for: plan, totalMinutes: totalMin, defaults: defaults)
        }
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

    private func monitorNames(for plan: PlanConfig) -> [DeviceActivityName] {
        var names: [DeviceActivityName] = []
        let days = plan.days.isEmpty ? [0,1,2,3,4,5,6] : plan.days

        if plan.start > plan.end {
            for d in days {
                names.append(DeviceActivityName("FocusOne.Plan.\(plan.id)_P1_D\(d)"))
                names.append(DeviceActivityName("FocusOne.Plan.\(plan.id)_P2_D\(d)"))
            }
        } else {
            for d in days {
                names.append(DeviceActivityName("FocusOne.Plan.\(plan.id)_D\(d)"))
            }
        }

        return names
    }

    private func removePlan(_ plan: PlanConfig, defaults: UserDefaults) {
        let center = DeviceActivityCenter()
        center.stopMonitoring(monitorNames(for: plan))

        guard let data = defaults.data(forKey: kPlansMap),
              var plans = try? JSONDecoder().decode([String: PlanConfig].self, from: data) else {
            return
        }

        plans.removeValue(forKey: plan.id)
        if let updatedData = try? JSONEncoder().encode(plans) {
            defaults.set(updatedData, forKey: kPlansMap)
        }
    }

    private func createRecord(for plan: PlanConfig, totalMinutes: Int, defaults: UserDefaults) {
        let requestBody: [String: Any] = [
            "plan_id": plan.id,
            "start_min": plan.start,
            "total_min": totalMinutes,
            "title": plan.name ?? "专注契约",
            "apps": plan.apps,
            "mode": plan.mode ?? "shield"
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
        if let defaults = UserDefaults(suiteName: "group.com.focusone"),
           defaults.bool(forKey: "FocusOne.EndNotified") {
            return
        }
        
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        let name = CFNotificationName("com.focusone.focus.ended" as CFString)
        CFNotificationCenterPostNotification(center, name, nil, nil, true)
        
        let content = UNMutableNotificationContent()
        content.title = "专注结束"
        let totalMin = UserDefaults(suiteName: "group.com.focusone")?.integer(forKey: "FocusOne.TotalMinutes") ?? 0
        content.body = "已完成\(totalMin)分钟专注，太棒了！"
        let request = UNNotificationRequest(identifier: "FocusEnd", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            defaults.set(true, forKey: "FocusOne.EndNotified")
            defaults.set("ended", forKey: "FocusOne.LastFocusEvent")
            defaults.removeObject(forKey: "FocusOne.FocusStartAt")
            defaults.removeObject(forKey: "FocusOne.FocusEndAt")
            defaults.removeObject(forKey: "FocusOne.TotalMinutes")
            defaults.removeObject(forKey: "FocusOne.CurrentPlanId")
            defaults.removeObject(forKey: "FocusOne.CurrentShieldSelection")
            defaults.removeObject(forKey: "FocusOne.ShieldMode")
            defaults.removeObject(forKey: "FocusOne.FocusEntrySource")
        }

    }

    private func notifyResume() {
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        let name = CFNotificationName("com.focusone.focus.resumed" as CFString)
        CFNotificationCenterPostNotification(center, name, nil, nil, true)
        
        let content = UNMutableNotificationContent()
        content.title = "专注恢复"
        content.body = "暂时结束，已恢复锁定状态"
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
    
    private func notifyStart(_ body: String) {
        let dCenter = CFNotificationCenterGetDarwinNotifyCenter()
        let dName = CFNotificationName("com.focusone.focus.started" as CFString)
        CFNotificationCenterPostNotification(dCenter, dName, nil, nil, true)

        let content = UNMutableNotificationContent()
        content.title = "专注开始"
        content.body = body
        enqueueNotification(identifier: "FocusStartPeriodic", content: content)
    }
    
    private func completeRecord() {
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else { return }
        
        let taskFailed = defaults.bool(forKey: "FocusOne.TaskFailed")
        if taskFailed {
            defaults.removeObject(forKey: "FocusOne.EndNotified")
            defaults.removeObject(forKey: "FocusOne.TaskFailed")
            defaults.removeObject(forKey: "FocusOne.FailedReason")
            return
        }
        
        guard let recordId = defaults.string(forKey: "record_id"), !recordId.isEmpty else { return }
        
        let completedKey = "FocusOne.RecordCompleted_\(recordId)"
        if defaults.bool(forKey: completedKey) { return }
        
        // 更新今日已使用时长
        let totalMin = defaults.integer(forKey: "FocusOne.TotalMinutes")
        let planId = defaults.string(forKey: "FocusOne.CurrentPlanId") ?? ""
        let focusType = defaults.string(forKey: "FocusOne.FocusType") == "once" ? "once" : "repeat"
        let entrySource = defaults.string(forKey: "FocusOne.FocusEntrySource") ?? "schedule"
        if totalMin > 0 {
            updateTodayUsed(minutes: totalMin, defaults: defaults)
        }
        Analytics.shared.track(
            event: "session_finished",
            properties: [
                "plan_id": planId,
                "record_id": recordId,
                "focus_type": focusType,
                "result": "completed",
                "elapsed_minutes": totalMin,
                "target_minutes": totalMin,
                "completion_rate": 1,
                "entry_source": entrySource
            ]
        )
        
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
    private func syncBenefitStatus(defaults: UserDefaults, completion: (() -> Void)? = nil) {
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
                } else {
                    self.logToJS(level: "warn", message: "权益同步成功但返回数据异常")
                }
                completion?()
            case .failure(let error):
                self.logToJS(level: "error", message: "权益同步失败: \(error.localizedDescription)")
                completion?()
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
    
    /// 检查免费用户配额，返回本次最多允许执行的分钟数
    private func checkFreeUserQuota(totalMinutes: Int, defaults: UserDefaults) -> Int {
        // 1. 检查是否为 VIP
        let isSubscribed = defaults.string(forKey: "is_subscribed") == "true"
        if isSubscribed {
            logToJS(level: "log", message: "VIP用户，不限制配额")
            return totalMinutes
        }
        
        // 2. 免费用户：day_duration ≤ 0 与 JS/后端一致，表示不校验日额度
        let dayDuration = defaults.integer(forKey: "day_duration")
        if dayDuration <= 0 {
            logToJS(level: "log", message: "日额度未启用(≤0)，不限制配额", data: ["dayDuration": dayDuration])
            return totalMinutes
        }
        
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
            return 0
        }
        
        return remaining
    }

    private func handlePeriodicQuotaSkip(
        defaults: UserDefaults,
        plan: PlanConfig,
        remaining: Int,
        required: Int,
        windowStart: TimeInterval?,
        windowEnd: TimeInterval?
    ) {
        let mode = plan.mode ?? "shield"
        let focusType = plan.id.hasPrefix("once_") ? "once" : "repeat"

        Analytics.shared.track(
            event: "session_skipped",
            properties: [
                "plan_id": plan.id,
                "plan_name": plan.name ?? "",
                "focus_type": focusType,
                "reason": "quota_insufficient",
                "remaining_minutes": remaining,
                "required_minutes": required,
                "day_duration": defaults.integer(forKey: "day_duration"),
                "today_used": defaults.integer(forKey: "today_used"),
                "mode": mode,
                "entry_source": "schedule"
            ]
        )

        let pendingEvent: [String: Any] = [
            "type": "quota_skip",
            "plan_id": plan.id,
            "plan_name": plan.name ?? "",
            "remaining_minutes": remaining,
            "required_minutes": required,
            "window_start": Int(windowStart ?? 0),
            "window_end": Int(windowEnd ?? 0),
            "timestamp": Int(Date().timeIntervalSince1970)
        ]
        if let pendingData = try? JSONSerialization.data(withJSONObject: pendingEvent) {
            defaults.set(pendingData, forKey: "FocusOne.PendingEvent")
        }

        let content = UNMutableNotificationContent()
        if remaining <= 0 {
            content.title = "时长耗尽提醒"
            content.body = "今日时长已用完，已跳过本次专注"
        } else {
            content.title = "时长不足提醒"
            content.body = "剩余时长不足，已跳过本次专注"
        }
        enqueueNotification(
            identifier: "QuotaSkip_\(plan.id)_\(Int(Date().timeIntervalSince1970))",
            content: content
        )

        logToJS(
            level: "warn",
            message: "剩余时长不足，已跳过本次周期专注",
            data: [
                "plan_id": plan.id,
                "remaining_minutes": remaining,
                "required_minutes": required
            ]
        )
    }

    private func enqueueNotification(identifier: String, content: UNMutableNotificationContent) {
        content.sound = .default
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                self.logToJS(level: "error", message: "通知发送失败", data: ["identifier": identifier, "error": error.localizedDescription])
            } else {
                self.logToJS(level: "log", message: "通知已发送", data: ["identifier": identifier])
            }
        }
    }

    private func computeWindowIdentity(
        plan: PlanConfig,
        activityRawValue: String,
        now: Date
    ) -> (start: TimeInterval, end: TimeInterval)? {
        let calendar = Calendar.current
        let currentDayStart = calendar.startOfDay(for: now)
        let startDate = currentDayStart.addingTimeInterval(TimeInterval(plan.start * 60))
        let endDate = currentDayStart.addingTimeInterval(TimeInterval(plan.end * 60))

        if plan.end <= plan.start {
            if activityRawValue.contains("_P2_") {
                let previousStart = startDate.addingTimeInterval(-24 * 3600)
                return (start: previousStart.timeIntervalSince1970, end: endDate.timeIntervalSince1970)
            }

            return (
                start: startDate.timeIntervalSince1970,
                end: endDate.addingTimeInterval(24 * 3600).timeIntervalSince1970
            )
        }

        return (start: startDate.timeIntervalSince1970, end: endDate.timeIntervalSince1970)
    }

    private func consumeQuotaSkipEventIfNeeded(
        activity: DeviceActivityName,
        defaults: UserDefaults,
        clearAfterConsume: Bool
    ) -> Bool {
        guard activity.rawValue.starts(with: "FocusOne.Plan."),
              let pendingData = defaults.data(forKey: "FocusOne.PendingEvent"),
              let json = try? JSONSerialization.jsonObject(with: pendingData) as? [String: Any],
              let type = json["type"] as? String,
              type == "quota_skip",
              let pendingPlanId = json["plan_id"] as? String,
              let plan = findPlan(by: activity.rawValue, defaults: defaults),
              plan.id == pendingPlanId,
              let pendingWindowStart = (json["window_start"] as? NSNumber)?.doubleValue,
              let pendingWindowEnd = (json["window_end"] as? NSNumber)?.doubleValue,
              let currentWindow = computeWindowIdentity(
                plan: plan,
                activityRawValue: activity.rawValue,
                now: Date()
              ),
              Int(pendingWindowStart) == Int(currentWindow.start),
              Int(pendingWindowEnd) == Int(currentWindow.end) else {
            return false
        }

        if clearAfterConsume {
            defaults.removeObject(forKey: "FocusOne.PendingEvent")
        }
        // warning 阶段要保留 PendingEvent，让真正的结束回调也能继续跳过；
        // intervalDidEnd 命中同一窗口后再清理，避免旧窗口的 quota_skip 污染后续真实任务。
        logToJS(level: "log", message: "检测到配额跳过，忽略本次结束回调", data: ["plan_id": pendingPlanId])
        return true
    }
}
