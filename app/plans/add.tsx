import { CusButton, CusPage } from '@/components';
import TokenLabel from '@/components/native/TokenLabel';
import { AppStore, PlanStore } from '@/stores';
// iOS 原生定时屏蔽，前端不做权限与应用选择校验，交由用户事先完成
import { repeats } from '@/config/static.json';
import { selectAppsToLimit } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { Field, Flex, Toast } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import dayjs from 'dayjs';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

const App = observer(() => {
  const pstore = useLocalObservable(() => PlanStore);
  const astore = useLocalObservable(() => AppStore);
  const { colors } = useTheme();

  // 计算重复次数的函数
  const calculateRepeatCount = (
    startDate: Date,
    endDate: Date,
    repeatDays: number[],
  ) => {
    if (!startDate || !endDate || !repeatDays.length) return 0;

    let count = 0;
    let current = dayjs(startDate);
    const end = dayjs(endDate);

    while (current.isSame(end, 'day') || current.isBefore(end, 'day')) {
      const dayOfWeek = current.day() === 0 ? 7 : current.day(); // 转换为1-7格式
      if (repeatDays.includes(dayOfWeek)) {
        count++;
      }
      current = current.add(1, 'day');
    }

    return count;
  };
  //
  type FormState = {
    name: string;
    start: Date;
    end: Date;
    start_date: Date;
    end_date: Date;
    repeat: number[];
    mode: 'focus' | 'shield';
  };

  // 单独管理选择的应用状态
  const [selectedApps, setSelectedApps] = useState<any[]>([]);
  const [form, setForm] = useState<FormState>(() => {
    const start = new Date();
    const end = dayjs(start).add(20, 'minute').toDate();
    const today = new Date();
    const tomorrow = dayjs(today).add(1, 'day').toDate();
    return {
      name: '',
      start,
      end,
      start_date: today,
      end_date: tomorrow,
      repeat: [1, 2, 3, 4, 5],
      mode: 'shield',
    };
  });

  const submit = async () => {
    try {
      let { name, start, end, start_date, end_date, repeat } = form;

      // 验证计划名称
      if (!name.trim()) {
        return Toast({
          type: 'fail',
          message: '请输入计划名称',
        });
      }

      // 验证日期范围
      if (!dayjs(end_date).isAfter(dayjs(start_date), 'day')) {
        return Toast({
          type: 'fail',
          message: '结束日期必须大于开始日期',
        });
      }

      // 验证应用选择（仅iOS）
      if (Platform.OS === 'ios' && selectedApps.length === 0) {
        return Toast({
          type: 'fail',
          message: '请先选择要限制的应用',
        });
      }
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
        .filter(r => Array.isArray(r.repeat))
        .some(plan => {
          const share = (plan.repeat as number[]).some(d => repeat.includes(d));
          if (!share) return false;
          return newStart < plan.end_min && newEnd > plan.start_min;
        });
      console.log('overlap：', pstore.all_plans);
      if (overlap) {
        return Toast({
          type: 'fail',
          message: '任务时间不能重叠',
        });
      }
      // 计算重复次数
      const repeatCount = calculateRepeatCount(start_date, end_date, repeat);

      let subinfo: any = { ...form };
      subinfo.name = name.trim();
      subinfo.start = start_day.format('HH:mm');
      subinfo.end = end_day.format('HH:mm');
      subinfo.start_min = start_day.hour() * 60 + start_day.minute();
      subinfo.end_min = end_day.hour() * 60 + end_day.minute();
      subinfo.start_date = dayjs(start_date).format('YYYY-MM-DD');
      subinfo.end_date = dayjs(end_date).format('YYYY-MM-DD');
      subinfo.repeat_count = repeatCount;

      // 添加选择的应用到提交数据
      if (Platform.OS === 'ios') {
        subinfo.apps = selectedApps.map(r => `${r.id}:${r.type}`);
      }
      pstore.addPlan(subinfo, async res => {
        // console.log('添加任务结果：', res);
        if (res) {
          Toast({ type: 'success', message: '添加任务成功' });
        } else {
          Toast({ type: 'fail', message: '添加任务失败' });
        }
      });
    } catch (error) {
      Toast({ type: 'fail', message: '添加任务出错' });
      console.log('添加任务失败：', error);
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
    } else if (key === 'start_date') {
      const newForm = {
        ...form,
        start_date: val,
      };
      // 如果开始日期晚于结束日期，自动调整结束日期
      if (dayjs(val).isAfter(dayjs(form.end_date), 'day')) {
        newForm.end_date = dayjs(val).add(1, 'day').toDate();
      }
      setForm(newForm);
    } else if (key === 'end_date') {
      // 确保结束日期不早于开始日期
      if (dayjs(val).isBefore(dayjs(form.start_date), 'day')) {
        Toast({
          type: 'fail',
          message: '结束日期不能早于开始日期',
        });
        return;
      }
      setForm({
        ...form,
        end_date: val,
      });
    } else {
      setForm({
        ...form,
        [key]: val,
      });
    }
  };

  // 选择应用函数
  const selectApps = () => {
    selectAppsToLimit()
      .then(data => {
        if (data.success && data.apps) {
          // 同时存储到AppStore和当前组件状态
          astore.addIosApps(data.apps);
          setSelectedApps(data.apps);
        }
      })
      .catch(() => {
        Toast({
          type: 'fail',
          message: '选择应用失败，请重试',
        });
      });
  };

  // 渲染已选择的应用
  const renderSelectedApps = () => {
    if (Platform.OS !== 'ios' || selectedApps.length === 0) {
      return (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ color: '#666', fontSize: 14 }}>未选择应用</Text>
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2 }}>
          <Flex direction="row" align="center" style={{ gap: 8 }}>
            {selectedApps.map((app, index) => (
              <TokenLabel
                key={`${app.id}-${index}`}
                tokenBase64={app.tokenData}
                tokenType={app.type}
                style={{ width: 40, height: 40 }}
              />
            ))}
          </Flex>
        </ScrollView>
        {selectedApps.length > 0 && (
          <Text
            style={{
              fontSize: 12,
              color: '#666',
              marginTop: 8,
              textAlign: 'center',
            }}>
            已选择 {selectedApps.length} 个应用
          </Text>
        )}
      </View>
    );
  };

  return (
    <CusPage>
      <ScrollView style={{ padding: 15 }}>
        <Field.TextInput
          title="计划名称"
          placeholder="请输入计划名称"
          value={form.name}
          onChange={(v: string) => setInfo(v, 'name')}
          required
        />

        <Field.Date
          title="开始日期"
          placeholder="请选择开始日期"
          mode="M-D"
          value={form.start_date}
          onChange={v => setInfo(v, 'start_date')}
        />

        <Field.Date
          title="结束日期"
          placeholder="请选择结束日期"
          mode="M-D"
          value={form.end_date}
          onChange={v => setInfo(v, 'end_date')}
          required
        />

        {Platform.OS === 'ios' && (
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: 16,
              }}>
              <Flex
                justify="between"
                align="center"
                style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                  }}>
                  选择应用
                </Text>
                <Pressable
                  onPress={selectApps}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                  <Icon name="add" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12 }}>选择</Text>
                </Pressable>
              </Flex>
              {renderSelectedApps()}
            </View>
          </View>
        )}

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

        <Field.Checkbox
          title="重复规则"
          options={repeats}
          value={form.repeat}
          onChange={v => setInfo(v, 'repeat')}
        />

        {/* 显示计算出的重复次数 */}
        {form.repeat.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>
              预计重复次数：
              {calculateRepeatCount(
                form.start_date,
                form.end_date,
                form.repeat,
              )}{' '}
              次
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <CusButton onPress={submit} text="确认" />
      </View>
    </CusPage>
  );
});

export default App;
