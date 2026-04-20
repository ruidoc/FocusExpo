import { useCustomTheme } from '@/config/theme';
import React from 'react';
import {
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TooltipProps {
  title: string;
  description: string;
  currentStep?: number;
  totalSteps?: number;
  onNext?: () => void;
  onClose?: () => void;
  visible: boolean;
  position?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

const Tooltip: React.FC<TooltipProps> = ({
  title,
  description,
  currentStep = 1,
  totalSteps = 5,
  onNext,
  onClose,
  visible,
  position = { top: 150, right: 20 },
}) => {
  const { colors } = useCustomTheme();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onPress={onClose}>
        <View
          style={[
            {
              position: 'absolute',
              maxWidth: 240,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
            },
            position,
          ]}>
          {/* 箭头 */}
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: 10,
              width: 14,
              height: 4,
              backgroundColor: colors.surfaceSecondary,
            }}
          />

          {/* 内容 */}
          <View style={{ padding: 16 }}>
            <View style={{ marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: colors.text,
                  marginBottom: 4,
                  lineHeight: 16,
                }}>
                {title}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '400',
                  color: colors.text2,
                  lineHeight: 16,
                }}>
                {description}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '400',
                  color: colors.text2,
                }}>
                {currentStep}/{totalSteps}
              </Text>
              {onNext && (
                <TouchableOpacity onPress={onNext}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '400',
                      color: colors.primary,
                    }}>
                    Next
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default Tooltip;
