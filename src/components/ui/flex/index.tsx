import React from 'react';
import { TouchableOpacity, View, ViewProps, ViewStyle } from 'react-native';

interface FlexProps extends Omit<ViewProps, 'style'> {
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
  style?: ViewStyle;
  activeOpacity?: number;
}

const Flex = ({
  children,
  onPress,
  onLongPress,
  className = '',
  style,
  activeOpacity = 0.7,
  ...rest
}: FlexProps) => {
  // 默认样式：横向布局，纵向居中
  const defaultClassName = 'flex-row items-center';

  // 合并 className，外部传入的会覆盖默认值
  const combinedClassName = className
    ? `${defaultClassName} ${className}`
    : defaultClassName;

  // 如果有 onPress，使用 Pressable，否则使用 View
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        className={combinedClassName}
        style={style}
        onLongPress={onLongPress}
        {...rest}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={combinedClassName}
      style={style}
      {...rest}>
      {children}
    </View>
  );
};

export default Flex;

