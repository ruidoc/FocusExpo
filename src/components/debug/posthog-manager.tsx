/**
 * PostHog 实验组管理界面
 */

import { Flex } from '@/components/ui';
import { getPostHogClient, setUserProperties } from '@/utils/analytics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';

interface FeatureFlag {
  key: string;
  value: any;
}

export const PostHogManager = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [properties, setProperties] = useState<FeatureFlag[]>([]);
  const [activeTab, setActiveTab] = useState<'flags' | 'properties'>('flags');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // 加载 PostHog 数据
  const loadPostHogData = async () => {
    try {
      const client = getPostHogClient();
      if (!client) {
        return;
      }

      // 获取特征开关
      const flagResult = client.getFeatureFlags();
      const flagData: FeatureFlag[] = [];

      // getFeatureFlags() 可能返回数组或对象
      if (Array.isArray(flagResult)) {
        for (const key of flagResult) {
          const value = client.getFeatureFlagPayload(key);
          flagData.push({ key: String(key), value });
        }
      } else if (flagResult && typeof flagResult === 'object') {
        for (const [key, value] of Object.entries(flagResult)) {
          flagData.push({ key, value });
        }
      }
      setFlags(flagData);

      // 获取用户属性（PostHog React Native 不直接提供获取所有用户属性的方法）
      setProperties([]);
    } catch (error) {
      console.error('加载 PostHog 数据失败:', error);
    }
  };

  useEffect(() => {
    loadPostHogData();
  }, []);

  const handleAddFlag = async () => {
    if (!newKey.trim()) {
      Alert.alert('提示', '键不能为空');
      return;
    }

    try {
      setUserProperties({ [newKey]: newValue || true });
      setNewKey('');
      setNewValue('');
      setShowAddModal(false);
      loadPostHogData();
    } catch {
      Alert.alert('错误', '添加失败');
    }
  };

  const renderFlagItem = ({ item }: { item: FeatureFlag }) => (
    <View className="bg-gray-800/50 p-3 mb-2 rounded-lg border border-gray-700">
      <Flex className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-gray-400 mb-1">
            {item.key}
          </Text>
          <Text className="text-sm text-gray-300">
            {typeof item.value === 'object'
              ? JSON.stringify(item.value, null, 2)
              : String(item.value)}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Alert.alert(
              item.key,
              typeof item.value === 'object'
                ? JSON.stringify(item.value, null, 2)
                : String(item.value),
            );
          }}
          className="p-2 active:opacity-70">
          <Icon name="eye-outline" size={18} color="#9ca3af" />
        </Pressable>
      </Flex>
    </View>
  );

  const renderPropertyItem = ({ item }: { item: FeatureFlag }) => (
    <View className="bg-gray-800/50 p-3 mb-2 rounded-lg border border-gray-700">
      <View className="flex-1">
        <Text className="text-xs font-semibold text-gray-400 mb-1">
          {item.key}
        </Text>
        <Text className="text-sm text-gray-300">
          {typeof item.value === 'object'
            ? JSON.stringify(item.value, null, 2)
            : String(item.value)}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-900">
      {/* 选项卡 */}
      <Flex className="flex-row border-b border-gray-800">
        <Pressable
          onPress={() => setActiveTab('flags')}
          className={`flex-1 py-3 ${
            activeTab === 'flags'
              ? 'border-b-2 border-gray-500'
              : 'border-b-2 border-transparent'
          }`}>
          <Text
            className={`text-center font-semibold ${
              activeTab === 'flags'
                ? 'text-gray-300'
                : 'text-gray-500'
            }`}>
            特征开关 ({flags.length})
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
              activeTab === 'properties'
                ? 'text-gray-300'
                : 'text-gray-500'
            }`}>
            用户属性 ({properties.length})
          </Text>
        </Pressable>
      </Flex>

      {activeTab === 'flags' ? (
        <>
          <Flex className="flex-row justify-between items-center px-4 py-3 border-b border-gray-800">
            <Text className="text-base font-semibold text-gray-200">
              特征开关列表
            </Text>
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-gray-800 rounded-lg active:opacity-70 flex-row items-center gap-1 border border-gray-700">
              <Icon name="add" size={16} color="#9ca3af" />
              <Text className="text-gray-300 text-sm font-medium">添加</Text>
            </Pressable>
          </Flex>
          <FlatList
            data={flags}
            renderItem={renderFlagItem}
            keyExtractor={item => item.key}
            className="flex-1 px-3 pt-2"
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-12">
                <Icon name="flask-outline" size={48} color="#6b7280" />
                <Text className="text-gray-500 mt-3">暂无特征开关</Text>
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
            keyExtractor={item => item.key}
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

      {/* 添加模态框 */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center px-4">
          <View className="flex-1 bg-black/70 justify-center">
            <View className="bg-gray-900 p-5 rounded-2xl border border-gray-800 max-w-md w-full mx-auto">
              <Text className="text-lg font-bold text-gray-100 mb-4">
                添加特征开关
              </Text>
              <TextInput
                placeholder="键 (Key)"
                value={newKey}
                onChangeText={setNewKey}
                className="bg-gray-800 text-gray-100 p-3 rounded-lg mb-3 border border-gray-700"
                placeholderTextColor="#6b7280"
                autoFocus
              />
              <TextInput
                placeholder="值 (Value)"
                value={newValue}
                onChangeText={setNewValue}
                className="bg-gray-800 text-gray-100 p-3 rounded-lg mb-4 border border-gray-700"
                placeholderTextColor="#6b7280"
              />
              <Flex className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowAddModal(false);
                    setNewKey('');
                    setNewValue('');
                  }}
                  className="flex-1 bg-gray-800 p-3 rounded-lg active:opacity-70 border border-gray-700">
                  <Text className="text-center font-semibold text-gray-300">
                    取消
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleAddFlag}
                  className="flex-1 bg-gray-700 p-3 rounded-lg active:opacity-70 border border-gray-600">
                  <Text className="text-center font-semibold text-gray-100">
                    添加
                  </Text>
                </Pressable>
              </Flex>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

