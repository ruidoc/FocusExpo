/**
 * TrialUserGuidePlan - 体验用户的首页组件
 * 用于引导完成1-2次快速专注但未创建周期计划的用户
 */

import { Button, Flex } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const TrialUserGuidePlan = () => {
  const { colors, isDark } = useCustomTheme();
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
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: colors.surface }}>
          <Icon name="sunny-outline" size={40} color="#F7AF5D" />
        </View>
        <Text
          className="text-xl font-semibold mb-8 text-center"
          style={{ color: colors.text }}>
          暂无即将开始的契约
        </Text>
      </View>

      {/* 按钮组卡片 - 固定底部 */}
      <View
        className="w-full gap-10 rounded-2xl p-5"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        <View className="w-full flex-col gap-2">
          <Text
            className="text-[17px] text-center font-medium"
            style={{ color: colors.text }}>
            培养长期专注习惯？
          </Text>
          <Flex className="flex-col gap-0">
            <Icon
              name="chevron-down"
              size={16}
              color={colors.text3}
              className="-mb-3"
            />
            <Icon name="chevron-down" size={20} color={colors.text3} />
          </Flex>
          <Button text="创建契约" onPress={handleCreatePlan} />
        </View>
        <View className="w-full flex-col gap-2">
          <Text
            className="text-[15px] text-center font-medium"
            style={{ color: colors.text3 }}>
            临时专注？
          </Text>
          <Flex className="flex-col gap-0">
            <Icon name="chevron-down" size={17} color={colors.text3} />
          </Flex>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 rounded-full px-5 py-3 active:opacity-80"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={handleQuickStart}>
            <Icon name="flash-outline" size={16} color={colors.text3} />
            <Text style={{ color: colors.text3 }} className="text-sm font-medium">
              快速开始
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TrialUserGuidePlan;
