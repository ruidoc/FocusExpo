/**
 * 调试悬浮球组件
 * 在开发环境和 preview 构建中显示，production 构建中隐藏
 * 支持丝滑拖拽和边缘吸附
 */

import { APP_ENV } from '@/config/env';
import { useDebugStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const BALL_SIZE = 56;
const MARGIN = 16;
const TOP_SAFE_OFFSET = 100;
const ACTIVE_SCALE = 1.06;
const SNAP_SPRING_CONFIG = {
  stiffness: 520,
  damping: 38,
  mass: 0.7,
  overshootClamping: true as const,
};
const SCALE_SPRING_CONFIG = {
  stiffness: 420,
  damping: 28,
  mass: 0.6,
  overshootClamping: true as const,
};

const getBounds = (
  width: number,
  height: number,
  topInset: number,
  bottomInset: number,
) => {
  const left = MARGIN;
  const right = Math.max(MARGIN, width - BALL_SIZE - MARGIN);
  const top = Math.max(TOP_SAFE_OFFSET, topInset + MARGIN);
  const bottom = Math.max(top, height - BALL_SIZE - Math.max(bottomInset, MARGIN));

  return { left, right, top, bottom };
};

const getInitialPosition = (
  width: number,
  height: number,
  topInset: number,
  bottomInset: number,
) => {
  const bounds = getBounds(width, height, topInset, bottomInset);

  return {
    x: bounds.right,
    y: clamp(height * 0.7, bounds.top, bounds.bottom),
  };
};

export const DebugBall = () => {
  const showDebugBall = useDebugStore(state => state.showDebugBall);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const bounds = useMemo(
    () => getBounds(width, height, insets.top, insets.bottom),
    [height, insets.bottom, insets.top, width],
  );
  const initialPosition = useMemo(
    () => getInitialPosition(width, height, insets.top, insets.bottom),
    [height, insets.bottom, insets.top, width],
  );

  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const dragStartX = useSharedValue(initialPosition.x);
  const dragStartY = useSharedValue(initialPosition.y);
  const scale = useSharedValue(1);
  const hasDragged = useSharedValue(false);

  useEffect(() => {
    translateX.value = clamp(translateX.value, bounds.left, bounds.right);
    translateY.value = clamp(translateY.value, bounds.top, bounds.bottom);
  }, [bounds.bottom, bounds.left, bounds.right, bounds.top, translateX, translateY]);

  const openDebugPanel = () => {
    router.push('/debug');
  };

  const panGesture = Gesture.Pan()
    .minDistance(2)
    .onBegin(() => {
      dragStartX.value = translateX.value;
      dragStartY.value = translateY.value;
      hasDragged.value = false;
      scale.value = withSpring(ACTIVE_SCALE, SCALE_SPRING_CONFIG);
    })
    .onUpdate(event => {
      hasDragged.value =
        hasDragged.value ||
        Math.abs(event.translationX) > 2 ||
        Math.abs(event.translationY) > 2;

      translateX.value = clamp(
        dragStartX.value + event.translationX,
        bounds.left,
        bounds.right,
      );
      translateY.value = clamp(
        dragStartY.value + event.translationY,
        bounds.top,
        bounds.bottom,
      );
    })
    .onEnd(event => {
      const targetX =
        Math.abs(translateX.value - bounds.left) <=
        Math.abs(bounds.right - translateX.value)
          ? bounds.left
          : bounds.right;

      translateX.value = withSpring(targetX, {
        ...SNAP_SPRING_CONFIG,
        velocity: event.velocityX,
      });
      translateY.value = withSpring(
        clamp(translateY.value, bounds.top, bounds.bottom),
        {
          ...SNAP_SPRING_CONFIG,
          velocity: event.velocityY,
        },
      );
      scale.value = withSpring(1, SCALE_SPRING_CONFIG);
    })
    .onFinalize(() => {
      scale.value = withSpring(1, SCALE_SPRING_CONFIG);
    });

  const tapGesture = Gesture.Tap()
    .maxDistance(8)
    .onEnd((_event, success) => {
      if (success && !hasDragged.value) {
        runOnJS(openDebugPanel)();
      }
    });

  const gesture = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ] as ViewStyle['transform'],
  }));

  // 统一使用 APP_ENV 判断环境，避免与 Expo extra 字段出现多套口径。
  const shouldShow = APP_ENV !== 'production';
  if (!shouldShow || !showDebugBall) return null;

  return (
    <View
      pointerEvents="box-none"
      style={styles.overlay}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.ballContainer, animatedStyle]}>
          <Pressable
            className="h-14 w-14 items-center justify-center rounded-full shadow-lg active:opacity-90"
            style={{
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
            }}>
            <Icon name="bug" size={24} color="#9ca3af" />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  ballContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
