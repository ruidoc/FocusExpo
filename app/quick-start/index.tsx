import { Button, Flex } from '@/components/ui';
import {
  AppStore,
  BenefitStore,
  HomeStore,
  PlanStore,
  RecordStore,
} from '@/stores';
import { selectAppsToLimit, startAppLimits } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
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
      <View className="bg-white/10 mb-[18px] px-4 py-3 rounded-xl">
        <Flex className="justify-between">
          <Text className="text-[15px] font-semibold leading-[22px] text-white">
            {title}
          </Text>
          {tag === 'apps' && (
            <>
              <Flex
                onPress={selectApps}
                className="justify-between items-center bg-black/20 px-2 py-1 rounded-[14px]">
                <Icon name="add" size={17} color={colors.text} />
                <Text className="text-white text-xs" style={{ color: colors.text }}>
                  添加{' '}
                </Text>
              </Flex>
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
          className="px-4 py-2">
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
    let select_apps = pstore.is_focus_mode
      ? astore.focus_apps
      : astore.shield_apps;
    if (Platform.OS === 'ios') {
      select_apps = astore.ios_selected_apps.map(
        r => `${r.stableId}:${r.type}`,
      );
    }
    let from_data: CusPlan = {
      id: plan_id,
      name: '一次性任务',
      apps: select_apps,
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
    rstore.addRecord(from_data, customBet);
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
      <ScrollView className="flex-1 px-5">
        <Flex className="justify-center mt-[30px] mb-[25px]">
          <Text className="text-xl font-bold text-white">
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
          <Flex className="justify-center px-4 my-[14px] gap-3">
            <Flex>
              <Pressable
                onPress={() => {
                  let n = Math.max(minBet, (customBet || 0) - 1);
                  n = Math.min(n, maxBet);
                  setCustomBet(n);
                }}
                className="w-[34px] h-[34px] rounded-lg items-center justify-center bg-white/8 mx-1.5">
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
                className="w-16 h-[34px] rounded-lg px-2.5 text-white bg-white/8 text-center mx-0.5"
                maxLength={5}
                placeholder="数量"
              />
              <Pressable
                onPress={() => {
                  let n = (customBet || 0) + 1;
                  n = Math.max(minBet, Math.min(maxBet, n));
                  setCustomBet(n);
                }}
                className="w-[34px] h-[34px] rounded-lg items-center justify-center bg-white/8 mx-1.5">
                <Icon name="add" size={16} color={colors.text} />
              </Pressable>
            </Flex>
          </Flex>
          <Flex className="justify-between px-4 mt-2">
            <Flex>
              <Text className="text-xs text-white/65">可用自律币：{bstore.balance}</Text>
              {(bstore.balance || 0) < customBet && (
                <Pressable
                  onPress={() => router.push('/user/coins')}
                  className="bg-blue-500/80 px-2 py-1 rounded-xl ml-2">
                  <Text className="text-white text-xs">去充值</Text>
                </Pressable>
              )}
            </Flex>
            <Text className="text-xs text-white/65">本次将消耗：{customBet}</Text>
          </Flex>
          <View className="px-4 mt-1">
            <Text className="text-xs text-white/65 opacity-80">
              当前时长最小下注：{minBet}个自律币
            </Text>
            {(bstore.balance || 0) < customBet && (
              <Text className="text-xs text-[#ff6b6b] mt-1">
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
      <View className="absolute left-0 right-0 bottom-0 bg-transparent px-5 pb-6 z-10">
        <Button
          onPress={toSetting}
          text={mode === 'focus' ? '开始专注' : '开始屏蔽'}
        />
      </View>
    </>
  );
});

export default QuickStartPage;
