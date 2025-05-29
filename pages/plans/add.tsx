import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CusPage, CusButton } from '@/components';
import { StyleSheet } from 'react-native';
import {
  Cell,
  Field,
  Flex,
  Notify,
  Space,
  Toast,
} from '@fruits-chain/react-native-xiaoshu';
import { Colors, Header } from 'react-native/Libraries/NewAppScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import { HomeStore, PlanStore } from '@/stores';
import { repeats } from '@/utils/static.json';
import dayjs from 'dayjs';

const App = observer(() => {
  const store = useLocalObservable(() => HomeStore);
  const pstore = useLocalObservable(() => PlanStore);
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => {
    const start = new Date();
    const end = dayjs(start).add(20, 'minute').toDate();
    return {
      start,
      end,
      repeat: 'evary',
      mode: 'shield',
    };
  });

  const initapp = async () => {
    let sel_apps = await AsyncStorage.getItem('select_apps');
  };

  const submit = async () => {
    setLoading(true);
    let { start, end } = form;
    let start_day = dayjs(start);
    let end_day = dayjs(end);
    if (!end_day.isAfter(start_day)) {
      return Toast({
        type: 'fail',
        message: '结束时间必须大于开始时间',
      });
    }
    if (end_day.diff(start_day, 'minute') < 20) {
      return Toast({
        type: 'fail',
        message: '时间间隔最少20分钟',
      });
    }
    const newStart = start_day.hour() * 60 + start_day.minute();
    const newEnd = end_day.hour() * 60 + end_day.minute();
    const overlap = pstore.all_plans.some(plan => {
      if (plan.repeat !== form.repeat) return false;
      return newStart < plan.end_min && newEnd > plan.start_min;
    });
    if (overlap) {
      return Toast({
        type: 'fail',
        message: '任务时间不能重叠',
      });
    }
    let subinfo: any = { ...form };
    subinfo.start = start_day.format('HH:mm');
    subinfo.end = end_day.format('HH:mm');
    subinfo.start_min = start_day.hour() * 60 + start_day.minute();
    subinfo.end_min = end_day.hour() * 60 + end_day.minute();
    pstore.addPlan(subinfo, res => {
      if (res) {
        Toast({
          type: 'success',
          message: '添加任务成功',
        });
        navigation.goBack();
      } else {
        Toast({
          type: 'fail',
          message: '添加任务失败',
        });
      }
    });
  };

  const setInfo = (val: any, key: string) => {
    if (key === 'start') {
      const start = dayjs(val);
      const end = start.add(20, 'minute').toDate();
      setForm({
        ...form,
        start: val,
        end,
      });
    } else if (key === 'end') {
      const start = dayjs(form.start);
      const end = dayjs(val);
      if (end.diff(start, 'minute') < 20) {
        Toast({
          type: 'fail',
          message: '时长至少20分钟，更容易培养专注力',
        });
        return;
      }
      setForm({
        ...form,
        end: val,
      });
    } else {
      setForm({
        ...form,
        [key]: val,
      });
    }
  };

  useEffect(() => {
    initapp();
  }, []);

  return (
    <CusPage>
      <ScrollView style={{ padding: 15 }}>
        <Field.Checkbox
          title="模式"
          options={[
            { value: 'focus', label: '专注模式' },
            { value: 'shield', label: '屏蔽模式' },
          ]}
          value={form.mode}
          onChange={v => setInfo(v, 'mode')}
        />
        <Field.Date
          title="开始时间"
          placeholder="请选择"
          mode="h-m"
          value={form.start}
          onChange={v => setInfo(v, 'start')}
        />
        <Field.Date
          title="结束时间"
          placeholder="请选择"
          mode="h-m"
          value={form.end}
          onChange={v => setInfo(v, 'end')}
        />
        <Field.Selector
          title="重复规则"
          options={repeats.slice(0, 3)}
          value={form.repeat}
          onChange={v => setInfo(v, 'repeat')}
        />
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <CusButton onPress={submit} text="确认" />
      </View>
    </CusPage>
  );
});

export default App;
