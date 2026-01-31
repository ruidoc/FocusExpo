/**
 * 调试页面
 */

import { EnvironmentManager } from '@/components/debug/env-manager';
import { PostHogManager } from '@/components/debug/posthog-manager';
import { StorageManager } from '@/components/debug/storage-manager';
import { Flex } from '@/components/ui';
import { useDebugStore, useExperimentStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

type Tab = 'storage' | 'posthog' | 'environment';

const DebugPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('storage');
  const setShowDebugBall = useDebugStore(state => state.setShowDebugBall);
  useExperimentStore();
  const tabs = [
    { id: 'storage' as Tab, label: 'AsyncStorage', icon: 'folder-outline' },
    { id: 'posthog' as Tab, label: 'PostHog', icon: 'flask-outline' },
    { id: 'environment' as Tab, label: '环境', icon: 'settings-outline' },
  ] as const;

  // 进入调试页面时隐藏悬浮球，离开时显示
  useEffect(() => {
    // 进入时隐藏
    setShowDebugBall(false);

    // 离开时显示
    return () => {
      setShowDebugBall(true);
    };
  }, [setShowDebugBall]);

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* 头部 */}
      <View className="px-4 py-3 border-b border-gray-800 bg-gray-900">
        <Flex className="flex-row justify-between items-center">
          <Flex className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-gray-800 justify-center items-center border border-gray-700">
              <Icon name="bug" size={18} color="#9ca3af" />
            </View>
            <Text className="text-lg font-bold text-gray-100">调试面板</Text>
          </Flex>
          <Pressable
            onPress={() => router.back()}
            className="w-8 h-8 rounded-full bg-gray-800 justify-center items-center active:opacity-70 border border-gray-700">
            <Icon name="close" size={20} color="#9ca3af" />
          </Pressable>
        </Flex>
      </View>

      {/* 快捷入口 */}
      <View className="px-4 py-3 border-b border-gray-800">
        <Pressable
          onPress={() => router.push('/test' as any)}
          className="flex-row items-center justify-between bg-gray-800 rounded-lg px-4 py-3 active:opacity-70 border border-gray-700">
          <Flex className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-gray-700 justify-center items-center">
              <Icon name="flask" size={18} color="#3B82F6" />
            </View>
            <Text className="text-base font-medium text-gray-100">
              功能测试
            </Text>
          </Flex>
          <Icon name="chevron-forward" size={20} color="#6b7280" />
        </Pressable>
      </View>

      {/* 选项卡 */}
      <View className="bg-gray-800/50 border-b border-gray-800">
        <Flex className="flex-row">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex-col items-center gap-1 ${
                  isActive
                    ? 'border-b-2 border-gray-500'
                    : 'border-b-2 border-transparent'
                }`}>
                <Icon
                  name={tab.icon as any}
                  size={20}
                  color={isActive ? '#9ca3af' : '#6b7280'}
                />
                <Text
                  className={`text-xs font-semibold ${
                    isActive ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </Flex>
      </View>

      {/* 内容区域 */}
      <View className="flex-1">
        {activeTab === 'storage' && <StorageManager />}
        {activeTab === 'posthog' && <PostHogManager />}
        {activeTab === 'environment' && <EnvironmentManager />}
      </View>
    </SafeAreaView>
  );
};

export default DebugPage;
