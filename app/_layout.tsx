import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { buttonRipple, ScreenOptions } from '@/utils/config';
import Icon from '@expo/vector-icons/Ionicons';
import { Space } from '@fruits-chain/react-native-xiaoshu';
import { Pressable } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const BackIcon = () => (
    <Space direction="horizontal" align="center" gap={16}>
      <Pressable android_ripple={buttonRipple} onPress={() => router.back()}>
        <Icon name="chevron-back" size={24} color="#fff" />
      </Pressable>
    </Space>
  );

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
        <Stack.Screen name="setting/feedback" options={{ title: '意见反馈' }} />
        <Stack.Screen name="setting/about" options={{ title: '关于我们' }} />
        <Stack.Screen
          name="quick-start/index"
          options={{
            title: '快速开始',
            animation: 'fade_from_bottom',
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
