/**
 * DayDoneModal - 今日配额耗尽鼓励弹窗
 * 当用户今日专注时长全部使用完毕时展示，传递积极正向的信息
 * 触发路径：iOS Extension → Darwin 通知 → JS quota-exhausted 事件 → showDayDoneModal()
 */

import { useBenefitStore } from '@/stores';
import { registerQuotaExhaustedHandler } from '@/native/ios/sync';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { create } from 'zustand';

// 弹窗状态 store（模块内部使用）
const useDayDoneModalStore = create<{
  visible: boolean;
  show: () => void;
  hide: () => void;
}>(set => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));

/** 命令式显示弹窗（供 sync.ts 调用） */
export function showDayDoneModal() {
  useDayDoneModalStore.getState().show();
}

/** 命令式隐藏弹窗 */
export function hideDayDoneModal() {
  useDayDoneModalStore.getState().hide();
}

const DayDoneModal: React.FC = () => {
  const { visible, hide } = useDayDoneModalStore();
  const benefitStore = useBenefitStore();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // 注册到 sync.ts，避免循环依赖
  useEffect(() => {
    registerQuotaExhaustedHandler(showDayDoneModal);
  }, []);

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const formatMinutes = (min: number) => {
    if (min >= 60) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
    }
    return `${min} 分钟`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={hide}>
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className="w-full bg-[#1C1C26] rounded-[24px] p-6 border border-[#2C2C36]">
          {/* 图标 */}
          <View className="items-center mb-4">
            <Text className="text-6xl">🌙</Text>
          </View>

          {/* 标题 */}
          <Text className="text-2xl font-bold text-white text-center mb-2">
            今天做的很棒！
          </Text>

          {/* 正文 */}
          <Text className="text-[#858699] text-center text-base leading-6 mb-6">
            今日{' '}
            <Text className="text-white font-semibold">
              {formatMinutes(benefitStore.day_duration)}
            </Text>{' '}
            专注时长已全部完成。{'\n'}
            自律是循序渐进的过程，明天继续加油 💪
          </Text>

          {/* 按钮 */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="py-4 rounded-2xl items-center"
            style={{ backgroundColor: '#7A5AF8' }}
            onPress={hide}>
            <Text className="text-white font-semibold text-base">
              好的，明天继续
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default DayDoneModal;
