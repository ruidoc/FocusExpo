# ARCHITECTURE.md - FocusExpo 完整架构设计文档

本文档详细说明 FocusExpo 的架构设计、数据流、组件关系和核心算法。

> **Note:** 此文件位于 `docs/` 目录。请使用 `bun run docs:arch` 快速打开。

---

## 目录

1. [系统架构概览](#系统架构概览)
2. [分层架构](#分层架构)
3. [数据流向](#数据流向)
4. [状态管理深度解析](#状态管理深度解析)
5. [iOS 原生集成详解](#ios-原生集成详解)
6. [核心算法](#核心算法)
7. [性能优化策略](#性能优化策略)
8. [扩展指南](#扩展指南)

---

## 系统架构概览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      React Native Layer                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │   Screens │  │ Components│  │   Hooks   │  │  Modals   ││
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘│
└────────┼──────────────┼──────────────┼──────────────┼────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  Zustand State Management   │
         │  (13 Independent Stores)    │
         └──────────────┬──────────────┘
                        │
      ┌─────────────────┼─────────────────┐
      │                 │                 │
   ┌──▼──┐         ┌───▼───┐        ┌──▼──┐
   │MMKV │     AsyncStorage │   API │HTTP │
   │ L1  │         L2       │   ├───┤     │
   └─────┘         └────────┘   │   └─────┘
      │              │          │
      └──────────────┼──────────┼──────┐
                     │          │      │
         ┌───────────┴──┐   ┌───▼──┐ │
         │    iOS      │   │  API  │ │
         │ Native Layer│   │Server │ │
         └─────────────┘   └───────┘ │
              │                      │
    ┌─────────┼──────────┐          │
    │         │          │          │
 ┌──▼──┐  ┌──▼──┐  ┌───▼───┐      │
 │Shield│  │Monitor Extended│      │
 │Ext.  │  │Ext.   Logic    │      │
 └──────┘  └──────┘  └────────┘     │
              │                     │
              └─────────────────────┘
              (App Groups Shared)
```

### 核心模块

| 模块 | 职责 | 关键文件 |
|------|------|--------|
| **UI 层** | 屏幕和组件渲染 | `app/`, `src/components/` |
| **状态管理** | 全局状态和业务逻辑 | `src/stores/` |
| **API 层** | HTTP 请求和数据同步 | `src/utils/request.ts` |
| **存储层** | 三层数据持久化 | `src/utils/storage.ts` |
| **原生层** | iOS Screen Time 集成 | `src/native/ios/`, `ios/` |
| **事件系统** | 跨层通信 | 事件总线和监听器 |

---

## 分层架构

### 第 1 层：UI 层（Expo Router）

**职责：** 页面路由、用户交互、组件渲染

```
Expo Router v5 (文件基础路由)
├── app/(tabs)/           # 底部标签导航
├── app/plans/            # 计划管理
├── app/apps/             # App 管理
├── app/login/            # 认证流程
└── app/_layout.tsx       # 全局根布局
```

**特点：**
- 自动生成路由树
- 原生导航栈管理
- Deep linking 支持

### 第 2 层：逻辑层（Zustand Store）

**职责：** 业务逻辑、状态管理、数据操作

```typescript
// Store 三部分组成
Zustand Store = 初始状态 + 派生状态 + 操作方法

// 存储器：跨 Store 通信
const store1 = useStore1.getState();
store1.method();

// 计算器：派生状态
const activeCount = usePlanStore((s) => s.plans.filter(p => p.active).length);
```

**13 个 Store 分工：**

| Store | 代码行数 | 职责 |
|-------|--------|------|
| **usePlanStore** | 321 | 计划 CRUD、活跃计划、定时逻辑 |
| **useUserStore** | 283 | 认证、用户信息、设备ID |
| **useRecordStore** | 166 | 记录创建、更新、统计计算 |
| **useChallengeStore** | 220 | 挑战管理、参与、完成 |
| **useAppStore** | 149 | App 列表、屏蔽应用 |
| **useHomeStore** | 145 | 首页 UI 状态、权限状态 |
| **useGuideStore** | 162 | 引导步骤、完成状态 |
| **useExperimentStore** | 86 | 实验分组、功能开关 |
| **useVipStore** | 74 | VIP 权限检查 |
| **useBenefitStore** | 47 | 积分管理、兑换 |
| **usePermisStore** | 67 | 权限状态、请求流程 |
| **useDebugStore** | 61 | 调试日志、开关 |
| **useStatisticStore** | 52 | 数据聚合、统计 |

### 第 3 层：数据持久化层（三层存储）

```
应用运行时
    ↓
┌───────────────┐
│  L1: MMKV     │  (高频读写)
│ 纯内存存储     │  <100ms 访问时间
└────────┬──────┘
         │
    ┌────▼─────┐
    │  L2：    │  (用户偏好)
    │Async    │  <200ms 访问时间
    │Storage  │
    └────┬────┘
         │
    ┌────▼──────────┐
    │ L3: Shared    │  (跨应用共享)
    │ GroupPrefs    │  Extension 访问
    └───────────────┘
```

**存储分工：**

| 数据类型 | 存储库 | 理由 | 生命周期 |
|---------|------|------|--------|
| 计划列表 | MMKV | 频繁读写 | 应用期间 |
| 活跃记录 | MMKV | 实时更新 | 专注时段 |
| 用户信息 | AsyncStorage | 跨应用访问 | App 启动 → 登出 |
| Token | AsyncStorage | 安全存储 | 永久 |
| App 列表 | MMKV | 缓存 | App 启动 → 1 小时 |
| 权限状态 | SharedGroupPrefs | Extension 需要 | 永久 |

### 第 4 层：API 层

```typescript
// 单例模式 HTTP 客户端
const instance = axios.create({
  baseURL: 'https://focus.ruidoc.cn/dev-api',
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
    os: 'ios',
    'project-tag': 'focusone'
  },
});

// 请求拦截器：自动添加 Token
request.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${storage.getString('access_token')}`;
  return config;
});

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  response => response.data,
  error => {
    Toast(error.response?.data?.message, 'error');
    if (error.response?.status === 401) {
      // 清除过期 Token
      storage.delete('access_token');
    }
    return Promise.reject(error);
  }
);
```

**重试机制（axios-retry）：**

```typescript
axiosRetry(instance, {
  retries: 0,  // 可配置重试次数
  retryDelay: exponentialDelay,  // 指数退避：100ms, 200ms, 400ms...
  retryCondition: (error) => !error.response || error.response.status !== 200
});
```

### 第 5 层：iOS 原生层

```
┌──────────────────────────────────────────┐
│      React Native Bridge Layer           │
│   (src/native/ios/methods.ts)            │
│   (src/native/ios/events.ts)             │
└────────────────┬─────────────────────────┘
                 │
        ┌────────▼─────────┐
        │ Native Module    │
        │ Objective-C      │
        │ JavaScript       │
        │ Bindings         │
        └────────┬─────────┘
                 │
        ┌────────▼───────────────────┐
        │   iOS Native Components    │
        ├───────────────────────────┤
        │ • NativeModule.swift      │ Screen Time API
        │ • FamilyControls          │ VPN 拦截
        │ • DeviceActivityMonitor   │ 活动监控
        └────────┬───────────────────┘
                 │
        ┌────────▼───────────────────┐
        │  Extension Layer           │
        ├───────────────────────────┤
        │ • ShieldExtension         │ 屏蔽规则
        │ • MonitorExtension        │ 监控数据
        │ • ReportExtension         │ 使用报告
        └───────────────────────────┘
```

---

## 数据流向

### 初始化流程

```
App 启动
  │
  ├─ RootLayout (_layout.tsx)
  │  ├─ useFonts()                    # 加载字体
  │  └─ useEffect(() => initAppData()) # 初始化数据
  │     │
  │     ├─ useUserStore.init()        # 恢复登录状态
  │     ├─ usePlanStore.init()        # 加载计划
  │     ├─ useAppStore.getIosApps()   # 获取 iOS App 列表
  │     └─ setupIOSSync()             # 设置 iOS 状态同步
  │        │
  │        ├─ createFocusStateListener() # 监听状态变化
  │        ├─ createExtensionLogListener() # 监听日志
  │        └─ AppState.addEventListener() # 监听前后台
  │
  ├─ PostHogProviderWrapper           # 初始化分析
  ├─ SuperwallProvider               # 初始化付费墙
  ├─ ThemeProvider                   # 初始化主题
  └─ ScreenStack                     # 加载屏幕
```

### 用户启动专注流程

```
用户点击"开始专注"
  │
  ├─ HomeScreen.tsx
  │  └─ usePlanStore.startFocus()
  │     │
  │     ├─ 创建 Record
  │     │  └─ API: POST /record/add
  │     │     └─ 获取 record_id
  │     │
  │     ├─ 启动 iOS 屏蔽（如果启用）
  │     │  └─ Methods.startAppLimits(duration)
  │     │     │
  │     │     ├─ iOS NativeModule.swift
  │     │     │  └─ 创建 Shield Extension 规则
  │     │     │
  │     │     └─ 返回 success
  │     │
  │     ├─ 启动链式定时器
  │     │  └─ startElapsedTimer()
  │     │     └─ 每分钟更新 elapsed_minutes
  │     │
  │     └─ 监听 iOS 事件
  │        └─ createFocusStateListener()
  │           └─ 当用户退出时 → 失败处理
  │
  └─ UI 更新
     └─ 显示计时器、暂停按钮等
```

### 暂停恢复流程

```
用户点击"暂停"
  │
  ├─ usePlanStore.pauseCurPlan()
  │  │
  │  ├─ Methods.pauseAppLimits(remainingMinutes)
  │  │  │
  │  │  └─ iOS: 设置恢复时间戳
  │  │
  │  ├─ useRecordStore.pauseRecord(record_id)
  │  │  │
  │  │  ├─ 保存暂停时间点
  │  │  └─ API: PATCH /record/update
  │  │
  │  └─ storage.set('paused_plan_id', plan_id)
  │
  └─ UI 显示"继续"按钮

用户点击"继续"
  │
  ├─ usePlanStore.resumeCurPlan()
  │  │
  │  ├─ Methods.resumeAppLimits()
  │  │  └─ iOS: 恢复屏蔽规则
  │  │
  │  ├─ useRecordStore.resumeRecord()
  │  │  └─ API: PATCH /record/update
  │  │
  │  └─ startElapsedTimer()
  │
  └─ UI 恢复计时器
```

### 网络请求流程

```
Component 发起请求
  │
  ├─ request.get('/plan/lists')
  │
  ├─ 请求拦截器
  │  └─ 添加 Authorization 头
  │
  ├─ HTTP 发送
  │  ├─ 200 OK     → 返回数据
  │  ├─ 401 错误   → 清除 Token，跳转登录
  │  ├─ 4xx/5xx    → 显示 Toast，返回 error
  │  └─ 网络错误   → 自动重试（指数退避）
  │
  └─ Component 更新 UI
```

---

## 状态管理深度解析

### Zustand Store 模式

```typescript
// 标准模式
import { combine } from 'zustand/middleware';
import { create } from 'zustand';

const usePlanStore = create(
  combine(
    // 第 1 部分：初始状态
    {
      plans: [] as Plan[],
      activePlan: null as Plan | null,
      loading: false,
      error: null as string | null,
    },

    // 第 2 部分：方法和操作
    (set, get) => ({
      // ===== 同步操作 =====
      setPlan: (plan: Plan) => {
        set((state) => ({
          plans: [...state.plans, plan]
        }));
      },

      // ===== 异步操作 =====
      async fetchPlans() {
        set({ loading: true });
        try {
          const { data } = await request.get('/plan/lists');
          set({ plans: data, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // ===== 派生状态 =====
      getActivePlanId: () => get().activePlan?.id,

      // ===== 跨 Store 操作 =====
      async pauseCurPlan() {
        const curPlan = get().activePlan;
        if (!curPlan) return;

        // 调用其他 Store 的方法
        const recordStore = useRecordStore.getState();
        await recordStore.pauseRecord(curPlan.record_id);

        // 调用原生方法
        await Methods.pauseAppLimits(curPlan.remaining_minutes);

        // 更新自身状态
        set({ activePlan: { ...curPlan, paused: true } });
      },

      // ===== 初始化 =====
      async init() {
        // App 启动时调用
        const { token } = await storage.getUser();
        if (token) {
          await get().fetchPlans();
        }
      }
    })
  )
);
```

### Store 选择器模式

```typescript
// 选择整个 Store
const store = usePlanStore();

// 选择单个属性（优化性能，避免不必要渲染）
const activePlan = usePlanStore(s => s.activePlan);

// 选择多个属性
const { plans, loading } = usePlanStore(
  (state) => ({
    plans: state.plans,
    loading: state.loading
  })
);

// 派生状态选择器
const planCount = usePlanStore(s => s.plans.length);
```

### 跨 Store 通信

```typescript
// ❌ 避免：循环依赖
// Store A 订阅 Store B
// Store B 订阅 Store A

// ✅ 推荐：单向通信
// 通过 getState() 访问
const handlerInStoreA = () => {
  const storeB = useStoreB.getState();
  storeB.someMethod();
};

// 或通过事件总线
EventBus.emit('event-name', data);
```

---

## iOS 原生集成详解

### Bridge 架构

#### 发送方向：JS → Native（Methods）

```typescript
// src/native/ios/methods.ts

export async function checkScreenTimePermission(): Promise<ScreenTimePermissionStatus> {
  return NativeModules.FocusExpoModule.checkScreenTimePermission();
}

export async function startAppLimits(
  durationMinutes?: number,
  planId?: string
): Promise<boolean> {
  return NativeModules.FocusExpoModule.startAppLimits(durationMinutes, planId);
}
```

**对应的 iOS Native 代码：**

```swift
// ios/NativeModule.swift
@objc func checkScreenTimePermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
  let status: String
  switch FamilyControls.current {
    case .approved:
      status = "approved"
    case .denied:
      status = "denied"
    case .notDetermined:
      status = "notDetermined"
    @unknown default:
      status = "unknown"
  }
  resolve(status)
}

@objc func startAppLimits(_ durationMinutes: NSNumber?, planId: String?, resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
  let duration = TimeInterval((durationMinutes?.intValue ?? 60) * 60)
  let endDate = Date().addingTimeInterval(duration)

  // 创建 Shield Extension 规则
  let schedule = DeviceActivitySchedule(
    every: .day,
    during: DateComponentsRange(start: DateComponents(hour: 0, minute: 0), end: DateComponents(hour: 23, minute: 59))
  )

  // ... Shield 配置
  resolve(true)
}
```

#### 接收方向：Native → JS（Events）

```typescript
// src/native/ios/events.ts

export function createFocusStateListener(
  callback: (event: FocusStateEvent) => void
): EventSubscription {
  return new NativeEventEmitter(NativeModules.FocusExpoModule)
    .addListener('focus-state', callback);
}
```

**对应的 iOS Native 代码：**

```swift
// ios/NativeModule.swift (继承 RCTEventEmitter)
extension NativeModule {
  @objc override func supportedEvents() -> [String]! {
    return ["focus-state", "extension-log"]
  }

  func notifyFocusStateChange(state: String, reason: String? = nil) {
    sendEvent(withName: "focus-state", body: [
      "state": state,  // "started", "paused", "resumed", "ended", "failed"
      "reason": reason
    ])
  }
}
```

### App Groups 数据共享

```
┌────────────────────┐
│   Main App         │
│  (FocusExpo)       │
│  ┌──────────────┐  │
│  │ MMKV Storage │  │
│  └────────┬─────┘  │
└───────────┼────────┘
            │
      ┌─────▼─────────────────────┐
      │  Shared Container         │
      │  group.com.focusone       │
      │  (SharedGroupPreferences) │
      │                           │
      │ • focused_until_timestamp │
      │ • shield_rule_data        │
      │ • allowed_app_tokens      │
      └─────┬───────────────────┬─┘
            │                   │
      ┌─────▼──────┐      ┌────▼──────────┐
      │Shield Ext. │      │Monitor/Report │
      │ (Blocking) │      │  Extension    │
      └────────────┘      └───────────────┘
```

**数据同步模式：**

```typescript
// 主应用写入
storage.setGroup('shield_data', JSON.stringify({
  active: true,
  appTokens: selectedApps.map(a => a.tokenData),
  endTime: Date.now() + durationMs
}));

// Extension 读取
let userDefaults = UserDefaults.init(suiteName: "group.com.focusone");
if let data = userDefaults?.string(forKey: "shield_data") {
  let shieldConfig = try JSONDecoder().decode(ShieldConfig.self, from: data.data(using: .utf8)!)
  // 应用屏蔽规则
}
```

---

## 核心算法

### 1. 链式定时器（防漂移）

**问题：** `setInterval` 容易累积时间误差

**解决方案：** 链式定时器

```typescript
function startElapsedTimer(initialMinutes: number) {
  let elapsedMinutes = initialMinutes;
  let timerRef: NodeJS.Timeout | null = null;

  const schedule = () => {
    const now = new Date();
    const currentSeconds = now.getSeconds();
    const nextSeconds = currentSeconds === 0 ? 60 : 60 - currentSeconds;

    // 计算到下一个整分时刻的延迟
    const delayMs = nextSeconds * 1000;

    timerRef = setTimeout(() => {
      elapsedMinutes += 1;
      updateUI(elapsedMinutes);  // UI 更新

      // 同步到 Store 和 iOS
      usePlanStore.setState({ elapsed_minutes: elapsedMinutes });
      syncIOSStatus();

      schedule();  // 递归调用，保证在整分时刻更新
    }, delayMs);
  };

  schedule();

  return () => {
    if (timerRef) clearTimeout(timerRef);
  };
}

// 使用方式
useEffect(() => {
  const cleanup = startElapsedTimer(0);
  return cleanup;
}, []);
```

**精度分析：**

| 方案 | 精度 | 漂移 | 适用场景 |
|------|------|------|--------|
| setInterval | ±10-50ms | 60分钟 ~10秒 | 不适合长时间计时 |
| 链式定时器 | ±1000ms | 60分钟 ~0秒 | 专注时计时 ✅ |
| requestAnimationFrame | ±16ms | 60分钟 ~1秒 | UI 动画 |

### 2. 计划重复模式匹配算法

**支持的重复模式：**

```typescript
interface RepeatPattern {
  type: 'once' | 'daily' | 'weekly' | 'custom';
  interval?: number;  // 天数间隔
  daysOfWeek?: number[];  // 0=Sunday, 1=Monday, ...
  customDays?: string[];  // 自定义日期列表
}
```

**计算下一次执行时间：**

```typescript
function getNextExecutionTime(plan: Plan, referenceDate: Date = new Date()): Date | null {
  const { repeatPattern, scheduleTime } = plan;

  switch (repeatPattern.type) {
    case 'once':
      // 检查是否在有效期内
      return plan.startDate <= referenceDate && plan.endDate >= referenceDate
        ? plan.scheduleTime
        : null;

    case 'daily':
      // 每日重复
      const dailyNext = new Date(referenceDate);
      dailyNext.setHours(scheduleTime.hour, scheduleTime.minute, 0);

      if (dailyNext <= referenceDate) {
        dailyNext.setDate(dailyNext.getDate() + (repeatPattern.interval || 1));
      }
      return dailyNext;

    case 'weekly':
      // 按指定星期重复
      const weeklyNext = new Date(referenceDate);
      let daysToAdd = 0;

      while (daysToAdd < 7) {
        const checkDate = new Date(weeklyNext);
        checkDate.setDate(checkDate.getDate() + daysToAdd);

        if (repeatPattern.daysOfWeek?.includes(checkDate.getDay())) {
          checkDate.setHours(scheduleTime.hour, scheduleTime.minute, 0);
          if (checkDate > referenceDate) {
            return checkDate;
          }
        }
        daysToAdd++;
      }
      return null;

    case 'custom':
      // 自定义日期列表
      const validDates = repeatPattern.customDays
        ?.map(d => new Date(`${d}T${scheduleTime.hour}:${scheduleTime.minute}`))
        .filter(d => d > referenceDate)
        .sort((a, b) => a.getTime() - b.getTime());

      return validDates?.[0] || null;
  }
}

// 批量计算本周计划
function getPlansForWeek(plans: Plan[], weekStart: Date): Plan[] {
  return plans.filter(plan => {
    const nextTime = getNextExecutionTime(plan, weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return nextTime && nextTime < weekEnd;
  });
}
```

### 3. 记录统计计算

```typescript
interface Record {
  id: string;
  plan_id: string;
  created_at: number;
  started_at: number;
  ended_at?: number;
  paused_at?: number;
  resumed_at?: number;
  reason?: 'completed' | 'exited' | 'system';
  target_minutes: number;
  actual_minutes: number;
}

// 计算统计数据
function calculateStatistics(records: Record[], period: 'day' | 'week' | 'month'): Statistics {
  const filtered = filterByPeriod(records, period);

  return {
    // 总专注时长
    totalMinutes: filtered.reduce((sum, r) => sum + r.actual_minutes, 0),

    // 成功率
    successRate: filtered.length > 0
      ? (filtered.filter(r => r.reason === 'completed').length / filtered.length) * 100
      : 0,

    // 平均单次时长
    averageMinutes: filtered.length > 0
      ? filtered.reduce((sum, r) => sum + r.actual_minutes, 0) / filtered.length
      : 0,

    // 完成次数
    completedCount: filtered.filter(r => r.reason === 'completed').length,

    // 退出次数
    exitedCount: filtered.filter(r => r.reason === 'exited').length,

    // 最长记录
    longestStreak: calculateLongestStreak(filtered),

    // 连续活跃天数
    consecutiveDays: calculateConsecutiveDays(filtered)
  };
}

// 计算最长连续完成次数
function calculateLongestStreak(records: Record[]): number {
  const sorted = records
    .filter(r => r.reason === 'completed')
    .sort((a, b) => a.started_at - b.started_at);

  let maxStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  for (const record of sorted) {
    const recordDate = new Date(record.started_at).toDateString();
    const prevDate = lastDate?.toDateString();

    if (prevDate === recordDate) {
      currentStreak++;
    } else {
      const dayDiff = lastDate
        ? Math.floor((new Date(recordDate).getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))
        : 1;

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }

    maxStreak = Math.max(maxStreak, currentStreak);
    lastDate = new Date(record.started_at);
  }

  return maxStreak;
}
```

---

## 性能优化策略

### 1. 渲染优化

```typescript
// ❌ 低效：每次渲染都创建新对象
function PlanItem({ plan }: Props) {
  const style = {  // 每次渲染都创建新对象
    padding: 10,
    marginBottom: 5,
  };
  return <View style={style} />;
}

// ✅ 高效：使用 useMemo 缓存对象
const styles = useMemo(() => ({
  padding: 10,
  marginBottom: 5,
}), []);

function PlanItem({ plan }: Props) {
  return <View style={styles} />;
}

// ✅ 更好：使用 StyleSheet
const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginBottom: 5,
  }
});

function PlanItem({ plan }: Props) {
  return <View style={styles.container} />;
}
```

### 2. 选择器优化

```typescript
// ❌ 低效：每次返回新数组，导致子组件重渲染
const activePlans = usePlanStore((s) => s.plans.filter(p => p.active));

// ✅ 高效：使用 useMemo 缓存计算结果
const activePlans = useMemo(
  () => usePlanStore.getState().plans.filter(p => p.active),
  [plans]
);

// ✅ 最好：在 Store 中预计算
const usePlanStore = create(
  combine(
    { plans: [] as Plan[] },
    (set, get) => ({
      getActivePlans: () => get().plans.filter(p => p.active)
    })
  )
);

// 在组件中使用
const activePlans = usePlanStore(s => s.getActivePlans());
```

### 3. 列表性能优化

```typescript
// FlatList 配置（适合大列表）
<FlatList
  data={plans}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <PlanItem plan={item} />}
  removeClippedSubviews={true}        // 移除不可见子视图
  maxToRenderPerBatch={10}             // 每批渲染 10 个
  updateCellsBatchingPeriod={50}       // 50ms 更新一批
  initialNumToRender={10}              // 初始渲染 10 个
  scrollIndicatorInsets={{ right: 1 }} // 优化滚动
  getItemLayout={(data, index) => ({   // 固定高度，避免动态计算
    length: 80,
    offset: 80 * index,
    index,
  })}
/>
```

### 4. 存储优化

```typescript
// ❌ 低效：每次操作都整体替换
storage.set('plans', JSON.stringify([...plans, newPlan]));

// ✅ 高效：使用增量更新
const plans = JSON.parse(storage.get('plans') || '[]');
plans.push(newPlan);
storage.set('plans', JSON.stringify(plans));

// ✅ 最好：使用专门的数据库（如 Realm）
// 但当前项目用 MMKV + AsyncStorage 已够用
```

---

## 扩展指南

### 添加新的 Store

```typescript
// 1. 创建 src/stores/new-feature.ts
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

export const useNewFeatureStore = create(
  combine(
    {
      data: [] as any[],
      loading: false,
    },
    (set, get) => ({
      async fetchData() {
        set({ loading: true });
        try {
          const { data } = await request.get('/new-feature/list');
          set({ data, loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },
    })
  )
);

// 2. 在 src/stores/index.ts 中导出
export { useNewFeatureStore } from './new-feature';

// 3. 在组件中使用
import { useNewFeatureStore } from '@/stores';

function MyComponent() {
  const { data, loading } = useNewFeatureStore();
  // ...
}
```

### 添加新的 API 端点

```typescript
// 1. 在 src/utils/request.ts 中添加拦截器
if (url.includes('/new-feature')) {
  // 特殊处理
}

// 2. 创建专门的 API 服务（可选）
// src/services/new-feature.ts
export const newFeatureService = {
  list: (page: number) => request.get('/new-feature/list', { params: { page } }),
  create: (data: any) => request.post('/new-feature/create', data),
  update: (id: string, data: any) => request.patch(`/new-feature/${id}`, data),
  delete: (id: string) => request.delete(`/new-feature/${id}`),
};

// 3. 在 Store 中调用
async fetchData() {
  const { data } = await newFeatureService.list(1);
  set({ data });
}
```

### 添加新的屏幕

```typescript
// 1. 在 app/ 中创建文件
// app/new-feature/index.tsx
import { useNewFeatureStore } from '@/stores';

export default function NewFeatureScreen() {
  const { data, loading } = useNewFeatureStore();

  return (
    <View className="flex-1">
      {/* 页面内容 */}
    </View>
  );
}

// 2. Expo Router 自动生成路由
// 访问方式：navigation.navigate('new-feature')
```

### iOS 原生方法扩展

```typescript
// 1. 在 src/native/ios/methods.ts 中添加
export async function newNativeMethod(param: string): Promise<any> {
  return NativeModules.FocusExpoModule.newNativeMethod(param);
}

// 2. 在 iOS 代码中实现
// ios/NativeModule.swift
@objc func newNativeMethod(_ param: String, resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
  // 实现逻辑
  resolve(result)
}

// 3. 在 Objective-C 中暴露
// ios/NativeModuleBridge.m
RCT_EXPORT_METHOD(newNativeMethod:(NSString *)param
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  // 调用 Swift 代码
}
```

---

本文档为 FocusExpo 的完整架构指南，更新于 2026 年 1 月。如有问题，请参考 CLAUDE.md 快速参考。
