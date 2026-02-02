import { Button, Flex } from '@/components/ui';
import { useAppStore, useHomeStore } from '@/stores';
import { getScreenTimePermission, selectAppsToLimit } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useEffect } from 'react';
import { InteractionManager, Platform, Text, View } from 'react-native';

interface PermissionSetupProps {
  problem: 'video' | 'game' | 'study' | 'other' | null;
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

  // 根据场景获取标题
  const getSceneLabel = () => {
    switch (problem) {
      case 'video':
        return '短视频';
      case 'game':
        return '游戏';
      case 'study':
        return '分心';
      case 'other':
        return '干扰';
      default:
        return '干扰';
    }
  };

  // 根据场景获取 Step 2 的个性化建议
  const getStep2Guidance = () => {
    switch (problem) {
      case 'video':
        return {
          title: '选择短视频应用',
          apps: '抖音、小红书、B站等',
          desc: '选择 3-5 个最常刷的',
        };
      case 'game':
        return {
          title: '选择游戏应用',
          apps: '王者荣耀、原神、和平精英等',
          desc: '选择 3-5 个最常玩的',
        };
      case 'study':
        return {
          title: '选择分心应用',
          apps: '短视频、游戏、社交应用',
          desc: '选择 3-5 个最分心的',
        };
      default:
        return {
          title: '选择要屏蔽的应用',
          apps: '短视频、游戏、社交等',
          desc: '选择 3-5 个最容易分心的',
        };
    }
  };

  const step2Guidance = getStep2Guidance();

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
      }}>
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
        {isCompleted ? (
          <Icon name="checkmark-circle" size={24} color="#10b981" />
        ) : (
          <Text className="text-base font-bold text-white/50">{step}</Text>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-lg font-semibold text-white mb-0.5">{title}</Text>
        {isCompleted ? (
          <Text className="text-sm text-emerald-500">已完成</Text>
        ) : (
          <Text className="text-sm text-white/40">{desc}</Text>
        )}
      </View>
    </Flex>
  );

  return (
    <View className="flex-1">
      <View className="flex-1 px-6">
        {/* 标题 */}
        <View className="mb-9">
          <Text className="text-2xl font-bold text-white mb-2 tracking-tight text-center">
            准备屏蔽{getSceneLabel()}应用
          </Text>
          <Text className="text-base text-white/60 leading-6 text-center">
            设置权限并选择应用，只需两步
          </Text>
        </View>

        {/* Step 1 */}
        <View className="mb-3 px-1">
          <StepCard
            step={1}
            title="授权屏幕时间权限"
            desc="让系统能够强制锁定应用"
            isCompleted={!!step1Completed}
            onPress={handleStep1}
            disabled={!!step1Completed}
          />
        </View>

        {/* 隐私说明 - 仅在 Step 1 未完成时显示 */}
        {!step1Completed && (
          <View
            className="rounded-2xl p-4 mx-1 mb-6"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}>
            <Text className="text-sm font-medium text-white/70 mb-3">
              为什么需要这个权限？
            </Text>

            <View className="gap-y-2.5">
              <View className="flex-row items-start">
                <Icon
                  name="checkmark-circle"
                  size={16}
                  color="#7A5AF8"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <View className="flex-1">
                  <Text className="text-xs font-medium text-white/60 mb-0.5">
                    实现系统级屏蔽
                  </Text>
                  <Text className="text-xs text-white/40">
                    只有获得权限，才能强制锁定应用
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Icon
                  name="checkmark-circle"
                  size={16}
                  color="#7A5AF8"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <View className="flex-1">
                  <Text className="text-xs font-medium text-white/60 mb-0.5">
                    我们看不到你的数据
                  </Text>
                  <Text className="text-xs text-white/40">
                    所有屏蔽逻辑在手机本地执行，不上传任何信息
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Icon
                  name="checkmark-circle"
                  size={16}
                  color="#7A5AF8"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <View className="flex-1">
                  <Text className="text-xs font-medium text-white/60 mb-0.5">
                    你的隐私是安全的
                  </Text>
                  <Text className="text-xs text-white/40">
                    无法查看聊天内容、浏览记录或任何隐私
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 2 */}
        <View className="px-1">
          <StepCard
            step={2}
            title={step2Guidance.title}
            desc={step1Completed ? step2Guidance.desc : '请先完成第一步'}
            isCompleted={step2Completed}
            onPress={handleStep2}
            disabled={!step1Completed}
          />

          {/* Step 2 的个性化提示 - 仅在 Step 1 完成且 Step 2 未完成时显示 */}
          {step1Completed && !step2Completed && (
            <View className="ml-16 mb-6 -mt-2">
              <Text className="text-xs text-white/50 leading-5">
                推荐 {step2Guidance.apps}
              </Text>
            </View>
          )}
        </View>

        {/* 占位，确保 Step 2 完成后有合适的间距 */}
        {(!step1Completed || step2Completed) && <View className="mb-6" />}
      </View>

      {/* 底部按钮 */}
      <View className="px-6 pb-8">
        {step1Completed && step2Completed && (
          <Text className="text-center text-white/40 text-xs mb-3">
            接下来，将进入 2 分钟快速体验
          </Text>
        )}
        <Button
          disabled={!step1Completed || !step2Completed}
          onPress={handleNext}
          text={step1Completed && step2Completed ? '继续体验' : '下一步'}
          className="w-full rounded-3xl h-14"
          textClassName="text-lg"
        />
      </View>
    </View>
  );
};

export default PermissionSetup;
