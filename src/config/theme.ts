import { useHomeStore } from '@/stores';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { Colors, NavThemes } from './colors';

export const useCustomTheme = () => {
  const systemColorScheme = useColorScheme();
  const them = useHomeStore(state => state.them);
  const followSystem = useHomeStore(state => state.followSystem);
  const resolvedTheme =
    followSystem && systemColorScheme
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : them;
  const isDark = resolvedTheme === 'dark';

  return {
    navigation: {
      ...(isDark ? DarkTheme : DefaultTheme),
      ...(isDark ? NavThemes.dark : NavThemes.light),
    },
    isDark,
    colors: isDark ? Colors.dark : Colors.light,
    mode: resolvedTheme,
    followSystem,
  };
};
