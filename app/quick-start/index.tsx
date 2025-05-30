import { CusButton } from '@/components';
import { AppStore, HomeStore, PlanStore } from '@/stores';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import dayjs from 'dayjs';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import ModeSwitcher from './mode-switcher';
import styles from './styles';
import TimeSlider from './time-slider';

const QuickStartPage = observer(() => {
  const [mode, setMode] = useState<'focus' | 'shield'>('shield');
  const [minute, setMinute] = useState(15);
  const navigation = useNavigation();
  const pstore = useLocalObservable(() => PlanStore);
  const store = useLocalObservable(() => HomeStore);
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
    pstore.addOncePlan({
      id: `once_${Math.floor(Math.random() * 99999999)}`,
      start: now.format('HH:mm'),
      start_min: cur_minute,
      start_sec: cur_secend,
      end: now.add(Number(minute), 'minute').format('HH:mm'),
      end_min: cur_minute + Number(minute),
      end_sec: cur_secend + Number(minute) * 60,
      repeat: 'once',
      mode: mode,
    });
  };

  const toSetting = () => {
    if (pstore.cur_plan) {
      return Toast('当前有正在进行的任务');
    }
    if (mode === 'focus' && astore.focus_apps.length === 0) {
      return Toast('添加APP后开始专注');
    }
    if (mode === 'shield' && astore.shield_apps.length === 0) {
      return Toast('添加APP后开始屏蔽');
    }
    setOncePlan();
    store.startVpn();
    navigation.goBack();
  };

  return (
    <>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ marginTop: 10, marginBottom: 8 }}>
          <Text style={[styles.titleStyle, { color: dark ? '#fff' : '#222' }]}>
            选择模式
          </Text>
        </View>
        <ModeSwitcher
          mode={mode}
          setMode={setMode}
          desc={modeDescMap[mode]}
          focusApps={astore.focus_apps}
          shieldApps={astore.shield_apps}
          allApps={store.all_apps}
        />
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
