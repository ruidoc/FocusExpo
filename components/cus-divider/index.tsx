import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@react-navigation/native';

const CustomDivider = (props: ViewProps) => {
  const { dark } = useTheme();
  const dividerColor = dark ? '#232323' : '#E0E3E8';
  return (
    <View
      style={[{ height: 0.5, backgroundColor: dividerColor }, props.style]}
      {...props}
    />
  );
};

export default CustomDivider;
