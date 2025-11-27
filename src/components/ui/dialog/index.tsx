import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import DialogComponent from './component';

// Dialog 静态方法配置
interface DialogConfirmConfig {
  title?: string;
  message?: string;
  buttonReverse?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

type DialogAction = 'confirm' | 'cancel';

// Dialog 组件 Props
interface DialogComponentProps {
  visible?: boolean;
  title?: string;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onPressConfirm?: () => void;
  onPressCancel?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

// 全局 Dialog 管理器
class DialogManager {
  private listeners: Set<(config: DialogConfirmConfig | null) => void> = new Set();
  private currentResolve: ((action: DialogAction) => void) | null = null;

  show(config: DialogConfirmConfig): Promise<DialogAction> {
    return new Promise(resolve => {
      this.currentResolve = resolve;
      this.listeners.forEach(listener => listener(config));
    });
  }

  hide(action: DialogAction) {
    if (this.currentResolve) {
      this.currentResolve(action);
      this.currentResolve = null;
    }
    this.listeners.forEach(listener => listener(null));
  }

  subscribe(listener: (config: DialogConfirmConfig | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

const dialogManager = new DialogManager();

// Dialog 全局组件（用于静态方法）
const DialogGlobal: React.FC = () => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogConfirmConfig | null>(null);

  useEffect(() => {
    const unsubscribe = dialogManager.subscribe(newConfig => {
      setConfig(newConfig);
      setVisible(!!newConfig);
    });
    return unsubscribe;
  }, []);

  const handleConfirm = () => {
    setVisible(false);
    setTimeout(() => {
      dialogManager.hide('confirm');
    }, 200);
  };

  const handleCancel = () => {
    setVisible(false);
    setTimeout(() => {
      dialogManager.hide('cancel');
    }, 200);
  };

  if (!config) {
    return null;
  }

  const buttonOrder = config.buttonReverse ? ['cancel', 'confirm'] : ['confirm', 'cancel'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <Pressable
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onPress={handleCancel}>
        <Pressable
          className="bg-white rounded-lg overflow-hidden"
          style={{
            width: '85%',
            maxWidth: 400,
            backgroundColor: colors.card,
          }}
          onPress={e => e.stopPropagation()}>
          {config.title && (
            <View className="px-5 pt-5 pb-3">
              <Text
                className="text-lg font-semibold"
                style={{ color: colors.text }}>
                {config.title}
              </Text>
            </View>
          )}
          {config.message && (
            <View className="px-5 py-3">
              <Text className="text-base leading-6" style={{ color: colors.text }}>
                {config.message}
              </Text>
            </View>
          )}
          <View className="flex-row border-t" style={{ borderTopColor: colors.border }}>
            {buttonOrder.map((type, index) => {
              const isConfirm = type === 'confirm';
              const isLast = index === buttonOrder.length - 1;
              const buttonText = isConfirm
                ? config.confirmButtonText || '确定'
                : config.cancelButtonText || '取消';
              const onPress = isConfirm ? handleConfirm : handleCancel;

              return (
                <TouchableOpacity
                  key={type}
                  className={`flex-1 py-4 items-center ${!isLast ? 'border-r' : ''}`}
                  style={{ borderRightColor: isLast ? 'transparent' : colors.border }}
                  onPress={onPress}>
                  <Text
                    className={`text-base ${isConfirm ? 'font-medium' : ''}`}
                    style={{ color: isConfirm ? colors.primary : colors.text }}>
                    {buttonText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Dialog 组件（用于组件形式调用）
const DialogComponentWrapper: React.FC<DialogComponentProps> = props => {
  return <DialogComponent {...props} />;
};

// 导出 Dialog 对象
const Dialog = Object.assign(DialogComponentWrapper, {
  Component: DialogComponent,
  confirm: (config: DialogConfirmConfig): Promise<DialogAction> => {
    return dialogManager.show(config);
  },
  Global: DialogGlobal,
});

export default Dialog;

