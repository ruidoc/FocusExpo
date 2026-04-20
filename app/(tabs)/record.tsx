import { AppToken, Page } from '@/components/business';
import { useCustomTheme } from '@/config/theme';
import {
  useAppStore,
  usePlanStore,
  useRecordStore,
  useStatisticStore,
} from '@/stores';
import type { Period } from '@/stores/statistic';
import { addLiveFocusDelta, getLiveFocusDelta } from '@/utils/live-focus';
import Icon from '@expo/vector-icons/Ionicons';
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
  const rstore = useRecordStore();
  const { colors, isDark } = useCustomTheme();
  const [period, setPeriod] = useState<Period>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsSnapshot, setStatsSnapshot] = useState({
    curplanMinute: 0,
    recordId: '',
  });
  const fetchData = useCallback(
    async (p: Period, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        const astore = useAppStore.getState();
        if (astore.ios_all_apps.length === 0) {
          await astore.getIosApps();
        }
        const data = await useStatisticStore.getState().fetchAppStatis(p);
        if (data) {
          const latestRecord = useRecordStore.getState();
          const latestPlan = usePlanStore.getState();
          setStatsSnapshot({
            curplanMinute: latestPlan.curplan_minute,
            recordId: latestRecord.record_id,
          });
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchData('today');
  }, [fetchData]);

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
      <AppToken key={cur_app.id} app={cur_app} size={26} />
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

  const total = sstore.app_statis;
  const items = useMemo(() => total?.items || [], [total?.items]);
  const currentRecordId = rstore.record_id;
  const focusPlan = pstore.focus_plan();
  const currentApps = useMemo(
    () => new Set(focusPlan?.apps || []),
    [focusPlan?.apps],
  );
  const liveDelta = getLiveFocusDelta({
    active: pstore.has_active_task(),
    paused: !!pstore.is_pause(),
    curplanMinute: pstore.curplan_minute,
    currentRecordId,
    snapshotRecordId: statsSnapshot.recordId,
    snapshotCurplanMinute: statsSnapshot.curplanMinute,
  });
  const displayTotalActualMins = addLiveFocusDelta(
    total?.total_actual_mins || 0,
    liveDelta,
  );
  const displayItems = useMemo(() => {
    if (!liveDelta || currentApps.size === 0) {
      return items;
    }
    return items.map(item => ({
      ...item,
      actual_mins: currentApps.has(item.app)
        ? addLiveFocusDelta(item.actual_mins, liveDelta)
        : item.actual_mins,
    }));
  }, [currentApps, items, liveDelta]);
  const TEXT2 = colors.text3;
  const ACCENT = colors.primary;
  const unitTextColor = colors.text;

  const isAppCurrentlyLocked = (appId: string) =>
    pstore.has_active_task() &&
    !pstore.is_pause() &&
    (focusPlan?.apps || []).includes(appId);

  const renderDuration = (mins: number) => {
    const h = Math.floor((mins || 0) / 60);
    const mm = (mins || 0) % 60;
    if (h) {
      return (
        <View className="flex-row items-baseline gap-[2px] flex-wrap justify-center">
          <Text className="text-2xl font-semibold" style={{ color: ACCENT }}>
            {h}
          </Text>
          <Text className="text-sm" style={{ color: unitTextColor }}>
            小时
          </Text>
          <Text className="text-2xl font-semibold" style={{ color: ACCENT }}>
            {mm}
          </Text>
          <Text className="text-sm" style={{ color: unitTextColor }}>
            分
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-row items-baseline gap-[2px] flex-wrap justify-center">
        <Text className="text-2xl font-semibold" style={{ color: ACCENT }}>
          {mm}
        </Text>
        <Text className="text-sm" style={{ color: unitTextColor }}>
          分钟
        </Text>
      </View>
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData(period, { silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, period]);

  return (
    <Page safe safeEdges={['top']}>
      <View className="flex-1">
        <View className="px-5 pt-[12px] pb-1.5 mb-2">
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
                  backgroundColor: active ? colors.primary : colors.card,
                }}
                onPress={() => {
                  setPeriod(p.key);
                  fetchData(p.key);
                }}>
                <Text
                  className="text-[13px] font-medium"
                  style={{
                    color: active ? colors.primaryForeground : colors.text3,
                    fontWeight: active ? '600' : '500',
                  }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* 汇总卡片 */}
          <View
            className="mx-4 mt-1 mb-4 rounded-3xl py-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: isDark ? 0 : StyleSheet.hairlineWidth,
              borderColor: colors.border,
            }}>
            <View className="flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="text-xs mb-2" style={{ color: TEXT2 }}>
                  契约专注
                </Text>
                {renderDuration(total?.total_blocked_mins || 0)}
              </View>
              <View
                className="my-1"
                style={{
                  width: StyleSheet.hairlineWidth,
                  backgroundColor: colors.border,
                }}
              />
              <View className="flex-1 items-center">
                <Text className="text-xs mb-2" style={{ color: TEXT2 }}>
                  实际专注
                </Text>
                {renderDuration(displayTotalActualMins)}
              </View>
              <View
                className="my-1"
                style={{
                  width: StyleSheet.hairlineWidth,
                  backgroundColor: colors.border,
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
                  <Text className="text-sm" style={{ color: unitTextColor }}>
                    %
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 应用列表 */}
          {loading ? (
            <Text className="text-center text-sm mt-6" style={{ color: TEXT2 }}>
              加载中...
            </Text>
          ) : displayItems.length === 0 ? (
            <View className="flex-1 items-center py-20">
              <Icon
                name="bar-chart-outline"
                size={26}
                color={TEXT2}
                style={{ marginBottom: 10 }}
              />
              <Text className="text-sm" style={{ color: TEXT2 }}>
                暂无数据
              </Text>
            </View>
          ) : (
            <View>
              <Text
                className="text-[15px] font-semibold px-5 mb-3"
                style={{ color: colors.text }}>
                APP锁定明细
              </Text>
              <View
                className="mx-4 mb-4 rounded-3xl overflow-hidden"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: isDark ? 0 : StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                }}>
                {(() => {
                  const sortedItems = displayItems
                    .slice()
                    .sort((a, b) => b.actual_mins - a.actual_mins);
                  const medianMins =
                    sortedItems.length > 0
                      ? sortedItems[Math.floor(sortedItems.length / 2)]
                          .actual_mins || 30
                      : 30;
                  const maxBarWidth = 226;
                  const refMins = Math.max(medianMins * 2, 1);
                  return sortedItems.map((item, index) => {
                    const locked = isAppCurrentlyLocked(item.app);
                    const barWidth = Math.max(
                      12,
                      Math.min(
                        maxBarWidth,
                        (item.actual_mins / refMins) * maxBarWidth,
                      ),
                    );
                    return (
                      <View key={item.app}>
                        {index > 0 && (
                          <View
                            className="h-px mx-4"
                            style={{
                              backgroundColor: colors.border,
                            }}
                          />
                        )}
                        <View className="py-3.5 px-4 flex-row items-center gap-3">
                          <View>{getAppIcon(item.app)}</View>
                          <View className="flex-1">
                            <View className="flex-row items-center mb-[2px]">
                              <View
                                className="h-1.5 rounded-full mr-2"
                                style={{
                                  width: barWidth,
                                  backgroundColor: colors.text3,
                                }}
                              />
                              <Text
                                className="text-xs"
                                style={{ color: TEXT2 }}>
                                {formatMins(item.actual_mins)}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <Text
                                className="text-xs"
                                style={{ color: TEXT2 }}>
                                共 {item.task_count} 次
                              </Text>
                              {locked ? (
                                <View className="flex-row items-center">
                                  {/* <View className="w-1.5 h-1.5 rounded-full bg-[#7A5AF8]" />
                                  <Text
                                    className="text-xs"
                                    style={{ color: TEXT2 }}>
                                    锁定中
                                  </Text> */}
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Page>
  );
};

export default App;
