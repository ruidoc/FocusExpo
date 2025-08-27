import { PlanStore, RecordStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface TimeFlowProps {
  // 传入专注状态相关数据
}

const TimeFlow: React.FC<TimeFlowProps> = observer(() => {
  const pstore = useLocalObservable(() => PlanStore);
  const rstore = useLocalObservable(() => RecordStore);
  
  // 动画值
  const [rotateValue] = useState(new Animated.Value(0));
  
  // 模拟连续天数数据 - 后续可以从store获取
  const streakDays = 5;
  
  // Tooltip 状态
  const [showTooltip, setShowTooltip] = useState(false);
  
  // 计算进度百分比（如果有当前计划）
  const getProgress = () => {
    if (!pstore.cur_plan) return 0.3; // 测试时显示30%进度
    const total = pstore.cur_plan.end_min - pstore.cur_plan.start_min;
    const current = pstore.curplan_minute;
    return Math.min(current / total, 1);
  };
  
  // 获取剩余时间（分钟）
  const getRemainingMinutes = () => {
    if (!pstore.cur_plan) return 0;
    const total = pstore.cur_plan.end_min - pstore.cur_plan.start_min;
    const current = pstore.curplan_minute;
    return Math.max(total - current, 0);
  };
  
  // 获取显示的时间（显示剩余时间）
  const getDisplayTime = () => {
    if (pstore.cur_plan) {
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
    if (pstore.cur_plan) {
      return '剩余时间 (分钟)'
    }
    return '当前无任务';
  };
  
  // 启动旋转动画
  const startRotation = () => {
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };
  
  useEffect(() => {
    if (pstore.cur_plan && !pstore.paused) {
      startRotation();
    }
  }, [pstore.cur_plan, pstore.paused]);
  
  const progress = getProgress();
  const circumference = 2 * Math.PI * 136; // 半径136的圆周长
  const strokeDashoffset = circumference * (1 - progress);
  
  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* SVG进度环 */}
      <Svg width={300} height={300} style={styles.progressRing}>
        {/* 定义渐变 */}
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
        <Circle
          cx="150"
          cy="150"
          r="136"
          stroke="url(#progressGradient)"
          strokeWidth="28"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
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
        <TouchableOpacity 
          style={styles.streakContainer}
          onPress={() => setShowTooltip(true)}
        >
          <Icon name="flame" size={16} color="#EF6820" />
          <Text style={styles.streakText}>{streakDays} days Streak</Text>
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
