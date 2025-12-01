import { Page } from '@/components/business';
import { Card, Flex, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useChallengeStore } from '@/stores';
import { UserChallenge } from '@/stores/challenge';
import { Tag } from '@fruits-chain/react-native-xiaoshu';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const MyChallengesScreen = () => {
  const store = useChallengeStore();
  const { colors } = useCustomTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '进行中', value: 'in_progress' },
    { label: '成功', value: 'succeeded' },
    { label: '失败', value: 'failed' },
    { label: '取消', value: 'cancelled' },
    { label: '过期', value: 'expired' },
  ];

  const fetchData = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      await store.fetchUserChallenges(status);
    } catch {
      Toast({
        type: 'error',
        message: '获取我的挑战失败',
      });
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const status = activeTab === 'all' ? undefined : activeTab;
          await store.fetchUserChallenges(status);
        } catch (error) {
          console.log('获取我的挑战失败:', error);
        }
      };
      loadData();
    }, [activeTab, store]),
  );

  const onRefresh = () => {
    fetchData(true);
  };

  const getStatusColor = (status: UserChallenge['status']) => {
    switch (status) {
      case 'claimed':
        return '#8C8C8C';
      case 'in_progress':
        return '#1890FF';
      case 'succeeded':
        return '#52C41A';
      case 'failed':
        return '#FF4D4F';
      case 'cancelled':
        return '#FAAD14';
      case 'expired':
        return '#8C8C8C';
      default:
        return '#8C8C8C';
    }
  };

  const getStatusText = (status: UserChallenge['status']) => {
    switch (status) {
      case 'claimed':
        return '已领取';
      case 'in_progress':
        return '进行中';
      case 'succeeded':
        return '成功';
      case 'failed':
        return '失败';
      case 'cancelled':
        return '取消';
      case 'expired':
        return '过期';
      default:
        return '未知';
    }
  };

  const formatDeadline = (deadline: string) => {
    const now = dayjs();
    const deadlineTime = dayjs(deadline);
    const diff = deadlineTime.diff(now, 'hour');

    if (diff < 0) {
      return '已截止';
    } else if (diff < 24) {
      return `${diff}小时后截止`;
    } else {
      const days = Math.ceil(diff / 24);
      return `${days}天后截止`;
    }
  };

  const getDeadlineColor = (deadline: string) => {
    const now = dayjs();
    const deadlineTime = dayjs(deadline);
    const diff = deadlineTime.diff(now, 'hour');

    if (diff < 0) return '#8C8C8C';
    if (diff < 24) return '#FF4D4F';
    if (diff < 72) return '#FAAD14';
    return '#52C41A';
  };

  const renderChallengeItem = (userChallenge: UserChallenge) => {
    const progress = parseFloat(userChallenge.progress_percent);

    return (
      <Card key={userChallenge.id} title="" className="mb-3">
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/challenges/my-detail',
              params: { id: userChallenge.id },
            } as any)
          }>
          <Flex className="flex-col">
            {/* 标题和状态 */}
            <Flex className="justify-between">
              <Text style={styles.challengeTitle}>
                {userChallenge.challenge?.title || '挑战标题'}
              </Text>
              <Tag color={getStatusColor(userChallenge.status)}>
                {getStatusText(userChallenge.status)}
              </Tag>
            </Flex>

            {/* 进度条 */}
            <Flex className="flex-col">
              <Flex className="justify-between">
                <Text style={styles.progressLabel}>进度</Text>
                <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
              </Flex>

              {/* 简单的进度条 */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progress}%`,
                      backgroundColor:
                        userChallenge.status === 'succeeded'
                          ? '#52C41A'
                          : userChallenge.status === 'failed'
                            ? '#FF4D4F'
                            : userChallenge.status === 'in_progress'
                              ? '#1890FF'
                              : '#8C8C8C',
                    },
                  ]}
                />
              </View>
            </Flex>

            {/* 截止时间 */}
            <Flex className="justify-between">
              <Text
                style={[
                  styles.deadlineText,
                  { color: getDeadlineColor(userChallenge.deadline_at) },
                ]}>
                {formatDeadline(userChallenge.deadline_at)}
              </Text>
              <Text style={styles.coinsText}>
                入场币：{userChallenge.entry_coins}
              </Text>
            </Flex>

            {/* 结果原因 */}
            {userChallenge.result_reason && (
              <Text style={styles.reasonText} numberOfLines={1}>
                {userChallenge.result_reason}
              </Text>
            )}

            {/* 关联计划 */}
            {userChallenge.plan_ids.length > 0 && (
              <Flex className="gap-1">
                <Text style={styles.planLabel}>关联计划：</Text>
                <Text style={styles.planCount}>
                  {userChallenge.plan_ids.length} 个
                </Text>
              </Flex>
            )}
          </Flex>
        </Pressable>
      </Card>
    );
  };

  const styles = StyleSheet.create({
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
      borderTopWidth: 0,
      borderTopColor: colors.border,
      paddingTop: 10,
      paddingBottom: 16,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    filterContainer: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      minWidth: 60,
      alignItems: 'center',
    },
    filterButtonActive: {
      backgroundColor: '#1890FF',
    },
    filterText: {
      fontSize: 14,
      color: colors.text2,
    },
    filterTextActive: {
      color: '#FFF',
      fontWeight: '500',
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      padding: 16,
      paddingTop: 8,
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
    progressLabel: {
      fontSize: 12,
      color: colors.text2,
    },
    progressText: {
      fontSize: 12,
      color: colors.text2,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 3,
    },
    deadlineText: {
      fontSize: 12,
    },
    coinsText: {
      fontSize: 12,
      color: colors.text2,
    },
    reasonText: {
      fontSize: 12,
      color: colors.text2,
    },
    planLabel: {
      fontSize: 12,
      color: colors.text2,
    },
    planCount: {
      fontSize: 12,
      color: colors.primary,
    },
    emptyText: {
      fontSize: 16,
      color: colors.text2,
    },
    goButton: {
      marginTop: 16,
    },
  });

  const filteredChallenges = store.my_challenges;

  return (
    <Page>
      {/* 状态筛选 */}
      <Flex style={styles.filterCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}>
          {statusOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.filterButton,
                activeTab === option.value && styles.filterButtonActive,
              ]}
              onPress={() => setActiveTab(option.value)}>
              <Text
                style={[
                  styles.filterText,
                  activeTab === option.value && styles.filterTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Flex>

      {/* 挑战列表 */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {filteredChallenges.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? '暂无挑战记录'
                : `暂无${statusOptions.find(o => o.value === activeTab)?.label}的挑战`}
            </Text>
          </View>
        ) : (
          filteredChallenges.map(renderChallengeItem)
        )}
      </ScrollView>
    </Page>
  );
};

export default MyChallengesScreen;
