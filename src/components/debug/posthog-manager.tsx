/**
 * PostHog 实验组管理界面
 * 从PostHog动态获取所有配置的Feature Flags
 */

import { Flex } from '@/components/ui';
import { getPostHogClient, reloadFeatureFlags, ExperimentKeys } from '@/utils/analytics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';

interface ExperimentState {
  key: string; // Feature Flag key
  serverValue: any; // PostHog服务器分配的值
  localOverride: any; // 本地覆盖的值（undefined表示未覆盖）
  isEnabled: boolean; // 最终生效的值（布尔类型）
  hasOverride: boolean; // 是否被本地覆盖
  payload: any; // Feature Flag的payload值
}

export const PostHogManager = () => {
  const [experiments, setExperiments] = useState<ExperimentState[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'experiments' | 'properties'>(
    'experiments',
  );
  const [loading, setLoading] = useState(false);

  // 从PostHog加载所有Feature Flags
  const loadExperiments = async () => {
    setLoading(true);
    try {
      const client = getPostHogClient();
      if (!client) {
        console.log('[PostHog] 客户端未初始化');
        Alert.alert('提示', 'PostHog客户端未初始化\n请检查网络连接和配置');
        setExperiments([]);
        return;
      }

      console.log('[PostHog] 开始加载实验...');
      console.log('[PostHog] Client:', client);

      // 先重新加载Feature Flags（确保获取最新数据）
      console.log('[PostHog] 正在从服务器重新加载Feature Flags...');
      await client.reloadFeatureFlags();
      console.log('[PostHog] 服务器加载完成');

      // 获取本地覆盖
      const localOverrides = (client as any)._featureFlagOverrides || {};
      console.log('[PostHog] 本地覆盖:', localOverrides);

      // 获取所有Feature Flags
      const flagResult = client.getFeatureFlags();
      console.log('[PostHog] getFeatureFlags() 返回类型:', typeof flagResult);
      console.log('[PostHog] getFeatureFlags() 返回值:', JSON.stringify(flagResult, null, 2));

      // 尝试访问内部状态
      console.log('[PostHog] 内部状态 _featureFlags:', (client as any)._featureFlags);
      console.log('[PostHog] 内部状态 featureFlags:', (client as any).featureFlags);

      const experimentStates: ExperimentState[] = [];

      if (Array.isArray(flagResult)) {
        console.log('[PostHog] Feature Flags是数组格式，长度:', flagResult.length);
        // 如果返回数组（flag key列表）
        for (const key of flagResult) {
          const isEnabled = client.isFeatureEnabled(String(key)) || false;
          const payload = client.getFeatureFlagPayload(String(key));
          const hasOverride = String(key) in localOverrides;

          console.log(`[PostHog] Flag: ${key}, isEnabled: ${isEnabled}, payload:`, payload);

          experimentStates.push({
            key: String(key),
            serverValue: hasOverride ? undefined : isEnabled,
            localOverride: hasOverride ? localOverrides[String(key)] : undefined,
            isEnabled,
            hasOverride,
            payload,
          });
        }
      } else if (flagResult && typeof flagResult === 'object') {
        console.log('[PostHog] Feature Flags是对象格式');
        // 如果返回对象 {flagKey: value}
        for (const [key, value] of Object.entries(flagResult)) {
          const isEnabled = client.isFeatureEnabled(key) || false;
          const payload = client.getFeatureFlagPayload(key);
          const hasOverride = key in localOverrides;

          console.log(`[PostHog] Flag: ${key}, value: ${value}, isEnabled: ${isEnabled}`);

          experimentStates.push({
            key,
            serverValue: hasOverride ? undefined : value,
            localOverride: hasOverride ? localOverrides[key] : undefined,
            isEnabled,
            hasOverride,
            payload,
          });
        }
      } else {
        console.log('[PostHog] Feature Flags格式未知或为空');
      }

      // 添加本地覆盖但不在服务器flags中的（用户手动添加的）
      for (const [key, value] of Object.entries(localOverrides)) {
        if (!experimentStates.find(exp => exp.key === key)) {
          console.log(`[PostHog] 添加仅本地存在的Flag: ${key}`);
          experimentStates.push({
            key,
            serverValue: undefined,
            localOverride: value,
            isEnabled: Boolean(value),
            hasOverride: true,
            payload: null,
          });
        }
      }

      setExperiments(experimentStates);
      console.log('[PostHog] 最终加载了', experimentStates.length, '个实验');

      if (experimentStates.length === 0 && Object.keys(localOverrides).length === 0) {
        Alert.alert(
          '提示',
          'PostHog未返回任何Feature Flags\n\n可能原因：\n1. PostHog后台未配置Feature Flags\n2. 当前用户不在任何实验中\n3. 需要先identify用户\n4. 网络连接问题\n\n请检查控制台日志了解详情',
        );
      }
    } catch (error) {
      console.error('[PostHog] 加载实验状态失败:', error);
      Alert.alert('错误', `加载失败: ${error}`);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载用户属性
  const loadProperties = async () => {
    // PostHog React Native SDK不直接提供获取所有属性的方法
    setProperties([]);
  };

  useEffect(() => {
    loadExperiments();
    loadProperties();
  }, []);

  // 切换实验开关
  const handleToggleExperiment = async (
    experimentKey: string,
    currentEnabled: boolean,
  ) => {
    try {
      const client = getPostHogClient();
      if (!client) {
        Alert.alert('错误', 'PostHog客户端未初始化');
        return;
      }

      const newValue = !currentEnabled;
      const currentOverrides = (client as any)._featureFlagOverrides || {};

      // 设置本地覆盖
      if (client.featureFlags?.overrideFeatureFlags) {
        client.featureFlags.overrideFeatureFlags({
          ...currentOverrides,
          [experimentKey]: newValue,
        });
      } else {
        (client as any)._featureFlagOverrides = {
          ...currentOverrides,
          [experimentKey]: newValue,
        };
      }

      console.log(`[实验] ${experimentKey} 已${newValue ? '开启' : '关闭'}`);

      // 刷新实验状态（不需要reload flags，直接刷新UI）
      await loadExperiments();
    } catch (error) {
      console.error('切换实验失败:', error);
      Alert.alert('错误', '切换失败');
    }
  };

  // 重置单个实验的本地覆盖
  const handleResetExperiment = async (experimentKey: string) => {
    try {
      const client = getPostHogClient();
      if (!client) return;

      const currentOverrides = { ...(client as any)._featureFlagOverrides };
      delete currentOverrides[experimentKey];

      if (client.featureFlags?.overrideFeatureFlags) {
        client.featureFlags.overrideFeatureFlags(currentOverrides);
      } else {
        (client as any)._featureFlagOverrides = currentOverrides;
      }

      await reloadFeatureFlags();
      await loadExperiments();

      console.log(`[实验] ${experimentKey} 已重置为服务器值`);
    } catch (error) {
      console.error('重置实验失败:', error);
    }
  };

  // 重置所有实验
  const handleResetAll = () => {
    Alert.alert(
      '重置所有实验',
      '确定要清除所有本地覆盖吗？\n所有实验将恢复为PostHog服务器的分配值',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          style: 'destructive',
          onPress: async () => {
            try {
              const client = getPostHogClient();
              if (!client) return;

              // 清空所有覆盖
              if (client.featureFlags?.overrideFeatureFlags) {
                client.featureFlags.overrideFeatureFlags({});
              } else {
                (client as any)._featureFlagOverrides = {};
              }

              await reloadFeatureFlags();
              await loadExperiments();

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

  // 刷新所有数据
  const handleRefresh = async () => {
    try {
      await reloadFeatureFlags();
      await loadExperiments();
      await loadProperties();
    } catch (error) {
      console.error('刷新失败:', error);
      Alert.alert('错误', '刷新失败');
    }
  };

  const renderExperimentItem = ({ item }: { item: ExperimentState }) => {
    return (
      <View className="bg-gray-800/50 p-4 mb-3 rounded-lg border border-gray-700">
        <Flex className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-base font-semibold text-gray-200 mb-1">
              {item.key}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              {item.hasOverride && (
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
            value={item.isEnabled}
            onValueChange={() =>
              handleToggleExperiment(item.key, item.isEnabled)
            }
            trackColor={{ false: '#374151', true: '#6366f1' }}
            thumbColor={item.isEnabled ? '#8b5cf6' : '#9ca3af'}
          />
        </Flex>

        {/* 状态说明 */}
        <View className="pt-2 border-t border-gray-700">
          <Flex className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-gray-500">
                当前状态: {item.isEnabled ? '✅ 开启' : '❌ 关闭'}
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
            {item.hasOverride && (
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
            实验配置 ({experiments.length})
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
                实验开关
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
                  <Text className="text-red-400 text-sm font-medium">
                    重置全部
                  </Text>
                </Pressable>
              </Flex>
            </Flex>
            <Text className="text-xs text-gray-400">
              💡 从PostHog动态获取所有实验。打开开关=本地强制命中。
            </Text>
          </View>

          {/* 实验列表 */}
          <FlatList
            data={experiments}
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

