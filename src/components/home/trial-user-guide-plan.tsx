/**
 * TrialUserGuidePlan - 体验用户的首页组件
 * 用于引导完成1-2次快速专注但未创建周期计划的用户
 */

import { Button, Flex } from '@/components/ui';
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
    <View className="flex-1 w-full px-6 items-center justify-between">
      {/* 空状态图标 + 文案 */}
      <View className="items-center">
        <View className="w-20 h-20 rounded-full bg-[#1C1C26] items-center justify-center mb-4">
          <Icon name="sunny-outline" size={40} color="#F7AF5D" />
        </View>
        <Text className="text-xl font-semibold text-white mb-8 text-center">
          暂无即将开始的计划
        </Text>
      </View>

      {/* 引导卡片 */}
      {/* <View className="w-full bg-[#1C1C26] rounded-[20px] p-6 mb-6 border border-[#2C2C36]">
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
      </View> */}

      {/* 按钮组卡片 - 固定底部 */}
      <View className="w-full gap-10 bg-[#181821] rounded-2xl p-5 border border-[#1C1C26]">
        <View className="w-full flex-col gap-2">
          <Text className="text-[#E5E7EB] text-[17px] text-center font-medium">
            培养长期专注习惯？
          </Text>
          <Flex className="flex-col gap-0">
            <Icon
              name="chevron-down"
              size={16}
              color="#9CA3AF"
              className="-mb-3"
            />
            <Icon name="chevron-down" size={20} color="#9CA3AF" />
          </Flex>
          <Button text="创建专注计划" onPress={handleCreatePlan} />
        </View>
        <View className="w-full flex-col gap-2">
          <Text className="text-[#9CA3AF] text-[15px] text-center font-medium">
            临时专注？
          </Text>
          <Flex className="flex-col gap-0">
            <Icon name="chevron-down" size={17} color="#9CA3AF" />
          </Flex>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 bg-white/5 border border-[#2C2C36] rounded-full px-5 py-3 active:opacity-80"
            onPress={handleQuickStart}>
            <Icon name="flash-outline" size={16} color="#9CA3AF" />
            <Text className="text-[#9CA3AF] text-sm font-medium">快速开始</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TrialUserGuidePlan;
