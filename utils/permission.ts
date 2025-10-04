import { NativeModules, Platform } from 'react-native';

// 请求屏幕时间权限
export async function getScreenTimePermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    let res = await NativeModules.NativeModule.requestScreenTimePermission();
    console.log('getScreenTimePermission res', res);
    return res;
  } catch (error) {
    console.log('getScreenTimePermission error', error);
    return false;
  }
}

// 检查屏幕时间权限
export async function checkScreenTimePermission(init = 1): Promise<string> {
  if (Platform.OS !== 'ios') return 'notSupported';
  try {
    let status = await NativeModules.NativeModule.checkScreenTimePermission();
    if (init < 2 && status === 'notDetermined') {
      status = await checkScreenTimePermission(init + 1);
    }
    console.log('屏幕时间权限：', status);
    return status;
  } catch (error) {
    console.log('checkScreenTimePermission error', error);
    return 'error';
  }
}

// 应用详情接口
export interface AppDetail {
  id: string;
  name: string;
  type: 'application' | 'webDomain' | 'category';
  tokenData?: string; // Base64编码的原生token数据，推荐使用
  icon?: string; // 兼容旧字段
}

// 应用选择结果接口
export interface AppSelectionResult {
  success: boolean;
  apps?: AppDetail[];
}

// 选择要限制的应用
export async function selectAppsToLimit(
  maxCount: number = 0,
): Promise<AppSelectionResult> {
  if (Platform.OS !== 'ios') return { success: false };
  try {
    let result = await NativeModules.NativeModule.selectAppsToLimit(maxCount);
    console.log('selectAppsToLimit result', result);
    if (result.success) {
      return result as AppSelectionResult;
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
  if (Platform.OS !== 'ios') return false;
  try {
    let result = await NativeModules.NativeModule.startAppLimits(
      durationMinutes ?? 0,
      planId ?? null,
    );
    console.log('startAppLimits result', result);
    return result;
  } catch (error) {
    console.log('startAppLimits error', error);
    return false;
  }
}

// 停止限制应用
export async function stopAppLimits(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    let result = await NativeModules.NativeModule.stopAppLimits();
    console.log('stopAppLimits result', result);
    return result;
  } catch (error) {
    console.log('stopAppLimits error', error);
    return false;
  }
}

// iOS 查询当前屏蔽状态
export async function getIOSFocusStatus(): Promise<{
  active: boolean;
  startAt?: number;
  endAt?: number;
  totalMinutes?: number;
  elapsedMinutes?: number;
  plan_id?: string;
  record_id?: string;
  paused?: boolean;
}> {
  if (Platform.OS !== 'ios') return { active: false };
  try {
    let result = await NativeModules.NativeModule.getFocusStatus();
    return result as any;
  } catch (error) {
    console.log('getIOSFocusStatus error', error);
    return { active: false };
  }
}

// 渲染应用Label为图片列表
export async function getSelectIosApps(): Promise<AppDetail[]> {
  if (Platform.OS !== 'ios') return [];
  try {
    let appIcons = await NativeModules.NativeModule.renderAppLabelToImage();
    return appIcons as AppDetail[];
  } catch (error) {
    console.log('获取选中app异常：', error);
    return [];
  }
}
