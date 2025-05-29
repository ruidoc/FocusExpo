import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { repeats, modes } from '@/utils/static.json';
import { PressableAndroidRippleConfig } from 'react-native';

export const ScreenOptions: NativeStackNavigationOptions = {
  headerShown: true, // 显示头部组件
  headerShadowVisible: false, // 隐藏阴影
  headerLargeTitleShadowVisible: false, // 隐藏大标题阴影
  headerTitleAlign: 'center', // 标题居中
  statusBarTranslucent: true, // 状态栏沉浸
  statusBarColor: 'transparent', // 状态栏透明
  // gestureEnabled: true, // 启用手势
  // animationTypeForReplace: 'push', // 替换动画
  animation: 'fade_from_bottom', // 屏幕转换动画
  // animationDuration: 100, // 动画持续时间
  // presentation: 'modal', // 模态动画
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

export const getRepeatName = (key: string) => {
  return repeats.find(r => r.value === key)?.label || '未知';
};

export const getModeName = (key: string) => {
  return modes.find(r => r.value === key)?.label || '未知';
};
