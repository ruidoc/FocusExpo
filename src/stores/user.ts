import { Toast } from '@/components/ui';
import { storage } from '@/utils';
import http from '@/utils/request';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import {
  useAppStore,
  useBenefitStore,
  useHomeStore,
  usePlanStore,
  useRecordStore,
} from '.';

const UserStore = combine(
  {
    uInfo: null as UserInfo | null,
    wxInfo: null as any,
  },
  (set, get) => ({
    setUinfo: (info: UserInfo | null) => {
      set({ uInfo: info });
    },
    setWxInfo: (info: any) => {
      set({ wxInfo: info });
    },

    // 初始化方法：从AsyncStorage恢复登录状态
    init: async () => {
      try {
        const token = storage.getString('access_token');
        const userInfoStr = storage.getString('user_info');

        if (token && userInfoStr) {
          // 如果有token和用户信息，尝试恢复状态
          const userInfo = JSON.parse(userInfoStr);
          (get() as any).setUinfo(userInfo);
          // 验证token是否仍然有效
          try {
            await (get() as any).getInfo();
            usePlanStore.getState().getPlans();
            useBenefitStore.getState().getBenefit();
            useRecordStore.getState().getStatis();
          } catch (error) {
            // 如果获取用户信息失败，说明token已过期，清除本地数据
            console.log('Token验证失败，重新登录', error);
            (get() as any).logout();
          }
        }
      } catch (error) {
        console.log('初始化用户状态失败:', error);
      }
    },

    login: async (
      form: Record<string, string>,
      fun?: (data?: HttpRes) => void,
    ) => {
      try {
        let res: any;
        if (form.token) {
          res = form;
        } else {
          res = await http.post('/user/login', form);
        }
        if (res.statusCode === 200) {
          (get() as any).loginSuccess(res);
          fun?.(res);
        } else {
          Toast(res.message);
          fun?.();
        }
        // console.log('结果：', res);
      } catch (error) {
        console.log(error);
        fun?.();
      }
    },

    register: async (
      form: Record<string, string>,
      fun?: (data?: HttpRes) => void,
    ) => {
      try {
        let res: HttpRes = await http.post('/user/register', form);
        if (res.statusCode === 200) {
          let { phone, password } = form;
          (get() as any).login({ phone, password }, fun);
        } else {
          Toast(res.message);
          fun?.();
        }
        console.log('注册结果：', res);
      } catch (error) {
        console.log(error);
        fun?.();
      }
    },

    getInfo: async () => {
      try {
        let res: HttpRes = await http.get('/user/info/self');
        if (res.statusCode === 200) {
          (get() as any).setUinfo(res.data as UserInfo);
          storage.set('user_info', JSON.stringify(res.data));
        }
      } catch (error) {
        console.log(error);
      }
    },

    // 登录成功后处理
    loginSuccess: (res: any) => {
      storage.set('access_token', res.token);
      storage.setGroup('access_token', res.token);
      useHomeStore.getState().loadApps();
      useAppStore.getState().getCurapp();
      usePlanStore.getState().getPlans();
      (get() as any).getInfo();
    },

    // 退出登录后处理
    logout: () => {
      storage.delete('user_info');
      storage.delete('access_token');
      useAppStore.getState().setFocusApps([]);
      useAppStore.getState().setShieldApps([]);
      usePlanStore.getState().clearPlans();
      useHomeStore.getState().stopVpn();
      (get() as any).setUinfo(null);
    },
  }),
);

const store = create(UserStore);
// 初始化 store
store.getState().init();

export default store;
