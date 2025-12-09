import Foundation

// MARK: - 网络响应模型
struct APIResponse {
  let data: Data?
  let statusCode: Int
  let headers: [AnyHashable: Any]
  
  func json() -> [String: Any]? {
    guard let data = data else { return nil }
    return try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
  }
}

// MARK: - 网络请求错误
enum NetworkError: Error {
  case invalidURL
  case noResponse
  case unauthorized
  case serverError(Int, String?)
  case networkError(Error)
  
  var localizedDescription: String {
    switch self {
    case .invalidURL:
      return "Invalid URL"
    case .noResponse:
      return "No response"
    case .unauthorized:
      return "Unauthorized"
    case .serverError(let code, let message):
      return message ?? "Server error (\(code))"
    case .networkError(let error):
      return error.localizedDescription
    }
  }
}

// MARK: - 网络请求管理器
class NetworkManager {
  static let shared = NetworkManager()
  
  private let groupSuite = "group.com.focusone"
  private let baseURLKey = "http_base_url"
  private let tokenKey = "access_token"
  private let defaultBaseURL = "https://focusone.ruidoc.cn/dev-api"
  private let session: URLSession
  
  private init() {
    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = 6.0
    config.timeoutIntervalForResource = 6.0
    config.waitsForConnectivity = true
    self.session = URLSession(configuration: config)
  }
  
  // MARK: - 请求拦截器
  private func prepareRequest(
    method: String,
    path: String,
    jsonBody: [String: Any]? = nil,
    headers: [String: String]? = nil
  ) -> URLRequest? {
    // 获取 baseURL
    let baseURL = getBaseURL()
    guard let url = URL(string: baseURL + path) else {
      print("【网络请求错误】Invalid URL: \(baseURL + path)")
      return nil
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = method
    
    // 设置默认请求头
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("ios", forHTTPHeaderField: "os")
    
    // 添加 Authorization 头
    if let token = getAccessToken(), !token.isEmpty {
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
    
    // 添加自定义请求头
    if let headers = headers {
      for (key, value) in headers {
        request.setValue(value, forHTTPHeaderField: key)
      }
    }
    
    // 处理请求体
    if let body = jsonBody {
      if JSONSerialization.isValidJSONObject(body) {
        request.httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])
      }
    }
    
    // 打印请求信息
    print("【网络请求】\(method) \(path)")
    
    return request
  }
  
  // MARK: - 响应拦截器
  private func handleResponse(
    data: Data?,
    response: URLResponse?,
    error: Error?,
    completion: @escaping (Result<APIResponse, NetworkError>) -> Void
  ) {
    // 处理网络错误
    if let error = error {
      print("【请求错误】Network error: \(error.localizedDescription)")
      completion(.failure(.networkError(error)))
      return
    }
    
    guard let httpResponse = response as? HTTPURLResponse else {
      print("【请求错误】No HTTP response")
      completion(.failure(.noResponse))
      return
    }
    
    let apiResponse = APIResponse(
      data: data,
      statusCode: httpResponse.statusCode,
      headers: httpResponse.allHeaderFields
    )
    
    // 处理 HTTP 状态码
    switch httpResponse.statusCode {
    case 200...299:
      // 成功响应
      completion(.success(apiResponse))
      
    case 401:
      // 未授权 - 暂时只打印，不处理登录逻辑
      print("【请求错误】401 Unauthorized - 登录已过期")
      if let json = apiResponse.json() {
        print("【错误详情】\(json)")
      }
      completion(.failure(.unauthorized))
      
    default:
      // 其他错误
      var errorMessage: String?
      if let json = apiResponse.json() {
        errorMessage = json["message"] as? String
        print("【请求错误】\(httpResponse.statusCode) \(json)")
      } else {
        print("【请求错误】\(httpResponse.statusCode)")
      }
      completion(.failure(.serverError(httpResponse.statusCode, errorMessage)))
    }
  }
  
  // MARK: - 公共请求方法
  func request(
    method: String,
    path: String,
    jsonBody: [String: Any]? = nil,
    headers: [String: String]? = nil,
    completion: @escaping (Result<APIResponse, NetworkError>) -> Void
  ) {
    guard let request = prepareRequest(
      method: method,
      path: path,
      jsonBody: jsonBody,
      headers: headers
    ) else {
      completion(.failure(.invalidURL))
      return
    }
    
    let task = session.dataTask(with: request) { [weak self] data, response, error in
      self?.handleResponse(data: data, response: response, error: error, completion: completion)
    }
    
    task.resume()
  }
  
  // MARK: - 便捷方法
  func get(
    path: String,
    headers: [String: String]? = nil,
    completion: @escaping (Result<APIResponse, NetworkError>) -> Void
  ) {
    request(method: "GET", path: path, headers: headers, completion: completion)
  }
  
  func post(
    path: String,
    body: [String: Any]? = nil,
    headers: [String: String]? = nil,
    completion: @escaping (Result<APIResponse, NetworkError>) -> Void
  ) {
    request(method: "POST", path: path, jsonBody: body, headers: headers, completion: completion)
  }
  
  func put(
    path: String,
    body: [String: Any]? = nil,
    headers: [String: String]? = nil,
    completion: @escaping (Result<APIResponse, NetworkError>) -> Void
  ) {
    request(method: "PUT", path: path, jsonBody: body, headers: headers, completion: completion)
  }
  
  func delete(
    path: String,
    headers: [String: String]? = nil,
    completion: @escaping (Result<APIResponse, NetworkError>) -> Void
  ) {
    request(method: "DELETE", path: path, headers: headers, completion: completion)
  }
  
  // MARK: - 辅助方法
  private func getBaseURL() -> String {
    // 从 App Group 读取
    if let appGroup = UserDefaults(suiteName: groupSuite)?.string(forKey: baseURLKey) {
      return appGroup
    }
    return defaultBaseURL
  }
  
  private func getAccessToken() -> String? {
    // 从 App Group 读取
    return UserDefaults(suiteName: groupSuite)?.string(forKey: tokenKey)
  }
}

// MARK: - 全局实例（类似 JS 中的 instance）
let instance = NetworkManager.shared

