import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ActionSheet 配置
interface ActionSheetConfig {
  actions: string[];
  cancelText?: string;
  description?: string;
}

// 全局 ActionSheet 管理器
class ActionSheetManager {
  private listeners: Set<(config: ActionSheetConfig | null) => void> = new Set();
  private currentResolve: ((index?: number) => void) | null = null;
  private currentReject: ((error?: any) => void) | null = null;

  show(config: ActionSheetConfig): Promise<number> {
    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;
      this.listeners.forEach(listener => listener(config));
    });
  }

  hide(index?: number) {
    if (index !== undefined && this.currentResolve) {
      this.currentResolve(index);
    } else if (this.currentReject) {
      this.currentReject();
    }
    this.currentResolve = null;
    this.currentReject = null;
    this.listeners.forEach(listener => listener(null));
  }

  subscribe(listener: (config: ActionSheetConfig | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

const actionSheetManager = new ActionSheetManager();

// ActionSheet 全局组件（用于静态方法）
const ActionSheetGlobal: React.FC = () => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ActionSheetConfig | null>(null);
  const slideAnim = useState(new Animated.Value(300))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsubscribe = actionSheetManager.subscribe(newConfig => {
      setConfig(newConfig);
      if (newConfig) {
        setVisible(true);
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
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
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 300,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleActionPress = (index: number) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      actionSheetManager.hide(index);
    });
  };

  const handleCancel = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      actionSheetManager.hide();
    });
  };

  if (!config) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onPress={handleCancel}>
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          }}>
          <Pressable
            className="bg-white rounded-t-[20px] overflow-hidden"
            style={{ backgroundColor: colors.card }}
            onPress={e => e.stopPropagation()}>
            {config.description && (
              <View className="px-5 pt-5 pb-3">
                <Text
                  className="text-base text-center leading-6"
                  style={{ color: colors.text }}>
                  {config.description}
                </Text>
              </View>
            )}
            <View className="px-2 py-2">
              {config.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  className="py-4 px-4 rounded-lg mb-2"
                  style={{ backgroundColor: colors.background }}
                  onPress={() => handleActionPress(index)}
                  activeOpacity={0.7}>
                  <Text
                    className="text-base text-center font-medium"
                    style={{ color: colors.primary }}>
                    {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {config.cancelText && (
              <View className="px-2 pb-4">
                <TouchableOpacity
                  className="py-4 px-4 rounded-lg"
                  style={{ backgroundColor: colors.background }}
                  onPress={handleCancel}
                  activeOpacity={0.7}>
                  <Text
                    className="text-base text-center"
                    style={{ color: colors.text }}>
                    {config.cancelText}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ActionSheet 函数
const ActionSheet = (config: ActionSheetConfig): Promise<number> => {
  return actionSheetManager.show(config);
};

// 导出 ActionSheet 对象
const ActionSheetComponent = Object.assign(ActionSheet, {
  Global: ActionSheetGlobal,
});

export default ActionSheetComponent;

