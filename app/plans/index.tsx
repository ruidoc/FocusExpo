import { Page } from '@/components/business';
import { Flex, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { usePlanStore } from '@/stores';
import { getPlansByPeriod } from '@/utils/date';
import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TaskArea from './item';

type FilterType = 'today' | 'week' | 'month' | 'all';

const App = () => {
  const store = usePlanStore();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('today');
  const { colors } = useCustomTheme();

  const toCreatePlan = () => {
    if (store.has_active_task()) {
      Toast('专注进行中，不可以创建契约', 'info');
      return;
    }
    router.push('plans/add' as never);
  };

  const fetchPlans = async (type: FilterType = filterType) => {
    if (type === 'all') {
      return store.getPlans();
    } else {
      return store.getPlans({ period: type });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans(filterType).finally(() => {
      setRefreshing(false);
    });
  };

  // 处理筛选类型切换：同步拉取对应周期数据并刷新列表
  const handleFilterChange = async (type: FilterType) => {
    setFilterType(type);
    setRefreshing(true);
    try {
      await fetchPlans(type);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlans('today');
  }, []);

  // 同步计划到 iOS 原生侧
  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await store.syncAllPlansToNative();
      Toast(
        `同步完成：成功 ${result.successCount}/${result.total}`,
        result.successCount === result.total ? 'success' : 'info',
      );
    } catch (error) {
      Toast('同步失败，请重试', 'error');
      console.error('同步失败:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      // 避免 header 右侧 flex 布局把 Pressable 拉满剩余宽度（偶现长条）
      headerRight: ({ tintColor }: { tintColor?: string }) => (
        <Pressable
          onPress={toCreatePlan}
          style={{
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Icon name="add" size={27} color={tintColor ?? colors.text} />
        </Pressable>
      ),
    });
  }, [navigation]);

  // 根据筛选类型过滤任务
  const getFilteredPlans = () => {
    const allPlans = store.cus_plans;
    return getPlansByPeriod(allPlans, filterType);
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'all', label: '全部' },
  ];

  return (
    <Page>
      {/* 筛选选项区域 */}
      <Flex className="px-4 py-2.5">
        {filterOptions.map((option, index) => {
          const active = filterType === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              activeOpacity={0.7}
              className={`px-3.5 py-1.5 rounded-2xl border ${
                active
                  ? 'bg-[#303044] border-[#45455C]'
                  : 'bg-card border-[#2E2E3A]'
              } ${index > 0 ? 'ml-2' : ''}`}
              onPress={() => handleFilterChange(option.key)}>
              <Text
                className={`text-[13px] ${
                  active ? 'text-white font-semibold' : 'text-[#999]'
                }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Flex>

      {/* 任务区域 */}
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <TaskArea plans={getFilteredPlans()} />
        </ScrollView>
      </View>
    </Page>
  );
};

export default App;
