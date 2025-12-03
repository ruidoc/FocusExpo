import { Page } from '@/components/business';
import ActivePlan from '@/components/home/active-plan';
import EmptyPlan from '@/components/home/empty-plan';
import HomeHeader from '@/components/home/header';
import ScreenTimePermissionPage from '@/components/home/screen-time';
import {
  useAppStore,
  useBenefitStore,
  useHomeStore,
  usePermisStore,
  usePlanStore,
  useRecordStore,
  useUserStore,
} from '@/stores';
import { checkScreenTimePermission } from '@/utils/permission';
import { NoticeBar, Theme } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  AppState,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

const App = () => {
  const store = useHomeStore();
  const ustore = useUserStore();
  const pstore = usePlanStore();
  const astore = useAppStore();
  const rstore = useRecordStore();
  const pmstore = usePermisStore();
  const bstore = useBenefitStore();
  const { colors } = useTheme();
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

  const initapp = () => {
    pmstore.checkNotify();
    if (!ustore.uInfo) return;
    if (!pstore.cus_plans[0]) return;
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
    <Page safe decoration>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* 顶部Header */}
        <HomeHeader />

        {/* 中央时间流动组件 */}
        <View className="items-center mt-[60px] mb-[30px]">
          {pstore.active_plan ? <ActivePlan /> : <EmptyPlan />}
        </View>
      </ScrollView>
      {/* 通知权限提醒 */}
      {!pmstore.pm_notify && (
        <View className="absolute bottom-0 left-0 right-0">
          <NoticeBar
            message="请打开通知权限"
            mode="link"
            status="primary"
            onPress={() => pmstore.openNotify(true)}
          />
        </View>
      )}
    </Page>
  );
};

export default App;
