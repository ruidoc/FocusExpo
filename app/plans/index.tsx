import { CusPage } from '@/components';
import { PlanStore } from '@/stores';
import { buttonRipple } from '@/utils/config';
import Icon from '@expo/vector-icons/Ionicons';
import { Dialog, Flex } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => PlanStore);
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

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
      {/* 顶部说明区域 */}
      <Flex justify="between" align="center" style={{ padding: 10 }}>
        <Text style={{ color: '#888', fontSize: 13, fontWeight: 'bold' }}>
          共 {store.cus_plans.length} 个任务
        </Text>
        <Flex align="center">
          <Flex align="center" style={{ marginRight: 18 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#52C41A',
                marginRight: 6,
              }}
            />
            <Text style={{ color: dark ? '#999' : '#333', fontSize: 13 }}>
              专注模式
            </Text>
          </Flex>
          <Flex align="center">
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FF4D4F',
                marginRight: 6,
              }}
            />
            <Text style={{ color: dark ? '#999' : '#333', fontSize: 13 }}>
              屏蔽模式
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <TimeLineView plans={store.cus_plans} toRemove={toRemove} />
    </CusPage>
  );
});

// 时间线组件
const hours = Array.from({ length: 25 }, (_, i) => i); // 0~24

function timeToMinutes(timeStr: string) {
  // 假设 timeStr 格式为 "HH:mm"
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

const HOUR_HEIGHT = 50; // 每小时高度
const TOTAL_HEIGHT = 24 * HOUR_HEIGHT; // 总高度
const HOUR_OFFSET = 8; // 每小时偏移量

// 获取任务顶部位置
function getTop(start: string, totalHeight: number) {
  return (timeToMinutes(start) / (24 * 60)) * totalHeight + HOUR_OFFSET;
}

// 获取任务高度
function getHeight(start: string, end: string, totalHeight: number) {
  return (
    ((timeToMinutes(end) - timeToMinutes(start)) / (24 * 60)) * totalHeight
  );
}

// 时间线视图组件
const TimeLineView = ({
  plans,
  toRemove,
}: {
  plans: any[];
  toRemove: (id: string) => void;
}) => {
  const { colors, dark } = useTheme();

  // 处理相邻任务色块间距
  const plansWithMargin = plans.map((plan, idx, arr) => {
    if (idx === 0) return { ...plan, _marginTop: 0 };
    return {
      ...plan,
      _marginTop: plan.start === arr[idx - 1].end ? 2 : 0,
    };
  });

  // 获取当前时间字符串，格式为HH:mm
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const currentHour = now.getHours();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <ScrollView style={{ flex: 1, width: '100%' }}>
      <Flex
        direction="row"
        style={{
          paddingVertical: 2,
          paddingHorizontal: 5,
          height: TOTAL_HEIGHT,
        }}>
        {/* 时间刻度 */}
        <Flex
          style={{
            width: 40,
            justifyContent: 'space-between',
            height: TOTAL_HEIGHT,
            position: 'relative',
          }}
          direction="column">
          {hours.map(hour => {
            const hourMinutes = hour * 60;
            const isNearCurrent = Math.abs(currentMinutes - hourMinutes) < 15;
            return (
              <Text
                key={hour}
                style={{
                  color: dark ? '#888' : '#bbb',
                  fontSize: 12,
                  height: HOUR_HEIGHT,
                  textAlignVertical: 'top',
                  opacity: isNearCurrent ? 0 : 1,
                }}>
                {hour.toString().padStart(2, '0')}:00
              </Text>
            );
          })}
          {/* 当前时间标记 */}
          <Text
            style={{
              position: 'absolute',
              left: 5,
              width: 40,
              top: getTop(currentTimeStr, TOTAL_HEIGHT) - 8,
              color: '#1890ff',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'transparent',
              zIndex: 10,
            }}>
            {currentTimeStr}
          </Text>
        </Flex>
        {/* 时间线与任务横条 */}
        <View
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: colors.card,
            borderRadius: 8,
            height: TOTAL_HEIGHT,
          }}>
          {/* 整点虚线 */}
          {hours.map(hour => (
            <View
              key={hour}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: hour * HOUR_HEIGHT + HOUR_OFFSET,
                height: 0,
                borderTopWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
                zIndex: 0,
              }}
              pointerEvents="none"
            />
          ))}
          {/* 当前时间线 */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 1.5,
              backgroundColor: '#1890ff',
              top: getTop(currentTimeStr, TOTAL_HEIGHT) - 1,
              zIndex: 2,
            }}
            pointerEvents="none"
          />
          {/* 任务横条 */}
          {plansWithMargin.map(plan => (
            <Flex
              key={plan.id}
              align="center"
              style={{
                position: 'absolute',
                left: 10,
                right: 10,
                top: getTop(plan.start, TOTAL_HEIGHT) + plan._marginTop,
                height:
                  getHeight(plan.start, plan.end, TOTAL_HEIGHT) -
                  plan._marginTop,
                zIndex: 1,
              }}>
              <Pressable
                onLongPress={() => toRemove(plan.id)}
                style={{
                  flex: 1,
                  height: '100%',
                  backgroundColor:
                    plan.mode === 'focus'
                      ? dark
                        ? '#389e3b'
                        : '#52C41A'
                      : dark
                      ? '#b34040'
                      : '#FF4D4F',
                  borderRadius: 4,
                  opacity: 0.85,
                  paddingHorizontal: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 'bold',
                    marginRight: 8,
                  }}>
                  {plan.start}~{plan.end}
                </Text>
                <Text style={{ color: '#fff', fontSize: 12, opacity: 0.8 }}>
                  {plan.repeat === 'evary'
                    ? '每天'
                    : plan.repeat === 'workday'
                    ? '工作日'
                    : plan.repeat === 'weekend'
                    ? '周末'
                    : '一次'}
                </Text>
              </Pressable>
              <Flex
                style={{
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon
                  name="checkmark-circle-outline"
                  size={17}
                  color={
                    plan.mode === 'focus'
                      ? dark
                        ? '#389e3b'
                        : '#52C41A'
                      : dark
                      ? '#b34040'
                      : '#FF4D4F'
                  }
                />
              </Flex>
            </Flex>
          ))}
        </View>
      </Flex>
    </ScrollView>
  );
};

export default App;
