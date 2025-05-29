import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface AnimatedCascadeProps {
  children: React.ReactNode[];
  interval?: number; // 每个子项动画间隔(ms)
  duration?: number; // 单个动画时长(ms)
  distance?: number; // 滑入距离
  direction?: 'left' | 'right' | 'top' | 'bottom'; // 滑入方向
  style?: ViewStyle;
  onFinish?: () => void;
}

const AnimatedCascade: React.FC<AnimatedCascadeProps> = ({
  children,
  interval = 150,
  duration = 400,
  distance = 40,
  direction = 'left',
  style,
  onFinish,
}) => {
  const animArr = useRef(
    React.Children.map(children, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    React.Children.forEach(children, (_, idx) => {
      Animated.timing(animArr[idx], {
        toValue: 1,
        duration,
        delay: idx * interval,
        useNativeDriver: true,
      }).start(() => {
        if (idx === React.Children.count(children) - 1 && onFinish) {
          onFinish();
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  // 计算滑入方向
  const getTransform = (anim: Animated.Value) => {
    switch (direction) {
      case 'right':
        return [
          {
            translateX: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [distance, 0],
            }),
          },
        ];
      case 'top':
        return [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-distance, 0],
            }),
          },
        ];
      case 'bottom':
        return [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [distance, 0],
            }),
          },
        ];
      case 'left':
      default:
        return [
          {
            translateX: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-distance, 0],
            }),
          },
        ];
    }
  };

  return (
    <View
      style={[
        { width: '100%' },
        (direction === 'bottom' || direction === 'top') && {
          flexDirection: 'row',
          justifyContent: 'center',
        },
        style,
      ]}>
      {React.Children.map(children, (child, idx) => (
        <Animated.View
          key={idx}
          style={{
            opacity: animArr[idx],
            transform: getTransform(animArr[idx]),
          }}>
          {child}
        </Animated.View>
      ))}
    </View>
  );
};

export default AnimatedCascade;
