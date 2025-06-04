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
