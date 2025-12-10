import { Toast } from '@/components/ui';
import { storage } from '@/utils';
import http from '@/utils/request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import HomeStore from './home';

const AppStore = combine(
  {
    focus_apps: [] as string[], // 专注APP包名
    shield_apps: [] as string[], // 屏蔽APP包名
    ios_selected_apps: [] as any[], // iOS选中的应用apps列表
    ios_all_apps: [] as any[], // iOS所有应用列表
  },
  (set, get) => ({
    // Getter 方法改为普通函数
    ios_stableids: () => {
      return get().ios_all_apps.map(r => r.stableId);
    },

    setFocusApps: (apps: string[]) => {
      set({ focus_apps: apps });
      // NativeClass.updateFocusApps(JSON.stringify(apps));
      AsyncStorage.setItem('focus_apps', JSON.stringify(apps));
    },

    setShieldApps: (apps: string[]) => {
      set({ shield_apps: apps });
      // NativeClass.updateShieldApps(JSON.stringify(apps));
      AsyncStorage.setItem('shield_apps', JSON.stringify(apps));
    },

    // 设置iOS选择的应用
    setIosSelectedApps: (apps: any[]) => {
      set({ ios_selected_apps: apps });
      console.log('选中的：', apps);
    },

    // 设置iOS选择的应用
    setIosAllApps: (apps: any[]) => {
      set({ ios_all_apps: apps });
      storage.setGroup('ios_all_apps', JSON.stringify(apps));
    },

    addApps: async (form: Record<string, any>) => {
      try {
        let res: HttpRes = await http.post('/osapp/add', form);
        if (res.statusCode == 200) {
        }
      } catch (error) {
        console.log(error);
      }
    },

    // 添加iOS应用
    addIosApps: async (apps: Record<string, any>[]) => {
      try {
        if (get().ios_all_apps.length === 0) {
          await (get() as any).getIosApps();
        }
        let final_apps = apps.filter(
          r => !(get() as any).ios_stableids().includes(r.stableId),
        );
        (get() as any).setIosSelectedApps(apps);
        if (final_apps.length === 0) return;
        let res: HttpRes = await http.post('/iosapp/add', final_apps);
        if (res.statusCode === 200) {
          (get() as any).setIosAllApps([...get().ios_all_apps, ...res.data]);
        } else {
          Toast(res.message);
        }
        console.log('添加结果：', res);
      } catch (error) {
        console.log(error);
      }
    },

    // 获取iOS应用
    getIosApps: async () => {
      try {
        let res: HttpRes = await http.get('/iosapp/list');
        if (res.statusCode === 200) {
          (get() as any).setIosAllApps(res.data);
        }
        // console.log('获取iOS应用：', res.data);
      } catch (error) {
        console.log(error);
      }
    },

    getCurapp: async () => {
      try {
        let res: HttpRes = await http.get('/osapp/info');
        if (res.statusCode === 200) {
          if (res.data) {
            let { focus_apps, shield_apps } = res.data;
            (get() as any).setFocusApps(
              focus_apps.map((r: string) => r.split(':')[0]),
            );
            (get() as any).setShieldApps(
              shield_apps.map((r: string) => r.split(':')[0]),
            );
          } else {
            console.log('暂无app数据');
            (get() as any).addApps({ focus_apps: [], shield_apps: [] });
          }
        }
      } catch (error) {
        console.log(error);
      }
    },

    updateApps: async (
      body: Record<string, any>,
      fun?: (data?: HttpRes) => void,
    ) => {
      try {
        let form = { ...body };
        if (form.focus_apps) {
          form.focus_apps = (get() as any).getAppInfo(form.focus_apps);
        } else {
          form.shield_apps = (get() as any).getAppInfo(form.shield_apps);
        }
        let res: HttpRes = await http.post('/osapp/update/', form);
        if (res.statusCode === 200) {
          if (body.focus_apps) {
            (get() as any).setFocusApps(body.focus_apps);
          }
          if (body.shield_apps) {
            (get() as any).setShieldApps(body.shield_apps);
          }
          if (fun) fun(res);
        }
      } catch (error) {
        console.log(error);
      }
    },

    getAppInfo: (apps: string[]) =>
      HomeStore()
        .all_apps.filter(r => apps.includes(r.packageName))
        .map(app => `${app.packageName}:${app.appName}`),
  }),
);

const store = create(AppStore);

export default store;
