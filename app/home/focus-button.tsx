import { AppStore, HomeStore, PlanStore, UserStore } from '@/stores';
import { getCurrentMinute, toast } from '@/utils';
import { Flex, Theme } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FocusButtonProps {
  timeLong: (min: number) => React.ReactNode;
}

const FocusButton: React.FC<FocusButtonProps> = observer(({ timeLong }) => {
  const ustore = useLocalObservable(() => UserStore);
  const pstore = useLocalObservable(() => PlanStore);
  const store = useLocalObservable(() => HomeStore);
  const astore = useLocalObservable(() => AppStore);
  const { colors, dark } = useTheme();
  const xcolor = Theme.useThemeTokens();
  const [minute, setMinute] = useState(0);

  const getColor = (state: string) => {
    let grey = '#70809990';
    if (pstore.cur_plan) {
      return dark ? xcolor.yellow_4 : 'rgb(255, 180, 0)';
    }
    switch (state) {
      case 'close':
        return grey;
      case 'start':
        return dark ? xcolor.yellow_4 : '#F2C037';
      case 'refuse':
        return xcolor.brand_6;
      default:
        return grey;
    }
  };

  const getStateName = () => {
    if (pstore.cur_plan) {
      return '正在专注中';
    }
    switch (store.vpn_state) {
      case 'refuse':
        return '请授权';
      default:
        return '当前无任务';
    }
  };

  const startVpn = () => {
    if (!ustore.uInfo) {
      return toast('请先登录');
    }
    if (store.vpn_state === 'start') {
      return toast('正在专注');
    }
    if (astore.focus_apps.length === 0) {
      return toast('请添加专注目标APP');
    }
    if (astore.shield_apps.length === 0) {
      return toast('请添加屏蔽目标APP');
    }
    if (pstore.all_plans.length === 0) {
      return toast('请添加专注任务');
    }
    store.startVpn();
  };

  const styles = StyleSheet.create({
    mainBtn: {
      backgroundColor: getColor(store.vpn_state),
      width: 150,
      height: 150,
      borderRadius: 100,
    },
    btnFont: {
      fontSize: 18,
      color: 'white',
    },
    descFont: {
      fontSize: 15,
      color: xcolor.gray_8,
    },
    lightFont: {
      fontWeight: '600',
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
        <Text>当前任务剩余 </Text>
        {timeLong(minute - pstore.curplan_minute)}
      </Text>
    );
  }

  useEffect(() => {
    if (!pstore.cur_plan) return;
    let now = getCurrentMinute();
    let taskStart = Math.max(now, pstore.cur_plan.start_min);
    let total = pstore.cur_plan.end_min - taskStart;
    setMinute(total);
  }, [pstore.cur_plan]);

  return (
    <>
      <Flex justify="center" style={{ marginTop: 46 }}>
        <TouchableOpacity onPress={startVpn} activeOpacity={0.8}>
          <Flex style={styles.mainBtn} justify="center">
            <Text style={styles.btnFont}>{getStateName()}</Text>
          </Flex>
        </TouchableOpacity>
      </Flex>
      <Flex justify="center" style={{ marginTop: 30, marginBottom: 50 }}>
        <View>{descDom}</View>
      </Flex>
    </>
  );
});

export default FocusButton;
