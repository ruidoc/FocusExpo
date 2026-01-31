/**
 * MMKV 存储管理界面
 */

import { Flex } from '@/components/ui';
import { storage } from '@/utils/storage';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

interface MMKVItem {
  key: string;
  value: any;
  type: string;
  displayValue: string;
}

export const MMKVManager = () => {
  const [items, setItems] = useState<MMKVItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MMKVItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 加载所有 MMKV 数据
  const loadStorage = useCallback(() => {
    try {
      const keys = storage.getAllKeys();
      const loadedItems: MMKVItem[] = keys.map(key => {
        const { value, type } = storage.getRawValue(key);
        let displayValue: string;

        if (type === 'object') {
          displayValue = JSON.stringify(value, null, 2);
        } else if (value === undefined) {
          displayValue = 'undefined';
        } else {
          displayValue = String(value);
        }

        return { key, value, type, displayValue };
      });

      // 按键名排序
      loadedItems.sort((a, b) => a.key.localeCompare(b.key));
      setItems(loadedItems);
    } catch (error) {
      console.error('加载 MMKV 数据失败:', error);
      Alert.alert('错误', '加载 MMKV 数据失败');
    }
  }, []);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  const filteredItems = items.filter(item =>
    item.key.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (key: string) => {
    Alert.alert('删除确认', `确定要删除 "${key}" 吗?`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          storage.delete(key);
          loadStorage();
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      '清空所有数据',
      '此操作不可恢复，确定要清空所有 MMKV 数据吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: () => {
            storage.clearAll();
            loadStorage();
          },
        },
      ],
    );
  };

  const handleViewDetail = (item: MMKVItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return '#22c55e'; // green
      case 'number':
        return '#3b82f6'; // blue
      case 'boolean':
        return '#f59e0b'; // amber
      case 'object':
        return '#a855f7'; // purple
      default:
        return '#6b7280'; // gray
    }
  };

  const renderItem = ({ item }: { item: MMKVItem }) => {
    const truncatedValue =
      item.displayValue.length > 80
        ? `${item.displayValue.substring(0, 80)}...`
        : item.displayValue;

    return (
      <Pressable
        onPress={() => handleViewDetail(item)}
        className="bg-gray-800/50 p-3 mb-2 rounded-lg border border-gray-700 active:opacity-70">
        <Flex className="flex-row justify-between items-start gap-2">
          <View className="flex-1">
            <Flex className="flex-row items-center gap-2 mb-1">
              <Text className="text-xs font-semibold text-gray-400 flex-1">
                {item.key}
              </Text>
              <View
                className="px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${getTypeColor(item.type)}20` }}>
                <Text
                  className="text-[10px] font-medium"
                  style={{ color: getTypeColor(item.type) }}>
                  {item.type}
                </Text>
              </View>
            </Flex>
            <Text className="text-sm text-gray-300" numberOfLines={2}>
              {truncatedValue}
            </Text>
          </View>
          <Pressable
            onPress={e => {
              e.stopPropagation();
              handleDelete(item.key);
            }}
            className="p-2 active:opacity-70">
            <Icon name="trash-outline" size={18} color="#ef4444" />
          </Pressable>
        </Flex>
      </Pressable>
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
        <Flex className="flex-row gap-2">
          <Pressable
            onPress={loadStorage}
            className="px-3 py-1.5 bg-gray-800 rounded-lg active:opacity-70 flex-row items-center gap-1 border border-gray-700">
            <Icon name="refresh" size={14} color="#9ca3af" />
            <Text className="text-gray-300 text-sm font-medium">刷新</Text>
          </Pressable>
          <Pressable
            onPress={handleClearAll}
            className="px-3 py-1.5 bg-red-900/30 rounded-lg active:opacity-70 flex-row items-center gap-1 border border-red-800/50">
            <Icon name="trash" size={14} color="#ef4444" />
            <Text className="text-red-400 text-sm font-medium">清空</Text>
          </Pressable>
        </Flex>
      </Flex>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        className="flex-1 px-3 pt-2"
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-12">
            <Icon name="server-outline" size={48} color="#6b7280" />
            <Text className="text-gray-500 mt-3">
              {searchQuery ? '未找到匹配项' : '暂无 MMKV 数据'}
            </Text>
          </View>
        }
      />

      {/* 详情模态框 */}
      <Modal
        visible={showDetailModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDetailModal(false)}>
        <View className="flex-1 bg-black/70 justify-center px-4">
          <View className="bg-gray-900 rounded-2xl border border-gray-800 max-h-[80%]">
            {/* 模态框头部 */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-800">
              <View className="flex-1 mr-4">
                <Text
                  className="text-lg font-bold text-gray-100"
                  numberOfLines={1}>
                  {selectedItem?.key}
                </Text>
                <View
                  className="self-start px-2 py-0.5 rounded mt-1"
                  style={{
                    backgroundColor: `${getTypeColor(selectedItem?.type || '')}20`,
                  }}>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: getTypeColor(selectedItem?.type || '') }}>
                    {selectedItem?.type}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-full bg-gray-800 justify-center items-center active:opacity-70 border border-gray-700">
                <Icon name="close" size={20} color="#9ca3af" />
              </Pressable>
            </View>

            {/* 值内容 */}
            <View className="p-4 max-h-96">
              <Text className="text-xs font-semibold text-gray-400 mb-2">
                值内容
              </Text>
              <View className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <Text
                  className="text-sm text-gray-200 font-mono"
                  selectable>
                  {selectedItem?.displayValue}
                </Text>
              </View>
            </View>

            {/* 操作按钮 */}
            <View className="p-4 border-t border-gray-800">
              <Pressable
                onPress={() => {
                  setShowDetailModal(false);
                  if (selectedItem) {
                    handleDelete(selectedItem.key);
                  }
                }}
                className="bg-red-900/30 p-3 rounded-lg active:opacity-70 flex-row items-center justify-center gap-2 border border-red-800/50">
                <Icon name="trash" size={18} color="#ef4444" />
                <Text className="text-red-400 font-semibold">删除此项</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
