import React from 'react';
import { Pressable, View, ViewProps, ViewStyle } from 'react-native';

interface FlexProps extends Omit<ViewProps, 'style'> {
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
  style?: ViewStyle;
}

const Flex = ({
  children,
  onPress,
  onLongPress,
  className = '',
  style,
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
      <Pressable
        onPress={onPress}
        className={combinedClassName}
        style={style}
        onLongPress={onLongPress}
        {...rest}>
        {children}
      </Pressable>
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

