/**
 * 实验状态管理
 * 管理 PostHog Feature Flags，支持本地覆盖和计算属性
 *
 * 注意：React Native SDK 不支持 overrideFeatureFlags，
 * 本地覆盖完全在 store 层面实现
 */

import { getFlag, getFlags } from '@/utils/store';
import { create } from 'zustand';
import { createComputed } from 'zustand-computed';
import { combine } from 'zustand/middleware';

// Feature Flag 状态接口
export interface FeatureFlagState {
  key: string;
  enabled: boolean;
  variant?: any;
  payload?: any;
  serverValue?: any; // 保存原始服务器值，用于重置
  isOverridden?: boolean; // 是否被本地覆盖
}

const baseStateCreator = combine(
  {
    featureFlags: {} as Record<string, FeatureFlagState>,
    localOverrides: {} as Record<string, boolean>, // 本地覆盖（仅用于调试）
  },
  (set, get) => ({
    // 从 PostHog 同步 Feature Flags（PostHogProvider 调用）
    setFeatureFlags: (flags: Record<string, FeatureFlagState>) => {
      set({ featureFlags: flags });
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
);

type BaseState = ReturnType<typeof baseStateCreator>;

// 定义计算属性
const withComputed = createComputed((state: BaseState) => {
  return {
    finalFlags: getFlags(state),
    isOnboarding: getFlag(state, 'user_onboarding'),
  };
});

const store = create(withComputed(baseStateCreator));

export default store;
