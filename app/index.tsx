import { useHomeStore, usePermisStore } from '@/stores';
import { getUserActivationState } from '@/utils';
import { usePostHogClient } from '@/utils/analytics';
import { checkScreenTimePermission } from '@/utils/permission';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

const Index = () => {
  const hstore = useHomeStore();
  const pmstore = usePermisStore();
  const posthog = usePostHogClient();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAction = async () => {
      if (Platform.OS === 'ios') {
        try {
          const screenTimeStatus = await checkScreenTimePermission();
          const isApproved = screenTimeStatus === 'approved';
          hstore.setIOSScreenTimePermission(isApproved);
          await pmstore.checkNotify();
        } catch (error) {
          console.log('Index组件：iOS全局初始化失败:', error);
        }
      }

      // 等待PostHog Feature Flags加载完成
      if (posthog) {
        await posthog.reloadFeatureFlags();
      }
    };
    // 异步初始化
    setTimeout(async () => {
      await initAction();
      setIsInitialized(true);
    }, 100);
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 根据用户激活状态和PostHog实验决定路由
  const userState = getUserActivationState();

  // 检查是否命中 user_onboarding 实验
  const shouldShowOnboarding = posthog?.isFeatureEnabled('user_onboarding') || false;

  // 决定初始路由
  let initialRoute: any = '/(tabs)';

  // 如果用户是新用户且命中onboarding实验，导航到引导页
  if (userState.isNewUser && shouldShowOnboarding) {
    initialRoute = '/(guides)/step1';
    console.log('[路由] 新用户命中onboarding实验，导航到引导页');
  } else if (userState.isNewUser && !shouldShowOnboarding) {
    console.log('[路由] 新用户未命中onboarding实验，跳过引导直接进入首页');
  } else {
    console.log('[路由] 已有用户，直接进入首页');
  }

  return <Redirect href={initialRoute} />;
};

export default Index;
