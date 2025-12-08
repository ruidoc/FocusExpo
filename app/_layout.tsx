import { ActionSheet, Dialog, Flex, Toast } from '@/components/ui';
import { ScreenOptions, buttonRipple } from '@/config/navigation';
import { useCustomTheme } from '@/config/theme';
import { useAppStore, usePlanStore, useRecordStore } from '@/stores';
import '@/styles/global.css';
import { storage } from '@/utils';
import { getIOSFocusStatus } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { Provider } from '@fruits-chain/react-native-xiaoshu';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Pressable,
} from 'react-native';

const { NativeModule } = NativeModules;

const RootLayout = () => {
  const astore = useAppStore();
  const pstore = usePlanStore();
  const rstore = useRecordStore();
  const [loaded] = useFonts({
    SpaceMono: require('../src/assets/fonts/SpaceMono-Regular.ttf'),
  });
  const theme = useCustomTheme();
  const delay = useRef(null);

  const asyncData = async () => {
    astore.getIosApps();
    const once_plans = storage.getString('once_plans');
    const cus_plans = storage.getString('cus_plans');
    const exit_plan_ids = storage.getString('exit_plan_ids');
    const paused_plan_id = storage.getString('paused_plan_id');
    if (once_plans) {
      pstore.setOncePlans(JSON.parse(once_plans));
    }
    if (cus_plans) {
      pstore.setCusPlans(JSON.parse(cus_plans));
    }
    if (exit_plan_ids) {
      pstore.setExitPlanIds(exit_plan_ids.split(','));
    }
    if (paused_plan_id) {
      pstore.setPaused(paused_plan_id);
    }
  };

  // 延时器+计时器更新时间（整分对齐，链式 setTimeout 防漂移）
  const updateElapsedMinute = async (elapsedMinutes: number) => {
    if (delay.current) {
      clearTimeout(delay.current as any);
      delay.current = null as any;
    }
    let record_id = rstore.record_id;
    console.log('当前屏蔽时长：', elapsedMinutes);
    const schedule = () => {
      // 用获取分钟的方法，计算到下一个整分的秒数
      const now = new Date();
      const remain = 60 - now.getSeconds();
      // console.log('【剩余时间】', remain);
      if (elapsedMinutes > 0) {
        rstore.updateActualMins(record_id, elapsedMinutes);
      }
      delay.current = setTimeout(() => {
        elapsedMinutes += 1;
        pstore.setCurPlanMinute(elapsedMinutes);
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
        state: 'started' | 'ended' | 'paused' | 'resumed' | 'failed';
        type?: 'once' | 'periodic';
        reason?: string;
      }) => {
        console.log('【监听状态变化】', payload);
        if (payload?.state === 'started') {
          pstore.setCurPlanMinute(0);
          pstore.resetPlan();
        } else if (payload?.state === 'paused') {
          // 暂停时停止定时器
          stopFocusTimer();
          pstore.pauseCurPlan(true);
        } else if (payload?.state === 'resumed') {
          // 恢复时重启定时器
          stopFocusTimer(); // 先停止旧定时器
          pstore.pauseCurPlan(false);
          // 重新同步状态并启动定时器
          syncIOSStatus();
        } else if (payload?.state === 'failed') {
          stopFocusTimer();
          // 清理本地的一次性任务
          if (pstore.active_plan?.repeat === 'once') {
            pstore.rmOncePlan(pstore.active_plan.id);
          } else {
            pstore.addExitPlanIds(pstore.active_plan.id);
          }
          pstore.exitPlan();
          if (payload.reason === 'user_exit') {
            console.log('【手动停止任务】');
          }
        } else if (payload?.state === 'ended') {
          stopFocusTimer();
          // 正常完成
          pstore.complatePlan();
        }
      },
    );
    const appState = AppState.addEventListener('change', state => {
      if (isIOS && state === 'active') {
        syncIOSStatus();
      }
    });
    asyncData();
    const syncIOSStatus = async () => {
      if (!isIOS) return;
      try {
        const s = await getIOSFocusStatus();
        console.log('【当前屏蔽状态】', s);

        if (s.active) {
          // 同步 record_id（优先使用 iOS 的）
          if (s.record_id !== rstore.record_id) {
            rstore.setRecordId(s.record_id);
          }
          pstore.setCurPlanMinute(s.elapsedMinutes || 0);
          updateElapsedMinute(s.elapsedMinutes || 0);
          if (!pstore.active_plan) {
            pstore.resetPlan();
          }
          if (pstore.active_plan?.id === s.plan_id) {
            pstore.pauseCurPlan(s.paused);
          }
        } else if (pstore.active_plan) {
          console.log('【专注同步错误】');
        } else {
          // 专注已结束，停止定时器
          stopFocusTimer();
          rstore.removeRecordId();
          pstore.setCurPlanMinute(0);
          pstore.resetPlan();
        }
      } catch (error) {
        console.error('【同步iOS状态失败】', error);
      }
    };
    // 首次同步（仅 iOS 执行）
    if (isIOS) {
      syncIOSStatus();
    }

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
    <Flex className="items-center gap-4">
      <Pressable android_ripple={buttonRipple} onPress={() => router.back()}>
        <Icon name="chevron-back" size={24} color="#fff" />
      </Pressable>
    </Flex>
  );

  return (
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
      </Provider>
    </ThemeProvider>
  );
};

export default RootLayout;
