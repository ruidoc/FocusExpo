## FocusOne iOS 技术对齐文档（TDD）

> 面向工程与测试，严格对齐《FocusOne iOS 产品需求文档（PRD）》。平台：iOS 16+；框架：React Native 0.79.2 + Expo；仅包含实现必要的技术细节与验证项。

### 1. 技术目标
- 实现 PRD 的一次性专注、周期计划、暂停/恢复、拦截页、通知与状态恢复等能力。
- 保持实现与系统公开 API 合规；可观测、可回归；App 冷启动可恢复状态。

### 2. 高层架构
- RN 应用（JS）：路由与 UI、状态管理（MobX）、权限引导、埋点与本地存储。
- iOS 原生主 App：桥接接口暴露（`NativeModule`），执行选择器、专注调度、状态查询与事件上报。
- 扩展：
  - `MonitorExtension`：周期性计划调度、事件上报、warning 提前清理（对齐“有效时长”体验）。
  - `ShieldExtension`：拦截页 UI，展示“总时长 X 分钟，HH:mm 结束”。
  - `ReportExtension`：数据展示（如无明确需求，可保留占位）。

### 3. 关键依赖（需确认）
- FamilyControls：目标选择（App/网站/类别）。
- DeviceActivity：专注调度（一次性与周期）。
- ManagedSettings / ManagedSettingsUI：屏蔽与拦截页。
- App Group：主 App 与扩展的共享存储标识为 `group.com.focusone`（需与项目一致）。

### 4. JS ↔ 原生桥接接口（草案）
- `selectAppsToLimit(): Promise<SelectionSummary>`
  - 打开系统选择器；返回所选目标的存档摘要（hash/数量/时间）。
- `startAppLimits(payload: { minutes: number }): Promise<{ startedAt:number, endAt:number }>`
  - 一次性专注启动；需处理 <15 分钟的有效时长策略（原生调度 15 分钟 + warning 提前清理）。
- `stopAppLimits(): Promise<void>`
  - 结束一次性专注并清理屏蔽。
- `pauseAppLimits(payload: { minutes: number }): Promise<{ resumeAt:number }>`
  - 暂停当前专注，清空屏蔽，到点恢复。
- `configurePlannedLimits(plans: PlanCfg[]): Promise<void>`
  - 同步周期计划至原生：多条 schedule，命名/ID 用于回溯。
- `getFocusStatus(): Promise<FocusStatus>`
  - 返回是否专注中、剩余时间、暂停至何时、当前计划名称等。

类型约定（示意）：
```ts
type SelectionSummary = { count: number; appTokenHashes: string[] };
type FocusStatus = { active: boolean; startedAt?: number; endAt?: number; pausedUntil?: number; type: 'once'|'periodic'|null; scheduleName?: string };
type PlanCfg = { id: string; name?: string; startSecond: number; endSecond: number; repeatDays: number[] };
```

### 5. 共享数据（App Group）
- Key 列表（遵循 PRD 状态恢复诉求）：
  - `FocusStartAt:number`
  - `FocusEndAt:number`
  - `TotalMinutes:number`
  - `FocusType:'once'|'periodic'`
  - `PausedUntil:number|null`
  - `AppSelection:Data`（系统 Token 序列化）
  - `PlannedConfigs:Data`（周期计划编排数据）
  - `ActiveScheduleNames:string[]`
  - `LastFocusEvent:{ type:string; ts:number; payload?:any }`

### 6. 关键流程（实现要点）
1) 一次性专注
   - JS 调用 `startAppLimits({ minutes })` → 原生：
     - 读取缓存的选择目标；应用屏蔽；设置结束调度；写入 App Group 状态。
     - 若 minutes < 15：设置 15 分钟调度；在 `warning` 回调提前清理，使“有效时长”= 用户选择。
   - JS 订阅事件/轮询 `getFocusStatus()`，用于倒计时与 UI 更新；结束时清理状态并发通知。
2) 周期计划
   - JS 生成 `PlanCfg[]` → `configurePlannedLimits`；由 `MonitorExtension` 的 `intervalDidStart/End` 应用/清理。
   - 并计划策略：同一时段合并目标（以选择缓存作为统一集合）。
3) 暂停/恢复
   - JS 调用 `pauseAppLimits({ minutes })` → 原生：写入 `PausedUntil`，立即清空屏蔽；到点恢复并清空 `PausedUntil`。
4) 拦截页（Shield）
   - 展示文案：“已被屏蔽；总时长 X 分钟，HH:mm 结束”（与 PRD 文案保持一致）。
5) 通知
   - 开始/结束：本地通知；周期计划开始时给统一提示。
6) 状态恢复
   - App 冷启动或杀进程后，JS 首屏调用 `getFocusStatus()` 与 App Group 同步，恢复 UI。

### 7. 事件与埋点（最小集）
- 原生 → JS 事件（通过 RCTEventEmitter 或共享状态 + 定时轮询）：
  - `focus-started { type }`
  - `focus-progress { minute }`
  - `focus-paused { until }`
  - `focus-resumed`
  - `focus-ended { reason?: 'finished'|'manual' }`
- 埋点：
  - `focus_start { type, minutes }`
  - `focus_end { result, elapsed }`
  - `permission_status { screenTime }`

### 8. 权限与首启引导
- 必需：屏幕使用时间（Screen Time）授权；未授权时拦截开始操作并提示前往开启。
- 建议：通知权限；用于开始/结束提醒。

### 9. 端到端测试用例（覆盖 PRD 验收）
1) 一次性专注（5 分钟）
   - 期望：倒计时与结束通知准确；小于 15 分钟时“有效时长”策略正确。
2) 周期计划
   - 到点自动开始/结束；收到通知；UI 状态与计划名称一致。
3) 暂停与恢复
   - 暂停 3 分钟：期间不屏蔽；到点自动恢复；最终按原结束时间结束。
4) 拦截页文案
   - 打开被屏蔽 App 时显示“总时长 X 分钟，HH:mm 结束”。
5) 冷启动恢复
   - 杀进程/重启后，`getFocusStatus()` 恢复正确状态与倒计时。

### 10. 性能与稳定性目标
- 启动一次性专注：≤ 300ms 内完成 “设置屏蔽 + 调度 + 写入状态”。
- 事件可靠性：结束/暂停/恢复事件 100% 写入 App Group，JS 能在 2s 内感知。

### 11. 不确定与需要验证
- 屏蔽能力边界：系统不可控的 App/域名集合清单（用于产品文案说明）。
- 跨日：当前按 23:59 兜底，后续是否拆段为两个日程。
- 会员/IAP：是否进入本版本；若进入，桥接与后端契约需另行评审。

### 12. 上线与配置
- 目标与 Bundle：`FocusOne` 主 App；扩展：`MonitorExtension`、`ShieldExtension`、`ReportExtension`。
- App Group：`group.com.focusone`（与项目配置一致）。
- 证书与描述文件：沿用已有配置，扩展 target 独立 profile 保持有效。

---
本 TDD 与《iOS PRD》一致，仅包含为落地所需的实现细节与验证项；后续若 PRD变更（文案或流程），以 PRD 最新版本为准并同步更新此文档。

