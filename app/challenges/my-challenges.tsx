import { CusPage } from '@/components';
import ChallengeStore, { UserChallenge } from '@/stores/challenge';
import {
  Button,
  Card,
  Flex,
  Progress,
  Segmented,
  Space,
  Tag,
  Toast,
} from '@fruits-chain/react-native-xiaoshu';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text } from 'react-native';

const MyChallengesScreen = observer(() => {
  const navigation = useNavigation();
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
    } catch (error) {
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
    }, [activeTab]),
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
      <Card key={userChallenge.id} style={{ marginBottom: 12 }}>
        <Pressable
          onPress={() =>
            navigation.navigate(
              'challenges/my-challenge-detail' as never,
              {
                id: userChallenge.id,
              } as never,
            )
          }>
          <Flex direction="column" gap={12}>
            {/* 标题和状态 */}
            <Flex justify="space-between" align="center">
              <Text size={16} weight="500" style={{ flex: 1, marginRight: 8 }}>
                {userChallenge.challenge?.title || '挑战标题'}
              </Text>
              <Tag color={getStatusColor(userChallenge.status)}>
                {getStatusText(userChallenge.status)}
              </Tag>
            </Flex>

            {/* 进度条 */}
            <Flex direction="column" gap={4}>
              <Flex justify="space-between" align="center">
                <Text size={12} color="#666">
                  进度
                </Text>
                <Text size={12} color="#666">
                  {progress.toFixed(1)}%
                </Text>
              </Flex>
              <Progress
                percent={progress}
                strokeColor={
                  userChallenge.status === 'succeeded'
                    ? '#52C41A'
                    : userChallenge.status === 'failed'
                    ? '#FF4D4F'
                    : userChallenge.status === 'in_progress'
                    ? '#1890FF'
                    : '#8C8C8C'
                }
                showInfo={false}
                strokeWidth={6}
              />
            </Flex>

            {/* 截止时间 */}
            <Flex justify="space-between" align="center">
              <Text
                size={12}
                color={getDeadlineColor(userChallenge.deadline_at)}>
                {formatDeadline(userChallenge.deadline_at)}
              </Text>
              <Text size={12} color="#666">
                入场币：{userChallenge.entry_coins}
              </Text>
            </Flex>

            {/* 结果原因 */}
            {userChallenge.result_reason && (
              <Text size={12} color="#999" numberOfLines={1}>
                {userChallenge.result_reason}
              </Text>
            )}

            {/* 关联计划 */}
            {userChallenge.plan_ids.length > 0 && (
              <Flex justify="flex-start" align="center" gap={4}>
                <Text size={12} color="#666">
                  关联计划：
                </Text>
                <Text size={12} color="#1890FF">
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
    <CusPage title="我的挑战" safeAreaColor="#FAFAFA">
      <Flex direction="column" style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        {/* 状态筛选 */}
        <Card style={{ margin: 16, marginBottom: 8 }}>
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={statusOptions}
            style={{ width: '100%' }}
          />
        </Card>

        {/* 挑战列表 */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}>
          {filteredChallenges.length === 0 ? (
            <Flex justify="center" align="center" style={{ paddingTop: 60 }}>
              <Text size={16} color="#999">
                {activeTab === 'all'
                  ? '暂无挑战记录'
                  : `暂无${
                      statusOptions.find(o => o.value === activeTab)?.label
                    }的挑战`}
              </Text>

              {activeTab === 'all' && (
                <Button
                  type="primary"
                  size="small"
                  style={{ marginTop: 16 }}
                  onPress={() =>
                    navigation.navigate('challenges/index' as never)
                  }>
                  去领取挑战
                </Button>
              )}
            </Flex>
          ) : (
            filteredChallenges.map(renderChallengeItem)
          )}

          <Space size={20} />
        </ScrollView>
      </Flex>
    </CusPage>
  );
});

export default MyChallengesScreen;
