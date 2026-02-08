import * as Linking from 'expo-linking';
import { SuperwallProvider, useSuperwall } from 'expo-superwall';
import { useEffect } from 'react';

const SUPERWALL_API_KEY = 'pk_R4c8ydWOKVO8ddmeHygsS';

// Deep link 处理组件
const DeepLinkHandler = (): null => {
  const superwall = useSuperwall();

  useEffect(() => {
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('Initial deep link:', initialUrl);
      }
    };

    handleInitialURL();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
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
