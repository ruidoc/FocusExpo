import { AppToken } from '@/components/business';
import { Dialog, Flex } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useAppStore, usePlanStore } from '@/stores';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

// 任务区域组件
const TaskArea = ({ plans }: { plans: any[] }) => {
  const { colors } = useCustomTheme();
  const store = usePlanStore();
  const astore = useAppStore();

  // 删除任务
  const toRemove = (id: string) => {
    Dialog.confirm({
      title: '操作提示',
      message: '确定删除该任务？',
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

  // 编辑任务
  const toEdit = (task: any) => {
    store.setEditingPlan(task);
    router.push('/plans/add');
  };

  if (plans.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          padding: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            color: colors.text2,
            fontSize: 14,
            textAlign: 'center',
          }}>
          暂无任务
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      {plans.map((task, index) => (
        <View
          key={task.id}
          style={{ marginBottom: index < plans.length - 1 ? 12 : 0 }}>
          <LinearGradient
            colors={['#5C24FC', '#9D7AFF']}
            start={{ x: -0.0042, y: 0.5 }}
            end={{ x: 1.0751, y: 0.5 }}
            style={{ borderRadius: 15 }}>
            <Pressable
              onPress={() => toEdit(task)}
              onLongPress={() => toRemove(task.id)}
              className="p-3 elevation-2">
              <Text className="text-white text-lg font-bold mb-1">
                {task.name || '未命名任务'}
              </Text>
              <Flex className="mb-1">
                {astore.ios_all_apps
                  .filter(app =>
                    task.apps?.includes(`${app.stableId}:${app.type}`),
                  )
                  .map((app, idx) => (
                    <View key={app.id} style={idx > 0 ? { marginLeft: 6 } : {}}>
                      <AppToken app={app} size={23} />
                    </View>
                  ))}
              </Flex>
              <Text className="text-white text-sm opacity-80 text-right">
                {task.start} ~ {task.end}
              </Text>
            </Pressable>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
};

export default TaskArea;
