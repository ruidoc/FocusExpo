import { AppStore, HomeStore, PlanStore, UserStore } from '@/stores';
import { toast } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfirmationModal from './confirm-modal';
import ControlButtons from './control-buttons';

interface PlayButtonProps {
  // 可以传入自定义的点击处理函数
  onPress?: () => void;
}

const PlayButton: React.FC<PlayButtonProps> = observer(({ onPress }) => {
  const ustore = useLocalObservable(() => UserStore);
  const pstore = useLocalObservable(() => PlanStore);
  const astore = useLocalObservable(() => AppStore);
  const store = useLocalObservable(() => HomeStore);
  
  // 弹窗状态
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  
  // 开始专注
  const handleStart = () => {
    if (onPress) {
      onPress();
      return;
    }
    
    // 如果没有登录，跳转到登录页面
    if (!ustore.uInfo) {
      router.push('/login');
      return;
    }
    
    // 跳转到快速开始页面
    router.push('/quick-start');
  };
  
  // 暂停专注
  const handlePause = () => {
    setShowPauseModal(true);
  };
  
  // 停止专注
  const handleStop = () => {
    setShowStopModal(true);
  };
  
  // 确认暂停
  const confirmPause = () => {
    // 这里调用暂停逻辑
    // pstore.setPaused(true);
    toast('已暂停专注');
  };
  
  // 确认停止
  const confirmStop = () => {
    // 这里调用停止逻辑
    // pstore.stopFocus();
    toast('已停止专注');
  };
  
  // 获取当前状态
  const isTaskRunning = pstore.cur_plan && !pstore.paused;
  const isLoggedIn = !!ustore.uInfo;

  return (
    <View style={styles.container}>
      {/* 未登录或没有任务运行时，显示开始按钮 */}
      {!isTaskRunning && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Icon name="play" size={24} color="#B3B3BA" style={styles.playIcon} />
        </TouchableOpacity>
      )}
      
      {/* 任务运行中时，显示暂停和停止按钮 */}
      {isTaskRunning && (
        <ControlButtons
          onPause={handlePause}
          onStop={handleStop}
        />
      )}
      
      {/* 暂停确认弹窗 */}
      <ConfirmationModal
        visible={showPauseModal}
        title="暂停专注任务？"
        message="暂停可能会影响你的专注状态，确定要暂停吗？"
        confirmText="确认暂停"
        cancelText="继续专注"
        onConfirm={confirmPause}
        onCancel={() => {}}
        onClose={() => setShowPauseModal(false)}
      />
      
      {/* 停止确认弹窗 */}
      <ConfirmationModal
        visible={showStopModal}
        title="结束专注任务？"
        message="结束后将无法恢复当前任务，确定要结束吗？"
        confirmText="确认结束"
        cancelText="继续专注"
        onConfirm={confirmStop}
        onCancel={() => {}}
        onClose={() => setShowStopModal(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2, // 微调播放图标的位置
  },
});

export default PlayButton;
