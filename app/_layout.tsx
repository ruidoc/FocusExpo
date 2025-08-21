import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import PlanStore from '@/stores/plan';
import { buttonRipple, ScreenOptions } from '@/utils/config';
import { getIOSFocusStatus } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { Provider, Space, Theme } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Pressable,
} from 'react-native';

const { NativeModule } = NativeModules;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  let isDark = colorScheme === 'dark';

  const asyncData = async () => {
    const [once_plans] = await Promise.all([
      AsyncStorage.getItem('once_plans'),
    ]);
    if (once_plans) {
      PlanStore.setOncePlans(JSON.parse(once_plans));
    }
  };
  // 提前在组件第一层定义副作用，避免条件调用 Hook 的告警
  useEffect(() => {
    const isIOS = Platform.OS === 'ios';
    const nativeListener = new NativeEventEmitter(NativeModule);

    const focusProgress = nativeListener.addListener(
      'focus-progress',
      (payload: { totalMinutes: number; elapsedMinutes: number }) => {
        console.log('【监听进度变化】', payload);
        const used = payload?.elapsedMinutes || 0;
        PlanStore.setCurPlanMinute(used);
      },
    );
    const focusState = nativeListener.addListener(
      'focus-state',
      (payload: {
        state: 'started' | 'ended' | 'paused' | 'resumed';
        type?: 'once' | 'periodic';
      }) => {
        console.log('【监听状态变化】', payload);
        if (payload?.state === 'paused') {
          PlanStore.setCurrentPlanPause(true);
        } else if (payload?.state === 'resumed') {
          PlanStore.setCurrentPlanPause(false);
        } else if (payload?.state === 'ended') {
          PlanStore.setCurrentPlanPause(false);
          PlanStore.setCurPlanMinute(0);
          PlanStore.resetPlan();
        }
      },
    );
    asyncData();
    const syncIOSStatus = async () => {
      if (!isIOS) return;
      try {
        const s = await getIOSFocusStatus();
        console.log('【同步iOS状态】', s);
        if (s.active) {
          PlanStore.setCurPlanMinute(s.elapsedMinutes || 0);
          if (PlanStore.cur_plan?.id === s.plan_id) {
            PlanStore.setCurrentPlanPause(s.paused);
          }
        } else {
          PlanStore.setCurPlanMinute(0);
          PlanStore.resetPlan();
        }
      } catch {}
    };
    // 首次同步（仅 iOS 执行）
    if (isIOS) {
      syncIOSStatus();
    }
    const appState = AppState.addEventListener('change', state => {
      if (isIOS && state === 'active') {
        syncIOSStatus();
      }
    });
    return () => {
      focusProgress?.remove?.();
      focusState?.remove?.();
      appState?.remove?.();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  let UITheme: any = {
    ...(isDark ? Theme.dark : Theme),
    brand_6: '#0065FE',
    button_l_font_size: 17,
    button_active_opacity: 0.8,
    button_l_height: 48,
    button_border_radius: 9,
  };
  if (isDark) {
    UITheme.card_background_color = '#121212';
    UITheme.action_sheet_cancel_padding_color = '#222';
    UITheme.divider_color_light = '#232323';
    UITheme.steps_background_color = 'transparent';
    UITheme.notice_bar_background_color_lightness = 10;
  }

  const BackIcon = () => (
    <Space direction="horizontal" align="center" gap={16}>
      <Pressable android_ripple={buttonRipple} onPress={() => router.back()}>
        <Icon name="chevron-back" size={24} color="#fff" />
      </Pressable>
    </Space>
  );

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Provider theme={UITheme}>
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
          <Stack.Screen name="user/coins" options={{ title: '金币中心' }} />
          <Stack.Screen name="setting/index" options={{ title: '设置' }} />
          <Stack.Screen
            name="setting/permission"
            options={{ title: '权限管理' }}
          />
          <Stack.Screen
            name="setting/feedback"
            options={{ title: '意见反馈' }}
          />
          <Stack.Screen name="setting/about" options={{ title: '关于我们' }} />
          <Stack.Screen
            name="quick-start/index"
            options={{
              title: '快速开始',
              // animation: 'fade_from_bottom',
              presentation: 'modal',
            }}
          />
          <Stack.Screen name="plans/index" options={{ title: '任务面板' }} />
          <Stack.Screen name="plans/add" options={{ title: '添加任务' }} />
          <Stack.Screen name="apps/index" options={{ title: 'APP管理' }} />
          <Stack.Screen name="apps/add" options={{ title: '选择APP' }} />
          <Stack.Screen name="others/webview" options={{ title: '隐私政策' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </Provider>
    </ThemeProvider>
  );
}
