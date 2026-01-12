/**
 * 调试悬浮球组件
 * 仅在开发环境下显示
 * 支持拖拽和边缘吸附
 */

import { useDebugStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BALL_SIZE = 56;
const MARGIN = 16;
const DRAG_THRESHOLD = 10; // 拖拽阈值

export const DebugBall = () => {
  const showDebugBall = useDebugStore(state => state.showDebugBall);

  const [position, setPosition] = useState({
    x: SCREEN_WIDTH - BALL_SIZE - MARGIN,
    y: SCREEN_HEIGHT * 0.7,
  });

  const pan = useRef(new Animated.ValueXY()).current;
  const isDraggingRef = useRef(false);
  const startTimeRef = useRef(0);
  const startPositionRef = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 只有移动距离超过阈值才认为是拖拽
        return (
          Math.abs(gestureState.dx) > DRAG_THRESHOLD ||
          Math.abs(gestureState.dy) > DRAG_THRESHOLD
        );
      },
      onPanResponderGrant: evt => {
        isDraggingRef.current = false;
        startTimeRef.current = Date.now();
        startPositionRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        };
        pan.setOffset({
          x: position.x,
          y: position.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        // 检查是否超过拖拽阈值
        if (
          Math.abs(gestureState.dx) > DRAG_THRESHOLD ||
          Math.abs(gestureState.dy) > DRAG_THRESHOLD
        ) {
          isDraggingRef.current = true;
        }

        // 边界限制
        const safeTop = 100;
        const safeBottom = SCREEN_HEIGHT - BALL_SIZE - MARGIN;
        const safeLeft = MARGIN;
        const safeRight = SCREEN_WIDTH - BALL_SIZE - MARGIN;

        // 限制在屏幕内，计算允许的最大偏移量
        const maxDx = safeRight - position.x;
        const minDx = safeLeft - position.x;
        const maxDy = safeBottom - position.y;
        const minDy = safeTop - position.y;

        // 限制偏移量在允许范围内
        const clampedDx = Math.max(minDx, Math.min(maxDx, gestureState.dx));
        const clampedDy = Math.max(minDy, Math.min(maxDy, gestureState.dy));

        pan.setValue({ x: clampedDx, y: clampedDy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        const moveDistance = Math.sqrt(
          gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy,
        );
        const moveTime = Date.now() - startTimeRef.current;

        // 判断是否为点击：移动距离小且时间短
        const isClick =
          !isDraggingRef.current &&
          moveDistance < DRAG_THRESHOLD &&
          moveTime < 300;

        if (isClick) {
          // 点击事件：平滑恢复到原位置
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }).start();
          isDraggingRef.current = false;
          router.push('/debug');
          return;
        }

        // 拖拽结束，计算最终位置
        const newX = position.x + gestureState.dx;
        const newY = position.y + gestureState.dy;

        // 边界限制
        const safeTop = 100;
        const safeBottom = SCREEN_HEIGHT - BALL_SIZE - MARGIN;
        const safeLeft = MARGIN;
        const safeRight = SCREEN_WIDTH - BALL_SIZE - MARGIN;

        // 限制在屏幕内
        let finalX = Math.max(safeLeft, Math.min(safeRight, newX));
        let finalY = Math.max(safeTop, Math.min(safeBottom, newY));

        // 水平边缘吸附
        const centerX = SCREEN_WIDTH / 2;
        if (finalX < centerX) {
          finalX = safeLeft; // 吸附到左边
        } else {
          finalX = safeRight; // 吸附到右边
        }

        // 计算需要移动的距离（从当前位置到最终位置）
        const deltaX = finalX - position.x;
        const deltaY = finalY - position.y;

        // 动画到最终位置（相对于起始position的偏移）
        Animated.spring(pan, {
          toValue: { x: deltaX, y: deltaY },
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }).start(() => {
          // 动画完成后，先重置pan，再更新position状态
          // 这样可以避免渲染时position和pan不同步导致的跳动
          pan.flattenOffset();
          pan.setValue({ x: 0, y: 0 });
          setPosition({ x: finalX, y: finalY });
          isDraggingRef.current = false;
        });
      },
    }),
  ).current;

  // 仅在开发环境显示，且 showDebugBall 为 true
  if (!__DEV__ || !showDebugBall) return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'box-none',
        zIndex: 9999,
      }}>
      <Animated.View
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        }}
        {...panResponder.panHandlers}>
        <Pressable
          onPress={() => {
            // 这个 onPress 作为备用，但主要逻辑在 panResponder 中处理
            if (!isDraggingRef.current) {
              router.push('/debug');
            }
          }}
          className="w-14 h-14 rounded-full justify-center items-center shadow-lg active:opacity-90"
          style={{
            backgroundColor: 'rgba(31, 41, 55, 0.9)', // gray-800 半透明暗色
          }}>
          <Icon name="bug" size={24} color="#9ca3af" />
        </Pressable>
      </Animated.View>
    </View>
  );
};
