import { Button } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useBenefitStore, usePlanStore, useUserStore } from '@/stores';
import { getCurrentMinute } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const EmptyPlan = () => {
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

  const getCountdownText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟后开始`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小时${m}分后开始`;
  };

  return (
    <View className="w-full px-6 items-center">
      {nextPlan && (
        <>
          <View
            className="w-full rounded-[20px] p-6 mb-6"
            style={{
              backgroundColor: colors.card2,
            }}>
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-sm mb-2" style={{ color: colors.text2 }}>
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
              <View
                className="px-2 py-1 rounded-lg"
                style={{ backgroundColor: colors.primarySoft }}>
                <Icon name="calendar-outline" size={18} color={colors.primary} />
              </View>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Icon name="time-outline" size={14} color={colors.text2} />
              <Text className="text-sm" style={{ color: colors.text2 }}>
                {getCountdownText(gap)}
              </Text>
            </View>
          </View>
          <View className="w-full mt-6">
            <Text
              className="text-2xl font-semibold mt-5 mb-2 text-center"
              style={{ color: colors.text }}>
              自律不是靠忍，是靠规则
            </Text>
            <Text
              className="text-base text-center mb-8 leading-5"
              style={{ color: colors.text2 }}>
              多一个契约，多一段被锁定的专注
            </Text>
          </View>
        </>
      )}
      {!nextPlan && (
        <View className="items-center my-10">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.card2 }}>
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
      )}

      <View className="w-full gap-4">
        <Button text="创建契约" onPress={() => toRoute('/plans/presets')} />

        {isQuotaExhausted ? (
          <View className="items-center py-3">
            <Text className="text-sm text-center" style={{ color: colors.text2 }}>
              今日额度已用完，明天再来吧
            </Text>
            <Text className="text-[12px] text-center mt-1" style={{ color: colors.text3 }}>
              自律需要长期坚持，保持节奏
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            className="flex-row items-center justify-center py-3 gap-[2px]"
            onPress={() => toRoute('/quick-start')}>
            <Text className="text-sm mr-1" style={{ color: colors.text2 }}>
              临时使用？
            </Text>
            <Icon name="flash" size={14} color={colors.primary} />
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              快速专注
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default EmptyPlan;
