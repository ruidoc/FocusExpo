/**
 * PostHog 埋点工具
 * 封装PostHog analytics功能
 *
 * 注意：PostHog 通过 PostHogProviderWrapper 组件初始化，
 * 这里提供事件追踪的工具函数
 */

import { useSuperwallStore } from 'expo-superwall';
import { PostHog, usePostHog } from 'posthog-react-native';
import { Platform } from 'react-native';

// 全局 PostHog 实例（由 PostHogProviderWrapper 设置）
let globalPostHogInstance: PostHog | null = null;

/**
 * 设置全局 PostHog 实例（由 PostHogProviderWrapper 调用）
 * @internal
 */
export const setGlobalPostHogInstance = (instance: PostHog | null) => {
  globalPostHogInstance = instance;
};

/**
 * 获取PostHog客户端实例（Hook）
 * 必须在 PostHogProvider 内部使用，适用于 React 组件
 */
export const usePostHogClient = () => {
  return usePostHog();
};

/**
 * 获取PostHog客户端实例（非Hook版本）
 * 适用于非组件代码（如 Zustand store）
 * 注意：只有在 PostHogProvider 初始化后才能使用
 */
export const getPostHogClient = (): PostHog | null => {
  return globalPostHogInstance;
};

/**
 * 识别用户（登录后调用）
 * 同时识别 PostHog 和 Superwall 用户
 *
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const identifyUser = async (
  userId: string,
  properties?: Record<string, any>,
  posthog?: PostHog | null,
) => {
  // 1. PostHog 识别
  const client = posthog || getPostHogClient();
  if (client) {
    client.identify(userId, {
      platform: Platform.OS,
      ...properties,
    });
    console.log('[PostHog] 用户识别:', userId);
  } else {
    console.warn('[PostHog] 客户端未初始化');
  }

  // 2. Superwall 识别（关键：确保 Webhook 能关联到正确的用户）
  try {
    const superwall = useSuperwallStore.getState();
    // 防护：SDK 未配置时跳过，避免原生侧 crash
    if (!superwall.isConfigured) {
      console.warn('[Superwall] SDK 未配置，跳过 identify');
      return;
    }
    await superwall.identify(userId);
    // 设置用户属性（可选，用于 Paywall 个性化）
    if (properties) {
      await superwall.setUserAttributes(properties);
    }
    console.log('[Superwall] 用户识别:', userId);
  } catch (error) {
    console.warn('[Superwall] 用户识别失败:', error);
  }
};

/**
 * 重置用户（登出后调用）
 * 同时重置 PostHog 和 Superwall 用户
 *
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const resetUser = async (posthog?: PostHog | null) => {
  // 1. PostHog 重置
  const client = posthog || getPostHogClient();
  if (client) {
    client.reset();
    console.log('[PostHog] 用户重置');
  }

  // 2. Superwall 重置
  try {
    const superwall = useSuperwallStore.getState();
    if (!superwall.isConfigured) return;
    await superwall.reset();
    console.log('[Superwall] 用户重置');
  } catch (error) {
    console.warn('[Superwall] 用户重置失败:', error);
  }
};

/**
 * 记录事件
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>,
  posthog?: PostHog | null,
) => {
  const client = posthog || getPostHogClient();
  if (!client) {
    console.warn('[PostHog] 客户端未初始化，事件未记录:', eventName);
    return;
  }

  client.capture(eventName, {
    platform: Platform.OS,
    ...properties,
  });
  console.log('[PostHog] 事件记录:', eventName, properties);
};

/**
 * 记录页面访问
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const trackScreen = (
  screenName: string,
  properties?: Record<string, any>,
  posthog?: PostHog | null,
) => {
  trackEvent(
    '$screen',
    {
      $screen_name: screenName,
      ...properties,
    },
    posthog,
  );
};

/**
 * 设置用户属性
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const setUserProperties = (
  properties: Record<string, any>,
  posthog?: PostHog | null,
) => {
  const client = posthog || getPostHogClient();
  if (!client) return;
  // posthog-react-native 使用 identify 来设置用户属性
  client.identify(undefined, properties);
  console.log('[PostHog] 用户属性更新:', properties);
};

// ============== Feature Flags ==============

/**
 * 已知的实验/Feature Flags列表
 * 用于在Debug界面显示所有实验，即使当前用户未命中
 */
export const ExperimentKeys = {
  USER_ONBOARDING: 'user_onboarding',
} as const;

export type ExperimentKey =
  (typeof ExperimentKeys)[keyof typeof ExperimentKeys];

/**
 * 检查Feature Flag是否启用
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const isFeatureFlagEnabled = (
  flagKey: string,
  posthog?: PostHog | null,
): boolean => {
  const client = posthog || getPostHogClient();
  if (!client) {
    console.warn('[PostHog] 客户端未初始化，Feature Flag检查失败:', flagKey);
    return false;
  }

  const isEnabled = client.isFeatureEnabled(flagKey);
  console.log(`[PostHog] Feature Flag [${flagKey}]:`, isEnabled);
  return isEnabled || false;
};

/**
 * 获取Feature Flag的payload值
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const getFeatureFlagPayload = (
  flagKey: string,
  posthog?: PostHog | null,
): any => {
  const client = posthog || getPostHogClient();
  if (!client) {
    console.warn('[PostHog] 客户端未初始化，无法获取payload:', flagKey);
    return null;
  }

  return client.getFeatureFlagPayload(flagKey);
};

/**
 * 重载Feature Flags（用于调试）
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const reloadFeatureFlags = async (
  posthog?: PostHog | null,
): Promise<void> => {
  const client = posthog || getPostHogClient();
  if (!client) {
    console.warn('[PostHog] 客户端未初始化，无法重载Feature Flags');
    return;
  }

  await client.reloadFeatureFlags();
  console.log('[PostHog] Feature Flags已重载');
};

// ============== 预定义事件 ==============
// 注意：这些函数支持两种调用方式：
// 1. 在组件中：传入 usePostHogClient() 返回的实例（可选）
// 2. 在非组件代码中：不传参数，自动获取全局实例

/**
 * 用户登录
 */
export const trackLogin = (
  method: 'phone' | 'wechat' | 'apple',
  posthog?: PostHog | null,
) => {
  trackEvent('user_login', { login_method: method }, posthog);
};

/**
 * 用户注册
 */
export const trackRegister = (
  method: 'phone' | 'wechat' | 'apple',
  posthog?: PostHog | null,
) => {
  trackEvent('user_register', { register_method: method }, posthog);
};

/**
 * 用户登出
 */
export const trackLogout = (posthog?: PostHog | null) => {
  trackEvent('user_logout', undefined, posthog);
  resetUser(posthog);
};

/**
 * 创建专注计划
 */
export const trackCreatePlan = (
  planType: 'once' | 'repeat',
  duration: number,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'plan_create',
    {
      plan_type: planType,
      duration_minutes: duration,
    },
    posthog,
  );
};

/**
 * 启动专注
 */
export const trackStartFocus = (
  planId: string,
  duration: number,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'focus_start',
    {
      plan_id: planId,
      duration_minutes: duration,
    },
    posthog,
  );
};

/**
 * 完成专注
 */
export const trackCompleteFocus = (
  planId: string,
  duration: number,
  isSuccess: boolean,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'focus_complete',
    {
      plan_id: planId,
      duration_minutes: duration,
      is_success: isSuccess,
    },
    posthog,
  );
};

/**
 * 暂停专注
 */
export const trackPauseFocus = (
  planId: string,
  remainingMinutes: number,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'focus_pause',
    {
      plan_id: planId,
      remaining_minutes: remainingMinutes,
    },
    posthog,
  );
};

/**
 * 恢复专注
 */
export const trackResumeFocus = (planId: string, posthog?: PostHog | null) => {
  trackEvent(
    'focus_resume',
    {
      plan_id: planId,
    },
    posthog,
  );
};

/**
 * 打开Superwall Paywall
 */
export const trackOpenPaywall = (
  placement: string,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'paywall_open',
    {
      placement,
    },
    posthog,
  );
};

/**
 * Superwall购买成功
 */
export const trackPurchaseSuccess = (
  productId?: string,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'purchase_success',
    {
      product_id: productId,
    },
    posthog,
  );
};

/**
 * 添加屏蔽应用
 */
export const trackAddBlockApps = (
  appCount: number,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'apps_add',
    {
      app_count: appCount,
    },
    posthog,
  );
};

/**
 * 权限授予
 */
export const trackPermissionGrant = (
  permission: 'screen_time' | 'notification',
  posthog?: PostHog | null,
) => {
  trackEvent(
    'permission_grant',
    {
      permission_type: permission,
    },
    posthog,
  );
};

/**
 * 权限拒绝
 */
export const trackPermissionDeny = (
  permission: 'screen_time' | 'notification',
  posthog?: PostHog | null,
) => {
  trackEvent(
    'permission_deny',
    {
      permission_type: permission,
    },
    posthog,
  );
};
