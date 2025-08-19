import { CusButton, CusPage } from '@/components';
import { PlanStore } from '@/stores';
// iOS 原生定时屏蔽，前端不做权限与应用选择校验，交由用户事先完成
import { repeats } from '@/utils/static.json';
import { Field, Toast } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useState } from 'react';
import { NativeModules, Platform, ScrollView, View } from 'react-native';

const App = observer(() => {
  const pstore = useLocalObservable(() => PlanStore);
  const navigation = useNavigation();
  //
  type FormState = {
    start: Date;
    end: Date;
    repeat: number[];
    mode: 'focus' | 'shield';
  };
  const [form, setForm] = useState<FormState>(() => {
    const start = new Date();
    const end = dayjs(start).add(20, 'minute').toDate();
    return {
      start,
      end,
      repeat: [],
      mode: 'shield',
    };
  });

  const submit = async () => {
    let { start, end, repeat } = form;
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
    const overlap = pstore.all_plans
      .filter(r => r.repeat !== 'once')
      .some(plan => {
        const share = (plan.repeat as number[]).some(d => repeat.includes(d));
        if (!share) return false;
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

    const addPlanPromise: Promise<any> = new Promise(resolve =>
      pstore.addPlan(subinfo, res => resolve(res)),
    );
    const iosPromise = configureIOS(subinfo);
    const [addRes] = await Promise.all([addPlanPromise, iosPromise]);
    if (addRes) {
      Toast({ type: 'success', message: '添加任务成功' });
      navigation.goBack();
    } else {
      Toast({ type: 'fail', message: '添加任务失败' });
    }
  };

  // iOS 定时屏蔽配置：与保存计划并行执行
  const configureIOS = async (subinfo: any) => {
    try {
      // 基于现有计划 + 当前即将新增的计划，组装下发的 iOS 周期任务
      const existing = pstore.cus_plans
        .filter((p: any) => Array.isArray(p.repeat))
        .map((p: any) => ({
          id: p.id,
          start: p.start_min * 60,
          end: p.end_min * 60,
          repeatDays: p.repeat,
          mode: p.mode,
        }));
      const current = {
        id: `temp_${Date.now()}`,
        start: subinfo.start_min * 60,
        end: subinfo.end_min * 60,
        repeatDays: subinfo.repeat,
        mode: subinfo.mode,
      };
      const plans = [...existing, current];
      const json = JSON.stringify(plans);
      if ((NativeModules as any).NativeModule?.configurePlannedLimits) {
        await (NativeModules as any).NativeModule.configurePlannedLimits(json);
      }
      return true;
    } catch (e) {
      console.log('IOS添加时间段失败：', e);
      return false;
    }
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

  return (
    <CusPage>
      <ScrollView style={{ padding: 15 }}>
        {Platform.OS !== 'ios' && (
          <Field.Checkbox
            title="模式"
            options={[
              { value: 'focus', label: '专注模式' },
              { value: 'shield', label: '屏蔽模式' },
            ]}
            value={form.mode}
            onChange={v => setInfo(v, 'mode')}
          />
        )}
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
          multiple
          options={repeats}
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
