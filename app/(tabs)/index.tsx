import BackgroundDecoration from '@/components/home/bg-decoration';
import FocusButton from '@/components/home/focus-button';
import Header from '@/components/home/header';
import ScreenTimePermissionPage from '@/components/home/screen-time';
import {
  AppStore,
  BenefitStore,
  HomeStore,
  PermisStore,
  PlanStore,
  RecordStore,
  UserStore,
} from '@/stores';
import { checkScreenTimePermission } from '@/utils/permission';
import { NoticeBar, Theme } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import {
  AppState,
  NativeModules,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { NativeClass } = NativeModules;

const App = observer(() => {
  const store = useLocalObservable(() => HomeStore);
  const ustore = useLocalObservable(() => UserStore);
  const pstore = useLocalObservable(() => PlanStore);
  const astore = useLocalObservable(() => AppStore);
  const rstore = useLocalObservable(() => RecordStore);
  const pmstore = useLocalObservable(() => PermisStore);
  const bstore = useLocalObservable(() => BenefitStore);
  const { colors, dark } = useTheme();
  const xcolor = Theme.useThemeTokens();

  const [refreshing, setRefreshing] = useState(false);

  // 如果没有屏幕时间权限，显示权限获取页面
  const shouldShowPermissionPage =
    Platform.OS === 'ios' && !store.ios_screen_time_permission;

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      rstore.getStatis(),
      bstore.getBenefit(),
      astore.getIosApps(),
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0D0D12',
    },
    scrollView: {
      flex: 1,
    },
    timeFlowContainer: {
      alignItems: 'center',
      marginTop: 60,
      marginBottom: 30,
    },
    playButtonContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    appsContainer: {
      marginTop: 30,
      marginBottom: 20,
      backgroundColor: 'transparent',
    },
    appsHeader: {
      flexDirection: 'row',
      marginBottom: 12,
      gap: 12,
    },
    modeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#303044',
      borderRadius: 15,
      paddingHorizontal: 12,
      paddingVertical: 4,
      gap: 4,
    },
    modeText: {
      fontSize: 13,
      color: '#858699',
      fontWeight: '500',
    },
    timeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#303044',
      borderRadius: 15,
      paddingHorizontal: 12,
      paddingVertical: 4,
      gap: 4,
    },
    timeText: {
      fontSize: 13,
      color: '#858699',
      fontWeight: '500',
    },
    appsDescription: {
      fontSize: 16,
      color: '#858699',
      textAlign: 'center',
      marginBottom: 16,
    },
    appsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
    },
    appIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    appIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 8,
      overflow: 'hidden',
    },

    bottomStatsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    notificationContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    // 保留一些原有的样式以防出错
    titleFont: {
      fontSize: 16,
      color: colors.text,
    },
    tagFont: {
      fontSize: 13,
      color: xcolor.gray_7,
    },
    descFont: {
      fontSize: 16,
      color: xcolor.gray_8,
    },
    lightFont: {
      fontWeight: '600',
    },
  });

  const initapp = () => {
    pmstore.checkNotify();
    if (!ustore.uInfo) return;
    if (!pstore.all_plans[0]) return;
  };

  useEffect(() => {
    // 当用户状态恢复后，执行初始化
    if (ustore.uInfo) {
      initapp();
    }
  }, [ustore.uInfo]);

  // 应用回到前台时，立刻检查 iOS 屏幕时间权限
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        try {
          const status = await checkScreenTimePermission();
          const isApproved = status === 'approved';
          if (isApproved !== store.ios_screen_time_permission) {
            store.setIOSScreenTimePermission(isApproved);
          }
        } catch (error) {
          console.log('前台检查屏幕时间权限失败:', error);
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (store.app_state === 'active') {
      pmstore.checkBattery();
      pmstore.checkNotify();
    }
  }, [store.app_state]);

  if (shouldShowPermissionPage) {
    return <ScreenTimePermissionPage colors={colors} xcolor={xcolor} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 背景装饰 */}
      <BackgroundDecoration />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* 顶部Header */}
        <Header />

        {/* 中央时间流动组件 */}
        <View style={styles.timeFlowContainer}>
          <FocusButton />
        </View>
      </ScrollView>
      {/* 通知权限提醒 */}
      {!pmstore.pm_notify && (
        <View style={styles.notificationContainer}>
          <NoticeBar
            message="请打开通知权限"
            mode="link"
            status="primary"
            onPress={() => pmstore.openNotify(true)}
          />
        </View>
      )}
    </SafeAreaView>
  );
});

export default App;
