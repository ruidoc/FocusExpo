import { Toast } from '@/components/ui';
import {
  getPostHogClient,
  identifyUser,
  syncNativeTrackingContext,
  storage,
  trackLogin,
  trackLogout,
  trackRegister,
} from '@/utils';
import http from '@/utils/request';
import * as Device from 'expo-device';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
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
          syncNativeTrackingContext(userInfo.id);
          console.log('[UserStore] 恢复已登录用户:', userInfo.id);
          return true;
        } else {
          // 匿名用户：仅 PostHog 识别
          const posthog = getPostHogClient();
          posthog?.identify(deviceId, {
            user_id: deviceId,
            device_id: deviceId,
            is_anonymous: true,
          });
          syncNativeTrackingContext(deviceId);
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
      } catch {
        return false;
      }
    },

    loginByCode: async (
      form: { phone: string; code: string },
      fun?: (data?: HttpRes) => void,
      trackingProps?: Record<string, any>,
    ) => {
      try {
        const res: any = await http.post('/user/login-by-code', form);
        if (res?.statusCode === 200) {
          const loginRes = { token: res.data?.token };
          (get() as any).loginSuccess(loginRes, 'phone', trackingProps);
          fun?.(res);
        } else {
          Toast(res?.message || '登录失败');
          fun?.();
        }
      } catch {
        fun?.();
      }
    },

    bindByCode: async (
      form: Record<string, string>,
      wxInfo: any,
      fun?: (data?: HttpRes) => void,
      trackingProps?: Record<string, any>,
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
          (get() as any).loginSuccess(loginRes, 'wechat', trackingProps);
          fun?.(res);
        } else {
          Toast(res?.message || '绑定失败');
          fun?.();
        }
      } catch {
        fun?.();
      }
    },

    /** 登录用户绑定手机号（验证码），需已登录 */
    bindPhoneByCode: async (
      form: Record<string, string>,
      fun?: (data?: HttpRes) => void,
    ) => {
      try {
        const res: any = await http.post('/user/bind-phone-by-code', form);
        if (res?.statusCode === 200) {
          await (get() as any).getInfo();
          Toast('绑定成功');
        } else {
          Toast(res?.message || '绑定失败');
        }
        fun?.(res);
      } catch {
        Toast('绑定失败，请重试');
        fun?.();
      }
    },

    login: async (
      form: Record<string, string>,
      fun?: (data?: HttpRes) => void,
      trackingProps?: Record<string, any>,
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
          (get() as any).loginSuccess(res, loginMethod, trackingProps);
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
      trackingProps?: Record<string, any>,
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
          const loginRes = { token: res.data.token };
          (get() as any).loginSuccess(loginRes, 'apple', trackingProps);
          fun?.(res);
        } else {
          Toast(res.message);
          fun?.();
        }
      } catch (error) {
        console.log('Apple 登录失败', error);
        Toast('登录失败，请检查网络后重试');
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

    /** 更新用户信息（用户名、性别、头像等） */
    updateUser: async (data: {
      username?: string;
      sex?: number;
      avatar?: string;
    }) => {
      try {
        const res: HttpRes = await http.post('/user/update', data);
        if (res.statusCode === 200 && res.data) {
          const newInfo = { ...(get().uInfo || {}), ...res.data } as UserInfo;
          (get() as any).setUinfo(newInfo);
          storage.set('user_info', JSON.stringify(newInfo));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    /** 上传头像：先压缩再上传 */
    uploadAvatar: async (uri: string): Promise<boolean> => {
      try {
        const compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 400 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
          },
        );
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'avatar.jpg';
        formData.append('file', {
          uri: compressed.uri,
          type: 'image/jpeg',
          name: filename,
        } as any);
        const res: any = await http.post('/extend/upload-uinfo-file', formData);
        if (res?.statusCode === 200 && res?.data?.url) {
          const ok = await (get() as any).updateUser({ avatar: res.data.url });
          if (ok) await (get() as any).getInfo();
          return !!ok;
        }
        return false;
      } catch (e) {
        console.log('头像上传失败', e);
        return false;
      }
    },

    /** 绑定微信（纯绑定，若该微信已绑定其他账户则失败） */
    wechatBind: async (code: string, fun?: (res?: HttpRes) => void) => {
      try {
        const res: any = await http.post('/user/wechat-bind-code', { code });
        if (res?.statusCode === 200) {
          await (get() as any).getInfo();
          Toast('微信绑定成功');
          fun?.(res);
        } else {
          Toast(res?.message || '绑定失败');
          fun?.(res);
        }
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          '该微信已绑定其他账户，无法绑定';
        Toast(msg);
        fun?.();
      }
    },

    deleteAccount: async (): Promise<boolean> => {
      try {
        const res: HttpRes = await http.post('/user/delete-account');
        if (res.statusCode === 200) {
          return true;
        }
        Toast(res.message || '注销失败');
        return false;
      } catch (error) {
        console.log('注销账号失败', error);
        return false;
      }
    },

    getInfo: async () => {
      try {
        let res: HttpRes = await http.get('/user/info/self');
        if (res.statusCode === 200) {
          (get() as any).setUinfo(res.data as UserInfo);
          storage.set('user_info', JSON.stringify(res.data));

          // 同步 user_id 到 App Groups (供 iOS Extension 读取)
          if (Platform.OS === 'ios' && res.data.id) {
            syncNativeTrackingContext(res.data.id);
          }

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
      trackingProps?: Record<string, any>,
    ) => {
      storage.set('access_token', res.token);
      storage.setGroup('access_token', res.token);
      syncNativeTrackingContext();

      useHomeStore.getState().loadApps();
      useAppStore.getState().getCurapp();
      usePlanStore.getState().getPlans();
      useSubscriptionStore.getState().getSubscription();
      (get() as any).getInfo();

      // PostHog埋点：记录登录事件
      trackLogin(loginMethod, trackingProps);
    },

    // 退出登录后处理
    logout: () => {
      storage.delete('user_info');
      storage.delete('access_token');
      storage.setGroup('access_token', '');
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
          user_id: deviceId,
          device_id: deviceId,
          is_anonymous: true,
        });
        syncNativeTrackingContext(deviceId);
        console.log('[UserStore] 退出登录，切换回匿名用户:', deviceId);
      }
    },
  }),
);

const store = create(UserStore);

export default store;
