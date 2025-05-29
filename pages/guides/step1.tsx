import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { GuideStore } from '@/stores';
import { useNavigation, useTheme } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Typewriter from '@/components/type-writer';
import AnimatedCascade from '@/components/cascade';
import CusButton from '@/components/cus-button';

type NavigationProp = NativeStackNavigationProp<any>;

export const GuideStep1 = observer(() => {
  const navigation = useNavigation<NavigationProp>();
  const store = useLocalObservable(() => GuideStore);
  const { colors, dark } = useTheme();

  const descColor = dark ? '#999' : '#666';
  // 卡片背景色
  const cardBg = dark ? '#303133' : '#EBEEF5';
  // 选中背景色
  const selectedBg = dark ? '#007AFF20' : '#E0F2FF';
  // 选项标题选中颜色
  const optionTitleSelected = dark ? '#007AFF' : '#2563EB';
  // 选项选中边框颜色
  const optionSelectedBorder = dark ? '#007AFF' : '#2563EB';

  const addictionOptions = [
    {
      id: 'short_video',
      title: '短视频上瘾，无法自拔',
    },
    {
      id: 'game',
      title: '沉迷游戏，难以控制时间',
    },
    {
      id: 'study',
      title: '过度玩手机，影响学习',
    },
  ];

  const handleSelectAddiction = (type: string) => {
    store.setProblem(type);
  };

  const handleNext = () => {
    store.setCurrentStep('step2');
    store.setSelectedApps([]);
    navigation.navigate('Step2');
    store.createGuide();
  };

  // 打字机三行内容
  const typewriterLines = [
    '欢迎使用专注一点～',
    '我可以帮你戒掉手机瘾、提高专注力',
    '你遇到了什么问题？',
  ];
  // 记录打字机是否全部完成
  const [typewriterDone, setTypewriterDone] = useState(false);

  // 控制每个选项卡的动画（抽屉式滑入+渐显）
  const optionAnimArr = useRef(
    addictionOptions.map(() => new Animated.Value(0)),
  ).current;
  // 选项卡全部动画完成的标志
  const [optionsAllShown, setOptionsAllShown] = useState(false);
  // 控制选项卡是否可见
  const [optionsVisible, setOptionsVisible] = useState(false);
  // 控制下一步按钮的可见与动画
  const [buttonVisible, setButtonVisible] = useState(false);
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // 页面初始时不选中任何选项卡，保证用户主动选择
  useEffect(() => {
    store.setProblem(null);
  }, []);

  // 选项卡动画控制等逻辑保持不变，打字机完成后再触发选项卡动画
  useEffect(() => {
    if (typewriterDone) {
      setTimeout(() => {
        setOptionsVisible(true);
        addictionOptions.forEach((_, idx) => {
          Animated.timing(optionAnimArr[idx], {
            toValue: 1,
            duration: 400,
            delay: idx * 150,
            useNativeDriver: true,
          }).start();
        });
      }, 300);
    }
  }, [typewriterDone]);

  // 监听所有选项卡动画是否完成，最后一个动画结束后标记全部完成
  useEffect(() => {
    if (!optionsVisible) return;
    const timers = optionAnimArr.map((anim, idx) => {
      return setTimeout(() => {
        if (idx === optionAnimArr.length - 1) {
          setOptionsAllShown(true);
        }
      }, 150 * idx + 400); // 400为单个动画时长
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [optionsVisible]);

  // 只有在所有选项卡动画完成且用户选择了选项后，才显示下一步按钮
  useEffect(() => {
    if (store.problem && optionsAllShown && !buttonVisible) {
      setButtonVisible(true);
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
    // 只要未选中或动画未完成，按钮消失
    if ((!store.problem || !optionsAllShown) && buttonVisible) {
      setButtonVisible(false);
      buttonOpacity.setValue(0);
    }
  }, [store.problem, optionsAllShown]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 20,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
      marginBottom: 30,
    },
    progressStep: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: dark ? '#333' : '#E6E6E6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressStepActive: {
      backgroundColor: dark ? '#007AFF' : '#2563EB',
    },
    progressStepText: {
      color: descColor,
      fontSize: 16,
      fontWeight: '600',
    },
    progressStepTextActive: {
      color: colors.text,
    },
    progressLine: {
      width: 60,
      height: 2,
      backgroundColor: dark ? '#333' : '#E6E6E6',
      marginHorizontal: 5,
    },
    progressLineActive: {
      backgroundColor: dark ? '#007AFF' : '#2563EB',
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    question: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 24,
    },
    option: {
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderRadius: 12,
      backgroundColor: cardBg,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionSelected: {
      backgroundColor: selectedBg,
      borderColor: optionSelectedBorder,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    optionTitleSelected: {
      color: optionTitleSelected,
    },
    optionDescription: {
      fontSize: 14,
      color: descColor,
      lineHeight: 20,
    },
    optionDescriptionSelected: {
      color: optionTitleSelected,
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
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 打字机效果，完成后触发选项卡动画 */}
        <Typewriter
          lines={typewriterLines}
          speed={20}
          lineDelay={600}
          lineStyle={styles.question}
          onFinish={() => setTypewriterDone(true)}
        />
        {/* 选项卡动画包裹：用 AnimatedCascade 实现依次滑入+渐显 */}
        {optionsVisible && (
          <AnimatedCascade onFinish={() => setOptionsAllShown(true)}>
            {addictionOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                activeOpacity={optionsVisible ? 0.8 : 1}
                style={[
                  styles.option,
                  store.problem === option.id && styles.optionSelected,
                ]}
                onPress={() =>
                  optionsVisible && handleSelectAddiction(option.id)
                }
                disabled={!optionsVisible}>
                <Text
                  style={[
                    styles.optionTitle,
                    store.problem === option.id && styles.optionTitleSelected,
                  ]}>
                  {option.title}
                </Text>
                {/* <Text
                  style={[
                    styles.optionDescription,
                    store.problem === option.id &&
                      styles.optionDescriptionSelected,
                  ]}>
                  {option.description}
                </Text> */}
              </TouchableOpacity>
            ))}
          </AnimatedCascade>
        )}
      </View>
      {/* 下一步按钮动画包裹：只有选项卡全部出现且用户选择后才会淡入显示 */}
      {store.problem && (
        <CusButton
          disabled={!store.problem || !optionsAllShown}
          onPress={handleNext}
        />
      )}
    </View>
  );
});

export default GuideStep1;
