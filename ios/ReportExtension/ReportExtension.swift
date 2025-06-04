//
//  ReportExtension.swift
//  ReportExtension
//
//  Created by 杨瑞 on 2025/6/4.
//

import DeviceActivity
import SwiftUI

@main
struct ReportExtension: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        // Create a report for each DeviceActivityReport.Context that your app supports.
        TotalActivityReport { totalActivity in
            TotalActivityView(totalActivity: totalActivity)
        }
        // Add more reports here...
    }
}
