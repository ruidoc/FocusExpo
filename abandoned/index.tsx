import { Provider, Theme } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
// import * as RNBBootSplash from 'react-native-bootsplash';
import {
  AppStore,
  GuideStore,
  HomeStore,
  PermisStore,
  PlanStore,
  RecordStore,
  UserStore,
} from '@/stores';
import { observer, useLocalObservable } from 'mobx-react';
// import * as Sentry from '@sentry/react-native';
import { toast } from '@/utils';
import { getIOSFocusStatus, getSelectIosApps } from '@/utils/permission';

const { NativeClass } = NativeModules;

const App = observer(() => {
  const store = useLocalObservable(() => HomeStore);
  const pstore = useLocalObservable(() => PlanStore);
  const ustore = useLocalObservable(() => UserStore);
  const astore = useLocalObservable(() => AppStore);
  const rstore = useLocalObservable(() => RecordStore);
  const pmstore = useLocalObservable(() => PermisStore);
  const gstore = useLocalObservable(() => GuideStore);
  // let isDark = useColorScheme() === 'dark';
  let isDark = store.them === 'dark';
  let { colors } = isDark ? DarkTheme : DefaultTheme;
  let LightColos = {
    background: '#F7F8FA',
    card: '#FFFFFF',
    text: '#222',
    border: '#E0E3E8',
    desc: '#7B8493',
    primary: '#2563EB',
  };
  let DarkColos = {
    card: '#181818',
    // primary: 'red',
    // text: 'red',
    border: '#ffffff20',
    desc: '#666',
  };
  let CusTheme: any = {
    dark: isDark,
    colors: {
      ...colors,
      ...(isDark ? DarkColos : LightColos),
    },
  };
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
  const initapp = async () => {
    const [
      focus_apps,
      shield_apps,
      cus_plans,
      once_plans,
      uinfo,
      mythem,
      exit_times,
      privacy_readed,
    ] = await Promise.all([
      AsyncStorage.getItem('focus_apps'),
      AsyncStorage.getItem('shield_apps'),
      AsyncStorage.getItem('cus_plans'),
      AsyncStorage.getItem('once_plans'),
      AsyncStorage.getItem('user_info'),
      AsyncStorage.getItem('mythem'),
      AsyncStorage.getItem('exit_times'),
      AsyncStorage.getItem('privacy_readed'),
    ]);
    gstore.init();
    if (!uinfo) return;
    ustore.setUinfo(JSON.parse(uinfo));
    // 根据环境初始化
    if (Platform.OS === 'ios') {
      let apps = await getSelectIosApps();
      astore.setIosSelectedApps(apps);
    } else {
      store.checkVpn(true);
      setTimeout(() => {
        // RNBBootSplash.hide({ fade: true });
      }, 200);
    }
    if (focus_apps) {
      astore.setFocusApps(JSON.parse(focus_apps));
    }
    if (shield_apps) {
      astore.setShieldApps(JSON.parse(shield_apps));
    }
    if (cus_plans || once_plans) {
      pstore.setCusPlans(JSON.parse(cus_plans) || []);
      pstore.setOncePlans(JSON.parse(once_plans) || []);
      pstore.updatePlans();
    }
    if (exit_times) {
      store.setExitTimes(JSON.parse(exit_times));
    }
    if (mythem) {
      store.setThem(mythem as 'dark' | 'light');
    }
    if (privacy_readed === '1') {
      privacyReaded();
    }
    ustore.getInfo();
    // throw new Error('测试异常捕获');
  };

  // 隐私协议已读
  const privacyReaded = async () => {
    if (store.all_apps.length === 0) {
      store.loadApps();
    }
    // Sentry.init({
    //   dsn: 'https://cc6b3e31087a119340690e60212ce4fe@o4507773251223552.ingest.us.sentry.io/4507773257449472',
    //   // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    //   autoInitializeNativeSdk: true,
    // });
  };

  const execHandle = (state: VpnState) => {
    console.log('状态变化：', state);
    if (state.includes('battery')) {
      return pmstore.setPmBattery(true);
    }
    if (!['start', 'open', 'refuse', 'close'].includes(state)) {
      return false;
    }
    store.setVpnState(state);
    pstore.resetPlan();
    if (state === 'refuse') {
      toast('拒绝授权，专注功能暂无法使用');
    }
    if (state === 'open') {
      store.setVpnInit(true);
      store.startVpn();
    }
  };

  // 操作记录的逻辑
  const execRecord = async (state: VpnState) => {
    if (!ustore.uInfo) return;
    let r_id = await AsyncStorage.getItem('record_id');
    let curp = pstore.cur_plan;
    let apps = pstore.is_focus_mode ? astore.focus_apps : astore.shield_apps;
    if (state === 'start') {
      console.log('开始专注');
      rstore.addRecord(curp, astore.getAppInfo(apps));
    }
    if (state.includes('continue')) {
      console.log('继续专注，需要更新g_id');
      rstore.continueRecord(curp, astore.getAppInfo(apps));
    }
    if (state.includes('task_update')) {
      let [, pid, minute] = state.split(',');
      console.log('10s定时更新：', pid, minute);
      // 更新当前任务时长
      pstore.setCurPlanMinute(Number(minute));
      // 更新今日任务总时长
      if (Number(minute) > 0) {
        rstore.setTotalReal(1);
      }
    }
    if (state.includes('complete')) {
      // 专注完成处理（可能有中途退出、或半路进入）
      let [, minutes] = state.split(',');
      console.log('专注完成：', minutes);
      pstore.setCurPlanMinute(0);
      if (r_id) {
        rstore.completeRecord(r_id, minutes);
        AsyncStorage.removeItem('record_id');
      }
    }
    if (state.includes('focus_total')) {
      let total = JSON.parse(state.slice(12) || '[]');
      let total_min = total.reduce((acc: number, cur: any) => {
        acc += Number(cur.split(':')[1]);
        return acc;
      }, 0);
      // console.log('专注计划总数据：', total, total_min);
      // 重置今日专注总时长
      rstore.setTotalReal(total_min, true);
    }
    if (state.includes('exit_time')) {
      // 获取退出时间(秒)
      let [, exit_sec, plan_id] = state.split(',');
      // 设置退出次数
      rstore.setExitCount();
      // 记录退出时长
      rstore.exitRecord(plan_id, {
        exit_sec: Number(exit_sec),
      });
    }
  };

  useEffect(() => {
    initapp();
    let eventEmitter = new NativeEventEmitter(NativeClass);
    // iOS 原生事件来自 NativeModule（RCTEventEmitter）
    const iosEmitter = new NativeEventEmitter(NativeModules.NativeModule);
    // iOS 屏蔽进度与结束事件监听（来自原生事件转发）
    const focusEnded = iosEmitter.addListener('focus-ended', async data => {
      // 同步 UI 归位
      pstore.setCurPlanMinute(0);
      pstore.resetPlan();
      store.setVpnState('close');
    });
    const focusProgress = iosEmitter.addListener(
      'focus-progress',
      (payload: { totalMinutes: number; elapsedMinutes: number }) => {
        // 每分钟来自 iOS 的进度
        const used = payload.elapsedMinutes || 0;
        pstore.setCurPlanMinute(used);
      },
    );
    // iOS：初始化/回前台时同步一次当前原生状态到 PlanStore
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
            id: 'ios_active',
            start: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
            start_min: startMin,
            start_sec: startSec,
            end: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
            end_min: endMin,
            end_sec: endSec,
            repeat: 'once',
            mode: pstore.is_focus_mode ? 'focus' : 'shield',
          } as any;
          // 覆盖添加一次性计划
          pstore.rmOncePlan('ios_active');
          pstore.addOncePlan(plan);
          pstore.setCurPlanMinute(s.elapsedMinutes || 0);
          pstore.resetPlan();
        } else {
          pstore.rmOncePlan('ios_active');
          pstore.setCurPlanMinute(0);
          pstore.resetPlan();
        }
      } catch (e) {
        console.log('syncIOSStatus error', e);
      }
    };
    syncIOSStatus();
    // 监听 VPN 状态变化
    let listener = eventEmitter.addListener('vpn-change', data => {
      execHandle(data.state); // 处理 VPN 状态变化
      execRecord(data.state); // 记录专注数据
    });
    // 监听 App 前后台切换
    let appState = AppState.addEventListener('change', state => {
      store.setAppState(state);
      console.log('App 状态变化：', state);
      if (state === 'active') {
        syncIOSStatus();
      }
    });
    return () => {
      listener?.remove();
      focusEnded?.remove();
      focusProgress?.remove();
      iosEmitter.removeAllListeners('focus-ended');
      iosEmitter.removeAllListeners('focus-progress');
      appState?.remove();
    };
  }, []);

  return (
    <NavigationContainer theme={CusTheme}>
      <Provider theme={UITheme}>{/* <Routes /> */}</Provider>
    </NavigationContainer>
  );
});

// export default Sentry.wrap(App);
export default App;
