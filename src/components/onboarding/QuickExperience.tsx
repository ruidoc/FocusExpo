import { AppToken } from '@/components/business';
import { Button } from '@/components/ui';
import { useAppStore, useHomeStore, usePlanStore } from '@/stores';
import { startAppLimits } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

interface QuickExperienceProps {
  problem: 'video' | 'game' | 'study' | 'other' | null;
  onNext: () => void;
  setSelectedAppName: (name: string) => void;
  onPhaseChange?: (phase: 'ready' | 'active') => void;
}

type Phase = 'ready' | 'active';

// 专注时长（分钟）
const FOCUS_DURATION = 2;

const QuickExperience = ({
  problem,
  onNext,
  setSelectedAppName,
  onPhaseChange,
}: QuickExperienceProps) => {
  const store = useHomeStore();
  const pstore = usePlanStore();
  const astore = useAppStore();

  const [phase, setPhase] = useState<Phase>('ready');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(FOCUS_DURATION * 60); // 倒计时（秒）

  // 根据 problem 获取个性化文案
  const getPersonalizedCopy = () => {
    switch (problem) {
      case 'video':
        return {
          readySubtitle: '接下来 2 分钟，短视频将无法打开',
          activeHint: '现在去试试打开抖音',
          activeHintSub: '它已经被限制了 ✓',
        };
      case 'game':
        return {
          readySubtitle: '接下来 2 分钟，游戏将无法打开',
          activeHint: '现在去试试打开你的游戏',
          activeHintSub: '它已经被限制了 ✓',
        };
      case 'study':
        return {
          readySubtitle: '接下来 2 分钟，干扰应用将被限制',
          activeHint: '现在去试试打开那些分心的 App',
          activeHintSub: '它们已经被限制了 ✓',
        };
      default:
        return {
          readySubtitle: '接下来 2 分钟，这些应用将被限制',
          activeHint: '现在去试试打开上面的应用',
          activeHintSub: '它们已经被限制了 ✓',
        };
    }
  };

  const copy = getPersonalizedCopy();

  // 倒计时逻辑
  useEffect(() => {
    if (phase !== 'active') return;

    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setLoading(true);
    const now = dayjs();
    const cur_minute = now.hour() * 60 + now.minute();
    const cur_secend = cur_minute * 60 + now.second();
    const newId = `once_${Math.floor(Math.random() * 99999999)}`;

    pstore.addOncePlan({
      id: newId,
      start: now.format('HH:mm'),
      start_min: cur_minute,
      start_sec: cur_secend,
      end: now.add(FOCUS_DURATION, 'minute').format('HH:mm'),
      end_min: cur_minute + FOCUS_DURATION,
      end_sec: cur_secend + FOCUS_DURATION * 60,
      repeat: 'once',
      mode: 'shield',
    });

    if (Platform.OS === 'ios') {
      await startAppLimits(FOCUS_DURATION, newId);
      // 设置应用名称供后续使用
      if (astore.ios_selected_apps.length > 0) {
        setSelectedAppName(astore.ios_selected_apps[0].name || '');
      }
    } else {
      store.startVpn();
    }

    setLoading(false);
    setPhase('active');
    // 通知父组件进入 active 阶段，禁用返回按钮
    onPhaseChange?.('active');
  };

  // 准备阶段
  if (phase === 'ready') {
    return (
      <View className="flex-1">
        <View className="flex-1 px-6 items-center justify-center">
          <View className="mb-9">
            <Text className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
              体验一下
            </Text>
            <Text className="text-base text-white/60 text-center">
              {copy.readySubtitle}
            </Text>
          </View>

          <View
            className="w-full p-5 rounded-3xl items-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 2,
              borderColor: 'transparent',
            }}>
            <Text className="text-sm font-medium text-white/50 mb-4 uppercase tracking-widest">
              受限应用 ({astore.ios_selected_apps.length})
            </Text>

            <View className="flex-row flex-wrap justify-center gap-3">
              {astore.ios_selected_apps.slice(0, 9).map((item, index) => (
                <AppToken key={item.id || item.stableId || index} app={item} size={50} />
              ))}
              {astore.ios_selected_apps.length > 9 && (
                <View
                  className="w-[50px] h-[50px] rounded-xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Text className="text-white/60 font-bold text-sm">
                    +{astore.ios_selected_apps.length - 9}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="px-6 pb-8">
          <Button
            text={`开始 ${FOCUS_DURATION} 分钟专注`}
            onPress={handleStart}
            loading={loading}
            className="w-full rounded-3xl h-14"
            textClassName="text-lg"
          />
        </View>
      </View>
    );
  }

  // 生效阶段
  return (
    <View className="flex-1">
      <View className="flex-1 px-6 items-center justify-center">
        {/* 倒计时圆环 */}
        <View
          className="w-28 h-28 rounded-full items-center justify-center mb-5"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 4,
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}>
          <View className="w-20 h-20 rounded-full bg-emerald-500 items-center justify-center">
            <Text className="text-white text-2xl font-bold">
              {formatTime(remaining)}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
            限制生效中
          </Text>
          <Text className="text-base text-white/60 text-center">
            以下应用已被限制
          </Text>
        </View>

        {/* 显示被限制的应用图标 */}
        <View className="flex-row flex-wrap justify-center gap-3 mb-6">
          {astore.ios_selected_apps.slice(0, 6).map((item, index) => (
            <AppToken key={item.id || item.stableId || index} app={item} size={44} />
          ))}
          {astore.ios_selected_apps.length > 6 && (
            <View
              className="w-11 h-11 rounded-xl items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Text className="text-white/60 font-bold text-xs">
                +{astore.ios_selected_apps.length - 6}
              </Text>
            </View>
          )}
        </View>

        {/* 提示用户去验证 */}
        <View
          className="px-5 py-4 rounded-2xl w-full"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}>
          <View className="flex-row items-center">
            <Icon
              name="bulb-outline"
              size={20}
              color="#7A5AF8"
              style={{ marginRight: 8 }}
            />
            <Text className="text-sm text-white font-medium flex-1">
              {copy.activeHint}
            </Text>
          </View>
          <Text className="text-xs text-white/40 mt-2 ml-7">
            {copy.activeHintSub}
          </Text>
        </View>
      </View>

      <View className="px-6 pb-8">
        <Button
          onPress={onNext}
          text="已查看，下一步"
          type="ghost"
          className="w-full rounded-3xl h-14 border-2"
          textClassName="text-lg"
        />
      </View>
    </View>
  );
};

export default QuickExperience;
