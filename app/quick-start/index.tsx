import { Page, SelectApps, SelectedApps } from '@/components/business';
import { Button, FieldGroup, FieldItem } from '@/components/ui';
import {
  useAppStore,
  useBenefitStore,
  usePlanStore,
  useRecordStore,
} from '@/stores';
import { startAppLimits } from '@/utils/permission';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import TimeSlider from './time-slider';

const QuickStartPage = () => {
  const [minute, setMinute] = useState(15);
  const navigation = useNavigation();
  const pstore = usePlanStore();
  const rstore = useRecordStore();
  const astore = useAppStore();
  const bstore = useBenefitStore();

  // 设置页面标题
  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: '快速开始',
    });
  }, [navigation]);

  const setOncePlan = (plan_id: string) => {
    let now = dayjs();
    let cur_minute = now.hour() * 60 + now.minute();
    let cur_secend = cur_minute * 60 + now.second();
    let select_apps = astore.ios_selected_apps.map(
      r => `${r.stableId}:${r.type}`,
    );
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
      mode: 'shield',
    };
    pstore.addOncePlan(from_data);
    rstore.addRecord(from_data, 0); // 下注设为 0
  };

  const selectApps = (apps: any[]) => {
    astore.addIosApps(apps);
  };

  // 开始一次性任务
  const handleStart = async () => {
    if (pstore.active_plan) {
      return;
    }

    // iOS: 验证应用选择
    if (astore.ios_selected_apps.length === 0) {
      return;
    }

    let plan_id = `once_${Math.floor(Math.random() * 99999999)}`;
    // iOS: 使用屏幕时间限制开始屏蔽
    const ok = await startAppLimits(minute, plan_id);
    if (ok) {
      setOncePlan(plan_id);
      // 立刻刷新当前计划，避免等待 AppState/原生事件导致 active_plan 为空
      pstore.setCurPlanMinute(0);
      pstore.resetPlan();
    }
    navigation.goBack();
  };

  return (
    <Page>
      <View className="p-5">
        {/* 选择APP */}
        <FieldGroup divider={false} className="rounded-xl mb-4">
          <FieldItem
            title="暂停这些应用"
            className="pt-3 pb-2"
            rightElement={
              <SelectApps
                apps={astore.ios_selected_apps}
                onFinish={selectApps}
              />
            }
            showArrow={false}
          />
          <View className="px-4 pb-4">
            <SelectedApps apps={astore.ios_selected_apps} />
          </View>
        </FieldGroup>

        {/* 设置时长 */}
        <FieldGroup divider={false} className="rounded-xl mb-4">
          <FieldItem title="设置时长" className="pb-2" showArrow={false} />
          <View className="px-4 pb-4">
            <TimeSlider minute={minute} setMinute={setMinute} />
          </View>
        </FieldGroup>
      </View>
      <View className="px-8">
        <Button onPress={handleStart} text="开始专注" />
      </View>
    </Page>
  );
};

export default QuickStartPage;
