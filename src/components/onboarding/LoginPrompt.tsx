import { Privicy, Wechat } from '@/components/business';
import { useGuideStore, useHomeStore, useUserStore } from '@/stores';
import { markOnboardingCompleted, trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LoginPromptProps {
  onComplete: () => void;
}

const LoginPrompt = ({ onComplete }: LoginPromptProps) => {
  const store = useHomeStore();
  const gstore = useGuideStore();
  const ustore = useUserStore();

  const [agree, setAgree] = useState(false);

  useEffect(() => {
    store.stopVpn();
    gstore.completeUnlogin();
  }, []);

  const loginResult = (result: any) => {
    if (result.statusCode === 20003) {
      return toRegister(result.data);
    }
    ustore.login(result as Record<string, any>, val => {
      if (val) {
        completeOnboarding(true);
      }
    });
  };

  const handleSkipLogin = () => {
    completeOnboarding(false);
  };

  const completeOnboarding = (withLogin: boolean) => {
    markOnboardingCompleted();
    trackEvent('onboarding_completed', { with_login: withLogin });
    router.replace('/(tabs)');
    onComplete();
  };

  const toRegister = (data: any) => {
    ustore.setWxInfo(data);
    router.push({ pathname: '/login', params: { type: 'bind' } });
  };

  const FeatureItem = ({
    icon,
    title,
    desc,
  }: {
    icon: string;
    title: string;
    desc: string;
  }) => (
    <View className="flex-row items-center mb-5">
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-4">
        <Icon name={icon as any} size={20} color="hsl(var(--primary))" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground mb-0.5">
          {title}
        </Text>
        <Text className="text-sm text-muted-foreground">{desc}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <View className="flex-1 px-6 pt-12">
        <Text className="text-3xl font-bold text-foreground mb-2 text-center tracking-tight">
          体验结束
        </Text>
        <Text className="text-lg text-muted-foreground mb-10 text-center">
          登录解锁完整功能
        </Text>

        <View className="bg-card rounded-3xl p-6 border border-border shadow-sm">
          <FeatureItem
            icon="time-outline"
            title="自定义专注时长"
            desc="不再局限于5分钟，自由设定"
          />
          <FeatureItem
            icon="apps-outline"
            title="无限应用数量"
            desc="添加任意数量的受限应用"
          />
          <FeatureItem
            icon="calendar-outline"
            title="自动化计划"
            desc="创建定时任务，自动执行"
          />
          <FeatureItem
            icon="stats-chart-outline"
            title="详细统计"
            desc="查看每日专注与使用数据"
          />
        </View>
      </View>

      <View className="px-6 pb-6">
        <View className="mb-6">
          <Privicy onChange={setAgree} />
        </View>
        <Wechat type="custom" disabled={!agree} onSuccess={loginResult} />

        <TouchableOpacity
          className="py-4 items-center mt-2 active:opacity-60"
          onPress={handleSkipLogin}>
          <Text className="text-muted-foreground text-sm font-medium">
            暂不登录，直接进入
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginPrompt;
