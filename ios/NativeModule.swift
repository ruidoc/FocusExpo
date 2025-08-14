import Foundation
import React
@preconcurrency import DeviceActivity
import FamilyControls
import UIKit
import ManagedSettings
import SwiftUI

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
class NativeModule: NSObject {
  private let center = DeviceActivityCenter()
  private let activityName = DeviceActivityName("FocusOne.ScreenTime")
  
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
        DispatchQueue.main.async {
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
              onDismiss: { success in
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
          
          // 设置全屏呈现风格
          pickerViewController.modalPresentationStyle = .fullScreen
          
          // 获取顶层窗口并展示选择器
          if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
             let rootViewController = windowScene.windows.first?.rootViewController {
            rootViewController.present(pickerViewController, animated: true)
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
  
  // 开始限制选中的应用
  @objc
  func startAppLimits(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let selection = self.loadSelection() else {
      reject("NO_SELECTION", "没有选择需要限制的应用", nil)
      return
    }
    
    // 创建全天的时间表
    let schedule = DeviceActivitySchedule(
      intervalStart: DateComponents(hour: 0, minute: 0),
      intervalEnd: DateComponents(hour: 23, minute: 59),
      repeats: true
    )
    
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
    
    DispatchQueue.main.async {
      var appIcons = self.getSelectedAppDetails(from: selection)
      
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
