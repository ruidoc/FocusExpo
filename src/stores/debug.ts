/**
 * 调试状态管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

export const useDebugStore = create(
  combine(
    {
      environment: 'development' as 'development' | 'staging' | 'production',
      showDebugBall: true, // 默认显示悬浮球
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

      init: async () => {
        const env = await AsyncStorage.getItem('debug_environment');
        if (env) {
          set({ environment: env as any });
        }
      },
    }),
  ),
);
