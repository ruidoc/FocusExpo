import { Apple, Privicy } from '@/components/business';
import { Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useHomeStore, usePlanStore, useUserStore } from '@/stores';
import {
  clearOnboardingRecoveryState,
  markOnboardingCompleted,
  trackLoginFailed,
  trackLoginStarted,
  trackOnboardingCompleted,
} from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

interface ValueGuideProps {
  problem: 'video' | 'game' | 'study' | 'other' | null;
  onComplete: () => void;
}

const ValueGuide = ({ problem, onComplete }: ValueGuideProps) => {
  const store = useHomeStore();
  const ustore = useUserStore();
  const { colors, isDark } = useCustomTheme();
  const [agree, setAgree] = useState(false);
  const accentColor = colors.primary ?? '#2E90FA';

  useEffect(() => {
    // 停止 VPN（如果有的话）
    store.stopVpn();
  }, []);

  // 根据 problem 获取个性化场景文案
  const getPersonalizedCopy = () => {
    switch (problem) {
      case 'video':
        return {
          example1: '锁定短视频，先进入工作状态',
          example2: '锁定游戏，避免下午被带走',
          example3: '锁定干扰应用，留出睡前时间',
        };
      case 'game':
        return {
          example1: '锁定游戏，先进入学习状态',
          example2: '锁定短视频，避免下午被带走',
          example3: '锁定干扰应用，留出睡前时间',
        };
      case 'study':
        return {
          example1: '锁定短视频，先进入学习状态',
          example2: '锁定游戏，避免下午被带走',
          example3: '锁定干扰应用，留出睡前时间',
        };
      default:
        return {
          example1: '锁定干扰应用，先进入专注状态',
          example2: '锁定短视频，避免下午被带走',
          example3: '锁定干扰应用，留出睡前时间',
        };
    }
  };

  const copy = getPersonalizedCopy();

  const appleLoginResult = (credential: any) => {
    trackLoginStarted('apple', {
      entry_source: 'onboarding',
      screen_name: 'onboarding_value_guide',
    });
    ustore.appleLogin(
      credential,
      res => {
        if (res?.statusCode === 200) {
          completeWithLogin();
        } else {
          trackLoginFailed('apple', {
            entry_source: 'onboarding',
            screen_name: 'onboarding_value_guide',
            error_message: res?.message || 'api_error',
          });
          Toast('登录失败，请重试');
        }
      },
      {
        entry_source: 'onboarding',
        screen_name: 'onboarding_value_guide',
      },
    );
  };

  const completeWithLogin = async () => {
    clearOnboardingRecoveryState();
    markOnboardingCompleted();
    trackOnboardingCompleted({
      with_login: true,
      entry_source: 'onboarding',
      screen_name: 'onboarding_value_guide',
    });

    // 检查用户是否已有契约，有则跳过 target 直接去首页
    try {
      await usePlanStore.getState().getPlans();
    } catch {}
    const hasPlans = usePlanStore.getState().cus_plans.length > 0;

    if (hasPlans) {
      router.replace('/(tabs)');
    } else {
      router.replace({
        pathname: '/plans/target',
        params: {
          from: 'onboarding',
          problem: problem || 'other',
        },
      });
    }
    onComplete();
  };

  const scheduleItems = [
    { time: '9:00', label: copy.example1 },
    { time: '14:00', label: copy.example2 },
    { time: '21:00', label: copy.example3 },
  ];

  return (
    <View className="flex-1">
      <View className="flex-1 px-6">
        {/* 顶部成功提示 */}
        <View className="items-center mb-10 pt-2 gap-2">
          <Text
            className="text-[26px] font-bold text-center tracking-tight"
            style={{ color: colors.text }}>
            刚才这次有效
          </Text>
          <Text
            className="text-2xl font-bold text-center tracking-tight"
            style={{ color: colors.text }}>
            接下来让它自动发生
          </Text>
        </View>

        {/* 问题 → 解决方案 */}
        <View className="mb-5">
          <Text
            className="text-base mb-1 leading-6"
            style={{ color: colors.text2 }}>
            临时锁定能挡住一次分心，但每天手动开启，很容易忘
          </Text>
          <Text className="text-base leading-7" style={{ color: colors.text2 }}>
            更好的方式：
            <Text className="font-semibold" style={{ color: '#15b79e' }}>
              设置固定时间，到点自动锁定
            </Text>
          </Text>
        </View>

        {/* 定时契约卡片 */}
        <View
          className="rounded-3xl p-5 mb-5"
          style={{
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.04)',
          }}>
          <View className="flex-row items-center mb-4 gap-2">
            <Icon name="alarm-outline" size={22} color={accentColor} />
            <Text
              className="text-lg font-semibold"
              style={{ color: colors.text }}>
              每日专注契约
            </Text>
          </View>

          <View className="gap-y-3">
            {scheduleItems.map((item, index) => (
              <View key={index} className="flex-row items-center">
                <Text
                  className="text-base font-medium w-14 pl-2"
                  style={{ color: colors.text2 }}>
                  {item.time}
                </Text>
                <Icon
                  name="chevron-forward"
                  size={16}
                  color={
                    isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'
                  }
                  style={{ marginRight: 12 }}
                />
                <Text
                  className="text-base flex-1"
                  style={{ color: colors.text }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-sm text-center" style={{ color: colors.text3 }}>
          创建后，到点自动执行，无需每次手动开启
        </Text>

        {/* 功能亮点 */}
        {/* <View className="flex-row gap-4 mb-6">
          {features.map((item, index) => (
            <View
              key={index}
              className="flex-1 items-center py-4 rounded-2xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mb-2"
                style={{ backgroundColor: accentColor + '20' }}>
                <Icon name={item.icon} size={22} color={accentColor} />
              </View>
              <Text className="text-xs font-medium text-white/70">
                {item.label}
              </Text>
            </View>
          ))}
        </View> */}
      </View>

      {/* 底部操作区 */}
      <View className="flex px-10 pb-2">
        <Apple
          type="custom"
          disabled={!agree}
          onDisabledPress={doLogin => {
            Alert.alert('隐私协议', '已阅读并同意隐私协议和用户协议', [
              { text: '取消', style: 'cancel' },
              {
                text: '同意',
                onPress: () => {
                  setAgree(true);
                  doLogin();
                },
              },
            ]);
          }}
          onSuccess={appleLoginResult}
          label="登录并创建我的契约"
        />
        <View className="flex-row items-center justify-center">
          <Privicy agree={agree} onChange={setAgree} />
        </View>
      </View>
    </View>
  );
};

export default ValueGuide;
