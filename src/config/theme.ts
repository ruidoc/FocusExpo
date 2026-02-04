import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { Colors, NavThemes } from './colors';

export const useCustomTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    navigation: {
      ...(isDark ? DarkTheme : DefaultTheme),
      ...(isDark ? NavThemes.dark : NavThemes.light),
    },
    isDark,
    colors: isDark ? Colors.dark : Colors.light,
  };
};
