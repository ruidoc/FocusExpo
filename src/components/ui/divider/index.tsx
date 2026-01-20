import { useCustomTheme } from '@/config/theme';
import React from 'react';
import { View, ViewProps } from 'react-native';

const Divider = (props: ViewProps) => {
  const { isDark: dark } = useCustomTheme();
  const dividerColor = dark ? '#232323' : '#E0E3E8';
  return (
    <View
      className="h-[0.5px]"
      style={[{ backgroundColor: dividerColor }, props.style]}
      {...props}
    />
  );
};

export default Divider;
