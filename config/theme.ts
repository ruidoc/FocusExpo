import { Theme } from '@fruits-chain/react-native-xiaoshu';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { NavThemes, XiaoShuThemeOverrides } from './colors';

export const xiaoshuTheme = {
  button_l_font_size: 17,
  button_active_opacity: 0.8,
  button_l_height: 48,
  button_border_radius: 9,
};

export const useCustomTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    xiaoshu: {
      ...(isDark ? Theme.dark : Theme),
      ...(isDark ? XiaoShuThemeOverrides.dark : XiaoShuThemeOverrides.light),
      ...xiaoshuTheme,
    },
    navigation: {
      ...(isDark ? DarkTheme : DefaultTheme),
      ...(isDark ? NavThemes.dark : NavThemes.light),
    },
    isDark,
  };
};
