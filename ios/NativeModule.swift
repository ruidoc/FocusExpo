import Foundation
import React
@preconcurrency import DeviceActivity
import FamilyControls
import UIKit
import ManagedSettings
import SwiftUI
import UserNotifications

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
  private var stateTimer: Timer?
  private var endTimestamp: TimeInterval = 0
  private var totalMinutes: Int = 0
  private var pausedUntil: TimeInterval = 0
  // Event Emitter
  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! {
    return ["focus-ended", "focus-state"]
  }
  override func startObserving() {
    hasListeners = true
    NotificationCenter.default.addObserver(self, selector: #selector(appWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleStopProgress), name: NSNotification.Name("FocusOne.StopProgress"), object: nil)
    // 轮询扩展写入的统一事件，确保前台也能及时收到
    stateTimer?.invalidate()
    stateTimer = Timer.scheduledTimer(withTimeInterval: 3, repeats: true, block: { [weak self] _ in
      guard let self = self else { return }
      if let defaults = UserDefaults.groupUserDefaults() {
        if let ev = defaults.string(forKey: "FocusOne.LastFocusEvent") {
          defaults.removeObject(forKey: "FocusOne.LastFocusEvent")
          self.emitState(ev)
        }
      }
    })
    if let t = stateTimer { RunLoop.main.add(t, forMode: .common) }
  }
  override func stopObserving() {
    hasListeners = false
    NotificationCenter.default.removeObserver(self)
    invalidateTimer()
    stateTimer?.invalidate()
    stateTimer = nil
  }
  @objc private func appWillEnterForeground() {
    guard endTimestamp > 0 else { return }
    if Date().timeIntervalSince1970 >= endTimestamp {
      emitEnded()
      invalidateTimer()
    } else {
      emitProgress()
    }
    if let defaults = UserDefaults.groupUserDefaults() {
      if let ev = defaults.string(forKey: "FocusOne.LastFocusEvent") {
        defaults.removeObject(forKey: "FocusOne.LastFocusEvent")
        emitState(ev)
      }
    }
  }
  @objc private func handleStopProgress() {
    emitEnded()
    invalidateTimer()
  }
  private func restartTimer() {
    // 已移除进度事件，不再启动定时器
    invalidateTimer()
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
    if !hasListeners { return }
    sendEvent(withName: "focus-ended", body: [
      "totalMinutes": totalMinutes,
      "elapsedMinutes": totalMinutes,
    ])
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
  // plansJSON: [{ id, start: 秒, end: 秒, repeatDays: [1..7], mode }]
  // 说明：repeatDays 约定 1=周一 ... 7=周日；将转换为 iOS Calendar.weekday (1=周日 ... 7=周六)
  @objc
  func configurePlannedLimits(_ plansJSON: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    struct PlanCfg: Codable {
      let id: String
      let start: Int
      let end: Int
      let repeatDays: [Int]?
      let mode: String?
    }
    func mondayFirstToAppleWeekday(_ day: Int) -> Int {
      // 输入：1..7 (周一..周日)  -> 输出：1..7 (周日..周六)
      if day == 7 { return 1 }
      return day + 1
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
      let days = (p.repeatDays?.isEmpty == false) ? p.repeatDays! : [1,2,3,4,5,6,7]
      for d in days {
        let wd = mondayFirstToAppleWeekday(d)
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
  @objc
  func selectAppsToLimit(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        // 确保已获取权限
        if AuthorizationCenter.shared.authorizationStatus != .approved {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        }
        
        // 在主线程显示应用选择器
        DispatchQueue.main.async { [weak self] in
          guard let self = self else {
            resolve(["success": false])
            return
          }
          // 创建自定义选择器，默认带入上一次保存的选择
          var selection = self.loadSelection() ?? FamilyActivitySelection()
          
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
              }
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
      // 停止之前的监控
      center.stopMonitoring()
      
      // 开始新的监控
      try center.startMonitoring(
        activityName,
        during: schedule,
        events: [eventName: event]
      )
      
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
      }
      self.restartTimer()
      self.emitProgress()
      self.emitState("started", extra: ["type": "once"]) 
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
    center.stopMonitoring()
    
    // 清除所有限制
    let store = ManagedSettingsStore()
    store.clearAllSettings()
    emitEnded()
    invalidateTimer()
    pausedUntil = 0
    emitState("ended")
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.removeObject(forKey: "FocusOne.FocusStartAt")
      defaults.removeObject(forKey: "FocusOne.FocusEndAt")
      defaults.removeObject(forKey: "FocusOne.TotalMinutes")
      defaults.removeObject(forKey: "FocusOne.FocusType")
      defaults.removeObject(forKey: "FocusOne.CurrentPlanId")
    }
    
    resolve(true)
  }

  // 查询当前屏蔽状态与进度
  @objc
  func getFocusStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults.groupUserDefaults() else {
      resolve(["active": false])
      return
    }
    let startAt = defaults.double(forKey: "FocusOne.FocusStartAt")
    let endAt = defaults.double(forKey: "FocusOne.FocusEndAt")
    let total = defaults.integer(forKey: "FocusOne.TotalMinutes")

    // 若没有一次性/周期任务的时间信息，则认为未激活
    if startAt <= 0 || endAt <= 0 || total <= 0 {
      resolve(["active": false])
      return
    }

    let now = Date().timeIntervalSince1970
    // 按整分对齐：以“分钟桶”计算，确保在每个自然分钟边界（秒=0）才变更
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

    // 暂停：当仍在专注窗口，但系统未在屏蔽（清空了 ManagedSettings）
    let paused = inWindow && !isShielding

    // 业务上的 active：在窗口内即为 true，即使暂停中也为 true
    let active = inWindow

    let ftype = defaults.string(forKey: "FocusOne.FocusType")
    let pu = defaults.double(forKey: "FocusOne.PausedUntil")

    // 计算当前命中的周期计划的 plan_id
    var planId: String? = nil
    if ftype == "periodic", let cfgStr = defaults.string(forKey: "FocusOne.PlannedConfigs"), let cfgData = cfgStr.data(using: .utf8) {
      struct PlanCfg: Codable { let id: String; let start: Int; let end: Int; let repeatDays: [Int]? }
      if let cfgs = try? JSONDecoder().decode([PlanCfg].self, from: cfgData) {
        let cal = Calendar.current
        let comp = cal.dateComponents([.weekday, .hour, .minute], from: Date())
        let weekdayApple = comp.weekday ?? 1 // 1=周日
        // 转换为 1=周一..7=周日
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

    resolve([
      "active": active,
      "paused": paused,
      "plan_id": planId ?? NSNull(),
      "startAt": startAt,
      "endAt": endAt,
      "totalMinutes": total,
      "elapsedMinutes": elapsedMin,
      "focusType": ftype ?? NSNull(),
      "pausedUntil": pu > 0 ? pu : NSNull()
    ])
  }

  // 暂停当前屏蔽（分钟数可选；不传表示暂停剩余全时长；不超过任务总长度）
  @objc
  func pauseAppLimits(_ durationMinutes: NSNumber?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let now = Date().timeIntervalSince1970
    // 已在暂停中：直接无效返回
    if pausedUntil > now {
      resolve(false)
      return
    }
    // 计算有效的结束时间：优先一次性任务的 endTimestamp；否则尝试匹配当前周期计划窗口
    var effectiveEnd: TimeInterval = 0
    if endTimestamp > now {
      effectiveEnd = endTimestamp
    } else if let window = currentPlannedWindow() {
      if now >= window.start && now < window.end {
        effectiveEnd = window.end
      }
    }
    guard effectiveEnd > now else { resolve(false); return }
    let remainingSec = effectiveEnd - now
    var pauseSec: Double
    if let dm = durationMinutes?.doubleValue {
      pauseSec = min(Double(dm) * 60.0, remainingSec)
    } else {
      pauseSec = remainingSec
    }
    pausedUntil = now + pauseSec
    // 暂停期间清空屏蔽
    let store = ManagedSettingsStore()
    store.clearAllSettings()
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.set(pausedUntil, forKey: "FocusOne.PausedUntil")
      defaults.set("paused", forKey: "FocusOne.LastFocusEvent")
    }
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
    if let data = UserDefaults.groupUserDefaults()?.data(forKey: "FocusOne.AppSelection"),
       let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
      selection = sel
    }
    if endTimestamp > now {
      canResume = true
    } else if let window = currentPlannedWindow() {
      if now >= window.start && now < window.end { canResume = true }
    }
    guard canResume, let sel = selection else {
      resolve(false)
      return
    }
    // 恢复屏蔽设置
    let store = ManagedSettingsStore()
    store.shield.applications = sel.applicationTokens
    store.shield.applicationCategories = sel.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(sel.categoryTokens)
    store.shield.webDomains = sel.webDomainTokens
    pausedUntil = 0
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.set(0, forKey: "FocusOne.PausedUntil")
      defaults.set("resumed", forKey: "FocusOne.LastFocusEvent")
    }
    emitState("resumed")
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
    // 转换为 1=周一..7=周日
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
  
  // 渲染所有选择的应用Label为图片并返回base64数组
  @objc
  func renderAppLabelToImage(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    // 从UserDefaults获取已保存的应用选择
    guard let selection = self.loadSelection() else {
      reject("NO_SELECTION", "没有选择需要限制的应用", nil)
      return
    }
    
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      let appIcons = self.getSelectedAppDetails(from: selection)
      resolve(appIcons)
    }
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
          
          let appIcon: [String: Any] = [
            "id": "\(token.hashValue)",
            "name": "应用",
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
          let webIcon: [String: Any] = [
            "id": "\(token.hashValue)",
            "name": "网站",
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
          
          let categoryIcon: [String: Any] = [
            "id": "\(token.hashValue)",
            "name": "应用类别",
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
  

}
