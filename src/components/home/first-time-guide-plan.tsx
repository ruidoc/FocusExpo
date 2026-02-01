/**
 * FirstTimeGuidePlan - 引导完成用户的首页组件
 * 用于引导完成onboarding但未开始首次专注的用户
 */

import { Button } from '@/components/ui';
import { trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const FirstTimeGuidePlan = () => {
  const handleStartFocus = () => {
    trackEvent('first_time_guide_start');
    // 跳转到快速开始页面（时长默认15分钟）
    router.push('/quick-start');
  };

  const handleSkip = () => {
    trackEvent('first_time_guide_skip');
    // 用户选择暂时不专注，保持在首页
    // 下次刷新首页时仍会显示此引导（直到完成首次专注）
  };

  return (
    <View className="w-full px-6 items-center">
      {/* 图标 */}
      <View className="w-20 h-20 rounded-full bg-[#7A5AF8]/20 items-center justify-center mb-6">
        <Icon name="rocket" size={40} color="#7A5AF8" />
      </View>

      {/* 标题 */}
      <Text className="text-2xl font-bold text-white mb-2 text-center">
        引导已完成
      </Text>
      <Text className="text-base text-[#858699] mb-8 text-center">
        开始你的第一次专注吧！
      </Text>

      {/* 引导卡片 */}
      <View className="w-full bg-[#1C1C26] rounded-[20px] p-6 mb-6 border border-[#7A5AF8]/30">
        <View className="mb-4">
          <View className="flex-row items-start mb-3">
            <Icon name="checkmark-circle" size={20} color="#7A5AF8" />
            <Text className="text-sm text-[#B3B3BA] ml-2 flex-1">
              您已选择要限制的应用
            </Text>
          </View>
          <View className="flex-row items-start mb-3">
            <Icon name="time-outline" size={20} color="#7A5AF8" />
            <Text className="text-sm text-[#B3B3BA] ml-2 flex-1">
              建议从15分钟开始体验
            </Text>
          </View>
          <View className="flex-row items-start">
            <Icon name="shield-checkmark" size={20} color="#7A5AF8" />
            <Text className="text-sm text-[#B3B3BA] ml-2 flex-1">
              专注期间，分心应用无法打开
            </Text>
          </View>
        </View>

        <Button text="立即开始专注" onPress={handleStartFocus} />
      </View>

      {/* 跳过链接 */}
      <TouchableOpacity onPress={handleSkip}>
        <Text className="text-[#858699] text-sm">暂时不想专注</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FirstTimeGuidePlan;
