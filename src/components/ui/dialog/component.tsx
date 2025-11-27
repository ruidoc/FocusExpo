import { useTheme } from '@react-navigation/native';
import React from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

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

const DialogComponent = ({
  visible = false,
  title,
  showCancelButton = false,
  confirmButtonText = '确定',
  cancelButtonText = '取消',
  onPressConfirm,
  onPressCancel,
  children,
  style,
}: DialogComponentProps) => {
  const { colors } = useTheme();

  const handleConfirm = () => {
    onPressConfirm?.();
  };

  const handleCancel = () => {
    onPressCancel?.();
  };

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
          style={[
            {
              width: '85%',
              maxWidth: 400,
              backgroundColor: colors.card,
            },
            style,
          ]}
          onPress={e => e.stopPropagation()}>
          {title && (
            <View className="px-5 pt-5 pb-3">
              <Text
                className="text-lg font-semibold"
                style={{ color: colors.text }}>
                {title}
              </Text>
            </View>
          )}
          {children && (
            <View className="px-5 py-3">
              {typeof children === 'string' ? (
                <Text className="text-base leading-6" style={{ color: colors.text }}>
                  {children}
                </Text>
              ) : (
                children
              )}
            </View>
          )}
          <View className="flex-row border-t" style={{ borderTopColor: colors.border }}>
            {showCancelButton && (
              <TouchableOpacity
                className="flex-1 py-4 items-center border-r"
                style={{ borderRightColor: colors.border }}
                onPress={handleCancel}>
                <Text className="text-base" style={{ color: colors.text }}>
                  {cancelButtonText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className={`py-4 items-center ${showCancelButton ? 'flex-1' : 'flex-1'}`}
              onPress={handleConfirm}>
              <Text
                className="text-base font-medium"
                style={{ color: colors.primary }}>
                {confirmButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default DialogComponent;

