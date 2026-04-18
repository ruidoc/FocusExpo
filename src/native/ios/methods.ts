/**
 * iOS 原生模块方法封装 - 发送部分
 * 封装所有与 NativeModule 的方法调用
 */

import { Toast } from '@/components/ui';
import { trackEvent } from '@/utils/analytics';
import { NativeModules, Platform } from 'react-native';
import type {
  AppSelectionResult,
  FocusStatus,
  NativeModuleInterface,
  PlanConfig,
  ScreenTimePermissionStatus,
} from '../type';

/**
 * 获取原生模块实例
 */
function getNativeModule(): NativeModuleInterface | null {
  if (Platform.OS !== 'ios') {
    return null;
  }
  return NativeModules.NativeModule;
}

/**
 * 从错误对象中提取错误消息
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '操作失败，请重试';
}

function getNativeErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const c = (error as { code?: string }).code;
    return typeof c === 'string' ? c : undefined;
  }
  return undefined;
}

type ExcessiveLockSource = 'startAppLimits' | 'updatePlan';

function trackExcessiveLockLimited(params: {
  source: ExcessiveLockSource;
  planId?: string;
  durationMinutes?: number;
  mode?: 'shield' | 'allow';
  error: unknown;
}) {
  const errorCode = getNativeErrorCode(params.error) || 'DEVICE_ACTIVITY_RATE_LIMIT';
  const errorMessage = getErrorMessage(params.error);

  if (params.source === 'startAppLimits') {
    trackEvent('session_failed', {
      plan_id: params.planId,
      focus_type: 'once',
      duration_minutes: params.durationMinutes,
      mode: params.mode,
      failure_stage: 'start_app_limits',
      error_type: 'device_activity_rate_limit',
      error_code: errorCode,
      error_message: errorMessage,
    });
    return;
  }

  trackEvent('plan_sync_failed', {
    plan_id: params.planId,
    sync_mode: 'update_plan',
    failure_stage: 'update_plan',
    error_type: 'device_activity_rate_limit',
    error_code: errorCode,
    error_message: errorMessage,
  });
}

/** Device Activity 监控数量/密度超限（系统 localizedDescription 因语言而异，不能与 MONITOR_ERROR 划等号） */
function isDeviceActivityExcessiveError(error: unknown): boolean {
  const msg = getErrorMessage(error);
  return (
    msg.includes('过度活动') ||
    /excessive/i.test(msg) ||
    /too many activities/i.test(msg)
  );
}

/**
 * 统一错误处理和平台检查
 */
async function callNativeMethod<T>(
  methodName: string,
  method: () => Promise<T>,
  defaultValue: T,
): Promise<T> {
  if (Platform.OS !== 'ios') {
    return defaultValue;
  }
  try {
    return await method();
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`[NativeModule.${methodName}]`, error);
    // 显示错误提示
    Toast(errorMessage, 'error');
    return defaultValue;
  }
}

/**
 * 请求屏幕使用时间权限
 * 用户拒绝时提示"用户未授权"（非错误样式），避免报错感
 */
export async function requestScreenTimePermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  try {
    return await getNativeModule()!.requestScreenTimePermission();
  } catch (error) {
    console.log('[NativeModule.requestScreenTimePermission] 用户未授权', error);
    Toast('用户未授权', 'info');
    return false;
  }
}

/**
 * 检查屏幕使用时间权限状态
 * 注意：保持与现有代码的兼容性，返回类型包含 'notSupported' 和 'error'
 */
export async function checkScreenTimePermission(
  init = 1,
): Promise<ScreenTimePermissionStatus | 'notSupported' | 'error'> {
  if (Platform.OS !== 'ios') {
    return 'notSupported';
  }

  try {
    const status = await getNativeModule()!.checkScreenTimePermission();
    // 保持现有的递归逻辑：如果状态是 notDetermined 且 init < 2，则重试一次
    if (init < 2 && status === 'notDetermined') {
      return await checkScreenTimePermission(init + 1);
    }
    return status;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('[NativeModule.checkScreenTimePermission]', error);
    // 显示错误提示
    Toast(errorMessage, 'error');
    return 'error';
  }
}

/**
 * 选择要限制的应用
 * @param maxCount 最大选择数量，0 表示不限制
 * @param apps 应用 ID 数组，undefined 表示使用上次保存的选择
 */
export async function selectAppsToLimit(
  maxCount: number = 0,
  apps?: string[],
): Promise<AppSelectionResult> {
  return callNativeMethod(
    'selectAppsToLimit',
    () =>
      getNativeModule()!.selectAppsToLimit(
        maxCount,
        apps ? apps.join(',') : null,
      ),
    { success: false, reason: 'error' },
  );
}

/**
 * 开始应用限制（仅一次性任务屏蔽）
 * @param durationMinutes 任务时长（分钟），0 表示全天重复
 * @param planId 计划 ID（可选）
 * @param mode 屏蔽模式：shield=黑名单, allow=白名单
 */
export async function startAppLimits(
  durationMinutes?: number,
  planId?: string,
  mode: 'shield' | 'allow' = 'shield',
): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  try {
    await getNativeModule()!.startAppLimits(
      durationMinutes ?? 0,
      planId ?? null,
      mode,
    );
    return true;
  } catch (error) {
    if (getNativeErrorCode(error) === 'OVERLAP_ERROR') {
      Toast('与契约时间冲突，请调整时长', 'info');
      return false;
    }
    if (getNativeErrorCode(error) === 'ACTIVE_ERROR') {
      Toast('专注进行中，不可创建新任务', 'info');
      return false;
    }
    if (isDeviceActivityExcessiveError(error)) {
      trackExcessiveLockLimited({
        source: 'startAppLimits',
        planId,
        durationMinutes,
        mode,
        error,
      });
      Toast('锁定过于频繁，触发系统限制', 'error');
      return false;
    }
    console.error('[NativeModule.startAppLimits]', error);
    Toast(getErrorMessage(error), 'error');
    return false;
  }
}

/**
 * 停止应用限制（通用）
 */
export async function stopAppLimits(): Promise<boolean> {
  return callNativeMethod(
    'stopAppLimits',
    () => getNativeModule()!.stopAppLimits(),
    false,
  );
}

/**
 * 暂停应用限制（通用）
 * @param durationMinutes 暂停时长（分钟），默认 3 分钟
 */
export async function pauseAppLimits(
  durationMinutes?: number,
): Promise<boolean> {
  return callNativeMethod(
    'pauseAppLimits',
    () => getNativeModule()!.pauseAppLimits(durationMinutes ?? null),
    false,
  );
}

/**
 * 恢复应用限制（通用）
 */
export async function resumeAppLimits(): Promise<boolean> {
  return callNativeMethod(
    'resumeAppLimits',
    () => getNativeModule()!.resumeAppLimits(),
    false,
  );
}

/**
 * 获取专注状态，返回当前屏蔽信息
 * 注意：原生调用失败时会抛出异常而非静默返回默认值，
 * 以便调用方（如 syncIOSStatus）区分「真正无任务」和「查询失败」。
 */
export async function getFocusStatus(): Promise<FocusStatus> {
  if (Platform.OS !== 'ios') {
    return { active: false };
  }
  return await getNativeModule()!.getFocusStatus();
}

/**
 * 增量更新单个计划
 * @param plan 计划配置对象
 */
export async function updatePlan(plan: PlanConfig): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  try {
    await getNativeModule()!.updatePlan(JSON.stringify(plan));
    return true;
  } catch (error) {
    if (isDeviceActivityExcessiveError(error)) {
      trackExcessiveLockLimited({
        source: 'updatePlan',
        planId: plan.id,
        error,
      });
      Toast('锁定过于频繁，触发系统限制', 'error');
      return false;
    }
    console.error('[NativeModule.updatePlan]', error);
    Toast(getErrorMessage(error), 'error');
    return false;
  }
}

/**
 * 删除单个计划
 * @param planId 计划 ID
 */
export async function deletePlan(planId: string): Promise<boolean> {
  return callNativeMethod(
    'deletePlan',
    () => getNativeModule()!.deletePlan(planId),
    false,
  );
}
