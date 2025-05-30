import { GuideStore } from '@/stores';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StyleSheet, View } from 'react-native';

export type OnboardingStackParamList = {
  step1: undefined;
  step2: undefined;
  step3: undefined;
  step4: undefined;
  step5: undefined;
};

const ProgressBar = observer(() => {
  const store = useLocalObservable(() => GuideStore);
  const { colors, dark } = useTheme();
  const progress = (store.currentStepIndex / 5) * 100;

  // 创建动画值
  const progressAnim = useRef(new Animated.Value(progress)).current;

  // 当进度变化时执行动画
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    store.setCurrentStep('step1');
    return () => {
      store.setCurrentStep('step0');
    };
  }, []);

  return (
    <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
      <View
        style={[
          styles.progressBackground,
          { backgroundColor: dark ? '#2A2A2A' : '#E6E6E6' },
        ]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}>
          <LinearGradient
            colors={!dark ? ['#6366F1', '#8B5CF6'] : ['#A5B4FC', '#C7D2FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
      </View>
    </View>
  );
});

const OnboardingNavigator = () => {
  const store = useLocalObservable(() => GuideStore);

  const screenListeners = {
    state: (e: any) => {
      // 获取当前路由名称
      const currentRoute = e.data.state.routes[e.data.state.index].name;
      store.setCurrentStep(currentRoute);
    },
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ProgressBar />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#121212',
  },
  progressBackground: {
    height: 11,
    backgroundColor: '#2A2A2A',
    borderRadius: 5.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5.5,
  },
  gradient: {
    flex: 1,
    borderRadius: 5.5,
  },
});

export default OnboardingNavigator;
