import { useCustomTheme } from '@/config/theme';
import { usePlanStore, useRecordStore, useUserStore } from '@/stores';
import { addLiveFocusDelta, getLiveFocusDelta } from '@/utils/live-focus';
import { minutesToHours } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const HEIGHT = 33;

const PlanBadge = ({
  count,
  onPress,
  colors,
  isDark,
}: {
  count: number;
  onPress: () => void;
  colors: any;
  isDark: boolean;
}) => {
  const labelText =
    count > 0 ? `今日 ${count > 99 ? '99+' : count} 个契约` : '今日无契约';

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: HEIGHT,
        paddingHorizontal: 12,
        borderRadius: HEIGHT / 2,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        gap: 6,
      }}>
      <Icon name="calendar-outline" size={18} color={colors.text} />
      <Text
        style={{
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
        }}
        numberOfLines={1}>
        {labelText}
      </Text>
    </Pressable>
  );
};

const Header = () => {
  const { colors, isDark } = useCustomTheme();
  const ustore = useUserStore();
  const rstore = useRecordStore();
  const pstore = usePlanStore();
  const liveActualMins = addLiveFocusDelta(
    rstore.actual_mins,
    getLiveFocusDelta({
      active: pstore.has_active_task(),
      paused: !!pstore.is_pause(),
      curplanMinute: pstore.curplan_minute,
      currentRecordId: rstore.record_id,
      snapshotRecordId: rstore.actual_mins_snapshot_record_id,
      snapshotCurplanMinute: rstore.actual_mins_snapshot_curplan_minute,
    }),
  );

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

  const planCount = pstore.today_plans.length;

  return (
    <View className="flex-row justify-between items-center px-4 py-2">
      <View className="flex-1">
        <Text className="text-base font-medium leading-6 tracking-tight mb-1" style={{ color: colors.text2 }}>
          {getGreeting()}，{getUserName()}！
        </Text>
        <Text className="text-lg font-semibold leading-7 tracking-tighter" style={{ color: colors.text }}>
          {liveActualMins > 0
            ? `你已专注 ${minutesToHours(liveActualMins)} 👍`
            : '今天还没开始，加油！💪'}
        </Text>
      </View>

      <PlanBadge
        count={planCount}
        colors={colors}
        isDark={isDark}
        onPress={() => {
          if (!ustore.uInfo) {
            return router.push('/login/wx');
          }
          router.push('/plans');
        }}
      />
    </View>
  );
};

export default Header;
