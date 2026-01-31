import type { ProblemType } from '@/app/onboarding';
import { Button } from '@/components/ui';
import { useAppStore, useHomeStore } from '@/stores';
import { getScreenTimePermission, selectAppsToLimit } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useEffect } from 'react';
import {
  InteractionManager,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
      case 'study':
        return '建立纯净学习环境';
      case 'other':
        return '建立专注环境';
      default:
        return `戒除${getProblemLabel()}依赖`;
    }
  };

  const StepCard = ({
    step,
    title,
    desc,
    isCompleted,
    onPress,
    disabled,
    icon,
  }: {
    step: number;
    title: string;
    desc: string;
    isCompleted: boolean;
    onPress: () => void;
    disabled: boolean;
    icon: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className={`w-full p-5 rounded-2xl border mb-4 flex-row items-center transition-all ${
        isCompleted ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
      }`}>
      <View
        className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          isCompleted ? 'bg-primary' : 'bg-muted/20'
        }`}>
        {isCompleted ? (
          <Icon name="checkmark" size={24} color="#FFF" />
        ) : (
          <Text className="text-xl font-bold text-muted-foreground">{step}</Text>
        )}
      </View>

      <View className="flex-1">
        <Text
          className={`text-lg font-semibold mb-1 ${
            isCompleted ? 'text-primary' : 'text-foreground'
          }`}>
          {title}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {isCompleted ? '已完成' : desc}
        </Text>
      </View>

      <Icon
        name={icon as any}
        size={20}
        color={
          isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
        }
        style={{ opacity: 0.5 }}
      />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <View className="flex-1 px-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2 tracking-tight">
            屏蔽设置
          </Text>
          <Text className="text-base text-muted-foreground leading-6">
            {getSubtitle()}，只需简单两步。
          </Text>
        </View>

        <View className="mb-6">
          <StepCard
            step={1}
            title="授权屏幕时间权限"
            desc="用于检测和屏蔽应用"
            isCompleted={!!step1Completed}
            onPress={handleStep1}
            disabled={!!step1Completed}
            icon="shield-checkmark-outline"
          />

          <StepCard
            step={2}
            title={`选择${getProblemLabel()}应用`}
            desc="选择您想要屏蔽的APP"
            isCompleted={step2Completed}
            onPress={handleStep2}
            disabled={false}
            icon="apps-outline"
          />
        </View>

        {/* 隐私说明 */}
        <View className="bg-muted/30 rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <Icon
              name="shield-checkmark"
              size={16}
              color="hsl(var(--primary))"
            />
            <Text className="text-sm font-medium text-foreground ml-2">
              隐私保护承诺
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground leading-5">
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
          className="w-full rounded-2xl h-14"
          textClassName="text-lg"
        />
      </View>
    </View>
  );
};

export default PermissionSetup;
