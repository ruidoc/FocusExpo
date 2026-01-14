import { Page } from '@/components/business';
import { Process } from '@/components/ui';
// import { useGuideStore } from '@/stores';
import { Stack, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

export type OnboardingStackParamList = {
  step1: undefined;
  step2: undefined;
  step3: undefined;
  step4: undefined;
  step5: undefined;
};

const OnboardingNavigator = () => {
  // const setCurrentStep = useGuideStore(state => state.setCurrentStep);
  const pathname = usePathname();

  useEffect(() => {
    // pathname format might be "/(guides)/step1"
    const match = pathname.match(/step(\d+)/);
    if (match) {
      // setCurrentStep(`step${match[1]}`);
      console.log('match', match);
    }
  }, [pathname]);

  // useEffect(() => {
  //   setCurrentStep('step1');
  //   return () => {
  //     setCurrentStep('step0');
  //   };
  // }, [setCurrentStep]);

  return (
    <Page safe decoration>
      <View className="pt-10 pb-[30px] px-5">
        <Process value={0.5} />
      </View>
      <Stack
        // initialRouteName="step1"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}>
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
