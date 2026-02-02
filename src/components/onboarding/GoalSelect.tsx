import { Flex } from '@/components/ui';
import Icon from '@expo/vector-icons/Ionicons';
import type { ProblemType } from 'app/onboarding';
import React from 'react';
import { Text, View } from 'react-native';

interface GoalSelectProps {
  problem: ProblemType;
  setProblem: (problem: ProblemType) => void;
  onNext: () => void;
}

const GoalSelect = ({ problem, setProblem, onNext }: GoalSelectProps) => {
  const addictionOptions = [
    {
      id: 'video' as const,
      title: '短视频上瘾',
      desc: '刷到停不下来',
      icon: 'logo-tiktok',
      color: '#FF6B6B', // 红色
    },
    {
      id: 'game' as const,
      title: '沉迷游戏',
      desc: '难以控制时间',
      icon: 'game-controller',
      color: '#4ECDC4', // 青色
    },
    {
      id: 'study' as const,
      title: '学习分心',
      desc: '玩手机影响效率',
      icon: 'book',
      color: '#42A5F5', // 蓝色
    },
    {
      id: 'other' as const,
      title: '其他',
      desc: '我只是想专注',
      icon: 'ellipsis-horizontal',
      color: '#F59E42', // 橙色
    },
  ];

  const handleSelect = (id: ProblemType) => {
    setProblem(id);
    setTimeout(() => {
      onNext();
    }, 300);
  };

  return (
    <View className="flex-1 px-6">
      <View className="mb-9">
        <Text className="text-2xl font-bold text-white mb-2 tracking-tight text-center">
          你最常在什么场景分心？
        </Text>
        <Text className="text-base text-white/60 leading-6 text-center">
          选择一个，为你定制专注方案
        </Text>
      </View>

      <View className="gap-y-3 px-1">
        {addictionOptions.map(option => {
          const isSelected = problem === option.id;
          return (
            <Flex
              key={option.id}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.8}
              className="rounded-3xl p-3.5"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 2,
                borderColor: isSelected ? '#7A5AF8' : 'transparent',
              }}>
              {/* 图标区域 - 固定尺寸和颜色 */}
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-4 ml-1">
                <Icon
                  name={option.icon as any}
                  size={28}
                  color={option.color}
                />
              </View>

              {/* 文字区域 */}
              <View className="flex-1">
                <Text className="text-lg font-semibold text-white mb-0.5">
                  {option.title}
                </Text>
                <Text className="text-sm text-white/40">{option.desc}</Text>
              </View>

              {/* 选中指示器 */}
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isSelected ? '#7A5AF8' : 'transparent',
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}>
                {isSelected && <Icon name="checkmark" size={16} color="#FFF" />}
              </View>
            </Flex>
          );
        })}
      </View>
    </View>
  );
};

export default GoalSelect;
