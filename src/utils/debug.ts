/**
 * 调试工具函数
 * 提供快捷的调试操作
 */

import { useDebugStore } from '@/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPostHogClient } from './analytics';

/**
 * 调试工具集合
 */
export const debugUtils = {
  /**
   * 清除用户信息（模拟登出）
   */
  async clearUserInfo() {
    await AsyncStorage.removeItem('user_info');
    console.log('[DEBUG] 用户信息已清除');
  },

  /**
   * 清除所有本地存储
   */
  async clearAllStorage() {
    await AsyncStorage.clear();
    console.log('[DEBUG] 所有本地存储已清除');
  },

  /**
   * 重置 onboarding 状态
   */
  async resetOnboarding() {
    const defaultState: {
      problem: 'short_video' | 'game' | 'study' | null;
      mode: 'shield' | 'focus';
      selected_apps: string[];
      isComplete: boolean;
      unloginComplete: boolean;
      currentStep: string;
      guide_id: string;
    } = {
      problem: null,
      mode: 'shield',
      selected_apps: [],
      isComplete: false,
      unloginComplete: false,
      currentStep: 'step1',
      guide_id: '',
    };
    await AsyncStorage.setItem(
      'onboarding_state',
      JSON.stringify(defaultState),
    );
    console.log('[DEBUG] Onboarding 状态已重置');
  },

  /**
   * 设置模拟用户
   */
  async setMockUser(userId: string, userData?: Record<string, any>) {
    const mockUser = {
      id: userId,
      phone: `mock_${userId}@test.com`,
      nickname: `Mock User ${userId}`,
      ...userData,
    };
    await AsyncStorage.setItem('user_info', JSON.stringify(mockUser));
    console.log('[DEBUG] 模拟用户已设置:', mockUser);
  },

  /**
   * 获取所有存储数据
   */
  async getAllStorage() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      const data: Record<string, any> = {};
      items.forEach(([key, value]) => {
        try {
          data[key] = value ? JSON.parse(value) : value;
        } catch {
          data[key] = value;
        }
      });
      console.log('[DEBUG] 所有存储数据:', data);
      return data;
    } catch (error) {
      console.error('[DEBUG] 获取存储数据失败:', error);
      return {};
    }
  },

  /**
   * 获取特定存储项
   */
  async getStorageItem(key: string) {
    try {
      const value = await AsyncStorage.getItem(key);
      try {
        const parsed = JSON.parse(value || '');
        console.log(`[DEBUG] ${key}:`, parsed);
        return parsed;
      } catch {
        console.log(`[DEBUG] ${key}:`, value);
        return value;
      }
    } catch (error) {
      console.error(`[DEBUG] 获取 ${key} 失败:`, error);
      return null;
    }
  },

  /**
   * 设置存储项
   */
  async setStorageItem(key: string, value: any) {
    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      console.log(`[DEBUG] ${key} 已设置:`, value);
    } catch (error) {
      console.error(`[DEBUG] 设置 ${key} 失败:`, error);
    }
  },

  /**
   * 重置 PostHog 用户
   */
  resetPostHogUser() {
    try {
      const client = getPostHogClient();
      if (client) {
        client.reset();
        console.log('[DEBUG] PostHog 用户已重置');
      } else {
        console.warn('[DEBUG] PostHog 客户端未初始化');
      }
    } catch (error) {
      console.error('[DEBUG] 重置 PostHog 用户失败:', error);
    }
  },

  /**
   * 获取当前环境
   */
  getCurrentEnvironment() {
    const env = useDebugStore.getState().getEnvironment();
    console.log('[DEBUG] 当前环境:', env);
    return env;
  },

  /**
   * 切换环境
   */
  switchEnvironment(env: 'development' | 'staging' | 'production') {
    useDebugStore.getState().setEnvironment(env);
    console.log('[DEBUG] 环境已切换为:', env);
  },

  /**
   * 打印调试信息摘要
   */
  async printDebugSummary() {
    const env = this.getCurrentEnvironment();
    const storage = await this.getAllStorage();
    const posthog = getPostHogClient();

    console.log('========== 调试信息摘要 ==========');
    console.log('环境:', env);
    console.log('本地存储数量:', Object.keys(storage).length);
    console.log('PostHog 已初始化:', !!posthog);
    console.log('================================');

    return {
      environment: env,
      storageCount: Object.keys(storage).length,
      posthogInitialized: !!posthog,
    };
  },
};

/**
 * 快速调试命令（仅在开发环境下使用）
 *
 * 在控制台使用示例：
 *
 * import { debugUtils } from '@/utils/debug';
 *
 * // 清除用户
 * await debugUtils.clearUserInfo();
 *
 * // 获取存储
 * const data = await debugUtils.getAllStorage();
 *
 * // 打印摘要
 * await debugUtils.printDebugSummary();
 */

if (__DEV__) {
  // 在全局对象上暴露调试工具（仅在开发环境）
  (global as any).__debugUtils = debugUtils;
  console.log('[DEBUG] 调试工具已加载，可在控制台使用 __debugUtils');
}
