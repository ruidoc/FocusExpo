import { Page } from '@/components/business';
import { Process } from '@/components/ui';
import { useGuideStore } from '@/stores';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

const OnboardingNavigator = () => {
  const store = useGuideStore();
  const progress = store.currentStepIndex() / 5;

  const screenListeners = {
    state: (e: any) => {
      // 获取当前路由名称
      const currentRoute = e.data.state.routes[e.data.state.index].name;
      store.setCurrentStep(currentRoute);
    },
  };


  useEffect(() => {
    store.setCurrentStep('step1');
    return () => {
      store.setCurrentStep('step0');
    };
  }, []);

  return (
    <Page safe decoration>
      <View className="pt-10 pb-[30px] px-5">
        <Process value={progress} />
      </View>
      <Stack
        initialRouteName="step1"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
        screenListeners={screenListeners}>
        <Stack.Screen name="step1" />
        <Stack.Screen name="step2" />
        <Stack.Screen name="step3" />
        <Stack.Screen name="step4" />
        <Stack.Screen name="step5" />
      </Stack>
    </Page>
  );
};

export default OnboardingNavigator;
