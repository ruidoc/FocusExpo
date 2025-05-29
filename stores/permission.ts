import { makeAutoObservable } from 'mobx';
import http from '@/request';
import { Dialog, Toast } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import Permissions, { PERMISSIONS } from 'react-native-permissions';
import { toast } from '@/utils';

const { NativeClass } = NativeModules;

class PermissionStore {
  constructor() {
    makeAutoObservable(this);
  }

  pm_battery = false; // 电池优化是否忽略
  pm_notify = false; // 通知权限是否打开

  setPmBattery = (ignore: boolean) => {
    this.pm_battery = ignore;
  };

  setPmNotify = (open: boolean) => {
    this.pm_notify = open;
  };

  // 检查电池优化
  checkBattery = async (apply = false) => {
    NativeClass.checkBattery(apply).then((ok: boolean) => {
      this.setPmBattery(ok);
    });
  };

  // 检查通知权限
  checkNotify = async () => {
    try {
      const result = await Permissions.checkNotifications();
      this.setPmNotify(result.status === 'granted');
      return result.status;
    } catch (error) {
      console.error('检查通知权限失败:', error);
      return null;
    }
  };

  // 打开通知页面
  openNotify = async (apply = false) => {
    try {
      if (apply) {
        // 先检查权限状态
        let status = await this.checkNotify();
        if (status === 'granted') return;

        // 请求权限
        let result = await Permissions.requestNotifications(['alert', 'sound']);
        console.log('通知权限结果:', result);

        if (result.status !== 'granted') {
          Dialog({
            title: '通知权限提醒',
            message:
              '为了确保前台服务稳定运行，并持续显示专注时间，您需要授予通知权限。\n\n' +
              (Platform.OS === 'ios'
                ? '请在设置中开启通知权限'
                : '进入下一个页面，点击通知管理->允许通知，勾选☑️横幅通知'),
          }).then(action => {
            if (action === 'confirm') {
              console.log('用户确认打开设置');
              Permissions.openSettings().catch(() => {
                toast('请手动打开设置页面并允许通知');
              });
            }
          });
        } else {
          this.setPmNotify(true);
        }
      }
    } catch (error) {
      console.error('请求通知权限失败:', error);
      toast('请求通知权限失败，请稍后重试');
    }
  };
}

const store = new PermissionStore();

export default store;
