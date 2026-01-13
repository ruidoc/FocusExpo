import { checkScreenTimePermission } from '@/utils/permission';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, AppStateStatus, Platform } from 'react-native';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import PlanStore from './plan';

const HomeStore = combine(
  {
    all_apps: [] as any[], // 所有已安装的app
    exit_times: [] as number[], // 中途退出记录

    them: 'light' as 'dark' | 'light', // 主题
    followSystem: true, // 是否跟随系统主题

    ios_screen_time_permission: true, // iOS 屏幕时间权限状态

    app_state: 'unknown' as AppStateStatus, // 应用的状态
  },
  (set, get) => ({
    // Getter 方法改为普通函数
    is_vpnstart: () => {
      return false;
    },

    not_vpnopen: () => {
      return true;
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
    },

    stopVpn: () => {
      PlanStore.getState().clearPlans();
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
    },

    setApps: (apps: any[]) => {
      set({ all_apps: apps });
    },

    setVpnState: (state: VpnState) => {
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
);

const store = create(HomeStore);

export default store;
