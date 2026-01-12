/**
 * 调试状态管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

// Feature Flag 状态接口
export interface FeatureFlagState {
  key: string;
  enabled: boolean;
  variant?: string | boolean | null;
  payload?: any;
}

export const DebugStore = combine(
  {
    environment: 'development' as 'development' | 'staging' | 'production',
    showDebugBall: true, // 默认显示悬浮球
    featureFlags: {} as Record<string, FeatureFlagState>, // PostHog Feature Flags
  },
  (set, get) => ({
    setEnvironment: (env: 'development' | 'staging' | 'production') => {
      set({ environment: env });
      AsyncStorage.setItem('debug_environment', env);
    },

    getEnvironment: () => get().environment,

    setShowDebugBall: (show: boolean) => {
      set({ showDebugBall: show });
    },

    // 更新Feature Flags（由PostHog监听器调用）
    setFeatureFlags: (flags: Record<string, FeatureFlagState>) => {
      set({ featureFlags: flags });
      console.log(
        '[DebugStore] Feature Flags已更新:',
        Object.keys(flags).length,
        '个',
      );
    },

    // 获取所有Feature Flags
    getFeatureFlags: () => {
      return get().featureFlags;
    },

    init: async () => {
      const env = await AsyncStorage.getItem('debug_environment');
      if (env) {
        set({ environment: env as any });
      }
    },
  }),
);

const store = create(DebugStore);

export default store;
