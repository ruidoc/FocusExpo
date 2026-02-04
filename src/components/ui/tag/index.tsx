import { useCustomTheme } from '@/config/theme';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface TagProps {
  children: React.ReactNode;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 's' | 'm';
}

const Tag = ({ children, color, style, textStyle, size = 's' }: TagProps) => {
  const { colors, isDark } = useCustomTheme();

  const backgroundColor = color
    ? isDark
      ? `${color}33` // 20% opacity for dark mode
      : `${color}1A` // 10% opacity for light mode
    : colors.muted;

  const textColor = color || colors.text;

  const sizeStyles = {
    s: { paddingHorizontal: 8, paddingVertical: 2, fontSize: 12 },
    m: { paddingHorizontal: 12, paddingVertical: 4, fontSize: 14 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
        style,
      ]}>
      <Text
        style={[
          styles.text,
          { color: textColor, fontSize: currentSize.fontSize },
          textStyle,
        ]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
});

export default Tag;
