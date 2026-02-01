import { Privicy, Wechat } from '@/components/business';
import { Flex } from '@/components/ui';
import { useHomeStore, useUserStore } from '@/stores';
import { markOnboardingCompleted, trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface ValueGuideProps {
  problem: 'video' | 'game' | 'study' | 'other' | null;
  onComplete: () => void;
}

const ValueGuide = ({ problem, onComplete }: ValueGuideProps) => {
  const store = useHomeStore();
  const ustore = useUserStore();
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    // 停止 VPN（如果有的话）
    store.stopVpn();
  }, []);

  // 根据 problem 获取个性化文案
  const getPersonalizedCopy = () => {
    switch (problem) {
      case 'video':
        return {
          successText: '你刚刚成功远离了短视频',
          painPoint: '我们都知道，"再刷一会儿"的念头有多难抵抗。',
          solution: '设置定时计划后，到点自动限制，你不用再跟自己较劲。',
        };
      case 'game':
        return {
          successText: '你刚刚成功控制了游戏时间',
          painPoint: '我们都知道，"打完这局就停"说起来容易做起来难。',
          solution: '设置定时计划后，到点自动限制，帮你从游戏中抽身。',
        };
      case 'study':
        return {
          successText: '你刚刚体验了无干扰的专注',
          painPoint: '学习时总想"看一眼手机"，这种冲动很正常。',
          solution: '设置学习时段计划，让系统帮你隔绝干扰，专注更轻松。',
        };
      default:
        return {
          successText: '你刚刚完成了一次专注',
          painPoint: '保持专注需要消耗意志力，时间久了难免松懈。',
          solution: '设置定时计划后，每天自动执行，无需操作，无需纠结。',
        };
    }
  };

  const copy = getPersonalizedCopy();

  const loginResult = (result: any) => {
    if (result.statusCode === 20003) {
      // 需要绑定手机号
      return toRegister(result.data);
    }
    ustore.login(result as Record<string, any>, val => {
      if (val) {
        completeWithLogin();
      }
    });
  };

  const completeWithLogin = () => {
    markOnboardingCompleted();
    trackEvent('onboarding_completed', { with_login: true, with_plan: true });
    // 登录成功后跳转到创建计划页面
    router.replace('/plans/add?from=onboarding');
    onComplete();
  };

  const handleSkip = () => {
    markOnboardingCompleted();
    trackEvent('onboarding_completed', { with_login: false, with_plan: false });
    trackEvent('onboarding_skipped', { step: 'value_guide' });
    router.replace('/(tabs)');
    onComplete();
  };

  const toRegister = (data: any) => {
    ustore.setWxInfo(data);
    router.push({ pathname: '/login', params: { type: 'bind' } });
  };

  return (
    <View className="flex-1">
      <View className="flex-1 px-6">
        {/* 成功提示 */}
        <View className="items-center mb-9">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
            <Icon name="checkmark-circle" size={36} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-white text-center tracking-tight">
            {copy.successText}
          </Text>
        </View>

        {/* 价值引导内容 */}
        <View
          className="rounded-3xl p-5 mb-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 2,
            borderColor: 'transparent',
          }}>
          <Text className="text-base text-white/60 leading-6 mb-4">
            {copy.painPoint}
          </Text>

          <Text className="text-base text-white/60 leading-6 mb-4">
            但今天你做到了。问题是，明天呢？后天呢？
          </Text>

          <View
            className="h-px mb-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          />

          <Text className="text-lg font-semibold text-white mb-3">
            让它自动运行，你不用再操心
          </Text>

          <Text className="text-base text-white/60 leading-6">
            {copy.solution}
          </Text>
        </View>

        {/* 功能亮点 */}
        <View className="flex-row justify-around">
          <View className="items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mb-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Icon name="calendar-outline" size={20} color="#7A5AF8" />
            </View>
            <Text className="text-xs text-white/40">设置一次</Text>
          </View>
          <View className="items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mb-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Icon name="time-outline" size={20} color="#7A5AF8" />
            </View>
            <Text className="text-xs text-white/40">每天自动</Text>
          </View>
          <View className="items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mb-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Icon name="flash-outline" size={20} color="#7A5AF8" />
            </View>
            <Text className="text-xs text-white/40">不用纠结</Text>
          </View>
        </View>
      </View>

      {/* 底部操作区 */}
      <View className="px-6 pb-6">
        <Wechat
          type="custom"
          disabled={!agree}
          onSuccess={loginResult}
          label="设置我的专注计划"
        />

        <View className="flex-row items-center justify-center mt-4">
          <Privicy onChange={setAgree} />
        </View>

        <Flex
          onPress={handleSkip}
          activeOpacity={0.6}
          className="py-3 items-center justify-center mt-2">
          <Text className="text-white/40 text-xs">稍后设置</Text>
        </Flex>
      </View>
    </View>
  );
};

export default ValueGuide;
