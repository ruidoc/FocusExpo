import { useCustomTheme } from '@/config/theme';
import { Slider } from '@miblanchard/react-native-slider';
import React from 'react';
import { View, ViewStyle } from 'react-native';

export interface SliderProps {
  value: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
  // 是否使用主题颜色（默认 true）
  useThemeColors?: boolean;
  // 滑块高度（默认 4）
  trackHeight?: number;
  // 滑块圆点大小（默认 20）
  thumbSize?: number;
}

/**
 * 自定义滑块组件
 * 基于 @miblanchard/react-native-slider 二次封装
 * 支持主题适配和自定义颜色
 */
const CustomSlider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  onSlidingComplete,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  disabled = false,
  style,
  className = '',
  useThemeColors = true,
  trackHeight = 4,
  thumbSize = 20,
}) => {
  const { isDark: dark, colors } = useCustomTheme();

  // 根据主题和配置决定颜色
  const getMinimumTrackColor = () => {
    if (minimumTrackTintColor) return minimumTrackTintColor;
    if (useThemeColors) return dark ? colors.primary : '#0065FE';
    return '#0065FE';
  };

  const getMaximumTrackColor = () => {
    if (maximumTrackTintColor) return maximumTrackTintColor;
    if (useThemeColors) return dark ? '#444' : '#ccc';
    return '#ccc';
  };

  const getThumbColor = () => {
    if (thumbTintColor) return thumbTintColor;
    if (useThemeColors) return dark ? colors.primary : '#0065FE';
    return '#0065FE';
  };

  return (
    <View className={className} style={style}>
      <Slider
        value={value}
        onValueChange={(values) => {
          // @miblanchard/react-native-slider 返回数组，取第一个值
          const newValue = Array.isArray(values) ? values[0] : values;
          onValueChange?.(newValue);
        }}
        onSlidingComplete={(values) => {
          // @miblanchard/react-native-slider 返回数组，取第一个值
          const newValue = Array.isArray(values) ? values[0] : values;
          onSlidingComplete?.(newValue);
        }}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        disabled={disabled}
        minimumTrackTintColor={getMinimumTrackColor()}
        maximumTrackTintColor={getMaximumTrackColor()}
        thumbTintColor={getThumbColor()}
        trackStyle={{
          height: trackHeight,
          borderRadius: trackHeight / 2,
        }}
        thumbStyle={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumbSize / 2,
        }}
      />
    </View>
  );
};

export default CustomSlider;
