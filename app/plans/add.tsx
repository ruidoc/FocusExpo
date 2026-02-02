import { Page, SelectApps, SelectedApps } from '@/components/business';
import {
  Button,
  DatePicker,
  FieldGroup,
  FieldItem,
  Flex,
  TextInput,
  Toast,
} from '@/components/ui';
import staticData from '@/config/static.json';
import { useCustomTheme } from '@/config/theme';
import { useAppStore, usePlanStore } from '@/stores';
import { parseRepeat, trackEvent } from '@/utils';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

type FormState = {
  name: string;
  start: Date;
  end: Date;
  start_date: Date;
  end_date: Date;
  repeat: number[] | 'once';
  mode: 'focus' | 'shield';
  apps: string[];
};

const App = () => {
  const pstore = usePlanStore();
  const astore = useAppStore();
  const { colors } = useCustomTheme();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  // 解析预设参数
  const presetName = params.presetName as string | undefined;
  const presetStart = params.presetStart as string | undefined;
  const presetEnd = params.presetEnd as string | undefined;
  const presetRepeat = params.presetRepeat as string | undefined;

  const [title, setTitle] = useState(() => {
    // 预设模式：使用预设名称
    if (presetName) return presetName;
    // 编辑模式：使用编辑计划名称
    return pstore.editing_plan?.name || '';
  });

  // 判断是否为编辑模式
  const isEditing = !!pstore.editing_plan;

  // 检测是否从 onboarding 或 presets 进入
  const fromOnboarding = params.from === 'onboarding';
  const fromPresets = params.from === 'presets';

  // 使用 ref 保存清理函数，避免依赖项导致的循环更新
  const clearEditingPlanRef = useRef(pstore.clearEditingPlan);
  clearEditingPlanRef.current = pstore.clearEditingPlan;

  // 动态设置页面标题
  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? '编辑专注计划' : '创建专注计划',
    });
  }, [isEditing, navigation]);

  // 页面失去焦点时清理编辑状态
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // 页面退出时清理编辑状态
        clearEditingPlanRef.current();
      };
    }, []), // 使用 ref，不需要依赖项
  );

  // 编辑模式下初始化选中的应用和时长模式
  useEffect(() => {
    if (pstore.editing_plan) {
      const plan = pstore.editing_plan;

      // 初始化应用选择
      if (
        plan.apps &&
        Array.isArray(plan.apps) &&
        astore.ios_all_apps.length > 0
      ) {
        const apps = astore.ios_all_apps.filter(app =>
          plan.apps.includes(`${app.stableId}:${app.type}`),
        );
        setSelectedApps(apps);
      }

      // 检测是否为长期有效（结束日期大于 5 年后）
      const endDate = dayjs(plan.end_date);
      const fiveYearsLater = dayjs().add(5, 'year');
      const isLong = endDate.isAfter(fiveYearsLater);
      setIsLongTerm(isLong);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pstore.editing_plan?.id]); // 只在编辑计划 ID 变化时执行

  // 单独管理选择的应用状态
  const [selectedApps, setSelectedApps] = useState<any[]>([]);

  // 时长模式：true = 长期有效，false = 自定义时长
  const [isLongTerm, setIsLongTerm] = useState(true);
  const [form, setForm] = useState<FormState>(() => {
    // 编辑模式：使用编辑任务的数据初始化
    if (pstore.editing_plan) {
      const plan = pstore.editing_plan;
      const start = dayjs()
        .hour(plan.start_min / 60)
        .minute(plan.start_min % 60)
        .toDate();
      const end = dayjs()
        .hour(plan.end_min / 60)
        .minute(plan.end_min % 60)
        .toDate();
      const start_date = dayjs(plan.start_date).toDate();
      const end_date = dayjs(plan.end_date).toDate();

      return {
        name: plan.name,
        start,
        end,
        start_date,
        end_date,
        apps: plan.apps,
        repeat: Array.isArray(plan.repeat)
          ? plan.repeat
          : (parseRepeat(plan.repeat) as number[]),
        mode: plan.mode || 'shield',
      };
    }

    // 预设模式：使用预设参数初始化
    if (presetStart && presetEnd && presetRepeat) {
      // 解析时间字符串 "06:30" -> Date 对象（只保留时间部分）
      const [startHour, startMin] = presetStart.split(':').map(Number);
      const [endHour, endMin] = presetEnd.split(':').map(Number);

      const start = dayjs()
        .hour(startHour)
        .minute(startMin)
        .second(0)
        .millisecond(0)
        .toDate();

      const end = dayjs()
        .hour(endHour)
        .minute(endMin)
        .second(0)
        .millisecond(0)
        .toDate();

      const today = new Date();
      // 默认长期有效（10年后）
      const longTermDate = dayjs(today).add(10, 'year').toDate();

      let repeat: number[] | 'once' = [1, 2, 3, 4, 5];
      try {
        repeat = JSON.parse(presetRepeat);
      } catch (e) {
        console.log('解析预设重复参数失败:', e);
      }

      return {
        name: presetName || '',
        start,
        end,
        start_date: today,
        end_date: longTermDate,
        repeat,
        mode: 'shield',
        apps: [],
      };
    }

    // 添加模式：使用默认数据
    const start = new Date();
    const end = dayjs(start).add(20, 'minute').toDate();
    const today = new Date();
    // 默认长期有效（10年后）
    const longTermDate = dayjs(today).add(10, 'year').toDate();
    return {
      name: '',
      start,
      end,
      start_date: today,
      end_date: longTermDate,
      repeat: [1, 2, 3, 4, 5],
      mode: 'shield',
      apps: [],
    };
  });

  const submit = async () => {
    try {
      let { name, start, end, start_date, end_date, repeat } = form;
      name = title;
      // 验证计划名称
      if (!name.trim()) {
        return Toast('请输入计划名称', 'error');
      }

      // 验证日期范围（仅在自定义时长模式下验证）
      if (!isLongTerm && !dayjs(end_date).isAfter(dayjs(start_date), 'day')) {
        return Toast('结束日期必须大于开始日期', 'error');
      }
      // 验证应用选择（仅iOS）
      if (selectedApps.length === 0) {
        return Toast('请先选择要限制的应用', 'error');
      }
      if (astore.ios_all_apps.length === 0) {
        await astore.getIosApps();
      }
      let start_day = dayjs(start);
      let end_day = dayjs(end);
      // if (!end_day.isAfter(start_day)) {
      //   return Toast('结束时间必须大于开始时间', 'error');
      // }
      if (end_day.diff(start_day, 'minute') < 20) {
        return Toast('时间间隔最少20分钟', 'error');
      }
      const newStart = start_day.hour() * 60 + start_day.minute();
      const newEnd = end_day.hour() * 60 + end_day.minute();
      const overlap = pstore
        .all_plans()
        .filter(r => Array.isArray(r.repeat))
        .filter(plan => {
          // 编辑模式下排除当前编辑的任务
          if (isEditing && plan.id === pstore.editing_plan.id) {
            return false;
          }
          return true;
        })
        .some(plan => {
          const share = (plan.repeat as number[]).some(d =>
            (repeat as number[]).includes(d),
          );
          if (!share) return false;
          return newStart < plan.end_min && newEnd > plan.start_min;
        });
      console.log('overlap：', pstore.all_plans);
      if (overlap) {
        return Toast('任务时间不能重叠', 'error');
      }

      let subinfo: any = { ...form };
      subinfo.name = name.trim();
      subinfo.start = start_day.format('HH:mm');
      subinfo.end = end_day.format('HH:mm');
      subinfo.start_min = start_day.hour() * 60 + start_day.minute();
      subinfo.end_min = end_day.hour() * 60 + end_day.minute();
      subinfo.start_date = dayjs(start_date).format('YYYY-MM-DD');
      subinfo.end_date = dayjs(end_date).format('YYYY-MM-DD');

      // 根据模式调用不同的接口
      if (isEditing) {
        pstore.editPlan(pstore.editing_plan.id, subinfo, async res => {
          if (res) {
            Toast('编辑任务成功', 'success');
            router.back();
          } else {
            Toast('编辑任务失败', 'error');
          }
        });
      } else {
        pstore.addPlan(subinfo, async res => {
          if (res) {
            Toast('添加任务成功', 'success');
            trackEvent('plan_created', {
              from: fromOnboarding
                ? 'onboarding'
                : fromPresets
                  ? 'presets'
                  : 'normal',
            });

            // 从 onboarding 或 presets 进入：清空路由栈，直接进入首页
            // 正常进入：返回上一页
            if (fromOnboarding || fromPresets) {
              router.replace('/(tabs)');
            } else {
              router.back();
            }
          } else {
            Toast('添加任务失败', 'error');
          }
        });
      }
    } catch (error) {
      Toast('添加任务出错', 'error');
      console.log('添加任务失败：', error);
    }
  };

  const setInfo = (val: any, key: string) => {
    console.log('setInfo：', val, key);
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
        Toast('时长至少20分钟', 'error');
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
        Toast('结束日期不能早于开始日期', 'error');
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
  const selectApps = (apps: any[]) => {
    astore.addIosApps(apps);
    setSelectedApps(apps);
    setForm({
      ...form,
      apps: apps.map(r => `${r.stableId}:${r.type}`),
    });
  };

  return (
    <Page>
      <ScrollView style={{ padding: 15 }}>
        {/* 1. 任务名称输入框 */}
        <FieldGroup className="rounded-xl mb-4 p-4">
          <Flex className="flex-row items-center gap-2">
            <Text>{isEditing ? '✏️' : '🏆'}</Text>
            <TextInput
              placeholder={isEditing ? '修改任务名称' : '给任务起个名字'}
              value={title}
              placeholderTextColor={colors.text2}
              onChange={setTitle}
            />
          </Flex>
        </FieldGroup>

        {/* 2. 时间选择组 */}
        <FieldGroup className="rounded-xl mb-4">
          <FieldItem
            title="几点开始"
            rightText={dayjs(form.start).format('HH:mm')}
            onPress={() => {
              DatePicker({
                defaultValue: form.start,
                title: '开始时间',
                mode: 'h-m',
              }).then(({ action, value }) => {
                if (action === 'confirm') {
                  setInfo(value, 'start');
                }
              });
            }}
          />
          <FieldItem
            title="几点结束"
            rightText={dayjs(form.end).format('HH:mm')}
            onPress={() => {
              DatePicker({
                defaultValue: form.end,
                title: '结束时间',
                mode: 'h-m',
              }).then(({ action, value }) => {
                if (action === 'confirm') {
                  setInfo(value, 'end');
                }
              });
            }}
          />
        </FieldGroup>

        {/* 3. 应用选择 */}
        <FieldGroup divider={false} className="rounded-xl mb-4">
          <FieldItem
            title="要锁定的应用"
            className="pb-2"
            rightElement={<SelectApps apps={form.apps} onFinish={selectApps} />}
            showArrow={false}
          />
          <View className="px-4 pb-4">
            <SelectedApps apps={selectedApps} />
          </View>
        </FieldGroup>

        {/* 4. 有效时长（长期模式1个item，自定义模式3个item） */}
        <FieldGroup className="rounded-xl mb-4">
          <FieldItem
            title="有效时长"
            rightText={isLongTerm ? '长期有效' : '自定义'}
            onPress={() => {
              setIsLongTerm(!isLongTerm);
              // 切换到长期有效时，自动设置结束日期为10年后
              if (!isLongTerm) {
                const longTermDate = dayjs().add(10, 'year').toDate();
                setInfo(longTermDate, 'end_date');
              }
            }}
          />
          {!isLongTerm && (
            <>
              <FieldItem
                title="哪天开始"
                rightText={dayjs(form.start_date).format('M-D')}
                onPress={() => {
                  DatePicker({
                    defaultValue: form.start_date,
                    title: '开始日期',
                    mode: 'M-D',
                  }).then(({ action, value }) => {
                    if (action === 'confirm') {
                      setInfo(value, 'start_date');
                    }
                  });
                }}
              />
              <FieldItem
                title="哪天结束"
                rightText={dayjs(form.end_date).format('M-D')}
                onPress={() => {
                  DatePicker({
                    defaultValue: form.end_date,
                    title: '结束日期',
                    mode: 'M-D',
                  }).then(({ action, value }) => {
                    if (action === 'confirm') {
                      setInfo(value, 'end_date');
                    }
                  });
                }}
              />
            </>
          )}
        </FieldGroup>

        {/* 5. 重复规则 */}
        <FieldGroup divider={false} className="rounded-xl mb-4">
          <FieldItem
            className="pb-2"
            title="每周几重复"
            rightText={`已选${Array.isArray(form.repeat) ? form.repeat.length : 0}天`}
            rightTextStyle={{ fontSize: 14 }}
            showArrow={false}
          />
          <View className="px-4 pb-5">
            <Flex className="flex-1 gap-2 pt-2">
              {staticData.repeats.map(item => {
                const isSelected =
                  Array.isArray(form.repeat) &&
                  form.repeat.includes(item.value);
                return (
                  <Flex
                    className="items-center justify-center w-[38px] h-[38px] rounded-full"
                    key={item.value}
                    onPress={() => {
                      if (Array.isArray(form.repeat)) {
                        const newRepeat = isSelected
                          ? form.repeat.filter(day => day !== item.value)
                          : [...form.repeat, item.value];
                        setInfo(newRepeat, 'repeat');
                      }
                    }}
                    style={{
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.border,
                    }}>
                    <Text
                      style={{
                        color: colors.primaryForeground,
                        fontSize: 15,
                      }}>
                      {item.label}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </View>
        </FieldGroup>
      </ScrollView>
      <View className="px-5 pb-10">
        <Button onPress={submit} text={isEditing ? '保存修改' : '创建计划'} />
      </View>
    </Page>
  );
};

export default App;
