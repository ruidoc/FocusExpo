# 计划执行流程与失败场景分析

> 分析从选择应用、保存计划到自动执行的完整流程，以及可能导致计划不执行的情况

---

## 完整流程

### 1. 选择应用
**位置**: `app/plans/add.tsx:352-359`

```typescript
const selectApps = (apps: any[]) => {
  astore.addIosApps(apps);           // 存储到 AppStore
  setSelectedApps(apps);              // 更新本地 state
  setForm({
    ...form,
    apps: apps.map(r => `${r.stableId}:${r.type}`),  // 格式化为 ID 数组
  });
};
```

**调用位置**: `<SelectApps>` 组件 (第417行)

**关键点**:
- `apps` 格式: `["stableId:type", "stableId:type", ...]`
- 存储到 `form.apps` 等待提交

---

### 2. 保存计划 (提交表单)
**位置**: `app/plans/add.tsx:201-299`

#### 2.1 前端校验
```typescript
const submit = async () => {
  // 1. 校验名称
  if (!name.trim()) return Toast('请输入计划名称');

  // 2. 校验日期（自定义时长模式）
  if (!isLongTerm && !dayjs(end_date).isAfter(dayjs(start_date)))
    return Toast('结束日期必须大于开始日期');

  // 3. 校验应用选择
  if (selectedApps.length === 0)
    return Toast('请先选择要限制的应用');

  // 4. 校验时长 (最少20分钟)
  if (end_day.diff(start_day, 'minute') < 20)
    return Toast('时间间隔最少20分钟');

  // 5. 校验时间重叠
  const overlap = pstore.all_plans().some(plan => {
    const share = plan.repeat.some(d => repeat.includes(d));
    if (!share) return false;
    return newStart < plan.end_min && newEnd > plan.start_min;
  });
  if (overlap) return Toast('任务时间不能重叠');
}
```

#### 2.2 调用 Store 方法
**新建**: `pstore.addPlan(subinfo, callback)` (第273行)
**编辑**: `pstore.editPlan(id, subinfo, callback)` (第264行)

---

### 3. Store 提交到后端
**位置**: `src/stores/plan.ts:197-218`

```typescript
addPlan: async (form, fun) => {
  // 1. 转换 repeat 格式
  form_data.repeat = form_data.repeat.join(',');  // [1,2,3] → "1,2,3"

  // 2. 调用后端 API
  let res = await http.post('/plan/add', form_data);

  if (res.statusCode === 200) {
    // 3. ✅ 关键：同步到 iOS Native
    await updateIOSPlan(res.data);

    // 4. 刷新计划列表
    await getPlans();

    fun(res);
  }
}
```

---

### 4. 同步到 iOS Native
**位置**: `src/stores/plan.ts:135-147`

```typescript
updateIOSPlan: async (plan: CusPlan) => {
  const repeat = parseRepeat(plan.repeat);
  const data: PlanConfig = {
    id: plan.id,
    name: plan.name,
    start: plan.start_min,  // 分钟数
    end: plan.end_min,      // 分钟数
    days: repeat === 'once' ? [] : (repeat as number[]),  // 周几数组
    apps: plan.apps || [],  // 应用 ID 数组
  };

  console.log('同步计划到 IOS Native:', JSON.stringify(data));
  await updatePlan(data);  // 调用原生方法
}
```

**关键转换**:
- `repeat: "1,2,3"` → `days: [1,2,3]`
- `start: "08:00"` → `start: 480` (分钟)
- `end: "22:00"` → `end: 1320` (分钟)

---

### 5. iOS Native 注册监控
**位置**: `ios/NativeModule.swift:156-210`

```swift
func updatePlan(_ planJSON: String) {
  // 1. 解析 JSON
  let plan = try? JSONDecoder().decode(PlanConfig.self, from: data)

  // 2. 如果 apps 是 ID 数组，转换为 Token
  if input.apps {
    let selection = buildSelectionFromApps(input.apps)
    token = selection.base64EncodedString()
  }

  // 3. 更新 App Groups 存储
  var plansMap = defaults.data(forKey: "FocusOne.PlansMap")
  plansMap[plan.id] = plan
  defaults.set(plansMap, forKey: "FocusOne.PlansMap")

  // 4. 停止旧监控
  if let oldPlan = plansMap[plan.id] {
    stopMonitor(for: oldPlan)
  }

  // 5. ✅ 启动新监控
  startMonitor(for: plan)
}
```

---

### 6. 启动 DeviceActivity 监控
**位置**: `ios/NativeModule.swift:232-279`

```swift
private func startMonitor(for plan: PlanConfig) {
  let days = plan.days.isEmpty ? [0,1,2,3,4,5,6] : plan.days

  // 计算时分
  let startH = plan.start / 60
  let startM = plan.start % 60
  let endH = plan.end / 60
  let endM = plan.end % 60

  if plan.start > plan.end {
    // 跨日拆分 (如 22:00 -> 02:00)
    for d in days {
      // Part 1: 22:00 -> 23:59
      let s1 = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: startH, minute: startM, weekday: d+1),
        intervalEnd: DateComponents(hour: 23, minute: 59, weekday: d+1),
        repeats: true
      )
      center.startMonitoring("FocusOne.Plan.\(id)_P1_D\(d)", during: s1)

      // Part 2: 00:00 -> 02:00 (下一天)
      let s2 = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: 0, minute: 0, weekday: nextWd),
        intervalEnd: DateComponents(hour: endH, minute: endM, weekday: nextWd),
        repeats: true
      )
      center.startMonitoring("FocusOne.Plan.\(id)_P2_D\(d)", during: s2)
    }
  } else {
    // 非跨日
    for d in days {
      let schedule = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: startH, minute: startM, weekday: d+1),
        intervalEnd: DateComponents(hour: endH, minute: endM, weekday: d+1),
        repeats: true
      )
      center.startMonitoring("FocusOne.Plan.\(id)_D\(d)", during: schedule)
    }
  }
}
```

**关键点**:
- `weekday`: 1=周日, 2=周一, ..., 7=周六
- `repeats: true`: 每周重复
- `days` 为空时默认全部 7 天

---

### 7. 系统自动触发执行
**位置**: `ios/MonitorExtension/DeviceActivityMonitorExtension.swift:32-60`

```swift
override func intervalDidStart(for activity: DeviceActivityName) {
  // 1. 检查跨日
  checkAndHandleDayChange(defaults: defaults)

  // 2. 根据 activityName 查找计划
  guard let plan = findPlan(by: activity.rawValue) else { return }

  // 3. 解码 Token 并应用屏蔽
  if let selection = JSONDecoder().decode(selection, from: plan.token) {
    store.shield.applications = selection.applicationTokens
    store.shield.applicationCategories = selection.categoryTokens
  }

  // 4. 检查配额
  checkFreeUserQuota(totalMinutes: totalMin)

  // 5. 创建后端记录
  POST /record/add

  // 6. 发送通知
  notifyStart()
}
```

---

## 可能导致计划不执行的情况

### ❌ 场景1: 前端校验失败
**原因**:
- 未选择应用 (`selectedApps.length === 0`)
- 时长少于 20 分钟
- 时间重叠

**影响**: 无法提交到后端，不会调用 `updateIOSPlan()`

**检查方法**: Toast 提示错误信息

---

### ❌ 场景2: 后端 API 失败
**原因**:
- `/plan/add` 返回非 200 状态码
- 网络错误

**影响**: `res.statusCode !== 200`，不会执行 `updateIOSPlan()`

**检查方法**:
```typescript
// src/stores/plan.ts:206-213
if (res.statusCode === 200) {
  await updateIOSPlan(res.data);  // ✅ 只有成功才同步
}
```

**日志**: `console.log('计划参数：', form)`

---

### ❌ 场景3: iOS Native 解析失败
**原因**:
- JSON 格式错误
- `apps` 数组为空或格式不正确
- `buildSelectionFromApps()` 返回 nil

**影响**: `reject("PARSE_ERROR")`，监控未注册

**检查方法**:
```swift
// ios/NativeModule.swift:181-184
guard let plan = finalPlan else {
  reject("PARSE_ERROR", "无法解析计划数据", nil)
  return
}
```

**日志**: Xcode Console 查看错误

---

### ❌ 场景4: App Groups 存储失败
**原因**:
- Suite Name 不匹配 (`group.com.focusone`)
- App Groups 未配置

**影响**: Extension 无法读取 `PlansMap`，`findPlan()` 返回 nil

**检查方法**:
```swift
if let defaults = UserDefaults.groupUserDefaults() { ... }
```

**排查**: Xcode → Signing & Capabilities → App Groups

---

### ❌ 场景5: DeviceActivity 注册失败
**原因**:
- `center.startMonitoring()` 抛出异常
- Screen Time 权限未授予
- 系统限制 (如已有太多监控)

**影响**: `try? center.startMonitoring()` 静默失败

**检查方法**:
```swift
// 改为 try-catch
do {
  try center.startMonitoring(name, during: schedule)
  print("✅ 监控注册成功: \(name)")
} catch {
  print("❌ 监控注册失败: \(error)")
}
```

---

### ❌ 场景6: 时间配置错误
**原因**:
- `weekday` 计算错误 (如 `days: [0]` → `weekday: 1` 正确)
- 跨日拆分逻辑错误 (如 nextWd 计算错误)
- 时区问题

**影响**: 监控在错误的时间触发或不触发

**检查方法**:
```swift
print("注册监控: \(plan.id), weekday: \(wd), start: \(startH):\(startM)")
```

---

### ❌ 场景7: Extension 未收到事件
**原因**:
- Extension 进程未启动
- iOS 系统限制 Extension 运行
- `intervalDidStart` 被系统延迟

**影响**: 计划时间到达但未执行

**检查方法**:
```swift
// MonitorExtension 日志
logToJS(level: "log", message: "intervalDidStart 触发")
```

**解决**: iOS 系统行为，无法保证 100% 触发

---

### ❌ 场景8: Token 解码失败
**原因**:
- `plan.token` 格式错误
- Base64 解码失败
- `FamilyActivitySelection` 反序列化失败

**影响**: 无法应用屏蔽，`shield.applications` 为空

**检查方法**:
```swift
if let data = Data(base64Encoded: plan.token),
   let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
  // ✅ 成功
} else {
  logToJS(level: "error", message: "Token 解码失败")
}
```

---

### ❌ 场景9: 计划被删除或覆盖
**原因**:
- 编辑计划时 `stopMonitor()` 删除了旧监控
- 调用 `deletePlan()` 删除
- `PlansMap` 被清空

**影响**: 监控不存在

**检查方法**:
```swift
// 打印 PlansMap
let plansMap = defaults.data(forKey: "FocusOne.PlansMap")
print("当前计划数量: \(plansMap?.count ?? 0)")
```

---

### ❌ 场景10: `days` 数组为空且未使用默认值
**原因**:
- `plan.days.isEmpty` 但 `startMonitor()` 逻辑错误

**当前逻辑**:
```swift
let days = plan.days.isEmpty ? [0,1,2,3,4,5,6] : plan.days
```

**影响**: 理论上应该 7 天都执行

**可能问题**: 如果 `plan.days` 是 `nil` 而不是空数组

---

## 排查工具

### 1. 检查计划是否同步到 Native
```typescript
// JS 层
console.log('同步计划到 IOS Native:', JSON.stringify(data));
```

### 2. 检查 App Groups 数据
```swift
// 原生层
let defaults = UserDefaults(suiteName: "group.com.focusone")
if let data = defaults?.data(forKey: "FocusOne.PlansMap"),
   let plans = try? JSONDecoder().decode([String: PlanConfig].self, from: data) {
  print("计划数量: \(plans.count)")
  print("计划列表: \(plans.keys)")
}
```

### 3. 检查监控注册状态
```swift
// 在 startMonitor() 中添加
print("📝 注册监控: FocusOne.Plan.\(plan.id)_D\(d)")
print("   时间: \(startH):\(startM) -> \(endH):\(endM)")
print("   weekday: \(wd)")
```

### 4. Extension 日志
```swift
// MonitorExtension
logToJS(level: "log", message: "intervalDidStart 触发", data: ["planId": plan.id])
```

---

## 最佳实践

### 1. 添加计划后验证
```typescript
// JS 层
pstore.addPlan(subinfo, async res => {
  if (res) {
    // ✅ 验证是否同步成功
    const status = await getFocusStatus();
    console.log('计划同步状态:', status);
  }
});
```

### 2. 定期清理过期计划
```typescript
// 后端返回的计划中，过滤掉 end_date 已过期的
const validPlans = res.data.filter(p =>
  dayjs(p.end_date).isAfter(dayjs())
);
```

### 3. 监控注册失败时提示用户
```swift
do {
  try center.startMonitoring(name, during: schedule)
  resolve(true)
} catch {
  reject("MONITOR_ERROR", "监控注册失败: \(error.localizedDescription)", nil)
}
```

---

**更新**: 2026-02-26
