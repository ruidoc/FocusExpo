import { useCustomTheme } from '@/config/theme';
import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, Text, TextStyle, View } from 'react-native';

interface CheckboxIconProps {
  active?: boolean;
  size?: number;
  onPress?: () => void;
  activeColor?: string;
}

const CheckboxIcon = ({
  active = false,
  size = 20,
  onPress,
  activeColor,
}: CheckboxIconProps) => {
  const { colors } = useCustomTheme();
  const iconColor = activeColor || colors.primary;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="items-center justify-center">
      {active ? (
        <Icon name="checkmark-circle" size={size} color={iconColor} />
      ) : (
        <Icon name="ellipse-outline" size={size} color={'#FFFFFF90'} />
      )}
    </Pressable>
  );
};

// 默认 Checkbox 组件，支持 value 和 onChange
interface CheckboxProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  size?: number;
  activeColor?: string;
}

const CheckboxDefault = ({
  value = false,
  onChange,
  size = 20,
  activeColor,
}: CheckboxProps) => {
  const handlePress = () => {
    onChange?.(!value);
  };

  return (
    <CheckboxIcon
      active={value}
      size={size}
      onPress={handlePress}
      activeColor={activeColor}
    />
  );
};

interface CheckboxGroupOption {
  label: string;
  value: string;
}

interface CheckboxGroupProps {
  value?: string;
  iconSize?: number;
  checkboxLabelTextStyle?: TextStyle;
  options: CheckboxGroupOption[];
  onChange?: (value: string) => void;
}

const CheckboxGroup = ({
  value,
  iconSize = 20,
  checkboxLabelTextStyle,
  options,
  onChange,
}: CheckboxGroupProps) => {
  const { colors } = useCustomTheme();

  const handlePress = (optionValue: string) => {
    onChange?.(optionValue);
  };

  return (
    <View className="flex-col">
      {options.map((option, index) => {
        const isActive = value === option.value;
        const defaultLabelStyle: TextStyle = {
          fontSize: 15.3,
          color: colors.text,
          opacity: 0.8,
        };

        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            className={`flex-row items-center ${index !== options.length - 1 ? 'mb-3' : ''}`}>
            <CheckboxIcon
              active={isActive}
              size={iconSize}
              activeColor={colors.primary}
            />
            <Text
              className="ml-2 flex-1"
              style={[defaultLabelStyle, checkboxLabelTextStyle]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// 导出命名空间结构，保持与原组件 API 一致
const Checkbox = Object.assign(CheckboxDefault, {
  Icon: CheckboxIcon,
  Group: CheckboxGroup,
});

export default Checkbox;
