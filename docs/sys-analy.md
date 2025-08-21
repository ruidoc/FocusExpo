## 实现概览

IOS 使用 Screen Time 能力：

- DeviceActivity 调度
- ManagedSettings 屏蔽
- ManagedSettingsUI 屏蔽界面
- FamilyControls 选择目标 APP。

共享数据状态：

- 通过 App Group `group.com.focusone` 的 UserDefaults 在主 App 与扩展间传递。

事件与进度：

- 主进程用 `RCTEventEmitter` 定时上报
- 扩展通过写入 `LastFocusEvent` 通知主进程转发到 JS。
