import Foundation

/// iOS 原生埋点工具类
/// 用于在 Extension 和 Native Module 中发送埋点到 PostHog
class Analytics {
  static let shared = Analytics()

  private let posthogHost = "https://us.i.posthog.com"
  private let groupSuite = "group.com.focusone"
  private let fallbackPostHogAPIKey = "phc_A4Pt2WQHEQLedNR9wyLMxSHrpdnOdUTCiR8LHNGT5QG"

  private init() {}

  /// 发送埋点事件到 PostHog
  /// - Parameters:
  ///   - event: 事件名称
  ///   - properties: 事件属性
  ///   - userId: 用户 ID（可选，不传则从 App Groups 读取）
  func track(
    event: String,
    properties: [String: Any] = [:],
    userId: String? = nil
  ) {
    let normalizedEvent = normalizeEventName(event)
    // 1. 获取 PostHog API Key
    guard let apiKey = getPostHogAPIKey(), !apiKey.isEmpty else {
      print("【Analytics】缺少 PostHog API Key，跳过埋点")
      return
    }

    // 2. 获取 user_id
    let finalUserId: String
    if let userId = userId {
      finalUserId = userId
    } else if let storedUserId = getUserId(), !storedUserId.isEmpty {
      finalUserId = storedUserId
    } else {
      print("【Analytics】缺少 user_id，跳过埋点: \(event)")
      return
    }

    // 3. 构造 PostHog 事件格式
    var finalProperties = properties
    finalProperties["distinct_id"] = finalUserId
    finalProperties["user_id"] = finalUserId
    finalProperties["app_version"] = getAppVersion()
    finalProperties["app_env"] = getAppEnv()
    finalProperties["platform"] = "ios"
    finalProperties["event_origin"] = isRunningInExtension() ? "ios_extension" : "ios_native"
    finalProperties["$lib"] = "ios-native"
    finalProperties["$lib_version"] = "1.0.0"
    finalProperties["timestamp"] = ISO8601DateFormatter().string(from: Date())

    let payload: [String: Any] = [
      "api_key": apiKey,
      "event": normalizedEvent,
      "properties": finalProperties,
      "timestamp": ISO8601DateFormatter().string(from: Date())
    ]

    // 4. 发送到 PostHog
    sendToPostHog(payload: payload)
  }

  // MARK: - Private Methods

  private func sendToPostHog(payload: [String: Any]) {
    guard let url = URL(string: "\(posthogHost)/capture/") else {
      print("【Analytics】Invalid PostHog URL")
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.timeoutInterval = 5.0

    do {
      request.httpBody = try JSONSerialization.data(withJSONObject: payload)

      let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
          print("【Analytics】发送失败: \(error.localizedDescription)")
        } else if let httpResponse = response as? HTTPURLResponse {
          if httpResponse.statusCode == 200 {
            print("【Analytics】✅ 事件已发送: \(payload["event"] ?? "")")
          } else {
            print("【Analytics】发送失败，状态码: \(httpResponse.statusCode)")
            if let data = data, let body = String(data: data, encoding: .utf8) {
              print("【Analytics】响应: \(body)")
            }
          }
        }
      }
      task.resume()

    } catch {
      print("【Analytics】JSON 序列化失败: \(error)")
    }
  }

  private func getPostHogAPIKey() -> String? {
    guard let defaults = UserDefaults(suiteName: groupSuite) else { return nil }
    return defaults.string(forKey: "posthog_api_key") ?? fallbackPostHogAPIKey
  }

  private func getUserId() -> String? {
    guard let defaults = UserDefaults(suiteName: groupSuite) else { return nil }
    return defaults.string(forKey: "user_id") ?? defaults.string(forKey: "device_id")
  }

  private func getAppVersion() -> String {
    if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
       !version.isEmpty {
      return version
    }
    return "unknown"
  }

  private func getAppEnv() -> String {
    guard let defaults = UserDefaults(suiteName: groupSuite) else {
      return "development"
    }

    let appEnv = defaults.string(forKey: "app_env") ?? "development"
    switch appEnv {
    case "production", "preview":
      return appEnv
    default:
      return "development"
    }
  }

  private func isRunningInExtension() -> Bool {
    Bundle.main.bundlePath.hasSuffix(".appex")
  }

  private func normalizeEventName(_ event: String) -> String {
    event.hasPrefix("focus_") ? event : "focus_\(event)"
  }
}
