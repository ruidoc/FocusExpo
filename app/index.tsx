import { useExperimentStore, useHomeStore, usePermisStore } from '@/stores';
import { getUserActivationState } from '@/utils';
import { checkScreenTimePermission } from '@/utils/permission';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

const Index = () => {
  const hstore = useHomeStore();
  const pmstore = usePermisStore();
  const experiment = useExperimentStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAction = async () => {
      try {
        const screenTimeStatus = await checkScreenTimePermission();
        const isApproved = screenTimeStatus === 'approved';
        hstore.setIOSScreenTimePermission(isApproved);
        await pmstore.checkNotify();
      } catch (error) {
        console.log('Index组件：iOS全局初始化失败:', error);
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

  // 根据用户激活状态和实验状态决定路由
  const userState = getUserActivationState();
  console.log('userState', userState);

  // 决定初始路由
  let initialRoute: any = '/(tabs)';

  // 如果用户是新用户且命中onboarding实验，导航到引导页
  if (userState.isNewUser && experiment.isOnboarding) {
    initialRoute = '/others/welcome';
    console.log('[路由] 新用户命中onboarding实验，导航到引导页');
  } else if (userState.isNewUser && !experiment.isOnboarding) {
    console.log('[路由] 新用户未命中onboarding实验，跳过引导直接进入首页');
  } else {
    console.log('[路由] 已有用户，直接进入首页');
  }

  return <Redirect href={initialRoute} />;
};

export default Index;
