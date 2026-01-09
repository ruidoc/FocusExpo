/**
 * 调试工具类型定义
 */

/**
 * 支持的环境类型
 */
export type DebugEnvironment = 'development' | 'staging' | 'production';

/**
 * 环境配置
 */
export interface EnvironmentConfig {
  id: DebugEnvironment;
  label: string;
  apiUrl: string;
  color: string;
}

/**
 * AsyncStorage 项
 */
export interface StorageItem {
  key: string;
  value: string;
}

/**
 * PostHog 特征开关
 */
export interface FeatureFlag {
  key: string;
  value: any;
}

/**
 * 用户订阅信息
 */
export interface Subscription {
  id: string;
  name: string;
  status: 'active' | 'cancelled' | 'paused';
  expiresAt: string;
}

/**
 * 调试状态
 */
export interface DebugState {
  environment: DebugEnvironment;
}

/**
 * 调试 Store 的公开 API
 */
export interface DebugStore extends DebugState {
  setEnvironment: (env: DebugEnvironment) => void;
  getEnvironment: () => DebugEnvironment;
  init: () => Promise<void>;
}
