import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { buttonRipple, ScreenOptions } from '@/utils/config';
import Icon from '@expo/vector-icons/Ionicons';
import { Provider, Space, Theme } from '@fruits-chain/react-native-xiaoshu';
import { Pressable } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  let isDark = colorScheme === 'dark';

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  let UITheme: any = {
    ...(isDark ? Theme.dark : Theme),
    brand_6: '#0065FE',
    button_l_font_size: 17,
    button_active_opacity: 0.8,
    button_l_height: 48,
    button_border_radius: 9,
  };
  if (isDark) {
    UITheme.card_background_color = '#121212';
    UITheme.action_sheet_cancel_padding_color = '#222';
    UITheme.divider_color_light = '#232323';
    UITheme.steps_background_color = 'transparent';
    UITheme.notice_bar_background_color_lightness = 10;
  }

  const BackIcon = () => (
    <Space direction="horizontal" align="center" gap={16}>
      <Pressable android_ripple={buttonRipple} onPress={() => router.back()}>
        <Icon name="chevron-back" size={24} color="#fff" />
      </Pressable>
    </Space>
  );

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Provider theme={UITheme}>
        <Stack
          screenOptions={{
            ...ScreenOptions,
            headerLeft: ({ canGoBack }) => (canGoBack ? <BackIcon /> : null),
          }}>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, headerTitle: '' }}
          />
          <Stack.Screen name="(guides)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login/index"
            options={{
              title: '登录',
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="login/wx"
            options={{ title: '', headerTransparent: true }}
          />
          <Stack.Screen
            name="login/start"
            options={{ title: '', headerTransparent: true }}
          />
          <Stack.Screen
            name="login/register"
            options={{ title: '注册', headerTransparent: true }}
          />
          <Stack.Screen name="user/edit" options={{ title: '个人信息' }} />
          <Stack.Screen name="setting/index" options={{ title: '设置' }} />
          <Stack.Screen
            name="setting/permission"
            options={{ title: '权限管理' }}
          />
          <Stack.Screen
            name="setting/feedback"
            options={{ title: '意见反馈' }}
          />
          <Stack.Screen name="setting/about" options={{ title: '关于我们' }} />
          <Stack.Screen
            name="quick-start/index"
            options={{
              title: '快速开始',
              // animation: 'fade_from_bottom',
              presentation: 'modal',
            }}
          />
          <Stack.Screen name="plans/index" options={{ title: '任务面板' }} />
          <Stack.Screen name="plans/add" options={{ title: '添加任务' }} />
          <Stack.Screen name="apps/index" options={{ title: 'APP管理' }} />
          <Stack.Screen name="apps/add" options={{ title: '选择APP' }} />
          <Stack.Screen name="others/webview" options={{ title: '隐私政策' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </Provider>
    </ThemeProvider>
  );
}
