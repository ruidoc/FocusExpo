//
//  ShieldConfigurationExtension.swift
//  ShieldExtension
//
//  Created by 杨瑞 on 2025/6/4.
//

import ManagedSettings
import ManagedSettingsUI
import UIKit

// Override the functions below to customize the shields used in various situations.
// The system provides a default appearance for any methods that your subclass doesn't override.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return buildShieldConfiguration(app: application)
    }
    
    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return buildShieldConfiguration(app: application)
    }
    
    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        return buildShieldConfiguration(app: nil)
    }
    
    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return buildShieldConfiguration(app: nil)
    }

    private func buildShieldConfiguration(app: Application?) -> ShieldConfiguration {
        // 颜色统一使用白色
        var titleLabel = ShieldConfiguration.Label(text: "已被屏蔽", color: .label)
        var subtitleLabel = ShieldConfiguration.Label(text: "该应用已被屏蔽", color: .secondaryLabel)
        if let defaults = UserDefaults(suiteName: "group.com.focusone") {
            let startAt = defaults.double(forKey: "FocusOne.FocusStartAt")
            let endAt = defaults.double(forKey: "FocusOne.FocusEndAt")
            let total = defaults.integer(forKey: "FocusOne.TotalMinutes")
            if startAt > 0 && endAt > 0 && total > 0 {
                // 计算总时长（分钟）与结束时间
                let totalMin = total
                let endDate = Date(timeIntervalSince1970: endAt)
                let df = DateFormatter()
                df.dateFormat = "HH:mm"
                let endStr = df.string(from: endDate)
                // 文案：总时长 + 结束时间
                subtitleLabel = ShieldConfiguration.Label(
                    text: "总时长 \(totalMin) 分钟 · \(endStr) 结束",
                    color: .secondaryLabel
                )
            }
            if let app = app, let appName = app.localizedDisplayName, !appName.isEmpty {
                // 记录被屏蔽应用信息
                let storageKey = "FocusOne.BlockedApps"
                var blockedApps = defaults.dictionary(forKey: storageKey) as? [String: String] ?? [:]
                let appKey = String(app.hashValue)
                // subtitleLabel = ShieldConfiguration.Label(text: "数据已存储：\(appKey)" + appName, color: .secondaryLabel)
                blockedApps[appKey] = appName
                defaults.set(blockedApps, forKey: storageKey)
            }
        }

        let config = ShieldConfiguration(
            title: titleLabel,
            subtitle: subtitleLabel,
            primaryButtonLabel: ShieldConfiguration.Label(text: "知道了", color: .white),
            secondaryButtonLabel: nil
        )
        return config
    }
}
