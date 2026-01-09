# FocusOne - 用户激活流程设计方案

## 📋 方案背景

### 当前问题
1. **新用户认知负担高**：首页同时展示"创建计划"和"快速开始"，不知道选哪个
2. **缺少首次体验引导**：没有让用户快速感受核心价值（应用屏蔽的强制力）
3. **激活路径断层**：完成快速专注后没有引导创建计划，用户容易流失
4. **用户分层缺失**：新用户、体验用户、活跃用户看到相同的界面

### 设计目标
✅ **降低首次使用门槛** - 2分钟快速体验，预选应用
✅ **渐进式激活** - 体验 → 完成 → 引导 → 养成习惯
✅ **强化核心价值** - 让用户立刻感受到屏蔽的"强制力"
✅ **提升留存率** - 完成首次体验后及时引导创建计划

---

## 🎯 用户分层策略

### 三类用户 + 三种引导

| 用户类型 | 识别条件 | 引导策略 | 核心目标 |
|---------|---------|---------|---------|
| 🆕 **新用户** | `focus_count = 0` | **强引导**：体验2分钟专注 | 感受核心价值 |
| 🎯 **体验用户** | `focus_count 1-2` 且无计划 | **中引导**：创建周期计划 | 培养使用习惯 |
| ⭐ **活跃用户** | 有周期计划 | **弱引导**：优化现有计划 | 提升专注质量 |

---

## 🚀 完整激活流程

### Step 1: 新用户首页（首次打开）

#### UI设计
```
┌─────────────────────────────────────────┐
│                                          │
│           🎯 [动画图标]                  │
│                                          │
│     👋 欢迎来到 FocusOne                 │
│     体验真正的强制力                     │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  🚀 体验2分钟专注                  │ │
│  │                                    │ │
│  │  💡 被屏蔽的应用无法打开           │ │
│  │  📱 已为您预选：抖音、小红书       │ │
│  │                                    │ │
│  │  [开始体验] 大按钮（主色调）       │ │
│  └────────────────────────────────────┘ │
│                                          │
│         [稍后体验] 文字链接              │
│                                          │
└─────────────────────────────────────────┘
```

#### 交互逻辑
1. **点击"开始体验"**
   ```typescript
   - 跳转到预设快速开始页面
   - 时长：2分钟（固定）
   - 预选应用：抖音、小红书（或其他常见分心应用）
   - 用户只需点击"开始专注"即可
   ```

2. **点击"稍后体验"**
   ```typescript
   - 记录用户跳过首次引导（storage.set('skipped_first_guide', true)）
   - 显示常规EmptyPlan（但会保留"首次体验"快捷入口）
   ```

#### 产品文案
- **主标题**："欢迎来到 FocusOne"
- **副标题**："体验真正的强制力"
- **说明**："被屏蔽的应用无法打开，帮你远离诱惑"
- **预选提示**："已为您预选：抖音、小红书"
- **按钮**："开始体验"（自信、简洁）

---

### Step 2: 完成首次专注（2分钟后）

#### UI设计 - 庆祝弹窗
```
┌─────────────────────────────────────────┐
│          ✨ [礼花动画] ✨               │
│                                          │
│        🎉 恭喜完成首次专注！             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   ⏱️ 专注时长：2分钟               │ │
│  │   💰 获得自律币：+10               │ │
│  │   🏆 解锁成就：初次尝试             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  💪 创建计划任务，让专注成为习惯         │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  [创建我的第一个计划] 主按钮       │ │
│  └────────────────────────────────────┘ │
│                                          │
│         [稍后再说] 文字链接              │
│                                          │
└─────────────────────────────────────────┘
```

#### 交互逻辑
1. **触发时机**
   ```typescript
   // 在专注结束时检查
   const focusCount = storage.getNumber('focus_count') || 0;
   if (focusCount === 1) {
     showCelebrationModal();
   }
   ```

2. **点击"创建我的第一个计划"**
   ```typescript
   - 关闭弹窗
   - 跳转到 /plans/add
   - 记录：storage.set('has_created_plan', true)
   - PostHog埋点：trackEvent('first_plan_guide_click')
   ```

3. **点击"稍后再说"**
   ```typescript
   - 关闭弹窗
   - 返回首页（此时显示 TrialUserGuidePlan）
   - PostHog埋点：trackEvent('first_plan_guide_skip')
   ```

#### 产品文案
- **标题**："恭喜完成首次专注！"
- **成就卡片**：
  - ⏱️ 专注时长：2分钟
  - 💰 获得自律币：+10
  - 🏆 解锁成就：初次尝试
- **引导文案**："创建计划任务，让专注成为习惯"
- **主按钮**："创建我的第一个计划"
- **次按钮**："稍后再说"

---

### Step 3: 体验用户首页（完成1-2次快速专注，但无计划）

#### UI设计
```
┌─────────────────────────────────────────┐
│                                          │
│       ☀️ [空状态图标]                    │
│                                          │
│      暂无即将开始的计划                  │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  💡 您已完成 2 次快速专注          │ │
│  │                                    │ │
│  │  创建周期计划，让专注成为习惯！    │ │
│  │                                    │ │
│  │  • 每周固定时间自动开始            │ │
│  │  • 无需手动操作                    │ │
│  │  • 培养长期专注习惯                │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  [创建计划任务] 主按钮             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  [快速开始专注] 次按钮             │ │
│  └────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

#### 交互逻辑
1. **显示条件**
   ```typescript
   const focusCount = storage.getNumber('focus_count') || 0;
   const hasCreatedPlan = storage.getBoolean('has_created_plan') || false;

   if (focusCount >= 1 && focusCount <= 2 && !hasCreatedPlan) {
     return <TrialUserGuidePlan />;
   }
   ```

2. **强调周期计划的价值**
   - 每周固定时间自动开始
   - 无需手动操作
   - 培养长期专注习惯

3. **保留快速开始入口**
   - 作为次要按钮，满足用户当下的专注需求

#### 产品文案
- **提示**："您已完成 {count} 次快速专注"
- **引导**："创建周期计划，让专注成为习惯！"
- **价值点**：
  - • 每周固定时间自动开始
  - • 无需手动操作
  - • 培养长期专注习惯
- **主按钮**："创建计划任务"
- **次按钮**："快速开始专注"

---

### Step 4: 活跃用户首页（有周期计划）

#### UI设计
保持现有的 `EmptyPlan` 或 `ActivePlan` 设计，但优化引导文案：

```
┌─────────────────────────────────────────┐
│  📅 下一个计划：早晨学习时间             │
│  08:00 - 10:00                           │
│  ⏰ 30分钟后开始                         │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  💪 添加更多专注计划               │ │
│  │                                    │ │
│  │  规律的专注安排能帮助你            │ │
│  │  更高效地管理时间                  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [快速开始专注] [管理计划]              │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🔧 技术实现方案

### 1. 用户状态追踪

#### 新增 Storage Keys
```typescript
// src/utils/storage.ts
export const USER_ACTIVATION_KEYS = {
  FOCUS_COUNT: 'focus_count',              // 专注完成次数
  HAS_CREATED_PLAN: 'has_created_plan',    // 是否创建过计划
  SKIPPED_FIRST_GUIDE: 'skipped_first_guide', // 是否跳过首次引导
  FIRST_FOCUS_DATE: 'first_focus_date',    // 首次专注日期
};
```

#### 用户状态工具函数
```typescript
// src/utils/user-activation.ts
export const getUserActivationState = () => {
  const focusCount = storage.getNumber('focus_count') || 0;
  const hasCreatedPlan = storage.getBoolean('has_created_plan') || false;
  const skippedFirstGuide = storage.getBoolean('skipped_first_guide') || false;

  return {
    isNewUser: focusCount === 0 && !skippedFirstGuide,
    isTrialUser: focusCount >= 1 && focusCount <= 2 && !hasCreatedPlan,
    isActiveUser: hasCreatedPlan,
    focusCount,
  };
};

export const incrementFocusCount = () => {
  const count = storage.getNumber('focus_count') || 0;
  storage.set('focus_count', count + 1);

  // 记录首次专注日期
  if (count === 0) {
    storage.set('first_focus_date', new Date().toISOString());
  }
};

export const markPlanCreated = () => {
  storage.set('has_created_plan', true);
};
```

---

### 2. 新增组件

#### (1) FirstTimeGuidePlan - 新用户引导
```typescript
// src/components/home/first-time-guide-plan.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui';
import { router } from 'expo-router';
import { storage } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';

const FirstTimeGuidePlan = () => {
  const handleStartTrial = () => {
    // 跳转到预设快速开始页面（2分钟+预选应用）
    router.push('/quick-start?preset=true');
  };

  const handleSkip = () => {
    storage.set('skipped_first_guide', true);
    // 刷新首页，显示常规EmptyPlan
    router.replace('/');
  };

  return (
    <View className="w-full px-6 items-center">
      {/* 图标 */}
      <View className="w-20 h-20 rounded-full bg-[#7A5AF8]/20 items-center justify-center mb-6">
        <Icon name="rocket" size={40} color="#7A5AF8" />
      </View>

      {/* 标题 */}
      <Text className="text-2xl font-bold text-white mb-2">
        👋 欢迎来到 FocusOne
      </Text>
      <Text className="text-base text-[#858699] mb-8">
        体验真正的强制力
      </Text>

      {/* 体验卡片 */}
      <View className="w-full bg-[#1C1C26] rounded-[20px] p-6 mb-6 border border-[#7A5AF8]/30">
        <Text className="text-lg font-semibold text-white mb-4">
          🚀 体验2分钟专注
        </Text>

        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <Icon name="shield-checkmark" size={16} color="#7A5AF8" />
            <Text className="text-sm text-[#B3B3BA] ml-2">
              被屏蔽的应用无法打开
            </Text>
          </View>
          <View className="flex-row items-center">
            <Icon name="apps" size={16} color="#7A5AF8" />
            <Text className="text-sm text-[#B3B3BA] ml-2">
              已为您预选：抖音、小红书
            </Text>
          </View>
        </View>

        <Button
          text="开始体验"
          onPress={handleStartTrial}
        />
      </View>

      {/* 跳过链接 */}
      <TouchableOpacity onPress={handleSkip}>
        <Text className="text-[#858699] text-sm">
          稍后体验
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FirstTimeGuidePlan;
```

#### (2) TrialUserGuidePlan - 体验用户引导
```typescript
// src/components/home/trial-user-guide-plan.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui';
import { router } from 'expo-router';
import { storage } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';

const TrialUserGuidePlan = () => {
  const focusCount = storage.getNumber('focus_count') || 0;

  const handleCreatePlan = () => {
    router.push('/plans/add');
  };

  const handleQuickStart = () => {
    router.push('/quick-start');
  };

  return (
    <View className="w-full px-6 items-center">
      {/* 空状态图标 */}
      <View className="w-20 h-20 rounded-full bg-[#1C1C26] items-center justify-center mb-4">
        <Icon name="sunny-outline" size={40} color="#F7AF5D" />
      </View>

      <Text className="text-xl font-semibold text-white mb-8 text-center">
        暂无即将开始的计划
      </Text>

      {/* 引导卡片 */}
      <View className="w-full bg-[#1C1C26] rounded-[20px] p-6 mb-6 border border-[#2C2C36]">
        <Text className="text-sm text-[#7A5AF8] mb-2">
          💡 您已完成 {focusCount} 次快速专注
        </Text>

        <Text className="text-base font-semibold text-white mb-4">
          创建周期计划，让专注成为习惯！
        </Text>

        <View className="mb-4">
          <View className="flex-row items-start mb-2">
            <Text className="text-[#B3B3BA] mr-2">•</Text>
            <Text className="text-sm text-[#B3B3BA] flex-1">
              每周固定时间自动开始
            </Text>
          </View>
          <View className="flex-row items-start mb-2">
            <Text className="text-[#B3B3BA] mr-2">•</Text>
            <Text className="text-sm text-[#B3B3BA] flex-1">
              无需手动操作
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-[#B3B3BA] mr-2">•</Text>
            <Text className="text-sm text-[#B3B3BA] flex-1">
              培养长期专注习惯
            </Text>
          </View>
        </View>
      </View>

      {/* 按钮组 */}
      <View className="w-full gap-4">
        <Button
          text="创建计划任务"
          onPress={handleCreatePlan}
        />

        <TouchableOpacity
          className="flex-row items-center justify-center py-3 gap-2"
          onPress={handleQuickStart}>
          <Icon name="flash-outline" size={16} color="#858699" />
          <Text className="text-[#858699] text-sm font-medium">
            快速开始专注
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TrialUserGuidePlan;
```

#### (3) CelebrationModal - 首次完成庆祝弹窗
```typescript
// src/components/modals/celebration-modal.tsx
import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Button } from '@/components/ui';
import { router } from 'expo-router';
import Icon from '@expo/vector-icons/Ionicons';
import { trackEvent } from '@/utils';

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  focusDuration: number; // 分钟
  coinsEarned: number;
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onClose,
  focusDuration,
  coinsEarned,
}) => {
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleCreatePlan = () => {
    trackEvent('first_plan_guide_click');
    onClose();
    router.push('/plans/add');
  };

  const handleSkip = () => {
    trackEvent('first_plan_guide_skip');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center items-center p-6">
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className="w-full bg-[#1C1C26] rounded-[24px] p-6 border border-[#2C2C36]">

          {/* 礼花图标 */}
          <View className="items-center mb-4">
            <Text className="text-6xl">🎉</Text>
          </View>

          {/* 标题 */}
          <Text className="text-2xl font-bold text-white text-center mb-6">
            恭喜完成首次专注！
          </Text>

          {/* 成就卡片 */}
          <View className="bg-[#2C2C36] rounded-xl p-4 mb-6">
            <View className="flex-row justify-between mb-3">
              <View className="flex-row items-center">
                <Icon name="time-outline" size={18} color="#7A5AF8" />
                <Text className="text-white ml-2">专注时长</Text>
              </View>
              <Text className="text-white font-semibold">
                {focusDuration}分钟
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <View className="flex-row items-center">
                <Icon name="diamond-outline" size={18} color="#FFC107" />
                <Text className="text-white ml-2">获得自律币</Text>
              </View>
              <Text className="text-[#FFC107] font-semibold">
                +{coinsEarned}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-row items-center">
                <Icon name="trophy-outline" size={18} color="#34B545" />
                <Text className="text-white ml-2">解锁成就</Text>
              </View>
              <Text className="text-[#34B545] font-semibold">
                初次尝试
              </Text>
            </View>
          </View>

          {/* 引导文案 */}
          <Text className="text-[#B3B3BA] text-center mb-6">
            💪 创建计划任务，让专注成为习惯
          </Text>

          {/* 按钮组 */}
          <View className="gap-3">
            <Button
              text="创建我的第一个计划"
              onPress={handleCreatePlan}
            />

            <TouchableOpacity
              className="py-3"
              onPress={handleSkip}>
              <Text className="text-[#858699] text-center font-medium">
                稍后再说
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CelebrationModal;
```

---

### 3. 修改首页逻辑

#### app/(tabs)/index.tsx
```typescript
// 在现有代码基础上修改

import FirstTimeGuidePlan from '@/components/home/first-time-guide-plan';
import TrialUserGuidePlan from '@/components/home/trial-user-guide-plan';
import { getUserActivationState } from '@/utils/user-activation';

const App = () => {
  const store = useHomeStore();
  const pstore = usePlanStore();
  // ... 其他代码

  // 获取用户激活状态
  const userState = getUserActivationState();

  // 根据用户状态渲染不同组件
  const renderContent = () => {
    // 1. 如果有活动计划，显示 ActivePlan
    if (pstore.active_plan) {
      return <ActivePlan />;
    }

    // 2. 新用户：显示首次引导
    if (userState.isNewUser) {
      return <FirstTimeGuidePlan />;
    }

    // 3. 体验用户：显示创建计划引导
    if (userState.isTrialUser) {
      return <TrialUserGuidePlan />;
    }

    // 4. 活跃用户：显示常规空状态
    return <EmptyPlan />;
  };

  return (
    <Page safe decoration>
      {/* ... 其他代码 */}
      <View className="items-center mt-[60px] mb-[30px]">
        {renderContent()}
      </View>
      {/* ... 其他代码 */}
    </Page>
  );
};
```

---

### 4. 预设快速开始页面

#### app/quick-start/index.tsx
```typescript
// 在现有代码基础上添加预设逻辑

import { useSearchParams } from 'expo-router';

const QuickStartPage = () => {
  const searchParams = useSearchParams();
  const isPreset = searchParams.get('preset') === 'true';

  const [minute, setMinute] = useState(isPreset ? 2 : 15);
  // ... 其他代码

  // 预设应用列表（抖音、小红书等常见分心应用）
  const presetApps = [
    { name: '抖音', stableId: 'com.ss.iphone.ugc.Aweme', type: 'application' },
    { name: '小红书', stableId: 'com.xingin.xhs', type: 'application' },
  ];

  useEffect(() => {
    if (isPreset && astore.ios_selected_apps.length === 0) {
      // 预选应用
      // astore.addIosApps(presetApps);
      // 注意：实际应用的 stableId 需要在真机上获取
    }
  }, [isPreset]);

  // ... 其他代码
};
```

---

### 5. 专注完成后更新状态

#### src/stores/record.ts
```typescript
import { incrementFocusCount } from '@/utils/user-activation';

const RecordStore = combine(
  // ... 现有代码

  addRecord: async (plan: CusPlan, bet = 0) => {
    // ... 现有代码

    // 专注完成后，增加计数
    incrementFocusCount();

    // ... 其他代码
  },
);
```

#### src/native/ios/index.ts
```typescript
// 在专注结束时触发庆祝弹窗

import { storage } from '@/utils';

export const setupIOSFocusSync = () => {
  // ... 现有代码

  const handleFocusEnd = async () => {
    const focusCount = storage.getNumber('focus_count') || 0;

    // 如果是首次完成专注，显示庆祝弹窗
    if (focusCount === 1) {
      // 触发弹窗（通过EventEmitter或全局状态管理）
      EventEmitter.emit('show_celebration_modal', {
        focusDuration: 2,
        coinsEarned: 10,
      });
    }

    // ... 其他代码
  };

  // ... 其他代码
};
```

---

## 📊 埋点追踪

### 新增PostHog事件

```typescript
// 首次引导相关
trackEvent('first_guide_view');           // 查看首次引导
trackEvent('first_guide_start');          // 点击"开始体验"
trackEvent('first_guide_skip');           // 点击"稍后体验"

// 首次完成相关
trackEvent('first_focus_complete', {      // 完成首次专注
  duration: 2,
  apps_blocked: ['douyin', 'xiaohongshu'],
});
trackEvent('celebration_modal_view');     // 查看庆祝弹窗
trackEvent('first_plan_guide_click');     // 点击"创建我的第一个计划"
trackEvent('first_plan_guide_skip');      // 点击"稍后再说"

// 体验用户引导相关
trackEvent('trial_user_guide_view', {     // 查看体验用户引导
  focus_count: 2,
});
trackEvent('trial_user_create_plan');     // 从引导页进入创建计划
```

---

## 🎯 预期效果

### 数据指标提升预期

| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| **首次专注完成率** | 30% | **60%** | +100% |
| **计划创建转化率** | 15% | **40%** | +167% |
| **D1留存率** | 35% | **55%** | +57% |
| **D7留存率** | 20% | **35%** | +75% |

### 用户体验改善

✅ **认知负担降低**：新用户只需点击一个按钮即可体验核心功能
✅ **价值感知加强**：2分钟快速体验，立刻感受到屏蔽的强制力
✅ **激活路径清晰**：体验 → 庆祝 → 引导 → 创建计划
✅ **成就感增强**：首次完成时的庆祝动效和奖励反馈

---

## 🚀 实施计划

### Phase 1: 核心组件开发（2-3小时）
- [ ] 创建用户状态追踪工具
- [ ] 开发 FirstTimeGuidePlan 组件
- [ ] 开发 TrialUserGuidePlan 组件
- [ ] 开发 CelebrationModal 组件

### Phase 2: 首页逻辑改造（1小时）
- [ ] 修改首页渲染逻辑
- [ ] 集成用户状态判断
- [ ] 添加PostHog埋点

### Phase 3: 预设快速开始（1小时）
- [ ] 支持URL参数 `?preset=true`
- [ ] 预设2分钟时长
- [ ] 预选常见分心应用

### Phase 4: 完成引导流程（1小时）
- [ ] 在专注结束时检查用户状态
- [ ] 触发庆祝弹窗
- [ ] 引导创建计划

### Phase 5: 测试与优化（1-2小时）
- [ ] 完整流程测试
- [ ] 边界情况处理
- [ ] 动画效果优化

**总预计工时**: 6-8小时

---

## ✅ 验收标准

### 功能完整性
- [ ] 新用户首次打开看到引导页面
- [ ] 点击"开始体验"能正常进入2分钟专注
- [ ] 完成首次专注后弹出庆祝弹窗
- [ ] 弹窗中点击"创建计划"能正常跳转
- [ ] 体验用户看到创建计划引导
- [ ] 活跃用户看到常规EmptyPlan

### 用户体验
- [ ] 引导文案清晰易懂
- [ ] 按钮层级明确（主次分明）
- [ ] 动画流畅自然
- [ ] 跳过引导后不再重复显示

### 数据追踪
- [ ] 所有关键操作有PostHog埋点
- [ ] 能在PostHog Dashboard查看漏斗
- [ ] 用户状态正确持久化

---

## 📝 后续优化方向

### 短期优化（1-2周）
1. **A/B测试**：测试不同引导文案和时长（2分钟 vs 5分钟）
2. **动画优化**：添加Lottie动画提升视觉体验
3. **智能推荐**：根据用户手机已安装的应用智能推荐屏蔽列表

### 中期优化（1-2月）
1. **个性化引导**：根据用户场景（学生/职场）定制引导内容
2. **社交裂变**：完成首次专注后引导分享成果
3. **成就系统**：完善勋章体系，增强激励

---

**方案设计完成！准备好实施代码了吗？** 🚀

*文档更新时间: 2026-01-09*
