import AnimatedCascade from '@/components/cascade';
import CusButton from '@/components/cus-button';
import Typewriter from '@/components/type-writer';
import palette from '@/constants/Colors';
import { GuideStore, HomeStore } from '@/stores';
import {
  checkScreenTimePermission,
  getScreenTimePermission,
  selectAppsToLimit,
  startAppLimits,
} from '@/utils/permission';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import {
  InteractionManager,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const GuideStep2 = observer(() => {
  const store = useLocalObservable(() => HomeStore);
  const gstore = useLocalObservable(() => GuideStore);
  const step1Completed = store.vpn_init;
  const step2Completed = gstore.selected_apps.length > 0;
  const { colors, dark } = useTheme();

  // 控制步骤卡片和按钮的动画显示
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [optionsAllShown, setOptionsAllShown] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const buttonOpacity = React.useRef(
    new (require('react-native').Animated.Value)(0),
  ).current;

  // 打字机完成后再显示步骤卡片
  useEffect(() => {
    if (typewriterDone) {
      setTimeout(() => setOptionsVisible(true), 200);
    }
  }, [typewriterDone]);

  // 步骤卡片全部动画完成后再显示按钮
  useEffect(() => {
    if (optionsAllShown && step1Completed && step2Completed && !buttonVisible) {
      setButtonVisible(true);
      require('react-native')
        .Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
        .start();
    }
    if (
      (!step1Completed || !step2Completed || !optionsAllShown) &&
      buttonVisible
    ) {
      setButtonVisible(false);
      buttonOpacity.setValue(0);
    }
  }, [optionsAllShown, step1Completed, step2Completed]);

  useEffect(() => {
    store.checkVpn();
    // 等待交互完成后加载应用列表
    InteractionManager.runAfterInteractions(() => {
      if (store.all_apps.length === 0) {
        store.loadApps();
      }
    });
  }, []);

  const checkIOSPermission = async () => {
    const status = await checkScreenTimePermission();
    switch (status) {
      case 'approved':
        // 已有权限，执行功能
        break;
      case 'denied':
        // 已拒绝，提示用户手动开启
        break;
      case 'notDetermined':
        // 未决定，请求权限
        const granted = await getScreenTimePermission();
        if (granted) {
          // 成功获取权限
        }
        break;
    }
  };

  const handleStep1 = () => {
    if (Platform.OS === 'ios') {
      checkIOSPermission();
    } else {
      store.startVpn(true);
    }
  };

  const handleStep2 = () => {
    if (Platform.OS === 'ios') {
      selectAppsToLimit().then(() => {
        startAppLimits();
      });
    } else {
      router.push({
        pathname: '/apps/add',
        params: {
          mode: gstore.problem === 'study' ? 'focus' : 'shield',
        },
      });
    }
  };

  const handleNext = () => {
    if (step1Completed && step2Completed) {
      gstore.setCurrentStep('step3');
      router.push('/(guides)/step3');
      gstore.updateGuide();
    }
  };

  const getStep2Texts = () => {
    switch (gstore.problem) {
      case 'short_video':
        return [
          '我明白，短视频上瘾荒废时间精力，你想要自律',
          '我来帮你智能屏蔽短视频APP',
        ];
      case 'game':
        return [
          '我明白，游戏上瘾危害很大，你想要自控力',
          '我来帮你定时屏蔽游戏APP',
        ];
      case 'study':
        return [
          '我明白，手机影响了你的学习和专注',
          '我来帮你设置，只允许学习APP联网，其他所有APP断网',
        ];
    }
  };

  const getStep2Lables = () => {
    switch (gstore.problem) {
      case 'short_video':
        return '短视频';
      case 'game':
        return '游戏';
      case 'study':
        return '学习';
    }
  };

  // 设计色彩，适配暗色模式
  const mainColor = palette.primary;
  const mainColorLight = dark ? '#232323' : palette.primaryLight;
  const green = palette.green;
  const gray = dark ? '#444' : palette.gray;
  const cardColor = colors.card;
  const descTextColor = palette.desc;
  const borderColor = colors.border || palette.border;
  const stepTextColor = dark ? '#fff' : '#222';
  const stepIconUndoneBg = dark ? '#232323' : gray;
  const stepIconUndoneBorder = dark ? '#232323' : gray;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 20,
    },
    content: {
      flex: 1,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    typewriter: {
      marginBottom: 18,
    },
    description: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 24,
    },
    stepsContainer: {
      width: '100%',
      gap: 28,
      alignItems: 'center',
      marginBottom: 10,
    },
    step: {
      width: '100%',
      paddingVertical: 22,
      paddingHorizontal: 18,
      borderRadius: 20,
      backgroundColor: cardColor,
      borderWidth: 1,
      borderColor: borderColor,
      alignItems: 'center',
      marginBottom: 16,
      minHeight: 64,
      flexDirection: 'row',
    },
    stepCompleted: {
      backgroundColor: mainColorLight,
      borderColor: dark ? colors.primary : mainColor,
    },
    stepIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      borderWidth: 2,
    },
    stepIconDone: {
      backgroundColor: green,
      borderColor: green,
    },
    stepIconUndone: {
      backgroundColor: stepIconUndoneBg,
      borderColor: stepIconUndoneBorder,
    },
    stepIconText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
    },
    stepText: {
      fontSize: 16,
      color: stepTextColor,
      fontWeight: '600',
      flex: 1,
    },
    selectedInfo: {
      marginTop: 18,
      fontSize: 15,
      color: mainColor,
      fontWeight: '500',
      textAlign: 'left',
    },
    selectedAppsContainer: {
      marginTop: 18,
      padding: 16,
      backgroundColor: cardColor,
      borderRadius: 16,
      width: '88%',
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: borderColor,
    },
    selectedAppsTitle: {
      fontSize: 15,
      color: stepTextColor,
      marginBottom: 10,
      fontWeight: '600',
    },
    selectedApp: {
      fontSize: 14,
      color: descTextColor,
      marginBottom: 5,
    },
    nextButton: {
      backgroundColor: mainColor,
      paddingVertical: 16,
      borderRadius: 24,
      alignItems: 'center',
      marginBottom: 32,
      width: '88%',
      alignSelf: 'center',
      shadowColor: mainColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    nextButtonDisabled: {
      backgroundColor: '#E5E6EB',
    },
    nextButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Typewriter
          lines={[...getStep2Texts(), '请完成下面两个步骤～']}
          speed={22}
          firstDelay={400}
          lineDelay={600}
          lineStyle={styles.description}
          onFinish={() => setTypewriterDone(true)}
        />
        {/* 步骤卡片动画，打字机完成后再出现 */}
        {optionsVisible && (
          <AnimatedCascade
            interval={120}
            duration={400}
            distance={32}
            direction="left"
            style={{ marginTop: 30 }}
            onFinish={() => setOptionsAllShown(true)}>
            <TouchableOpacity
              style={[styles.step, step1Completed && styles.stepCompleted]}
              onPress={handleStep1}
              activeOpacity={0.8}
              disabled={step1Completed}>
              <View
                style={[
                  styles.stepIcon,
                  step1Completed ? styles.stepIconDone : styles.stepIconUndone,
                ]}>
                <Text style={styles.stepIconText}>
                  {step1Completed ? '✓' : '1'}
                </Text>
              </View>
              <Text style={styles.stepText}>获取网络屏蔽权限</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.step, step2Completed && styles.stepCompleted]}
              onPress={handleStep2}
              activeOpacity={0.8}
              disabled={step2Completed}>
              <View
                style={[
                  styles.stepIcon,
                  step2Completed ? styles.stepIconDone : styles.stepIconUndone,
                ]}>
                <Text style={styles.stepIconText}>
                  {step2Completed ? '✓' : '2'}
                </Text>
              </View>
              <Text style={styles.stepText}>选择一款{getStep2Lables()}APP</Text>
            </TouchableOpacity>
          </AnimatedCascade>
        )}
      </View>
      {/* 下一步按钮动画，所有步骤完成后再出现 */}
      {step2Completed && step1Completed && <CusButton onPress={handleNext} />}
    </View>
  );
});

export default GuideStep2;
