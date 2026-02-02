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
          readySubtitle: '点击后，短视频应用将立即被锁定',
          activeSuccess: '你已成功锁定短视频应用',
          activeAppHint: '抖音或小红书',
        };
      case 'game':
        return {
          readySubtitle: '点击后，游戏应用将立即被锁定',
          activeSuccess: '你已成功锁定游戏应用',
          activeAppHint: '王者荣耀或原神',
        };
      case 'study':
        return {
          readySubtitle: '点击后，干扰应用将立即被锁定',
          activeSuccess: '你已成功锁定干扰应用',
          activeAppHint: '短视频或游戏应用',
        };
      default:
        return {
          readySubtitle: '点击后，选中的应用将立即被锁定',
          activeSuccess: '你已成功锁定选中的应用',
          activeAppHint: '选中的应用',
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
          {/* 标题区 */}
          <View className="mb-9">
            <Text className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
              一切准备就绪
            </Text>
            <Text className="text-base text-white/60 text-center leading-6">
              {copy.readySubtitle}
            </Text>
          </View>

          {/* 应用展示卡片 */}
          <View
            className="w-full p-5 rounded-3xl items-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}>
            <Text className="text-sm font-medium text-white/70 mb-4">
              即将锁定
            </Text>

            <View className="flex-row flex-wrap justify-center gap-3 mb-4">
              {astore.ios_selected_apps.slice(0, 9).map((item, index) => (
                <AppToken
                  key={item.id || item.stableId || index}
                  app={item}
                  size={50}
                />
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

            <View
              className="w-full h-px mb-3"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            />

            <Text className="text-xs text-white/50">
              锁定时长：{FOCUS_DURATION} 分钟
            </Text>
          </View>
        </View>

        {/* 底部按钮 */}
        <View className="px-6 pb-8">
          <Button
            text="立即锁定"
            onPress={handleStart}
            loading={loading}
            className="w-full rounded-3xl h-14"
            textClassName="text-lg font-semibold"
          />
        </View>
      </View>
    );
  }

  // 生效阶段
  return (
    <View className="flex-1">
      <View className="flex-1 px-6">
        {/* 庆祝区 */}
        <View className="items-center pt-12 mb-8">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
            <Icon name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
            🎉 恭喜，锁定成功！
          </Text>
          <Text className="text-base text-white/60 text-center">
            {copy.activeSuccess}
          </Text>
        </View>

        {/* 倒计时圆环 */}
        <View className="items-center mb-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 3,
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}>
            <Text className="text-white text-2xl font-bold">
              {formatTime(remaining)}
            </Text>
          </View>
        </View>

        {/* 显示被锁定的应用图标 */}
        <View className="flex-row flex-wrap justify-center gap-3 mb-6">
          {astore.ios_selected_apps.slice(0, 6).map((item, index) => (
            <AppToken
              key={item.id || item.stableId || index}
              app={item}
              size={44}
            />
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

        {/* 验证邀请卡片 */}
        <View
          className="px-5 py-4 rounded-2xl w-full"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}>
          <View className="flex-row items-center mb-3">
            <Icon
              name="bulb-outline"
              size={20}
              color="#7A5AF8"
              style={{ marginRight: 8 }}
            />
            <Text className="text-sm text-white font-medium">
              💡 想确认锁定效果？
            </Text>
          </View>

          <Text className="text-xs text-white/60 mb-2">现在可以：</Text>
          
          <View className="gap-y-1.5 mb-3">
            <Text className="text-xs text-white/60">1. 退出这个页面</Text>
            <Text className="text-xs text-white/60">
              2. 尝试打开{copy.activeAppHint}
            </Text>
            <Text className="text-xs text-white/60">3. 看看是否能够打开</Text>
          </View>

          <Text className="text-xs text-white/40">
            提示：锁定期间无法打开
          </Text>
        </View>
      </View>

      {/* 底部按钮 */}
      <View className="px-6 pb-8">
        <Button
          onPress={onNext}
          text="我已确认"
          type="ghost"
          className="w-full rounded-3xl h-14 border-2"
          textClassName="text-lg"
        />
      </View>
    </View>
  );
};

export default QuickExperience;
