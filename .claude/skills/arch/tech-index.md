# 技术实现索引

> 快速定位核心功能的实现位置和关键逻辑

---

## 免费版限制策略

### 应用数量限制
**状态**: ✅ 已完整实现

**数据流**:
```
后端 /benefit → BenefitStore.getBenefit() → App Groups (is_subscribed, app_count, category_count)
→ iOS NativeModule.selectAppsToLimit():436-448 读取限制
→ CustomFamilyActivityPicker:60-63 校验并弹窗提示
```

**关键代码**:
- 同步: `src/stores/benefit.ts:60-62` (setGroup)
- 校验: `ios/NativeModule.swift:436-448` (读取限制)
- 提示: `ios/NativeModule.swift:60-63` (原生 Alert)

### 每日时长限制
**状态**: ⚠️ 后端已返回，前端未校验

**缺失**:
- `app/quick-start/index.tsx:handleStart()` - 需添加 today_used 检查
- `src/components/modals/UpgradeModal.tsx` - 需创建升级提示组件

---

## 今日使用时长更新

### 数据源
**权威数据**: 后端 `GET /benefit` → `today_used`

### 更新时机

| 场景 | 位置 | 逻辑 |
|-----|------|-----|
| **正常完成** | `ios/MonitorExtension/...swift:402` | `updateTodayUsed(totalMin)` 累加计划总时长 |
| **手动退出** | `ios/NativeModule.swift:684-691` | ✅ P0已修复：累加 elapsed minutes |
| **跨日重置** | `ios/MonitorExtension/...swift:434` | 重置为 0，调用后端同步 |

### 核心方法
```swift
// ios/MonitorExtension/DeviceActivityMonitorExtension.swift:482
private func updateTodayUsed(minutes: Int, defaults: UserDefaults) {
  let currentUsed = defaults.integer(forKey: "today_used")
  defaults.set(currentUsed + minutes, forKey: "today_used")
}
```

**精准度**:
- ✅ 正常完成、跨日重置、后端持久化
- ✅ 手动退出 (P0已修复)
- ⚠️ 暂停时长计入总时长 (产品未定义)

---

## 专注任务生命周期

### 一次性任务
```
JS startAppLimits() → iOS NativeModule:533
→ Extension intervalDidStart():32
→ 前台计时 updateActualMins() (每分钟)
→ Extension intervalDidEnd():63 或 intervalWillEndWarning():84
→ completeRecord():384 累加时长 + 调用后端
```

### 周期计划
```
JS updatePlan() → iOS NativeModule:155 存储到 App Groups
→ startMonitor():232 注册 DeviceActivitySchedule (支持跨日拆分)
→ 系统自动触发 intervalDidStart()
→ startPlanSession():142 读取计划 + 应用屏蔽
→ 后续同一次性任务
```

### 跨日拆分
**位置**: `ios/NativeModule.swift:239-266`
- 22:00-02:00 拆为 Part1(22:00-23:59) + Part2(00:00-02:00)

---

## 数据同步

### App Groups 共享 (`group.com.focusone`)

| Key | 写入 | 读取 | 说明 |
|-----|------|------|------|
| `is_subscribed` | JS Benefit | iOS Native | VIP 状态 |
| `app_count` | JS Benefit | iOS Native | 应用限制 |
| `today_used` | iOS Extension | iOS Native + JS | 今日已用 |
| `FocusOne.PlansMap` | JS Plan | iOS Extension | 周期计划 |
| `record_id` | iOS Extension | JS Record | 当前记录 |

### 同步时机
- App 启动: `useUserStore.syncRemoteData()` → `getBenefit()`
- 跨日: Extension `checkAndHandleDayChange()` → 后端同步
- 完成: Extension `completeRecord()` → `POST /record/complete`

---

## 关键算法

### 链式定时器 (防漂移)
**位置**: `src/native/ios/sync.ts:39-52`
- 每分钟对齐到 `:00` 秒，递归 schedule

### 重叠校验
**位置**: `ios/NativeModule.swift:540-556`
- 检查一次性任务 + 周期计划窗口，防止冲突

---

## 待实现 (MVP 缺失)

### P0
- [ ] 每日时长前端校验 (`app/quick-start/index.tsx`)
- [ ] 升级提示 Modal (`src/components/modals/UpgradeModal.tsx`)

### P1
- [ ] 计划数量限制 (`app/plans/add.tsx`)
- [ ] 专注完成后刷新 BenefitStore
- [ ] 价值展示 + Paywall 自动触发

---

**更新**: 2026-02-26 (P0 手动退出已修复)
