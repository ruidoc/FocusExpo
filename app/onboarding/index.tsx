import { Page } from '@/components/business';
import {
  GoalSelect,
  PermissionSetup,
  QuickExperience,
  ValueGuide,
} from '@/components/onboarding';
import { Process } from '@/components/ui';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, TouchableOpacity, View } from 'react-native';

export type ProblemType = 'video' | 'game' | 'study' | 'other' | null;

/**
 * Plan B+ Onboarding 流程（4步）
 * 1. GoalSelect - 用户画像收集
 * 2. PermissionSetup - 权限授权 + 选择应用
 * 3. QuickExperience - 5分钟专注体验
 * 4. ValueGuide - 价值引导 + 登录
 */
const TOTAL_STEPS = 4;
const screenWidth = Dimensions.get('window').width;

const OnboardingScreen = () => {
  const [step, setStep] = useState(1);
  const [problem, setProblem] = useState<ProblemType>(null);
  const [selectedAppName, setSelectedAppName] = useState('');
  const [isFocusActive, setIsFocusActive] = useState(false); // 是否处于专注生效阶段
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (step >= TOTAL_STEPS) return;

    Animated.timing(slideAnim, {
      toValue: -1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(s => s + 1);
      slideAnim.setValue(1);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goBack = () => {
    if (step <= 1) return;

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(s => s - 1);
      slideAnim.setValue(-1);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleComplete = () => {
    // Navigation is handled in ValueGuide
  };

  const handlePhaseChange = (phase: 'ready' | 'active') => {
    setIsFocusActive(phase === 'active');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <GoalSelect
            problem={problem}
            setProblem={setProblem}
            onNext={goNext}
          />
        );
      case 2:
        return <PermissionSetup problem={problem} onNext={goNext} />;
      case 3:
        return (
          <QuickExperience
            problem={problem}
            onNext={goNext}
            setSelectedAppName={setSelectedAppName}
            onPhaseChange={handlePhaseChange}
          />
        );
      case 4:
        return <ValueGuide problem={problem} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  const translateX = slideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-screenWidth, 0, screenWidth],
  });

  // 第一步不显示返回按钮，专注生效阶段也不显示返回按钮
  const showBackButton = step > 1 && !isFocusActive;

  return (
    <Page safe decoration>
      <View className="pt-1 pb-8 px-4">
        <View className="flex-row items-center">
          {/* 返回按钮区域 - 固定宽度确保布局稳定 */}
          <View className="w-10 h-10 items-center justify-center">
            {showBackButton && (
              <TouchableOpacity
                onPress={goBack}
                className="w-7 h-7 rounded-full bg-white/5 items-center justify-center"
                activeOpacity={0.7}>
                <Icon name="chevron-back" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-1 px-1">
            <Process value={step / TOTAL_STEPS} />
          </View>
          <View className="w-10 h-10" />
        </View>
      </View>

      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX }],
        }}>
        {renderStep()}
      </Animated.View>
    </Page>
  );
};

export default OnboardingScreen;
