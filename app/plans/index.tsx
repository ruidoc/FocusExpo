import { CusPage } from '@/components';
import { buttonRipple } from '@/config/navigation';
import { PlanStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { Dialog, Flex } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// 获取本周日期数据
const getWeekDates = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push({
      date: date,
      dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
      dayNumber: date.getDate(),
      isToday: date.toDateString() === today.toDateString()
    });
  }
  return weekDates;
};

// 获取时间段内的任务
const getTasksInTimeRange = (plans: any[], startHour: number, endHour: number) => {
  return plans.filter(plan => {
    const startTime = parseInt(plan.start.split(':')[0]);
    const endTime = parseInt(plan.end.split(':')[0]);
    return startTime < endHour && endTime > startHour;
  });
};

const App = observer(() => {
  const store = useLocalObservable(() => PlanStore);
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekDates = getWeekDates();

  const initapp = async () => {
    store.getPlans();
  };

  const toRoute = (path: string) => {
    (navigation as any).navigate(path);
  };

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

  const onRefresh = () => {
    setRefreshing(true);
    store.getPlans().finally(() => {
      setRefreshing(false);
    });
  };

  useEffect(() => {
    initapp();
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
  }, [dark]);

  return (
    <CusPage>
      {/* 日期选择区域 */}
      <View style={{
        backgroundColor: dark ? '#1a1a1a' : '#f8f9fa',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: dark ? '#333' : '#e5e7eb'
      }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          <Flex direction="row" style={{ gap: 12 }}>
            {weekDates.map((day, index) => (
              <Pressable
                key={index}
                onPress={() => setSelectedDate(day.date)}
                style={{
                  backgroundColor: day.isToday ? '#E91E63' : 'transparent',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  minWidth: 60,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: day.isToday ? '#fff' : (dark ? '#999' : '#666'),
                  fontSize: 12,
                  fontWeight: '500',
                  marginBottom: 2
                }}>
                  {day.dayName}
                </Text>
                <Text style={{
                  color: day.isToday ? '#fff' : (dark ? '#ccc' : '#333'),
                  fontSize: 16,
                  fontWeight: 'bold'
                }}>
                  {day.dayNumber}
                </Text>
              </Pressable>
            ))}
          </Flex>
        </ScrollView>
      </View>

      {/* 时间轴和任务区域 */}
      <Flex direction="row" style={{ flex: 1 }}>
        {/* 时间轴 */}
        <TimeAxis />

        {/* 任务区域 */}
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }}>
            <TaskArea plans={store.cus_plans} toRemove={toRemove} />
          </ScrollView>
        </View>
      </Flex>
    </CusPage>
  );
});

// 时间轴组件
const TimeAxis = () => {
  const { dark } = useTheme();
  const timeRanges = [
    { label: '0-6点', start: 0, end: 6 },
    { label: '6-12点', start: 6, end: 12 },
    { label: '12-18点', start: 12, end: 18 },
    { label: '18-24点', start: 18, end: 24 }
  ];

  return (
    <View style={{ width: 60, backgroundColor: dark ? '#1a1a1a' : '#f8f9fa' }}>
      {timeRanges.map((range, index) => (
        <View key={index} style={{ flex: 1, paddingVertical: 20, paddingHorizontal: 8 }}>
          <Text style={{
            color: dark ? '#999' : '#666',
            fontSize: 12,
            fontWeight: '500',
            textAlign: 'center',
            transform: [{ rotate: '-90deg' }]
          }}>
            {range.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

// 任务区域组件
const TaskArea = ({ plans, toRemove }: { plans: any[], toRemove: (id: string) => void }) => {
  const { dark } = useTheme();
  const timeRanges = [
    { start: 0, end: 6, label: '0-6点' },
    { start: 6, end: 12, label: '6-12点' },
    { start: 12, end: 18, label: '12-18点' },
    { start: 18, end: 24, label: '18-24点' }
  ];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {timeRanges.map((range, rangeIndex) => {
        const tasksInRange = getTasksInTimeRange(plans, range.start, range.end);

        if (tasksInRange.length === 0) return null;

        return (
          <View key={rangeIndex} style={{ marginBottom: 24 }}>
            {/* 时间段标题 */}
            <Text style={{
              color: dark ? '#ccc' : '#333',
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 12,
              paddingLeft: 8
            }}>
              {range.label}
            </Text>

            {/* 任务列表 */}
            <View style={{ gap: 8 }}>
              {tasksInRange.map((task) => (
                <Pressable
                  key={task.id}
                  onLongPress={() => toRemove(task.id)}
                  style={{
                    backgroundColor: '#E91E63',
                    height: 80,
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#E91E63',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}>
                      {task.name || '未命名任务'}
                    </Text>
                    <Text style={{
                      color: '#fff',
                      fontSize: 12,
                      opacity: 0.8
                    }}>
                      {task.start} - {task.end}
                    </Text>
                  </View>

                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon
                      name="checkmark-circle-outline"
                      size={20}
                      color="#fff"
                    />
                  </View>
                </Pressable>
              ))}
            </View>

            {/* 分割线 */}
            {rangeIndex < timeRanges.length - 1 && (
              <View style={{
                height: 1,
                backgroundColor: dark ? '#333' : '#e5e7eb',
                marginTop: 16,
                marginHorizontal: 8,
                borderStyle: 'dashed',
                borderWidth: 1,
                borderColor: 'transparent'
              }} />
            )}
          </View>
        );
      })}
    </View>
  );
};

export default App;
