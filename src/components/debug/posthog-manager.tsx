/**
 * PostHog 调试管理界面
 */

import { Flex } from '@/components/ui';
import { getPostHogClient } from '@/utils/analytics';
import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

export const PostHogManager = () => {
  const handleResetPostHogUser = () => {
    const client = getPostHogClient();
    if (client) {
      client.reset();
      Alert.alert('成功', 'PostHog 用户已重置');
    } else {
      Alert.alert('提示', 'PostHog 客户端未初始化');
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView
        className="flex-1 px-3 pt-3"
        showsVerticalScrollIndicator={false}>
        <View className="px-4 py-3">
          <Text className="text-base font-semibold text-gray-200 mb-3">
            PostHog 管理
          </Text>
          <Pressable
            onPress={handleResetPostHogUser}
            className="bg-gray-800 rounded-lg px-3 py-2.5 active:opacity-70 flex-row items-center justify-center gap-2 border border-gray-700">
            <Icon name="refresh-outline" size={16} color="#f97316" />
            <Text className="text-orange-400 text-sm font-medium">
              重置 PostHog 用户
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
