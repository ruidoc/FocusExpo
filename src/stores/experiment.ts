import { storage } from '@/utils/storage';
import { getFlag, getFlags } from '@/utils/store';
import { create } from 'zustand';
import { createComputed } from 'zustand-computed';
import { combine, createJSONStorage, persist } from 'zustand/middleware';

// Feature Flag 状态接口
export interface FeatureFlagState {
  key: string;
  enabled: boolean;
  variant?: any;
  payload?: any;
  serverValue?: any; // 保存原始服务器值，用于重置
  isOverridden?: boolean; // 是否被本地覆盖
}

// 适配 Zustand persist 中间件的 storage 接口
const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.delete(name),
};

const baseStateCreator = persist(
  combine(
    {
      test_val: { key1: 'test1' },
      featureFlags: {} as Record<string, FeatureFlagState>,
      localOverrides: {} as Record<string, boolean>, // 本地覆盖（仅用于调试）
    },
    (set, get) => ({
      // 从 PostHog 同步 Feature Flags（PostHogProvider 调用）
      setFeatureFlags: (flags: Record<string, FeatureFlagState>) => {
        set({ featureFlags: flags });
      },

      setTestVal: (val: any) => {
        set({ test_val: { ...get().test_val, ...val } });
      },

      // 覆盖实验
      overrideFlag: (key: string, value: boolean) => {
        set({
          localOverrides: {
            ...get().localOverrides,
            [key]: value,
          },
        });
      },

      // 重置单个实验（移除本地覆盖，恢复服务器值）
      resetFlag: (key: string) => {
        const state = get();
        const newOverrides = { ...state.localOverrides };
        delete newOverrides[key];
        set({ localOverrides: newOverrides });
      },

      // 重置所有实验（清空所有本地覆盖）
      resetAllFlags: () => {
        set({ localOverrides: {} });
      },
    }),
  ),
  {
    name: 'experiment-storage',
    storage: createJSONStorage(() => zustandStorage),
    partialize: state => ({ localOverrides: state.localOverrides }),
  },
);

type BaseState = ReturnType<typeof baseStateCreator>;

// 定义计算属性
const withComputed = createComputed((state: BaseState) => {
  return {
    finalFlags: getFlags(state),
    isOnboarding: getFlag(state, 'user_onboarding'),
    test_val_str: Object.values(state.test_val).join('#'),
    local_overrides_str: Object.values(state.localOverrides).join('#'),
  };
});

const store = create(withComputed(baseStateCreator));

export default store;
