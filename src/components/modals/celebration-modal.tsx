/**
 * CelebrationModal - 首次完成专注庆祝弹窗
 * 在用户完成首次专注后显示，引导创建周期计划
 */

import { Button } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { markCelebrationShown, trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  focusDuration?: number; // 专注时长（分钟）
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onClose,
  focusDuration = 15,
}) => {
  const { colors } = useCustomTheme();
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
  }, [visible, pulseAnim, scaleAnim]);

  const handleCreatePlan = () => {
    trackEvent('first_plan_guide_click');
    markCelebrationShown();
    onClose();
    setTimeout(() => {
      router.push('/plans/add');
    }, 300);
  };

  const closeCelebration = () => {
    trackEvent('first_plan_guide_close');
    markCelebrationShown();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: colors.overlay }}>
        <Animated.View
          className="w-full rounded-[24px] p-6 border"
          style={{
            transform: [{ scale: scaleAnim }],
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}>
          {/* 礼花图标 */}
          <View className="items-center mb-4">
            <Animated.Text
              style={{ transform: [{ scale: pulseAnim }] }}
              className="text-6xl">
              🎉
            </Animated.Text>
          </View>

          {/* 标题 */}
          <Text
            className="text-2xl font-bold text-center mb-6"
            style={{ color: colors.text }}>
            恭喜完成首次专注！
          </Text>

          {/* 成就卡片 */}
          <View
            className="rounded-xl p-4 mb-6"
            style={{ backgroundColor: colors.card2 }}>
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Icon name="time-outline" size={18} color={colors.primary} />
                <Text className="ml-2" style={{ color: colors.text }}>
                  专注时长
                </Text>
              </View>
              <Text className="font-semibold" style={{ color: colors.text }}>
                {focusDuration} 分钟
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Icon name="trophy-outline" size={18} color="#34B545" />
                <Text className="ml-2" style={{ color: colors.text }}>
                  解锁成就
                </Text>
              </View>
              <Text className="text-[#34B545] font-semibold">专注新手</Text>
            </View>
          </View>

          {/* 引导文案 */}
          <Text className="text-center mb-6" style={{ color: colors.text2 }}>
            💪 创建契约，让专注成为习惯
          </Text>

          {/* 按钮组 */}
          <View className="gap-3">
            <Button text="创建我的第一个契约" onPress={handleCreatePlan} />

            <TouchableOpacity className="py-3" onPress={closeCelebration}>
              <Text
                className="text-center font-medium"
                style={{ color: colors.text2 }}>
                稍后再说
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CelebrationModal;
