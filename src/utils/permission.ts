import {
  checkScreenTimePermission as nativeCheckScreenTimePermission,
  getFocusStatus as nativeGetFocusStatus,
  requestScreenTimePermission as nativeRequestScreenTimePermission,
  selectAppsToLimit as nativeSelectAppsToLimit,
  startAppLimits as nativeStartAppLimits,
  stopAppLimits as nativeStopAppLimits,
} from '@/native/ios';
import type { AppDetail, AppSelectionResult, FocusStatus } from '@/native/type';
import {
  trackBlockAppsSelected,
  trackBlockAppsSelectionStarted,
  trackPermissionRequestClicked,
  trackPermissionResult,
  trackStartClicked,
  type FocusType,
} from '@/utils/analytics';
import { storage } from '@/utils/storage';
import * as Notifications from 'expo-notifications';

type TrackingOptions = {
  entry_source?: string;
  screen_name?: string;
};

type StartTrackingOptions = TrackingOptions & {
  focus_type?: FocusType;
};

// 请求屏幕时间权限
export async function getScreenTimePermission(
  options?: TrackingOptions,
): Promise<boolean> {
  trackPermissionRequestClicked('screen_time', options);
  const res = await nativeRequestScreenTimePermission();
  trackPermissionResult('screen_time', res ? 'approved' : 'denied', options);
  console.log('getScreenTimePermission res', res);
  return res;
}

// 检查屏幕时间权限
export async function checkScreenTimePermission(init = 1): Promise<string> {
  const status = await nativeCheckScreenTimePermission(init);
  console.log('屏幕时间权限：', status);
  return status;
}

// 导出类型（保持向后兼容）
export type { AppDetail, AppSelectionResult };

// 选择要限制的应用
export async function selectAppsToLimit(
  maxCount: number = 0,
  apps?: string[],
  options?: TrackingOptions,
): Promise<AppSelectionResult> {
  try {
    trackBlockAppsSelectionStarted(options);
    const result = await nativeSelectAppsToLimit(maxCount, apps);
    console.log('selectAppsToLimit result', result);
    if (result.success) {
      trackBlockAppsSelected(result.apps?.length || 0, options);
      return result;
    } else {
      throw { success: false };
    }
  } catch (error) {
    console.log('selectAppsToLimit error', error);
    trackBlockAppsSelected(0, { ...options, result: 'failed' });
    throw { success: false };
  }
}

// 开始限制应用
export async function startAppLimits(
  durationMinutes?: number,
  planId?: string,
  mode: 'shield' | 'allow' = 'shield',
  options?: StartTrackingOptions,
): Promise<boolean> {
  const entrySource = options?.entry_source || '';
  if (entrySource) {
    storage.setGroup('FocusOne.FocusEntrySource', entrySource);
  }
  trackStartClicked(planId || '', options?.focus_type || 'once', {
    duration_minutes: durationMinutes,
    mode,
    ...options,
  });
  const result = await nativeStartAppLimits(durationMinutes, planId, mode);
  console.log('startAppLimits result', result);
  return result;
}

// 停止限制应用
export async function stopAppLimits(): Promise<boolean> {
  const result = await nativeStopAppLimits();
  console.log('停止任务结果：', result);
  return result;
}

// iOS 查询当前屏蔽状态
export async function getIOSFocusStatus(): Promise<FocusStatus> {
  const result = await nativeGetFocusStatus();
  return result;
}

export async function checkNotify() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('检查通知权限失败:', error);
    return null;
  }
}
