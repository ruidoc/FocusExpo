/**
 * 环境切换和订阅管理界面
 */

import { Flex } from '@/components/ui';
import { useDebugStore } from '@/stores/debug';
import { getPostHogClient } from '@/utils/analytics';
import { storage } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import React, { useState } from 'react';
import Icon from '@expo/vector-icons/Ionicons';

export const EnvironmentManager = () => {
  const debugStore = useDebugStore();
  const [environment, setEnvironment] = useState(
    debugStore.getEnvironment(),
  );

  const environments = [
    { id: 'development', label: '开发', shortLabel: 'Dev' },
    { id: 'staging', label: '测试', shortLabel: 'Staging' },
    { id: 'production', label: '生产', shortLabel: 'Prod' },
  ] as const;

  const handleEnvironmentChange = (env: 'development' | 'staging' | 'production') => {
    setEnvironment(env);
    debugStore.setEnvironment(env);

    const baseURLMap = {
      development: 'https://focus.ruidoc.cn/dev-api',
      staging: 'https://focus.ruidoc.cn/staging-api',
      production: 'https://api.focusone.app',
    };

    storage.setGroup('http_base_url', baseURLMap[env]);
    Alert.alert('成功', `已切换到${env === 'development' ? '开发' : env === 'staging' ? '测试' : '生产'}环境`);
  };

  const handleCancelSubscription = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('itms-apps://apps.apple.com/account/subscriptions');
      } else {
        Alert.alert('提示', 'Android 平台请在 Google Play 商店中管理订阅');
      }
    } catch (e) {
      console.warn('打开订阅管理失败：', e);
      Alert.alert('错误', '无法打开订阅管理页面');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      {/* 环境选择 - 三个平行按钮 */}
      <View className="p-4">
        <Text className="text-sm font-medium text-gray-400 mb-3">
          环境切换
        </Text>
        <Flex className="flex-row gap-2">
          {environments.map(env => {
            const isActive = environment === env.id;
            return (
              <Pressable
                key={env.id}
                onPress={() => handleEnvironmentChange(env.id)}
                className={`flex-1 py-3 px-2 rounded-lg border ${
                  isActive
                    ? 'bg-gray-800 border-gray-600'
                    : 'bg-gray-800/50 border-gray-700'
                }`}>
                <Text
                  className={`text-center text-sm font-medium ${
                    isActive
                      ? 'text-gray-100'
                      : 'text-gray-500'
                  }`}>
                  {env.shortLabel}
                </Text>
                {isActive && (
                  <View className="absolute top-1 right-1">
                    <View className="w-2 h-2 rounded-full bg-green-500" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </Flex>
      </View>

      {/* 快捷工具 */}
      <View className="p-4 border-t border-gray-800">
        <Text className="text-sm font-medium text-gray-400 mb-3">
          快捷工具
        </Text>
        <Flex className="flex-col gap-2">
          <Pressable
            onPress={handleCancelSubscription}
            className="bg-gray-800 p-4 rounded-lg active:opacity-70 flex-row items-center justify-center gap-2 border border-gray-700">
            <Icon name="card-outline" size={18} color="#ef4444" />
            <Text className="text-red-400 font-medium">取消订阅</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const client = getPostHogClient();
              if (client) {
                client.reset();
                Alert.alert('成功', 'PostHog 用户已重置');
              } else {
                Alert.alert('提示', 'PostHog 客户端未初始化');
              }
            }}
            className="bg-gray-800 p-4 rounded-lg active:opacity-70 flex-row items-center justify-center gap-2 border border-gray-700">
            <Icon name="refresh-outline" size={18} color="#f97316" />
            <Text className="text-orange-400 font-medium">重置 PostHog 用户</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              Alert.alert('确认', '确定要清除所有本地存储吗？此操作不可恢复！', [
                { text: '取消', style: 'cancel' },
                {
                  text: '确定',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.clear();
                    Alert.alert('成功', '所有本地存储已清除');
                  },
                },
              ]);
            }}
            className="bg-gray-800 p-4 rounded-lg active:opacity-70 flex-row items-center justify-center gap-2 border border-gray-700">
            <Icon name="trash-outline" size={18} color="#ef4444" />
            <Text className="text-red-400 font-medium">清除所有本地存储</Text>
          </Pressable>
        </Flex>
      </View>
    </ScrollView>
  );
};
