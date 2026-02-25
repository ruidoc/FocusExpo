import { usePlanStore, useRecordStore, useUserStore } from '@/stores';
import { minutesToHours } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const SIZE = 33;
const EXPANDED_WIDTH = 100;

/** 计划角标动画配置 */
const PLAN_BADGE_ANIM_CONFIG = {
  delayMs: 3000, // 进入首页后延迟多少 ms 开始动画
  expandDurationMs: 600, // 展开动画时长 ms
  holdDurationMs: 1200, // 展开后保持时长 ms
  collapseDurationMs: 500, // 收起动画时长 ms
} as const;

const PlanBadge = ({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) => {
  const progress = useSharedValue(0);
  const displayCount = count > 99 ? '99+' : count;
  const labelText = `${displayCount}个计划`;

  useFocusEffect(
    React.useCallback(() => {
      cancelAnimation(progress);
      progress.value = 0;

      if (count > 0) {
        const {
          delayMs,
          expandDurationMs,
          holdDurationMs,
          collapseDurationMs,
        } = PLAN_BADGE_ANIM_CONFIG;

        progress.value = withDelay(
          delayMs,
          withSequence(
            withTiming(1, {
              duration: expandDurationMs,
              easing: Easing.out(Easing.cubic),
            }),
            withDelay(
              holdDurationMs,
              withTiming(0, {
                duration: collapseDurationMs,
                easing: Easing.inOut(Easing.cubic),
              }),
            ),
          ),
        );
      }

      return () => {
        cancelAnimation(progress);
        progress.value = 0;
      };
    }, [count, progress]),
  );

  const containerStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [SIZE, EXPANDED_WIDTH]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [1, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 0.3], [1, 0.5]) }],
  }));

  const labelTextStyle = {
    color: '#E5E7EB',
    fontSize: 13.5,
    fontWeight: '600' as const,
    marginLeft: 0,
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
      ]}>
      <Pressable
        onPress={onPress}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: SIZE,
            height: SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="calendar-outline" size={19} color="#E5E7EB" />
          {count > 0 && (
            <Animated.View
              style={[
                badgeStyle,
                {
                  position: 'absolute',
                  top: 1,
                  right: 1,
                  backgroundColor: '#F97316',
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                {displayCount}
              </Text>
            </Animated.View>
          )}
        </View>
        <Animated.Text style={[labelStyle, labelTextStyle]} numberOfLines={1}>
          {labelText}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
};

const Header = () => {
  const ustore = useUserStore();
  const rstore = useRecordStore();
  const pstore = usePlanStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getUserName = () => {
    if (ustore.uInfo?.username) {
      return ustore.uInfo.username;
    }
    return 'Focus User';
  };

  const planCount = pstore.all_plans().length;

  return (
    <View className="flex-row justify-between items-center px-4 py-2">
      <View className="flex-1">
        <Text className="text-base font-medium text-[#858699] leading-6 tracking-tight mb-1">
          {getGreeting()}，{getUserName()}！
        </Text>
        <Text className="text-lg font-semibold text-white leading-7 tracking-tighter">
          {rstore.actual_mins > 0
            ? `你已专注 ${minutesToHours(rstore.actual_mins)} 👍`
            : '今天还没开始，加油！💪'}
        </Text>
      </View>

      <PlanBadge count={planCount} onPress={() => router.push('/plans')} />
    </View>
  );
};

export default Header;
