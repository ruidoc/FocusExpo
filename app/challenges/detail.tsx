import { Page } from '@/components/business';
import { Button, Card, Checkbox, Flex, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useChallengeStore, usePlanStore } from '@/stores';
import { Challenge } from '@/stores/challenge';
import { Tag } from '@fruits-chain/react-native-xiaoshu';
import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ChallengeDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeStore = useChallengeStore();
  const planStore = usePlanStore();
  const { colors } = useCustomTheme();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  const fetchChallengeDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await challengeStore.fetchChallengeById(id);
      setChallenge(result);
    } catch {
      Toast({
        type: 'error',
        message: '获取挑战详情失败',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeDetail()
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallengeDetail().finally(() => setRefreshing(false));
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

  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).format('YYYY/MM/DD HH:mm');
  };

  const handleClaim = () => {
    if (planStore.all_plans.length === 0) {
      Toast({
        type: 'error',
        message: '请先创建专注计划',
      });
      return;
    }
    setShowPlanModal(true);
  };

  const handleConfirmClaim = async () => {
    if (selectedPlanIds.length === 0) {
      Toast({
        type: 'error',
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
        router.push({
          pathname: '/challenges/my-detail',
          params: { id: result.id },
        } as any);
      }
    } catch {
      Toast({
        type: 'error',
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingTop: 0,
    },
    header: {
      paddingHorizontal: 4,
      paddingTop: 18,
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.text2,
    },
    card: {
      marginBottom: 16,
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      marginRight: 12,
      color: colors.text,
    },
    description: {
      fontSize: 14,
      color: colors.text2,
      lineHeight: 20,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.text2,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    goalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    goalRowLast: {
      borderBottomWidth: 0,
    },
    goalLabel: {
      fontSize: 14,
      color: colors.text2,
    },
    goalValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    rewardContainer: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    claimButton: {
      marginTop: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      margin: 20,
      borderRadius: 12,
      padding: 20,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    planItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    planItemLast: {
      borderBottomWidth: 0,
    },
    planName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    planMeta: {
      fontSize: 12,
      color: colors.text2,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
    },
    priceText: {
      fontSize: 16,
      color: '#FF6B35',
      fontWeight: '500',
    },
    rewardLabel: {
      fontSize: 14,
      color: colors.text2,
      marginTop: 8,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.text2,
      marginBottom: 16,
    },
    planList: {
      maxHeight: 300,
      marginBottom: 16,
    },
    planItemSelected: {
      backgroundColor: colors.background,
    },
    planTime: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    planDetail: {
      fontSize: 12,
      color: colors.text2,
      marginTop: 2,
    },
  });

  if (loading) {
    return (
      <Page safe bgcolor={colors.background}>
        <Flex className="justify-center flex-1">
          <ActivityIndicator size="large" />
          <Text style={styles.errorText}>加载中...</Text>
        </Flex>
      </Page>
    );
  }

  if (!challenge) {
    return (
      <Page safe bgcolor={colors.background}>
        <Flex className="justify-center flex-1">
          <Text style={styles.errorText}>挑战不存在</Text>
        </Flex>
      </Page>
    );
  }

  return (
    <Page safe bgcolor={colors.background}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* 页面标题 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>挑战详情</Text>
        </View>

        {/* 基本信息 */}
        <Card title={challenge.title} desc={challenge.description}>
          <Flex className="flex-col">
            <Flex className="justify-between">
              <Text style={styles.infoLabel}>开始时间：</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(challenge.starts_at)}
              </Text>
            </Flex>
            <Flex className="justify-between">
              <Text style={styles.infoLabel}>结束时间：</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(challenge.ends_at)}
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* 目标配置 */}
        <Card title="挑战目标">
          <Text style={styles.sectionTitle}>挑战目标</Text>
          <Flex className="flex-col">
            <Flex className="justify-between">
              <Text style={styles.infoLabel}>总专注时长</Text>
              <Text style={styles.infoValue}>
                {challenge.goal_total_mins} 分钟
              </Text>
            </Flex>
            <Flex className="justify-between">
              <Text style={styles.infoLabel}>单次最少时长</Text>
              <Text style={styles.infoValue}>
                {challenge.goal_once_mins} 分钟
              </Text>
            </Flex>
            <Flex className="justify-between">
              <Text style={styles.infoLabel}>重复次数</Text>
              <Text style={styles.infoValue}>
                {challenge.goal_repeat_times} 次
              </Text>
            </Flex>
            <Flex className="justify-between">
              <Text style={styles.infoLabel}>重复天数</Text>
              <Text style={styles.infoValue}>
                {challenge.goal_repeat_days} 天
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* 必屏蔽应用 */}
        {challenge.required_apps && challenge.required_apps.length > 0 && (
          <Card title="必须屏蔽的应用">
            <Flex className="flex-wrap gap-2">
              {challenge.required_apps.map((bundleId, index) => (
                <Tag key={index} color="#FF4D4F">
                  {bundleId}
                </Tag>
              ))}
            </Flex>
          </Card>
        )}

        {/* 费用和奖励 */}
        <Card title="费用与奖励">
          <Flex className="flex-col">
            <Text style={styles.infoLabel}>入场费用</Text>
            <Text style={styles.priceText}>{challenge.entry_coins} 金币</Text>
          </Flex>
        </Card>

        <Flex />

        {/* 领取按钮 */}
        <Button
          type="primary"
          size="l"
          onPress={handleClaim}
          disabled={!challenge.is_active}>
          {challenge.is_active ? '领取挑战' : '挑战已下架'}
        </Button>

        <Flex />
      </ScrollView>

      {/* 计划选择弹框 */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanModal(false)}>
        <Flex className="justify-center" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择计划</Text>
            <Text style={styles.modalSubtitle}>请选择要关联的专注计划：</Text>

            <ScrollView style={styles.planList}>
              {planStore.cus_plans.map(plan => (
                <Pressable
                  key={plan.id}
                  style={[
                    styles.planItem,
                    selectedPlanIds.includes(plan.id!) &&
                    styles.planItemSelected,
                  ]}
                  onPress={() => togglePlanSelection(plan.id!)}>
                  <Flex className="gap-3">
                    <Checkbox
                      value={selectedPlanIds.includes(plan.id!)}
                      onChange={() => togglePlanSelection(plan.id!)}
                    />
                    <Flex className="flex-col flex-1">
                      <Text style={styles.planTime}>
                        {dayjs(plan.start, 'HH:mm').format('HH:mm')} -{' '}
                        {dayjs(plan.end, 'HH:mm').format('HH:mm')}
                      </Text>
                      <Text style={styles.planDetail}>
                        {plan.mode === 'focus' ? '专注模式' : '屏蔽模式'} •{' '}
                        {Array.isArray(plan.repeat)
                          ? `周${plan.repeat.join(',')}`
                          : '一次性'}
                      </Text>
                    </Flex>
                  </Flex>
                </Pressable>
              ))}
            </ScrollView>

            <Flex style={{ gap: 12 }}>
              <Button
                style={styles.modalButton}
                onPress={() => setShowPlanModal(false)}>
                取消
              </Button>
              <Button
                type="primary"
                style={styles.modalButton}
                loading={claiming}
                onPress={handleConfirmClaim}>
                确认领取
              </Button>
            </Flex>
          </View>
        </Flex>
      </Modal>
    </Page>
  );
};

export default ChallengeDetailScreen;
