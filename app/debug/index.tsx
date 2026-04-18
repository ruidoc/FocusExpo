/**
 * 调试页面
 */

import { EnvironmentManager } from '@/components/debug/env-manager';
import { MMKVManager } from '@/components/debug/mmkv-manager';
import { PostHogManager } from '@/components/debug/posthog-manager';
import { StorageManager } from '@/components/debug/storage-manager';
import { Flex, Toast } from '@/components/ui';
import {
  useDebugStore,
  useSubscriptionStore,
} from '@/stores';
import request from '@/utils/request';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';

type Tab = 'storage' | 'mmkv' | 'posthog' | 'environment';

type DebugSubscription = {
  id?: string;
  order_id?: string | null;
  user_id?: string;
  subscription_id?: string | null;
  product_id?: string;
  period?: number;
  price?: number;
  status?: string;
  source?: string;
  started_at?: string | null;
  expires_at?: string | null;
  trial_end_at?: string | null;
  canceled_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const formatSubscriptionValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime()) && value.includes('T')) {
      return date.toLocaleString();
    }
    return value;
  }

  return JSON.stringify(value);
};

const DebugPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('storage');
  const [benefitOpen, setBenefitOpen] = useState(false);
  const [benefitLoading, setBenefitLoading] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionDeleting, setSubscriptionDeleting] = useState(false);
  const [subscription, setSubscription] = useState<DebugSubscription | null>(
    null,
  );
  const [benefitForm, setBenefitForm] = useState({
    day_duration: '',
    features: '',
    app_count: '',
  });
  const setShowDebugBall = useDebugStore(state => state.setShowDebugBall);
  const clearSubscription = useSubscriptionStore(
    state => state.clearSubscription,
  );

  const loadBenefit = async () => {
    try {
      const res: any = await request.get('/benefit');
      const d = res?.data;
      if (d) {
        setBenefitForm({
          day_duration: String(d.day_duration ?? ''),
          features: d.features ?? '',
          app_count: String(d.app_count ?? ''),
        });
      }
    } catch (e) {
      console.log('加载权益失败', e);
    }
  };

  const saveBenefit = async () => {
    setBenefitLoading(true);
    try {
      await request.post('/benefit/update', {
        day_duration: Number(benefitForm.day_duration) || 0,
        features: benefitForm.features || null,
        app_count: Number(benefitForm.app_count) || 0,
      });
      Toast('权益已更新');
    } catch (e) {
      console.log('更新权益失败', e);
    } finally {
      setBenefitLoading(false);
    }
  };

  const loadSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const res: any = await request.get('/subscription');
      const nextSubscription = (res?.data ?? null) as DebugSubscription | null;
      setSubscription(nextSubscription);
      if (!nextSubscription) {
        clearSubscription();
      }
    } catch (e) {
      console.log('加载订阅失败', e);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const confirmDeleteSubscription = () => {
    Alert.alert(
      '清空订阅数据',
      '会直接删除当前用户在数据库中的有效订阅记录，且生产环境会被后端拦截。确定继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setSubscriptionDeleting(true);
            try {
              await request.delete('/subscription/debug/current-user');
              clearSubscription();
              Toast('服务端订阅已删除');
              await loadSubscription();
            } catch (e) {
              console.log('删除订阅失败', e);
            } finally {
              setSubscriptionDeleting(false);
            }
          },
        },
      ],
    );
  };

  const tabs = [
    { id: 'storage' as Tab, label: 'Async', icon: 'folder-outline' },
    { id: 'mmkv' as Tab, label: 'MMKV', icon: 'server-outline' },
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

        <Pressable
          onPress={() => {
            const next = !subscriptionOpen;
            setSubscriptionOpen(next);
            if (next) loadSubscription();
          }}
          className="mt-2 flex-row items-center justify-between bg-gray-800 rounded-lg px-4 py-3 active:opacity-70 border border-gray-700">
          <Flex className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-gray-700 justify-center items-center">
              <Icon name="card" size={18} color="#22C55E" />
            </View>
            <Text className="text-base font-medium text-gray-100">
              订阅信息
            </Text>
          </Flex>
          <Icon
            name={subscriptionOpen ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color="#6b7280"
          />
        </Pressable>

        {subscriptionOpen && (
          <View className="mt-2 bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 gap-3">
            <Flex className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-400">当前有效订阅</Text>
              <Pressable
                onPress={loadSubscription}
                disabled={subscriptionLoading || subscriptionDeleting}
                className="px-2.5 py-1.5 bg-gray-700 rounded-md active:opacity-70 border border-gray-600">
                <Text className="text-xs font-medium text-gray-200">刷新</Text>
              </Pressable>
            </Flex>

            {subscriptionLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator color="#9ca3af" size="small" />
              </View>
            ) : subscription ? (
              <View className="gap-2">
                {[
                  { label: '状态', value: subscription.status },
                  { label: '来源', value: subscription.source },
                  { label: '产品ID', value: subscription.product_id },
                  { label: '订阅ID', value: subscription.subscription_id },
                  { label: '周期', value: subscription.period },
                  {
                    label: '价格',
                    value:
                      typeof subscription.price === 'number'
                        ? `${(subscription.price / 100).toFixed(2)} 元 (${subscription.price} 分)`
                        : subscription.price,
                  },
                  { label: '开始时间', value: subscription.started_at },
                  { label: '到期时间', value: subscription.expires_at },
                  { label: '取消时间', value: subscription.canceled_at },
                  { label: '更新时间', value: subscription.updated_at },
                ].map(item => (
                  <View
                    key={item.label}
                    className="flex-row items-start justify-between gap-3">
                    <Text className="w-20 text-sm text-gray-400">
                      {item.label}
                    </Text>
                    <Text className="flex-1 text-right text-sm text-gray-100">
                      {formatSubscriptionValue(item.value)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-3">
                <Text className="text-sm text-gray-400">当前无有效订阅</Text>
              </View>
            )}

            <Pressable
              onPress={confirmDeleteSubscription}
              disabled={
                !subscription || subscriptionLoading || subscriptionDeleting
              }
              className={`mt-1 rounded-lg py-2.5 items-center border ${
                !subscription || subscriptionLoading || subscriptionDeleting
                  ? 'bg-red-900/10 border-red-900/20'
                  : 'bg-red-900/30 border-red-800/50 active:opacity-70'
              }`}>
              {subscriptionDeleting ? (
                <ActivityIndicator color="#fca5a5" size="small" />
              ) : (
                <Text
                  className={`font-semibold text-sm ${
                    !subscription || subscriptionLoading
                      ? 'text-red-300/40'
                      : 'text-red-400'
                  }`}>
                  清空订阅数据
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* 更新权益 */}
        <Pressable
          onPress={() => {
            const next = !benefitOpen;
            setBenefitOpen(next);
            if (next) loadBenefit();
          }}
          className="mt-2 flex-row items-center justify-between bg-gray-800 rounded-lg px-4 py-3 active:opacity-70 border border-gray-700">
          <Flex className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-gray-700 justify-center items-center">
              <Icon name="diamond" size={18} color="#F59E0B" />
            </View>
            <Text className="text-base font-medium text-gray-100">
              更新权益
            </Text>
          </Flex>
          <Icon
            name={benefitOpen ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color="#6b7280"
          />
        </Pressable>

        {benefitOpen && (
          <View className="mt-2 bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 gap-3">
            {[
              {
                label: '每日时长(分钟，0=不限)',
                key: 'day_duration' as const,
                kbd: 'number-pad',
              },
              { label: '功能开关', key: 'features' as const, kbd: 'default' },
              {
                label: '应用数量',
                key: 'app_count' as const,
                kbd: 'number-pad',
              },
            ].map(item => (
              <View key={item.key} className="flex-row items-center gap-3">
                <Text className="text-sm text-gray-400 w-28">{item.label}</Text>
                <TextInput
                  value={benefitForm[item.key]}
                  onChangeText={v =>
                    setBenefitForm(prev => ({ ...prev, [item.key]: v }))
                  }
                  keyboardType={item.kbd as any}
                  className="flex-1 bg-gray-700 rounded-md px-3 py-2 text-gray-100 text-sm border border-gray-600"
                  placeholderTextColor="#6b7280"
                  placeholder={item.label}
                />
              </View>
            ))}
            <Pressable
              onPress={saveBenefit}
              disabled={benefitLoading}
              className="mt-1 bg-amber-600 rounded-lg py-2.5 items-center active:opacity-70">
              {benefitLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-semibold text-sm">保存</Text>
              )}
            </Pressable>
          </View>
        )}
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
        {activeTab === 'mmkv' && <MMKVManager />}
        {activeTab === 'posthog' && <PostHogManager />}
        {activeTab === 'environment' && <EnvironmentManager />}
      </View>
    </SafeAreaView>
  );
};

export default DebugPage;
