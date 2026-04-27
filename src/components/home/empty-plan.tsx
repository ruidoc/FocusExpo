import { Button } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useBenefitStore, usePlanStore, useUserStore } from '@/stores';
import {
  clearOnboardingOptionalTargetState,
  getCurrentMinute,
  getOnboardingOptionalTargetState,
  trackEvent,
} from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { LayoutRectangle, Text, TouchableOpacity, View } from 'react-native';

interface EmptyPlanProps {
  onQuickStartLayout?: (layout: LayoutRectangle) => void;
}

interface RecommendationCardProps {
  title: string;
  desc: string;
  label?: string;
  icon?: string;
  onPress: () => void;
  onClose: () => void;
}

const RecommendationCard = ({
  title,
  desc,
  label = '建议',
  icon = 'bulb-outline',
  onPress,
  onClose,
}: RecommendationCardProps) => {
  const { colors } = useCustomTheme();

  return (
    <View
      className="w-full rounded-[20px] p-4 mb-3 flex-row items-start border"
      style={{
        backgroundColor: '#22C55E0F',
        borderColor: '#22C55E33',
      }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="flex-1 flex-row items-center">
        <View
          className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: '#22C55E1F' }}>
          <Icon name={icon as any} size={20} color="#22C55E" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text
              className="text-base font-semibold"
              style={{ color: colors.text }}>
              {title}
            </Text>
            <View
              className="ml-2 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#22C55E1F' }}>
              <Text className="text-[11px] font-semibold text-[#22C55E]">
                {label}
              </Text>
            </View>
          </View>
          <Text className="text-sm leading-5" style={{ color: colors.text3 }}>
            {desc}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onClose}
        className="w-7 h-7 rounded-full items-center justify-center ml-2"
        style={{ backgroundColor: '#22C55E1A' }}>
        <Icon name="close" size={16} color={colors.text3} />
      </TouchableOpacity>
    </View>
  );
};

const EmptyPlan = ({ onQuickStartLayout }: EmptyPlanProps) => {
  const { colors } = useCustomTheme();
  const pstore = usePlanStore();
  const bstore = useBenefitStore();
  const ustore = useUserStore();

  const toRoute = (path: string) => {
    if (!ustore.uInfo) {
      return router.push('/login/wx');
    }
    router.push(path as never);
  };
  const [nowMinute, setNowMinute] = useState(getCurrentMinute());
  const [optionalTarget, setOptionalTarget] = useState(() =>
    getOnboardingOptionalTargetState(),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMinute(getCurrentMinute());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const nextPlan = pstore.next_plan;
  const gap = nextPlan ? nextPlan.start_min - nowMinute : 0;
  const remainingMinutes = bstore.day_duration - bstore.today_used;
  const isQuotaExhausted =
    !bstore.is_subscribed && bstore.day_duration > 0 && remainingMinutes <= 0;
  const optionalSleepTask = {
    id: 'sleep',
    title: '一周不熬夜玩手机',
    startTime: '22:00',
    endTime: '23:00',
    repeat: [1, 2, 3, 4, 5, 6, 0],
    appSelectHint: '选择你睡前总忍不住刷的应用',
  };

  const getCountdownText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟后开始`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小时${m}分后开始`;
  };

  const toOptionalTarget = () => {
    if (!optionalTarget) return;
    const completedCount = optionalTarget.completed_tasks
      .split(',')
      .filter(Boolean).length;
    trackEvent('target_task_clicked', {
      task_id: optionalSleepTask.id,
      task_name: optionalSleepTask.title,
      entry_source: 'onboarding',
      problem: optionalTarget.problem,
      completed_count: completedCount,
    });
    router.push({
      pathname: '/plans/add',
      params: {
        from: 'target',
        problem: optionalTarget.problem,
        taskId: optionalSleepTask.id,
        taskIndex: String(completedCount),
        completedTasks: optionalTarget.completed_tasks,
        presetName: optionalSleepTask.title,
        presetStart: optionalSleepTask.startTime,
        presetEnd: optionalSleepTask.endTime,
        presetRepeat: JSON.stringify(optionalSleepTask.repeat),
        presetDuration: '7d',
        appSelectHint: optionalSleepTask.appSelectHint,
        afterCreate: 'home',
      },
    });
  };

  const closeOptionalTarget = () => {
    if (!optionalTarget) return;
    trackEvent('home_optional_target_dismissed', {
      problem: optionalTarget.problem,
      completed_tasks: optionalTarget.completed_tasks,
    });
    clearOnboardingOptionalTargetState();
    setOptionalTarget(undefined);
  };

  const actionArea = (
    <View className="w-full gap-4">
      <Button text="创建契约" onPress={() => toRoute('/plans/presets')} />

      {isQuotaExhausted ? (
        <View className="items-center py-3">
          <Text className="text-sm text-center" style={{ color: colors.text3 }}>
            今日额度已用完，明天再来吧
          </Text>
          <Text
            className="text-[12px] text-center mt-1"
            style={{ color: colors.text3, opacity: 0.6 }}>
            自律需要长期坚持，保持节奏
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 gap-[2px]"
          onLayout={e => onQuickStartLayout?.(e.nativeEvent.layout)}
          onPress={() => toRoute('/quick-start')}>
          <Text className="text-sm mr-1" style={{ color: colors.text2 }}>
            临时使用？
          </Text>
          <Icon name="flash" size={14} color={colors.primary} />
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.primary }}>
            快速专注
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className="w-full flex-1 px-6">
      {nextPlan && (
        <>
          <View className="w-full mt-5">
            {optionalTarget && (
              <RecommendationCard
                title="再加一个睡前契约"
                desc="减少夜间刷手机，让锁定自动发生"
                icon="moon-outline"
                onPress={toOptionalTarget}
                onClose={closeOptionalTarget}
              />
            )}

            <View
              className="w-full rounded-[20px] p-6 mb-3"
              style={{
                backgroundColor: colors.card,
              }}>
              <View className="flex-row justify-between items-start">
                <View>
                  <Text
                    className="text-sm mb-2"
                    style={{ color: colors.text2 }}>
                    下一个契约
                  </Text>
                  <Text
                    className="text-2xl font-bold mb-1"
                    style={{ color: colors.text }}>
                    {nextPlan.name}
                  </Text>
                  <Text
                    className="text-base font-semibold mb-4"
                    style={{ color: colors.primary }}>
                    {nextPlan.start} - {nextPlan.end}
                  </Text>
                </View>
                <View className="bg-[#7A5AF820] px-2 py-1 rounded-lg">
                  <Icon name="calendar-outline" size={18} color="#7A5AF8" />
                </View>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Icon name="time-outline" size={14} color={colors.text3} />
                <Text className="text-sm" style={{ color: colors.text3 }}>
                  {getCountdownText(gap)}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-7 w-full justify-center">
            <View className="w-full">
              <Text
                className="text-2xl font-semibold mb-2 text-center"
                style={{ color: colors.text }}>
                自律不是靠忍，是靠规则
              </Text>
              <Text
                className="text-base text-center mb-8 leading-5"
                style={{ color: colors.text2 }}>
                多一个契约，多一段被锁定的专注
              </Text>
              {actionArea}
            </View>
          </View>
        </>
      )}
      {!nextPlan && (
        <View className="flex-1 w-full justify-center">
          <View className="items-center">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.surface }}>
              <Icon name="sunny-outline" size={54} color="#F7AF5D" />
            </View>
            <Text
              className="text-2xl font-semibold mt-5 mb-2 text-center"
              style={{ color: colors.text }}>
              改变，从一个契约开始
            </Text>
            <Text
              className="text-base text-center mb-8 leading-5"
              style={{ color: colors.text2 }}>
              设定时间段，每日自动锁定分心应用
            </Text>
          </View>
          {actionArea}
        </View>
      )}
    </View>
  );
};

export default EmptyPlan;
