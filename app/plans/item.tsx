import { AppToken } from '@/components/business';
import { Dialog, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useAppStore, usePlanStore } from '@/stores';
import {
  getPlanEndDisplay,
  getRepeatDaysLabel,
  minToTimeStr,
  minutesToHours,
} from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

const TaskArea = ({ plans }: { plans: any[] }) => {
  const { colors, isDark } = useCustomTheme();
  const store = usePlanStore();
  const astore = useAppStore();

  const toRemove = (id: string) => {
    Dialog.confirm({
      title: '操作提示',
      message: '确定删除该契约？',
      buttonReverse: true,
    }).then(action => {
      if (action === 'confirm') {
        if (id) {
          store.removePlan(id);
        } else {
          store.rmOncePlan(id);
        }
      }
    });
  };

  const toEdit = (task: any) => {
    if (store.has_active_task()) {
      Toast('专注进行中，不可以修改契约', 'info');
      return;
    }
    store.setEditingPlan(task);
    router.push('/plans/add');
  };

  if (plans.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center px-10"
        style={{ paddingVertical: 72, minHeight: 320 }}>
        <Icon
          name="hourglass-outline"
          size={50}
          color={colors.text3}
          style={{ marginBottom: 20, opacity: 0.85 }}
        />
        <Text style={{ color: colors.text3, fontSize: 14 }}>暂无契约</Text>
      </View>
    );
  }

  const cardBg = isDark ? '#1E1E2D' : '#F4F4F8';
  const accentColor = colors.primary;
  const pillBg = isDark ? 'rgba(122,90,248,0.15)' : 'rgba(122,90,248,0.1)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <View className="flex-1 px-4 pt-2 pb-4">
      {plans.map((task, index) => {
        const startMin = task.start_min ?? 0;
        const endMin = task.end_min ?? 0;
        const durationMin = Math.max(0, endMin - startMin);
        const startTime = minToTimeStr(startMin);
        const endTime = minToTimeStr(endMin);
        const duration = minutesToHours(durationMin);
        const endDisplay = getPlanEndDisplay(task.repeat, task.end_date);
        const repeatDays = getRepeatDaysLabel(task.repeat);
        const matchedApps = astore.ios_all_apps.filter(app =>
          task.apps?.includes(`${app.stableId}:${app.type}`),
        );

        return (
          <Pressable
            key={task.id}
            onPress={() => toEdit(task)}
            onLongPress={() => toRemove(task.id)}
            style={{
              marginBottom: index < plans.length - 1 ? 14 : 0,
              backgroundColor: cardBg,
              borderRadius: 16,
              overflow: 'hidden',
              flexDirection: 'row',
            }}>
            {/* 左侧色条 */}
            <View
              style={{
                width: 4,
                backgroundColor: accentColor,
                borderTopLeftRadius: 16,
                borderBottomLeftRadius: 16,
              }}
            />

            <View
              style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 16 }}>
              {/* 第一行：名称 */}
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.text,
                }}>
                {task.name || '未命名任务'}
              </Text>

              {/* 第二行：时间段 + 时长标签 */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 10,
                }}>
                <Text style={{ fontSize: 14, color: colors.text2 }}>
                  {startTime} ~ {endTime}
                </Text>
                <View
                  style={{
                    backgroundColor: pillBg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: accentColor,
                    }}>
                    {duration}
                  </Text>
                </View>
              </View>

              {/* 第三行：屏蔽应用（水平滚动） */}
              {matchedApps.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                  contentContainerStyle={{ alignItems: 'center' }}>
                  {matchedApps.map((app, idx) => (
                    <View key={app.id} style={idx > 0 ? { marginLeft: 6 } : {}}>
                      <AppToken app={app} size={22} />
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* 分隔线 */}
              <View
                style={{
                  height: 1,
                  backgroundColor: dividerColor,
                  marginTop: 10,
                  marginBottom: 10,
                }}
              />

              {/* 第四行：左-重复周期 / 右-结束时间 */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  // justifyContent: 'flex-end',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="bulb-outline" size={12} color={colors.text3} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.text3,
                      marginLeft: 4,
                    }}>
                    {repeatDays || '一次性'}，
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* <Icon name={'flag'} size={12} color={colors.text3} /> */}
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.text3,
                      marginLeft: 8,
                    }}>
                    {endDisplay}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

export default TaskArea;
