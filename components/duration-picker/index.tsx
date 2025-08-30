import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';

type DurationPickerProps = {
  /** 默认分钟数 */
  defaultMinutes?: number;
  /** 选择变化时返回总分钟数 */
  onChange?: (totalMinutes: number) => void;
  /** 最大小时数（含），默认 23 */
  maxHours?: number;
  /** 是否禁用，默认 false */
  disabled?: boolean;
};

const ITEM_HEIGHT = 32; // 根据设计稿调整
const PICKER_HEIGHT = 177; // 固定高度，对应设计稿

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

const getIndexFromOffset = (offsetY: number) =>
  Math.round(offsetY / ITEM_HEIGHT);

const buildRange = (max: number) =>
  Array.from({ length: max + 1 }, (_, i) => i);

const DurationPicker: React.FC<DurationPickerProps> = memo(
  function DurationPicker({
    defaultMinutes = 0,
    onChange,
    maxHours = 23,
    disabled = false,
  }) {
    const hours = useMemo(() => buildRange(maxHours), [maxHours]);
    const minutes = useMemo(() => buildRange(59), []);

    const initHour = clamp(Math.floor(defaultMinutes / 60), 0, maxHours);
    const initMinute = clamp(defaultMinutes % 60, 0, 59);

    const [selectedHour, setSelectedHour] = useState<number>(initHour);
    const [selectedMinute, setSelectedMinute] = useState<number>(initMinute);

    const hourRef = useRef<ScrollView>(null);
    const minuteRef = useRef<ScrollView>(null);

    useEffect(() => {
      // 初始滚动定位
      setTimeout(() => {
        hourRef.current?.scrollTo({
          y: initHour * ITEM_HEIGHT,
          animated: false,
        });
        minuteRef.current?.scrollTo({
          y: initMinute * ITEM_HEIGHT,
          animated: false,
        });
      }, 0);
    }, [initHour, initMinute]);

    useEffect(() => {
      if (onChange) onChange(selectedHour * 60 + selectedMinute);
    }, [selectedHour, selectedMinute, onChange]);

    const onHourScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = clamp(getIndexFromOffset(y), 0, hours.length - 1);
      if (idx !== selectedHour) setSelectedHour(idx);
    };

    const onHourScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = clamp(getIndexFromOffset(y), 0, hours.length - 1);
      const snapY = idx * ITEM_HEIGHT;
      if (Math.abs(snapY - y) > 2) {
        hourRef.current?.scrollTo({ y: snapY, animated: true });
      }
      if (idx !== selectedHour) setSelectedHour(idx);
    };

    const onMinuteScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = clamp(getIndexFromOffset(y), 0, minutes.length - 1);
      if (idx !== selectedMinute) setSelectedMinute(idx);
    };

    const onMinuteScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = clamp(getIndexFromOffset(y), 0, minutes.length - 1);
      const snapY = idx * ITEM_HEIGHT;
      if (Math.abs(snapY - y) > 2) {
        minuteRef.current?.scrollTo({ y: snapY, animated: true });
      }
      if (idx !== selectedMinute) setSelectedMinute(idx);
    };

    // 计算每个数字相对于中心的距离，用于渐变效果
    const getItemOpacity = (index: number, selectedIndex: number) => {
      const distance = Math.abs(index - selectedIndex);
      if (distance === 0) return 1; // 选中项
      if (distance === 1) return 0.6; // 相邻项
      if (distance === 2) return 0.3; // 第二层
      return 0.1; // 更远的项
    };

    const getItemFontSize = (index: number, selectedIndex: number) => {
      const distance = Math.abs(index - selectedIndex);
      if (distance === 0) return 24; // 选中项大字体
      if (distance === 1) return 18; // 相邻项中等
      return 14; // 远距离项小字体
    };

    return (
      <View
        style={{
          height: PICKER_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#14141C',
          borderRadius: 8,
          position: 'relative',
        }}>
        {/* 选中高亮遮罩 - 横向指示器 */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
            height: ITEM_HEIGHT,
            borderRadius: 4,
            backgroundColor: '#181821',
            zIndex: 1,
          }}
        />

        {/* Hours Column */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ScrollView
            ref={hourRef}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={ITEM_HEIGHT}
            onScroll={onHourScroll}
            onMomentumScrollEnd={onHourScrollEnd}
            onScrollEndDrag={onHourScrollEnd}
            scrollEnabled={!disabled}
            style={{ height: PICKER_HEIGHT }}
            contentContainerStyle={{
              paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
            }}>
            {hours.map(h => (
              <View
                key={`h-${h}`}
                style={{
                  height: ITEM_HEIGHT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: getItemFontSize(h, selectedHour),
                    color: '#FFFFFF',
                    opacity: getItemOpacity(h, selectedHour),
                    fontWeight: '400',
                  }}>
                  {h}
                </Text>
              </View>
            ))}
          </ScrollView>
          {/* Hours label - 在选中区域内显示 */}
          <Text
            style={{
              position: 'absolute',
              right: 20,
              top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2 + 4,
              color: '#FFFFFF',
              fontSize: 16,
              zIndex: 2,
            }}>
            hours
          </Text>
        </View>

        {/* Minutes Column */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ScrollView
            ref={minuteRef}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={ITEM_HEIGHT}
            onScroll={onMinuteScroll}
            onMomentumScrollEnd={onMinuteScrollEnd}
            onScrollEndDrag={onMinuteScrollEnd}
            scrollEnabled={!disabled}
            style={{ height: PICKER_HEIGHT }}
            contentContainerStyle={{
              paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
            }}>
            {minutes.map(m => (
              <View
                key={`m-${m}`}
                style={{
                  height: ITEM_HEIGHT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: getItemFontSize(m, selectedMinute),
                    color: '#FFFFFF',
                    opacity: getItemOpacity(m, selectedMinute),
                    fontWeight: '400',
                  }}>
                  {pad2(m)}
                </Text>
              </View>
            ))}
          </ScrollView>
          {/* Minutes label - 在选中区域内显示 */}
          <Text
            style={{
              position: 'absolute',
              right: 20,
              top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2 + 4,
              color: '#FFFFFF',
              fontSize: 16,
              zIndex: 2,
            }}>
            min
          </Text>
        </View>
      </View>
    );
  },
);

export default DurationPicker;
