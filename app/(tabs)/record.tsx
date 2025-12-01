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
  const { colors } = useTheme();
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
    fetchData(period);
  }, [period, fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    sstore.fetchAppStatis(period).finally(() => setRefreshing(false));
  }, [period, sstore]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
    },
    segment: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
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
    summaryCard: {
      marginHorizontal: 16,
      marginTop: 6,
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    sumRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    sumBlock: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
    },
    sumLabel: {
      fontSize: 12,
      color: '#8A8A98',
      marginBottom: 6,
    },
    sumValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    list: {
      marginTop: 4,
      paddingHorizontal: 12,
      paddingBottom: 24,
    },
    item: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginHorizontal: 4,
      marginVertical: 6,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    appName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
    rateText: {
      fontSize: 13,
      color: '#8A8A98',
    },
    bar: {
      height: 8,
      borderRadius: 6,
      backgroundColor: '#2F2F3C',
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      backgroundColor: '#7F56D9',
      borderRadius: 6,
    },
    itemMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    metaText: {
      fontSize: 12,
      color: '#8A8A98',
    },
    loadingText: {
      textAlign: 'center',
      color: '#8A8A98',
      marginTop: 20,
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      color: '#8A8A98',
    },
  });

  const periods: { key: Period; label: string }[] = useMemo(
    () => [
      { key: 'today', label: '今日' },
      { key: 'week', label: '本周' },
      { key: 'month', label: '本月' },
    ],
    [],
  );

  const getAppIcon = (app: string) => {
    let app_stableid = app.split(':')[0];
    let cur_app = astore.ios_all_apps.find(a => a.stableId === app_stableid);
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

  const normalizeRate = (v: any) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(n / 100, 1));
  };

  const items = sstore.app_statis?.items || [];
  const total = sstore.app_statis;

  return (
    <Page safe>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.header}>
          <Text style={styles.title}>专注统计</Text>
        </View>

        {/* 周期切换 */}
        <View style={styles.segment}>
          {periods.map(p => {
            const active = p.key === period;
            return (
              <TouchableOpacity
                key={p.key}
                activeOpacity={0.7}
                style={[styles.segBtn, active && styles.segBtnActive]}
                onPress={() => setPeriod(p.key)}>
                <Text style={[styles.segText, active && styles.segTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 汇总卡片 */}
        <View style={styles.summaryCard}>
          {/* <Text style={{ color: '#8A8A98', fontSize: 12 }}>时间范围</Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>
            {total?.start_at?.slice(0, 10)} ~ {total?.end_at?.slice(0, 10)}
          </Text> */}
          <View style={styles.sumRow}>
            <View style={styles.sumBlock}>
              <Text style={styles.sumLabel}>实际专注</Text>
              <Text style={styles.sumValue}>
                {formatMins(total?.total_actual_mins || 0)}
              </Text>
            </View>
            <View style={styles.sumBlock}>
              <Text style={styles.sumLabel}>屏蔽时长</Text>
              <Text style={styles.sumValue}>
                {formatMins(total?.total_blocked_mins || 0)}
              </Text>
            </View>
            <View style={styles.sumBlock}>
              <Text style={styles.sumLabel}>成功率</Text>
              <Text style={styles.sumValue}>
                {toIntPercent(total?.total_success_rate)}%
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>加载中...</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items
              .slice()
              .sort((a, b) => b.blocked_mins - a.blocked_mins)
              .map(item => {
                const rate = normalizeRate(item.success_rate);
                return (
                  <View key={item.app} style={styles.item}>
                    <View style={styles.itemHeader}>
                      <Flex>{getAppIcon(item.app)}</Flex>
                      <Text style={styles.rateText}>
                        成功率 {toIntPercent(item.success_rate)}%
                      </Text>
                    </View>
                    <View style={styles.bar}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.round(rate * 100)}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.itemMeta}>
                      <Text style={styles.metaText}>
                        专注 {formatMins(item.actual_mins)}
                      </Text>
                      <Text style={styles.metaText}>
                        屏蔽 {formatMins(item.blocked_mins)}
                      </Text>
                      <Text style={styles.metaText}>
                        任务 {item.success_count}/{item.task_count}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        )}
      </ScrollView>
    </Page>
  );
};

export default App;
