import { useCustomTheme } from '@/config/theme';
import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface FieldItemProps {
  /**
   * 左侧图标 - 可以是图标名称（Ionicons）或自定义元素
   */
  icon?: keyof typeof Icon.glyphMap | React.ReactNode;
  /**
   * 左侧图标大小（仅在 icon 为图标名称时生效）
   * @default 20
   */
  iconSize?: number;
  /**
   * 左侧图标颜色（可选，默认使用主题色，仅在 icon 为图标名称时生效）
   */
  iconColor?: string;
  /**
   * 左侧图片（与 icon 二选一）
   */
  image?: ImageSourcePropType;
  /**
   * 左侧图片大小
   * @default 24
   */
  imageSize?: number;
  /**
   * 标题文字
   */
  title: string;
  /**
   * 标题文字样式
   */
  titleStyle?: TextStyle;
  /**
   * 标题文字 className
   */
  titleClassName?: string;
  /**
   * 右侧文字（与 rightElement 二选一）
   */
  rightText?: string;
  /**
   * 右侧文字样式
   */
  rightTextStyle?: TextStyle;
  /**
   * 右侧文字 className
   */
  rightTextClassName?: string;
  /**
   * 右侧自定义元素（与 rightText 二选一）
   */
  rightElement?: React.ReactNode;
  /**
   * 是否显示右侧箭头图标（仅在非自定义元素时生效）
   * @default true
   */
  showArrow?: boolean;
  /**
   * 箭头图标颜色（可选，默认使用主题色）
   */
  arrowColor?: string;
  /**
   * 点击事件
   */
  onPress?: () => void;
  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;
  /**
   * 是否显示底部边框（由 FieldGroup 控制）
   * @internal
   */
  showDivider?: boolean;
  /**
   * 是否是第一个子元素（由 FieldGroup 控制）
   * @internal
   */
  isFirst?: boolean;
  /**
   * 是否是最后一个子元素（由 FieldGroup 控制）
   * @internal
   */
  isLast?: boolean;
  /**
   * 分割线颜色（由 FieldGroup 控制）
   * @internal
   */
  dividerColor?: string;
  /**
   * 自定义样式
   */
  style?: ViewStyle;
  /**
   * className - 用于修饰样式，替代 padding、borderRadius 等
   * 默认包含：flex-row items-center justify-between px-4 py-[15px]
   */
  className?: string;
}

const FieldItem: React.FC<FieldItemProps> = ({
  icon,
  iconSize = 20,
  iconColor,
  image,
  imageSize = 24,
  title,
  titleStyle,
  titleClassName,
  rightText,
  rightTextStyle,
  rightTextClassName,
  rightElement,
  showArrow = true,
  arrowColor,
  onPress,
  disabled = false,
  showDivider = false,
  isFirst = false,
  isLast = false,
  dividerColor,
  style,
  className,
}) => {
  const { colors } = useCustomTheme();
  const iconCol = iconColor || colors.text;
  const arrowCol = arrowColor || colors.text;
  const dividerCol = dividerColor || colors.border;

  // 默认 className，如果没有提供则使用默认值
  const defaultClassName =
    'flex-row items-center justify-between px-4 py-[15px]';
  const itemClassName = className
    ? `${defaultClassName} ${className}`.trim()
    : defaultClassName;

  // 判断 icon 是图标名称还是自定义元素
  const isIconName = typeof icon === 'string';

  // 构建圆角 className
  const radiusClassName = isFirst
    ? isLast
      ? 'rounded-xl'
      : 'rounded-t-xl'
    : isLast
      ? 'rounded-b-xl'
      : '';

  const finalClassName = radiusClassName
    ? `${itemClassName} ${radiusClassName}`.trim()
    : itemClassName;

  const content = (
    <View
      className={finalClassName}
      style={[
        {
          borderBottomWidth: showDivider ? 0.5 : 0,
          borderBottomColor: dividerCol,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      {/* 左侧：图标/图片 + 文字 */}
      <View className="flex-row items-center flex-1 gap-1">
        {icon && (
          <>
            {isIconName ? (
              <Icon
                name={icon as keyof typeof Icon.glyphMap}
                size={iconSize}
                color={iconCol}
              />
            ) : (
              <View>{icon}</View>
            )}
          </>
        )}
        {image && (
          <Image
            source={image}
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: imageSize / 2,
            }}
            resizeMode="cover"
          />
        )}
        <Text
          className={`text-base flex-1 ${titleClassName || ''}`.trim()}
          style={[{ color: colors.text }, titleStyle]}>
          {title}
        </Text>
      </View>

      {/* 右侧：文字或自定义元素 */}
      <View className="flex-row items-center">
        {rightElement ? (
          rightElement
        ) : (
          <>
            {rightText && (
              <Text
                className={`text-base mr-2 ${rightTextClassName || ''}`.trim()}
                style={[{ color: colors.text, opacity: 0.6 }, rightTextStyle]}>
                {rightText}
              </Text>
            )}
            {showArrow && (
              <Icon name="chevron-forward" size={20} color={arrowCol} />
            )}
          </>
        )}
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        {content}
      </Pressable>
    );
  }

  return content;
};

// 添加 displayName 以便 FieldGroup 识别
FieldItem.displayName = 'FieldItem';

export default FieldItem;
