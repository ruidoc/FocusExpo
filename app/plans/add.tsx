import { AppToken, Page } from '@/components/business';
import { Button, Flex } from '@/components/ui';
import staticData from '@/config/static.json';
import { useCustomTheme } from '@/config/theme';
import { AppStore, PlanStore } from '@/stores';
import { parseRepeat, toast } from '@/utils';
import { selectAppsToLimit } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { TextInput } from '@/components/ui';
import {
  DatePicker,
  Field,
} from '@fruits-chain/react-native-xiaoshu';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

const App = observer(() => {
  const pstore = useLocalObservable(() => PlanStore);
  const astore = useLocalObservable(() => AppStore);
  const { colors } = useCustomTheme();
  const navigation = useNavigation();
  const [title, setTitle] = useState(() => {
    // 编辑模式下初始化标题
    return pstore.editing_plan?.name || '';
  });

  // 判断是否为编辑模式
  const isEditing = !!pstore.editing_plan;

  // 动态设置页面标题
  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? '编辑任务' : '添加任务',
    });
  }, [isEditing, navigation]);

  // 页面失去焦点时清理编辑状态
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // 页面退出时清理编辑状态
        pstore.clearEditingPlan();
      };
    }, [pstore]),
  );

  // 编辑模式下初始化选中的应用
  useEffect(() => {
    if (Platform.OS === 'ios' && pstore.editing_plan) {
      const plan = pstore.editing_plan;
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
    }
  }, []);

  const styles = StyleSheet.create({
    item: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      gap: 18,
    },
    week: {
      width: 38,
      height: 38,
      borderRadius: 20,
    },
    selectApps: {
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
  });

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

  // 单独管理选择的应用状态
  const [selectedApps, setSelectedApps] = useState<any[]>([]);
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

    // 添加模式：使用默认数据
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
      apps: [],
    };
  });

  const submit = async () => {
    try {
      let { name, start, end, start_date, end_date, repeat } = form;
      name = title;
      // 验证计划名称
      if (!name.trim()) {
        return toast('请输入计划名称', 'error');
      }

      // 验证日期范围
      if (!dayjs(end_date).isAfter(dayjs(start_date), 'day')) {
        return toast('结束日期必须大于开始日期', 'error');
      }

      // 验证应用选择（仅iOS）
      if (Platform.OS === 'ios' && selectedApps.length === 0) {
        return toast('请先选择要限制的应用', 'error');
      }
      let start_day = dayjs(start);
      let end_day = dayjs(end);
      if (!end_day.isAfter(start_day)) {
        return toast('结束时间必须大于开始时间', 'error');
      }
      if (end_day.diff(start_day, 'minute') < 20) {
        return toast('时间间隔最少20分钟', 'error');
      }
      const newStart = start_day.hour() * 60 + start_day.minute();
      const newEnd = end_day.hour() * 60 + end_day.minute();
      const overlap = pstore.all_plans
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
        return toast('任务时间不能重叠', 'error');
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
            toast('编辑任务成功', 'success');
            router.back();
          } else {
            toast('编辑任务失败', 'error');
          }
        });
      } else {
        pstore.addPlan(subinfo, async res => {
          if (res) {
            toast('添加任务成功', 'success');
            router.back();
          } else {
            toast('添加任务失败', 'error');
          }
        });
      }
    } catch (error) {
      toast('添加任务出错', 'error');
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
        toast('时长至少20分钟', 'error');
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
        toast('结束日期不能早于开始日期', 'error');
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
  const selectApps = (apps: string[]) => {
    console.log('选择默认的应用列表：', apps);
    selectAppsToLimit(0, apps)
      .then(data => {
        if (data.success && data.apps) {
          // 同时存储到AppStore和当前组件状态
          astore.addIosApps(data.apps);
          setSelectedApps(data.apps);
          setForm({
            ...form,
            apps: data.apps.map(r => `${r.stableId}:${r.type}`),
          });
        }
      })
      .catch(() => {
        toast('选择应用失败，请重试', 'error');
      });
  };

  const FeildItem = (props: any) => (
    <Flex
      className={props.column ? 'flex-col items-stretch' : 'items-center'}
      style={{
        ...styles.item,
        marginBottom: props.itemTop ? 0 : 16,
        borderTopLeftRadius: props.itemEnd ? 0 : 12,
        borderBottomLeftRadius: props.itemTop ? 0 : 12,
        borderTopRightRadius: props.itemEnd ? 0 : 12,
        borderBottomRightRadius: props.itemTop ? 0 : 12,
        borderBottomWidth: props.itemTop ? 0.5 : 0,
        borderColor: colors.border,
      }}>
      <Flex className="justify-between gap-2">
        {/* {props.required && <Text style={{ color: 'red', fontSize: 12 }}>*</Text>} */}
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          {props.title}
        </Text>
        {props.action || null}
      </Flex>
      {props.children}
    </Flex>
  );

  // 渲染已选择的应用
  const renderSelectedApps = () => {
    if (Platform.OS !== 'ios' || selectedApps.length === 0) {
      return (
        <View style={{ paddingVertical: 12 }}>
          <Text style={{ color: '#666', fontSize: 14 }}>未选择应用</Text>
        </View>
      );
    }

    return (
      <View style={{ paddingVertical: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2 }}>
          <Flex className="gap-2">
            {selectedApps.map((app, index) => (
              <AppToken
                key={`${app.stableId}-${index}`}
                app={app}
                size={25}
                gap={16}
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
    <Page>
      <ScrollView style={{ padding: 15 }}>
        <Flex className="gap-2" style={{ ...styles.item }}>
          <Text>{isEditing ? '✏️' : '🏆'}</Text>
          <TextInput
            placeholder={isEditing ? '修改任务名称' : '给任务起个名字'}
            value={title}
            placeholderTextColor={colors.text2}
            onChange={setTitle}
          />
        </Flex>

        <FeildItem title="哪天开始" itemTop style={{ borderRadiusLeftTop: 0 }}>
          <Flex
            className="justify-end"
            style={{ flex: 1 }}
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
            }}>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              {dayjs(form.start_date).format('M-D')}
            </Text>
            <Icon name="chevron-forward" size={20} color={colors.text} />
          </Flex>
        </FeildItem>

        <FeildItem title="哪天结束" itemEnd>
          <Flex
            className="justify-end"
            style={{ flex: 1 }}
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
            }}>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              {dayjs(form.end_date).format('M-D')}
            </Text>
            <Icon name="chevron-forward" size={20} color={colors.text} />
          </Flex>
        </FeildItem>
        {Platform.OS === 'ios' && (
          <FeildItem
            title="要屏蔽的应用"
            column
            bottom={16}
            action={
              <Pressable
                onPress={() => selectApps(form.apps)}
                style={styles.selectApps}>
                <Icon name="add" size={16} color="#B3B3BA" />
                <Text style={{ color: '#858699', fontSize: 13 }}>选择</Text>
              </Pressable>
            }>
            {renderSelectedApps()}
          </FeildItem>
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

        <FeildItem title="几点开始" itemTop>
          <Flex
            className="justify-end"
            style={{ flex: 1 }}
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
            }}>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              {dayjs(form.start).format('HH:mm')}
            </Text>
            <Icon name="chevron-forward" size={20} color={colors.text} />
          </Flex>
        </FeildItem>

        <FeildItem title="几点结束" itemEnd>
          <Flex
            className="justify-end"
            style={{ flex: 1 }}
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
            }}>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              {dayjs(form.end).format('HH:mm')}
            </Text>
            <Icon name="chevron-forward" size={20} color={colors.text} />
          </Flex>
        </FeildItem>

        <FeildItem
          title="每周几生效"
          action={
            <Text style={{ color: colors.text3, fontSize: 14 }}>
              已选{Array.isArray(form.repeat) ? form.repeat.length : 0}天
            </Text>
          }
          column>
          <Flex style={{ flex: 1, gap: 12, paddingBottom: 6, paddingTop: 2 }}>
            {staticData.repeats.map(item => {
              const isSelected =
                Array.isArray(form.repeat) && form.repeat.includes(item.value);
              return (
                <Flex
                  className="items-center justify-center"
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
                    ...styles.week,
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
        </FeildItem>

        {Array.isArray(form.repeat) && form.repeat.length > 0 && (
          <View style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>
              预计重复次数：
              {Array.isArray(form.repeat)
                ? calculateRepeatCount(
                  form.start_date,
                  form.end_date,
                  form.repeat,
                )
                : 0}{' '}
              次
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
        <Button onPress={submit} text={isEditing ? '保存修改' : '确认'} />
      </View>
    </Page>
  );
});

export default App;
