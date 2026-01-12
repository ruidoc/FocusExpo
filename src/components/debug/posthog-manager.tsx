/**
 * PostHog 实验组管理界面
 *
 * 架构说明：
 * 1. PostHog通过onFeatureFlags监听器自动将Feature Flags同步到ExperimentStore
 * 2. 此组件从ExperimentStore读取Feature Flags并展示
 * 3. 用户切换开关时，通过store方法同时更新store和PostHog的overrideFeatureFlags
 * 4. Store更新会触发组件重新渲染，业务代码使用的计算属性也会自动更新
 * 5. 重置功能可清除本地覆盖，恢复服务器原始值
 */

import { Flex } from '@/components/ui';
import { useExperimentStore } from '@/stores';
import type { FeatureFlagState } from '@/stores/experiment';
import { reloadFeatureFlags } from '@/utils/analytics';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Switch, Text, View } from 'react-native';

export const PostHogManager = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'experiments' | 'properties'>(
    'experiments',
  );
  const [loading, setLoading] = useState(false);

  // 从 ExperimentStore 读取 Feature Flags 和操作方法
  const experiment = useExperimentStore();
  // const overrideFlag = useExperimentStore(state => state.overrideFlag);
  // const resetFlag = useExperimentStore(state => state.resetFlag);
  // const resetAllFlags = useExperimentStore(state => state.resetAllFlags);

  // 加载用户属性
  const loadProperties = async () => {
    // PostHog React Native SDK不直接提供获取所有属性的方法
    setProperties([]);
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // 切换实验开关（通过 store 同时更新 store 和 PostHog）
  const handleToggleExperiment = (
    experimentKey: string,
    currentEnabled: boolean,
  ) => {
    try {
      const newValue = !currentEnabled;
      // setLoading(true);
      experiment.overrideFlag(experimentKey, newValue);
      // setTimeout(() => {
      //   setLoading(false);
      // }, 100);
      console.log(
        `[调试面板] ${experimentKey} 已${newValue ? '开启' : '关闭'}`,
      );
    } catch (error) {
      console.error('切换实验失败:', error);
      Alert.alert('错误', '切换失败');
    }
  };

  // 重置单个实验的本地覆盖（通过 store 恢复服务器值）
  const handleResetExperiment = (experimentKey: string) => {
    try {
      experiment.resetFlag(experimentKey);
      console.log(`[调试面板] ${experimentKey} 已重置为服务器值`);
    } catch (error) {
      console.error('重置实验失败:', error);
    }
  };

  // 重置所有实验（通过 store 清空所有本地覆盖）
  const handleResetAll = () => {
    Alert.alert(
      '重置所有实验',
      '确定要清除所有本地覆盖吗？\n所有实验将恢复为PostHog服务器的分配值',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          style: 'destructive',
          onPress: () => {
            try {
              experiment.resetAllFlags();
              console.log('[调试面板] 所有实验已重置');
              Alert.alert('成功', '所有实验已重置');
            } catch (error) {
              console.error('重置所有实验失败:', error);
              Alert.alert('错误', '重置失败');
            }
          },
        },
      ],
    );
  };

  // 刷新所有数据（从PostHog服务器重新加载）
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // 重新加载Feature Flags（会触发onFeatureFlags监听器，自动更新ExperimentStore）
      await reloadFeatureFlags();
      console.log('[调试面板] 刷新完成，等待Feature Flags更新...');
      await loadProperties();
    } catch (error) {
      console.error('刷新失败:', error);
      Alert.alert('错误', '刷新失败');
    } finally {
      setLoading(false);
    }
  };

  const renderExperimentItem = ({ item }: { item: FeatureFlagState }) => {
    return (
      <View className="bg-gray-800/50 p-4 mb-3 rounded-lg border border-gray-700">
        <Flex className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-base font-semibold text-gray-200 mb-1">
              {item.key}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              {item.isOverridden && (
                <View className="bg-yellow-500/20 px-2 py-0.5 rounded">
                  <Text className="text-xs text-yellow-500">本地覆盖</Text>
                </View>
              )}
              {item.payload && (
                <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                  <Text className="text-xs text-blue-400">有Payload</Text>
                </View>
              )}
            </View>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => handleToggleExperiment(item.key, item.enabled)}
            trackColor={{ false: '#374151', true: '#6366f1' }}
            thumbColor={item.enabled ? '#8b5cf6' : '#9ca3af'}
          />
        </Flex>

        {/* 状态说明 */}
        <View className="pt-2 border-t border-gray-700">
          <Flex className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-gray-500">
                当前值: {item.enabled ? 'test' : 'control'}
              </Text>
              {item.serverValue !== undefined && (
                <Text className="text-xs text-gray-500 mt-1">
                  服务器值: {String(item.serverValue)}
                </Text>
              )}
              {item.payload && (
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                  Payload:{' '}
                  {typeof item.payload === 'object'
                    ? JSON.stringify(item.payload)
                    : String(item.payload)}
                </Text>
              )}
            </View>
            {item.isOverridden && (
              <Pressable
                onPress={() => handleResetExperiment(item.key)}
                className="flex-row items-center gap-1 px-2 py-1 bg-gray-700/50 rounded active:opacity-70">
                <Icon name="refresh-outline" size={14} color="#9ca3af" />
                <Text className="text-xs text-gray-400">重置</Text>
              </Pressable>
            )}
          </Flex>
        </View>
      </View>
    );
  };

  const renderPropertyItem = ({ item }: { item: any }) => (
    <View className="bg-gray-800/50 p-3 mb-2 rounded-lg border border-gray-700">
      <Text className="text-xs font-semibold text-gray-400 mb-1">
        {item.key}
      </Text>
      <Text className="text-sm text-gray-300">{String(item.value)}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-900">
      {/* 选项卡 */}
      <Flex className="flex-row border-b border-gray-800">
        <Pressable
          onPress={() => setActiveTab('experiments')}
          className={`flex-1 py-3 ${
            activeTab === 'experiments'
              ? 'border-b-2 border-gray-500'
              : 'border-b-2 border-transparent'
          }`}>
          <Text
            className={`text-center font-semibold ${
              activeTab === 'experiments' ? 'text-gray-300' : 'text-gray-500'
            }`}>
            实验配置 ({experiment.finalFlags.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('properties')}
          className={`flex-1 py-3 ${
            activeTab === 'properties'
              ? 'border-b-2 border-gray-500'
              : 'border-b-2 border-transparent'
          }`}>
          <Text
            className={`text-center font-semibold ${
              activeTab === 'properties' ? 'text-gray-300' : 'text-gray-500'
            }`}>
            用户属性 ({properties.length})
          </Text>
        </Pressable>
      </Flex>

      {activeTab === 'experiments' ? (
        <>
          {/* 头部操作栏 */}
          <View className="px-4 py-3 border-b border-gray-800 bg-gray-800/30">
            <Flex className="flex-row justify-between items-center mb-2">
              <Text className="text-base font-semibold text-gray-200">
                实验开关 {experiment.isOnboarding ? 'true' : 'false'}
              </Text>
              <Flex className="flex-row gap-2">
                <Pressable
                  onPress={handleRefresh}
                  className="px-3 py-1.5 bg-gray-800 rounded-lg active:opacity-70 flex-row items-center gap-1 border border-gray-700">
                  <Icon name="refresh" size={16} color="#9ca3af" />
                  <Text className="text-gray-300 text-sm font-medium">
                    刷新
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleResetAll}
                  className="px-3 py-1.5 bg-gray-800 rounded-lg active:opacity-70 flex-row items-center gap-1 border border-gray-700">
                  <Icon name="trash-outline" size={16} color="#ef4444" />
                  <Text className="text-red-400 text-sm font-medium">重置</Text>
                </Pressable>
              </Flex>
            </Flex>
            <Text className="text-xs text-gray-400">
              💡 从PostHog动态获取所有实验。打开开关=本地强制命中。
            </Text>
          </View>

          {/* 实验列表 */}
          <FlatList
            data={experiment.finalFlags}
            renderItem={renderExperimentItem}
            keyExtractor={item => item.key}
            className="flex-1 px-3 pt-3"
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-12">
                <Icon name="flask-outline" size={48} color="#6b7280" />
                <Text className="text-gray-500 mt-3">
                  {loading ? '加载中...' : '暂无实验配置'}
                </Text>
                <Text className="text-xs text-gray-600 mt-2">
                  在PostHog后台创建Feature Flags
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          <View className="px-4 py-3 border-b border-gray-800">
            <Text className="text-base font-semibold text-gray-200">
              用户属性列表
            </Text>
          </View>
          <FlatList
            data={properties}
            renderItem={renderPropertyItem}
            keyExtractor={(item, index) => `${item.key}-${index}`}
            className="flex-1 px-3 pt-2"
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-12">
                <Icon name="person-outline" size={48} color="#6b7280" />
                <Text className="text-gray-500 mt-3">暂无用户属性</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
};
