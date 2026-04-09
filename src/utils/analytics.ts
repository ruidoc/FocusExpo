/**
 * PostHog 埋点工具
 * 封装PostHog analytics功能
 *
 * 注意：PostHog 通过 PostHogProviderWrapper 组件初始化，
 * 这里提供事件追踪的工具函数
 */

import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { PostHog, usePostHog } from 'posthog-react-native';
import { Platform } from 'react-native';
import { APP_ENV } from '@/config/env';
import { storage } from './storage';

// 全局 PostHog 实例（由 PostHogProviderWrapper 设置）
let globalPostHogInstance: PostHog | null = null;

export const POSTHOG_API_KEY = 'phc_A4Pt2WQHEQLedNR9wyLMxSHrpdnOdUTCiR8LHNGT5QG';

type TrackProperties = Record<string, any>;
export type FocusType = 'once' | 'repeat';
export type TrackingOrigin = 'app_js' | 'ios_native' | 'ios_extension';

function normalizeEventName(eventName: string) {
  return eventName.startsWith('focus_') ? eventName : `focus_${eventName}`;
}

function getStoredUserId() {
  try {
    const userInfo = storage.getString('user_info');
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      if (parsed?.id) return String(parsed.id);
    }
  } catch (error) {
    console.warn('[PostHog] 解析 user_info 失败:', error);
  }

  return storage.getString('user_id') || storage.getString('device_id') || '';
}

export const getTrackingUserId = () => getStoredUserId() || 'anonymous';

export const getAppVersion = () =>
  Application.nativeApplicationVersion ||
  Constants.expoConfig?.version ||
  'unknown';

export const getAppEnv = () => APP_ENV;

export const syncNativeTrackingContext = (userId?: string) => {
  if (Platform.OS !== 'ios') return;

  const finalUserId = userId || getTrackingUserId();
  if (finalUserId) {
    storage.setGroup('user_id', finalUserId);
  }

  const deviceId = storage.getString('device_id');
  if (deviceId) {
    storage.setGroup('device_id', deviceId);
  }

  storage.setGroup('app_version', getAppVersion());
  storage.setGroup('app_env', getAppEnv());
  storage.setGroup('posthog_api_key', POSTHOG_API_KEY);
};

function buildBaseProperties(
  properties?: TrackProperties,
  eventOrigin: TrackingOrigin = 'app_js',
) {
  return {
    user_id: getTrackingUserId(),
    app_version: getAppVersion(),
    app_env: getAppEnv(),
    platform: Platform.OS,
    event_origin: eventOrigin,
    is_logged_in: !!storage.getString('access_token'),
    ...properties,
  };
}

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
 *
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const identifyUser = async (
  userId: string,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  // 1. PostHog 识别
  const client = posthog || getPostHogClient();
  if (client) {
    client.identify(userId, {
      user_id: userId,
      app_version: getAppVersion(),
      app_env: getAppEnv(),
      platform: Platform.OS,
      ...properties,
    });
    console.log('[PostHog] 用户识别:', userId);
  } else {
    console.warn('[PostHog] 客户端未初始化');
  }

  syncNativeTrackingContext(userId);
};

/**
 * 重置用户（登出后调用）
 *
 * 支持两种调用方式：
 * 1. 在组件中：传入 usePostHogClient() 返回的实例
 * 2. 在非组件代码中：不传参数，自动获取全局实例
 */
export const resetUser = async (posthog?: PostHog | null) => {
  const client = posthog || getPostHogClient();
  if (client) {
    client.reset();
    console.log('[PostHog] 用户重置');
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
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  const client = posthog || getPostHogClient();
  if (!client) {
    console.warn('[PostHog] 客户端未初始化，事件未记录:', eventName);
    return;
  }

  client.capture(normalizeEventName(eventName), {
    ...buildBaseProperties(properties),
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
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'screen_view',
    {
      screen_name: screenName,
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
  properties: TrackProperties,
  posthog?: PostHog | null,
) => {
  const client = posthog || getPostHogClient();
  if (!client) return;
  // posthog-react-native 使用 identify 来设置用户属性
  client.identify(undefined, {
    user_id: getTrackingUserId(),
    app_version: getAppVersion(),
    app_env: getAppEnv(),
    ...properties,
  });
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
export const trackLoginCompleted = (
  method: 'phone' | 'wechat' | 'apple',
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'login_completed',
    { login_method: method, ...properties },
    posthog,
  );
};

export const trackLoginStarted = (
  method: 'phone' | 'wechat' | 'apple',
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'login_started',
    { login_method: method, ...properties },
    posthog,
  );
};

export const trackLoginFailed = (
  method: 'phone' | 'wechat' | 'apple',
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'login_failed',
    { login_method: method, ...properties },
    posthog,
  );
};

/**
 * 用户注册
 */
export const trackRegisterCompleted = (
  method: 'phone' | 'wechat' | 'apple',
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'register_completed',
    { register_method: method, ...properties },
    posthog,
  );
};

/**
 * 用户登出
 */
export const trackLogout = (posthog?: PostHog | null) => {
  trackEvent('logout', undefined, posthog);
  resetUser(posthog);
};

/**
 * 创建专注计划
 */
export const trackPlanCreated = (
  planType: FocusType,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'plan_created',
    {
      focus_type: planType,
      ...properties,
    },
    posthog,
  );
};

/**
 * 权限点击
 */
export const trackPermissionRequestClicked = (
  permission: 'screen_time' | 'notification',
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'permission_request_clicked',
    {
      permission_type: permission,
      ...properties,
    },
    posthog,
  );
};

/**
 * 权限结果
 */
export const trackPermissionResult = (
  permission: 'screen_time' | 'notification',
  result: string,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'permission_result',
    {
      permission_type: permission,
      result,
      ...properties,
    },
    posthog,
  );
};

/**
 * 选择应用点击
 */
export const trackBlockAppsSelectionStarted = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'block_apps_selection_started',
    properties,
    posthog,
  );
};

/**
 * 选择应用结果
 */
export const trackBlockAppsSelected = (
  appCount: number,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'block_apps_selected',
    {
      selected_app_count: appCount,
      ...properties,
    },
    posthog,
  );
};

/**
 * 点击开始专注
 */
export const trackStartClicked = (
  planId: string,
  focusType: FocusType,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'start_clicked',
    {
      plan_id: planId,
      focus_type: focusType,
      ...properties,
    },
    posthog,
  );
};

/**
 * Onboarding 完成
 */
export const trackOnboardingCompleted = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('onboarding_completed', properties, posthog);
};

/**
 * 打开付费墙
 */
export const trackPaywallOpened = (
  placement: string,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'paywall_opened',
    {
      placement,
      ...properties,
    },
    posthog,
  );
};

/**
 * 购买成功
 */
export const trackPurchaseCompleted = (
  productId?: string,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'purchase_completed',
    {
      product_id: productId,
      ...properties,
    },
    posthog,
  );
};

export const trackPurchaseFailed = (
  productId: string | undefined,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'purchase_failed',
    {
      product_id: productId,
      ...properties,
    },
    posthog,
  );
};

export const trackPaywallClosed = (
  placement: string,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'paywall_closed',
    {
      placement,
      ...properties,
    },
    posthog,
  );
};

export const trackPaywallProductSelected = (
  productId: string | undefined,
  period: number | undefined,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'paywall_product_selected',
    {
      product_id: productId,
      period,
      ...properties,
    },
    posthog,
  );
};

export const trackPaywallPurchaseClicked = (
  productId: string | undefined,
  period: number | undefined,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'paywall_purchase_clicked',
    {
      product_id: productId,
      period,
      ...properties,
    },
    posthog,
  );
};

export const trackPurchaseStarted = (
  productId: string | undefined,
  period: number | undefined,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'purchase_started',
    {
      product_id: productId,
      period,
      ...properties,
    },
    posthog,
  );
};

export const trackPurchaseCancelled = (
  productId: string | undefined,
  period: number | undefined,
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent(
    'purchase_cancelled',
    {
      product_id: productId,
      period,
      ...properties,
    },
    posthog,
  );
};

export const trackRestoreStarted = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('restore_started', properties, posthog);
};

export const trackRestoreCompleted = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('restore_completed', properties, posthog);
};

export const trackRestoreFailed = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('restore_failed', properties, posthog);
};

export const trackRightsPageViewed = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('rights_page_viewed', properties, posthog);
};

export const trackManageSubscriptionClicked = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('manage_subscription_clicked', properties, posthog);
};

export const trackSubscriptionSyncStarted = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('subscription_sync_started', properties, posthog);
};

export const trackSubscriptionSyncCompleted = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('subscription_sync_completed', properties, posthog);
};

export const trackSubscriptionSyncFailed = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('subscription_sync_failed', properties, posthog);
};

export const trackSubscriptionStatusChanged = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('subscription_status_changed', properties, posthog);
};

export const trackSubscriptionRenewed = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('subscription_renewed', properties, posthog);
};

export const trackSubscriptionExpired = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('subscription_expired', properties, posthog);
};

export const trackSubscriptionRefunded = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('subscription_refunded', properties, posthog);
};

export const trackSubscriptionWebhookProcessed = (
  properties?: TrackProperties,
  posthog?: PostHog | null,
) => {
  trackEvent('subscription_webhook_processed', properties, posthog);
};

// 兼容旧调用名，统一映射到新事件
export const trackLogin = trackLoginCompleted;
export const trackRegister = trackRegisterCompleted;
export const trackCreatePlan = trackPlanCreated;
export const trackStartFocus = (
  planId: string,
  duration: number,
  posthog?: PostHog | null,
) => trackStartClicked(planId, 'once', { duration_minutes: duration }, posthog);
export const trackOpenPaywall = trackPaywallOpened;
export const trackPurchaseSuccess = trackPurchaseCompleted;
export const trackAddBlockApps = (
  appCount: number,
  posthog?: PostHog | null,
) => trackBlockAppsSelected(appCount, undefined, posthog);
export const trackPermissionGrant = (
  permission: 'screen_time' | 'notification',
  posthog?: PostHog | null,
) => trackPermissionResult(permission, 'approved', undefined, posthog);
export const trackPermissionDeny = (
  permission: 'screen_time' | 'notification',
  posthog?: PostHog | null,
) => trackPermissionResult(permission, 'denied', undefined, posthog);
