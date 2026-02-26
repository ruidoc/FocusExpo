# 计划执行埋点文档

> FocusExpo 计划同步与执行的埋点设计

---

## 埋点概览

| 事件名 | 触发位置 | 触发时机 | 用途 |
|-------|---------|---------|------|
| `plan_sync_success` | iOS Native | 计划同步成功 | 监控同步成功率 |
| `plan_sync_failed` | iOS Native | 计划同步失败 | 定位同步失败原因 |
| `plan_shield_success` | iOS Extension | 屏蔽应用成功 | 监控执行成功率 |
| `plan_shield_failed` | iOS Extension | 屏蔽应用失败 | 定位执行失败原因 |

---

## 数据流

```
用户保存计划 (后端成功)
    ↓
【埋点区域1】iOS Native updatePlan()
    ├─ plan_sync_success  (成功)
    └─ plan_sync_failed   (失败: JSON解析/Token转换/存储/监控注册)
    ↓
系统触发 intervalDidStart
    ↓
【埋点区域2】Extension startPlanSession()
    ├─ plan_shield_success  (成功)
    └─ plan_shield_failed   (失败: 计划未找到/Token解码)
```

---

## 事件详情

### 1. plan_sync_success

**触发条件**: 计划成功同步到 iOS 并注册监控

**代码位置**: `ios/NativeModule.swift:207-220`

**属性**:
```json
{
  "distinct_id": "user_123",
  "plan_id": "plan_456",
  "plan_name": "工作专注",
  "plan_type": "scheduled",
  "apps_count": 5,
  "is_cross_day": false,
  "days": [1, 2, 3, 4, 5]
}
```

**plan_type 说明**:
- `"quick_start"`: 快速开始（一次性任务，未登录时也可用）
- `"scheduled"`: 定时计划（需要登录，后端创建）

---

### 2. plan_sync_failed

**触发条件**: 计划同步到 iOS 过程中失败

**代码位置**: `ios/NativeModule.swift` (多处)

**失败原因** (`error_type`):

| error_type | 含义 | 触发行数 |
|-----------|------|---------|
| `json_parse_error` | JSON 格式错误 | 161-169 |
| `token_build_error` | Token 转换失败 | 181-192 |
| `plan_decode_error` | 计划解码失败 | 195-203 |
| `app_groups_write_error` | App Groups 写入失败 | 220-228 |
| `monitor_register_error` | 监控注册失败 | 238-246 |

**属性示例**:

**JSON 解析失败**:
```json
{
  "distinct_id": "user_123",
  "error_type": "json_parse_error",
  "plan_json_length": 256
}
```

**Token 转换失败**:
```json
{
  "distinct_id": "user_123",
  "plan_id": "plan_456",
  "plan_type": "quick_start",
  "error_type": "token_build_error",
  "apps_count": 5,
  "apps": ["xxx:application", "yyy:application"]
}
```

**监控注册失败**:
```json
{
  "distinct_id": "user_123",
  "plan_id": "plan_456",
  "plan_type": "scheduled",
  "error_type": "monitor_register_error",
  "error_message": "Invalid schedule components"
}
```

---

### 3. plan_shield_success

**触发条件**: Extension 成功应用屏蔽

**代码位置**: `ios/MonitorExtension/DeviceActivityMonitorExtension.swift:187-198`

**属性**:
```json
{
  "distinct_id": "user_123",
  "plan_id": "plan_456",
  "plan_name": "工作专注",
  "plan_type": "scheduled",
  "apps_count": 5,
  "categories_count": 0,
  "activity_name": "FocusOne.Plan.plan_456_D1"
}
```

---

### 4. plan_shield_failed

**触发条件**: Extension 应用屏蔽失败

**代码位置**: `ios/MonitorExtension/DeviceActivityMonitorExtension.swift` (多处)

**失败原因** (`error_type`):

| error_type | 含义 | 触发行数 |
|-----------|------|---------|
| `plan_not_found` | 计划未找到 | 150-159 |
| `token_decode_error` | Token 解码失败 | 165-174 |

**属性示例**:

**计划未找到**:
```json
{
  "distinct_id": "user_123",
  "activity_name": "FocusOne.Plan.plan_456_D1",
  "plan_type": "scheduled",
  "error_type": "plan_not_found"
}
```

**Token 解码失败**:
```json
{
  "distinct_id": "user_123",
  "plan_id": "plan_456",
  "plan_type": "quick_start",
  "error_type": "token_decode_error",
  "token_length": 1024
}
```

---

## 关键指标

### 1. 计划同步成功率
```
同步成功率 = plan_sync_success / (plan_sync_success + plan_sync_failed)
```

### 2. 计划执行成功率
```
执行成功率 = plan_shield_success / plan_sync_success
```

### 3. 端到端成功率
```
端到端成功率 = plan_shield_success / (后端创建成功数)
```

---

## PostHog 查询示例

### 查看同步失败原因分布
```sql
SELECT
  properties.error_type,
  COUNT(*) as count
FROM events
WHERE event = 'plan_sync_failed'
  AND timestamp > now() - interval '7 days'
GROUP BY properties.error_type
ORDER BY count DESC
```

### 查看执行成功率趋势
```sql
SELECT
  date_trunc('day', timestamp) as date,
  SUM(CASE WHEN event = 'plan_shield_success' THEN 1 ELSE 0 END) as success,
  SUM(CASE WHEN event = 'plan_shield_failed' THEN 1 ELSE 0 END) as failed
FROM events
WHERE event IN ('plan_shield_success', 'plan_shield_failed')
  AND timestamp > now() - interval '30 days'
GROUP BY date
ORDER BY date
```

### 查找高失败率用户
```sql
SELECT
  distinct_id,
  SUM(CASE WHEN event = 'plan_sync_failed' THEN 1 ELSE 0 END) as failed_count,
  SUM(CASE WHEN event = 'plan_sync_success' THEN 1 ELSE 0 END) as success_count
FROM events
WHERE event IN ('plan_sync_success', 'plan_sync_failed')
  AND timestamp > now() - interval '7 days'
GROUP BY distinct_id
HAVING failed_count > success_count
ORDER BY failed_count DESC
```

### 对比快速开始与定时计划的成功率
```sql
SELECT
  properties.plan_type,
  SUM(CASE WHEN event = 'plan_sync_success' THEN 1 ELSE 0 END) as sync_success,
  SUM(CASE WHEN event = 'plan_sync_failed' THEN 1 ELSE 0 END) as sync_failed,
  SUM(CASE WHEN event = 'plan_shield_success' THEN 1 ELSE 0 END) as shield_success,
  SUM(CASE WHEN event = 'plan_shield_failed' THEN 1 ELSE 0 END) as shield_failed,
  ROUND(
    SUM(CASE WHEN event = 'plan_sync_success' THEN 1 ELSE 0 END) * 100.0 /
    NULLIF(SUM(CASE WHEN event IN ('plan_sync_success', 'plan_sync_failed') THEN 1 ELSE 0 END), 0),
    2
  ) as sync_success_rate,
  ROUND(
    SUM(CASE WHEN event = 'plan_shield_success' THEN 1 ELSE 0 END) * 100.0 /
    NULLIF(SUM(CASE WHEN event IN ('plan_shield_success', 'plan_shield_failed') THEN 1 ELSE 0 END), 0),
    2
  ) as shield_success_rate
FROM events
WHERE event IN ('plan_sync_success', 'plan_sync_failed', 'plan_shield_success', 'plan_shield_failed')
  AND timestamp > now() - interval '7 days'
GROUP BY properties.plan_type
```

---

## 实现细节

### user_id 同步机制

**JS 层同步** (`src/stores/user.ts`):
```typescript
// 登录成功后同步
storage.setGroup('user_id', userInfo.id);

// 同时同步 PostHog API Key
storage.setGroup('posthog_api_key', 'phc_xxx');
```

**iOS 层读取** (`ios/Shared/Analytics.swift`):
```swift
let userId = UserDefaults(suiteName: "group.com.focusone")?.string(forKey: "user_id")
let apiKey = UserDefaults(suiteName: "group.com.focusone")?.string(forKey: "posthog_api_key")
```

### 直接发送到 PostHog

**不依赖 JS 层**，Extension 可在后台独立发送：

```swift
Analytics.shared.track(
  event: "plan_shield_success",
  properties: ["plan_id": "xxx"]
)
```

内部通过 URLSession 直接调用 PostHog Capture API:
```swift
POST https://us.i.posthog.com/capture/
{
  "api_key": "phc_xxx",
  "event": "plan_shield_success",
  "properties": {
    "distinct_id": "user_123",
    "plan_id": "xxx",
    ...
  }
}
```

---

## 排查指南

### 场景1: 计划同步成功但未执行

**检查步骤**:
1. 查询 `plan_sync_success` 事件是否存在
2. 查询 `plan_shield_failed` 事件，查看 `error_type`
3. 如果无 `plan_shield_failed`，检查系统是否触发 `intervalDidStart`

**可能原因**:
- Extension 未启动
- 时间配置错误
- iOS 系统限制

---

### 场景2: 高失败率用户

**检查步骤**:
1. 查询该用户的 `plan_sync_failed` 事件
2. 按 `error_type` 分组统计
3. 查看失败时的 `apps` 数据

**可能原因**:
- 特定应用导致 Token 转换失败
- 设备 iOS 版本过低
- Screen Time 权限问题

---

## 注意事项

1. **隐私**: `plan_json` 仅在必要时记录，不包含用户敏感信息
2. **性能**: 埋点通过异步 URLSession 发送，不阻塞主流程
3. **超时**: URLSession 设置 5 秒超时，失败时仅打印日志
4. **去重**: PostHog 自动去重，无需担心重复发送

---

**更新时间**: 2026-02-26
**维护者**: Tech Architect
