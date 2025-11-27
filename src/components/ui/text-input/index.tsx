import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';

interface TextInputProps
  extends Omit<RNTextInputProps, 'onChange' | 'onChangeText'> {
  type?: 'textarea' | 'text';
  rows?: number;
  placeholder?: string;
  placeholderTextColor?: string;
  value?: string;
  clearable?: boolean;
  readOnly?: boolean;
  style?: TextStyle;
  onChange?: (value: string) => void;
}

const TextInput = ({
  type,
  rows = 4,
  placeholder,
  placeholderTextColor,
  value = '',
  clearable = false,
  readOnly = false,
  style,
  onChange,
  ...rest
}: TextInputProps) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isTextarea = type === 'textarea';

  // 计算 textarea 的高度
  const textareaHeight = rows ? rows * 24 : 96; // 假设每行约 24px

  const handleChangeText = (text: string) => {
    onChange?.(text);
  };

  const handleClear = () => {
    onChange?.('');
  };

  const defaultPlaceholderColor =
    placeholderTextColor || colors.border || '#999';

  return (
    <View
      className={`relative flex-row ${isTextarea ? 'items-start' : 'items-center'}`}>
      <RNTextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={defaultPlaceholderColor}
        editable={!readOnly}
        multiline={isTextarea}
        numberOfLines={isTextarea ? rows : 1}
        style={[
          {
            flex: 1,
            fontSize: 16,
            color: colors.text,
            paddingVertical: isTextarea ? 8 : 4,
            paddingRight: clearable && value ? 30 : 0,
            minHeight: isTextarea ? textareaHeight : undefined,
            textAlignVertical: isTextarea ? 'top' : 'center',
            lineHeight: isTextarea ? 24 : undefined, // 多行文本增加行间距
          },
          style,
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChangeText={handleChangeText}
        {...rest}
      />
      {clearable && value && !readOnly && (
        <TouchableOpacity
          onPress={handleClear}
          className={`absolute right-0 p-1 ${isTextarea ? 'top-2' : ''}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}>
          <Icon name="close-circle" size={18} color={colors.border || '#999'} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TextInput;
