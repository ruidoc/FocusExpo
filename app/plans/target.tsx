import { Page } from '@/components/business';
import { Button } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

type OnboardingProblem = 'video' | 'game' | 'study' | 'other';
type TargetTaskId = 'short_video' | 'sleep';

interface TargetTask {
  id: TargetTaskId;
  stepLabel: string;
  title: string;
  subtitle: string;
  startTime: string;
  endTime: string;
  repeat: number[];
  repeatText: string;
  appSelectHint: string;
}

const TARGET_TASKS: TargetTask[] = [
  {
    id: 'short_video',
    stepLabel: '戒短视频',
    title: '一周不刷短视频',
    subtitle: '晚上最容易停不下来，先锁住这 1 小时',
    startTime: '20:00',
    endTime: '21:00',
    repeat: [1, 2, 3, 4, 5, 6, 0],
    repeatText: '每天',
    appSelectHint: '选择让你上瘾的短视频应用',
  },
  {
    id: 'sleep',
    stepLabel: '停止熬夜',
    title: '一周不熬夜玩手机',
    subtitle: '睡前锁定 1 小时，不给「再刷 5 分钟」的机会',
    startTime: '22:00',
    endTime: '23:00',
    repeat: [1, 2, 3, 4, 5, 6, 0],
    repeatText: '每天',
    appSelectHint: '选择你睡前总忍不住刷的应用',
  },
];

const parseProblem = (value?: string): OnboardingProblem => {
  if (value === 'video' || value === 'game' || value === 'study') {
    return value;
  }
  return 'other';
};

const parseCompletedTasks = (value?: string) =>
  value
    ?.split(',')
    .map(item => item.trim())
    .filter(Boolean) as TargetTaskId[] | undefined;

const COMPLETE_COLOR = '#22C55E';
const PENDING_COLOR_DARK = 'rgba(255,255,255,0.22)';
const PENDING_COLOR_LIGHT = 'rgba(0,0,0,0.15)';

const TargetPage = () => {
  const params = useLocalSearchParams<{
    from?: string;
    problem?: string;
    completedTasks?: string;
  }>();
  const navigation = useNavigation();
  const { colors, isDark } = useCustomTheme();
  const fromOnboarding = params.from === 'onboarding';
  const problem = parseProblem(params.problem);

  const completedTaskIds = useMemo(
    () => new Set(parseCompletedTasks(params.completedTasks) || []),
    [params.completedTasks],
  );

  const completedCount = TARGET_TASKS.filter(task =>
    completedTaskIds.has(task.id),
  ).length;
  const currentTask =
    completedCount < TARGET_TASKS.length ? TARGET_TASKS[completedCount] : null;

  useEffect(() => {
    if (fromOnboarding) {
      navigation.setOptions({
        headerShown: false,
        gestureEnabled: false,
      });
    }
  }, [fromOnboarding, navigation]);

  useEffect(() => {
    trackEvent('target_page_view', {
      entry_source: fromOnboarding ? 'onboarding' : 'normal',
      problem,
      completed_count: completedCount,
      current_task_id: currentTask?.id || 'all_completed',
    });
  }, [completedCount, currentTask?.id, fromOnboarding, problem]);

  const handleCreateTask = (task: TargetTask) => {
    trackEvent('target_task_clicked', {
      task_id: task.id,
      task_name: task.title,
      entry_source: fromOnboarding ? 'onboarding' : 'normal',
      completed_count: completedCount,
      problem,
    });

    router.push({
      pathname: '/plans/add',
      params: {
        from: 'target',
        problem,
        taskId: task.id,
        taskIndex: String(completedCount),
        completedTasks: Array.from(completedTaskIds).join(','),
        presetName: task.title,
        presetStart: task.startTime,
        presetEnd: task.endTime,
        presetRepeat: JSON.stringify(task.repeat),
        presetDuration: '7d',
        appSelectHint: task.appSelectHint,
      },
    });
  };

  return (
    <Page safe decoration>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-8">
          {/* 自定义标题区 */}
          <View className="mb-8 mx-4">
            <Text
              className="text-[26px] font-bold tracking-tight"
              style={{ color: colors.text }}>
              签 2 个契约，开始改变
            </Text>
            <Text
              className="text-base mt-2 leading-6"
              style={{ color: colors.text3 }}>
              90% 的新用户都从这两步开始
            </Text>
          </View>

          {/* 步骤指示器 */}
          <View className="flex-row items-start justify-center mb-8 mx-8">
            {TARGET_TASKS.map((task, index) => {
              const isCompleted = index < completedCount;
              const isCurrent = index === completedCount && !!currentTask;
              const lineColor =
                index < completedCount
                  ? COMPLETE_COLOR
                  : isDark
                    ? PENDING_COLOR_DARK
                    : PENDING_COLOR_LIGHT;

              return (
                <React.Fragment key={task.id}>
                  <View className="items-center w-[82px]">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center border"
                      style={{
                        backgroundColor: isCompleted
                          ? COMPLETE_COLOR
                          : isCurrent
                            ? `${colors.primary}1A`
                            : 'transparent',
                        borderColor: isCompleted
                          ? COMPLETE_COLOR
                          : isCurrent
                            ? colors.primary
                            : isDark
                              ? 'rgba(255,255,255,0.25)'
                              : 'rgba(0,0,0,0.15)',
                      }}>
                      {isCompleted ? (
                        <Icon name="checkmark" size={20} color="#FFFFFF" />
                      ) : (
                        <Text
                          className="text-base font-bold"
                          style={{
                            color: isCurrent
                              ? colors.primary
                              : isDark
                                ? 'rgba(255,255,255,0.55)'
                                : 'rgba(0,0,0,0.4)',
                            fontVariant: ['tabular-nums'],
                          }}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      className="text-[12px] text-center mt-2 leading-4 font-semibold"
                      style={{
                        color:
                          isCompleted || isCurrent ? colors.text : colors.text3,
                      }}>
                      {task.stepLabel}
                    </Text>
                  </View>
                  {index < TARGET_TASKS.length - 1 && (
                    <View
                      className="flex-1 h-[1px] mt-5 mx-2"
                      style={{ backgroundColor: lineColor }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {currentTask ? (
            <View
              className="rounded-[28px] p-6 border"
              style={{
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.03)',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.06)',
              }}>
              <Text className="text-sm mb-2" style={{ color: colors.text3 }}>
                第 {completedCount + 1} 个契约
              </Text>
              <Text
                className="text-[26px] font-semibold leading-8"
                style={{ color: colors.text }}>
                {currentTask.title}
              </Text>
              <Text
                className="text-sm mt-3 leading-6"
                style={{ color: colors.text2 }}>
                {currentTask.subtitle}
              </Text>

              <View
                className="rounded-2xl px-4 py-4 mt-6"
                style={{
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.03)',
                }}>
                <View className="flex-row items-center">
                  <Icon name="time-outline" size={16} color={colors.text3} />
                  <Text
                    className="text-sm ml-2"
                    style={{
                      fontVariant: ['tabular-nums'],
                      color: colors.text2,
                    }}>
                    {currentTask.repeatText} · {currentTask.startTime} -{' '}
                    {currentTask.endTime} · 持续一周
                  </Text>
                </View>
              </View>

              <View className="mt-6">
                <Button
                  onPress={() => handleCreateTask(currentTask)}
                  text={`创建第 ${completedCount + 1} 个契约`}
                />
              </View>
            </View>
          ) : (
            <View
              className="rounded-[28px] p-6 border"
              style={{
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.03)',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.06)',
              }}>
              <View className="items-center py-2">
                <View className="w-14 h-14 rounded-full bg-[#22C55E1F] items-center justify-center mb-4">
                  <Icon name="checkmark" size={28} color={COMPLETE_COLOR} />
                </View>
                <Text
                  className="text-[24px] font-semibold mb-2"
                  style={{ color: colors.text }}>
                  2 个契约已生效
                </Text>
                <Text
                  className="text-sm text-center leading-6 mb-6"
                  style={{ color: colors.text2 }}>
                  接下来一周，它们会按时自动锁定你的应用
                </Text>
                <Button
                  className="w-[140px]"
                  onPress={() => {
                    if (router.canDismiss()) {
                      router.dismissAll();
                    }
                    router.replace('/(tabs)');
                  }}
                  text="进入首页"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Page>
  );
};

export default TargetPage;
