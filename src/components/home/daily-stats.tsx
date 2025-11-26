import { RecordStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DailyStatsProps {
  // 可以传入自定义数据
}

const DailyStats: React.FC<DailyStatsProps> = observer(() => {
  const rstore = useLocalObservable(() => RecordStore);
  
  // 导航到统计页面
  const handleTodayPress = () => {
    // 这里可以导航到详细的统计页面，暂时先跳转到挑战页面
    router.push('/(tabs)/user'); // 或者其他统计页面
  };
  
  const handleSummaryPress = () => {
    router.push('/(tabs)/user');
  };
  
  const handleChallengePress = () => {
    // 跳转到挑战页面，但这里是tabs内的页面，可能需要调整
    // router.push('/challenges');
  };
  
  const handleProfilePress = () => {
    router.push('/(tabs)/user');
  };

  return (
    <View style={styles.container}>
      {/* Today Tab - Active */}
      <TouchableOpacity 
        style={[styles.tab, styles.activeTab]}
        onPress={handleTodayPress}
      >
        <View style={styles.activeIndicator}>
          <View style={styles.glowEffect} />
          <View style={styles.textureOverlay} />
        </View>
        <Text style={styles.activeTabText}>Today</Text>
      </TouchableOpacity>
      
      {/* Summary Tab */}
      <TouchableOpacity 
        style={styles.tab}
        onPress={handleSummaryPress}
      >
        <Icon name="bar-chart" size={20} color="#B3B3BA" />
        <Text style={styles.tabText}>Summary</Text>
      </TouchableOpacity>
      
      {/* Challenge Tab */}
      <TouchableOpacity 
        style={styles.tab}
        onPress={handleChallengePress}
      >
        <Icon name="trophy" size={20} color="#B3B3BA" />
        <Text style={styles.tabText}>Challenge</Text>
      </TouchableOpacity>
      
      {/* Profile Tab */}
      <TouchableOpacity 
        style={styles.tab}
        onPress={handleProfilePress}
      >
        <View style={styles.profileAvatar}>
          <View style={styles.avatarImage} />
        </View>
        <Text style={styles.tabText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#14141C',
    borderTopWidth: 1,
    borderTopColor: '#1C1C26',
    // 添加模糊背景效果（如果需要）
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  activeTab: {
    position: 'relative',
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 17,
    position: 'relative',
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#3538CD',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderRadius: 17,
    backgroundColor: 'transparent',
    // 这里可以添加渐变背景
  },
  activeTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A5AF8',
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: -0.24,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#858699',
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: -0.24,
  },
  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7F56D9',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7F56D9',
    // 这里可以用实际的头像图片替换
  },
});

export default DailyStats;
