/**
 * AsyncStorage 管理界面
 */

import { Flex } from '@/components/ui';
import Icon from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface StorageItem {
  key: string;
  value: string;
}

export const StorageManager = () => {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载所有存储数据
  const loadStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      setItems(items.map(([key, value]) => ({ key, value: value || '' })));
    } catch {
      Alert.alert('错误', '加载存储数据失败');
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const filteredItems = items.filter(item =>
    item.key.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (key: string) => {
    Alert.alert('删除确认', `确定要删除 ${key} 吗?`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(key);
          loadStorage();
        },
      },
    ]);
  };

  const handleSave = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      setEditingKey(null);
      loadStorage();
    } catch {
      Alert.alert('错误', '保存失败');
    }
  };

  const handleAddNew = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      Alert.alert('提示', '键和值都不能为空');
      return;
    }
    try {
      await AsyncStorage.setItem(newKey, newValue);
      setNewKey('');
      setNewValue('');
      setShowAddModal(false);
      loadStorage();
    } catch {
      Alert.alert('错误', '添加失败');
    }
  };

  const renderItem = ({ item }: { item: StorageItem }) => {
    const isEditing = editingKey === item.key;

    return (
      <View className="bg-gray-800/50 p-3 mb-2 rounded-lg border border-gray-700">
        <Flex className="flex-row justify-between items-start gap-2">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-400 mb-1">
              {item.key}
            </Text>
            {isEditing ? (
              <TextInput
                value={editingValue}
                onChangeText={setEditingValue}
                multiline
                className="bg-gray-800 text-gray-100 p-2 rounded text-sm border border-gray-700"
                placeholderTextColor="#6b7280"
              />
            ) : (
              <Text className="text-sm text-gray-300" numberOfLines={3}>
                {item.value.length > 100
                  ? `${item.value.substring(0, 100)}...`
                  : item.value}
              </Text>
            )}
          </View>
          <Flex className="flex-row gap-1">
            {isEditing ? (
              <>
                <Pressable
                  onPress={() => handleSave(item.key, editingValue)}
                  className="p-2 active:opacity-70">
                  <Icon name="checkmark-circle" size={20} color="#10b981" />
                </Pressable>
                <Pressable
                  onPress={() => setEditingKey(null)}
                  className="p-2 active:opacity-70">
                  <Icon name="close-circle" size={20} color="#ef4444" />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    setEditingKey(item.key);
                    setEditingValue(item.value);
                  }}
                  className="p-2 active:opacity-70">
                  <Icon name="create-outline" size={18} color="#9ca3af" />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(item.key)}
                  className="p-2 active:opacity-70">
                  <Icon name="trash-outline" size={18} color="#ef4444" />
                </Pressable>
              </>
            )}
          </Flex>
        </Flex>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* 搜索栏 */}
      <View className="p-3 border-b border-gray-800">
        <View className="flex-row items-center bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
          <Icon name="search" size={18} color="#6b7280" />
          <TextInput
            placeholder="搜索键名..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-gray-100"
            placeholderTextColor="#6b7280"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color="#6b7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 头部 */}
      <Flex className="flex-row justify-between items-center px-4 py-3 border-b border-gray-800">
        <Text className="text-base font-semibold text-gray-200">
          存储项 ({filteredItems.length})
        </Text>
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-gray-800 rounded-lg active:opacity-70 flex-row items-center gap-1 border border-gray-700">
          <Icon name="add" size={16} color="#9ca3af" />
          <Text className="text-gray-300 text-sm font-medium">添加</Text>
        </Pressable>
      </Flex>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        className="flex-1 px-3 pt-2"
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-12">
            <Icon name="folder-open-outline" size={48} color="#6b7280" />
            <Text className="text-gray-500 mt-3">
              {searchQuery ? '未找到匹配项' : '暂无存储数据'}
            </Text>
          </View>
        }
      />

      {/* 添加新项模态框 */}
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
                添加新项
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
                multiline
                numberOfLines={4}
                className="bg-gray-800 text-gray-100 p-3 rounded-lg mb-4 border border-gray-700"
                placeholderTextColor="#6b7280"
              />
              <Flex className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-800 p-3 rounded-lg active:opacity-70 border border-gray-700">
                  <Text className="text-center font-semibold text-gray-300">
                    取消
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleAddNew}
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
