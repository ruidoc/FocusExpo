import { Toast } from '@/components/ui';
import {
  identifyUser,
  storage,
  trackLogin,
  trackLogout,
  trackRegister,
} from '@/utils';
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
        const loginMethod = form.token ? 'wechat' : 'phone';
        if (form.token) {
          res = form;
        } else {
          res = await http.post('/user/login', form);
        }
        if (res.statusCode === 200) {
          (get() as any).loginSuccess(res, loginMethod);
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

    // Apple 登录
    appleLogin: async (
      credential: {
        identityToken: string;
        user?: {
          email?: string;
          name?: {
            firstName?: string;
            lastName?: string;
          };
        };
      },
      fun?: (data?: HttpRes) => void,
    ) => {
      try {
        const body: any = {
          identityToken: credential.identityToken,
        };

        // 仅在首次授权时提供用户信息
        if (credential.user) {
          body.user = credential.user;
        }

        const res = (await http.post('/user/apple-login', body)) as HttpRes;
        if (res.statusCode === 200) {
          // 处理登录成功
          const loginRes = {
            token: res.data.token,
            data: res.data.user,
          };
          (get() as any).loginSuccess(loginRes, 'apple');
          fun?.(res);
        } else {
          Toast(res.message);
          fun?.();
        }
      } catch (error) {
        console.log('Apple 登录失败', error);
        fun?.();
      }
    },

    // Apple 账号绑定
    appleBind: async (
      credential: { identityToken: string },
      merge: boolean = false,
      fun?: (data?: HttpRes) => void,
    ) => {
      try {
        const res = (await http.post('/user/apple-bind', {
          identityToken: credential.identityToken,
          merge,
        })) as HttpRes;
        if (res.statusCode === 200) {
          // 如果账户合并，需要更新 token
          if (res.data.merged && res.data.token) {
            storage.set('access_token', res.data.token);
            storage.setGroup('access_token', res.data.token);
            // 重新获取用户信息
            await (get() as any).getInfo();
          }
          Toast(res.data.message || '绑定成功');
          fun?.(res);
        } else {
          Toast(res.message);
          fun?.();
        }
      } catch (error: any) {
        console.log('Apple 绑定失败', error);
        // 如果是账户合并相关的错误，可能需要用户确认
        if (error.response?.data?.message) {
          Toast(error.response.data.message);
        } else {
          Toast('绑定失败，请重试');
        }
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
          // 记录注册事件
          trackRegister('phone');
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
    loginSuccess: (
      res: any,
      loginMethod: 'phone' | 'wechat' | 'apple' = 'phone',
    ) => {
      storage.set('access_token', res.token);
      storage.setGroup('access_token', res.token);
      useHomeStore.getState().loadApps();
      useAppStore.getState().getCurapp();
      usePlanStore.getState().getPlans();
      (get() as any).getInfo();

      // PostHog埋点：记录登录事件
      trackLogin(loginMethod);

      // 如果有用户ID，识别用户
      if (res.data?.id) {
        identifyUser(res.data.id, {
          username: res.data.username,
          phone: res.data.phone,
        });
      }
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

      // PostHog埋点：记录登出事件
      trackLogout();
    },
  }),
);

const store = create(UserStore);

export default store;
