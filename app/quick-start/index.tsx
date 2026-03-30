import { Page, SelectApps, SelectedApps } from '@/components/business';
import { Button, FieldGroup, FieldItem, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import {
  useAppStore,
  useBenefitStore,
  usePlanStore,
  useRecordStore,
} from '@/stores';
import { getIOSFocusStatus, startAppLimits } from '@/utils/permission';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import TimeSlider from './time-slider';

const QuickStartPage = () => {
  const [minute, setMinute] = useState(15);
  const [mode, setMode] = useState<'shield' | 'allow'>('shield');
  const navigation = useNavigation();
  const { colors } = useCustomTheme();
  const pstore = usePlanStore();
  const rstore = useRecordStore();
  const astore = useAppStore();
  const bstore = useBenefitStore();
  const allowModeEnabled = bstore.features.includes('allow-mode');

  // 设置页面标题
  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: '快速专注',
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
      mode,
    };
    pstore.addOncePlan(from_data);
    rstore.addRecord(from_data, 0); // 下注设为 0
  };

  const selectApps = (apps: any[]) => {
    astore.addIosApps(apps);
  };

  // 开始一次性任务
  const handleStart = async () => {
    if (pstore.has_active_task()) {
      Toast('已有专注任务正在进行中', 'info');
      return;
    }

    const nativeFocus = await getIOSFocusStatus();
    if (nativeFocus.active) {
      pstore.setNativeFocus(nativeFocus);
      Toast('已有专注任务正在进行中', 'info');
      return;
    }

    // iOS: 验证应用选择
    if (astore.ios_selected_apps.length === 0) {
      Toast('请先选择要限制 的应用', 'info');
      return;
    }

    await useBenefitStore.getState().getBenefit();
    const latestBenefit = useBenefitStore.getState();
    const remainingMinutes =
      latestBenefit.day_duration - latestBenefit.today_used;
    if (!latestBenefit.is_subscribed && latestBenefit.day_duration > 0) {
      if (remainingMinutes <= 0) {
        Toast('今日专注时长已用完', 'info');
        return;
      }

      if (remainingMinutes < minute) {
        Toast(`今日剩余专注时长仅 ${remainingMinutes} 分钟`, 'info');
        return;
      }
    }

    let plan_id = `once_${Math.floor(Math.random() * 99999999)}`;
    // iOS: 使用屏幕时间限制开始屏蔽
    console.log('startAppLimits', minute, plan_id, mode);
    try {
      const ok = await startAppLimits(minute, plan_id, mode, {
        entry_source: 'quick_start',
        screen_name: 'quick_start',
        focus_type: 'once',
      });
      if (ok) {
        setOncePlan(plan_id);
        // 立刻刷新当前计划，避免等待 AppState/原生事件导致 active_plan 为空
        pstore.setCurPlanMinute(0);
        pstore.resetPlan();
        Toast('专注已开始', 'success');
        navigation.goBack();
      } else {
        Toast('启动专注失败，请重试', 'error');
      }
    } catch (error) {
      console.error('启动专注失败:', error);
      Toast('启动专注失败，请检查权限设置', 'error');
    }
  };

  return (
    <Page>
      <View className="p-5">
        {/* 屏蔽模式 */}
        {allowModeEnabled && (
          <View className="mb-4 flex-row justify-center">
            <SegmentedControl
              values={['锁定模式', '允许模式']}
              selectedIndex={mode === 'shield' ? 0 : 1}
              style={{ height: 40, width: 220 }}
              tintColor={'#85869950'}
              sliderStyle={{ backgroundColor: colors.primary }}
              appearance="dark"
              fontStyle={{ fontSize: 14 }}
              onChange={event => {
                const idx = event.nativeEvent.selectedSegmentIndex;
                setMode(idx === 0 ? 'shield' : 'allow');
              }}
            />
          </View>
        )}

        {/* 选择APP */}
        <FieldGroup divider={false} className="rounded-xl mb-4">
          <FieldItem
            title={
              allowModeEnabled && mode === 'allow'
                ? '允许使用的应用'
                : '要锁定的应用'
            }
            className="pt-3 pb-2"
            rightElement={
              <SelectApps
                apps={astore.ios_selected_apps}
                onFinish={selectApps}
                entrySource="quick_start"
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
          <FieldItem title="锁定时长" className="pb-2" showArrow={false} />
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
