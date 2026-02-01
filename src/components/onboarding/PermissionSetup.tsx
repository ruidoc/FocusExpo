import type { ProblemType } from '@/app/onboarding';
import { Button, Flex } from '@/components/ui';
import { useAppStore, useHomeStore } from '@/stores';
import { getScreenTimePermission, selectAppsToLimit } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useEffect } from 'react';
import { InteractionManager, Platform, Text, View } from 'react-native';

interface PermissionSetupProps {
  problem: ProblemType;
  onNext: () => void;
}

const PermissionSetup = ({ problem, onNext }: PermissionSetupProps) => {
  const store = useHomeStore();
  const astore = useAppStore();

  const step1Completed = store.ios_screen_time_permission;
  const step2Completed = astore.ios_selected_apps.length > 0;

  useEffect(() => {
    store.checkVpn();
    InteractionManager.runAfterInteractions(() => {
      if (store.all_apps.length === 0) {
        store.loadApps();
      }
    });
  }, []);

  const checkIOSPermission = async () => {
    const status = await store.checkIOSScreenTimePermission();
    if (!status) {
      const granted = await getScreenTimePermission();
      if (granted) {
        store.setIOSScreenTimePermission(true);
      } else {
        store.setIOSScreenTimePermission(false);
      }
    }
  };

  const handleStep1 = () => {
    if (Platform.OS === 'ios') {
      checkIOSPermission();
    }
  };

  const handleStep2 = () => {
    if (Platform.OS === 'ios') {
      selectAppsToLimit().then(data => {
        // 在 onboarding 期间只本地保存，不调用接口
        // 登录后再上报到服务器
        astore.setIosSelectedApps(data.apps);
      });
    }
  };

  const handleNext = () => {
    if (step1Completed && step2Completed) {
      onNext();
    }
  };

  const getProblemLabel = () => {
    switch (problem) {
      case 'video':
        return '短视频';
      case 'game':
        return '游戏';
      case 'study':
        return '学习';
      case 'other':
        return '分心';
      default:
        return '分心';
    }
  };

  const getSubtitle = () => {
    switch (problem) {
      case 'video':
        return '远离短视频干扰';
      case 'game':
        return '控制游戏时间';
      case 'study':
        return '创建无干扰学习环境';
      default:
        return '开启专注模式';
    }
  };

  const StepCard = ({
    step,
    title,
    desc,
    isCompleted,
    onPress,
    disabled,
  }: {
    step: number;
    title: string;
    desc: string;
    isCompleted: boolean;
    onPress: () => void;
    disabled: boolean;
  }) => (
    <Flex
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.8}
      className="w-full p-4 rounded-3xl mb-3"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        borderColor: isCompleted ? '#7A5AF8' : 'transparent',
      }}>
      <View
        className="w-11 h-11 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
        {isCompleted ? (
          <Icon name="checkmark" size={22} color="#10b981" />
        ) : (
          <Text className="text-lg font-bold text-white/50">{step}</Text>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-lg font-semibold text-white mb-0.5">{title}</Text>
        <Text className="text-sm text-white/40">
          {isCompleted ? '已完成' : desc}
        </Text>
      </View>

      <View
        className="w-6 h-6 rounded-full items-center justify-center"
        style={{
          backgroundColor: isCompleted ? '#7A5AF8' : 'transparent',
          borderWidth: isCompleted ? 0 : 1.5,
          borderColor: 'rgba(255, 255, 255, 0.15)',
        }}>
        {isCompleted && <Icon name="checkmark" size={14} color="#FFF" />}
      </View>
    </Flex>
  );

  return (
    <View className="flex-1">
      <View className="flex-1 px-6">
        <View className="mb-9">
          <Text className="text-2xl font-bold text-white mb-2 tracking-tight text-center">
            开启专注保护
          </Text>
          <Text className="text-base text-white/60 leading-6 text-center">
            {getSubtitle()}，只需两步
          </Text>
        </View>

        <View className="mb-6 px-1">
          <StepCard
            step={1}
            title="授权屏幕时间权限"
            desc="用于检测和限制应用"
            isCompleted={!!step1Completed}
            onPress={handleStep1}
            disabled={!!step1Completed}
          />

          <StepCard
            step={2}
            title={`选择${getProblemLabel()}应用`}
            desc="选择您想要限制的APP"
            isCompleted={step2Completed}
            onPress={handleStep2}
            disabled={false}
          />
        </View>

        {/* 隐私说明 */}
        <View
          className="rounded-2xl p-4 mx-1"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}>
          <View className="flex-row items-center mb-2">
            <Icon name="shield-checkmark" size={16} color="#7A5AF8" />
            <Text className="text-sm font-medium text-white/80 ml-2">
              隐私保护承诺
            </Text>
          </View>
          <Text className="text-xs text-white/40 leading-5">
            • 仅在本地运行，不上传任何数据{'\n'}
            • 无法查看您的聊天记录或隐私{'\n'}
            • 符合 Apple 隐私政策
          </Text>
        </View>
      </View>

      <View className="px-6 pb-8">
        <Button
          disabled={!step1Completed || !step2Completed}
          onPress={handleNext}
          text="下一步"
          className="w-full rounded-3xl h-14"
          textClassName="text-lg"
        />
      </View>
    </View>
  );
};

export default PermissionSetup;
