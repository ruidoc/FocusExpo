import { identifyUser, storage } from '@/utils';
import * as Linking from 'expo-linking';
import { SuperwallProvider, useSuperwall } from 'expo-superwall';
import { useEffect } from 'react';

const SUPERWALL_API_KEY = 'pk_R4c8ydWOKVO8ddmeHygsS';

// Deep link 处理组件
const DeepLinkHandler = (): null => {
  const superwall = useSuperwall();

  useEffect(() => {
    // 处理应用启动时的 deep link
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        try {
          // Superwall SDK 会自动处理 deep links
          // 这里我们只需要确保 URL 被传递
          console.log('Initial deep link:', initialUrl);
        } catch (error) {
          console.error('Error handling initial deep link:', error);
        }
      }
    };

    handleInitialURL();

    // 监听 deep link 事件
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
      // Superwall SDK 会自动处理 deep links
    });

    return () => {
      subscription.remove();
    };
  }, [superwall]);

  return null;
};

export const SuperwallProviderWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const onError = (error: Error) => {
    console.error('【Superwall Error】:', error);
  };

  /**
   * SDK 配置完成回调
   * 兜底逻辑：确保用户在 SDK 初始化后被正确识别
   */
  const onConfigured = async () => {
    console.log('[Superwall] SDK 配置完成');

    // 兜底：如果用户已登录，重新 identify
    try {
      const userInfoStr = storage.getString('user_info');
      const deviceId = storage.getString('device_id');

      if (userInfoStr) {
        // 已登录用户：使用真实 userId
        const userInfo = JSON.parse(userInfoStr);
        await identifyUser(userInfo.id, {
          username: userInfo.username,
          phone: userInfo.phone,
          device_id: deviceId,
        });
        console.log('[Superwall] 兜底识别已登录用户:', userInfo.id);
      } else if (deviceId) {
        // 未登录用户：使用 deviceId
        await identifyUser(deviceId, {
          device_id: deviceId,
          is_anonymous: true,
        });
        console.log('[Superwall] 兜底识别匿名用户:', deviceId);
      }
    } catch (error) {
      console.error('[Superwall] 兜底识别失败:', error);
    }
  };

  return (
    <SuperwallProvider
      apiKeys={{ ios: SUPERWALL_API_KEY }}
      onConfigured={onConfigured}
      onConfigurationError={onError}>
      <DeepLinkHandler />
      {children}
    </SuperwallProvider>
  );
};
