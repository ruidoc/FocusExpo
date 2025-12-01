import { Flex, Toast } from '@/components/ui';
import { selectAppsToLimit } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Platform, Text, View } from 'react-native';

interface SelectAppsProps {
  maxCount?: number;
  apps: string[];
  onFinish: (apps: any[]) => void;
}

const SelectApps: React.FC<SelectAppsProps> = ({ maxCount = 0, apps, onFinish }) => {
  if (Platform.OS !== 'ios' || apps.length === 0) {
    return (
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ color: '#666', fontSize: 14 }}>未选择应用</Text>
      </View>
    );
  }

  const selectApps = () => {
    if (Platform.OS !== 'ios') return;
    selectAppsToLimit(maxCount, apps)
      .then(data => {
        if (data.success && data.apps) {
          // 同时存储到AppStore和当前组件状态
          onFinish(data.apps);
        }
      })
      .catch(() => {
        Toast('选择应用失败，请重试');
      });
  }

  return (
    <Flex
      onPress={selectApps}
      className="bg-black/10 px-3 py-2 rounded-2xl gap-1">
      <Icon name="add" size={16} color="#B3B3BA" />
      <Text className="text-[#858699] text-[13px]">选择</Text>
    </Flex>
  );
};

export default SelectApps;
