import { Button } from '@/components/ui';
import { usePlanStore } from '@/stores';
import { getCurrentMinute } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const EmptyPlan = () => {
  const pstore = usePlanStore();
  const [nowMinute, setNowMinute] = useState(getCurrentMinute());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMinute(getCurrentMinute());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const nextPlan = pstore.next_plan;
  const gap = nextPlan ? nextPlan.start_min - nowMinute : 0;
  const hasLongGap = gap > 20;

  const getCountdownText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟后开始`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小时${m}分后开始`;
  };

  const getFreeTimeText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小时${m}分钟`;
  };

  if (nextPlan) {
    return (
      <View className="w-full px-6 items-center">
        <View className="w-full bg-[#1C1C26] rounded-[20px] p-6 mb-6 border border-[#2C2C36]">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-sm text-[#858699] mb-2">下一个契约</Text>
              <Text className="text-2xl font-bold text-white mb-1">
                {nextPlan.name}
              </Text>
              <Text className="text-base text-[#7A5AF8] font-semibold mb-4">
                {nextPlan.start} - {nextPlan.end}
              </Text>
            </View>
            <View className="bg-[#7A5AF820] px-2 py-1 rounded-lg">
              <Icon name="calendar-outline" size={18} color="#7A5AF8" />
            </View>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Icon name="time-outline" size={14} color="#B3B3BA" />
            <Text className="text-sm text-[#B3B3BA]">
              {getCountdownText(gap)}
            </Text>
          </View>
        </View>

        <View className="bg-[#2C2C36]/50 rounded-xl p-4 flex-row items-center justify-between border border-[#3C3C46]/50">
          <View className="flex-1 mr-2">
            <Text className="text-white text-sm font-medium mb-1">
              添加更多契约
            </Text>
            <Text className="text-[#858699] text-xs">
              规律的专注安排能帮助你更高效地管理时间
            </Text>
          </View>
          <TouchableOpacity
            className="bg-[#7A5AF8] w-8 h-8 rounded-full items-center justify-center"
            onPress={() => router.push('/plans/add')}>
            <Icon name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="w-full gap-4">
          {hasLongGap ? (
            <>
              <View>
                <Text className="text-[#858699] text-xs mb-2 text-center">
                  您有 {getFreeTimeText(gap)} 的空闲时间
                </Text>
                <Button
                  text="快速开始专注"
                  onPress={() => router.push('/quick-start')}
                />
              </View>
              <TouchableOpacity
                className="flex-row items-center justify-center py-3 gap-2"
                onPress={() => router.push('/plans/add')}>
                <Icon name="add-circle-outline" size={18} color="#858699" />
                <Text className="text-[#858699] text-sm font-medium">
                  添加其他契约
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Button
              text="添加新契约"
              onPress={() => router.push('/plans/add')}
              style={{ backgroundColor: '#2C2C36' }}
              textStyle={{ color: '#FFFFFF' }}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="w-full px-6 items-center">
      <View className="items-center my-10">
        <View className="w-20 h-20 rounded-full bg-[#1C1C26] items-center justify-center mb-4">
          <Icon name="sunny-outline" size={54} color="#F7AF5D" />
        </View>
        <Text className="text-2xl font-semibold text-white mt-5 mb-2 text-center">
          改变，从一个契约开始
        </Text>
        <Text className="text-base text-[#858699] text-center mb-8 leading-5">
          设定时间段，每日自动锁定分心应用
        </Text>
      </View>

      <View className="w-full gap-4">
        <Button text="创建契约" onPress={() => router.push('/plans/presets')} />

        <TouchableOpacity
          className="flex-row items-center justify-center py-3 gap-[2px]"
          onPress={() => router.push('/quick-start')}>
          <Text className="text-sm text-[#858699] mr-1">临时使用？</Text>
          <Icon name="flash" size={14} color="#7A5AF8" />
          <Text className="text-[#7A5AF8] text-sm font-semibold">快速专注</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmptyPlan;
