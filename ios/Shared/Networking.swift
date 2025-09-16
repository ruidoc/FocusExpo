import Foundation

struct FocusNetworking {
  static let groupSuite = "group.com.focusone"
  static let baseURLKey = "FocusOne.ApiBaseURL"
  static let tokenKey = "access_token"

  static func request(
    method: String,
    path: String,
    jsonBody: [String: Any]? = nil,
    headers: [String: String]? = nil,
    timeout: TimeInterval = 12,
    completion: @escaping (Result<(Data?, HTTPURLResponse), Error>) -> Void
  ) {
    // 优先从 Storage 读取（MMKV，支持与扩展共享）；兼容性：若无则回退 App Group
    let base = Storage.shared.getItem(forKey: baseURLKey) ?? UserDefaults(suiteName: groupSuite)?.string(forKey: baseURLKey)
    guard let baseURL = base, let url = URL(string: baseURL + path) else {
      completion(.failure(NSError(domain: "FocusNetworking", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid BaseURL or URL"])));
      return
    }
    var req = URLRequest(url: url, timeoutInterval: timeout)
    req.httpMethod = method
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.setValue("ios", forHTTPHeaderField: "os")
    let token = Storage.shared.getItem(forKey: tokenKey) ?? UserDefaults(suiteName: groupSuite)?.string(forKey: tokenKey)
    if let token = token, !token.isEmpty { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
    if let headers = headers {
      for (k, v) in headers { req.setValue(v, forHTTPHeaderField: k) }
    }
    if let body = jsonBody, JSONSerialization.isValidJSONObject(body) {
      req.httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])
    }
    let config = URLSessionConfiguration.ephemeral
    config.waitsForConnectivity = true
    let session = URLSession(configuration: config)
    let task = session.dataTask(with: req) { data, resp, err in
      if let err = err {
        completion(.failure(err))
        return
      }
      guard let http = resp as? HTTPURLResponse else {
        completion(.failure(NSError(domain: "FocusNetworking", code: -2, userInfo: [NSLocalizedDescriptionKey: "No HTTPURLResponse"])));
        return
      }
      completion(.success((data, http)))
    }
    task.resume()
  }

  static func post(
    path: String,
    body: [String: Any]? = nil,
    headers: [String: String]? = nil,
    completion: @escaping (_ ok: Bool, _ status: Int?) -> Void
  ) {
    request(method: "POST", path: path, jsonBody: body, headers: headers) { result in
      switch result {
      case .success((_, let http)):
        completion((200...299).contains(http.statusCode), http.statusCode)
      case .failure:
        completion(false, nil)
      }
    }
  }
}


