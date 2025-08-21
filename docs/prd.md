## 产品概述（FocusOne｜专注一点）
一个以“最少阻力的专注启动”为核心价值的跨平台专注辅助应用。通过 iOS 屏幕使用时间（Screen Time，FamilyControls + DeviceActivity + ManagedSettings）原生能力，对应用/网站/类别进行“临时专注”和“周期专注”限制；Android 侧以 VPN/可访问性为实现方向（当前仓库内处于占位与演进中）。

适配前提：
- iOS 16+（当前原生扩展与桥接基于此前提）
- React Native 0.79.2，Expo 框架

我对部分实现细节（如 Android 最终拦截形态、服务端接口契约）暂无法从仓库中完全确认，下文会清晰标注“需要验证”。

## 项目特点
- 原生屏幕时间深度接入：使用 FamilyActivityPicker 选择目标、DeviceActivityCenter 调度、ManagedSettings 实时屏蔽，并提供 Shield Extension 自定义拦截页。
- 极速一次性专注：Quick Start 支持一键设置分钟数并立即生效；小于 15 分钟场景通过 warningTime 提前清理实现“有效时长”。
- 周期任务自动化：支持按周几+时间段的周期性屏蔽配置，由扩展在 intervalDidStart/End 中自动接管与清理。
- 前后端解耦的计划管理：前端 MobX `PlanStore` 统一管理一次性/周期任务，iOS 通过 `configurePlannedLimits` 同步到原生扩展执行。
- 可暂停/自动恢复：支持暂停专注并在到点自动恢复屏蔽（利用二次 DeviceActivity 调度 PauseResume）。
- 视觉与反馈：开始/结束本地通知；Shield 页面可展示“总时长与结束时间”动态文案。

## 优势
- 原生合规：不依赖私有 API，完备利用 Screen Time 能力，风险低、可持续。
- 上手成本低：“选择 APP → 设置时长 → 开始”三步即用，阻力小。
- 可扩展的计划模型：一次性/周期任务抽象统一，后续易扩展如番茄钟、模板化场景。
- 细节打磨：15 分钟最小时长限制下的“有效时长”体验、跨日兜底、事件统一上报至 JS。

## 不足（当前版本）
- Android 拦截尚不完整：仓库内 VPN/可访问性能力为占位与注释，真实可用性“需要验证”。
- 跨日计划仅兜底至 23:59：未做跨日拆段（扩展中留有 TODO 思路）。
- 计划与服务端契约不明：`/plan/*` 接口与数据一致性“需要验证”。
- 进度与剩余时间在暂停期的 UI 提示与引导尚待完善（逻辑已具备）。

## 创新方向（可选路线）
- 智能动态专注：基于使用习惯学习（本地统计）自动建议“下次可能的专注时段与目标应用”。
- 任务驱动的番茄流：把“时间段”升级为“任务卡片”（目标、奖励、复盘），强化心理激励。
- 细粒度内容屏蔽：结合 WebDomainTokens 的分类黑/白名单，支持“仅屏蔽短视频域名”。
- 场景联动：日历/待办集成，日程开始自动触发专注，结束后回顾。
- 群体共专注：发起“共修房间”，一起开始/结束，成员互相守望（留存提升显著）。

## 商业化方向
- 订阅会员：
  - 高级计划（多个时段/跨日/模板/导入导出）
  - 共专注房间、专注声音/白噪声、进阶数据分析
  - iCloud 同步与多设备联动
- 企业/教育版授权：批量策略下发、合规报告、班级/团队共专注。
- 品牌联名挑战：与学习/效率品牌合作发起 7-21 天专注挑战。

## 目标用户与场景
- 目标用户：学生、独立工作者、程序员/设计师、自由创作者；家长监督（次优先）。
- 典型场景：
  - 冲刺 25-90 分钟高强度专注
  - 每晚 22:00-23:30 自习固定屏蔽娱乐
  - 会议/演讲时一键静噪与屏蔽干扰

## 版本目标（MVP）
- iOS：一次性专注、周期计划、应用/网站/类别选择、暂停/恢复、开始/结束通知、Shield UI。
- Android：最小可用版本“需要验证”，建议在 MVP 中明确仅提供 iOS 完整体验，Android 提供计划管理与占位说明。

## 详细功能需求
1) 快速开始（iOS 完整、Android 说明）
- 选择目标（FamilyActivityPicker）并缓存；选择分钟数；立即开始。
- 小于 15 分钟时：前端显示真实目标分钟，但原生以 15 分钟调度，并在 warningTime 阶段提前清理，确保体验贴合承诺的分钟数。
- 事件：focus-started、progress（每分钟）、paused、resumed、ended（本地/扩展均会上报，JS 聚合处理）。

2) 周期任务
- 维度：周一-周日、开始-结束（分钟）。
- 触发：由扩展 intervalDidStart 应用屏蔽，intervalDidEnd 清理；周期内展示统一开始通知；结束通知由扩展发出。
- 跨日：若 end <= start，当前兜底到 23:59（后续支持拆段）。

3) 暂停与恢复
- 暂停到“剩余时长的一部分或全部”；暂停期间清空屏蔽；到点由 PauseResume 调度恢复。

4) Shield UI
- 标题“已被屏蔽”；副标题可展示“总时长 X 分钟 · HH:mm 结束”。

5) 数据与状态
- App Group 存储：FocusStartAt、FocusEndAt、TotalMinutes、FocusType、PausedUntil、AppSelection、PlannedConfigs、ActiveScheduleNames、LastFocusEvent。
- 前端缓存：一次性/周期计划、已选择 App 列表（iOS 另外以 Token 缓存于 App Group）。

6) Android（需要验证/规划）
- 方案预研：本地 VPN + 域名/IP 策略 或 AccessibilityService + 应用前台拦截。
- MVP 建议：先提供同样的计划与统计 UI，占位引导“Android 拦截即将上线”。

## 信息架构与数据模型（简）
- 计划 CusPlan：{ id, start_min, end_min, start_sec, end_sec, repeat('once'|number[]), mode('focus'|'shield'), is_pause? }
- iOS 原生计划 PlanCfg：{ id, start(second), end(second), repeatDays[1..7], mode? }

## 关键交互与流程
- 一次性专注：选择应用 → 选择时长 → 开始 → 倒计时展示 → 结束通知。
- 周期专注：创建计划 → 同步至原生 → 到点自动开始 → 结束自动清理 → 次日复用。
- 暂停：专注中 → 选择暂停时长 → 清空屏蔽 → 到点自动恢复。

## 技术方案要点（与当前代码适配）
- iOS
  - NativeModule.swift：
    - selectAppsToLimit：自定义 FamilyActivityPicker；保存 Selection（App Group）。
    - startAppLimits：DeviceActivity 调度；ManagedSettings 立即屏蔽；15 分钟最小值与 warningTime；事件上报。
    - configurePlannedLimits：将前端计划转为多条 DeviceActivitySchedule，扩展侧统一执行。
    - pauseAppLimits/stopAppLimits/getFocusStatus：暂停/清理/查询。
  - MonitorExtension：
    - intervalDidStart/End：周期计划应用/清理，统一通知上报。
    - intervalWillEndWarning：在 <15 分钟“有效时长”场景提前清理。
  - ShieldExtension：自定义拦截页文案。
- 前端（RN/Expo）
  - `app/quick-start`：一键开始；iOS 分支调用原生；Android 分支保留占位。
  - `stores/*`：`PlanStore`/`AppStore`/`HomeStore` 管理计划、App 选择、权限与主题。

## 边界与限制
- iOS：
  - 屏蔽与选择受 Screen Time 能力约束，部分系统 App/域名不可控。
  - 最小时长 15 分钟限制存在；“有效时长”通过提前清理拟合。
  - 跨日计划需拆段实现完全正确性（当前为兜底策略）。
- Android：拦截能力尚未就绪（需要验证）。

## 指标（MVP）
- A1（日活启动率）：次日留存 ≥ 30%
- F1（有效专注完成率）：开始后完成 ≥ 70%
- T1（创建周期计划占比）：≥ 25%
- P1（暂停后自动恢复成功率）：≥ 95%

## 商业化设计（MVP → V1）
- 免费：一次性专注、基础周期、基础统计。
- 订阅：多模板/跨日拆段/共专注房间/高级统计导出/多设备同步/个性化 Shield。
- 支付：iOS IAP；Android 内购（需要验证）。

## 风险与合规
- 符合 iOS 公共 API 使用规范；不修改系统配置、不采集隐私内容。
- 数据最小化：仅本地与 App Group 存储必要字段；可选 iCloud 同步时加密。
- 未经同意不发送推送；仅使用本地通知。

## 里程碑（建议）
- M1（1-2 周）：iOS MVP 完成与验收；Android 显示计划与占位说明。
- M2（2-3 周）：周期计划跨日拆段、暂停/恢复完整 UI、统计页面。
- M3（2 周）：共专注房间（基础版）、订阅打点与 A/B。

## 验收与测试要点
- 功能验证（iOS）：
  - 选择 5 分钟一次性专注：确认 5 分钟后自动结束（warning 清理生效）。
  - 周期计划到点自动开始/结束，并收到通知。
  - 暂停 3 分钟可恢复，期间不再推进进度。到点自动恢复屏蔽。
  - Shield 页面展示“总时长 · 结束时间”。
- 回归测试：重启 App 后 `getFocusStatus` 能够恢复展示当前状态。
- Android：当前版本标注“功能即将上线”，不做拦截强验。（需要验证）

## 未来创造性产品思路与方法
- 数据驱动的自适应专注：在本地统计使用/中断/退出行为，形成个体“分心画像”，动态推荐下次专注方案（时长、时间与目标 App）。
- 目标导向的任务闭环：专注前设定“目标与产出”，结束后回顾“完成度/干扰来源/情绪”，形成周/月报告与复盘洞察。
- 社交激励：匿名排行榜、同城/同校挑战、好友提醒；群体行为显著提升坚持率。
- 开放生态：导入日程（CalDAV/系统日历）、导出报告（CSV/Notion API）、快捷指令与 Widget。
- 行为经济学设计：损失厌恶（打卡失败扣积分）、即时正反馈（结尾奖励动画）、可视化进度（环形/番茄）。

---
文档基于代码分析与推理撰写：
- 已知事实来源：本仓库 iOS 原生扩展/桥接与 RN 代码（`ios/*`, `app/quick-start/*`, `stores/*`）。
- 需要验证项：Android 实际拦截实现与服务端计划接口契约、支付形态与价格策略。

## 「我赌我自律」玩法（承诺挑战）
目标：通过“承诺金”机制提升专注完成率。用户为单次专注或周期计划下“赌注”，如成功坚持到结束，返还赌注并给予奖励；中途退出或违规则判负并扣除赌注。

说明：为满足合规与上架要求，本方案以“虚拟币（自律币）”为主路径，真实货币仅作为购买虚拟币的渠道，严禁现金兑现、抽奖或机会型奖励。是否可上架仍需法务与商店政策评审（需要验证）。

一、核心概念
- 自律币：应用内虚拟代币，可通过任务获得或内购充值购买；不可提现、不可兑换等值现金或第三方资产。
- 赌单（Bet）：用户基于某个专注任务发起的承诺记录，包含赌注、自律目标和判定规则。
- 判定窗口：用于处理 iOS 最小时长（15 分钟）等技术边界的容差窗口。

二、用户流程（一次性专注）
1) 选择目标应用/网站/类别 → 选择时长 → 开启“承诺挑战”。
2) 选择赌注：1/3/5/10 自律币，或自定义上限（需要验证）。
3) 确认协议：
   - 不可中途退出；
   - 暂停将导致失败（或设置“允许一次≤3 分钟暂停但扣小额罚金”的可选规则）。
4) 开始专注：正常进入已有的屏蔽与进度逻辑。
5) 结束判定：达到有效时长即成功；提前终止/权限撤销/规避判定则失败。
6) 结果结算：
   - 成功：返还赌注 + 固定/比例奖励（如 +10% 自律币、勋章、积分）。
   - 失败：扣除赌注，进入“失败复盘”。

三、成功/失败判定（iOS 对齐现有能力）
- 成功：
  - `getFocusStatus().active` 为 false 且已达到目标“有效时长”（分钟），或扩展上报 `focus-ended` 且记录的 `elapsedMinutes` ≥ 目标值；
  - 对于 <15 分钟场景，以“有效时长”策略：原生调度 15 分钟，扩展在 warning 阶段提前清理；到达目标分钟视为成功。
- 失败：
  - 用户主动停止（调用 stop）、撤销屏幕时间权限、卸载扩展、或在专注期内 `PausedUntil` 距离超过阈值（如 >1 分钟或规则设定）；
  - 设备时间/时区异常大幅跳变导致进度回退（需要验证：以系统事件与本地校验兜底）；
  - 周期计划到点未能应用（权限缺失或监控异常）。

四、反作弊与边界
- 权限前置校验：开启前必须 `approved`；否则禁止下注。
- 进程外监控：依赖 DeviceActivity 与扩展的通知；App 前后台切换对判定无影响。
- 规避检测：
  - 撤销权限/卸载扩展 → 立即失败；
  - 系统重启 → 重新查询 App Group 状态与扩展事件，若监控缺失判失败（需要验证）；
  - 时间回拨 → 记录时间漂移，超过阈值视为失败，或直接中止结算并人工复核（需要验证）。
- 暂停策略：MVP 建议默认“暂停即失败”；后续可开关“1 次短暂停（≤3 分钟），扣 10% 赌注”增强人性化。

五、经济与合规（重点）
- 虚拟币体系：
  - 购买入口使用 IAP 消耗型商品；
  - 禁止兑换现实世界价值；
  - 奖励仅限虚拟内容（币/勋章/功能折扣等）。
- 平台抽成与奖池：
  - 失败赌注 100% 归平台（或部分进入公共“挑战奖池”，用于排行榜奖励）；
  - 严禁以现金、红包等方式返还；严禁机会型抽奖。
- 法务与商店评审（需要验证）：
  - 规避“赌博/博彩”定义：无机会成分、明确为“自我约束承诺金”；
  - 区域合规：部分地区对“惩罚型付费”有严格限制；
  - 未成年人限制与家长监护。

六、数据模型（新增）
- UserWallet：{ userId, balanceCoins, totalPurchased, totalEarned }
- Bet：{ betId, userId, planId?, focusType('once'|'periodic'), targetMinutes, stakeCoins, createdAt, startAt, endAt, status('ongoing'|'success'|'fail'|'void'), failReason?, pausedSeconds, permissionRevoked?: boolean }
- BetEvent：{ betId, ts, type('started'|'progress'|'paused'|'resumed'|'ended'|'revoked'|'manualStop'), payload }

七、前后端接口（MVP，需后端实现，契约需要验证）
- POST /wallet/coins/purchase-iap（iOS IAP 回调）
- GET /wallet/balance
- POST /bets/create { targetMinutes, stakeCoins, selectionHash }
- POST /bets/resolve { betId, result('success'|'fail'), metrics }
- GET /bets/history?page=1

八、前端改造点（RN/原生）
- Quick Start 增加“承诺挑战”开关与赌注选择；开始时创建 Bet 并记录 betId。
- 监听 `focus-state`/`focus-ended` 与 `getFocusStatus` 周期拉取，达成条件后调用 /bets/resolve。
- UI：
  - 成功页：返还 + 奖励动画；
  - 失败页：扣除提示 + 复盘（显示退出时刻与原因）。

九、指标与实验
- Opt-in 率：打开“承诺挑战”的比例
- 完成率提升：承诺组 vs 对照组的任务完成率差异
- ARPPU/留存：代币购买率/留存变化
- 争议率：失败判定被申诉的比例

十、验证与风控
- 沙箱验证：
  - 5 分钟专注下注成功 → “有效时长”判定正确；
  - 中途手动停止 → 判失败并扣币；
  - 撤销权限 → 立即失败；
  - 暂停超过阈值 → 失败；
  - 时间回拨（开发者选项）→ 触发异常记录与防御。
- 商店合规走查（需要验证）：与法务评审 IAP 使用场景与文案。

十一、路线建议
- V1：仅支持“自律币下注”，无现金相关文案，明确“不可兑现”；
- V1.5：加入“短暂停一次惩罚”可选规则、排行榜、连胜奖励；
- V2：团队共修的团体承诺金（仅虚拟币），引入社交激励与奖池。

十二、前端改造清单（UI/状态）
- 新增/改造页面
  - `Wallet`（钱包/自律币）：余额、购买入口、交易记录
  - `BetHistory`（挑战记录）：进行中/已完成/失败筛选
  - `BetResult`（结算页）：成功/失败态 + 复盘
  - `Leaderboard`（可选 V1.5）：当周胜场/连胜榜（展示，不涉现金）
  - `Settings` 增加“承诺挑战默认开关/默认赌注/暂停规则提示”
- Quick Start 改造
  - 增加“承诺挑战”开关与赌注选择（1/3/5/10 币与自定义，设上限）
  - 开始时：创建 Bet → 返回 `betId` → 与原生专注启动解耦并行
  - 结束/失败：由事件回调触发 `resolve` 接口
- 新增全局状态（MobX）
  - `WalletStore`：`balance`, `transactions`, `purchase()`
  - `BetStore`：`currentBet`, `createBet()`, `resolveBet()`, `loadHistory()`
  - 与 `PlanStore` 协作：一次性/周期计划创建时可勾选“承诺挑战”

十三、后端接口契约（详细，需验证）
- 钱包
  - GET `/wallet/balance` → { balanceCoins, totalPurchased, totalEarned }
  - GET `/wallet/transactions?page` → { list: [{id, type('purchase'|'stake'|'refund'|'reward'|'penalty'), coins, createdAt, meta}], nextCursor }
  - POST `/wallet/purchase/iap/verify` { receipt } → { success, coinsAdded, newBalance }
- 挑战
  - POST `/bets/create`
    - req: { focusType: 'once'|'periodic', targetMinutes: number, stakeCoins: number, selectionHash: string, planId?: string }
    - res: { betId, status: 'ongoing', startAt }
  - POST `/bets/heartbeat`（可选） { betId, progressMin, paused?: boolean } → { ok }
  - POST `/bets/resolve` { betId, result: 'success'|'fail', metrics: { elapsedMinutes, pausedSeconds, reason? } } → { status, rewardCoins?, newBalance }
  - GET `/bets/history?page` → { list: [{ betId, status, stakeCoins, targetMinutes, resultReward, createdAt, endAt }], nextCursor }
- 管理与风控（后台）
  - POST `/admin/bets/void` { betId, reason }：异常争议作废
  - GET `/admin/bets/audit-queue`

十四、数据库与数据一致性（建议）
- tables
  - users(id, platformId, createdAt)
  - wallets(userId PK/FK, balanceCoins, totalPurchased, totalEarned, updatedAt)
  - wallet_txns(id, userId, type, coins, balanceAfter, refType, refId, meta JSON, createdAt)
  - bets(betId, userId, planId, focusType, targetMinutes, stakeCoins, status, createdAt, startAt, endAt, pausedSeconds, permissionRevoked BOOL, failReason, selectionHash)
  - bet_events(id, betId, ts, type, payload JSON)
  - iap_receipts(id, userId, receiptHash, productId, orderId, coins, status, createdAt)
  - audit_logs(id, actorId, action, targetType, targetId, detail JSON, createdAt)
- 事务性要求
  - createBet：扣除赌注 = 原子事务（钱包 -stakeTx + bet.ONGOING）
  - resolveBet：结算 = 原子事务（钱包 +refund/+reward or 不返还 + penalty 记账）
  - 幂等：通过 `betId` + 状态锁确保重复回调不重复结算

十五、状态机（Bet）
- states：DRAFT → ONGOING → SUCCESS | FAIL | VOID
- transitions：
  - createBet → ONGOING
  - event: ended且elapsed≥target → SUCCESS
  - event: manualStop/permissionRevoked/pausedTooLong → FAIL
  - adminVoid → VOID（资金原路返还或按策略）

十六、埋点与指标（最小集）
- 事件
  - bet_create { stake, minutes, selectionSize }
  - focus_start { type, minutes }
  - bet_resolve { result, elapsed, pausedSec, reason }
  - wallet_purchase { productId, coins }
  - permission_status { status }
- 指标看板
  - Opt-in 率、完成率提升（AB）、ARPPU、争议率、退款率（IAP 失败）

十七、通知与文案（iOS 本地）
- 开始：标题“专注一点”，文案“打赌已开始，保持专注”
- 成功：标题“挑战成功”，文案“赌注已返还，已发放奖励”
- 失败：标题“挑战失败”，文案“已扣除赌注，下次继续加油”
- 提醒（可选）：中途退出将判失败，请谨慎操作

十八、价格与钱包策略（建议）
- 自律币礼包（IAP）：¥6/60币、¥30/360币、¥68/900币（示例，需本地化）
- 下注阶梯：1/3/5/10 币；可设置每日总下注上限，防止过度惩罚
- 奖励：成功返还赌注 + 10% 奖励（或与连胜挂钩）

十九、风控与审核流程
- 风险触发：时间回拨、权限撤销、扩展异常、频繁争议
- 处置：自动 FAIL 或进入人工复核队列；管理员可 VOID 作废处理
- 留痕：关键事件落 `bet_events`/`audit_logs`，便于追溯

二十、测试计划（关键用例）
- 下注并成功：<15 分钟有效时长正确结算
- 下注并手动停止：立即 FAIL 并扣币
- 暂停超阈值：FAIL
- 权限撤销：FAIL
- 设备重启：状态恢复后正确结算或 FAIL
- 重复回调：幂等不重复结算

二十一、上线与灰度
- 阶段：内部测试（TF）→ 小流量（1-5%）→ 全量
- 审核材料：
  - 明确“虚拟币不可兑现、无现金返还、无机会博弈”
  - 家长/未成年人保护文案
  - 隐私与数据最小化说明

附录：开放问题与需验证项
- Android 实际拦截形态与时间精度
- IAP 产品矩阵与价格本地化策略
- 失败争议判定标准与申诉 SLA
- 连胜与排行榜是否进入 V1.5
- 是否允许一次短暂停（≤3 分钟）的 MVP 规则


## 更多产品思路

- **慈善承诺金（合规友好）**：成功返还币并展示“已阻止X元流向坏习惯”；失败赌注进入公益池（平台代捐+回执）。强化社会动机，合规风险较低（需法务评审）。
- **连胜保险/赎回券**：连胜解锁“1 次失败赎回券”，失败不扣全额，仅扣小额手续费，降低挫败感，提升留存。
- **责任搭子/师徒制**：两人互为监督，任一方失败另一方得小额奖励或勋章。提升复归率，需反作弊（IP/设备/历史相关性）。
- **Live Activities + 动态岛（iOS）**：实时倒计时、暂停状态、打赌结果，一键继续/放弃。可见即提醒，极低摩擦（需原生桥接）。
- **任务卡片化（目标-产出-复盘）**：将时段升级为“任务”，结束自动生成复盘卡片，强化意义感与分享。
- **环境触发（极简自动化）**：日历事件、地点（家/学校/办公室）、耳机连接、系统专注模式触发屏蔽。先做“日历触发”。
- **NFC 场景卡**：贴纸轻触即开专注+下注；再次触碰结算。具身化仪式感，极低摩擦（快捷指令/NFC）。
- **微习惯楼梯与滑坡保护**：5/10/15 分钟阶梯渐进；连续失败自动降级强度，降低放弃率。
- **情绪与冲动记录（1 行日记）**：想退出时记录冲动并提供“延迟 2 分钟”选项；形成“冲动热力图”。
- **内容级黑名单模板**：内置短视频/社媒/购物域名模板，一键启用/移除，降低配置成本。
- **团队挑战/班级模式（B2B/教育）**：组织发起统一挑战，成员下注虚拟币，看板展示进展，提升留存与 ToB 收入。
- **Apple Watch 伴侣**：抬腕开始/结束、轻震提醒与呼吸放松，减少拿手机风险。
- **个性化“分心预测”（本地）**：基于本地统计预测高风险时段/应用，提前提示“要不要来一把承诺挑战？”。
- **复盘洞察 + 关联收益**：周/月报量化“每周夺回X小时”，展示有效策略与最高风险时段。
- **家长共建（次优先）**：亲子共同设立承诺金（虚拟币），成功可兑换学习资源（非现金）。
- **开发者生态/开放平台**：公开“专注开始/结束”回调与 URL Scheme，允许第三方笔记/任务工具接入。

### 组合策略建议（低成本→高影响）
- 先落地：Live Activities、内容模板、任务卡片化、微习惯楼梯、复盘洞察。
- 第二梯队：责任搭子/团队挑战（仅虚拟币）、情绪/冲动记录。
- 实验性：慈善承诺金（需法务评审）、NFC 场景卡、分心预测（本地）。

### 快速验证方法（7-14 天）
- A/B：承诺挑战 + Live Activities vs. 对照组 → 完成率、连用天数、复归率。
- 新手漏斗：微习惯楼梯 vs. 直上 45 分钟 → 留存与失败率差异。
- 模板转化：内容模板点击→启用转化率。
- 搭子实验：双人组赛 vs. 单人 → 失败后 48 小时复归率。

