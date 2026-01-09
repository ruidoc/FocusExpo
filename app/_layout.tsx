import { ActionSheet, Dialog, Flex, Toast } from '@/components/ui';
import { ScreenOptions, buttonRipple } from '@/config/navigation';
import { useCustomTheme } from '@/config/theme';
import { setupIOSFocusSync } from '@/native/ios';
import '@/styles/global.css';
import { initAppData, initPostHog, PostHogProvider } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { Provider } from '@fruits-chain/react-native-xiaoshu';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SuperwallProvider, useSuperwall } from 'expo-superwall';
import { useEffect } from 'react';
import { Pressable } from 'react-native';

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

const RootLayout = () => {
  const [loaded] = useFonts({
    SpaceMono: require('../src/assets/fonts/SpaceMono-Regular.ttf'),
  });
  const theme = useCustomTheme();

  // 初始化数据并设置 iOS 专注状态同步
  useEffect(() => {
    // 初始化PostHog埋点
    initPostHog().catch(error => {
      console.error('[PostHog] 初始化失败:', error);
    });

    // 初始化应用数据（从存储恢复计划数据，获取 iOS 应用列表）
    initAppData();

    // 设置 iOS 专注状态同步（内部处理事件监听、AppState 监听和状态同步）
    const cleanup = setupIOSFocusSync();

    return () => {
      cleanup();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const BackIcon = () => (
    <Flex className="items-center gap-4">
      <Pressable android_ripple={buttonRipple} onPress={() => router.back()}>
        <Icon name="chevron-back" size={24} color="#fff" />
      </Pressable>
    </Flex>
  );

  return (
    <PostHogProvider
      apiKey="phc_A4Pt2WQHEQLedNR9wyLMxSHrpdnOdUTCiR8LHNGT5QG"
      options={{ host: 'https://us.i.posthog.com', enableSessionReplay: true }}
      autocapture
    >
      <SuperwallProvider apiKeys={{ ios: 'pk_R4c8ydWOKVO8ddmeHygsS' }}>
        <DeepLinkHandler />
        <ThemeProvider value={theme.navigation}>
          <Provider theme={theme.xiaoshu}>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <ActionSheet.Global />
            <Dialog.Global />
            <Toast.Global />
            <Stack
              screenOptions={{
                ...ScreenOptions,
                headerLeft: ({ canGoBack }) => (canGoBack ? <BackIcon /> : null),
              }}>
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, headerTitle: '' }}
              />
              <Stack.Screen name="(guides)" options={{ headerShown: false }} />
              <Stack.Screen
                name="login/index"
                options={{
                  title: '登录',
                  headerTransparent: true,
                }}
              />
              <Stack.Screen
                name="login/wx"
                options={{ title: '', headerTransparent: true }}
              />
              <Stack.Screen
                name="login/start"
                options={{ title: '', headerTransparent: true }}
              />
              <Stack.Screen
                name="login/register"
                options={{ title: '注册', headerTransparent: true }}
              />
              <Stack.Screen name="user/edit" options={{ title: '个人信息' }} />
              <Stack.Screen name="user/vip" options={{ title: '会员中心' }} />
              <Stack.Screen
                name="user/coins"
                options={{ title: '金币中心' }}
              />
              <Stack.Screen
                name="setting/index"
                options={{ title: '设置' }}
              />
              <Stack.Screen
                name="setting/permission"
                options={{ title: '权限管理' }}
              />
              <Stack.Screen
                name="setting/feedback"
                options={{ title: '意见反馈' }}
              />
              <Stack.Screen
                name="setting/about"
                options={{ title: '关于我们' }}
              />
              <Stack.Screen
                name="quick-start/index"
                options={{
                  title: '开始专注',
                  // animation: 'fade_from_bottom',
                  // presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="plans/index"
                options={{ title: '我的专注计划' }}
              />
              <Stack.Screen name="plans/add" />
              <Stack.Screen name="apps/index" options={{ title: 'APP管理' }} />
              <Stack.Screen
                name="apps/add"
                options={{ title: '选择APP' }}
              />
              <Stack.Screen
                name="others/webview"
                options={{ title: '隐私政策' }}
              />
              <Stack.Screen
                name="challenges/index"
                options={{ title: '挑战活动' }}
              />
              <Stack.Screen
                name="challenges/detail"
                options={{ title: '挑战活动详情' }}
              />
              <Stack.Screen
                name="challenges/my-list"
                options={{ title: '我的挑战' }}
              />
              <Stack.Screen
                name="challenges/my-detail"
                options={{ title: '挑战详情' }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </Provider>
        </ThemeProvider>
      </SuperwallProvider>
    </PostHogProvider>
  );
};

export default RootLayout;
