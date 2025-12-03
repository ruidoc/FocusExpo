import { useBenefitStore, usePlanStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const TimeFlow = observer(() => {
  const pstore = usePlanStore();
  const bstore = useBenefitStore();

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // 进度：以计划整体区间为基准，反映从 start 到当前的消耗占比
  const getProgress = () => {
    if (!pstore.active_plan) return 0;
    const duration = Math.max(
      pstore.active_plan.end_min - pstore.active_plan.start_min,
      0,
    );
    if (duration <= 0) return 0;
    return Math.max(Math.min(pstore.curplan_minute / duration, 1), 0);
  };

  // 获取剩余时间（分钟）
  const getRemainingMinutes = () => {
    if (!pstore.active_plan) return 0;
    let total = pstore.active_plan.end_min - pstore.active_plan.start_min;
    return Math.max(total - pstore.curplan_minute, 0);
  };

  // 获取显示的时间（显示剩余时间）
  const getDisplayTime = () => {
    if (pstore.active_plan) {
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
    if (pstore.active_plan) {
      return '剩余时间 (分钟)';
    }
    return '当前无任务';
  };

  // 旋转动画已移除（当前未使用）

  const progress = getProgress();
  const circumference = 2 * Math.PI * 136; // 半径136的圆周长
  const hasPlan = !!pstore.active_plan;
  const minVisibleArcLength = 10; // 0% 时最小可见弧长（仅在有任务时显示）
  const zeroProgressDashoffset = circumference - minVisibleArcLength;
  // 进度动画：首帧从0到当前值，之后每次变更平滑过渡
  const [progressAnim] = useState(new Animated.Value(0));
  const didInitAnimRef = useRef(false);
  useEffect(() => {
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
  }, [progress, progressAnim]);
  // 当切换/重置计划时，重置首帧动画
  useEffect(() => {
    didInitAnimRef.current = false;
    progressAnim.setValue(0);
  }, [pstore.active_plan?.id, progressAnim]);
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

        {/* 连续天数 */}
        <TouchableOpacity style={styles.streakContainer}>
          <Icon name="flame" size={16} color="#EF6820" />
          <Text style={styles.streakText}>{bstore.balance} coins</Text>
          <Icon name="chevron-forward" size={14} color="#B3B3BA" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

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
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#858699',
    marginLeft: 4,
    marginRight: 4,
    letterSpacing: -0.1,
  },
});

export default TimeFlow;
