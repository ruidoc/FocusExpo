import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { buttonRipple, ScreenOptions } from '@/config/navigation';
import { useCustomTheme } from '@/config/theme';
import { RecordStore } from '@/stores';
import PlanStore from '@/stores/plan';
import { storage } from '@/utils';
import { getIOSFocusStatus } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { Provider, Space } from '@fruits-chain/react-native-xiaoshu';
import { useEffect, useRef } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Pressable,
} from 'react-native';

const { NativeModule } = NativeModules;

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const theme = useCustomTheme();
  const delay = useRef(null);

  const asyncData = async () => {
    const once_plans = storage.getString('once_plans');
    const cus_plans = storage.getString('cus_plans');
    if (once_plans) {
      PlanStore.setOncePlans(JSON.parse(once_plans));
    }
    if (cus_plans) {
      PlanStore.setCusPlans(JSON.parse(cus_plans));
    }
  };

  // 延时器+计时器更新时间（整分对齐，链式 setTimeout 防漂移）
  const updateElapsedMinute = async (elapsedMinutes: number) => {
    if (delay.current) {
      clearTimeout(delay.current as any);
      delay.current = null as any;
    }
    let record_id = RecordStore.record_id;
    console.log('当前屏蔽时长：', elapsedMinutes);
    const schedule = () => {
      // 用获取分钟的方法，计算到下一个整分的秒数
      const now = new Date();
      const remain = 60 - now.getSeconds();
      // console.log('【剩余时间】', remain);
      if (elapsedMinutes > 0) {
        RecordStore.updateActualMins(record_id, elapsedMinutes);
      }
      delay.current = setTimeout(() => {
        elapsedMinutes += 1;
        PlanStore.setCurPlanMinute(elapsedMinutes);
        schedule();
      }, remain * 1000);
    };
    schedule();
  };

  // 停止定时器的统一方法
  const stopFocusTimer = () => {
    if (delay.current) {
      console.log('【停止定时器】');
      clearTimeout(delay.current);
      delay.current = null;
    }
  };

  // 提前在组件第一层定义副作用，避免条件调用 Hook 的告警
  useEffect(() => {
    const isIOS = Platform.OS === 'ios';
    const nativeListener = new NativeEventEmitter(NativeModule);
    const focusState = nativeListener.addListener(
      'focus-state',
      (payload: {
        state: 'started' | 'ended' | 'paused' | 'resumed';
        type?: 'once' | 'periodic';
      }) => {
        console.log('【监听状态变化】', payload);
        if (payload?.state === 'started') {
          PlanStore.setCurPlanMinute(0);
          PlanStore.resetPlan();
        } else if (payload?.state === 'paused') {
          // 暂停时停止定时器
          stopFocusTimer();
          PlanStore.setCurrentPlanPause(true);
        } else if (payload?.state === 'resumed') {
          // 恢复时重启定时器
          PlanStore.setCurrentPlanPause(false);
        } else if (payload?.state === 'ended') {
          stopFocusTimer();
          PlanStore.complatePlan();
        }
      },
    );
    asyncData();
    const syncIOSStatus = async () => {
      if (!isIOS) return;
      try {
        const s = await getIOSFocusStatus();
        console.log('【当前屏蔽状态】', s);

        if (s.active) {
          // 同步 record_id（优先使用 iOS 的）
          if (s.record_id !== RecordStore.record_id) {
            RecordStore.setRecordId(s.record_id);
          }
          PlanStore.setCurPlanMinute(s.elapsedMinutes || 0);
          updateElapsedMinute(s.elapsedMinutes || 0);
          if (!PlanStore.cur_plan) {
            PlanStore.resetPlan();
          }
          if (PlanStore.cur_plan?.id === s.plan_id) {
            PlanStore.setCurrentPlanPause(s.paused);
          }
        } else {
          // 专注已结束，停止定时器
          stopFocusTimer();
          RecordStore.removeRecordId();
          PlanStore.setCurPlanMinute(0);
          PlanStore.resetPlan();
        }
      } catch (error) {
        console.error('【同步iOS状态失败】', error);
      }
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
      focusState?.remove?.();
      appState?.remove?.();
      stopFocusTimer();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const BackIcon = () => (
    <Space direction="horizontal" align="center" gap={16}>
      <Pressable android_ripple={buttonRipple} onPress={() => router.back()}>
        <Icon name="chevron-back" size={24} color="#fff" />
      </Pressable>
    </Space>
  );

  return (
    <ThemeProvider value={theme.navigation}>
      <Provider theme={theme.xiaoshu}>
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
          <Stack.Screen name="plans/add" />
          <Stack.Screen name="apps/index" options={{ title: 'APP管理' }} />
          <Stack.Screen name="apps/add" options={{ title: '选择APP' }} />
          <Stack.Screen name="others/webview" options={{ title: '隐私政策' }} />
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
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </Provider>
    </ThemeProvider>
  );
}
