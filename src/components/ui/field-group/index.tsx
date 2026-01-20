import { useCustomTheme } from '@/config/theme';
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface FieldGroupProps {
  children: React.ReactNode;
  /**
   * 子元素之间是否有分割线
   * @default true
   */
  divider?: boolean;
  /**
   * 分割线颜色（可选，默认使用主题色）
   */
  dividerColor?: string;
  /**
   * 自定义样式
   */
  style?: ViewStyle;
  /**
   * className - 用于修饰样式，替代 borderRadius、marginBottom、padding、backgroundColor 等
   * 默认包含：rounded-xl mb-4 overflow-hidden
   */
  className?: string;
}

const FieldGroup: React.FC<FieldGroupProps> = ({
  children,
  divider = true,
  dividerColor,
  style,
  className,
}) => {
  const { colors } = useCustomTheme();
  const dividerCol = dividerColor || colors.border;

  // 默认 className，如果没有提供则使用默认值
  const defaultClassName = 'mb-1 overflow-hidden';
  const groupClassName = className
    ? `${defaultClassName} ${className}`.trim()
    : defaultClassName;

  // 将 children 转换为数组
  const childrenArray = React.Children.toArray(children);
  const totalChildren = childrenArray.length;

  return (
    <View
      className={groupClassName}
      style={[
        {
          backgroundColor: colors.card,
        },
        style,
      ]}>
      {React.Children.map(childrenArray, (child, index) => {
        const isFirst = index === 0;
        const isLast = index === totalChildren - 1;

        // 如果 child 是 React 元素，添加 props
        if (React.isValidElement(child)) {
          // 只对 FieldItem 类型的组件传递这些 props
          const childType =
            (child.type as any)?.displayName || (child.type as any)?.name;
          const childProps = child.props as any;
          if (childType === 'FieldItem' || childProps?.__isFieldItem) {
            return React.cloneElement(child as React.ReactElement<any>, {
              isFirst,
              isLast,
              showDivider: divider && !isLast,
              dividerColor: dividerCol,
            });
          }
        }
        return child;
      })}
    </View>
  );
};

export default FieldGroup;
