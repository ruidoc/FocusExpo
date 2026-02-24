import { AppToken, Page } from '@/components/business';
import { Flex } from '@/components/ui';
import { useAppStore, useStatisticStore } from '@/stores';
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
  const { colors, dark } = useTheme();
  const [period, setPeriod] = useState<Period>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (p: Period) => {
      setLoading(true);
      try {
        await sstore.fetchAppStatis(p);
      } finally {
        setLoading(false);
      }
    },
    [sstore],
  );

  useEffect(() => {
    fetchData('today');
  }, []);

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
    return cur_app ? <AppToken key={cur_app.id} app={cur_app} size={20} /> : null;
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

  const normalizeRate = (v: any) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(n / 100, 1));
  };

  const getRateColor = (rate: number) => {
    if (rate >= 80) return '#16B364';
    if (rate >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const items = sstore.app_statis?.items || [];
  const total = sstore.app_statis;
  const TEXT2 = dark ? '#6B7280' : '#94A3B8';

  return (
    <Page safe>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View className="px-5 pt-[18px] pb-1.5">
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
                    : dark ? '#1C1C26' : '#F5F7FB',
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
          className="mx-4 mt-1 mb-4 rounded-2xl p-5"
          style={{
            backgroundColor: dark ? '#1C1C26' : '#fff',
            borderWidth: dark ? 0 : StyleSheet.hairlineWidth,
            borderColor: '#E5E7EB',
          }}>
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-xs mb-2" style={{ color: TEXT2 }}>
                实际专注
              </Text>
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}>
                {formatMins(total?.total_actual_mins || 0)}
              </Text>
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
                限制时长
              </Text>
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}>
                {formatMins(total?.total_blocked_mins || 0)}
              </Text>
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
                成功率
              </Text>
              <Text
                className="text-xl font-bold"
                style={{
                  color: getRateColor(toIntPercent(total?.total_success_rate)),
                }}>
                {toIntPercent(total?.total_success_rate)}%
              </Text>
            </View>
          </View>
        </View>

        {/* 应用列表 */}
        {loading ? (
          <Text
            className="text-center text-sm mt-6"
            style={{ color: TEXT2 }}>
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
              className="text-[15px] font-semibold px-5 mb-2"
              style={{ color: dark ? '#8A8A98' : '#64748B' }}>
              应用详情
            </Text>
            <View className="px-4 pb-8 gap-2">
              {items
                .slice()
                .sort((a, b) => b.blocked_mins - a.blocked_mins)
                .map(item => {
                  const rate = normalizeRate(item.success_rate);
                  const percent = toIntPercent(item.success_rate);
                  const barColor = getRateColor(percent);
                  return (
                    <View
                      key={item.app}
                      className="rounded-[14px] py-3.5 px-3.5"
                      style={{
                        backgroundColor: dark ? '#1C1C26' : '#fff',
                        borderWidth: dark ? 0 : StyleSheet.hairlineWidth,
                        borderColor: '#E5E7EB',
                      }}>
                      <View className="flex-row justify-between items-center mb-2.5">
                        <Flex>{getAppIcon(item.app)}</Flex>
                        <Text
                          className="text-[13px] font-semibold"
                          style={{ color: barColor }}>
                          {percent}%
                        </Text>
                      </View>
                      <View
                        className="h-1.5 rounded-sm overflow-hidden"
                        style={{ backgroundColor: dark ? '#2A2A3A' : '#F0F0F5' }}>
                        <View
                          className="h-full rounded-sm"
                          style={{
                            width: `${Math.round(rate * 100)}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </View>
                      <View className="flex-row justify-between mt-2.5">
                        <Text className="text-xs" style={{ color: TEXT2 }}>
                          专注 {formatMins(item.actual_mins)}
                        </Text>
                        <Text className="text-xs" style={{ color: TEXT2 }}>
                          限制 {formatMins(item.blocked_mins)}
                        </Text>
                        <Text className="text-xs" style={{ color: TEXT2 }}>
                          {item.success_count}/{item.task_count} 完成
                        </Text>
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
