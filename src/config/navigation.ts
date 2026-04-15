import { modes, repeats } from '@/config/static.json';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { PressableAndroidRippleConfig } from 'react-native';

export const ScreenOptions: NativeStackNavigationOptions = {
  headerShown: true, // 显示头部组件
  headerShadowVisible: false, // 隐藏阴影
  headerLargeTitleShadowVisible: false, // 隐藏大标题阴影
  headerTitleAlign: 'center', // 标题居中
  statusBarTranslucent: true, // 状态栏沉浸
  headerTintColor: '#fff',
  headerBackTitle: '',
  headerBackButtonDisplayMode: 'minimal',
  headerStyle: {},
  headerTitleStyle: {
    fontSize: 18,
  },
};

export const BottomTabOptions: BottomTabNavigationOptions = {
  headerTitleAlign: 'center',
  headerTitleStyle: {
    fontSize: 18,
  },
  tabBarAllowFontScaling: true,
  tabBarLabelStyle: {
    marginBottom: 6,
    marginTop: 4,
  },
  tabBarIconStyle: {
    marginTop: 3,
  },
};

// 按钮样式
export const buttonRipple: PressableAndroidRippleConfig = {
  color: '#00000030',
  borderless: true,
  radius: 20,
  foreground: true,
};

export const getRepeatName = (key: number) => {
  return repeats.find(r => r.value === key)?.label || '未知';
};

export const getModeName = (key: string) => {
  return modes.find(r => r.value === key)?.label || '未知';
};
