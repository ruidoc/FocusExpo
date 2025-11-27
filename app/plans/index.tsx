import { AppToken, Page } from '@/components/business';
import { Dialog, Flex } from '@/components/ui';
import { buttonRipple } from '@/config/navigation';
import { useCustomTheme } from '@/config/theme';
import { AppStore, PlanStore } from '@/stores';
import { getWeekDates } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

// 获取时间段内的任务
const getTasksInTimeRange = (
  plans: any[],
  startHour: number,
  endHour: number,
) => {
  return plans.filter(plan => {
    const startTime = parseInt(plan.start.split(':')[0]);
    return startTime >= startHour && startTime < endHour;
  });
};

const App = observer(() => {
  const store = useLocalObservable(() => PlanStore);
  const astore = useLocalObservable(() => AppStore);
  const { dark } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekDates = getWeekDates();
  const scrollViewRef = useRef<ScrollView>(null);
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

  const initPlans = () => {
    return store.getPlans();
  };

  const onRefresh = () => {
    setRefreshing(true);
    initPlans().finally(() => {
      setRefreshing(false);
    });
  };

  // 处理日期选择
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);

    // 调用接口获取该日期的计划
    const dateStr = date.toISOString().split('T')[0];
    store.getPlans({ date: dateStr });

    // 计算滚动位置，让选中的日期尽量居中
    const selectedIndex = weekDates.findIndex(
      day => day.date.toDateString() === date.toDateString(),
    );

    if (selectedIndex !== -1 && scrollViewRef.current) {
      // 计算每个日期项的宽度（包括间距）
      const itemWidth = 60 + 12; // minWidth + gap
      const containerWidth = 300; // 假设容器宽度
      const targetX = Math.max(
        0,
        selectedIndex * itemWidth - containerWidth / 2 + itemWidth / 2,
      );

      scrollViewRef.current.scrollTo({
        x: targetX,
        animated: true,
      });
    }
  };

  useEffect(() => {
    initPlans();
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

  return (
    <Page>
      {/* 日期选择区域 */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: dark ? '#333' : '#e5e7eb',
        }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}>
          <Flex className="gap-3">
            {weekDates.map((day, index) => {
              const isSelected =
                selectedDate.toDateString() === day.date.toDateString();
              const isToday = day.isToday;

              return (
                <Pressable
                  key={index}
                  onPress={() => handleDateSelect(day.date)}
                  style={{
                    backgroundColor: isSelected
                      ? colors.blue2
                      : isToday
                        ? `${colors.blue2}30`
                        : 'transparent',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    minWidth: 60,
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: isSelected ? '#fff' : '#999',
                      fontSize: 12,
                      fontWeight: '500',
                      marginBottom: 2,
                    }}>
                    {day.dayName}
                  </Text>
                  <Text
                    style={{
                      color: isSelected ? '#fff' : '#ccc',
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}>
                    {day.dayNumber}
                  </Text>
                </Pressable>
              );
            })}
          </Flex>
        </ScrollView>
      </View>

      {/* 时间轴和任务区域 */}
      <Flex className="flex-1">
        {/* 时间轴 */}
        <TimeAxis />

        {/* 任务区域 */}
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            <TaskArea
              plans={store.cus_plans}
              toRemove={toRemove}
              toEdit={toEdit}
              astore={astore}
            />
          </ScrollView>
        </View>
      </Flex>
    </Page>
  );
});

// 时间轴组件
const TimeAxis = () => {
  const { dark } = useTheme();
  const timeRanges = [
    { label: '0-6点', start: 0, end: 6 },
    { label: '6-12点', start: 6, end: 12 },
    { label: '12-18点', start: 12, end: 18 },
    { label: '18-24点', start: 18, end: 24 },
  ];

  return (
    <View style={{ width: 60, backgroundColor: dark ? '#1a1a1a' : '#f8f9fa' }}>
      {timeRanges.map((range, index) => (
        <View
          key={index}
          style={{ flex: 1, paddingVertical: 20, paddingHorizontal: 8 }}>
          <Text
            style={{
              color: dark ? '#999' : '#666',
              fontSize: 12,
              fontWeight: '500',
              textAlign: 'center',
              transform: [{ rotate: '-90deg' }],
            }}>
            {range.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

// 任务区域组件
const TaskArea = ({
  plans,
  toRemove,
  toEdit,
  astore,
}: {
  plans: any[];
  toRemove: (id: string) => void;
  toEdit: (task: any) => void;
  astore: typeof AppStore;
}) => {
  const { colors } = useCustomTheme();
  const timeRanges = [
    { start: 0, end: 6, label: '0-6点' },
    { start: 6, end: 12, label: '6-12点' },
    { start: 12, end: 18, label: '12-18点' },
    { start: 18, end: 24, label: '18-24点' },
  ];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {timeRanges.map((range, rangeIndex) => {
        const tasksInRange = getTasksInTimeRange(plans, range.start, range.end);

        if (tasksInRange.length === 0) return null;

        return (
          <View key={rangeIndex} style={{ marginBottom: 24 }}>
            {/* 时间段标题 */}
            <Text
              style={{
                color: colors.text2,
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 12,
                paddingLeft: 8,
              }}>
              {range.label}
            </Text>

            {/* 任务列表 */}
            <View style={{ gap: 8 }}>
              {tasksInRange.map(task => (
                <LinearGradient
                  key={task.id}
                  colors={['#5C24FC', '#9D7AFF']}
                  start={{ x: -0.0042, y: 0.5 }}
                  end={{ x: 1.0751, y: 0.5 }}
                  style={{ borderRadius: 15 }}>
                  <Flex
                    className="flex-col items-stretch"
                    key={task.id}
                    onPress={() => toEdit(task)}
                    onLongPress={() => toRemove(task.id)}
                    style={{
                      padding: 12,
                      gap: 4,
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
                    <Flex style={{ gap: 6 }}>
                      {astore.ios_all_apps
                        .filter(app =>
                          task.apps.includes(`${app.stableId}:${app.type}`),
                        )
                        .map(app => (
                          <AppToken key={app.id} app={app} size={23} />
                        ))}
                    </Flex>
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: 14,
                        opacity: 0.8,
                        textAlign: 'right',
                      }}>
                      {task.start} ~ {task.end}
                    </Text>
                  </Flex>
                </LinearGradient>
              ))}
            </View>

            {/* 分割线 */}
            {rangeIndex < timeRanges.length - 1 && (
              <View
                style={{
                  height: 0,
                  backgroundColor: colors.border,
                  marginTop: 16,
                  marginHorizontal: 8,
                  borderStyle: 'dashed',
                  borderWidth: 0.5,
                  borderColor: 'transparent',
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

export default App;
