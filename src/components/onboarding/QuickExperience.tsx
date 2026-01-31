import { AppToken } from '@/components/business';
import { Button } from '@/components/ui';
import { useAppStore, useHomeStore, usePlanStore } from '@/stores';
import { startAppLimits } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

interface QuickExperienceProps {
  onNext: () => void;
  setSelectedAppName: (name: string) => void;
  onPhaseChange?: (phase: 'ready' | 'active') => void;
}

type Phase = 'ready' | 'active';

const QuickExperience = ({
  onNext,
  setSelectedAppName,
  onPhaseChange,
}: QuickExperienceProps) => {
  const store = useHomeStore();
  const pstore = usePlanStore();
  const astore = useAppStore();

  const [phase, setPhase] = useState<Phase>('ready');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(5 * 60); // 5分钟倒计时（秒）

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
      end: now.add(5, 'minute').format('HH:mm'),
      end_min: cur_minute + 5,
      end_sec: cur_secend + 5 * 60,
      repeat: 'once',
      mode: 'shield',
    });

    if (Platform.OS === 'ios') {
      await startAppLimits(5, newId);
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
        <View className="flex-1 px-6 items-center">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Icon name="flash" size={36} color="hsl(var(--primary))" />
          </View>

          <Text className="text-2xl font-bold text-foreground mb-2 text-center tracking-tight">
            准备开启
          </Text>
          <Text className="text-base text-muted-foreground text-center mb-8 px-4">
            已准备好屏蔽环境，建议先从{' '}
            <Text className="text-primary font-bold">5分钟</Text> 微习惯开始。
          </Text>

          <View className="bg-card w-full p-5 rounded-2xl border border-border items-center">
            <Text className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-widest">
              受限应用 ({astore.ios_selected_apps.length})
            </Text>

            <View className="flex-row flex-wrap justify-center gap-3">
              {astore.ios_selected_apps.slice(0, 9).map((item, index) => (
                <AppToken key={item.id || item.stableId || index} app={item} size={50} />
              ))}
              {astore.ios_selected_apps.length > 9 && (
                <View className="w-[50px] h-[50px] rounded-xl bg-muted items-center justify-center">
                  <Text className="text-muted-foreground font-bold text-sm">
                    +{astore.ios_selected_apps.length - 9}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="px-6 pb-8">
          <Button
            text="开始 5 分钟专注"
            onPress={handleStart}
            loading={loading}
            className="w-full rounded-2xl h-14"
            textClassName="text-lg"
            style={{ shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
          />
        </View>
      </View>
    );
  }

  // 生效阶段
  return (
    <View className="flex-1">
      <View className="flex-1 px-6 items-center">
        {/* 倒计时圆环 */}
        <View className="w-28 h-28 rounded-full bg-green-500/10 items-center justify-center mb-5 border-4 border-green-500/20">
          <View className="w-20 h-20 rounded-full bg-green-500 items-center justify-center">
            <Text className="text-white text-2xl font-bold">
              {formatTime(remaining)}
            </Text>
          </View>
        </View>

        <Text className="text-2xl font-bold text-foreground mb-2 text-center tracking-tight">
          屏蔽生效中
        </Text>

        <Text className="text-base text-muted-foreground text-center leading-6 mb-4">
          以下应用已被屏蔽
        </Text>

        {/* 显示被屏蔽的应用图标 */}
        <View className="flex-row flex-wrap justify-center gap-3 mb-6">
          {astore.ios_selected_apps.slice(0, 6).map((item, index) => (
            <AppToken key={item.id || item.stableId || index} app={item} size={44} />
          ))}
          {astore.ios_selected_apps.length > 6 && (
            <View className="w-11 h-11 rounded-xl bg-muted items-center justify-center">
              <Text className="text-muted-foreground font-bold text-xs">
                +{astore.ios_selected_apps.length - 6}
              </Text>
            </View>
          )}
        </View>

        {/* 提示用户去验证 */}
        <View className="bg-card px-5 py-4 rounded-xl border border-border w-full">
          <View className="flex-row items-center">
            <Icon
              name="bulb-outline"
              size={20}
              color="hsl(var(--primary))"
              style={{ marginRight: 8 }}
            />
            <Text className="text-sm text-foreground font-medium flex-1">
              试试返回桌面，打开上面的应用
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground mt-2 ml-7">
            看看屏蔽效果是否生效
          </Text>
        </View>
      </View>

      <View className="px-6 pb-8">
        <Button
          onPress={onNext}
          text="已查看，下一步"
          type="ghost"
          className="w-full rounded-2xl h-14 border-2"
          textClassName="text-lg"
        />
      </View>
    </View>
  );
};

export default QuickExperience;
