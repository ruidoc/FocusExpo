/**
 * DayDurationBar - 今日专注时长进度条
 * 显示今日已使用时长 / 总配额，仅对免费用户（非订阅）展示
 *
 * 样式参考：
 *   今日专注时长
 *   40 分钟 / 60 分钟
 *   [████████████░░░░]
 */

import { useCustomTheme } from '@/config/theme';
import { useBenefitStore, usePlanStore, useRecordStore } from '@/stores';
import { addLiveFocusDelta, getLiveFocusDelta } from '@/utils/live-focus';
import React from 'react';
import { Text, View } from 'react-native';

const UNLIMITED_DAY_DURATION_MINUTES = 24 * 60;

const formatMinutes = (min: number): string => {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  }
  return `${min}分钟`;
};

const DayDurationBar: React.FC = () => {
  const { colors } = useCustomTheme();
  const { is_subscribed, day_duration } = useBenefitStore();
  const pstore = usePlanStore();
  const rstore = useRecordStore();
  const totalDuration =
    day_duration > 0 ? day_duration : UNLIMITED_DAY_DURATION_MINUTES;
  const displayUsed = addLiveFocusDelta(
    rstore.actual_mins,
    getLiveFocusDelta({
      active: pstore.has_active_task(),
      paused: !!pstore.is_pause(),
      curplanMinute: pstore.curplan_minute,
      currentRecordId: rstore.record_id,
      snapshotRecordId: rstore.actual_mins_snapshot_record_id,
      snapshotCurplanMinute: rstore.actual_mins_snapshot_curplan_minute,
    }),
  );

  // 订阅用户不显示；day_duration=0 视为不限时，按 24 小时展示
  if (is_subscribed) {
    return null;
  }

  const used = Math.min(displayUsed, totalDuration);
  const progress = used / totalDuration;
  const isExhausted = displayUsed >= totalDuration;

  const trackColor = isExhausted ? colors.danger : colors.primary;
  const bgColor = colors.progressTrack;

  return (
    <View className="mt-3">
      {/* 标签行 */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-[12px]" style={{ color: colors.text2 }}>
          今日专注时长
        </Text>
        <Text
          className="text-[12px]"
          style={{ color: isExhausted ? colors.danger : colors.text2 }}>
          {formatMinutes(displayUsed)} / {formatMinutes(totalDuration)}
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
