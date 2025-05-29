import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable } from 'mobx';
import { Appearance, AppStateStatus, NativeModules } from 'react-native';
import { PlanStore } from './index';

const { NativeClass } = NativeModules;

class HomeStore {
  constructor() {
    makeAutoObservable(this);
    // 默认值：优先本地存储，否则跟随系统
    this.initTheme();
    // 监听系统主题变化
    Appearance.addChangeListener(this.handleThemeChange);
  }

  all_apps: any[] = []; // 所有已安装的app
  exit_times: number[] = []; // 中途退出记录

  them: 'dark' | 'light' = 'light'; // 主题
  followSystem: boolean = true; // 是否跟随系统主题

  vpn_state: VpnState = 'close'; // VPN 状态
  vpn_init = true; // VPN 是否初始化

  app_state: AppStateStatus = 'unknown'; // 应用的状态

  get is_vpnstart() {
    return this.vpn_state === 'start';
  }

  get not_vpnopen() {
    return ['close', 'refuse'].includes(this.vpn_state);
  }

  setVpnInit = (init: boolean) => {
    this.vpn_init = init;
  };
  setAppState = (state: AppStateStatus) => {
    this.app_state = state;
  };

  checkVpn = (start = false) => {
    NativeClass.isVpnInit()
      .then((init: boolean) => {
        this.setVpnInit(init);
        if (init && start) {
          this.startVpn();
        }
      })
      .catch((error: any) => {
        console.log(error);
      });
  };

  startVpn = (onlyInit: boolean = false) => {
    // if (this.vpn_init) {
    NativeClass.startVpn(onlyInit);
    // } else {
    //   Dialog({
    //     title: '使用声明',
    //     message: `专注一点使用 VPN 技术屏蔽娱乐应用，帮助您隔绝干扰、全神贯注地工作或学习。完全保障您的隐私安全，无需担心任何隐私泄露的风险。\n \n请在接下来的提示中允许使用 VPN 连接。当您不再需要此功能时，可随时关闭连接。`,
    //   }).then(action => {
    //     if (action === 'confirm') {
    //       NativeClass.startVpn();
    //     }
    //   });
    // }
  };

  stopVpn = () => {
    PlanStore.clearPlans();
    NativeClass.stopVpn();
  };

  // 监听系统主题变化
  handleThemeChange = ({
    colorScheme,
  }: {
    colorScheme: 'dark' | 'light' | null | undefined;
  }) => {
    if (this.followSystem) {
      this.setThem(colorScheme === 'dark' ? 'dark' : 'light');
    }
  };

  // 设置主题
  setThem = (them: 'dark' | 'light', followSystem: boolean = true) => {
    this.them = them;
    this.followSystem = followSystem;
    AsyncStorage.setItem('mythem', them);
    AsyncStorage.setItem('followSystem', followSystem.toString());
  };

  // 设置中途退出记录
  setExitTimes = async (times: number | number[]) => {
    if (typeof times === 'number') {
      this.exit_times.push(times);
    } else {
      this.exit_times = times;
    }
    AsyncStorage.setItem('exit_times', JSON.stringify(this.exit_times));
  };

  loadApps = () => {
    NativeClass.getApps().then((list: any) => {
      this.setApps(JSON.parse(list));
    });
  };

  setApps = (apps: any[]) => {
    this.all_apps = apps;
  };

  setVpnState = (state: VpnState) => {
    this.vpn_state = state;
  };

  async initTheme() {
    let sys = Appearance.getColorScheme() || 'light';
    let local = await AsyncStorage.getItem('mythem');
    let followSystem = await AsyncStorage.getItem('followSystem');

    // 如果本地没有保存是否跟随系统的设置，默认跟随系统
    if (followSystem === null) {
      this.followSystem = true;
    } else {
      this.followSystem = followSystem === 'true';
    }

    // 如果跟随系统，使用系统主题；否则使用本地保存的主题
    if (this.followSystem) {
      this.setThem(sys === 'dark' ? 'dark' : 'light', true);
    } else {
      this.setThem(
        (local as any) || (sys === 'dark' ? 'dark' : 'light'),
        false,
      );
    }
  }
}

const store = new HomeStore();

export default store;
