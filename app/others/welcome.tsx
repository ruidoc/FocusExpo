import { Button, GradientText } from '@/components/ui';
import { router } from 'expo-router';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const GuideWelcome = () => {
  const handleNext = () => {
    router.push('/onboarding');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-[26%] items-center">
        {/* Logo */}
        <Image
          source={require('@/assets/images/logo.png')}
          className="w-[100px] h-[100px] mb-16"
          resizeMode="contain"
        />
        <View className="items-center gap-2">
          {/* 主标题 - 价值定位 */}
          <GradientText
            colors={['#7A5AF8', '#9B7BFA', '#B794F6']}
            style={{
              fontSize: 32,
              fontWeight: '700',
              textAlign: 'center',
              lineHeight: 40,
              letterSpacing: -0.5,
              marginBottom: 12,
            }}>
            专注，不再需要意志力
          </GradientText>

          {/* 副标题 - 实现方式 */}
          <View className="mb-10">
            <Text className="text-base text-[#8892b0] text-center leading-relaxed">
              定时自动屏蔽分心应用
            </Text>
            <Text className="text-base text-[#8892b0] text-center leading-relaxed mt-1">
              系统级强制执行
            </Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View className="px-6 pb-10">
        <Button
          onPress={handleNext}
          text="开始使用"
          className="w-full rounded-3xl h-14"
          textClassName="text-lg font-semibold"
        />
      </View>
    </SafeAreaView>
  );
};

export default GuideWelcome;
