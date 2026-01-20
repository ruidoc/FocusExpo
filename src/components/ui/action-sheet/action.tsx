import { useCustomTheme } from '@/config/theme';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');
const ANIMATION_DURATION_IN = 260;
const ANIMATION_DURATION_OUT = 220;

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showIndicator?: boolean;
  showCloseButton?: boolean;
  contentStyle?: ViewStyle;
  className?: string;
  onModalHide?: () => void;
  backdropColor?: string;
  backdropOpacity?: number;
}

/**
 * 底部弹出组件 - 封装了动画效果和顶部拖动条
 * 可在任何需要底部弹出的场景中复用
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  showIndicator = true,
  showCloseButton = false,
  contentStyle,
  className = '',
  onModalHide,
  backdropColor = 'rgba(0, 0, 0, 0.6)',
  backdropOpacity = 0.6,
}) => {
  const { colors } = useCustomTheme();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState<boolean>(visible);
  const shouldAnimateInRef = useRef<boolean>(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState<boolean>(false);

  const animateIn = useCallback(() => {
    // 重置初始值，避免闪烁
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();
    fadeAnim.setValue(0);
    slideAnim.setValue(screenHeight);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_IN,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        // 使用基于物理的 spring，确保丝滑
        damping: 18,
        stiffness: 140,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animateOut = useCallback(
    (onEnd?: () => void) => {
      setIsAnimatingOut(true);
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: ANIMATION_DURATION_OUT + 60,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsAnimatingOut(false);
          onEnd && onEnd();
        }
      });
    },
    [fadeAnim, slideAnim],
  );

  // 受控挂载：visible 变为 true 先挂载再入场动画；变为 false 先退场动画再卸载
  useEffect(() => {
    if (visible) {
      if (!mounted) {
        shouldAnimateInRef.current = true;
        setMounted(true);
      } else {
        animateIn();
      }
    } else if (mounted) {
      animateOut(() => {
        setMounted(false);
        onModalHide && onModalHide();
      });
    }
  }, [visible, mounted, animateIn, animateOut, onModalHide]);

  // 当刚挂载且需要入场动画时执行
  useEffect(() => {
    if (mounted && visible && shouldAnimateInRef.current) {
      shouldAnimateInRef.current = false;
      // 等待一帧以确保 Modal 完全可见，再开始动画
      const id = requestAnimationFrame(animateIn);
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [mounted, visible, animateIn]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle={Platform.select({
        ios: 'overFullScreen',
        default: undefined,
      })}
      hardwareAccelerated
      statusBarTranslucent
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          pointerEvents={isAnimatingOut ? 'none' : 'auto'}
          className="flex-1 justify-end"
          style={[
            {
              backgroundColor: backdropColor,
              opacity: fadeAnim,
            },
          ]}>
          <TouchableWithoutFeedback>
            <Animated.View
              className={`rounded-t-[24px] overflow-hidden m-2 bg-[#121212] ${className || ''}`}
              style={[
                contentStyle,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              {/* 顶部拖动条和关闭按钮 */}
              {(showIndicator || showCloseButton) && (
                <View className="w-full relative">
                  {showIndicator && (
                    <View className="w-full items-center pt-3 pb-2">
                      <View className="w-12 h-1 rounded-full bg-white/10" />
                    </View>
                  )}
                  {showCloseButton && (
                    <TouchableOpacity
                      className="absolute top-2 right-2 w-8 h-8 items-center justify-center z-10"
                      onPress={onClose}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="close" size={20} color={colors.text || '#666'} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

