import { CusPage } from '@/components';
import ChallengeStore, { UserChallenge } from '@/stores/challenge';
import {
  Button,
  Card,
  Flex,
  Modal,
  Progress,
  Slider,
  Space,
  Tag,
  Text,
  TextArea,
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
import { ActivityIndicator, Alert, ScrollView } from 'react-native';

const MyChallengeDetailScreen = observer(() => {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useLocalObservable(() => ChallengeStore);

  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // 进度更新相关
  const [progressValue, setProgressValue] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // 完成挑战相关
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishStatus, setFinishStatus] = useState<
    'succeeded' | 'failed' | 'cancelled'
  >('succeeded');
  const [finishReason, setFinishReason] = useState('');

  const fetchUserChallengeDetail = async () => {
    if (!id) return;

    // 从store中查找
    const found = store.my_challenges.find(uc => uc.id === id);
    if (found) {
      setUserChallenge(found);
      setProgressValue(parseFloat(found.progress_percent));
      setLoading(false);
      return;
    }

    // 如果store中没有，重新获取用户挑战列表
    setLoading(true);
    try {
      await store.fetchUserChallenges();
      const foundAfterFetch = store.my_challenges.find(uc => uc.id === id);
      if (foundAfterFetch) {
        setUserChallenge(foundAfterFetch);
        setProgressValue(parseFloat(foundAfterFetch.progress_percent));
      }
    } catch (error) {
      Toast({
        type: 'fail',
        message: '获取挑战详情失败',
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserChallengeDetail();
    }, [id]),
  );

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

  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).format('YYYY/MM/DD HH:mm');
  };

  const handleUpdateProgress = async () => {
    if (!userChallenge) return;

    setUpdating(true);
    try {
      const result = await store.updateChallengeProgress(
        userChallenge.id,
        progressValue,
      );
      if (result) {
        setUserChallenge(result);
        setShowProgressModal(false);
        Toast({
          type: 'success',
          message: '进度更新成功',
        });
      }
    } catch (error) {
      Toast({
        type: 'fail',
        message: '进度更新失败',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleFinishChallenge = async () => {
    if (!userChallenge) return;

    setFinishing(true);
    try {
      const result = await store.finishChallenge(
        userChallenge.id,
        finishStatus,
        finishReason || undefined,
      );
      if (result) {
        setUserChallenge(result);
        setShowFinishModal(false);

        if (finishStatus === 'succeeded') {
          // 显示奖励信息
          const challenge = result.challenge;
          let rewardText = '挑战完成！';
          if (challenge?.reward_apps || challenge?.reward_duration) {
            rewardText += '\n获得奖励：';
            if (challenge.reward_apps > 0) {
              rewardText += `\n• +${challenge.reward_apps} 个可选App`;
            }
            if (challenge.reward_duration > 0) {
              rewardText += `\n• +${challenge.reward_duration} 分钟专注时长`;
            }
          }

          Alert.alert('恭喜！', rewardText, [
            {
              text: '确定',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          Toast({
            type: 'success',
            message: '操作完成',
          });
        }
      }
    } catch (error) {
      Toast({
        type: 'fail',
        message: '操作失败',
      });
    } finally {
      setFinishing(false);
    }
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

  if (!userChallenge) {
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

  const progress = parseFloat(userChallenge.progress_percent);
  const isInProgress = userChallenge.status === 'in_progress';
  const isFinished = ['succeeded', 'failed', 'cancelled', 'expired'].includes(
    userChallenge.status,
  );

  return (
    <CusPage title="我的挑战" safeAreaColor="#FAFAFA">
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FAFAFA' }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}>
        {/* 挑战基本信息 */}
        <Card style={{ marginBottom: 16 }}>
          <Flex direction="column" gap={16}>
            <Flex justify="space-between" align="flex-start">
              <Text size={18} weight="600" style={{ flex: 1, marginRight: 12 }}>
                {userChallenge.challenge?.title || '挑战标题'}
              </Text>
              <Tag color={getStatusColor(userChallenge.status)}>
                {getStatusText(userChallenge.status)}
              </Tag>
            </Flex>

            {userChallenge.challenge?.description && (
              <Text size={14} color="#666" style={{ lineHeight: 20 }}>
                {userChallenge.challenge.description}
              </Text>
            )}
          </Flex>
        </Card>

        {/* 进度信息 */}
        <Card style={{ marginBottom: 16 }}>
          <Text size={16} weight="500" style={{ marginBottom: 12 }}>
            挑战进度
          </Text>
          <Flex direction="column" gap={12}>
            <Flex justify="space-between" align="center">
              <Text size={14} color="#666">
                完成度
              </Text>
              <Text
                size={16}
                weight="500"
                color={getStatusColor(userChallenge.status)}>
                {progress.toFixed(1)}%
              </Text>
            </Flex>
            <Progress
              percent={progress}
              strokeColor={getStatusColor(userChallenge.status)}
              showInfo={false}
              strokeWidth={8}
            />

            {isInProgress && (
              <Button
                type="primary"
                size="small"
                onPress={() => setShowProgressModal(true)}
                style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                更新进度
              </Button>
            )}
          </Flex>
        </Card>

        {/* 时间信息 */}
        <Card style={{ marginBottom: 16 }}>
          <Text size={16} weight="500" style={{ marginBottom: 12 }}>
            时间信息
          </Text>
          <Flex direction="column" gap={8}>
            {userChallenge.started_at && (
              <Flex justify="space-between">
                <Text size={14} color="#666">
                  开始时间
                </Text>
                <Text size={14}>
                  {formatDateTime(userChallenge.started_at)}
                </Text>
              </Flex>
            )}
            <Flex justify="space-between">
              <Text size={14} color="#666">
                截止时间
              </Text>
              <Text size={14} color="#FF4D4F">
                {formatDateTime(userChallenge.deadline_at)}
              </Text>
            </Flex>
            {userChallenge.finished_at && (
              <Flex justify="space-between">
                <Text size={14} color="#666">
                  完成时间
                </Text>
                <Text size={14}>
                  {formatDateTime(userChallenge.finished_at)}
                </Text>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* 挑战目标 */}
        {userChallenge.challenge && (
          <Card style={{ marginBottom: 16 }}>
            <Text size={16} weight="500" style={{ marginBottom: 12 }}>
              挑战目标
            </Text>
            <Flex direction="column" gap={8}>
              <Flex justify="space-between">
                <Text size={14} color="#666">
                  总专注时长
                </Text>
                <Text size={14}>
                  {userChallenge.challenge.goal_total_mins} 分钟
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text size={14} color="#666">
                  单次最少时长
                </Text>
                <Text size={14}>
                  {userChallenge.challenge.goal_once_mins} 分钟
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text size={14} color="#666">
                  重复次数
                </Text>
                <Text size={14}>
                  {userChallenge.challenge.goal_repeat_times} 次
                </Text>
              </Flex>
            </Flex>
          </Card>
        )}

        {/* 其他信息 */}
        <Card style={{ marginBottom: 16 }}>
          <Text size={16} weight="500" style={{ marginBottom: 12 }}>
            其他信息
          </Text>
          <Flex direction="column" gap={8}>
            <Flex justify="space-between">
              <Text size={14} color="#666">
                入场费用
              </Text>
              <Text size={14} color="#FF6B35">
                {userChallenge.entry_coins} 金币
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text size={14} color="#666">
                关联计划
              </Text>
              <Text size={14}>{userChallenge.plan_ids.length} 个</Text>
            </Flex>
            {userChallenge.result_reason && (
              <Flex direction="column" gap={4}>
                <Text size={14} color="#666">
                  结果说明
                </Text>
                <Text size={14} style={{ lineHeight: 20 }}>
                  {userChallenge.result_reason}
                </Text>
              </Flex>
            )}
          </Flex>
        </Card>

        <Space size={20} />

        {/* 操作按钮 */}
        {isInProgress && (
          <Flex gap={12}>
            <Button
              style={{ flex: 1 }}
              onPress={() => {
                setFinishStatus('cancelled');
                setShowFinishModal(true);
              }}>
              放弃挑战
            </Button>
            <Button
              type="primary"
              style={{ flex: 1 }}
              onPress={() => {
                setFinishStatus('succeeded');
                setShowFinishModal(true);
              }}>
              完成挑战
            </Button>
          </Flex>
        )}

        <Space size={40} />
      </ScrollView>

      {/* 进度更新弹框 */}
      <Modal
        visible={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="更新进度"
        showCloseIcon>
        <Flex direction="column" gap={20} style={{ minHeight: 200 }}>
          <Text size={14} color="#666">
            当前进度：{progress.toFixed(1)}%
          </Text>

          <Flex direction="column" gap={12}>
            <Text size={14} weight="500">
              设置新进度：
            </Text>
            <Slider
              value={progressValue}
              min={0}
              max={100}
              step={1}
              onChange={setProgressValue}
              style={{ width: '100%' }}
            />
            <Text size={14} color="#1890FF" style={{ textAlign: 'center' }}>
              {progressValue.toFixed(1)}%
            </Text>
          </Flex>

          <Flex gap={12} style={{ marginTop: 20 }}>
            <Button
              style={{ flex: 1 }}
              onPress={() => setShowProgressModal(false)}>
              取消
            </Button>
            <Button
              type="primary"
              style={{ flex: 1 }}
              loading={updating}
              onPress={handleUpdateProgress}>
              确认更新
            </Button>
          </Flex>
        </Flex>
      </Modal>

      {/* 完成挑战弹框 */}
      <Modal
        visible={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title={finishStatus === 'succeeded' ? '完成挑战' : '放弃挑战'}
        showCloseIcon>
        <Flex direction="column" gap={16} style={{ minHeight: 200 }}>
          <Text size={14} color="#666">
            {finishStatus === 'succeeded'
              ? '确认已完成挑战目标？完成后将获得相应奖励。'
              : '确认要放弃这个挑战吗？放弃后将无法恢复。'}
          </Text>

          {finishStatus === 'failed' && (
            <Flex direction="column" gap={8}>
              <Text size={14} weight="500">
                失败原因（可选）：
              </Text>
              <TextArea
                value={finishReason}
                onChange={setFinishReason}
                placeholder="请简要说明失败原因..."
                maxLength={200}
                showCount
              />
            </Flex>
          )}

          {finishStatus === 'cancelled' && (
            <Flex direction="column" gap={8}>
              <Text size={14} weight="500">
                放弃原因（可选）：
              </Text>
              <TextArea
                value={finishReason}
                onChange={setFinishReason}
                placeholder="请简要说明放弃原因..."
                maxLength={200}
                showCount
              />
            </Flex>
          )}

          <Flex gap={12} style={{ marginTop: 16 }}>
            <Button
              style={{ flex: 1 }}
              onPress={() => setShowFinishModal(false)}>
              取消
            </Button>
            <Button
              type="primary"
              style={{ flex: 1 }}
              loading={finishing}
              onPress={handleFinishChallenge}>
              {finishStatus === 'succeeded' ? '确认完成' : '确认放弃'}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </CusPage>
  );
});

export default MyChallengeDetailScreen;
