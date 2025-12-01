import { useRecordStore, useUserStore } from '@/stores';
import { minutesToHours } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Header = () => {
  const ustore = useUserStore();
  const rstore = useRecordStore();

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // 获取用户名，如果没有登录显示默认名称
  const getUserName = () => {
    if (ustore.uInfo?.username) {
      return ustore.uInfo.username;
    }
    return 'Focus User';
  };

  // 点击计时器图标的处理
  const handleTimerPress = () => {
    router.push('/plans');
  };

  return (
    <View style={styles.container}>
      {/* 左侧问候语 */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>
          {getGreeting()}，{getUserName()}！
        </Text>
        <Text style={styles.encouragementText}>
          今日已专注 {minutesToHours(rstore.actual_mins)} 👍
        </Text>
      </View>

      {/* 右侧计时器图标 */}
      <TouchableOpacity
        style={styles.timerContainer}
        onPress={handleTimerPress}
        activeOpacity={0.7}>
        <View style={styles.timerIconWrapper}>
          <Icon name="timer-outline" size={22} color="#FFFFFF" />
          <View style={styles.timerGlow} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#858699',
    lineHeight: 24,
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  encouragementText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  timerContainer: {
    marginLeft: 16,
  },
  timerIconWrapper: {
    width: 40,
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 0.5,
  },
});

export default Header;
