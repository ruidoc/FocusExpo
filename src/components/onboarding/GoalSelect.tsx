import Icon from '@expo/vector-icons/Ionicons';
import type { ProblemType } from 'app/onboarding';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
    },
    {
      id: 'game' as const,
      title: '沉迷游戏',
      desc: '难以控制时间',
      icon: 'game-controller',
    },
    {
      id: 'study' as const,
      title: '学习分心',
      desc: '玩手机影响效率',
      icon: 'book',
    },
  ];

  const handleSelect = (id: ProblemType) => {
    setProblem(id);
    setTimeout(() => {
      onNext();
    }, 300);
  };

  return (
    <View className="flex-1 px-6 pt-12">
      <View className="mb-10">
        <Text className="text-3xl font-bold text-foreground mb-3 tracking-tight">
          目标设定
        </Text>
        <Text className="text-lg text-muted-foreground leading-6">
          告诉我您目前遇到的最大困扰，{'\n'}为您量身定制专注方案。
        </Text>
      </View>

      <View className="gap-y-4">
        {addictionOptions.map(option => {
          const isSelected = problem === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.9}
              className={`w-full p-4 rounded-2xl border transition-all ${isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card'
                }`}>
              <View className="flex-row items-center">
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${isSelected ? 'bg-primary/10' : 'bg-muted/30'}`}>
                  <Icon
                    name={option.icon as any}
                    size={24}
                    color={
                      isSelected
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--muted-foreground))'
                    }
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-lg font-semibold mb-1 ${isSelected ? 'text-primary' : 'text-foreground'
                      }`}>
                    {option.title}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {option.desc}
                  </Text>
                </View>

                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ml-2 ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                  {isSelected && (
                    <Icon name="checkmark" size={14} color="#FFF" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default GoalSelect;
