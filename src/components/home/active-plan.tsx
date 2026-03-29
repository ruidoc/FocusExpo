import { Flex } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { pauseAppLimits, resumeAppLimits } from '@/native/ios';
import { useBenefitStore, usePlanStore, useUserStore } from '@/stores';
import { stopAppLimits } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfirmationModal from './confirm-modal';
import TimeFlow from './time-flow';

const FocusButton = () => {
  const ustore = useUserStore();
  const pstore = usePlanStore();
  const bstore = useBenefitStore();
  const { colors } = useCustomTheme();
  const nativeFocus = pstore.native_focus;
  const hasActiveTask = pstore.has_active_task();
  const isPaused = pstore.is_pause();
  const isPeriodicFocus = pstore.active_plan
    ? pstore.active_plan.repeat !== 'once'
    : nativeFocus.focus_type === 'periodic';
  const displayPlanName =
    pstore.active_plan?.name ||
    nativeFocus.plan_name ||
    (nativeFocus.focus_type === 'once' ? '一次性任务' : '进行中的任务');
  const displayPlanEnd = pstore.active_plan?.end
    ? pstore.active_plan.end
    : nativeFocus.end_at
      ? new Date(nativeFocus.end_at * 1000).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '';

  // 弹窗状态
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);

  const styles = StyleSheet.create({
    btnFont: {
      fontSize: 18,
      color: 'white',
    },
    descFont: {
      fontSize: 16,
      color: colors.text2,
    },
    lightFont: {
      fontWeight: '600',
    },
    circleButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#85869930',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  let descDom: React.ReactNode;
  if (!hasActiveTask) {
    if (pstore.next_plan) {
      descDom = (
        <Text style={styles.descFont}>
          下一个契约{' '}
          <Text style={styles.lightFont}>{pstore.next_plan?.start}</Text> 开始
        </Text>
      );
    } else {
      descDom = (
        <Text style={styles.descFont}>
          {!ustore.uInfo ? '登录后立即开始专注' : '添加定时任务 or 快速开始'}
        </Text>
      );
    }
  } else {
    descDom = (
      <Text style={styles.descFont}>
        {displayPlanName}
        {displayPlanEnd ? ` · ${displayPlanEnd} 结束` : ''}
      </Text>
    );
  }

  const quickStart = () => {
    if (!ustore.uInfo) {
      return router.push('/login/wx');
    }
    router.push('/quick-start');
  };

  const stopFocus = async () => {
    if (!hasActiveTask) return;
    try {
      if (Platform.OS === 'ios') {
        await stopAppLimits();
      }
    } catch (error) {
      console.log('stopFocus error', error);
    }
  };

  const pauseFocus = () => {
    if (!hasActiveTask || isPaused) return;
    if (Platform.OS === 'ios') {
      pauseAppLimits(3);
    }
  };

  const resumeFocus = () => {
    if (!hasActiveTask || !isPaused) return;
    if (Platform.OS === 'ios') {
      resumeAppLimits();
    }
  };

  return (
    <>
      <Flex className="justify-center">
        <TimeFlow />
      </Flex>
      <Flex className="justify-center mt-[30px] mb-[50px]">
        <View>{descDom}</View>
      </Flex>
      <Flex
        className="justify-center"
        style={{ marginTop: 0, marginBottom: 20, gap: 30 }}>
        {!hasActiveTask && (
          <TouchableOpacity
            onPress={quickStart}
            activeOpacity={0.8}
            style={styles.circleButton}>
            <Icon name="play" size={24} color="#B3B3BA" />
          </TouchableOpacity>
        )}
        {bstore.features.includes('show-pause') && (
          <>
            {hasActiveTask && !isPaused && (
              <TouchableOpacity
                onPress={() => setShowPauseModal(true)}
                activeOpacity={0.8}
                style={styles.circleButton}>
                <Icon name="pause" size={24} color="#B3B3BA" />
              </TouchableOpacity>
            )}
            {isPaused && (
              <TouchableOpacity
                onPress={resumeFocus}
                activeOpacity={0.8}
                style={styles.circleButton}>
                <Icon name="play" size={24} color="#B3B3BA" />
              </TouchableOpacity>
            )}
          </>
        )}
        {hasActiveTask && (
          <TouchableOpacity
            onPress={() => {
              setShowStopModal(true);
            }}
            activeOpacity={0.8}
            style={styles.circleButton}>
            <Icon name="stop" size={24} color="#B3B3BA" />
          </TouchableOpacity>
        )}
      </Flex>
      {/* 暂停确认弹窗 */}
      <ConfirmationModal
        visible={showPauseModal}
        title="暂停专注？"
        message="暂停可能会影响你的专注状态，确定要暂停吗？"
        confirmText="确认暂停"
        cancelText="继续专注"
        onConfirm={pauseFocus}
        onCancel={() => {}}
        onClose={() => setShowPauseModal(false)}
      />

      {/* 停止确认弹窗 */}
      <ConfirmationModal
        visible={showStopModal}
        title="结束专注？"
        message="结束后将无法恢复当前专注，确定要结束吗？"
        confirmText="确认结束"
        cancelText="继续专注"
        extraWarning={
          isPeriodicFocus
            ? '注意：停止后，今天该专注后续不会再触发'
            : undefined
        }
        onConfirm={stopFocus}
        onCancel={() => {}}
        onClose={() => setShowStopModal(false)}
      />
    </>
  );
};

export default FocusButton;
