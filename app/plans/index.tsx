import { Page } from '@/components/business';
import { Flex, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { usePlanStore } from '@/stores';
import { getPlansByPeriod } from '@/utils/date';
import Icon from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
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
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('today');
  const { colors, isDark } = useCustomTheme();

  const toCreatePlan = () => {
    if (store.has_active_task()) {
      Toast('专注进行中，不可以创建契约', 'info');
      return;
    }
    router.push('plans/add' as never);
  };

  const fetchPlans = async (type: FilterType = filterType) => {
    if (type === 'all') {
      return store.getPlans({ status: 'all' });
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

  const getFilteredPlans = () => {
    const allPlans = store.cus_plans;
    const filtered = getPlansByPeriod(allPlans, filterType);
    return filtered.sort((a, b) => {
      const inactiveA = a.status === 'finished' || a.status === 'failed';
      const inactiveB = b.status === 'finished' || b.status === 'failed';
      if (inactiveA === inactiveB) return 0;
      return inactiveA ? 1 : -1;
    });
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'all', label: '全部' },
  ];

  return (
    <Page>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={toCreatePlan}
              style={{
                width: 36,
                height: 36,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon name="add" size={27} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      {/* 筛选选项区域 */}
      <Flex
        className="px-4 pb-0 gap-3 flex justify-center"
        style={{ backgroundColor: colors.card }}>
        {filterOptions.map((option, index) => {
          const active = filterType === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              activeOpacity={0.7}
              className={`pb-2 px-1`}
              style={{
                borderBottomWidth: 2,
                borderBottomColor: active ? colors.primary : 'transparent',
              }}
              onPress={() => handleFilterChange(option.key)}>
              <Text
                className={`text-[14px] ${active ? 'font-semibold' : ''}`}
                style={{ color: active ? colors.text : colors.text3 }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Flex>

      {/* 任务区域 */}
      <View className="flex-1">
        <ScrollView
          className="flex-1 pt-1.5"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <TaskArea plans={getFilteredPlans()} filterType={filterType} />
        </ScrollView>
      </View>
    </Page>
  );
};

export default App;
