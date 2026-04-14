import { Page } from '@/components/business';
import { Button, Flex } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { trackEvent } from '@/utils';
import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface PresetPlan {
  id: string;
  name: string;
  time: string;
  repeat: number[] | 'once';
  repeatText: string;
  description: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

const PRESET_PLANS: PresetPlan[] = [
  {
    id: 'morning_reading',
    name: '早起读书',
    time: '6:30-7:30',
    repeat: [1, 2, 3, 4, 5, 6, 7],
    repeatText: '每天',
    description: '开启美好一天，晨读一小时',
    startTime: '06:30',
    endTime: '07:30',
  },
  {
    id: 'morning_exercise',
    name: '晨间锻炼',
    time: '6:00-7:00',
    repeat: [1, 2, 3, 4, 5],
    repeatText: '工作日',
    description: '保持身体活力，专注运动',
    startTime: '06:00',
    endTime: '07:00',
  },
  {
    id: 'morning_study',
    name: '上午深度学习',
    time: '9:00-11:30',
    repeat: [1, 2, 3, 4, 5],
    repeatText: '工作日',
    description: '上午是效率黄金时段',
    startTime: '09:00',
    endTime: '11:30',
  },
  {
    id: 'afternoon_focus',
    name: '下午专注时段',
    time: '14:00-17:00',
    repeat: [1, 2, 3, 4, 5],
    repeatText: '工作日',
    description: '午休后保持专注',
    startTime: '14:00',
    endTime: '17:00',
  },
  {
    id: 'evening_study',
    name: '晚间学习',
    time: '19:00-22:00',
    repeat: [1, 2, 3, 4, 5, 6, 7],
    repeatText: '每天',
    description: '高效利用晚间时光',
    startTime: '19:00',
    endTime: '22:00',
  },
  {
    id: 'workday_focus',
    name: '工作日专注',
    time: '9:00-18:00',
    repeat: [1, 2, 3, 4, 5],
    repeatText: '周一到周五',
    description: '工作时间全程屏蔽',
    startTime: '09:00',
    endTime: '18:00',
  },
  {
    id: 'lunch_break',
    name: '午间防刷手机',
    time: '12:00-14:00',
    repeat: [1, 2, 3, 4, 5],
    repeatText: '工作日',
    description: '午休时间避免刷手机',
    startTime: '12:00',
    endTime: '14:00',
  },
  {
    id: 'before_sleep',
    name: '睡前一小时',
    time: '22:00-23:00',
    repeat: [1, 2, 3, 4, 5, 6, 7],
    repeatText: '每天',
    description: '放下手机，准备入睡',
    startTime: '22:00',
    endTime: '23:00',
  },
  {
    id: 'weekend_discipline',
    name: '周末自律',
    time: '9:00-21:00',
    repeat: [6, 7],
    repeatText: '周六、周日',
    description: '周末也要保持自律',
    startTime: '09:00',
    endTime: '21:00',
  },
];

const PresetsPage = () => {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { colors, isDark } = useCustomTheme();
  const fromOnboarding = params.from === 'onboarding';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : colors.card;
  const cardBorderColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : colors.border;
  const helperTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : colors.text2;
  const descTextColor = isDark ? 'rgba(255, 255, 255, 0.5)' : colors.text3;
  const footerBorderColor = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : colors.border;

  // 从 onboarding 进入时，禁止返回
  useEffect(() => {
    if (fromOnboarding) {
      navigation.setOptions({
        headerLeft: () => null as any,
        gestureEnabled: false,
        headerBackVisible: false,
      });
    }
  }, [fromOnboarding, navigation]);

  const handleSelectPreset = (preset: PresetPlan) => {
    // 埋点：记录用户选择的预设
    trackEvent('preset_selected', {
      preset_id: preset.id,
      preset_name: preset.name,
      entry_source: fromOnboarding ? 'onboarding' : 'normal',
    });
    // 跳转到创建计划页面，携带预设参数
    router.push({
      pathname: '/plans/add',
      params: {
        from: fromOnboarding ? 'onboarding' : 'presets',
        presetName: preset.name,
        presetStart: preset.startTime,
        presetEnd: preset.endTime,
        presetRepeat: JSON.stringify(preset.repeat),
      },
    });
  };

  const handleCustomPlan = () => {
    trackEvent('custom_plan_clicked', {
      entry_source: fromOnboarding ? 'onboarding' : 'normal',
    });
    router.push({
      pathname: '/plans/add',
      params: {
        from: fromOnboarding ? 'onboarding' : 'presets',
      },
    });
  };

  const handleSkip = () => {
    trackEvent('plan_creation_skipped', {
      entry_source: 'presets',
      step: 'preset_selection',
    });
    router.replace('/(tabs)');
  };

  return (
    <Page bgcolor={colors.background}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-4 mt-[94px]">
          <Text className="text-sm text-center" style={{ color: helperTextColor }}>
            为你推荐以下场景，选一个快速开始
          </Text>
        </View>

        <View className="px-6 gap-y-3 pb-6">
          {PRESET_PLANS.map(preset => (
            <TouchableOpacity
              key={preset.id}
              activeOpacity={0.7}
              onPress={() => handleSelectPreset(preset)}
              className="rounded-3xl p-5 border"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorderColor,
              }}>
              <Flex className="justify-between items-start mb-2">
                <Flex className="items-center">
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {preset.name}
                  </Text>
                </Flex>
              </Flex>

              <View>
                <Text className="text-sm mb-1" style={{ color: helperTextColor }}>
                  {preset.repeatText} · {preset.time}
                </Text>
                <Text className="text-xs" style={{ color: descTextColor }}>
                  {preset.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 底部按钮区 */}
      <View
        className="px-6 pb-2 pt-4 border-t"
        style={{ borderTopColor: footerBorderColor, borderTopWidth: 1, paddingBottom: 24 }}>
        <Button
          type="ghost"
          onPress={handleCustomPlan}
          className="mb-3"
          text="自定义契约"
        />
        {fromOnboarding && (
          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.6}
            className="py-3 items-center justify-center">
            <Text className="text-sm" style={{ color: descTextColor }}>
              稍后创建
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Page>
  );
};

export default PresetsPage;
