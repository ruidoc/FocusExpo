import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Switch as RNSwitch } from 'react-native';

interface SwitchProps {
  value?: boolean;
  disabled?: boolean;
  size?: number;
  onChange?: (value: boolean) => void;
}

const Switch = ({
  value = false,
  disabled = false,
  size = 20,
  onChange,
}: SwitchProps) => {
  const { colors } = useTheme();

  // React Native Switch 的 trackColor 和 thumbColor 配置
  // iOS 和 Android 的样式配置不同
  const trackColor = {
    false: colors.border || '#E5E6EB',
    true: colors.primary || '#7A5AF8',
  };

  // thumbColor 主要用于 Android
  const thumbColor = value ? '#FFFFFF' : disabled ? '#F5F5F5' : '#FFFFFF';

  // iOS 的 tintColor（未选中时的背景色）
  const iosBackgroundColor = colors.border || '#E5E6EB';

  const handleValueChange = (newValue: boolean) => {
    if (!disabled && onChange) {
      onChange(newValue);
    }
  };

  return (
    <RNSwitch
      value={value}
      disabled={disabled}
      onValueChange={handleValueChange}
      trackColor={trackColor}
      thumbColor={thumbColor}
      ios_backgroundColor={iosBackgroundColor}
      // 注意：React Native Switch 的 size 属性在 iOS 上不支持自定义
      // 如果需要自定义大小，需要使用 transform scale 或其他方案
      style={
        size !== 20
          ? {
              transform: [{ scaleX: size / 20 }, { scaleY: size / 20 }],
            }
          : undefined
      }
    />
  );
};

export default Switch;
