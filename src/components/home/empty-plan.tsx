import { Button } from '@/components/ui';
import { usePlanStore } from '@/stores';
import { getCurrentMinute } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { Theme } from '@fruits-chain/react-native-xiaoshu';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const EmptyPlan = () => {
  const pstore = usePlanStore();
  const xcolor = Theme.useThemeTokens();
  const [nowMinute, setNowMinute] = useState(getCurrentMinute());

  // 每分钟更新一次当前时间，用于计算倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMinute(getCurrentMinute());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const nextPlan = pstore.next_plan;
  const gap = nextPlan ? nextPlan.start_min - nowMinute : 0;
  const hasLongGap = gap > 20; // 如果空闲时间超过20分钟，引导快速开始

  // 格式化倒计时文本
  const getCountdownText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟后开始`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小时${m}分后开始`;
  };

  // 格式化空闲时间文本
  const getFreeTimeText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小时${m}分钟`;
  };

  // 渲染下一个任务卡片
  if (nextPlan) {
    return (
      <View className="w-full px-6 items-center">
        {/* Next Plan Card */}
        <View className="w-full bg-[#1C1C26] rounded-[20px] p-6 mb-6 border border-[#2C2C36]">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-sm text-[#858699] mb-2">下一个计划</Text>
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
              今日专注时长不足
            </Text>
            <Text className="text-[#858699] text-xs">
              建议继续添加计划以达成目标
            </Text>
          </View>
          <TouchableOpacity
            className="bg-[#7A5AF8] w-8 h-8 rounded-full items-center justify-center"
            onPress={() => router.push('/plans/add')}>
            <Icon name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="w-full gap-4">
          {hasLongGap ? (
            <>
              {/* 主引导：快速开始一次性任务（填补空闲） */}
              <View>
                <Text className="text-[#858699] text-xs mb-2 text-center">
                  您有 {getFreeTimeText(gap)} 的空闲时间
                </Text>
                <Button
                  text="快速开始专注"
                  onPress={() => router.push('/quick-start')}
                />
              </View>

              {/* 次引导：添加更多计划 */}
              <TouchableOpacity
                className="flex-row items-center justify-center py-3 gap-2"
                onPress={() => router.push('/plans/add')}>
                <Icon name="add-circle-outline" size={18} color="#858699" />
                <Text className="text-[#858699] text-sm font-medium">
                  添加其他计划
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // 如果时间紧迫，不再引导快速开始，只提供添加计划入口
            <Button
              text="添加新计划"
              onPress={() => router.push('/plans/add')}
              style={{ backgroundColor: '#2C2C36' }} // 次级按钮样式
              textStyle={{ color: '#FFFFFF' }}
            />
          )}
        </View>
      </View>
    );
  }

  // 无任务状态
  return (
    <View className="w-full px-6 items-center">
      <View className="items-center my-10">
        <View className="w-20 h-20 rounded-full bg-[#1C1C26] items-center justify-center mb-4">
          <Icon name="sunny-outline" size={40} color="#F7AF5D" />
        </View>
        <Text className="text-xl font-semibold text-white mt-5 mb-2 text-center">
          暂无即将开始的计划
        </Text>
        <Text className="text-sm text-[#858699] text-center mb-8 leading-5">
          您现在的状态很轻松。{'\n'}创建一个计划或快速开始专注。
        </Text>
      </View>

      <View className="w-full gap-4">
        {/* 主引导：创建计划任务 */}
        <Button text="创建计划任务" onPress={() => router.push('/plans/add')} />

        {/* 次引导：创建一次性任务 */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 gap-2"
          onPress={() => router.push('/quick-start')}>
          <Icon name="flash-outline" size={16} color="#858699" />
          <Text className="text-[#858699] text-sm font-medium">
            快速开始一次性专注
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmptyPlan;
