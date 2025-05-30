import CusButton from '@/components/cus-button';
import Typewriter from '@/components/type-writer';
import { GuideStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import {
  RouteProp,
  useNavigation,
  useRoute,
  useTheme,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { observer, useLocalObservable } from 'mobx-react';
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type NavigationProp = NativeStackNavigationProp<any>;
type Step4RouteProp = RouteProp<{ Step4: { selectedAppName?: string } }>;

const GuideStep4 = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Step4RouteProp>();
  const gstore = useLocalObservable(() => GuideStore);
  const { colors, dark } = useTheme();

  // 获取路由参数中的应用名称
  const selectedAppName = route.params?.selectedAppName || '';
  // 存储选中的应用名称到本地状态
  const [appName] = React.useState(selectedAppName);

  React.useEffect(() => {
    if (selectedAppName) {
      gstore.setSelectedAppName(selectedAppName);
    }
  }, [selectedAppName]);

  const [typewriterDone, setTypewriterDone] = React.useState(false);
  const [buttonVisible, setButtonVisible] = React.useState(false);
  const buttonOpacity = React.useRef(
    new (require('react-native').Animated.Value)(0),
  ).current;

  // 图标弹跳动画
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  // 光晕扩散动画
  const haloScale = React.useRef(new Animated.Value(0)).current;
  const haloOpacity = React.useRef(new Animated.Value(0.5)).current;
  // 文字动画
  const textOpacity = React.useRef(new Animated.Value(0)).current;
  const textTranslateY = React.useRef(new Animated.Value(10)).current;
  // iconContainer marginTop动画
  const marginTopAnim = React.useRef(new Animated.Value(30)).current;

  const isShield = gstore.mode === 'shield';

  React.useEffect(() => {
    // 光晕扩散
    Animated.parallel([
      Animated.timing(haloScale, {
        toValue: 2.2,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
    // 图标弹跳延迟
    setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }, 400);
    // 文字渐现+上移，延迟100ms
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 900);
    // 在动画展示后，延迟1.3秒将marginTop从30%过渡到20%
    setTimeout(() => {
      Animated.timing(marginTopAnim, {
        toValue: 12,
        duration: 300,
        useNativeDriver: false, // marginTop不支持原生驱动
      }).start();
    }, 1300);
  }, []);

  React.useEffect(() => {
    if (typewriterDone && !buttonVisible) {
      setButtonVisible(true);
      require('react-native')
        .Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
        .start();
    }
    if (!typewriterDone && buttonVisible) {
      setButtonVisible(false);
      buttonOpacity.setValue(0);
    }
  }, [typewriterDone]);

  const handleNext = () => {
    navigation.navigate('step5');
  };

  const descColor = dark ? '#aaa' : '#666';
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
    iconContainer: {
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      marginTop: 8,
    },
    description: {
      fontSize: 18,
      color: colors.text,
      marginBottom: 24,
      textAlign: 'left',
      lineHeight: 24,
      fontWeight: '600',
    },
    tip: {
      fontSize: 14,
      color: descColor,
      textAlign: 'center',
      lineHeight: 20,
    },
    blockButton: {
      backgroundColor: dark ? '#007AFF' : '#3478F6',
      paddingVertical: 16,
      borderRadius: 24,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 32,
      width: '88%',
      alignSelf: 'center',
      shadowColor: '#3478F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    blockButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              marginTop: marginTopAnim.interpolate({
                inputRange: [12, 30],
                outputRange: ['12%', '30%'],
              }),
            },
          ]}>
          {/* 光晕动画层 */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 0,
              // 光晕大小和透明度
              transform: [{ scale: haloScale }],
              opacity: haloOpacity,
            }}
            pointerEvents="none">
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: '#34b54533',
              }}
            />
          </Animated.View>
          {/* 图标弹跳动画层 */}
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              zIndex: 1,
              alignItems: 'center',
            }}>
            <Icon name="checkmark-circle" size={110} color="#34b545" />
            <Animated.Text
              style={[
                styles.title,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}>
              {isShield ? '屏蔽成功' : '专注已生效'}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
        <Typewriter
          lines={[
            isShield
              ? `现在，“${appName}”的网络已被屏蔽`
              : `现在，只有“${appName}”可以正常访问网络`,
            '你可以切换APP检查验证',
            '确认之后，我们进行下一步',
          ]}
          speed={22}
          firstDelay={2000}
          lineDelay={600}
          lineStyle={styles.description}
          onFinish={() => setTypewriterDone(true)}
        />
      </View>
      {buttonVisible && <CusButton onPress={handleNext} text="我已确认" />}
    </View>
  );
};

export default observer(GuideStep4);
