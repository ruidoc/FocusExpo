import Icon from '@expo/vector-icons/Ionicons';
import { Tabs, useNavigation } from 'expo-router';
import React from 'react';

// import { useColorScheme } from '@/hooks/useColorScheme';
import { toast } from '@/utils';
import { BottomTabOptions, buttonRipple } from '@/utils/config';
import { Space } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { Pressable } from 'react-native';

export default function TabLayout() {
  // const colorScheme = useColorScheme();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const toRoute = async (path: string) => {
    let res = await AsyncStorage.getItem('user_info');
    if (!res) {
      return toast('请先登录');
    }
    navigation.navigate(path as never);
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

  return (
    <Tabs screenOptions={BottomTabOptions}>
      <Tabs.Screen
        name="index"
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
}
