import { AppStore, PlanStore, UserStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { Flex } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React from 'react';
import { Platform, Text, View } from 'react-native';

const ManageEntry: React.FC = () => {
  const ustore = useLocalObservable(() => UserStore);
  const pstore = useLocalObservable(() => PlanStore);
  const astore = useLocalObservable(() => AppStore);
  const { colors, dark } = useTheme();

  const plan_count = pstore.cus_plans.length;
  const app_count =
    Platform.OS === 'ios'
      ? astore.ios_selected_apps.length
      : astore.focus_apps.length + astore.shield_apps.length;

  const appManageBg = dark ? '#00BCD4' : '#4DD0E1';
  const taskManageBg = dark ? '#7d45e6' : '#818CF8';
  const appManageText = dark ? '#f5f5f5' : '#222';
  const taskManageText = dark ? '#f5f5f5' : '#222';
  const appCountColor = dark
    ? app_count
      ? '#777'
      : '#FF5C1F'
    : app_count
    ? '#777'
    : '#FF5C1F';
  const planCountColor = dark
    ? plan_count
      ? '#777'
      : '#FF5C1F'
    : plan_count
    ? '#777'
    : '#FF5C1F';

  const toRoute = (path: string) => {
    if (!ustore.uInfo) {
      return router.push('/login');
    }
    router.push(path as never);
  };

  if (pstore.cur_plan) return null;

  return (
    <Flex justify="between" align="center" style={{ paddingVertical: 4 }}>
      <Flex
        align="center"
        justify="center"
        onPress={() => toRoute('apps')}
        style={{
          flex: 1,
          height: 60,
          borderRadius: 10,
          marginBottom: 14,
          backgroundColor: colors.card,
        }}>
        <View
          style={{
            backgroundColor: appManageBg,
            padding: 5,
            borderRadius: 9,
            marginRight: 10,
          }}>
          <Icon name="grid-outline" size={21} color="#fff" />
        </View>
        <View>
          <Text style={{ fontSize: 15, color: appManageText }}>APP管理</Text>
          <Text style={{ fontSize: 10, color: appCountColor }}>
            {app_count ? `共 ${app_count} 个APP` : '请添加APP'}
          </Text>
        </View>
      </Flex>
      <View style={{ width: 20 }} />
      <Flex
        align="center"
        justify="center"
        onPress={() => toRoute('plans')}
        style={{
          flex: 1,
          height: 60,
          borderRadius: 10,
          marginBottom: 14,
          backgroundColor: colors.card,
        }}>
        <View
          style={{
            backgroundColor: taskManageBg,
            padding: 5,
            borderRadius: 9,
            marginRight: 10,
          }}>
          <Icon name="time-outline" size={21} color="#fff" />
        </View>
        <View>
          <Text style={{ fontSize: 15, color: taskManageText }}>定时任务</Text>
          <Text style={{ fontSize: 10, color: planCountColor }}>
            {plan_count ? `共 ${plan_count} 个任务` : '请添加任务'}
          </Text>
        </View>
      </Flex>
    </Flex>
  );
};

export default observer(ManageEntry);
