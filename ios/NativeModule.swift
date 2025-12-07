import Foundation
import React
@preconcurrency import DeviceActivity
import FamilyControls
import UIKit
import ManagedSettings
import SwiftUI
import UserNotifications
import CryptoKit

// 用于共享数据的UserDefaults扩展
extension UserDefaults {
  static let appGroup = "group.com.focusone"
  
  static func groupUserDefaults() -> UserDefaults? {
    return UserDefaults(suiteName: appGroup)
  }
}

// 自定义应用选择器视图
struct CustomFamilyActivityPicker: View {
  @Binding var selection: FamilyActivitySelection
  var onDismiss: (Bool) -> Void
  var maxCount: Int = 0 // 0 表示不限制；>0 时限制选择数量并禁止分组
  
  @Environment(\.dismiss) private var dismiss
  @State private var selectedApps = FamilyActivitySelection()
  
  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selectedApps)
        .navigationTitle("选择APP")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("取消") {
              onDismiss(false)
              dismiss()
            }
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("完成") {
              // 校验：当 maxCount > 0 时，限制应用数量且禁止分组选择
              if maxCount > 0 {
                let appCount = selectedApps.applicationTokens.count
                let hasGroups = !selectedApps.categoryTokens.isEmpty
                if hasGroups {
                  // 不允许选择分组
                  let alert = UIAlertController(title: "不支持选择分组", message: "请仅选择具体的 App。", preferredStyle: .alert)
                  alert.addAction(UIAlertAction(title: "我知道了", style: .default, handler: nil))
                  if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                     let rootViewController = windowScene.windows.first?.rootViewController {
                    var top = rootViewController
                    while let presented = top.presentedViewController { top = presented }
                    top.present(alert, animated: true, completion: nil)
                  }
                  return
                }
                if appCount > maxCount {
                  let alert = UIAlertController(title: "最多可选择 \(maxCount) 个 App", message: "请减少选择的 App 数量后再试。", preferredStyle: .alert)
                  alert.addAction(UIAlertAction(title: "好的", style: .default, handler: nil))
                  if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                     let rootViewController = windowScene.windows.first?.rootViewController {
                    var top = rootViewController
                    while let presented = top.presentedViewController { top = presented }
                    top.present(alert, animated: true, completion: nil)
                  }
                  return
                }
              }
              // 将选择的应用传递给外部绑定
              selection = selectedApps
              onDismiss(true)
              dismiss()
            }
          }
        }
        .onAppear {
          // 进入选择器时，将上次已保存的选择作为初始选中
          selectedApps = selection
        }
    }
  }
}

@objc(NativeModule)
@MainActor
class NativeModule: RCTEventEmitter {
  private let center = DeviceActivityCenter()
  private let activityName = DeviceActivityName("FocusOne.ScreenTime")
  private let pauseResumeActivity = DeviceActivityName("FocusOne.PauseResume")
  private var hasListeners: Bool = false
  private var tickTimer: Timer?
  private var darwinObserverAdded: Bool = false
  private var endTimestamp: TimeInterval = 0
  private var totalMinutes: Int = 0
  // C 回调：用于 Darwin 通知（不能捕获 self）
  private static let darwinCallback: CFNotificationCallback = { _, observer, name, _, _ in
    guard let observer = observer else { return }
    let instance = Unmanaged<NativeModule>.fromOpaque(observer).takeUnretainedValue()
    DispatchQueue.main.async {
      if UIApplication.shared.applicationState == .active {
        let n = name?.rawValue as String?
        if n == "com.focusone.focus.ended" {
          instance.emitState("ended")
          instance.emitEnded()
          } else if n == "com.focusone.focus.started" {
            instance.emitState("started")
          } else if n == "com.focusone.focus.resumed" {
            instance.emitState("resumed")
          }
      }
    }
  }
  // Event Emitter
  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! {
    return ["focus-state"]
  }
  override func startObserving() {
    hasListeners = true
    NotificationCenter.default.addObserver(self, selector: #selector(appWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    // 注册 Darwin 通知监听（跨进程），仅当前台时转发到 JS
    addDarwinObserverIfNeeded()
    // 不再使用前台 1s 轮询；一次性任务也不再设置单次定时器，统一靠系统事件 + Darwin 通知
  }
  override func stopObserving() {
    hasListeners = false
    NotificationCenter.default.removeObserver(self)
    invalidateTimer()
    removeDarwinObserverIfNeeded()
  }
  @objc private func appWillEnterForeground() {
    // 按用户需求：不在前台回放后台发生的事件，也不在此处结算
  }
  // Darwin 通知监听与转发
  private func addDarwinObserverIfNeeded() {
    guard !darwinObserverAdded else { return }
    darwinObserverAdded = true
    let center = CFNotificationCenterGetDarwinNotifyCenter()
      let endedName = "com.focusone.focus.ended" as CFString
      let startedName = "com.focusone.focus.started" as CFString
      let resumedName = "com.focusone.focus.resumed" as CFString
      let observer = Unmanaged.passUnretained(self).toOpaque()
      CFNotificationCenterAddObserver(center, observer, NativeModule.darwinCallback, endedName, nil, .deliverImmediately)
      CFNotificationCenterAddObserver(center, observer, NativeModule.darwinCallback, startedName, nil, .deliverImmediately)
      CFNotificationCenterAddObserver(center, observer, NativeModule.darwinCallback, resumedName, nil, .deliverImmediately)
  }
  private func removeDarwinObserverIfNeeded() {
    guard darwinObserverAdded else { return }
    darwinObserverAdded = false
    let center = CFNotificationCenterGetDarwinNotifyCenter()
    CFNotificationCenterRemoveObserver(center, Unmanaged.passUnretained(self).toOpaque(), nil, nil)
  }
  private func invalidateTimer() {
    tickTimer?.invalidate()
    tickTimer = nil
    
  }
  private func emitProgress() {
    // 进度事件已移除（不再向 JS 发送 focus-progress）
    return
  }
  private func emitEnded() {
    // 仅内部归零，不再发独立结束事件
    totalMinutes = 0
    endTimestamp = 0
  }
  private func emitState(_ state: String, extra: [String: Any] = [:]) {
    if !hasListeners { return }
    var body: [String: Any] = ["state": state]
    for (k, v) in extra { body[k] = v }
    sendEvent(withName: "focus-state", body: body)
  }
  
  // MARK: - 批量配置按周几的定时屏蔽计划（与前端计划兼容）
  // plansJSON: [{ id, start: 秒, end: 秒, repeatDays: [0..6], mode }]
  // 说明：repeatDays 约定 0=周日, 1=周一 ... 6=周六；将转换为 iOS Calendar.weekday (1=周日 ... 7=周六)
  @objc
  func setSchedulePlans(_ plansJSON: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    struct PlanCfg: Codable {
      let id: String
      let start: Int
      let end: Int
      let repeatDays: [Int]?
      let mode: String?
    }
    func hourMinute(from seconds: Int) -> (Int, Int) {
      let m = max(0, seconds / 60)
      return (m / 60, m % 60)
    }
    guard let data = (plansJSON as String).data(using: .utf8) else {
      reject("PARAM_ERROR", "参数解析失败", nil)
      return
    }
    let decoder = JSONDecoder()
    guard let plans = try? decoder.decode([PlanCfg].self, from: data) else {
      reject("PARAM_ERROR", "JSON 解析失败", nil)
      return
    }
    // 清理历史监控
    if let defaults = UserDefaults.groupUserDefaults(),
       let names = defaults.array(forKey: "FocusOne.ActiveScheduleNames") as? [String] {
      for n in names {
        center.stopMonitoring([DeviceActivityName(n)])
      }
    }
    var newNames: [String] = []
    // 保存前端下发的计划配置，供扩展计算 endAt 使用
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.set(plansJSON as String, forKey: "FocusOne.PlannedConfigs")
    }
    // 使用已保存的应用选择作为屏蔽对象
    // 注意：这里不直接应用屏蔽，由扩展在 intervalDidStart 中应用
    for (idx, p) in plans.enumerated() {
      let (sh, sm) = hourMinute(from: p.start)
      let (eh, em) = hourMinute(from: p.end)
      let days = (p.repeatDays?.isEmpty == false) ? p.repeatDays! : [0,1,2,3,4,5,6]
      for d in days {
        let wd = d + 1
        // 处理跨日：若 end <= start，兜底成 23:59（复杂跨日可拆分两段，这里先简化）
        let endH = (eh * 60 + em) <= (sh * 60 + sm) ? 23 : eh
        let endM = (eh * 60 + em) <= (sh * 60 + sm) ? 59 : em
        // 【核心】创建屏蔽时间表
        let schedule = DeviceActivitySchedule(
          intervalStart: DateComponents(hour: sh, minute: sm, weekday: wd),
          intervalEnd: DateComponents(hour: endH, minute: endM, weekday: wd),
          repeats: true
        )
        let name = "FocusOne.Schedule_\(idx)_\(d)_\(sh)_\(sm)_\(eh)_\(em)"
        do {
          // 开始触发监控，扩展侧统一执行
          try center.startMonitoring(DeviceActivityName(name), during: schedule)
          newNames.append(name)
        } catch {
          // 某个计划失败不影响其它计划
          continue
        }
      }
    }
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.set(newNames, forKey: "FocusOne.ActiveScheduleNames")
    }
    resolve(true)
  }

  // 屏幕时间权限
  @objc
  func requestScreenTimePermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        DispatchQueue.main.async {
          resolve(true)
        }
      } catch {
        DispatchQueue.main.async {
          reject(
            "PERMISSION_ERROR",
            "请求屏幕时间权限失败: \(error.localizedDescription)",
            error
          )
        }
      }
    }
  }
  
  // 检查屏幕时间权限状态
  @objc
  func checkScreenTimePermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let status = AuthorizationCenter.shared.authorizationStatus
    switch status {
    case .approved:
      resolve("approved")
    case .denied:
      resolve("denied")
    case .notDetermined:
      resolve("notDetermined")
    @unknown default:
      resolve("unknown")
    }
  }
  
  // 选择要限制的应用
  // maxCount: 0 表示不限制；>0 表示限制选择数量并禁止分组
  @objc
  func selectAppsToLimit(_ maxCount: NSNumber, apps: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        // 确保已获取权限
        if AuthorizationCenter.shared.authorizationStatus != .approved {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        }
        
        let appsString = (apps as String).trimmingCharacters(in: .whitespacesAndNewlines)

        // 在主线程显示应用选择器
        DispatchQueue.main.async { [weak self] in
          guard let self = self else {
            resolve(["success": false])
            return
          }
          
          // 根据字符串参数决定默认选择：
          // 1. 'null'（或 nil）：使用上次保存的选择
          // 2. ''：不选中任何应用
          // 3. 其他字符串：按逗号拆分为 token 列表，选中指定应用
          var selection: FamilyActivitySelection
          if appsString.lowercased() == "null" {
            selection = self.loadSelection() ?? FamilyActivitySelection()
          } else if appsString.isEmpty {
            selection = FamilyActivitySelection()
          } else {
            let tokens = appsString
              .split(separator: ",")
              .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
              .filter { !$0.isEmpty }
            if tokens.isEmpty {
              selection = self.loadSelection() ?? FamilyActivitySelection()
            } else {
              selection = Helper.buildSelectionFromApps(tokens) ?? FamilyActivitySelection()
            }
          }
          
          let pickerViewController = UIHostingController(
            rootView: CustomFamilyActivityPicker(
              selection: Binding(
                get: { selection },
                set: { newSelection in
                  selection = newSelection
                }
              ),
              onDismiss: { [weak self] success in
                guard let self = self else { return }
                if success {
                  // 用户点击完成
                  self.saveSelection(selection: selection)
                  // 获取应用详细信息
                  let appDetails = self.getSelectedAppDetails(from: selection)
                  // 返回选择结果
                  resolve([
                    "success": true,
                    "apps": appDetails
                  ])
                } else {
                  // 用户取消选择
                  resolve(["success": false])
                }
              },
              maxCount: Int(truncating: maxCount)
            )
          )
          
          // 以 Sheet 模态呈现，并设置为多半屏（支持中/大两档）
          pickerViewController.modalPresentationStyle = .pageSheet
          if let sheet = pickerViewController.sheetPresentationController {
            sheet.detents = [.large()]
            sheet.prefersGrabberVisible = false
          }
          
          // 获取顶层窗口并展示选择器（从顶层VC弹出，避免被现有弹窗阻挡）
          if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
             let rootViewController = windowScene.windows.first?.rootViewController {
            var top = rootViewController
            while let presented = top.presentedViewController {
              top = presented
            }
            top.present(pickerViewController, animated: true)
          } else {
            reject("PRESENTATION_ERROR", "无法打开应用选择器", nil)
          }
        }
      } catch {
        DispatchQueue.main.async {
          reject("PERMISSION_ERROR", "请求权限失败: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  // 开始限制选中的应用（durationMinutes: 任务时长，单位：分钟）
  @objc
  func startAppLimits(_ durationMinutes: NSNumber, planId: NSString?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let selection = self.loadSelection() else {
      reject("NO_SELECTION", "没有选择需要限制的应用", nil)
      return
    }
    // 重叠校验：禁止与当前任务或周期计划时间重叠
    let nowTs = Date().timeIntervalSince1970
    if let defaults = UserDefaults.groupUserDefaults() {
      let startAtExist = defaults.double(forKey: "FocusOne.FocusStartAt")
      let endAtExist = defaults.double(forKey: "FocusOne.FocusEndAt")
      let totalExist = defaults.integer(forKey: "FocusOne.TotalMinutes")
      if startAtExist > 0 && endAtExist > nowTs && totalExist > 0 {
        reject("OVERLAP_ERROR", "已有任务进行中，禁止重叠创建", nil)
        return
      }
    }
    if let window = currentPlannedWindow() {
      if nowTs >= window.start && nowTs < window.end {
        reject("OVERLAP_ERROR", "已处于周期计划窗口内，禁止重叠创建一次性任务", nil)
        return
      }
    }
    
    // 根据传入时长构造日程
    let minutes = Int(truncating: durationMinutes)
    let schedule: DeviceActivitySchedule
    if minutes <= 0 {
      // 兼容旧调用：无时长则全天、重复
      schedule = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: 0, minute: 0),
        intervalEnd: DateComponents(hour: 23, minute: 59),
        repeats: true
      )
    } else {
      // 计算开始/结束时间，若小于系统最小时长(约15分钟)，强制延长到15分钟，并在扩展的 intervalWillEndWarning 提前清理
      let minDuration = 15
      let realDuration = max(minutes, minDuration)
      let now = Date()
      let endDate = now.addingTimeInterval(TimeInterval(realDuration * 60))
      let calendar = Calendar.current
      let startComps = calendar.dateComponents([.hour, .minute], from: now)
      let endCompsFull = calendar.dateComponents([.hour, .minute], from: endDate)
      let startHM = (startComps.hour ?? 0) * 60 + (startComps.minute ?? 0)
      let endHM = (endCompsFull.hour ?? 0) * 60 + (endCompsFull.minute ?? 0)
      let endComps: DateComponents
      if endHM <= startHM {
        // 跨日，兜底到当日23:59（后续可拆分两段以完整覆盖跨日场景）
        endComps = DateComponents(hour: 23, minute: 59)
      } else {
        endComps = endCompsFull
      }
      // 若原始 minutes 小于最小时长，则设置 warningTime 在到期时提前触发
      if minutes < minDuration {
        let warnAhead = minDuration - minutes // 距离区间结束前 warnAhead 分钟触发
        let warning = DateComponents(minute: warnAhead)
        schedule = DeviceActivitySchedule(
          intervalStart: DateComponents(hour: startComps.hour, minute: startComps.minute),
          intervalEnd: endComps,
          repeats: false,
          warningTime: warning
        )
      } else {
        schedule = DeviceActivitySchedule(
          intervalStart: DateComponents(hour: startComps.hour, minute: startComps.minute),
          intervalEnd: endComps,
          repeats: false
        )
      }
    }
    
    // 定义事件监控
    let eventName = DeviceActivityEvent.Name("FocusOne.LimitApps")
    let event = DeviceActivityEvent(
      applications: selection.applicationTokens,
      categories: selection.categoryTokens,
      webDomains: selection.webDomainTokens,
      threshold: DateComponents(second: 1) // 几乎立即触发限制
    )
    
    do {
      // 停止一次性与暂停恢复监控，保留周期性计划
      center.stopMonitoring([activityName, pauseResumeActivity])
      
      // 开始新的监控
      try center.startMonitoring(
        activityName,
        during: schedule,
        events: [eventName: event]
      )
      
      // 保存屏蔽设置到本地，供暂停恢复使用
      if let defaults = UserDefaults.groupUserDefaults() {
        do {
          let data = try JSONEncoder().encode(selection)
          defaults.set(data, forKey: "FocusOne.CurrentShieldSelection")
          print("【一次性任务】已保存屏蔽设置到本地")
        } catch {
          print("【一次性任务错误】保存屏蔽设置失败: \(error.localizedDescription)")
        }
      }
      
      // 立即激活屏蔽
      let store = ManagedSettingsStore()
      store.shield.applications = selection.applicationTokens
      store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
      store.shield.webDomains = selection.webDomainTokens

      // 初始化进度事件源（JS侧每分钟监听）
      let startDate = Date()
      self.totalMinutes = Int(truncating: durationMinutes)
      self.endTimestamp = startDate.addingTimeInterval(TimeInterval(self.totalMinutes * 60)).timeIntervalSince1970
      // 保存状态到 App Group，供查询与扩展使用
      if let defaults = UserDefaults.groupUserDefaults() {
        defaults.set(startDate.timeIntervalSince1970, forKey: "FocusOne.FocusStartAt")
        defaults.set(self.endTimestamp, forKey: "FocusOne.FocusEndAt")
        defaults.set(self.totalMinutes, forKey: "FocusOne.TotalMinutes")
        defaults.set("once", forKey: "FocusOne.FocusType")
        if let pid = planId as String? {
          defaults.set(pid, forKey: "FocusOne.CurrentPlanId")
        }
        // 清理之前的失败标记
        defaults.removeObject(forKey: "FocusOne.TaskFailed")
        defaults.removeObject(forKey: "FocusOne.FailedReason")
      }
      // 不再直接向 JS 发送 started，由扩展发 Darwin 事件统一驱动
      self.emitProgress()
      // 发送开始通知（一次性）
      let content = UNMutableNotificationContent()
      content.title = "专注一点"
      content.body = "屏蔽已开启，保持专注"
      let request = UNNotificationRequest(identifier: "FocusStartOnce", content: content, trigger: nil)
      UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
      
      resolve(true)
    } catch {
      reject("MONITORING_ERROR", "无法开始监控应用: \(error.localizedDescription)", error)
    }
  }
  
  // 停止限制应用
  @objc
  func stopAppLimits(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    // 标记任务失败（手动停止），阻止 Extension 调用 complete
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.set(true, forKey: "FocusOne.TaskFailed")
      defaults.set("user_exit", forKey: "FocusOne.FailedReason")
    }
    // 仅停止一次性任务与暂停恢复活动，保留周期性计划监控，确保下个周期继续生效
    center.stopMonitoring([activityName, pauseResumeActivity])
    
    // 清除所有限制
    let store = ManagedSettingsStore()
    store.clearAllSettings()
    emitEnded()
    invalidateTimer()

    // 手动停止发送 user_exit 原因
    emitState("failed", extra: ["reason": "user_exit"])
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.removeObject(forKey: "FocusOne.FocusStartAt")
      defaults.removeObject(forKey: "FocusOne.FocusEndAt")
      defaults.removeObject(forKey: "FocusOne.TotalMinutes")
      defaults.removeObject(forKey: "FocusOne.FocusType")
      defaults.removeObject(forKey: "FocusOne.CurrentPlanId")
      defaults.removeObject(forKey: "FocusOne.TaskFailed")
      defaults.removeObject(forKey: "FocusOne.CurrentShieldSelection")
      defaults.removeObject(forKey: "FocusOne.FailedReason")
      defaults.removeObject(forKey: "FocusOne.IsPauseActivity")
      defaults.removeObject(forKey: "FocusOne.PausedUntil")
    }
    
    resolve(true)
  }

  // 返回当前仍然有效（已注册且未被停用）的周期性定时计划
  // 基于保存的 FocusOne.PlannedConfigs 与 FocusOne.ActiveScheduleNames 进行比对
  @objc
  func getSchedulePlans(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    struct PlanCfg: Codable {
      let id: String
      let start: Int
      let end: Int
      let repeatDays: [Int]?
      let mode: String?
    }
    func hourMinute(from seconds: Int) -> (Int, Int) {
      let m = max(0, seconds / 60)
      return (m / 60, m % 60)
    }

    guard let defaults = UserDefaults.groupUserDefaults() else {
      resolve([])
      return
    }
    guard let cfgStr = defaults.string(forKey: "FocusOne.PlannedConfigs"),
          let cfgData = cfgStr.data(using: .utf8),
          let plans = try? JSONDecoder().decode([PlanCfg].self, from: cfgData) else {
      resolve([])
      return
    }
    let activeNames = (defaults.array(forKey: "FocusOne.ActiveScheduleNames") as? [String]) ?? []

    var effective: [[String: Any]] = []
    for (idx, p) in plans.enumerated() {
      let (sh, sm) = hourMinute(from: p.start)
      let (ehRaw, emRaw) = hourMinute(from: p.end)
      let startHM = sh * 60 + sm
      let endHM = ehRaw * 60 + emRaw
      let eh = (endHM <= startHM) ? 23 : ehRaw
      let em = (endHM <= startHM) ? 59 : emRaw

      let days = (p.repeatDays?.isEmpty == false) ? p.repeatDays! : [0,1,2,3,4,5,6]
      var expectedNames: [String] = []
      for d in days {
        // 与 setSchedulePlans 中的命名保持一致
        let name = "FocusOne.Schedule_\(idx)_\(d)_\(sh)_\(sm)_\(eh)_\(em)"
        expectedNames.append(name)
      }
      let isEffective = expectedNames.contains { activeNames.contains($0) }
      if isEffective {
        var item: [String: Any] = [
          "id": p.id,
          "start": p.start,
          "end": p.end
        ]
        if let r = p.repeatDays { item["repeatDays"] = r }
        if let m = p.mode { item["mode"] = m }
        effective.append(item)
      }
    }
    resolve(effective)
  }

  // 查询当前屏蔽状态与进度
  @objc
  func getFocusStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults.groupUserDefaults() else {
      resolve(["active": false])
      return
    }
    
    // 检查任务是否已失败（暂停超时等）
    let taskFailed = defaults.bool(forKey: "FocusOne.TaskFailed")
    if taskFailed {
      resolve(["active": false, "failed": true])
      return
    }
    
    let startAt = defaults.double(forKey: "FocusOne.FocusStartAt")
    let endAt = defaults.double(forKey: "FocusOne.FocusEndAt")
    let total = defaults.integer(forKey: "FocusOne.TotalMinutes")

    print("startAt: \(startAt), endAt: \(endAt), total: \(total)")

    // 若没有一次性/周期任务的时间信息，则认为未激活
    if startAt <= 0 || endAt <= 0 || total <= 0 {
      resolve(["active": false])
      return
    }

    let now = Date().timeIntervalSince1970
    // 按整分对齐：以"分钟桶"计算，确保在每个自然分钟边界（秒=0）才变更
    let elapsedMinRaw = Int(floor(now / 60.0) - floor(startAt / 60.0))
    let elapsedMin = max(0, min(total, elapsedMinRaw))

    // 是否处于我们定义的专注任务窗口内（一次性或周期）
    let inWindow = now < endAt

    // 读取 iOS 当前是否正在屏蔽（依据 ManagedSettings 当前设置是否为空）
    let store = ManagedSettingsStore()
    let hasApps = !(store.shield.applications?.isEmpty ?? true)
    let hasDomains = !(store.shield.webDomains?.isEmpty ?? true)
    let hasCats = (store.shield.applicationCategories != nil)
    let isShielding = hasApps || hasDomains || hasCats

    // 检查暂停状态
    let pausedUntil = defaults.double(forKey: "FocusOne.PausedUntil")
    let isPaused = pausedUntil > 0 && now < pausedUntil

    // 暂停：当仍在专注窗口，但系统未在屏蔽（清空了 ManagedSettings）
    let paused = inWindow && !isShielding && isPaused

    // 业务上的 active：在窗口内即为 true，即使暂停中也为 true
    // 如果有暂停状态（无论是否超时），都应该返回 active
    let active = inWindow || (pausedUntil > 0)

    let ftype = defaults.string(forKey: "FocusOne.FocusType")
    // 简单序列化：key=value 以逗号连接（按 key 排序，便于稳定）
    // let blockedAppsSerialized = blockedAppsDict
    //   .map { "\($0.key)=\($0.value)" }
    //   .sorted()
    //   .joined(separator: ",")
    // print("blockedAppsSerialized: \(blockedAppsSerialized)")
    // 计算当前命中的周期计划的 plan_id
    var planId: String? = nil
    if ftype == "periodic", let cfgStr = defaults.string(forKey: "FocusOne.PlannedConfigs"), let cfgData = cfgStr.data(using: .utf8) {
      struct PlanCfg: Codable { let id: String; let start: Int; let end: Int; let repeatDays: [Int]? }
      if let cfgs = try? JSONDecoder().decode([PlanCfg].self, from: cfgData) {
        let cal = Calendar.current
        let comp = cal.dateComponents([.weekday, .hour, .minute], from: Date())
        let weekdayApple = comp.weekday ?? 1 // 1=周日
        // 转换为 0=周日, 1=周一..6=周六
        let mondayFirst = (weekdayApple == 1) ? 0 : (weekdayApple - 1)
        func hm(_ sec: Int) -> (Int, Int) { let m = max(0, sec/60); return (m/60, m%60) }
        for c in cfgs {
          let days = (c.repeatDays?.isEmpty == false) ? c.repeatDays! : [0,1,2,3,4,5,6]
          if !days.contains(mondayFirst) { continue }
          let (sh, sm) = hm(c.start); let (eh, em) = hm(c.end)
          let endHM = eh*60 + em
          let startHM = sh*60 + sm
          var eH = eh, eM = em
          if endHM <= startHM { eH = 23; eM = 59 }
          if let sDate = cal.date(bySettingHour: sh, minute: sm, second: 0, of: Date()),
             let eDate = cal.date(bySettingHour: eH, minute: eM, second: 0, of: Date()) {
            let sTs = sDate.timeIntervalSince1970
            let eTs = eDate.timeIntervalSince1970
            let nowTs = now
            if nowTs >= sTs && nowTs < eTs {
              planId = c.id
              break
            }
          }
        }
      }
    }
    // 若为一次性任务，读取启动时保存的planId
    if planId == nil, ftype == "once" {
      if let pid = defaults.string(forKey: "FocusOne.CurrentPlanId"), !pid.isEmpty {
        planId = pid
      }
    }

    // 读取 record_id
    let recordId = defaults.string(forKey: "record_id")
    
    resolve([
      "active": active,
      "paused": paused,
      "plan_id": planId ?? NSNull(),
      "record_id": recordId ?? NSNull(),
      "startAt": startAt,
      "endAt": endAt,
      "totalMinutes": total,
      "elapsedMinutes": elapsedMin,
      "focusType": ftype ?? NSNull(),
      "pausedUntil": (pausedUntil > 0 && isPaused) ? pausedUntil : NSNull()
    ])
  }

  // 暂停当前屏蔽（指定分钟数，超时自动恢复）
  @objc
  func pauseAppLimits(_ durationMinutes: NSNumber?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let now = Date()
    let calendar = Calendar.current
    
    // 获取暂停时长，默认为3分钟
    let minutes = durationMinutes?.intValue ?? 3
    // 校验：暂停不允许大于 10 分钟
    if minutes > 10 {
      reject("PAUSE_LIMIT", "暂停不允许大于10分钟", nil)
      return
    }
    let pauseDuration: TimeInterval = TimeInterval(minutes) * 60 // 屏蔽时长（秒）

    // 初始化屏蔽时长
    let minTime: Int = 15
    let warningTime = minTime - minutes
    
    // 先停止旧的暂停恢复监控（如果存在）
    center.stopMonitoring([pauseResumeActivity])
    print("【暂停】已停止旧的暂停恢复监控")
    
    // 暂停期间清空屏蔽
    let store = ManagedSettingsStore()
    store.clearAllSettings()
    
    // 计算恢复时间
    let pausedUntil = now.timeIntervalSince1970 + pauseDuration
    
    // 创建15分钟的 Schedule（满足最低要求）
    // 使用 warningTime=12分钟，在3分钟后触发
    let scheduleEndTime = now.addingTimeInterval(TimeInterval(minTime * 60))
    
    let schedule = DeviceActivitySchedule(
      intervalStart: DateComponents(
        calendar: calendar,
        year: calendar.component(.year, from: now),
        month: calendar.component(.month, from: now),
        day: calendar.component(.day, from: now),
        hour: calendar.component(.hour, from: now),
        minute: calendar.component(.minute, from: now)
      ),
      intervalEnd: DateComponents(
        calendar: calendar,
        year: calendar.component(.year, from: scheduleEndTime),
        month: calendar.component(.month, from: scheduleEndTime),
        day: calendar.component(.day, from: scheduleEndTime),
        hour: calendar.component(.hour, from: scheduleEndTime),
        minute: calendar.component(.minute, from: scheduleEndTime)
      ),
      repeats: false,
      warningTime: DateComponents(minute: warningTime) // 15-12=3分钟后触发
    )
    
    // 启动暂停恢复监控
    do {
      try center.startMonitoring(pauseResumeActivity, during: schedule)
    } catch {
      print("【启动暂停监控失败】\(error)")
      reject("MONITOR_ERROR", "启动暂停监控失败", error)
      return
    }
    
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.set(true, forKey: "FocusOne.IsPauseActivity")
      defaults.set(pausedUntil, forKey: "FocusOne.PausedUntil") // 仅用于 JS 端倒计时
      defaults.set("paused", forKey: "FocusOne.LastFocusEvent")
    }
    
    print("【暂停成功】将在\(Int(minutes))分钟后自动恢复")
    emitState("paused")
    resolve(true)
  }

  // 手动恢复屏蔽：撤销暂停并按一次性或周期状态恢复 ManagedSettings
  @objc
  func resumeAppLimits(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let now = Date().timeIntervalSince1970
    
    // 恢复前检查任务是否仍有效
    var canResume = false
    var selection: FamilyActivitySelection? = nil
    
    // 优先使用当前任务的屏蔽设置
    if let defaults = UserDefaults.groupUserDefaults(),
       let data = defaults.data(forKey: "FocusOne.CurrentShieldSelection"),
       let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
      selection = sel
      print("【恢复】使用当前任务的屏蔽设置")
    }
    if endTimestamp > now {
      canResume = true
    } else if let window = currentPlannedWindow() {
      if now >= window.start && now < window.end { canResume = true }
    }
    guard canResume, let sel = selection else {
      print("【恢复失败】任务已结束或无效")
      resolve(false)
      return
    }
    
    // 恢复屏蔽设置
    let store = ManagedSettingsStore()
    store.shield.applications = sel.applicationTokens
    store.shield.applicationCategories = sel.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(sel.categoryTokens)
    store.shield.webDomains = sel.webDomainTokens
    
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.removeObject(forKey: "FocusOne.IsPauseActivity")
      defaults.removeObject(forKey: "FocusOne.PausedUntil") // 清理倒计时数据
      defaults.set("resumed", forKey: "FocusOne.LastFocusEvent")
    }
    
    // 停止暂停恢复监控
    center.stopMonitoring([pauseResumeActivity])
    print("【手动恢复】已停止暂停恢复监控")
    
    emitState("resumed")
    print("【手动恢复成功】屏蔽已恢复")
    resolve(true)
  }

  // 计算“当前时刻”命中的周期计划窗口（若存在）
  // 返回当日窗口的开始/结束时间戳（秒）
  private func currentPlannedWindow() -> (start: TimeInterval, end: TimeInterval)? {
    guard let defaults = UserDefaults.groupUserDefaults(),
          let cfgStr = defaults.string(forKey: "FocusOne.PlannedConfigs"),
          let cfgData = cfgStr.data(using: .utf8) else { return nil }
    struct PlanCfg: Codable { let start: Int; let end: Int; let repeatDays: [Int]? }
    guard let cfgs = try? JSONDecoder().decode([PlanCfg].self, from: cfgData) else { return nil }
    let now = Date()
    let cal = Calendar.current
    let comp = cal.dateComponents([.weekday, .hour, .minute], from: now)
    let weekdayApple = comp.weekday ?? 1 // 1=周日
    // 转换为 0=周日, 1=周一..6=周六
    let mondayFirst = (weekdayApple == 1) ? 0 : (weekdayApple - 1)
    func hm(_ sec: Int) -> (Int, Int) { let m = max(0, sec/60); return (m/60, m%60) }
    for c in cfgs {
      let days = (c.repeatDays?.isEmpty == false) ? c.repeatDays! : [0,1,2,3,4,5,6]
      if !days.contains(mondayFirst) { continue }
      let (sh, sm) = hm(c.start); let (eh, em) = hm(c.end)
      let endHM = eh*60 + em
      let startHM = sh*60 + sm
      var eH = eh, eM = em
      if endHM <= startHM { eH = 23; eM = 59 }
      guard let sDate = cal.date(bySettingHour: sh, minute: sm, second: 0, of: now),
            let eDate = cal.date(bySettingHour: eH, minute: eM, second: 0, of: now) else { continue }
      let sTs = sDate.timeIntervalSince1970
      let eTs = eDate.timeIntervalSince1970
      let nowTs = now.timeIntervalSince1970
      if nowTs >= sTs && nowTs < eTs {
        return (start: sTs, end: eTs)
      }
    }
    return nil
  }
  
  // 获取选择应用的详细信息
  private func getSelectedAppDetails(from selection: FamilyActivitySelection) -> [[String: Any]] {
      var appIcons: [[String: Any]] = []
      
      // 处理应用令牌
      for token in selection.applicationTokens {
        do {
          // 将token编码为base64以便传递给RN
          let tokenData = try JSONEncoder().encode(token)
          let tokenBase64 = tokenData.base64EncodedString()
          let stableId = generateMongoId(from: tokenBase64)
          
          let appIcon: [String: Any] = [
            "stableId": stableId,
            "tokenData": tokenBase64,
            "type": "application"
          ]
          
          appIcons.append(appIcon)
        } catch {
          // 跳过无法渲染的应用
          continue
        }
      }
      
      // 处理网站令牌
      for token in selection.webDomainTokens {
        if let tokenData = try? JSONEncoder().encode(token) {
          let tokenBase64 = tokenData.base64EncodedString()
          let stableId = generateMongoId(from: tokenBase64)
          let webIcon: [String: Any] = [
            "stableId": stableId,
            "type": "webDomain",
            "tokenData": tokenBase64
          ]
          appIcons.append(webIcon)
        }
      }
      
      // 处理类别令牌
      for token in selection.categoryTokens {
        do {
          // 将token编码为base64以便传递给RN
          let tokenData = try JSONEncoder().encode(token)
          let tokenBase64 = tokenData.base64EncodedString()
          let stableId = generateMongoId(from: tokenBase64)
          
          let categoryIcon: [String: Any] = [
            "stableId": stableId,
            "tokenData": tokenBase64,
            "type": "category",
          ]
          
          appIcons.append(categoryIcon)
        } catch {
          // 跳过无法渲染的类别
          continue
        }
      }
      
      return appIcons
    }
  
  // 保存选择的应用到UserDefaults
  private func saveSelection(selection: FamilyActivitySelection) {
    if let data = try? JSONEncoder().encode(selection),
       let defaults = UserDefaults.groupUserDefaults() {
      defaults.set(data, forKey: "FocusOne.AppSelection")
    }
  }
  
  // 从UserDefaults加载选择的应用
  private func loadSelection() -> FamilyActivitySelection? {
    guard let defaults = UserDefaults.groupUserDefaults(),
          let data = defaults.data(forKey: "FocusOne.AppSelection"),
          let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
      return nil
    }
    return selection
  }

  private func generateMongoId(from originalString: String) -> String {
      // 基于原字符串生成确定性的24位十六进制ID
      let hashData = SHA256.hash(data: originalString.data(using: .utf8) ?? Data())
      let hashHex = hashData.compactMap { String(format: "%02x", $0) }.joined()
      
      // 取前24位作为完整ID，确保MongoDB ObjectId格式
      let fullId = String(hashHex.prefix(24))
      
      // 如果不足24位，用0补齐（理论上SHA256有64位十六进制，不会发生）
      return fullId.padding(toLength: 24, withPad: "0", startingAt: 0)
  }
  
}
