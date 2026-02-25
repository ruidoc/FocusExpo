import { Toast } from '@/components/ui';
import {
  getPostHogClient,
  identifyUser,
  storage,
  trackLogin,
  trackLogout,
  trackRegister,
} from '@/utils';
import http from '@/utils/request';
import * as Device from 'expo-device';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import {
  useAppStore,
  useBenefitStore,
  useHomeStore,
  usePlanStore,
  useRecordStore,
  useSubscriptionStore,
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

    /**
     * 初始化：恢复本地状态（轻量，不发请求）
     * - 已登录：恢复 uInfo，PostHog + Superwall 识别延迟到 getInfo() 返回后
     * - 匿名：仅 PostHog 识别（无需 Superwall）
     * 返回是否已登录
     */
    init: async (): Promise<boolean> => {
      try {
        // 获取或生成 deviceId
        let deviceId = storage.getString('device_id');
        if (!deviceId) {
          deviceId =
            Device.osBuildId ||
            Device.osInternalBuildId ||
            `device_${Date.now()}`;
          storage.set('device_id', deviceId);
          console.log('[UserStore] 生成新的 deviceId:', deviceId);
        }

        const token = storage.getString('access_token');
        const userInfoStr = storage.getString('user_info');

        if (token && userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          (get() as any).setUinfo(userInfo);
          console.log('[UserStore] 恢复已登录用户:', userInfo.id);
          return true;
        } else {
          // 匿名用户：仅 PostHog 识别
          const posthog = getPostHogClient();
          posthog?.identify(deviceId, {
            device_id: deviceId,
            is_anonymous: true,
          });
          console.log('[UserStore] 匿名用户，deviceId:', deviceId);
          return false;
        }
      } catch (error) {
        console.log('初始化用户状态失败:', error);
        return false;
      }
    },

    /**
     * 同步远程数据（验证 token + 拉取业务数据）
     * 在 init() 之后调用，仅已登录用户需要
     */
    syncRemoteData: async () => {
      try {
        await (get() as any).getInfo();
        usePlanStore.getState().getPlans();
        useBenefitStore.getState().getBenefit();
        useRecordStore.getState().getStatis();
        useSubscriptionStore.getState().getSubscription();
      } catch (error) {
        console.log('Token 验证失败，重新登录', error);
        (get() as any).logout();
      }
    },

    sendCode: async (phone: string): Promise<boolean> => {
      try {
        const res: any = await http.post('/user/send-code', { phone });
        if (res?.statusCode === 200) {
          return true;
        }
        Toast(res?.message || '发送失败');
        return false;
      } catch (error) {
        return false;
      }
    },

    loginByCode: async (
      form: { phone: string; code: string },
      fun?: (data?: HttpRes) => void,
    ) => {
      try {
        const res: any = await http.post('/user/login-by-code', form);
        if (res?.statusCode === 200) {
          const loginRes = { token: res.data?.token };
          (get() as any).loginSuccess(loginRes, 'phone');
          fun?.(res);
        } else {
          Toast(res?.message || '登录失败');
          fun?.();
        }
      } catch (error) {
        fun?.();
      }
    },

    bindByCode: async (
      form: Record<string, string>,
      wxInfo: any,
      fun?: (data?: HttpRes) => void,
    ) => {
      try {
        const body = {
          phone: form.phone,
          code: form.code,
          openid: wxInfo.openid,
          unionid: wxInfo.unionid,
          avatar: wxInfo.headimgurl,
          username: wxInfo.nickname,
          sex: wxInfo.sex,
        };
        const res: any = await http.post('/user/wechat-bind-by-code', body);
        if (res?.statusCode === 200) {
          const loginRes = { token: res.data?.token };
          (get() as any).loginSuccess(loginRes, 'wechat');
          fun?.(res);
        } else {
          Toast(res?.message || '绑定失败');
          fun?.();
        }
      } catch (error) {
        fun?.();
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

          // PostHog: 更新用户信息
          const deviceId = storage.getString('device_id') || '';
          identifyUser(res.data.id || deviceId, {
            username: res.data.username,
            phone: res.data.phone,
            device_id: deviceId,
          });
          console.log('[UserStore] 更新用户信息并识别:', res.data.id);
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
      useSubscriptionStore.getState().getSubscription();
      (get() as any).getInfo();

      // PostHog埋点：记录登录事件
      trackLogin(loginMethod);
    },

    // 退出登录后处理
    logout: () => {
      storage.delete('user_info');
      storage.delete('access_token');
      useAppStore.getState().setFocusApps([]);
      useAppStore.getState().setShieldApps([]);
      usePlanStore.getState().clearPlans();
      useHomeStore.getState().stopVpn();
      useSubscriptionStore.getState().clearSubscription();
      (get() as any).setUinfo(null);

      // PostHog埋点：记录登出事件
      trackLogout();

      // PostHog: 退出登录后，切换回匿名用户（使用deviceId）
      const deviceId = storage.getString('device_id') || '';
      if (deviceId) {
        identifyUser(deviceId, {
          device_id: deviceId,
          is_anonymous: true,
        });
        console.log('[UserStore] 退出登录，切换回匿名用户:', deviceId);
      }
    },
  }),
);

const store = create(UserStore);

export default store;
