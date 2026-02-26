import { AppToken, Page } from '@/components/business';
import { useAppStore, usePlanStore, useStatisticStore } from '@/stores';
import type { Period } from '@/stores/statistic';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const App = () => {
  const sstore = useStatisticStore();
  const astore = useAppStore();
  const pstore = usePlanStore();
  const { colors, dark } = useTheme();
  const [period, setPeriod] = useState<Period>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      await useStatisticStore.getState().fetchAppStatis(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData('today');
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    sstore.fetchAppStatis(period).finally(() => setRefreshing(false));
  };

  const periods: { key: Period; label: string }[] = useMemo(
    () => [
      { key: 'today', label: '今日' },
      { key: 'week', label: '本周' },
      { key: 'month', label: '本月' },
    ],
    [],
  );

  const getAppIcon = (app: string) => {
    const app_stableid = app.split(':')[0];
    const cur_app = astore.ios_all_apps.find(a => a.stableId === app_stableid);
    return cur_app ? (
      <AppToken key={cur_app.id} app={cur_app} size={20} />
    ) : null;
  };

  const formatMins = (m: number) => {
    const h = Math.floor((m || 0) / 60);
    const mm = (m || 0) % 60;
    if (h) return `${h}小时${mm}分`;
    return `${mm}分钟`;
  };

  const toIntPercent = (v: any) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n);
  };

  const items = sstore.app_statis?.items || [];
  const total = sstore.app_statis;
  const TEXT2 = dark ? '#6B7280' : '#94A3B8';
  const ACCENT = '#7A5AF8';

  const isAppCurrentlyLocked = (appId: string) =>
    !!pstore.active_plan &&
    !pstore.is_pause() &&
    (pstore.active_plan.apps || []).includes(appId);

  const renderDuration = (mins: number) => {
    const h = Math.floor((mins || 0) / 60);
    const mm = (mins || 0) % 60;
    if (h) {
      return (
        <View className="flex-row items-baseline gap-[2px] flex-wrap justify-center">
          <Text className="text-2xl font-semibold" style={{ color: ACCENT }}>
            {h}
          </Text>
          <Text className="text-sm text-white">小时</Text>
          <Text className="text-2xl font-semibold" style={{ color: ACCENT }}>
            {mm}
          </Text>
          <Text className="text-sm text-white">分</Text>
        </View>
      );
    }
    return (
      <View className="flex-row items-baseline gap-[2px] flex-wrap justify-center">
        <Text className="text-2xl font-semibold" style={{ color: ACCENT }}>
          {mm}
        </Text>
        <Text className="text-sm text-white">分钟</Text>
      </View>
    );
  };

  return (
    <Page safe>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View className="px-5 pt-[18px] pb-1.5 mb-4">
          <Text
            className="text-[22px] font-bold"
            style={{ color: colors.text }}>
            专注统计
          </Text>
        </View>

        {/* 周期切换 */}
        <View className="flex-row px-4 py-2.5 gap-2">
          {periods.map(p => {
            const active = p.key === period;
            return (
              <TouchableOpacity
                key={p.key}
                activeOpacity={0.7}
                className="px-4 py-[7px] rounded-[20px]"
                style={{
                  backgroundColor: active
                    ? '#7A5AF8'
                    : dark
                      ? '#1C1C26'
                      : '#F5F7FB',
                }}
                onPress={() => {
                  setPeriod(p.key);
                  fetchData(p.key);
                }}>
                <Text
                  className="text-[13px] font-medium"
                  style={{
                    color: active ? '#fff' : dark ? '#8A8A98' : '#94A3B8',
                    fontWeight: active ? '600' : '500',
                  }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 汇总卡片 */}
        <View
          className="mx-4 mt-1 mb-10 rounded-3xl p-5"
          style={{
            backgroundColor: dark ? '#1C1C26' : '#fff',
            borderWidth: dark ? 0 : StyleSheet.hairlineWidth,
            borderColor: '#E5E7EB',
          }}>
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-xs mb-2" style={{ color: TEXT2 }}>
                计划专注
              </Text>
              {renderDuration(total?.total_blocked_mins || 0)}
            </View>
            <View
              className="my-1"
              style={{
                width: StyleSheet.hairlineWidth,
                backgroundColor: dark ? '#2A2A3A' : '#E5E7EB',
              }}
            />
            <View className="flex-1 items-center">
              <Text className="text-xs mb-2" style={{ color: TEXT2 }}>
                实际专注
              </Text>
              {renderDuration(total?.total_actual_mins || 0)}
            </View>
            <View
              className="my-1"
              style={{
                width: StyleSheet.hairlineWidth,
                backgroundColor: dark ? '#2A2A3A' : '#E5E7EB',
              }}
            />
            {/* <View className="flex-1 items-center">
              <Text className="text-xs mb-2" style={{ color: TEXT2 }}>
                锁定应用
              </Text>
              <View className="flex-row items-baseline">
                <Text
                  className="text-xl font-bold"
                  style={{ color: ACCENT }}>
                  {items.length}
                </Text>
                <Text
                  className="text-xs ml-0.5"
                  style={{ color: UNIT_COLOR }}>
                  个
                </Text>
              </View>
            </View> */}
            <View
              className="my-1"
              style={{
                width: StyleSheet.hairlineWidth,
                backgroundColor: dark ? '#2A2A3A' : '#E5E7EB',
              }}
            />
            <View className="flex-1 items-center">
              <Text className="text-xs mb-2" style={{ color: TEXT2 }}>
                成功率
              </Text>
              <View className="flex-row items-baseline gap-[2px]">
                <Text className="text-2xl " style={{ color: colors.text }}>
                  {toIntPercent(total?.total_success_rate)}
                </Text>
                <Text className="text-sm text-white">%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 应用列表 */}
        {loading ? (
          <Text className="text-center text-sm mt-6" style={{ color: TEXT2 }}>
            加载中...
          </Text>
        ) : items.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Text className="text-sm" style={{ color: TEXT2 }}>
              暂无数据
            </Text>
          </View>
        ) : (
          <>
            <Text
              className="text-[15px] font-semibold px-5 mb-3"
              style={{ color: colors.text }}>
              锁定应用明细
            </Text>
            <View
              className="mx-4 mb-8 rounded-3xl overflow-hidden"
              style={{
                backgroundColor: dark ? '#1C1C26' : '#fff',
                borderWidth: dark ? 0 : StyleSheet.hairlineWidth,
                borderColor: '#E5E7EB',
              }}>
              {items
                .slice()
                .sort((a, b) => b.actual_mins - a.actual_mins)
                .map((item, index) => {
                  const locked = isAppCurrentlyLocked(item.app);
                  return (
                    <View key={item.app}>
                      {index > 0 && (
                        <View
                          className="h-px mx-4"
                          style={{
                            backgroundColor: dark ? '#2A2A3A' : '#E5E7EB',
                          }}
                        />
                      )}
                      <View className="py-3.5 px-4 flex-row items-center gap-3">
                        <View>{getAppIcon(item.app)}</View>
                        <View className="flex-1">
                          <Text
                            className="text-xs mb-1"
                            style={{ color: TEXT2 }}>
                            已锁定时长 {formatMins(item.actual_mins)}
                          </Text>
                          <Text className="text-xs" style={{ color: TEXT2 }}>
                            被锁定 {item.task_count} 次
                            {locked ? (
                              <Text
                                className="text-xs ml-2"
                                style={{ color: ACCENT }}>
                                当前锁定中
                              </Text>
                            ) : null}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
            </View>
          </>
        )}
      </ScrollView>
    </Page>
  );
};

export default App;
