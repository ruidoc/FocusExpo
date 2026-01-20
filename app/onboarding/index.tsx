import { Page } from '@/components/business';
import {
  FocusActive,
  FocusReady,
  GoalSelect,
  LoginPrompt,
  PermissionSetup,
} from '@/components/onboarding';
import { Process } from '@/components/ui';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
} from 'react-native';

const TOTAL_STEPS = 5;
const screenWidth = Dimensions.get('window').width;

const OnboardingScreen = () => {
  const [step, setStep] = useState(1);
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
    // Navigation to tabs is handled in LoginPrompt
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <GoalSelect onNext={goNext} />;
      case 2:
        return <PermissionSetup onNext={goNext} />;
      case 3:
        return <FocusReady onNext={goNext} />;
      case 4:
        return <FocusActive onNext={goNext} />;
      case 5:
        return <LoginPrompt onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  const translateX = slideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-screenWidth, 0, screenWidth],
  });

  return (
    <Page safe decoration>
      <View className="flex-row items-center pt-10 pb-[30px] px-5">
        {step > 1 ? (
          <TouchableOpacity onPress={goBack} className="mr-3">
            <Icon
              name="chevron-back"
              size={24}
              color="hsl(var(--foreground))"
            />
          </TouchableOpacity>
        ) : (
          <View className="w-6 mr-3" />
        )}
        <View className="flex-1">
          <Process value={step / TOTAL_STEPS} />
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
