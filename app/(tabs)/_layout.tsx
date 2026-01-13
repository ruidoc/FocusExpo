import { Flex } from '@/components/ui';
import { BottomTabOptions, buttonRipple } from '@/config/navigation';
import { useCustomTheme } from '@/config/theme';
import { toast } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useNavigation } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

// 左侧组件
const LeftDom = ({
  colors,
  toRoute,
}: {
  colors: any;
  toRoute: (path: string) => void;
}) => (
  <Flex className="flex-row items-center" style={{ gap: 16, paddingLeft: 16 }}>
    <Pressable onPress={() => toRoute('Guide')}>
      <Icon name="help-circle-outline" size={23} color={colors.text} />
    </Pressable>
  </Flex>
);

// 右侧组件
const RightDom = ({
  colors,
  toRoute,
}: {
  colors: any;
  toRoute: (path: string) => void;
}) => (
  <Flex className="flex-row items-center" style={{ gap: 16, paddingRight: 16 }}>
    <Pressable onPress={() => toRoute('Apps')}>
      <Icon name="grid-outline" size={19} color={colors.text} />
    </Pressable>
    <Pressable onPress={() => toRoute('Plans')}>
      <Icon name="time-outline" size={22} color={colors.text} />
    </Pressable>
  </Flex>
);

const TabLayout = () => {
  const { colors, isDark } = useCustomTheme();
  const navigation = useNavigation();

  const toRoute = async (path: string) => {
    let res = await AsyncStorage.getItem('user_info');
    if (!res) {
      return toast('请先登录');
    }
    navigation.navigate(path as never);
  };

  const tabBarStyle = {
    backgroundColor: isDark ? '#14141C' : colors.card,
    borderTopColor: isDark ? '#1C1C26' : colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  } as const;

  return (
    <Tabs screenOptions={{ ...BottomTabOptions, tabBarStyle }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '专注',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'timer' : 'timer-outline'}
              size={22}
              color={focused ? colors.primary : colors.text}
            />
          ),
          headerRight: () => <RightDom colors={colors} toRoute={toRoute} />,
          headerLeft: () => <LeftDom colors={colors} toRoute={toRoute} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '统计',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={20}
              color={focused ? colors.primary : colors.text}
            />
          ),
          headerRight: () => <RightDom colors={colors} toRoute={toRoute} />,
        }}
      />
      {/* MVP阶段暂时隐藏挑战功能 */}
      {/* <Tabs.Screen
        name="challenges"
        options={{
          title: '挑战',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'trophy' : 'trophy-outline'}
              size={20}
              color={focused ? colors.primary : colors.text}
            />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="user"
        options={{
          title: '我的',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'person' : 'person-outline'}
              size={20}
              color={focused ? colors.primary : colors.text}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
