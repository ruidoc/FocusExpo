/**
 * iOS 原生模块方法封装 - 发送部分
 * 封装所有与 NativeModule 的方法调用
 */

import { Toast } from '@/components/ui';
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
 */
export async function requestScreenTimePermission(): Promise<boolean> {
  return callNativeMethod(
    'requestScreenTimePermission',
    () => getNativeModule()!.requestScreenTimePermission(),
    false,
  );
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
    { success: false },
  );
}

/**
 * 开始应用限制（仅一次性任务屏蔽）
 * @param durationMinutes 任务时长（分钟），0 表示全天重复
 * @param planId 计划 ID（可选）
 */
export async function startAppLimits(
  durationMinutes?: number,
  planId?: string,
): Promise<boolean> {
  return callNativeMethod(
    'startAppLimits',
    () =>
      getNativeModule()!.startAppLimits(durationMinutes ?? 0, planId ?? null),
    false,
  );
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
 * 对应现有的 getIOSFocusStatus 函数
 */
export async function getFocusStatus(): Promise<FocusStatus> {
  return callNativeMethod(
    'getFocusStatus',
    () => getNativeModule()!.getFocusStatus(),
    { active: false },
  );
}

/**
 * 增量更新单个计划
 * @param plan 计划配置对象
 */
export async function updatePlan(plan: PlanConfig): Promise<boolean> {
  return callNativeMethod(
    'updatePlan',
    () => getNativeModule()!.updatePlan(JSON.stringify(plan)),
    false,
  );
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
