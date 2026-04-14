import { Page } from '@/components/business';
import { Button } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { trackEvent } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type OnboardingProblem = 'video' | 'game' | 'study' | 'other';
type TargetTaskId = 'short_video' | 'sleep' | 'study_work';

interface TargetTask {
  id: TargetTaskId;
  stepLabel: string;
  title: string;
  subtitle: string;
  startTime: string;
  endTime: string;
  repeat: number[];
  repeatText: string;
  appHint: string;
}

const TARGET_TASKS: TargetTask[] = [
  {
    id: 'short_video',
    stepLabel: '短视频',
    title: '21天不刷短视频',
    subtitle: '先锁住最容易停不下来的内容',
    startTime: '20:00',
    endTime: '23:00',
    repeat: [1, 2, 3, 4, 5, 6, 7],
    repeatText: '每天',
    appHint: '建议先选抖音、小红书、视频号等应用',
  },
  {
    id: 'sleep',
    stepLabel: '熬夜',
    title: '21天不熬夜玩手机',
    subtitle: '到点自动锁，减少“再玩10分钟”',
    startTime: '23:00',
    endTime: '07:00',
    repeat: [1, 2, 3, 4, 5, 6, 7],
    repeatText: '每天',
    appHint: '建议优先选择夜里最常点开的娱乐应用',
  },
  {
    id: 'study_work',
    stepLabel: '学习/工作',
    title: '21天专注学习 / 工作',
    subtitle: '把高价值时间先守住',
    startTime: '09:00',
    endTime: '11:30',
    repeat: [1, 2, 3, 4, 5],
    repeatText: '工作日',
    appHint: '建议先选会频繁打断你的娱乐、社交和资讯应用',
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
const PENDING_COLOR = 'rgba(255,255,255,0.22)';

const TargetPage = () => {
  const params = useLocalSearchParams<{
    from?: string;
    problem?: string;
    completedTasks?: string;
  }>();
  const navigation = useNavigation();
  const { colors } = useCustomTheme();
  const fromOnboarding = params.from === 'onboarding';
  const problem = parseProblem(params.problem);

  const completedTaskIds = useMemo(
    () => new Set(parseCompletedTasks(params.completedTasks) || []),
    [params.completedTasks],
  );

  const completedCount = TARGET_TASKS.filter(task =>
    completedTaskIds.has(task.id),
  ).length;
  const currentTask = completedCount < TARGET_TASKS.length
    ? TARGET_TASKS[completedCount]
    : null;

  const handleSkip = useCallback(() => {
    trackEvent('target_tasks_skipped', {
      entry_source: fromOnboarding ? 'onboarding' : 'normal',
      completed_count: completedCount,
      problem,
    });
    router.replace('/(tabs)');
  }, [completedCount, fromOnboarding, problem]);

  useEffect(() => {
    if (fromOnboarding) {
      navigation.setOptions({
        title: '新手任务',
        headerLeft: () => null as any,
        gestureEnabled: false,
        headerBackVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text className="text-sm text-white/55">稍后</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [fromOnboarding, handleSkip, navigation]);

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
        completedTasks: Array.from(completedTaskIds).join(','),
        presetName: task.title,
        presetStart: task.startTime,
        presetEnd: task.endTime,
        presetRepeat: JSON.stringify(task.repeat),
      },
    });
  };

  return (
    <Page safe decoration>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-8">
          <View className="flex-row items-start justify-between mb-8">
            {TARGET_TASKS.map((task, index) => {
              const isCompleted = index < completedCount;
              const isCurrent = index === completedCount && !!currentTask;
              const lineColor = index < completedCount - 1
                ? COMPLETE_COLOR
                : index === completedCount - 1
                  ? COMPLETE_COLOR
                  : PENDING_COLOR;

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
                            : 'rgba(255,255,255,0.25)',
                      }}>
                      {isCompleted ? (
                        <Icon name="checkmark" size={20} color="#FFFFFF" />
                      ) : (
                        <Text
                          className="text-base font-semibold"
                          style={{
                            color: isCurrent ? colors.primary : 'rgba(255,255,255,0.55)',
                            fontVariant: ['tabular-nums'],
                          }}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      className="text-[11px] text-center mt-2 leading-4"
                      style={{
                        color: isCompleted || isCurrent
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.5)',
                      }}>
                      {task.stepLabel}
                    </Text>
                  </View>
                  {index < TARGET_TASKS.length - 1 && (
                    <View
                      className="flex-1 h-[2px] mt-5 mx-2"
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
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}>
              <Text className="text-sm text-white/45 mb-2">
                第 {completedCount + 1} 步
              </Text>
              <Text className="text-[26px] font-semibold text-white leading-8">
                {currentTask.title}
              </Text>
              <Text className="text-sm text-white/60 mt-3 leading-6">
                {currentTask.subtitle}
              </Text>

              <View
                className="rounded-2xl px-4 py-4 mt-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <Text className="text-xs text-white/40 mb-2">默认时间</Text>
                <View className="flex-row items-center">
                  <Icon name="time-outline" size={16} color="#B3B3BA" />
                  <Text
                    className="text-sm text-[#D1D5DB] ml-2"
                    style={{ fontVariant: ['tabular-nums'] }}>
                    {currentTask.repeatText} · {currentTask.startTime} - {currentTask.endTime}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mt-4 mb-6">
                <Icon
                  name="phone-portrait-outline"
                  size={16}
                  color="rgba(255,255,255,0.45)"
                  style={{ marginTop: 2 }}
                />
                <Text className="text-sm text-white/55 leading-5 ml-2 flex-1">
                  {currentTask.appHint}
                </Text>
              </View>

              <Button
                onPress={() => handleCreateTask(currentTask)}
                text="创建这个目标"
              />
            </View>
          ) : (
            <View
              className="rounded-[28px] p-6 border"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}>
              <View className="items-center py-2">
                <View className="w-14 h-14 rounded-full bg-[#22C55E1F] items-center justify-center mb-4">
                  <Icon name="checkmark" size={28} color={COMPLETE_COLOR} />
                </View>
                <Text className="text-[24px] font-semibold text-white mb-2">
                  3 个目标已创建
                </Text>
                <Text className="text-sm text-white/60 text-center leading-6 mb-6">
                  这些场景会按你设置的时间自动锁定。
                </Text>
                <Button onPress={() => router.replace('/(tabs)')} text="进入首页" />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Page>
  );
};

export default TargetPage;
