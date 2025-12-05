import { Page } from '@/components/business';
import { Flex } from '@/components/ui';
import { buttonRipple } from '@/config/navigation';
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
  const [filterType, setFilterType] = useState<FilterType>('today');
  const { colors } = useCustomTheme();

  const toRoute = (path: string) => {
    router.push(path as never);
  };

  const fetchPlans = async (type: FilterType = filterType) => {
    if (type === 'all') {
      return store.getPlans();
    } else {
      // 全部：获取今天的计划，前端会显示所有任务
      return store.getPlans({ period: type });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans(filterType).finally(() => {
      setRefreshing(false);
    });
  };

  // 处理筛选类型切换
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

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          android_ripple={buttonRipple}
          onPress={() => toRoute('plans/add')}>
          <Icon name="add" size={27} color={colors.text} />
        </Pressable>
      ),
    });
  }, []);

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
              className={`px-3.5 py-1.5 rounded-2xl border ${active
                ? 'bg-[#303044] border-[#45455C]'
                : 'bg-card border-[#2E2E3A]'
                } ${index > 0 ? 'ml-2' : ''}`}
              onPress={() => handleFilterChange(option.key)}>
              <Text
                className={`text-[13px] ${active ? 'text-white font-semibold' : 'text-[#999]'
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
