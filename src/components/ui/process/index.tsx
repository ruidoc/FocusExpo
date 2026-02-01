import { useCustomTheme } from '@/config/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

export interface ProcessProps {
  /**
   * 进度值，范围 0-1
   */
  value: number;
  /**
   * 自定义样式
   */
  style?: ViewStyle;
  /**
   * 自定义 className
   */
  className?: string;
  /**
   * 进度条高度，默认 11
   */
  height?: number;
  /**
   * 是否显示动画，默认 true
   */
  animated?: boolean;
  /**
   * 动画时长，默认 300ms
   */
  animationDuration?: number;
}

/**
 * 进度条组件
 * 显示 0-1 之间的进度值，支持动画和主题适配
 */
const Process: React.FC<ProcessProps> = ({
  value,
  style,
  className = '',
  height = 9,
  animated = true,
  animationDuration = 300,
}) => {
  const { isDark } = useCustomTheme();

  // 确保 value 在 0-1 之间
  const clampedValue = Math.max(0, Math.min(1, value));
  const progress = clampedValue * 100;

  // 创建动画值
  const progressAnim = useRef(new Animated.Value(progress)).current;

  // 当进度变化时执行动画
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated, animationDuration]);

  const borderRadius = height / 2;

  return (
    <View className={className} style={style}>
      <View
        className="overflow-hidden"
        style={{
          height,
          borderRadius,
          backgroundColor: isDark ? '#2A2A2A' : '#E6E6E6',
        }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius,
            width: progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}>
          <LinearGradient
            colors={['#9B7BFA', '#7A5AF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              borderRadius,
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default Process;
