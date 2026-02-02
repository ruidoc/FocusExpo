/**
 * CelebrationModal - 首次完成专注庆祝弹窗
 * 在用户完成首次专注后显示，引导创建周期计划
 */

import { Button } from '@/components/ui';
import { markCelebrationShown, trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  focusDuration?: number; // 专注时长（分钟）
  coinsEarned?: number; // 获得的自律币
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onClose,
  focusDuration = 15,
  coinsEarned = 20,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // 弹窗缩放动画
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // 礼花图标脉冲动画
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // 记录弹窗展示事件
      trackEvent('celebration_modal_view');
    }
  }, [visible]);

  const handleCreatePlan = () => {
    trackEvent('first_plan_guide_click');
    markCelebrationShown();
    onClose();
    setTimeout(() => {
      router.push('/plans/add');
    }, 300);
  };

  const handleContinueFocus = () => {
    trackEvent('first_plan_guide_continue');
    markCelebrationShown();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center items-center p-6">
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className="w-full bg-[#1C1C26] rounded-[24px] p-6 border border-[#2C2C36]">
          {/* 礼花图标 */}
          <View className="items-center mb-4">
            <Animated.Text
              style={{ transform: [{ scale: pulseAnim }] }}
              className="text-6xl">
              🎉
            </Animated.Text>
          </View>

          {/* 标题 */}
          <Text className="text-2xl font-bold text-white text-center mb-6">
            恭喜完成首次专注！
          </Text>

          {/* 成就卡片 */}
          <View className="bg-[#2C2C36] rounded-xl p-4 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Icon name="time-outline" size={18} color="#7A5AF8" />
                <Text className="text-white ml-2">专注时长</Text>
              </View>
              <Text className="text-white font-semibold">
                {focusDuration} 分钟
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Icon name="diamond-outline" size={18} color="#FFC107" />
                <Text className="text-white ml-2">获得自律币</Text>
              </View>
              <Text className="text-[#FFC107] font-semibold">
                +{coinsEarned}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Icon name="trophy-outline" size={18} color="#34B545" />
                <Text className="text-white ml-2">解锁成就</Text>
              </View>
              <Text className="text-[#34B545] font-semibold">专注新手</Text>
            </View>
          </View>

          {/* 引导文案 */}
          <Text className="text-[#B3B3BA] text-center mb-6">
            💪 创建专注计划，让专注成为习惯
          </Text>

          {/* 按钮组 */}
          <View className="gap-3">
            <Button text="创建我的第一个计划" onPress={handleCreatePlan} />

            <TouchableOpacity className="py-3" onPress={handleContinueFocus}>
              <Text className="text-[#858699] text-center font-medium">
                继续快速专注
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CelebrationModal;
