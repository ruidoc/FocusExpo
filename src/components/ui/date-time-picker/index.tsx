import { useCustomTheme } from '@/config/theme';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// 支持的模式
type PickerMode = 'date' | 'time' | 'datetime';

// 配置参数
interface DateTimePickerConfig {
  /** 选择模式：date | time | datetime */
  mode?: PickerMode;
  /** 初始值 */
  value?: Date;
  /** 标题 */
  title?: string;
  /** 最小日期 */
  minimumDate?: Date;
  /** 最大日期 */
  maximumDate?: Date;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
}

// 返回结果
interface DateTimePickerResult {
  action: 'confirm' | 'cancel';
  value: Date;
}

// 全局管理器
class DateTimePickerManager {
  private listeners: Set<(config: DateTimePickerConfig | null) => void> =
    new Set();
  private currentResolve: ((result: DateTimePickerResult) => void) | null =
    null;

  show(config: DateTimePickerConfig): Promise<DateTimePickerResult> {
    return new Promise(resolve => {
      this.currentResolve = resolve;
      this.listeners.forEach(listener => listener(config));
    });
  }

  hide(action: 'confirm' | 'cancel', value: Date) {
    if (this.currentResolve) {
      this.currentResolve({ action, value });
      this.currentResolve = null;
    }
    this.listeners.forEach(listener => listener(null));
  }

  subscribe(listener: (config: DateTimePickerConfig | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

const dateTimePickerManager = new DateTimePickerManager();

// 全局组件
const DateTimePickerGlobal: React.FC = () => {
  const { colors } = useCustomTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DateTimePickerConfig | null>(null);
  const [date, setDate] = useState(new Date());
  // datetime 模式下，分步骤选择
  const [step, setStep] = useState<'date' | 'time'>('date');

  // 内容滑入动画
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // 保存原始值，用于取消时返回
  const originalValueRef = useRef<Date>(new Date());

  useEffect(() => {
    const unsubscribe = dateTimePickerManager.subscribe(newConfig => {
      if (newConfig) {
        const initialValue = newConfig.value || new Date();
        setDate(initialValue);
        originalValueRef.current = initialValue;
        setConfig(newConfig);
        setStep('date');
        setVisible(true);
      }
    });
    return unsubscribe;
  }, []);

  // 显示动画
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible, slideAnim]);

  const hideWithAnimation = (callback: () => void) => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      slideAnim.setValue(SCREEN_HEIGHT);
      callback();
    });
  };

  const handleConfirm = () => {
    // datetime 模式下，第一步选完日期后进入时间选择
    if (config?.mode === 'datetime' && step === 'date') {
      setStep('time');
      return;
    }

    hideWithAnimation(() => {
      dateTimePickerManager.hide('confirm', date);
    });
  };

  const handleCancel = () => {
    hideWithAnimation(() => {
      dateTimePickerManager.hide('cancel', originalValueRef.current);
    });
  };

  const onChange = (_event: any, selectedDate?: Date) => {
    console.log('时间更新：', _event, selectedDate);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // 确定当前显示的 picker mode
  const getCurrentPickerMode = (): 'date' | 'time' => {
    if (config?.mode === 'datetime') {
      return step;
    }
    return config?.mode === 'time' ? 'time' : 'date';
  };

  // 获取标题
  const getTitle = () => {
    if (config?.title) return config.title;
    if (config?.mode === 'datetime') {
      return step === 'date' ? '选择日期' : '选择时间';
    }
    return config?.mode === 'time' ? '选择时间' : '选择日期';
  };

  // 确认按钮文字
  const getConfirmText = () => {
    if (config?.mode === 'datetime' && step === 'date') {
      return '下一步';
    }
    return config?.confirmText || '确定';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <View className="flex-1 justify-end">
        {/* 蒙层 - 点击关闭 */}
        <Pressable
          className="absolute top-0 left-0 right-0 bottom-0 bg-black/50"
          onPress={handleCancel}
        />

        {/* 内容 - 从底部滑入 */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
          }}>
          {/* 标题栏 */}
          <View
            className="flex-row items-center justify-between px-4 py-3 border-b"
            style={{ borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={handleCancel} className="py-1 px-2">
              <Text style={{ color: colors.text2, fontSize: 16 }}>
                {config?.cancelText || '取消'}
              </Text>
            </TouchableOpacity>
            <Text
              className="text-base font-medium"
              style={{ color: colors.text }}>
              {getTitle()}
            </Text>
            <TouchableOpacity onPress={handleConfirm} className="py-1 px-2">
              <Text style={{ color: colors.primary, fontSize: 16 }}>
                {getConfirmText()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Picker 内容 */}
          <View className="py-4">
            <RNDateTimePicker
              value={date}
              mode={getCurrentPickerMode()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange}
              minimumDate={config?.minimumDate}
              maximumDate={config?.maximumDate}
              style={{
                height: 260,
                backgroundColor: colors.card,
              }}
              textColor={colors.text}
            />
          </View>

          {/* datetime 模式下的步骤指示 */}
          {config?.mode === 'datetime' && (
            <View className="flex-row justify-center pb-4 gap-2">
              <View
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    step === 'date' ? colors.primary : colors.border,
                }}
              />
              <View
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    step === 'time' ? colors.primary : colors.border,
                }}
              />
            </View>
          )}

          {/* 底部安全区域 */}
          <View style={{ height: 34 }} />
        </Animated.View>
      </View>
    </Modal>
  );
};

// 导出对象
const DateTimePicker = {
  /**
   * 显示日期时间选择器
   * @param config 配置参数
   * @returns Promise<{ action: 'confirm' | 'cancel', value: Date }>
   *
   * @example
   * // 选择时间
   * const result = await DateTimePicker.show({
   *   mode: 'time',
   *   value: new Date(),
   *   title: '选择开始时间',
   * });
   * if (result.action === 'confirm') {
   *   console.log('选择的时间:', result.value);
   * }
   *
   * @example
   * // 选择日期
   * const result = await DateTimePicker.show({
   *   mode: 'date',
   *   value: new Date(),
   * });
   *
   * @example
   * // 选择日期和时间
   * const result = await DateTimePicker.show({
   *   mode: 'datetime',
   *   value: new Date(),
   * });
   */
  show: (config: DateTimePickerConfig): Promise<DateTimePickerResult> => {
    return dateTimePickerManager.show(config);
  },
  /** 全局组件，需要在 App 根组件中渲染 */
  Global: DateTimePickerGlobal,
};

export default DateTimePicker;
