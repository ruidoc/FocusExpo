import { CusButton, DurationPickerModal } from '@/components';
import {
  AppStore,
  BenefitStore,
  HomeStore,
  PlanStore,
  RecordStore,
} from '@/stores';
import { selectAppsToLimit, startAppLimits } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { Flex, Toast } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { ReactNode, useLayoutEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import ModeSwitcher from './mode-switcher';
import SelectApps from './select-apps';
import styles from './styles';
import TimeSlider from './time-slider';

const QuickStartPage = observer(() => {
  const [mode, setMode] = useState<'focus' | 'shield'>('shield');
  const [minute, setMinute] = useState(15);
  const [customBet, setCustomBet] = useState(0); // 自定义下注
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);
  const navigation = useNavigation();
  const pstore = useLocalObservable(() => PlanStore);
  const store = useLocalObservable(() => HomeStore);
  const rstore = useLocalObservable(() => RecordStore);
  const astore = useLocalObservable(() => AppStore);
  const bstore = useLocalObservable(() => BenefitStore);

  const { colors } = useTheme();
  const focusCount = astore.focus_apps.length;
  const shieldCount = astore.shield_apps.length;
  const modeDescMap = {
    focus: focusCount > 0 ? `仅允许${focusCount}个APP使用` : '无可用的APP',
    shield: shieldCount > 0 ? `${shieldCount}个APP将被屏蔽` : '无可屏蔽的APP',
  };

  const ItemRow: React.FC<{
    title: string;
    children?: ReactNode;
    tag?: string;
  }> = ({ title, children, tag }) => {
    return (
      <View
        style={{
          backgroundColor: 'rgba(255,255,255, 0.1)',
          marginBottom: 18,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
        }}>
        <Flex justify="between" align="center">
          <Text style={styles.titleStyle}>{title}</Text>
          {tag === 'apps' && (
            <>
              <Pressable onPress={selectApps}>
                <Flex
                  justify="between"
                  align="center"
                  style={{
                    backgroundColor: 'rgba(0,0,0, 0.2)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 14,
                  }}>
                  <Icon name="add" size={17} color={colors.text} />
                  <Text style={{ color: colors.text, fontSize: 12 }}>
                    添加{' '}
                  </Text>
                </Flex>
              </Pressable>
            </>
          )}
        </Flex>
        {children}
      </View>
    );
  };

  // 自定义头部：透明背景 + 关闭按钮
  useLayoutEffect(() => {
    navigation.setOptions?.({
      headerTitle: '',
      headerLeft: (): React.ReactNode => null,
      headerTransparent: true,
      headerRight: (): React.ReactNode => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Icon name="close" size={22} color="#fff" />
        </Pressable>
      ),
    });
  }, [navigation]);

  const maxBet = useMemo(
    () => Math.max(0, bstore.balance || 0),
    [bstore.balance],
  );

  // 计算基于时长的最小下注值：每30分钟+1
  const minBet = useMemo(() => {
    return Math.floor((minute - 1) / 30) + 1;
  }, [minute]);

  // 当时长变化时，确保下注不低于最小值
  React.useEffect(() => {
    if (customBet < minBet) {
      setCustomBet(minBet);
    }
  }, [minBet, customBet]);

  const setOncePlan = (plan_id: string) => {
    let now = dayjs();
    let cur_minute = now.hour() * 60 + now.minute();
    let cur_secend = cur_minute * 60 + now.second();
    let from_data: CusPlan = {
      id: plan_id,
      start: now.format('HH:mm'),
      start_min: cur_minute,
      start_sec: cur_secend,
      end: now.add(Number(minute), 'minute').format('HH:mm'),
      end_min: cur_minute + Number(minute),
      end_sec: cur_secend + Number(minute) * 60,
      repeat: 'once',
      mode: mode,
    };
    pstore.addOncePlan(from_data);
    let select_apps = pstore.is_focus_mode
      ? astore.focus_apps
      : astore.shield_apps;
    if (Platform.OS === 'ios') {
      select_apps = astore.ios_selected_apps.map(
        r => `${r.stableId}:${r.type}`,
      );
    }
    rstore.addRecord(from_data, select_apps, customBet);
  };

  const selectApps = () => {
    const maxCount = Number(bstore.app_count || 0);
    selectAppsToLimit(maxCount).then(data => {
      astore.addIosApps(data.apps);
    });
  };

  // 开始一次性任务
  const toSetting = async () => {
    if (pstore.cur_plan) {
      return Toast('当前有正在进行的任务');
    }
    // 校验下注（通用）
    if (!customBet || customBet <= 0) {
      return Toast('请设置有效的下注数量');
    }
    if (customBet < minBet) {
      return Toast(`当前时长最小下注为${minBet}个自律币`);
    }
    if (customBet > maxBet) {
      return Toast('超出自律币余额，请先充值');
    }
    let plan_id = `once_${Math.floor(Math.random() * 99999999)}`;
    if (Platform.OS === 'ios') {
      // iOS: 验证应用选择
      if (astore.ios_selected_apps.length === 0) {
        return Toast('请先选择要屏蔽的应用');
      }
      // iOS: 使用屏幕时间限制开始屏蔽
      const ok = await startAppLimits(minute, plan_id);
      if (ok) {
        setOncePlan(plan_id);
        // 立刻刷新当前计划，避免等待 AppState/原生事件导致 cur_plan 为空
        pstore.setCurPlanMinute(0);
        pstore.resetPlan();
        Toast('已开始屏蔽');
      } else {
        Toast('开启屏蔽失败');
      }
    } else {
      // Android: 维持原有逻辑
      if (mode === 'focus' && astore.focus_apps.length === 0) {
        return Toast('添加APP后开始专注');
      }
      if (mode === 'shield' && astore.shield_apps.length === 0) {
        return Toast('添加APP后开始屏蔽');
      }
      setOncePlan(plan_id);
      pstore.resetPlan();
      store.startVpn();
    }
    navigation.goBack();
  };

  return (
    <>
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        <Flex justify="center" style={{ marginTop: 30, marginBottom: 25 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
            快速开始
          </Text>
        </Flex>
        <ItemRow title="选择APP" tag="apps">
          {Platform.OS === 'ios' ? (
            <SelectApps />
          ) : (
            <ModeSwitcher
              mode={mode}
              setMode={setMode}
              desc={modeDescMap[mode]}
              focusApps={astore.focus_apps}
              shieldApps={astore.shield_apps}
              allApps={store.all_apps}
            />
          )}
        </ItemRow>
        <ItemRow title="设置时长">
          {/* <Pressable onPress={() => setPickerVisible(true)}>
            <Text
              style={{
                color: '#fff',
                fontSize: 16,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}>
              {Math.floor(minute / 60)}小时{minute % 60}分钟
            </Text>
          </Pressable> */}
          <TimeSlider minute={minute} setMinute={setMinute} />
        </ItemRow>
        <ItemRow title="选择下注">
          <Flex align="center" justify="center" style={styles.betRow}>
            <Flex align="center">
              <Pressable
                onPress={() => {
                  let n = Math.max(minBet, (customBet || 0) - 1);
                  n = Math.min(n, maxBet);
                  setCustomBet(n);
                }}
                style={styles.stepperBtn}>
                <Icon name="remove" size={16} color={colors.text} />
              </Pressable>
              <TextInput
                keyboardType="number-pad"
                value={String(customBet)}
                onChangeText={t => {
                  const n = Number(t || '0');
                  if (Number.isNaN(n)) return setCustomBet(minBet);
                  const clamped = Math.max(minBet, Math.min(maxBet, n));
                  setCustomBet(clamped);
                }}
                style={styles.stepperInput}
                maxLength={5}
                placeholder="数量"
              />
              <Pressable
                onPress={() => {
                  let n = (customBet || 0) + 1;
                  n = Math.max(minBet, Math.min(maxBet, n));
                  setCustomBet(n);
                }}
                style={styles.stepperBtn}>
                <Icon name="add" size={16} color={colors.text} />
              </Pressable>
            </Flex>
          </Flex>
          <Flex
            justify="between"
            align="center"
            style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Flex align="center">
              <Text style={styles.tipText}>可用自律币：{bstore.balance}</Text>
              {(bstore.balance || 0) < customBet && (
                <Pressable
                  onPress={() => router.push('/user/coins')}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginLeft: 8,
                  }}>
                  <Text style={{ color: '#fff', fontSize: 12 }}>去充值</Text>
                </Pressable>
              )}
            </Flex>
            <Text style={styles.tipText}>本次将消耗：{customBet}</Text>
          </Flex>
          <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
            <Text style={[styles.tipText, { fontSize: 12, opacity: 0.8 }]}>
              当前时长最小下注：{minBet}个自律币
            </Text>
            {(bstore.balance || 0) < customBet && (
              <Text
                style={[
                  styles.tipText,
                  { fontSize: 12, color: '#ff6b6b', marginTop: 4 },
                ]}>
                余额不足，请充值后开始专注
              </Text>
            )}
          </View>
        </ItemRow>
        {/* <ItemRow title="一句话加油">
          <View style={{ paddingHorizontal: 16 }}>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              placeholder="例如：写完报告/番茄2轮"
              style={[styles.input]}
              maxLength={20}
            />
            <Text style={styles.counterText}>{(desc || '').length}/20</Text>
          </View>
        </ItemRow> */}
      </ScrollView>
      <View style={styles.bottomBar}>
        <CusButton
          onPress={toSetting}
          text={mode === 'focus' ? '开始专注' : '开始屏蔽'}
        />
        <DurationPickerModal
          visible={pickerVisible}
          defaultMinutes={minute}
          onConfirm={m => setMinute(m)}
          onCancel={() => {}}
          onClose={() => setPickerVisible(false)}
        />
      </View>
    </>
  );
});

export default QuickStartPage;
