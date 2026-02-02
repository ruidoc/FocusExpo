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

  // 根据 problem 获取个性化场景文案
  const getPersonalizedCopy = () => {
    switch (problem) {
      case 'video':
        return {
          example1: '自动锁定短视频',
          example2: '自动锁定游戏',
          example3: '自动锁定所有干扰',
        };
      case 'game':
        return {
          example1: '自动锁定游戏',
          example2: '自动锁定短视频',
          example3: '自动锁定所有干扰',
        };
      case 'study':
        return {
          example1: '自动锁定短视频',
          example2: '自动锁定游戏',
          example3: '自动锁定所有干扰',
        };
      default:
        return {
          example1: '自动锁定短视频',
          example2: '自动锁定游戏',
          example3: '自动锁定所有干扰',
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
    trackEvent('onboarding_completed', { with_login: true, step: 'value_guide' });
    // 登录成功后跳转到创建计划页面
    router.replace('/plans/add?from=onboarding');
    onComplete();
  };

  const toRegister = (data: any) => {
    ustore.setWxInfo(data);
    router.push({ pathname: '/login', params: { type: 'bind' } });
  };

  return (
    <View className="flex-1">
      <View className="flex-1 px-6">
        {/* 顶部成功提示 */}
        <View className="items-center mb-8 pt-6">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
            <Icon name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text className="text-lg text-white/80 text-center">
            你已经体验到了系统级锁定的效果
          </Text>
        </View>

        {/* 问题区 */}
        <View className="mb-6">
          <Text className="text-base text-white/70 mb-2">
            但每次都要手动开启
          </Text>
          <Text className="text-sm text-white/50 leading-6">
            每次问自己"要不要开始专注？"{'\n'}
            这个决定本身就在消耗意志力
          </Text>
        </View>

        {/* 解决方案标题 */}
        <Text className="text-base text-white/80 mb-4">
          更好的方式：让它每天自动发生
        </Text>

        {/* 定时计划卡片 */}
        <View
          className="rounded-3xl p-5 mb-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}>
          <Text className="text-lg font-semibold text-white mb-4">
            定时计划
          </Text>

          <View className="gap-y-3">
            <View className="flex-row items-center">
              <Text className="text-white/60 text-sm">每天 9:00</Text>
              <Icon
                name="arrow-forward"
                size={16}
                color="rgba(255, 255, 255, 0.4)"
                style={{ marginHorizontal: 8 }}
              />
              <Text className="text-white/80 text-sm flex-1">
                {copy.example1}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Text className="text-white/60 text-sm">每天 14:00</Text>
              <Icon
                name="arrow-forward"
                size={16}
                color="rgba(255, 255, 255, 0.4)"
                style={{ marginHorizontal: 8 }}
              />
              <Text className="text-white/80 text-sm flex-1">
                {copy.example2}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Text className="text-white/60 text-sm">每天 21:00</Text>
              <Icon
                name="arrow-forward"
                size={16}
                color="rgba(255, 255, 255, 0.4)"
                style={{ marginHorizontal: 8 }}
              />
              <Text className="text-white/80 text-sm flex-1">
                {copy.example3}
              </Text>
            </View>
          </View>

          <View
            className="h-px my-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          />

          <Text className="text-sm text-white/60">
            到点自动执行，无需手动开启
          </Text>
        </View>

        {/* 功能亮点 */}
        <View className="flex-row justify-around mb-6">
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
          label="登录后创建计划"
        />

        <Text className="text-center text-white/40 text-xs mt-3">
          设置一次，每天生效
        </Text>

        <View className="flex-row items-center justify-center mt-4">
          <Privicy onChange={setAgree} />
        </View>
      </View>
    </View>
  );
};

export default ValueGuide;
