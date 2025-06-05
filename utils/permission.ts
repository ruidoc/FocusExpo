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
export async function checkScreenTimePermission(): Promise<string> {
  if (Platform.OS !== 'ios') return 'notSupported';
  try {
    let status = await NativeModules.NativeModule.checkScreenTimePermission();
    console.log('checkScreenTimePermission status', status);
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
  icon?: string; // Base64编码的图标
  type: 'application' | 'webDomain' | 'category';
}

// 应用选择结果接口
export interface AppSelectionResult {
  success: boolean;
  apps?: AppDetail[];
}

// 选择要限制的应用
export async function selectAppsToLimit(): Promise<AppSelectionResult> {
  if (Platform.OS !== 'ios') return { success: false };
  try {
    let result = await NativeModules.NativeModule.selectAppsToLimit();
    console.log('selectAppsToLimit result', result);
    return result as AppSelectionResult;
  } catch (error) {
    console.log('selectAppsToLimit error', error);
    return { success: false };
  }
}

// 开始限制应用
export async function startAppLimits(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    let result = await NativeModules.NativeModule.startAppLimits();
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
