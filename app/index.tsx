import { toast } from '@/utils';
import { BottomTabOptions, buttonRipple } from '@/utils/config';
import Icon from '@expo/vector-icons/Ionicons'; // 或者其他图标库
import { Space } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';

// const Tab = createBottomTabNavigator();

const App = () => {
  const { colors } = useTheme();

  const navigation = useNavigation();

  const initapp = async () => {};

  const toRoute = async (path: string) => {
    let res = await AsyncStorage.getItem('user_info');
    if (!res) {
      return toast('请先登录');
    }
    (navigation as any).navigate(path);
  };

  const LeftDom = () => (
    <Space direction="horizontal" align="center" gap={16} head={16}>
      <Pressable android_ripple={buttonRipple} onPress={() => toRoute('Guide')}>
        <Icon name="help-circle-outline" size={23} color={colors.text} />
      </Pressable>
    </Space>
  );

  const RightDom = () => (
    <Space direction="horizontal" align="center" gap={16} tail={16}>
      <Pressable android_ripple={buttonRipple} onPress={() => toRoute('Apps')}>
        <Icon name="grid-outline" size={19} color={colors.text} />
      </Pressable>
      <Pressable android_ripple={buttonRipple} onPress={() => toRoute('Plans')}>
        <Icon name="time-outline" size={22} color={colors.text} />
      </Pressable>
    </Space>
  );

  useEffect(() => {
    initapp();
  }, []);

  return (
    <Tabs screenOptions={BottomTabOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: '专注',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'layers' : 'layers-outline'}
              size={22}
              color={focused ? colors.primary : colors.text}
            />
          ),
          headerRight: RightDom,
          headerLeft: LeftDom,
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: '我的',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'person' : 'person-outline'}
              size={21}
              color={focused ? colors.primary : colors.text}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default App;
