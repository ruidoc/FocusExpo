## FocusOne iOS 技术对齐文档（TDD）

> 面向工程与测试，严格对齐《FocusOne iOS 产品需求文档（PRD）》。平台：iOS 16+；框架：React Native 0.79.2 + Expo；仅包含实现必要的技术细节与验证项。

### 1. 技术目标
- 实现 PRD 的一次性专注、周期计划、暂停/恢复、拦截页、通知与状态恢复等能力。
- 保持实现与系统公开 API 合规；可观测、可回归；App 冷启动可恢复状态。
- 自律币与结算、自动解锁与星航段位、挑战板块（平台派发）、内购（IAP）与埋点对齐 PRD。

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
- IAP：`expo-iap`（自律币充值，收据校验在客户端最小实现，后续可加服务端）。
- 本地存储：`AsyncStorage`（一般配置/钱包台账/挑战状态），必要字段可放 `SecureStore`。

### 4. JS ↔ 原生桥接接口
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

### JS 内部的状态和方法（不需要与原生交互）
- 钱包与币：
  - `wallet.getBalance(): Promise<number>`
  - `wallet.add(delta:number, reason: WalletReason): Promise<void>`（正负均可；本地台账写入；必要时加签名/校验）
  - `wallet.listTransactions(): Promise<WalletTx[]>`
- 打赌结算（JS 侧状态机，原生提供时间与事件）：
  - JS 在开始前校验余额与下注额度；结束/失败根据事件更新钱包。
- 挑战：
  - `challenge.list(): Promise<Challenge[]>`（平台下发静态配置，本地缓存）
  - `challenge.accept(id:string): Promise<void>`（校验余额并扣入场费，初始化进度）
  - `challenge.progress(id:string, delta:ChallengeDelta): Promise<void>`（由专注事件驱动）
  - `challenge.settle(id:string): Promise<ChallengeResult>`（成功发放永久/临时奖励；失败无奖励）
- 解锁与段位：
  - `unlock.getRank(): Promise<RankState>`（返回当前段位、上限、下一段位阈值差）
  - `unlock.recompute(windowDays=7): Promise<RankState>`（按 PRD 的 M7/SR7 规则重算；仅升级不降级，低成功率时冻结升级）

#### 类型约定：
```ts
export type WalletReason = 'bet_reward'|'bet_refund'|'bet_penalty'|'pause_fee'|'iap_purchase'|'challenge_entry'|'challenge_reward'|'rank_bonus';
export type WalletTx = { id:string; ts:number; delta:number; reason:WalletReason; note?:string };
export type Challenge = { id:string; title:string; requiredApps:string[]; goal:{ sessions?:number; minutes?:number; window?:{days:number, ranges?:{start:number,end:number}[]}}; entryCost:number; reward:{ type:'perm'|'temp'; appsDelta?:number; minutesDelta?:number; durationDays?:number } };
export type ChallengeDelta = { sessionFinished:boolean; minutes:number };
export type ChallengeResult = { success:boolean; rewardApplied?:boolean };
export type RankName = 'L0'|'L1'|'L2'|'L3'|'L4'|'L5';
export type RankState = { name:RankName; appsLimit:number; minutesLimit:number; next?:{ needM7:number; needSR7:number } };
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
  - `RankState:Data`（当前段位、上限、统计窗口 M7/SR7 快照）
  - `WalletBalance:number`
  - `WalletLedger:Data`（轻量流水，必要时只保留最近 N 条）
  - `Challenges:Data`（已领取挑战的本地进度与截止时间）

### 6. 关键流程（实现要点）
1) 一次性专注
   - JS 调用 `startAppLimits({ minutes })` → 原生：
     - 读取缓存的选择目标；应用屏蔽；设置结束调度；写入 App Group 状态。
     - 若 minutes < 15：设置 15 分钟调度；在 `warning` 回调提前清理，使“有效时长”= 用户选择。
   - JS 订阅事件/轮询 `getFocusStatus()`，用于倒计时与 UI 更新；结束时清理状态并发通知。
   - 下注与结算：
     - 开始前校验余额与下注额度；记录下注流水。
     - 结束触发：若成功，按 PRD 发放返还与奖励；若取消/违规，扣除下注并记录失败。
2) 周期计划
   - JS 生成 `PlanCfg[]` → `configurePlannedLimits`；由 `MonitorExtension` 的 `intervalDidStart/End` 应用/清理。
   - 并计划策略：同一时段合并目标（以选择缓存作为统一集合）。
3) 暂停/恢复
   - JS 调用 `pauseAppLimits({ minutes })` → 原生：写入 `PausedUntil`，立即清空屏蔽；到点恢复并清空 `PausedUntil`。
   - 扣费：暂停触发扣费流水（≤3 分钟不判负）。
4) 拦截页（Shield）
   - 展示文案：“已被屏蔽；总时长 X 分钟，HH:mm 结束”（与 PRD 文案保持一致）。
5) 通知
   - 开始/结束：本地通知；周期计划开始时给统一提示。
6) 自动解锁与段位
   - 近 7 天统计正确；达阈值后上限更新且不降级；SR7 过低时冻结升级生效。
7) 挑战链路
   - 领取→入场扣币→进度累计→成功发放永久/临时奖励→上限即时更新；失败仅记录。
8) 钱包与 IAP
   - 充值到账与流水；下注返还/扣除、暂停扣费流水准确；断网恢复后账本一致。

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
  - `wallet_change { delta, reason }`
  - `rank_recompute { m7, sr7, rank }`
  - `challenge_accept { id, entryCost }`
  - `challenge_progress { id, progress }`
  - `challenge_settle { id, success, reward }`

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
- 星航段位阈值：首发按 PRD；观察 2 周后可动态下发微调（A/B）。
- 挑战返还 50% 开关：默认关闭，需经实验评估对留存与口碑的影响。

### 12. 上线与配置
- 目标与 Bundle：`FocusOne` 主 App；扩展：`MonitorExtension`、`ShieldExtension`、`ReportExtension`。
- App Group：`group.com.focusone`（与项目配置一致）。
- 证书与描述文件：沿用已有配置，扩展 target 独立 profile 保持有效。

---
本 TDD 与《iOS PRD》一致，仅包含为落地所需的实现细节与验证项；后续若 PRD变更（文案或流程），以 PRD 最新版本为准并同步更新此文档。

