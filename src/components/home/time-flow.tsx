import { usePlanStore } from '@/stores';
import { getIOSFocusStatus } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const TimeFlow = () => {
  const pstore = usePlanStore();
  const nativeFocus = pstore.native_focus;
  const focusPlan = pstore.focus_plan();
  const hasPlan = pstore.has_active_task();
  const fallbackTotalMinutes = Math.max(
    (focusPlan?.end_min || 0) - (focusPlan?.start_min || 0),
    0,
  );
  const totalMinutes = Math.max(
    nativeFocus.total_minutes || fallbackTotalMinutes,
    0,
  );
  const isPaused = pstore.is_pause();
  const currentPlanId = nativeFocus.plan_id || focusPlan?.id;

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // 进度：以计划整体区间为基准，反映从 start 到当前的消耗占比
  const getProgress = () => {
    if (!hasPlan || totalMinutes <= 0) return 0;
    return Math.max(Math.min(pstore.curplan_minute / totalMinutes, 1), 0);
  };

  // 获取剩余时间（分钟）
  const getRemainingMinutes = () => {
    if (!hasPlan) return 0;
    return Math.max(totalMinutes - pstore.curplan_minute, 0);
  };

  // 获取显示的时间（显示剩余时间）
  const getDisplayTime = () => {
    if (hasPlan) {
      const remainingMinutes = getRemainingMinutes();
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}`;
      }
      return `0:${mins.toString().padStart(2, '0')}`;
    }
    return '0:00';
  };

  // 获取目标文本
  const getGoalText = () => {
    if (hasPlan) {
      return '剩余时间 (分钟)';
    }
    return '当前无任务';
  };
  const [pauseRemaining, setPauseRemaining] = useState<number>(0);

  useEffect(() => {
    if (!isPaused || Platform.OS !== 'ios') {
      setPauseRemaining(0);
      return;
    }
    const timer = setInterval(async () => {
      try {
        const status = await getIOSFocusStatus();
        if (status.paused_until) {
          const now = Date.now() / 1000;
          setPauseRemaining(Math.max(0, status.paused_until - now));
        } else {
          setPauseRemaining(0);
        }
      } catch {
        setPauseRemaining(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, currentPlanId]);

  const formatPauseTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = getProgress();
  const circumference = 2 * Math.PI * 136; // 半径136的圆周长
  const minVisibleArcLength = 10; // 0% 时最小可见弧长（仅在有任务时显示）
  const zeroProgressDashoffset = circumference - minVisibleArcLength;
  // 进度动画：首帧从0到当前值，之后每次变更平滑过渡
  const [progressAnim] = useState(new Animated.Value(0));
  const didInitAnimRef = useRef(false);
  const prevPlanIdRef = useRef<string | undefined>(currentPlanId || undefined);

  useEffect(() => {
    const planId = currentPlanId || undefined;
    const planChanged = planId !== prevPlanIdRef.current;
    prevPlanIdRef.current = planId;

    if (planChanged) {
      didInitAnimRef.current = false;
      progressAnim.setValue(0);
    }

    progressAnim.stopAnimation();
    if (!didInitAnimRef.current) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        didInitAnimRef.current = true;
      });
    } else {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, currentPlanId, progressAnim]);
  const animatedDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  const strokeDashoffsetValue: any =
    hasPlan && progress === 0 ? zeroProgressDashoffset : animatedDashoffset;

  // spin 已移除（旋转动画未使用）

  return (
    <View style={styles.container}>
      {/* SVG进度环 */}
      <Svg width={300} height={300} style={styles.progressRing}>
        {/* 定义渐变 */}
        <Defs>
          <LinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
            <Stop offset="0%" stopColor="#6A11CB" />
            <Stop offset="100%" stopColor="#2575FC" />
          </LinearGradient>
        </Defs>

        {/* 背景圆环 */}
        <Circle
          cx="150"
          cy="150"
          r="136"
          stroke="#303044"
          strokeWidth="28"
          fill="none"
        />

        {/* 进度圆环 - 渐变色 */}
        <AnimatedCircle
          cx="150"
          cy="150"
          r="136"
          stroke="url(#progressGradient)"
          strokeWidth="28"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffsetValue}
          transform="rotate(-90 150 150)"
        />
      </Svg>

      {/* 中央内容 */}
      <View style={styles.centerContent}>
        {/* 目标文本 */}
        <Text style={styles.goalText}>{getGoalText()}</Text>

        {/* 时间显示 */}
        <Text style={styles.timeText}>{getDisplayTime()}</Text>

        {/* 进度 / 暂停状态 */}
        {hasPlan &&
          (isPaused && pauseRemaining > 0 ? (
            <View style={styles.statusChip}>
              <Icon name="pause-circle" size={15} color="#F7AF5D" />
              <Text style={[styles.statusText, { color: '#F7AF5D' }]}>
                暂停中 {formatPauseTime(pauseRemaining)}
              </Text>
            </View>
          ) : (
            <View style={styles.statusChip}>
              <Icon name="hourglass-outline" size={15} color="#7A5AF8" />
              <Text style={styles.statusText}>
                完成 {Math.round(progress * 100)}%
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  goalText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#858699',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  timeText: {
    fontSize: 70,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 72,
    letterSpacing: -1.4,
    marginBottom: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(133, 134, 153, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#858699',
    letterSpacing: -0.1,
  },
});

export default TimeFlow;
