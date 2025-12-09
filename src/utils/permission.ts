import * as Notifications from 'expo-notifications';
import {
  requestScreenTimePermission as nativeRequestScreenTimePermission,
  checkScreenTimePermission as nativeCheckScreenTimePermission,
  selectAppsToLimit as nativeSelectAppsToLimit,
  startAppLimits as nativeStartAppLimits,
  stopAppLimits as nativeStopAppLimits,
  getFocusStatus as nativeGetFocusStatus,
} from '@/native/ios';
import type {
  AppDetail,
  AppSelectionResult,
  FocusStatus,
} from '@/native/type';

// 请求屏幕时间权限
export async function getScreenTimePermission(): Promise<boolean> {
  const res = await nativeRequestScreenTimePermission();
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
): Promise<AppSelectionResult> {
  try {
    const result = await nativeSelectAppsToLimit(maxCount, apps);
    console.log('selectAppsToLimit result', result);
    if (result.success) {
      return result;
    } else {
      throw { success: false };
    }
  } catch (error) {
    console.log('selectAppsToLimit error', error);
    throw { success: false };
  }
}

// 开始限制应用
export async function startAppLimits(
  durationMinutes?: number,
  planId?: string,
): Promise<boolean> {
  const result = await nativeStartAppLimits(durationMinutes, planId);
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
