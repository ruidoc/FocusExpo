import { Privicy, Wechat } from '@/components/business';
import { useHomeStore, useUserStore } from '@/stores';
import { markOnboardingCompleted, trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ValueGuideProps {
  onComplete: () => void;
}

const ValueGuide = ({ onComplete }: ValueGuideProps) => {
  const store = useHomeStore();
  const ustore = useUserStore();
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    // 停止 VPN（如果有的话）
    store.stopVpn();
  }, []);

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
        <View className="items-center mb-6">
          <View className="w-14 h-14 rounded-full bg-green-500/10 items-center justify-center mb-3">
            <Icon name="checkmark-circle" size={36} color="#22c55e" />
          </View>
          <Text className="text-xl font-bold text-foreground text-center">
            5分钟专注完成！
          </Text>
        </View>

        {/* 价值引导内容 */}
        <View className="bg-card rounded-2xl p-5 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-3 text-center">
            靠意志力自律，注定会失败
          </Text>

          <Text className="text-sm text-muted-foreground leading-5 mb-3">
            刚才的 5 分钟你成功了，但明天呢？后天呢？每天手动开启、反复提醒自己，这本身就在消耗你的意志力。
          </Text>

          <View className="h-px bg-border mb-3" />

          <Text className="text-lg font-bold text-primary mb-3 text-center">
            真正的自律，是让系统替你做决定
          </Text>

          <Text className="text-sm text-muted-foreground leading-5">
            创建定时计划后，每天自动执行，到点即刻屏蔽，无需操作。
          </Text>
        </View>

        {/* 功能亮点 */}
        <View className="flex-row justify-around">
          <View className="items-center">
            <Icon name="calendar-outline" size={22} color="hsl(var(--primary))" />
            <Text className="text-xs text-muted-foreground mt-1">每天自动</Text>
          </View>
          <View className="items-center">
            <Icon name="time-outline" size={22} color="hsl(var(--primary))" />
            <Text className="text-xs text-muted-foreground mt-1">到点生效</Text>
          </View>
          <View className="items-center">
            <Icon name="flash-outline" size={22} color="hsl(var(--primary))" />
            <Text className="text-xs text-muted-foreground mt-1">无需操作</Text>
          </View>
        </View>
      </View>

      {/* 底部操作区 */}
      <View className="px-6 pb-6">
        <View className="mb-3">
          <Privicy onChange={setAgree} />
        </View>

        <Wechat
          type="custom"
          disabled={!agree}
          onSuccess={loginResult}
          label="登录后创建计划"
        />

        <TouchableOpacity
          className="py-3 items-center mt-1 active:opacity-60"
          onPress={handleSkip}>
          <Text className="text-muted-foreground text-xs">跳过</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ValueGuide;
