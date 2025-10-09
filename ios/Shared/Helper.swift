import Foundation
import FamilyControls
import ManagedSettings

/// 应用选择辅助类 - 用于主 App 和扩展间共享应用选择逻辑
class Helper {
    
    /// 从应用标识符数组构建 FamilyActivitySelection
    /// - Parameter apps: 应用标识符数组，格式为 "stableId:type"
    /// - Returns: 构建好的 FamilyActivitySelection，如果失败返回 nil
    static func buildSelectionFromApps(_ apps: [String]) -> FamilyActivitySelection? {
        guard let defaults = UserDefaults(suiteName: "group.com.focusone") else {
            print("【应用选择错误】无法获取 UserDefaults")
            return nil
        }
        
        // 1. 从 apps 中提取 stableIds
        let stableIds = apps.compactMap { appString in
            let components = appString.components(separatedBy: ":")
            return components.count >= 2 ? components[0] : nil
        }
        
        guard !stableIds.isEmpty else {
            print("【应用选择】无有效应用标识符")
            return nil
        }
         
        // 2. 从 UserDefaults 读取 ios_all_apps 数据
        guard let iosAllAppsData = defaults.string(forKey: "ios_all_apps"),
              let data = iosAllAppsData.data(using: .utf8),
              let jsonArray = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            print("【应用选择错误】无法读取 ios_all_apps 数据")
            return nil
        }
        let iosAllApps = jsonArray
        
        // 3. 根据 stableId 筛选出对应的应用数据
        let filteredApps = iosAllApps.filter { app in
            guard let stableId = app["stableId"] as? String else { return false }
            return stableIds.contains(stableId)
        }
        
        guard !filteredApps.isEmpty else {
            print("【应用选择】未找到匹配的应用数据")
            return nil
        }
        
        // 4. 构建 FamilyActivitySelection
        var selection = FamilyActivitySelection()
        var successCount = 0
        
        for app in filteredApps {
            guard let tokenDataBase64 = app["tokenData"] as? String,
                  let tokenData = Data(base64Encoded: tokenDataBase64),
                  let type = app["type"] as? String else {
                print("【应用选择】应用数据不完整: \(app)")
                continue
            }
            
            do {
                switch type {
                case "application":
                    let token = try JSONDecoder().decode(ApplicationToken.self, from: tokenData)
                    selection.applicationTokens.insert(token)
                    successCount += 1
                    
                case "webDomain":
                    let token = try JSONDecoder().decode(WebDomainToken.self, from: tokenData)
                    selection.webDomainTokens.insert(token)
                    successCount += 1
                    
                case "category":
                    let token = try JSONDecoder().decode(ActivityCategoryToken.self, from: tokenData)
                    selection.categoryTokens.insert(token)
                    successCount += 1
                    
                default:
                    print("【应用选择】未知的应用类型: \(type)")
                    continue
                }
            } catch {
                print("【应用选择】Token 解码失败: \(error.localizedDescription)")
                continue
            }
        }
        
        print("【应用选择】成功构建选择，应用数量: \(selection.applicationTokens.count), 网站数量: \(selection.webDomainTokens.count), 类别数量: \(selection.categoryTokens.count)")
        return successCount > 0 ? selection : nil
    }
}

