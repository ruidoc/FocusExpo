import { useCustomTheme } from '@/config/theme';
import React from 'react';
import { Text, View } from 'react-native';
import { PageProps } from './type';

const Card = (props: PageProps) => {
  const { colors } = useCustomTheme();
  const cardClassName =
    `rounded-lg overflow-hidden ${props.className || ''}`.trim();

  return (
    <View className={cardClassName} style={{ backgroundColor: colors.card }}>
      <View
        className="flex-row justify-between items-center p-3.5 border-b border-[0.5px]"
        style={{ borderBottomColor: colors.border }}>
        <View>
          <Text
            className="text-[15px] font-bold mb-0.5"
            style={{ color: colors.text }}>
            {props.title}
          </Text>
          {props.desc && (
            <Text className="text-xs text-[#888]">{props.desc}</Text>
          )}
        </View>
        {props.action}
      </View>
      <View className="p-3.5">{props.children}</View>
    </View>
  );
};

export default Card;
