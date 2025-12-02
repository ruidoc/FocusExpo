import { Page } from '@/components/business';
import { Flex } from '@/components/ui';
import { buttonRipple } from '@/config/navigation';
import { useCustomTheme } from '@/config/theme';
import { usePlanStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
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

type FilterType = 'today' | 'week' | 'all';

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
    const today = dayjs().format('YYYY-MM-DD');

    if (type === 'today') {
      // 今日：获取今天的计划
      return store.getPlans({ date: today });
    } else if (type === 'week') {
      // 本周：获取本周所有日期的计划
      const monday = dayjs().startOf('week').add(1, 'day'); // 周一
      const sunday = dayjs().endOf('week').add(1, 'day'); // 周日

      const promises = [];
      let currentDate = monday;
      while (
        currentDate.isBefore(sunday) ||
        currentDate.isSame(sunday, 'day')
      ) {
        promises.push(
          store.getPlans({ date: currentDate.format('YYYY-MM-DD') }),
        );
        currentDate = currentDate.add(1, 'day');
      }

      await Promise.all(promises);
    } else {
      // 全部：获取今天的计划，前端会显示所有任务
      return store.getPlans();
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
    const allPlans = store.all_plans();

    if (filterType === 'today') {
      // 今日：显示今天的任务
      const today = dayjs();
      const jsDay = today.day(); // 0=周日 ... 6=周六
      const todayDay = jsDay === 0 ? 7 : jsDay; // 转换为 1=周一 ... 7=周日

      return allPlans.filter(plan => {
        const repeat = Array.isArray(plan.repeat) ? plan.repeat : [];
        // 一次性任务或周期任务且今天在 repeat 中
        return (
          plan.repeat === 'once' ||
          (repeat.length > 0 && repeat.includes(todayDay))
        );
      });
    } else if (filterType === 'week') {
      // 本周：显示本周的任务
      const weekDays = [1, 2, 3, 4, 5, 6, 7]; // 周一到周日

      return allPlans.filter(plan => {
        const repeat = Array.isArray(plan.repeat) ? plan.repeat : [];
        // 一次性任务或周期任务且本周任意一天在 repeat 中
        return (
          plan.repeat === 'once' ||
          (repeat.length > 0 && repeat.some(day => weekDays.includes(day)))
        );
      });
    } else {
      // 全部：显示所有任务
      return allPlans;
    }
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
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
