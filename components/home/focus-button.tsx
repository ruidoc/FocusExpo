import {
  AppStore,
  BenefitStore,
  HomeStore,
  PlanStore,
  RecordStore,
  UserStore,
} from '@/stores';
import { toast } from '@/utils';
import { getIOSFocusStatus, stopAppLimits } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { Flex, Theme } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import {
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfirmationModal from './confirm-modal';
import TimeFlow from './time-flow';

const FocusButton = observer(() => {
  const ustore = useLocalObservable(() => UserStore);
  const pstore = useLocalObservable(() => PlanStore);
  const store = useLocalObservable(() => HomeStore);
  const astore = useLocalObservable(() => AppStore);
  const rstore = useLocalObservable(() => RecordStore);
  const { dark } = useTheme();
  const xcolor = Theme.useThemeTokens();

  // 弹窗状态
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopCost, setStopCost] = useState<number>(0);
  // 暂停倒计时
  const [pauseRemaining, setPauseRemaining] = useState<number>(0);

  const getStateName = () => {
    if (pstore.cur_plan) {
      return pstore.paused ? '已暂停' : '正在专注中';
    }
    switch (store.vpn_state) {
      default:
        return '当前无任务';
    }
  };

  const styles = StyleSheet.create({
    btnFont: {
      fontSize: 18,
      color: 'white',
    },
    descFont: {
      fontSize: 16,
      color: xcolor.gray_3,
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
  if (!pstore.cur_plan) {
    if (pstore.next_plan) {
      descDom = (
        <Text style={styles.descFont}>
          下一个任务{' '}
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
        {pstore.cur_plan.repeat === 'once' ? '一次性任务' : '定时任务'}
        {` · ${pstore.cur_plan.end} 结束`}
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
    if (!pstore.cur_plan) return;
    try {
      if (Platform.OS === 'ios') {
        await stopAppLimits();
        // await Notifications.cancelAllScheduledNotificationsAsync();
        pstore.rmOncePlan(pstore.cur_plan.id);
        pstore.exitPlan();
        toast('专注任务失败！');
        return;
      } else {
        // Android 维持原有逻辑
        store.stopVpn();
        store.setVpnState('close');
      }
    } catch { }
  };

  const pauseFocus = () => {
    if (!pstore.cur_plan) return;
    if (Platform.OS === 'ios') {
      // console.log('暂停：', pstore.cur_plan);
      NativeModules.NativeModule.pauseAppLimits();
    }
  };

  const resumeFocus = () => {
    if (!pstore.cur_plan) return;
    if (Platform.OS === 'ios') {
      NativeModules.NativeModule.resumeAppLimits();
    }
  };

  // 暂停倒计时逻辑
  useEffect(() => {
    if (!pstore.cur_plan?.is_pause || Platform.OS !== 'ios') {
      setPauseRemaining(0);
      return;
    }

    // 定时获取剩余时间
    const timer = setInterval(async () => {
      try {
        const status = await getIOSFocusStatus();
        if (status.pausedUntil) {
          const now = Date.now() / 1000;
          const remaining = Math.max(0, status.pausedUntil - now);
          setPauseRemaining(remaining);
        } else {
          setPauseRemaining(0);
        }
      } catch (error) {
        console.error('获取暂停状态失败', error);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pstore.cur_plan?.is_pause]);

  // 格式化倒计时显示
  const formatPauseTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Flex justify="center">
        <TimeFlow />
      </Flex>
      <Flex justify="center" style={{ marginTop: 30, marginBottom: 50 }}>
        <View>
          {descDom}
          {/* 暂停倒计时显示 */}
          {pstore.cur_plan?.is_pause && pauseRemaining > 0 && (
            <Text
              style={[
                styles.descFont,
                { marginTop: 8, color: '#F7AF5D', fontSize: 14 },
              ]}>
              暂停倒计时：{formatPauseTime(pauseRemaining)}
            </Text>
          )}
        </View>
      </Flex>
      <Flex
        justify="center"
        style={{ marginTop: 0, marginBottom: 20, gap: 30 }}>
        {!pstore.cur_plan && (
          <TouchableOpacity
            onPress={quickStart}
            activeOpacity={0.8}
            style={styles.circleButton}>
            <Icon name="play" size={24} color="#B3B3BA" />
          </TouchableOpacity>
        )}
        {pstore.cur_plan && !pstore.cur_plan.is_pause && (
          <TouchableOpacity
            onPress={() => setShowPauseModal(true)}
            activeOpacity={0.8}
            style={styles.circleButton}>
            <Icon name="pause" size={24} color="#B3B3BA" />
          </TouchableOpacity>
        )}
        {pstore.cur_plan?.is_pause && (
          <TouchableOpacity
            onPress={resumeFocus}
            activeOpacity={0.8}
            style={styles.circleButton}>
            <Icon name="play" size={24} color="#B3B3BA" />
          </TouchableOpacity>
        )}
        {pstore.cur_plan && (
          <TouchableOpacity
            onPress={async () => {
              try {
                const id = rstore.record_id;
                let bet = 0;
                if (id) {
                  let rec: any = rstore.records.find((x: any) => x.id === id);
                  if (!rec) {
                    await rstore.getRecords();
                    rec = rstore.records.find((x: any) => x.id === id);
                  }
                  if (rec && typeof rec.bet_amount === 'number') {
                    bet = rec.bet_amount;
                  }
                }
                setStopCost(bet);
              } catch {
                setStopCost(0);
              }
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
        title="暂停专注任务？"
        message="暂停可能会影响你的专注状态，确定要暂停吗？"
        confirmText="确认暂停"
        cancelText="继续专注"
        coinCost={1}
        coinBalance={BenefitStore.balance}
        onConfirm={pauseFocus}
        onCancel={() => { }}
        onClose={() => setShowPauseModal(false)}
      />

      {/* 停止确认弹窗 */}
      <ConfirmationModal
        visible={showStopModal}
        title="结束专注任务？"
        message="结束后将无法恢复当前任务，确定要结束吗？"
        confirmText="确认结束"
        cancelText="继续专注"
        coinCost={stopCost}
        coinBalance={BenefitStore.balance}
        extraWarning={
          pstore.cur_plan?.repeat !== 'once'
            ? '注意：停止后，今天该任务后续不会再触发'
            : undefined
        }
        onConfirm={stopFocus}
        onCancel={() => { }}
        onClose={() => setShowStopModal(false)}
      />
    </>
  );
});

export default FocusButton;
