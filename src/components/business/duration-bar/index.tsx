/**
 * DayDurationBar - 今日专注时长进度条
 * 显示今日已使用时长 / 总配额，仅对免费用户（非订阅）展示
 *
 * 样式参考：
 *   今日专注时长
 *   40 分钟 / 60 分钟
 *   [████████████░░░░]
 */

import { useBenefitStore, usePlanStore, useRecordStore } from '@/stores';
import { addLiveFocusDelta, getLiveFocusDelta } from '@/utils/live-focus';
import React from 'react';
import { Text, View } from 'react-native';

const formatMinutes = (min: number): string => {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  }
  return `${min}分钟`;
};

const DayDurationBar: React.FC = () => {
  const { is_subscribed, day_duration } = useBenefitStore();
  const pstore = usePlanStore();
  const rstore = useRecordStore();
  const displayUsed = addLiveFocusDelta(
    rstore.actual_mins,
    getLiveFocusDelta({
      active: !!pstore.active_plan,
      paused: !!pstore.is_pause(),
      curplanMinute: pstore.curplan_minute,
      currentRecordId: rstore.record_id,
      snapshotRecordId: rstore.actual_mins_snapshot_record_id,
      snapshotCurplanMinute: rstore.actual_mins_snapshot_curplan_minute,
    }),
  );

  // 订阅用户或未配置配额时不显示
  if (is_subscribed || day_duration <= 0) {
    return null;
  }

  const used = Math.min(displayUsed, day_duration);
  const progress = day_duration > 0 ? used / day_duration : 0;
  const isExhausted = displayUsed >= day_duration;

  const trackColor = isExhausted ? '#EF4444' : '#7A5AF8';
  const bgColor = '#2A2A3A';

  return (
    <View className="mt-3">
      {/* 标签行 */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-[12px]" style={{ color: '#858699' }}>
          今日专注时长
        </Text>
        <Text
          className="text-[12px]"
          style={{ color: isExhausted ? '#EF4444' : '#858699' }}>
          {formatMinutes(displayUsed)} / {formatMinutes(day_duration)}
        </Text>
      </View>

      {/* 进度条 */}
      <View
        className="rounded-full overflow-hidden"
        style={{ height: 4, backgroundColor: bgColor }}>
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.min(progress * 100, 100)}%`,
            backgroundColor: trackColor,
          }}
        />
      </View>
    </View>
  );
};

export default DayDurationBar;
