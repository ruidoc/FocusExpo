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
import Slider from '@react-native-community/slider';
import { useFocusEffect, useNavigation, useTheme } from '@react-navigation/native';
import dayjs from 'dayjs';
import { useLocalSearchParams } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const MyChallengeDetailScreen = observer(() => {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useLocalObservable(() => ChallengeStore);
  const { colors, dark } = useTheme();

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
    } catch {
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
    }, [id, fetchUserChallengeDetail]),
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
    } catch {
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
    } catch {
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
      <CusPage safe bgcolor={dark ? '#0D0D12' : '#F8F9FA'}>
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          <ActivityIndicator size="large" />
        </Flex>
      </CusPage>
    );
  }

  if (!userChallenge) {
    return (
      <CusPage safe bgcolor={dark ? '#0D0D12' : '#F8F9FA'}>
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          <Text style={styles.errorText}>挑战不存在</Text>
        </Flex>
      </CusPage>
    );
  }

  const progress = parseFloat(userChallenge.progress_percent);
  const isInProgress = userChallenge.status === 'in_progress';

  return (
    <CusPage safe bgcolor={dark ? '#0D0D12' : '#F8F9FA'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* 挑战基本信息 */}
        <Card style={styles.card}>
          <Flex direction="column">
            <Flex justify="between" align="start">
              <Text style={styles.title}>
                {userChallenge.challenge?.title || '挑战标题'}
              </Text>
              <Tag color={getStatusColor(userChallenge.status)}>
                {getStatusText(userChallenge.status)}
              </Tag>
            </Flex>

            {userChallenge.challenge?.description && (
              <Text style={styles.description}>
                {userChallenge.challenge.description}
              </Text>
            )}
          </Flex>
        </Card>

        {/* 进度信息 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>挑战进度</Text>
          <Flex direction="column">
            <Flex justify="between" align="center">
              <Text style={styles.infoLabel}>完成度</Text>
              <Text
                style={[
                  styles.progressText,
                  { color: getStatusColor(userChallenge.status) },
                ]}>
                {progress.toFixed(1)}%
              </Text>
            </Flex>

            {/* 简单的进度条 */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progress}%`,
                    backgroundColor: getStatusColor(userChallenge.status),
                  },
                ]}
              />
            </View>

            {isInProgress && (
              <Flex justify="end" style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  size="s"
                  onPress={() => setShowProgressModal(true)}>
                  更新进度
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* 时间信息 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>时间信息</Text>
          <View style={styles.timeInfo}>
            {userChallenge.started_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>开始时间</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(userChallenge.started_at)}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>截止时间</Text>
              <Text style={[styles.infoValue, { color: '#FF4D4F' }]}>
                {formatDateTime(userChallenge.deadline_at)}
              </Text>
            </View>
            {userChallenge.finished_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>完成时间</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(userChallenge.finished_at)}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* 挑战目标 */}
        {userChallenge.challenge && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>挑战目标</Text>
            <View style={styles.targetInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>总专注时长</Text>
                <Text style={styles.infoValue}>
                  {userChallenge.challenge.goal_total_mins} 分钟
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>单次最少时长</Text>
                <Text style={styles.infoValue}>
                  {userChallenge.challenge.goal_once_mins} 分钟
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>重复次数</Text>
                <Text style={styles.infoValue}>
                  {userChallenge.challenge.goal_repeat_times} 次
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* 其他信息 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>其他信息</Text>
          <View style={styles.otherInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>入场费用</Text>
              <Text style={styles.priceText}>
                {userChallenge.entry_coins} 金币
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>关联计划</Text>
              <Text style={styles.infoValue}>
                {userChallenge.plan_ids.length} 个
              </Text>
            </View>
            {userChallenge.result_reason && (
              <View style={styles.reasonContainer}>
                <Text style={styles.infoLabel}>结果说明</Text>
                <Text style={styles.reasonText}>
                  {userChallenge.result_reason}
                </Text>
              </View>
            )}
          </View>
        </Card>

        <Space />

        {/* 操作按钮 */}
        {isInProgress && (
          <Flex style={{ gap: 12 }}>
            <Button
              style={styles.actionButton}
              onPress={() => {
                setFinishStatus('cancelled');
                setShowFinishModal(true);
              }}>
              放弃挑战
            </Button>
            <Button
              type="primary"
              style={styles.actionButton}
              onPress={() => {
                setFinishStatus('succeeded');
                setShowFinishModal(true);
              }}>
              完成挑战
            </Button>
          </Flex>
        )}

        <Space />
      </ScrollView>

      {/* 进度更新弹框 */}
      <Modal
        visible={showProgressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProgressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>更新进度</Text>

            <Text style={styles.currentProgress}>
              当前进度：{progress.toFixed(1)}%
            </Text>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>设置新进度：</Text>
              <Slider
                style={styles.slider}
                value={progressValue}
                minimumValue={0}
                maximumValue={100}
                step={1}
                onValueChange={setProgressValue}
                minimumTrackTintColor="#1890FF"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#1890FF"
              />
              <Text style={styles.sliderValue}>
                {progressValue.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Button
                style={styles.modalButton}
                onPress={() => setShowProgressModal(false)}>
                取消
              </Button>
              <Button
                type="primary"
                style={styles.modalButton}
                loading={updating}
                onPress={handleUpdateProgress}>
                确认更新
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* 完成挑战弹框 */}
      <Modal
        visible={showFinishModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFinishModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {finishStatus === 'succeeded' ? '完成挑战' : '放弃挑战'}
            </Text>

            <Text style={styles.modalSubtitle}>
              {finishStatus === 'succeeded'
                ? '确认已完成挑战目标？完成后将获得相应奖励。'
                : '确认要放弃这个挑战吗？放弃后将无法恢复。'}
            </Text>

            {(finishStatus === 'failed' || finishStatus === 'cancelled') && (
              <View style={styles.reasonInput}>
                <Text style={styles.reasonLabel}>
                  {finishStatus === 'failed'
                    ? '失败原因（可选）：'
                    : '放弃原因（可选）：'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={finishReason}
                  onChangeText={setFinishReason}
                  placeholder={`请简要说明${finishStatus === 'failed' ? '失败' : '放弃'
                    }原因...`}
                  maxLength={200}
                  multiline
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button
                style={styles.modalButton}
                onPress={() => setShowFinishModal(false)}>
                取消
              </Button>
              <Button
                type="primary"
                style={styles.modalButton}
                loading={finishing}
                onPress={handleFinishChallenge}>
                {finishStatus === 'succeeded' ? '确认完成' : '确认放弃'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </CusPage>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  updateButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  timeInfo: {
    gap: 8,
  },
  targetInfo: {
    gap: 8,
  },
  otherInfo: {
    gap: 8,
  },
  priceText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
  reasonContainer: {
    gap: 4,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    minHeight: 200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  currentProgress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 14,
    color: '#1890FF',
    textAlign: 'center',
    marginTop: 8,
  },
  reasonInput: {
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default MyChallengeDetailScreen;
