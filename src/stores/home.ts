import { checkScreenTimePermission } from '@/utils/permission';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, AppStateStatus, Platform } from 'react-native';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import PlanStore from './plan';

const HomeStore = create(
  combine(
    {
      all_apps: [] as any[], // 所有已安装的app
      exit_times: [] as number[], // 中途退出记录

      them: 'light' as 'dark' | 'light', // 主题
      followSystem: true, // 是否跟随系统主题

      vpn_state: 'close' as VpnState, // VPN 状态
      vpn_init: false, // VPN 是否初始化
      ios_screen_time_permission: true, // iOS 屏幕时间权限状态

      app_state: 'unknown' as AppStateStatus, // 应用的状态
    },
    (set, get) => ({
      // Getter 方法改为普通函数
      is_vpnstart: () => {
        return get().vpn_state === 'start';
      },

      not_vpnopen: () => {
        return ['close', 'refuse'].includes(get().vpn_state);
      },

      setVpnInit: (init: boolean) => {
        set({ vpn_init: init });
      },

      setIOSScreenTimePermission: (granted: boolean) => {
        set({ ios_screen_time_permission: granted });
      },

      setAppState: (state: AppStateStatus) => {
        set({ app_state: state });
      },

      checkVpn: (start = false) => {
        // 检查iOS屏幕时间权限
        if (Platform.OS === 'ios') {
          (get() as any).checkIOSScreenTimePermission();
        }
        // NativeClass.isVpnInit()
        //   .then((init: boolean) => {
        //     get().setVpnInit(init);
        //     if (init && start) {
        //       get().startVpn();
        //     }
        //   })
        //   .catch((error: any) => {
        //     console.log(error);
        //   });
      },

      // 检查iOS屏幕时间权限
      checkIOSScreenTimePermission: async () => {
        if (Platform.OS !== 'ios') return false;
        try {
          const status = await checkScreenTimePermission();
          const granted = status === 'approved';
          set({ ios_screen_time_permission: granted });
          return granted;
        } catch (error) {
          console.log('检查iOS屏幕时间权限失败:', error);
          set({ ios_screen_time_permission: false });
          return false;
        }
      },

      startVpn: (onlyInit: boolean = false) => {
        // if (get().vpn_init) {
        // NativeClass.startVpn(onlyInit);
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
      },

      stopVpn: () => {
        PlanStore.clearPlans();
        // NativeClass.stopVpn();
      },

      // 监听系统主题变化
      handleThemeChange: ({
        colorScheme,
      }: {
        colorScheme: 'dark' | 'light' | null | undefined;
      }) => {
        if (get().followSystem) {
          (get() as any).setThem(colorScheme === 'dark' ? 'dark' : 'light');
        }
      },

      // 设置主题
      setThem: (them: 'dark' | 'light', followSystem: boolean = true) => {
        set({ them, followSystem });
        AsyncStorage.setItem('mythem', them);
        AsyncStorage.setItem('followSystem', followSystem.toString());
      },

      // 设置中途退出记录
      setExitTimes: async (times: number | number[]) => {
        const currentExitTimes = get().exit_times;
        let newExitTimes: number[];
        if (typeof times === 'number') {
          newExitTimes = [...currentExitTimes, times];
        } else {
          newExitTimes = times;
        }
        set({ exit_times: newExitTimes });
        AsyncStorage.setItem('exit_times', JSON.stringify(newExitTimes));
      },

      loadApps: () => {
        // NativeClass.getApps().then((list: any) => {
        //   get().setApps(JSON.parse(list));
        // });
      },

      setApps: (apps: any[]) => {
        set({ all_apps: apps });
      },

      setVpnState: (state: VpnState) => {
        set({ vpn_state: state });
      },

      // 初始化主题
      initTheme: async () => {
        const sys = Appearance.getColorScheme() || 'light';
        const local = await AsyncStorage.getItem('mythem');
        const followSystem = await AsyncStorage.getItem('followSystem');

        let shouldFollowSystem: boolean;
        // 如果本地没有保存是否跟随系统的设置，默认跟随系统
        if (followSystem === null) {
          shouldFollowSystem = true;
        } else {
          shouldFollowSystem = followSystem === 'true';
        }

        // 如果跟随系统，使用系统主题；否则使用本地保存的主题
        if (shouldFollowSystem) {
          (get() as any).setThem(sys === 'dark' ? 'dark' : 'light', true);
        } else {
          (get() as any).setThem(
            (local as 'dark' | 'light') || (sys === 'dark' ? 'dark' : 'light'),
            false,
          );
        }
      },

      // 初始化 store（设置监听器等）
      init: () => {
        // 初始化主题
        (get() as any).initTheme();
        // 监听系统主题变化
        Appearance.addChangeListener((get() as any).handleThemeChange);
      },
    }),
  ),
);

// 初始化 store
HomeStore.getState().init();

export default HomeStore;
