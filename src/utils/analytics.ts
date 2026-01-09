/**
 * PostHog 埋点工具
 * 封装PostHog analytics功能
 */

import { Platform } from 'react-native';
import { PostHog, PostHogProvider } from 'posthog-react-native';

// PostHog配置
const POSTHOG_API_KEY = 'phc_A4Pt2WQHEQLedNR9wyLMxSHrpdnOdUTCiR8LHNGT5QG';
const POSTHOG_HOST = 'https://us.i.posthog.com'; // 美国服务器（默认）

let posthogClient: PostHog | null = null;

/**
 * 初始化PostHog客户端
 */
export const initPostHog = async (): Promise<PostHog> => {
  if (posthogClient) {
    return posthogClient;
  }

  posthogClient = await PostHog.initAsync(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    captureApplicationLifecycleEvents: true, // 自动捕获应用生命周期事件
    captureDeepLinks: true, // 捕获深度链接
    enableSessionReplay: false, // 不启用会话回放（隐私保护）
  });

  console.log('[PostHog] 初始化成功');
  return posthogClient;
};

/**
 * 获取PostHog客户端实例
 */
export const getPostHog = (): PostHog | null => {
  return posthogClient;
};

/**
 * 识别用户（登录后调用）
 */
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!posthogClient) {
    console.warn('[PostHog] 客户端未初始化');
    return;
  }

  posthogClient.identify(userId, {
    platform: Platform.OS,
    ...properties,
  });
  console.log('[PostHog] 用户识别:', userId);
};

/**
 * 重置用户（登出后调用）
 */
export const resetUser = () => {
  if (!posthogClient) return;
  posthogClient.reset();
  console.log('[PostHog] 用户重置');
};

/**
 * 记录事件
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>,
) => {
  if (!posthogClient) {
    console.warn('[PostHog] 客户端未初始化，事件未记录:', eventName);
    return;
  }

  posthogClient.capture(eventName, {
    platform: Platform.OS,
    ...properties,
  });
  console.log('[PostHog] 事件记录:', eventName, properties);
};

/**
 * 记录页面访问
 */
export const trackScreen = (screenName: string, properties?: Record<string, any>) => {
  trackEvent('$screen', {
    $screen_name: screenName,
    ...properties,
  });
};

/**
 * 设置用户属性
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!posthogClient) return;
  posthogClient.setPersonProperties(properties);
  console.log('[PostHog] 用户属性更新:', properties);
};

// ============== 预定义事件 ==============

/**
 * 用户登录
 */
export const trackLogin = (method: 'phone' | 'wechat' | 'apple') => {
  trackEvent('user_login', { login_method: method });
};

/**
 * 用户注册
 */
export const trackRegister = (method: 'phone' | 'wechat' | 'apple') => {
  trackEvent('user_register', { register_method: method });
};

/**
 * 用户登出
 */
export const trackLogout = () => {
  trackEvent('user_logout');
  resetUser();
};

/**
 * 创建专注计划
 */
export const trackCreatePlan = (planType: 'once' | 'repeat', duration: number) => {
  trackEvent('plan_create', {
    plan_type: planType,
    duration_minutes: duration,
  });
};

/**
 * 启动专注
 */
export const trackStartFocus = (planId: string, duration: number) => {
  trackEvent('focus_start', {
    plan_id: planId,
    duration_minutes: duration,
  });
};

/**
 * 完成专注
 */
export const trackCompleteFocus = (
  planId: string,
  duration: number,
  isSuccess: boolean,
) => {
  trackEvent('focus_complete', {
    plan_id: planId,
    duration_minutes: duration,
    is_success: isSuccess,
  });
};

/**
 * 暂停专注
 */
export const trackPauseFocus = (planId: string, remainingMinutes: number) => {
  trackEvent('focus_pause', {
    plan_id: planId,
    remaining_minutes: remainingMinutes,
  });
};

/**
 * 恢复专注
 */
export const trackResumeFocus = (planId: string) => {
  trackEvent('focus_resume', {
    plan_id: planId,
  });
};

/**
 * 打开Superwall Paywall
 */
export const trackOpenPaywall = (placement: string) => {
  trackEvent('paywall_open', {
    placement,
  });
};

/**
 * Superwall购买成功
 */
export const trackPurchaseSuccess = (productId?: string) => {
  trackEvent('purchase_success', {
    product_id: productId,
  });
};

/**
 * 添加屏蔽应用
 */
export const trackAddBlockApps = (appCount: number) => {
  trackEvent('apps_add', {
    app_count: appCount,
  });
};

/**
 * 权限授予
 */
export const trackPermissionGrant = (permission: 'screen_time' | 'notification') => {
  trackEvent('permission_grant', {
    permission_type: permission,
  });
};

/**
 * 权限拒绝
 */
export const trackPermissionDeny = (permission: 'screen_time' | 'notification') => {
  trackEvent('permission_deny', {
    permission_type: permission,
  });
};

// 导出PostHogProvider以便在_layout.tsx中使用
export { PostHogProvider };