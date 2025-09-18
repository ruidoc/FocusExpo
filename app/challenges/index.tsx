import { CusPage } from '@/components';
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
  Text,
  View,
} from 'react-native';

const ChallengeListScreen = observer(() => {
  const store = useLocalObservable(() => ChallengeStore);
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

  const renderChallengeItem = (challenge: Challenge) => (
    <Card key={challenge.id} style={{ marginBottom: 12 }}>
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
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                flex: 1,
                marginRight: 8,
              }}>
              {challenge.title}
            </Text>
            <Tag color={getDifficultyColor(challenge.difficulty)}>
              {getDifficultyText(challenge.difficulty)}
            </Tag>
          </Flex>

          {/* 描述 */}
          {challenge.description && (
            <Text style={{ fontSize: 14, color: '#666' }} numberOfLines={2}>
              {challenge.description}
            </Text>
          )}

          {/* 时间范围 */}
          <Text style={{ fontSize: 12, color: '#999' }}>
            活动时间：{formatTimeRange(challenge.starts_at, challenge.ends_at)}
          </Text>

          {/* 入场币和奖励 */}
          <Flex justify="between" align="center">
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Text style={{ fontSize: 14, color: '#FF6B35' }}>
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
            <Text style={{ fontSize: 12, color: '#666' }}>
              目标：{challenge.goal_total_mins}分钟总时长
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {challenge.goal_repeat_times}次 × {challenge.goal_repeat_days}天
            </Text>
          </Flex>
        </View>
      </Pressable>
    </Card>
  );

  return (
    <CusPage bgcolor="#FAFAFA">
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        {/* 筛选器 */}
        <Card style={{ margin: 16, marginBottom: 8 }}>
          <Flex justify="between" align="center">
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14 }}>仅显示上架</Text>
              <Switch
                value={filters.is_active}
                onChange={value =>
                  setFilters(prev => ({ ...prev, is_active: value }))
                }
              />
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14 }}>进行中</Text>
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
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 16, color: '#999' }}>暂无挑战活动</Text>
            </View>
          ) : (
            store.challenges.map(renderChallengeItem)
          )}

          {/* 我的挑战入口 */}
          <Card style={{ marginTop: 20, backgroundColor: '#F0F9FF' }}>
            <Pressable
              onPress={() => router.push('/challenges/my-challenges' as any)}>
              <View style={{ alignItems: 'center', padding: 12 }}>
                <Text
                  style={{ fontSize: 16, color: '#1890FF', fontWeight: '500' }}>
                  查看我的挑战
                </Text>
              </View>
            </Pressable>
          </Card>

          <Space />
        </ScrollView>
      </View>
    </CusPage>
  );
});

export default ChallengeListScreen;
