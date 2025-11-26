import { Page } from '@/components/business';
import { useCustomTheme } from '@/config/theme';
import ChallengeStore, { Challenge } from '@/stores/challenge';
import {
  Card,
  Flex,
  Space,
  Switch,
  Tag,
  Toast,
} from '@fruits-chain/react-native-xiaoshu';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ChallengeListScreen = observer(() => {
  const store = useLocalObservable(() => ChallengeStore);
  const { colors } = useCustomTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    is_active: true,
    ongoing: true,
  });

  const fetchData = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      await store.fetchChallenges(filters.is_active, filters.ongoing);
    } catch {
      Toast({
        type: 'fail',
        message: '获取挑战列表失败',
      });
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          await store.fetchChallenges(filters.is_active, filters.ongoing);
        } catch (error) {
          console.log('获取挑战列表失败:', error);
        }
      };
      loadData();
    }, [filters.is_active, filters.ongoing, store]),
  );

  const onRefresh = () => {
    fetchData(true);
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return '#52C41A';
      case 'normal':
        return '#1890FF';
      case 'hard':
        return '#FF4D4F';
      default:
        return '#8C8C8C';
    }
  };

  const getDifficultyText = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return '简单';
      case 'normal':
        return '普通';
      case 'hard':
        return '困难';
      default:
        return '未知';
    }
  };

  const formatTimeRange = (starts_at: string, ends_at: string) => {
    const start = dayjs(starts_at);
    const end = dayjs(ends_at);
    return `${start.format('MM/DD')} - ${end.format('MM/DD')}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
    },
    filterCard: {
      margin: 16,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    challengeCard: {
      marginBottom: 12,
      backgroundColor: colors.card,
    },
    challengeTitle: {
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
      marginRight: 8,
      color: colors.text,
    },
    challengeDescription: {
      fontSize: 14,
      color: colors.text2,
    },
    timeText: {
      fontSize: 12,
      color: colors.text2,
    },
    entryCoinsText: {
      fontSize: 14,
      color: '#FF6B35',
    },
    goalText: {
      fontSize: 12,
      color: colors.text2,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.text2,
    },
    myChallengeBtnCard: {
      marginTop: 20,
      backgroundColor: colors.background,
    },
    myChallengeBtnText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    filterText: {
      fontSize: 14,
      color: colors.text,
    },
  });

  const renderChallengeItem = (challenge: Challenge) => (
    <Card key={challenge.id} style={styles.challengeCard}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/challenges/detail',
            params: { id: challenge.id },
          } as any)
        }>
        <View style={{ gap: 12 }}>
          {/* 标题和难度 */}
          <Flex justify="between" align="center">
            <Text style={styles.challengeTitle}>
              {challenge.title}
            </Text>
            <Tag color={getDifficultyColor(challenge.difficulty)}>
              {getDifficultyText(challenge.difficulty)}
            </Tag>
          </Flex>

          {/* 描述 */}
          {challenge.description && (
            <Text style={styles.challengeDescription} numberOfLines={2}>
              {challenge.description}
            </Text>
          )}

          {/* 时间范围 */}
          <Text style={styles.timeText}>
            活动时间：{formatTimeRange(challenge.starts_at, challenge.ends_at)}
          </Text>

          {/* 入场币和奖励 */}
          <Flex justify="between" align="center">
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Text style={styles.entryCoinsText}>
                入场币：{challenge.entry_coins}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {challenge.reward_apps > 0 && (
                <Tag color="#1890FF">+{challenge.reward_apps}个App</Tag>
              )}
              {challenge.reward_duration > 0 && (
                <Tag color="#52C41A">+{challenge.reward_duration}分钟</Tag>
              )}
            </View>
          </Flex>

          {/* 目标信息 */}
          <Flex justify="between" align="center">
            <Text style={styles.goalText}>
              目标：{challenge.goal_total_mins}分钟总时长
            </Text>
            <Text style={styles.goalText}>
              {challenge.goal_repeat_times}次 × {challenge.goal_repeat_days}天
            </Text>
          </Flex>
        </View>
      </Pressable>
    </Card>
  );

  return (
    <Page safe bgcolor={colors.background}>
      <View style={styles.container}>
        {/* 页面标题 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>挑战活动</Text>
        </View>

        {/* 筛选器 */}
        <Card style={styles.filterCard}>
          <Flex justify="between" align="center">
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.filterText}>仅显示上架</Text>
              <Switch
                value={filters.is_active}
                onChange={value =>
                  setFilters(prev => ({ ...prev, is_active: value }))
                }
              />
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.filterText}>进行中</Text>
              <Switch
                value={filters.ongoing}
                onChange={value =>
                  setFilters(prev => ({ ...prev, ongoing: value }))
                }
              />
            </View>
          </Flex>
        </Card>

        {/* 挑战列表 */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}>
          {store.challenges.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无挑战活动</Text>
            </View>
          ) : (
            store.challenges.map(renderChallengeItem)
          )}

          {/* 我的挑战入口 */}
          <Card style={styles.myChallengeBtnCard}>
            <Pressable
              onPress={() => router.push('/challenges/my-list' as any)}>
              <View style={{ alignItems: 'center', padding: 12 }}>
                <Text style={styles.myChallengeBtnText}>
                  查看我的挑战
                </Text>
              </View>
            </Pressable>
          </Card>

          <Space />
        </ScrollView>
      </View>
    </Page>
  );
});

export default ChallengeListScreen;
