import { AppToken, Page } from '@/components/business';
import { Dialog, Flex } from '@/components/ui';
import { buttonRipple } from '@/config/navigation';
import { useCustomTheme } from '@/config/theme';
import { useAppStore, usePlanStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type FilterType = 'today' | 'week' | 'all';

const App = () => {
  const store = usePlanStore();
  const astore = useAppStore();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('today');
  const { colors } = useCustomTheme();

  const toRoute = useCallback(
    (path: string) => {
      (navigation as any).navigate(path);
    },
    [navigation],
  );

  const toRemove = (id: string) => {
    Dialog.confirm({
      title: '操作提示',
      message: '确定删除该任务？',
      buttonReverse: true,
    }).then(action => {
      if (action === 'confirm') {
        if (id) {
          store.removePlan(id);
        } else {
          store.rmOncePlan(id);
        }
      }
    });
  };

  const toEdit = (task: any) => {
    // 设置编辑任务并跳转到编辑页面
    store.setEditingPlan(task);
    toRoute('plans/add');
  };

  const initPlans = async (type: FilterType = filterType) => {
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
    initPlans(filterType).finally(() => {
      setRefreshing(false);
    });
  };

  // 处理筛选类型切换
  const handleFilterChange = async (type: FilterType) => {
    setFilterType(type);
    setRefreshing(true);
    try {
      await initPlans(type);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initPlans('today');
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [colors.text, navigation, toRoute]);

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

  const styles = StyleSheet.create({
    segment: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    segBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#2E2E3A',
      backgroundColor: colors.card,
    },
    segBtnActive: {
      backgroundColor: '#303044',
      borderColor: '#45455C',
    },
    segText: {
      fontSize: 13,
      color: '#999',
    },
    segTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
  });

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'all', label: '全部' },
  ];

  return (
    <Page>
      {/* 筛选选项区域 */}
      <Flex className="px-4 py-3">
        {filterOptions.map((option, index) => {
          const active = filterType === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              activeOpacity={0.7}
              style={[
                styles.segBtn,
                active && styles.segBtnActive,
                index > 0 && { marginLeft: 8 },
              ]}
              onPress={() => handleFilterChange(option.key)}>
              <Text style={[styles.segText, active && styles.segTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Flex>

      {/* 任务区域 */}
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <TaskArea
            plans={getFilteredPlans()}
            toRemove={toRemove}
            toEdit={toEdit}
          />
        </ScrollView>
      </View>
    </Page>
  );
};

// 任务区域组件
const TaskArea = ({
  plans,
  toRemove,
  toEdit,
}: {
  plans: any[];
  toRemove: (id: string) => void;
  toEdit: (task: any) => void;
}) => {
  const { colors } = useCustomTheme();
  const astore = useAppStore();

  if (plans.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          padding: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            color: colors.text2,
            fontSize: 14,
            textAlign: 'center',
          }}>
          暂无任务
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {plans.map((task, index) => (
        <View
          key={task.id}
          style={{ marginBottom: index < plans.length - 1 ? 12 : 0 }}>
          <LinearGradient
            colors={['#5C24FC', '#9D7AFF']}
            start={{ x: -0.0042, y: 0.5 }}
            end={{ x: 1.0751, y: 0.5 }}
            style={{ borderRadius: 15 }}>
            <Pressable
              onPress={() => toEdit(task)}
              onLongPress={() => toRemove(task.id)}
              style={{
                padding: 12,
                elevation: 2,
              }}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 'bold',
                  marginBottom: 4,
                }}>
                {task.name || '未命名任务'}
              </Text>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                {astore.ios_all_apps
                  .filter(app =>
                    task.apps?.includes(`${app.stableId}:${app.type}`),
                  )
                  .map((app, idx) => (
                    <View key={app.id} style={idx > 0 ? { marginLeft: 6 } : {}}>
                      <AppToken app={app} size={23} />
                    </View>
                  ))}
              </View>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 14,
                  opacity: 0.8,
                  textAlign: 'right',
                }}>
                {task.start} ~ {task.end}
              </Text>
            </Pressable>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
};

export default App;
