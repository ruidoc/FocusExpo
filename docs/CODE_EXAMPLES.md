# CODE_EXAMPLES.md - FocusExpo 代码规范和示例

本文档提供 FocusExpo 项目的代码规范、模式示例和最佳实践。

> **Note:** 此文件位于 `docs/` 目录。请使用 `bun run docs:examples` 快速打开。

---

## TypeScript 规范

### 正确的类型定义

```typescript
interface Plan {
  id: string;
  name: string;
  durationMinutes: number;
}

async function createPlan(name: string): Promise<Plan> {
  const newPlan: Plan = {
    id: generateId(),
    name,
    durationMinutes: 60,
  };
  return newPlan;
}

// 联合类型
type PermissionStatus = 'approved' | 'denied' | 'notDetermined';

// 避免 any 类型
function processData(data: unknown): string {
  if (typeof data === 'string') return data;
  return 'invalid';
}
```

---

## React 组件规范

### 函数组件基础

```typescript
import { useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { usePlanStore } from '@/stores';

interface FocusTimerProps {
  planId: string;
  initialMinutes?: number;
}

export function FocusTimer({ planId, initialMinutes = 60 }: FocusTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  
  // Store 选择器（优化性能）
  const activePlan = usePlanStore(s => s.activePlan);
  const pauseCurPlan = usePlanStore(s => s.pauseCurPlan);

  const remaining = useMemo(
    () => initialMinutes - elapsed,
    [initialMinutes, elapsed]
  );

  const handlePause = useCallback(async () => {
    try {
      await pauseCurPlan();
    } catch (error) {
      console.error('Pause failed:', error);
    }
  }, [pauseCurPlan]);

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-3xl font-bold">{remaining}:00</Text>
    </View>
  );
}
```

### 避免的模式

```typescript
// ❌ 避免：useEffect + useCallback 组合
function BadComponent() {
  const fetchData = useCallback(async () => {
    const result = await request.get('/data');
  }, []);

  useEffect(() => {
    fetchData();  // ❌ 无限循环
  }, [fetchData]);
}

// ✅ 正确
function GoodComponent() {
  useEffect(() => {
    const fetchData = async () => {
      const result = await request.get('/data');
    };
    fetchData();
  }, []);
}
```

---

## Zustand Store 规范

### 创建 Store

```typescript
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

interface Plan {
  id: string;
  name: string;
}

export const usePlanStore = create(
  combine(
    { plans: [] as Plan[], loading: false },
    (set, get) => ({
      getPlans: () => get().plans,

      async fetchPlans() {
        set({ loading: true });
        try {
          const { data } = await request.get('/plan/lists');
          set({ plans: data, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      async init() {
        await get().fetchPlans();
      },
    })
  )
);
```

### Store 选择器

```typescript
// 选择单个属性（优化）
const plans = usePlanStore(s => s.plans);

// 调用方法
const fetchPlans = usePlanStore(s => s.fetchPlans);
```

---

## API 和网络规范

### 请求模式

```typescript
// GET
const { data } = await request.get('/plan/lists', {
  params: { page: 1 }
});

// POST
const { data: newPlan } = await request.post('/plan/add', {
  name: 'Focus',
  durationMinutes: 60,
});

// PATCH
await request.patch(`/plan/${id}`, { name: 'Updated' });

// DELETE
await request.delete(`/plan/${id}`);
```

### 错误处理

```typescript
async function loadData() {
  try {
    const { data } = await request.get('/api/data');
    // 成功
  } catch (error) {
    console.error('Error:', error);
    // 错误已自动显示为 Toast
  }
}
```

---

## iOS 原生集成规范

### 调用原生方法

```typescript
import { Methods } from '@/native/ios/methods';

async function startFocus(duration: number) {
  try {
    const status = await Methods.checkScreenTimePermission();
    if (status !== 'approved') {
      throw new Error('Permission not approved');
    }

    await Methods.startAppLimits(duration);
    Toast.show('Focus started', 'success');
  } catch (error) {
    Toast.show(error.message, 'error');
    console.error('Start focus failed:', error);
  }
}
```

### 监听事件

```typescript
import { createFocusStateListener } from '@/native/ios/events';

useEffect(() => {
  const subscription = createFocusStateListener((event) => {
    if (event.state === 'ended') {
      handleFocusEnded();
    }
  });

  return () => subscription.remove();
}, []);
```

---

## 性能优化示例

### 列表优化

```typescript
<FlatList
  data={plans}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <PlanItem plan={item} />}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: 80,
    offset: 80 * index,
    index,
  })}
/>
```

### 样式优化

```typescript
// ✅ 使用 StyleSheet
const styles = StyleSheet.create({
  container: { padding: 10 },
});

// ✅ 或使用 NativeWind
<View className="p-2.5" />
```

---

本文档位于 `docs/` 目录。最后更新：2026 年 1 月
