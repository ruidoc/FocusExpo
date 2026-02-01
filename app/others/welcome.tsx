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
      <View className="flex-1 px-6 justify-center">
        {/* Hero Section */}
        <View className="items-center">
          {/* Logo */}
          <Image
            source={require('@/assets/images/logo.png')}
            className="w-24 h-24 mb-8"
            resizeMode="contain"
          />

          {/* 渐变主文案 */}
          <GradientText
            colors={['#7A5AF8', '#9B7BFA', '#B794F6']}
            className="text-3xl font-extrabold text-center tracking-tight">
            重新掌控你的时间
          </GradientText>

          {/* 副标题 */}
          <Text className="text-base text-white/60 text-center mt-4">
            别让屏幕偷走你的生活
          </Text>
        </View>
      </View>

      {/* CTA */}
      <View className="px-6 pb-10">
        <Button
          onPress={handleNext}
          text="开启专注之旅"
          className="w-full rounded-3xl h-14"
          textClassName="text-lg"
        />
      </View>
    </SafeAreaView>
  );
};

export default GuideWelcome;
