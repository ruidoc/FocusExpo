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
  private var hasListeners: Bool = false
  private var tickTimer: Timer?
  private var endTimestamp: TimeInterval = 0
  private var totalMinutes: Int = 0
  private var pausedUntil: TimeInterval = 0
  // Event Emitter
  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! {
    return ["focus-progress", "focus-ended"]
  }
  override func startObserving() {
    hasListeners = true
    NotificationCenter.default.addObserver(self, selector: #selector(appWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleStopProgress), name: NSNotification.Name("FocusOne.StopProgress"), object: nil)
  }
  override func stopObserving() {
    hasListeners = false
    NotificationCenter.default.removeObserver(self)
    invalidateTimer()
  }
  @objc private func appWillEnterForeground() {
    guard endTimestamp > 0 else { return }
    if Date().timeIntervalSince1970 >= endTimestamp {
      emitEnded()
      invalidateTimer()
    } else {
      emitProgress()
    }
  }
  @objc private func handleStopProgress() {
    emitEnded()
    invalidateTimer()
  }
  private func restartTimer() {
    invalidateTimer()
    guard totalMinutes > 0, endTimestamp > 0 else { return }
    tickTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true, block: { [weak self] _ in
      self?.emitProgress()
    })
    if let t = tickTimer {
      RunLoop.main.add(t, forMode: .common)
    }
  }
  private func invalidateTimer() {
    tickTimer?.invalidate()
    tickTimer = nil
  }
  private func emitProgress() {
    if !hasListeners { return }
    guard totalMinutes > 0, endTimestamp > 0 else { return }
    let now = Date().timeIntervalSince1970
    // 暂停期内不推进已用分钟数
    if pausedUntil > now { return }
    let elapsedSeconds = max(0, Int(endTimestamp - now) * -1)
    let elapsedMinutes = max(0, min(totalMinutes, elapsedSeconds / 60))
    sendEvent(withName: "focus-progress", body: [
      "totalMinutes": totalMinutes,
      "elapsedMinutes": elapsedMinutes,
    ])
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
        let schedule = DeviceActivitySchedule(
          intervalStart: DateComponents(hour: sh, minute: sm, weekday: wd),
          intervalEnd: DateComponents(hour: endH, minute: endM, weekday: wd),
          repeats: true
        )
        let name = "FocusOne.Schedule_\(idx)_\(d)_\(sh)_\(sm)_\(eh)_\(em)"
        do {
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
  func startAppLimits(_ durationMinutes: NSNumber, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
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
      }
      self.restartTimer()
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
    center.stopMonitoring()
    
    // 清除所有限制
    let store = ManagedSettingsStore()
    store.clearAllSettings()
    emitEnded()
    invalidateTimer()
    pausedUntil = 0
    if let defaults = UserDefaults.groupUserDefaults() {
      defaults.removeObject(forKey: "FocusOne.FocusStartAt")
      defaults.removeObject(forKey: "FocusOne.FocusEndAt")
      defaults.removeObject(forKey: "FocusOne.TotalMinutes")
      defaults.removeObject(forKey: "FocusOne.FocusType")
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
    if startAt <= 0 || endAt <= 0 || total <= 0 {
      resolve(["active": false])
      return
    }
    let now = Date().timeIntervalSince1970
    let elapsed = max(0, min(Double(total * 60), now - startAt))
    let elapsedMin = Int(elapsed / 60.0)
    let active = now < endAt
    let ftype = defaults.string(forKey: "FocusOne.FocusType")
    resolve([
      "active": active,
      "startAt": startAt,
      "endAt": endAt,
      "totalMinutes": total,
      "elapsedMinutes": elapsedMin,
      "focusType": ftype ?? NSNull(),
      "pausedUntil": pausedUntil > 0 ? pausedUntil : NSNull()
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
    guard endTimestamp > now else { resolve(false); return }
    let remainingSec = endTimestamp - now
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
    // 设置一个一次性定时器，到期后恢复屏蔽（仅一次性任务有效；周期任务由扩展 intervalDidStart 恢复）
    DispatchQueue.main.asyncAfter(deadline: .now() + pauseSec) { [weak self] in
      guard let self = self else { return }
      // 若任务仍未结束，则恢复屏蔽（一次性任务场景）
      let now2 = Date().timeIntervalSince1970
      guard self.endTimestamp > now2 else { return }
      self.pausedUntil = 0
      // 依据已保存选择恢复屏蔽
      if let data = UserDefaults.groupUserDefaults()?.data(forKey: "FocusOne.AppSelection"),
         let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
        let store = ManagedSettingsStore()
        store.shield.applications = sel.applicationTokens
        store.shield.applicationCategories = sel.categoryTokens.isEmpty ? nil : ShieldSettings.ActivityCategoryPolicy.specific(sel.categoryTokens)
        store.shield.webDomains = sel.webDomainTokens
      }
    }
    resolve(true)
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
