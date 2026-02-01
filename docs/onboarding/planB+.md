# Onboarding 方案 Plan B+

基于 Plan B 优化，融合产品分析结论的最终方案。

---

## 核心理念

1. **权限必须授予** - 没有权限无法实现屏蔽，必须明确告知用户
2. **价值引导不可省略** - 让用户理解「定时计划」vs「手动开启」的本质区别
3. **登录有明确价值** - 不是「解锁功能」，而是「登录后创建计划」
4. **不提供整体跳过** - 仅在价值引导页提供跳过选项

---

## 流程设计（6步）

```
Welcome → UserProfile → PermissionSetup → QuickExperience → ValueGuide → 登录/创建计划
```

### 流程图

```
┌──────────┐    ┌─────────────┐    ┌─────────────────┐
│ Welcome  │───▶│ UserProfile │───▶│ PermissionSetup │
└──────────┘    └─────────────┘    └─────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────┐
│                  QuickExperience                      │
│                  5分钟专注体验                         │
└──────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────┐
│                    ValueGuide                         │
│              价值引导（认知翻转）                       │
│                                                       │
│  CTA: 「登录后创建计划」    Skip: 「跳过」              │
└──────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
    登录 → 创建计划 → 首页              首页
```

---

## 各步骤详细设计

### Step 1: Welcome

**目标：** 痛点共鸣 + 功能预览

**内容：**
- 主标题：重新掌控你的时间
- 副标题：别让屏幕偷走你的生活，建立健康的数字习惯
- 功能预览卡片（可选）：
  - 屏蔽干扰应用
  - 定时自动执行
  - 专注数据统计

**CTA：** 开启专注之旅

**Skip：** 无

---

### Step 2: UserProfile

**目标：** 收集用户画像，用于个性化体验

**内容：**
- 主标题：目标设定
- 副标题：告诉我您目前遇到的最大困扰，为您量身定制专注方案

**收集信息：**

1. 困扰类型（单选）：
   - 短视频上瘾 - 刷到停不下来
   - 沉迷游戏 - 难以控制时间
   - 学习分心 - 玩手机影响效率
   - 其他 - 我只是想专注

**交互：** 选中后自动进入下一步（300ms 延迟）

**Skip：** 无

---

### Step 3: PermissionSetup

**目标：** 权限授权 + 选择应用（**必须完成**）

**内容：**
- 主标题：屏蔽设置
- 副标题：根据用户选择动态显示（如「戒除短视频依赖」）

**两步设置：**

1. **授权屏幕时间权限**
   - 说明：用于检测和屏蔽应用
   - 隐私承诺：
     - 仅在本地运行，不上传数据
     - 无法查看聊天记录或隐私
     - 符合 Apple 隐私政策
   - 如果拒绝：弹窗引导去设置中开启

2. **选择要屏蔽的应用**
   - 调用系统选择器

**CTA：** 下一步（两步都完成后才可点击）

**Skip：** 无（权限是必须的）

---

### Step 4: QuickExperience

**目标：** 2分钟专注体验，验证屏蔽效果

**分两个阶段：**

#### 阶段 A：准备开启
- 主标题：准备开启
- 副标题：**根据困扰类型动态显示**
  - 短视频上瘾：告别无尽的短视频，从 2 分钟微习惯开始
  - 沉迷游戏：游戏可以晚点玩，先从 2 分钟微习惯开始
  - 学习分心：为学习创造纯净环境，先从 2 分钟微习惯开始
  - 其他：建立专注习惯，先从 2 分钟微习惯开始
- 展示已选应用列表
- CTA：开始 2 分钟专注

#### 阶段 B：屏蔽生效中
- 主标题：屏蔽生效中
- 显示倒计时（实时）
- 提示：**根据困扰类型动态显示**
  - 短视频上瘾：试试返回桌面，打开抖音或小红书
  - 沉迷游戏：试试返回桌面，打开你的游戏
  - 学习分心：试试返回桌面，打开那些让你分心的 App
  - 其他：试试返回桌面，打开上面的应用
- CTA：已查看，下一步（ghost 样式）

**Skip：** 无

---

### Step 5: ValueGuide（价值引导 / 认知翻转）

**目标：** 让用户理解「定时计划」的价值

**内容：根据困扰类型显示个性化文案**

| 困扰类型 | 成功提示 | 痛点共鸣 | 解决方案 |
|---------|---------|---------|---------|
| 短视频上瘾 | 你刚刚成功远离了短视频 | 我们都知道，"再刷一会儿"的念头有多难抵抗。 | 设置定时计划后，到点自动屏蔽，你不用再跟自己较劲。 |
| 沉迷游戏 | 你刚刚成功控制了游戏时间 | 我们都知道，"打完这局就停"说起来容易做起来难。 | 设置定时计划后，到点自动屏蔽，帮你从游戏中抽身。 |
| 学习分心 | 你刚刚体验了无干扰的专注 | 学习时总想"看一眼手机"，这种冲动很正常。 | 设置学习时段计划，让系统帮你隔绝干扰，专注更轻松。 |
| 其他 | 你刚刚完成了一次专注 | 保持专注需要消耗意志力，时间久了难免松懈。 | 设置定时计划后，每天自动执行，无需操作，无需纠结。 |

**通用文案：**
```
{成功提示}

{痛点共鸣}

但今天你做到了。问题是，明天呢？后天呢？

━━━━━━━━━━━━━━━━━━━━━

与其每天跟自己较劲，不如让系统帮你

{解决方案}

[设置一次] [每天自动] [不用纠结]
```

**文案设计原则：**
- 用「我们」而非「你」，减少对立感
- 先认可用户的成功，再引出问题
- 不说「注定失败」这类打击性语言
- 强调「不用纠结」的轻松感

**CTA：** 登录后创建计划

**Skip：** 跳过（底部小字）

**点击 CTA 后的流程：**
1. 进入登录页（微信/Apple）
2. 登录成功 → 跳转到「创建计划」页面（plans/add）
3. 创建完成 → 进入首页

**点击 Skip 后：**
1. 标记 onboarding 完成
2. 直接进入首页
3. 首页持续引导登录和创建计划

---

## 技术实现要点

### 文件结构

```
app/
├── others/
│   └── welcome.tsx          # Step 1: Welcome
└── onboarding/
    └── index.tsx            # 步骤管理器

src/components/onboarding/
├── index.ts                 # 导出
├── UserProfile.tsx          # Step 2: 用户画像
├── PermissionSetup.tsx      # Step 3: 权限设置（已有，需调整）
├── QuickExperience.tsx      # Step 4: 5分钟体验（合并 FocusReady + FocusActive）
└── ValueGuide.tsx           # Step 5: 价值引导
```

### 状态管理

- `problem`: 用户选择的困扰类型（用于个性化文案）
- `selectedAppName`: 第一个被选中的应用名（用于展示）
- `step`: 当前步骤（1-4）

### 个性化文案逻辑

`problem` 会传递给 `QuickExperience` 和 `ValueGuide` 组件，用于展示针对性文案：
- 短视频上瘾 → 强调「告别无尽刷屏」
- 沉迷游戏 → 强调「控制游戏时间」
- 学习分心 → 强调「纯净学习环境」
- 其他 → 通用专注文案

### 关键交互

1. **权限拒绝处理：**
   ```typescript
   if (status === 'denied') {
     Alert.alert(
       '需要开启权限',
       '屏蔽功能需要「屏幕使用时间」权限才能生效',
       [
         { text: '去设置', onPress: () => Linking.openSettings() },
         { text: '重试', onPress: () => checkPermission() },
       ]
     );
   }
   ```

2. **2分钟倒计时：**
   ```typescript
   const FOCUS_DURATION = 2; // 分钟
   const [remaining, setRemaining] = useState(FOCUS_DURATION * 60);
   useEffect(() => {
     const timer = setInterval(() => {
       setRemaining(prev => Math.max(0, prev - 1));
     }, 1000);
     return () => clearInterval(timer);
   }, []);
   ```

3. **登录后跳转创建计划：**
   ```typescript
   const handleLoginSuccess = () => {
     markOnboardingCompleted();
     router.replace('/plans/add?from=onboarding');
   };
   ```

---

## 埋点设计

| 事件名 | 触发时机 | 参数 |
|--------|----------|------|
| `onboarding_step_viewed` | 进入每一步 | `{ step, step_name }` |
| `onboarding_profile_selected` | 选择困扰类型 | `{ problem }` |
| `onboarding_permission_granted` | 权限授权成功 | `{}` |
| `onboarding_permission_denied` | 权限被拒绝 | `{}` |
| `onboarding_apps_selected` | 选择完应用 | `{ app_count }` |
| `onboarding_focus_started` | 开始5分钟专注 | `{}` |
| `onboarding_focus_completed` | 5分钟专注完成 | `{}` |
| `onboarding_login_clicked` | 点击登录按钮 | `{}` |
| `onboarding_skipped` | 点击跳过 | `{ step }` |
| `onboarding_completed` | 完成整个流程 | `{ with_login, with_plan }` |

---

## 与当前代码对比

| 当前代码 | Plan B+ | 变化 |
|----------|---------|------|
| GoalSelect (3选项) | UserProfile (4选项) | 增加「其他」选项 |
| PermissionSetup | PermissionSetup | 权限必须，增加详细隐私说明 |
| FocusReady | 合并到 QuickExperience | - |
| FocusActive | 合并到 QuickExperience | 增加倒计时 |
| LoginPrompt | ValueGuide | 重新设计，强调价值引导 |

**步骤数：** 当前 5 步 → Plan B+ 5 步（Welcome 独立，合并 FocusReady/Active）
