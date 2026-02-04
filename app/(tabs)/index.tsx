import { Page } from '@/components/business';
import ActivePlan from '@/components/home/active-plan';
import EmptyPlan from '@/components/home/empty-plan';
import FirstTimeGuidePlan from '@/components/home/first-time-guide-plan';
import HomeHeader from '@/components/home/header';
import ScreenTimePermissionPage from '@/components/home/screen-time';
import TrialUserGuidePlan from '@/components/home/trial-user-guide-plan';
import CelebrationModal from '@/components/modals/celebration-modal';
import { NoticeBar } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import {
  useAppStore,
  useBenefitStore,
  useHomeStore,
  usePermisStore,
  usePlanStore,
  useRecordStore,
  useUserStore,
} from '@/stores';
import { getUserActivationState, shouldShowCelebration } from '@/utils';
import { checkScreenTimePermission } from '@/utils/permission';
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
  const { colors } = useCustomTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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

      // 每次app回到前台时检查是否应该显示庆祝弹窗
      if (shouldShowCelebration()) {
        setTimeout(() => {
          setShowCelebration(true);
        }, 500);
      }
    }
  }, [store.app_state]);

  // 组件挂载时也检查一次
  useEffect(() => {
    if (shouldShowCelebration()) {
      setTimeout(() => {
        setShowCelebration(true);
      }, 500);
    }
  }, []);

  if (shouldShowPermissionPage) {
    return <ScreenTimePermissionPage colors={colors} />;
  }

  // 获取用户激活状态
  const userState = getUserActivationState();

  // 根据用户状态决定渲染哪个组件
  const renderMainContent = () => {
    // 首次用户（完成onboarding但0次专注）
    if (userState.isFirstTimeUser) {
      return <FirstTimeGuidePlan />;
    }

    // 体验用户（1-2次专注，无计划）
    if (userState.isTrialUser) {
      return <TrialUserGuidePlan />;
    }

    // 活跃用户或已有计划的用户
    return pstore.active_plan ? <ActivePlan /> : <EmptyPlan />;
  };

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
          {renderMainContent()}
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

      {/* 首次完成庆祝弹窗 */}
      <CelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        focusDuration={15}
        coinsEarned={20}
      />
    </Page>
  );
};

export default App;
