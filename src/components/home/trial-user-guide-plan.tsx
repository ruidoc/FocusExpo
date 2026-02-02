/**
 * TrialUserGuidePlan - 体验用户的首页组件
 * 用于引导完成1-2次快速专注但未创建周期计划的用户
 */

import { Button } from '@/components/ui';
import { storage, trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const TrialUserGuidePlan = () => {
  const focusCount = storage.getNumber('focus_count') || 0;

  const handleCreatePlan = () => {
    trackEvent('trial_user_create_plan');
    router.push('/plans/add');
  };

  const handleQuickStart = () => {
    trackEvent('trial_user_quick_start');
    router.push('/quick-start');
  };

  return (
    <View className="w-full px-6 items-center">
      {/* 空状态图标 */}
      <View className="w-20 h-20 rounded-full bg-[#1C1C26] items-center justify-center mb-4">
        <Icon name="sunny-outline" size={40} color="#F7AF5D" />
      </View>

      <Text className="text-xl font-semibold text-white mb-8 text-center">
        暂无即将开始的计划
      </Text>

      {/* 引导卡片 */}
      <View className="w-full bg-[#1C1C26] rounded-[20px] p-6 mb-6 border border-[#2C2C36]">
        <Text className="text-sm text-[#7A5AF8] mb-2">
          💡 您已完成 {focusCount} 次快速专注
        </Text>

        <Text className="text-base font-semibold text-white mb-4">
          创建周期计划，让专注成为习惯！
        </Text>

        <View className="mb-4">
          <View className="flex-row items-start mb-2">
            <Text className="text-[#B3B3BA] mr-2">•</Text>
            <Text className="text-sm text-[#B3B3BA] flex-1">
              每周固定时间自动开始
            </Text>
          </View>
          <View className="flex-row items-start mb-2">
            <Text className="text-[#B3B3BA] mr-2">•</Text>
            <Text className="text-sm text-[#B3B3BA] flex-1">
              自动限制应用，无需手动操作
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-[#B3B3BA] mr-2">•</Text>
            <Text className="text-sm text-[#B3B3BA] flex-1">
              培养长期专注习惯
            </Text>
          </View>
        </View>
      </View>

      {/* 按钮组 */}
      <View className="w-full gap-4">
        <Button text="创建专注计划" onPress={handleCreatePlan} />

        <TouchableOpacity
          className="flex-row items-center justify-center py-3 gap-2"
          onPress={handleQuickStart}>
          <Icon name="flash-outline" size={16} color="#858699" />
          <Text className="text-[#858699] text-sm font-medium">
            继续快速专注
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TrialUserGuidePlan;
