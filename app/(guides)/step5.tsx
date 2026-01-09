import { Privicy, Typewriter, Wechat } from '@/components/business';
import { useGuideStore, useHomeStore, useUserStore } from '@/stores';
import { markOnboardingCompleted, trackEvent } from '@/utils';
import { useNavigation, useTheme } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NavigationProp = NativeStackNavigationProp<any>;

export const GuideStep5 = () => {
  const navigation = useNavigation<NavigationProp>();
  const store = useHomeStore();
  const gstore = useGuideStore();
  const ustore = useUserStore();
  const { colors, dark } = useTheme();

  const [typewriterDone, setTypewriterDone] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const [agree, setAgree] = useState(false);

  const loginResult = (result: any) => {
    console.log('微信登录结果', result);
    if (result.statusCode === 20003) {
      return toRegister(result.data);
    }
    ustore.login(result as Record<string, any>, val => {
      if (val) {
        // 标记引导完成
        markOnboardingCompleted();
        trackEvent('onboarding_completed', { with_login: true });
        router.replace('/(tabs)');
      }
    });
  };

  const handleSkipLogin = () => {
    // 标记引导完成但跳过登录
    markOnboardingCompleted();
    trackEvent('onboarding_completed', { with_login: false });
    router.replace('/(tabs)');
  };

  const toRegister = (data: any) => {
    ustore.setWxInfo(data);
    navigation.replace('Login', { type: 'bind' });
  };

  useEffect(() => {
    if (typewriterDone && !buttonVisible) {
      stopVpn();
      setButtonVisible(true);
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
    if (!typewriterDone && buttonVisible) {
      setButtonVisible(false);
      buttonOpacity.setValue(0);
    }
  }, [typewriterDone]);

  const stopVpn = () => {
    store.stopVpn();
    gstore.completeUnlogin();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 20,
    },
    content: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    },
    question: {
      fontSize: 18,
      color: colors.text,
      marginBottom: 24,
      textAlign: 'left',
      lineHeight: 24,
      fontWeight: '600',
    },
    nextButton: {
      backgroundColor: '#3478F6',
      paddingVertical: 16,
      borderRadius: 24,
      alignItems: 'center',
      marginBottom: 32,
      width: '88%',
      alignSelf: 'center',
      shadowColor: '#3478F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    nextButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    skipButton: {
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    skipButtonText: {
      color: colors.text,
      fontSize: 16,
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Typewriter
          lines={[
            '恭喜你，核心功能已体验完毕！',
            '登录后，还可以使用更多高级功能',
            '1. 自定义任务时长',
            '2. 添加任意数量APP',
            '3. 添加定时任务，自动执行',
          ]}
          speed={22}
          lineDelay={600}
          lineStyle={styles.question}
          onFinish={() => setTypewriterDone(true)}
        />
      </View>
      {buttonVisible && (
        <>
          <Wechat type="custom" disabled={!agree} onSuccess={loginResult} />
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipLogin}>
            <Text style={styles.skipButtonText}>稍后登录，立即体验</Text>
          </TouchableOpacity>
        </>
      )}
      <View style={{ marginTop: 30, paddingTop: 10 }}>
        {buttonVisible && <Privicy onChange={setAgree} />}
      </View>
    </View>
  );
};

export default GuideStep5;
