import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TextProps } from 'react-native';

interface GradientTextProps extends TextProps {
  /** 渐变颜色数组 */
  colors: string[];
  /** 渐变起点，默认 { x: 0, y: 0 } */
  start?: { x: number; y: number };
  /** 渐变终点，默认 { x: 1, y: 0 }（左右渐变） */
  end?: { x: number; y: number };
}

/**
 * 渐变文字组件
 *
 * @example
 * <GradientText
 *   colors={['#7A5AF8', '#9B7BFA', '#B794F6']}
 *   style={{ fontSize: 24, fontWeight: 'bold' }}
 * >
 *   渐变文字
 * </GradientText>
 */
const GradientText = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  children,
  ...props
}: GradientTextProps) => {
  return (
    <MaskedView
      maskElement={
        <Text {...props} style={[style, { backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }>
      <LinearGradient colors={colors} start={start} end={end}>
        <Text {...props} style={[style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
