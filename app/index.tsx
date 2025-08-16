import { HomeStore, PermisStore, PlanStore, UserStore } from '@/stores';
import {
  checkScreenTimePermission,
  getIOSFocusStatus,
  getSelectIosApps,
} from '@/utils/permission';
import * as Notifications from 'expo-notifications';
import { Redirect } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
  View,
} from 'react-native';

const { NativeModule } = NativeModules;

const Index = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const hstore = useLocalObservable(() => HomeStore);
  const pstore = useLocalObservable(() => PlanStore);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 等待UserStore初始化完成
    const checkInitialization = async () => {
      // 给一个小的延迟确保AsyncStorage操作完成
      setTimeout(async () => {
        initAction();
        setIsInitialized(true);
      }, 100);
    };
    checkInitialization();
    const cleanup = initListener();
    return () => {
      cleanup && cleanup();
    };
  }, []);

  const initAction = async () => {
    // 确保iOS全局初始化完成
    if (Platform.OS === 'ios') {
      try {
        // 获取选中的iOS应用
        const selectedApps = await getSelectIosApps();
        hstore.setSelectedAppIcons(selectedApps);
        // 检查屏幕时间权限
        const screenTimeStatus = await checkScreenTimePermission();
        const isApproved = screenTimeStatus === 'approved';
        hstore.setIOSScreenTimePermission(isApproved);
        // 检查通知权限
        await PermisStore.checkNotify();
      } catch (error) {
        console.log('Index组件：iOS全局初始化失败:', error);
      }
    }
  };

  const initListener = () => {
    let eventEmitter = new NativeEventEmitter(NativeModule);
    // iOS 屏蔽进度与结束事件监听（来自原生事件转发）
    const focusEnded = eventEmitter.addListener('focus-ended', async data => {
      // 结束通知由原生扩展也会发，为确保 UI 同步，这里补一条应用内通知与状态同步
      console.log('专注结束：', data);
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: '专注结束 ', body: '屏蔽已自动结束，做得很好！' },
          trigger: null, // 立即
        });
      } catch {}
      // 同步 UI 归位
      pstore.setCurPlanMinute(0);
      pstore.resetPlan();
    });
    const focusProgress = eventEmitter.addListener(
      'focus-progress',
      (payload: { totalMinutes: number; elapsedMinutes: number }) => {
        console.log('专注进度：', payload);
        // 每分钟来自 iOS 的进度
        const used = payload.elapsedMinutes || 0;
        pstore.setCurPlanMinute(used);
      },
    );

    // 初始化/回前台 同步 iOS 原生状态到 PlanStore
    const syncIOSStatus = async () => {
      if (Platform.OS !== 'ios') return;
      try {
        const s = await getIOSFocusStatus();
        if (s.active) {
          const start = new Date((s.startAt || 0) * 1000);
          const end = new Date((s.endAt || 0) * 1000);
          const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
          const startMin = start.getHours() * 60 + start.getMinutes();
          const startSec = startMin * 60 + start.getSeconds();
          const endMin = end.getHours() * 60 + end.getMinutes();
          const endSec = endMin * 60 + end.getSeconds();
          const plan = {
            id: `once_${Math.floor(Math.random() * 99999999)}`,
            start: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
            start_min: startMin,
            start_sec: startSec,
            end: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
            end_min: endMin,
            end_sec: endSec,
            repeat: 'once',
            mode: 'shield',
          } as any;
          pstore.addOncePlan(plan);
          pstore.setCurPlanMinute(s.elapsedMinutes || 0);
          pstore.resetPlan();
        } else {
          pstore.setCurPlanMinute(0);
          pstore.resetPlan();
        }
      } catch (e) {
        console.log('syncIOSStatus error', e);
      }
    };
    // 首次执行
    syncIOSStatus();
    // 监听 App 前后台切换
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        syncIOSStatus();
      }
    });
    return () => {
      focusEnded?.remove();
      focusProgress?.remove();
      appState?.remove();
    };
  };

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initialRoute = store.uInfo ? '/(tabs)' : '/(guides)/step1';
  // const initialRoute = '/(tabs)';

  return <Redirect href={initialRoute} />;
});

export default Index;
