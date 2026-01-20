import { useCustomTheme } from '@/config/theme';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';

interface ToastConfig {
  message?: string;
  position?: 'top' | 'bottom' | 'center';
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'loading';
  forbidPress?: boolean;
}

type ToastMessage = string | ToastConfig;

// Toast 管理器
class ToastManager {
  private listeners: Set<(config: ToastConfig | null) => void> = new Set();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private currentConfig: ToastConfig | null = null;

  show(messageOrConfig: ToastMessage) {
    const config: ToastConfig =
      typeof messageOrConfig === 'string'
        ? { message: messageOrConfig }
        : messageOrConfig;

    this.currentConfig = config;

    // 清除之前的定时器
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // 通知所有监听者
    this.listeners.forEach(listener => listener(config));

    // 自动隐藏（duration 为 0 表示不自动隐藏）
    const duration = config.duration ?? 2000;
    if (duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  hide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.currentConfig = null;
    this.listeners.forEach(listener => listener(null));
  }

  subscribe(listener: (config: ToastConfig | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

const toastManager = new ToastManager();

// Toast 全局组件
const ToastGlobal: React.FC = () => {
  const { colors } = useCustomTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(newConfig => {
      if (newConfig) {
        setConfig(newConfig);
        setVisible(true);
        // 显示动画
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // 隐藏动画
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
          setConfig(null);
        });
      }
    });
    return unsubscribe;
  }, [slideAnim, opacityAnim]);

  if (!visible || !config || !config.message) {
    return null;
  }

  const position = config.position || 'top';
  const type = config.type || 'info';

  // 根据位置计算 translateY
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange:
      position === 'top'
        ? [-100, 60]
        : position === 'bottom'
          ? [100, -60]
          : [0, 0],
  });

  // 根据类型选择图标和颜色
  const getIconAndColor = (): {
    icon: keyof typeof Icon.glyphMap;
    color: string;
    bgColor: string;
  } => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#16A34A',
          bgColor: 'rgba(22, 163, 74, 0.1)',
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
        };
      case 'loading':
        return {
          icon: 'hourglass',
          color: colors.primary || '#7A5AF8',
          bgColor: 'rgba(122, 90, 248, 0.1)',
        };
      default:
        return {
          icon: 'information-circle',
          color: colors.primary || '#7A5AF8',
          bgColor: 'rgba(122, 90, 248, 0.1)',
        };
    }
  };

  const { icon, color } = getIconAndColor();
  const isLoading = type === 'loading';

  return (
    <View
      className="absolute left-0 right-0 z-50"
      style={{
        top: position === 'top' ? 0 : undefined,
        bottom: position === 'bottom' ? 0 : undefined,
        justifyContent: position === 'center' ? 'center' : 'flex-start',
        alignItems: 'center',
        pointerEvents: 'box-none',
      }}>
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity: opacityAnim,
        }}>
        <View
          className="flex-row items-center px-4 py-3 rounded-lg mx-4 shadow-lg"
          style={{
            backgroundColor: colors.card || '#FFFFFF',
            minWidth: 120,
            maxWidth: '90%',
          }}>
          {isLoading ? (
            <View className="mr-2">
              <Icon name={icon} size={20} color={color} />
            </View>
          ) : (
            <Icon name={icon} size={20} color={color} />
          )}
          <Text
            className="ml-2 text-sm"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ 
              color: colors.text,
              flexShrink: 1,
              maxWidth: Dimensions.get('window').width * 0.7,
            }}>
            {config.message}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

// Toast 函数（兼容 xiaoshu Toast API）
const Toast = (messageOrConfig: ToastMessage, type: 'info' | 'error' | 'success' | 'loading' = 'info') => {
  const config: ToastConfig =
    typeof messageOrConfig === 'string'
      ? { message: messageOrConfig, type }
      : { ...messageOrConfig, type: messageOrConfig.type ?? type };

  toastManager.show(config);
};

// Toast.loading 方法（返回 close 函数）
Toast.loading = (config: ToastConfig) => {
  toastManager.show({
    ...config,
    type: 'loading',
    duration: config.duration ?? 0, // 默认不自动关闭
  });
  return {
    close: () => {
      toastManager.hide();
    },
  };
};

// 导出 Toast 对象
const ToastComponent = Object.assign(Toast, {
  Global: ToastGlobal,
  show: Toast,
  loading: Toast.loading,
});

export default ToastComponent;
