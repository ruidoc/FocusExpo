/**
 * 实验状态管理
 * 管理 PostHog Feature Flags，支持本地覆盖和计算属性
 *
 * 注意：React Native SDK 不支持 overrideFeatureFlags，
 * 本地覆盖完全在 store 层面实现
 */

import { create } from 'zustand';
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

const ExperimentStore = combine(
  {
    featureFlags: {} as Record<string, FeatureFlagState>,
    localOverrides: {} as Record<string, boolean>, // 本地覆盖（仅用于调试）
  },
  (set, get) => ({
    // 从 PostHog 同步 Feature Flags（PostHogProvider 调用）
    setFeatureFlags: (flags: Record<string, FeatureFlagState>) => {
      console.log(
        '[ExperimentStore] 更新 Feature Flags:',
        Object.keys(flags).length,
        '个',
      );
      set({ featureFlags: flags });
    },

    // 覆盖实验（仅在 store 层面实现，RN SDK 不支持 overrideFeatureFlags）
    overrideFlag: (key: string, value: boolean) => {
      const state = get();

      // 更新本地覆盖
      set({
        localOverrides: {
          ...state.localOverrides,
          [key]: value,
        },
      });

      console.log(`[ExperimentStore] 本地覆盖: ${key} = ${value}`);
    },

    // 重置单个实验（移除本地覆盖，恢复服务器值）
    resetFlag: (key: string) => {
      const state = get();
      const newOverrides = { ...state.localOverrides };
      delete newOverrides[key];

      set({ localOverrides: newOverrides });

      console.log(`[ExperimentStore] 重置实验: ${key}`);
    },

    // 重置所有实验（清空所有本地覆盖）
    resetAllFlags: () => {
      set({ localOverrides: {} });
      console.log('[ExperimentStore] 清空所有本地覆盖');
    },

    // 获取单个实验状态（优先使用本地覆盖）
    getFlag: (key: string): boolean => {
      const state = get();
      // 如果有本地覆盖，使用覆盖值
      if (key in state.localOverrides) {
        return state.localOverrides[key];
      }
      // 否则使用服务器值
      return state.featureFlags[key]?.enabled || false;
    },

    // 获取所有 Flag 的列表（用于调试面板）
    getFlags: () => {
      const state = get();
      return Object.values(state.featureFlags).map(flag => ({
        ...flag,
        // 如果有本地覆盖，更新 enabled 和 isOverridden
        enabled:
          flag.key in state.localOverrides
            ? state.localOverrides[flag.key]
            : flag.enabled,
        isOverridden: flag.key in state.localOverrides,
      }));
    },

    // ==== 判断实验的计算属性 ====

    // 用户引导实验
    isOnboarding() {
      const state = get();
      const key = 'user_onboarding';
      // 如果有本地覆盖，使用覆盖值
      if (key in state.localOverrides) {
        return state.localOverrides[key];
      }
      // 否则使用服务器值
      return state.featureFlags[key]?.enabled || false;
    },
  }),
);

const store = create(ExperimentStore);

export default store;
