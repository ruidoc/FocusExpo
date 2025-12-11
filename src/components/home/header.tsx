import { useRecordStore, useUserStore } from '@/stores';
import { minutesToHours } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { Flex } from '../ui';

const Header = () => {
  const ustore = useUserStore();
  const rstore = useRecordStore();

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // 获取用户名，如果没有登录显示默认名称
  const getUserName = () => {
    if (ustore.uInfo?.username) {
      return ustore.uInfo.username;
    }
    return 'Focus User';
  };

  // 点击计时器图标的处理
  const handleTimerPress = () => {
    router.push('/plans');
  };

  return (
    <View className="flex-row justify-between items-center px-4 py-2">
      {/* 左侧问候语 */}
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

      {/* 右侧计时器图标 */}
      <Flex
        className="ml-4 bg-white/5 rounded-full px-3 gap-1 py-1.5"
        onPress={handleTimerPress}>
        <Icon name="hourglass-outline" size={18} color="#FFFFFF" />
        <Text className="text-white text-[16px]">10</Text>
      </Flex>
    </View>
  );
};

export default Header;
