# CLAUDE.md - FocusExpo 项目背景指南

为 Claude Code 和 Cursor IDE 提供的项目开发指南。未来在使用这些工具编码时，会自动读取此文件以理解项目背景。

---

## ⚠️ 重要声明

**请不要自动创建新的 Markdown 文档。**

本项目的文档组织如下：

- 📌 **此文件（CLAUDE.md）** - 自动读取，不要修改其结构
- 📌 **.cursor/rules** - Cursor IDE 自动应用，不要修改其结构
- 📂 **docs/** 目录 - 其他所有文档都放在这里

**如果用户没有明确声明需要新的 Markdown 文档，请不要创建。**

---

## 📋 项目概览

**FocusExpo** 是一个生产级别的 React Native 应用（仅支持 iOS），帮助用户管理专注时间并屏蔽分心应用。

### 核心功能

- 🎯 **专注计时**：支持一次性、定时、重复模式的计划
- 🚫 **应用屏蔽**：使用 iOS Screen Time + Shield Extension 强制屏蔽应用
- 📊 **数据统计**：专注时长、成功率、退出次数等多维度分析
- 👤 **用户系统**：Apple Sign-in / 微信登录、VIP 会员、积分奖励
- 🧪 **A/B 实验**：基于 PostHog 的灰度发布控制

### 项目规模

- ~10,000+ 行代码
- 30+ 屏幕
- 13 个 Zustand Store（1896 行）
- 47 个 React 组件
- ~50 个 npm 依赖

---

## 🚀 必需命令

```bash
# 依赖安装（使用 pnpm 包管理器）
pnpm install

# 开发
pnpm start              # 启动开发服务器
pnpm start -c           # 清除缓存后启动
pnpm ios                # 在 iOS 设备上运行

# 代码质量
pnpm lint               # 运行 ESLint

# Metro 卡死时
watchman watch-del-all
rm -rf node_modules/.cache
pnpm start -c
```

---

## 🔗 后端接口项目

### 项目位置
**路径**: `/Users/yangrui/ruidoc/FocusApi`

### 技术栈
- **框架**: NestJS (TypeScript)
- **运行时**: Node.js / Bun
- **包管理**: Yarn / Bun

### 启动命令
```bash
cd /Users/yangrui/ruidoc/FocusApi

# 开发模式（热重载）
yarn start:dev

# 生产模式
yarn start:prod

# 调试模式
yarn start:debug
```

### 模块结构
```
src/focusone/
├── plan/         # 专注计划 API
├── record/       # 专注记录 API
├── osapp/        # 应用管理 API
├── iosapp/       # iOS 应用 API
├── challenge/    # 挑战系统 API
├── benefit/      # 积分奖励 API
├── guide/        # 新手引导 API
└── admin/        # 管理后台 API
```

### API 文档
- 文档目录: `/Users/yangrui/ruidoc/FocusApi/docs/`
- OpenAI SDK: `docs/openai-api-guide.md`
- AI Service: `docs/ai-service-reference.md`
- AI 接口: `docs/ai-api-endpoints.md`

### 前后端联调
- **前端请求地址**: `https://focus.ruidoc.cn/dev-api`
- **本地开发**: 修改接口后需重启 `yarn start:dev`
- **接口修改**: 可直接修改 `/Users/yangrui/ruidoc/FocusApi/src/focusone/` 下的模块

---

## 🏗️ 核心架构

### 路由结构（Expo Router v5，文件基础路由）

```
app/
├── (tabs)/                    # 主标签导航（3个标签）
│   ├── index.tsx             # 专注页面（主页）
│   ├── record.tsx            # 统计页面
│   └── user.tsx              # 我的页面
├── plans/                     # 计划管理
│   ├── index.tsx             # 计划列表
│   ├── add.tsx               # 新建计划
│   └── item.tsx              # 计划详情
├── onboarding/               # 新手引导
├── setting/                   # 设置页面
├── login/                     # 登录认证
├── quick-start/              # 快速启动模式
├── apps/                      # ⚠️ 已归档（暂不迭代）
├── challenges/               # ⚠️ 已归档（暂不迭代）
└── _layout.tsx               # 全局根布局
```

### 📍 页面快速定位索引

**主要页面**
- 首页/专注 → `(tabs)/index.tsx`
- 统计 → `(tabs)/record.tsx`
- 我的 → `(tabs)/user.tsx`

**计划相关**
- 计划列表 → `plans/index.tsx`
- 新建计划 → `plans/add.tsx`
- 计划详情 → `plans/item.tsx`
- 预设模板 → `plans/presets.tsx`

**快速启动**
- 快速启动 → `quick-start/index.tsx`
- 模式切换 → `quick-start/mode-switcher.tsx`
- 时间滑块 → `quick-start/time-slider.tsx`

**用户/设置**
- VIP会员 → `user/vip.tsx`
- 积分 → `user/coins.tsx`
- 编辑资料 → `user/edit.tsx`
- 设置 → `setting/index.tsx`
- 权限 → `setting/permission.tsx`
- 意见反馈 → `setting/feedback.tsx`
- 关于我们 → `setting/about.tsx`
- 注销账号 → `setting/logoff.tsx`

**登录/引导**
- 登录 → `login/index.tsx`
- 登录开始 → `login/start.tsx`
- 注册 → `login/register.tsx`
- 微信登录 → `login/wx.tsx`
- 新手引导 → `onboarding/index.tsx`
- 欢迎页 → `others/welcome.tsx`

**⚠️ 已归档（暂不迭代）**
- 应用管理 → `apps/` (已归档，不在更新范围)
- 挑战系统 → `challenges/` (已归档，不在更新范围)

**其他**
- 支付 → `checkout/index.tsx`
- 调试 → `debug/index.tsx`
- WebView → `others/webview.tsx`
- 测试页面 → `test/index.tsx`
- Stripe测试 → `test/stripe.tsx`

### 状态管理（Zustand + combine 中间件）

**13 个独立 Store，按功能划分：**

| Store                  | 职责                               |
| ---------------------- | ---------------------------------- |
| **usePlanStore**       | 专注计划 CRUD、活跃计划、暂停/恢复 |
| **useUserStore**       | 登录认证、用户信息、Token 管理     |
| **useRecordStore**     | 专注记录、统计数据                 |
| **useChallengeStore**  | 挑战系统                           |
| **useAppStore**        | iOS App 列表、屏蔽应用管理         |
| **useHomeStore**       | 首页 UI 状态、权限状态             |
| **useGuideStore**      | 新手引导进度                       |
| **useExperimentStore** | A/B 实验分组                       |
| **useVipStore**        | VIP 会员权限                       |
| **useBenefitStore**    | 积分奖励系统                       |
| **usePermisStore**     | 权限管理                           |
| **useDebugStore**      | 调试工具                           |
| **useStatisticStore**  | 统计数据聚合                       |

**Store 通信模式：**

```typescript
// 跨 Store 访问（通过 getState）
const pauseCurPlan = async () => {
  const recordId = useRecordStore.getState().record_id;
  useRecordStore.getState().pauseRecord(recordId);
  useBenefitStore.getState().subBalance();
};
```

### 存储三层架构

| 层级               | 库                     | 用途             | 例子                                                  |
| ------------------ | ---------------------- | ---------------- | ----------------------------------------------------- |
| **L1：高性能缓存** | MMKV                   | 计划、记录、权限 | `storage.set('cus_plans', JSON.stringify(plans))`     |
| **L2：用户偏好**   | AsyncStorage           | 用户信息、Token  | `AsyncStorage.setItem('user_info', JSON.stringify())` |
| **L3：跨应用同享** | SharedGroupPreferences | iOS App Groups   | `storage.setGroup('key', value)`                      |

---

## 📱 iOS 原生集成

### 架构

```
JS Layer (React Native)
    ↓
Native Bridge (methods.ts / events.ts)
    ↓
iOS Native Layer
    ├─ NativeModule.swift (Screen Time API)
    ├─ ShieldExtension (屏蔽应用)
    ├─ MonitorExtension (监控活动)
    └─ ReportExtension (收集数据)
```

### 关键接口

**发送方法（JS → Native）:**

```typescript
// src/native/ios/methods.ts
checkScreenTimePermission()        // 检查权限
requestScreenTimePermission()      // 请求权限
startAppLimits(durationMinutes)    // 启动屏蔽
stopAppLimits()                    // 停止屏蔽
pauseAppLimits(durationMinutes)    // 暂停屏蔽
resumeAppLimits()                  // 恢复屏蔽
getFocusStatus(): FocusStatus      // 获取专注状态
```

**监听事件（Native → JS）:**

```typescript
// src/native/ios/events.ts
focus - state; // 专注状态变化
extension - log; // Extension 日志
```

### 类型定义

```typescript
interface FocusStatus {
  active: boolean; // 是否运行中
  paused?: boolean; // 是否暂停
  failed?: boolean; // 是否失败
  plan_id?: string; // 计划 ID
  record_id?: string; // 记录 ID
  startAt?: number; // 开始时间戳
  elapsedMinutes?: number; // 已运行分钟数
  pausedUntil?: number; // 暂停结束时间戳
}
```

---

## 🎨 UI 系统

### 主题系统

- **NativeWind**（Tailwind for React Native）
- **自有 UI 组件库**（src/components/ui/）
- **CSS 变量**（light/dark 主题自动切换）

### 颜色变量

```css
--primary          --secondary        --destructive
--muted            --accent           --background
--foreground        --card             --border
```

使用方式：

```jsx
<View className="flex-1 bg-primary text-foreground" />
```

---

## 📡 API 和网络

### 基础配置

```typescript
// src/utils/request.ts
const baseURL = 'https://focus.ruidoc.cn/dev-api'
timeout = 6000
自动添加 Bearer Token
401 自动清除 Token 并重新登录
```

### 主要端点

- `/plan/*` - 计划管理
- `/record/*` - 记录管理
- `/osapp/*` - App 管理
- `/user/*` - 用户认证
- `/challenge/*` - 挑战系统
- `/experiment/assign` - 实验分配

### 重试机制

- 使用 `axios-retry`
- 指数退避算法
- 非 2xx 状态码自动重试

---

## 🔥 关键代码模式

### 1. Zustand Store 基础结构

```typescript
import { combine } from 'zustand/middleware';

const usePlanStore = combine(
  // 初始状态
  {
    plans: [] as Plan[],
    activePlan: null as Plan | null,
  },
  // 方法和操作
  (set, get) => ({
    // Getter
    getActivePlan: () => get().activePlan,

    // Setter
    setPlan: (plan: Plan) => set({ plans: [...get().plans, plan] }),

    // 跨 Store 访问
    async pausePlan() {
      const record = useRecordStore.getState();
      await record.pauseRecord(get().activePlan?.record_id);
    },
  }),
);
```

### 2. 链式定时器（防漂移）

```typescript
// src/native/ios/sync.ts
function startElapsedTimer(elapsedMinutes: number) {
  const schedule = () => {
    const now = new Date();
    const remainSeconds = 60 - now.getSeconds();
    // 在下一个整分时更新，防止时间漂移
    timerRef = setTimeout(() => {
      elapsedMinutes += 1;
      schedule(); // 递归调用
    }, remainSeconds * 1000);
  };
  schedule();
}
```

### 3. 权限检查流程

```typescript
const status = await checkScreenTimePermission();
switch (status) {
  case 'approved':
    await startAppLimits();
    break;
  case 'notDetermined':
    await requestScreenTimePermission();
    break;
  case 'denied':
    showPermissionDialog();
    break;
}
```

### 4. API 请求模式

```typescript
const response = await request.get('/plan/lists', {
  params: { page: 1, limit: 10 },
});
// 自动处理错误和 Token 刷新
// 自动显示 Toast 提示
```

---

## 📝 代码风格和最佳实践

### TypeScript

- 严格模式启用
- 路径别名：`@/*` → `./src/*`
- 所有 Store 和 utils 都有类型定义

### React Hooks

- ❌ **避免** `useEffect + useCallback` 组合（易导致死循环）
- ✅ **推荐** 内联事件处理器或 `useMemo`
- 明确声明依赖数组

### 组件文件组织

```
src/components/
├── ui/               # 基础 UI 组件库
├── home/             # 首页特定组件
├── business/         # 业务组件
├── modals/           # 模态框
├── system/           # 系统组件
└── debug/            # 调试组件
```

### 编码原则

- **简洁优先**：避免过度设计，直接的解决方案比复杂的模式好
- **一处设定**：配置集中在 `src/config/`
- **延迟初始化**：懒加载数据，按需请求
- **错误处理**：API 错误自动显示 Toast
- **日志记录**：重要操作记录到 console（开发环境）

---

## 🔍 常见开发任务

### 添加新屏幕

1. 在 `app/` 对应目录创建 `xxx.tsx`
2. 使用 Expo Router 文件基础路由（自动生成路由）
3. 导入现有 UI 组件：`src/components/ui/`
4. 连接到 Store：`const { data } = useXxxStore()`

### 修改专注计时逻辑

1. 编辑 `src/stores/plan.ts`（Store 逻辑）
2. 修改 `src/native/ios/sync.ts`（同步逻辑）
3. 更新 iOS 原生方法（如需要）
4. 测试暂停/恢复场景

### 处理应用屏蔽

1. 确保已请求 iOS 权限
2. 通过 `useAppStore` 选择要屏蔽的应用
3. 调用 `startAppLimits()` 启动屏蔽
4. 监听 `focus-state` 事件处理结果

### 集成新的第三方 API

1. 在 `src/utils/request.ts` 配置请求拦截器
2. 创建 Store 管理数据
3. 使用 PostHog 追踪用户行为
4. 错误处理统一返回 Toast

---

## 🛠️ 调试工具

### 调试页面

访问 `app/debug/index.tsx`（开发环境可见）

### 扩展日志

```typescript
createExtensionLogListener(event => {
  event.logs.forEach(log => {
    console.log(`[Extension ${log.level}]`, log.message);
  });
});
```

### 原生状态查询

```typescript
const status = await getFocusStatus();
console.log('当前专注状态:', status);
```

---

## ⚠️ 常见陷阱

1. **权限问题**：必须先请求权限才能执行屏蔽操作
2. **状态同步**：iOS 状态变化后需要调用 `syncIOSStatus()`
3. **时间漂移**：使用链式定时器，不要用 `setInterval`
4. **Store 初始化**：App 启动时调用 `store.init()`
5. **Token 过期**：401 错误自动清除 Token，需重新登录

---

## 📚 关键文件速查

| 文件                      | 说明                     |
| ------------------------- | ------------------------ |
| `app/_layout.tsx`         | 全局根布局、提供商初始化 |
| `src/stores/`             | 所有状态管理 Store       |
| `src/native/ios/`         | iOS 原生集成层           |
| `src/components/ui/`      | 基础 UI 组件库           |
| `src/utils/request.ts`    | HTTP 请求配置            |
| `src/utils/permission.ts` | 权限管理工具             |
| `src/config/theme.ts`     | 主题系统                 |
| `ios/NativeModule.swift`  | iOS 核心原生代码         |

---

## 📚 详细文档参考

此项目包含多个深度文档，涵盖不同的需求：

### 推荐阅读顺序

1. **本文件（CLAUDE.md）** ← 你正在看这个
   - 快速入门和日常开发参考
   - 项目概览、架构概览、常见任务

2. **CODE_EXAMPLES.md** ← 编码时查看
   - 完整的代码规范和实现示例
   - TypeScript、React、Zustand、API、iOS 原生集成的详细代码例子
   - 性能优化示例
   - 启动编码前建议先浏览一遍，明确代码风格

3. **ARCHITECTURE.md** ← 深度理解时查看
   - 系统架构的完整设计
   - 数据流向和算法实现
   - 核心概念（链式定时器、计划重复匹配等）
   - 修改核心逻辑前建议阅读相关章节

4. **.cursor/rules/focusexpo-architecture.mdc** ← Cursor IDE 自动应用
   - Cursor IDE 会自动应用这些规则
   - 无需手动查看，IDE 会在你编码时自动提示

### 文件位置和大小

```
FocusExpo/
├── CLAUDE.md (9.5 KB) - 快速参考，Claude Code 自动读取
├── ARCHITECTURE.md (20 KB) - 深度架构设计
├── CODE_EXAMPLES.md (18 KB) - 代码规范和示例
└── .cursor/rules/
    └── focusexpo-architecture.mdc (6.8 KB) - Cursor IDE 自动应用
```

### 快速导航

```
需要...                          → 查看文件
──────────────────────────────────────────────
快速启动项目                      CLAUDE.md → 必需命令
了解项目架构                      CLAUDE.md → 核心架构
学习代码规范                      CODE_EXAMPLES.md (全部)
参考代码实现                      CODE_EXAMPLES.md (相关章节)
理解系统设计                      ARCHITECTURE.md (相关章节)
学习核心算法                      ARCHITECTURE.md → 核心算法
优化性能                          CODE_EXAMPLES.md → 性能优化
扩展新功能                        ARCHITECTURE.md → 扩展指南
解决问题                          CLAUDE.md → 常见陷阱
查看 Cursor IDE 规则              .cursor/rules/focusexpo-architecture.mdc
```

### 三个文档的职责分工

| 文件                 | 大小 | 何时读     | 主要内容             |
| -------------------- | ---- | ---------- | -------------------- |
| **CLAUDE.md**        | 9.5K | 每次启动   | 快速参考、日常开发   |
| **CODE_EXAMPLES.md** | 18K  | 开始编码前 | 代码规范、详细示例   |
| **ARCHITECTURE.md**  | 20K  | 深度理解时 | 系统设计、算法、扩展 |
| **.cursor/rules/**   | 6.8K | 自动应用   | Cursor IDE 规则      |

---

## 📞 快速参考

**问题排查：**

- Metro 卡死？→ `watchman watch-del-all && expo start -c`
- 类型错误？→ `expo lint` 检查
- 构建失败？→ 清除 `node_modules/.cache`
- iOS 权限不工作？→ 检查 Xcode 配置和 Entitlements

**性能优化：**

- 使用 MMKV 替代 AsyncStorage（高频读写）
- 在 list 中使用 `useMemo` 避免重渲染
- 定期监听 AppState 同步状态

**发布流程：**

```bash
eas build --platform ios --profile production
```
