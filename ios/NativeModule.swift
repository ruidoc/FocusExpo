import Foundation
import React
import DeviceActivity
import FamilyControls
import UIKit

@objc(NativeModule)
class NativeModule: NSObject {
  // 屏幕时间权限
  @objc
  func requestScreenTimePermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    // iOS 16及以上版本使用异步API
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
  
  // 你可以继续添加更多自定义方法
} 
