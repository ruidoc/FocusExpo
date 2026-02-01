import { useCustomTheme } from '@/config/theme';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface ButtonProps {
  disabled?: boolean;
  onPress: () => void;
  text?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  loading?: boolean;
  loadingText?: string;
  size?: 'xl' | 'l' | 'm' | 's';
  type?: 'primary' | 'ghost' | 'custom';
  textStyle?: TextStyle;
  textClassName?: string;
}

const Button = ({
  disabled,
  onPress,
  text,
  children,
  style,
  className = '',
  loading = false,
  loadingText = '加载中...',
  size = 'l',
  type = 'primary',
  textStyle,
  textClassName = '',
}: ButtonProps) => {
  const { colors } = useCustomTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const isDisabled = disabled || loading;

  // 根据 size 设置高度和字体大小（移除 paddingVertical，使用 flex 居中）
  const sizeStyles = {
    xl: { height: 58, fontSize: 18, lineHeight: 24 },
    l: { height: 48, fontSize: 16, lineHeight: 22 },
    m: { height: 44, fontSize: 15, lineHeight: 20 },
    s: { height: 36, fontSize: 14, lineHeight: 18 },
  };

  const currentSizeStyle = sizeStyles[size];

  // 根据 type 设置样式
  const getButtonStyle = () => {
    if (type === 'ghost') {
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: isDisabled ? '#5B4A9E' : colors.primary || '#7A5AF8',
      };
    }
    return {
      backgroundColor: isDisabled ? '#3D2E7A' : colors.primary || '#7A5AF8',
    };
  };

  const getTextStyle = () => {
    if (type === 'ghost') {
      return {
        color: isDisabled ? '#5B4A9E' : colors.primary || '#7A5AF8',
      };
    }
    return {
      color: isDisabled ? 'rgba(255, 255, 255, 0.5)' : '#FFFFFF',
    };
  };

  // 确定显示的文本
  const displayText = children || text || '下一步';

  // 合并按钮的 className
  const buttonClassName =
    `flex-row justify-center items-center rounded-[30px] ${className}`.trim();

  // 合并文字的 className（不应包含按钮的 className）
  const combinedTextClassName =
    `font-bold tracking-[0.5px] bg-transparent ${textClassName}`.trim();

  return (
    <Animated.View style={[{ opacity }, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        className={buttonClassName}
        style={[
          {
            ...currentSizeStyle,
            shadowColor: '#3478F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
          },
          getButtonStyle(),
          style,
        ]}
        onPress={onPress}
        disabled={isDisabled}>
        {loading ? (
          <>
            <ActivityIndicator
              size="small"
              color={type === 'ghost' ? colors.primary : '#fff'}
              className="mr-2"
            />
            <Text
              className={combinedTextClassName}
              style={[
                {
                  fontSize: currentSizeStyle.fontSize,
                  lineHeight: currentSizeStyle.lineHeight,
                  textAlignVertical: 'center',
                },
                getTextStyle(),
                textStyle,
              ]}>
              {loadingText}
            </Text>
          </>
        ) : (
          <Text
            className={combinedTextClassName}
            style={[
              {
                fontSize: currentSizeStyle.fontSize,
                lineHeight: currentSizeStyle.lineHeight,
                textAlignVertical: 'center',
              },
              getTextStyle(),
              textStyle,
            ]}>
            {displayText}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Button;
