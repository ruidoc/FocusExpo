import { useCustomTheme } from '@/config/theme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BottomSheet } from './action';

// ActionSheet 配置
interface ActionSheetConfig {
  actions?: string[];
  cancelText?: string;
  description?: string;
  children?:
  | React.ReactNode
  | ((helpers: {
    onCancel: () => void;
    onActionPress: (index: number) => void;
  }) => React.ReactNode);
  actionStyle?: ViewStyle;
  cancelStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  className?: string;
  showIndicator?: boolean;
  showCloseButton?: boolean;
}

// 全局 ActionSheet 管理器
class ActionSheetManager {
  private listeners: Set<(config: ActionSheetConfig | null) => void> =
    new Set();
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

  subscribe(listener: (config: ActionSheetConfig | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

const actionSheetManager = new ActionSheetManager();

// 共享的内容渲染组件（不包含容器和顶部指示条，这些由 BottomSheet 处理）
const ActionSheetBody: React.FC<{
  config: ActionSheetConfig;
  onActionPress: (index: number) => void;
  onCancel: () => void;
  colors: any;
}> = ({ config, onActionPress, onCancel, colors }) => {
  const hasCustomContent = !!config.children;
  const hasActions = config.actions && config.actions.length > 0;

  return (
    <>
      {/* 描述文本 */}
      {config.description && (
        <View className="px-6 py-5">
          <Text
            className="text-[17px] text-center leading-6 text-white/80">
            {config.description}
          </Text>
        </View>
      )}

      {/* 自定义内容 */}
      {hasCustomContent && (
        <View className="px-4 py-5">
          {typeof config.children === 'function'
            ? config.children({ onCancel, onActionPress })
            : config.children}
        </View>
      )}

      {/* 默认操作按钮 */}
      {hasActions && (
        <View className="px-4 py-2">
          {config.actions!.map((action, index) => (
            <TouchableOpacity
              key={index}
              className="py-4 px-4 rounded-3xl bg-[#171717]"
              onPress={() => onActionPress(index)}
              activeOpacity={0.7}>
              <Text
                className="text-base text-center font-semibold"
                style={{ color: colors.primary }}>
                {action}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 取消按钮 */}
      {config.cancelText && (
        <View className="px-4 pb-6 pt-2">
          <TouchableOpacity
            className="py-4 px-4 rounded-3xl bg-[#171717]"
            onPress={onCancel}
            activeOpacity={0.7}>
            <Text
              className="text-base text-center font-medium"
              style={{ color: colors.text }}>
              {config.cancelText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

// ActionSheet Modal 组件（使用 BottomSheet 组件）
const ActionSheetModal: React.FC<{
  visible: boolean;
  config: ActionSheetConfig;
  onActionPress: (index: number) => void;
  onCancel: () => void;
  onModalHide?: () => void;
}> = ({ visible, config, onActionPress, onCancel, onModalHide }) => {
  const { colors } = useCustomTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      onModalHide={onModalHide}
      showIndicator={config.showIndicator !== false}
      showCloseButton={config.showCloseButton}
      contentStyle={config.contentStyle}
      className={config.className || ''}>
      <ActionSheetBody
        config={config}
        onActionPress={onActionPress}
        onCancel={onCancel}
        colors={colors}
      />
    </BottomSheet>
  );
};

// ActionSheet 全局组件（用于静态方法）
const ActionSheetGlobal: React.FC = () => {
  const [config, setConfig] = useState<ActionSheetConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const pendingActionIndexRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = actionSheetManager.subscribe(newConfig => {
      setConfig(newConfig);
      setVisible(!!newConfig);
      pendingActionIndexRef.current = undefined;
    });
    return unsubscribe;
  }, []);

  const handleActionPress = useCallback((index: number) => {
    // 保存 index，等待动画完成后再使用
    pendingActionIndexRef.current = index;
    // 先触发退出动画
    setVisible(false);
  }, []);

  const handleCancel = useCallback(() => {
    // 清除 pendingActionIndex，表示是取消操作
    pendingActionIndexRef.current = undefined;
    // 先触发退出动画
    setVisible(false);
  }, []);

  const handleModalHide = useCallback(() => {
    // 动画完成后，根据 pendingActionIndex 调用相应的 hide
    if (pendingActionIndexRef.current !== undefined) {
      actionSheetManager.hide(pendingActionIndexRef.current);
    } else {
      actionSheetManager.hide();
    }
    setConfig(null);
    setVisible(false);
    pendingActionIndexRef.current = undefined;
  }, []);

  if (!config) return null;

  return (
    <ActionSheetModal
      visible={visible}
      config={config}
      onActionPress={handleActionPress}
      onCancel={handleCancel}
      onModalHide={handleModalHide}
    />
  );
};

// ActionSheet 函数（静态方法）
const ActionSheet = (config: ActionSheetConfig): Promise<number> => {
  return actionSheetManager.show(config);
};

// ActionSheet 组件（可自定义内容）
interface ActionSheetComponentProps {
  visible: boolean;
  onClose: () => void;
  onActionPress?: (index: number) => void;
  actions?: string[];
  cancelText?: string;
  description?: string;
  children?:
  | React.ReactNode
  | ((helpers: {
    onCancel: () => void;
    onActionPress: (index: number) => void;
  }) => React.ReactNode);
  actionStyle?: ViewStyle;
  cancelStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  className?: string;
  showIndicator?: boolean;
  showCloseButton?: boolean;
}

const ActionSheetComponent: React.FC<ActionSheetComponentProps> = ({
  visible,
  onClose,
  onActionPress,
  actions = [],
  cancelText,
  description,
  children,
  actionStyle,
  cancelStyle,
  contentStyle,
  className = '',
  showIndicator = true,
  showCloseButton = false,
}) => {
  const handleActionPress = useCallback(
    (index: number) => {
      onActionPress?.(index);
      onClose();
    },
    [onActionPress, onClose],
  );

  const config: ActionSheetConfig = {
    actions,
    cancelText,
    description,
    children:
      typeof children === 'function'
        ? (helpers: {
          onCancel: () => void;
          onActionPress: (index: number) => void;
        }) => {
          const childFn = children as unknown as (helpers: {
            onClose: () => void;
            onActionPress: (index: number) => void;
          }) => React.ReactNode;
          return childFn({
            onClose: helpers.onCancel,
            onActionPress: helpers.onActionPress,
          });
        }
        : children,
    actionStyle,
    cancelStyle,
    contentStyle,
    className,
    showIndicator,
    showCloseButton,
  };

  return (
    <ActionSheetModal
      visible={visible}
      config={config}
      onActionPress={handleActionPress}
      onCancel={onClose}
    />
  );
};

// 导出 ActionSheet 对象
const ActionSheetExport = Object.assign(ActionSheet, {
  Global: ActionSheetGlobal,
  Component: ActionSheetComponent,
});

export default ActionSheetExport;
export { BottomSheet } from './action';
export { ActionSheetComponent };

