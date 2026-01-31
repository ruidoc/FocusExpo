基于项目代码和 Apple 官方 API，详细说明 `DeviceActivityReport` 和 `DeviceActivityMonitor` 分别能拿到什么数据：

## DeviceActivityReport（报告扩展）

### 能获取的数据类型
- **DeviceActivityResults<DeviceActivityData>**：这是核心数据结构
- **activitySegments**：活动时间段数组，每个段包含：
  - `totalActivityDuration`：总活动时长
  - `applicationTokens`：应用标识符
  - `categoryTokens`：应用分类标识符
  - `webDomainTokens`：网站域名标识符
  - `dateInterval`：时间区间

### 实际能拿到的具体数据

**可扩展获取的数据**：
- 按应用分组的详细使用时长
- 按时间段的使用模式
- 应用分类使用统计
- 网站访问时长（如果监控了网站）

### 限制
- **只能获取"使用时长"数据**，不是"屏蔽统计"
- 数据是系统统计的"实际使用时间"，不是"被屏蔽的时间"
- 需要用户授权 Screen Time 权限

## DeviceActivityMonitor（监控扩展）

### 能获取的事件类型
从你的代码可以看到已实现的方法：

1. **intervalDidStart(for activity: DeviceActivityName)**
   - 监控区间开始事件
   - 你的代码中用于启动屏蔽设置

2. **intervalDidEnd(for activity: DeviceActivityName)**
   - 监控区间结束事件
   - 你的代码中用于清理屏蔽设置

3. **eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName)**
   - 达到阈值事件（未实现具体逻辑）

4. **intervalWillStartWarning(for activity: DeviceActivityName)**
   - 区间开始前警告（未实现）

5. **intervalWillEndWarning(for activity: DeviceActivityName)**
   - 区间结束前警告（已实现，用于提前清理）

### 实际能拿到的数据
- **事件触发时机**：知道什么时候开始/结束监控
- **活动名称**：`DeviceActivityName` 标识符
- **事件名称**：`DeviceActivityEvent.Name` 标识符
- **时间戳**：通过 `Date()` 获取

### 限制
- **不提供使用统计数据**，只提供事件回调
- **不提供屏蔽统计**，需要自己记录
- 主要用于"触发动作"，不是"获取数据"

## ShieldConfiguration（屏蔽配置）

### 能获取的数据：

- **application.localizedDisplayName**：应用本地化显示名称（如"微信"、"抖音"）
- **application.bundleIdentifier**：应用包标识符（如"com.tencent.xin"）
- **category**：应用分类信息（如果通过分类屏蔽）

### 主要作用是：

- **配置屏蔽界面**：决定屏蔽页面显示什么内容
- **获取被屏蔽对象信息**：知道正在屏蔽哪个应用/网站
- **读取共享状态**：从 App Group 读取计划信息

## 关键结论

### 对于"屏蔽统计"需求
- **DeviceActivityReport**：只能拿到"使用时长"，无法直接获取"屏蔽次数/屏蔽时长"
- **DeviceActivityMonitor**：只能拿到"事件触发时机"，需要自己记录屏蔽会话

### 你的项目现状
从代码看，你已经：
- 在 `intervalDidStart` 中启动屏蔽
- 在 `intervalDidEnd` 中清理屏蔽
- 通过 Darwin 通知与主应用通信
- 使用 App Group 共享状态

### 要获取屏蔽统计，需要自己实现
- 在 `intervalDidStart` 记录屏蔽开始时间
- 在 `intervalDidEnd` 记录屏蔽结束时间
- 计算屏蔽时长 = 结束时间 - 开始时间
- 记录屏蔽次数（每次 `intervalDidStart` 调用算一次）

**系统不会自动提供"屏蔽统计"，只能提供"使用统计"和"事件回调"**。