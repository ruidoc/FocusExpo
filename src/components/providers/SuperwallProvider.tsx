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

  return (
    <SuperwallProvider
      apiKeys={{ ios: SUPERWALL_API_KEY }}
      onConfigurationError={onError}>
      <DeepLinkHandler />
      {children}
    </SuperwallProvider>
  );
};
