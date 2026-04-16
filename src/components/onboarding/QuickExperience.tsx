import { AppToken } from '@/components/business';
import { Button, Toast } from '@/components/ui';
import { useAppStore, useHomeStore, usePlanStore } from '@/stores';
import { startAppLimits, stopAppLimits } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
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
  const endTimeRef = useRef<number>(0);
  const onboardingOncePlanIdRef = useRef<string | null>(null);

  const clearOnboardingOncePlan = () => {
    const id = onboardingOncePlanIdRef.current;
    if (!id) return;

    pstore.rmOncePlan(id);
    onboardingOncePlanIdRef.current = null;
    pstore.resetPlan();
  };

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

  // 倒计时逻辑：基于结束时间戳，避免 setInterval 漂移（endTimeRef 在 handleStart 中设置）
  useEffect(() => {
    if (phase !== 'active' || endTimeRef.current === 0) return;

    const tick = () => {
      const sec = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );
      setRemaining(sec);
      if (sec > 0) {
        timerRef.current = setTimeout(tick, 1000);
      }
    };

    const timerRef = { current: null as ReturnType<typeof setTimeout> | null };
    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const MIN_LOADING_MS = 1000;

  const handleStart = async () => {
    setLoading(true);
    const startTime = Date.now();
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
    onboardingOncePlanIdRef.current = newId;

    try {
      const started = await startAppLimits(FOCUS_DURATION, newId, 'shield', {
        entry_source: 'onboarding',
        screen_name: 'onboarding_quick_experience',
        focus_type: 'once',
      });
      if (!started) {
        clearOnboardingOncePlan();
        return;
      }
      // 设置应用名称供后续使用
      if (astore.ios_selected_apps.length > 0) {
        setSelectedAppName(astore.ios_selected_apps[0].name || '');
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise(r => setTimeout(r, MIN_LOADING_MS - elapsed));
      }

      endTimeRef.current = startTime + FOCUS_DURATION * 60 * 1000;
      setPhase('active');
      // 通知父组件进入 active 阶段，禁用返回按钮
      onPhaseChange?.('active');
    } catch (error) {
      console.log('QuickExperience handleStart error', error);
      clearOnboardingOncePlan();
      Toast('启动锁定失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      if (Platform.OS === 'ios') {
        await stopAppLimits();
      } else {
        store.stopVpn();
      }
    } catch (e) {
      console.log('QuickExperience handleConfirm stop error', e);
    }

    clearOnboardingOncePlan();

    endTimeRef.current = 0;
    onPhaseChange?.('ready');
    onNext();
  };

  // 准备阶段
  if (phase === 'ready') {
    return (
      <View className="flex-1">
        <View className="flex-1 px-6 items-center pt-12">
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
            }}>
            <Text className="text-[15px] text-white/70 mb-4">
              即将锁定的应用
            </Text>

            <View className="flex-row flex-wrap justify-center gap-3 mb-4">
              {astore.ios_selected_apps.slice(0, 9).map((item, index) => (
                <AppToken
                  key={item.id || item.stableId || index}
                  app={item}
                  size={30}
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
              className="w-[50%] h-px mb-3"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            />

            <Text className="text-[14px] text-white/40">
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
            loadingText="锁定中"
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
        <View className="items-center pt-12 mb-2">
          <Icon name="checkmark-circle-outline" size={100} color="#10b981" />
          <Text className="text-2xl mt-4 font-bold text-white mb-2 text-center tracking-tight">
            🎉 恭喜，应用锁定成功！
          </Text>
        </View>

        {/* 显示被锁定的应用图标 */}
        <View className="flex-row flex-wrap justify-center gap-3 mb-12">
          {astore.ios_selected_apps.slice(0, 6).map((item, index) => (
            <AppToken
              key={item.id || item.stableId || index}
              app={item}
              size={30}
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

        {/* 倒计时 */}
        <View className="items-center mb-8">
          <Text
            className="text-4xl font-semibold tracking-tight"
            style={{ color: '#ffffff' }}>
            {remaining > 0 ? formatTime(remaining) : '0:00'}
          </Text>
          <Text className="text-base text-white/60 text-center">
            {remaining > 0 ? '倒计时结束后，自动解锁' : '已解锁'}
          </Text>
        </View>

        {/* 验证邀请卡片 */}
        <View
          className="px-5 py-4 rounded-2xl w-full"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}>
          <View className="flex-row items-center mb-3">
            <Icon
              name="bulb-outline"
              size={20}
              color="#7A5AF8"
              style={{ marginRight: 8 }}
            />
            <Text className="text-sm text-white font-medium">
              如何验证锁定效果？
            </Text>
          </View>

          <View className="gap-y-1.5 pl-5">
            <Text className="text-xs text-white/60">1. 退出这个页面</Text>
            <Text className="text-xs text-white/60">
              2. 找到被锁定的应用，尝试打开
            </Text>
          </View>
        </View>
        {/* <Text className="text-xs text-center mt-3 text-white/40">
          提示：非紧急时刻，不允许解除锁定
        </Text> */}
      </View>

      {/* 底部按钮 */}
      <View className="px-6 pb-8 mx-6">
        <Button
          onPress={handleConfirm}
          text="我已确认"
          type="ghost"
          className="w-full rounded-3xl border-1"
          textClassName="text-lg"
        />
      </View>
    </View>
  );
};

export default QuickExperience;
