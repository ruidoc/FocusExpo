import { CusButton } from '@/components';
import { AppStore, HomeStore, PlanStore } from '@/stores';
import { startAppLimits } from '@/utils/permission';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import dayjs from 'dayjs';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import ModeSwitcher from './mode-switcher';
import SelectApps from './select-apps';
import styles from './styles';
import TimeSlider from './time-slider';

const QuickStartPage = observer(() => {
  const [mode, setMode] = useState<'focus' | 'shield'>('shield');
  const [minute, setMinute] = useState(15);
  const navigation = useNavigation();
  const pstore = useLocalObservable(() => PlanStore);
  const store = useLocalObservable(() => HomeStore);
  // const pmstore = useLocalObservable(() => PermisStore);
  const astore = useLocalObservable(() => AppStore);

  const { dark } = useTheme();
  const focusCount = astore.focus_apps.length;
  const shieldCount = astore.shield_apps.length;
  const modeDescMap = {
    focus: focusCount > 0 ? `仅允许${focusCount}个APP使用` : '无可用的APP',
    shield: shieldCount > 0 ? `${shieldCount}个APP将被屏蔽` : '无可屏蔽的APP',
  };

  const setOncePlan = () => {
    let now = dayjs();
    let cur_minute = now.hour() * 60 + now.minute();
    let cur_secend = cur_minute * 60 + now.second();
    const newId = `once_${Math.floor(Math.random() * 99999999)}`;
    pstore.addOncePlan({
      id: newId,
      start: now.format('HH:mm'),
      start_min: cur_minute,
      start_sec: cur_secend,
      end: now.add(Number(minute), 'minute').format('HH:mm'),
      end_min: cur_minute + Number(minute),
      end_sec: cur_secend + Number(minute) * 60,
      repeat: 'once',
      mode: mode,
    });
    return newId;
  };

  const toSetting = async () => {
    if (pstore.cur_plan) {
      return Toast('当前有正在进行的任务');
    }

    if (Platform.OS === 'ios') {
      // iOS: 使用屏幕时间限制开始屏蔽
      let plan_id = setOncePlan();
      // 立刻刷新当前计划，避免等待 AppState/原生事件导致 cur_plan 为空
      pstore.setCurPlanMinute(0);
      pstore.resetPlan();
      const ok = await startAppLimits(minute, plan_id);
      if (ok) {
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
      setOncePlan();
      pstore.resetPlan();
      store.startVpn();
    }
    navigation.goBack();
  };

  return (
    <>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ marginTop: 10, marginBottom: 8 }}>
          <Text style={[styles.titleStyle, { color: dark ? '#fff' : '#222' }]}>
            {Platform.OS === 'ios' ? '选择APP' : '选择模式'}
          </Text>
        </View>
        {Platform.OS === 'ios' && <SelectApps />}
        {Platform.OS === 'android' && (
          <ModeSwitcher
            mode={mode}
            setMode={setMode}
            desc={modeDescMap[mode]}
            focusApps={astore.focus_apps}
            shieldApps={astore.shield_apps}
            allApps={store.all_apps}
          />
        )}
        <View style={{ marginTop: 18, marginBottom: 8 }}>
          <Text style={[styles.titleStyle, { color: dark ? '#fff' : '#222' }]}>
            设置时长
          </Text>
        </View>
        <TimeSlider minute={minute} setMinute={setMinute} />
      </ScrollView>
      <View style={styles.bottomBar}>
        <CusButton
          onPress={toSetting}
          text={mode === 'focus' ? '开始专注' : '开始屏蔽'}
        />
      </View>
    </>
  );
});

export default QuickStartPage;
