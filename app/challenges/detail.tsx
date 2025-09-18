import { CusPage } from '@/components';
import ChallengeStore, { Challenge } from '@/stores/challenge';
import PlanStore from '@/stores/plan';
import {
  Button,
  Card,
  Checkbox,
  Flex,
  Modal,
  Space,
  Tag,
  Text,
  Toast,
} from '@fruits-chain/react-native-xiaoshu';
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from '@react-navigation/native';
import dayjs from 'dayjs';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';

const ChallengeDetailScreen = observer(() => {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeStore = useLocalObservable(() => ChallengeStore);
  const planStore = useLocalObservable(() => PlanStore);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  const fetchChallengeDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const result = await challengeStore.fetchChallengeById(id);
      setChallenge(result);
    } catch (error) {
      Toast({
        type: 'fail',
        message: '获取挑战详情失败',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      await planStore.fetchPlans();
    } catch (error) {
      console.log('获取计划列表失败:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChallengeDetail();
      fetchPlans();
    }, [id]),
  );

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

  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).format('YYYY/MM/DD HH:mm');
  };

  const handleClaim = () => {
    if (planStore.all_plans.length === 0) {
      Toast({
        type: 'fail',
        message: '请先创建专注计划',
      });
      return;
    }
    setShowPlanModal(true);
  };

  const handleConfirmClaim = async () => {
    if (selectedPlanIds.length === 0) {
      Toast({
        type: 'fail',
        message: '请选择至少一个计划',
      });
      return;
    }

    setClaiming(true);
    try {
      const result = await challengeStore.claimChallenge(id!, selectedPlanIds);
      if (result) {
        Toast({
          type: 'success',
          message: '领取成功！',
        });
        setShowPlanModal(false);
        // 跳转到我的挑战详情
        navigation.navigate(
          'challenges/my-challenge-detail' as never,
          {
            id: result.id,
          } as never,
        );
      }
    } catch (error) {
      Toast({
        type: 'fail',
        message: '领取失败，请重试',
      });
    } finally {
      setClaiming(false);
    }
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedPlanIds(prev =>
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId],
    );
  };

  if (loading) {
    return (
      <CusPage title="挑战详情" safeAreaColor="#FAFAFA">
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          <ActivityIndicator size="large" />
        </Flex>
      </CusPage>
    );
  }

  if (!challenge) {
    return (
      <CusPage title="挑战详情" safeAreaColor="#FAFAFA">
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          <Text size={16} color="#999">
            挑战不存在
          </Text>
        </Flex>
      </CusPage>
    );
  }

  return (
    <CusPage title="挑战详情" safeAreaColor="#FAFAFA">
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FAFAFA' }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}>
        {/* 基本信息 */}
        <Card style={{ marginBottom: 16 }}>
          <Flex direction="column" gap={16}>
            <Flex justify="space-between" align="flex-start">
              <Text size={18} weight="600" style={{ flex: 1, marginRight: 12 }}>
                {challenge.title}
              </Text>
              <Tag color={getDifficultyColor(challenge.difficulty)}>
                {getDifficultyText(challenge.difficulty)}
              </Tag>
            </Flex>

            {challenge.description && (
              <Text size={14} color="#666" style={{ lineHeight: 20 }}>
                {challenge.description}
              </Text>
            )}

            <Flex justify="space-between">
              <Text size={14} color="#999">
                开始时间：{formatDateTime(challenge.starts_at)}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text size={14} color="#999">
                结束时间：{formatDateTime(challenge.ends_at)}
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* 目标配置 */}
        <Card style={{ marginBottom: 16 }}>
          <Text size={16} weight="500" style={{ marginBottom: 12 }}>
            挑战目标
          </Text>
          <Flex direction="column" gap={8}>
            <Flex justify="space-between">
              <Text size={14} color="#666">
                总专注时长
              </Text>
              <Text size={14} weight="500">
                {challenge.goal_total_mins} 分钟
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text size={14} color="#666">
                单次最少时长
              </Text>
              <Text size={14} weight="500">
                {challenge.goal_once_mins} 分钟
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text size={14} color="#666">
                重复次数
              </Text>
              <Text size={14} weight="500">
                {challenge.goal_repeat_times} 次
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text size={14} color="#666">
                重复天数
              </Text>
              <Text size={14} weight="500">
                {challenge.goal_repeat_days} 天
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* 必屏蔽应用 */}
        {challenge.required_apps && challenge.required_apps.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Text size={16} weight="500" style={{ marginBottom: 12 }}>
              必须屏蔽的应用
            </Text>
            <Flex direction="row" wrap gap={8}>
              {challenge.required_apps.map((bundleId, index) => (
                <Tag key={index} color="#FF4D4F" size="small">
                  {bundleId}
                </Tag>
              ))}
            </Flex>
          </Card>
        )}

        {/* 费用和奖励 */}
        <Card style={{ marginBottom: 16 }}>
          <Text size={16} weight="500" style={{ marginBottom: 12 }}>
            费用与奖励
          </Text>
          <Flex direction="column" gap={12}>
            <Flex justify="space-between" align="center">
              <Text size={14} color="#666">
                入场费用
              </Text>
              <Text size={16} color="#FF6B35" weight="500">
                {challenge.entry_coins} 金币
              </Text>
            </Flex>

            <Text size={14} color="#666" style={{ marginTop: 8 }}>
              完成奖励：
            </Text>
            <Flex direction="row" gap={8}>
              {challenge.reward_apps > 0 && (
                <Tag color="#1890FF">+{challenge.reward_apps} 个可选App</Tag>
              )}
              {challenge.reward_duration > 0 && (
                <Tag color="#52C41A">
                  +{challenge.reward_duration} 分钟专注时长
                </Tag>
              )}
              {challenge.reward_unlimited > 0 && (
                <Tag color="#722ED1">+{challenge.reward_unlimited} 天会员</Tag>
              )}
            </Flex>
          </Flex>
        </Card>

        <Space size={20} />

        {/* 领取按钮 */}
        <Button
          type="primary"
          size="large"
          onPress={handleClaim}
          disabled={!challenge.is_active}>
          {challenge.is_active ? '领取挑战' : '挑战已下架'}
        </Button>

        <Space size={40} />
      </ScrollView>

      {/* 计划选择弹框 */}
      <Modal
        visible={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="选择计划"
        showCloseIcon>
        <Flex direction="column" gap={12} style={{ maxHeight: 400 }}>
          <Text size={14} color="#666" style={{ marginBottom: 8 }}>
            请选择要关联的专注计划：
          </Text>

          <ScrollView style={{ maxHeight: 300 }}>
            {planStore.all_plans.map(plan => (
              <Card
                key={plan.id}
                style={{
                  marginBottom: 8,
                  backgroundColor: selectedPlanIds.includes(plan.id!)
                    ? '#F0F9FF'
                    : '#FFF',
                }}>
                <Flex align="center" gap={12}>
                  <Checkbox
                    checked={selectedPlanIds.includes(plan.id!)}
                    onChange={() => togglePlanSelection(plan.id!)}
                  />
                  <Flex direction="column" style={{ flex: 1 }}>
                    <Text size={14} weight="500">
                      {dayjs(plan.start, 'HH:mm').format('HH:mm')} -{' '}
                      {dayjs(plan.end, 'HH:mm').format('HH:mm')}
                    </Text>
                    <Text size={12} color="#666">
                      {plan.mode === 'focus' ? '专注模式' : '屏蔽模式'} •{' '}
                      {Array.isArray(plan.repeat)
                        ? `周${plan.repeat.join(',')}`
                        : '一次性'}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </ScrollView>

          <Flex gap={12} style={{ marginTop: 16 }}>
            <Button style={{ flex: 1 }} onPress={() => setShowPlanModal(false)}>
              取消
            </Button>
            <Button
              type="primary"
              style={{ flex: 1 }}
              loading={claiming}
              onPress={handleConfirmClaim}>
              确认领取
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </CusPage>
  );
});

export default ChallengeDetailScreen;
