import { CusPage } from '@/components';
import ChallengeStore, { UserChallenge } from '@/stores/challenge';
import {
  Button,
  Card,
  Flex,
  Space,
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

const MyChallengesScreen = observer(() => {
  const store = useLocalObservable(() => ChallengeStore);
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
        type: 'fail',
        message: '获取我的挑战失败',
      });
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeTab, fetchData]),
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
      <Card key={userChallenge.id} style={styles.challengeCard}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/challenges/my-challenge-detail',
              params: { id: userChallenge.id },
            } as any)
          }>
          <Flex direction="column">
            {/* 标题和状态 */}
            <Flex justify="between" align="center">
              <Text style={styles.challengeTitle}>
                {userChallenge.challenge?.title || '挑战标题'}
              </Text>
              <Tag color={getStatusColor(userChallenge.status)}>
                {getStatusText(userChallenge.status)}
              </Tag>
            </Flex>

            {/* 进度条 */}
            <Flex direction="column">
              <Flex justify="between" align="center">
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
            <Flex justify="between" align="center">
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
              <Flex align="center" style={{ gap: 4 }}>
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

  const filteredChallenges = store.my_challenges;

  return (
    <CusPage bgcolor="#FAFAFA">
      <Flex direction="column" style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        {/* 状态筛选 */}
        <Card style={styles.filterCard}>
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
        </Card>

        {/* 挑战列表 */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}>
          {filteredChallenges.length === 0 ? (
            <Flex justify="center" align="center" style={{ paddingTop: 60 }}>
              <Text style={styles.emptyText}>
                {activeTab === 'all'
                  ? '暂无挑战记录'
                  : `暂无${
                      statusOptions.find(o => o.value === activeTab)?.label
                    }的挑战`}
              </Text>

              {activeTab === 'all' && (
                <Button
                  type="primary"
                  size="s"
                  style={styles.goButton}
                  onPress={() => router.push('/challenges/index' as any)}>
                  去领取挑战
                </Button>
              )}
            </Flex>
          ) : (
            filteredChallenges.map(renderChallengeItem)
          )}

          <Space />
        </ScrollView>
      </Flex>
    </CusPage>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  filterCard: {
    margin: 16,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minWidth: 60,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1890FF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
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
  },
  challengeContent: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  progressSection: {
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
  },
  coinsText: {
    fontSize: 12,
    color: '#666',
  },
  reasonText: {
    fontSize: 12,
    color: '#999',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planLabel: {
    fontSize: 12,
    color: '#666',
  },
  planCount: {
    fontSize: 12,
    color: '#1890FF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  goButton: {
    marginTop: 16,
  },
});

export default MyChallengesScreen;
