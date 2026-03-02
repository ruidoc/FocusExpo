import { usePlanStore, useRecordStore, useUserStore } from '@/stores';
import { minutesToHours } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const HEIGHT = 33;

const PlanBadge = ({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
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
        backgroundColor: 'rgba(255,255,255,0.08)',
        gap: 6,
      }}>
      <Icon name="calendar-outline" size={18} color="#E5E7EB" />
      <Text
        style={{
          color: '#E5E7EB',
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

  const planCount = pstore.cus_plans.length;

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
